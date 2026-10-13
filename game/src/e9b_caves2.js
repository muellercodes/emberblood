// ================= Caves, second edition: four Embermere caves rebuilt into real dungeons (e9b_caves2.js)
//   Coppergulch Mine   (mine)     three levels joined by lifts, boom barrels (roll, light, chain), mine carts on rails
//   The Sunken Grotto  (grotto)   currents, floating logs (push, ride, bridge), whirlpools, bubble vents
//   Icefang Cavern     (icefang)  slide-until-you-stop ice, ice blocks, melt and refreeze, falling icicles
//   The Ember Deep     (deep)     lava waves, cooling crystals, magma geysers, heat
// Everything hangs off the room-grid engine (a2f_caves.js) by wrapping its functions: genCaveRooms (the c2 cell
// layer), buildCaveRooms (objects, lifts, bosses), updateCaveRooms (the mechanics), renderCaveRooms / renderCaveMini /
// drawAreaBase (art), areaBlocked (who can stand where), caveBreath / caveSwing / caveRoar / areaObjHit (fire, claws,
// roars and thrown things), caveObjAct / areaObjAct (the E button), updatePlayer (sliding and riding), wWall and
// updateProjectiles (shots fly over water, lava and shafts), eventsForRender / drawAirborneHook (tall things sort with
// Ash) and drawEnemy (the four bosses). Any cave can use these pieces: give its rooms a `lay` layer (letters in C2L)
// and register it with c2Cave(id,map,cfg). CAVES2.md in the scratchpad documents every field.
const C2={ids:{},proj:0,
  // cell types written into cave.typ (the engine uses 0..12; Trials and the dungeon engine may add more below 40)
  T:{abyss:40,water:41,current:42,whirl:43,ice:44,lava:45,low:46,mid:47,spring:48,pad:49}};
// letters that go to the engine template as they are (walls, chest/key spot, page, quest item, sign, decor light,
// brazier, lamp, person); every other letter of a `lay` row is ours and becomes plain floor for the engine
const C2PASS=new Set('#.XGQs*ZLN'.split(''));
// our letters: [cell under it, object kind, option]
const C2L={
  '_':['abyss'], '%':['abyss','rail'], '=':['floor','rail'], '+':['floor','junction'],
  'a':['water'], '^':['current',0], '>':['current',1], 'v':['current',2], '<':['current',3], '@':['whirl'],
  'i':['ice'], '~':['lava'], '-':['low'], ',':['mid'], 'h':['spring'], 'j':['pad'],
  'c':['floor','cart'], 'o':['floor','barrel'], 'x':['floor','rubble'], 'w':['floor','rubble','goal'], 'e':['abyss','lift'],
  'y':['floor','lever'], '?':['floor','sign'], '&':['floor','plate'], '$':['floor','reset'], '1':['floor','coin'], '2':['floor','treat'],
  'O':['floor','chute'], 'A':['floor','spawn'], 'H':['floor','heart'],
  'l':['water','log'], 'm':['floor','log','beach'], 'k':['water','log','sunk'], 'b':['water','vent'], 'p':['water','vent','clog'], 'u':['water','vent','pulse'], 'd':['floor','clam'],
  'U':['water','log','sunk','pulse'], 'P':['water','log','sunk','clog'], 'B':['water','vent','outlet'], 'r':['floor','post'], 'n':['current','log'],
  'K':['floor','block'], 'J':['ice','block'], '!':['floor','icicle'], ';':['ice','icicle'], ':':['water','icicle'],
  'f':['floor','crys'], 'F':['floor','crys','beam'], 'g':['floor','geyser'], 'z':['floor','geyser','launch'], 't':['low','geyser']
};
const C2DIR=[[0,-1],[1,0],[0,1],[-1,0]], C2DN={n:0,e:1,s:2,w:3};
// our puzzle rooms get the puzzle music until they are solved
PUZZLE_KINDS.c2=1;
// little words that float over the bosses when a hit barely hurts
const C2TXT={slip:S('Slippery!','Slippery!'),fluff:S('Too fluffy!','So fluffy!'),hot:S('Too hot to hurt!','Too hot!')};
const C2HAZ={abyss:1,water:1,current:1,whirl:1,melt:1,lava:1};
const C2SAFE={floor:1,ice:1,floe:1,pad:1};
// register a cave: rooms with a `lay` get their engine template made from it
function c2Cave(id,map,cfg){
  for(const k in map.rooms){ const R=map.rooms[k]; if(R.lay&&!R.tpl) R.tpl=R.lay.map(r=>r.split('').map(ch=>C2PASS.has(ch)?ch:'.').join('')); }
  CAVEMAP[id]=map; C2.ids[id]=Object.assign({id},cfg||{});
}
// ---------- cell helpers (only valid inside a c2 cave)
const c2cs=()=>AREA.cave.cell;
function c2K(x,y){ const A=AREA, c=A.cave, i=Math.floor((x-A.x0)/c.cell), j=Math.floor((y-A.y0)/c.cell); if(i<0||j<0||i>=c.w||j>=c.h) return -1; return j*c.w+i; }
function c2X(i){ return AREA.x0+(i+0.5)*AREA.cave.cell; }
function c2Y(j){ return AREA.y0+(j+0.5)*AREA.cave.cell; }
function c2IJ(k){ const w=AREA.cave.w, i=k%w; return [i,(k-i)/w]; }
function c2RoomOf(c,i,j){ for(const id in c.rooms){ const R=c.rooms[id]; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) return R; } return null; }
// what a cell is right now: abyss, water, current, whirl, ice, melt, floe, lava, cool, rock (basalt above the lava), spring, pad or floor
function c2Kind(k){
  const A=AREA, c=A.cave, Z=A.c2; if(k<0||k>=c.typ.length) return 'wall'; if(c.grid[k]===1) return 'wall';
  const t=c.typ[k], s=Z?Z.st[k]:0;
  switch(t){
    case 40: return 'abyss';
    case 41: return s===3?'ice':s===4?'floe':'water';
    case 42: return 'current';
    case 43: return 'whirl';
    case 44: return s===2?'melt':'ice';
    case 45: return s===1?'cool':'lava';
    case 46: return s===1?'cool':c2Flood(k)>=1?'lava':'rock';
    case 47: return s===1?'cool':c2Flood(k)>=2?'lava':'rock';
    case 48: return 'spring';
    case 49: return 'pad';
    default: return s===2?'melt':'floor';
  }
}
const c2Wet=kd=>kd==='water'||kd==='current'||kd==='whirl'||kd==='melt';
// a platform Ash can stand on over water or a shaft (a log, a lift cage that is here)
function c2Plat(k){ const Z=AREA.c2; return !!(Z&&Z.plat.get(k)); }
// solid things on a cell (barrels, carts, rubble, ice blocks, crystals, levers)
function c2Solid(k){ const Z=AREA.c2; return !!(Z&&Z.occ.get(k)); }
// can a pushed or rolling thing enter cell k? (gates, walls, solid things, Ash standing there)
function c2Free(k,o){
  const A=AREA, c=A.cave; if(k<0||c.grid[k]===1) return false;
  if(c.dyn&&caveBlockedAt(k)) return false;
  const q=A.c2.occ.get(k); if(q&&q!==o) return false; if(A.c2.solidK.has(k)) return false;
  const [i,j]=c2IJ(k), cs=c.cell, x=c2X(i), y=c2Y(j), p=player;
  if(p&&!p.dead&&Math.abs(p.x-x)<cs*0.5+p.r*0.7&&Math.abs(p.y-y)<cs*0.5+p.r*0.7&&!airborne()) return false;
  return true;
}

// ---------- the c2 layer: cells and object marks (runs right after the engine made the grid)
{ const base=genCaveRooms; genCaveRooms=function(def){ const c=base(def); if(C2.ids[def.id]) c2Parse(def,c); return c; }; }
function c2Parse(def,c){
  const n=c.w*c.h, Z={rail:new Uint8Array(n),flow:new Int8Array(n).fill(-1),door:new Uint8Array(n),marks:[]};
  // door cells (2) and the floor right next to them (1) stay plain floor so no door is ever blocked
  for(const L of c.links) for(const k of L.cells){ Z.door[k]=2; const i=k%c.w, j=(k-i)/c.w; for(const [dx,dy] of L.vertical?[[0,-1],[0,1]]:[[-1,0],[1,0]]){ const q=(j+dy)*c.w+i+dx; if(!Z.door[q]) Z.door[q]=1; } }
  { const S=c.start, ej=S.oy+S.sh*RSY; for(let i=S.ox+7;i<=S.ox+9;i++){ Z.door[ej*c.w+i]=2; if(!Z.door[(ej-1)*c.w+i]) Z.door[(ej-1)*c.w+i]=1; } }
  for(const id in c.rooms){ const R=c.rooms[id]; if(!R.lay) continue;
    for(let r=0;r<R.ih;r++) for(let col=0;col<R.iw;col++){
      const ch=(R.lay[r]&&R.lay[r][col])||'.'; if(C2PASS.has(ch)) continue;
      const L=C2L[ch]; if(!L) continue;
      const i=R.ox+1+col, j=R.oy+1+r, k=j*c.w+i, cell=L[0], ob=L[1];
      // keep door lanes clear: only rails may sit there
      if(Z.door[k]){ if((ob==='rail'||ob==='junction')&&cell==='floor') Z.rail[k]=ob==='junction'?3:1; continue; }
      if(cell!=='floor'){ c.typ[k]=C2.T[cell]; c.grid[k]=0; }
      if(cell==='current'&&typeof ob==='number') Z.flow[k]=ob;
      if(ob==='rail') Z.rail[k]=1; else if(ob==='junction') Z.rail[k]=3; else if(ob==='cart') Z.rail[k]=1;
      if(typeof ob==='string'&&ob!=='rail'&&ob!=='junction') Z.marks.push({room:id,ch,i,j,c:col,r,kind:ob,opt:L[2]||null,opt2:L[3]||null});
    }
  }
  // current cells under logs take the flow of the current next to them
  for(let pass=0;pass<4;pass++) for(let k=0;k<n;k++){ if(c.typ[k]!==C2.T.current||Z.flow[k]>=0) continue; for(let d=0;d<4;d++){ const q=k+C2DIR[d][0]+C2DIR[d][1]*c.w; if(q>=0&&q<n&&c.typ[q]===C2.T.current&&Z.flow[q]>=0){ Z.flow[k]=Z.flow[q]; break; } } }
  // a rail runs through a door when the cells on both sides of it have one
  for(const L of c.links) for(const k of L.cells){ const i=k%c.w, j=(k-i)/c.w, [dx,dy]=L.vertical?[0,1]:[1,0]; if(Z.rail[(j-dy)*c.w+i-dx]&&Z.rail[(j+dy)*c.w+i+dx]) Z.rail[k]=1; }
  c.c2=Z;
}
// ---------- old saves: the new layouts use new keys, and a few per-cave counters start fresh
function c2Migrate(def){
  const id=def.id, v='c2v_'+id; if(G.found[v]) return;
  G.found[v]=1; G.found['keys_'+id]=0; G.found['crys_'+id]=0;
  c2CleanSecrets();
}
// secret tallies of rooms that no longer exist (old layouts) would count twice
function c2CleanSecrets(){
  if(!G||!G.secrets) return;
  for(const k of Object.keys(G.secrets)){ if(!k.startsWith('cs_')) continue; for(const id in C2.ids){ if(k.startsWith('cs_'+id+'_')){ const room=k.slice(4+id.length); if(!(CAVEMAP[id]&&CAVEMAP[id].rooms[room])) delete G.secrets[k]; } } }
}
{ const base=loadGame; loadGame=function(s){ base(s); try{ c2CleanSecrets(); }catch(e){} }; }

// ---------- building the live cave
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ if(C2.ids[def.id]) c2Migrate(def); base(A,def); if(C2.ids[def.id]) c2Build(A,def); }; }
function c2Build(A,def){
  const c=A.cave, P=c.c2, n=c.w*c.h, cfg=C2.ids[def.id];
  const Z=A.c2={id:def.id,cfg,t:0,st:new Uint8Array(n),tm:new Float32Array(n),occ:new Map(),plat:new Map(),list:[],lifts:{},carts:[],barrels:[],logs:[],vents:[],blocks:[],icicles:[],crys:[],geysers:[],levers:[],rubble:[],plates:[],chutes:[],clams:[],
    rail:P.rail,flow:P.flow,door:P.door,safe:null,entry:null,room:null,lock:null,slide:null,heat:0,pushT:0,pushO:null,hurtT:0,boss:null,dirty:0,
    typ0:c.typ.slice(),solidK:new Set()};
  if(cfg.dark!=null){ A.dark=cfg.dark; }
  // doors: the new layout keeps its own keys (c2_<cave>_link<i>) so old saves cannot open the wrong door
  for(const o of A.gates){ if(o.k!=='cgate'||!o.id||!o.id.startsWith('cv_'+def.id+'_link')) continue; o.id='c2_'+def.id+'_link'+o.link.i; o.opened=!!G.found[o.id]; }
  const byRoom={}; for(const m of P.marks) (byRoom[m.room]=byRoom[m.room]||[]).push(m);
  for(const rid in c.rooms){ const R=c.rooms[rid], ms=byRoom[rid]||[]; let lv=0, sg=0;
    for(const m of ms){ c2Make(A,def,R,m,lv,sg); if(m.kind==='lever') lv++; if(m.kind==='sign') sg++; }
  }
  // a quest item already handed in (its quest is past that step) never turns up again
  for(const o of A.objs) if(o.k==='qitem'&&!G.found[o.id]&&c2ItemDone(o.item)) G.found[o.id]=true;
  // signs and chests stand in the way of slides, blocks and barrels
  for(const o of A.objs) if(o.k==='csign'||o.k==='cchest'){ const k=c2K(o.x,o.y); if(k>=0&&!P.door[k]) Z.solidK.add(k); }
  for(const L of (cfg.lifts||[])) c2LiftMake(A,def,L);
  for(const rid in c.rooms){ const R=c.rooms[rid]; if(R.boss2&&!R.solved) c2BossSpawn(A,def,R); }
  for(const f of C2POST) f(A,def);
  c2Lights(A);
  if(typeof cfg.build==='function') cfg.build(A,def);
  refreshCaveGates();
}
const C2POST=[];
function c2ItemDone(item){ for(const id in (G.quests||{})){ const q=G.quests[id], d=QDEFS[id]; if(!q||!d||!d.steps) continue; const si=d.steps.findIndex(s=>s.t==='item'&&s.item===item); if(si>=0&&(q.done||q.step>si)) return true; } return false; }
function c2Obj(A,R,m,kind,extra){
  const o=Object.assign({k:'c2',kind,id:`c2_${A.def.id}_${R.id}_${m.ch}${m.c}_${m.r}`,room:R.id,ci:m.i,cj:m.j,hi:m.i,hj:m.j,x:c2X(m.i),y:c2Y(m.j),r:20},extra||{});
  A.objs.push(o); A.c2.list.push(o); return o;
}
function c2Make(A,def,R,m,lv,sg){
  const Z=A.c2, k=m.j*A.cave.w+m.i;
  switch(m.kind){
    case 'barrel':{ const o=c2Obj(A,R,m,'barrel',{solid:1,tall:1,lit:0,fuse:0,mv:null,gone:0}); Z.occ.set(k,o); Z.barrels.push(o); return o; }
    case 'cart':{ const o=c2Obj(A,R,m,'cart',{solid:1,tall:1,mv:null,dir:(R.cartDir!=null?C2DN[R.cartDir]:-1),cargo:null,rider:0,hit:new Set(),r:22}); o.prompt=()=>c2CartPrompt(o); Z.occ.set(k,o); Z.carts.push(o); return o; }
    case 'rubble':{ if(G.found[`c2_${def.id}_${R.id}_${m.ch}${m.c}_${m.r}`]) return null; const o=c2Obj(A,R,m,'rubble',{solid:1,tall:1,goal:m.opt==='goal',seed:(m.i*7+m.j*13)%5}); Z.occ.set(k,o); Z.rubble.push(o); return o; }
    case 'lever':{ const o=c2Obj(A,R,m,'lever',{solid:1,tall:1,on:false,n:lv,role:((R.levers||[])[lv])||{}}); o.prompt=()=>c2LeverPrompt(o); Z.occ.set(k,o); Z.levers.push(o); return o; }
    case 'sign':{ const t=(R.signs||[])[sg]||''; const o={k:'csign',x:c2X(m.i),y:c2Y(m.j),id:`c2_${def.id}_sign_${R.id}_${sg}`,text:t,r:12}; A.objs.push(o); addAreaCol({t:'c',x:o.x,y:o.y,r:10}); return o; }
    case 'plate':{ const o=c2Obj(A,R,m,'plate',{pressed:false}); Z.plates.push(o); return o; }
    case 'reset':{ const o=c2Obj(A,R,m,'reset',{solid:1,tall:1,r:16}); o.prompt=()=>S('Touch the rune stone (put this room back)','Touch the stone (start over)'); Z.occ.set(k,o); return o; }
    case 'coin':{ const id=`c2_${def.id}_${R.id}_c${m.c}_${m.r}`; if(!G.found[id]) A.objs.push({k:'coinpile',x:c2X(m.i),y:c2Y(m.j),id,n:6+def.level*2}); return null; }
    case 'treat':{ const id=`c2_${def.id}_${R.id}_t${m.c}_${m.r}`; if(!G.found[id]) A.objs.push({k:'treatpick',x:c2X(m.i),y:c2Y(m.j),id}); return null; }
    case 'chute':{ const o=c2Obj(A,R,m,'chute',{t:2+Math.random()*2}); Z.chutes.push(o); return o; }
    case 'spawn': return null;
    case 'heart':{ const o=c2Obj(A,R,m,'heart',{solid:1,tall:1,r:26}); o.prompt=()=>G.found[`c2_${def.id}_heart`]?null:S('Open the great chest','Open the big chest'); Z.occ.set(k,o); return o; }
  }
  return typeof C2MAKE[m.kind]==='function'?C2MAKE[m.kind](A,def,R,m,k):null;
}
// cave-specific makers (logs, vents, blocks, icicles, crystals, geysers...) register here
const C2MAKE={};

// ---------- who can stand where. Solid things block everyone (and shots). Shafts, water and lava block walkers and
// shots fly over them; Ash passes over them in the air, on a platform (log, lift cage) or while riding.
{ const base=areaBlocked; areaBlocked=function(x,y){ if(base(x,y)) return true; const A=AREA; if(!A||!A.c2) return false; return c2Blocked(x,y); }; }
function c2Blocked(x,y){
  const k=c2K(x,y); if(k<0) return true;
  const Z=AREA.c2, p=player, own=!!p&&(x===p.x||y===p.y);
  if(Z.occ.get(k)) return !(own&&Z.lock&&Z.lock.o===Z.occ.get(k));
  if(C2.proj) return false;
  if(Z.solidK.has(k)&&!(own&&airborne())) return true;
  const kd=c2Kind(k);
  if(kd==='floor'||kd==='ice'||kd==='floe'||kd==='pad'||kd==='rock'||kd==='cool') return false;
  if(own){ if(Z.lock) return false; if(Z.plat.get(k)) return false; if(airborne()) return false; if(kd==='spring'&&canWalkWater()) return false; }
  return true;
}
// shots fly over shafts, water and lava (only solid things and walls stop them)
{ const base=wWall; wWall=function(x,y){ C2.proj++; try{ return base(x,y); } finally{ C2.proj--; } }; }
{ const base=updateProjectiles; updateProjectiles=function(dt){ C2.proj++; try{ return base(dt); } finally{ C2.proj--; } }; }

// ---------- Ash: riding (carts, lifts, geyser launches) and sliding on ice take over his legs
{ const base=updatePlayer; updatePlayer=function(dt,inp){
  const A=AREA, Z=A&&A.c2; if(!Z||!player||player.dead) return base(dt,inp);
  Z.inMx=inp.mx; Z.inMy=inp.my;
  if(Z.lock){ const ride=Z.lock.kind==='cart'; const q=Object.assign({},inp,{mx:0,my:0,jump:false,jumpHeld:false,sprint:false,roll:false,fire:ride&&inp.fire,attack:ride&&inp.attack}); G.dashBuf=0; base(dt,q); c2LockPost(dt); return; }
  const k=c2K(player.x,player.y), onIce=!airborne()&&c2Kind(k)==='ice'&&!Z.plat.get(k);
  // no hopping out of a slide (that would skip the whole puzzle); a jump on the spot is fine
  if(Z.slide||onIce){ const q=Object.assign({},inp,{mx:0,my:0,sprint:false,roll:false}); if(Z.slide){ q.jump=false; q.jumpHeld=false; } G.dashBuf=0; base(dt,q); c2SlidePost(dt,inp); return; }
  base(dt,inp);
}; }
function c2LockPost(dt){
  const Z=AREA.c2, L=Z.lock, p=player; p.kvx=p.kvy=0; p.avx=p.avy=0;
  if(L.kind==='cart'){ const o=L.o; p.x=o.x; p.y=o.y-3; if(o.mv) p.facing=Math.atan2(C2DIR[o.mv.d][1],C2DIR[o.mv.d][0]); }
  else if(L.kind==='lift'){ p.x=L.x; p.y=L.y; }
  else if(L.kind==='launch'){ L.t+=dt; const k=clamp(L.t/L.dur,0,1); p.x=lerp(L.x0,L.x1,k); p.y=lerp(L.y0,L.y1,k); p.z=Math.sin(Math.PI*k)*L.h; if(k>=1){ p.z=0; Z.lock=null; mvSnd('land',1.2); shake(3); emit(p.x,p.y+4,14,{col:'150,130,110',glow:false,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:8}); } }
}
// ice: Ash slides in a straight line until something stops him (a wall, a block, a rock, plain floor or the edge of water)
function c2SlideOpen(k){
  const A=AREA, c=A.cave; if(k<0||c.grid[k]===1) return false; if(c.dyn&&caveBlockedAt(k)) return false; if(A.c2.occ.get(k)||A.c2.solidK.has(k)) return false;
  const kd=c2Kind(k); if(kd==='floor'||kd==='ice'||kd==='floe'||kd==='pad'||kd==='rock'||kd==='cool') return true;
  if(A.c2.plat.get(k)) return true;
  if(kd==='spring') return canWalkWater()||airborne();
  return airborne();
}
function c2SlidePost(dt,inp){
  const A=AREA, Z=A.c2, p=player, cs=A.cave.cell, w=A.cave.w;
  let s=Z.slide;
  const k0=c2K(p.x,p.y); if(k0<0){ Z.slide=null; return; }
  const [i0,j0]=c2IJ(k0), cx0=c2X(i0), cy0=c2Y(j0);
  if(!s){
    if(airborne()) return;
    const mx=inp.mx, my=inp.my; if(Math.hypot(mx,my)<0.5) return;
    const d=Math.abs(mx)>Math.abs(my)?(mx>0?1:3):(my>0?2:0);
    p.facing=Math.atan2(C2DIR[d][1],C2DIR[d][0]);
    if(!c2SlideOpen((j0+C2DIR[d][1])*w+i0+C2DIR[d][0])) return;
    s=Z.slide={d,sp:90}; SFX.play('roll',0.4);
  }
  const [dx,dy]=C2DIR[s.d]; s.sp=Math.min(340,s.sp+dt*2200);
  if(dx) p.y+=(cy0-p.y)*Math.min(1,dt*16); else p.x+=(cx0-p.x)*Math.min(1,dt*16);
  const nx=p.x+dx*s.sp*dt, ny=p.y+dy*s.sp*dt, kd0=c2Kind(k0);
  const past=dx?(nx-cx0)*dx>=0:(ny-cy0)*dy>=0;
  const open=c2SlideOpen((j0+dy)*w+i0+dx);
  if(past&&(!open||(kd0!=='ice'&&!airborne()))){
    if(dx) p.x=cx0; else p.y=cy0;
    Z.slide=null; if(!open){ SFX.play('block',0.4); shake(1); emit(p.x+dx*16,p.y+dy*16,5,{col:'220,240,255',glow:false,smin:20,smax:70,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); }
    return;
  }
  p.x=nx; p.y=ny; p.facing=Math.atan2(dy,dx); p.moving=true;
  if(Math.random()<dt*20) emit(p.x-dx*10,p.y-dy*10+6,1,{col:'230,245,255',glow:false,ang:Math.atan2(-dy,-dx),spread:0.6,smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.5,zmax:3});
}

// ---------- the per-frame update
{ const base=updateCaveRooms; updateCaveRooms=function(dt){ base(dt); const A=AREA; if(A&&A.c2) c2Update(dt); }; }
function c2Update(dt){
  const A=AREA, Z=A.c2, p=player; Z.t+=dt;
  // room changes: a safe spot just inside the door, banners
  const R=caveRoomAt(p.x,p.y);
  if(R&&R!==Z.room){ Z.room=R; if(!airborne()&&!Z.lock&&C2SAFE[c2Kind(c2K(p.x,p.y))]) Z.entry={x:p.x,y:p.y}; c2OnRoom(R); }
  c2Cells(dt);
  for(const o of Z.list){ const f=C2UPD[o.kind]; if(f) f(o,dt); }
  for(const id in Z.lifts) c2LiftUpdate(Z.lifts[id],dt);
  c2Pushing(dt);
  c2AshCells(dt);
  c2FoeCells(dt);
  if(Z.cfg.heat) c2Heat(dt);
  c2Goals();
  c2BossTick(dt);
  if(typeof Z.cfg.update==='function') Z.cfg.update(A,dt);
}
const C2UPD={}, C2PUSH={}, C2DRAW={}, C2TALL={}, C2ACT={};
// cell timers: cooled lava, meltwater
function c2Cells(dt){
  const A=AREA, Z=A.c2, c=A.cave;
  if(!Z.timed) Z.timed=new Set();
  for(const k of Z.timed){
    Z.tm[k]-=dt; if(Z.tm[k]>0) continue;
    const s=Z.st[k]; Z.timed.delete(k); Z.tm[k]=0;
    if(s===1){ Z.st[k]=0; const [i,j]=c2IJ(k); emit(c2X(i),c2Y(j),6,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:20,smax:60,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:4}); }
    else if(s===2){ Z.st[k]=0; if(c.typ[k]===0||c.typ[k]===41) c.typ[k]=C2.T.ice; const [i,j]=c2IJ(k); emit(c2X(i),c2Y(j),8,{col:'230,245,255',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); SFX.play('block',0.3); }
  }
}
function c2SetTimed(k,st,t){ const Z=AREA.c2; Z.st[k]=st; Z.tm[k]=t; if(!Z.timed) Z.timed=new Set(); Z.timed.add(k); }
// Ash on a cell he cannot stand on: shafts drop him, water and lava throw him back to the last safe spot
function c2AshCells(dt){
  const A=AREA, Z=A.c2, p=player; if(p.dead||scene!=='play'||Z.lock||airborne()) return;
  const k=c2K(p.x,p.y), kd=c2Kind(k);
  if(Z.plat.get(k)) return;
  if(C2HAZ[kd]||(kd==='spring'&&!canWalkWater())) return c2Hazard(kd);
  if(C2SAFE[kd]&&!Z.slide) Z.safe={x:p.x,y:p.y};
}
function c2SafeOK(s){ if(!s) return false; const k=c2K(s.x,s.y); return k>=0&&C2SAFE[c2Kind(k)]&&!AREA.c2.occ.get(k)&&!AREA.c2.plat.get(k)&&!(AREA.cave.dyn&&caveBlockedAt(k)); }
function c2SafeSpot(){
  const A=AREA, Z=A.c2, p=player;
  if(c2SafeOK(Z.safe)) return Z.safe; if(c2SafeOK(Z.entry)) return Z.entry;
  const k0=c2K(p.x,p.y), [i0,j0]=c2IJ(Math.max(0,k0));
  for(let r=1;r<10;r++) for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ if(Math.max(Math.abs(di),Math.abs(dj))!==r) continue; const x=c2X(i0+di), y=c2Y(j0+dj); if(c2SafeOK({x,y})&&caveRoomAt(x,y)) return {x,y}; }
  return A.spawn;
}
function c2Hazard(kd){
  const A=AREA, Z=A.c2, p=player, x=p.x, y=p.y;
  let dmg=0;
  if(kd==='abyss'){ dmg=0.1; emit(x,y,18,{col:'70,58,48',glow:false,smin:20,smax:90,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:4}); SFX.play('roll'); shake(3); ftext(x,y-28,pick([S('Whoops!','Oops!'),S('Down you go!','Down!'),S('Not that way!','Not there!')]),'#ffd9a0',14); }
  else if(kd==='lava'){ dmg=0.15; mvSnd('sizzle'); emit(x,y,30,{kind:'fire',smin:60,smax:220,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:8,drag:3}); ftext(x,y-28,S('Too hot!','Hot!'),'#ffb070',14); }
  else { mvSnd('splash'); for(let i=0;i<3;i++) G.ripples.push({x:x+rand(-6,6),y:y+rand(-4,4),t:0,max:0.7+i*0.25,r:16+i*10,splash:true}); emit(x,y,22,{col:'215,232,245',glow:false,ang:-Math.PI/2,spread:1.3,smin:60,smax:200,lmin:.3,lmax:.7,zmin:1.5,zmax:3.5,drag:2,rise:-160}); ftext(x,y-26,kd==='whirl'?S('Glug! The whirlpool spits you out!','Glug! Spat out!'):S('Splash!','Splash!'),'#bfe6ff',14); }
  const s=c2SafeSpot(); p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; p.avx=p.avy=0; p.dashT=0; Z.slide=null;
  if(kd==='abyss'){ G.fade=0.8; updateCam(0,true); }
  if(dmg&&!(window.__eb&&window.__eb.god)){ const d=Math.ceil(p.maxHp*dmg*Math.min(1,(G.diff&&G.diff.dmg)||1)); p.hp-=d; p.lastHurt=G.time; G.hurtVig=0.5; p.hurtFlash=0.12; if(settings.nums) ftext(p.x,p.y-22,'-'+d,'#ff6a5a',15); if(p.hp<=0){ p.hp=0; playerDied(); return; } }
  p.iframes=Math.max(p.iframes,1.0);
}
// walkers caught on lava take burns and scramble off; anything knocked into a shaft is gone
function c2FoeCells(dt){
  const A=AREA, Z=A.c2;
  for(const e of G.enemies){
    if(e.dead||!e.inArea||e.flying||e.noClip) continue;
    const k=c2K(e.x,e.y), kd=c2Kind(k);
    if(kd==='lava'&&!e.lavaProof){ e.burnT=Math.max(e.burnT,1); e.burnDps=Math.max(e.burnDps,e.maxHp*0.12); const s=c2NearFloor(k); if(s){ e.x+=(s.x-e.x)*Math.min(1,dt*6); e.y+=(s.y-e.y)*Math.min(1,dt*6); } }
    else if((kd==='abyss'||c2Wet(kd))&&!Z.plat.get(k)&&!e.boss&&!e.c2boss&&Math.hypot(e.vx,e.vy)>120){ emit(e.x,e.y,14,{col:kd==='abyss'?'70,58,48':'180,220,255',glow:false,smin:20,smax:80,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:4}); ftext(e.x,e.y-20,S('Byeee!','Bye!'),'#ffe0a0',12); killEnemy(e); }
  }
}
function c2NearFloor(k){ const [i0,j0]=c2IJ(k); for(let r=1;r<4;r++) for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ const x=c2X(i0+di), y=c2Y(j0+dj), q=c2K(x,y); if(q>=0&&(C2SAFE[c2Kind(q)]||c2Kind(q)==='rock')&&!AREA.c2.occ.get(q)) return {x,y}; } return null; }

