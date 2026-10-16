
// ================= e10c_gates (v10, ENG-W): the gate library, the art hooks for story data, and Pip's Fetch
// GATES   gateBuild(place) builds one gate from a story `place` entry
//           { id, kind:'gate', gate:'<kind>', map, at:[x,y], r, leads, face?, ...options }
//         on ANY map (0 to 4), outdoors, from the code that already exists for its power (e3 elevation, p2, p3, p4,
//         e6b), so it truly blocks without the power and opens with it. By default a gate guards a NOOK centred on
//         `at` with radius `r`: a small raised rock (a mesa), an island in a moat, or a fenced sand pen. The payoff
//         (`leads`) goes inside, within 0.6 r of `at`. The way in faces `face` ('s' by default, the side you see).
//         `wall:false` builds only the gate piece at `at` (for a gap the map already has; door kinds and a few others).
//         gateOpen(id), gateClose(id), gateIsOpen(id), gateKinds(), gateOpensWith(kind), gateInfo(id), gateInside(id,x,y).
//         State: G.flags['gate_'+id] (1 = Ash got through with the power, 2 = open for everyone), saved with the game.
// ART     defineLook(id,{w,h,draw(g,x,y,t,state),anim?,live?}) and definePose(npcId,pose,draw(g,x,y,t)); the engine
//         calls lookDraw(id,g,x,y,t,state) and poseDraw(npcId,pose,g,x,y,t). (x,y) is the foot: the bottom middle.
// FETCH   a fetch_spot gate is a small shiny thing out of reach. With Pip along and G.flags.c_pip_fetch, look at it and
//         press USE: Pip flies over, grabs it and brings it back.
// The guide for writers and the engine is scratchpad v10/GATES.md. Everything here extends other modules by wrapping.

// ---------- 0. the kinds
// power: the id the gate opens with (an ability id; 'whip' and 'bombs' are weapons; 'fetch' is Pip's Fetch)
const GATE_KINDS={
  climb_wall:    {power:'claws',   label:'Climbing Claws', name:['a cliff with handholds','a cliff with handholds']},
  grapple_post:  {power:'grapple', label:'Grapple Tail',   name:['a ledge with a grapple post','a ledge with a post']},
  shadow_curtain:{power:'shadow',  label:'Shadow Dash',    name:['a curtain of moths','a moth curtain']},
  thin_bars:     {power:'shadow',  label:'Shadow Dash',    name:['thin iron bars','thin bars']},
  whip_hook:     {power:'whip',    label:'Chain Whip',     name:['a hook over the water','a hook post']},
  chain_ring:    {power:'whip',    label:'Chain Whip',     name:['a gate with a chain ring','a chain gate']},
  vent:          {power:'wings',   label:'Ember Wings',    name:['an updraft under a cliff','an updraft']},
  step_face:     {power:'dbljump', label:'Double Jump',    name:['a high step','a high step']},
  water:         {power:'stride',  label:'Water Stride',   name:['an island in a moat','an island']},
  ice_wall:      {power:'blaze',   label:'Blaze Breath',   name:['a wall of old ice','an ice wall']},
  wind_ribbon:   {power:'windride',label:'Wind Riding',    name:['a ribbon of wind','a wind ribbon']},
  pound_plate:   {power:'pound',   label:'Ground Pound',   name:['a gate with a rune plate','a plate gate']},
  cracked_floor: {power:'pound',   label:'Ground Pound',   name:['cracked ground','cracked ground']},
  bomb_rock:     {power:'bombs',   label:'Blast Bombs',    name:['a huge boulder','a big rock']},
  dive_spot:     {power:'dive',    label:'Dive',           name:['a deep pool','a deep pool']},
  burrow_mound:  {power:'burrow',  label:'Burrow',         name:['a fence in the sand','a sand fence']},
  moon_glass:    {power:'moonfire',label:'Moonfire',       name:['moon-glass stairs','glass stairs']},
  fetch_spot:    {power:'fetch',   label:"Pip's Fetch",    name:['something shiny out of reach','something shiny']}
};
const GT={list:[],by:{},water:[],sand:[],zones:[],fly:[],px:0,py:0,dt:0.016,g:null,syncT:0,warned:{},fetch:null,nudgeT:{},t:0,tick:0};
function gateKinds(){ const o={}; for(const k in GATE_KINDS){ const K=GATE_KINDS[k]; o[k]={power:K.power,label:K.label,name:K.name[0]}; } return o; }
function gateOpensWith(kind){ const K=GATE_KINDS[kind]; return K?K.power:null; }
function gtWarn(key,msg){ if(GT.warned[key]) return; GT.warned[key]=1; try{ console.warn('[gates] '+msg); }catch(e){} }
// does Ash have the power right now (story mode; weapons are owned, not equipped)
function gtHas(power){
  if(!G||G.mode!=='story') return false;
  switch(power){
    case 'whip': return !!(G.weapons&&G.weapons.whip);
    case 'bombs': return !!(G.weapons&&G.weapons.bombs);
    case 'dbljump': return hasAbil('dbljump')||(typeof hasSkill==='function'&&!!hasSkill('dbljump'));
    case 'fetch': return !!(G.flags&&G.flags.c_pip_fetch&&G.flags.pip&&G.pip);
    default: return hasAbil(power);
  }
}
const gtSt=id=>(G&&G.flags&&G.flags['gate_'+id])|0;
const gtTxt=(a,b)=>simplify(S(a,b));
// map styles for the rock of a nook (Embermere grass, the coast chalk, Frostreach ice, Moonfall sand, the Peak basalt)
const GT_STYLE=['grass','chalk','ice','sand','basalt'];
const GT_FACE={s:[0,1],n:[0,-1],e:[1,0],w:[-1,0]};

// ---------- 1. building
// gateBuild(place) -> the gate record (or null). Safe to call at load time, before a game exists.
function gateBuild(place){
  if(!place||!place.id){ gtWarn('noid','gateBuild: a gate place needs an id'); return null; }
  if(GT.by[place.id]){ gtWarn('dup:'+place.id,'gateBuild: gate '+place.id+' is built twice; the second is ignored'); return GT.by[place.id]; }
  const kind=place.gate||place.kind_gate||place.type, K=GATE_KINDS[kind], D=GTK[kind];
  if(!K||!D){ gtWarn('kind:'+place.id,'gateBuild: '+place.id+' has an unknown gate kind "'+kind+'"'); return null; }
  const at=place.at||(place.x!=null?[place.x,place.y]:null);
  if(!at){ gtWarn('at:'+place.id,'gateBuild: '+place.id+' has no at:[x,y]'); return null; }
  let x=+at[0], y=+at[1], map=place.map!=null?+place.map:mapAt(y);
  // map-local y (0 .. h) on a later map: move it into the map's band
  if(map>0&&mapAt(y)!==map&&y<BAND){ gtWarn('local:'+place.id,'gateBuild: '+place.id+' at y '+y+' is map-local; moved into map '+map); y+=map*BAND; }
  const face=GT_FACE[place.face]?place.face:'s';
  const g={id:place.id,kind,K,D,place,map,x,y,face,leads:place.leads||null,
    r:clamp(place.r!=null?+place.r:(D.r||110),D.rmin||60,D.rmax||300),
    wall:place.wall!==false,style:place.style||GT_STYLE[map]||'rock',parts:[],pieces:[],used:false};
  try{ if(place.build) gtBuildCustom(g); else D.build(g); }catch(e){ console.error('[gates] build '+g.id,e); return null; }
  GT.list.push(g); GT.by[g.id]=g;
  gtDirtyArea(g.x,g.y,g.r+260);
  if(G) gtSync(g);
  return g;
}
// what the engine and the checker can ask about a gate
function gateInfo(id){ const g=GT.by[id]; if(!g) return null; const d=g.door||{x:g.x,y:g.y};
  return {id:g.id,kind:g.kind,power:g.K.power,label:g.K.label,map:g.map,x:g.x,y:g.y,r:g.r,face:g.face,leads:g.leads,
    door:{x:Math.round(d.x),y:Math.round(d.y)},inside:g.inside?{x:g.inside.x,y:g.inside.y,r:g.inside.r}:null,open:gateIsOpen(id),state:gtSt(id)}; }
function gateInside(id,x,y){ const g=GT.by[id]; return !!(g&&gtIsIn(g,x,y)); }
function gtIsIn(g,x,y){ return g.custom?gtCustomIn(g,x,y):!!(g.D.isIn&&g.D.isIn(g,x,y)); }
// the engine's `open gate` / `close gate` (it emits gate_open itself)
function gateSet(id,open){ return open?gtOpenQuiet(id):gateClose(id); }
function gtOpenQuiet(id){ const g=GT.by[id]; if(!g||!G) return false; G.flags['gate_'+id]=2; gtSync(g); return true; }
function gateIsOpen(id){ return gtSt(id)>0; }
// open for everyone (the story's `open gate` effect): the door goes, or a plain way in appears (stairs, a ladder,
// planks, a gap in the fence)
function gateOpen(id){
  const g=GT.by[id]; if(!g){ gtWarn('open:'+id,'gateOpen: no gate '+id); return false; }
  if(!G) return false; const was=gtSt(id);
  G.flags['gate_'+id]=2; gtSync(g);
  if(!was) gtEmit(g);
  return true;
}
function gateClose(id){
  const g=GT.by[id]; if(!g){ gtWarn('close:'+id,'gateClose: no gate '+id); return false; }
  if(!G) return false; delete G.flags['gate_'+id]; g.used=false; gtSync(g); return true;
}
// Ash got through with the power (v 1), or broke the door for good (v 2)
function gtGot(g,v){
  if(!G||G.mode!=='story') return; const was=gtSt(g.id); if(was>=v) return;
  G.flags['gate_'+g.id]=v; if(v>=2) gtSync(g);
  if(!was) gtEmit(g);
  try{ saveGame(); }catch(e){}
}
function gtEmit(g){
  try{ if(typeof storyEmit==='function') storyEmit('gate_open:'+g.id); }catch(e){ console.error(e); }
  try{ if(typeof g.place.onOpen==='function') g.place.onOpen(g.id); }catch(e){ console.error(e); }
  try{ if(typeof questPoke==='function') questPoke(); }catch(e){}
}
// make the world match the saved state (after a load, a new game, gateOpen and gateClose)
function gtSync(g){ const st=gtSt(g.id); try{ if(g.D.sync) g.D.sync(g,st); if(g.custom&&g.D.sync!==gtPlainSync) gtRampSync(g,st); }catch(e){ console.error('[gates] sync '+g.id,e); } g.st=st; }
function gtSyncAll(){ for(const g of GT.list) gtSync(g); }
// chunks (ground art) and props near a new or changed gate are made again
function gtDirtyArea(x,y,r){
  if(typeof CHUNKS==='undefined') return;
  const c0=Math.floor((x-r)/CH), c1=Math.floor((x+r)/CH), r0=Math.floor((y-r)/CH), r1=Math.floor((y+r)/CH);
  for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++){ const key=ckey(cx,cy); CHUNKS.delete(key); const arr=PROPS.get(key); if(arr){ for(const p of arr) if(p.col) try{ removeCol(p.col); }catch(e){} PROPS.delete(key); } }
  try{ placeholderCol.clear(); }catch(e){}
}
function gtList(o,...arrs){ for(const a of arrs) if(a&&!a.includes(o)) a.push(o); }
function gtUnlist(o,...arrs){ for(const a of arrs){ if(!a) continue; const i=a.indexOf(o); if(i>=0) a.splice(i,1); } }
// a collider that is off while the gate is open for everyone (st>=2) or while `extra()` says so; never burrowed under
function gtCol(g,c,extra){ c.deep=true; c.gate=g.id; Object.defineProperty(c,'off',{get(){ return gtSt(g.id)>=2||(extra?!!extra():false); },set(v){},configurable:true}); addCol(c); g.parts.push(c); return c; }
// door zones: thick rects round a shut door that stop Ash on foot, jumping or rolling (a collider alone is thin enough
// for a fast roll to tunnel through). pass() says when the power lets him through (a shadow, a lit curtain, melted ice).
function gtZone(g,R,pass,keep){ const horiz=R.w>=R.h, z={g,keep:!!keep,horiz,cx:R.x,cy:R.y,x0:R.x-R.w/2-(horiz?4:18),x1:R.x+R.w/2+(horiz?4:18),y0:R.y-R.h/2-(horiz?18:4),y1:R.y+R.h/2+(horiz?18:4),pass:pass||null};
  (g.zones||(g.zones=[])).push(z); GT.zones.push(z); return z; }
