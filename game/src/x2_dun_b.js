// ================= x2_dun_b: Act III dungeons 3 and 4 (v9, Act III)
// Stonehorn Deep (f_deep, three floors going DOWN: the Horn Halls, the Bone Mines, the Drumhall; Ground Pound from
// Ember's Deep Flame; King Grumblehorn) and the Heart of Dread (f_dread, four floors going UP inside Mount Dread: every
// power, Shard Eyes, chain locks, the Last Chain and the summit door to the Crown, where Glaciar waits outdoors).
// Built on e9a_dungeon (rooms, floors, chests), p3_frost (the frost layer: cracks, pillars, drums, locks, ribbons...),
// p2_coast (claws, grapple, bars) and x2_foes (boss rooms by f2boss). Everything here is a wrapper or a registry entry.
// Doc for the integrator: scratchpad/F2DUN_B.md. Names start with d2b / D2B; debug: window.__eb.d2b.
// Room layers of our own (beside tpl and the p3 `frost` layer), 11 rows of 15 letters (more for tall rooms):
//   hz  heights: '.' ground, '1' '2' '3' a raised level, 'a' 'b' 'c' a STEP of level 1 2 3 (a Double Jump mounts it from
//       one level below); walking down off any edge is a hop; door cells between two rooms join every height
//   dz  our marks: H horn pillar, b bones, g geode, m mammoth skull, G locked grate cell, Q boulder on the rails,
//       L the pillar lift, T the lift's top, F heal fountain, c Ember's carving (save), S frozen soldier, D dragon
//       statue, h hatchling with its egg, E Shard Eye (on the wall beside the cell), l moth lamp, N nest lamp,
//       I iron bars, w window, Y the summit door, t toys, q coin pile, v a blessing, f starfrost, x baby Stonehorn,
//       M wall carving, B shard crystal (beam), r rubble
// Room fields: foeAt, dropRoom, lift, chainBridges, runeBridge, eyes, beams, icefall, echo, reachAt, heavyBlocks,
//   iceBlocks, railPlates, stairSeal, ringAll, gust, voidLook, snore, blizzard, lamps, summit, sayIn
// Link type 'pound' (a stone door with a ram plate: a Ground Pound on the plate on the `from` side opens it for good).
const D2B={t:0,snd:{},tip:{},said:{},lastH:null,freezeT:0,frz:null,ech:[],lift:null,beamT:0,pendingFloor:null,dbg:{}};
const D2B_ROOTS={f_deep:1,f_dread:1};
const d2bRootOf=def=>def?((AREADEFS[def.id]&&AREADEFS[def.id].dun)||def.dun||def.id):null;
function d2bHere(A){ A=A||AREA; return !!(A&&A.def&&A.cave&&D2B_ROOTS[d2bRootOf(A.def)]); }
const d2bEasy=()=>!!(G&&G.diff&&G.diff.dmg<=0.55);
const d2bHard=()=>!!(G&&G.diff&&G.diff.dmg>=1.3);
const d2bDiff=(e,n,h)=>d2bEasy()?e:d2bHard()?h:n;
function d2bSay(x,y,text,col,key,gap){ const k=key||text; if(D2B.said[k]!=null&&G.time-D2B.said[k]<(gap||3)) return; D2B.said[k]=G.time; ftext(x,y,text,col||'#f4ecff',13); }
function d2bRead(t,cb){ runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); }); }
function d2bSnd(kind,v){ const now=G?G.time:0; if(D2B.snd[kind]!=null&&now-D2B.snd[kind]<0.06) return; D2B.snd[kind]=now; try{ if(typeof p3Snd==='function'&&/^(charge|blue|jet|hiss|melt|thaw|crack|shatter|wind|whoosh|ride|pound|drum|bell|boing|click|clunk|puff)$/.test(kind)) p3Snd(kind,v); else SFX.play(kind,v); }catch(e){} }
// room cell -> world px (the room's own 15 x 11 coordinates)
function d2bRC(R,c,r){ const A=AREA, cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs}; }
function d2bK(R,c,r){ const A=AREA; return (R.oy+1+r)*A.cave.w+(R.ox+1+c); }
// a STORY beat once per save (f2sPlay when the story module is in; the lines are the story module's, by key)
function d2bBeat(key,delay){ if(!G||!G.flags) return false; const F=(G.flags.d2b_sn=G.flags.d2b_sn||{}); if(F[key]) return false; const sn=G.flags.f_sn; if(sn&&sn[key]){ F[key]=1; return false; }
  const L=STORY[key]; if(!L||(Array.isArray(L)&&!L.length)) return false; F[key]=1;
  const aid=AREA&&AREA.id; later(delay==null?0.4:delay,()=>{ if(AREA&&AREA.id!==aid) { F[key]=0; return; } if(scene!=='play'){ later(0.6,()=>{ if(scene==='play'&&AREA&&AREA.id===aid) d2bPlayNow(key); else F[key]=0; }); return; } d2bPlayNow(key); });
  return true; }
function d2bPlayNow(key){ if(typeof f2sPlay==='function') f2sPlay(key); else { const L=STORY[key]; runDialogue(typeof L==='string'?[['narr',L]]:L,()=>{ scene='play'; saveGame(); }); } }
// a bark at the top of the screen (strings, or S(full,simple))
function d2bTaunt(who,text){ try{ if(typeof f2sSay==='function') f2sSay(who,text); else taunt(who,text); }catch(e){} }

// ---------- 1. the looks: red-brown carved stone with ram horns and blue geodes (f_stone); black rock with violet ice
// veins, frost chains and old dragons (f_dread)
defineDungeonTheme('f_stone',{style:{floor:'#a0705a',floor2:'#97684f',top:'#c48e68',face:'#5a3424',edge:'#ffd8a6',water:'#2a5a78',accent:'#7ad8ff'},decor:'lamp',
  pal:{tile:['#a0705a','#97684f','#a0705a','#97684f'],grout:'rgba(60,30,20,.25)',moss:'120,200,240',rune:'255,210,140',hole:'#1a0e0a',lip:['#c48e68','#5a3424'],water:'#2a5a78',cave:true},music:'f_stone'});
defineDungeonTheme('f_dread',{style:{floor:'#5e5874',floor2:'#575170',top:'#7a6c9a',face:'#2a2238',edge:'#e2d0ff',water:'#2a2a62',accent:'#c8a0ff'},decor:'crystal',
  pal:{tile:['#5e5874','#575170','#5e5874','#575170'],grout:'rgba(20,10,40,.3)',moss:'190,160,255',rune:'210,180,255',hole:'#08060e',lip:['#7a6c9a','#2a2238'],water:'#2a2a62',cave:true},music:'f_dread'});

// ---------- 2. our layers, read while the grid is built (after the engine, p2 and p3 have read theirs)
Object.assign(PUZZLE_KINDS,{d2breach:1,d2bnest:1});
Object.assign(DOOR_COL,{pound:'230,190,120'}); Object.assign(LINK_CH,{pound:'P'});
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(!def||!D2B_ROOTS[d2bRootOf(def)]) return c;
    const w=c.w, n=w*c.h; c.d2bH=new Int8Array(n); c.d2bS=new Uint8Array(n); c.d2bM=[]; c.d2bCover=new Set(); let anyH=false;
    const door=new Set(); for(const L of c.links) for(const k of L.cells) door.add(k);
    for(const rid in c.rooms){ const R=c.rooms[rid];
      if(R.hz){ for(let r=0;r<R.ih;r++){ const row=R.hz[r]||''; for(let cc=0;cc<R.iw;cc++){ const ch=row[cc]; if(!ch||ch==='.'||ch===' ') continue; const k=(R.oy+1+r)*w+R.ox+1+cc;
          if(ch>='1'&&ch<='3'){ c.d2bH[k]=+ch; anyH=true; } else if(ch>='a'&&ch<='c'){ c.d2bH[k]=ch.charCodeAt(0)-96; c.d2bS[k]=1; anyH=true; } else if(ch==='/'){ c.d2bH[k]=-1; } } } }
      if(R.dz){ for(let r=0;r<R.ih;r++){ const row=R.dz[r]||''; for(let cc=0;cc<R.iw;cc++){ const ch=row[cc]; if(!ch||ch==='.'||ch===' ') continue; const i=R.ox+1+cc, j=R.oy+1+r, k=j*w+i;
          if(door.has(k)) continue; if(c.grid[k]!==0&&!'EMwYB'.includes(ch)) continue; c.d2bM.push({room:rid,ch,i,j,c:cc,r}); } } }
      // a plate at the end of a line of rails is a rail too (the cart stops on it)
      if(R.railPlates) for(const m of c.marks){ if(m.room!==rid||m.ch!=='P') continue; const k=m.j*w+m.i; if(DIRS.some(d=>{ const q=k+d[0]+d[1]*w; return c.typ[q]===TY.rail||c.typ[q]===TY.railpit; })) c.typ[k]=TY.rail; }
    }
    // door cells join every height (both sides of a door may sit at different levels)
    if(anyH) for(const L of c.links){ const RA=c.rooms[L.a], RB=c.rooms[L.b]; if(!(RA&&RA.hz)&&!(RB&&RB.hz)) continue; for(const k of L.cells) c.d2bH[k]=-1; }
    c.d2bAnyH=anyH;
    return c; }; }
// heights: our levels first, the engine's raised floors (= _ /) otherwise
{ const base=dunH; dunH=function(k){ const c=AREA&&AREA.cave; if(c&&c.d2bAnyH&&k>=0){ const h=c.d2bH[k]; if(h) return h; } return base(k); }; }
const d2bLvl=k=>{ const c=AREA&&AREA.cave; return c&&c.d2bH&&k>=0?c.d2bH[k]:0; };
// walking down off a higher level is a hop; walking up is a wall, except a Double Jump onto a step one level up
{ const base=dunCheck; dunCheck=function(k,x,y,air,fly){
    const A=AREA, c=A&&A.cave; if(!c||!c.d2bAnyH||!A.dn) return base(k,x,y,air,fly);
    if((typeof P2!=='undefined'&&P2.mv)||(typeof P3!=='undefined'&&P3.mv)) return null;
    if(fly||A.dn.ride) return base(k,x,y,air,fly);
    const T=A.tri;
    if(T&&T.lx!=null){ const f=tCell(T.lx,T.ly);
      if(f>=0&&f!==k&&(c.d2bH[f]||c.d2bH[k])){ const hf=dunH(f), hk=dunH(k);
        if(hf>=0&&hk>=0&&hf!==hk){
          if(hk<hf) return null;
          if(hk===hf+1&&c.d2bS[k]&&air&&player.dbl&&(player.z||0)>6) return null;
          return 'wall'; } } }
    return base(k,x,y,air,fly); }; }
// covered cells (chained bridges let down, the stone bridge) are floor
{ const base=dunCovered; dunCovered=function(k){ if(base(k)) return true; const c=AREA&&AREA.cave; return !!(c&&c.d2bCover&&c.d2bCover.has(k)); }; }
{ const base=dunGround; dunGround=function(k,t,T){ const c=AREA&&AREA.cave; if(c&&c.d2bCover&&c.d2bCover.has(k)&&(t===TY.chasm||t===TY.pit)) return true; return base(k,t,T); }; }
{ const base=dunHole; dunHole=function(k,t,T){ const c=AREA&&AREA.cave; if(c&&c.d2bCover&&c.d2bCover.has(k)) return false; return base(k,t,T); }; }

// ---------- 3. the per-visit state and what every room builds
function d2bState(A){ if(A.d2b) return A.d2b;
  return A.d2b={objs:[],tall:[],gates:[],plates:[],grates:[],lifts:[],eyes:[],lamps:[],beams:[],bridges:[],runeBr:[],fall:[],echo:null,eggs:[],founts:[],summit:null,frz:[],seals:[],cage:[],lamb:null,visit:{},stat:[],coins:[],t:0}; }
{ const base=dunBuildRoom; dunBuildRoom=function(A,def,R,ms,P,spot,freeSpot,rng){ base.apply(this,arguments); if(D2B_ROOTS[d2bRootOf(def)]) d2bBuildRoom(A,def,R,P); }; }

// ---------- 4. building a room: our marks and room fields
function d2bBuildRoom(A,def,R,P){
  const ST=d2bState(A), c=A.cave, cs=c.cell, SK=caveSid(def), DK=caveDsid(def), F=G.found;
  const RP=(cc,rr)=>P(R.ox+1+cc,R.oy+1+rr), col=(x,y,r)=>{ const q={t:'c',x,y,r}; addAreaCol(q); return q; };
  const grate=[];
  for(const m of c.d2bM){ if(m.room!==R.id) continue;
    const p=P(m.i,m.j), id=`d2b_${SK}_${R.id}_${m.ch}${m.c}_${m.r}`, k=m.j*c.w+m.i;
    switch(m.ch){
      case 'H': ST.stat.push({kind:'horn',x:p.x,y:p.y+10,id,v:(m.c+m.r)%2}); col(p.x,p.y+8,17); break;
      case 'b': ST.stat.push({kind:'bones',x:p.x,y:p.y,id,v:(m.c*3+m.r)%3,flat:true}); break;
      case 'g': ST.stat.push({kind:'geode',x:p.x,y:p.y+6,id,v:(m.c+m.r*2)%3}); col(p.x,p.y+4,16); A.lights.push({x:p.x,y:p.y-10,r:170,i:0.5,tint:'crystal'}); break;
      case 'm': ST.stat.push({kind:'skull',x:p.x,y:p.y+16,id}); col(p.x,p.y+8,30); break;
      case 'S': { const o={kind:'soldier',x:p.x,y:p.y+8,id,v:(m.c*5+m.r)%4}; ST.stat.push(o); o.col=col(p.x,p.y+4,15); p3On(o,{fire(q,dt,blue){ if(blue) d2bSay(q.x,q.y-70,S('Frozen too deep. Glaciar’s spell holds this one.','Too frozen. The spell holds him.'),'#e8dcff','soldier'); }},A); break; }
      case 'D': ST.stat.push({kind:'dragon',x:p.x,y:p.y+20,id,v:(m.c)%2}); col(p.x,p.y,40); col(p.x-34,p.y+10,22); col(p.x+34,p.y+10,22); break;
      case 'h': { const o={kind:'hatch',x:p.x,y:p.y+10,id,egg:!!F[id]}; ST.stat.push(o); col(p.x,p.y+4,18); ST.eggs.push(o);
        p3On(o,{blaze:{need:2,h:30,when:q=>!q.egg,then:q=>d2bEggCrack(A,q)},fire(q,dt,blue){ if(!blue&&!q.egg) d2bSay(q.x,q.y-60,S('The ice egg sweats a little. It needs a hotter fire.','The egg needs blue fire.'),'#dff4ff','egg'); }},A); break; }
      case 'E': { const op=(R.eyes&&R.eyes[`${m.c},${m.r}`])||{}; const wallN=c.grid[k]===1||m.r===0, wallS=m.r===R.ih-1&&!wallN;
        const o={k:'d2b_eye',x:p.x,y:wallN?p.y-cs*0.5+4:wallS?p.y+cs*0.5-4:p.y,id,room:R.id,ph:op.ph||0,shutT:0,dead:!!R.solved||!!F[id+'_dead'],r:20,targets:op.targets||null,look:0,face:wallS?-1:1,flash:0};
        A.objs.push(o); ST.eyes.push(o); o.L={x:o.x,y:o.y+(wallS?-20:20),r:220,i:0.5,tint:'crystal'}; A.lights.push(o.L); break; }
      case 'l': case 'N': { const nest=m.ch==='N', o={k:'d2b_lamp',mlamp:true,x:p.x,y:p.y,id,room:R.id,nest,lit:nest,burn:0,h:46,r:16,keep:true,ever:!!F[id]};
        o.prompt=()=>nest?null:(o.lit?null:S('Look at the moth lamp','Look at the lamp'));
        A.objs.push(o); ST.lamps.push(o); col(p.x,p.y+2,12); o.L={x:p.x,y:p.y-o.h,r:nest?260:300,i:nest?0.7:0,fire:true}; A.lights.push(o.L); break; }
      case 'I': case 'i': case 'J': { const vert=m.ch!=='I'; p2Add('thinbars',{x:p.x,y:p.y,w:vert?16:48,h:vert?48:16,style:m.ch==='J'?'bone':'iron',id:id+'_bars'},A); break; }
      case 'G': grate.push(k); break;
      case 'Q': { const o={k:'cgate',type:'crack',d2bBoulder:true,x:p.x,y:p.y,id,room:R.id,cells:[k],opened:!!F[id],closed:!F[id],tmp:false,vertical:false,r:30};
        A.gates.push(o); c.dyn[k]=A.gates.length; A.objs.push(o); o.prompt=()=>o.opened?null:S('Look at the cracked boulder','Look at the boulder'); break; }
      case 'L': { const lf=R.lift||{}; const o={k:'d2b_lift',x:p.x,y:p.y,id,room:R.id,to:lf.to,room2:lf.room,at:lf.at,r:46,st:0,t:0};
        o.prompt=()=>o.st?null:S('Look at the pillar lift','Look at the lift'); A.objs.push(o); ST.lifts.push(o); A.lights.push({x:p.x,y:p.y,r:180,i:0.55,tint:'crystal'}); break; }
      case 'T': { const o={k:'d2b_lifttop',x:p.x,y:p.y,id,room:R.id,r:40}; o.prompt=()=>S('Look at the round stone','Look at the stone'); A.objs.push(o); break; }
      case 'F': { const o={k:'d2b_fount',x:p.x,y:p.y,id,room:R.id,r:30,used:false}; o.prompt=()=>o.used?S('Look at the warm spring','Look at the spring'):S('Drink from the warm spring','Drink the warm water'); A.objs.push(o); ST.founts.push(o); col(p.x,p.y,24); A.lights.push({x:p.x,y:p.y-10,r:210,i:0.6}); break; }
      case 'c': { const o={k:'d2b_carve',x:p.x,y:p.y,id,room:R.id,r:30}; o.prompt=()=>S('Touch Ember’s carving (rest and save)','Touch the carving (save)'); A.objs.push(o); col(p.x,p.y,20); A.lights.push({x:p.x,y:p.y-30,r:260,i:0.75,fire:true}); break; }
      case 'Y': { const o={k:'d2b_summit',x:p.x,y:p.y-cs*0.5,id,room:R.id,r:60,open:false,oa:0}; o.prompt=()=>o.open?S('Climb out onto the Crown of Dread','Go out to the top'):S('Look at the summit door','Look at the big door'); A.objs.push(o); ST.summit=o; break; }
      case 'w': ST.stat.push({kind:'window',x:p.x,y:p.y-cs*0.5,id,wall:true}); break;
      case 'M': ST.stat.push({kind:'carving',x:p.x,y:p.y-cs*0.5,id,wall:true}); break;
      case 'B': { const op=(R.beams&&R.beams[`${m.c},${m.r}`])||{}; const o={k:'d2b_beam',x:p.x,y:p.y-cs*0.5+6,ci:m.i,cj:m.j,id,room:R.id,dir:op.dir||'s',on:op.on||0,off:op.off||0,ph:op.ph||0,lit:true,cells:[],warn:0};
        A.objs.push(o); ST.beams.push(o); o.L={x:p.x,y:p.y,r:260,i:0.55,tint:'crystal'}; A.lights.push(o.L); break; }
      case 't': ST.stat.push({kind:'toys',x:p.x,y:p.y+6,id,flat:true}); break;
      case 'n': ST.stat.push({kind:'nest',x:p.x,y:p.y,id,flat:true}); break;
      case 'q': A.objs.push({k:'coinpile',x:p.x,y:p.y,id:`cv_${SK}_${R.id}_coin${m.c}_${m.r}`,n:R.coinN||50}); break;
      case 'v': if(!F[id]){ const o={k:'d2b_bless',x:p.x,y:p.y,id,room:R.id}; A.objs.push(o); A.lights.push({x:p.x,y:p.y-14,r:150,i:0.6}); } break;
      case 'f': if(!F[id]){ const o={k:'d2b_star',x:p.x,y:p.y,id,room:R.id}; A.objs.push(o); A.lights.push({x:p.x,y:p.y-10,r:120,i:0.5,tint:'crystal'}); } break;
      case 'x': { ST.lamb={k:'d2b_lamb',x:p.x,y:p.y,id,room:R.id,t:0,face:0,hop:0,baa:0}; break; }
    }
  }
  if(grate.length){ const id=`d2b_${SK}_${R.id}_grate`, mid=tPos(grate[grate.length>>1]);
    const o={k:'cgate',type:'d2bgrate',x:mid.x,y:mid.y,id,room:R.id,cells:grate,opened:!!F[id],closed:!F[id],tmp:false,vertical:false,r:40};
    A.gates.push(o); for(const k of grate) c.dyn[k]=A.gates.length; A.objs.push(o); o.prompt=()=>caveGatePrompt(o); ST.grates.push(o); }
  // chained bridges: chasm cells that are floor once their lock melts
  for(const b of R.chainBridges||[]){ const lid=`p3_${SK}_${R.id}_K${b.lock[0]}_${b.lock[1]}`, cells=[];
    for(let r=Math.min(b.a[1],b.b[1]);r<=Math.max(b.a[1],b.b[1]);r++) for(let cc=Math.min(b.a[0],b.b[0]);cc<=Math.max(b.a[0],b.b[0]);cc++) cells.push(d2bK(R,cc,r));
    const a=RP(Math.min(b.a[0],b.b[0]),Math.min(b.a[1],b.b[1])), e=RP(Math.max(b.a[0],b.b[0]),Math.max(b.a[1],b.b[1]));
    const o={room:R.id,lock:lid,cells,x0:a.x-cs/2,y0:a.y-cs/2,x1:e.x+cs/2,y1:e.y+cs/2,hinge:b.hinge||'w',down:!!F[lid],a:F[lid]?1:0,lk:RP(b.lock[0],b.lock[1])};
    if(o.down) for(const k of cells) c.d2bCover.add(k);
    ST.bridges.push(o); }
  // the stone bridge a rune plate drops into place
  if(R.runeBridge){ const b=R.runeBridge, pid=`p3_${SK}_${R.id}_r${b.plate[0]}_${b.plate[1]}`, cells=[];
    for(let r=Math.min(b.a[1],b.b[1]);r<=Math.max(b.a[1],b.b[1]);r++) for(let cc=Math.min(b.a[0],b.b[0]);cc<=Math.max(b.a[0],b.b[0]);cc++) cells.push(d2bK(R,cc,r));
    const a=RP(Math.min(b.a[0],b.b[0]),Math.min(b.a[1],b.b[1])), e=RP(Math.max(b.a[0],b.b[0]),Math.max(b.a[1],b.b[1]));
    const o={room:R.id,plate:pid,cells,x0:a.x-cs/2,y0:a.y-cs/2,x1:e.x+cs/2,y1:e.y+cs/2,down:!!F[pid],a:F[pid]?1:0,drop:F[pid]?0:-1};
    if(o.down) for(const k of cells) c.d2bCover.add(k);
    ST.runeBr.push(o); }
  if(R.icefall) ST.fall.push({room:R.id,R,cfg:R.icefall,t:0,list:[],lastSec:-1});
  if(R.echo) ST.echo={room:R.id,R};
  if(R.summit) ST.summitCfg={room:R.id,locks:R.summit.locks};
}
// after every room is built: pound doors and their plates, foe spots, restored states
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){
    base.apply(this,arguments);
    if(!D2B_ROOTS[d2bRootOf(def)]) return;
    const ST=d2bState(A), c=A.cave, cs=c.cell, M=CAVEMAP[def.id]||{links:[]};
    for(const o of A.gates){ if(o.type!=='pound'||!o.link) continue;
      const opt=(M.links[o.link.i]||[])[3]||{}, from=opt.from||o.link.a, R=A.rooms[from], other=o.link.a===from?o.link.b:o.link.a;
      o.from=from; o.d2b=true; o.opened=!!G.found[o.id];
      const dx=R.cx-o.x, dy=R.cy-o.y, L=Math.hypot(dx,dy)||1, ux=o.vertical?0:Math.sign(dx), uy=o.vertical?Math.sign(dy):0;
      const pd=(opt.plate||1.6)*cs, pl={k:'d2b_pplate',x:o.x+ux*pd,y:o.y+uy*pd,gate:o,id:o.id+'_pl',room:from,r:24};
      pl.prompt=()=>o.opened?null:S('Look at the ram plate','Look at the plate'); A.objs.push(pl); ST.plates.push(pl);
      const rb={k:'d2b_rubble',x:o.x-ux*cs*1.2,y:o.y-uy*cs*1.2,gate:o,id:o.id+'_rb',room:other,r:30}; rb.prompt=()=>o.opened?null:S('Look at the stone door','Look at the door'); A.objs.push(rb);
      A.objs.push({k:'d2b_pdoor',ref:o,x:o.x,y:o.y,id:o.id+'_dv'}); }
    for(const k in A.rooms){ const R=A.rooms[k];
      if(R.foeAt){ const live=R.enemies.filter(e=>!e.dead); live.forEach((e,i)=>{ const q=R.foeAt[i%R.foeAt.length]; if(!q) return; const p=d2bRCa(A,R,q[0],q[1]); e.x=p.x; e.y=p.y; e.homeX=p.x; e.homeY=p.y; e._tx=e.x; e._ty=e.y; if(q[2]==='sleep') e.d2bSleep=true; }); }
      // heavy stone blocks only move by drum (and the drum stones of this room reach the whole room)
      if(R.heavyBlocks) for(const b of A.blocks) if(b.room===k) b.d2bHeavy=true;
      if(R.iceBlocks) for(const b of A.blocks) if(b.room===k) b.d2bIce=true;
      if(R.ringAll) for(const o of A.objs) if(o.p3==='drum'&&o.room===k) o.ring=1400; }
    // a grapple post standing on one of our raised levels is at that level (the zip lands up there)
    // ice trampled to slush on an earlier visit stays melted
    if(A.p3) for(const g of A.p3.gates) if(g.g==='ice'&&G.found[g.id+'_slush']){ g.d2bSlush=true; g.melted=true; g.closed=false; }
    if(c.d2bAnyH) for(const o of (A.dn&&A.dn.grapples)||[]){ const k=Math.floor((o.y-A.y0)/cs)*c.w+Math.floor((o.x-A.x0)/cs); if(c.d2bH[k]>0) o.lvl=c.d2bH[k]; }
    // the summit door's four locks
    if(ST.summit&&ST.summitCfg) ST.summit.locks=ST.summitCfg.locks.map(q=>`p3_${caveSid(def)}_${q[0]}_K${q[1]}_${q[2]}`);
    refreshCaveGates();
  }; }