// ---------- pushing: walk into a barrel, block, cart or log for a moment and it goes
function c2Pushing(dt){
  const A=AREA, Z=A.c2, p=player, cs=A.cave.cell;
  const mx=Z.inMx||0, my=Z.inMy||0;
  if(Z.lock||airborne()||Math.hypot(mx,my)<0.5||p.dashT>0||p.drinkT>0||scene!=='play'){ Z.pushT=0; Z.pushO=null; return; }
  const d=Math.abs(mx)>Math.abs(my)?(mx>0?1:3):(my>0?2:0), [dx,dy]=C2DIR[d];
  const k=c2K(p.x+dx*(p.r+9),p.y+dy*(p.r+9)); if(k<0){ Z.pushT=0; return; }
  const under=Z.plat.get(c2K(p.x,p.y));
  let o=Z.occ.get(k); if(!o){ const q=Z.plat.get(k); if(q&&q.kind==='log'&&q!==under) o=q; }
  if(!o||!C2PUSH[o.kind]||o.mv){ Z.pushT=0; Z.pushO=null; return; }
  const [oi,oj]=c2IJ(k), ox=c2X(oi), oy=c2Y(oj);
  if((dx&&Math.abs(p.y-oy)>cs*0.44)||(dy&&Math.abs(p.x-ox)>cs*0.44)){ Z.pushT=0; return; }
  if(Z.pushO!==o||Z.pushD!==d){ Z.pushO=o; Z.pushD=d; Z.pushT=0; }
  Z.pushT+=dt; o.pushK=Z.pushT/0.22;
  if(Z.pushT>=0.22){ Z.pushT=0; o.pushK=0; C2PUSH[o.kind](o,d); }
}
// a thing slides from its cell to the next one (o.mv); returns true on the frame it arrives
function c2Go(o,d,spd){
  const Z=AREA.c2, w=AREA.cave.w, k0=o.cj*w+o.ci, [dx,dy]=C2DIR[d];
  if(o.solid&&Z.occ.get(k0)===o) Z.occ.delete(k0);
  o.ci+=dx; o.cj+=dy; if(o.solid) Z.occ.set(o.cj*w+o.ci,o);
  o.mv={d,spd,f:0,fx:o.x,fy:o.y};
}
function c2Step(o,dt){
  const m=o.mv; if(!m) return false; m.f+=m.spd*dt/AREA.cave.cell;
  const tx=c2X(o.ci), ty=c2Y(o.cj);
  if(m.f>=1){ o.x=tx; o.y=ty; o.mv=null; return m; }
  o.x=lerp(m.fx,tx,m.f); o.y=lerp(m.fy,ty,m.f); return false;
}
const c2Nb=(o,d)=>(o.cj+C2DIR[d][1])*AREA.cave.w+o.ci+C2DIR[d][0];

// ================= Coppergulch Mine pieces: boom barrels, rubble, carts on rails, lifts, levers
// ---------- boom barrels: push one and it rolls until it bumps into something; fire lights a 3 second fuse;
// the blast breaks rubble and cracked walls next to it and lights every barrel up to 3 cells away (chains)
const C2FUSE=3, C2CHAIN=3;
C2PUSH.barrel=(o,d)=>{ if(o.cargoOf||o.onLift||o.gone) return; if(c2BarrelInto(o,d)) SFX.play('roll',0.7); else SFX.play('block',0.4); };
// can the barrel roll one cell in direction d? starts the move and returns true
function c2BarrelInto(o,d){
  const A=AREA, Z=A.c2, k=c2Nb(o,d);
  if(k<0||A.cave.grid[k]===1||(A.cave.dyn&&caveBlockedAt(k))) return false;
  const q=Z.occ.get(k);
  if(q){ if(q.kind==='cart'&&!q.cargo&&!q.mv&&!q.rider){ o.loading=q; Z.occ.delete(o.cj*A.cave.w+o.ci); o.solid=0; c2Go(o,d,300); o.solid=1; return true; } return false; }
  if(!c2Free(k,o)) return false;
  const kd=c2Kind(k);
  if(!(kd==='floor'||kd==='ice'||kd==='floe'||kd==='pad'||kd==='rock'||kd==='cool'||Z.rail[k]||Z.plat.get(k)||C2HAZ[kd])) return false;
  o.rollD=d; c2Go(o,d,300); return true;
}
C2UPD.barrel=(o,dt)=>{
  const A=AREA, Z=A.c2;
  if(o.gone>0){ o.gone-=dt; if(o.gone<=0) c2BarrelHome(o); return; }
  if(o.lit){ o.fuse-=dt; if(Math.random()<dt*30) emit(o.x+8,o.y-26,1,{kind:'fire',ang:-Math.PI/2,spread:0.9,smin:30,smax:90,lmin:.15,lmax:.3,zmin:1,zmax:2.5,drag:2}); if(o.fuse<=0){ c2Explode(o); return; } }
  if(o.cargoOf){ o.x=o.cargoOf.x; o.y=o.cargoOf.y-8; return; }
  if(o.onLift) return;
  const m=c2Step(o,dt); if(!m) return;
  const k=o.cj*A.cave.w+o.ci, kd=c2Kind(k);
  if(o.loading){ const cart=o.loading; o.loading=null; Z.occ.set(k,cart); cart.cargo=o; o.cargoOf=cart; SFX.play('block',0.6); setBanner(S('Loaded!','In the cart!'),S('The barrel rides in the cart now.','The barrel is in the cart.'),1.4); return; }
  // onto a lift cage: its gate catches the barrel
  const pl=Z.plat.get(k); if(pl&&pl.kind==='station'){ o.rollD=null; return; }
  if(!Z.rail[k]&&!pl){
    if(kd==='lava'){ c2Explode(o); return; }
    if(kd==='abyss'||c2Wet(kd)){ c2BarrelLost(o,kd); return; }
  }
  if(o.rollD!=null&&!c2BarrelInto(o,o.rollD)){ o.rollD=null; SFX.play('block',0.35); shake(1); }
};
function c2BarrelLost(o,kd){
  const Z=AREA.c2; Z.occ.delete(o.cj*AREA.cave.w+o.ci);
  if(kd==='abyss'){ emit(o.x,o.y,10,{col:'120,80,40',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:2,zmax:4}); ftext(o.x,o.y-20,S('Bye, barrel!','Bye, barrel!'),'#ffe0a0',12); }
  else { G.ripples.push({x:o.x,y:o.y,t:0,max:0.9,r:22,splash:true}); mvSnd('splash',0.6); }
  o.gone=4; o.lit=0; o.fuse=0; o.mv=null; o.rollD=null;
}
// a new barrel rolls out where the old one stood
function c2BarrelHome(o){
  const A=AREA, Z=A.c2, k=o.hj*A.cave.w+o.hi;
  if(!c2Free(k,o)||Z.plat.get(k)){ o.gone=1; return; }
  o.gone=0; o.ci=o.hi; o.cj=o.hj; o.x=c2X(o.ci); o.y=c2Y(o.cj); o.lit=0; o.fuse=0; o.mv=null; o.rollD=null; o.cargoOf=null; o.onLift=null; o.solid=1; Z.occ.set(k,o);
  emit(o.x,o.y,10,{col:'200,170,130',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); SFX.play('pop',0.5);
}
function c2Light(o,fuse){ if(o.gone||o.lit) { if(o.lit&&fuse!=null&&fuse<o.fuse) o.fuse=fuse; return; } o.lit=1; o.fuse=fuse!=null?fuse:C2FUSE; SFX.play('cast',0.6); if(fuse==null) ftext(o.x,o.y-34,S('Fuse lit! Run!','Run!'),'#ffd27a',13); }
function c2Explode(o){
  const A=AREA, Z=A.c2, cs=A.cave.cell, x=o.x, y=o.y, k=c2K(x,y), [ci,cj]=c2IJ(Math.max(0,k)), lvl=A.level||1;
  // the barrel is gone (a new one turns up at its home in a few seconds)
  if(o.cargoOf){ o.cargoOf.cargo=null; o.cargoOf=null; } else if(Z.occ.get(o.cj*A.cave.w+o.ci)===o) Z.occ.delete(o.cj*A.cave.w+o.ci);
  if(o.onLift){ const L=o.onLift; L.cargo=(L.cargo||[]).filter(q=>q!==o); o.onLift=null; }
  o.gone=4; o.lit=0; o.fuse=0; o.mv=null; o.rollD=null; o.loading=null;
  SFX.play('boom'); shake(9); hitstop=Math.max(hitstop,0.04); flashA=Math.max(flashA,0.25); flashCol='255,200,120';
  emit(x,y,46,{kind:'fire',smin:80,smax:340,lmin:.3,lmax:.75,zmin:4,zmax:10,grow:12,drag:2});
  emit(x,y,22,{col:'70,60,55',glow:false,ang:-Math.PI/2,spread:1.4,smin:30,smax:120,lmin:.8,lmax:1.5,zmin:6,zmax:12,grow:14,drag:1});
  emit(x,y,16,{col:'150,110,70',glow:false,smin:120,smax:320,lmin:.3,lmax:.6,zmin:2,zmax:4});
  G.ripples.push({x,y,t:0,max:0.5,r:cs*1.8,splash:true}); scorch(x,y,cs*0.9);
  // rubble and cracked walls right next to it
  for(const r of Z.rubble) if(!r.dead&&Math.max(Math.abs(r.ci-ci),Math.abs(r.cj-cj))<=1) c2RubbleBreak(r);
  for(const g of A.gates) if(g.k==='cgate'&&g.type==='crack'&&!g.opened&&Math.abs(g.x-x)<cs*1.7&&Math.abs(g.y-y)<cs*1.7) breakCrack(g);
  // the chain
  for(const b of Z.barrels){ if(b===o||b.gone) continue; const kb=c2K(b.x,b.y); if(kb<0) continue; const [bi,bj]=c2IJ(kb); if(Math.max(Math.abs(bi-ci),Math.abs(bj-cj))<=C2CHAIN) c2Light(b,0.32+Math.random()*0.08); }
  for(const q of Z.list){ const f=C2BLAST[q.kind]; if(f&&q!==o) f(q,ci,cj,x,y); }
  for(const q of A.objs) if(q.breakable&&!q.broken&&dist(q.x,q.y,x,y)<cs*1.6){ q.broken=true; emit(q.x,q.y,10,{col:'120,80,40',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4}); if(Math.random()<0.6) dropCoins(q.x,q.y,randi(1,3)); }
  // creatures
  for(const e of G.enemies){ if(e.dead||!e.inArea) continue; const d=dist(e.x,e.y,x,y); if(d>cs*2+e.r) continue;
    if(e.c2boss&&C2BOSSBLAST[e.type]){ C2BOSSBLAST[e.type](e,x,y); continue; }
    const iv=e.invuln; e.invuln=false; damageEnemy(e,(30+10*lvl)*(d<cs?1:0.6),{src:'blast',kb:420,ka:angTo(x,y,e.x,e.y)}); e.invuln=iv; if(!e.dead) stunEnemy(e,1.2); }
  const p=player; if(!p.dead&&dist(p.x,p.y,x,y)<cs*1.7&&!airborne()){ hurtPlayer(p.maxHp*0.12/Math.max(0.01,(G.diff&&G.diff.dmg)||1)/((p.stats&&p.stats.armor)||1),x,y,380); }
  Z.dirty=1;
}
const C2BLAST={}, C2BOSSBLAST={};
function c2RubbleBreak(r){
  const A=AREA, Z=A.c2; if(r.dead) return; r.dead=1; G.found[r.id]=true;
  Z.occ.delete(r.cj*A.cave.w+r.ci); A.objs=A.objs.filter(q=>q!==r); Z.list=Z.list.filter(q=>q!==r);
  emit(r.x,r.y,26,{col:'150,128,100',glow:false,smin:40,smax:220,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:4}); SFX.play('boom',0.6);
  if(r.goal) Z.dirty=1;
}
// ---------- carts ride the rails until the rails end or something is in the way; junctions follow their switch
C2PUSH.cart=(o,d)=>{ if(o.rider||o.mv) return; const k=c2Nb(o,d); if(!AREA.c2.rail[k]){ SFX.play('block',0.4); return; } o.hit.clear(); c2CartMove(o,d); };
function c2CartPrompt(o){ const Z=AREA.c2; if(o.mv) return null; if(Z.lock&&Z.lock.o===o) return S('Ride back','Go back'); if(Z.lock) return null; if(o.cargo) return o.cargo.lit?null:S('Look in the cart','Look in the cart'); return S('Ride the cart','Ride the cart'); }
C2ACT.cart=o=>{
  const Z=AREA.c2;
  if(o.cargo&&!(Z.lock&&Z.lock.o===o)){ c2Say(S(`A barrel is riding in the cart. Light it, then push the cart. Stand back!`,`A barrel is in the cart. Light it. Push the cart. Run!`)); return; }
  const d=c2CartPick(o); if(d<0){ SFX.play('block',0.5); return; }
  if(!Z.lock){ Z.lock={kind:'cart',o}; o.rider=1; Z.slide=null; SFX.play('roll',0.6); }
  o.hit.clear(); c2CartMove(o,d);
};
// which way a cart goes when you hop in: back the way it came, else the longer way
function c2CartPick(o){
  const Z=AREA.c2, ds=[0,1,2,3].filter(d=>Z.rail[c2Nb(o,d)]);
  if(o.dir>=0&&ds.includes(o.dir)) return o.dir;
  if(ds.length===1) return ds[0];
  let best=-1, bl=-1; for(const d of ds){ let n=0, q={ci:o.ci,cj:o.cj}; for(let s=0;s<40;s++){ const k=c2Nb(q,d); if(!Z.rail[k]) break; n++; q.ci+=C2DIR[d][0]; q.cj+=C2DIR[d][1]; } if(n>bl){ bl=n; best=d; } }
  return best;
}
function c2CartOpen(o,d){ const Z=AREA.c2, k=c2Nb(o,d); if(!Z.rail[k]) return 'end'; const q=Z.occ.get(k); if(q&&q!==o) return 'crash'; if(AREA.cave.dyn&&caveBlockedAt(k)) return 'crash'; if(!o.rider&&!c2Free(k,o)) return 'crash'; return 'ok'; }
function c2CartMove(o,d){
  const r=c2CartOpen(o,d);
  if(r!=='ok'){ c2CartStop(o,d,r); return; }
  c2Go(o,d,330); o.dir=d;
}
// the direction after arriving at a cell while heading d
function c2CartTurn(o,d){
  const Z=AREA.c2, k=o.cj*AREA.cave.w+o.ci, back=(d+2)%4, arms=[0,1,2,3].filter(a=>Z.rail[c2Nb(o,a)]);
  if(Z.rail[k]===3){ const J=c2Junc(k); if(J){ if(back===J.stem) return J.set; return J.stem; } }
  if(arms.includes(d)) return d;
  const t=arms.filter(a=>a!==back); return t.length===1?t[0]:-1;
}
C2UPD.cart=(o,dt)=>{
  const A=AREA, Z=A.c2;
  if(o.mv){
    // ram whatever is on the rails
    for(const e of G.enemies){ if(e.dead||!e.inArea||o.hit.has(e.id)) continue; if(dist(e.x,e.y,o.x,o.y)<e.r+22){ o.hit.add(e.id); damageEnemy(e,20+6*(A.level||1),{src:'cart',kb:460,ka:angTo(o.x,o.y,e.x,e.y)}); if(!e.dead) stunEnemy(e,0.8); SFX.play('hit'); ftext(e.x,e.y-e.r-6,S('Bonk!','Bonk!'),'#ffe0a0',12); } }
    if(Math.random()<dt*12) emit(o.x+rand(-10,10),o.y+12,1,{col:'255,210,140',smin:30,smax:90,lmin:.1,lmax:.25,zmin:1,zmax:2,drag:3});
    const m=c2Step(o,dt); if(!m) return;
    const nd=c2CartTurn(o,m.d);
    if(nd<0){ c2CartStop(o,m.d,'end'); return; }
    c2CartMove(o,nd);
  }
};
function c2CartStop(o,d,why){
  const Z=AREA.c2; o.mv=null;
  SFX.play(why==='crash'?'hit':'block',0.6); shake(why==='crash'?4:2);
  if(o.cargo&&o.cargo.lit&&why==='crash'){ c2Explode(o.cargo); }
  o.dir=(d+2)%4;
  if(Z.lock&&Z.lock.o===o) c2CartOff(o,d);
}
function c2CartOff(o,d){
  const Z=AREA.c2, order=[d,(d+1)%4,(d+3)%4,(d+2)%4];
  for(const q of order){ const k=c2Nb(o,q), kd=c2Kind(k); if((kd==='floor'||kd==='ice'||kd==='floe'||kd==='pad'||kd==='rock'||kd==='cool')&&!Z.occ.get(k)&&!(AREA.cave.dyn&&caveBlockedAt(k))){ const [i,j]=c2IJ(k); player.x=c2X(i); player.y=c2Y(j); Z.lock=null; o.rider=0; Z.safe={x:player.x,y:player.y}; mvSnd('land',0.8); return; } }
  // nowhere to step: stay in and ride back with E
}
// junctions: a '+' rail cell with three arms. The arm opposite the missing one is the stem; a switch lever picks the branch
function c2Junc(k){
  const Z=AREA.c2; if(!Z.junc) Z.junc=new Map(); let J=Z.junc.get(k); if(J) return J;
  const w=AREA.cave.w, i=k%w, j=(k-i)/w, q={ci:i,cj:j}, arms=[0,1,2,3].filter(a=>Z.rail[c2Nb(q,a)]);
  if(arms.length!==3) return null;
  const miss=[0,1,2,3].find(a=>!arms.includes(a)), stem=(miss+2)%4, br=arms.filter(a=>a!==stem);
  const R=caveRoomAt(c2X(i),c2Y(j)), want=R&&R.junction?C2DN[R.junction]:br[0];
  J={k,stem,br,set:br.includes(want)?want:br[0]}; Z.junc.set(k,J); return J;
}
// ---------- levers: call or send a lift, flip a rail switch, or solve the room
function c2LeverPrompt(o){
  const r=o.role, Z=AREA.c2;
  if(r.lift){ const L=Z.lifts[r.lift]; if(!L) return null; if(L.move) return null; if(!L.on) return S('Look at the lift lever','Look at the lever'); const side=c2LiftSide(L,o.room); if(L.at===side) return c2OnCage(L,side)?null:(L.L.up===side?S('Send the lift down','Send the lift down'):S('Send the lift up','Send the lift up')); return S('Call the lift','Call the lift'); }
  if(r.sw) return S('Flip the rail switch','Flip the switch');
  if(r.solve) return o.on?null:S('Pull the lever','Pull the lever');
  if(r.recall) return S('Ring the cart bell (call the cart)','Call the cart');
  return null;
}
// the cart bell: an empty cart rolls back along the rails to this end of the track
function c2Recall(o){
  const A=AREA, Z=A.c2, w=A.cave.w, cart=Z.carts.find(c=>c.id===o.role.recall)||Z.carts[0]; SFX.play('shrine',0.4);
  if(!cart||cart.mv||cart.rider) return;
  if(cart.cargo&&cart.cargo.lit) return;
  // the rail cell nearest the lever is where the cart should come
  let tk=-1, bd=1e9; for(let dj=-4;dj<=4;dj++) for(let di=-4;di<=4;di++){ const k=(o.cj+dj)*w+o.ci+di; if(k>=0&&Z.rail[k]&&Math.abs(di)+Math.abs(dj)<bd){ bd=Math.abs(di)+Math.abs(dj); tk=k; } }
  const k0=cart.cj*w+cart.ci; if(tk<0||Math.abs(tk%w-cart.ci)+Math.abs(Math.floor(tk/w)-cart.cj)<=2){ setBanner(S('Ding ding!','Ding!'),S('The cart is already here.','The cart is here.'),1.2); return; }
  const prev=new Map([[k0,-1]]), q=[k0]; let found=false;
  for(let qi=0;qi<q.length&&!found;qi++){ const k=q[qi]; for(let d=0;d<4;d++){ const n=k+C2DIR[d][0]+C2DIR[d][1]*w; if(!Z.rail[n]||prev.has(n)) continue; prev.set(n,k); if(n===tk){ found=true; break; } q.push(n); } }
  if(!found) return;
  let k=tk; while(prev.get(k)!==k0) k=prev.get(k);
  const d=[0,1,2,3].find(d=>k0+C2DIR[d][0]+C2DIR[d][1]*w===k);
  cart.hit.clear(); c2CartMove(cart,d); setBanner(S('Ding ding!','Ding!'),S('Somewhere, a cart starts rolling this way.','The cart is coming!'),1.6);
}
C2ACT.lever=o=>{
  const r=o.role, A=AREA, Z=A.c2;
  if(r.lift){ const L=Z.lifts[r.lift]; if(!L||L.move) return;
    if(!L.on&&r.power){ L.on=true; G.found[L.L.power]=1; o.on=true; SFX.play('block'); jingle('secret','shrine'); shake(4); setBanner(S('The lift hums awake','The lift is on!'),S('It runs all the way up now.','It goes all the way up.'),2.4); saveGame(); return; }
    if(!L.on){ c2Say(L.L.offText||S('The lever will not budge.','It will not move.')); return; }
    o.on=!o.on; SFX.play('block'); c2LiftGo(L,false);
    return; }
  if(r.sw){ const J=c2RoomJunc(o.room); if(J){ J.set=J.br.find(b=>b!==J.set); o.on=!o.on; SFX.play('block'); shake(2); setBanner(S('Clunk!','Clunk!'),S(`The rails now point ${['north','east','south','west'][J.set]}.`,`The rails point ${['north','east','south','west'][J.set]} now.`),1.6); } return; }
  if(r.solve&&!o.on){ o.on=true; SFX.play('block'); const R=A.rooms[o.room]; if(R&&!R.solved) solveRoom(R); return; }
  if(r.recall){ o.on=!o.on; c2Recall(o); return; }
};
function c2RoomJunc(rid){ const A=AREA, Z=A.c2, R=A.rooms[rid]; for(let k=0;k<Z.rail.length;k++){ if(Z.rail[k]!==3) continue; const [i,j]=c2IJ(k); if(caveRoomAt(c2X(i),c2Y(j))===R) return c2Junc(k); } return null; }
// ---------- lifts: a cage on ropes between two stations ('e' cells) in two rooms on different levels
function c2LiftMake(A,def,L){
  const Z=A.c2, c=A.cave, st={};
  for(const side of ['a','b']){ const rid=L[side]; const ms=c.c2.marks.filter(m=>m.room===rid&&m.kind==='lift'); if(!ms.length) continue;
    const cells=ms.map(m=>m.j*c.w+m.i), x=ms.reduce((s,m)=>s+c2X(m.i),0)/ms.length, y=ms.reduce((s,m)=>s+c2Y(m.j),0)/ms.length;
    const o={k:'c2',kind:'station',side,x,y,id:`c2_${def.id}_${L.id}_${side}`,room:rid,r:34,cells,i0:Math.min(...ms.map(m=>m.i)),j0:Math.min(...ms.map(m=>m.j))};
    st[side]=o; A.objs.push(o); Z.list.push(o); }
  const lift={id:L.id,L,st,at:L.at||'b',move:null,on:!L.power||!!G.found[L.power],cargo:[]};
  for(const s in st){ st[s].lift=lift; st[s].prompt=()=>c2StationPrompt(st[s]); }
  Z.lifts[L.id]=lift; c2LiftPlat(lift);
}
function c2LiftSide(L,room){ for(const s in L.st) if(L.st[s].room===room) return s; return null; }
function c2LiftPlat(L){ const Z=AREA.c2; for(const s in L.st) for(const k of L.st[s].cells){ if(L.at===s&&!L.move) Z.plat.set(k,L.st[s]); else if(Z.plat.get(k)===L.st[s]) Z.plat.delete(k); } }
function c2OnCage(L,side){ const s=L.st[side], k=c2K(player.x,player.y); return !!s&&s.cells.includes(k); }
function c2StationPrompt(o){ const L=o.lift; if(L.move||L.at!==o.side||!c2OnCage(L,o.side)) return null; if(!L.on) return null; return L.L.up===o.side?S('Ride the lift down','Ride down'):S('Ride the lift up','Ride up'); }
C2ACT.station=o=>{ const L=o.lift; if(L.move||L.at!==o.side||!L.on) return; c2LiftGo(L,true); };
function c2LiftGo(L,ride){
  const A=AREA, Z=A.c2, from=L.at, to=from==='a'?'b':'a', S0=L.st[from], S1=L.st[to]; if(!S0||!S1) return;
  // barrels standing on the cage go with it
  L.cargo=Z.barrels.filter(b=>!b.gone&&!b.mv&&!b.cargoOf&&S0.cells.includes(b.cj*A.cave.w+b.ci));
  for(const b of L.cargo){ Z.occ.delete(b.cj*A.cave.w+b.ci); b.onLift=L; b.rel=[b.ci-S0.i0,b.cj-S0.j0]; }
  L.move={from,to,t:0,dur:ride?2.2:1.8,ride,swap:false};
  if(ride){ Z.lock={kind:'lift',L,x:player.x,y:player.y,dx:player.x-S0.x,dy:player.y-S0.y}; Z.slide=null; }
  c2LiftPlat(L); SFX.play('roll'); SFX.play('block',0.5); shake(2);
}
function c2LiftUpdate(L,dt){
  const A=AREA, Z=A.c2, M=L.move; if(!M) return;
  M.t+=dt; const S0=L.st[M.from], S1=L.st[M.to], k=M.t/M.dur;
  if(Math.random()<dt*6) SFX.play('step',0.5);
  for(const b of L.cargo){ const S=M.swap?S1:S0; b.x=c2X(S.i0+b.rel[0]); b.y=c2Y(S.j0+b.rel[1]); }
  if(!M.swap&&k>=0.5){ M.swap=true;
    if(M.ride){ const p=player; Z.lock.x=S1.x+Z.lock.dx; Z.lock.y=S1.y+Z.lock.dy; p.x=Z.lock.x; p.y=Z.lock.y; G.fade=0.9; updateCam(0,true); if(G.pip){ G.pip.x=p.x; G.pip.y=p.y+30; } if(typeof compsOnMove==='function') compsOnMove(); }
    for(const b of L.cargo){ b.ci=S1.i0+b.rel[0]; b.cj=S1.j0+b.rel[1]; b.x=c2X(b.ci); b.y=c2Y(b.cj); } }
  if(k>=1){
    L.at=M.to; L.move=null; c2LiftPlat(L); SFX.play('block'); shake(3);
    for(const b of L.cargo){ b.onLift=null; if(!b.gone) Z.occ.set(b.cj*A.cave.w+b.ci,b); }
    L.cargo=[];
    if(M.ride){ Z.lock=null; Z.safe=null; const R=A.rooms[S1.room], cfg=Z.cfg; if(cfg.levels&&R&&R.lvl) setBanner(cfg.levels[R.lvl-1],S(`Level ${R.lvl} of ${cfg.levels.length}`,`Level ${R.lvl}`),2.2,'region'); }
  }
}
// barrel chutes (the Matriarch's nest): a new barrel tumbles out when there are few about
C2UPD.chute=(o,dt)=>{
  const A=AREA, Z=A.c2, R=A.rooms[o.room]; if(R.solved||Z.room!==R) return;
  o.t-=dt; if(o.t>0) return; o.t=5.5;
  const k=o.cj*A.cave.w+o.ci; if(!c2Free(k,null)||Z.occ.get(k)) return;
  if(Z.barrels.filter(b=>!b.gone&&b.room===o.room).length>=4) return;
  const b={k:'c2',kind:'barrel',id:o.id+'_b'+Z.t.toFixed(1),room:o.room,ci:o.ci,cj:o.cj,hi:o.ci,hj:o.cj,x:o.x,y:o.y,r:20,solid:1,tall:1,lit:0,fuse:0,mv:null,gone:0,once:1};
  A.objs.push(b); Z.list.push(b); Z.barrels.push(b); Z.occ.set(k,b);
  emit(o.x,o.y-20,12,{col:'200,170,130',glow:false,smin:20,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); SFX.play('roll',0.6);
};
// the great chest at the end of each cave: a Heart Ember (+max health)
C2ACT.heart=o=>{
  const A=AREA, id=`c2_${A.def.id}_heart`; if(G.found[id]) return;
  G.found[id]=true; SFX.play('chest'); flashA=0.4; flashCol='255,200,140'; shake(5);
  emit(o.x,o.y,40,{col:'255,190,120',ang:-Math.PI/2,spread:1.2,smin:40,smax:220,lmin:.5,lmax:1.1,zmin:1.5,zmax:3.5,rise:20});
  const lv=A.def.level||1; addCoins(30+10*lv,o.x,o.y); gainXp(80+30*lv);
  if(typeof gainHeartEmber==='function') gainHeartEmber();
  else { const p=player; p.maxHp+=10; p.hp=p.maxHp; jingle('levelup','level'); setBanner(S('A Heart Ember!','A Heart Ember!'),S('+10 max health. Your fire burns a little brighter.','+10 health!'),3.2); }
  saveGame();
};
// the rune stone: everything pushable in this room goes back where it started
C2ACT.reset=o=>{ c2ResetRoom(o.room); };
function c2ResetRoom(rid){
  const A=AREA, Z=A.c2, c=A.cave, also=(A.rooms[rid]&&A.rooms[rid].resetRooms)||[];
  // frozen water, floes, meltwater and refrozen floor go back to how the room began
  for(const id of [rid,...also]){ const R=A.rooms[id]; if(!R) continue;
    for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i, s=Z.st[k]; if((s>=2&&s<=4)||c.typ[k]!==Z.typ0[k]){ if(s>=2&&s<=4){ Z.st[k]=0; Z.tm[k]=0; if(Z.timed) Z.timed.delete(k); } c.typ[k]=Z.typ0[k]; } } }
  for(const q of Z.list.slice()){ const home=q.room0||q.room; if(q.room!==rid&&home!==rid&&!also.includes(home)) continue; const f=C2RESET[q.kind]; if(f) f(q); }
  SFX.play('ui'); emit(player.x,player.y,10,{col:'200,220,255',smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); setBanner(S('Back to the start','Back to the start'),'',1.2);
}
const C2RESET={
  barrel:o=>{ if(o.once){ o.gone=99; Z0().occ.delete(o.cj*AREA.cave.w+o.ci); return; } if(o.cargoOf){ o.cargoOf.cargo=null; o.cargoOf=null; } else if(Z0().occ.get(o.cj*AREA.cave.w+o.ci)===o) Z0().occ.delete(o.cj*AREA.cave.w+o.ci); o.gone=0.05; o.lit=0; o.mv=null; o.rollD=null; o.onLift=null; },
  cart:o=>{ if(o.rider||o.mv) return; if(o.cargo) C2RESET.barrel(o.cargo); const Z=Z0(), k0=o.cj*AREA.cave.w+o.ci, k1=o.hj*AREA.cave.w+o.hi; if(Z.occ.get(k1)&&Z.occ.get(k1)!==o) return; Z.occ.delete(k0); o.ci=o.hi; o.cj=o.hj; o.x=c2X(o.ci); o.y=c2Y(o.cj); Z.occ.set(k1,o); }
};
const Z0=()=>AREA.c2;
function c2Say(t,cb){ runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); saveGame(); }); }