function gtZoneAt(x,y){ const Z=GT.zones; for(let i=0;i<Z.length;i++){ const z=Z[i]; if(x<z.x0||x>z.x1||y<z.y0||y>z.y1) continue; if(!z.keep&&gtSt(z.g.id)>=2) continue; if(z.pass&&z.pass()) continue; return z; } return null; }
// a move into a shut door's zone from outside it, or across its middle line from anywhere, is blocked (so Ash can always
// step back out of a zone he was put in, but never through the door)
const gtInZ=(z,x,y)=>x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1;
function gtZoneStops(x,y,ox,oy){ const z=gtZoneAt(x,y); if(!z) return false; if(!gtInZ(z,ox,oy)) return true;
  return z.horiz?((y-z.cy)*(oy-z.cy)<0):((x-z.cx)*(ox-z.cx)<0); }
// flight walls: Ash cannot fly into a nook whose way in is not wings (lvl 1 rocks, islands, sand pens); the no-fly
// zone round it grounds him first, this is the backstop so a fast flier cannot land on top
function gtFlyIn(x,y){ const L=GT.fly; for(let i=0;i<L.length;i++){ const g=L[i]; if(gtSt(g.id)>=2) continue; const f=g.flyZ;
  if(f.e){ const dx=(x-f.x)/f.rx, dy=(y-f.y)/f.ry; if(dx*dx+dy*dy<1) return g; } else if(Math.abs(x-f.x)<f.rx&&Math.abs(y-f.y)<f.ry) return g; } return null; }
function gtFlyWall(g,e,x,y,rx,ry){ g.flyZ={e,x,y,rx,ry}; GT.fly.push(g); }
{ const base=playerBlocked; playerBlocked=function(x,y){
    if(x<IZX-50&&G&&G.mode==='story'){ const p=player;
      if(p&&p.flying){ if(GT.fly.length&&gtFlyIn(x,y)&&!gtFlyIn(GT.px,GT.py)){ gtSayOnce('fly',S('The air over there will not hold your wings.','You cannot fly there.')); return true; } }
      else if(GT.zones.length&&gtZoneStops(x,y,GT.px,GT.py)) return true; }
    return base(x,y); }; }
// wrap an existing collider's `off` so it is also off while the gate is open
function gtColWrap(g,c,soft){ if(!c) return; if(!soft) c.deep=true; const d=Object.getOwnPropertyDescriptor(c,'off'), get=d&&d.get, set=d&&d.set; if(get) Object.defineProperty(c,'off',{get(){ return gtSt(g.id)>=2||get.call(c); },set(v){ if(set) set.call(c,v); },configurable:true}); else { let v=!!c.off; Object.defineProperty(c,'off',{get(){ return gtSt(g.id)>=2||v; },set(x){ v=!!x; },configurable:true}); } }

// ---------- 1b. a gate with its own geometry: place.build = { plateau, post, ledge, nofly, bars, curtain, ring, plate,
// hook, ramp } (A2S, CHANGES.md). The pieces are made first; the kind adds its own piece at `at` when build does not
// hold it (an ice wall, a boulder, a vent...). `ramp` appears only while the gate is open for everyone (and after a
// reload). `at` is the gate piece itself here; the inside is place.inside:[x,y,r], else the leads' spot, else the
// plateau's top, else the far side of the door.
const gtArr=v=>v==null?[]:Array.isArray(v)&&(Array.isArray(v[0])||typeof v[0]==='object')?v:[v];
const gtS=v=>Array.isArray(v)?S(v[0],v[1]||v[0]):typeof v==='string'?S(v,v):v;
const gtPt=q=>Array.isArray(q)?{x:+q[0],y:+q[1],lvl:q[2]}:{x:+q.x,y:+q.y,lvl:q.lvl};
const GT_SHADOW={shadow_curtain:1,thin_bars:1};
function gtBuildCustom(g){
  const B=g.place.build, k=g.map, kind=g.kind, mk=(d)=>{ const o=Object.assign({},d); delete o.why; return o; };
  g.custom=true; g.wall=false; g.rx=g.ry=g.r; g.door={x:g.x,y:g.y}; let own=false;
  if(B.plateau){ const d=Object.assign({k,style:g.style,noise:8},B.plateau); g.plat=ELEV.plateau(d); g.lvl=g.plat?g.plat.lvl:0;
    if(g.plat){ const bb=g.plat.bb, H=g.lvl*ELEV.px; ELEV.clear({k,rect:[bb[0]-30,bb[1]-20,bb[2]+30,bb[3]+H+50]});
      if(g.lvl<2&&kind!=='vent'&&kind!=='wind_ribbon') gtFlyWall(g,false,(bb[0]+bb[2])/2,(bb[1]+bb[3]+H)/2,(bb[2]-bb[0])/2+20,(bb[3]-bb[1]+H)/2+26); }
    if(kind==='climb_wall'||kind==='step_face') own=true; }
  for(const q of gtArr(B.post)){ const P=gtPt(q); g.post=ELEV.grapple({k,x:P.x,y:P.y,lvl:P.lvl}); if(kind==='grapple_post') own=true; }
  for(const q of gtArr(B.ledge)) ELEV.ledge(Object.assign({k},q));
  for(const q of gtArr(B.nofly)) ELEV.noFly(Object.assign({k},mk(q),{why:gtS(q.why)||S('The winds are too strong to fly here.','Too windy to fly here.')}));
  const door=B.bars||B.curtain;
  if(door){ const R={x:+door.x,y:+door.y,w:+(door.w||96),h:+(door.h||16)};
    if(GT_SHADOW[kind]){ const cur=kind==='shadow_curtain'||!!B.curtain, o=p2Add(cur?'mothcurtain':'thinbars',{id:'gate_'+g.id+'_d',x:R.x,y:R.y,w:R.w,h:R.h,style:door.style||'iron'});
      gtColWrap(g,o.col); g.doorObj=o; gtZone(g,R,cur?()=>P2.pass>0||p2CurtainOpen(o):()=>P2.pass>0); }
    else { const o={id:'gate_'+g.id+'_bars',x:R.x,y:R.y,w:R.w,h:R.h,horiz:R.w>=R.h,lift:0,gate:g.id}; o.col=gtCol(g,{t:'r',x0:R.x-R.w/2,y0:R.y-R.h/2,x1:R.x+R.w/2,y1:R.y+R.h/2}); g.bars=o; gtZone(g,R); }
    g.doorR=R; g.door={x:R.x,y:R.y}; if(GT_SHADOW[kind]) own=true; }
  if(B.ring){ const P=gtPt(B.ring), o={id:'gate_'+g.id+'_ring',x:P.x,y:P.y,h:26,need:1,done:false,strain:0,mode:'lever',flip:-1,gate:g.id,r:12}; o.k='e10ring'; o.arms=true;
    LANDMARKS.push(o); ARMS.lm.push(o); g.ring=o; addCol({t:'c',x:o.x,y:o.y,r:10,deep:true}); g.door={x:o.x,y:o.y}; if(kind==='chain_ring') own=true; }
  if(B.plate){ const P=gtPt(B.plate), o=p3Add('rplate',{id:'gate_'+g.id+'_plate',x:P.x,y:P.y,r:26,then:()=>gtGot(g,2)});
    o.p3k=Object.assign(Object.create(P3K.rplate),{bomb(q){ if(!q.done) p3Say(q.x,q.y-40,S('It shakes, but it wants a real stomp.','It needs a big stomp!'),'#ffe6b0','gplate'); }}); g.plate=o; if(kind==='pound_plate') own=true; }
  g.hooks=[]; for(const q of gtArr(B.hook)){ const P=gtPt(q), to=q.to?gtPt(q.to):null; const o=armsAdd('whiphook',{id:'gate_'+g.id+'_h'+g.hooks.length,x:P.x,y:P.y,to:to?{x:to.x,y:to.y}:undefined}); o.gate=g.id; g.hooks.push(o); if(kind==='whip_hook') own=true; }
  if(B.ramp) g.openRampDef=Object.assign({k,kind:'stairs'},B.ramp);
  if(!own) g.D.build(g);   // the kind's own piece at `at` (wall:false)
  if(g.place.inside){ const q=g.place.inside; g.inside={x:+q[0],y:+q[1],r:+(q[2]||70)}; }
  else if(g.plat&&!GT_SHADOW[kind]&&!g.doorR){ const bb=g.plat.bb; g.inside={x:Math.round((bb[0]+bb[2])/2),y:Math.round((bb[1]+bb[3])/2),r:Math.round(Math.min(bb[2]-bb[0],bb[3]-bb[1])/2)}; }
}
// where the leads' payoff is (the engine's runtime API), for "Ash got in" when nothing else says
function gtLeadsAt(g){
  if(g._lead!==undefined) return g._lead; g._lead=null;
  try{ const E=window.__eb&&window.__eb.story; const e=E&&E.entity&&g.leads?E.entity(g.leads):null; if(e&&e.x!=null&&e.y!=null&&(e.map==null||+e.map===g.map)) g._lead={x:e.x,y:e.y}; }catch(e){}
  return g._lead;
}
function gtCustomIn(g,x,y){
  if(g.inside) return dist(x,y,g.inside.x,g.inside.y)<g.inside.r;
  const P=g.plat;
  if(P&&!g.doorR&&!GT_SHADOW[g.kind]) return elvRingsIn(P.rings,x,y)&&elevLvl(x,y)>=P.lvl&&!(elevFace(x,y)&EF.FACE);
  const L=gtLeadsAt(g); if(L&&dist(x,y,L.x,L.y)<70) return true;
  const R=g.doorR; if(R){ const u=GT_FACE[g.face], horiz=R.w>=R.h, inw=horiz?-u[1]:-u[0];   // the inward side is away from `face`
    if(horiz) return Math.abs(x-R.x)<R.w/2+30&&(y-R.y)*Math.sign(inw||-1)>R.h/2+20&&Math.abs(y-R.y)<R.h/2+420;
    return Math.abs(y-R.y)<R.h/2+30&&(x-R.x)*Math.sign(inw||-1)>R.w/2+20&&Math.abs(x-R.x)<R.w/2+420; }
  return false;
}