// room cell -> world px for an area that is being built (AREA may still be the old one)
function d2bRCa(A,R,c,r){ const cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs}; }
// the summit door's locks may live on another floor: ask G.found
function d2bLockDone(id){ return !!(G&&G.found&&G.found[id]); }

// ---------- 5. doors of our own: pound doors, grates, the boulder on the rails
{ const base=refreshCaveGates; refreshCaveGates=function(){
    base.apply(this,arguments); const A=AREA; if(!A||!A.gates||!d2bHere(A)) return;
    const p=player, c=A.cave, onAsh=o=>o.cells.some(k=>{ const q=tPos(k); return Math.abs(p.x-q.x)<c.cell*0.5+p.r&&Math.abs(p.y-q.y)<c.cell*0.5+p.r; });
    for(const o of A.gates){ if(o.type==='pound'||o.type==='d2bgrate'){ let cl=!o.opened; if(o.tmp) cl=true; if(cl&&!o.closed&&onAsh(o)) cl=false; o.closed=cl; } } }; }
{ const base=caveGatePrompt; caveGatePrompt=function(o){
    if(o&&o.type==='pound') return o.closed&&!o.tmp?S('Look at the stone door','Look at the door'):null;
    if(o&&o.type==='d2bgrate'){ if(o.opened) return null; const n=AREA.keys(); return n>0?S(`Unlock the grate (${n} small key${n>1?'s':''})`,`Unlock the grate (${n} key${n>1?'s':''})`):S('Look at the locked grate','Look at the grate'); }
    if(o&&o.d2bBoulder) return o.opened?null:S('Look at the cracked boulder','Look at the boulder');
    return base.apply(this,arguments); }; }
{ const base=caveObjAct; caveObjAct=function(o){
    const A=AREA;
    if(o&&o.k==='cgate'&&o.type==='pound'&&o.closed&&!o.tmp){
      const near=caveRoomAt(player.x,player.y), mine=near&&near.id===o.from;
      d2bRead(mine?(canPound()?S('A door of solid stone with a ram’s face carved on it. In the floor before it: a big round plate with the same ram. Jump, and POUND the plate!','A stone door. Jump and POUND the ram plate!'):S('A door of solid stone with a ram’s face carved on it. In the floor before it: a big round plate with the same ram. Far too heavy to press with your claws.','A stone door. The plate is too heavy to press.'))
        :S('Rubble and a door of solid stone. Whatever opens it is on the other side.','A stone door. It opens from the other side.'));
      return true; }
    if(o&&o.type==='d2bgrate'&&!o.opened){
      if(A.keys()>0){ G.found['keys_'+caveDsid(A.def)]=A.keys()-1; o.opened=true; G.found[o.id]=true; refreshCaveGates(); SFX.play('chest'); d2bSnd('clunk'); shake(3); setBanner(S('Unlocked','Unlocked'),S('The grate swings open.','The grate opens.'),1.6); saveGame(); }
      else d2bRead(S('An iron grate with a heavy padlock. A small key would open it. There must be one somewhere in here.','A locked grate. Find a small key.'));
      return true; }
    if(o&&o.d2bBoulder&&!o.opened){ d2bRead(S('A huge cracked boulder sits right on the rails. Something fast and heavy could smash it. A mine cart, maybe. Or a very big hammer.','A cracked boulder on the rails. A fast cart could smash it!')); return true; }
    return base.apply(this,arguments); }; }
{ const base=breakCrack; breakCrack=function(o){
    if(o&&o.d2bBoulder){ o.opened=true; G.found[o.id]=true; refreshCaveGates(); SFX.play('boom'); d2bSnd('shatter'); shake(8);
      emit(o.x,o.y,46,{col:'170,130,100',glow:false,smin:60,smax:260,lmin:.4,lmax:1,zmin:2,zmax:6,grow:5}); setBanner(S('CRASH!','CRASH!'),S('The boulder bursts into gravel.','The boulder smashes!'),1.8); saveGame(); return; }
    return base.apply(this,arguments); }; }
{ const base=drawFurnX; drawFurnX=function(o,t){
    if(o&&o.k==='cgate'&&o.type==='pound'){ if(o.closed&&!o.tmp) d2bDrawPoundDoor(o,t); else if(o.closed) return base(o,t); return true; }
    if(o&&o.k==='cgate'&&o.type==='d2bgrate'){ d2bDrawGrate(o,t); return true; }
    if(o&&o.d2bBoulder){ if(!o.opened) d2bDrawBoulder(o,t); else d2bDrawGravel(o,t); return true; }
    return base(o,t); }; }

// ---------- 6. floors: a drop lands in its room (dropRoom), the pillar lift goes up, sealed stairs wait
{ const base=dunPendingFloor; dunPendingFloor=function(A){
    const dn=A&&A.dn;
    if(dn&&dn.drop&&d2bHere(A)){ const d=dn.drop, R=caveRoomAt(d.x,d.y), M=CAVEMAP[d.to];
      if(R&&R.dropRoom&&M&&M.rooms[R.dropRoom]){ const T=M.rooms[R.dropRoom], cs=A.cave.cell; d.x+=(T.at[0]-R.at[0])*RSX*cs; d.y+=(T.at[1]-R.at[1])*RSY*cs; D2B.fellTo=R.dropRoom; } }
    return base.apply(this,arguments); }; }
{ const base=dunUpdate; dunUpdate=function(A,dt){
    if(!d2bHere(A)) return base.apply(this,arguments);
    const dn=A.dn, keep=dn.stairs, sealed=keep.filter(s=>{ const R=A.rooms[s.room]; return R&&R.stairSeal&&!R.solved; });
    if(sealed.length) dn.stairs=keep.filter(s=>!sealed.includes(s));
    try{ return base.apply(this,arguments); } finally{ dn.stairs=keep; } }; }

// ---------- 7. every frame inside one of our dungeons (after the engine's own room update)
{ const base=updateCaveRooms; updateCaveRooms=function(dt){
    const A=AREA; base.apply(this,arguments);
    if(!A||AREA!==A||!d2bHere(A)||!A.d2b) return;
    try{ d2bUpdate(A,dt); }catch(err){ console.error(err); }
  }; }
function d2bUpdate(A,dt){
  const ST=A.d2b, p=player, R=caveRoomAt(p.x,p.y), c=A.cave, cs=c.cell; ST.t+=dt; D2B.t+=dt;
  // first visit to a room: its story beat
  if(R&&!ST.visit[R.id]){ ST.visit[R.id]=1; d2bRoomIn(A,R); }
  // a hop down off a higher level of our own
  const k=tCell(p.x,p.y), h=k>=0?dunH(k):0;
  if(D2B.lastH!=null&&D2B.lastA===A&&c.d2bAnyH&&k>=0&&h>=0&&D2B.lastH>h&&!airborne()&&!p.flying&&scene==='play'&&!(typeof P3!=='undefined'&&P3.mv)){ p.z=Math.max(p.z||0,14+6*(D2B.lastH-h)); p.vz=Math.min(p.vz||0,-20); try{ mvSnd('land',0.5); }catch(e){} }
  if(h>=0){ D2B.lastH=h; D2B.lastA=A; }
  d2bLamps(A,dt); d2bEyes(A,dt); d2bBeams(A,dt); d2bFalls(A,dt); d2bEcho(A,dt); d2bLifts(A,dt); d2bBridges(A,dt); d2bSummit(A,dt);
  d2bChoir(A,dt,R); d2bRooms(A,dt,R); d2bFreeze(A,dt); d2bPicks(A);
  if(ST.lamb) d2bLambTick(ST.lamb,dt);
}
// story beats and banners when Ash walks into a room for the first time this visit
function d2bRoomIn(A,R){
  const id=d2bRootOf(A.def), key=R.sayIn;
  if(key) d2bBeat(key,R.sayDelay);
  if(R.tip&&!G.found['d2b_tip_'+A.id+R.id]){ G.found['d2b_tip_'+A.id+R.id]=1; later(0.8,()=>{ if(AREA===A) setBanner(R.tip[0],R.tip[1],3.2); }); }
}

// ---------- 8. the Ground Pound: pound plates, the lift, the echo, the stalagbats that hunt by sound
p3OnPound(info=>{ const A=AREA; if(!A||!d2bHere(A)||!A.d2b||info.drum) return; try{ d2bOnPound(A,info); }catch(err){ console.error(err); } });
function d2bOnPound(A,info){
  const ST=A.d2b, x=info.x, y=info.y;
  for(const pl of ST.plates){ const g=pl.gate; if(g.opened||dist(x,y,pl.x,pl.y)>58) continue;
    g.opened=true; G.found[g.id]=true; refreshCaveGates(); pl.bump=0.5; d2bSnd('drum'); d2bSnd('clunk'); shake(7);
    emit(g.x,g.y,30,{col:'170,140,110',glow:false,smin:40,smax:200,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:5});
    setBanner(S('KNOCK KNOCK','KNOCK KNOCK'),S('The stone door grinds open. It stays open now.','The stone door opens!'),2.2); saveGame(); }
  for(const o of ST.lifts){ if(o.st||dist(x,y,o.x,o.y)>o.r+20) continue; d2bLiftGo(A,o); }
  const R=caveRoomAt(x,y);
  if(ST.echo&&R&&R.id===ST.echo.room){ ST.ech=ST.ech||[]; ST.ech.push({x,y,t:0,dur:d2bDiff(5,3,2.6)}); d2bSnd('drum',0.5);
    for(const e of G.enemies){ if(e.dead||!e.inArea||e.room!==R.id||e.type!=='f_stalagbat') continue; e.aggro=true; e.d2bDive={x,y,t:0.9}; } }
}

// ---------- 9. the pillar lift (Stonehorn n): pound it and it rises to the Bone Mines
function d2bLiftGo(A,o){
  if(!o.to) return; o.st=1; o.t=0; G.found[o.id]=true; d2bSnd('drum'); d2bSnd('clunk'); shake(6);
  setBanner(S('The pillar rises!','Going up!'),S('A shortcut back up to the Bone Mines.','A shortcut up!'),2);
  const p=player; p.x=o.x; p.y=o.y; p.kvx=p.kvy=0; moveReset(p);
}
function d2bLifts(A,dt){
  const ST=A.d2b, p=player;
  for(const o of ST.lifts){ if(!o.st) continue; o.t+=dt; p.x=o.x; p.y=o.y-6; p.kvx=p.kvy=0; p.z=Math.min(120,o.t*90);
    if(Math.random()<0.5) emit(o.x+rand(-40,40),o.y+rand(-6,16),1,{col:'150,120,100',glow:false,smin:10,smax:50,lmin:.3,lmax:.6,zmin:1.5,zmax:3,grow:5});
    if(o.t>1.3&&!A.dn.go){ o.st=0; const M=CAVEMAP[o.to], T=M&&M.rooms[o.room2]; if(!T) continue; const cs=A.cave.cell;
      const to={x:A.x0+(T.at[0]*RSX+1+o.at[0]+0.5)*cs,y:A.y0+(T.at[1]*RSY+1+o.at[1]+0.5)*cs};
      p.z=0; A.dn.go={to:o.to,arrive:{x:to.x,y:to.y}}; D2B.liftArrive=true; } }
}

// ---------- 10. Shard Eyes: violet crystal eyes on the walls. While an eye is open, ice that melts in its room freezes
// again at once and cracked domes seal over. An arrow in the pupil while it is open shuts it for a while.
function d2bEyeAwake(o){ return !o.dead&&o.shutT<=0&&o.open; }
function d2bEyes(A,dt){
  const ST=A.d2b; if(!ST.eyes.length) return;
  const C0=A.p3, pk=tCell(player.x,player.y);
  if(C0&&!airborne()) for(const g of C0.gates){ if(g.g!=='ice'||!g.melted||g.d2bSlush||g.cells[0]!==pk) continue; if(!ST.eyes.some(e=>e.room===g.room)) continue;
    g.d2bSlush=true; G.found[g.id+'_slush']=true; d2bSay(g.x,g.y-40,S('Squelch! Trampled into slush. It cannot freeze again.','Slush! It stays melted.'),'#dff4ff','slush',4); }
  for(const o of ST.eyes){
    if(o.flash>0) o.flash-=dt;
    if(o.dead){ o.open=false; o.L.i=0.05; continue; }
    const R=A.rooms[o.room]; if(R&&R.solved&&(R.kind==='melt'||R.reachAt)){ o.dead=true; G.found[o.id+'_dead']=true; d2bSnd('shatter'); emit(o.x,o.y,24,{col:'200,170,255',smin:40,smax:160,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); continue; }
    if(o.shutT>0){ o.shutT-=dt; o.open=false; if(o.shutT<=0){ o.flash=0.6; d2bSnd('crack',0.5); d2bSay(o.x,o.y+30,S('The eye opens again!','The eye is open!'),'#e8d0ff','eyeopen'+o.id,2); } o.L.i=0.12; continue; }
    const per=4, ph=((ST.t+o.ph)%per+per)%per; o.open=ph<3; o.L.i=o.open?0.65:0.2; o.look=(o.look+dt*1.6)%TAU;
    if(!o.open) continue;
    // its gaze: ice melted in the room grows back, cracked domes close (never on Ash)
    const C=A.p3; if(!C) continue;
    for(const g of C.gates){ if(g.room!==o.room) continue; if(o.targets&&!o.targets.some(q=>tCell(g.x,g.y)===d2bK(R,q[0],q[1]))) continue;
      if(g.g==='ice'&&g.melted&&!g.d2bSlush){ if(p3Refreeze(g)){ o.flash=0.5; g.d2bFlash=0.5; d2bTip('eye',S('The Shard Eye froze it again!','The eye froze it again!'),S('Shoot the eye shut with an arrow first. It only takes arrows while it is open.','Shoot the eye with an arrow first!')); } }
      if(g.g==='lock'&&!g.done&&g.crack>0){ g.crack=0; g.heat=0; o.flash=0.5; g.d2bFlash=0.5; d2bSnd('crack',0.6); d2bSay(g.x,g.y-56,S('The eye seals the ice!','The ice is back!'),'#e8d0ff','eyelock',1.5); d2bTip('eye',S('The Shard Eye sealed the dome!','The eye sealed it!'),S('Shoot the eye shut with an arrow first. Then pound the plate and melt the lock.','Shoot the eye first!')); if(d2bRootOf(A.def)==='f_dread') d2bBeat('f_dread_eye',0.2); } }
  }
}
function d2bTip(key,title,text){ if(D2B.tip[key]&&G.time-D2B.tip[key]<12) return; D2B.tip[key]=G.time; setBanner(title,text,3); }
function d2bEyeShot(A,o,src){
  if(o.dead||o.shutT>0) return false;
  if(!o.open){ d2bSay(o.x,o.y+34,S('Shut tight. Wait for it to open!','It is shut. Wait!'),'#ffe0b0','eyeshut'+o.id,1.2); return true; }
  if(src!=='arrow'){ d2bSay(o.x,o.y+34,S('Only an arrow in the pupil shuts it.','Use an arrow!'),'#ffe0b0','eyearrow',2); return true; }
  o.shutT=d2bDiff(22,15,12); o.open=false; o.flash=0.8; d2bSnd('shatter',0.7); SFX.play('shrine'); shake(3);
  emit(o.x,o.y,26,{col:'220,190,255',smin:40,smax:180,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
  const n=A.d2b.eyes.filter(q=>q.room===o.room&&!q.dead&&q.shutT<=0).length;
  setBanner(S('The eye snaps shut!','The eye is shut!'),n?S(`Shut the other eye too. Then melt the ice fast!`,'Now shut the other eye!'):S(`Quick! The ice will stay melted for ${Math.round(o.shutT)} seconds.`,`Quick! ${Math.round(o.shutT)} seconds!`),2.6);
  return true;
}
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){
    let hit=base.apply(this,arguments); const A=AREA; if(!A||!A.d2b||src==='fire') { if(A&&A.d2b&&src==='fire') d2bFireAt(A,x,y,r||8); return hit; }
    r=r||8; for(const o of A.d2b.eyes){ if(dist(x,y,o.x,o.y)<r+o.r+6){ if(d2bEyeShot(A,o,src)) hit=true; } }
    return hit; }; }

// ---------- 11. moth lamps (the Mothling Nest): any fire lights a corner lamp for 8 s; the swarm leaves the nest lamp
// for it. Both corner lamps lit once: the room is no longer pitch dark.
function d2bFireAt(A,x,y,r){ for(const o of A.d2b.lamps){ if(o.nest||o.lit) continue; if(dist(x,y,o.x,o.y-o.h*0.6)<r+30) d2bLampLight(A,o); } }
function d2bLampLight(A,o){ o.lit=true; o.burn=8; if(!o.ever){ o.ever=true; G.found[o.id]=true; } d2bSnd('blue',0.5); SFX.play('pickup'); emit(o.x,o.y-o.h,18,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:20,smax:90,lmin:.3,lmax:.7,zmin:2,zmax:4,grow:5});
  const R=A.rooms[o.room]; if(R&&!R.solved&&R.kind==='d2bnest'&&A.d2b.lamps.filter(q=>q.room===o.room&&!q.nest).every(q=>q.ever)) solveRoom(R,true);
  saveGame(); }