// ---------- fire, claws, roars, thrown things and the E button reach our objects
const C2FIRE={}, C2SWING={}, C2ROAR={}, C2HIT={};
C2FIRE.barrel=(o)=>c2Light(o);
C2HIT.barrel=(o,src)=>{ if(src==='fire') c2Light(o); else if(src==='bombs'||src==='bomb') c2Light(o,0.05); };
C2HIT.rubble=(o,src)=>{ if(src==='bombs'||src==='bomb') c2RubbleBreak(o); };
C2SWING.lever=o=>{ if(o.role&&o.role.sw&&!(o.swT>G.time)){ o.swT=G.time+0.5; C2ACT.lever(o); } };
C2HIT.lever=(o,src)=>{ if(src!=='fire'&&o.role&&o.role.sw&&!(o.swT>G.time)){ o.swT=G.time+0.5; C2ACT.lever(o); } };
{ const base=caveBreath; caveBreath=function(hit,dt){ base(hit,dt); const A=AREA; if(!A||!A.c2) return; for(const o of A.c2.list){ const f=C2FIRE[o.kind]; if(f&&!o.gone&&hit(o.x,o.y,o.r||18)) f(o,dt); } }; }
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){ base(px,py,dir,range,half); const A=AREA; if(!A||!A.c2) return; for(const o of A.c2.list){ const f=C2SWING[o.kind]; if(f&&!o.gone&&inArcC(px,py,dir,range+10,half,{x:o.x,y:o.y-(o.hy||0),r:o.r||18})) f(o); } }; }
{ const base=caveRoar; caveRoar=function(x,y,r){ base(x,y,r); const A=AREA; if(!A||!A.c2) return; for(const o of A.c2.list){ const f=C2ROAR[o.kind]; if(f&&!o.gone&&dist(x,y,o.x,o.y)<r+30) f(o); } }; }
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ let hit=base(x,y,r,src); const A=AREA; if(!A||!A.c2) return hit; r=r||8;
  for(const o of A.c2.list){ const f=C2HIT[o.kind]; if(f&&!o.gone&&dist(x,y,o.x,o.y-(o.hy||0))<r+(o.r||18)){ if(f(o,src)!==false) hit=true; } }
  return hit; }; }
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.k==='c2'){ const f=C2ACT[o.kind]; if(f) f(o); return; } return base(o); }; }
// sealed doors that wait on one of our rooms say what that room wants
{ const base=caveObjAct; caveObjAct=function(o){ const A=AREA;
  if(A&&A.c2&&o.k==='cgate'&&o.type==='gate'){ const R=A.rooms[o.gateRoom]; if(R&&R.hint){ c2Say(R.hint); return true; } }
  return base(o); }; }

// ---------- rooms: first steps in, puzzle goals, the boss
function c2OnRoom(R){
  const A=AREA, Z=A.c2;
  if(R.intro&&!G.found[`c2_${A.def.id}_in_${R.id}`]){ G.found[`c2_${A.def.id}_in_${R.id}`]=1; later(0.4,()=>{ if(AREA===A&&scene==='play') runDialogue(R.intro,()=>{ scene='play'; saveGame(); }); }); }
  if(R.boss2&&Z.boss&&!Z.boss.dead){ Z.bossOn=true; }
}
function c2Goals(){
  const A=AREA, Z=A.c2;
  for(const id in A.rooms){ const R=A.rooms[id]; if(R.solved||!R.goal) continue;
    if(R.goal==='rubble'){ if(!Z.rubble.some(r=>!r.dead&&r.goal&&r.room===id)) solveRoom(R); }
    else if(R.goal==='plates'){ const ps=Z.plates.filter(q=>q.room===id); if(ps.length&&ps.every(q=>q.pressed)) solveRoom(R); }
    else if(typeof C2GOAL[R.goal]==='function'&&C2GOAL[R.goal](R)) solveRoom(R);
  }
  for(const q of Z.plates){ const k=q.cj*A.cave.w+q.ci, o=Z.occ.get(k); q.pressed=!!(o&&!o.mv&&(o.kind==='barrel'||o.kind==='cart'||o.kind==='block')); }
}
const C2GOAL={};
// bosses: spawned asleep in their room; the bar and boss music start when Ash walks in
function c2BossSpawn(A,def,R){
  const B=R.boss2, Z=A.c2, c=A.cave;
  const m=c.c2.marks.find(q=>q.room===R.id&&q.kind==='spawn');
  const x=m?c2X(m.i):R.cx, y=m?c2Y(m.j):R.cy;
  const e=makeEnemy(B.type,x,y,{level:def.level+1,aggro:false,elite:false,homeX:x,homeY:y,leash:99999,camp:A.camp||null,face:Math.PI/2,snowy:def.theme==='ice'});
  e.inArea=true; e.room=R.id; e.caveBoss=B.name; e.c2boss=true; e.arena={x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1,cx:R.cx,cy:R.cy};
  R.enemies.push(e); if(A.camp) A.camp.alive++; Z.boss=e; Z.bossRoom=R;
  if(typeof C2BOSSINIT[B.type]==='function') C2BOSSINIT[B.type](e,R);
}
const C2BOSSINIT={};
function c2BossTick(dt){
  const A=AREA, Z=A.c2, e=Z.boss; if(!e) return;
  const p=player, R=Z.bossRoom;
  if(e.dead){ if(!Z.bossDone){ Z.bossDone=true; later(2.4,()=>{ if(G.boss===e) G.boss=null; }); later(0.8,()=>{ if(AREA===A){ jingle('complete','upgrade'); setBanner(S(`${e.caveBoss} is beaten!`,`You beat ${e.caveBoss}!`),R.winText||'',3); } }); } return; }
  if(caveRoomAt(p.x,p.y)===R&&caveInterior(R,p.x,p.y)){ if(G.boss!==e){ G.boss=e; e.aggro=true; } }
}
// lava glows: one light per patch of lava (wave basalt lights up while it is flooded)
function c2Lights(A){
  const c=A.cave, Z=A.c2; Z.glow=[];
  for(let j=0;j<c.h;j+=3) for(let i=0;i<c.w;i+=3){ let n=0, w=0; const ks=[];
    for(let dj=0;dj<3;dj++) for(let di=0;di<3;di++){ const k=(j+dj)*c.w+i+di; if(i+di>=c.w||j+dj>=c.h) continue; const t=c.typ[k]; if(t===45){ n++; ks.push(k); } else if(t===46||t===47){ w++; ks.push(k); } }
    if(n+w<2) continue; const L={x:A.x0+(i+1.5)*c.cell,y:A.y0+(j+1.5)*c.cell,r:200,i:n?0.5:0,fire:true}; A.lights.push(L); if(w) Z.glow.push({L,ks,n}); }
}

// ================= art
// cached sprites, drawn at twice their size so they stay crisp when the camera zooms in
const C2SPR=new Map();
function c2Spr(key,w,h,fn){ let s=C2SPR.get(key); if(!s){ s=mkCanvas(w*2,h*2); const g=s.getContext('2d'); g.scale(2,2); g.lineJoin='round'; g.lineCap='round'; fn(g,w,h); C2SPR.set(key,s); } return s; }
function c2Blit(s,x,y,w,h,sc){ sc=sc||1; ctx.drawImage(s,x-w*sc/2,y-h*sc/2,w*sc,h*sc); }
const C2INK='#24160f';
function c2Shadow(x,y,rx,ry,a){ ctx.fillStyle=`rgba(0,0,0,${a||0.3})`; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); }
// the cell layer painted into the cave's static canvas (after the engine's floors and walls)
const C2PAL={
  mine:{abyss:'#0b0a0d',lip:['#5a4632','#2a1e14'],rail:'#a8aab4',tie:'#6a4a2c',trestle:'#4a3220'},
  bog:{abyss:'#0b0f0a',lip:['#3e4a2c','#1a2010'],water:'#1f4a44',water2:'#2a5c52',foam:'rgba(210,240,220,.55)',pad:'#4a8a3a',rail:'#a8aab4',tie:'#6a4a2c',trestle:'#4a3220'},
  ice:{abyss:'#0a0e16',lip:['#6a8aa8','#2a3a52'],water:'#16365a',water2:'#1e4670',foam:'rgba(230,248,255,.7)',ice:'#bfe2f4',ice2:'#d8f0fc',iceLine:'rgba(120,170,210,.55)',spring:'#2a8a9a',rail:'#a8aab4',tie:'#6a4a2c',trestle:'#4a3220'},
  ember:{abyss:'#0c0606',lip:['#5a2a20','#200a06'],lava:'#a8280c',lava2:'#e85a14',crust:'#3a1a14',low:'#3a2622',low2:'#47302a',mid:'#4a3430',mid2:'#56403a',rail:'#a8aab4',tie:'#6a4a2c',trestle:'#4a3220'}
};
function c2Pal(){ const A=AREA; return C2PAL[(A&&A.def&&A.def.theme)]||C2PAL.mine; }
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){ base(A,def); if(A.cave&&A.cave.c2&&C2.ids[def.id]) c2PaintStatic(A,def); }; }
function c2PaintStatic(A,def){
  const c=A.cave, cs=c.cell, g=A.canvas.getContext('2d'), P=C2PAL[def.theme]||C2PAL.mine, rng=mulberry32(def.seed*13+7), Zc=c.c2;
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0); g.lineJoin='round'; g.lineCap='round';
  const T=C2.T, typ=(i,j)=>(i<0||j<0||i>=c.w||j>=c.h)?-1:c.typ[j*c.w+i], solid=(i,j)=>i<0||j<0||i>=c.w||j>=c.h||c.grid[j*c.w+i]===1;
  // room tints (the mine's three levels look different)
  for(const id in c.rooms){ const R=c.rooms[id]; if(!R.tint2) continue; g.fillStyle=R.tint2; g.fillRect((R.ox+1)*cs,(R.oy+1)*cs,R.iw*cs,R.ih*cs); }
  // in the ice cave plain floor is packed snow: matte and grippy, so it reads as "here you stop"
  const snow=def.theme==='ice';
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){
    const k=j*c.w+i, t=c.typ[k]; if(c.grid[k]===1) continue;
    const x=i*cs, y=j*cs;
    if(t<40){ if(!snow) continue; const R=c2RoomOf(c,i,j); if(!R||!R.lay) continue;
      g.fillStyle='#bdb8ae'; g.fillRect(x,y,cs,cs); g.fillStyle='#d8d4ca'; g.fillRect(x+2,y+2,cs-4,cs-4);
      for(let s=0;s<7;s++){ g.fillStyle=rng()<0.5?'rgba(255,255,255,.7)':'rgba(90,110,130,.35)'; g.beginPath(); g.arc(x+3+rng()*(cs-6),y+3+rng()*(cs-6),0.8+rng()*1.6,0,TAU); g.fill(); }
      g.strokeStyle='rgba(70,90,110,.35)'; g.lineWidth=1; g.strokeRect(x+0.5,y+0.5,cs-1,cs-1);
      continue; }
    if(t===T.abyss){
      g.fillStyle=P.abyss; g.fillRect(x,y,cs,cs);
      const up=typ(i,j-1)!==T.abyss&&!solid(i,j-1), upw=solid(i,j-1);
      if(up||upw){ const gr=g.createLinearGradient(0,y,0,y+cs*0.62); gr.addColorStop(0,P.lip[0]); gr.addColorStop(1,P.lip[1]); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.62); g.fillStyle='rgba(0,0,0,.25)'; for(let s=0;s<3;s++) g.fillRect(x+rng()*cs,y+cs*0.18+s*cs*0.14,6+rng()*14,2); g.fillStyle='rgba(255,240,210,.18)'; g.fillRect(x,y,cs,2); }
      if(typ(i,j+1)!==T.abyss&&!solid(i,j+1)){ g.fillStyle='rgba(255,240,210,.12)'; g.fillRect(x,y+cs-3,cs,3); }
      if(typ(i-1,j)!==T.abyss&&!solid(i-1,j)){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x,y,4,cs); }
      if(typ(i+1,j)!==T.abyss&&!solid(i+1,j)){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+cs-4,y,4,cs); }
      if(rng()<0.3){ g.fillStyle='rgba(255,255,255,.05)'; g.beginPath(); g.arc(x+rng()*cs,y+cs*0.7+rng()*cs*0.3,1.2,0,TAU); g.fill(); }
    }else if(t===T.water||t===T.current||t===T.whirl||t===T.spring){
      g.fillStyle=t===T.spring?(P.spring||'#2a8a9a'):(P.water||'#1f4a44'); g.fillRect(x,y,cs,cs);
      if(t!==T.spring&&rng()<0.45){ g.fillStyle=P.water2||'#2a5c52'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,6+rng()*14,2+rng()*3,0,0,TAU); g.fill(); }
      const wet=q=>q===T.water||q===T.current||q===T.whirl||q===T.spring;
      // shore foam and a dark lip under the north bank
      if(!wet(typ(i,j-1))){ g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(x,y,cs,7); g.fillStyle=P.foam||'rgba(255,255,255,.5)'; g.fillRect(x+2,y+7,cs-4,2.5); }
      if(!wet(typ(i,j+1))){ g.fillStyle=P.foam||'rgba(255,255,255,.5)'; g.fillRect(x+2,y+cs-4,cs-4,2.5); }
      if(!wet(typ(i-1,j))){ g.fillStyle=P.foam||'rgba(255,255,255,.5)'; g.fillRect(x+1,y+3,2.5,cs-6); }
      if(!wet(typ(i+1,j))){ g.fillStyle=P.foam||'rgba(255,255,255,.5)'; g.fillRect(x+cs-3.5,y+3,2.5,cs-6); }
    }else if(t===T.ice){
      g.fillStyle=(i+j)%2?P.ice||'#bfe2f4':P.ice2||'#d8f0fc'; g.fillRect(x,y,cs,cs);
      g.strokeStyle=P.iceLine||'rgba(120,170,210,.5)'; g.lineWidth=1.5; g.strokeRect(x+0.75,y+0.75,cs-1.5,cs-1.5);
      g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+6,y+cs*0.3); g.lineTo(x+cs*0.45,y+6); g.moveTo(x+cs*0.55,y+cs-6); g.lineTo(x+cs-6,y+cs*0.62); g.stroke();
      if(rng()<0.35){ g.strokeStyle='rgba(150,190,220,.6)'; g.lineWidth=1; g.beginPath(); const a=rng()*cs, b=rng()*cs; g.moveTo(x+a,y+b); g.lineTo(x+a+rng()*20-10,y+b+rng()*20-10); g.lineTo(x+a+rng()*20-10,y+b+rng()*20-10); g.stroke(); }
    }else if(t===T.lava){
      // the same tiles the live layer uses for flooded basalt, so the two match
      g.drawImage(c2LavaTile((i*3+j)%4),x,y,cs,cs);
    }else if(t===T.low||t===T.mid){
      const lo=t===T.low;
      if(lo){ // a thin black crust over the lava: plates with glowing seams between them
        g.fillStyle='#ff7a2a'; g.fillRect(x,y,cs,cs);
        g.fillStyle='#24181a'; const m=3; g.beginPath(); g.moveTo(x+m+rng()*3,y+m); g.lineTo(x+cs-m-rng()*3,y+m+rng()*2); g.lineTo(x+cs-m,y+cs-m-rng()*3); g.lineTo(x+m+rng()*2,y+cs-m); g.closePath(); g.fill();
        g.strokeStyle='rgba(255,140,50,.85)'; g.lineWidth=1.6; g.beginPath(); const a=rng()*cs*0.6+cs*0.2; g.moveTo(x+a,y+m); g.lineTo(x+a+rng()*10-5,y+cs*0.5); g.lineTo(x+rng()*cs*0.6+cs*0.2,y+cs-m); g.stroke();
        g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(x+5,y+5,cs-10,2);
      } else { // higher ground: grey-brown stone, only the big waves reach it
        g.fillStyle='#2a1c18'; g.fillRect(x,y,cs,cs); g.fillStyle=(i+j)%2?'#5e4a42':'#64504a'; g.fillRect(x+2,y+2,cs-4,cs-6);
        g.fillStyle='rgba(255,240,220,.14)'; g.fillRect(x+3,y+3,cs-6,3); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x+2,y+cs-6,cs-4,4);
        g.strokeStyle='rgba(255,150,70,.35)'; g.lineWidth=1.2; g.beginPath(); const a=rng()*cs; g.moveTo(x+a,y+4); g.lineTo(x+a+rng()*12-6,y+cs*0.6); g.stroke();
      }
    }else if(t===T.pad){
      g.fillStyle=(P.water||'#1f4a44'); g.fillRect(x,y,cs,cs);
      g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x+cs/2+2,y+cs/2+4,cs*0.48,cs*0.38,0,0,TAU); g.fill();
      g.fillStyle=P.pad||'#4a8a3a'; g.beginPath(); g.moveTo(x+cs/2,y+cs/2); g.ellipse(x+cs/2,y+cs/2,cs*0.47,cs*0.4,0,0.35,TAU-0.15); g.closePath(); g.fill();
      g.strokeStyle=C2INK; g.lineWidth=2; g.stroke(); g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=1.2; for(let a=0.8;a<6;a+=0.9){ g.beginPath(); g.moveTo(x+cs/2,y+cs/2); g.lineTo(x+cs/2+Math.cos(a)*cs*0.38,y+cs/2+Math.sin(a)*cs*0.32); g.stroke(); }
    }
  }
  // rails: ties, then two steel rails; over a shaft the ties sit on a timber trestle
  const R=Zc.rail;
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){
    const k=j*c.w+i; if(!R[k]) continue;
    const x=(i+0.5)*cs, y=(j+0.5)*cs, nb=[0,1,2,3].filter(d=>{ const q=(j+C2DIR[d][1])*c.w+i+C2DIR[d][0]; return R[q]; }), over=c.typ[k]===T.abyss;
    if(over){ g.fillStyle=P.trestle; for(const d of nb){ const [dx,dy]=C2DIR[d]; if(dx) g.fillRect(x+Math.min(0,dx*cs/2),y-cs*0.32,cs/2,cs*0.14), g.fillRect(x+Math.min(0,dx*cs/2),y+cs*0.18,cs/2,cs*0.14); else g.fillRect(x-cs*0.32,y+Math.min(0,dy*cs/2),cs*0.14,cs/2), g.fillRect(x+cs*0.18,y+Math.min(0,dy*cs/2),cs*0.14,cs/2); }
      g.fillStyle='rgba(0,0,0,.5)'; g.fillRect(x-3,y+6,6,cs*0.45); }
    g.fillStyle=P.tie; g.strokeStyle=C2INK; g.lineWidth=1.5;
    for(const d of nb){ const [dx,dy]=C2DIR[d]; for(const f of [0.14,0.4]){ const tx=x+dx*cs*f, ty=y+dy*cs*f; if(dx){ g.fillRect(tx-3,ty-cs*0.36,6,cs*0.72); g.strokeRect(tx-3,ty-cs*0.36,6,cs*0.72); } else { g.fillRect(tx-cs*0.36,ty-3,cs*0.72,6); g.strokeRect(tx-cs*0.36,ty-3,cs*0.72,6); } } }
    g.strokeStyle='#3a3a44'; g.lineWidth=5; for(const d of nb){ const [dx,dy]=C2DIR[d]; for(const s of [-1,1]){ g.beginPath(); g.moveTo(x+(dy?s*cs*0.22:0),y+(dx?s*cs*0.22:0)); g.lineTo(x+dx*cs*0.5+(dy?s*cs*0.22:0),y+dy*cs*0.5+(dx?s*cs*0.22:0)); g.stroke(); } }
    g.strokeStyle=P.rail; g.lineWidth=2.5; for(const d of nb){ const [dx,dy]=C2DIR[d]; for(const s of [-1,1]){ g.beginPath(); g.moveTo(x+(dy?s*cs*0.22:0),y+(dx?s*cs*0.22:0)-1); g.lineTo(x+dx*cs*0.5+(dy?s*cs*0.22:0),y+dy*cs*0.5+(dx?s*cs*0.22:0)-1); g.stroke(); } }
    if(nb.length===1){ const [dx,dy]=C2DIR[(nb[0]+2)%4]; g.fillStyle='#8a3a22'; g.strokeStyle=C2INK; g.lineWidth=2; const bx=x+dx*cs*0.18, by=y+dy*cs*0.18; if(dx){ g.fillRect(bx-4,by-cs*0.34,8,cs*0.68); g.strokeRect(bx-4,by-cs*0.34,8,cs*0.68); } else { g.fillRect(bx-cs*0.34,by-4,cs*0.68,8); g.strokeRect(bx-cs*0.34,by-4,cs*0.68,8); } }
  }
  // lift stations: a timber frame around the shaft
  for(const m of Zc.marks){ if(m.kind!=='lift') continue; const k=m.j*c.w+m.i, x=m.i*cs, y=m.j*cs;
    g.strokeStyle='#5a3a20'; g.lineWidth=5; const L=typ(m.i-1,m.j)!==T.abyss||!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i-1&&q.j===m.j), Rr=!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i+1&&q.j===m.j), U=!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i&&q.j===m.j-1), D=!Zc.marks.some(q=>q.kind==='lift'&&q.i===m.i&&q.j===m.j+1);
    g.beginPath(); if(U){ g.moveTo(x,y+2); g.lineTo(x+cs,y+2); } if(D){ g.moveTo(x,y+cs-2); g.lineTo(x+cs,y+cs-2); } if(L){ g.moveTo(x+2,y); g.lineTo(x+2,y+cs); } if(Rr){ g.moveTo(x+cs-2,y); g.lineTo(x+cs-2,y+cs); } g.stroke(); }
  g.restore();
}
{ const base=renderCaveMini; renderCaveMini=function(A){ base(A); if(!A.cave||!A.cave.c2||!C2.ids[A.def.id]) return; const c=A.cave, mg=A.mini.getContext('2d'), T=C2.T, def=A.def;
  const mapped=G.items.juniper_map;
  for(const id in c.rooms){ const R=c.rooms[id]; if(!(G.found[`cv_${def.id}_v_${id}`]||(mapped&&R.kind!=='secret'))) continue; const dim=G.found[`cv_${def.id}_v_${id}`]?1:0.55;
    for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const t=c.typ[j*c.w+i]; if(t<40) continue;
      const col=t===T.abyss?[8,7,10]:t===T.ice?[170,210,235]:t===T.lava?[200,60,20]:t===T.low||t===T.mid?[110,60,44]:t===T.pad?[70,130,60]:[40,90,130];
      mg.fillStyle=`rgb(${col.map(v=>Math.round(v*dim)).join(',')})`; mg.fillRect(i,j,1,1); } } }; }
// live floor layer: water, lava, ice changes, then the flat things (lift cages, logs, vents, plates, chutes)
{ const base=drawAreaBase; drawAreaBase=function(){ base(); const A=AREA; if(A&&A.c2) c2DrawFloor(G.time); }; }
FL.c2=()=>{};
function c2View(){ const A=AREA, c=A.cave, cs=c.cell; return [Math.max(0,Math.floor((cam.x-A.x0)/cs)-1),Math.max(0,Math.floor((cam.y-A.y0)/cs)-1),Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1),Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1)]; }
const C2FLOOR={}, C2CELLDRAW=[];
function c2DrawFloor(t){
  const A=AREA, Z=A.c2, c=A.cave, cs=c.cell, [i0,j0,i1,j1]=c2View();
  for(const f of C2CELLDRAW) f(A,Z,c,cs,i0,j0,i1,j1,t);
  for(const o of Z.list){ const f=C2FLOOR[o.kind]; if(f&&inView(o.x,o.y,120)) f(o,t); }
}
// tall things sort in with Ash and the foes
{ const base=eventsForRender; eventsForRender=function(list){ base(list); const A=AREA; if(!A||!A.c2) return; const t=G.time;
  for(const o of A.c2.list){ const f=C2TALL[o.kind]; if(!f||o.gone||o.dead||o.cargoOf) continue; if(!inView(o.x,o.y,90)) continue; list.push({x:o.x,y:o.y+(o.sortY||8),flying:true,draw:()=>f(o,t)}); } }; }
// things above everyone: geyser columns, icicles hanging from the roof, the heat gauge
const C2SKY={};
{ const base=drawAirborneHook; drawAirborneHook=function(){ base(); const A=AREA; if(!A||!A.c2) return; const t=G.time; for(const o of A.c2.list){ const f=C2SKY[o.kind]; if(f&&inView(o.x,o.y,160)) f(o,t); } if(A.c2.cfg.heat) c2DrawHeat(t); }; }

// ---------- mine art
function c2BarrelSpr(){ return c2Spr('barrel',36,42,(g)=>{
  g.fillStyle='#d4442c'; rrect(g,4,7,28,32,9); g.fill(); g.strokeStyle=C2INK; g.lineWidth=2.6; g.stroke();
  g.fillStyle='rgba(0,0,0,.18)'; rrect(g,20,9,10,28,6); g.fill();
  g.strokeStyle='rgba(90,20,10,.55)'; g.lineWidth=1.4; for(const sx of [11,18,25]){ g.beginPath(); g.moveTo(sx,10); g.lineTo(sx,37); g.stroke(); }
  g.fillStyle='#6a5a52'; for(const by of [13,31]){ g.fillRect(4,by,28,4); g.strokeStyle=C2INK; g.lineWidth=1.6; g.strokeRect(4,by,28,4); }
  g.fillStyle='#e8684a'; g.beginPath(); g.ellipse(18,8.5,13.5,5,0,0,TAU); g.fill(); g.strokeStyle=C2INK; g.lineWidth=2.2; g.stroke(); g.fillStyle='#a83420'; g.beginPath(); g.ellipse(18,8.5,9,3,0,0,TAU); g.fill();
  // a yellow flame on the front: BOOM inside
  g.fillStyle='#ffd23a'; g.beginPath(); g.moveTo(18,17); g.quadraticCurveTo(24,22,22,26); g.quadraticCurveTo(20,30,18,30); g.quadraticCurveTo(13,30,13,25); g.quadraticCurveTo(13,22,16,19); g.quadraticCurveTo(16,22,18,22); g.closePath(); g.fill(); g.strokeStyle='#7a3a10'; g.lineWidth=1.4; g.stroke();
  g.strokeStyle='#5a3a20'; g.lineWidth=2; g.beginPath(); g.moveTo(24,6); g.quadraticCurveTo(27,1,30,2); g.stroke(); }); }
C2TALL.barrel=(o,t)=>{
  const x=o.x, y=o.y, s=c2BarrelSpr(); c2Shadow(x+2,y+12,15,6,0.32);
  let wob=0; if(o.mv) wob=Math.sin(t*40)*1.2; if(o.lit) wob+=Math.sin(t*60)*(o.fuse<1?1.4:0.6);
  ctx.save(); ctx.translate(x+wob,y-6); if(o.pushK>0.05&&!o.mv){ ctx.translate(Math.cos(t*50)*o.pushK*1.5,0); }
  c2Blit(s,0,0,36,42);
  if(o.lit){ const blink=o.fuse<1.2?(Math.sin(t*(o.fuse<0.5?50:24))>0):false; if(blink){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.55; c2Blit(s,0,0,36,42); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
    glowAt(12,-20,18,'255,210,110',0.9); ctx.fillStyle='#fff6c8'; ctx.beginPath(); ctx.arc(12,-20,2.6+Math.sin(t*30),0,TAU); ctx.fill(); }
  ctx.restore();
  if(o.lit) glowAt(x,y-6,40,'255,150,60',0.25);
};
function c2RubbleSpr(v,goal){ return c2Spr('rubble'+v+(goal?'g':''),52,50,(g)=>{
  const r=mulberry32(v*31+7), rocks=[[14,30,13],[34,31,14],[24,18,13],[40,17,9],[11,16,8]];
  for(const [rx,ry,rr] of rocks){ const a=rr*(0.85+r()*0.3), b=rr*(0.72+r()*0.2); g.fillStyle='#2e241c'; g.beginPath(); g.ellipse(rx+1,ry+2,a+2,b+2,r()*0.6,0,TAU); g.fill();
    g.fillStyle=['#8a7a6a','#7e6e5e','#958470'][Math.floor(r()*3)]; g.beginPath(); g.ellipse(rx,ry,a,b,r()*0.6,0,TAU); g.fill();
    g.fillStyle='rgba(255,245,225,.28)'; g.beginPath(); g.ellipse(rx-a*0.3,ry-b*0.35,a*0.45,b*0.3,0,0,TAU); g.fill();
    g.strokeStyle='rgba(40,30,20,.55)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(rx-a*0.2,ry-b*0.1); g.lineTo(rx+a*0.15,ry+b*0.25); g.lineTo(rx+a*0.4,ry+b*0.1); g.stroke(); }
  if(goal){ g.strokeStyle='#ffe066'; g.lineWidth=3.2; g.beginPath(); g.moveTo(17,15); g.lineTo(31,29); g.moveTo(31,15); g.lineTo(17,29); g.stroke(); g.strokeStyle='rgba(120,80,0,.6)'; g.lineWidth=1; g.stroke(); } }); }
C2TALL.rubble=(o,t)=>{ c2Blit(c2RubbleSpr(o.seed,o.goal),o.x,o.y-4,52,50); };
function c2CartSpr(full){ return c2Spr('cart'+(full?1:0),48,44,(g)=>{
  g.fillStyle='#2a2a30'; for(const wx of [11,37]) for(const wy of [36]){ g.beginPath(); g.arc(wx,wy,5.5,0,TAU); g.fill(); g.strokeStyle='#8a8e98'; g.lineWidth=1.5; g.stroke(); }
  g.fillStyle='#6e7280'; g.beginPath(); g.moveTo(4,12); g.lineTo(44,12); g.lineTo(40,36); g.lineTo(8,36); g.closePath(); g.fill(); g.strokeStyle=C2INK; g.lineWidth=2.6; g.stroke();
  g.fillStyle='#4a4e5a'; g.beginPath(); g.moveTo(7,14); g.lineTo(41,14); g.lineTo(39,20); g.lineTo(9,20); g.closePath(); g.fill();
  g.fillStyle='#8a8e9c'; g.fillRect(6,24,36,3); g.fillStyle='#c8ccd6'; for(const rx of [9,16,24,32,39]){ g.beginPath(); g.arc(rx,30,1.4,0,TAU); g.fill(); }
  g.fillStyle='#9aa0ae'; g.fillRect(4,10,40,4); g.strokeStyle=C2INK; g.lineWidth=1.8; g.strokeRect(4,10,40,4);
  if(full){ g.fillStyle='#5a4a3a'; for(const [ox,oy,rr] of [[14,13,6],[24,11,7],[34,13,6]]){ g.beginPath(); g.arc(ox,oy,rr,Math.PI,TAU); g.fill(); } } }); }
C2TALL.cart=(o,t)=>{
  const x=o.x, y=o.y, bob=o.mv?Math.sin(t*36)*1:0; c2Shadow(x+2,y+14,22,7,0.35);
  if(o.cargo&&!o.cargo.gone){ const b=o.cargo; ctx.save(); ctx.translate(x,y-15+bob); c2Blit(c2BarrelSpr(),0,0,36,42,0.78); if(b.lit){ glowAt(9,-16,14,'255,210,110',0.9); ctx.fillStyle='#fff6c8'; ctx.beginPath(); ctx.arc(9,-16,2.4,0,TAU); ctx.fill(); } ctx.restore(); }
  c2Blit(c2CartSpr(false),x,y-4+bob,48,44);
  if(o.pushK>0.05&&!o.mv){ ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,28,0,TAU*Math.min(1,o.pushK)); ctx.stroke(); }
};
C2TALL.lever=(o,t)=>{ drawFurnX({k:'lever',x:o.x,y:o.y+4,on:o.on},t); if(o.role&&o.role.lift){ ctx.fillStyle='#e8c870'; ctx.strokeStyle=C2INK; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(o.x+15,o.y-2,5,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle=C2INK; ctx.beginPath(); ctx.moveTo(o.x+15,o.y-5); ctx.lineTo(o.x+18,o.y); ctx.lineTo(o.x+12,o.y); ctx.closePath(); ctx.fill(); } };
C2TALL.reset=(o,t)=>{ drawFurnX({k:'resetstone',x:o.x,y:o.y},t); };
C2TALL.heart=(o,t)=>{
  const x=o.x, y=o.y, open=!!G.found[`c2_${AREA.def.id}_heart`]; c2Shadow(x+2,y+16,30,9,0.4);
  ctx.save(); ctx.translate(x,y-4);
  ctx.fillStyle='#7a3a1e'; rrect(ctx,-28,-12,56,30,6); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=2.6; ctx.stroke();
  ctx.fillStyle='#f0c040'; ctx.fillRect(-28,-2,56,4); ctx.fillRect(-4,-12,8,30);
  if(open){ ctx.fillStyle='#2a1208'; ctx.fillRect(-24,-10,48,10); ctx.fillStyle='#8a4a26'; rrect(ctx,-28,-30,56,14,5); ctx.fill(); ctx.stroke(); }
  else { ctx.fillStyle='#9a4a26'; rrect(ctx,-28,-24,56,16,7); ctx.fill(); ctx.strokeStyle=C2INK; ctx.stroke(); ctx.fillStyle='#f0c040'; ctx.fillRect(-28,-12,56,3);
    const pulse=0.5+0.5*Math.sin(t*3); ctx.fillStyle='#ff5a3a'; ctx.beginPath(); ctx.moveTo(0,-4); ctx.bezierCurveTo(-9,-12,-10,-20,-4,-21); ctx.bezierCurveTo(-1,-21,0,-19,0,-17); ctx.bezierCurveTo(0,-19,1,-21,4,-21); ctx.bezierCurveTo(10,-20,9,-12,0,-4); ctx.fill(); ctx.strokeStyle='#5a1408'; ctx.lineWidth=1.6; ctx.stroke();
    glowAt(0,-12,60,'255,150,90',0.25+0.2*pulse); }
  ctx.restore();
};
C2FLOOR.station=(o,t)=>{
  const L=o.lift, M=L.move, cs=c2cs(), x=o.x, y=o.y;
  // ropes and the pulley beam
  ctx.strokeStyle='#5a3a20'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(x-cs,y-cs-4); ctx.lineTo(x+cs,y-cs-4); ctx.stroke();
  ctx.fillStyle='#8a6a42'; ctx.strokeStyle=C2INK; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y-cs-6,8,0,TAU); ctx.fill(); ctx.stroke();
  let here=L.at===o.side&&!M, sc=1, dy=0, dark=0;
  if(M){ const k=clamp(M.t/M.dur,0,1), up=L.L.up===o.side;
    if(M.from===o.side&&k<0.5){ here=true; const q=k/0.5; if(up){ sc=1-0.35*q; dark=q*0.8; } else { dy=-q*70; dark=q*0.6; } }
    else if(M.to===o.side&&k>=0.5){ here=true; const q=(1-k)/0.5; if(up){ sc=1-0.35*q; dark=q*0.8; } else { dy=-q*70; dark=q*0.6; } } }
  ctx.strokeStyle='rgba(200,170,120,.8)'; ctx.lineWidth=1.6; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x+s*cs*0.8,y-cs-4); ctx.lineTo(x+s*cs*0.8*sc,y+dy-cs*0.8*sc); ctx.stroke(); }
  if(!here){ for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x+s*cs*0.8,y-cs-4); ctx.lineTo(x+s*cs*0.8,y+cs*0.6); ctx.stroke(); } return; }
  ctx.save(); ctx.translate(x,y+dy); ctx.scale(sc,sc);
  const w=cs*1.84, h=cs*1.84;
  ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(-w/2+4,-h/2+6,w,h);
  ctx.fillStyle='#a07848'; ctx.fillRect(-w/2,-h/2,w,h); ctx.strokeStyle='rgba(60,36,18,.6)'; ctx.lineWidth=1.5; for(let i=1;i<6;i++){ ctx.beginPath(); ctx.moveTo(-w/2,-h/2+i*h/6); ctx.lineTo(w/2,-h/2+i*h/6); ctx.stroke(); }
  ctx.strokeStyle=C2INK; ctx.lineWidth=2.6; ctx.strokeRect(-w/2,-h/2,w,h);
  ctx.strokeStyle='#5a3a20'; ctx.lineWidth=4; ctx.strokeRect(-w/2+3,-h/2+3,w-6,h-6);
  ctx.fillStyle='#3a3a44'; for(const [px,py] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ ctx.beginPath(); ctx.arc(px*(w/2-6),py*(h/2-6),4,0,TAU); ctx.fill(); }
  if(dark>0){ ctx.fillStyle=`rgba(0,0,0,${dark})`; ctx.fillRect(-w/2,-h/2,w,h); }
  ctx.restore();
  if(L.at===o.side&&!M&&L.on&&c2OnCage(L,o.side)&&!c2Lock()) glowAt(x,y,cs*1.2,'255,220,150',0.12+0.06*Math.sin(t*4));
};
const c2Lock=()=>AREA&&AREA.c2&&AREA.c2.lock;
C2FLOOR.chute=(o,t)=>{ const x=o.x, y=o.y-c2cs()*0.5; ctx.fillStyle='#1a120c'; ctx.beginPath(); ctx.ellipse(x,y,18,10,0,Math.PI,TAU); ctx.fill(); ctx.strokeStyle='#6a4a2c'; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(x,y,20,12,0,Math.PI,TAU); ctx.stroke(); ctx.fillStyle='#e8c040'; for(let i=-2;i<=2;i++) if(i%2===0) ctx.fillRect(x+i*7-3,y-1,6,4); };
C2FLOOR.plate=(o,t)=>{ drawFurnX({k:'plate',x:o.x,y:o.y,pressed:o.pressed},t); };
// the rail switch shows which way it points
C2CELLDRAW.push((A,Z,c,cs,i0,j0,i1,j1,t)=>{ if(Z.hasJunc==null) Z.hasJunc=Z.rail.includes(3); if(!Z.hasJunc) return;
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i; if(Z.rail[k]!==3) continue; const J=c2Junc(k); if(!J) continue; const x=c2X(i), y=c2Y(j);
    const [sx,sy]=C2DIR[J.set]; ctx.strokeStyle='#ffe066'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+sx*cs*0.46,y+sy*cs*0.46); ctx.stroke();
    ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(x+sx*cs*0.5,y+sy*cs*0.5); ctx.lineTo(x+sx*cs*0.3-sy*7,y+sy*cs*0.3+sx*7); ctx.lineTo(x+sx*cs*0.3+sy*7,y+sy*cs*0.3-sx*7); ctx.closePath(); ctx.fill();
    const off=J.br.find(b=>b!==J.set), [ox,oy]=C2DIR[off]; ctx.strokeStyle='#e8402a'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x+ox*cs*0.38-oy*12,y+oy*cs*0.38-ox*12); ctx.lineTo(x+ox*cs*0.38+oy*12,y+oy*cs*0.38+ox*12); ctx.stroke(); } });