// ---------- 2. shapes: the mesa, the moat, the pen
// the side the way in faces: lip (on top, near the edge), foot (on the ground below the face), out (unit away),
// along (unit along the edge), depth (px of face on that side)
function gtSide(g,lvl){
  const f=g.face, rx=g.rx||g.r, ry=g.ry||g.r, x=g.x, y=g.y, H=lvl*ELEV.px;
  if(f==='n') return {lip:[x,y-ry+18],foot:[x,y-ry-26],out:[0,-1],along:[1,0],depth:10,edge:[x,y-ry]};
  if(f==='e'){ const d=Math.min(18,H*0.3)+6; return {lip:[x+rx-18,y],foot:[x+rx+d+18,y],out:[1,0],along:[0,1],depth:d,edge:[x+rx,y]}; }
  if(f==='w'){ const d=Math.min(18,H*0.3)+6; return {lip:[x-rx+18,y],foot:[x-rx-d-18,y],out:[-1,0],along:[0,1],depth:d,edge:[x-rx,y]}; }
  return {lip:[x,y+ry-20],foot:[x,y+ry+H+16],out:[0,1],along:[1,0],depth:H,edge:[x,y+ry]};
}
// the highest existing plateau under the nook and its way in (from the plateau list, so no grid is built at load)
function gtBaseLvl(g){
  const E=ELV.maps[g.map]; if(!E||!E.plats.length) return 0; let b=0; const r=g.r, u=GT_FACE[g.face];
  const pts=[[g.x,g.y],[g.x+u[0]*(r+80),g.y+u[1]*(r+110)],[g.x-r*0.8,g.y],[g.x+r*0.8,g.y],[g.x,g.y-r*0.7]];
  for(const P of E.plats){ if(P.lvl<=b||String(P.id).startsWith('gate_')) continue; for(const q of pts) if(q[0]>=P.bb[0]&&q[0]<=P.bb[2]&&q[1]>=P.bb[1]&&q[1]<=P.bb[3]&&elvRingsIn(P.rings,q[0],q[1])){ b=P.lvl; break; } }
  return b;
}
// a raised rock, level lvl above the ground there, round (an ellipse r by 0.78 r): its top is the nook
function gtMesa(g,o){
  const k=g.map; g.rx=g.r; g.ry=Math.round(g.r*0.78);
  // levels are relative to the ground the nook stands on (a gate on a level 2 terrace makes a level 3 or 4 rock)
  const base=gtBaseLvl(g), lvl=Math.min(8,base+o.lvl); g.base=base; g.dl=lvl-base; g.lvl=lvl; o={...o,dl:g.dl};
  const P=ELEV.plateau({k,disc:[g.x,g.y,g.rx,g.ry],lvl,style:g.style,climb:!!o.climb,step:!!o.step,noise:o.noise!=null?o.noise:8,id:'gate_'+g.id,seed:(gtHash(g.id)%997)+11});
  g.plat=P; g.side=gtSide(g,g.dl); const dl=g.dl;
  ELEV.clear({k,disc:[g.x,g.y+dl*ELEV.px*0.4,g.rx+70,g.ry+dl*ELEV.px+90]});
  // and an apron in front of the way in, so no tree or rock stands where Ash needs to aim, throw or pull
  const f=g.side.foot, u=g.side.out; ELEV.clear({k,disc:[f[0]+u[0]*90,f[1]+u[1]*90,Math.abs(u[1])?230:180,Math.abs(u[1])?180:230]});
  if(o.nofly||dl<2){ g.nofly=ELEV.noFly({k,disc:[g.x,g.y+dl*ELEV.px*0.5,g.rx+150,g.ry+dl*ELEV.px+150],why:S('The air over these rocks is too still for wings.','No wind here. You cannot fly.')});
    gtFlyWall(g,true,g.x,g.y+dl*ELEV.px*0.5,g.rx+22,g.ry+dl*ELEV.px*0.5+30); }
  g.inside={x:g.x,y:g.y,r:Math.round(g.r*0.6)};
  g.door={x:g.side.foot[0],y:g.side.foot[1]};
  return P;
}
function gtInEll(g,x,y,m){ const dx=(x-g.x)/(g.rx+(m||0)), dy=(y-g.y)/(g.ry+(m||0)); return dx*dx+dy*dy<1; }
const gtOnMesa=(g,x,y)=>gtInEll(g,x,y,-6)&&elevLvl(x,y)>=g.lvl;
// a stair (or ladder) up the face on the way-in side
function gtRampRect(g,w){
  const s=g.side, x=g.x, y=g.y, hw=(w||60)/2;
  if(g.face==='n') return {x0:x-hw,y0:y-g.ry-14,x1:x+hw,y1:y-g.ry+14,dir:'s'};
  if(g.face==='e') return {x0:x+g.rx-16,y0:y-hw,x1:x+g.rx+s.depth+8,y1:y+hw,dir:'w'};
  if(g.face==='w') return {x0:x-g.rx-s.depth-8,y0:y-hw,x1:x-g.rx+16,y1:y+hw,dir:'e'};
  return {x0:x-hw,y0:y+g.ry-16,x1:x+hw,y1:y+g.ry+s.depth+8,dir:'n'};
}
function gtRamp(g,kind,extra){ const R=gtRampRect(g,kind==='ladder'?40:60); return ELEV.ramp(Object.assign({k:g.map,kind:kind||'stairs'},R,extra||{})); }
function gtUnramp(g,r){ if(!r) return; const E=ELV.maps[g.map]; if(!E) return; const i=E.ramps.indexOf(r); if(i>=0){ E.ramps.splice(i,1); elvDirty(E); } }
// a one-way drop off the way-in side, beside the way in (the quick way back down)
function gtLedge(g){
  const H=(g.dl||g.lvl)*ELEV.px;
  if(g.face==='s'||g.face==='n'){ const dx=g.rx*0.56, ey=g.y+g.ry*Math.sqrt(1-0.56*0.56); g.ledgeAt=[g.x+dx,ey+H*0.5];
    return ELEV.ledge({k:g.map,x0:g.x+dx-26,y0:ey-16,x1:g.x+dx+26,y1:ey+H+16}); }
  const dy=g.ry*0.5, ex=g.rx*Math.sqrt(1-0.25), sx=g.face==='e'?1:-1; g.ledgeAt=[g.x+sx*ex,g.y+dy+H*0.5];
  return ELEV.ledge({k:g.map,x0:g.x+sx*ex-24,y0:g.y+dy-24,x1:g.x+sx*(ex+30),y1:g.y+dy+H+16});
}
// the mesa's own nudge test: Ash at the foot of the way in, pushing at the face
function gtAtFoot(g,p,R){ const f=g.side.foot; return dist(p.x,p.y,f[0],f[1])<(R||70)&&!gtOnMesa(g,p.x,p.y); }

// gate water: a ring (island in a moat) or a disc (a pond), drawn by the ground through T and blocking walkers
// {g, x,y, r0 (island radius, 0 for a pond), r1 (outer radius), bb}
function gtAddWater(g,r0,r1){
  const w={g,x:g.x,y:g.y,r0,r1,bb:[g.x-r1-40,g.y-r1-40,g.x+r1+40,g.y+r1+40],seed:gtHash(g.id)%101};
  GT.water.push(w); g.water=w; return w;
}
// signed distance to the gate's water (negative inside the water), with a little natural wobble
function gtWaterD(w,x,y){
  const d=Math.hypot(x-w.x,y-w.y), a=Math.atan2(y-w.y,x-w.x), n=Math.sin(a*3+w.seed)*7+Math.sin(a*7+w.seed*2)*4;
  const outer=d-(w.r1+n), inner=w.r0>0?(w.r0+n*0.6)-d:-1e9;
  return Math.max(outer,inner);
}
// the plank bridge over a moat once the gate is open for everyone (a strip from the outer shore to the island)
function gtPlankAt(w,x,y){ const g=w.g; if(gtSt(g.id)<2||!w.r0) return false; const u=GT_FACE[g.face], vx=x-w.x, vy=y-w.y, along=vx*u[0]+vy*u[1], side=Math.abs(vx*u[1]-vy*u[0]-(w.plank||0)); return side<26&&along>w.r0-30&&along<w.r1+30; }
function gtWaterAt(x,y){
  const L=GT.water; if(!L.length||x>=IZX-50) return null;
  for(let i=0;i<L.length;i++){ const w=L[i], b=w.bb; if(x<b[0]||x>b[2]||y<b[1]||y>b[3]) continue; if(gtWaterD(w,x,y)<0&&!gtPlankAt(w,x,y)) return w; }
  return null;
}
{ const base=T; T=function(x,y,o){
    o=base(x,y,o); if(x>=IZX-50) return o;
    const Q=GT.sand; for(let i=0;i<Q.length;i++){ const s=Q[i]; if(x>s[0]&&x<s[2]&&y>s[1]&&y<s[3]&&!o.water) o.sand=1; }
    const L=GT.water; if(!L.length) return o;
    for(let i=0;i<L.length;i++){ const w=L[i], b=w.bb; if(x<b[0]||x>b[2]||y<b[1]||y>b[3]) continue;
      if(o.face&1) continue;
      const wd=gtWaterD(w,x,y);
      if(wd<0&&!gtPlankAt(w,x,y)){ o.water=1; o.depth=Math.max(o.depth||0,clamp(-wd/70,0,1)); o.shore=0; o.road=0; o.bridge=0; o.lava=0; o.lavaS=0; o.bog=0; }
      else if(wd<30&&!o.water){ o.shore=Math.max(o.shore||0,1-wd/30); }
    }
    return o; }; }
{ const base=blockedAt; blockedAt=function(x,y){ if(GT.water.length&&gtWaterAt(x,y)) return true; return base(x,y); }; }
// a jump never clears gate water (only Water Stride, the whip's swing, Dive's swim or flight do); the rapids round a
// whip island are too fast even for Water Stride (Dive still swims them: p4 asks first)
{ const base=playerBlocked; playerBlocked=function(x,y){
    if(GT.water.length&&x<IZX-50){ const p=player; if(p&&!p.flying&&!gtSwinging()){ const w=gtWaterAt(x,y);
      if(w&&(w.rough||((p.z||0)>0&&!canWalkWater()))){ if(w.rough&&canWalkWater()) gtSayOnce('rough',S('The current is far too fast to walk on!','Too fast to walk on!')); return true; } } }
    return base(x,y); }; }
// the Chain Whip's swing is a jump that may cross gate water: only while it really lasts (ARMS.swing can outlive it
// when the weapon is switched mid-swing)
function gtSwinging(){ if(typeof ARMS==='undefined'||!ARMS.swing||!G) return false; const S2=ARMS.swing;
  if(GT.sw!==S2){ GT.sw=S2; GT.swT0=G.time; } const p=player; return G.time-GT.swT0<=(S2.dur||0.8)+0.25&&!!p&&((p.z||0)>0||(p.vz||0)>0); }