function d2bLamps(A,dt){
  const ST=A.d2b; if(!ST.lamps.length) return; const p=player;
  for(const o of ST.lamps){ if(o.nest) continue; if(o.lit){ o.burn-=dt; if(o.burn<=0){ o.lit=false; emit(o.x,o.y-o.h,8,{col:'120,110,130',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:40,lmin:.5,lmax:1,zmin:3,zmax:6,grow:6}); } }
    // breath fire on an unlit lamp (the stock cone, which the blue jet widens)
    else if(p.breathing&&inArcC(p.x+Math.cos(p.facing)*16,p.y+Math.sin(p.facing)*16,p.facing,175,0.45,{x:o.x,y:o.y-o.h*0.5,r:18})) d2bLampLight(A,o); }
  for(const o of ST.lamps){ o.L.i=o.lit?(o.nest?0.7:0.85):0; if(o.nest){ const other=ST.lamps.some(q=>!q.nest&&q.room===o.room&&q.lit); o.lit=!other; o.L.i=0.55; } }
}

// ---------- 12. Shard-light beams (the Shardlight Gallery): straight violet beams from crystals on the walls. Walls and
// blocks stop them. A touch freezes Ash for a moment (a Shadow Dash passes right through).
const D2B_DIR={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]};
function d2bBeamOn(o,t){ if(!o.on) return true; const per=o.on+o.off, ph=((t+o.ph)%per+per)%per; o.warn=!(ph<o.on)&&ph>per-0.6; return ph<o.on; }
function d2bBeams(A,dt){
  const ST=A.d2b; if(!ST.beams.length) return; const c=A.cave, p=player;
  for(const o of ST.beams){ o.lit=d2bBeamOn(o,ST.t); o.L.i=o.lit?0.6:0.15; o.cells.length=0; if(!o.lit) continue;
    const d=D2B_DIR[o.dir]; let i=o.ci, j=o.cj;
    for(let n=0;n<40;n++){ if(n>0||c.grid[j*c.w+i]===1){ i+=d[0]; j+=d[1]; } if(i<0||j<0||i>=c.w||j>=c.h) break; const k=j*c.w+i;
      if(c.grid[k]===1&&c.typ[k]!==1) break; if(caveBlockedAt(k)) break; o.cells.push(k); } }
  // Ash in a beam: frozen
  if(p.dead||D2B.frz||airborne()&&p.flying) return;
  const k=tCell(p.x,p.y); let hit=null;
  for(const o of ST.beams){ if(!o.lit) continue; if(o.cells.includes(k)){ const q=tPos(k), dd=o.dir==='n'||o.dir==='s'?Math.abs(p.x-q.x):Math.abs(p.y-q.y); if(dd<18+p.r*0.5){ hit=o; break; } } }
  if(!hit){ if(k>=0&&tGround(k)) D2B.beamSafe={x:p.x,y:p.y,A}; return; }
  if(typeof p2Shadowed==='function'&&p2Shadowed()) return;
  d2bFreezeAsh(A,hit);
}
function d2bFreezeAsh(A,o){
  const p=player; if(D2B.frz) return;
  D2B.frz={t:d2bDiff(0.7,1,1.2),x:p.x,y:p.y,back:D2B.beamSafe&&D2B.beamSafe.A===A?{x:D2B.beamSafe.x,y:D2B.beamSafe.y}:null,mash:0};
  d2bSnd('crack'); d2bSnd('shatter',0.5); shake(3); flashA=0.18; flashCol='200,170,255';
  if(!(window.__eb&&window.__eb.god)){ const amt=p.maxHp*0.04; p.hp=Math.max(1,p.hp-amt); p.lastHurt=G.time; p.hurtFlash=0.12; }
  d2bSay(p.x,p.y-60,S('Frozen! Wiggle free!','Frozen! Wiggle!'),'#e8dcff','frz',1);
  d2bTip('beam',S('Shard-light freezes you!','The purple light freezes you!'),S('Block the beam with an ice block, or Shadow Dash right through it.','Block it, or dash through it!'));
}
function d2bFreeze(A,dt){
  const F=D2B.frz; if(!F) return; const p=player;
  if(AREA!==A||p.dead){ D2B.frz=null; return; }
  F.t-=dt*(1+F.mash); F.mash=Math.max(0,F.mash-dt*2); p.x=F.x; p.y=F.y; p.kvx=p.kvy=0;
  const I=typeof P3!=='undefined'&&P3.inp; if(I&&(Math.abs(I.mx||0)+Math.abs(I.my||0)>0.5||I.jump||I.attack)) F.mash=Math.min(1.5,F.mash+dt*3);
  if(F.t<=0){ D2B.frz=null; if(F.back){ p.x=F.back.x; p.y=F.back.y; const T=A.tri; if(T){ T.lx=p.x; T.ly=p.y; } } d2bSnd('shatter',0.6); emit(p.x,p.y-20,16,{col:'220,200,255',smin:40,smax:140,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); p.iframes=Math.max(p.iframes||0,0.6); }
}

// ---------- 13. falling icicles: the Clock of Icicles (a clockwise wave) and the Frozen Throat (a pattern)
function d2bFalls(A,dt){
  const ST=A.d2b; if(!ST.fall.length) return; const p=player, cs=A.cave.cell;
  for(const F of ST.fall){ const R=F.R, cfg=F.cfg; F.t+=dt;
    if(cfg.kind==='clock'){ const n=cfg.n||12, per=cfg.per||3, step=per/n, warn=cfg.warn||1, cx=R.cx, cy=R.cy;
      const sec=Math.floor(F.t/step); if(sec!==F.lastSec){ F.lastSec=sec;
        // the sector the hand reaches in `warn` seconds gets its shadows now
        const s=(sec+Math.round(warn/step))%n, a0=-Math.PI/2+s*TAU/n;
        for(const rr of cfg.rings||[2.2,4.2]){ const a=a0+TAU/n*0.5, x=cx+Math.cos(a)*rr*cs, y=cy+Math.sin(a)*rr*cs*(R.ih/R.iw>0.9?1:0.78); const k=tCell(x,y); if(k<0||A.cave.grid[k]!==0) continue; F.list.push({x,y,t:0,warn,hit:false,r:cfg.r||34}); } } }
    else if(cfg.kind==='pattern'){ const per=cfg.per||2.4; const sec=Math.floor(F.t/per); if(sec!==F.lastSec){ F.lastSec=sec; const grp=cfg.groups[sec%cfg.groups.length];
        for(const q of grp){ const w=d2bRC(R,q[0],q[1]); F.list.push({x:w.x,y:w.y,t:0,warn:cfg.warn||0.9,hit:false,r:cfg.r||30}); } } }
    for(const o of F.list){ o.t+=dt; if(!o.hit&&o.t>=o.warn){ o.hit=true; d2bSnd('crack',0.4); emit(o.x,o.y,10,{col:'220,240,255',smin:30,smax:120,lmin:.25,lmax:.5,zmin:1.5,zmax:3});
        if(!p.dead&&dist(p.x,p.y,o.x,o.y)<o.r+p.r*0.6&&!(typeof p2Shadowed==='function'&&p2Shadowed())&&scene==='play'){ if(hurtPlayer(p.maxHp*d2bDiff(0.04,0.07,0.09),o.x,o.y,160)) ftext(p.x,p.y-40,S('Bonk!','Bonk!'),'#dff4ff',14); }
        for(const e of G.enemies){ if(e.dead||!e.inArea||e.boss||dist(e.x,e.y,o.x,o.y)>o.r+(e.r||12)) continue; damageEnemy(e,40,{src:'icicle'}); } } }
    F.list=F.list.filter(o=>o.t<o.warn+0.5);
  }
}

// ---------- 14. the Echo Room: pitch dark; every Ground Pound sends a ring of echo-light along the stone paths
function d2bEcho(A,dt){
  const ST=A.d2b; if(!ST.echo) return; const R=A.rooms[ST.echo.room], p=player, inR=caveRoomAt(p.x,p.y)===R;
  ST.ech=(ST.ech||[]).filter(e=>(e.t+=dt)<e.dur);
  if(inR&&!R.solved){ A.dark=0.93/(typeof LOOK!=='undefined'&&LOOK.sb?0.66:1);   // (the Storybook look softens cave dark by 0.66: this room stays pitch dark)
    A.plr=G.items&&G.items.lantern?90:64; }
  for(const e of G.enemies){ if(e.dead||!e.d2bDive) continue; const d=e.d2bDive; d.t-=dt; if(d.t<=0){ e.d2bDive=null; continue; } const a=angTo(e.x,e.y,d.x,d.y), s=260; e.x+=Math.cos(a)*s*dt; e.y+=Math.sin(a)*s*dt; e.face=a; }
}
// the echo is light: give each live ring a light while it lasts
{ const base=drawLights; drawLights=function(){ const A=AREA; let L=null;
    if(A&&A.d2b&&A.d2b.ech&&A.d2b.ech.length){ L=[]; for(const e of A.d2b.ech){ const k=e.t/e.dur, q={x:e.x,y:e.y,r:120+520*Math.min(1,e.t/0.5),i:0.95*(1-k*k)}; A.lights.push(q); L.push(q); } }
    try{ return base.apply(this,arguments); } finally{ if(L) A.lights=A.lights.filter(q=>!L.includes(q)); } }; }

// ---------- 15. bridges: chained ones fall when their lock melts; the stone bridge drops from the ceiling on a rune plate
{ const base=p3LockMeltCave; p3LockMeltCave=function(A,o){
    base.apply(this,arguments); if(!A||!A.d2b) return;
    for(const b of A.d2b.bridges){ if(b.lock!==o.id||b.down) continue; b.down=true; for(const k of b.cells) A.cave.d2bCover.add(k); d2bSnd('boom'); later(0.35,()=>{ shake(9); d2bSnd('drum'); emit((b.x0+b.x1)/2,(b.y0+b.y1)/2,40,{col:'150,120,90',glow:false,smin:40,smax:200,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:5}); });
      setBanner(S('The bridge crashes down!','The bridge falls!'),'',2); }
    if(A.d2b.summit) d2bSummitCheck(A); }; }
{ const base=p3PressPlate; p3PressPlate=function(o){
    const was=!!o.done; base.apply(this,arguments); const A=AREA; if(!A||!A.d2b||was||!o.done) return;
    for(const b of A.d2b.runeBr){ if(b.plate!==o.id||b.down) continue; b.down=true; b.drop=0; d2bSnd('whoosh'); later(0.55,()=>{ if(AREA!==A) return; for(const k of b.cells) A.cave.d2bCover.add(k); shake(10); d2bSnd('boom'); emit((b.x0+b.x1)/2,(b.y0+b.y1)/2,44,{col:'150,140,130',glow:false,smin:40,smax:220,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:5}); setBanner(S('A stone bridge drops into place!','A bridge falls into place!'),'',2); }); } }; }
function d2bBridges(A,dt){
  for(const b of A.d2b.bridges) b.a+=((b.down?1:0)-b.a)*Math.min(1,dt*3);
  for(const b of A.d2b.runeBr){ if(b.drop>=0&&b.drop<1) b.drop=Math.min(1,b.drop+dt*1.8); b.a=b.down?Math.max(b.a,b.drop):0; }
}

// ---------- 16. the summit door (the Last Chain): four chains, four locks (one is out on the Wind Gate)
function d2bSummitCheck(A){ const o=A.d2b.summit; if(!o||o.open||!o.locks) return; if(o.locks.every(d2bLockDone)){ o.open=true; G.found[o.id]=true; d2bSnd('shatter'); d2bSnd('drum'); shake(10); jingle('secret','shrine'); setBanner(S('The last chain snaps!','The last chain snaps!'),S('The summit door is open.','The top door is open!'),3); saveGame(); } }
function d2bSummit(A,dt){
  const o=A.d2b.summit; if(!o) return; if(!o.open&&o.locks&&o.locks.every(d2bLockDone)) d2bSummitCheck(A);
  o.oa+=((o.open?1:0)-o.oa)*Math.min(1,dt*1.5);
  if(o.open&&!D2B.leaving&&scene==='play'&&!player.dead&&dist(player.x,player.y,o.x,o.y+20)<40) d2bSummitOut(A,o);
}
function d2bSummitOut(A,o){
  if(D2B.leaving) return; D2B.leaving=true; G.flags.trial_f_dread_done=true; saveGame();
  const P=(typeof f2wSpot==='function'&&f2wSpot('crowndoor'))||{x:7060,y:41700};
  const go=()=>{ D2B.leaving=false; if(typeof f2sPutOut==='function') f2sPutOut(P.x,P.y); else { G.ow={x:P.x,y:P.y}; exitArea(); } if(typeof f2sBeat==='function') later(0.5,()=>f2sBeat('crown_door')); else { G.flags.f_crown_open=1; } };
  G.fade=0.9; later(0.3,go);
}

// ---------- 17. the Frozen Choir: four Rime Knights asleep among the frozen singers; they wake when Ash comes close
function d2bChoir(A,dt,R){
  const p=player;
  for(const e of G.enemies){ if(e.dead||!e.inArea||!e.d2bSleep) continue;
    const near=dist(p.x,p.y,e.x,e.y)<150||e.hp<e.maxHp||e.p3heat>0;
    if(near){ e.d2bSleep=false; e.aggro=true; ftext(e.x,e.y-50,S('...!','!'),'#e8dcff',14); continue; }
    e.aggro=false; e.vx=e.vy=0; e.tele=null; if(e.homeX!=null){ e.x=e.homeX; e.y=e.homeY; } }
}
// a freed Rime Knight in the Heart of Dread counts as one of the Frozen Folk (quest f_warm)
if(typeof f2KnightFree==='function'){ const base=f2KnightFree; f2KnightFree=function(e){ base.apply(this,arguments); try{ if(AREA&&d2bHere(AREA)&&d2bRootOf(AREA.def)==='f_dread'){ G.flags.f_frozen_n=(G.flags.f_frozen_n||0)+1; questPoke(); } }catch(err){ console.error(err); } }; }

// ---------- 18. room by room: the snore at the Horned Gate, the blizzard, ice blocks that melt, heavy drum blocks
function d2bRooms(A,dt,R){
  const ST=A.d2b, p=player, cs=A.cave.cell, root=d2bRootOf(A.def);
  // the Stonehorn snore: every 8 s dust shakes down from the ceiling of the Horned Gate
  for(const id in A.rooms){ const Q=A.rooms[id]; if(!Q.snore) continue; Q.snT=(Q.snT||0)+dt; if(Q.snT>8){ Q.snT=0; if(R===Q){ shake(2.5); d2bSnd('roll',0.35); ftext(Q.cx,Q.y0+40,S('ZZZZZRRRRK...','ZZZZZ...'),'#e8d8c0',15); for(let i=0;i<26;i++) emit(Q.x0+rand(0,Q.x1-Q.x0),Q.y0+rand(0,(Q.y1-Q.y0)*0.4),1,{col:'190,160,130',glow:false,ang:Math.PI/2,spread:0.3,smin:30,smax:90,lmin:.6,lmax:1.2,zmin:4,zmax:7,grow:4}); } } }
  // the Shard Blizzard: snow streaks across rooms with a gust (and a whiteout feel on the Wind Gate)
  if(R&&(R.gust||R.blizzard)&&scene==='play'){ const n=R.blizzard?4:2; for(let i=0;i<n;i++) if(Math.random()<0.8){ const gx=R.gust?R.gust.dir[0]:1; G.particles.length<900&&G.particles.push({x:cam.x+rand(-40,W/zoom+40),y:cam.y+rand(-20,H/zoom),vx:(R.gustOn?520:200)*gx+rand(-30,30),vy:rand(40,120),life:1.2,max:1.2,size:rand(1.6,3.2),grow:0,drag:0,kind:'snow',col:'245,248,255',glow:false,rise:0,al:0.9}); } }
  // ice blocks melt under blue fire (the reset stone brings them back)
  if(typeof P3!=='undefined'&&P3.jet&&P3.bz&&P3.bz.blue) for(const b of A.blocks){ if(!b.d2bIce||b.sunk||b.ci<0) continue; if(p3JetHits(b.x,b.y,20)){ b.d2bHeat=(b.d2bHeat||0)+dt; p3MeltFx(b.x,b.y-20,0.7); if(b.d2bHeat>=p3Need(1.0)){ b.d2bHeat=0; b.sunk=true; b.ci=b.cj=-99; b.x=b.y=-9999; d2bSnd('melt'); ftext(p.x,p.y-60,S('Hssss! The ice block melts away.','The block melts!'),'#dff4ff',13); refreshCaveGates(); } } }
  // the lamb in the Herd Room bleats
  // the cracked floor sign in the Cracked Floor (Stonehorn h), the egg hint, Pip
  if(R&&R.nearBeat&&!(ST.near&&ST.near[R.id])){ const q=d2bRC(R,R.nearBeat.at[0],R.nearBeat.at[1]); if(dist(p.x,p.y,q.x,q.y)<(R.nearBeat.r||2.6)*cs){ (ST.near=ST.near||{})[R.id]=1; d2bBeat(R.nearBeat.key,0.1); } }
  // reach the far door (the Echo Room, the Clock of Icicles)
  if(R&&R.kind==='d2breach'&&!R.solved&&R.reachAt){ const q=d2bRC(R,R.reachAt[0],R.reachAt[1]); if(dist(p.x,p.y,q.x,q.y)<cs*1.3&&!airborne()) solveRoom(R); }
}
// heavy stone blocks (the Drumhall) do not move for Ash's claws, only for a drum's ring
{ const base=pushBlocks; pushBlocks=function(dt){
    const A=AREA; if(!A||!A.d2b) return base.apply(this,arguments);
    const hv=A.blocks.filter(b=>b.d2bHeavy&&!b.sunk), was=hv.map(b=>[b.ci,b.cj,b.anim,b.fx,b.fy,b.x,b.y,b.push]);
    base.apply(this,arguments);
    hv.forEach((b,i)=>{ const w=was[i]; if(b.ci!==w[0]||b.cj!==w[1]){ [b.ci,b.cj,b.anim,b.fx,b.fy,b.x,b.y]=w; b.push=0; d2bSay(b.x,b.y-50,S('Too heavy! Pound a drum to move it.','Too heavy! Use a drum.'),'#ffe0b0','heavy',2.5); } });
  }; }
// the egg in the Hall of Sleeping Dragons holds the Heart Ember chest
{ const base=dChestSealed; dChestSealed=function(o){ const A=AREA; if(A&&A.d2b&&o){ const R=A.rooms[o.room]; if(R&&R.eggChest&&A.d2b.eggs.some(e=>!e.egg)) return true; } return base.apply(this,arguments); }; }
{ const base=dChestOpen; dChestOpen=function(o){ const A=AREA; if(A&&A.d2b&&o&&!G.found[o.id]){ const R=A.rooms[o.room]; if(R&&R.eggChest&&A.d2b.eggs.some(e=>!e.egg)){ d2bRead(canBlaze()?S('The little ice dragon hugs an egg of clear ice. Something warm and red glows inside it. Hold your fire breath until it turns blue.','An ice egg with something warm inside. Use blue fire!'):S('The little ice dragon hugs an egg of clear ice. Something warm and red glows inside it.','An ice egg. Something warm is inside.')); return; } } return base.apply(this,arguments); }; }
function d2bEggCrack(A,o){ if(o.egg) return; o.egg=true; G.found[o.id]=true; d2bSnd('shatter'); d2bSnd('melt'); shake(4); flashA=0.25; flashCol='255,200,170';
  emit(o.x,o.y-30,30,{col:'220,240,255',smin:40,smax:180,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); emit(o.x,o.y-30,16,{kind:'fire',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:5});
  d2bBeat('f_dread_egg',0.3); saveGame(); }
// pickups we draw ourselves: a blessing, starfrost
function d2bPicks(A){
  const p=player; if(p.dead||airborne()) return;
  for(const o of A.objs){ if((o.k!=='d2b_bless'&&o.k!=='d2b_star')||G.found[o.id]||dist(p.x,p.y,o.x,o.y)>34) continue;
    if(o.k==='d2b_star'&&!d2bStarWanted()) continue;
    G.found[o.id]=true; jingle('item','chest');
    if(o.k==='d2b_bless'){ G.pendingBless=(G.pendingBless||0)+1; setBanner(S('A blessing!','A blessing!'),S('Something very old and very kind hums in the nest.','The nest hums. A blessing!'),2.6); later(0.6,()=>{ try{ offerPending(); }catch(e){} }); }
    else { giveItems({f_starfrost:1},true); setBanner(S('Starfrost!','Starfrost!'),S('A shard of star-iron, cold as the north. Gunnhild will want this.','Star-iron! Take it to Gunnhild.'),2.8); questPoke(); }
    emit(o.x,o.y-10,22,{col:'255,240,200',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20}); saveGame(); }
}
// starfrost is only lying in the Bone Pile while Gunnhild's quest wants it
function d2bStarWanted(){ const q=G.quests&&G.quests.f_forge; return !!q&&!q.done&&!(G.items&&G.items.f_starfrost); }
function d2bLambTick(o,dt){ o.t+=dt; o.baa-=dt; const p=player, d=dist(p.x,p.y,o.x,o.y); o.face=angTo(o.x,o.y,p.x,p.y); if(o.hop>0) o.hop-=dt;
  if(d<110&&o.baa<=0){ o.baa=rand(3,6); o.hop=0.4; d2bSnd('pop',0.5); ftext(o.x,o.y-44,S('Baa!','Baa!'),'#fff4dc',14); if(d<70) d2bBeat('f_deep_lamb',0); } }

// ---------- 19. USE on our things
{ const base=areaObjAct; areaObjAct=function(o){
    if(!o||!o.k||String(o.k).indexOf('d2b_')!==0) return base.apply(this,arguments);
    const A=AREA;
    switch(o.k){
      case 'd2b_fount': { if(o.used){ d2bRead(S('A spring of warm water, steaming in the cold. It is resting now. It will be full again next time you come in.','The spring is resting.')); return; }
        o.used=true; const p=player; p.hp=p.maxHp; p.potions=p.potionsMax; p.stamina=p.maxStamina; SFX.play('shrine'); flashA=0.2; flashCol='170,230,255';
        emit(o.x,o.y-10,30,{col:'190,235,255',ang:-Math.PI/2,spread:1.2,smin:30,smax:120,lmin:.5,lmax:1,zmin:1.5,zmax:3,rise:20}); setBanner(S('Warm water','Warm water'),S('Health and draughts restored.','You feel better!'),2.2); return; }
      case 'd2b_carve': { const s=SHRINES.find(q=>q.id==='s_f_dreadmoor'); if(s) restAtShrine(s); else { player.hp=player.maxHp; player.potions=player.potionsMax; saveGame(true); setBanner(S('Rested','Rested'),S('Health and draughts restored. Game saved.','Game saved.'),2.2); }
        emit(o.x,o.y-30,40,{col:'255,200,120',ang:-Math.PI/2,spread:1.2,smin:30,smax:140,lmin:.6,lmax:1.2,zmin:1.5,zmax:3,rise:20}); return; }
      case 'd2b_lift': d2bRead(canPound()?S('A round stone pillar with a ram’s face on top, sunk into the floor like a cork. KNOCK on it (a Ground Pound) and it might go up.','A stone pillar. POUND it to go up!'):S('A round stone pillar with a ram’s face on top. It will not budge for your claws.','A stone pillar. It will not move.')); return;
      case 'd2b_lifttop': d2bRead(S('The top of a stone pillar, flush with the floor. Far below, something rumbles when it is knocked. It only goes up.','A stone pillar top. It only goes up.')); return;
      case 'd2b_summit': if(o.open){ d2bSummitOut(A,o); return; } { const n=(o.locks||[]).filter(d2bLockDone).length; d2bRead(S(`The summit door: black ice, as tall as three dragons. Four chains of purple moth-frost hold it shut, each ending in a lock. ${n} of 4 locks melted.`,`The top door. Four chained locks. ${n} of 4 melted.`)); } return;
      case 'd2b_pplate': d2bRead(canPound()?S('A big round plate with a ram’s face, sunk in the floor before the stone door. Jump, and POUND it!','A ram plate. Jump and POUND it!'):S('A big round plate with a ram’s face. It is far too heavy to press with your claws.','A ram plate. Too heavy.')); return;
      case 'd2b_rubble': caveObjAct(o.gate); return;
      case 'd2b_lamp': d2bRead(S('A lamp of old brass and violet glass. Moths love lamps. Every moth. Any fire will light it.','A moth lamp. Light it with fire!')); return;
    }
  }; }
// the prompts of things that have no o.prompt (drawn or flat ones)

// ---------- 20. art: cached Storybook sprites (p3Spr: origin at the bottom middle, plum outline) and live glows
const D2BC={stone:'#c08e6a',stoneD:'#8a5a40',stoneL:'#e2b48c',horn:'#efdcb0',hornD:'#bfa076',bone:'#f2e6cc',boneD:'#c8b48e',geo:'#6ad2ff',geoL:'#c8f2ff',geoD:'#2a86c8',
  ice:'#bfe4f6',iceL:'#f0faff',iceD:'#7ab4dc',vio:'#b28cf0',vioL:'#e2d0ff',vioD:'#6a48b0',rock:'#3a3448',rockL:'#5a5070',chain:'#9a7ae0',chainD:'#5a3e9a',brass:'#d8a848',brassD:'#8a6424',wood:'#a8784a',woodD:'#6a4626'};
function d2bSpr(key,w,h,draw,ow){ return p3Spr('d2b_'+key,w,h,draw,ow); }
function d2bHornArt(g,s){ // a curled ram horn on the left (s=-1) or right (s=1) of a point, as a fat spiral
  g.lineCap='round'; let px=0, py=0; const pts=[]; for(let i=0;i<=14;i++){ const u=i/14, a=-Math.PI*0.2+u*Math.PI*1.75, r=15-u*9; pts.push([s*(8+Math.cos(a)*r*0.9),-6+Math.sin(a)*r]); }
  for(let i=1;i<pts.length;i++){ const u=i/pts.length; g.strokeStyle=i%2?D2BC.horn:D2BC.hornD; g.lineWidth=11-u*7; g.beginPath(); g.moveTo(pts[i-1][0],pts[i-1][1]); g.lineTo(pts[i][0],pts[i][1]); g.stroke(); }
  g.strokeStyle='rgba(255,250,230,.6)'; g.lineWidth=2; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]-3); for(let i=1;i<6;i++) g.lineTo(pts[i][0],pts[i][1]-3); g.stroke(); }