// ---------- boss damage helpers: a weak spot multiplies hits (e.c2mul), and the boss bar names come from EDEF
{ const base=damageEnemy; damageEnemy=function(e,amt,o){ if(e&&e.c2mul&&e.c2mul!==1) amt*=e.c2mul; return base(e,amt,o); }; }
{ const base=drawEnemy; drawEnemy=function(e){ const f=C2FOEDRAW[e.type]; if(f){ ctx.save(); ctx.globalAlpha=(e.spawnIn>0?1-e.spawnIn/0.2:1)*(e.alpha==null?1:e.alpha); f(e,e.flash>0); ctx.restore(); const topY=(T3.on&&e._t3top!=null)?e._t3top:e.y-e.r; if(e.stun>0){ for(let i=0;i<3;i++){ const a=G.time*5+i*TAU/3; ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.arc(e.x+Math.cos(a)*e.r*0.8,topY-4+Math.sin(a)*3,2.4,0,TAU); ctx.fill(); } } return; } return base(e); }; }
const C2FOEDRAW={};
// draw a foe bigger than its usual art, scaled around where it stands
function c2Big(e,k,fn){ ctx.save(); ctx.translate(e.x,e.y); ctx.scale(k,k); ctx.translate(-e.x,-e.y); fn(); ctx.restore(); }