function gtSayOnce(k,txt){ const n=GT.nudgeT['say_'+k]||0; if(GT.t-n<4&&n) return; GT.nudgeT['say_'+k]=GT.t||0.01; const p=player; if(p) ftext(p.x,p.y-(p.z||0)-44,simplify(txt),'#ffe6b0',13); }
// an island in a moat (water, whip_hook): r is the island, the moat is `moat` px wide (default 150)
function gtIsland(g){
  const mw=clamp(g.place.moat!=null?+g.place.moat:150,90,320);
  g.mw=mw; gtAddWater(g,g.r,g.r+mw); g.rx=g.ry=g.r;
  ELEV.clear({k:g.map,disc:[g.x,g.y,g.r+mw+130]});
  g.nofly=ELEV.noFly({k:g.map,disc:[g.x,g.y,g.r+mw+170],why:S('Spray off the water soaks your wings.','Too wet to fly here.')});
  gtFlyWall(g,true,g.x,g.y,g.r+mw+14,g.r+mw+14);
  g.inside={x:g.x,y:g.y,r:Math.round(g.r*0.6)};
  const u=GT_FACE[g.face]; g.door={x:g.x+u[0]*(g.r+mw+40),y:g.y+u[1]*(g.r+mw+40)};
}
const gtOnIsland=(g,x,y)=>dist(x,y,g.x,g.y)<g.r-6;

// ---------- 3. the kinds (GTK[kind]: build(g), sync(g,st), isIn(g,x,y), nudge(g,p) -> text when Ash lacks the power)
const GTK={};
const gtPlainSync=(g,st)=>{ // mesa kinds whose open state adds a plain way up (stairs, or a ladder for the claws)
  if(g.custom) return gtRampSync(g,st);
  if(st>=2&&!g.openRamp) g.openRamp=gtRamp(g,g.kind==='climb_wall'?'ladder':'stairs');
  else if(st<2&&g.openRamp){ gtUnramp(g,g.openRamp); g.openRamp=null; } };
const gtMesaIn=(g,x,y)=>gtOnMesa(g,x,y);
// a custom gate's build.ramp: only while open for everyone (and after a reload)
function gtRampSync(g,st){ if(!g.openRampDef) return; if(st>=2&&!g.openRamp) g.openRamp=ELEV.ramp(Object.assign({},g.openRampDef)); else if(st<2&&g.openRamp){ gtUnramp(g,g.openRamp); g.openRamp=null; } }
GTK.climb_wall={r:110,
  build(g){ if(!g.wall){ gtWarn('wall:'+g.id,g.id+': climb_wall needs its own rock (wall:false is ignored)'); g.wall=true; }
    gtMesa(g,{lvl:clamp(g.place.lvl||2,1,4),climb:true,nofly:(g.place.lvl||2)<2}); },
  sync:gtPlainSync, isIn:gtMesaIn,
  nudge:g=>S('Cracks and handholds. With climbing claws you could go up.','Handholds! You need claws.')};
GTK.grapple_post={r:110,
  build(g){
    if(!g.wall){ const P=ELEV.grapple({k:g.map,x:g.x,y:g.y}); g.post=P; g.door={x:g.x,y:g.y}; return; }
    gtMesa(g,{lvl:1,nofly:true}); g.ledge=gtLedge(g);
    g.post=ELEV.grapple({k:g.map,x:g.side.lip[0],y:g.side.lip[1]}); },
  sync:gtPlainSync, isIn:gtMesaIn,
  nudge:g=>S('A brass post up on the rock. Something that grabs could pull you up.','A post up there. You need a grapple.')};
GTK.vent={r:110,
  build(g){
    if(!g.wall){ g.vent=ELEV.vent({k:g.map,x:g.x,y:g.y,r:g.place.vr||64,lift:g.place.lift||1}); g.door={x:g.x,y:g.y}; return; }
    gtMesa(g,{lvl:2}); g.ledge=gtLedge(g);
    const f=g.side.foot, u=g.side.out; g.vent=ELEV.vent({k:g.map,x:f[0]+u[0]*44,y:f[1]+u[1]*44,r:62,lift:1});
    g.door={x:g.vent.x,y:g.vent.y}; },
  sync:gtPlainSync, isIn:gtMesaIn,
  nudge:g=>S('Warm air rushes up here. With wings you could ride it to the top.','Warm air goes up. You need wings.')};
GTK.step_face={r:100,
  build(g){ gtMesa(g,{lvl:1,step:true,nofly:true,noise:5}); },
  sync:gtPlainSync, isIn:gtMesaIn,
  nudge:g=>S('Just too high to jump. A second jump in the air would do it.','Too high! Jump twice.')};
GTK.wind_ribbon={r:110,
  build(g){
    if(!g.wall){ const to=g.place.to?gtPt(g.place.to):{x:g.x,y:g.y-300}; g.stream=WIND.stream({id:'gate_'+g.id,gate:g.id,map:g.map,pts:g.place.pts||[[g.x,g.y],[to.x,to.y]],lv:g.place.lv||[0,g.place.lvl!=null?g.place.lvl:2],w:56}); g.door={x:g.x,y:g.y}; return; }
    gtMesa(g,{lvl:2}); g.ledge=gtLedge(g);
    const f=g.side.foot, u=g.side.out, a=g.side.along;
    g.stream=WIND.stream({id:'gate_'+g.id,gate:g.id,map:g.map,pts:[[f[0]+u[0]*190+a[0]*70,f[1]+u[1]*190+a[1]*70],[f[0]+u[0]*60,f[1]+u[1]*60],[g.x+a[0]*g.rx*0.15,g.y+a[1]*g.ry*0.15]],lv:[g.base,g.lvl],w:56});
    g.door={x:g.stream.pts[0][0],y:g.stream.pts[0][1]}; },
  sync:gtPlainSync, isIn:gtMesaIn,
  nudge:g=>S('A ribbon of wind curls up to the top. Jump into the swirl... if you can ride the wind.','Wind goes up. You need to ride it.')};
GTK.dive_spot={r:120,
  build(g){
    if(!g.wall){ const to=g.place.to?gtPt(g.place.to):null; if(!to){ gtWarn('to:'+g.id,g.id+': a dive_spot with wall:false needs to:[x,y] (where it comes up)'); return; } const ida='gate_'+g.id+'_pa', idb='gate_'+g.id+'_pb';
      g.poolA=p4Add('pool',{id:ida,kind:'water',x:g.x,y:g.y,r:40,link:idb}); g.poolB=p4Add('pool',{id:idb,kind:'water',x:to.x,y:to.y,r:40,link:ida}); g.door={x:g.x,y:g.y}; g.inside={x:to.x,y:to.y,r:70}; return; }
    gtMesa(g,{lvl:1,nofly:true}); g.ledge=gtLedge(g);
    const f=g.side.foot, u=g.side.out, a=g.side.along, ida='gate_'+g.id+'_pa', idb='gate_'+g.id+'_pb';
    g.poolA=p4Add('pool',{id:ida,kind:'water',x:f[0]+u[0]*46-a[0]*40,y:f[1]+u[1]*46-a[1]*40,r:40,link:idb});
    g.poolB=p4Add('pool',{id:idb,kind:'water',x:g.x-a[0]*g.rx*0.48,y:g.y-a[1]*g.ry*0.48+6,r:34,link:ida});
    g.door={x:g.poolA.x,y:g.poolA.y}; },
  sync:gtPlainSync, isIn:gtMesaIn,
  nudge:g=>S('A deep, deep pool. Someone who could hold their breath might find where it goes.','A deep pool. You need to dive.')};
GTK.moon_glass={r:110,
  build(g){
    if(!g.wall){ const w=g.place.w||220, h=g.place.h||64; g.glass=p4Add('moonglass',{id:'gate_'+g.id+'_glass',x0:g.x-w/2,y0:g.y-h/2,x1:g.x+w/2,y1:g.y+h/2}); g.door={x:g.x,y:g.y}; return; }
    gtMesa(g,{lvl:1,nofly:true}); g.ledge=gtLedge(g);
    g.mramp=gtRamp(g,'stairs',{moon:true,id:'gate_'+g.id}); const R=gtDoorRect(g,20), r=g.mramp;
    gtZone(g,R,()=>!!(r&&typeof p4RampSolid==='function'&&p4RampSolid(r))); g.door={x:R.x,y:R.y}; },
  sync(g,st){ if(!G||!G.found) return; const k='p4r_gate_'+g.id; if(st>=2) G.found[k]=true; else delete G.found[k]; },
  isIn:gtMesaIn,
  nudge:g=>S('Stairs of pale glass, too thin to hold you. Moonlight might make them solid.','Glass stairs. They need moonlight.')};
// ---- door kinds: a mesa with stairs up the way-in side, the stairs shut by the power's door at their foot
function gtDoorMesa(g){
  if(!g.wall){ g.rx=g.ry=g.r; g.door={x:g.x,y:g.y}; g.inside=null; return false; }
  gtMesa(g,{lvl:1,nofly:true}); g.stair=gtRamp(g,'stairs'); return true;
}
// the door piece's rect: across the foot of the stairs (or across `at` for wall:false, `w` long)
function gtDoorRect(g,thick){
  const f=g.wall?g.side.foot:[g.x,g.y], horiz=g.face==='s'||g.face==='n', L=g.wall?84:(g.place.w||96), T=thick||18;
  const cy=g.wall&&g.face==='s'?g.y+g.ry+g.side.depth+T/2+2:g.wall&&g.face==='n'?f[1]+8:f[1];
  const cx=g.wall&&g.face==='e'?g.x+g.rx+g.side.depth+T/2+4:g.wall&&g.face==='w'?g.x-g.rx-g.side.depth-T/2-4:f[0];
  return horiz?{x:cx,y:cy,w:L,h:T}:{x:cx,y:cy,w:T,h:L};
}
const gtDoorIn=(g,x,y)=>g.wall?gtOnMesa(g,x,y):false;
function gtP2Door(g,kind,extra){
  gtDoorMesa(g); const R=gtDoorRect(g,20);
  const o=p2Add(kind,Object.assign({id:'gate_'+g.id+'_d',x:R.x,y:R.y,w:R.w,h:R.h},extra||{}));
  gtColWrap(g,o.col); g.doorObj=o; g.door={x:R.x,y:R.y};
  gtZone(g,R,kind==='mothcurtain'?()=>P2.pass>0||p2CurtainOpen(o):()=>P2.pass>0);
}
// p2 curtains and bars vanish from the world while the gate is open for everyone
function gtP2Sync(g,st){ const o=g.doorObj; if(!o) return; if(st>=2) gtUnlist(o,LANDMARKS,P2.out); else gtList(o,LANDMARKS,P2.out); }
GTK.shadow_curtain={r:110,
  build(g){ gtP2Door(g,'mothcurtain'); }, sync:gtP2Sync, isIn:gtDoorIn,
  nudge:g=>S('Moths, thick as wool. They will not let anything solid through.','Moths! Nothing solid gets through.')};
GTK.thin_bars={r:110,
  build(g){ gtP2Door(g,'thinbars',{style:g.place.style2||'iron'}); }, sync:gtP2Sync, isIn:gtDoorIn,
  nudge:g=>S('The bars are far too close together. Only a shadow could slip between them.','Too narrow. Only a shadow fits.')};
GTK.ice_wall={r:110,
  build(g){ gtDoorMesa(g); const R=gtDoorRect(g,30);
    const o=p3Add('icewall',{id:'gate_'+g.id+'_d',x:R.x,y:R.y,w:R.w+6,h:R.h,hh:g.wall?58:64,then:()=>gtGot(g,2)});
    if(o.col) o.col.deep=true; g.doorObj=o; g.door={x:R.x,y:R.y}; gtZone(g,{x:R.x,y:R.y,w:R.w,h:R.h},()=>!!o.done); },
  sync(g,st){ const o=g.doorObj; if(!o) return; const open=st>=2;
    if(open&&!o.done){ o.done=true; o.mk=1; if(G&&G.found) G.found[o.id]=true; if(o.col) p3Uncol(o); }
    else if(!open&&o.done){ o.done=false; o.mk=0; o.heat=0; if(G&&G.found) delete G.found[o.id]; if(!o.col){ o.col=p3Col(o,null,{t:'r',x0:o.x-o.w/2,y0:o.y-o.h/2,x1:o.x+o.w/2,y1:o.y+o.h/2}); o.col.deep=true; } } },
  isIn:gtDoorIn};