function d2bDrawStat(o,t){
  const x=o.x, y=o.y;
  switch(o.kind){
    case 'horn': { const sp=d2bSpr('horn'+o.v,58,96,g=>{
        celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-4+dy,19,9,0,0,TAU); q.rect(-17+dx,-70+dy,34,66); q.ellipse(dx,-70+dy,17,8,0,0,TAU); },D2BC.stone,{r:20});
        g.fillStyle='rgba(90,50,30,.35)'; for(let i=0;i<4;i++) g.fillRect(-17,-60+i*15,34,2);
        celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-74+dy,22,10,0,0,TAU); },D2BC.stoneL,{r:22});
        g.save(); g.translate(0,-62); d2bHornArt(g,-1); d2bHornArt(g,1); g.restore();
        g.fillStyle='#5a3424'; g.beginPath(); g.ellipse(0,-40,6,8,0,0,TAU); g.fill(); g.fillStyle=D2BC.geo; g.beginPath(); g.arc(0,-41,2.6,0,TAU); g.fill(); });
      p3Sh(x,y-2,22,8,0.3); p3Put(sp,x,y); glowAt(x,y-41,10,'120,210,255',0.35+0.15*Math.sin(t*2+x)); return; }
    case 'geode': { const sp=d2bSpr('geo'+o.v,52,54,g=>{ celFill(g,(q,dx,dy)=>sbRoundPoly(q,sbRockPts(20,mulberry32(5+o.v),true),dx,dy-10),'#8a6a5a',{r:20});
        const rng=mulberry32(11+o.v); for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*0.42+rng()*0.1, L=18+rng()*16, bx=(i-2)*6, by=-12;
          g.fillStyle=i%2?D2BC.geo:D2BC.geoD; g.beginPath(); g.moveTo(bx-5,by); g.lineTo(bx+Math.cos(a)*L-2,by+Math.sin(a)*L); g.lineTo(bx+Math.cos(a)*(L+6),by+Math.sin(a)*(L+6)); g.lineTo(bx+Math.cos(a)*L+3,by+Math.sin(a)*L); g.lineTo(bx+5,by); g.closePath(); g.fill();
          g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(bx-2,by-2); g.lineTo(bx+Math.cos(a)*L-1,by+Math.sin(a)*L); g.lineTo(bx+Math.cos(a)*L*0.6,by+Math.sin(a)*L*0.6+2); g.closePath(); g.fill(); } });
      p3Sh(x,y-2,18,7,0.3); p3Put(sp,x,y); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-24,26,'110,200,255',0.3+0.12*Math.sin(t*1.7+y)); ctx.restore(); return; }
    case 'skull': { const sp=d2bSpr('skull',110,70,g=>{
        g.strokeStyle=D2BC.boneD; g.lineCap='round'; for(const s of [-1,1]){ g.lineWidth=10; g.beginPath(); g.moveTo(s*14,-14); g.quadraticCurveTo(s*48,-4,s*46,-40); g.stroke(); g.strokeStyle=D2BC.bone; g.lineWidth=6; g.beginPath(); g.moveTo(s*14,-15); g.quadraticCurveTo(s*46,-6,s*44,-38); g.stroke(); g.strokeStyle=D2BC.boneD; }
        celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-28+dy,26,22,0,0,TAU); q.rect(-14+dx,-24+dy,28,20); },D2BC.bone,{r:26});
        g.fillStyle='#3a2a20'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*10,-32,6,7,0,0,TAU); g.fill(); } g.beginPath(); g.ellipse(0,-14,5,4,0,0,TAU); g.fill(); });
      p3Sh(x,y-2,40,10,0.3); p3Put(sp,x,y); return; }
    case 'soldier': { const sp=d2bSpr('sold'+o.v,40,74,g=>{
        p3IceBlockArt(g,36,10,62,{vio:true,noSnow:true});
        g.globalAlpha=0.55; const c=['#c84a3a','#3a6aaa','#6a8a3a','#a87a2a'][o.v]; g.fillStyle='#5a5e68'; g.beginPath(); g.ellipse(0,-46,7,7,0,0,TAU); g.fill(); g.fillRect(-7,-48,14,4);
        g.fillStyle=c; g.fillRect(-8,-38,16,22); g.fillStyle='#e8b894'; g.beginPath(); g.arc(0,-44,4.5,0,TAU); g.fill(); g.fillStyle='#3a2020'; g.beginPath(); g.ellipse(0,-42,2,2.4,0,0,TAU); g.fill();
        g.strokeStyle='#8a8e98'; g.lineWidth=2; g.beginPath(); g.moveTo(11,-60); g.lineTo(11,-10); g.stroke(); g.globalAlpha=1; });
      p3Sh(x,y-2,18,6,0.3); p3Put(sp,x,y); if(Math.sin(t*0.9+x)>0.97) glowAt(x,y-44,14,'210,190,255',0.3); return; }
    case 'dragon': { const sp=d2bSpr('drag'+o.v,150,124,g=>{
        // a coiled ice dragon on a plinth, chained
        celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-8+dy,62,14,0,0,TAU); q.rect(-62+dx,-16+dy,124,8); },'#4a4260',{r:60});
        celFill(g,(q,dx,dy)=>{ q.ellipse(-8+dx,-40+dy,46,26,0,0,TAU); },D2BC.ice,{r:46});
        celFill(g,(q,dx,dy)=>{ q.moveTo(-50+dx,-30+dy); q.quadraticCurveTo(-70+dx,-70+dy,-30+dx,-78+dy); q.lineTo(-24+dx,-64+dy); q.quadraticCurveTo(-48+dx,-60+dy,-40+dx,-34+dy); q.closePath(); },D2BC.iceD,{r:30});
        celFill(g,(q,dx,dy)=>{ q.moveTo(20+dx,-46+dy); q.quadraticCurveTo(36+dx,-92+dy,24+dx,-100+dy); q.quadraticCurveTo(10+dx,-96+dy,14+dx,-60+dy); q.closePath(); },D2BC.ice,{r:24});
        celFill(g,(q,dx,dy)=>{ q.ellipse(22+dx,-104+dy,18,11,-0.3,0,TAU); q.moveTo(34+dx,-104+dy); q.lineTo(50+dx,-98+dy); q.lineTo(34+dx,-96+dy); },D2BC.iceL,{r:18});
        g.strokeStyle=D2BC.iceL; g.lineWidth=3; for(const s of [-1,1]){ g.beginPath(); g.moveTo(18+s*6,-112); g.quadraticCurveTo(10+s*14,-124,2+s*10,-118); g.stroke(); }
        g.fillStyle='#3a3a6a'; g.beginPath(); g.ellipse(28,-106,2.6,1.6,0,0,TAU); g.fill();
        g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=2; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(-40+i*12,-54); g.lineTo(-34+i*12,-30); g.stroke(); }
        // the chains of moth-frost across it
        g.strokeStyle=D2BC.chainD; g.lineWidth=5; g.beginPath(); g.moveTo(-60,-12); g.quadraticCurveTo(-10,-70,58,-14); g.stroke(); g.beginPath(); g.moveTo(-58,-40); g.quadraticCurveTo(0,-22,54,-50); g.stroke();
        g.strokeStyle=D2BC.chain; g.lineWidth=2.4; g.setLineDash([5,4]); g.beginPath(); g.moveTo(-60,-12); g.quadraticCurveTo(-10,-70,58,-14); g.stroke(); g.beginPath(); g.moveTo(-58,-40); g.quadraticCurveTo(0,-22,54,-50); g.stroke(); g.setLineDash([]); });
      p3Sh(x,y-2,66,14,0.32); p3Put(sp,x,y); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x+20,y-100,18,'190,160,255',0.18+0.12*Math.sin(t*1.3+x)); ctx.restore(); return; }
    case 'hatch': { const sp=d2bSpr('hatch',64,58,g=>{
        celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-6+dy,26,8,0,0,TAU); },'#4a4260',{r:24});
        celFill(g,(q,dx,dy)=>{ q.ellipse(-6+dx,-26+dy,16,18,0,0,TAU); q.ellipse(-12+dx,-46+dy,11,9,0,0,TAU); },D2BC.ice,{r:18});
        g.strokeStyle=D2BC.iceL; g.lineWidth=2.4; g.beginPath(); g.moveTo(-16,-54); g.lineTo(-20,-62); g.moveTo(-8,-54); g.lineTo(-6,-62); g.stroke(); g.fillStyle='#3a3a6a'; g.beginPath(); g.arc(-8,-47,1.8,0,TAU); g.fill();
        g.strokeStyle=D2BC.iceD; g.lineWidth=5; g.beginPath(); g.moveTo(-18,-30); g.quadraticCurveTo(8,-40,16,-22); g.stroke(); });
      p3Sh(x,y-2,26,7,0.3); p3Put(sp,x,y);
      if(!o.egg){ const ex=x+12, ey=y-20; ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(ex,ey,22,'255,120,80',0.35+0.15*Math.sin(t*3)); ctx.restore();
        const es=d2bSpr('egg',30,34,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-15+dy,12,15,0,0,TAU); },D2BC.iceL,{r:14}); g.fillStyle='rgba(255,110,70,.55)'; g.beginPath(); g.ellipse(1,-13,5,7,0,0,TAU); g.fill(); g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-6,-22); g.lineTo(-3,-12); g.stroke(); });
        p3Put(es,ex,ey+15); const ht=o.p3heat||0; if(ht>0) p3HeatOverlay(ex,ey+15,24,30,clamp(ht/2,0,1),t); }
      else { ctx.fillStyle=D2BC.iceL; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(x+12+s*12,y-4,7,4,s*0.6,0,TAU); ctx.fill(); } }
      return; }
    case 'window': { const sp=d2bSpr('win',74,64,g=>{ g.fillStyle='#2a2238'; rrect(g,-34,-62,68,60,30); g.fill(); g.fillStyle='#c8d8f0'; rrect(g,-26,-54,52,50,24); g.fill();
        g.fillStyle='#eef4ff'; for(let i=0;i<4;i++){ g.beginPath(); g.ellipse(-14+i*10,-22+(i%2)*8,10,5,0,0,TAU); g.fill(); } g.strokeStyle='#5a4a78'; g.lineWidth=4; g.beginPath(); g.moveTo(0,-54); g.lineTo(0,-4); g.moveTo(-26,-28); g.lineTo(26,-28); g.stroke(); });
      p3Put(sp,x,y+8); for(let i=0;i<3;i++){ const ph=(t*1.6+i*0.33)%1; ctx.fillStyle=`rgba(255,255,255,${0.8*(1-ph)})`; ctx.beginPath(); ctx.arc(x-20+ph*44,y-40+i*14+ph*10,1.6,0,TAU); ctx.fill(); } return; }
    case 'carving': { const sp=d2bSpr('carv',90,60,g=>{ g.fillStyle='rgba(30,20,50,.55)'; rrect(g,-42,-58,84,54,8); g.fill(); g.strokeStyle='#b8a0e8'; g.lineWidth=2.4;
        g.beginPath(); g.arc(12,-32,16,0,TAU); g.stroke(); g.fillStyle='rgba(30,20,50,1)'; g.beginPath(); g.arc(26,-36,12,0,TAU); g.fill();
        g.beginPath(); g.moveTo(-30,-32); g.quadraticCurveTo(-16,-52,-6,-32); g.quadraticCurveTo(-16,-12,-30,-32); g.moveTo(-6,-32); g.quadraticCurveTo(6,-50,10,-34); g.moveTo(-6,-32); g.quadraticCurveTo(6,-14,10,-30); g.stroke();
        g.beginPath(); g.moveTo(-8,-36); g.lineTo(-2,-46); g.moveTo(-8,-28); g.lineTo(-2,-18); g.stroke(); });
      p3Put(sp,x,y+4); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x+12,y-28,20,'200,170,255',0.15+0.1*Math.sin(t*1.1)); ctx.restore(); return; }
  }
}
// flat statics on the floor (bones, toys, the frost nest)
function d2bDrawFlat(o,t){
  const x=o.x, y=o.y;
  if(o.kind==='bones'){ ctx.strokeStyle=D2BC.boneD; ctx.lineCap='round'; ctx.lineWidth=6; const v=o.v; for(let i=0;i<3;i++){ const a=v*1.3+i*1.1, L=14+i*4; ctx.beginPath(); ctx.moveTo(x-Math.cos(a)*L,y-Math.sin(a)*L*0.5); ctx.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L*0.5); ctx.stroke(); }
    ctx.strokeStyle=D2BC.bone; ctx.lineWidth=3.5; for(let i=0;i<3;i++){ const a=v*1.3+i*1.1, L=14+i*4; ctx.beginPath(); ctx.moveTo(x-Math.cos(a)*L,y-Math.sin(a)*L*0.5-1); ctx.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L*0.5-1); ctx.stroke(); } return; }
  if(o.kind==='nest'){ ctx.fillStyle='rgba(230,244,255,.9)'; ctx.beginPath(); ctx.ellipse(x,y,46,22,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(150,190,230,.8)'; ctx.lineWidth=3; for(let i=0;i<8;i++){ const a=i/8*TAU; ctx.beginPath(); ctx.ellipse(x,y,42-i%3*6,20-i%3*3,a*0.1,a,a+1.2); ctx.stroke(); } ctx.fillStyle='rgba(200,230,255,.6)'; ctx.beginPath(); ctx.ellipse(x,y+2,26,11,0,0,TAU); ctx.fill(); return; }
  if(o.kind==='toys'){ // two giant ice knitting needles, a snowglobe, a carving of two baby dragons
    ctx.strokeStyle='#d8eef8'; ctx.lineCap='round'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x-44,y+8); ctx.lineTo(x+4,y-20); ctx.moveTo(x-40,y-18); ctx.lineTo(x+8,y+10); ctx.stroke(); ctx.fillStyle='#ffffff'; for(const [a,b] of [[x+4,y-20],[x+8,y+10]]){ ctx.beginPath(); ctx.arc(a,b,4,0,TAU); ctx.fill(); }
    ctx.fillStyle='#e8a8d0'; ctx.beginPath(); ctx.arc(x-20,y-4,8,0,TAU); ctx.fill();
    const g2=d2bSpr('globe',30,32,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-12+dx,-8+dy,24,8); },'#8a6a4a',{r:12}); g.fillStyle='rgba(200,230,255,.75)'; g.beginPath(); g.arc(0,-18,12,0,TAU); g.fill(); g.fillStyle='#ffffff'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(-6+i*2.4,-16-(i%3)*4,1.2,0,TAU); g.fill(); } g.fillStyle='#5a7a9a'; g.beginPath(); g.moveTo(-4,-10); g.lineTo(0,-20); g.lineTo(4,-10); g.fill(); });
    p3Put(g2,x+30,y+8);
    const c2=d2bSpr('twins',46,30,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-20+dx,-24+dy,40,22); },'#8a7a6a',{r:20}); g.fillStyle='#d8a070'; g.beginPath(); g.arc(-8,-12,6,0,TAU); g.fill(); g.fillStyle='#bfe0f4'; g.beginPath(); g.arc(9,-12,6,0,TAU); g.fill();
      g.fillStyle='#ff9a3a'; g.beginPath(); g.moveTo(-2,-12); g.lineTo(6,-15); g.lineTo(6,-9); g.fill(); g.fillStyle='#ffffff'; g.beginPath(); g.arc(13,-7,1.4,0,TAU); g.fill(); g.beginPath(); g.arc(11,-5,1,0,TAU); g.fill(); });
    p3Put(c2,x-4,y+30); return; }
}
// the pound doors, the plates and the rubble on the far side
function d2bDrawPoundDoor(o,t){
  const horiz=o.vertical, x=o.x, y=o.y, W2=horiz?144:48, H2=horiz?48:144;
  ctx.fillStyle=SBC.outline; rrect(ctx,x-W2/2-2,y-H2/2-2,W2+4,H2+4,8); ctx.fill();
  ctx.fillStyle='#8a6248'; rrect(ctx,x-W2/2,y-H2/2,W2,H2,7); ctx.fill(); ctx.fillStyle='#b4866a'; rrect(ctx,x-W2/2,y-H2/2,W2,H2*(horiz?0.55:0.2),7); ctx.fill();
  ctx.strokeStyle='rgba(60,30,20,.45)'; ctx.lineWidth=2; for(let i=1;i<(horiz?4:2);i++){ if(horiz){ ctx.beginPath(); ctx.moveTo(x-W2/2+i*W2/4,y-H2/2); ctx.lineTo(x-W2/2+i*W2/4,y+H2/2); ctx.stroke(); } }
  // the ram medallion
  ctx.fillStyle='#d8b48a'; ctx.beginPath(); ctx.arc(x,y-2,15,0,TAU); ctx.fill(); ctx.strokeStyle=D2BC.horn; ctx.lineWidth=4; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(x+s*13,y-6,7,s<0?-0.4:Math.PI-2.4,s<0?2.4:Math.PI+0.4); ctx.stroke(); }
  ctx.fillStyle='#5a3424'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(x+s*5,y-4,2,0,TAU); ctx.fill(); }
}
FL.d2b_pdoor=()=>{};
FL.d2b_pplate=(o,t)=>{ const g=o.gate, r=26, b=o.bump>0?2:0; if(o.bump>0) o.bump-=1/60;
  const sp=d2bSpr('pplate',r*2+6,r*1.3,g2=>{ celFill(g2,(q,dx,dy)=>{ q.ellipse(dx,-r*0.6+dy,r,r*0.6,0,0,TAU); },'#a08068',{r}); g2.strokeStyle='#6a4a34'; g2.lineWidth=2; g2.beginPath(); g2.ellipse(0,-r*0.6,r*0.72,r*0.42,0,0,TAU); g2.stroke();
    g2.strokeStyle=D2BC.horn; g2.lineWidth=3.4; for(const s of [-1,1]){ g2.beginPath(); g2.arc(s*9,-r*0.62,5,s<0?-0.4:Math.PI-2.4,s<0?2.4:Math.PI+0.4); g2.stroke(); } g2.fillStyle='#5a3424'; g2.beginPath(); g2.ellipse(0,-r*0.5,4,5,0,0,TAU); g2.fill(); });
  p3Put(sp,o.x,o.y+r*0.6+b); const lit=g.opened; ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y,r,lit?'255,200,110':'255,220,160',lit?0.35:0.12+0.1*Math.sin(t*2.4)); ctx.restore(); };