// ---------- the Drakeling Matriarch: circles high (out of reach), dives low, perches to lay eggs.
// A barrel blast while she is low knocks her out of the air: she sits stunned and takes double damage.
Object.assign(EDEF,{c2_matriarch:{r:30,hp:240,speed:175,dmg:13,value:320,flying:true,mini:true,kbRes:0.15,name:'The Drakeling Matriarch',title:'Queen of the Coppergulch nest',short:'Queen of the nest'}});
DCOL.c2_matriarch='255,150,80';
C2BOSSINIT.c2_matriarch=(e,R)=>{ e.state='circle'; e.st=2.5; e.cyc=0; e.invuln=true; e.ang=0; e.elite=false; };
AI.c2_matriarch=(e,dt)=>{
  const p=player, A=AREA, R=A&&A.rooms&&A.rooms[e.room]; if(!R) return; const arena=e.arena, cx=arena.cx, cy=arena.cy;
  const angry=e.hp<e.maxHp*0.5; if(angry&&!e.angry){ e.angry=true; taunt('narr',S('The Matriarch screeches. Her eggs rattle in the nest!','She screeches! Eggs rattle!')); }
  e.cd-=dt; e.st-=dt; e.dx=e.dy=0; e.c2mul=1; e.invuln=false;
  switch(e.state){
    case 'circle':{ e.invuln=true; e.ang+=dt*(angry?1.4:1.1); const tx=cx+Math.cos(e.ang)*300, ty=cy-40+Math.sin(e.ang)*130; steer(e,tx,ty,e.speed*1.2); e.face=angTo(e.x,e.y,tx,ty);
      if(e.cd<=0){ e.cd=angry?1.0:1.4; const a=angTo(e.x,e.y,p.x,p.y); shoot(e.x,e.y,a,250,9,e.dmg*0.8,'fireball','enemy',{life:2.6}); SFX.play('cast',0.5); }
      if(e.st<=0){ e.cyc++; if(e.cyc%2===0){ e.state='perchGo'; e.perch=pick(R.perches||[[7,1],[23,1]]); e.st=3; } else { e.state='aim'; e.st=angry?0.6:0.8; e.tele=newTele({shape:'line',len:520,w:e.r*1.6,dur:e.st}); } }
      break; }
    case 'aim': e.face=turnTo(e.face,angTo(e.x,e.y,p.x,p.y),6*dt); if(e.st<=0){ e.tele=null; e.state='charge'; e.st=0.62; e.hitP=false; } break;
    case 'charge': e.dx=Math.cos(e.face)*540; e.dy=Math.sin(e.face)*540; if(!e.hitP&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4){ if(hurtPlayer(e.dmg,e.x,e.y,260)) e.hitP=true; } if(e.st<=0||e.hitWall){ toRecover(e,angry?0.6:0.9); } break;
    case 'recover': steer(e,cx,cy,60); if(e.st<=0){ e.state=angry&&Math.random()<0.5?'aim':'circle'; e.st=e.state==='aim'?0.6:rand(3,4.2); if(e.state==='aim') e.tele=newTele({shape:'line',len:520,w:e.r*1.6,dur:0.6}); } break;
    case 'perchGo':{ const tx=R.x0+(e.perch[0]+0.5)*A.cave.cell, ty=R.y0+(e.perch[1]+0.5)*A.cave.cell; steer(e,tx,ty,e.speed*1.1); e.face=angTo(e.x,e.y,tx,ty); if(dist(e.x,e.y,tx,ty)<20||e.st<=0){ e.state='perch'; e.st=angry?2.6:3.2; e.laid=0; } break; }
    case 'perch': e.face=turnTo(e.face,Math.PI/2,4*dt);
      if(e.laid<(angry?2:1)&&e.st<(angry?2.2:2.6)-e.laid*0.6){ e.laid++; const ex=e.x+rand(-40,40), ey=e.y+50; const g=makeEnemy('egg',ex,ey,{level:e.level-1,hatch:5,camp:A.camp||null,aggro:true}); g.inArea=true; g.room=e.room; R.enemies.push(g); if(A.camp) A.camp.alive++; SFX.play('pop'); }
      if(e.st<=0){ e.state='circle'; e.st=rand(3.2,4.4); } break;
    case 'downed': e.c2mul=2; e.flying=false; if(e.st<=0){ e.flying=true; e.state='circle'; e.st=3; taunt('narr',S('The Matriarch shakes off the soot and takes to the air.','She flies up again!')); } break;
    default: e.state='circle'; e.st=2;
  }
  if(e.state!=='downed') e.flying=true;
  arenaClamp(e,40);
};
C2BOSSBLAST.c2_matriarch=(e,x,y)=>{
  if(e.state==='circle'||e.state==='perchGo'&&e.st>2.2){ ftext(e.x,e.y-e.r-10,S('Too high!','Too high!'),'#ffe0b0',13); return; }
  e.invuln=false; damageEnemy(e,e.maxHp*0.12,{src:'blast',kb:200,ka:angTo(x,y,e.x,e.y)});
  if(e.dead) return; e.state='downed'; e.st=3.8; e.tele=null; e.flying=false; shake(8); setBanner(S('Knocked down!','Knocked down!'),S('Hit her while she is dizzy!','Hit her now!'),1.8);
};
C2FOEDRAW.c2_matriarch=(e,fl)=>{
  const high=e.state==='circle';
  if(high){ ctx.globalAlpha*=0.92; }
  if(T3.on&&typeof foDrake==='function') foDrake(e,fl,false); else drawDrake(e,2.3,fl,true);
  if(e.state==='downed'){ ctx.strokeStyle='rgba(255,230,120,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(e.x,e.y+8,e.r*1.3,e.r*0.5,0,0,TAU); ctx.stroke(); }
};

// ================= Coppergulch Mine: the map
// Level 1 (the Upper Works) ma mb mc; Level 2 (the Drifts) md me mf mg mh mi; Level 3 (the Deep Seam) mj mk ml mm mn mp.
// Lifts: L1 mb-md, L2 mh-mj (cave-in at the bottom), L3 mm-ma (Gorran's Express, powered from the bottom).
c2Cave('mine',{rooms:{
  ma:{at:[1,4],kind:'start',lvl:1,sign:S(`COPPERGULCH MINE. Level 1: the Upper Works. Lifts go down to the Drifts and the Deep Seam. DANGER: LIZARDS. Signed, Gorran.`,`COPPERGULCH MINE. Lifts go down. Watch out for lizards! Gorran.`),
    signs:[S(`GORRAN'S EXPRESS. Straight up from the Deep Seam. It only runs once someone pulls the lever at the bottom.`,`GORRAN'S EXPRESS. Pull the lever at the bottom first.`)],
    levers:[{lift:'L3'}],
    lay:['#*...........*#',
         '...........ee..',
         '...#.......ee..',
         '...........?.y.',
         '...............',
         '...............',
         '...............',
         '...#.......#...',
         '...............',
         '.s.............',
         '##...........##']},
  mb:{at:[2,4],kind:'free',lvl:1,sign:S(`RED BARRELS GO BOOM. Breathe fire on one, then RUN. The boom breaks crumbly rocks.`,`RED BARRELS GO BOOM. Breathe fire on one. Then run!`),
    signs:[S(`LIFT. Pull the lever to call the cage. Stand on the cage and press E to ride.`,`LIFT. Pull the lever. Stand on it. Press E.`)],
    levers:[{lift:'L1'}], intro:[['ash',S(`Red barrels, a little flame on each one. What could possibly go wrong?`,`Red barrels. What could go wrong?`)]],
    lay:['......#........',
         '.*....#....*...',
         '......#..ee....',
         '......#..ee....',
         '.....o#....y...',
         '......x........',
         '......#........',
         '......#.....?..',
         '......#........',
         '.s....#........',
         '......#........']},
  mc:{at:[0,4],kind:'fight',lvl:1,foes:[['kobold',3],['bat',2]],loot:['chest'],
    lay:['...............',
         '.*...........*.',
         '...##.....##...',
         '...#.......#...',
         '...............',
         '.......X.......',
         '...............',
         '...#.......#...',
         '...##.....##...',
         '.*...........*.',
         '...............']},
  md:{at:[1,3],kind:'free',lvl:2,tint2:'rgba(30,18,8,.18)',sign:S(`Level 2: the Drifts. Barrels roll! Push one and it keeps going until it bumps into something.`,`Level 2. Barrels roll until they bump into something.`),
    levers:[{lift:'L1'}],
    lay:['...............',
         '.*....ee....*..',
         '......ee.y.....',
         '...............',
         '.............x.',
         '..o..........x.',
         '.............x.',
         '...............',
         '...#.......#...',
         '.s...........$.',
         '...............']},
  mf:{at:[0,3],kind:'fight',lvl:2,tint2:'rgba(30,18,8,.18)',foes:[['drakeling',3],['egg',3]],loot:['ore'],
    lay:['...............',
         '.*.#.......#.*.',
         '...#...........',
         '...#...........',
         '...............',
         '...............',
         '...............',
         '...#.......#...',
         'xxx#.......#...',
         '12x............',
         '..x......o.....']},
  me:{at:[2,3],kind:'fight',lvl:2,tint2:'rgba(30,18,8,.18)',foes:[['bat',3]],cartDir:'n',levers:[{recall:'c2_mine_me_c7_5'}],sign:S(`ORE CARTS. Stand next to one and press E to ride. Keep your tail in. The bell lever calls the cart back.`,`ORE CART. Press E to ride! The lever calls it back.`),
    lay:['.......=.......',
         '.*.....=.....*.',
         '.......=.......',
         '...#...=...#...',
         '.......=.......',
         '.......c.......',
         '.......=.y.....',
         '...#.......#...',
         '...............',
         '.s.............',
         '...............']},
  mg:{at:[2,2],kind:'free',lvl:2,tint2:'rgba(30,18,8,.22)',
    lay:['..____.........',
         '..____...*.....',
         '..____.........',
         '..____.........',
         '..____.........',
         '==%%%%==.......',
         '..____.=.......',
         '..____.=.......',
         '..____.=....*..',
         '..____.=.......',
         '..____.=.......']},
  mh:{at:[1,2],kind:'free',lvl:2,tint2:'rgba(30,18,8,.22)',sign:S(`CAVE-IN AT THE BOTTOM! The cage cannot get out down there. Send something LOUD down first. (Signed, Gorran, who learned this the hard way.)`,`CAVE-IN DOWN THERE! Send a boom down first.`),
    levers:[{lift:'L2'},{recall:'c2_mine_me_c7_5'}], intro:[['ash',S(`A lift to the Deep Seam. And a sign about a cave-in. And a pile of barrels. I think I see where this is going.`,`A lift, a cave-in, and barrels. I get it!`)]],
    lay:['...............',
         '.*..........*..',
         '...ee..........',
         '...eey.........',
         '...............',
         '..........=====',
         '...........y...',
         '...............',
         '...o..o.o......',
         '.s...........$.',
         '...............']},
  mi:{at:[0,2],kind:'c2',goal:'rubble',reward:'key',lvl:2,tint2:'rgba(30,18,8,.22)',hint:S(`The old powder vault door is shut tight.`,`The door is shut.`),
    sign:S(`THE POWDER STORE. The vault door is up on the ledge. Light a barrel and send it out along the rails. One boom sets off the next one. Gorran calls it "the boom parade".`,`Light a barrel. Push it out on the rails. One boom makes the next!`),
    lay:['##wo..o..o..o.#',
         '____________%__',
         '____________%__',
         '____________%__',
         '____________%__',
         '............=..',
         '............=..',
         '............=..',
         '............o..',
         '.$.............',
         '.s....X........']},
  mj:{at:[1,1],kind:'free',lvl:3,tint2:'rgba(20,16,44,.26)',levers:[{lift:'L2'}],
    intro:[['ash',S(`Rocks all around the cage. Good thing I sent the boom first. I DID send the boom first, right?`,`Rocks everywhere. Good thing I sent a boom!`)]],
    lay:['...............',
         '.*...........*.',
         '...............',
         '......xxxx.....',
         '......xeex.y...',
         '......xeex.....',
         '......xxxx.....',
         '...............',
         '...#.......#...',
         '.s.............',
         '...............']},
  mk:{at:[0,1],kind:'c2',goal:'rubble',lvl:3,tint2:'rgba(20,16,44,.26)',foes:[['kobold',3]],junction:'s',levers:[{sw:1}],
    hint:S(`A great stone door with a drakeling carved on it. NEST. KEEP SHUT. Its counterweight is jammed by rocks somewhere west of here.`,`A big door. Rocks jam it, somewhere west.`),
    sign:S(`BOMB CARTS. Roll a barrel into the cart, light it, then push the cart. The rail switch picks the way.`,`Put a barrel in the cart. Light it. Push! The switch picks the way.`),
    lay:['.......=.......',
         '.......=.......',
         '.......=.......',
         '..y....=.......',
         '.......=.......',
         '.c=====+.......',
         '.......=.......',
         '.......=.......',
         '.......=.......',
         '......www......',
         '.s...........$.']},
  mn:{at:[0,0],kind:'secret',lvl:3,tint2:'rgba(20,16,44,.26)',loot:['rock'],
    lay:['...............',
         '.*...........*.',
         '..1.......1....',
         '...............',
         '....2..........',
         '...............',
         '..........1....',
         '...............',
         '...............',
         '...............',
         '...............']},
  ml:{at:[1,0],span:[2,1],kind:'boss',lvl:3,tint2:'rgba(30,14,30,.24)',boss2:{type:'c2_matriarch',name:S('The Drakeling Matriarch','The Lizard Queen')},perches:[[7,1],[15,1],[23,1]],
    winText:S('The nest is quiet. The way east is open.','The way east is open.'),
    lay:['...............................',
         '.*....##.......*.......##....*.',
         '...............................',
         '...............A...............',
         '...............................',
         '.....#......o.......o....#.....',
         '...............................',
         '...............................',
         '.o...........................o.',
         '.O.....#...............#.....O.',
         '...............................']},
  mm:{at:[3,0],kind:'treasure',lvl:3,tint2:'rgba(20,16,44,.26)',loot:['qitem'],levers:[{lift:'L3',power:1}],
    sign:S(`GORRAN'S EXPRESS. Pull the lever and it runs all the way up to the mine mouth.`,`Pull the lever. It goes up to the start.`),
    lay:['...............',
         '.*....Q......*.',
         '...............',
         '...ee.....H....',
         '...ee.y........',
         '...............',
         '...............',
         '...............',
         '...#.......#...',
         '.s...........*.',
         '...............']},
  mp:{at:[2,1],kind:'fight',lvl:3,tint2:'rgba(20,16,44,.26)',foes:[['drakeling',2],['kobold',2]],loot:['chest','page:p5'],
    lay:['...............',
         '.*...........*.',
         '...##.....##...',
         '...#...G...#...',
         '...............',
         '.......X.......',
         '...............',
         '...#.......#...',
         '...##.....##...',
         '.*...........*.',
         '...............']}},
  links:[['ma','mc','open'],['ma','mb','open'],['md','mf','open'],['md','me','open'],['me','mg','open'],['mg','mh','open'],['mh','mi','open'],
    ['mj','mk','open'],['mj','mp','lock'],['mj','ml','gate:mk',{at:1}],['ml','mm','gate:ml'],['mk','mn','crack']]},
  {dark:0.5,levels:[S('Level 1: the Upper Works','Level 1'),S('Level 2: the Drifts','Level 2'),S('Level 3: the Deep Seam','Level 3')],
   lifts:[{id:'L1',a:'mb',b:'md',up:'a',at:'b'},{id:'L2',a:'mh',b:'mj',up:'a',at:'a'},
     {id:'L3',a:'ma',b:'mm',up:'a',at:'b',power:'c2_mine_L3',offText:S(`GORRAN'S EXPRESS is switched off. A note: "Only runs from the bottom. Pull the lever down there first."`,`It is switched off. Pull the lever at the bottom first.`)}]});
CAVE_SECRETS=countCaveSecrets();

// ================= Sunken Grotto pieces: logs, bubble vents, mooring posts, whirlpools, clams
// Logs are three cells long (two or one at a pinch). A log on land is heavy: each push moves it one cell; once it is
// all on water it floats and glides on until it bumps into something. Floating logs are rafts Ash can stand on.
// Currents carry floating logs (and whoever stands on them). A whirlpool pulls in a log that comes near: it sinks and
// pops up again at its start, or at the outlet vent of another room (room field whirlTo). An open bubble vent under a
// log holds it still (an anchor), lifts a sunken log to the surface, and a pulsing vent lets its log sink again.
// A mooring post holds its log until the rope is cut (claws, arrows, fire).
C2MAKE.log=(A,def,R,m)=>{ (A.c2._lm=A.c2._lm||[]).push(m); if(m.opt2) c2VentMake(A,R,m,m.opt2); return null; };
C2MAKE.vent=(A,def,R,m)=>c2VentMake(A,R,m,m.opt);
C2MAKE.post=(A,def,R,m,k)=>{ const o=c2Obj(A,R,m,'post',{solid:1,tall:1,rope:true,r:14}); A.c2.occ.set(k,o); return o; };
C2MAKE.clam=(A,def,R,m,k)=>{ const Z=A.c2; const o=c2Obj(A,R,m,'clam',{solid:1,tall:1,n:Z.clams.length,t:0,r:18}); Z.occ.set(k,o); Z.clams.push(o); return o; };
function c2VentMake(A,R,m,how){
  const Z=A.c2, pl=R.pulse||[], np=Z.vents.filter(v=>v.room===R.id&&v.pulse).length;
  const o=c2Obj(A,R,m,'vent',{id:`c2_${A.def.id}_${R.id}_v${m.c}_${m.r}`,clog:how==='clog'&&!G.found[`c2_${A.def.id}_${R.id}_v${m.c}_${m.r}`],pulse:how==='pulse'?(pl[np]||[3,2.5,np*1.2]):null,outlet:how==='outlet',on:false,heat:0,r:16});
  Z.vents.push(o); return o;
}
C2POST.push((A,def)=>{
  const Z=A.c2, ms=Z._lm||[]; delete Z._lm; if(!ms.length&&!Z.vents.length) return;
  const at=new Map(ms.map(m=>[m.i+','+m.j,m])), used=new Set(), st=m=>m.opt==='beach'?'beach':m.opt==='sunk'?'sunk':'float';
  const free=(i,j,s)=>{ const q=at.get(i+','+j); return q&&!used.has(q)&&st(q)===s?q:null; };
  for(const m of ms){ if(used.has(m)) continue; const s=st(m);
    let cells=[m], h=true;
    const e1=free(m.i+1,m.j,s), e2=e1&&free(m.i+2,m.j,s), s1=free(m.i,m.j+1,s), s2=s1&&free(m.i,m.j+2,s);
    if(e1&&e2) cells=[m,e1,e2]; else if(s1&&s2){ cells=[m,s1,s2]; h=false; } else if(e1) cells=[m,e1]; else if(s1){ cells=[m,s1]; h=false; }
    for(const q of cells) used.add(q);
    const R=A.rooms[m.room];
    const o=c2Obj(A,R,m,'log',{id:`c2_${def.id}_${m.room}_log${m.c}_${m.r}`,h,len:cells.length,state:s,home:s,mv:null,glide:null,moored:null,dt2:0,t:0,solid:s==='beach'?1:0});
    c2LogPos(o); c2LogMark(o,true); Z.logs.push(o);
  }
  // each sunken log remembers the vent under it; each post ties up the log next to it
  for(const o of Z.logs){ const ks=c2LogCells(o); o.vent=Z.vents.find(v=>ks.includes(v.cj*A.cave.w+v.ci))||null; }
  for(const q of Z.list){ if(q.kind!=='post') continue; const k=q.cj*A.cave.w+q.ci, w=A.cave.w;
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1]]){ const n=k+dx+dy*w; const L=Z.logs.find(o=>!o.moored&&c2LogCells(o).includes(n)); if(L){ L.moored=q; q.log=L; break; } } }
});
function c2LogCells(o){ const w=AREA.cave.w, out=[]; for(let s=0;s<o.len;s++) out.push((o.cj+(o.h?0:s))*w+o.ci+(o.h?s:0)); return out; }
function c2LogPos(o){ const cs=c2cs(); o.x=c2X(o.ci)+(o.h?(o.len-1)*cs/2:0); o.y=c2Y(o.cj)+(o.h?0:(o.len-1)*cs/2); }
// put the log into (or take it out of) the cell maps: rafts are platforms, beached logs are solid, sunken logs only block other logs
function c2LogMark(o,on){
  const Z=AREA.c2; if(!Z.sunk) Z.sunk=new Map();
  for(const k of c2LogCells(o)){
    if(!on){ if(Z.plat.get(k)===o) Z.plat.delete(k); if(Z.occ.get(k)===o) Z.occ.delete(k); if(Z.sunk.get(k)===o) Z.sunk.delete(k); continue; }
    if(o.state==='beach') Z.occ.set(k,o); else if(o.state==='sunk'||o.state==='rising') Z.sunk.set(k,o); else if(o.state!=='gone') Z.plat.set(k,o);
  }
  o.solid=o.state==='beach'?1:0;
}
const c2LogWet=kd=>kd==='water'||kd==='current'||kd==='whirl';
// can the log move one cell in direction d? (beached logs may also slide over plain floor)
function c2LogCan(o,d){
  const A=AREA, Z=A.c2, c=A.cave, [dx,dy]=C2DIR[d], w=c.w, mine=new Set(c2LogCells(o)), p=player, pk=c2K(p.x,p.y);
  let allWet=true;
  for(const k0 of mine){ const k=k0+dx+dy*w; if(mine.has(k)) continue; if(k<0||c.grid[k]===1||Z.door[k]===2) return null; if(c.dyn&&caveBlockedAt(k)) return null;
    const q=Z.occ.get(k)||Z.plat.get(k)||(Z.sunk&&Z.sunk.get(k)); if(q&&q!==o) return null;
    const kd=c2Kind(k);
    if(o.state==='beach'){ if(k===pk&&!airborne()) return null; if(!(kd==='floor'||c2LogWet(kd))) return null; }
    else if(!c2LogWet(kd)) return null;
  }
  for(const k0 of mine){ const k=k0+dx+dy*w; if(!c2LogWet(c2Kind(k))) allWet=false; }
  return {allWet};
}
function c2LogUnder(){ const Z=AREA.c2, p=player; if(airborne()) return null; const q=Z.plat.get(c2K(p.x,p.y)); return q&&q.kind==='log'?q:null; }
function c2LogGo(o,d,spd){
  const ok=c2LogCan(o,d); if(!ok) return false;
  const rider=c2LogUnder()===o, old=c2LogCells(o), was=o.state;
  const fx=o.x, fy=o.y; o.ci+=C2DIR[d][0]; o.cj+=C2DIR[d][1];
  if(o.state==='beach'&&ok.allWet){ o.state='float'; o.glide=d; SFX.play('pop',0.5); G.ripples.push({x:o.x,y:o.y,t:0,max:0.9,r:30,splash:true}); }
  // while it moves the log holds both its old and its new cells
  if(was!==o.state){ const Z=AREA.c2; for(const k of old){ if(Z.occ.get(k)===o) Z.occ.delete(k); Z.plat.set(k,o); } }
  c2LogMark(o,true); c2LogPos(o); const tx=o.x, ty=o.y; o.x=fx; o.y=fy;
  o.mv={d,spd,f:0,fx,fy,tx,ty,rider,old};
  return true;
}
function c2LogSettle(o,old){ const Z=AREA.c2, now=new Set(c2LogCells(o)); for(const k of old){ if(now.has(k)) continue; if(Z.plat.get(k)===o) Z.plat.delete(k); if(Z.occ.get(k)===o) Z.occ.delete(k); } }
C2PUSH.log=(o,d)=>{ if(o.state!=='beach'||o.mv) return; if(c2LogGo(o,d,4.5)) SFX.play('roll',0.6); else SFX.play('block',0.4); };
function c2LogAnchored(o){ const ks=c2LogCells(o); return AREA.c2.vents.some(v=>v.on&&ks.includes(v.cj*AREA.cave.w+v.ci)); }
// the currents under a log, centre first
function c2LogFlows(o){ const Z=AREA.c2, c=AREA.cave, ks=c2LogCells(o), mid=ks[Math.floor(ks.length/2)], out=[]; for(const k of [mid,...ks]){ if(c.typ[k]===C2.T.current&&Z.flow[k]>=0&&!out.includes(Z.flow[k])) out.push(Z.flow[k]); } return out; }
function c2LogWhirl(o){ const A=AREA, c=A.cave, w=c.w; for(const k of c2LogCells(o)){ const i=k%w, j=(k-i)/w; for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const q=(j+dj)*w+i+di; if(q>=0&&c.typ[q]===C2.T.whirl) return q; } } return -1; }
C2UPD.log=(o,dt)=>{
  const A=AREA, Z=A.c2, p=player;
  if(o.state==='gone'){ o.t-=dt; if(o.t<=0) c2LogBack(o); return; }
  if(o.state==='suck'){ o.t-=dt; o.spin=(o.spin||0)+dt*8; const [wi,wj]=c2IJ(o.wk); o.x+=(c2X(wi)-o.x)*Math.min(1,dt*3); o.y+=(c2Y(wj)-o.y)*Math.min(1,dt*3);
    if(c2LogUnder()===o||o.riderSuck){ o.riderSuck=false; if(c2LogUnder()===o) c2Hazard('whirl'); }
    if(Math.random()<dt*20) emit(o.x+rand(-20,20),o.y+rand(-14,14),1,{col:'200,235,220',glow:false,smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.5,zmax:3});
    if(o.t<=0){ o.state='gone'; o.t=1.3; c2LogMark(o,false); SFX.play('pop'); } return; }
  if(o.mv){ const m=o.mv; m.f+=m.spd*dt; const k=Math.min(1,m.f), nx=lerp(m.fx,m.tx,k), ny=lerp(m.fy,m.ty,k);
    if(m.rider&&!Z.lock&&!airborne()){ if(Z.plat.get(c2K(p.x,p.y))===o){ const ox=p.x, oy=p.y; p.x+=nx-o.x; p.y+=ny-o.y; const q=c2K(p.x,p.y); if(q<0||A.cave.grid[q]===1||Z.occ.get(q)){ p.x=ox; p.y=oy; } } else m.rider=false; }
    o.x=nx; o.y=ny; if(k<1) return; o.mv=null; c2LogSettle(o,m.old);
    const wk=c2LogWhirl(o); if(wk>=0&&o.state==='float'){ o.state='suck'; o.t=0.9; o.wk=wk; SFX.play('roll'); if(c2LogUnder()===o) setBanner(S('The whirlpool!','Whirlpool!'),S('It pulls you under and spits you out.','It spits you out!'),1.6); return; }
    if(c2LogAnchored(o)){ o.glide=null; return; }
    if(o.glide!=null&&!c2LogGo(o,o.glide,6)){ o.glide=null; SFX.play('block',0.3); }
    return; }
  if(o.state==='rising'){ o.t-=dt; if(o.t<=0){ c2LogMark(o,false); o.state='float'; c2LogMark(o,true); } return; }
  if(o.state==='sinking'){ o.t-=dt; if(o.t<=0){ const was=c2LogUnder()===o; c2LogMark(o,false); o.state='sunk'; c2LogMark(o,true); if(was) c2Hazard('water'); } else if(o.vent&&o.vent.on){ o.state='float'; } return; }
  if(o.state==='sunk'){ if(o.vent&&o.vent.on){ o.state='rising'; o.t=0.6; SFX.play('pop',0.6); emit(o.x,o.y,14,{col:'210,240,230',glow:false,ang:-Math.PI/2,spread:1.2,smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } return; }
  if(o.state!=='float') return;
  if(o.vent&&o.vent.pulse&&!o.vent.on){ o.state='sinking'; o.t=0.45; return; }
  if(o.moored&&o.moored.rope) return;
  if(c2LogAnchored(o)) return;
  const wk=c2LogWhirl(o); if(wk>=0){ o.state='suck'; o.t=0.9; o.wk=wk; return; }
  o.dt2+=dt; if(o.dt2<0.06) return; o.dt2=0;
  for(const d of c2LogFlows(o)) if(c2LogGo(o,d,3.2)) break;
};
// back from the whirlpool: to the outlet vent of the room it drains into, or home again
function c2LogBack(o){
  const A=AREA, Z=A.c2, R=A.rooms[o.room0||o.room], to=R&&R.whirlTo;
  o.room0=o.room0||o.room;
  const tryAt=(ci,cj,state)=>{ const sv={ci:o.ci,cj:o.cj,state:o.state}; o.ci=ci; o.cj=cj; o.state=state; const ok=c2LogCells(o).every(k=>{ const kd=c2Kind(k); return (c2LogWet(kd)||(state==='beach'&&kd==='floor'))&&!Z.occ.get(k)&&!Z.plat.get(k)&&!(Z.sunk&&Z.sunk.get(k))&&k!==c2K(player.x,player.y); }); if(!ok){ o.ci=sv.ci; o.cj=sv.cj; o.state=sv.state; } return ok; };
  const out=to&&Z.vents.find(v=>v.outlet&&v.room===to);
  if(out&&tryAt(out.ci-(o.h?Math.floor(o.len/2):0),out.cj-(o.h?0:Math.floor(o.len/2)),'rising')){ o.room=to; o.t=0.6; c2LogMark(o,true); c2LogPos(o); emit(o.x,o.y,20,{col:'210,240,230',glow:false,ang:-Math.PI/2,spread:1.2,smin:40,smax:120,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); SFX.play('pop'); if(caveRoomAt(player.x,player.y)===A.rooms[to]) setBanner(S('Bloop!','Bloop!'),S('A log bobs up out of the spring.','A log pops up!'),1.6); return; }
  if(tryAt(o.hi,o.hj,o.home==='sunk'?'sunk':o.home)){ o.room=o.room0; c2LogMark(o,true); c2LogPos(o); if(o.moored) o.moored.rope=true; emit(o.x,o.y,14,{col:'210,240,230',glow:false,ang:-Math.PI/2,spread:1.2,smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); return; }
  o.t=0.8;
}
C2RESET.log=o=>{ if(c2LogUnder()===o||o.mv) return; c2LogMark(o,false); o.state='gone'; o.t=0.01; o.glide=null; const R=AREA.rooms[o.room0||o.room]; o.room=o.room0||o.room; const keep=R.whirlTo; R.whirlTo=null; c2LogBack(o); R.whirlTo=keep; };
C2UPD.vent=(o,dt)=>{
  const Z=AREA.c2, was=o.on;
  if(o.pulse){ const per=o.pulse[0]+o.pulse[1], ph=(Z.t+o.pulse[2])%per; o.on=!o.clog&&ph<o.pulse[0]; o.warn=o.on&&ph>o.pulse[0]-0.8; }
  else o.on=!o.clog;
  if(o.on&&Math.random()<dt*(o.warn?4:10)&&inView(o.x,o.y,60)) emit(o.x+rand(-10,10),o.y+rand(-6,6),1,{col:'225,250,240',glow:false,ang:-Math.PI/2,spread:0.5,smin:15,smax:40,lmin:.4,lmax:.8,zmin:1.5,zmax:2.6,rise:20});
  if(o.burstT>0){ o.burstT-=dt; }
};
function c2Unclog(o,how){ if(!o.clog) return; o.clog=false; G.found[o.id]=true; SFX.play('pop'); emit(o.x,o.y,18,how==='fire'?{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:5}:{col:'110,160,70',glow:false,smin:40,smax:140,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
  setBanner(S('Blub blub blub!','Bubbles!'),S('The weeds are gone. The vent bubbles again.','The vent bubbles!'),1.6); }
C2FIRE.vent=(o,dt)=>{ if(!o.clog) return; o.heat+=dt; if(Math.random()<0.4) emit(o.x+rand(-10,10),o.y,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:4}); if(o.heat>0.6) c2Unclog(o,'fire'); };
C2SWING.vent=o=>c2Unclog(o,'claw');
C2HIT.vent=(o,src)=>{ if(!o.clog) return false; if(src==='fire'){ c2Unclog(o,'fire'); return; } c2Unclog(o,'claw'); };
// mooring posts: cut the rope and the log is free
function c2CutRope(o){ if(!o.rope) return; o.rope=false; SFX.play('slash'); ftext(o.x,o.y-30,S('Snip!','Snip!'),'#ffe0a0',13); if(o.log) o.log.dt2=0.2; }
C2SWING.post=c2CutRope; C2HIT.post=o=>c2CutRope(o); C2FIRE.post=o=>c2CutRope(o);
C2ACT.post=o=>{ if(o.rope) c2Say(S(`A log is tied to this post. Cut the rope with your claws and the log floats free.`,`A log is tied here. Cut the rope!`)); };
// ---------- grotto art
const C2BARK=['#8a5a32','#7a4c28','#6a4022'];
function c2LogSpr(len,h){ return c2Spr('log'+len+(h?'h':'v'),h?len*48:40,h?40:len*48,(g,w,hh)=>{
  const L=h?w:hh, T=h?hh:w; g.save(); if(!h){ g.translate(T,0); g.rotate(Math.PI/2); }
  g.fillStyle='rgba(0,0,0,.25)'; rrect(g,6,T*0.5-8,L-10,22,10); g.fill();
  g.fillStyle=C2BARK[0]; rrect(g,4,4,L-8,T-10,14); g.fill(); g.strokeStyle=C2INK; g.lineWidth=2.6; g.stroke();
  g.fillStyle='rgba(255,220,170,.18)'; rrect(g,10,7,L-24,6,3); g.fill();
  g.strokeStyle='rgba(50,26,10,.55)'; g.lineWidth=1.6; for(let x=16;x<L-18;x+=13){ g.beginPath(); g.moveTo(x,9); g.quadraticCurveTo(x+5,T*0.45,x-2,T-10); g.stroke(); }
  g.fillStyle='#e8c890'; g.beginPath(); g.ellipse(L-10,T*0.5-3,7,T*0.5-7,0,0,TAU); g.fill(); g.strokeStyle=C2INK; g.lineWidth=2; g.stroke(); g.strokeStyle='#b88a50'; g.lineWidth=1.2; g.beginPath(); g.ellipse(L-10,T*0.5-3,4,T*0.5-12,0,0,TAU); g.stroke();
  g.fillStyle='#4a7a2a'; g.beginPath(); g.ellipse(L*0.35,8,6,3,0.4,0,TAU); g.fill(); g.restore(); }); }
C2FLOOR.log=(o,t)=>{
  if(o.state==='gone') return;
  const cs=c2cs(), w=o.h?o.len*cs:40, h=o.h?40:o.len*cs, s=c2LogSpr(o.len,o.h);
  let a=1, bob=0, sc=1, rot=0;
  if(o.state==='sunk'){ a=0.32; } else if(o.state==='rising'){ a=0.35+0.65*(1-o.t/0.6); } else if(o.state==='sinking'){ a=0.3+0.7*(o.t/0.45); bob=Math.sin(t*30)*2; }
  else if(o.state==='suck'){ sc=Math.max(0.2,o.t/0.9); rot=o.spin; a=sc; }
  else if(o.state==='float'){ bob=Math.sin(t*2.2+o.ci)*1.5; if(o.vent&&o.vent.warn) bob=Math.sin(t*26)*2.2; }
  ctx.save(); ctx.globalAlpha=a; ctx.translate(o.x,o.y+bob); if(rot) ctx.rotate(rot); if(sc!==1) ctx.scale(sc,sc);
  if(o.state==='float'||o.state==='beach'){ ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(3,8,w/2,h/2,0,0,TAU); ctx.fill(); }
  ctx.drawImage(s,-w/2,-h/2-2,w,h);
  ctx.restore();
  if(o.state==='float'&&(o.mv||o.glide!=null)&&Math.random()<0.4){ const e=o.h?w/2:h/2; G.ripples.push({x:o.x+rand(-e,e)*(o.h?1:0),y:o.y+rand(-e,e)*(o.h?0:1)+10,t:0,max:0.7,r:10}); }
  if(o.moored&&o.moored.rope){ const q=o.moored; ctx.strokeStyle='#d8c08a'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(q.x,q.y-14); ctx.quadraticCurveTo((q.x+o.x)/2,(q.y+o.y)/2+10,q.x+(o.x-q.x)*0.6,q.y+(o.y-q.y)*0.6); ctx.stroke(); }
};
C2TALL.post=(o,t)=>{ c2Shadow(o.x+2,o.y+10,9,4,0.3); ctx.fillStyle='#6a4426'; rrect(ctx,o.x-6,o.y-26,12,34,4); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#8a5e36'; ctx.beginPath(); ctx.ellipse(o.x,o.y-26,6,3,0,0,TAU); ctx.fill(); ctx.stroke(); if(o.rope){ ctx.strokeStyle='#d8c08a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(o.x-6,o.y-14); ctx.lineTo(o.x+6,o.y-12); ctx.stroke(); } };
C2FLOOR.vent=(o,t)=>{
  const x=o.x, y=o.y;
  if(o.clog){ for(let i=0;i<5;i++){ const a=i*1.26+Math.sin(t*1.5+i)*0.1; ctx.strokeStyle=i%2?'#4a7a2a':'#5e9a34'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x,y+6); ctx.quadraticCurveTo(x+Math.cos(a)*14,y+Math.sin(a)*6-6,x+Math.cos(a)*18,y+Math.sin(a)*10-14); ctx.stroke(); } ctx.fillStyle='#3a5a22'; ctx.beginPath(); ctx.ellipse(x,y+4,12,7,0,0,TAU); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=1.5; ctx.stroke(); return; }
  ctx.strokeStyle=o.outlet?'rgba(140,240,220,.7)':'rgba(220,250,240,.55)'; ctx.lineWidth=2;
  const on=o.on, k=on?1:0.35; for(let i=0;i<3;i++){ const q=((t*(on?0.9:0.3)+i/3)%1); ctx.globalAlpha=k*(1-q); ctx.beginPath(); ctx.ellipse(x,y,6+q*18,3+q*9,0,0,TAU); ctx.stroke(); } ctx.globalAlpha=1;
  if(on){ ctx.fillStyle='rgba(240,255,250,.85)'; for(let i=0;i<4;i++){ const q=(t*1.6+i*0.27)%1; ctx.beginPath(); ctx.arc(x+Math.sin(i*2.1+t*3)*7,y-q*20,1.6+q*2,0,TAU); ctx.fill(); } }
  if(o.pulse&&!on){ ctx.fillStyle='rgba(20,40,40,.5)'; ctx.beginPath(); ctx.arc(x,y,6,0,TAU); ctx.fill(); }
  if(o.burstT>0){ const q=1-o.burstT/0.9; ctx.fillStyle=`rgba(230,255,250,${0.7*(1-q)})`; ctx.beginPath(); ctx.ellipse(x,y-q*30,26+q*20,14+q*10,0,0,TAU); ctx.fill(); }
};
C2TALL.clam=(o,t)=>{ const x=o.x, y=o.y, open=o.t>0?Math.min(1,o.t*3):0.15+0.1*Math.sin(t*2+o.n); c2Shadow(x+2,y+10,18,6,0.3);
  const cols=[['#f08ab0','#a84a70'],['#8ab0f0','#3a5aa8'],['#f0d08a','#a8803a'],['#a8f08a','#4a9a3a']][o.n%4];
  ctx.fillStyle=cols[1]; ctx.beginPath(); ctx.ellipse(x,y+2,18,9,0,0,TAU); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=2; ctx.stroke();
  ctx.save(); ctx.translate(x,y-2); ctx.rotate(-open*0.8); ctx.fillStyle=cols[0]; ctx.beginPath(); ctx.moveTo(-18,2); ctx.quadraticCurveTo(0,-22,18,2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1.2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*5,0); ctx.lineTo(i*3,-12); ctx.stroke(); } ctx.restore();
  if(o.t>0) glowAt(x,y-6,30,'255,255,240',0.4); };
// moving water: currents drift little chevrons, whirlpools spin
C2CELLDRAW.push((A,Z,c,cs,i0,j0,i1,j1,t)=>{
  const T=C2.T;
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i, ty=c.typ[k]; if(ty!==T.current&&ty!==T.whirl&&ty!==T.water) continue; const x=A.x0+i*cs, y=A.y0+j*cs;
    if(ty===T.water){ if(((i*7+j*3)%5)===0){ const q=(t*0.4+i*0.13+j*0.29)%1; ctx.strokeStyle=`rgba(220,245,240,${0.18*Math.sin(Math.PI*q)})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x+cs/2,y+cs/2,6+q*14,2+q*5,0,0,TAU); ctx.stroke(); } continue; }
    if(ty===T.current){ const d=Z.flow[k]; if(d<0) continue; const [dx,dy]=C2DIR[d]; const q=(t*1.4+(i*dx+j*dy)*0.5)%1; ctx.strokeStyle='rgba(220,250,245,.38)'; ctx.lineWidth=2.2;
      const cx=x+cs/2+dx*(q-0.5)*cs, cy=y+cs/2+dy*(q-0.5)*cs, px=-dy, py=dx; ctx.beginPath(); ctx.moveTo(cx-dx*6+px*7,cy-dy*6+py*7); ctx.lineTo(cx+dx*3,cy+dy*3); ctx.lineTo(cx-dx*6-px*7,cy-dy*6-py*7); ctx.stroke(); continue; }
    // whirlpool
    ctx.save(); ctx.translate(x+cs/2,y+cs/2); ctx.rotate(t*3); for(let s=0;s<3;s++){ ctx.strokeStyle=`rgba(200,240,235,${0.5-s*0.12})`; ctx.lineWidth=3-s*0.6; ctx.beginPath(); for(let a=0;a<TAU*1.5;a+=0.3){ const r=6+a*5.5+s*4; const px=Math.cos(a+s*2.1)*r, py=Math.sin(a+s*2.1)*r*0.62; a?ctx.lineTo(px,py):ctx.moveTo(px,py); } ctx.stroke(); } ctx.fillStyle='rgba(5,20,20,.75)'; ctx.beginPath(); ctx.ellipse(0,0,10,6,0,0,TAU); ctx.fill(); ctx.restore();
  }
});
// clams in the toad's pond: hit one and the vent under its lily pad bursts
C2SWING.clam=o=>c2Clam(o); C2HIT.clam=(o,src)=>{ if(src!=='fire') c2Clam(o); };
function c2Clam(o){ if(o.t>0) return; o.t=0.9; SFX.play('shrine',0.6); const Z=AREA.c2, b=Z.boss; if(b&&!b.dead&&C2CLAM[b.type]) C2CLAM[b.type](b,o); }
C2UPD.clam=(o,dt)=>{ if(o.t>0) o.t-=dt; };
const C2CLAM={};
C2GOAL.vents=R=>{ const vs=AREA.c2.vents.filter(v=>v.room===R.id&&v.id&&(v.clog||G.found[v.id]||v.wasClog)); for(const v of vs) if(G.found[v.id]) v.wasClog=1; return vs.length>0&&vs.every(v=>!v.clog); };
C2GOAL.reach=R=>{ const p=player, t=R.reachAt?{x:R.x0+(R.reachAt[0]+0.5)*c2cs(),y:R.y0+(R.reachAt[1]+0.5)*c2cs()}:(R.keyAt||{x:R.cx,y:R.cy}); return !airborne()&&caveRoomAt(p.x,p.y)===R&&dist(p.x,p.y,t.x,t.y)<(R.reachAt?90:60); };

// ---------- Old Gulper: a toad the size of a cart. He hops between lily pads, lashes his tongue and belly-flops.
// He is far too slippery to hurt much, until a bubble vent bursts under his pad and flips him on his back.
// Every pad has a clam on the shore: hit the clam of the pad he sits on.
Object.assign(EDEF,{c2_gulper:{r:32,hp:250,speed:0,dmg:12,value:300,mini:true,kbRes:0,name:'Old Gulper',title:'The toad who swallowed the Soggy Biscuit',short:'The big hungry toad'}});
DCOL.c2_gulper='120,170,80';
function c2Pads(e){ const A=AREA, R=A.rooms[e.room], cs=A.cave.cell; return (R.pads||[]).map(([c,r])=>({x:R.x0+(c+0.5)*cs,y:R.y0+(r+0.5)*cs})); }
C2BOSSINIT.c2_gulper=(e,R)=>{ e.noClip=true; e.state='sit'; e.st=2.4; e.pad=1; e.z=0; const P=c2Pads(e)[1]; if(P){ e.x=P.x; e.y=P.y; e.homeX=P.x; e.homeY=P.y; } };
AI.c2_gulper=(e,dt)=>{
  const p=player, pads=c2Pads(e); if(!pads.length) return;
  const angry=e.hp<e.maxHp*0.5; if(angry&&!e.angry){ e.angry=true; taunt('narr',S('Old Gulper croaks so loud the water shakes. He is getting faster!','The toad croaks! He gets faster!')); }
  e.dx=e.dy=0; e.vx=e.vy=0; e.st-=dt; e.c2mul=0.3; e.noClip=true;
  const d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  switch(e.state){
    case 'sit': e.face=turnTo(e.face,a,4*dt); e.z=0;
      if(e.st<=0){ e.n=(e.n||0)+1; if(e.n%3===0||d>420){ e.state='hop'; let q=e.pad; while(q===e.pad) q=randi(0,pads.length-1); e.to=q; e.hx=e.x; e.hy=e.y; e.st=0.9; SFX.play('roll',0.6); }
        else if(d<360&&Math.random()<0.65){ e.state='tongueW'; e.st=angry?0.5:0.7; e.face=a; e.tele=newTele({shape:'line',len:350,w:26,dur:e.st,col:'255,120,160'}); }
        else { e.state='spit'; e.st=0.5; } }
      break;
    case 'tongueW': if(e.st<=0){ e.tele=null; e.state='tongue'; e.st=0.42; e.hitP=false; SFX.play('slash3',0.6); } break;
    case 'tongue':{ const q=1-Math.abs(e.st/0.42*2-1), L=350*q, tx=e.x+Math.cos(e.face)*L, ty=e.y+Math.sin(e.face)*L; e.tx=tx; e.ty=ty;
      if(!e.hitP){ const ax=p.x-e.x, ay=p.y-e.y, t=clamp((ax*Math.cos(e.face)+ay*Math.sin(e.face))/Math.max(1,L),0,1), cx=e.x+Math.cos(e.face)*L*t, cy=e.y+Math.sin(e.face)*L*t; if(dist(p.x,p.y,cx,cy)<p.r+12&&t>0.05){ if(hurtPlayer(e.dmg,tx,ty,0)){ e.hitP=true; const b=angTo(p.x,p.y,e.x,e.y); p.kvx+=Math.cos(b)*360; p.kvy+=Math.sin(b)*360; ftext(p.x,p.y-30,S('Slurp!','Slurp!'),'#ffb0d0',14); } } }
      if(e.st<=0){ e.state='sit'; e.st=angry?1.1:1.6; e.tx=null; } break; }
    case 'spit': if(e.st<=0){ for(const o of [-0.28,0,0.28]) shoot(e.x,e.y-10,a+o,250,10,e.dmg*0.7,'bolt','enemy',{life:2.4}); SFX.play('pop'); e.state='sit'; e.st=angry?1.2:1.7; } break;
    case 'hop':{ const P=pads[e.to], k=clamp(1-e.st/0.9,0,1); e.x=lerp(e.hx,P.x,k); e.y=lerp(e.hy,P.y,k); e.z=Math.sin(Math.PI*k)*95; e.face=angTo(e.hx,e.hy,P.x,P.y);
      if(e.st<=0){ e.x=P.x; e.y=P.y; e.z=0; e.pad=e.to; e.state='sit'; e.st=angry?1.5:2.3; shake(7); SFX.play('boom',0.7); G.ripples.push({x:e.x,y:e.y,t:0,max:0.8,r:70,splash:true}); for(let i=0;i<(angry?2:1);i++) G.rings.push({x:e.x,y:e.y,rad:e.r,max:300,speed:300,thick:16,dmg:e.dmg*0.8,kb:240,delay:i*0.4}); } break; }
    case 'flipped': e.c2mul=2.5; e.z=0; e.face+=dt*2; if(e.st<=0){ e.state='sit'; e.st=1; e.face=a; taunt('narr',S('Old Gulper rolls back onto his feet. Blech.','He flips back over!')); } break;
    default: e.state='sit'; e.st=1;
  }
};
C2CLAM.c2_gulper=(e,clam)=>{
  const pads=c2Pads(e), P=pads[clam.n]; if(!P) return;
  const Z=AREA.c2; Z.burst={x:P.x,y:P.y,t:0.9,n:clam.n};
  later(0.8,()=>{ if(!AREA||AREA.c2!==Z||e.dead) return; shake(5); SFX.play('boom',0.5); for(let i=0;i<24;i++) emit(P.x+rand(-30,30),P.y+rand(-20,20),1,{col:'230,255,250',glow:false,ang:-Math.PI/2,spread:0.6,smin:80,smax:240,lmin:.4,lmax:.8,zmin:2,zmax:4,rise:30});
    if(e.pad===clam.n&&e.state!=='hop'){ e.state='flipped'; e.st=e.angry?3.4:4.2; e.tele=null; e.tx=null; damageEnemy(e,e.maxHp*0.06/2.5,{src:'blast'}); setBanner(S('Flipped!','Flipped!'),S('He is on his back. Get him!','Hit him now!'),1.8); }
    else if(e.state!=='flipped') ftext(P.x,P.y-40,S('Missed! He is on another pad.','Missed!'),'#e0f0ff',13); });
};
C2BOSSBLAST.c2_gulper=(e,x,y)=>{ damageEnemy(e,e.maxHp*0.05,{src:'blast'}); };
C2FOEDRAW.c2_gulper=(e,fl)=>{
  const z=e.z||0, x=e.x, y=e.y-z, flip=e.state==='flipped', t=G.time, k=e.r/32;
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(e.x+3,e.y+10,e.r*1.15,e.r*0.5,0,0,TAU); ctx.fill();
  if(e.tx!=null&&e.state==='tongue'){ ctx.strokeStyle='#e85a8a'; ctx.lineWidth=9; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x+Math.cos(e.face)*20,y+Math.sin(e.face)*14); ctx.lineTo(e.tx,e.ty-z); ctx.stroke(); ctx.strokeStyle='#ff9ab8'; ctx.lineWidth=4; ctx.stroke(); ctx.fillStyle='#e85a8a'; ctx.beginPath(); ctx.arc(e.tx,e.ty-z,9,0,TAU); ctx.fill(); }
  ctx.save(); ctx.translate(x,y); ctx.scale(k,k);
  const body=fl?'#ffffff':'#5e9a3a', dark='#3a6a22', belly='#f0e2b0';
  if(flip){ ctx.rotate(Math.sin(t*6)*0.12); ctx.fillStyle=belly; ctx.beginPath(); ctx.ellipse(0,0,34,28,0,0,TAU); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=3; ctx.stroke();
    ctx.strokeStyle=body; ctx.lineWidth=9; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*20,-14); ctx.quadraticCurveTo(s*34,-34,s*24,-44+Math.sin(t*12+s)*4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s*22,14); ctx.quadraticCurveTo(s*40,20,s*42,4+Math.sin(t*11+s)*4); ctx.stroke(); }
    ctx.fillStyle='#ffe066'; for(let i=0;i<3;i++){ const a=t*5+i*TAU/3; ctx.beginPath(); ctx.arc(Math.cos(a)*22,-30+Math.sin(a)*5,3,0,TAU); ctx.fill(); } ctx.restore(); return; }
  ctx.rotate(e.face-Math.PI/2);
  for(const s of [-1,1]){ ctx.fillStyle=dark; ctx.beginPath(); ctx.ellipse(s*30,-14,11,16,s*0.4,0,TAU); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=2.4; ctx.stroke(); ctx.beginPath(); ctx.ellipse(s*22,20,9,11,-s*0.3,0,TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle=body; ctx.beginPath(); ctx.ellipse(0,0,32,30,0,0,TAU); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle=fl?'#ffffff':'#7ab84a'; ctx.beginPath(); ctx.ellipse(-6,-6,18,14,0,0,TAU); ctx.fill();
  ctx.fillStyle=dark; for(const [sx,sy,sr] of [[-14,-12,5],[10,-16,4],[14,6,6],[-10,12,4],[2,-2,3]]){ ctx.beginPath(); ctx.arc(sx,sy,sr,0,TAU); ctx.fill(); }
  // big eyes up front, a wide mouth
  for(const s of [-1,1]){ ctx.fillStyle=body; ctx.beginPath(); ctx.arc(s*14,24,11,0,TAU); ctx.fill(); ctx.strokeStyle=C2INK; ctx.lineWidth=2.4; ctx.stroke(); ctx.fillStyle='#fff8d0'; ctx.beginPath(); ctx.arc(s*14,26,7.5,0,TAU); ctx.fill(); ctx.fillStyle='#1a1008'; ctx.beginPath(); ctx.ellipse(s*14,27.5,2.6,5,0,0,TAU); ctx.fill(); }
  ctx.strokeStyle=C2INK; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(-22,32); ctx.quadraticCurveTo(0,40,22,32); ctx.stroke();
  ctx.restore();
  if(e.state==='tongueW'){ ctx.fillStyle='rgba(255,120,160,.5)'; ctx.beginPath(); ctx.arc(x+Math.cos(e.face)*26,y+Math.sin(e.face)*20,6+Math.sin(t*30)*2,0,TAU); ctx.fill(); }
  if(e.c2hint>G.time){ ctx.font=`700 12px ${UIF}`; ctx.textAlign='center'; ctx.fillStyle='#e0f0ff'; ctx.fillText(simplify(C2TXT.slip),x,y-e.r*k-18); }
};
// show "Slippery!" when a hit barely hurts him
{ const base=damageEnemy; damageEnemy=function(e,amt,o){ const r=base(e,amt,o); if(e&&e.type==='c2_gulper'&&e.state!=='flipped'&&o&&o.src!=='blast'&&o.src!=='burn') e.c2hint=G.time+0.8; return r; }; }
C2CELLDRAW.push((A,Z,c,cs,i0,j0,i1,j1,t)=>{ const B=Z.burst; if(!B) return; B.t-=1/60; if(B.t<=0){ Z.burst=null; return; } const q=1-B.t/0.9; ctx.strokeStyle=`rgba(230,255,250,${0.8*(1-q)})`; ctx.lineWidth=3; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(B.x,B.y,20+q*50+i*10,10+q*24+i*5,0,0,TAU); ctx.stroke(); } });

// ================= The Sunken Grotto: the map
// ga start (log bridge), gb the Mooring (current loop), gc the Sunk Garden (key A), ge the Whirl Hall (anchor or drain),
// gf the Bubble Spring (logs arrive from ge's whirlpool), gg the Pulse Pools (key B), gh the Wreck River (lure, page p4),
// gd and gj fights, gl secret, gi Old Gulper, gk the vault.
c2Cave('grotto',{rooms:{
  ga:{at:[1,4],kind:'start',sign:S(`THE SUNKEN GROTTO. This water is thick, black and grabby. Even a Water Strider sinks in it. Push a log in and walk on that instead.`,`Even Water Stride sinks here. Push a log in. Walk on it!`),
    signs:[S(`Logs are heavy on land. Keep pushing. Once a log is all in the water it floats and slides.`,`Keep pushing the log into the water.`)],
    lay:['...............',
         '.*...........*.',
         '...............',
         'aaaaaaaaaaaaaaa',
         'aaaaaaaaaaaaaaa',
         'aaaaaaaaaaaaaaa',
         '...............',
         '...m...........',
         '...m......2....',
         '.s.m.........?.',
         '##...........##']},
  gb:{at:[1,3],kind:'free',sign:S(`THE MOORING. Stand on the log, then cut its rope with your claws. The current does the rest. (It always comes back around.)`,`Stand on the log. Cut the rope. Ride!`),
    intro:[['ash',S(`A river going round and round in a cave. Sure. Why not.`,`A river that goes round and round!`)]],
    lay:['...............',
         '...............',
         '#vvv<<<<<<<<<##',
         '#vvv######^^^##',
         '.vvv######^^^#.',
         '.vvv######^^^#.',
         '.vvv######^^^#.',
         '.>>>nnn>>>^^^#.',
         '.....r.........',
         '.............1.',
         '.s.............']},
  gc:{at:[0,3],kind:'c2',goal:'vents',reward:'key',sign:S(`THE SUNK GARDEN. Old logs sleep on the bottom. Bubbles wake them. Burn or claw the weeds off the vents.`,`Burn the weeds. Bubbles lift the logs!`),
    lay:['aaaaaaaaaaaaaa.',
         'aaaaaaaaaaaaaa.',
         'a...aaaaaaaaaa.',
         'a.X.aaaaaaaaaa.',
         'a...aaaaaaaaaa.',
         'a...akPk..aaaa.',
         'aaaaaaaa..akPk.',
         'aaaaaaaaaaaaaa.',
         'aaaaaaaaaaaaaa.',
         'aaaaaaaaaaaaaas',
         'aaaaaaaaaaaaaa.']},
  ge:{at:[1,2],kind:'free',whirlTo:'gf',sign:S(`THE WHIRL HALL. The whirlpool drinks everything that floats near it. Old miners say it drains down to the Bubble Spring.`,`The whirlpool eats logs. They come out in the Bubble Spring.`),
    intro:[['ash',S(`That whirlpool looks hungry. I'm going to try very hard not to be lunch.`,`That whirlpool looks hungry!`)]],
    signs:[S(`THE WAY BACK. This log rides the current down to the dock. Cut its rope when you want to go home.`,`This log goes back down. Cut the rope.`)],
    lay:['...........r..?',
         '#aa>p>aa@annna#',
         '#aa^^^aaaavvva#',
         '#aa^^^aaaavvva#',
         '.aa^^^aaaavvva.',
         '.aa^^^aaaavvva.',
         '.aa^^^aaaavvva.',
         '.aannnaaaavvva.',
         '....r.mmm......',
         '.$.............',
         '.s.............']},
  gf:{at:[0,2],kind:'c2',goal:'lever',resetRooms:['ge'],levers:[{solve:1}],hint:S(`A door of woven reeds, tied shut. A lever on the island in the spring pulls the knot.`,`Reeds tie it shut. Pull the island lever.`),
    sign:S(`THE BUBBLE SPRING. What the Whirl Hall swallows comes bubbling up here. The rune stone sends the logs back up.`,`Logs from the whirlpool pop up here.`),
    lay:['...............',
         '.*...........*.',
         'aaaaaaaaa......',
         'aaaaaaaaa......',
         'aaaaaaaaa..s...',
         'aaaaaaaaa......',
         'aa...aaBa......',
         'aa.y.aaaa......',
         'aa...aaaa......',
         'aaaaaaaaa...$..',
         'aaaaaaaaa......']},
  gg:{at:[0,1],kind:'c2',goal:'reach',reward:'key',pulse:[[4.6,1.8,4.4],[4.6,1.8,5.4],[4.6,1.8,0]],sign:S(`THE PULSE POOLS. The bubbles come in breaths: in, out, in, out. Their logs float only while they breathe.`,`The logs float while the bubbles puff. Be quick!`),
    lay:['.....1.........',
         '.*........X..*.',
         'aaaaaaaaaakaaaa',
         'aaaaaaaaaaUaaaa',
         'aaaaaaaaaakaaaa',
         'aaaaaaaaaakUkaa',
         'aaaaaaaaaaaakaa',
         'aaaaaaaaaaaaUaa',
         'aaaaaaaaaaaakaa',
         '...........s...',
         '...............']},
  gh:{at:[1,1],kind:'c2',goal:'reach',reachAt:[9,3],loot:['qitem','page:p4'],hint:S(`Reeds tied tight across the door. They will loosen once someone reaches the wreck of the Soggy Biscuit.`,`Reeds block it. Reach the wreck first.`),
    sign:S(`THE WRECK RIVER. The Soggy Biscuit ran aground on the far bank. A log across the river makes a fine bridge, if it would only hold still.`,`A log can be a bridge. Make it hold still!`),
    lay:['...............',
         '.*......aaaa.*.',
         '........aQaa...',
         '...G....aaaa...',
         '...............',
         '#####..1.......',
         '>>n>>>>>>>>>>>.',
         '>>n>>>>p>>>>@##',
         '>>n>>>>>>>>>>##',
         '...r...........',
         '.s.............']},
  gj:{at:[2,1],kind:'fight',foes:[['slime',3],['kobold',2]],loot:['chest'],
    lay:['...............',
         '.*..jaaj....*..',
         '....aaaa.......',
         '...........aa..',
         '...........aa..',
         '......X........',
         '..aa...........',
         '..aa......aaa..',
         '..........aaa..',
         '.*...........*.',
         '...............']},
  gd:{at:[2,2],kind:'fight',foes:[['kobold',3],['slime',2]],loot:['chest','coins'],
    lay:['...............',
         '.*...........*.',
         '...aaa...aaa...',
         '...aja...aja...',
         '...aaa...aaa...',
         '.......X.......',
         '...............',
         '...##.....##...',
         '...............',
         '.*...........*.',
         '...............']},
  gl:{at:[2,3],kind:'secret',loot:['coins','treat'],
    lay:['...............',
         '.*...........*.',
         '...aaaaaaaaa...',
         '...ajjjjjjja...',
         '...aaaaaaaaa...',
         '...............',
         '...............',
         '...............',
         '...............',
         '.*...........*.',
         '...............']},
  gi:{at:[1,0],span:[2,1],kind:'boss',boss2:{type:'c2_gulper',name:S('Old Gulper','The Big Toad')},pads:[[5,6],[12,6],[19,6],[26,6]],
    winText:S('Old Gulper burps up a fishing hat and hops off to sulk. The vault door opens.','The toad hops away. The vault opens!'),
    intro:[['ash',S(`That's not a lily pad. That's a toad. That's a toad the size of a house.`,`That is a VERY big toad.`)]],
    sign:S(`Hit a clam on the shore and the vent under its lily pad bursts.`,`Hit a clam. Its pad goes BLOOP!`),
    lay:['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
         'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
         '..aaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
         '..aajjjaaaajjjaaaajjjaaaajjjaaa',
         '..aajjjaaaajjjaaaajjjaaaajjjaaa',
         '..aajjjaaaajjjaaaajjjaaaajjjaaa',
         '...............................',
         '.s..d......d......d......d.....',
         '...............................']},
  gk:{at:[0,0],kind:'treasure',
    lay:['...............',
         '.*...........*.',
         '...aaa...aaa...',
         '...a1a...a1a...',
         '...aaa...aaa...',
         '.......H.......',
         '...............',
         '...............',
         '...............',
         '.*...........*.',
         '...............']}},
  links:[['ga','gb','open'],['gb','gc','open'],['gb','gl','crack'],['gb','ge','open'],['ge','gf','open'],['ge','gd','open'],['ge','gh','lock'],
    ['gf','gg','gate:gf'],['gh','gj','open'],['gh','gi','lock',{at:1}],['gi','gk','gate:gi'],['gj','gd','gate:gh']]},
  {dark:0.5});
CAVE_SECRETS=countCaveSecrets();

// ================= Icefang Cavern pieces: ice blocks, meltwater, icicles, floes
// Ice blocks slide across ice until something stops them (a wall, a block, a rock, plain floor or a door step); on
// plain floor one push moves them one cell. A block pushed into water sinks and the water freezes over. Fire melts a
// block into a pool of meltwater that freezes into plain ice after C2THAW seconds (until then the pool stops a slide
// the way a wall does, and a block pushed into it freezes it at once). Icicles hang from the roof: claws, fire, arrows,
// bombs or a roar bring one down. On water it makes a floe (a stepping stone that stops a slide), on ice or floor a
// new ice block, on a foe a big bonk. Icicles grow back only in rooms with a `regrow` time (and at the rune stone).
const C2THAW=9, C2BLOCKHIT={}, C2ICICLE={};
C2MAKE.block=(A,def,R,m)=>c2BlockNew(A,R.id,m.i,m.j,false,`c2_${def.id}_${R.id}_${m.ch}${m.c}_${m.r}`);
function c2BlockNew(A,rid,i,j,once,id){
  const Z=A.c2, k=j*A.cave.w+i;
  const o={k:'c2',kind:'block',id:id||`c2_${A.def.id}_${rid}_nb${i}_${j}_${Math.round(Z.t*10)}`,room:rid,ci:i,cj:j,hi:i,hj:j,x:c2X(i),y:c2Y(j),r:22,solid:1,tall:1,mv:null,slideD:null,gone:0,heat:0,once:once?1:0,hit:new Set(),drop:0,seed:(i*5+j*3)%4};
  A.objs.push(o); Z.list.push(o); Z.blocks.push(o); Z.occ.set(k,o); return o;
}
function c2Drop(o){ const A=AREA, Z=A.c2; A.objs=A.objs.filter(q=>q!==o); Z.list=Z.list.filter(q=>q!==o); Z.blocks=Z.blocks.filter(q=>q!==o); }
C2PUSH.block=(o,d)=>{ if(o.mv||o.gone||o.drop>0) return; if(c2BlockInto(o,d)){ o.hit.clear(); SFX.play('roll',0.5); } else SFX.play('block',0.4); };
// can the block move one cell in direction d? starts the move and returns true
function c2BlockInto(o,d){
  const A=AREA, Z=A.c2, k=c2Nb(o,d);
  if(k<0||A.cave.grid[k]===1||Z.door[k]||Z.plat.get(k)||!c2Free(k,o)) return false;
  const kd=c2Kind(k); if(kd==='wall'||kd==='spring'||kd==='pad') return false;
  o.slideD=d; c2Go(o,d,400); return true;
}
// the water under a block (or a pool of meltwater) freezes into ice
function c2Freeze(k){
  const A=AREA, Z=A.c2, c=A.cave;
  if(Z.st[k]===2){ Z.st[k]=0; Z.tm[k]=0; if(Z.timed) Z.timed.delete(k); if(c.typ[k]!==C2.T.ice) c.typ[k]=C2.T.ice; }
  else if(c.typ[k]===C2.T.water) Z.st[k]=3;
  const [i,j]=c2IJ(k); emit(c2X(i),c2Y(j),16,{col:'230,248,255',glow:false,smin:30,smax:120,lmin:.3,lmax:.7,zmin:1.5,zmax:3.5}); SFX.play('block',0.6);
}
C2UPD.block=(o,dt)=>{
  const A=AREA, Z=A.c2;
  if(o.back){ const k=o.hj*A.cave.w+o.hi; if(c2Free(k,o)&&!Z.occ.get(k)){ o.back=0; o.gone=0; Z.occ.set(k,o); emit(o.x,o.y,10,{col:'230,248,255',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } return; }
  if(o.gone) return;
  if(o.drop>0) o.drop=Math.max(0,o.drop-dt);
  if(o.heat>0) o.heat=Math.max(0,o.heat-dt*0.4);
  if(!o.mv) return;
  // a sliding block bowls over whatever is in the way
  for(const e of G.enemies){ if(e.dead||!e.inArea||e.flying||o.hit.has(e.id)) continue; if(dist(e.x,e.y,o.x,o.y)<e.r+20){ o.hit.add(e.id);
    if(e.c2boss&&C2BLOCKHIT[e.type]){ C2BLOCKHIT[e.type](e,o); continue; }
    damageEnemy(e,16+5*(A.level||1),{src:'block',kb:380,ka:Math.atan2(C2DIR[o.mv.d][1],C2DIR[o.mv.d][0])}); if(!e.dead) stunEnemy(e,1); SFX.play('hit'); ftext(e.x,e.y-e.r-6,S('Thunk!','Thunk!'),'#e0f4ff',12); } }
  const m=c2Step(o,dt); if(!m) return;
  const k=o.cj*A.cave.w+o.ci, kd=c2Kind(k);
  if(c2Wet(kd)){ Z.occ.delete(k); o.gone=1; o.slideD=null; c2Freeze(k); G.ripples.push({x:o.x,y:o.y,t:0,max:0.8,r:28,splash:true}); mvSnd('splash',0.6);
    if(!Z.saidFreeze){ Z.saidFreeze=1; setBanner(S('It freezes over!','Frozen!'),S('The block sinks and the water turns to ice.','Now you can slide on it.'),1.8); } return; }
  if(kd==='abyss'){ Z.occ.delete(k); o.gone=1; o.slideD=null; ftext(o.x,o.y-20,S('Bye, block!','Bye, block!'),'#e0f4ff',12); return; }
  if(kd==='lava'){ Z.occ.delete(k); o.gone=1; o.slideD=null; mvSnd('sizzle'); emit(o.x,o.y,20,{col:'235,240,245',glow:false,ang:-Math.PI/2,spread:1,smin:30,smax:110,lmin:.5,lmax:1,zmin:3,zmax:7,grow:10}); return; }
  if(kd==='ice'&&o.slideD!=null&&c2BlockInto(o,o.slideD)) return;
  o.slideD=null; SFX.play('block',0.35); shake(1);
};
function c2Melt(o){
  if(o.gone||o.mv||o.drop>0) return; const A=AREA, Z=A.c2, k=o.cj*A.cave.w+o.ci;
  Z.occ.delete(k); o.gone=1; o.heat=0; c2SetTimed(k,2,C2THAW);
  mvSnd('sizzle'); emit(o.x,o.y,24,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:1.2,smin:30,smax:120,lmin:.5,lmax:1.0,zmin:3,zmax:7,grow:10,drag:2});
  G.ripples.push({x:o.x,y:o.y,t:0,max:0.9,r:26});
  if(!Z.saidMelt){ Z.saidMelt=1; setBanner(S('Sssss!','Melted!'),S(`The block melts into a pool. It will freeze into ice again soon.`,`It will freeze again soon.`),2.2); }
}
function c2Shatter(o){
  if(o.gone) return; const A=AREA, Z=A.c2, k=o.cj*A.cave.w+o.ci; if(Z.occ.get(k)===o) Z.occ.delete(k); o.gone=1; o.mv=null; o.slideD=null;
  SFX.play('hit'); shake(3); emit(o.x,o.y,26,{col:'220,240,255',glow:false,smin:60,smax:260,lmin:.3,lmax:.7,zmin:1.5,zmax:4});
}
C2FIRE.block=(o,dt)=>{ if(o.mv) return; o.heat+=Math.max(dt,0.02)*1.6; if(Math.random()<0.5) emit(o.x+rand(-14,14),o.y-10,1,{col:'230,245,255',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:6}); if(o.heat>0.5) c2Melt(o); };
C2HIT.block=(o,src)=>{ if(src==='fire'){ c2Melt(o); return; } if(src==='bomb'||src==='bombs'){ c2Shatter(o); return; } return false; };
C2BLAST.block=(o,ci,cj)=>{ if(Math.max(Math.abs(o.ci-ci),Math.abs(o.cj-cj))<=1) c2Melt(o); };
C2RESET.block=o=>{
  const A=AREA, Z=A.c2, w=A.cave.w, k0=o.cj*w+o.ci; if(Z.occ.get(k0)===o) Z.occ.delete(k0);
  o.mv=null; o.slideD=null; o.heat=0; o.drop=0;
  if(o.once){ o.gone=1; c2Drop(o); return; }
  o.ci=o.hi; o.cj=o.hj; o.x=c2X(o.ci); o.y=c2Y(o.cj); o.gone=1; o.back=1;
};
// ---------- icicles
C2MAKE.icicle=(A,def,R,m)=>{ const o=c2Obj(A,R,m,'icicle',{state:'hang',t:0,regrow:R.regrow||0,sz:0.85+((m.i*7+m.j*3)%5)*0.07,r:20}); A.c2.icicles.push(o); return o; };
function c2Icicle(o){ if(o.state!=='hang') return false; o.state='fall'; o.t=0; SFX.play('block',0.5); return true; }
C2SWING.icicle=o=>c2Icicle(o); C2FIRE.icicle=o=>c2Icicle(o); C2ROAR.icicle=o=>c2Icicle(o);
C2HIT.icicle=(o,src)=>{ if(!c2Icicle(o)) return false; };
C2BLAST.icicle=(o,ci,cj)=>{ if(Math.max(Math.abs(o.ci-ci),Math.abs(o.cj-cj))<=3) c2Icicle(o); };
C2UPD.icicle=(o,dt)=>{
  if(o.state==='fall'){ o.t+=dt; if(o.t>=0.42) c2IcicleLand(o); return; }
  if(o.state==='gone'){ if(o.regrow>0){ o.t-=dt; if(o.t<=0){ o.state='grow'; o.t=0; } } return; }
  if(o.state==='grow'){ o.t+=dt; if(o.t>=1.4){ o.state='hang'; o.t=0; } }
};
function c2IcicleLand(o){
  const A=AREA, Z=A.c2, c=A.cave, k=o.cj*c.w+o.ci, kd=c2Kind(k), p=player, cs=c.cell, lvl=A.level||1;
  o.state='gone'; o.t=o.regrow;
  SFX.play('block'); SFX.play('hit',0.4); shake(3);
  emit(o.x,o.y,18,{col:'225,242,255',glow:false,smin:60,smax:220,lmin:.3,lmax:.6,zmin:1.5,zmax:3.5});
  let used=false;
  for(const e of G.enemies){ if(e.dead||!e.inArea) continue; if(dist(e.x,e.y,o.x,o.y)<cs*0.55+e.r*0.6){ used=true;
    if(e.c2boss&&C2ICICLE[e.type]) C2ICICLE[e.type](e,o); else { damageEnemy(e,26+8*lvl,{src:'icicle',kb:120,ka:Math.random()*TAU}); if(!e.dead) stunEnemy(e,1.6); }
    ftext(e.x,e.y-e.r-8,S('Bonk!','Bonk!'),'#e0f4ff',14); } }
  if(!p.dead&&!airborne()&&Math.abs(p.x-o.x)<cs*0.5+p.r*0.4&&Math.abs(p.y-o.y)<cs*0.5+p.r*0.4){ used=true; hurtPlayer(p.maxHp*0.1/Math.max(0.01,(G.diff&&G.diff.dmg)||1),o.x,o.y-10,200); ftext(p.x,p.y-30,S('Ow! Icicle!','Ow!'),'#e0f4ff',14); }
  if(used) return;
  if(kd==='water'){ Z.st[k]=4; G.ripples.push({x:o.x,y:o.y,t:0,max:0.9,r:30,splash:true}); mvSnd('splash',0.5);
    if(!Z.saidFloe){ Z.saidFloe=1; setBanner(S('A floe!','A floe!'),S('Something to stand on. You can hop to it from solid ground.','You can hop onto it!'),2); } return; }
  if(kd==='melt'){ c2Freeze(k); return; }
  if((kd==='floor'||kd==='ice')&&!Z.occ.get(k)&&!Z.plat.get(k)&&!Z.door[k]&&!Z.solidK.has(k)&&!(c.dyn&&caveBlockedAt(k))){
    const b=c2BlockNew(A,o.room,o.ci,o.cj,true); b.drop=0.18;
    if(!Z.saidBlock){ Z.saidBlock=1; setBanner(S('Thunk!','Thunk!'),S('The icicle is a brand new ice block. Push it!','A new ice block! Push it!'),2); } }
}
C2RESET.icicle=o=>{ if(o.state!=='hang'){ o.state='grow'; o.t=0.6; } };
// ---------- ice art
function c2BlockSpr(v){ return c2Spr('iceblock'+v,48,54,(g)=>{
  g.fillStyle='#7cbce0'; rrect(g,3,15,42,35,7); g.fill(); g.strokeStyle='#28506e'; g.lineWidth=2.6; g.stroke();
  g.fillStyle='rgba(40,90,130,.25)'; rrect(g,30,17,13,31,6); g.fill();
  g.fillStyle='#d6f2ff'; rrect(g,3,4,42,18,7); g.fill(); g.strokeStyle='#28506e'; g.lineWidth=2.4; g.stroke();
  g.fillStyle='rgba(255,255,255,.75)'; rrect(g,8,7,18,5,2.5); g.fill();
  g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2.6; g.beginPath(); g.moveTo(9,26); g.lineTo(9,42); g.stroke();
  g.lineWidth=1.6; g.beginPath(); g.moveTo(14,27); g.lineTo(14,33); g.stroke();
  g.strokeStyle='rgba(40,90,140,.5)'; g.lineWidth=1.4; g.beginPath();
  if(v%2){ g.moveTo(22,22); g.lineTo(27,31); g.lineTo(24,38); } else { g.moveTo(32,24); g.lineTo(26,30); g.lineTo(29,40); } g.stroke();
  g.fillStyle='rgba(255,255,255,.55)'; for(const [bx,by,br] of [[20,40,2],[34,36,1.5],[26,44,1.2]]){ g.beginPath(); g.arc(bx+(v*3)%5,by,br,0,TAU); g.fill(); } }); }
C2TALL.block=(o,t)=>{
  const x=o.x, y=o.y, dz=o.drop>0?o.drop/0.18*90:0; c2Shadow(x+2,y+14,20,7,0.3*(1-dz/120));
  let wx=0; if(o.pushK>0.05&&!o.mv) wx=Math.sin(t*50)*o.pushK*1.5;
  const melt=Math.min(1,o.heat/0.5), sq=1-melt*0.12;
  ctx.save(); ctx.translate(x+wx,y-6-dz+melt*3); ctx.scale(1,sq); c2Blit(c2BlockSpr(o.seed||0),0,0,48,54); ctx.restore();
  if(melt>0.05){ ctx.fillStyle=`rgba(180,220,255,${0.5*melt})`; for(let i=0;i<3;i++){ const q=(t*2+i*0.33)%1; ctx.beginPath(); ctx.arc(x-14+i*14,y+8+q*10,2.2,0,TAU); ctx.fill(); } }
  if(o.drop>0&&o.drop<0.05) G.ripples.push({x,y,t:0,max:0.4,r:24});
};
// icicles: a spike hanging from the roof (drawn above everyone) and its shadow on the floor
function c2IcicleSpr(){ return c2Spr('icicle',30,64,(g)=>{
  g.fillStyle='#a8d8f0'; g.beginPath(); g.moveTo(3,4); g.lineTo(27,4); g.lineTo(18,40); g.lineTo(15,62); g.lineTo(12,40); g.closePath(); g.fill(); g.strokeStyle='#2a5070'; g.lineWidth=2.2; g.stroke();
  g.fillStyle='#e8f8ff'; g.beginPath(); g.moveTo(7,5); g.lineTo(14,5); g.lineTo(14,46); g.closePath(); g.fill();
  g.fillStyle='rgba(60,120,170,.35)'; g.beginPath(); g.moveTo(20,5); g.lineTo(26,5); g.lineTo(17,38); g.closePath(); g.fill();
  g.fillStyle='#8ab4cc'; rrect(g,0,0,30,7,3); g.fill(); g.strokeStyle='#2a5070'; g.lineWidth=2; g.stroke(); }); }
C2FLOOR.icicle=(o,t)=>{
  if(o.state==='gone') return; const cs=c2cs(), x=o.x, y=o.y;
  let a=0.22, r=11*o.sz; if(o.state==='fall'){ const q=o.t/0.42; a=0.25+0.4*q; r=r*(1+q*0.6); } else if(o.state==='grow') a*=o.t/1.4;
  ctx.fillStyle=`rgba(10,30,50,${a})`; ctx.beginPath(); ctx.ellipse(x,y+4,r*1.3,r*0.6,0,0,TAU); ctx.fill();
  if(o.state==='hang'){ ctx.strokeStyle='rgba(200,235,255,.35)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.ellipse(x,y+4,cs*0.36,cs*0.17,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
};
C2SKY.icicle=(o,t)=>{
  if(o.state==='gone') return; const s=c2IcicleSpr(), h=40;
  let off=h, sc=o.sz, al=1, shk=0;
  if(o.state==='fall'){ const q=o.t/0.42; off=h*(1-q*q); }
  else if(o.state==='grow'){ sc*=Math.max(0.05,o.t/1.4); al=0.6+0.4*o.t/1.4; }
  else shk=Math.sin(t*2+o.ci)*0.6;
  ctx.save(); ctx.globalAlpha=al; ctx.translate(o.x+shk,o.y-off); ctx.scale(sc,sc); ctx.drawImage(s,-15,-58,30,64); ctx.restore();
  if(o.state==='fall'&&o.t<0.1){ ctx.fillStyle='rgba(230,248,255,.8)'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(o.x+rand(-12,12),o.y-h-56+rand(-4,4),1.6,0,TAU); ctx.fill(); } }
  // a frosty glint on the tip so it reads as something that can drop
  if(o.state==='hang'){ const q=(t*0.7+o.ci*0.37)%1; if(q<0.12){ ctx.fillStyle=`rgba(255,255,255,${0.9*(1-q/0.12)})`; ctx.beginPath(); ctx.arc(o.x+shk,o.y-h+4*sc,2.5,0,TAU); ctx.fill(); } }
};
// live cells: frozen water, floes, meltwater and floor that froze over
function c2IceTile(frozen){ return c2Spr('icetile'+(frozen?1:0),48,48,(g)=>{
  g.fillStyle=frozen?'#a8d6ee':'#c4e6f6'; g.fillRect(0,0,48,48);
  g.strokeStyle='rgba(120,170,210,.55)'; g.lineWidth=1.5; g.strokeRect(0.75,0.75,46.5,46.5);
  g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=2; g.beginPath(); g.moveTo(6,14); g.lineTo(22,6); g.moveTo(26,42); g.lineTo(42,30); g.stroke();
  if(frozen){ g.strokeStyle='rgba(60,120,170,.45)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(10,30); g.lineTo(20,24); g.lineTo(30,28); g.lineTo(38,18); g.moveTo(20,24); g.lineTo(22,36); g.stroke(); } }); }
function c2FloeSpr(v){ return c2Spr('floe'+v,48,48,(g)=>{
  g.fillStyle='rgba(0,20,40,.35)'; g.beginPath(); g.ellipse(26,29,20,14,0,0,TAU); g.fill();
  g.fillStyle='#e4f6ff'; g.beginPath(); const pts=v?[[6,20],[16,8],[34,7],[43,19],[40,34],[24,40],[9,33]]:[[5,24],[12,10],[28,6],[42,14],[44,30],[30,41],[12,37]]; g.moveTo(...pts[0]); for(const q of pts.slice(1)) g.lineTo(...q); g.closePath(); g.fill(); g.strokeStyle='#2a5070'; g.lineWidth=2.2; g.stroke();
  g.fillStyle='rgba(150,200,230,.6)'; g.beginPath(); g.ellipse(26,28,10,6,0.3,0,TAU); g.fill(); }); }
C2CELLDRAW.push((A,Z,c,cs,i0,j0,i1,j1,t)=>{
  if(A.def.theme!=='ice') return; const T=C2.T;
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i, s=Z.st[k], ty=c.typ[k];
    if(!s&&ty===Z.typ0[k]) continue;
    const x=A.x0+i*cs, y=A.y0+j*cs;
    if(s===2){ // meltwater: a pool, with frost creeping back in from the edges
      const q=1-Z.tm[k]/C2THAW; ctx.fillStyle='#2a6a92'; ctx.fillRect(x+2,y+2,cs-4,cs-4); ctx.strokeStyle='rgba(230,248,255,.7)'; ctx.lineWidth=2; ctx.strokeRect(x+3,y+3,cs-6,cs-6);
      const rr=(t*0.8+i*0.3)%1; ctx.strokeStyle=`rgba(220,245,255,${0.5*(1-rr)})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x+cs/2,y+cs/2,4+rr*16,2+rr*8,0,0,TAU); ctx.stroke();
      if(q>0.05){ ctx.fillStyle=`rgba(225,245,255,${0.25+0.5*q})`; const e=cs*0.5*q; ctx.fillRect(x+2,y+2,cs-4,e*0.5); ctx.fillRect(x+2,y+cs-2-e*0.5,cs-4,e*0.5); ctx.fillRect(x+2,y+2,e*0.5,cs-4); ctx.fillRect(x+cs-2-e*0.5,y+2,e*0.5,cs-4); }
      if(Z.tm[k]<1.5&&Math.sin(t*20)>0){ ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2; ctx.strokeRect(x+4,y+4,cs-8,cs-8); }
      continue; }
    if(s===4){ ctx.drawImage(c2FloeSpr((i+j)%2),x,y+Math.sin(t*2+i)*1.2,cs,cs); continue; }
    if(s===3||ty===T.ice) ctx.drawImage(c2IceTile(s===3),x,y,cs,cs);
  }
});

// ---------- The Frost Alpha: king of the Icefang pack. He lines up with Ash and charges in a straight line, and on the
// ice he cannot stop: a charge ends when he slams into something. Walls and pillars only stagger him (and shake the
// icicles near him loose). An ice block in his way, or an icicle on his head, leaves him dazed: then his frost fur
// stops shrugging off hits. At two thirds and one third health he howls: icicles rain down and two wolves join in.
Object.assign(EDEF,{c2_alpha:{r:26,hp:300,speed:200,dmg:14,value:340,mini:true,kbRes:0.3,name:'The Frost Alpha',title:'King of the Icefang pack',short:'The big ice wolf'}});
DCOL.c2_alpha='220,235,250';
C2BOSSINIT.c2_alpha=(e,R)=>{ e.state='prowl'; e.st=2.4; e.howls=0; e.snowy=true; e.strafe=1; e.cdir=0; };
const c2Axis=a=>{ const c=Math.cos(a), s=Math.sin(a); return Math.abs(c)>Math.abs(s)?(c>0?1:3):(s>0?2:0); };
AI.c2_alpha=(e,dt)=>{
  const p=player, A=AREA, R=A&&A.rooms&&A.rooms[e.room]; if(!R) return;
  const cs=A.cave.cell, d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y), hpk=e.hp/e.maxHp;
  e.st-=dt; e.dx=e.dy=0; e.noClip=false; e.c2mul=0.5; e.invuln=false;
  if(e.state==='prowl'&&e.howls<2&&hpk<(e.howls===0?0.67:0.34)){ e.state='howlW'; e.st=1.1; e.howls++; e.tele=newTele({shape:'circle',r:90,dur:1.1,col:'200,230,255'}); }
  switch(e.state){
    case 'prowl':{ // trot to a spot in line with Ash (same row or column), a few cells away
      const horiz=Math.abs(p.x-e.x)>Math.abs(p.y-e.y), side=horiz?Math.sign(e.x-p.x)||1:Math.sign(e.y-p.y)||1;
      const tx=horiz?clamp(p.x+side*cs*4.5,R.x0+cs*1.5,R.x1-cs*1.5):e.x, ty=horiz?e.y:clamp(p.y+side*cs*4,R.y0+cs*1.5,R.y1-cs*1.5);
      steer(e,horiz?tx:e.x,horiz?p.y:ty,e.speed); e.face=turnTo(e.face,a,6*dt);
      const lined=horiz?Math.abs(e.y-p.y)<cs*0.45:Math.abs(e.x-p.x)<cs*0.45;
      if(d<80&&e.st<0.8){ e.state='biteW'; e.st=0.38; e.face=a; e.tele=newTele({shape:'line',len:110,w:40,dur:0.38}); break; }
      if(e.st<=0&&(lined||e.st<-2.5)){ e.state='aim'; e.st=hpk<0.5?0.7:0.95; e.cdir=c2Axis(a); e.face=Math.atan2(C2DIR[e.cdir][1],C2DIR[e.cdir][0]); e.tele=newTele({shape:'line',len:1100,w:e.r*2,dur:e.st}); SFX.play('howl',0.25); }
      break; }
    case 'aim':{ if(e.st>0.3){ const nd=c2Axis(a); if(nd!==e.cdir){ e.cdir=nd; e.face=Math.atan2(C2DIR[nd][1],C2DIR[nd][0]); } }
      if(e.st<=0){ e.tele=null; e.state='charge'; e.st=3; e.hitP=false; SFX.play('slash3',0.6); } break; }
    case 'charge':{ e.noClip=true; const [dx,dy]=C2DIR[e.cdir], sp=640, nx=e.x+dx*sp*dt, ny=e.y+dy*sp*dt;
      const ahead=c2K(nx+dx*e.r,ny+dy*e.r), ob=ahead>=0?(A.c2.occ.get(ahead)||null):null;
      const bad=ahead<0||A.cave.grid[ahead]===1||(A.cave.dyn&&caveBlockedAt(ahead))||!caveInterior(R,nx+dx*e.r*0.5,ny+dy*e.r*0.5);
      if(bad||ob){ c2AlphaCrash(e,ob); break; }
      e.x=nx; e.y=ny; if(Math.random()<dt*40) emit(e.x-dx*20,e.y-dy*20+8,1,{col:'230,245,255',glow:false,ang:Math.atan2(-dy,-dx),spread:0.7,smin:30,smax:110,lmin:.2,lmax:.45,zmin:1.5,zmax:3.5});
      if(!e.hitP&&dist(e.x,e.y,p.x,p.y)<e.r+p.r+4&&!airborne()){ if(hurtPlayer(e.dmg*1.2,e.x,e.y,380)) e.hitP=true; }
      if(e.st<=0){ e.state='prowl'; e.st=1.5; } break; }
    case 'stagger': if(e.st<=0){ e.state='prowl'; e.st=1.2; } break;
    case 'dazed': e.c2mul=2; if(e.st<=0){ e.state='prowl'; e.st=1.4; taunt('narr',S('The Frost Alpha shakes the stars out of his head.','He shakes it off!')); } break;
    case 'biteW': if(e.st<=0){ e.tele=null; e.state='bite'; e.st=0.22; e.hitP=false; SFX.play('slash3',0.5); } break;
    case 'bite': e.dx=Math.cos(e.face)*520; e.dy=Math.sin(e.face)*520; if(!e.hitP&&d<e.r+p.r+6){ if(hurtPlayer(e.dmg,e.x,e.y,260)) e.hitP=true; } if(e.st<=0){ e.state='prowl'; e.st=1.4; } break;
    case 'howlW': if(e.st<=0){ e.tele=null; c2AlphaHowl(e,R); e.state='prowl'; e.st=1.8; } break;
    default: e.state='prowl'; e.st=1;
  }
  if(e.state!=='charge') arenaClamp(e,40);
};
function c2AlphaCrash(e,ob){
  const A=AREA, Z=A.c2; e.tele=null; e.noClip=false; shake(8); SFX.play('boom',0.7);
  emit(e.x+Math.cos(e.face)*e.r,e.y+Math.sin(e.face)*e.r,22,{col:'230,245,255',glow:false,smin:50,smax:200,lmin:.3,lmax:.7,zmin:2,zmax:4.5});
  if(ob&&ob.kind==='block'){ c2Shatter(ob); e.state='dazed'; e.st=3; e.c2mul=1; damageEnemy(e,e.maxHp*0.05,{src:'block'}); setBanner(S('Smash!','Smash!'),S('He ran into the ice block. He is dazed!','He is dizzy! Hit him!'),1.8); return; }
  e.state='stagger'; e.st=1.1;
  // the bump shakes the icicles near him loose
  for(const o of Z.icicles) if(o.room===e.room&&o.state==='hang'&&dist(o.x,o.y,e.x,e.y)<A.cave.cell*2.6) c2Icicle(o);
}
function c2AlphaHowl(e,R){
  const A=AREA, Z=A.c2; SFX.play('howl'); shake(8);
  if(e.howls===1) taunt('narr',S('The Frost Alpha howls. The roof creaks, and the pack answers!','He howls! The pack is coming!'));
  for(const o of Z.icicles) if(o.room===e.room&&o.state==='hang'&&Math.random()<0.55){ const q=o; later(Math.random()*0.9,()=>{ if(AREA===A) c2Icicle(q); }); }
  for(let n=0;n<2;n++){ const x=R.x0+(n?R.x1-R.x0-A.cave.cell*2:A.cave.cell*2), y=R.cy; const w=makeEnemy('wolf',x,y,{level:e.level-1,aggro:true,snowy:true,camp:A.camp||null,homeX:x,homeY:y,leash:99999}); w.inArea=true; w.room=e.room; w.spawnIn=0.2; R.enemies.push(w); if(A.camp) A.camp.alive++; }
  G.rings.push({x:e.x,y:e.y,rad:e.r,max:260,speed:500,thick:16,dmg:0,kb:280});
}
C2ICICLE.c2_alpha=(e,o)=>{ e.c2mul=1; damageEnemy(e,e.maxHp*0.1,{src:'icicle'}); if(e.dead) return; e.state='dazed'; e.st=2.8; e.tele=null; e.noClip=false; setBanner(S('Bonk!','Bonk!'),S('Right on his head. He is dazed: get him!','He is dizzy! Hit him!'),1.8); };
C2BLOCKHIT.c2_alpha=(e,o)=>{ e.c2mul=1; damageEnemy(e,e.maxHp*0.05,{src:'block'}); if(e.dead) return; if(e.state!=='dazed'){ e.state='dazed'; e.st=2.2; e.tele=null; e.noClip=false; } c2Shatter(o); };
C2BOSSBLAST.c2_alpha=(e,x,y)=>{ damageEnemy(e,e.maxHp*0.05,{src:'blast'}); };
C2FOEDRAW.c2_alpha=(e,fl)=>{
  const t=G.time, dz=e.state==='dazed';
  glowAt(e.x,e.y,e.r*2.4,'200,235,255',0.18+0.06*Math.sin(t*3));
  if(T3.on&&T3E.greymane) c2Big(e,1.45,()=>T3E.greymane(e,fl)); else drawWolf(e,fl,2.4,true);
  if(e.state==='charge'){ ctx.strokeStyle='rgba(230,245,255,.55)'; ctx.lineWidth=2; for(let i=-1;i<=1;i++){ const px=-Math.sin(e.face)*i*12, py=Math.cos(e.face)*i*12; ctx.beginPath(); ctx.moveTo(e.x+px-Math.cos(e.face)*40,e.y+py-Math.sin(e.face)*40); ctx.lineTo(e.x+px-Math.cos(e.face)*80,e.y+py-Math.sin(e.face)*80); ctx.stroke(); } }
  if(dz||e.state==='stagger'){ for(let i=0;i<(dz?4:2);i++){ const q=t*5+i*TAU/4; ctx.fillStyle=dz?'#ffe066':'#e0f0ff'; ctx.beginPath(); ctx.arc(e.x+Math.cos(q)*e.r*0.9,e.y-e.r-8+Math.sin(q)*4,2.6,0,TAU); ctx.fill(); } }
  if(e.c2hint>G.time){ ctx.font=`700 12px ${UIF}`; ctx.textAlign='center'; ctx.fillStyle='#e0f0ff'; ctx.fillText(simplify(C2TXT.fluff),e.x,e.y-e.r-22); }
};
{ const base=damageEnemy; damageEnemy=function(e,amt,o){ const r=base(e,amt,o); if(e&&e.type==='c2_alpha'&&e.state!=='dazed'&&o&&o.src!=='blast'&&o.src!=='burn'&&o.src!=='icicle'&&o.src!=='block') e.c2hint=G.time+0.8; return r; }; }

// ================= Icefang Cavern: the map
// ia the Slide (learn to stop), ib the Crossroads, ic the Wolf Den (fight), ig secret, ie the Block Hall (blocks are
// stops), if the Melt Gate (fire and the thaw), ih the Icicle Hall (icicles make blocks: plates open the glacier door),
// id the Frozen Lake (blocks freeze water, icicles make floes: key), ii the Glacier (all of it), ij the Frost Alpha,
// il the treasure (page p6), ik the vault. Every block puzzle room has a rune stone that puts it back.
c2Cave('icefang',{rooms:{
  ia:{at:[1,4],kind:'start',noPots:1,sign:S(`ICEFANG CAVERN. The floor is ice. Once you start sliding you cannot stop until you bump into something. Plan your stops! (Ulf fell over twice.)`,`ICE! You slide until you bump into something. Plan your stops!`),
    signs:[S(`Tip from Ulf: rocks are your friends. Slide into one on purpose.`,`Slide into a rock to stop.`)],
    intro:[['ash',S(`Ice. Lots of ice. Claws were not made for this.`,`So much ice! Claws are not good on ice.`)]],
    lay:['######...######',
         '#iiiiiiiiiiiii#',
         '#iiiiiiiiiiiii#',
         '#ii#iiiiiiiiii#',
         '#iiiiii#i#i#ii#',
         '#iiiiiii#i.iii#',
         '#.ii#iiiiiiiii#',
         '#iiiiiiiiiiiii#',
         '#iiiii#iiiii#i#',
         '#ii#iiiiiiiiii#',
         '#####s...?#####']},
  ib:{at:[1,3],kind:'free',noPots:1,intro:[['ash',S(`Four ways out. The ice gets a say in which one I take.`,`Four doors. The ice decides!`)]],
    lay:['######...######',
         '#iiiiiiiiiiiii#',
         '#i#iiii#iiiiii#',
         '##iiiii#iiiiii#',
         '.ii#iiiiiiiiii.',
         '.iiiii#iiiiiii.',
         '.iiiiiiiiii.ii.',
         '#i#ii#ii#iiiii#',
         '#iiiiiiiii#iii#',
         '#iiiiiiiiiiiii#',
         '######...######']},
  ic:{at:[0,3],kind:'fight',regrow:8,foes:[['wolf',3],['bat',2]],loot:['chest'],sign:S(`WOLF DEN. Wolves are fast on ice. Icicles are faster. Knock one down on a wolf's head.`,`Drop an icicle on a wolf!`),
    lay:['...............',
         '.s.............',
         '..iiiii.iiiii..',
         '..i;iii.iii;i..',
         '..iiiii.iiiii..',
         '.......X.......',
         '..iiiii.iiiii..',
         '..i;iii.iii;i..',
         '..iiiii.iiiii..',
         '...............',
         '...............']},
  ig:{at:[2,3],kind:'secret',loot:['coins','treat'],
    lay:['...............',
         '.*...........*.',
         '...iiiiiiiii...',
         '...iiiiiiiii...',
         '...ii.....ii...',
         '...ii.1.1.ii...',
         '...ii.....ii...',
         '...iiiiiiiii...',
         '...iiiiiiiii...',
         '.*...........*.',
         '...............']},
  ie:{at:[1,2],kind:'free',noPots:1,sign:S(`ICE BLOCKS slide too. Push one and it goes until it hits something. A block is a fine place to stop. The rune stone puts them back.`,`Push an ice block. It slides! Stop next to it.`),
    lay:['######...######',
         '#iiiiiiiiiiiii#',
         '#iiiiiiiiiiiii#',
         '#iiiiiiiiiiJii#',
         '.iii##iii.#ii#.',
         '.iii#iii#iiii..',
         '.iii#iii#ii###.',
         '#iiiiiiii#iiii#',
         '#iiiiiiiiiiiii#',
         '$iiiiiiiiiiiiis',
         '######...######']},
  if:{at:[0,2],kind:'free',noPots:1,sign:S(`THE MELT GATE. Fire turns an ice block into a pool of water. Wait a little and the pool freezes into ice again.`,`Fire melts ice blocks. The water freezes again soon.`),
    intro:[['ash',S(`A block stuck in a crack. I can't push it out. I could, however, set it on fire.`,`A stuck block. Time for fire!`)]],
    lay:['######...######',
         '#iii#i#i#iiiii#',
         '#iiiii#J#iiiii#',
         '#iiii##i#iiiii#',
         '#iiiiiiiii#iii.',
         '#iiiiiiiiiiiii.',
         '#iiiiiii#iiiii.',
         '#iiiiiiiiiJiii#',
         '#iiiiiiiiiiiiis',
         '$iiii##ii#iiii#',
         '###############']},
  ih:{at:[0,1],kind:'c2',goal:'plates',noPots:1,hint:S(`A wall of blue ice. A note frozen into it: "Two plates in the Icicle Hall, two blocks on top, and this wall will melt." West of here, then.`,`A wall of ice. Put blocks on the plates in the Icicle Hall.`),
    sign:S(`THE ICICLE HALL. Knock an icicle down and it turns into a brand new ice block. Push a block onto each plate.`,`Knock icicles down. They make blocks. Push blocks onto the plates!`),
    lay:['###############',
         '#iiiiii#iiiii$#',
         '#&iiiiiiiiii#i#',
         '#iiiiiiiiiiiii#',
         '#ii#iiiiiiiiii#',
         '#iiiiii;iiiiii#',
         '#iiiiiiiiii#ii#',
         '#iiiiiiiiiiiii#',
         '#i#iiii;iiiiii#',
         'siiiiiiiiii&ii#',
         '######...######']},
  id:{at:[2,2],kind:'c2',goal:'reach',reachAt:[12,9],reward:'key',noPots:1,sign:S(`THE FROZEN LAKE. Far too cold to swim. A block pushed into the water freezes it solid. An icicle dropped in the water makes a floe you can hop to.`,`Too cold to swim! Blocks freeze the water. Icicles make floes to hop on.`),
    lay:['iiiiaaaaaaaaaaa',
         'si#iaaaaaaa...a',
         'iJiiiiiaaii...a',
         'iiiiaaaaaaa...a',
         '.iiiaaaaaaaaaaa',
         '.iJiaaaaaaaa:aa',
         '.ii#aaaaaaaaaaa',
         'iiiiaaaaaaaaaaa',
         'iiiiaaaaaaa...a',
         'iiiiaaaaaaa.X.a',
         '$iiiaaaaaaa..1a']},
  ii:{at:[1,1],kind:'free',noPots:1,sign:S(`THE GLACIER. Bridge the water, make a stop, melt the plug. Ulf says it took him all afternoon.`,`Freeze a bridge. Make a stop. Melt the plug!`),
    intro:[['ash',S(`Water, a stuck block, and an icicle. I think this room wants everything I've got.`,`This room needs every trick!`)]],
    lay:['######...######',
         '#######i#######',
         '#######J#######',
         '#######i#######',
         '#ii#iiii;iiiii#',
         '#ii#iiiiiiiiii#',
         'aaaaaaaaaaaaaaa',
         '#iiii#iiiiiiiis',
         '#iiiJiiiiiiiii#',
         '#ii#iiiiiiiiii$',
         '######...######']},
  ij:{at:[1,0],span:[2,1],kind:'boss',regrow:10,boss2:{type:'c2_alpha',name:S('The Frost Alpha','The Big Ice Wolf')},loot:['qitem'],reward:'key',noPots:1,
    winText:S('The Frost Alpha limps off into the dark, and the pack goes with him. The vault door thaws.','The wolf runs away. The vault opens!'),
    intro:[['ash',S(`A wolf the size of a cart, on a floor made of ice. He can't stop on it either. Let's see who hits the wall first.`,`A huge wolf on the ice! He can't stop either.`)]],
    sign:S(`Ulf's note: "The Alpha charges straight. Put something hard in his way, or drop the roof on him."`,`He charges straight. Put a block in his way!`),
    lay:['.s.............Q...............',
         '.iiiiiiiiiiiiiiiiiiiiiiiiiiiii.',
         '.i;iiiiiii;iiiiiiiii;iiiiiii;i.',
         '.iiiiii##iiiiiiiiiiiii##iiiiii.',
         '.iiiiiiiiiiiiiiAiiiiiiiiiiiiii.',
         '.i;iiiiiiiiiiiiiiiiiiiiiiiii;i.',
         '.iiiiiiiiiiiiiiiiiiiiiiiiiiiii.',
         '.iiiiii##iiiiiiiiiiiii##iiiiii.',
         '.i;iiiiiii;iiiiiiiii;iiiiiii;i.',
         '.iiiiiiiiiiiiiiiiiiiiiiiiiiiii.',
         '...............X...............']},
  il:{at:[2,1],kind:'treasure',loot:['chest','page:p6'],
    lay:['...............',
         '.*...........*.',
         '...iiiiiiiii...',
         '...i.......i...',
         '...i...G...i...',
         '...i.......i...',
         '...i...X...i...',
         '...i.......i...',
         '...iiiiiiiii...',
         '.*...........*.',
         '...............']},
  ik:{at:[0,0],kind:'treasure',
    lay:['...............',
         '.*...........*.',
         '..iiiiiiiiiii..',
         '..i.........i..',
         '..i.........i..',
         '..i....H....i..',
         '..i.........i..',
         '..i.........i..',
         '..iiiiiiiiiii..',
         '.*...........*.',
         '...............']}},
  links:[['ia','ib','open'],['ib','ic','open'],['ib','ig','crack'],['ib','ie','open'],['ie','if','open'],['ie','id','open'],['ie','ii','gate:ih'],
    ['if','ih','open'],['ii','ij','lock',{at:1}],['ij','il','lock'],['ij','ik','gate:ij']]},
  {dark:0.45});
CAVE_SECRETS=countCaveSecrets();

// ================= The Ember Deep pieces: lava waves, cooling crystals, magma geysers, heat
// Waves: a room with a `wave` field floods its basalt on a clock: low basalt ('-') at level 1, mid basalt (',') at
// level 2 (the room field `waveMid` can give mid basalt a clock of its own). wave: {per, lo:[from,to], hi:[from,to],
// off, sweep (seconds of delay per column, or per row with axis:'y': the flood rolls across the room), calm:'<room>'
// (once that room is solved this clock never goes past level 1), boss:1 (only in the boss's second phase)}.
// Cooled stone (st 1) never floods. Basalt glows a warning before it floods.
const C2COOL=7;
C2POST.push((A,def)=>{
  const Z=A.c2, c=A.cave, n=c.w*c.h; if(!Object.values(A.rooms).some(R=>R.wave)) return;
  Z.wv=new Int8Array(n).fill(-1); Z.woff=new Float32Array(n); Z.waves=[];
  for(const id in A.rooms){ const R=A.rooms[id]; if(!R.wave) continue;
    const wl=Z.waves.length; Z.waves.push(Object.assign({room:id},R.wave)); let wm=wl; if(R.waveMid){ wm=Z.waves.length; Z.waves.push(Object.assign({room:id},R.waveMid)); }
    for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i, t=c.typ[k]; if(t!==C2.T.low&&t!==C2.T.mid) continue; const wi=t===C2.T.mid?wm:wl, W=Z.waves[wi];
      Z.wv[k]=wi; Z.woff[k]=-(W.axis==='y'?(j-R.oy-1):(i-R.ox-1))*(W.sweep||0); } }
});
function c2WaveLv(W,t){
  if(W.boss){ const Z=AREA.c2, b=Z.boss; if(!b||b.dead||!b.angry) return 0; }
  const per=W.per, ph=(((t+(W.off||0))%per)+per)%per; let lv=0;
  if(W.lo&&ph>=W.lo[0]&&ph<W.lo[1]) lv=1; if(W.hi&&ph>=W.hi[0]&&ph<W.hi[1]) lv=2;
  if(lv>1&&W.calm){ const R=AREA.rooms[W.calm]; if(R&&R.solved) lv=1; }
  return lv;
}
function c2Flood(k){ const Z=AREA.c2; if(!Z||!Z.wv) return 0; const wi=Z.wv[k]; if(wi<0) return 0; return c2WaveLv(Z.waves[wi],Z.t+Z.woff[k]); }
// how long until this basalt cell floods (Infinity when it will not within `ahead` seconds)
function c2FloodIn(k,ahead){ const Z=AREA.c2, wi=Z.wv[k], need=AREA.cave.typ[k]===C2.T.mid?2:1; if(wi<0) return Infinity; const W=Z.waves[wi]; for(let s=0;s<=ahead;s+=0.1){ if(c2WaveLv(W,Z.t+Z.woff[k]+s)>=need) return s; } return Infinity; }
// ---------- cooling crystals: a hit (claws, arrows, a roar, a bomb) and a cold burst turns lava within 2.5 cells
// into stone for C2COOL seconds; a beam crystal sends a 7 cell beam straight away from Ash instead. Foes caught in the
// cold are chilled; Ash's heat drops to nothing.
C2MAKE.crys=(A,def,R,m,k)=>{ const Z=A.c2; const o=c2Obj(A,R,m,'crys',{solid:1,tall:1,beam:m.opt==='beam',cd:0,flash:0,r:18,cdMax:R.crysCd||1.2}); Z.occ.set(k,o); Z.crys.push(o); A.lights.push({x:o.x,y:o.y-12,r:190,i:0.55}); return o; };
const C2CHILL={};
function c2Coolable(k){ const t=AREA.cave.typ[k]; return t===C2.T.lava||t===C2.T.low||t===C2.T.mid; }
function c2CrysHit(o){
  if(o.cd>0) return false; const A=AREA, Z=A.c2, c=A.cave, cs=c.cell, p=player; o.cd=o.cdMax; o.flash=0.7;
  SFX.play('shrine',0.7); SFX.play('block',0.5); shake(3);
  const cells=[];
  if(o.beam){ const d=c2Axis(angTo(p.x,p.y,o.x,o.y)), [dx,dy]=C2DIR[d]; o.beamD=d;
    for(let s=1;s<=7;s++){ const i=o.ci+dx*s, j=o.cj+dy*s, k=j*c.w+i; if(i<0||j<0||i>=c.w||j>=c.h||c.grid[k]===1) break; cells.push(k); }
    Z.beams=(Z.beams||[]).concat([{x0:o.x,y0:o.y,x1:c2X(o.ci+dx*(cells.length)),y1:c2Y(o.cj+dy*(cells.length)),t:0.6}]); }
  else { for(let dj=-3;dj<=3;dj++) for(let di=-3;di<=3;di++){ if(di*di+dj*dj>6.25) continue; const i=o.ci+di, j=o.cj+dj; if(i<0||j<0||i>=c.w||j>=c.h) continue; cells.push(j*c.w+i); }
    G.rings.push({x:o.x,y:o.y,rad:10,max:cs*2.6,speed:420,thick:10,dmg:0,kb:0,col:'170,230,255'}); }
  for(const k of cells) if(c2Coolable(k)) c2SetTimed(k,1,C2COOL);
  // the cold caps any geyser it reaches
  for(const g of Z.geysers) if(cells.includes(g.cj*c.w+g.ci)) g.capT=C2COOL;
  for(const k of cells){ const [i,j]=c2IJ(k); if(Math.random()<0.5) emit(c2X(i),c2Y(j),2,{col:'200,240,255',glow:false,ang:-Math.PI/2,spread:1.2,smin:20,smax:70,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:6}); }
  const inCold=(x,y,r)=>cells.some(k=>{ const [i,j]=c2IJ(k); return Math.abs(c2X(i)-x)<cs*0.5+r&&Math.abs(c2Y(j)-y)<cs*0.5+r; })||dist(x,y,o.x,o.y)<cs*1.2+r;
  for(const e of G.enemies){ if(e.dead||!e.inArea||!inCold(e.x,e.y,e.r*0.5)) continue; if(e.c2boss&&C2CHILL[e.type]) C2CHILL[e.type](e,o); else { stunEnemy(e,1.2); e.burnT=0; } }
  if(inCold(p.x,p.y,4)) Z.heat=0;
  if(!Z.saidCool){ Z.saidCool=1; setBanner(S('Brrr!','Brrr!'),S(`The lava turns to stone. It will not stay that way for long!`,`The lava is stone now. Hurry!`),2.2); }
  return true;
}
C2SWING.crys=o=>c2CrysHit(o); C2ROAR.crys=o=>c2CrysHit(o);
C2HIT.crys=(o,src)=>{ if(src==='fire'){ if(!(o.hintT>G.time)){ o.hintT=G.time+2; ftext(o.x,o.y-34,S('Fire only warms it. Hit it!','Hit it!'),'#cfefff',12); } return; } c2CrysHit(o); };
C2FIRE.crys=o=>{ if(!(o.hintT>G.time)){ o.hintT=G.time+2.5; ftext(o.x,o.y-34,S('Fire only warms it. Hit it!','Hit it!'),'#cfefff',12); } };
C2BLAST.crys=(o,ci,cj)=>{ if(Math.max(Math.abs(o.ci-ci),Math.abs(o.cj-cj))<=2) c2CrysHit(o); };
C2UPD.crys=(o,dt)=>{ if(o.cd>0) o.cd-=dt; if(o.flash>0) o.flash-=dt; };
C2ACT.crys=o=>c2Say(S(`A cold blue crystal, humming. Hit it and the cold bursts out of it.`,`A cold crystal. Hit it!`));
// ---------- magma geysers: each one keeps its own beat (quiet, a bubbling warning, then a column of fire). A
// geyser under cooled stone is capped. A launch geyser ('z') throws whoever stands on it 4 cells the way they face.
C2MAKE.geyser=(A,def,R,m)=>{ const Z=A.c2, n=Z.geysers.filter(g=>g.room===R.id).length, Gc=R.geyser||{};
  const o=c2Obj(A,R,m,'geyser',{launch:m.opt==='launch',per:Gc.per||4.2,len:Gc.len||1.1,off:(Gc.offs&&Gc.offs[n]!=null)?Gc.offs[n]:n*1.4,ph:'idle',hitP:false,r:20}); Z.geysers.push(o); A.lights.push({x:o.x,y:o.y,r:130,i:0.35,fire:true}); return o; };
C2UPD.geyser=(o,dt)=>{
  const A=AREA, Z=A.c2, c=A.cave, k=o.cj*c.w+o.ci, p=player, cs=c.cell;
  if(o.capT>0) o.capT-=dt; const capped=o.capT>0;
  const per=o.per, ph=(((Z.t+o.off)%per)+per)%per, erupt=ph>=per-o.len, warn=!erupt&&ph>=per-o.len-1.0;
  const was=o.ph; o.ph=capped?'capped':erupt?'erupt':warn?'warn':'idle';
  if(o.ph==='erupt'&&was!=='erupt'){ o.hitP=false; o.hitE=new Set(); if(inView(o.x,o.y,200)){ SFX.play('cast',0.5); mvSnd('sizzle',0.5); }
    if(o.launch&&!p.dead&&!Z.lock&&!airborne()&&c2K(p.x,p.y)===k) c2Launch(o); }
  if(o.ph!=='erupt') return;
  if(Math.random()<dt*50&&inView(o.x,o.y,150)) emit(o.x+rand(-8,8),o.y-4,1,{kind:'fire',ang:-Math.PI/2,spread:0.35,smin:120,smax:320,lmin:.3,lmax:.6,zmin:3,zmax:7,grow:6,drag:1});
  if(o.launch) return;
  if(!o.hitP&&!p.dead&&Math.abs(p.x-o.x)<cs*0.55&&Math.abs(p.y-o.y)<cs*0.55){ o.hitP=true; hurtPlayer(p.maxHp*0.12/Math.max(0.01,(G.diff&&G.diff.dmg)||1),o.x,o.y+12,300); ftext(p.x,p.y-30,S('Yeowch!','Ow!'),'#ffb070',14); }
  for(const e of G.enemies){ if(e.dead||!e.inArea||e.lavaProof||o.hitE.has(e.id)) continue; if(dist(e.x,e.y,o.x,o.y)<cs*0.6+e.r*0.5){ o.hitE.add(e.id); damageEnemy(e,20+6*(A.level||1),{src:'geyser',kb:200,ka:angTo(o.x,o.y,e.x,e.y)}); e.burnT=Math.max(e.burnT,1.5); e.burnDps=Math.max(e.burnDps,e.maxHp*0.06); } }
};
function c2Launch(o){
  const A=AREA, Z=A.c2, c=A.cave, p=player, d=c2Axis(p.facing), [dx,dy]=C2DIR[d], R=A.rooms[o.room];
  let s=4; for(;s>0;s--){ const i=o.ci+dx*s, j=o.cj+dy*s, k=j*c.w+i; if(i>=0&&j>=0&&i<c.w&&j<c.h&&c.grid[k]!==1&&!Z.occ.get(k)) break; }
  if(s<=0) return;
  Z.lock={kind:'launch',x0:p.x,y0:p.y,x1:c2X(o.ci+dx*s),y1:c2Y(o.cj+dy*s),t:0,dur:0.8,h:120}; Z.slide=null; p.facing=Math.atan2(dy,dx);
  SFX.play('roll'); SFX.play('cast',0.6); shake(4); emit(o.x,o.y,24,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:120,smax:360,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:8});
  if(!Z.saidLaunch){ Z.saidLaunch=1; setBanner(S('WHOOSH!','WHOOSH!'),S('The geyser throws you the way you face.','It throws you where you face!'),1.8); }
}
// ---------- heat: lava right next to Ash slowly cooks him (the gauge over his head fills); full heat hurts
function c2Heat(dt){
  const A=AREA, Z=A.c2, p=player, w=A.cave.w; if(p.dead||scene!=='play') return;
  const k=c2K(p.x,p.y); let n=0;
  if(k>=0&&!Z.lock){ const [i,j]=c2IJ(k); for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const q=(j+dj)*w+i+di; if(q>=0&&c2Kind(q)==='lava') n++; } }
  if(n>0) Z.heat=Math.min(1,Z.heat+dt*(0.06+0.035*n)); else Z.heat=Math.max(0,Z.heat-dt*0.3);
  if(Z.heat>=1){ Z.heatT=(Z.heatT||0)-dt; if(Z.heatT<=0){ Z.heatT=0.7; if(!(window.__eb&&window.__eb.god)){ const d=Math.ceil(p.maxHp*0.03*Math.min(1,(G.diff&&G.diff.dmg)||1)); p.hp-=d; p.lastHurt=G.time; p.hurtFlash=0.12; if(settings.nums) ftext(p.x,p.y-22,'-'+d,'#ff8a5a',13); if(p.hp<=0){ p.hp=0; playerDied(); return; } } mvSnd('sizzle',0.4); if(!Z.saidHeat){ Z.saidHeat=1; ftext(p.x,p.y-40,S('Too hot! Move away from the lava!','Too hot! Move away!'),'#ffb070',14); } } }
  else Z.heatT=0.2;
}
function c2DrawHeat(t){
  const Z=AREA.c2, p=player, h=Z.heat; if(!p||p.dead||h<0.03) return;
  const x=p.x, y=p.y-46-(p.z||0), w=34, full=h>=1;
  ctx.fillStyle='rgba(20,8,4,.7)'; rrect(ctx,x-w/2-2,y-4,w+4,8,4); ctx.fill();
  const col=full?(Math.sin(t*16)>0?'#ff4a2a':'#ffd060'):h>0.7?'#ff7a2a':'#ffb040';
  ctx.fillStyle=col; rrect(ctx,x-w/2,y-2,w*h,4,2); ctx.fill();
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x-w/2-9,y+3); ctx.quadraticCurveTo(x-w/2-14,y-2,x-w/2-9,y-9); ctx.quadraticCurveTo(x-w/2-4,y-2,x-w/2-9,y+3); ctx.fill();
}
// ---------- Deep art: live lava, flooding basalt (with its warning glow), cooled stone, beams, crystals, geysers
function c2LavaTile(v){ return c2Spr('lava'+v,48,48,(g)=>{ g.fillStyle='#b8320e'; g.fillRect(0,0,48,48); const r=mulberry32(v*17+3);
  for(let s=0;s<4;s++){ g.fillStyle=s%2?'#e8641a':'#ff9a3a'; g.beginPath(); g.ellipse(r()*48,r()*48,4+r()*8,2+r()*4,r()*3,0,TAU); g.fill(); }
  g.fillStyle='#4a1a10'; for(let s=0;s<2;s++){ g.beginPath(); g.ellipse(r()*48,r()*48,3+r()*6,2+r()*4,r()*3,0,TAU); g.fill(); } }); }
function c2CoolTile(v){ return c2Spr('cool'+v,48,48,(g)=>{ g.fillStyle='#3e3436'; g.fillRect(0,0,48,48); g.fillStyle='#4e4446'; g.fillRect(3,3,42,42);
  g.strokeStyle='#8ad0f0'; g.lineWidth=1.4; g.globalAlpha=0.55; g.beginPath(); g.moveTo(6,10+v*3); g.lineTo(20,18); g.lineTo(30,12); g.lineTo(42,22); g.moveTo(20,18); g.lineTo(18,34); g.lineTo(28,42); g.stroke(); g.globalAlpha=1;
  g.fillStyle='rgba(220,245,255,.35)'; g.fillRect(4,4,40,3); }); }
C2CELLDRAW.push((A,Z,c,cs,i0,j0,i1,j1,t)=>{
  if(A.def.theme!=='ember') return; const T=C2.T;
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*c.w+i, ty=c.typ[k]; if(ty!==T.lava&&ty!==T.low&&ty!==T.mid) continue;
    const x=A.x0+i*cs, y=A.y0+j*cs, s=Z.st[k];
    if(s===1){ const left=Z.tm[k]; ctx.drawImage(c2CoolTile((i+j)%3),x,y,cs,cs); if(left<1.6){ const a=(Math.sin(t*(left<0.6?30:14))*0.5+0.5)*0.55*(1-left/1.6); ctx.fillStyle=`rgba(255,110,30,${a})`; ctx.fillRect(x,y,cs,cs); } continue; }
    const lv=ty===T.lava?3:c2Flood(k), need=ty===T.mid?2:1;
    if(ty===T.lava||lv>=need){ if(ty!==T.lava) ctx.drawImage(c2LavaTile((i*3+j)%4),x,y,cs,cs); const q=Math.sin(t*2.2+i*0.9+j*1.3); if(q>0.4){ ctx.fillStyle=`rgba(255,220,120,${(q-0.4)*0.35})`; ctx.beginPath(); ctx.ellipse(x+cs/2,y+cs/2,cs*0.3,cs*0.16,0,0,TAU); ctx.fill(); } continue; }
    // dry basalt: glows hotter and hotter as the lava comes
    const s2=c2FloodIn(k,1.6); if(s2<1.6){ const a=(1-s2/1.6); ctx.fillStyle=`rgba(255,${120-a*60|0},30,${0.15+0.45*a*(0.6+0.4*Math.sin(t*18))})`; ctx.fillRect(x+1,y+1,cs-2,cs-2); }
  }
  if(Z.beams&&Z.beams.length){ for(const b of Z.beams){ b.t-=1/60; const a=Math.max(0,b.t/0.6); ctx.strokeStyle=`rgba(190,240,255,${0.8*a})`; ctx.lineWidth=12*a+2; ctx.beginPath(); ctx.moveTo(b.x0,b.y0); ctx.lineTo(b.x1,b.y1); ctx.stroke(); ctx.strokeStyle=`rgba(255,255,255,${a})`; ctx.lineWidth=3; ctx.stroke(); } Z.beams=Z.beams.filter(b=>b.t>0); }
});
function c2CrysSpr(beam){ return c2Spr('crys'+(beam?1:0),44,60,(g)=>{
  g.fillStyle='#3a3440'; g.beginPath(); g.ellipse(22,52,16,6,0,0,TAU); g.fill(); g.strokeStyle=C2INK; g.lineWidth=2; g.stroke();
  const pts=beam?[[22,2],[34,22],[30,50],[14,50],[10,22]]:[[22,4],[36,26],[28,50],[16,50],[8,26]];
  g.fillStyle=beam?'#7ad8ff':'#9ae6ff'; g.beginPath(); g.moveTo(...pts[0]); for(const q of pts.slice(1)) g.lineTo(...q); g.closePath(); g.fill(); g.strokeStyle='#1e4a66'; g.lineWidth=2.4; g.stroke();
  g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(22,6); g.lineTo(16,26); g.lineTo(20,46); g.lineTo(22,26); g.closePath(); g.fill();
  if(beam){ g.strokeStyle='#ffffff'; g.lineWidth=2; g.beginPath(); g.moveTo(22,14); g.lineTo(22,40); g.moveTo(14,27); g.lineTo(30,27); g.stroke(); }
  else { g.fillStyle='rgba(60,140,190,.4)'; g.beginPath(); g.moveTo(26,10); g.lineTo(34,26); g.lineTo(27,48); g.closePath(); g.fill(); } }); }
C2TALL.crys=(o,t)=>{
  const ready=o.cd<=0, pulse=0.5+0.5*Math.sin(t*3+o.ci);
  glowAt(o.x,o.y-14,ready?46:24,'150,220,255',ready?0.22+0.12*pulse:0.08);
  ctx.save(); if(!ready) ctx.globalAlpha=0.55+0.45*(1-o.cd/o.cdMax); c2Blit(c2CrysSpr(o.beam),o.x,o.y-16,44,60); ctx.restore();
  if(o.flash>0){ ctx.fillStyle=`rgba(230,250,255,${o.flash})`; ctx.beginPath(); ctx.arc(o.x,o.y-18,22+(0.7-o.flash)*30,0,TAU); ctx.fill(); }
};
C2FLOOR.geyser=(o,t)=>{
  const x=o.x, y=o.y, cs=c2cs();
  ctx.fillStyle='#2a1410'; ctx.beginPath(); ctx.ellipse(x,y,cs*0.36,cs*0.24,0,0,TAU); ctx.fill(); ctx.strokeStyle=o.launch?'#ffd060':'#7a3a20'; ctx.lineWidth=o.launch?3:2.5; ctx.stroke();
  if(o.launch){ ctx.strokeStyle='rgba(255,210,90,.7)'; ctx.lineWidth=2; for(let a=0;a<4;a++){ const q=a*Math.PI/2; ctx.beginPath(); ctx.moveTo(x+Math.cos(q)*cs*0.42,y+Math.sin(q)*cs*0.3); ctx.lineTo(x+Math.cos(q)*cs*0.56,y+Math.sin(q)*cs*0.4); ctx.stroke(); } }
  if(o.ph==='capped'){ ctx.fillStyle='#4e4446'; ctx.beginPath(); ctx.ellipse(x,y,cs*0.3,cs*0.18,0,0,TAU); ctx.fill(); if(Math.random()<0.05) emit(x,y-4,1,{col:'220,220,230',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:30,lmin:.5,lmax:1,zmin:2,zmax:4,grow:6}); return; }
  const hot=o.ph==='warn'?0.5+0.5*Math.sin(t*24):o.ph==='erupt'?1:0.2;
  ctx.fillStyle=`rgba(255,${o.ph==='warn'?150:110},40,${0.4+0.5*hot})`; ctx.beginPath(); ctx.ellipse(x,y,cs*0.24,cs*0.15,0,0,TAU); ctx.fill();
  if(o.ph==='warn'){ ctx.strokeStyle=`rgba(255,180,80,${0.5+0.4*Math.sin(t*20)})`; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.ellipse(x,y,cs*0.5,cs*0.32,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
};
C2SKY.geyser=(o,t)=>{
  if(o.ph!=='erupt') return; const per=o.per, ph=(((AREA.c2.t+o.off)%per)+per)%per, q=clamp((ph-(per-o.len))/o.len,0,1), h=(q<0.2?q/0.2:q>0.8?(1-q)/0.2:1)*130;
  const x=o.x, y=o.y; const gr=ctx.createLinearGradient(0,y-h,0,y); gr.addColorStop(0,'rgba(255,240,180,0)'); gr.addColorStop(0.3,'rgba(255,170,60,.85)'); gr.addColorStop(1,'rgba(255,90,20,.95)');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(x-14,y); ctx.quadraticCurveTo(x-20+Math.sin(t*30)*3,y-h*0.5,x-6,y-h); ctx.lineTo(x+6,y-h); ctx.quadraticCurveTo(x+20+Math.sin(t*27)*3,y-h*0.5,x+14,y); ctx.closePath(); ctx.fill();
  glowAt(x,y-h*0.4,90,'255,150,60',0.35);
};
// lights over flooding basalt follow the tide
function c2GlowTick(){ const Z=AREA.c2; if(!Z.glow) return; for(const g of Z.glow){ let f=0; for(const k of g.ks){ if(c2Kind(k)==='lava') f++; } g.L.i=0.55*f/g.ks.length; } }

// ---------- The Ember Knight: the last guard of the Deep, in armour that glows like a forge. His heat shield turns
// almost every blow aside, until a cooling crystal bursts next to him: chilled, he slows down and every hit counts
// double. Below half health the lava answers him and the arena's basalt floods in waves.
Object.assign(EDEF,{c2_knight:{r:26,hp:340,speed:140,dmg:16,value:380,mini:true,kbRes:0.5,name:'The Ember Knight',title:'Last guard of the Ember Deep',short:'The burning knight'}});
DCOL.c2_knight='255,140,60';
C2BOSSINIT.c2_knight=(e,R)=>{ e.state='walk'; e.st=2; e.lavaProof=true; e.chill=0; e.cd=2.5; };
AI.c2_knight=(e,dt)=>{
  const p=player, A=AREA, R=A&&A.rooms&&A.rooms[e.room]; if(!R) return; const d=dist(e.x,e.y,p.x,p.y), a=angTo(e.x,e.y,p.x,p.y);
  e.st-=dt; e.cd-=dt; e.dx=e.dy=0; if(e.chill>0) e.chill-=dt; e.burnT=0;
  const cold=e.chill>0; e.c2mul=cold?2:0.15; const spd=e.speed*(cold?0.45:1);
  if(e.hp<e.maxHp*0.5&&!e.angry){ e.angry=true; taunt('narr',S('The Ember Knight raises his blade, and the lava rises with it!','He lifts his sword. The lava rises!')); shake(8); }
  switch(e.state){
    case 'walk': steer(e,p.x,p.y,spd); e.face=turnTo(e.face,a,(cold?2:5)*dt);
      if(e.st<=0){ if(d<100){ e.state='slashW'; e.st=cold?0.85:0.55; e.face=a; e.tele=newTele({shape:'cone',r:120,a:1.2,dur:e.st}); }
        else if(e.cd<=0){ e.cd=e.angry?2.4:3.4; if(Math.random()<0.55){ e.state='volley'; e.st=0.6; } else { e.state='slamW'; e.st=0.85; e.tele=newTele({shape:'circle',r:160,dur:0.85}); } } }
      break;
    case 'slashW': if(e.st<=0){ e.tele=null; e.state='slash'; e.st=0.25; e.hitP=false; SFX.play('slash3'); } break;
    case 'slash': if(!e.hitP&&d<e.r+p.r+80){ let da=a-e.face; while(da>Math.PI) da-=TAU; while(da<-Math.PI) da+=TAU; if(Math.abs(da)<0.8&&hurtPlayer(e.dmg,e.x,e.y,320)) e.hitP=true; } if(e.st<=0){ e.state='walk'; e.st=0.9; } break;
    case 'volley': e.face=turnTo(e.face,a,6*dt); if(e.st<=0){ for(const o of e.angry?[-0.45,-0.22,0,0.22,0.45]:[-0.26,0,0.26]) shoot(e.x,e.y,a+o,250,10,e.dmg*0.7,'fireball','enemy',{life:2.4}); SFX.play('cast'); e.state='walk'; e.st=1.3; } break;
    case 'slamW': if(e.st<=0){ e.tele=null; shake(8); SFX.play('boom'); G.rings.push({x:e.x,y:e.y,rad:e.r,max:250,speed:380,thick:16,dmg:e.dmg*0.8,kb:300}); e.state='walk'; e.st=1.3; } break;
    default: e.state='walk'; e.st=1;
  }
  arenaClamp(e,40);
};
C2CHILL.c2_knight=e=>{ const was=e.chill>0; e.chill=4.5; e.tele=null; if(e.state!=='walk'){ e.state='walk'; e.st=0.8; } if(!was){ setBanner(S('Chilled!','Chilled!'),S('His heat shield is out. Hit him now!','His shield is off! Hit him!'),1.8); } };
C2BOSSBLAST.c2_knight=(e,x,y)=>{ damageEnemy(e,e.maxHp*0.04,{src:'blast'}); };
C2FOEDRAW.c2_knight=(e,fl)=>{
  const t=G.time, cold=e.chill>0;
  if(!cold){ glowAt(e.x,e.y,e.r*2.6,'255,130,50',0.28+0.1*Math.sin(t*5)); ctx.strokeStyle=`rgba(255,170,80,${0.35+0.2*Math.sin(t*6)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(e.x,e.y,e.r+10+Math.sin(t*4)*2,0,TAU); ctx.stroke(); }
  if(T3.on&&T3E.cindervane) c2Big(e,1.35,()=>T3E.cindervane(e,fl)); else drawKnight(e,1.7,fl,true);
  if(cold){ ctx.fillStyle='rgba(160,220,255,.28)'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r+6,0,TAU); ctx.fill(); for(let i=0;i<3;i++){ const q=t*2+i*2.1; ctx.fillStyle='rgba(230,250,255,.8)'; ctx.beginPath(); ctx.arc(e.x+Math.cos(q)*e.r,e.y-e.r*0.6+Math.sin(q)*6,2,0,TAU); ctx.fill(); } }
  if(e.c2hint>G.time){ ctx.font=`700 12px ${UIF}`; ctx.textAlign='center'; ctx.fillStyle='#ffd0a0'; ctx.fillText(simplify(C2TXT.hot),e.x,e.y-e.r-24); }
};
{ const base=damageEnemy; damageEnemy=function(e,amt,o){ const r=base(e,amt,o); if(e&&e.type==='c2_knight'&&!(e.chill>0)&&o&&o.src!=='blast'&&o.src!=='burn') e.c2hint=G.time+0.8; return r; }; }

// ================= The Ember Deep: the map
// da the Causeway (the tide), db the Geyser Cross, dc the Crystal Lake (lever: opens the Tide Hall), dd a fight,
// de the Tide Hall (the big wave sweeps across), df the Launch (geysers throw you: key), dg secret, dh the Sluice
// (beam crystals; its lever calms the Forge; page p10), di the Forge (all of it), dl a fight, dj the Ember Knight,
// dk the Wardens' vault (the Warden's Mantle and the Heart Ember).
c2Cave('deep',{rooms:{
  da:{at:[1,4],kind:'start',noPots:1,wave:{per:6,lo:[0,3],axis:'y',sweep:0.35},
    sign:S(`THE EMBER DEEP. The lava breathes in and out. When the dark stone glows, it is about to flood. Stay off the hot edges: standing next to lava cooks you. Whoever reads this: the Wardens left their last gift at the very top.`,`The lava goes up and down. Glowing stone floods next! Do not stand by the lava too long.`),
    signs:[S(`Watch the gauge over your head. When it is full, get away from the lava!`,`Full gauge? Get away from the lava!`)],
    intro:[['ash',S(`Hot. Very hot. Even for a fire dragon, this is a lot.`,`So hot! Even for me.`)]],
    lay:['~~~~~~...~~~~~~',
         '~~~~~~...~~~~~~',
         '~~~~~~---~~~~~~',
         '~~~~~~---~~~~~~',
         '~~~~~~---~~~~~~',
         '~~~~~~...~~~~~~',
         '~~~~~~---~~~~~~',
         '~~~~~~---~~~~~~',
         '...............',
         '.s...........?.',
         '##...........##']},
  db:{at:[1,3],kind:'free',noPots:1,geyser:{per:4,len:1.1,offs:[0,2,0,2,2,0]},hint:S(`A door of black glass, cold to the touch. It answers to a lever somewhere west, across the Crystal Lake.`,`A glass door. Pull the lever by the Crystal Lake.`),
    sign:S(`GEYSERS. Each one keeps its own beat. Watch it bubble, wait for the fire, then go.`,`Geysers! Wait for the fire. Then go!`),
    lay:['~~~~~~...~~~~~~',
         '~~~~~~~g~~~~~~~',
         '~~~~~~~.~~~~~~~',
         '~~~~~~~g~~~~~~~',
         '~~~~~~...~~~~~~',
         '...g.g.....g.g.',
         '~~~~~~...~~~~~~',
         '~~~~~~~.~~~~~~~',
         '~~~~~~~.~~~~~~~',
         '~~~~~~~.~~~~~~s',
         '~~~~~~...~~~~~~']},
  dc:{at:[0,3],kind:'c2',goal:'lever',levers:[{solve:1}],noPots:1,
    sign:S(`THE CRYSTAL LAKE. Hit a crystal and its cold turns the lava to stone, for a little while. Hop from one cold patch to the next.`,`Hit a crystal. The lava turns to stone for a bit. Go!`),
    intro:[['ash',S(`Blue crystals, sitting in lava, perfectly cold. I love this place and I hate it.`,`Cold crystals in hot lava. Weird!`)]],
    lay:['~~~~~~~~~~~~~~~',
         '~~~~~~~~~~~~~~~',
         '~....~~~~~~~~~~',
         '~.y..~~~~~~~...',
         '~....f~~f~~f...',
         '~~~~~~~~~~~~...',
         '~~~~~~~~~~~~...',
         '~~~~~~~~~~~~.s.',
         '~~~~~~~~~~~~~~~',
         '~~~~~~~~~~~~~~~',
         '~~~~~~~~~~~~~~~']},
  dd:{at:[2,3],kind:'fight',geyser:{per:4.6,len:1.1,offs:[0,2.3]},foes:[['drakeling',3],['knight',1]],loot:['chest'],
    lay:['...............',
         '.*...........*.',
         '...~~~...~~~...',
         '...~~~...~~~...',
         '.......g.......',
         '.......X.......',
         '.......g.......',
         '...~~~...~~~...',
         '...~~~...~~~...',
         '.*...........*.',
         '...............']},
  de:{at:[1,2],kind:'free',noPots:1,wave:{per:7,lo:[0,2.8],hi:[1.0,2.0],sweep:0.2},
    sign:S(`THE TIDE HALL. Every few breaths a big wave rolls across the hall. When the stone glows, find solid ground!`,`A big wave rolls across. Stand on plain ground when the stone glows!`),
    lay:['~~~~~~...~~~~~~',
         '~.1.~~---~~.1.~',
         '~...~~---~~...~',
         '~~-~~~---~~~-~~',
         '..,,,,...,,,,..',
         '..,,,,...,,,,..',
         '..,,,,...,,,,..',
         '~~-~~~---~~~-~~',
         '~...~~---~~...~',
         '~.s.~~---~~.2.~',
         '~~~~~~...~~~~~~']},
  df:{at:[0,2],kind:'c2',goal:'reach',reachAt:[7,1],reward:'key',noPots:1,geyser:{per:3.4,len:0.9,offs:[0,1.1,2.2]},
    sign:S(`THE LAUNCH. Stand on a gold-ringed geyser and face where you want to go. When it blows, you fly.`,`Stand on a gold geyser. Face where you want to fly. WHOOSH!`),
    intro:[['ash',S(`A geyser that throws dragons across lava. Who designed this cave? I want a word.`,`A geyser that throws you? Okay!`)]],
    lay:['~~~~~~...~~~~~~',
         '~~~~~~.X.~~~~~~',
         '~~~~~~z..~~~~~~',
         '~~~~~~~~~~~~~~~',
         '~~~~~~~~~~~....',
         '~~~~~~~~~~~....',
         '~~~~~..z~~~....',
         '~~~~~...~~~z...',
         '~~~~~...~~~..s.',
         '~~~~~~~~~~~~~~~',
         '~~~~~~~~~~~~~~~']},
  dg:{at:[2,2],kind:'secret',loot:['coins','treat'],
    lay:['...............',
         '.*...........*.',
         '...~~~~~~~~~...',
         '...~.......~...',
         '...~..1.1..~...',
         '...~.......~...',
         '...~~~~~~~~~...',
         '...............',
         '...............',
         '.*...........*.',
         '...............']},
  dh:{at:[0,1],kind:'c2',goal:'lever',levers:[{solve:1}],loot:['chest','page:p10'],noPots:1,geyser:{per:4,len:1.1},
    hint:S(`The way on is through the Forge. They say its lava sinks once someone opens the old sluice.`,`Open the sluice first.`),
    sign:S(`THE SLUICE. A beam crystal throws its cold in a straight line, away from whoever hits it. The sluice lever calms the lava in the Forge.`,`Hit the beam crystal. Its cold goes in a line, away from you. The lever calms the Forge!`),
    lay:['...............',
         '.y.....G..X.F..',
         '...............',
         '~~~~~~~~~~~~~~~',
         '~~~~~~~~~~~~~~~',
         '~~g~~~~~~~~~~~~',
         '~~~~~~~~~~~~~~~',
         '~~~~~~~~~~~~~~~',
         '...............',
         '.sF............',
         '...............']},
  di:{at:[1,1],kind:'c2',goal:'reach',reachAt:[7,0],noPots:1,geyser:{per:4.2,len:1.1,offs:[1.4,0,2.8]},
    wave:{per:6,lo:[0,2.8],axis:'y',sweep:0.3},waveMid:{per:8,hi:[1,7],calm:'dh'},
    hint:S(`A furnace door, shut tight. It opens for whoever stands at the top of the Forge.`,`Get to the top of the Forge.`),
    sign:S(`THE FORGE. Up the tide, across the fire, then fly. The top only stays dry if the sluice is open.`,`Cross the tide. Fly up. Open the sluice first!`),
    lay:['~~~~~~...~~~~~~',
         '~~~~~~,,,~~~~~~',
         '~~~~~~,,,~~~~~~',
         '~~~~~~~f~~~~~~~',
         '~~~~~~~~~~~~~~.',
         '~~~~~~~~~~~~~s.',
         '~~...g.z.g.....',
         '~~~~~~~-~~~~~~~',
         '~~~~~~~-~~~~~~~',
         '~~~~~~~-~~~~~~~',
         '~~~~~~...~~~~~~']},
  dl:{at:[2,1],kind:'fight',foes:[['knight',2],['cultist',2]],loot:['chest'],
    lay:['...............',
         '.*...........*.',
         '...............',
         '...~~.....~~...',
         '...~~.....~~...',
         '.......X.......',
         '...~~.....~~...',
         '...~~.....~~...',
         '...............',
         '.*...........*.',
         '...............']},
  dj:{at:[1,0],span:[2,1],kind:'boss',crysCd:4,boss2:{type:'c2_knight',name:S('The Ember Knight','The Fire Knight')},wave:{per:7,lo:[0,3.2],boss:1},noPots:1,
    winText:S(`The Ember Knight kneels, and his armour cools to grey. The way to the Wardens' vault is open.`,`The Fire Knight kneels. The vault is open!`),
    intro:[['ash',S(`A knight made of fire. My fire won't do much. Good thing this place is full of ice crystals.`,`A fire knight! Ice crystals will help.`)]],
    sign:S(`The Wardens' last guard. Cold is the only thing his armour fears.`,`Only cold hurts his armour.`),
    lay:['.s.............................',
         '.~~~~..........~..........~~~~.',
         '.~~~~.f.................f.~~~~.',
         '.........-----...-----.........',
         '.........-----...-----.........',
         '...............A...............',
         '.........-----...-----.........',
         '.........-----...-----.........',
         '.~~~~.f.................f.~~~~.',
         '.~~~~..........~..........~~~~.',
         '...............................']},
  dk:{at:[0,0],kind:'treasure',loot:['relic'],
    lay:['...............',
         '.*...........*.',
         '...~~.....~~...',
         '...~~.....~~...',
         '...............',
         '...............',
         '.......H.......',
         '...~~.....~~...',
         '...~~.....~~...',
         '.*...........*.',
         '...............']}},
  links:[['da','db','open'],['db','dc','open'],['db','dd','open'],['db','de','gate:dc'],['de','df','open'],['de','dg','crack'],['de','di','lock'],
    ['df','dh','open'],['di','dl','open'],['di','dj','gate:di',{at:1}],['dj','dk','gate:dj']]},
  {dark:0.55,heat:true,update:()=>c2GlowTick()});
CAVE_SECRETS=countCaveSecrets();
// @@END@@

// ================= test hooks (the solver in the scratchpad drives the caves with these)
// tests can stop the real-time loop so that only c2ff moves the game (C2.freeze is never set in play)
{ const base=update; update=function(dt){ if(C2.freeze&&!C2.ff) return; return base(dt); }; }
{ const base=updateTimers; updateTimers=function(dt){ if(C2.freeze&&!C2.ff) return; return base(dt); }; }
// walkable for Ash right now (o.jump: hop 1 or 2 bad cells; o.stride: springs)
function c2WalkK(k,o){
  const A=AREA, c=A.cave, Z=A.c2; if(k<0||c.grid[k]===1) return false; if(c.dyn&&caveBlockedAt(k)) return false; if(Z.occ.get(k)||Z.solidK.has(k)) return false;
  if(Z.plat.get(k)) return true; const kd=c2Kind(k);
  if(kd==='floor'||kd==='ice'||kd==='floe'||kd==='pad'||kd==='rock'||kd==='cool') return true;
  if(kd==='spring') return !!(o&&o.stride);
  return false;
}
function c2HopK(k){ const A=AREA, c=A.cave, Z=A.c2; if(k<0||c.grid[k]===1) return false; if(c.dyn&&caveBlockedAt(k)) return false; if(Z.occ.get(k)) return false; return true; }
// cells Ash can reach on foot from (x,y), sliding across ice the way the game does
function c2Reach(o){
  o=o||{}; const A=AREA, c=A.cave, w=c.w, Z=A.c2, k0=c2K(o.x!=null?o.x:player.x,o.y!=null?o.y:player.y);
  const seen=new Uint8Array(c.w*c.h), dist=new Int32Array(c.w*c.h).fill(-1), q=[k0]; seen[k0]=1; dist[k0]=0; let qi=0, cur0=0;
  const add=k=>{ if(k>=0&&!seen[k]){ seen[k]=1; dist[k]=cur0+1; q.push(k); } };
  const ice=k=>c2Kind(k)==='ice'&&!Z.plat.get(k);
  while(qi<q.length){ const k=q[qi++], i=k%w; cur0=dist[k];
    for(let d=0;d<4;d++){ const [dx,dy]=C2DIR[d]; if((i+dx)<0||(i+dx)>=w) continue; const nk=k+dx+dy*w;
      if(ice(k)||(ice(nk)&&c2WalkK(nk,o))){
        // on ice (or stepping onto it) you slide until something stops you
        let cur=k; if(!ice(k)){ cur=nk; }
        else { if(!c2WalkK(nk,o)){ continue; } cur=nk; }
        for(let s=0;s<60;s++){ if(!ice(cur)) break; const nx=cur+dx+dy*w; if(!c2WalkK(nx,o)) break; cur=nx; }
        add(cur); continue; }
      if(c2WalkK(nk,o)){ add(nk); continue; }
      if(o.jump){ for(let n=1;n<=2;n++){ let ok=true; for(let s=1;s<=n;s++){ const m=k+(dx+dy*w)*s; if(!c2HopK(m)||c2WalkK(m,o)){ ok=false; break; } } const land=k+(dx+dy*w)*(n+1); if(ok&&c2WalkK(land,o)){ add(land); break; } if(!ok) break; } }
    }
  }
  const rooms=new Set(); for(let k=0;k<seen.length;k++) if(seen[k]){ const [i,j]=c2IJ(k); const R=caveRoomAt(c2X(i),c2Y(j)); if(R) rooms.add(R.id); }
  return {seen,dist,rooms:[...rooms]};
}
window.__ebX=Object.assign(window.__ebX||{},{C2,c2Kind,c2K,c2Reach,
  caves2Go(id,room){ if(!AREA||AREA.id!==id){ const d=DOORS.find(q=>q.area===id); enterArea(id,d||{x:player.x,y:player.y}); } const A=AREA; if(!A||!A.rooms) return false; if(!room) return true; const R=A.rooms[room]; if(!R) return false;
    let best=null, bd=1e9; for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*A.cave.w+i; if(!c2WalkK(k,{})||(A.c2&&A.c2.plat.get(k))) continue; const d=Math.abs(c2X(i)-R.cx)+Math.abs(c2Y(j)-R.cy); if(d<bd){ bd=d; best=[i,j]; } }
    if(best){ player.x=c2X(best[0]); player.y=c2Y(best[1]); } else { player.x=R.cx; player.y=R.cy; } updateCam(0,true); return true; },
  c2(){ const A=AREA, Z=A&&A.c2; if(!Z) return null; return {id:Z.id,room:Z.room&&Z.room.id,lock:Z.lock&&Z.lock.kind,slide:!!Z.slide,heat:Z.heat,lifts:Object.fromEntries(Object.entries(Z.lifts).map(([k,L])=>[k,{at:L.at,moving:!!L.move,on:L.on}])),solved:Object.fromEntries(Object.entries(A.rooms).map(([k,R])=>[k,!!R.solved])),keys:A.keys(),gates:A.gates.filter(g=>g.k==='cgate').map(g=>({id:g.id,type:g.type,closed:g.closed,a:g.link&&g.link.a,b:g.link&&g.link.b}))}; },
  c2objs(kind){ const Z=AREA&&AREA.c2; if(!Z) return []; return Z.list.filter(o=>!kind||o.kind===kind).map(o=>({id:o.id,kind:o.kind,room:o.room,ci:o.ci,cj:o.cj,x:Math.round(o.x),y:Math.round(o.y),gone:o.gone||0,lit:o.lit||0,dead:o.dead||0,mv:!!o.mv,cargo:!!o.cargo,on:o.on,side:o.side})); },
  c2push(id,d){ const o=AREA.c2.list.find(q=>q.id===id); if(!o||!C2PUSH[o.kind]) return false; C2PUSH[o.kind](o,typeof d==='string'?C2DN[d]:d); return true; },
  c2act(id){ const o=AREA.objs.find(q=>q.id===id); if(!o) return false; areaObjAct(o); return true; },
  c2light(id){ const o=AREA.c2.list.find(q=>q.id===id); if(!o) return false; const f=C2FIRE[o.kind]; if(f) f(o,1); return true; },
  c2hit(id,src){ const o=AREA.c2.list.find(q=>q.id===id); if(!o) return false; return areaObjHit(o.x,o.y-(o.hy||0),6,src||'slash'); },
  c2stand(i,j){ player.x=c2X(i); player.y=c2Y(j); player.kvx=player.kvy=0; updateCam(0,true); },
  c2cell(x,y){ const k=c2K(x,y); const [i,j]=c2IJ(k); return {k,i,j,kind:c2Kind(k)}; },
  c2ff(sec){ const n=Math.round((sec||1)*60), dt=1/60; C2.ff=true; try{ for(let i=0;i<n;i++){ if(scene==='dialogue'&&typeof skipDialogue==='function') skipDialogue(); if(scene!=='play') continue; updateTimers(dt); if(G.slowT>0){ G.slowT-=dt; if(G.slowT<=0) G.timeScale=1; } update(dt*(G.timeScale||1)); } } finally { C2.ff=false; } return n; },
  c2freeze(on){ C2.freeze=!!on; return C2.freeze; },
  c2rooms(){ const A=AREA; return A&&A.rooms?Object.keys(A.rooms):[]; },
  // real input: hold a key (KeyW, KeyK...) for a while, slide one way until Ash stops
  c2here(){ const k=c2K(player.x,player.y), [i,j]=c2IJ(k), R=caveRoomAt(player.x,player.y); return R?[R.id,i-R.ox-1,j-R.oy-1]:[null,i,j]; },
  c2hold(code,sec){ keys.add(code); this.c2ff(sec||0.3); keys.delete(code); for(let m=0;m<300&&AREA.c2&&AREA.c2.slide;m++) this.c2ff(1/60); return this.c2here(); },
  c2slide(d){ const code={n:'KeyW',e:'KeyD',s:'KeyS',w:'KeyA'}[d], Z=AREA.c2; keys.add(code); for(let n=0;n<48&&!Z.slide;n++) this.c2ff(1/60); keys.delete(code); for(let m=0;m<300&&Z.slide;m++) this.c2ff(1/60); this.c2ff(0.05); return this.c2here(); },
  c2at(room,c,r){ const A=AREA, R=A.rooms[room], k=(R.oy+1+r)*A.cave.w+R.ox+1+c, o=A.c2.occ.get(k); return {k,kind:c2Kind(k),occ:o?o.kind:null,id:o?o.id:null,st:A.c2.st[k]}; },
  c2pushat(room,c,r,d){ const A=AREA, R=A.rooms[room], i=R.ox+1+c, j=R.oy+1+r, k=j*A.cave.w+i, o=A.c2.occ.get(k)||A.c2.plat.get(k); if(!o) return 'NOTHING at '+room+' '+c+','+r; const dd=C2DN[d], pk=c2K(player.x,player.y); if(pk!==k-C2DIR[dd][0]-C2DIR[dd][1]*A.cave.w) return 'NOT ADJACENT ('+this.c2here()+')'; C2PUSH[o.kind](o,dd); return 'pushed '+o.id; }
});