GTK.bomb_rock={r:110,
  build(g){ gtDoorMesa(g); const R=gtDoorRect(g,20), rr=g.wall?40:Math.max(34,(g.place.w||80)/2);
    const o={id:'gate_'+g.id+'_d',x:R.x,y:R.y+(g.wall&&g.face==='s'?6:0),r:rr,gate:g.id}; o.k='e10boulder'; o.arms=true;
    LANDMARKS.push(o); ARMS.lm.push(o); g.doorObj=o; g.door={x:o.x,y:o.y};
    o.col=gtCol(g,{t:'c',x:o.x,y:o.y,r:rr});
    if(g.wall){ const B=gtDoorRect(g,16); gtCol(g,{t:'r',x0:B.x-B.w/2,y0:B.y-B.h/2,x1:B.x+B.w/2,y1:B.y+B.h/2}); gtZone(g,B); } else gtZone(g,{x:o.x,y:o.y,w:rr*1.6,h:rr*1.6}); },
  sync(g,st){ const o=g.doorObj; if(o&&G&&G.found){ if(st>=2) G.found[o.id]=true; else delete G.found[o.id]; } },
  isIn:gtDoorIn};
// a portcullis of iron bars (chain_ring, pound_plate): a deep collider, rises when the gate opens
function gtBars(g){ const R=gtDoorRect(g,16); const o={id:'gate_'+g.id+'_bars',x:R.x,y:R.y,w:R.w,h:R.h,horiz:R.w>=R.h,lift:0,gate:g.id};
  o.col=gtCol(g,{t:'r',x0:R.x-R.w/2,y0:R.y-R.h/2,x1:R.x+R.w/2,y1:R.y+R.h/2}); g.bars=o; g.door={x:R.x,y:R.y}; gtZone(g,R); return o; }
// a spot beside the door, on the ground (for a plate, a lever ring, a crack)
function gtBeside(g,d){ const f=g.wall?g.side.foot:[g.x,g.y], a=g.wall?g.side.along:(g.face==='s'||g.face==='n'?[1,0]:[0,1]), u=g.wall?g.side.out:GT_FACE[g.face]; return [f[0]-a[0]*d+u[0]*40,f[1]-a[1]*d+u[1]*40]; }
GTK.chain_ring={r:110,
  build(g){ gtDoorMesa(g); gtBars(g); const s=gtBeside(g,g.wall?96:80);
    const o={id:'gate_'+g.id+'_ring',x:s[0],y:s[1],h:26,need:1,done:false,strain:0,mode:'lever',flip:-1,gate:g.id,r:12}; o.k='e10ring'; o.arms=true;
    LANDMARKS.push(o); ARMS.lm.push(o); g.ring=o; addCol({t:'c',x:o.x,y:o.y,r:10,deep:true}); },
  sync(g,st){ if(g.ring) g.ring.done=st>=2; },
  isIn:gtDoorIn,
  nudge:g=>S('A heavy chain runs from the gate to a lever ring. Your claws cannot pull it. A whip might.','A chain ring. You need a whip.')};
GTK.pound_plate={r:110,
  build(g){ gtDoorMesa(g); gtBars(g); const s=gtBeside(g,g.wall?100:84);
    const o=p3Add('rplate',{id:'gate_'+g.id+'_plate',x:s[0],y:s[1],r:26,then:()=>gtGot(g,2)});
    o.p3k=Object.assign(Object.create(P3K.rplate),{bomb(q){ if(!q.done) p3Say(q.x,q.y-40,S('It shakes, but it wants a real stomp.','It needs a big stomp!'),'#ffe6b0','gplate'); }});
    g.plate=o; },
  sync(g,st){ const o=g.plate; if(!o) return; const v=st>=2; o.done=v; if(G&&G.found){ if(v) G.found[o.id]=true; else delete G.found[o.id]; } },
  isIn:gtDoorIn,
  nudge:g=>S('The gate is locked by the rune plate. It needs a big, hard stomp.','Stomp the plate!')};
GTK.cracked_floor={r:110,
  build(g){
    if(!g.wall){ const to=g.place.to; const o=p3Add('crackfloor',{id:'gate_'+g.id+'_crack',x:g.x,y:g.y,r:g.place.cr||54,to:to&&to.area?to:undefined,below:to&&!to.area?(()=>{ const q=gtPt(to); return {x:q.x,y:q.y}; })():undefined,then:()=>gtGot(g,2)}); g.crack=o; g.door={x:g.x,y:g.y}; return; }
    gtMesa(g,{lvl:1,nofly:true}); g.ledge=gtLedge(g);
    const f=g.side.foot, u=g.side.out, a=g.side.along, top=[g.x-a[0]*g.rx*0.45-u[0]*8,g.y-a[1]*g.ry*0.45-u[1]*8];
    g.hole={x:top[0],y:top[1]};
    const o=p3Add('crackfloor',{id:'gate_'+g.id+'_crack',x:f[0]+u[0]*58-a[0]*24,y:f[1]+u[1]*58-a[1]*24,r:54,below:{x:top[0]+a[0]*40,y:top[1]+a[1]*24+10},then:()=>gtGot(g,2)});
    g.crack=o; g.door={x:o.x,y:o.y}; },
  sync(g,st){ const o=g.crack; if(!o) return; const v=st>=2; o.done=v; o.brk=v?1:0; if(G&&G.found){ if(v) G.found[o.id]=true; else delete G.found[o.id]; } },
  isIn:gtMesaIn};
GTK.water={r:110,rmin:50,
  build(g){ gtIsland(g); }, sync(g,st){ if(g.water&&g.st!==st) gtDirtyArea(g.x,g.y,g.r+g.mw+40); },
  isIn:(g,x,y)=>gtOnIsland(g,x,y),
  nudge:g=>S('Too far to swim and too far to jump. If only you could walk on water.','Too far! Walk on water?')};
GTK.whip_hook={r:110,rmin:60,
  build(g){ gtIsland(g); g.water.rough=true; g.water.plank=-70; const u=GT_FACE[g.face], R=g.r, M=g.mw;
    // hook A on the island's near shore swings Ash in; hook B on the far bank swings him back out
    // (the whip catches a hook 160 to 220 px straight ahead: the near bank's edge is about M+46 px from hook A)
    const px=-u[1], py=u[0];
    g.hookA=armsAdd('whiphook',{id:'gate_'+g.id+'_ha',x:g.x+u[0]*(R-26),y:g.y+u[1]*(R-26),to:{x:g.x-u[0]*R*0.1+px*34,y:g.y-u[1]*R*0.1+py*34}});
    g.hookB=armsAdd('whiphook',{id:'gate_'+g.id+'_hb',x:g.x+u[0]*(R+M+34)-px*64,y:g.y+u[1]*(R+M+34)-py*64,to:{x:g.x+u[0]*(R+M+100)-px*64,y:g.y+u[1]*(R+M+100)-py*64}});
    g.door={x:g.x+u[0]*(R+M+20),y:g.y+u[1]*(R+M+20)}; },
  sync(g,st){ if(g.water&&g.st!==st) gtDirtyArea(g.x,g.y,g.r+g.mw+40); },
  isIn:(g,x,y)=>gtOnIsland(g,x,y),
  nudge:g=>S('The water runs far too fast. A hook post waits on the island, for something long that could catch it.','Fast water! A hook! You need a whip.')};
GTK.burrow_mound={r:90,rmin:60,rmax:200,
  build(g){ const R=g.r, x=g.x, y=g.y, T=18; g.rx=g.ry=R;
    if(!g.wall){ const horiz=g.face==='s'||g.face==='n', L=g.place.w||160, sb=horiz?[x-L/2-120,y-160,x+L/2+120,y+160]:[x-160,y-L/2-120,x+160,y+L/2+120]; g.sandBox=sb;
      p4Add('sandbed',{id:'gate_'+g.id+'_bed',x0:sb[0],y0:sb[1],x1:sb[2],y1:sb[3]}); GT.sand.push(sb);
      const o=p4Add('sandwall',{id:'gate_'+g.id+'_f',x,y,w:horiz?L:T,h:horiz?T:L,style:g.place.style2||'fence'}); o.col.deep=false; gtColWrap(g,o.col,true); g.fences={[g.face]:o};
      gtZone(g,{x,y,w:horiz?L:T,h:horiz?T:L}); g.door={x,y}; return; }
    const sb=[x-R-150,y-R-150,x+R+150,y+R+150]; g.sandBox=sb;
    p4Add('sandbed',{id:'gate_'+g.id+'_bed',x0:sb[0],y0:sb[1],x1:sb[2],y1:sb[3]});
    GT.sand.push(sb);
    g.fences={};
    const mk=(side,cx,cy,w2,h2)=>{ const o=p4Add('sandwall',{id:'gate_'+g.id+'_f'+side,x:cx,y:cy,w:w2,h:h2,style:'fence'}); o.col.deep=false; g.fences[side]=o; if(side===g.face) gtColWrap(g,o.col,true);
      gtZone(g,{x:cx,y:cy,w:w2,h:h2},null,side!==g.face); return o; };
    mk('n',x,y-R,2*R+T,T); mk('s',x,y+R,2*R+T,T); mk('w',x-R,y,T,2*R-T); mk('e',x+R,y,T,2*R-T);
    ELEV.clear({k:g.map,rect:[sb[0],sb[1],sb[2],sb[3]]});
    g.nofly=ELEV.noFly({k:g.map,disc:[x,y,R+200],why:S('Sand blows in your eyes. You cannot fly here.','Too sandy to fly.')});
    gtFlyWall(g,false,x,y,R+26,R+26);
    g.inside={x,y,r:Math.round(R*0.6)}; const u=GT_FACE[g.face]; g.door={x:x+u[0]*(R+70),y:y+u[1]*(R+70)};
    g.mound={x:x+u[0]*(R+60)+u[1]*40,y:y+u[1]*(R+60)-u[0]*40}; },
  sync(g,st){ const o=g.fences&&g.fences[g.face]; if(!o) return; if(st>=2) gtUnlist(o,LANDMARKS,P4.out); else gtList(o,LANDMARKS,P4.out); },
  isIn:(g,x,y)=>Math.abs(x-g.x)<g.r-12&&Math.abs(y-g.y)<g.r-12,
  nudge:g=>S('A fence sunk deep in the sand. You could go under it, if you could dig.','Dig under the fence?')};