FL.d2b_rubble=(o,t)=>{ if(o.gate.opened) return; const sp=d2bSpr('rubble',70,30,g=>{ const rng=mulberry32(77); for(let i=0;i<6;i++){ const rx=-26+i*10+rng()*4, rr=7+rng()*5; celFill(g,(q,dx,dy)=>sbRoundPoly(q,sbRockPts(rr,mulberry32(30+i)),rx+dx,-rr*0.7+dy),'#9a7058',{r:rr}); } }); p3Put(sp,o.x,o.y+10); };
function d2bDrawGrate(o,t){
  const A=AREA, cs=A.cave.cell; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const k of o.cells){ const q=tPos(k); x0=Math.min(x0,q.x-cs/2); y0=Math.min(y0,q.y-cs/2); x1=Math.max(x1,q.x+cs/2); y1=Math.max(y1,q.y+cs/2); }
  if(o.opened){ ctx.fillStyle='rgba(40,40,50,.6)'; ctx.fillRect(x0,y0,6,y1-y0); ctx.fillRect(x1-6,y0,6,y1-y0); return; }
  const horiz=x1-x0>y1-y0; ctx.fillStyle='rgba(10,8,16,.35)'; ctx.fillRect(x0,y0,x1-x0,y1-y0);
  ctx.lineCap='round'; for(const [w,col] of [[7,SBC.outline],[4,'#7a7a8a']]){ ctx.strokeStyle=col; ctx.lineWidth=w; ctx.beginPath();
    if(horiz){ for(let x=x0+8;x<x1;x+=14){ ctx.moveTo(x,y0+2); ctx.lineTo(x,y1-4); } ctx.moveTo(x0,y0+10); ctx.lineTo(x1,y0+10); ctx.moveTo(x0,y1-12); ctx.lineTo(x1,y1-12); }
    else { for(let y=y0+8;y<y1;y+=14){ ctx.moveTo(x0+2,y); ctx.lineTo(x1-2,y); } ctx.moveTo(x0+10,y0); ctx.lineTo(x0+10,y1); }
    ctx.stroke(); }
  ctx.fillStyle='rgba(255,255,255,.25)'; if(horiz) for(let x=x0+8;x<x1;x+=14) ctx.fillRect(x-1,y0+4,1.2,y1-y0-10);
  const lx=(x0+x1)/2, ly=(y0+y1)/2+4; ctx.fillStyle=SBC.outline; rrect(ctx,lx-11,ly-8,22,20,4); ctx.fill(); ctx.fillStyle=D2BC.brass; rrect(ctx,lx-9,ly-6,18,16,3); ctx.fill(); ctx.strokeStyle=D2BC.brassD; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(lx,ly-7,6,Math.PI,TAU); ctx.stroke(); ctx.fillStyle='#3a2a10'; ctx.fillRect(lx-1.4,ly,2.8,6);
  if(AREA.keys()>0) glowAt(lx,ly,34,'255,220,140',0.25+0.15*Math.sin(t*4));
}
function d2bDrawBoulder(o,t){ const sp=d2bSpr('bould',64,56,g=>{ celFill(g,(q,dx,dy)=>sbRoundPoly(q,sbRockPts(26,mulberry32(19)),dx,dy-24),'#a88a72',{r:26}); g.strokeStyle='#4a3020'; g.lineWidth=2.6; g.beginPath(); g.moveTo(-14,-40); g.lineTo(-4,-26); g.lineTo(-10,-12); g.moveTo(-4,-26); g.lineTo(10,-30); g.lineTo(18,-14); g.moveTo(10,-30); g.lineTo(8,-44); g.stroke(); });
  p3Sh(o.x,o.y+14,26,8,0.3); p3Put(sp,o.x,o.y+20); if(o.heat>0) p3HeatOverlay(o.x,o.y+20,50,44,clamp(o.heat/1.6,0,1),t); }
function d2bDrawGravel(o,t){ ctx.fillStyle='rgba(120,100,80,.6)'; for(let i=0;i<9;i++){ const a=i*2.1; ctx.beginPath(); ctx.ellipse(o.x+Math.cos(a)*18,o.y+Math.sin(a)*10+8,4,3,a,0,TAU); ctx.fill(); } }

// moth lamps, Shard Eyes, beam crystals, the summit door, the lift, the spring, Ember's carving, the lamb
function d2bDrawLamp(o,t){
  const x=o.x, y=o.y, h=o.h, sp=d2bSpr(o.nest?'nlamp':'lamp',34,h+22,g=>{
    g.fillStyle=D2BC.brassD; g.fillRect(-3,-h+4,6,h); g.fillStyle=D2BC.brass; g.fillRect(-3,-h+4,2.4,h);
    celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-4+dy,12,5,0,0,TAU); },D2BC.brass,{r:12});
    celFill(g,(q,dx,dy)=>{ q.moveTo(-11+dx,-h-2+dy); q.lineTo(11+dx,-h-2+dy); q.lineTo(8+dx,-h+14+dy); q.lineTo(-8+dx,-h+14+dy); q.closePath(); },'#8a6ad0',{r:12});
    g.fillStyle=D2BC.brass; g.fillRect(-12,-h-4,24,4); g.fillRect(-9,-h+13,18,3); g.beginPath(); g.moveTo(-6,-h-4); g.lineTo(0,-h-12); g.lineTo(6,-h-4); g.fill();
    if(o.nest){ g.strokeStyle='rgba(240,230,255,.6)'; g.lineWidth=1.4; for(let i=0;i<5;i++){ g.beginPath(); g.arc(0,-6,14+i*2,Math.PI*1.1,Math.PI*1.9); g.stroke(); } } });
  p3Sh(x,y,12,5,0.3); p3Put(sp,x,y+4);
  if(o.lit){ const f=0.85+0.15*Math.sin(t*9+x); ctx.fillStyle=`rgba(255,${200+Math.round(40*f)},140,${0.9*f})`; ctx.beginPath(); ctx.ellipse(x,y-h+6,5,7,0,0,TAU); ctx.fill(); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-h+6,o.nest?44:58,'255,190,120',0.55*f); ctx.restore();
    if(!o.nest&&o.burn<2.5&&Math.sin(t*20)>0) ctx.globalAlpha=1; }
  else { ctx.fillStyle='rgba(90,80,110,.8)'; ctx.beginPath(); ctx.ellipse(x,y-h+6,4,5,0,0,TAU); ctx.fill(); }
}
function d2bDrawEye(o,t){
  const x=o.x, y=o.y, open=o.open&&!o.dead, f=o.face||1;
  const base=d2bSpr('eyeb',64,40,g=>{ g.fillStyle='#4a3a6a'; g.beginPath(); g.ellipse(0,-20,30,18,0,0,TAU); g.fill(); g.fillStyle=D2BC.vioD; for(let i=0;i<6;i++){ const a=i/6*TAU; g.beginPath(); g.moveTo(Math.cos(a)*24,-20+Math.sin(a)*14); g.lineTo(Math.cos(a+0.25)*34,-20+Math.sin(a+0.25)*20); g.lineTo(Math.cos(a+0.5)*24,-20+Math.sin(a+0.5)*14); g.fill(); } });
  p3Put(base,x,y+20);
  if(o.dead){ ctx.strokeStyle='rgba(30,20,50,.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-18,y-8); ctx.lineTo(x-2,y+4); ctx.lineTo(x+16,y-6); ctx.stroke(); return; }
  const lid=open?(o.flash>0?0.15:0):1;
  ctx.fillStyle='#f4ecff'; ctx.beginPath(); ctx.ellipse(x,y,20,11*(1-lid*0.92),0,0,TAU); ctx.fill();
  if(lid<0.9){ const px=x+Math.cos(o.look)*6, py=y+Math.sin(o.look)*2.5*f; ctx.fillStyle=D2BC.vio; ctx.beginPath(); ctx.arc(px,py,7,0,TAU); ctx.fill(); ctx.fillStyle='#2a1050'; ctx.beginPath(); ctx.ellipse(px,py,2.4,6,0,0,TAU); ctx.fill(); }
  ctx.strokeStyle=SBC.outline; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(x,y,20,11*(1-lid*0.92),0,0,TAU); ctx.stroke();
  if(o.shutT>0){ ctx.strokeStyle=D2BC.woodD; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-6,y+2); ctx.lineTo(x+12,y-14); ctx.stroke(); ctx.fillStyle='#e8e0d0'; ctx.beginPath(); ctx.moveTo(x+12,y-14); ctx.lineTo(x+18,y-16); ctx.lineTo(x+14,y-10); ctx.fill(); }
  ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y,open?40:20,'190,140,255',(open?0.45:0.15)+(o.flash>0?0.5:0)); ctx.restore();
}
function d2bDrawBeamSrc(o,t){ const sp=d2bSpr('bsrc',40,44,g=>{ g.fillStyle='#4a3a6a'; g.beginPath(); g.ellipse(0,-30,18,12,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.moveTo(-9+dx,-30+dy); q.lineTo(0+dx,-6+dy); q.lineTo(9+dx,-30+dy); q.lineTo(0+dx,-40+dy); q.closePath(); },D2BC.vio,{r:12}); });
  p3Put(sp,o.x,o.y+18); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y,o.lit?36:16,'200,150,255',o.lit?0.6:0.2+(o.warn?0.3*Math.sin(t*30):0)); ctx.restore(); }
function d2bDrawSummit(o,t){
  const x=o.x, y=o.y, a=o.oa;
  const fr=d2bSpr('sumf',176,140,g=>{ g.fillStyle='#2a2238'; rrect(g,-86,-138,172,138,40); g.fill(); g.fillStyle='#4a3e66'; rrect(g,-78,-130,156,130,34); g.fill(); g.fillStyle='#0c0a18'; rrect(g,-62,-118,124,118,28); g.fill(); });
  p3Put(fr,x,y+14);
  if(a>0.02){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(x,y-50,90,'220,235,255',0.5*a); ctx.restore(); for(let i=0;i<3;i++){ const ph=(t*1.2+i*0.33)%1; ctx.fillStyle=`rgba(255,255,255,${0.8*a*(1-ph)})`; ctx.beginPath(); ctx.arc(x-40+i*40+Math.sin(t+i)*10,y-100+ph*110,2,0,TAU); ctx.fill(); } }
  const dw=62*(1-a*0.9);
  for(const s of [-1,1]){ const dx=s*(62-dw/2)-s*0; ctx.fillStyle=SBC.outline; rrect(ctx,x+s*(62-dw)-(s>0?0:0)-(s<0?0:dw),y-118+14,dw,118,10); ctx.fill();
    ctx.fillStyle='#3a3060'; rrect(ctx,x+(s<0?-62:62-dw)+2,y-116+14,dw-4,114,9); ctx.fill(); ctx.fillStyle='rgba(200,170,255,.35)'; ctx.fillRect(x+(s<0?-62:62-dw)+8,y-100+14,4,80); }
  if(a<0.5){ ctx.save(); ctx.translate(x,y-50); ctx.strokeStyle=D2BC.vioL; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(0,0,22,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10,0); ctx.quadraticCurveTo(0,-18,10,0); ctx.quadraticCurveTo(0,18,-10,0); ctx.stroke(); ctx.restore(); }
  // the four chains from the door to their locks (gone once a lock melts)
  const A=AREA; if(!o.locks) return; o.locks.forEach((id,i)=>{ if(d2bLockDone(id)) return; let L=A.p3&&A.p3.locks.find(q=>q.id===id); let lx, ly;
    if(L){ lx=L.x; ly=L.y-14; } else { lx=x+150; ly=y-70+i*6; }
    const ax=x+(i<2?-30:30), ay=y-60+(i%2)*26; d2bChain(ax,ay,lx,ly,t,i); });
}
function d2bChain(x0,y0,x1,y1,t,ph){ const n=Math.max(4,Math.round(dist(x0,y0,x1,y1)/12)); ctx.lineCap='round';
  for(let i=0;i<n;i++){ const u0=i/n, u1=(i+1)/n, sag=Math.sin(Math.PI*u0)*22, sag1=Math.sin(Math.PI*u1)*22; const ax=lerp(x0,x1,u0), ay=lerp(y0,y1,u0)+sag, bx=lerp(x0,x1,u1), by=lerp(y0,y1,u1)+sag1;
    ctx.strokeStyle=SBC.outline; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke(); ctx.strokeStyle=i%2?D2BC.chain:D2BC.chainD; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke(); }
  ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(lerp(x0,x1,0.5),lerp(y0,y1,0.5)+20,24,'190,150,255',0.12+0.08*Math.sin(t*2+ph)); ctx.restore(); }
function d2bDrawLift(o,t){ const r=40, up=o.st?Math.min(1,o.t/1.3):0, z=up*110;
  const top=d2bSpr('lift',r*2+8,r*1.3+6,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-r*0.6+dy,r,r*0.6,0,0,TAU); },'#a87a5a',{r}); g.strokeStyle='#6a4632'; g.lineWidth=2.4; g.beginPath(); g.ellipse(0,-r*0.6,r*0.72,r*0.42,0,0,TAU); g.stroke();
    g.strokeStyle=D2BC.horn; g.lineWidth=5; for(const s of [-1,1]){ g.beginPath(); g.arc(s*14,-r*0.66,8,s<0?-0.4:Math.PI-2.4,s<0?2.4:Math.PI+0.4); g.stroke(); } g.fillStyle='#4a2a1a'; g.beginPath(); g.ellipse(0,-r*0.5,6,8,0,0,TAU); g.fill(); g.fillStyle=D2BC.geo; g.beginPath(); g.arc(0,-r*0.66,3,0,TAU); g.fill(); });
  if(z>1){ ctx.fillStyle='#5a3424'; ctx.fillRect(o.x-r*0.9,o.y-z,r*1.8,z); ctx.fillStyle='rgba(0,0,0,.25)'; for(let i=0;i<z;i+=14) ctx.fillRect(o.x-r*0.9,o.y-z+i,r*1.8,2); }
  p3Put(top,o.x,o.y+r*0.6-z); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y-r*0.3-z,24,'120,210,255',0.3+0.15*Math.sin(t*2)); ctx.restore(); }
FL.d2b_lifttop=(o,t)=>{ const r=40, sp=d2bSpr('lift2',r*2+8,r*1.3,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-r*0.6+dy,r,r*0.6,0,0,TAU); },'#9a7058',{r}); g.strokeStyle='#5a3a28'; g.lineWidth=2; g.beginPath(); g.ellipse(0,-r*0.6,r*0.8,r*0.48,0,0,TAU); g.stroke(); g.strokeStyle=D2BC.horn; g.lineWidth=4; for(const s of [-1,1]){ g.beginPath(); g.arc(s*14,-r*0.66,7,s<0?-0.4:Math.PI-2.4,s<0?2.4:Math.PI+0.4); g.stroke(); } }); p3Put(sp,o.x,o.y+r*0.6); };
function d2bDrawFount(o,t){ const sp=d2bSpr('fount',76,50,g=>{ celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-16+dy,34,18,0,0,TAU); },'#8a8aa8',{r:34}); g.fillStyle='#3a8aa8'; g.beginPath(); g.ellipse(0,-17,27,13,0,0,TAU); g.fill(); g.fillStyle='rgba(180,240,255,.5)'; g.beginPath(); g.ellipse(-8,-20,12,4,-0.2,0,TAU); g.fill();
    g.fillStyle='#f4fbff'; for(let i=0;i<7;i++){ const a=i/7*TAU; g.beginPath(); g.ellipse(Math.cos(a)*32,-16+Math.sin(a)*16,5,3,a,0,TAU); g.fill(); } });
  p3Put(sp,o.x,o.y+16); if(!o.used||Math.random()<0.3) for(let i=0;i<2;i++) if(Math.random()<0.25) emit(o.x+rand(-18,18),o.y-6,1,{col:'240,248,255',glow:false,ang:-Math.PI/2,spread:0.4,smin:15,smax:35,lmin:.8,lmax:1.4,zmin:3,zmax:6,grow:8,drag:0.5,alpha:0.45});
  if(!o.used){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y-2,30,'150,230,255',0.25+0.1*Math.sin(t*2)); ctx.restore(); } }
function d2bDrawCarve(o,t){ const sp=d2bSpr('ecarve',56,78,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-22+dx,-74+dy,44,70); q.ellipse(dx,-74+dy,22,10,0,0,TAU); },'#8a7a6a',{r:24}); g.fillStyle='#5a4a3a'; g.fillRect(-26,-8,52,8);
    g.strokeStyle='#ffd27a'; g.lineWidth=3; g.beginPath(); g.moveTo(0,-20); g.quadraticCurveTo(-14,-36,-4,-52); g.quadraticCurveTo(0,-44,4,-56); g.quadraticCurveTo(14,-38,0,-20); g.stroke(); });
  p3Sh(o.x,o.y,24,7,0.3); p3Put(sp,o.x,o.y+4); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y-38,30,'255,200,120',0.4+0.15*Math.sin(t*2.2)); ctx.restore(); }
function d2bDrawLamb(o,t){ const x=o.x, y=o.y-(o.hop>0?Math.sin(o.hop/0.4*Math.PI)*12:0), fl=Math.cos(o.face)<0?-1:1;
  const sp=d2bSpr('lamb',44,40,g=>{ celFill(g,(q,dx,dy)=>{ for(const [a,b,r] of [[-8,-16,9],[2,-18,10],[10,-15,8],[-2,-10,10],[8,-9,8],[-10,-9,7]]) q.ellipse(a+dx,b+dy,r,r*0.85,0,0,TAU); },'#f6f2ea',{r:16});
    g.fillStyle='#4a4048'; for(const a of [-8,-2,5,10]) g.fillRect(a,-6,3,7);
    celFill(g,(q,dx,dy)=>{ q.ellipse(16+dx,-20+dy,7,6,0,0,TAU); },'#8a8088',{r:7}); g.fillStyle='#1a1418'; g.beginPath(); g.arc(18,-21,1.3,0,TAU); g.fill();
    g.strokeStyle='#b8a890'; g.lineWidth=3; g.beginPath(); g.arc(12,-24,3.4,Math.PI*0.9,Math.PI*2.1); g.stroke(); });
  p3Sh(o.x,o.y,14,5,0.3); ctx.save(); ctx.translate(x,y); ctx.scale(fl,1); p3Put(sp,0,0); ctx.restore(); }
// chained bridges: up (a plank standing at its hinge, with a chain to the lock) or down across the gap
function d2bDrawBridge(b,t,tall){
  const a=b.a, w=b.x1-b.x0, h=b.y1-b.y0, horiz=w>=h;
  if(!tall){ if(a<0.02) return; ctx.save(); ctx.globalAlpha=Math.min(1,a*1.3);
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(b.x0+4,b.y0+8,w,h);
    ctx.fillStyle=SBC.outline; ctx.fillRect(b.x0-2,b.y0+2,w+4,h-4); ctx.fillStyle=D2BC.wood; ctx.fillRect(b.x0,b.y0+4,w,h-8);
    ctx.fillStyle='rgba(60,30,10,.45)'; if(horiz) for(let x=b.x0+12;x<b.x1;x+=14) ctx.fillRect(x,b.y0+4,2,h-8); else for(let y=b.y0+12;y<b.y1;y+=14) ctx.fillRect(b.x0,y,w,2);
    ctx.fillStyle='#8a8a98'; if(horiz){ ctx.fillRect(b.x0,b.y0+6,w,3); ctx.fillRect(b.x0,b.y1-9,w,3); } else { ctx.fillRect(b.x0+6,b.y0,3,h); ctx.fillRect(b.x1-9,b.y0,3,h); }
    ctx.restore(); return; }
  if(a>0.98) return;
  // the raised deck: the plank stands up on its hinge edge (seen edge-on beside a west or east hinge, face-on beside a
  // north or south one), held by the chain that runs to its lock
  const k=1-a, side=b.hinge==='w'||b.hinge==='e', hx=b.hinge==='w'?b.x0:b.hinge==='e'?b.x1:(b.x0+b.x1)/2, rise=(side?w:h)*0.55*k;
  ctx.save();
  if(side){ const x=hx-9, y0=b.y0-rise, H=h+rise; ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x+4,b.y0+6,22,h); ctx.fillStyle=SBC.outline; rrect(ctx,x-3,y0-3,24,H+6,5); ctx.fill(); ctx.fillStyle=D2BC.wood; rrect(ctx,x,y0,18,H,4); ctx.fill();
    ctx.fillStyle='rgba(255,230,190,.35)'; ctx.fillRect(x+3,y0+3,4,H-6); ctx.fillStyle='rgba(60,30,10,.45)'; for(let y=y0+14;y<y0+H;y+=16) ctx.fillRect(x,y,18,2); ctx.fillStyle='#8a8a98'; ctx.fillRect(x-1,y0+8,20,4); ctx.fillRect(x-1,y0+H-12,20,4);
    if(b.lk&&!b.down) d2bChain(hx,y0+8,b.lk.x,b.lk.y-18,t,1); }
  else { const y=b.hinge==='n'?b.y0:b.y1, x0=b.x0, W=w, y0=y-rise-10; ctx.fillStyle=SBC.outline; rrect(ctx,x0-3,y0-3,W+6,rise+16,5); ctx.fill(); ctx.fillStyle=D2BC.wood; rrect(ctx,x0,y0,W,rise+10,4); ctx.fill();
    ctx.fillStyle='rgba(60,30,10,.45)'; for(let x=x0+12;x<x0+W;x+=14) ctx.fillRect(x,y0,2,rise+10); ctx.fillStyle='#8a8a98'; ctx.fillRect(x0+6,y0,3,rise+10); ctx.fillRect(x0+W-9,y0,3,rise+10);
    if(b.lk&&!b.down) d2bChain((b.x0+b.x1)/2,y0+6,b.lk.x,b.lk.y-18,t,1); }
  ctx.restore();
}
function d2bDrawRuneBridge(b,t){ if(b.a<0.01&&!b.down) return; const drop=b.down?b.drop:0, off=(1-Math.max(0,drop))*-160, w=b.x1-b.x0, h=b.y1-b.y0;
  ctx.save(); if(drop<1){ ctx.globalAlpha=0.35+0.65*Math.max(0,drop); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse((b.x0+b.x1)/2,(b.y0+b.y1)/2,w*0.6*Math.max(0.2,drop),h*0.6,0,0,TAU); ctx.fill(); ctx.globalAlpha=1; }
  ctx.translate(0,off); ctx.fillStyle=SBC.outline; rrect(ctx,b.x0-3,b.y0-3,w+6,h+6,6); ctx.fill(); ctx.fillStyle='#8c8aa0'; rrect(ctx,b.x0,b.y0,w,h,5); ctx.fill(); ctx.fillStyle='#a8a6bc'; rrect(ctx,b.x0,b.y0,w,h*0.4,5); ctx.fill();
  ctx.strokeStyle='rgba(255,214,140,.55)'; ctx.lineWidth=2; for(let x=b.x0+20;x<b.x1;x+=40){ ctx.beginPath(); ctx.moveTo(x-6,b.y0+h/2); ctx.lineTo(x,b.y0+h/2-8); ctx.lineTo(x+6,b.y0+h/2); ctx.lineTo(x,b.y0+h/2+8); ctx.closePath(); ctx.stroke(); } ctx.restore(); }
// a falling icicle: its shadow first, then the spike drops
function d2bDrawIcicle(o,t){ const k=clamp(o.t/o.warn,0,1); if(o.t<o.warn){ ctx.fillStyle=`rgba(60,40,110,${0.15+0.35*k})`; ctx.beginPath(); ctx.ellipse(o.x,o.y,o.r*(0.5+0.5*k),o.r*0.5*(0.5+0.5*k),0,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(200,170,255,${0.3+0.5*k})`; ctx.lineWidth=2; ctx.stroke();
    if(k>0.55){ const z=(1-(k-0.55)/0.45)*220; d2bIcicleSpr(o.x,o.y-z); } }
  else { const s=1-clamp((o.t-o.warn)/0.5,0,1); ctx.fillStyle=`rgba(230,245,255,${0.85*s})`; for(let i=0;i<5;i++){ const a=i*1.3; ctx.beginPath(); ctx.moveTo(o.x+Math.cos(a)*6,o.y+Math.sin(a)*3); ctx.lineTo(o.x+Math.cos(a)*18,o.y+Math.sin(a)*8-4); ctx.lineTo(o.x+Math.cos(a+0.3)*8,o.y+Math.sin(a+0.3)*4); ctx.fill(); } } }
function d2bIcicleSpr(x,y){ const sp=d2bSpr('icl',22,52,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-9+dx,-50+dy); q.lineTo(9+dx,-50+dy); q.lineTo(1+dx,dy); q.lineTo(-1+dx,dy); q.closePath(); },D2BC.ice,{r:10}); g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(-5,-48,2,30); }); p3Put(sp,x,y); }
// a Shard-light beam along its cells
function d2bDrawBeam(o,t){ if(!o.cells.length){ return; } const A=AREA, a=tPos(o.cells[0]), b=tPos(o.cells[o.cells.length-1]), d=D2B_DIR[o.dir], cs=A.cave.cell;
  const x0=a.x-d[0]*cs*0.5, y0=a.y-d[1]*cs*0.5, x1=b.x+d[0]*cs*0.45, y1=b.y+d[1]*cs*0.45;
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; const f=0.85+0.15*Math.sin(t*13);
  for(const [w,al] of [[30,0.1],[16,0.25],[6,0.85]]){ ctx.strokeStyle=`rgba(${w<8?'250,235,255':'190,130,255'},${al*f})`; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(x0,y0-14); ctx.lineTo(x1,y1-14); ctx.stroke(); }
  for(let i=0;i<3;i++){ const u=((t*0.9+i/3)%1), px=lerp(x0,x1,u), py=lerp(y0,y1,u)-14; glowAt(px,py,12,'230,200,255',0.5); }
  glowAt(x1,y1-14,22,'210,170,255',0.5); ctx.restore(); }
// the echo ring in the Echo Room
function d2bDrawEcho(e,t){ const k=e.t/e.dur, r=60+520*Math.min(1,e.t/0.5); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,236,190,${0.6*(1-k)})`; ctx.lineWidth=5; ctx.beginPath(); ctx.ellipse(e.x,e.y,r,r*0.75,0,0,TAU); ctx.stroke(); ctx.restore(); }

// ---------- 21. hooking our art into the drawing passes
// the cave canvas: heights, faces, theme details (horn carvings, violet ice veins, chains), the open sky on the Wind Gate
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){
    base.apply(this,arguments); if(!D2B_ROOTS[d2bRootOf(def)]) return;
    try{ d2bPaint(A,def); }catch(err){ console.error(err); } }; }
function d2bPaint(A,def){
  const c=A.cave, cs=c.cell, g=A.canvas.getContext('2d'), st=CAVE_STYLE[def.theme]||CAVE_STYLE.earth, rng=mulberry32(def.seed*7+3), dread=def.theme==='f_dread';
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
  const solid=(i,j)=>i<0||j<0||i>=c.w||j>=c.h||(c.grid[j*c.w+i]===1&&c.typ[j*c.w+i]!==1);
  // the open sky beyond the ledges of the Wind Gate (and the void in the Chimney): cloud far below, not black
  // (inside the mountain a chasm is a deep dark drop, never the sky: the stock chasm look is the open sky)
  for(const id in c.rooms){ const R=c.rooms[id], look=R.voidLook||'deep';
    for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i; if(c.grid[k]!==0||(c.typ[k]!==TY.chasm&&(look==='deep'||c.typ[k]!==TY.pit))) continue; const x=i*cs, y=j*cs;
      if(look==='deep'){ const up=c.typ[k-c.w]!==TY.chasm||c.grid[k-c.w]!==0, gr=g.createLinearGradient(0,y,0,y+cs); gr.addColorStop(0,up?(dread?'#2a2240':'#3a2418'):(dread?'#0e0b1a':'#120a07')); gr.addColorStop(1,dread?'#0a0814':'#0e0806'); g.fillStyle=gr; g.fillRect(x,y,cs,cs);
        if(rng()<0.22){ g.fillStyle=dread?'rgba(190,160,255,.22)':'rgba(120,210,255,.2)'; g.beginPath(); g.arc(x+rng()*cs,y+rng()*cs,1.2+rng()*1.6,0,TAU); g.fill(); }
        if(up){ g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(x,y,cs,6); } continue; }
      if(look==='sky'){ const gr=g.createLinearGradient(0,y,0,y+cs); gr.addColorStop(0,'#8e9ec8'); gr.addColorStop(1,'#a8b6d8'); g.fillStyle=gr; g.fillRect(x,y,cs,cs); g.fillStyle='rgba(255,255,255,.55)'; if(rng()<0.5){ g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,10+rng()*14,5+rng()*4,0,0,TAU); g.fill(); } }
      else { g.fillStyle='#0c0a16'; g.fillRect(x,y,cs,cs); if(rng()<0.25){ g.fillStyle='rgba(180,160,230,.18)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,8+rng()*10,3,0,0,TAU); g.fill(); } } }
    // the rim of every ledge: snow lip
    if(R.voidLook) for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i; if(c.grid[k]!==0||c.typ[k]===TY.chasm) continue; const x=i*cs, y=j*cs, below=(j+1)*c.w+i;
      if(c.typ[below]===TY.chasm){ g.fillStyle='#4a4060'; g.fillRect(x,y+cs-8,cs,10); g.fillStyle='#f2f6ff'; g.beginPath(); g.ellipse(x+cs/2,y+cs-8,cs*0.6,6,0,0,TAU); g.fill(); } } }
  // our heights: each level a shade lighter, a cliff face under every higher edge, a lip on top
  if(c.d2bAnyH){ for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){ const k=j*c.w+i; if(c.grid[k]!==0) continue; const h=c.d2bH[k]; if(h>0){ g.fillStyle=`rgba(255,250,235,${0.09*h})`; g.fillRect(i*cs,j*cs,cs,cs); { const up=k-c.w, hu=c.d2bH[up]>0?c.d2bH[up]:0; if(c.grid[up]===0&&hu<h){ g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(i*cs,j*cs-6,cs,6); g.fillStyle=`rgba(${hexRGB(st.edge).join(',')},.9)`; g.fillRect(i*cs,j*cs,cs,3); } } if(c.d2bS[k]){ g.fillStyle='rgba(255,236,190,.22)'; g.fillRect(i*cs+4,j*cs+cs-10,cs-8,4); } } }
    for(let j=1;j<c.h;j++) for(let i=0;i<c.w;i++){ const k=j*c.w+i, up=k-c.w; if(c.grid[k]!==0||c.grid[up]!==0) continue; const hu=c.d2bH[up]>0?c.d2bH[up]:dunHq(c,up)===1?1:0, hk=c.d2bH[k]>0?c.d2bH[k]:0; if(hu<=hk||c.d2bH[up]<=0) continue;
      const x=i*cs, y=j*cs, fh=cs*(0.32+0.18*(hu-hk)); const gr=g.createLinearGradient(0,y,0,y+fh); gr.addColorStop(0,r2c(st.face,0.15)); gr.addColorStop(1,r2c(st.face,-0.55)); g.fillStyle=gr; g.fillRect(x,y,cs,fh);
      g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x,y+fh*0.5,cs,1.5); if(c.d2bS[up]){ g.fillStyle='rgba(255,236,190,.4)'; for(let n=0;n<3;n++) g.fillRect(x+6+n*14,y+fh*0.25,8,3); }
      g.fillStyle=`rgba(${hexRGB(st.edge).join(',')},.85)`; g.fillRect(x,y-1,cs,3); const sg=g.createLinearGradient(0,y+fh,0,y+fh+12); sg.addColorStop(0,'rgba(0,0,0,.4)'); sg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sg; g.fillRect(x,y+fh,cs,12); }
    for(let j=0;j<c.h;j++) for(let i=1;i<c.w-1;i++){ const k=j*c.w+i; if(c.grid[k]!==0) continue; const h=c.d2bH[k]>0?c.d2bH[k]:0; for(const [q,dx] of [[k-1,0],[k+1,cs-3]]){ const hq=c.d2bH[q]>0?c.d2bH[q]:0; if(c.grid[q]===0&&hq<h){ g.fillStyle=`rgba(${hexRGB(st.edge).join(',')},.6)`; g.fillRect(i*cs+dx,j*cs,3,cs); } } } }
  // wall details: ram horn carvings on Stonehorn faces, violet ice veins and frost chains in the Heart of Dread
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){ if(!solid(i,j)||solid(i,j+1)) continue; if((i*7+j*13)%5) continue; const x=i*cs, y=j*cs;
    if(dread){ g.strokeStyle='rgba(200,160,255,.55)'; g.lineWidth=2.4; g.beginPath(); g.moveTo(x+rng()*cs,y+2); g.lineTo(x+cs*0.5+rng()*8,y+cs*0.4); g.lineTo(x+rng()*cs,y+cs*0.8); g.stroke(); g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1; g.stroke();
      if(rng()<0.45){ g.strokeStyle='#5a3e9a'; g.lineWidth=4; g.setLineDash([5,4]); g.beginPath(); g.moveTo(x-cs*0.6,y+cs*0.3); g.quadraticCurveTo(x+cs*0.5,y+cs*0.95,x+cs*1.6,y+cs*0.3); g.stroke(); g.setLineDash([]); } }
    else { g.strokeStyle='rgba(255,236,200,.55)'; g.lineWidth=3; for(const s of [-1,1]){ g.beginPath(); g.arc(x+cs/2+s*9,y+cs*0.78,6,s<0?-0.4:Math.PI-2.4,s<0?2.4:Math.PI+0.4); g.stroke(); } g.fillStyle='rgba(60,30,20,.55)'; g.beginPath(); g.ellipse(x+cs/2,y+cs*0.8,4,5,0,0,TAU); g.fill(); } }
  // the Horned Gate: the skull's teeth along the way out
  for(const id in c.rooms){ const R=c.rooms[id]; if(!R.teeth) continue; const y=(R.oy+R.ih+1)*cs; for(let i=R.ox+1;i<=R.ox+R.iw;i++){ if(i>=R.ox+7&&i<=R.ox+9) continue; const x=i*cs; g.fillStyle=SBC.outline; g.beginPath(); g.moveTo(x+4,y); g.lineTo(x+cs/2,y-30); g.lineTo(x+cs-4,y); g.fill(); g.fillStyle=D2BC.bone; g.beginPath(); g.moveTo(x+7,y); g.lineTo(x+cs/2,y-25); g.lineTo(x+cs-7,y); g.fill(); } }
  // rails sleepers look older in the mines
  g.restore();
}
// the live floor: bridges, beams, icicle shadows, echo rings, flat statics, Ash frozen in Shard-light
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(!A||!A.d2b) return; try{ d2bFloor(A,t); }catch(err){ console.error(err); } }; }
function d2bFloor(A,t){
  const ST=A.d2b;
  for(const o of ST.stat) if(o.flat&&inView(o.x,o.y,80)) d2bDrawFlat(o,t);
  for(const b of ST.bridges) if(inView((b.x0+b.x1)/2,(b.y0+b.y1)/2,300)) d2bDrawBridge(b,t,false);
  for(const b of ST.runeBr) if(b.down&&b.drop>=1) d2bDrawRuneBridge(b,t);
  for(const o of ST.beams) if(o.lit) d2bDrawBeam(o,t);
  for(const e of ST.ech||[]) d2bDrawEcho(e,t);
  for(const F of ST.fall) for(const o of F.list) if(o.t<o.warn) { ctx.fillStyle=`rgba(60,40,110,${0.15+0.35*clamp(o.t/o.warn,0,1)})`; ctx.beginPath(); ctx.ellipse(o.x,o.y,o.r,o.r*0.5,0,0,TAU); ctx.fill(); }
  for(const o of ST.lifts) if(!o.st) d2bDrawLift(o,t);
}
{ const base=eventsForRender; eventsForRender=function(list){ base.apply(this,arguments); const A=AREA; if(!A||!A.d2b) return; try{ d2bTall(A,list); }catch(err){ console.error(err); } }; }
function d2bTall(A,list){
  const ST=A.d2b, t=G.time;
  for(const o of ST.stat){ if(o.flat||!inView(o.x,o.y,160)) continue; if(!o.it) o.it={x:o.x,y:o.wall?o.y-8:o.y,draw:()=>d2bDrawStat(o,G.time)}; list.push(o.it); }
  for(const o of ST.lamps) if(inView(o.x,o.y,120)){ if(!o.it) o.it={x:o.x,y:o.y,draw:()=>d2bDrawLamp(o,G.time)}; list.push(o.it); }
  for(const o of ST.eyes) if(inView(o.x,o.y,120)){ if(!o.it) o.it={x:o.x,y:o.y-30,draw:()=>d2bDrawEye(o,G.time)}; list.push(o.it); }
  for(const o of ST.beams) if(inView(o.x,o.y,120)){ if(!o.it) o.it={x:o.x,y:o.y-30,draw:()=>d2bDrawBeamSrc(o,G.time)}; list.push(o.it); }
  for(const o of ST.founts) if(inView(o.x,o.y,100)){ if(!o.it) o.it={x:o.x,y:o.y,draw:()=>d2bDrawFount(o,G.time)}; list.push(o.it); }
  for(const o of A.objs){ if(o.k==='d2b_carve'&&inView(o.x,o.y,100)){ if(!o.it) o.it={x:o.x,y:o.y,draw:()=>d2bDrawCarve(o,G.time)}; list.push(o.it); } }
  if(ST.summit&&inView(ST.summit.x,ST.summit.y,260)){ const o=ST.summit; if(!o.it) o.it={x:o.x,y:o.y-40,draw:()=>d2bDrawSummit(o,G.time)}; list.push(o.it); }
  for(const b of ST.bridges) if(b.a<0.98&&inView((b.x0+b.x1)/2,(b.y0+b.y1)/2,300)){ if(!b.it) b.it={x:b.x0,y:b.y0,draw:()=>d2bDrawBridge(b,G.time,true)}; b.it.y=b.hinge==='s'?b.y1:b.y0+8; list.push(b.it); }
  for(const b of ST.runeBr) if(b.down&&b.drop<1){ if(!b.it) b.it={x:b.x0,y:b.y1,draw:()=>d2bDrawRuneBridge(b,G.time)}; list.push(b.it); }
  for(const o of ST.lifts) if(o.st){ if(!o.it) o.it={x:o.x,y:o.y+1,draw:()=>d2bDrawLift(o,G.time)}; list.push(o.it); }
  for(const F of ST.fall) for(const o of F.list) if(o.t<o.warn&&o.t/o.warn>0.55){ list.push({x:o.x,y:o.y+2,draw:()=>d2bDrawIcicle(o,G.time)}); } else if(o.t>=o.warn) list.push({x:o.x,y:o.y,draw:()=>d2bDrawIcicle(o,G.time)});
  if(ST.lamb&&inView(ST.lamb.x,ST.lamb.y,80)){ const o=ST.lamb; if(!o.it) o.it={x:o.x,y:o.y,draw:()=>d2bDrawLamb(o,G.time)}; list.push(o.it); }
  if(D2B.frz){ const p=player; list.push({x:p.x,y:p.y+2,draw:()=>{ const sp=d2bSpr('frz',46,70,g=>p3IceBlockArt(g,42,10,58,{vio:true,noSnow:true})); ctx.globalAlpha=0.7; p3Put(sp,p.x,p.y+10); ctx.globalAlpha=1; }}); }
}
// pickups and small things drawn flat
FL.d2b_bless=(o,t)=>{ if(G.found[o.id]) return; const b=Math.sin(t*2.4)*3; ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y-16+b,26,'255,230,160',0.55); ctx.restore(); ctx.fillStyle='#fff4d8'; ctx.beginPath(); ctx.arc(o.x,o.y-16+b,7,0,TAU); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=2; ctx.stroke(); };
FL.d2b_star=(o,t)=>{ if(G.found[o.id]||!d2bStarWanted()) return; const b=Math.sin(t*2)*2; ctx.save(); ctx.translate(o.x,o.y-12+b); ctx.fillStyle=SBC.outline; sbStar(ctx,5,11,5,-Math.PI/2,0,0); ctx.fill(); ctx.fillStyle='#d8eeff'; sbStar(ctx,5,9,4,-Math.PI/2,0,0); ctx.fill(); ctx.restore(); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y-12,22,'170,220,255',0.45); ctx.restore(); };
for(const k of ['d2b_eye','d2b_lamp','d2b_lift','d2b_fount','d2b_carve','d2b_summit','d2b_beam','d2b_lamb']) FL[k]=()=>{};
// blocks: clear ice ones, and heavy ram-carved stones in the Drumhall
{ const base=drawFurnX; drawFurnX=function(o,t){
    if(o&&o.k==='block'&&(o.d2bIce||o.d2bHeavy)&&AREA&&AREA.d2b){ if(o.sunk||o.ci<0) return true;
      const sp=o.d2bIce?d2bSpr('iblk',48,56,g=>p3IceBlockArt(g,44,10,40)):d2bSpr('hblk',48,58,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-21+dx,-50+dy,42,46); },'#a07a60',{r:22}); celFill(g,(q,dx,dy)=>{ q.rect(-21+dx,-50+dy,42,12); },'#c89c7c',{r:22}); g.strokeStyle=D2BC.horn; g.lineWidth=3.4; for(const s of [-1,1]){ g.beginPath(); g.arc(s*9,-26,6,s<0?-0.4:Math.PI-2.4,s<0?2.4:Math.PI+0.4); g.stroke(); } g.fillStyle='#5a3424'; g.beginPath(); g.ellipse(0,-24,4,5,0,0,TAU); g.fill(); });
      p3Sh(o.x,o.y+18,22,6,0.3); p3Put(sp,o.x,o.y+24); if(o.d2bHeat>0) p3HeatOverlay(o.x,o.y+24,44,40,clamp(o.d2bHeat,0,1),t); return true; }
    return base(o,t); }; }