GTK.fetch_spot={r:70,rmin:30,rmax:200,
  build(g){ const on=g.place.on==='water'?'water':'spire';
    const o={id:'gate_'+g.id+'_shiny',x:g.x,y:g.y,gate:g.id,on,h:on==='spire'?(g.place.h||86):10,got:false,ph:gtHash(g.id)%7}; o.k='e10shiny'; g.shiny=o;
    if(on==='water'){ gtAddWater(g,22,Math.max(70,g.r)); g.rx=g.ry=g.r; ELEV.clear({k:g.map,disc:[g.x,g.y,g.r+60]}); addCol({t:'c',x:g.x,y:g.y,r:20,deep:true}); }
    else { ELEV.clear({k:g.map,disc:[g.x,g.y,70]}); addCol({t:'c',x:g.x,y:g.y,r:24,deep:true}); }
    g.door={x:g.x,y:g.y+(on==='spire'?60:g.r+40)}; g.inside={x:g.x,y:g.y,r:10}; },
  sync(g,st){ if(g.shiny) g.shiny.got=st>=1; if(g.water&&g.st!==st) gtDirtyArea(g.x,g.y,g.r+40); },
  isIn:()=>false};

// ---------- 4. each frame: did Ash get in with the power, hints when he cannot, the state after a load
const GT_NUDGE_K={fetch_spot:0,climb_wall:1,grapple_post:1,vent:1,step_face:1,wind_ribbon:1,dive_spot:1,moon_glass:1,shadow_curtain:1,thin_bars:1,chain_ring:1,pound_plate:1,water:1,whip_hook:1,burrow_mound:1};
function gtTick(dt){
  if(!G||!player) return;
  if(GT.g!==G){ GT.g=G; GT.fetch=null; GT.syncT=0.05; gtSyncAll(); }
  if(GT.syncT>0){ GT.syncT-=dt; if(GT.syncT<=0) gtSyncAll(); }   // once more after the other modules' own load sync
  if(!GT.list.length||AREA||G.mode!=='story') return;
  const p=player, k=curMap(); GT.t+=dt; GT.dt=dt; GT.px=p.x; GT.py=p.y;
  for(const g of GT.list){
    if(g.map!==k) continue;
    if(Math.abs(p.x-g.x)>g.r+500||Math.abs(p.y-g.y)>g.r+500) continue;
    const st=gtSt(g.id); if(st!==g.st) gtSync(g);
    if(!st&&!p.flying&&gtIsIn(g,p.x,p.y)) gtGot(g,1);
    else if(!st&&g.hooks&&g.hooks.length&&gtSwinging()&&g.hooks.includes(ARMS.swing.h)) gtGot(g,1);
    else if(!st&&GT_NUDGE_K[g.kind]&&!gtHas(g.K.power)) gtNudge(g,p,dt);
  }
  gtFetchTick(dt);
}
// a short hint when Ash pushes at a gate he cannot pass yet (once in a while, never a wall of text)
function gtNudge(g,p,dt){
  const d=g.door; if(!d||p.dead||(p.z||0)>1) return;
  const near=dist(p.x,p.y,d.x,d.y)<(g.kind==='water'||g.kind==='whip_hook'?g.mw*0.5+70:80);
  const n=GT.nudgeT[g.id]||(GT.nudgeT[g.id]={push:0,last:-99});
  if(near&&p.moving){ n.push+=dt; } else n.push=Math.max(0,n.push-dt*2);
  if(n.push>0.7&&GT.t-n.last>8){ n.last=GT.t; n.push=0; const txt=g.place.locked?gtS(g.place.locked):g.D.nudge?g.D.nudge(g):null; if(txt) ftext(p.x,p.y-(p.z||0)-44,simplify(txt),'#ffe6b0',13); }
}
// (updatePools runs every frame of play, after Ash moves, even while a power's move has taken over his legs)
{ const base=updatePools; updatePools=function(dt){ base.apply(this,arguments); try{ gtTick(dt); }catch(e){ gtWarn('tick',String(e&&e.stack||e)); } }; }

// ---------- 5. new world pieces: a boulder only bombs break, a chain ring only the whip pulls (e6b's AK registry)
AK.e10boulder={hit(o,src,x,y,r){ if(gtSt(o.gate)>=2||!armsNear(o,x,y,r)) return false;
    if(src==='bomb'){ gtBreakBoulder(o); return true; }
    if(src==='hammer'||src==='sword'||src==='claws') armsNag(o,AT('Too big to break. A bomb might do it.','Too big. Try a bomb.'));
    return src!=='fire'&&src!=='whip'; },
  draw(o,t){ drawBoulder(o,t); }};
function gtBreakBoulder(o){
  const g=GT.by[o.gate]; if(!g) return;
  if(G&&G.found) G.found[o.id]=true;
  SFX.play('boom',0.8); shake(8); hitstop=Math.max(hitstop,0.05);
  emit(o.x,o.y,34,{col:'140,124,108',glow:false,smin:60,smax:280,lmin:.4,lmax:1,zmin:3,zmax:7,grow:3,drag:3});
  emit(o.x,o.y,14,{col:'90,80,70',glow:false,ang:-Math.PI/2,spread:1.2,smin:20,smax:80,lmin:.8,lmax:1.5,zmin:6,zmax:10,grow:10,drag:1,rise:15});
  setBanner(S('The boulder bursts!','The big rock breaks!'),'',1.8);
  gtGot(g,2);
}
AK.e10ring={hit(o,src,x,y,r){ if(o.done||!armsNear(o,x,y,r+6)) return false;
    if(src==='whip'){ gtPullRing(o); return true; }
    if(src!=='fire'&&src!=='bomb') armsNag(o,AT('It is bolted tight. Something long that can grab could pull it.','Pull it with a whip!'));
    return false; },
  draw(o,t){ gtDrawRing(o,t); }};
function gtPullRing(o){
  const g=GT.by[o.gate]; if(!g) return; o.done=true; o.pullT=0.01;
  try{ p2Snd('clunk'); p2Snd('snap',0.6); }catch(e){ SFX.play('chest'); }
  shake(4); setBanner(S('Clank! The gate rises!','The gate goes up!'),'',1.8);
  gtGot(g,2);
}