// ---------- 22. Stonehorn Deep (f_deep): the halls of the Stonehorns, going DOWN. Signature: Pound Through.
//  F1 the Horn Halls        B1 the Bone Mines        B2 the Drumhall
//   c b d                    h i j                    [B  B] z
//   . a e                    g f .                    [B  B] m
//                                                      k  l  n
// b's stairs (behind a grate: the small key from c) go down to f; the crack in h drops to k; the pillar lift in n goes
// up to f; the crack in c (once Ash can pound) drops onto the ledge in h with a treasure.
const D2B_DEEP={
 a:{tpl:['##...........##','#.............#','...............','...............','...............','...............','...............','...............','#.............#','#.s...........#','##...........##'],
    dz:['...............','...............','...H.......H...','...............','...............','...............','...............','...............','...H.......H...','...............','...............']},
 e:{tpl:['###.........###','##...........##','#.............#','...............','...............','...............','...............','#.............#','##...........##','###.........###','####.......####'],
    dz:['...............','....b.....b....','..b......m.....','...............','......q........','..........q..f.','.....q.........','..b.........b..','....b...b......','...............','...............']},
 b:{tpl:['#####..>..#####','#####.....#####','...............','...............','...............','...............','...............','...............','...............','...............','...............'],
    dz:['...............','.....GGGGG.....','...............','..H.........H..','...............','...............','...............','...............','..H.........H..','...............','...............']},
 c:{tpl:['...............','.......s.......','.A--------+--..','..........|....','..........|....','........ootoo..','........ootoo..','..........|....','...P-------....','.X.............','...............'],
    frost:['............xx.','............xx.','......i........','...............','...............','...............','...............','...............','...............','...............','...............'],
    dz:['...............','...............','...............','...............','...............','...............','...............','...............','......Q........','...............','...............']},
 d:{tpl:['...:::::::::...','...:::::::::...','...:::::::::...','...::&:::&::@..','...:::::::::...','...............','...:::::::::...','...:::::::::...','...:::::::::.X.','...:::::::::...','...:::::::::...'],
    dz:['...............','.b.............','...............','...............','...............','.....J...J.....','...............','.b.............','...............','...............','.............b.']},
 f:{tpl:['...........#...','...........U.X.','...........#...','...........####','R..............','R......C.......','R..............','...............','...............','...........<...','...............'],
    dz:['...............','...g...........','...............','...............','...............','...............','...............','.............T.','........g......','..g............','...............']},
 g:{tpl:['...............','...............','...............','...............','...............','.......D.......','...............','...............','...............','...............','...............'],
    dz:['...............','...............','...............','...H.......H...','...............','...............','...............','...............','...H.......H...','...............','...............']},
 h:{tpl:['......#...._===','......#...._==X','......#....____','....s.#.....###','###.###........','...............','...............','............###','...............','...............','...............'],
    frost:['...............','.xxx...........','.xxx...........','...............','...y........z..','............z..','............z..','.......P.......','...............','...............','...............'],
    dz:['...............','...............','...............','...............','...............','...............','...............','...............','...............','..b............','...............']},
 i:{tpl:['...............','...ooooooooo...','...o.oo.oo.o...','...ooooooooo...','...ooooooooo...','...o.oo.oo.o...','...ooooooooo...','...ooooooooo...','...o.oo.oo.o...','...ooooooooo...','.s.............'],
    frost:['...............','...............','....L..l..L....','...............','...............','....l..l..l....','...............','...............','....L..l..L....','...............','...............']},
 k:{tpl:['...............','...............','....#######....','....#...BP#....','....#BP.#.#....','....#..B.P#....','....#BP#..#....','....#.....#....','....#######....','.sS............','...............'],
    frost:['.......D.......','...............','...............','...............','...............','.D..........D..','...............','...............','...............','...............','.......D.......']},
 l:{tpl:['ooooooooooooooo','o.............o','o.ooooooooooo.o','o...o.o.....o.o','.oo.o.o.ooo.o..','..o.o.o.o...o..','..o.o.o.o.ooo..','o.o...o.o.....o','o.ooooo.ooooo.o','o.......o.....o','ooooooooooooooo']},
 n:{tpl:['...............','...............','...............','...............','...............','...............','...............','...............','...............','.s.............','...............'],
    hz:['111111111111111','111111111111111','111111111111111','...............','...............','...............','...............','...............','...............','...............','...............'],
    frost:['...............','...............','...............','...............','.......k.......','...............','.......S.......','...............','...............','...............','...............'],
    dz:['...............','...H.......H...','...............','...............','...............','...............','...............','...............','............L..','...............','...............']},
 m:{tpl:['...............','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............'],
    dz:['...............','...............','..H.........H..','...............','...............','...............','...............','...............','..H.........H..','...............','...............']},
 z:{tpl:['##...........##','#.............#','...............','.......u.......','...............','...............','...............','.....X...W.....','...............','#.............#','##...........##'],
    dz:['...............','...............','...............','...............','...............','...............','...............','...............','...x...........','...............','...............']}
};
{ const T=D2B_DEEP, dillo=F2_TPL.dillo.slice(); dillo[5]=dillo[5].slice(0,12)+'X'+dillo[5].slice(13);
defineDungeon('f_deep',{name:S('Stonehorn Deep','Stonehorn Deep'),level:16,theme:'f_stone',seed:3103,save:'f_deep',dark:0.5,
  dunKind:S('A dungeon','A dungeon'),abil:'pound',abilName:S('Ground Pound','Ground Pound'),
  story:typeof f2sDunStory==='function'?f2sDunStory('f_deep'):undefined,
  floors:[
    {id:'1',name:S('The Horn Halls','The Horn Halls'),map:{rooms:{
      a:{at:[1,1],kind:'start',tpl:T.a.tpl,dz:T.a.dz,snore:true,teeth:true,noDecor:true,
         sign:S('STONEHORN DEEP. Knock loudly. The Stonehorns are a bit deaf.','STONEHORN DEEP. Knock loudly!')},
      e:{at:[2,1],kind:'secret',tpl:T.e.tpl,dz:T.e.dz,loot:['treat'],coinN:30,noPots:true},
      b:{at:[1,0],kind:'fight',tpl:T.b.tpl,dz:T.b.dz,foes:[['f_frostshell',3]],foeAt:[[4,5],[10,5],[7,7]],noDecor:true,
         tip:[S('Frostshell beetles','Frostshell beetles'),S('Their ice shells stop blades from the front. Hit them from behind, flip them with the hammer, or melt the shell with blue fire.','Hit them from behind, or melt the shell!')]},
      c:{at:[0,0],kind:'plates',tpl:T.c.tpl,frost:T.c.frost,dz:T.c.dz,railPlates:true,cartDir:'e',points:{'10,2':0},reward:'key',noPots:true,
         sign:S('THE CART RUN. Mind the cart. Mind the ice. Mind the switch.','Ride the cart. Mind the ice!'),
         tip:[S('The Cart Run','The Cart Run'),S('Ride the cart to the plate at the end of the line. Melt the ice on the rails and set the switch first.','Ride the cart to the plate!')]},
      d:{at:[2,0],kind:'free',tpl:T.d.tpl,dz:T.d.dz,loot:['dmap'],foes:[['f_stalagbat',2]],foeAt:[[1,1],[13,1]],ribs:true,noDecor:true,
         tip:[S('The Bone Bridge','The Bone Bridge'),S('Bars of bone block the bridge. A Shadow Dash slips through. Or swing around them with the Grapple Tail.','Dash through the bars, or grapple around!')]}},
      links:[['a','b','open'],['a','e','crack'],['b','c','open'],['b','d','open']]}},
    {id:'b1',name:S('The Bone Mines','The Bone Mines'),map:{rooms:{
      f:{at:[1,1],kind:'crystal',tpl:T.f.tpl,dz:T.f.dz,loot:['compass'],foes:[['f_snowgob',2],['f_stalagbat',2]],foeAt:[[6,8],[9,3],[3,7],[9,7]]},
      g:{at:[0,1],kind:'shrine',tpl:T.g.tpl,dz:T.g.dz,noPots:true,noDecor:true,shrineDrum:true},
      h:{at:[0,0],kind:'free',tpl:T.h.tpl,frost:T.h.frost,dz:T.h.dz,loot:['treasure+treat'],foes:[['f_frostshell',1]],foeAt:[[9,9]],dropRoom:'k',noPots:true,
         sign:S('GOING DOWN? KNOCK.','GOING DOWN? KNOCK.'),nearBeat:{at:[2,2],key:'f_deep_crack',r:3.2},
         tip:[S('Ground Pound!','Ground Pound!'),S('Pound beside a beetle to flip it. Pound the round switch to swap the pillars. Pound cracked floor to break through.','Pound the beetle, the switch, the cracks!')]},
      i:{at:[1,0],kind:'lightsout',lightsPitch:3,lightsTile:1,tpl:T.i.tpl,frost:T.i.frost,foes:[['f_snowgob',1]],foeAt:[[13,2]],noPots:true,noDecor:true,
         sign:S('THE RAM PENS. Pound a pen and it flips, and the pens beside it flip too. Raise all nine.','Pound a pen. Its neighbors flip too. Raise all nine!')},
      j:Object.assign({at:[2,0]},F2_ROOM.f_rockjaw,{tpl:dillo,loot:['bkey'],sealChest:true,sealText:S('The chest is held shut by Rockjaw’s tail. Beat him first.','Beat Rockjaw first.')})},
      links:[['f','g','open'],['g','h','pound',{from:'g'}],['h','i','open'],['i','j','gate:i'],['f','i','pound',{from:'i',plate:1}]]}},
    {id:'b2',name:S('The Drumhall','The Drumhall'),map:{rooms:{
      B:Object.assign({at:[0,0]},F2_ROOM.f_grumblehorn),
      z:{at:[2,0],kind:'reward',tpl:T.z.tpl,dz:T.z.dz,loot:['heart'],noPots:true,noDecor:true},
      m:{at:[2,1],kind:'fight',tpl:T.m.tpl,dz:T.m.dz,foes:[['f_rimeknight',2],['f_frostshell',2]],foeAt:[[4,4],[10,4],[5,7],[9,7]],solveOnClear:true,noDecor:true,
         tip:[S('Armor!','Armor!'),S('A Ground Pound beside a Rime Knight cracks his ice shield for a few seconds.','Pound near a knight to crack his shield!')]},
      k:{at:[0,2],kind:'drum',tpl:T.k.tpl,frost:T.k.frost,heavyBlocks:true,ringAll:true,foes:[['f_frostshell',2]],foeAt:[[2,7],[12,2]],noPots:true,noDecor:true,
         sign:S('THE DRUMHALL. Every drum pushes every stone away from it. Find the right order. (The rune stone puts the stones back.)','Every drum pushes the stones away. Find the order!')},
      l:{at:[1,2],kind:'d2breach',tpl:T.l.tpl,dark:true,echo:true,reachAt:[13,5],foes:[['f_stalagbat',2]],foeAt:[[7,1],[7,9]],noPots:true,noDecor:true,sayIn:'f_deep_echo'},
      n:{at:[2,2],kind:'free',tpl:T.n.tpl,hz:T.n.hz,frost:T.n.frost,dz:T.n.dz,noPots:true,noDecor:true,
         seesaws:{'7,6':{dir:'n',len:3,toA:[7,1]}},icicles:{'7,4':{blaze:'drop',regrow:5}},lift:{to:'f_deep_b1',room:'f',at:[13,7]},
         sign:S('THE PILLAR LIFT. Knock and it goes up. (The throne is up the ledge. Stand on the seesaw and drop the icicle on the other end.)','Knock the lift to go up. Seesaw to the ledge!')}},
      links:[['k','l','gate:k'],['l','n','gate:l'],['n','m','open'],['m','B','boss'],['B','z','gate:B']]}}
  ]});
}