// ---------- 6. drawing: the portcullis, the lever ring, the shiny thing, the sand pen, planks, the tunnel hole
const GSPR=new Map();
function gtSpr(key,w,h,draw){
  const k=key+(LOOK.sb?'|sb':''); let c=GSPR.get(k); if(c) return c;
  const pad=8, cv=mkCanvas(Math.ceil((w+pad*2)*2),Math.ceil((h+pad*2)*2)), g=cv.getContext('2d'); g.scale(2,2); g.translate(pad+w/2,pad+h); g.lineJoin='round'; g.lineCap='round';
  try{ draw(g); }catch(e){ console.error(e); }
  c=outlineSprite(cv,SBC.outline,sbOW(Math.max(w,h)/2),{scale:2}); c.ox=pad+w/2; c.oy=pad+h; c.ww=w+pad*2; c.hh=h+pad*2; GSPR.set(k,c); return c;
}
const gtPut=(sp,x,y,a)=>{ if(a!=null&&a<1) ctx.globalAlpha=a; ctx.drawImage(sp,x-sp.ox,y-sp.oy,sp.ww,sp.hh); if(a!=null&&a<1) ctx.globalAlpha=1; };
function gtHash(s){ let h=7; s=String(s); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }
// the iron portcullis: two stone posts and a grid of bars (east-west); a north-south one is drawn as a short side view
function gtBarsSprite(L,horiz){
  return gtSpr('gbars_'+L+(horiz?'h':'v'),horiz?L+16:30,horiz?66:L*0.62+60,g=>{
    if(horiz){ const H=56;
      g.fillStyle='#4a4e5c'; for(let i=0;i<=6;i++){ const x=-L/2+6+i*(L-12)/6; g.fillRect(x-2.6,-H,5.2,H-2); }
      g.fillStyle='#6a7080'; for(let i=0;i<=6;i++){ const x=-L/2+6+i*(L-12)/6; g.fillRect(x-1.2,-H,1.6,H-4); }
      g.fillStyle='#3c404c'; g.fillRect(-L/2+2,-H*0.62,L-4,5); g.fillRect(-L/2+2,-H*0.25,L-4,5);
      g.fillStyle='#8a90a0'; g.fillRect(-L/2+2,-H*0.62,L-4,1.6); g.fillRect(-L/2+2,-H*0.25,L-4,1.6);
      g.fillStyle='#ffffff'; for(let i=0;i<=6;i++){ const x=-L/2+6+i*(L-12)/6; g.beginPath(); g.moveTo(x-3,-2); g.lineTo(x,4); g.lineTo(x+3,-2); g.fill(); }
      for(const s of [-1,1]){ const x=s*(L/2+4); g.fillStyle='#8a7c6e'; rrect(g,x-8,-H-10,16,H+10,3); g.fill(); g.fillStyle='#a6978a'; g.fillRect(x-8,-H-10,16,4); g.fillStyle='#5e5249'; g.fillRect(x+3,-H-6,5,H+4); }
    } else { const H=L*0.62;
      g.fillStyle='#4a4e5c'; for(let i=0;i<=5;i++){ const yy=-6-i*(H-6)/5; g.fillRect(-3,yy-48,6,48); }
      g.fillStyle='#6a7080'; g.fillRect(-1,-H-48,2,H+40);
      g.fillStyle='#8a7c6e'; rrect(g,-9,-H-58,18,14,3); g.fill(); rrect(g,-9,-14,18,14,3); g.fill(); }
  });
}
function gtDrawBars(o,t){
  const st=gtSt(o.gate); o.lift+=((st>=2?1:0)-o.lift)*Math.min(1,GT.dt*3);
  if(o.lift>0.98) return;
  const L=o.horiz?o.w:o.h, sp=gtBarsSprite(Math.round(L),o.horiz);
  ctx.fillStyle='rgba(40,24,40,.25)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+o.h/2-2,(o.horiz?o.w:o.w+10)*0.55,7,0,0,TAU); ctx.fill();
  if(o.lift>0.01){ ctx.save(); ctx.beginPath(); ctx.rect(o.x-L,o.y-140,L*2,140+o.h/2+2-o.lift*0); ctx.clip(); gtPut(sp,o.x,o.y+o.h/2-o.lift*54); ctx.restore(); }
  else gtPut(sp,o.x,o.y+o.h/2);
}
// a lever post with a big iron ring on a chain (like p2's chain rings); the whip yanks it down
function gtDrawRing(o,t){
  if(typeof p2DrawChainRing==='function'){ const q={x:o.x,y:o.y,h:o.h,done:o.done,strain:0,need:1,mode:'lever',flip:o.flip}; try{ p2DrawChainRing(q,t); }catch(e){} }
  if(!o.done&&gtHas('whip')){ const p=player; if(p&&dist2(p.x,p.y,o.x,o.y)<260*260) glowAt(o.x,o.y-o.h,12,'255,220,140',0.22+0.12*Math.sin(t*4)); }
}
// the shiny thing: a little gold glint on a rock spire, or on a stone in a pond; a kid must notice it
function gtSpireSprite(h){
  return gtSpr('gspire_'+h,58,h+14,g=>{
    g.fillStyle='rgba(40,24,40,.22)'; g.beginPath(); g.ellipse(4,-2,30,9,0,0,TAU); g.fill();
    const body=()=>{ g.beginPath(); g.moveTo(-24,-2); g.quadraticCurveTo(-20,-h*0.45,-12,-h*0.8); g.lineTo(-8,-h); g.quadraticCurveTo(0,-h-8,9,-h+1); g.lineTo(13,-h*0.78); g.quadraticCurveTo(20,-h*0.4,25,-2); g.quadraticCurveTo(0,6,-24,-2); g.closePath(); };
    body(); g.fillStyle='#8a7c6e'; g.fill(); g.save(); body(); g.clip();
    g.fillStyle='#a6978a'; g.fillRect(-26,-h-10,18,h+14); g.fillStyle='#5e5249'; g.fillRect(8,-h-10,20,h+14);
    g.strokeStyle='rgba(43,36,32,.5)'; g.lineWidth=1.6; for(let i=1;i<5;i++){ const yy=-h*i/5; g.beginPath(); g.moveTo(-20,yy+3); g.lineTo(-4,yy); g.lineTo(6,yy+4); g.stroke(); }
    g.restore(); g.fillStyle='#ecdfcc'; g.beginPath(); g.ellipse(0,-h,11,4,0,0,TAU); g.fill();
    g.fillStyle='#78b048'; g.beginPath(); g.ellipse(-16,-3,8,4,0,0,TAU); g.ellipse(17,-2,7,3.5,0,0,TAU); g.fill();
  });
}
function gtShinySprite(){
  return gtSpr('gshiny',26,22,g=>{
    g.fillStyle='#c8902a'; g.beginPath(); g.ellipse(0,-8,10,7,0,0,TAU); g.fill();
    g.fillStyle='#ffd24a'; g.beginPath(); g.ellipse(-1,-9.5,8,5.4,0,0,TAU); g.fill();
    g.fillStyle='#fff6c8'; g.beginPath(); g.ellipse(-3.5,-11.5,3,1.8,-0.4,0,TAU); g.fill();
    g.strokeStyle='#8a5a12'; g.lineWidth=1.2; g.beginPath(); g.arc(0,-8,4.6,0.3,2.6); g.stroke();
  });
}
function gtDrawShiny(o,t){
  if(o.got&&!o.carry) { if(o.on==='spire') gtPut(gtSpireSprite(o.h),o.x,o.y); return; }
  const top=o.on==='spire'?o.y-o.h:o.y-6;
  if(o.on==='spire') gtPut(gtSpireSprite(o.h),o.x,o.y);
  else { ctx.fillStyle='#7a6e64'; ctx.strokeStyle=SBC.outline; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(o.x,o.y-2,20,9,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#9a8e82'; ctx.beginPath(); ctx.ellipse(o.x-3,o.y-4,13,5,0,0,TAU); ctx.fill(); }
  if(o.carry) return;
  const bob=Math.sin(t*2.2+o.ph)*1.5;
  ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,top-8+bob,26+4*Math.sin(t*3+o.ph),'255,214,110',0.32); ctx.restore();
  gtPut(gtShinySprite(),o.x,top+2+bob);
  // twinkles: a four-point star that grows and fades, so it catches the eye from across the screen
  for(let i=0;i<2;i++){ const ph=(t*0.9+o.ph*0.37+i*0.5)%1, a=Math.sin(ph*Math.PI), s=4+a*7, sx=o.x+(i?9:-7), sy=top-14+bob-(i?2:6);
    ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#fffbe6'; ctx.beginPath(); ctx.moveTo(sx,sy-s); ctx.lineTo(sx+1.4,sy-1.4); ctx.lineTo(sx+s,sy); ctx.lineTo(sx+1.4,sy+1.4); ctx.lineTo(sx,sy+s); ctx.lineTo(sx-1.4,sy+1.4); ctx.lineTo(sx-s,sy); ctx.lineTo(sx-1.4,sy-1.4); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
// flat things under everyone: the sand pen, the dirt mound, the tunnel hole, the planks over a moat
function gtDrawGround(t){
  if(!G||AREA||!GT.list.length) return; const k=curMap();
  for(const g of GT.list){ if(g.map!==k||!inView(g.x,g.y,g.r+260)) continue;
    if(g.kind==='burrow_mound') gtDrawSand(g,t);
    else if(g.kind==='cracked_floor'&&g.hole) gtDrawHole(g.hole.x,g.hole.y,gtSt(g.id)>=2);
    if(g.water&&g.water.rough) gtDrawRapids(g,t);
    if(g.water&&g.water.r0&&gtSt(g.id)>=2) gtDrawPlanks(g);
  }
}
function gtDrawSand(g,t){
  const b=g.sandBox, cx=(b[0]+b[2])/2, cy=(b[1]+b[3])/2, rx=(b[2]-b[0])/2, ry=(b[3]-b[1])/2;
  const sp=gtSpr('gsand_'+Math.round(rx)+'_'+Math.round(ry),rx*2,ry*2,q=>{ q.translate(0,-ry);
    const gr=q.createRadialGradient(0,0,Math.min(rx,ry)*0.4,0,0,Math.max(rx,ry)); gr.addColorStop(0,'rgba(236,212,150,1)'); gr.addColorStop(0.72,'rgba(230,204,140,.95)'); gr.addColorStop(1,'rgba(230,204,140,0)');
    q.fillStyle=gr; q.beginPath(); q.ellipse(0,0,rx,ry,0,0,TAU); q.fill();
    q.strokeStyle='rgba(176,140,80,.45)'; q.lineWidth=1.6; const rng=mulberry32(gtHash(g.id));
    for(let i=0;i<26;i++){ const x=(rng()-0.5)*rx*1.5, y=(rng()-0.5)*ry*1.5; q.beginPath(); q.moveTo(x-10,y); q.quadraticCurveTo(x,y-4,x+10,y); q.stroke(); } });
  ctx.drawImage(sp,cx-sp.ox,cy+ry-sp.oy,sp.ww,sp.hh);
  const m=g.mound; if(m&&gtSt(g.id)<2){ ctx.fillStyle='#b8925a'; ctx.strokeStyle='rgba(90,60,30,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(m.x,m.y,26,12,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#3a2414'; ctx.beginPath(); ctx.ellipse(m.x,m.y-2,9,5,0,0,TAU); ctx.fill(); ctx.fillStyle='#d8b878'; ctx.beginPath(); ctx.ellipse(m.x-8,m.y-6,8,3,-0.2,0,TAU); ctx.fill(); }
}
function gtDrawHole(x,y,open){ ctx.fillStyle='rgba(20,14,26,.92)'; ctx.beginPath(); ctx.ellipse(x,y,22,12,0,0,TAU); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=2.2; ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.08)'; ctx.beginPath(); ctx.ellipse(x,y-3,15,4,0,Math.PI,TAU); ctx.fill(); if(!open){ ctx.strokeStyle='rgba(120,100,80,.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-16,y-6); ctx.lineTo(x+16,y+6); ctx.moveTo(x-16,y+6); ctx.lineTo(x+16,y-6); ctx.stroke(); } }
// white water racing round a whip island: curved foam streaks that flow along the moat
function gtDrawRapids(g,t){
  const w=g.water, n=26, rm=(w.r0+w.r1)/2, half=(w.r1-w.r0)/2;
  ctx.save(); ctx.lineCap='round';
  for(let i=0;i<n;i++){ const lane=((i*7)%5)/4-0.5, rr=rm+lane*half*1.1, sp=0.5+((i*3)%4)*0.12, a=(i/n)*TAU+t*sp*(1.1-((i%2)*0.3)), L=0.16+((i*5)%3)*0.05;
    const al=0.35+0.3*Math.sin(t*3+i);
    ctx.strokeStyle=`rgba(255,255,255,${al})`; ctx.lineWidth=2.6-((i%3)*0.5);
    ctx.beginPath(); ctx.arc(w.x,w.y,rr,a,a+L); ctx.stroke(); }
  ctx.restore();
}
function gtDrawPlanks(g){
  const u=GT_FACE[g.face], w=g.water, a0=w.r0-34, a1=w.r1+34, px=-u[1], py=u[0], ox=w.x-px*(w.plank||0), oy=w.y-py*(w.plank||0);
  ctx.save(); ctx.lineCap='butt';
  for(let s=a0;s<a1;s+=13){ const cx=ox+u[0]*s, cy=oy+u[1]*s; ctx.strokeStyle=SBC.outline; ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(cx-px*26,cy-py*26); ctx.lineTo(cx+px*26,cy+py*26); ctx.stroke(); ctx.strokeStyle=(Math.round(s/13)%2)?'#a87a4a':'#b88a56'; ctx.lineWidth=9; ctx.stroke(); }
  ctx.strokeStyle='#6a4a2a'; ctx.lineWidth=3; for(const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(ox+u[0]*a0+px*24*sd,oy+u[1]*a0+py*24*sd); ctx.lineTo(ox+u[0]*a1+px*24*sd,oy+u[1]*a1+py*24*sd); ctx.stroke(); }
  ctx.restore();
}
{ const base=drawPools; drawPools=function(){ base.apply(this,arguments); try{ gtDrawGround(G?G.time:0); }catch(e){ gtWarn('ground',String(e)); } }; }
// standing things sort with the figures
{ const base=eventsForRender; eventsForRender=function(list){
    base(list); if(!G||AREA||!GT.list.length) return; const k=curMap(), t=G.time;
    for(const g of GT.list){ if(g.map!==k||!inView(g.x,g.y,g.r+260)) continue;
      const b=g.bars; if(b) list.push({x:b.x,y:b.y+b.h/2,r:6,flying:true,draw:()=>gtDrawBars(b,t)});
      const s=g.shiny; if(s) list.push({x:s.x,y:s.y+(s.on==='spire'?4:-2),r:6,flying:true,draw:()=>gtDrawShiny(s,t)});
    }
  }; }

// ---------- 7. Pip's Fetch
// GT.fetch = {g, o, ph:'go'|'grab'|'back', t}: Pip flies to the shiny thing, grabs it, brings it back, and the gate's
// payoff is the engine's (storyEmit('gate_open:<id>') and the place's onOpen), plus `give` if the place names one.
function gtFetchSpots(){ const k=curMap(); return GT.list.filter(g=>g.kind==='fetch_spot'&&g.map===k&&g.shiny&&!g.shiny.got); }
function gtFetchLookAt(p){
  let best=null, bs=1e9;
  for(const g of gtFetchSpots()){ const o=g.shiny, d=dist(p.x,p.y,o.x,o.y); if(d>340||d<20) continue;
    const da=Math.abs(angDiff(p.facing,angTo(p.x,p.y,o.x,o.y))); if(da>0.85&&d>90) continue;
    const sc=d/340+da*0.6; if(sc<bs){ bs=sc; best=g; } }
  return best;
}
{ const base=updateInteractions; updateInteractions=function(dt){
    base(dt); if(!G||AREA||!player||GT.fetch||G.prompt||G.mode!=='story'||player.flying) return;
    const g=gtFetchLookAt(player); if(!g) return; const o=g.shiny, can=gtHas('fetch');
    G.prompt={text:can?S('Pip, fetch!','Pip, fetch!'):S('Look at the shiny thing','Look at it'),act:()=>gtFetchAct(g),x:o.x,y:o.y-(o.on==='spire'?o.h:6)-14,always:true,kind:can?'use':'look'};
  }; }
function gtFetchAct(g){
  const o=g.shiny; if(!o||o.got) return;
  if(gtHas('fetch')){ GT.fetch={g,o,ph:'go',t:0}; try{ bubble(G.pip,'Mip!',{kind:'pip',dy:-22}); csfx('chirp'); }catch(e){} return; }
  const where=o.on==='spire'?S('way up on top of the rock','up on the rock'):S('out in the water','in the water');
  const line=G.flags&&G.flags.pip?S(`Something shiny, ${where}. Pip stares at it. Pip does not know how to fetch yet.`,`Something shiny. Pip does not know how to fetch yet.`):S(`Something small and shiny, ${where}. Far out of reach. Something little with wings could get it.`,`Something shiny. Too far. A little flier could get it.`);
  runDialogue([['narr',line]],()=>{ scene='play'; });
}
function gtFetchTick(dt){
  const F=GT.fetch; if(!F) return; const q=G.pip;
  if(!q||AREA){ GT.fetch=null; if(F.o) F.o.carry=false; return; }
  F.t+=dt;
  if(F.ph==='grab'&&F.t>0.35){ F.ph='back'; F.t=0; F.o.carry=true; F.o.got=true; try{ csfx('chirp'); }catch(e){} SFX.play('pickup',0.6); }
  if(F.ph==='back'&&dist(q.x,q.y,player.x,player.y)<60){ GT.fetch=null; F.o.carry=false; gtFetchDone(F.g); }
  if(F.t>8){ GT.fetch=null; F.o.carry=false; if(F.ph!=='back') return; gtFetchDone(F.g); }
}
function gtFetchDone(g){
  const o=g.shiny; o.got=true; SFX.play('chest');
  emit(player.x,player.y-20,18,{col:'255,214,110',smin:30,smax:120,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
  try{ bubble(G.pip,'Mip mip!',{kind:'pip',dy:-22}); }catch(e){}
  const give=g.place.give; if(give){ try{ if(typeof give==='string'){ const m=give.match(/^coins\s+(\d+)$/); if(m) addCoins(+m[1],player.x,player.y); else giveItems({[give]:1}); } }catch(e){ console.error(e); } }
  gtGot(g,1);
}
// Pip's path while he fetches (the companion code asks pipExtras where he should fly)
{ const base=pipExtras; pipExtras=function(q,dt,tgt){
    const F=GT.fetch; if(!F) return base(q,dt,tgt);
    const o=F.o, top={x:o.x,y:o.y-(o.on==='spire'?o.h:6)+4};
    if(F.ph==='go'){ if(dist(q.x,q.y,top.x,top.y)<16){ F.ph='grab'; F.t=0; } return top; }
    if(F.ph==='grab') return {x:top.x+Math.sin(F.t*30)*2,y:top.y};
    return {x:player.x,y:player.y-6};
  }; }
// the end of a gate's wind ribbon without wings: land on the stream's end (on the rock), not a long glide past it
{ const base=p3RideOff; p3RideOff=function(p,how){
    const R=P3.ride, o=R&&R.o; base(p,how);
    if(o&&o.gate&&how==='end'&&!AREA&&!(hasAbil('wings')&&G.mode==='story')){ const e=o.pts[o.pts.length-1]; P3.mv={kind:'land',x0:p.x,y0:p.y,x1:e[0],y1:e[1],z0:p.z||52,t:0,dur:0.34}; p.flying=false; p.gliding=false; }
  }; }
// the shiny thing rides under Pip on the way back
{ const base=drawPip; drawPip=function(q){ base(q); const F=GT.fetch; if(F&&F.ph==='back'&&q===G.pip){ const t=q.t||0, alt=8+Math.sin(t*5)*3; gtPut(gtShinySprite(),q.x,q.y-alt*0.4+14); } }; }

// ---------- 8. art hooks for story data: looks (props) and poses (people)
// defineLook(id,{w,h,draw(g,x,y,t,state),anim:false,live(g,x,y,t,state),outline:true}): (x,y) is the place's spot:
// for a prop the foot (bottom middle, the look fits in w x h above it), for a Case Book icon ('icon_...') the centre.
// A static look (anim false, the default) is drawn ONCE per state into a cached canvas at 2x (with the Storybook outline
// when that look is on), trimmed to what was drawn, and blitted each frame; `live` is drawn on top every frame (glows, a
// blinking eye). anim:true draws `draw` every frame (keep those few and cheap). A look may also be a plain function.
const LOOKS={}, POSES={}, LOOKC=new Map();
function defineLook(id,def){
  if(!id||!def){ gtWarn('look:bad','defineLook needs an id and a definition'); return null; }
  const L=Object.assign({w:48,h:48,anim:false,outline:true},typeof def==='function'?{draw:def}:def);
  if(typeof L.draw!=='function'){ gtWarn('look:fn:'+id,'defineLook '+id+': draw must be a function'); return null; }
  LOOKS[id]=L; for(const k of [...LOOKC.keys()]) if(k.startsWith(id+'|')) LOOKC.delete(k);
  return L;
}
function lookHas(id){ return !!LOOKS[id]; }
function lookSize(id){ const L=LOOKS[id]; return L?{w:L.w,h:L.h}:{w:44,h:44}; }
// the cached canvas: drawn with room on every side of the spot (any anchor works), then trimmed to its pixels
function gtLookSprite(id,L,state){
  const key=id+'|'+(state==null?'':state)+(LOOK.sb?'|sb':''); let c=LOOKC.get(key); if(c) return c;
  const pad=10, W=Math.ceil(L.w*2+pad*2), H=Math.ceil(L.h*2+pad*2), cx=W/2, cy=H/2+L.h*0.25;
  const cv=mkCanvas(W*2,H*2), g=cv.getContext('2d'); g.scale(2,2); g.lineJoin='round'; g.lineCap='round';
  L.draw(g,cx,cy,0,state);
  let out=L.outline===false?cv:outlineSprite(cv,SBC.outline,sbOW(Math.max(L.w,L.h)/2),{scale:2});
  let x0=0,y0=0,x1=out.width,y1=out.height;
  try{ const d=out.getContext('2d').getImageData(0,0,out.width,out.height).data, w=out.width; x0=1e9; y0=1e9; x1=-1; y1=-1;
    for(let j=0;j<out.height;j++) for(let i=0;i<w;i++) if(d[(j*w+i)*4+3]>4){ if(i<x0) x0=i; if(i>x1) x1=i; if(j<y0) y0=j; if(j>y1) y1=j; }
    if(x1<0){ x0=y0=0; x1=y1=1; } x0=Math.max(0,x0-2); y0=Math.max(0,y0-2); x1=Math.min(out.width,x1+3); y1=Math.min(out.height,y1+3); }catch(e){}
  c=mkCanvas(x1-x0,y1-y0); c.getContext('2d').drawImage(out,-x0,-y0);
  c.ox=cx-x0/2; c.oy=cy-y0/2; c.ww=(x1-x0)/2; c.hh=(y1-y0)/2;
  if(LOOKC.size>600) LOOKC.clear(); LOOKC.set(key,c); return c;
}
// lookDraw(id,g,x,y,t,state); the engine's order lookDraw(g,id,x,y,t,state) works too. false when there is no look
function lookDraw(a,b,x,y,t,state){
  let id=a, g=b; if(typeof a!=='string'&&typeof b==='string'){ id=b; g=a; }
  g=g||ctx; const L=LOOKS[id];
  if(!L){ gtWarn('look?'+id,'no look "'+id+'" (defineLook it in a v10_art file); drawing a placeholder'); gtPlaceholder(g,x,y,id); return false; }
  try{
    if(L.anim) L.draw(g,x,y,t||0,state);
    else { const sp=gtLookSprite(id,L,state); g.drawImage(sp,x-sp.ox,y-sp.oy,sp.ww,sp.hh); }
    if(L.live) L.live(g,x,y,t||0,state);
  }catch(e){ gtWarn('lookerr:'+id,'look "'+id+'" failed: '+(e&&e.message)); gtPlaceholder(g,x,y,id); return false; }
  return true;
}
// a visible placeholder: a dashed magenta box with the id in it, so a missing look is obvious in a screenshot
function gtPlaceholder(g,x,y,id){
  g=g||ctx; const s=String(id), w=Math.max(44,Math.min(150,s.length*6.4+12)), h=40;
  g.save(); g.setLineDash([5,4]); g.lineWidth=2; g.strokeStyle='#ff3ad0'; g.fillStyle='rgba(255,58,208,.14)';
  g.fillRect(x-w/2,y-h,w,h); g.strokeRect(x-w/2,y-h,w,h); g.setLineDash([]);
  g.fillStyle='#ffffff'; g.strokeStyle='#3b2233'; g.lineWidth=3; g.font='bold 10px '+(typeof UIF!=='undefined'?UIF:'sans-serif'); g.textAlign='center'; g.textBaseline='middle';
  g.strokeText(s,x,y-h/2); g.fillText(s,x,y-h/2); g.restore();
}
// definePose(npcId,pose,draw(g,x,y,t)) or definePose(npcId,pose,{w,h,draw,still:true}): a pose replaces the person's
// normal figure while a scene asks for it ({anim:[npcId,pose]}); (x,y) is their feet. Poses are drawn every frame
// (people move); `still:true` caches it like a look.
function definePose(npcId,pose,def){
  if(!npcId||!pose||!def){ gtWarn('pose:bad','definePose needs an npc id, a pose name and a draw function'); return null; }
  const P=typeof def==='function'?{draw:def}:Object.assign({w:48,h:72},def);
  if(typeof P.draw!=='function'){ gtWarn('pose:fn:'+npcId+pose,'definePose '+npcId+' '+pose+': draw must be a function'); return null; }
  (POSES[npcId]||(POSES[npcId]={}))[pose]=P;
  if(P.still) defineLook('pose:'+npcId+':'+pose,{w:P.w,h:P.h,draw:(g,x,y,t)=>P.draw(g,x,y,t)});
  P.fn=(g,x,y,t)=>poseDraw(npcId,pose,g,x,y,t);
  return P;
}
function poseHas(npcId,pose){ return !!(POSES[npcId]&&POSES[npcId][pose]); }
// the engine asks for the drawing function: poseGet(npcId,pose) -> f(g,x,y,t) or null
function poseGet(npcId,pose){ const P=POSES[npcId]&&POSES[npcId][pose]; return P?P.fn:null; }
// poseDraw(npcId,pose,g,x,y,t): false when there is no such pose (the engine then draws the person as usual)
function poseDraw(npcId,pose,g,x,y,t){
  const P=POSES[npcId]&&POSES[npcId][pose];
  if(!P){ gtWarn('pose?'+npcId+':'+pose,'no pose "'+pose+'" for '+npcId+' (definePose it in a v10_art file)'); return false; }
  try{ if(P.still) return lookDraw('pose:'+npcId+':'+pose,g||ctx,x,y,t); P.draw(g||ctx,x,y,t||0); }
  catch(e){ gtWarn('poseerr:'+npcId+pose,'pose '+npcId+' '+pose+' failed: '+(e&&e.message)); return false; }
  return true;
}

// ---------- 9. debug and tests
window.__ebGate=Object.assign(window.__ebGate||{},{
  build:gateBuild, open:gateOpen, close:gateClose, isOpen:gateIsOpen, kinds:gateKinds, opensWith:gateOpensWith, info:gateInfo, inside:gateInside,
  list:()=>GT.list.map(g=>gateInfo(g.id)), has:gtHas, st:gtSt, fetch:()=>GT.fetch?{id:GT.fetch.g.id,ph:GT.fetch.ph}:null,
  looks:()=>Object.keys(LOOKS), poses:()=>Object.keys(POSES).map(k=>k+':'+Object.keys(POSES[k]).join(',')), lookDraw, poseDraw, defineLook, definePose,
  raw:id=>GT.by[id], waterAt:(x,y)=>!!gtWaterAt(x,y), sync:gtSyncAll, set:gateSet, poseGet, lookHas, lookSize
});