// ---------- 23. The Heart of Dread (f_dread): inside Mount Dread, going UP. Every power. Signature: Moth-frost (chain
// locks, Shard Eyes that refreeze, the Shard Blizzard on the outer ledges). No Boss Key: the Last Chain holds the summit.
//  F1 the Dreadgate Halls   F2 the Chain Galleries   F3 the Frozen Throat   F4 the Crown Stair
//   c b d                    g f [e                   j k l                  n p
//   . a .                    h . [e                   i o .                  m .
// d's stairs (behind a grate: the small key from c) go up to e; h's stairs (after Grumbo) to i; l's to m; the summit
// door in n opens onto the Crown (f2wSpot('crowndoor')), where Glaciar waits.
const D2B_DREAD={
 a:{tpl:['##...........##','#.............#','...............','...............','...............','...............','...............','...............','#.............#','#.............#','##...........##'],
    dz:['...........M...','...............','...D.......D...','...............','...............','...............','...............','..F............','...............','...............','...............']},
 b:{tpl:['.........:::...','.........:::...','.........:::...','.........:::...','.........:::...','.........:::...','.........:::...','.........:::...','.........:::...','.........:::...','.........:::...'],
    frost:['...............','...............','.....r.K.......','...............','...............','...............','...............','...............','.............K.','...............','.............r.'],
    dz:['.............E.','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............']},
 c:{tpl:['##...........##','#.............#','...............','...............','...............','...............','...............','...............','............X..','#.............#','##...........##'],
    dz:['...............','...............','..S.....S..S...','...............','...............','..S..S.....S...','...............','...............','.....S..S......','...............','...............']},
 d:{tpl:['...............','...............','...............','............###','...............','.............<.','...............','............###','...............','...............','...............'],
    dz:['....l..........','...............','...............','...............','............G..','..........N.G..','............G..','...............','...............','...............','....l..........']},
 e:{tpl:[':::::::::::::::',':::::::::::::::','....:::::::::::','....:::::::::::','....:::::::::::','....:::::::::::','....:::::::::::',':::::::::::::::',':::::::::::::::','....:::::::::::','....:::::::::::','....:::::::::::',':::::::::::::::',':::::::::::...#',':::::::::::....',':::::::::::.X.#',':::::::::::::::',':::::::::::::::','...............','...............','...............','.......>.......','...............'],
    frost:['...............','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............','..............F','...............','...............','...............','...............','...............','...............','...............','...............']},
 f:{tpl:['...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::.@.:::...','...:::...:::...','...:::...:::...'],
    hz:['...............','...............','...............','...............','...............','...............','...............','...............','......111......','......111......','......111......'],
    frost:['r..............','.K.............','...............','...............','...............','...............','...............','...............','.............K.','...............','......r.K......'],
    dz:['...............','...............','...............','III............','...............','...............','...............','...............','...............','...............','...............']},
 g:{tpl:[':::::::::::::::',':::::::::::::::',':::::::.....:::',':::::::.:::.:::',':::::::.:::.:::',':::::::.:::....',':::::::.:::::::',':::.....:::::::',':::.:::::::::::',':::.....:::::::',':::::::.:::::::'],
    frost:['...............','...............','.........in....','...........i...','...............','.......i....in.','...............','.....i.n.......','...............','....ni.........','...............'],
    dz:['.........E.....','...............','...............','...............','...............','...............','...............','...............','...............','...............','...........E...']},
 i:{tpl:['IIIIII...IIIIII','...IIIIIIIIIIII','IIIIIIIIIIIIIII','IIII^IIIIIIIIII','IIII^IIIIIII...','IIIIIIIIII^IIII','IIIIIIIIII^IIII','...IIIIIII^IIII','.IIIIIIIIIII...','.IIIIIIIIIII.>.','.IIIIIIIIIII...'],
    hz:['333333333333333','ccc333333333333','222222222222222','222222222222222','222222222222bbb','111111111111111','111111111111111','aaa111111111111','...............','...............','...............']},
 j:{tpl:['##...........##','#.............#','...............','...............','.......X.......','...............','...............','...............','...............','#.............#','##...........##'],
    dz:['...............','...............','...D.......D...','.......h.......','...............','...............','...............','...............','...D.......D...','...............','...............']},
 k:{tpl:['##.:::...:::.##','#..:::...:::..#','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','...:::...:::...','#..:::...:::..#','##.:::...:::.##'],
    frost:['...............','...............','...............','...............','...............','...............','...............','...............','.......r.......','...............','...............']},
 o:{tpl:['####.......####','###.........###','##...........##','#.............#','#.............#','#.............#','#.............#','##...........##','###.........###','####.......####','###############'],
    dz:['...............','...............','...............','....q.....q....','.......v.......','.......n.......','....t......q...','...............','...............','...............','...............']},
 l:{tpl:['####.###.##.###','####.###.##.###','##.B.###.##.###','##...###.##.###','............#..','............B<.','.S..........#..','####.###.##.###','####.###.##.###','####.###.##.###','####.###.##.###'],
    dz:['....B...B..B...','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............']},
 m:{tpl:['##...........##','#.............#','...............','...............','...............','...............','...............','...............','...............','#..........>..#','##...........##'],
    dz:['...............','...............','...............','...............','..F.........c..','...............','...............','...............','...............','...............','...............']},
 n:{tpl:['{{{{...........','{{{{...........','{{{{...........','{{{{...........','...............','...............','...............','...............','...............','...............','...............'],
    frost:['r............K.','..K...........r','...............','...............','...............','...............','...............','....K..........','...............','...............','...............'],
    dz:['.......Y...i...','...........i...','............III','...............','...............','...............','...............','...............','...............','...............','...............']},
 p:{tpl:['....:::::::::::','....:::::::::::','##::::::::::...','##::::::::::...','....::::::::...','....::::::::...','....::::::::...','....::::::::...','....::::::::...','....::::::::...','....::::::::.X.'],
    frost:['...............','K..............','...............','...............','...............','...............','...............','...............','...............','...............','...............'],
    dz:['w..............','...............','...............','...............','...............','...............','...............','...............','...............','...............','...............']}
};
{ const T=D2B_DREAD, den=F2_TPL.den.slice(); den[8]=den[8].slice(0,12)+'<'+den[8].slice(13);
defineDungeon('f_dread',{name:S('The Heart of Dread','The Heart of Dread'),level:17,theme:'f_dread',seed:3104,save:'f_dread',dark:0.55,
  dunKind:S('A dungeon','A dungeon'),
  story:typeof f2sDunStory==='function'?f2sDunStory('f_dread'):undefined,
  floors:[
    {id:'1',name:S('The Dreadgate Halls','The Dreadgate Halls'),map:{rooms:{
      a:{at:[1,1],kind:'start',tpl:T.a.tpl,dz:T.a.dz,noPots:true,noDecor:true},
      b:{at:[1,0],kind:'chains',tpl:T.b.tpl,frost:T.b.frost,dz:T.b.dz,foes:[['f_mothling',3]],noDecor:true,
         chainBridges:[{lock:[7,2],a:[9,4],b:[11,5],hinge:'w'}],eyes:{'13,0':{targets:[[13,8]]}},sayIn:'f_dread_bridge'},
      c:{at:[0,0],kind:'fight',tpl:T.c.tpl,dz:T.c.dz,foes:[['f_rimeknight',4]],foeAt:[[5,2,'sleep'],[8,5,'sleep'],[2,8,'sleep'],[11,8,'sleep']],solveOnClear:true,reward:'key',noPots:true,noDecor:true,sayIn:'f_dread_choir',solveBeat:'f_dread_choir_key',
         tip:[S('The Frozen Choir','The Frozen Choir'),S('Four of the singers are Rime Knights. Hold blue fire on one to melt his armor off. No need to hurt them.','Blue fire melts the knights’ armor!')]},
      d:{at:[2,0],kind:'d2bnest',tpl:T.d.tpl,dz:T.d.dz,dark:true,loot:['compass'],foes:[['f_mothling',6]],foeAt:[[9,4],[11,4],[9,6],[11,6],[10,3],[10,7]],up:'f_dread_2',noPots:true,noDecor:true,sayIn:'f_dread_nest'}},
      links:[['a','b','open'],['b','c','open'],['b','d','chain',{lock:[13,8]}]]}},
    {id:'2',name:S('The Chain Galleries','The Chain Galleries'),map:{rooms:{
      e:{at:[2,0],span:[1,2],kind:'free',tpl:T.e.tpl,frost:T.e.frost,loot:['dmap'],down:'f_dread',voidLook:'dark',noPots:true,noDecor:true,sayIn:'f_dread_chimney',
         gust:{dir:[-1,0],str:240,on:1.4,off:3.6,ph:0.5},
         ribbons:[{pts:[[2,19],[7,17],[12,14]],both:true},{pts:[[12,13],[7,12],[2,10]],both:true},{pts:[[1,9],[5,8],[5,5],[2,4]],both:true}],
         frozen:{'14,14':{name:S('a frozen hiker','a hiker'),look:{skin:'#e8bc98',hair:'#6a4a2a',hairdo:'short',outfit:'coat',shirt:'#3a7a5a',low:'#3a3a4a',hat:'beanie',hatc:'#e8a83a'},
           line:S('...BRRRR! I only came up for the view! Thank you, little dragon!','Brrr! Thank you, little dragon!'),coins:30,leave:false,after:S('I am going to sit right here until my toes come back.','I am waiting for my toes to thaw.')}}},
      f:{at:[1,0],kind:'chains',tpl:T.f.tpl,hz:T.f.hz,frost:T.f.frost,dz:T.f.dz,foes:[['f_shardling',2]],foeAt:[[13,1],[7,3]],noPots:true,noDecor:true,locks:{'13,8':{cover:'lid'}},
         chainBridges:[{lock:[13,8],a:[9,2],b:[11,2],hinge:'e'},{lock:[8,10],a:[3,6],b:[5,6],hinge:'e'},{lock:[1,1],a:[3,4],b:[5,4],hinge:'w'}],
         tip:[S('The Chain Bridges','The Chain Bridges'),S('Three bridges, three locks. Break the lid, zip up to the ledge with the Grapple Tail, slip through the bars.','Three locks. Lid, ledge, bars!')]},
      g:{at:[0,0],kind:'d2breach',reachAt:[7,9],tpl:T.g.tpl,frost:T.g.frost,dz:T.g.dz,eyes:{'9,0':{ph:0},'11,10':{ph:2}},noPots:true,noDecor:true,
         tip:[S('Shard Eyes!','Shard Eyes!'),S('While an eye is open, melted ice freezes again. Shoot both eyes shut with arrows, then melt the ice and walk through it fast. Ice you have walked through is slush and stays melted.','Shoot both eyes. Then melt the ice fast!')]},
      h:Object.assign({at:[0,1]},F2_ROOM.f_grumbo,{tpl:den,stairSeal:true,up:'f_dread_3'})},
      links:[['e','f','open'],['f','g','gate:f'],['g','h','open']]}},
    {id:'3',name:S('The Frozen Throat','The Frozen Throat'),map:{rooms:{
      i:{at:[0,1],kind:'free',tpl:T.i.tpl,hz:T.i.hz,down:'f_dread_2',noPots:true,noDecor:true,
         icefall:{kind:'pattern',per:2.2,warn:0.9,groups:[[[3,9],[8,6],[11,3]],[[7,9],[4,6],[7,3]],[[10,9],[12,6],[2,3],[6,0]]]},
         tip:[S('The Frozen Throat','The Frozen Throat'),S('Double Jump up the ledges marked in gold, at the ends of the slides. Jump the spikes. Watch for falling icicles.','Double Jump up the gold ledges!')]},
      j:{at:[0,0],kind:'treasure',tpl:T.j.tpl,dz:T.j.dz,loot:['heart'],eggChest:true,noPots:true,noDecor:true,sayIn:'f_dread_dragons'},
      k:{at:[1,0],kind:'d2breach',tpl:T.k.tpl,frost:T.k.frost,reachAt:[13,5],foes:[['f_shardling',2]],foeAt:[[7,2],[13,8]],noPots:true,noDecor:true,
         ribbons:[{pts:[[1,5],[4,3],[7,5]],both:true}],runeBridge:{plate:[7,8],a:[9,5],b:[11,5]},
         icefall:{kind:'clock',per:3,n:12,warn:1,rings:[1.6,3.2,4.8,6.2],r:30},
         tip:[S('The Clock of Icicles','The Clock of Icicles'),S('Icicles fall in a wave that goes round like a clock. Watch the shadows. Ride the wind, pound the rune plate for a bridge.','Watch the shadows! Ride the wind. Pound the plate.')]},
      o:{at:[1,1],kind:'secret',tpl:T.o.tpl,dz:T.o.dz,coinN:50,noPots:true,noDecor:true,sayIn:'f_dread_nursery'},
      l:{at:[2,0],kind:'free',tpl:T.l.tpl,dz:T.l.dz,iceBlocks:true,up:'f_dread_4',noPots:true,noDecor:true,
         beams:{'4,0':{dir:'s'},'8,0':{dir:'s',on:2.2,off:1.6},'11,0':{dir:'s'}},
         tip:[S('The Shardlight Gallery','The Shardlight Gallery'),S('Shard-light freezes you solid! Push an ice block into a beam to stop it, or Shadow Dash right through.','Block the light, or dash through it!')]}},
      links:[['i','j','open'],['j','k','open'],['k','l','gate:k'],['k','o','crack']]}},
    {id:'4',name:S('The Crown Stair','The Crown Stair'),map:{rooms:{
      m:{at:[0,1],kind:'free',tpl:T.m.tpl,dz:T.m.dz,down:'f_dread_3',noPots:true,noDecor:true,sayIn:'f_dread_stair'},
      n:{at:[0,0],kind:'chains',tpl:T.n.tpl,frost:T.n.frost,dz:T.n.dz,locks:{'4,7':{cover:'lid'}},noPots:true,noDecor:true,sayIn:'f_dread_lastchain',
         summit:{locks:[['n',4,7],['n',2,1],['n',13,0],['p',0,1]]},
         tip:[S('The Last Chain','The Last Chain'),S('Four locks hold the summit door: one under a lid, one up on the ledge, one behind bars, and one you can only see from outside.','Four locks. One is outside!')]},
      p:{at:[1,0],kind:'free',tpl:T.p.tpl,frost:T.p.frost,dz:T.p.dz,loot:['treasure+potion'],locks:{'0,1':{cover:'none'}},voidLook:'sky',blizzard:true,noPots:true,noDecor:true,
         gust:{dir:[1,0],str:300,on:1.4,off:2.6,ph:0},
         ribbons:[{pts:[[2,9],[7,10],[12,8]],both:true},{pts:[[13,3],[11,1],[7,0],[3,1]],both:true}],
         tip:[S('The Wind Gate','The Wind Gate'),S('Outside! When the blizzard blows, stay close to the wall. Ride the wind around to the window and melt the last lock.','Stay by the wall! Ride to the window.')]}},
      links:[['m','n','open'],['n','p','open']]}}
  ]});
}

// ---------- 24. small rules that close the loop
// the Heart Ember chest sleeps inside the egg until it cracks (not drawn before)
{ const base=DUN_DRAW.dchest; DUN_DRAW.dchest=function(q,t,v){ const A=AREA; if(A&&A.d2b&&q){ const R=A.rooms[q.room]; if(R&&R.eggChest&&A.d2b.eggs.some(e=>!e.egg)&&!G.found[q.id]) return; } return base.apply(this,arguments); }; }
// a room's line once it is solved (the soldier with the key in the Frozen Choir)
{ const base=solveRoom; solveRoom=function(R,quiet){ const was=R&&R.solved; base.apply(this,arguments); if(R&&!was&&R.solved&&R.solveBeat&&AREA&&AREA.d2b) d2bBeat(R.solveBeat,0.8); }; }
// a floor reached by the pillar lift says so
{ const base=dunGoFloor; dunGoFloor=function(aid,arrive){ const r=base.apply(this,arguments); if(D2B.liftArrive){ D2B.liftArrive=false; later(0.3,()=>setBanner(S('Up the pillar!','Up we go!'),S('Back in the Bone Mines. The lift only goes up.','Back in the Bone Mines.'),2.4)); } return r; }; }
// test input: hold fire (or tap jump/attack) from the debug hooks, like a real button
{ const base=updatePlayer; updatePlayer=function(dt,inp){ const I=D2B.press; if(I&&G&&player&&!player.dead){ inp=Object.assign({},inp||{},{fire:!!I.fire||!!(inp&&inp.fire),jump:!!I.jump||!!(inp&&inp.jump),jumpHeld:!!I.jump||!!I.jumpHeld||!!(inp&&inp.jumpHeld),attack:!!I.attack||!!(inp&&inp.attack)});
    if(I.mx!=null||I.my!=null){ inp.mx=I.mx||0; inp.my=I.my||0; } I.jump=false; I.attack=false; } return base(dt,inp); }; }

// ---------- 25. debug hooks (window.__eb.d2b) and the internals the solvability checker (scratchpad/e_d2b) drives
function d2bLightsSolve(A,room){
  const C=A.p3; if(!C) return null; const L=C.lights.filter(o=>o.room===room), n=L.length, pitch=(A.rooms[room].lightsPitch)||3;
  const nb=L.map(o=>L.map((q,j)=>(q===o||(Math.abs(q.c-o.c)===pitch&&q.r===o.r)||(Math.abs(q.r-o.r)===pitch&&q.c===o.c))?j:-1).filter(j=>j>=0));
  let best=null; for(let m=0;m<(1<<n);m++){ const up=L.map(o=>o.up); for(let i=0;i<n;i++) if(m>>i&1) for(const j of nb[i]) up[j]=!up[j]; if(up.every(Boolean)){ const pc=m.toString(2).split('1').length-1; if(!best||pc<best.n) best={m,n:pc}; } }
  return best?L.filter((o,i)=>best.m>>i&1).map(o=>o.id):null;
}
function d2bDrumSim(A,room,blocks,drum){ const c=A.cave, R=A.rooms[room], out=blocks.map(b=>[b[0],b[1]]), occ=new Set(out.map(b=>b[1]*c.w+b[0]));
  const order=out.map((b,i)=>i).sort((i,j)=>dist2(out[j][0],out[j][1],drum.ci,drum.cj)-dist2(out[i][0],out[i][1],drum.ci,drum.cj));
  for(const i of order){ const [bi,bj]=out[i], dx=bi-drum.ci, dy=bj-drum.cj; if(!dx&&!dy) continue; const di=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0, dj=di?0:Math.sign(dy), ni=bi+di, nj=bj+dj, k=nj*c.w+ni;
    const inRoom=ni>R.ox&&ni<=R.ox+R.iw&&nj>R.oy&&nj<=R.oy+R.ih; if(!inRoom||c.grid[k]!==0||occ.has(k)||c.typ[k]===1||(c.typ[k]>=3&&c.typ[k]!==TY.rune)) continue; if(A.objs.some(o=>(o.k==='resetstone'||o.k==='cchest'||o.k==='crystal'||o.p3==='drum')&&tCell(o.x,o.y)===k)) continue;
    occ.delete(bj*c.w+bi); occ.add(k); out[i]=[ni,nj]; }
  return out; }
function d2bDrumSolve(A,room){
  const drums=A.objs.filter(o=>o.p3==='drum'&&o.room===room).map(o=>{ const k=tCell(o.x,o.y), c=A.cave; return {id:o.id,ci:k%c.w,cj:(k-k%c.w)/c.w}; });
  const plates=A.objs.filter(o=>o.k==='plate'&&o.room===room).map(o=>o.cj*A.cave.w+o.ci).sort((a,b)=>a-b).join(',');
  const start=A.blocks.filter(b=>b.room===room&&!b.sunk).map(b=>[b.ci,b.cj]); const key=bs=>bs.map(b=>b[1]*A.cave.w+b[0]).sort((a,b)=>a-b).join(',');
  const seen=new Map([[key(start),[]]]), q=[start];
  while(q.length){ const s=q.shift(), path=seen.get(key(s)); if(key(s)===plates) return path; if(path.length>9) continue;
    for(const d of drums){ const t=d2bDrumSim(A,room,s,d), kt=key(t); if(!seen.has(kt)){ seen.set(kt,path.concat(d.id)); q.push(t); } } }
  return null; }
function d2bState2(){ const A=AREA, R=A&&A.rooms?caveRoomAt(player.x,player.y):null; return {area:A&&A.id,room:R&&R.id,x:Math.round(player.x),y:Math.round(player.y),z:+(player.z||0).toFixed(1),h:A&&A.cave?dunH(tCell(player.x,player.y)):null,
  keys:A&&A.keys?A.keys():0,stage:G.stage,abil:Object.keys(G.abil||{}).filter(k=>G.abil[k]),frz:!!D2B.frz,
  rooms:A&&A.rooms?Object.fromEntries(Object.entries(A.rooms).map(([k,q])=>[k,{solved:!!q.solved,kind:q.kind}])):null}; }
function d2bObjList(){ const A=AREA; if(!A||!A.d2b) return null; const ST=A.d2b; return {
  eyes:ST.eyes.map(o=>({id:o.id,room:o.room,open:!!o.open,shut:+o.shutT.toFixed(1),dead:!!o.dead,x:Math.round(o.x),y:Math.round(o.y)})),
  lamps:ST.lamps.map(o=>({id:o.id,nest:o.nest,lit:o.lit,ever:o.ever,x:Math.round(o.x),y:Math.round(o.y)})),
  bridges:ST.bridges.map(b=>({lock:b.lock,down:b.down})),runeBr:ST.runeBr.map(b=>({plate:b.plate,down:b.down})),
  beams:ST.beams.map(o=>({id:o.id,lit:o.lit,n:o.cells.length})),lifts:ST.lifts.map(o=>({id:o.id,x:Math.round(o.x),y:Math.round(o.y),st:o.st})),
  plates:ST.plates.map(o=>({id:o.id,x:Math.round(o.x),y:Math.round(o.y),open:!!o.gate.opened,room:o.room})),grates:ST.grates.map(o=>({id:o.id,open:!!o.opened})),
  summit:ST.summit?{open:ST.summit.open,locks:(ST.summit.locks||[]).map(id=>[id,d2bLockDone(id)])}:null,eggs:ST.eggs.map(o=>({id:o.id,egg:o.egg})),
  fall:ST.fall.map(F=>({room:F.room,n:F.list.length}))}; }
window.__ebX=Object.assign(window.__ebX||{},{d2b:{
  state:d2bState2, objs:d2bObjList, D2B, DEEP:D2B_DEEP, DREAD:D2B_DREAD,
  cell:(room,c,r)=>{ const A=AREA, R=A&&A.rooms&&A.rooms[room]; if(!R) return null; return d2bRC(R,c,r); },
  go:(dun,room,c,r)=>{ const res=dunGo(dun,room); if(c!=null){ const R=AREA.rooms[room], q=d2bRC(R,c,r); player.x=q.x; player.y=q.y; moveReset(player); const T=AREA.tri; if(T){ T.lx=q.x; T.ly=q.y; T.safe={x:q.x,y:q.y}; } updateCam(0,true); } return res; },
  put:(x,y)=>{ player.x=x; player.y=y; moveReset(player); player.kvx=player.kvy=0; const T=AREA&&AREA.tri; if(T){ T.lx=x; T.ly=y; T.safe={x,y}; } updateCam(0,true); return true; },
  pound:()=>{ if(!canPound()) return false; slamImpact(player); return true; },
  poundAt:(x,y)=>{ if(!canPound()) return false; player.x=x; player.y=y; moveReset(player); const T=AREA&&AREA.tri; if(T){ T.lx=x; T.ly=y; } slamImpact(player); return true; },
  press:o=>{ D2B.press=Object.assign(D2B.press||{},o||{}); return true; }, release:()=>{ D2B.press=null; return true; },
  face:(x,y)=>{ const a=angTo(player.x,player.y,x,y); player.facing=a; player.faceGoal=a; player.aim=a; return a; },
  hit:(id,src)=>{ const A=AREA, o=A&&(A.objs.find(q=>q.id===id)||(A.d2b&&A.d2b.eyes.find(q=>q.id===id))); if(!o) return false; return areaObjHit(o.x,o.y,10,src||'arrow'); },
  lightsSolve:room=>d2bLightsSolve(AREA,room), drumSolve:room=>d2bDrumSolve(AREA,room),
  dbg:{d2bLvl,d2bLockDone,d2bEyeAwake,d2bStarWanted,d2bLiftGo:o=>d2bLiftGo(AREA,o),d2bLampLight:o=>d2bLampLight(AREA,o),d2bSummitOut:()=>{ const A=AREA; if(A&&A.d2b&&A.d2b.summit) d2bSummitOut(A,A.d2b.summit); },d2bEggCrack:o=>d2bEggCrack(AREA,o),
    p3LockCrack:o=>p3LockCrack(AREA,o),p3LockMeltCave:o=>p3LockMeltCave(AREA,o),p3MeltGate:o=>p3MeltGate(AREA,o),p3PressPlate,p3CaveCrack:k=>p3CaveCrack(AREA,k),p3DrumFlip:(R,o)=>p3DrumFlip(AREA,R,o),
    dunH,tCell,tPos,tGround,tWet,tHole,caveRoomAt,caveInterior,solveRoom,refreshCaveGates,caveSid,caveDsid,dChestSealed,dunFloorNext:d=>dunFloorNext(AREA,d),breakCrack,killEnemy,
    canPound,canBlaze,canWindride,canClaws:typeof canClaws==='function'?canClaws:()=>false,canGrapple:typeof canGrapple==='function'?canGrapple:()=>false,canShadow:typeof canShadow==='function'?canShadow:()=>false,canDblJump,canWalkWater,
    p2Targets:typeof p2Targets==='function'?p2Targets:null,p2TgtOK:typeof p2TgtOK==='function'?p2TgtOK:null,p2DashBlocked:typeof p2DashBlocked==='function'?p2DashBlocked:null,p2DashLen:typeof p2DashLen==='function'?p2DashLen:null,
    P2:typeof P2!=='undefined'?P2:null,P3,p3StreamOn,getMv:()=>typeof P2!=='undefined'?P2.mv:null,setMv:v=>{ if(typeof P2!=='undefined') P2.mv=v; },cartBoard,pointFlip,hitCrystal,colAt,trialObjAct,dunNearGround,p3Need,p3WarmT,p3JetLen,P3N,P3T:typeof P3T!=='undefined'?P3T:null,
    blockStep:(b,di,dj)=>p3BlockStep(AREA,b,di,dj),cartNext:(o,k)=>cartNext(AREA,o,k),railNb:k=>railNb(AREA.cave,k),eyeShot:o=>d2bEyeShot(AREA,o,'arrow'),dunAct:id=>{ const o=AREA.objs.find(q=>q.id===id&&q.k!=='tv'); if(o) areaObjAct(o); return !!o; }}
}});
