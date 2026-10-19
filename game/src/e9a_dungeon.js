// ================= e9a_dungeon: the dungeon engine (v9, wave 1)
// Builds on the room-grid caves (a2f_caves.js) and Ember's Trials (a2h_dungeons.js). Every Trial cell and object works in
// any cave now; this module adds what the bigger dungeons need: several floors per dungeon (stairs, falling through a
// cracked floor), raised floors with ledges and stairs inside a room, dungeon items (Dungeon Map, Compass, Boss Key and the
// big boss door, Heart Embers), a small-key counter, a room minimap, a dungeon page on the map screen, puzzle music, and a
// library of mechanics: living roots and lantern-pods, spore pods for dark rooms, a whole-dungeon water level set by tide
// crystals (basins, terraces, rafts), mirrors and light beams onto crystal targets, mine carts on rails with switch points,
// Oath guards with lantern vision cones, conveyor belts, moving platforms, timed, one-way and plate doors, colour step
// tiles and grapple posts. The how-to for new dungeons is scratchpad/DUNGEON.md.

// ---------- 1. cell types and template letters
Object.assign(TY,{crack:13,drop:14,high:15,ledge:16,ramp:17,basin0:18,terrace:19,raft:20,raft2:21,belt:22,rail:23,railpit:24,tileP:25,tileB:26,tileG:27});
Object.assign(TY_CH,{'%':13,'0':14,'=':15,'_':16,'/':17,a:18,z:19,x:20,y:21,'6':22,'7':22,'8':22,'9':22,'-':23,'|':23,'+':23,t:24,'!':25,'$':26,';':27});
Object.assign(TY_FLOW,{'6':0,'7':1,'8':2,'9':3});
TY_KEEP['+']=1;   // a switch point is a rail cell and a mark
const DTY=TY;     // short name inside this module
const isRail=t=>t===DTY.rail||t===DTY.railpit;
const isRaised=t=>t===DTY.high||t===DTY.ledge;
const isTile=t=>t===DTY.tileP||t===DTY.tileB||t===DTY.tileG;
const TILE_COL={[TY.tileP]:'pink',[TY.tileB]:'blue',[TY.tileG]:'gold'};
const TILE_RGB={pink:'255,120,180',blue:'110,170,255',gold:'255,214,110'};
Object.assign(PUZZLE_KINDS,{switches:1,eyes:1,spores:1,beam:1,tiles:1,rails:1,pods:1,tide:1,stealth:1,plates:1});
Object.assign(SEAL_KINDS,{spores:1,beam:1,tiles:1});
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]], DIRN={n:0,e:1,s:2,w:3};
const LVL_NAME=[S('low','low'),S('middle','middle'),S('high','high')];

// ---------- 2. the registry
// defineDungeon(id, def) turns a CAVEMAP entry (one floor) or a list of floors into a dungeon. Every floor is an area
// (AREADEFS) of its own; they share one coordinate system, one save prefix and one set of keys. See DUNGEON.md.
function defineDungeon(id,o){
  o=o||{};
  const base=AREADEFS[id]||{}, save=o.save||id;
  const floors=o.floors||[{id:'1',name:o.floorName||'',map:CAVEMAP[id]||{rooms:o.rooms,links:o.links}}];
  const D=DUNGEONS[id]=Object.assign({},DUNGEONS[id]||{},o,{id,save,floorIds:[]});
  floors.forEach((F,i)=>{
    const aid=i===0?id:(F.area||`${id}_${F.id}`);
    const map=F.map||CAVEMAP[aid]||{rooms:F.rooms,links:F.links||[]};
    CAVEMAP[aid]=map;
    defCave(aid,Object.assign({},i===0?base:{},i===0?o.area||{}:{},{
      name:o.name||base.name||id, level:o.level||base.level||1, theme:o.theme||base.theme||'earth', seed:(o.seed||base.seed||7)+i*101,
      dark:F.dark!=null?F.dark:o.dark!=null?o.dark:base.dark!=null?base.dark:0.74, canFly:o.canFly||base.canFly,
      dun:id, floor:F.id, floorIdx:i, floorName:F.name||'', sid:i===0?save:`${save}_${F.id}`, dsid:save, noJuniper:o.noJuniper||base.noJuniper,
      dunKind:o.dunKind||base.dunKind}));
    D.floorIds.push(aid);
  });
  if(o.style) CAVE_STYLE[D.theme||base.theme]=o.style;
  if(o.decor) CAVE_DECOR[D.theme||base.theme]=o.decor;
  if(o.pal) TPAL[D.theme||base.theme]=o.pal;
  if(o.story) for(const k in o.story) STORY['trial_'+id+'_'+k]=o.story[k];
  // a dungeon with a gift shrine or a great chest needs these lines; give it plain ones if it has none
  if(D.abil){ STORY['trial_'+id+'_gift']=STORY['trial_'+id+'_gift']||[['narr',S('The flame leaps into you. Something new wakes up.','The flame jumps into you. You feel new.')]]; STORY['trial_'+id+'_how']=STORY['trial_'+id+'_how']||''; }
  STORY['trial_'+id+'_item']=STORY['trial_'+id+'_item']||[['narr',S('Inside the great chest: something wonderful.','A great chest. Something good inside!')]];
  STORY['trial_'+id+'_itemhow']=STORY['trial_'+id+'_itemhow']||'';
  CAVE_SECRETS=countCaveSecrets();
  return D;
}
// a palette for one look (CAVE_STYLE, CAVE_DECOR, TPAL), so a dungeon can share a theme with others
function defineDungeonTheme(theme,o){ if(o.style) CAVE_STYLE[theme]=o.style; if(o.decor) CAVE_DECOR[theme]=o.decor; if(o.pal) TPAL[theme]=o.pal; if(o.music) DUN_MUSIC[theme]=o.music; }
const DUN_MUSIC={};
const dunOfArea=A=>A&&A.def&&DUNGEONS[dunRoot(A.def.id)]||null;
function dunFloorList(id){ const D=DUNGEONS[id]; return D?D.floorIds:[id]; }
// Trial floors for the cave looks (painted under pits, water, spikes and chasms when a cave uses those cells)
for(const th of ['earth','crystal','mine','bog','ice','ember']){
  if(TPAL[th]) continue; const s=CAVE_STYLE[th];
  TPAL[th]={tile:[s.floor,s.floor2,s.floor,s.floor2],grout:'rgba(0,0,0,.25)',moss:hexRGB(s.accent).join(','),rune:hexRGB(s.edge).join(','),hole:'#050403',lip:[s.top,s.face],water:s.water,root:'#5a3e24',cave:true};
}

// ---------- 3. per-visit state
function dunState(A){
  if(A.dn) return A.dn;
  const c=A.cave, n=c.w*c.h, D=dunOfArea(A), T=trialState(A), SK=caveSid(A.def), DK=caveDsid(A.def);
  const dn=A.dn={D,SK,DK,crk:new Uint8Array(n),crkT:new Float32Array(n),pods:[],spores:[],roots:[],tides:[],mirrors:[],emitters:[],targets:[],carts:[],points:[],
    stairs:[],guards:[],movers:[],tiles:[],grapples:[],beam:null,beamT:0,ride:null,stairGrace:0,cover:null,t:0,lastK:-1,hopT:0,moverMap:new Map()};
  for(let k=0;k<n;k++) if(c.typ[k]===DTY.crack&&G.found[`dcrk_${SK}_${k}`]) dn.crk[k]=2;
  const W=D&&D.water; T.lvl=G.found['wl_'+DK]!=null?G.found['wl_'+DK]:W?(W.start!=null?W.start:1):0; T.lvlShow=T.lvl;
  A.grapples=dn.grapples;
  return dn;
}
const lvlOf=T=>(T&&T.lvl)|0;

// ---------- 4. cells: where Ash can stand, what is water, what is a hole
function dunCovered(k){ const dn=AREA&&AREA.dn; return !!(dn&&dn.moverMap.has(k)); }
function dunGround(k,t,T){
  if(t===DTY.pit) return dunCovered(k);
  if(t===DTY.crack){ const dn=AREA.dn; return !dn||dn.crk[k]!==2; }
  if(t===DTY.high||t===DTY.ledge||t===DTY.ramp||t===DTY.belt||t===DTY.rail||isTile(t)) return true;
  const L=lvlOf(T);
  if(t===DTY.basin0) return L===0;
  if(t===DTY.terrace) return L<=1;
  if(t===DTY.raft) return L>=1;
  if(t===DTY.raft2) return L>=2;
  if(t===DTY.railpit) return dunCovered(k);
  return false;
}
function dunWet(k,t,T){ const L=lvlOf(T); return (t===DTY.basin0&&L>=1)||(t===DTY.terrace&&L>=2); }
function dunHole(k,t,T){
  if(t===DTY.drop||t===DTY.railpit) return !dunCovered(k);
  if(t===DTY.crack){ const dn=AREA.dn; return !!dn&&dn.crk[k]===2; }
  const L=lvlOf(T);
  return (t===DTY.raft&&L<1)||(t===DTY.raft2&&L<2);
}
// height of a cell: 1 on raised floor, 0 on the ground, -1 on stairs (both)
function dunH(k){ const t=AREA.cave.typ[k]; return t===DTY.ramp?-1:isRaised(t)?1:0; }
// extra rules for Ash on top of trialPlayerCells (undefined = no opinion, null = fine, or 'wall' / 'fall')
function dunCheck(k,x,y,air,fly){
  const A=AREA, dn=A.dn, T=A.tri; if(!dn) return undefined;
  if(dn.ride) return null;
  if(dunCovered(k)) return null;
  if(fly) return undefined;
  if(T.lx!=null){ const f=tCell(T.lx,T.ly); if(f>=0&&f!==k){ const hf=dunH(f), hk=dunH(k);
    if(hf>=0&&hk>=0&&hf!==hk){ if(hk>hf) return 'wall'; if(!air&&A.cave.typ[f]!==DTY.ledge) return 'wall'; } } }
  return undefined;
}
// enemies keep to their own level
function dunEnemyOK(e,k){ const h=dunH(k); if(h<0) return true; if(e._dlv==null) e._dlv=h; if(h!==e._dlv) return false; return true; }
// nearest cell around (x,y) where Ash can stand
function dunNearGround(x,y,maxR){
  const A=AREA, c=A.cave;
  for(let r=0;r<(maxR||10);r++) for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ if(Math.max(Math.abs(di),Math.abs(dj))!==r) continue; const k=tCell(x+di*c.cell,y+dj*c.cell); if(k>=0&&tGround(k)&&!c.dyn[k]&&!tHole(k)){ const q=tPos(k); if(!colAt(q.x,q.y,12)) return q; } }
  return {x:A.spawn.x,y:A.spawn.y};
}

// ---------- 5. floors: stairs between them and holes that drop you to the one below
// v11 (FIXW2 2b): a flight that is an island (the only floor there is the stair: Drowned Lumen's tide rooms, the well in
// the Burrows' mounds, the Mirror's glass bridge) used to put Ash in the middle of the stair. He steps off it instead:
// onto plain floor south, east or west of it if there is any (never a diagonal, which in the Burrows is outside the
// mounds, and never water: Lumen's deep water drops a diver to the floor below), else onto the flight's front lip, its
// bottom step. Same cell, same room, so no puzzle is skipped.
function dunOffStair(s,to){
  const A=AREA, c=A&&A.cave; if(!c||!to) return to;
  const ks=tCell(s.x,s.y); if(ks<0||tCell(to.x,to.y)!==ks) return to;
  const ok=k=>k>=0&&k!==ks&&!c.dyn[k]&&!tHole(k)&&tGround(k)&&!tWet(k);
  for(const [di,dj] of [[0,1],[1,0],[-1,0]]){ const k=tCell(s.x+di*c.cell,s.y+dj*c.cell); if(ok(k)){ const q=tPos(k); if(!colAt(q.x,q.y,12)) return {x:q.x,y:q.y}; } }
  const q=tPos(ks), y=q.y+c.cell*0.36;
  return colAt(q.x,y,10)||tCell(q.x,y)!==ks?to:{x:q.x,y};
}
function dunGoFloor(aid,arrive){
  const def=AREADEFS[aid]; if(!def||!AREA) return false;
  dunNoteCleared(AREA);
  for(const c of AREA.cols) removeCol(c);
  for(const e of G.enemies) if(e.inArea) e.dead=true;
  G.projectiles=[]; G.hazards=[]; G.pools=[]; G.pickups=[]; if(G.wproj) G.wproj=[];
  AREA={def,id:aid,kind:'cave',name:def.name,cols:[],objs:[],lights:[],npcs:[],dark:def.dark,level:def.level||1};
  G.area=aid;
  buildCaveRooms(AREA,def); areaNPCs();
  const p=player; let to=null;
  if(arrive&&arrive.stairs){ const want=arrive.stairs, near=arrive.near||{x:p.x,y:p.y}; let best=null, bd=1e18;
    for(const s of AREA.dn.stairs){ if(s.dir!==want) continue; const d=dist2(s.x,s.y,near.x,near.y); if(d<bd){ bd=d; best=s; } }
    if(best){ to=dunOffStair(best,dunNearGround(best.x,best.y+AREA.cave.cell,4)); AREA.dn.stairGrace=1; AREA.dn.graceAt=best; } }
  if(!to){ const q=arrive&&(arrive.x!=null?arrive:arrive.near); to=dunNearGround(q?q.x:AREA.spawn.x,q?q.y:AREA.spawn.y,12); if(arrive&&arrive.stairs){ AREA.dn.stairGrace=1; AREA.dn.graceAt={x:to.x,y:to.y}; } }
  moveReset(p); p.x=to.x; p.y=to.y; p.kvx=p.kvy=0;
  if(arrive&&arrive.fall){ p.z=70; p.vz=0; }
  if(G.pip){ G.pip.x=p.x; G.pip.y=p.y+30; } compsOnMove();
  if(G.goat&&G.side.duchess==='follow'){ G.goat.x=p.x+30; G.goat.y=p.y+30; }
  updateCam(0,true); G.fade=1; SFX.play('ui');
  const vk='seen_'+aid; if(!G.found[vk]){ G.found[vk]=true; setBanner(def.floorName||def.name,def.name,2.4,'region'); } else setBanner(def.floorName||def.name,'',1.4,'region');
  questPoke();
  return true;
}
function dunFloorNext(A,d){ const D=dunOfArea(A); if(!D) return null; const i=D.floorIds.indexOf(A.def.id); return D.floorIds[i+d]||null; }
// a hole leads down when there is a floor below and the hole is a drop hole or a broken cracked floor
{ const base=trialFall; trialFall=function(){
    const A=AREA, p=player; if(A&&A.dn&&!p.dead){ if(A.dn.drop) return; const k=tCell(p.x,p.y), t=A.cave.typ[k];
      if((t===DTY.drop||(t===DTY.crack&&A.dn.crk[k]===2))){ const R=caveRoomAt(p.x,p.y), below=(R&&R.below)||dunFloorNext(A,1);
        if(below){ SFX.play('roll'); shake(3); emit(p.x,p.y,18,{col:'90,70,50',glow:false,smin:20,smax:90,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:4});
          A.dn.drop={to:below,x:p.x,y:p.y}; A.dn.ride=null; return; } } }
    return base.apply(this,arguments); }; }
// floor changes wait for the end of the frame (the old floor is still being updated when Ash steps on the stairs)
function dunPendingFloor(A){
  const dn=A.dn; if(!dn) return;
  if(dn.drop){ const d=dn.drop; dn.drop=null; dunGoFloor(d.to,{x:d.x,y:d.y,fall:true}); ftext(player.x,player.y-40,S('Whoaaa!','Whoa!'),'#ffd9a0',15); return; }
  if(dn.go){ const g=dn.go; dn.go=null; dunGoFloor(g.to,g.arrive); }
}

// ---------- 6. building: rails through doorways, the new template marks, link options, guards and lifts
// caves rebuilt by e9b_caves2.js (C2.ids) run their own mechanics; the dungeon layer leaves them alone
function dunOwns(def){ return !(def&&typeof C2!=='undefined'&&C2.ids&&C2.ids[def.id]); }
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments), w=c.w; if(!dunOwns(def)) return c;
    // a mark (chest, crystal, mirror...) takes the floor around it: on a raised dais it is raised, in a basin it is basin.
    // A mine cart always stands on a rail.
    const INH=[DTY.high,DTY.basin0,DTY.terrace];
    for(const m of c.marks){ const k=m.j*w+m.i; if(c.typ[k]!==0) continue;
      if(m.ch==='A'){ c.typ[k]=DTY.rail; continue; }
      const cnt={}; for(const d of DIRS){ const t=c.typ[k+d[0]+d[1]*w]; if(INH.includes(t)||t===DTY.ledge) cnt[t===DTY.ledge?DTY.high:t]=(cnt[t===DTY.ledge?DTY.high:t]||0)+1; }
      for(const t of INH) if((cnt[t]||0)>=3){ c.typ[k]=t; break; } }
    // rails join up through doorways: two cells inside on both sides joins the door; one side alone reaches the doorstep
    for(const L of c.links){ const k=L.cells[1], i=k%w, j=(k-i)/w, dv=L.vertical?[0,1]:[1,0];
      const a=(j-2*dv[1])*w+(i-2*dv[0]), b=(j+2*dv[1])*w+(i+2*dv[0]), ra=isRail(c.typ[a]), rb=isRail(c.typ[b]);
      if(ra&&rb) for(let s=-1;s<=1;s++) c.typ[(j+s*dv[1])*w+(i+s*dv[0])]=DTY.rail;
      else { if(ra) c.typ[(j-dv[1])*w+(i-dv[0])]=DTY.rail; if(rb) c.typ[(j+dv[1])*w+(i+dv[0])]=DTY.rail; } }
    return c; }; }
{ const base=trialBuildRoom; trialBuildRoom=function(A,def,R,ms,P,spot,freeSpot,rng){ base.apply(this,arguments); if(dunOwns(def)) dunBuildRoom(A,def,R,ms,P,spot,freeSpot,rng); }; }
const TIDE_TXT=[S('Strike the tide crystal (low water)','Hit the crystal (low water)'),S('Strike the tide crystal (middle water)','Hit the crystal (middle water)'),S('Strike the tide crystal (high water)','Hit the crystal (high water)')];
function railNb(c,k){ const out=[], i=k%c.w; for(let d=0;d<4;d++){ const ni=i+DIRS[d][0]; if(ni<0||ni>=c.w) continue; const q=k+DIRS[d][0]+DIRS[d][1]*c.w; if(q>=0&&q<c.w*c.h&&isRail(c.typ[q])) out.push(d); } return out; }
function pointPairs(nb){ const P=[]; for(const [a,b] of [[0,2],[1,3]]) if(nb.includes(a)&&nb.includes(b)) P.push([a,b]); for(let x=0;x<nb.length;x++) for(let y=x+1;y<nb.length;y++){ const a=nb[x], b=nb[y]; if((a+2)%4===b) continue; P.push([a,b]); } return P; }
function dunBuildRoom(A,def,R,ms,P,spot,freeSpot,rng){
  const dn=dunState(A), c=A.cave, SK=dn.SK;
  for(const m of ms){
    const p=P(m.i,m.j), id=`dn_${SK}_${R.id}_${m.ch}${m.c}_${m.r}`, k=m.j*c.w+m.i;
    switch(m.ch){
      case '<': case '>': { const s={k:'dstairs',x:p.x,y:p.y,id,room:R.id,dir:m.ch==='<'?'up':'down',ci:m.i,cj:m.j}; A.objs.push(s); dn.stairs.push(s); A.lights.push({x:p.x,y:p.y,r:170,i:0.5}); break; }
      case 'l': { const o=tObj(A,'lpod',p.x,p.y,id,{room:R.id,group:R.pods||null,lit:!!G.found[id],r:28,reach:R.podReach||230,heat:0}); o.prompt=()=>o.lit?null:S('Look at the lantern-pod','Look at the pod'); addAreaCol({t:'c',x:p.x,y:p.y,r:12}); A.lights.push({x:p.x,y:p.y-20,r:320,i:0,obj:o,fire:true}); dn.pods.push(o); break; }
      case 'f': case 'j': { const o={k:'dspore',x:p.x,y:p.y,id,room:R.id,high:m.ch==='j',burst:false,ever:!!R.solved,gT:0,regT:0,cd:0}; o.L={x:p.x,y:p.y+8,r:320,i:R.solved?0.55:0}; A.lights.push(o.L); A.lights.push({x:p.x,y:p.y-(m.ch==='j'?64:30),r:70,i:0.45,tint:'shroom'}); A.objs.push(o); dn.spores.push(o); if(!o.high) addAreaCol({t:'c',x:p.x,y:p.y,r:9}); break; }
      case 'c': case 'e': case 'i': { const o=tObj(A,'tidec',p.x,p.y,id,{room:R.id,tune:'cei'.indexOf(m.ch),r:26,cd:0}); o.prompt=()=>TIDE_TXT[o.tune]; addAreaCol({t:'c',x:p.x,y:p.y,r:14}); A.lights.push({x:p.x,y:p.y-14,r:200,i:0.6}); dn.tides.push(o); break; }
      case 'm': { const rot=G.found[id+'_r']!=null?G.found[id+'_r']:((R.rot&&R.rot[`${m.c},${m.r}`])||0); const o=tObj(A,'mirror',p.x,p.y,id,{room:R.id,ci:m.i,cj:m.j,k,rot,cd:0,r:26}); o.prompt=()=>S('Turn the mirror','Turn the mirror'); addAreaCol({t:'c',x:p.x,y:p.y,r:13}); dn.mirrors.push(o); break; }
      case 'O': { const o={k:'dbeamsrc',x:p.x,y:p.y,id,room:R.id,ci:m.i,cj:m.j,k,dir:DIRN[R.beam||'e']}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:15}); A.lights.push({x:p.x,y:p.y,r:220,i:0.75}); dn.emitters.push(o); break; }
      case 'K': { const o={k:'dbeamtgt',x:p.x,y:p.y,id,room:R.id,ci:m.i,cj:m.j,k,lit:!!R.solved,hot:0}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:14}); A.lights.push({x:p.x,y:p.y,r:220,i:0,obj:o}); dn.targets.push(o); break; }
      case 'A': { const o=tObj(A,'cart',p.x,p.y,id,{room:R.id,ci:m.i,cj:m.j,hi:m.i,hj:m.j,dir:R.cartDir!=null?DIRN[R.cartDir]:-1,hd:R.cartDir!=null?DIRN[R.cartDir]:-1,moving:false,prog:0,r:30,away:0}); o.prompt=()=>dn.ride||o.moving||o.away>0?null:S('Ride the mine cart','Ride the cart'); dn.carts.push(o); break; }
      case '+': { const nb=railNb(c,k), pairs=pointPairs(nb); const o=tObj(A,'point',p.x,p.y,id,{room:R.id,ci:m.i,cj:m.j,k,pairs,si:Math.min(pairs.length-1,G.found[id+'_s']!=null?G.found[id+'_s']:((R.points&&R.points[`${m.c},${m.r}`])||0)),cd:0,r:24}); o.prompt=()=>dn.ride?null:S('Flip the switch points','Flip the switch'); dn.points.push(o); break; }
      case '@': { const o={k:'dgpost',x:p.x,y:p.y,id,room:R.id,lvl:Math.max(0,dunH(k))}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:10}); dn.grapples.push(o); break; }
    }
  }
  // dungeon chests: the first at X, then d, then b; 'skey' is a small key lying on the floor at X
  const spots=[spot('X'),spot('d'),spot('b')].filter(Boolean); let si=0;
  for(const L of R.loot||[]){ const [kind,...gifts]=L.split('+');
    if(kind==='skey'){ const p0=spot('X')||freeSpot(), id=`cv_${SK}_${R.id}_keytaken`; if(!G.found[id]) A.objs.push({k:'smallkey',x:p0.x,y:p0.y,id,room:R.id,live:true}); continue; }
    if(!DCHEST[kind]) continue; const p0=spots[si++]||freeSpot(); dChest(A,R,p0,`dc_${SK}_${R.id}_${kind}`,kind,gifts); }
  // levers that work switch points somewhere else (the same room or another one): levers:[{at:[c,r], room:'g', point:[c,r]}]
  for(const lv of R.levers||[]){ const p=P(R.ox+1+lv.at[0],R.oy+1+lv.at[1]), id=`dn_${SK}_${R.id}_lever${lv.at[0]}_${lv.at[1]}`;
    const o=tObj(A,'plever',p.x,p.y,id,{room:R.id,to:lv,r:22,cd:0}); o.prompt=()=>dn.ride?null:S('Pull the points lever','Pull the lever'); addAreaCol({t:'c',x:p.x,y:p.y,r:10}); (dn.levers=dn.levers||[]).push(o); }
  if(R.kind==='tiles'){ R.seqI=0; R.lastTile=-1; }
}
// a lever's switch point (found once every room is built)
function leverPoint(A,o){ if(o.pt!==undefined) return o.pt; const lv=o.to, R=A.rooms[lv.room||o.room]; if(!R) return o.pt=null; const k=(R.oy+1+lv.point[1])*A.cave.w+(R.ox+1+lv.point[0]); return o.pt=A.dn.points.find(q=>q.k===k)||null; }
function leverPull(o){ if(o.cd>0) return; o.cd=0.4; const pt=leverPoint(AREA,o); if(!pt){ SFX.play('block',0.5); return; } pt.cd=0; pointFlip(pt); SFX.play('block'); o.flip=!o.flip; shake(1.5); }
// the chest kinds a dungeon room can hold (room loot:['dmap','compass','bkey','heart','treasure+map_x1', ...])
const DCHEST={dmap:{big:false},compass:{big:false},bkey:{big:true},heart:{big:true},treasure:{big:false}};
function dChest(A,R,p,id,kind,gifts){
  const big=DCHEST[kind].big, o=tObj(A,'dchest',p.x,p.y,id,{r:big?30:22,room:R.id,kind,gifts:gifts||[],big});
  addAreaCol({t:'c',x:p.x,y:p.y,r:big?20:15});
  o.prompt=()=>G.found[id]?null:dChestSealed(o)?S('Look at the chest','Look at the chest'):big?S('Open the great chest','Open the big chest'):S('Open the chest','Open the chest');
  if(!G.found[id]) A.lights.push({x:p.x,y:p.y,r:big?220:150,i:big?0.7:0.5});
  return o;
}
function dChestSealed(o){ const R=AREA.rooms[o.room]; return !!(R&&(R.sealChest||SEAL_KINDS[R.kind])&&!R.solved); }
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ base.apply(this,arguments); if(dunOwns(def)) dunAfterBuild(A,def); }; }
function rootRegrowOf(A,o){ const D=A.dn.D, rs=o.link?[A.rooms[o.link.a],A.rooms[o.link.b]]:[caveRoomAt(o.x,o.y)]; let r=null; for(const R of rs) if(R&&R.regrow!=null) r=Math.max(r||0,R.regrow); return r!=null?r:(D&&D.regrow)||0; }
function dunAfterBuild(A,def){
  const dn=dunState(A), c=A.cave, M=CAVEMAP[def.id]||{links:[]}, cs=c.cell;
  for(const o of A.gates){
    if(o.link){ const opt=(M.links[o.link.i]||[])[3]||{}; o.opt=opt;
      if(o.type==='oneway') o.from=opt.from||o.link.a;
      if(o.type==='timed') o.sw=opt.room||o.gateRoom||o.link.a;
      if(o.type==='plate') o.pr=opt.room||o.gateRoom||o.link.a;
      if(o.type==='roots'){ o.heart=opt.heart||null; o.need=opt.n||3; A.objs.push({k:'dv',kind:'rootdoor',ref:o,x:o.x,y:o.y,id:o.id+'_rv'}); }
      if(o.type==='oneway'||o.type==='timed'||o.type==='plate') A.objs.push({k:'dv',kind:'door_'+o.type,ref:o,x:o.x,y:o.y,id:o.id+'_dv'}); }
    if(o.type==='roots'){ o.regrow=o.opt&&o.opt.regrow!=null?o.opt.regrow:rootRegrowOf(A,o); o.grow=o.opened?0:1; o.heat=0; dn.roots.push(o); }
  }
  // moving platforms over pits: {a:[c,r], b:[c,r], w, h, speed, wait} in room cells (top-left corner of the platform)
  for(const k in A.rooms){ const R=A.rooms[k]; for(const mv of R.movers||[]){ const P=(ci,cj)=>({x:A.x0+(R.ox+1+ci)*cs,y:A.y0+(R.oy+1+cj)*cs});
    const a=P(mv.a[0],mv.a[1]), b=P(mv.b[0],mv.b[1]); dn.movers.push({room:k,ax:a.x,ay:a.y,bx:b.x,by:b.y,x:a.x,y:a.y,w:(mv.w||2)*cs,h:(mv.h||2)*cs,speed:mv.speed||70,wait:mv.wait!=null?mv.wait:1,dir:1,hold:mv.wait!=null?mv.wait:1}); } }
  // guards with lanterns: {path:[[c,r],...], type, wait, speed, cone, half}
  if(A.camp) for(const k in A.rooms){ const R=A.rooms[k]; for(const gd of R.guards||[]){ const pts=gd.path.map(([ci,cj])=>({x:A.x0+(R.ox+1+ci+0.5)*cs,y:A.y0+(R.oy+1+cj+0.5)*cs})); dunSpawnGuard(A,R,gd,pts); } }
  // rooms already cleared on this visit stay clear while Ash goes up and down the floors (until the usual refill time)
  const clr=dn.D&&DUN_CLR[dn.D.id];
  if(clr&&A.camp) for(const k in A.rooms){ const t=clr[def.id+'/'+k]; if(t==null||G.worldTime-t>=420) continue; const R=A.rooms[k];
    for(const e of R.enemies){ const i=G.enemies.indexOf(e); if(i>=0) G.enemies.splice(i,1); A.camp.alive--; const g=dn.guards.indexOf(e); if(g>=0) dn.guards.splice(g,1); } R.enemies=[]; }
  dunBeamTrace(A);
  dunMovers(A,0);
}
const DUN_CLR={};
function dunNoteCleared(A){ const D=A&&A.dn&&A.dn.D; if(!D) return; const m=DUN_CLR[D.id]=DUN_CLR[D.id]||{};
  for(const k in A.rooms){ const R=A.rooms[k]; if(R.enemies.length&&R.enemies.every(e=>e.dead)) m[A.def.id+'/'+k]=G.worldTime; } }

// ---------- 7. every frame (after updateCaveRooms, so trialPlayerCells has already judged Ash's step)
{ const base=updateCaveRooms; updateCaveRooms=function(dt){
    const A=AREA; base.apply(this,arguments);
    if(!A||AREA!==A||!A.dn) return;
    dunUpdate(A,dt);
    if(AREA===A) dunPendingFloor(A);
  }; }
function dunUpdate(A,dt){
  const dn=A.dn, p=player, c=A.cave, T=A.tri, R=caveRoomAt(p.x,p.y);
  dn.t+=dt;
  const k=tCell(p.x,p.y), air=airborne();
  // stairs to the next floor
  if(!dn.ride&&!air&&!p.flying&&!dn.go&&!dn.drop){
    if(dn.stairGrace>0){ const s=dn.graceAt; if(!s||dist(p.x,p.y,s.x,s.y)>46) dn.stairGrace=0; }
    else for(const s of dn.stairs){ if(dist(p.x,p.y,s.x,s.y)>20) continue; const SR=A.rooms[s.room], to=s.dir==='down'?((SR&&SR.down)||dunFloorNext(A,1)):((SR&&SR.up)||dunFloorNext(A,-1)); if(!to) continue; dn.go={to,arrive:{stairs:s.dir==='down'?'up':'down',near:{x:s.x,y:s.y}}}; SFX.play('step'); break; }
  }
  // cracked floor gives way under a walker
  if(k>=0&&!air&&!p.flying&&!dn.ride&&c.typ[k]===DTY.crack&&dn.crk[k]===0){ dn.crk[k]=1; dn.crkT[k]=0; SFX.play('block',0.4); }
  for(let q=0;q<dn.crk.length;q++){ if(dn.crk[q]!==1) continue; dn.crkT[q]+=dt; if(dn.crkT[q]>0.75) dunCrackBreak(A,q); }
  // a hop down off a ledge
  if(k>=0&&dn.lastK>=0&&k!==dn.lastK&&!p.flying&&!dn.ride){ const hf=dunH(dn.lastK), hk=dunH(k); if(hf===1&&hk===0&&!air){ p.z=Math.max(p.z||0,18); p.vz=Math.min(p.vz||0,-30); emit(p.x,p.y+6,6,{col:'150,130,110',glow:false,smin:20,smax:60,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:5}); mvSnd('land',0.6); } }
  dn.lastK=k;
  dunRoots(A,dt); dunSpores(A,dt); dunWater(A,dt); dunBeam(A,dt); dunCarts(A,dt); dunMovers(A,dt); dunGuards(A,dt); dunTiles(A,R); dunPlates(A);
  for(const o of dn.carts) if(o.vis){ o.vis.x=o.x; o.vis.y=o.y; }   // the drawing (sorted and culled by its own place) follows the cart
  for(const o of dn.tides) if(o.cd>0) o.cd-=dt;
  for(const o of dn.mirrors) if(o.cd>0) o.cd-=dt;
  for(const o of dn.points) if(o.cd>0) o.cd-=dt;
  for(const o of dn.levers||[]) if(o.cd>0) o.cd-=dt;
  for(const o of dn.spores) if(o.cd>0) o.cd-=dt;
  // conveyor belts carry whatever stands on them
  if(k>=0&&c.typ[k]===DTY.belt&&!air&&!p.flying&&!dn.ride&&scene==='play'){ const d=DIRS[c.flow[k]]||DIRS[1]; tNudge(p,d[0]*150*dt,d[1]*150*dt); T.pushed=true; }
  for(const e of G.enemies){ if(e.dead||!e.inArea||e.flying) continue; const q=tCell(e.x,e.y); if(q>=0&&c.typ[q]===DTY.belt){ const d=DIRS[c.flow[q]]||DIRS[1]; tNudge(e,d[0]*120*dt,d[1]*120*dt); } }
  // the doors that open and close by themselves
  if(A.gates.some(o=>o.type==='timed'||o.type==='plate'||(o.type==='oneway'&&!o.opened)||(o.type==='roots'&&o.pend))) refreshCaveGates();
  for(const o of A.gates) if(o.type==='oneway'&&!o.opened){ const FR=A.rooms[o.from]; if(FR&&caveRoomAt(p.x,p.y)===FR&&dist(p.x,p.y,o.x,o.y)<84){ o.opened=true; G.found[o.id]=true; refreshCaveGates(); SFX.play('block'); setBanner(S('The bar lifts','The bar lifts'),S('A shortcut! It stays open now.','A shortcut! It stays open.'),1.8); saveGame(); } }
  // puzzle music in every puzzle room (and in rooms that are part of a bigger puzzle)
  if(R&&!R.solved&&(PUZZLE_KINDS[R.kind]||R.puzzle)) A.puzzleOn=true;
  if(R&&R.alarm&&R.enemies.some(e=>!e.dead)) A.puzzleOn=false;
}
// ---- cracked floors
function dunCrackBreak(A,k){
  const dn=A.dn; if(dn.crk[k]===2) return; dn.crk[k]=2; G.found[`dcrk_${dn.SK}_${k}`]=true;
  const q=tPos(k); emit(q.x,q.y,22,{col:'110,90,70',glow:false,smin:30,smax:120,lmin:.4,lmax:.8,zmin:2,zmax:5,grow:5}); SFX.play('boom',0.5); shake(3);
  // the cracks spread to the cracked tiles around this one
  const c=A.cave; for(const d of DIRS){ const n=k+d[0]+d[1]*c.w; if(n>=0&&n<c.typ.length&&c.typ[n]===DTY.crack&&dn.crk[n]===0){ dn.crk[n]=1; dn.crkT[n]=0.35; } }
  saveGame();
}
// ---- living roots grow back unless a lit lantern-pod keeps them away
function podCount(A,group){ const pre=`${A.dn.DK}_pod_${group}_`; let n=0; for(const key in G.found) if(key.startsWith(pre)) n++; return n; }
function rootSafe(A,o){
  if(o.heart) return podCount(A,o.heart)>=o.need;
  for(const q of A.dn.pods) if(q.lit&&dist(q.x,q.y,o.x,o.y)<=q.reach+(o.link?24:0)) return true;
  return false;
}
function rootKeep(o){ o.opened=true; o.regrowT=0; o.pend=false; G.found[o.id]=true; saveGame(); }
{ const base=burnRoots; burnRoots=function(o){
    const A=AREA; if(!A||!A.dn||o.opened) return;
    if(!o.regrow&&!o.heart) return base.apply(this,arguments);
    const safe=rootSafe(A,o);
    if(safe){ base.apply(this,arguments); o.grow=1; return; }
    o.opened=true; o.regrowT=o.heart?0.9:o.regrow; o.pend=true; refreshCaveGates(); SFX.play('boom',0.7); shake(3);
    emit(o.x,o.y,26,{kind:'fire',ang:-Math.PI/2,spread:1,smin:30,smax:150,lmin:.4,lmax:.9,zmin:3,zmax:7,grow:7});
    if(o.heart){ const n=podCount(A,o.heart); setBanner(S('The Heartroot is too strong!','The Heartroot is too strong!'),S(`It heals at once. Light its lantern-pods first: ${n} of ${o.need} glowing.`,`Light its pods first. ${n} of ${o.need} glow.`),3); }
    else if(!A.dn.rootTip){ A.dn.rootTip=true; setBanner(S('The roots will grow back!','The roots grow back!'),S('Hurry through. A lit lantern-pod near the roots keeps them away for good.','Run! A lit pod keeps them away.'),3.2); }
    // fire spreads along the roots that touch this one
    later(0.14,()=>{ if(AREA!==A) return; for(const q of A.dn.roots){ if(q.opened||q.link||o.link) continue; if(dist(q.x,q.y,o.x,o.y)<A.cave.cell*1.5) burnRoots(q); } });
  }; }
function dunRoots(A,dt){
  for(const o of A.dn.roots){
    if(o.regrowT>0){ o.regrowT-=dt;
      if(o.regrowT<=0){ if(rootSafe(A,o)) rootKeep(o); else { o.opened=false; o.heat=0; refreshCaveGates(); if(!o.closed) o.pend=true; else { o.pend=false; SFX.play('slash3',0.5); emit(o.x,o.y,10,{col:'110,80,50',glow:false,smin:30,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:4}); } } } }
    else if(o.pend&&!o.opened){ refreshCaveGates(); if(o.closed) o.pend=false; }
    const want=o.opened?(o.regrowT>0&&o.regrowT<1.6?1-o.regrowT/1.6:0):1; o.grow+=(want-o.grow)*Math.min(1,dt*(want>o.grow?3:8));
  }
}
function podLight(o){
  const A=AREA; if(o.lit) return; o.lit=true; G.found[o.id]=true; if(o.group) G.found[`${A.dn.DK}_pod_${o.group}_${o.id}`]=true;
  SFX.play('shrine'); emit(o.x,o.y-20,26,{kind:'fire',ang:-Math.PI/2,spread:0.9,smin:30,smax:140,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:5});
  let kept=0; for(const q of A.dn.roots){ if(q.opened&&q.regrowT>0&&rootSafe(A,q)){ rootKeep(q); kept++; } }
  for(const q of A.dn.roots) if(!q.opened&&!q.heart&&dist(q.x,q.y,o.x,o.y)<=o.reach) q.shy=1;
  if(o.group){ const n=podCount(A,o.group), need=Math.max(...A.dn.roots.filter(q=>q.heart===o.group).map(q=>q.need),dunGroupNeed(A,o.group)); setBanner(S('The lantern-pod glows','The pod glows!'),need?S(`${n} of ${need} heart pods are glowing.`,`${n} of ${need} pods glow.`):'',2.6); }
  else setBanner(S('The lantern-pod glows','The pod glows!'),kept?S('The roots near it shrink back for good.','The roots stay away now.'):S('Roots near it will not grow back now.','Roots near it stay away.'),2.4);
  // a 'pods' room is solved when every lantern-pod in it glows
  const R=A.rooms[o.room]; if(R&&R.kind==='pods'&&!R.solved&&A.dn.pods.filter(q=>q.room===o.room).every(q=>q.lit)){ solveRoom(R,true); jingle('secret','shrine'); }
  saveGame();
}
function dunGroupNeed(A,group){ const D=A.dn.D; return (D&&D.pods&&D.pods[group])||0; }
// ---- spore pods: knock them and their glowing dust lights a dark room for a while
function sporeBurst(o){
  const A=AREA; if(o.burst) return; o.burst=true; o.ever=true; o.gT=40; o.regT=8;
  SFX.play('pop'); shake(1.5);
  for(let i=0;i<3;i++) emit(o.x,o.y,14,{col:'190,255,170',smin:20,smax:120,lmin:1.2,lmax:2.6,zmin:1.2,zmax:2.6,drag:1.2,rise:-6});
  // a dark spore room is solved once every low pod has burst (the high ones are a bonus for a thrown weapon)
  const R=A.rooms[o.room]; if(R&&R.kind==='spores'&&!R.solved){ const all=A.dn.spores.filter(q=>q.room===o.room&&(!q.high||R.allPods)); const n=all.filter(q=>q.ever).length; if(n<all.length) setBanner(S('Glowing spores!','Glowing spores!'),S(`${n} of ${all.length} pods lit`,`${n} of ${all.length} pods`),1.4); else solveRoom(R); }
}
function dunSpores(A,dt){
  for(const o of A.dn.spores){ const R=A.rooms[o.room];
    if(o.burst){ o.gT-=dt; if(o.gT<=0){ o.regT-=dt; if(o.regT<=0&&!(R&&R.solved)){ o.burst=false; } } }
    const glow=o.burst?clamp(o.gT/6,0,1):0, base=R&&R.solved&&o.ever?0.55:0;
    o.L.i=Math.max(base,0.92*glow);
  }
}
// ---- the water level of the whole dungeon: 0 low, 1 middle, 2 high
function dunSetLevel(L,o){
  const A=AREA, T=A.tri, dn=A.dn; if(!T||T.lvl===L) { if(o) ftext(o.x,o.y-36,S('The water is already there.','Already there!'),'#bfe6ff',13); return; }
  const up=L>T.lvl; T.lvl=L; G.found['wl_'+dn.DK]=L;
  SFX.play('shrine'); SFX.play('roll'); shake(4); flashA=0.12; flashCol='140,200,255';
  setBanner(up?S('The water rises!','The water rises!'):S('The water drains away!','The water drains!'),[S('Low water: the basins are dry.','Low water. Basins are dry.'),S('Middle water: the basins fill and the rafts float.','Middle water. Rafts float.'),S('High water: even the terraces flood, and the deep rafts rise.','High water! Deep rafts float.')][L],2.6);
  dunRelocate(A);
  for(const e of G.enemies){ if(e.dead||!e.inArea||e.flying) continue; const q=tCell(e.x,e.y), swim=EDEF[e.type]&&EDEF[e.type].swim; if(q<0) continue; if(swim&&!tWet(q)){ ftext(e.x,e.y-20,S('Flop!','Flop!'),'#bfe6ff',12); killEnemy(e); } else if(!swim&&!tGround(q)){ const s=dunNearGround(e.x,e.y,6); e.x=s.x; e.y=s.y; e._tx=e.x; e._ty=e.y; } }
  dunBeamTrace(A); saveGame();
}
function dunRelocate(A){
  const p=player, k=tCell(p.x,p.y); if(k<0||p.flying) return;
  if(tGround(k)||(canWalkWater()&&tWet(k))) return;
  const s=dunNearGround(p.x,p.y,8); p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; const T=A.tri; T.lx=p.x; T.ly=p.y; T.safe={x:p.x,y:p.y};
  ftext(p.x,p.y-30,S('Whoa! Out of the water!','Whoa!'),'#bfe6ff',13);
}
function dunWater(A,dt){ const T=A.tri; if(T.lvlShow==null) T.lvlShow=T.lvl||0; T.lvlShow+=clamp((T.lvl||0)-T.lvlShow,-dt*0.9,dt*0.9); }
// ---- light beams: from a sun crystal, bounced by mirrors, onto crystal targets (through doorways too)
function mirrorWorks(A,o){ const t=A.cave.typ[o.k], L=lvlOf(A.tri); return !((t===DTY.basin0&&L>=1)||(t===DTY.terrace&&L>=2)); }
function dunBeamTrace(A){
  const dn=A.dn; if(!dn||!dn.emitters.length){ if(dn) dn.beam=null; return; }
  const c=A.cave, cs=c.cell, segs=[], hits=new Set();
  for(const src of dn.emitters){
    let i=src.ci, j=src.cj, d=src.dir, end=null; const pts=[{x:src.x,y:src.y}], seen=new Set();
    const edge=()=>({x:A.x0+(i+0.5-DIRS[d][0]*0.5)*cs,y:A.y0+(j+0.5-DIRS[d][1]*0.5)*cs});
    for(let n=0;n<240&&!end;n++){
      i+=DIRS[d][0]; j+=DIRS[d][1]; if(i<0||j<0||i>=c.w||j>=c.h){ end=edge(); break; }
      const k=j*c.w+i, key=k*4+d; if(seen.has(key)){ end={x:A.x0+(i+0.5)*cs,y:A.y0+(j+0.5)*cs}; break; } seen.add(key);
      if((c.grid[k]===1&&c.typ[k]!==1)||(c.dyn[k]&&A.gates[c.dyn[k]-1]&&A.gates[c.dyn[k]-1].closed)||A.blocks.some(b=>!b.sunk&&b.cj*c.w+b.ci===k)){ end=edge(); break; }
      const tg=dn.targets.find(q=>q.k===k); if(tg){ hits.add(tg); end={x:tg.x,y:tg.y}; break; }
      const mi=dn.mirrors.find(q=>q.k===k);
      if(mi&&mirrorWorks(A,mi)){ pts.push({x:mi.x,y:mi.y}); const dx=DIRS[d][0], dy=DIRS[d][1], nx=mi.rot?dy:-dy, ny=mi.rot?dx:-dx; d=DIRS.findIndex(q=>q[0]===nx&&q[1]===ny); continue; }
      if(dn.emitters.some(q=>q!==src&&q.k===k)){ end=edge(); break; }
    }
    pts.push(end||{x:A.x0+(i+0.5)*cs,y:A.y0+(j+0.5)*cs});
    segs.push(pts);
  }
  dn.beam={segs,hits};
}
function dunBeam(A,dt){
  const dn=A.dn; if(!dn.emitters.length) return;
  dn.beamT-=dt; if(dn.beamT<=0){ dn.beamT=0.12; dunBeamTrace(A); }
  for(const o of dn.targets){ const on=dn.beam&&dn.beam.hits.has(o); o.hot=on?o.hot+dt:Math.max(0,o.hot-dt*2);
    if(on&&!o.lit&&o.hot>0.35){ o.lit=true; SFX.play('shrine'); emit(o.x,o.y,30,{col:'255,240,170',smin:40,smax:180,lmin:.4,lmax:.9,zmin:1.5,zmax:3}); shake(3);
      const R=A.rooms[o.room]; const ts=dn.targets.filter(q=>q.room===o.room);
      if(R&&!R.solved&&ts.every(q=>q.lit)) solveRoom(R); else setBanner(S('The crystal drinks the light','The crystal glows!'),'',1.6); } }
}
// ---- mine carts on rails, with switch points
function cartBlocked(A,q,self){ const c=A.cave; if(q<0||q>=c.w*c.h) return true; const g=c.dyn[q]&&A.gates[c.dyn[q]-1]; if(g&&g.closed) return g; if(!isRail(c.typ[q])) return true; if(A.blocks.some(b=>!b.sunk&&b.cj*c.w+b.ci===q)) return true; if(A.dn.carts.some(o=>o!==self&&o.away<=0&&o.cj*c.w+o.ci===q)) return true; return false; }
function cartNext(A,o,k){
  const c=A.cave, inc=(o.dir+2)%4, nb=railNb(c,k).filter(d=>d!==inc), pt=A.dn.points.find(q=>q.k===k);
  let out=-1;
  if(pt){ const pr=pt.pairs[pt.si]; if(pr&&pr.includes(inc)) out=pr[0]===inc?pr[1]:pr[0]; else { if(o.rider&&!(pt.nope>G.time)){ pt.nope=G.time+1; ftext(pt.x,pt.y-30,S('The points are set the other way!','Wrong way!'),'#ffd9a0',13); } return -1; } }
  else if(nb.includes(o.dir)) out=o.dir; else if(nb.length) out=nb[0];
  if(out<0){ // the end of the line: a fast cart smashes a cracked wall straight ahead
    const q=k+DIRS[o.dir][0]+DIRS[o.dir][1]*c.w, g=q>=0&&c.dyn[q]&&A.gates[c.dyn[q]-1];
    if(g&&g.closed&&g.type==='crack'&&o.spd>180){ breakCrack(g); shake(8); setBanner(S('CRASH!','CRASH!'),S('The cart smashes right through the cracked wall!','The cart smashed the wall!'),2); }
    return -1; }
  const q=k+DIRS[out][0]+DIRS[out][1]*c.w, bl=cartBlocked(A,q,o);
  if(bl){ if(bl.type==='crack'&&o.spd>180){ breakCrack(bl); shake(8); } return -1; }
  return out;
}
function cartBoard(o){
  const A=AREA, dn=A.dn, c=A.cave; if(dn.ride||o.moving||o.away>0) return;
  const k=o.cj*c.w+o.ci, nb=railNb(c,k);
  let d=o.dir>=0&&nb.includes(o.dir)?o.dir:nb[0];
  if(d==null){ runDialogue([['narr',S('The cart has no rails to run on.','No rails.')]],()=>{ scene='play'; }); return; }
  const q=k+DIRS[d][0]+DIRS[d][1]*c.w; if(cartBlocked(A,q,o)){ setBanner(S('The way is blocked','Blocked!'),S('Something is in the way of the cart.','Something is in the way.'),1.6); return; }
  const pt=dn.points.find(p0=>p0.k===k); if(pt){ const pr=pt.pairs[pt.si]; if(pr&&!pr.includes(d)) d=pr[0]; }
  o.dir=d; o.moving=true; o.prog=0; o.rider=true; o.spd=60; dn.ride=o; o.startK=k;
  moveReset(player); player.x=o.x; player.y=o.y; SFX.play('roll'); mvSnd('jump',0.5);
}
function cartStop(A,o){
  const dn=A.dn, c=A.cave, k=o.cj*c.w+o.ci; o.moving=false; o.prog=0; o.spd=0; SFX.play('block',0.7); shake(2);
  if(o.rider){ o.rider=false; dn.ride=null; const p=player;
    let best=null; for(const d of [o.dir,(o.dir+1)%4,(o.dir+3)%4,(o.dir+2)%4]){ const q=k+DIRS[d][0]+DIRS[d][1]*c.w; if(q<0||q>=c.typ.length) continue; if(tGround(q)&&!c.dyn[q]&&!isRail(c.typ[q])){ best=q; break; } }
    if(best==null) for(const d of [o.dir,(o.dir+1)%4,(o.dir+3)%4,(o.dir+2)%4]){ const q=k+DIRS[d][0]+DIRS[d][1]*c.w; if(q>=0&&q<c.typ.length&&tGround(q)&&!(c.dyn[q]&&A.gates[c.dyn[q]-1].closed)){ best=q; break; } }
    const s=best!=null?tPos(best):dunNearGround(o.x,o.y,4); p.x=s.x; p.y=s.y; p.z=6; p.vz=150; const T=A.tri; T.lx=p.x; T.ly=p.y;
    emit(o.x,o.y,10,{col:'150,130,110',glow:false,smin:30,smax:90,lmin:.3,lmax:.5,zmin:2,zmax:4});
    if(k!==o.hj*c.w+o.hi) o.away=1.4; }
}
function cartHome(A,o){ const cs=A.cave.cell; o.ci=o.hi; o.cj=o.hj; o.dir=o.hd; o.x=A.x0+(o.ci+0.5)*cs; o.y=A.y0+(o.cj+0.5)*cs; o.fade=1; emit(o.x,o.y,8,{col:'200,180,150',glow:false,smin:20,smax:60,lmin:.3,lmax:.5,zmin:2,zmax:3}); }
function dunCarts(A,dt){
  const dn=A.dn, c=A.cave, cs=c.cell;
  for(const o of dn.carts){
    if(o.fade>0) o.fade-=dt*2;
    if(o.away>0&&!o.moving){ o.away-=dt; if(o.away<=0) cartHome(A,o); continue; }
    if(!o.moving) continue;
    o.spd=Math.min(300,o.spd+520*dt); o.prog+=o.spd*dt/cs; o.rock=(o.rock||0)+dt*o.spd*0.05;
    let guard=0;
    while(o.prog>=1&&guard++<4){ o.prog-=1; o.ci+=DIRS[o.dir][0]; o.cj+=DIRS[o.dir][1]; const k=o.cj*c.w+o.ci, nd=cartNext(A,o,k); if(nd<0){ o.prog=0; o.x=A.x0+(o.ci+0.5)*cs; o.y=A.y0+(o.cj+0.5)*cs; cartStop(A,o); break; } o.dir=nd; if(Math.random()<0.3) mvSnd('reel',0.4); }
    if(o.moving){ o.x=A.x0+(o.ci+0.5+DIRS[o.dir][0]*o.prog)*cs; o.y=A.y0+(o.cj+0.5+DIRS[o.dir][1]*o.prog)*cs; if(Math.random()<dt*20) emit(o.x+rand(-10,10),o.y+10,1,{col:'255,200,120',smin:20,smax:80,lmin:.15,lmax:.3,zmin:1,zmax:2}); }
    if(o.rider&&dn.ride===o){ const p=player; p.x=o.x; p.y=o.y-4; p.kvx=p.kvy=0; p.z=Math.max(p.z||0,0); const T=A.tri; T.lx=p.x; T.ly=p.y; }
  }
}
// ---- moving platforms over pits: the cells under a platform count as floor, and it carries whoever stands on it
function dunMovers(A,dt){
  const dn=A.dn, c=A.cave, cs=c.cell; if(!dn.movers.length) return;
  const p=player, pk=tCell(p.x,p.y), onBefore=dn.moverMap.get(pk);
  dn.moverMap.clear();
  for(const m of dn.movers){
    const ox=m.x, oy=m.y;
    if(m.hold>0) m.hold-=dt;
    else{ const tx=m.dir>0?m.bx:m.ax, ty=m.dir>0?m.by:m.ay, d=dist(m.x,m.y,tx,ty), st=m.speed*dt;
      if(d<=st){ m.x=tx; m.y=ty; m.dir*=-1; m.hold=m.wait; } else { m.x+=(tx-m.x)/d*st; m.y+=(ty-m.y)/d*st; } }
    m.vx=dt>0?(m.x-ox)/dt:0; m.vy=dt>0?(m.y-oy)/dt:0;
    if(onBefore===m&&!p.flying&&!dn.ride){ p.x+=m.x-ox; p.y+=m.y-oy; const T=A.tri; if(T.lx!=null){ T.lx+=m.x-ox; T.ly+=m.y-oy; } }
    for(let j=Math.floor((m.y-A.y0+8)/cs);j<=Math.floor((m.y+m.h-A.y0-8)/cs);j++) for(let i=Math.floor((m.x-A.x0+8)/cs);i<=Math.floor((m.x+m.w-A.x0-8)/cs);i++){ if(i>=0&&j>=0&&i<c.w&&j<c.h) dn.moverMap.set(j*c.w+i,m); }
  }
}
// ---- colour step tiles: step on them in the order the room shows
function dunTiles(A,R){
  if(!R||R.kind!=='tiles'||R.solved||!R.seq) return;
  const p=player, k=tCell(p.x,p.y), c=A.cave, t=c.typ[k];
  if(airborne()||p.flying) return;
  if(!isTile(t)){ R.lastTile=-1; return; }
  if(k===R.lastTile) return; R.lastTile=k;
  const col=TILE_COL[t], want=R.seq[R.seqI||0]; const q=tPos(k);
  if(col===want){ R.seqI=(R.seqI||0)+1; SFX.play('pickup'); R.flash={k,t:0.5,ok:true}; ftext(q.x,q.y-24,`${R.seqI}`,'#fff0c0',14);
    if(R.seqI>=R.seq.length) solveRoom(R); }
  else { R.seqI=col===R.seq[0]?1:0; SFX.play('hurt',0.5); R.flash={k,t:0.5,ok:false}; ftext(q.x,q.y-24,S('Wrong colour! Start again.','Oops! Start again.'),'#ffb0a0',13); }
}
// ---- plates that a block, a cart or Ash himself can hold down
function dunPlates(A){
  const c=A.cave, p=player, pk=tCell(p.x,p.y);
  for(const o of A.objs){ if(o.k!=='plate') continue; const R=A.rooms[o.room]; if(R&&R.kind==='blocks'&&!R.solved) continue;
    const k=o.cj*c.w+o.ci; let on=A.blocks.some(b=>!b.sunk&&b.ci===o.ci&&b.cj===o.cj&&b.anim<=0);
    if(!on&&R&&R.plateAsh&&pk===k&&!airborne()&&!p.flying) on=true;
    if(!on) on=A.dn.carts.some(q=>!q.moving&&q.ci===o.ci&&q.cj===o.cj);
    if(on&&!o.pressed) SFX.play('block',0.5);
    o.pressed=on;
    if(R&&R.kind==='plates'&&!R.solved){ const pl=A.objs.filter(q=>q.k==='plate'&&q.room===o.room); if(pl.every(q=>q.pressed)) solveRoom(R); } }
}
// ---- Oath guards: they walk a beat with a lantern, and the lantern light is their eyes
Object.assign(EDEF,{oguard:Object.assign({},EDEF.cultist,{hp:EDEF.cultist.hp*1.25,value:EDEF.cultist.value+6,name:'Oath Guard'})});
DCOL.oguard=DCOL.cultist;
AI.oguard=(e,dt)=>{ const g=e.guard; if(!g||g.alert) return AI.cultist(e,dt); guardPatrol(e,dt); };
function dunSpawnGuard(A,R,gd,pts){
  const p0=pts[0], e=makeEnemy(gd.type&&EDEF[gd.type]?'oguard':'oguard',p0.x,p0.y,{level:A.def.level,aggro:true,homeX:p0.x,homeY:p0.y,leash:900,camp:A.camp,tint:R.tint});
  e.inArea=true; e.room=R.id; e.spawnIn=0;
  e.guard={pts,i:pts.length>1?1:0,step:1,loop:!!gd.loop,wait:gd.wait!=null?gd.wait:1.2,waitT:0.6,spd:gd.speed||52,cone:gd.cone||200,half:gd.half||0.5,sus:0,alert:false,look:0,baseFace:0};
  e.face=pts.length>1?angTo(p0.x,p0.y,pts[1].x,pts[1].y):(gd.face!=null?DIRS_A[gd.face]:Math.PI/2); e.guard.baseFace=e.face;
  e.draw=()=>guardDraw(e);
  R.enemies.push(e); A.camp.alive++; A.dn.guards.push(e);
  return e;
}
const DIRS_A={n:-Math.PI/2,e:0,s:Math.PI/2,w:Math.PI};
function guardPatrol(e,dt){
  const g=e.guard; e.dx=e.dy=0; e.tele=null; e.state='chase';
  if(g.waitT>0){ g.waitT-=dt; g.look+=dt; e.face=g.baseFace+Math.sin(g.look*1.5)*0.75; return; }
  const t=g.pts[g.i];
  if(!t||g.pts.length<2){ g.waitT=99; g.baseFace=e.face; return; }
  const d=dist(e.x,e.y,t.x,t.y);
  if(d<5){ let ni=g.i+g.step; if(ni<0||ni>=g.pts.length){ if(g.loop) ni=(ni+g.pts.length)%g.pts.length; else { g.step*=-1; ni=g.i+g.step; } } g.i=ni; g.waitT=g.wait; g.baseFace=e.face; g.look=0; return; }
  const a=angTo(e.x,e.y,t.x,t.y); e.face=turnTo(e.face,a,5*dt); e.dx=Math.cos(e.face)*g.spd; e.dy=Math.sin(e.face)*g.spd;
}
// a straight line of sight: walls, shut doors, blocks and solid things (pots, crates, statues) hide Ash
function dunSees(A,x0,y0,x1,y1){
  const c=A.cave, D=dist(x0,y0,x1,y1), n=Math.max(2,Math.ceil(D/12));
  for(let s=1;s<n;s++){ const f=s/n, x=lerp(x0,x1,f), y=lerp(y0,y1,f), k=tCell(x,y); if(k<0) return false;
    if(c.grid[k]===1&&c.typ[k]!==1) return false; if(c.dyn[k]&&A.gates[c.dyn[k]-1]&&A.gates[c.dyn[k]-1].closed) return false;
    if(A.blocks.some(b=>!b.sunk&&b.cj*c.w+b.ci===k)) return false;
    if(Math.min(f,1-f)*D>22&&colAt(x,y,2)) return false; }
  return true;
}
function dunGuards(A,dt){
  const dn=A.dn, p=player;
  for(const e of dn.guards){
    if(e.dead||!e.guard||e.guard.alert) continue; const g=e.guard, R=A.rooms[e.room];
    let see=false; const d=dist(e.x,e.y,p.x,p.y);
    if(!p.dead&&!(p.flying&&(p.z||0)>30)&&d<g.cone&&Math.abs(angDiff(e.face,angTo(e.x,e.y,p.x,p.y)))<g.half&&dunSees(A,e.x,e.y,p.x,p.y)) see=true;
    if(!p.dead&&d<e.r+p.r+10){ see=true; g.sus=1; }
    g.sus=clamp(g.sus+(see?dt*(1.5+2*(1-d/g.cone)):-dt*0.45),0,1); g.see=see;
    if(g.sus>=1) dunAlarm(A,R,e);
  }
}
function dunAlarm(A,R,e){
  if(!R||R.alarm) return; R.alarm=true; R.lockFight=true;
  for(const q of A.dn.guards) if(q.room===R.id&&!q.dead){ q.guard.alert=true; q.aggro=true; q.cd=0.5; }
  SFX.play('warn'); jingle('boss_intro',null); shake(5); flashA=0.2; flashCol='255,90,60';
  setBanner(S('ALARM!','ALARM!'),S('An Oath guard saw you! The doors slam shut.','A guard saw you! Doors shut!'),2.6);
  if(e) ftext(e.x,e.y-44,'!','#ff5a3a',26);
  const doors=R.links.map(L=>tPos(L.cells[1])); let n=0;
  for(const [type,cnt] of (R.alarmFoes||[['cultist',1],['kobold',2]])) for(let i=0;i<cnt;i++){ const dp=doors[(n++)%Math.max(1,doors.length)]||{x:R.cx,y:R.cy};
    const s=dunNearGround(lerp(dp.x,R.cx,0.22),lerp(dp.y,R.cy,0.22),5), f=makeEnemy(type,s.x,s.y,{level:A.def.level,aggro:true,camp:A.camp,homeX:R.cx,homeY:R.cy,leash:900});
    f.inArea=true; f.room=R.id; f.spawnIn=0.7; R.enemies.push(f); if(A.camp) A.camp.alive++; emit(s.x,s.y,14,{col:'170,100,220',smin:30,smax:110,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }
}
// a hit from behind on a guard who has not seen Ash is a sneak attack
{ const base=damageEnemy; damageEnemy=function(e,amt,o){
    if(e&&e.guard&&!e.guard.alert&&!e.dead&&o&&o.src&&o.src!=='burn'){
      const behind=Math.abs(angDiff(e.face,angTo(e.x,e.y,player.x,player.y)))>1.5;
      if(behind){ o=Object.assign({},o,{mult:(o.mult||1)*3}); ftext(e.x,e.y-e.r-18,S('Sneak attack!','Sneak attack!'),'#ffe066',15); }
      const r=base.call(this,e,amt,o); if(!e.dead&&AREA&&AREA.rooms) dunAlarm(AREA,AREA.rooms[e.room],e); return r; }
    return base.apply(this,arguments); }; }
// guards who have not seen Ash are not a fight yet (no combat music, prompts still work)
{ const base=updateEnemies; updateEnemies=function(dt){ base.apply(this,arguments);
    if(AREA&&AREA.dn&&AREA.dn.guards.length&&G.inCombat){ const p=player; G.inCombat=G.enemies.some(e=>!e.dead&&e.aggro&&!(e.guard&&!e.guard.alert)&&dist(e.x,e.y,p.x,p.y)<750); } }; }

// ---------- 8. hits, fire and the E button on the new things
// a mirror or a chest under the water cannot be reached until the water drops
const dunSunk=o=>{ const A=AREA, k=tCell(o.x,o.y); return k>=0&&tWet(k)&&A.cave.typ[k]>=13; };
function mirrorTurn(o){ if(o.cd>0) return; if(dunSunk(o)){ o.cd=0.8; ftext(o.x,o.y-34,S('It is under the water!','Under water!'),'#bfe6ff',13); return; } o.cd=0.35; o.rot^=1; G.found[o.id+'_r']=o.rot; SFX.play('block',0.6); emit(o.x,o.y-10,8,{col:'220,240,255',smin:30,smax:90,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); if(AREA&&AREA.dn) dunBeamTrace(AREA); }
function pointFlip(o){ if(o.cd>0||o.pairs.length<2) return; o.cd=0.35; o.si=(o.si+1)%o.pairs.length; G.found[o.id+'_s']=o.si; SFX.play('block',0.7); shake(1); emit(o.x,o.y-12,8,{col:'255,220,150',smin:30,smax:90,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); }
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){
    let hit=base.apply(this,arguments); const A=AREA; if(!A||!A.dn) return hit;
    r=r||8; const dn=A.dn, melee=src==='slash'||src==='daggers'||src==='spear'||src==='hammer'||src==='whip'||src==='glaive';
    for(const o of dn.spores){ if(o.burst||o.cd>0||dist(x,y,o.x,o.y)>r+18) continue;
      if(src==='fire'){ if(!(o.nope>G.time)){ o.nope=G.time+1.2; ftext(o.x,o.y-34,S('Too damp to burn! Knock it.','Too wet! Hit it.'),'#c8ffc0',12); } continue; }
      if(o.high&&melee&&src!=='whip'){ if(!(o.nope>G.time)){ o.nope=G.time+1.2; ftext(o.x,o.y-34,S('Too high! Throw something at it.','Too high! Throw something!'),'#c8ffc0',12); } continue; }
      o.cd=0.3; sporeBurst(o); hit=true; }
    for(const o of dn.tides){ if(src==='fire'||o.cd>0||dist(x,y,o.x,o.y)>r+20) continue; o.cd=0.6; dunSetLevel(o.tune,o); hit=true; }
    for(const o of dn.mirrors){ if(src==='fire'||o.cd>0||dist(x,y,o.x,o.y)>r+18) continue; mirrorTurn(o); hit=true; }
    for(const o of dn.points){ if(src==='fire'||o.cd>0||dist(x,y,o.x,o.y)>r+18) continue; pointFlip(o); hit=true; }
    for(const o of dn.levers||[]){ if(src==='fire'||o.cd>0||dist(x,y,o.x,o.y)>r+18) continue; leverPull(o); hit=true; }
    for(const o of dn.pods){ if(src!=='fire'||o.lit||dist(x,y,o.x,o.y)>r+24) continue; podLight(o); hit=true; }
    if(src==='bombs') for(const o of A.gates) if(o.type==='crack'&&!o.opened&&dist(x,y,o.x,o.y)<r+56){ breakCrack(o); hit=true; }   // a cracked wall
    if(src==='hammer'||src==='bombs'){ const c=A.cave, cs=c.cell; for(let j=Math.floor((y-r-A.y0)/cs);j<=Math.floor((y+r-A.y0)/cs);j++) for(let i=Math.floor((x-r-A.x0)/cs);i<=Math.floor((x+r-A.x0)/cs);i++){ const k=j*c.w+i; if(i>=0&&j>=0&&i<c.w&&j<c.h&&c.typ[k]===DTY.crack&&dn.crk[k]!==2){ dunCrackBreak(A,k); hit=true; } } }
    return hit; }; }
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){
    base.apply(this,arguments); const A=AREA; if(!A||!A.dn) return; const dn=A.dn, inA=o=>inArcC(px,py,dir,range+10,half,{x:o.x,y:o.y,r:18});
    for(const o of dn.spores) if(!o.burst&&!o.high&&o.cd<=0&&inA(o)){ o.cd=0.3; sporeBurst(o); }
    for(const o of dn.tides) if(o.cd<=0&&inA(o)){ o.cd=0.6; dunSetLevel(o.tune,o); }
    for(const o of dn.mirrors) if(o.cd<=0&&inA(o)) mirrorTurn(o);
    for(const o of dn.points) if(o.cd<=0&&inA(o)) pointFlip(o);
    for(const o of dn.levers||[]) if(o.cd<=0&&inA(o)) leverPull(o); }; }
{ const base=caveBreath; caveBreath=function(hit,dt){
    base.apply(this,arguments); const A=AREA; if(!A||!A.dn) return;
    for(const o of A.dn.pods) if(!o.lit&&hit(o.x,o.y,22)){ o.heat=(o.heat||0)+dt; if(Math.random()<0.4) emit(o.x+rand(-8,8),o.y-18,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:50,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:3}); if(o.heat>0.25) podLight(o); }
    for(const o of A.dn.spores) if(!o.burst&&hit(o.x,o.y,16)&&!(o.nope>G.time)){ o.nope=G.time+1.5; ftext(o.x,o.y-34,S('Too damp to burn! Knock it.','Too wet! Hit it.'),'#c8ffc0',12); } }; }
{ const base=trialObjAct; trialObjAct=function(o){
    const A=AREA; if(A&&A.dn){ const say=t=>runDialogue([['narr',t]],()=>{ scene='play'; saveGame(); });
      switch(o.tobj){
        case 'lpod': say(o.lit?S('The lantern-pod glows warm and gold. The roots around it keep well away.','The pod glows. Roots stay away.'):S('A lantern-pod: a fat bulb on a stalk, cold and dark. Living roots hate its light. It looks like it wants some fire.','A cold pod. Roots hate its light. Breathe fire on it!')); return true;
        case 'tidec': if(o.cd<=0){ o.cd=0.6; dunSetLevel(o.tune,o); } return true;
        case 'mirror': mirrorTurn(o); return true;
        case 'cart': cartBoard(o); return true;
        case 'point': pointFlip(o); return true;
        case 'plever': leverPull(o); return true;
        case 'dchest': dChestOpen(o); return true;
      } }
    return base.apply(this,arguments); }; }
const GATE_WHY={spores:S('A sealed door with a mushroom carved on it. Light every spore pod in that room.','Light every spore pod in that room.'),
  beam:S('A sealed door with a crystal eye. Bring the light beam to the crystal.','Shine the light on the crystal.'),
  tiles:S('A sealed door with coloured stones set in it. Step on the floor tiles in the right order.','Step on the colours in order.'),
  plates:S('A sealed door with a stone plate carved on it. Every plate in that room needs something heavy on it.','Put heavy things on the plates.'),
  stealth:S('A sealed door. Get past the guards.','Get past the guards.')};
{ const base=caveObjAct; caveObjAct=function(o){
    const A=AREA; if(A&&A.dn&&o&&o.k==='cgate'&&!o.tobj){ const say=t=>runDialogue([['narr',t]],()=>{ scene='play'; saveGame(); });
      if(o.type==='oneway'&&!o.opened){ say(S('A heavy bar holds this door shut from the other side. Find a way around.','It is barred on the other side.')); return true; }
      if(o.type==='timed'&&o.closed&&!o.tmp){ say(S('A gate with a crystal switch carved on it. Strike the switch, then hurry through before it shuts again.','Hit the switch. Then hurry!')); return true; }
      if(o.type==='plate'&&o.closed&&!o.tmp){ say(S('A gate with a stone plate carved on it. Something heavy has to hold the plate down.','Put something heavy on the plate.')); return true; }
      if(o.type==='roots'&&o.heart&&!o.opened){ const n=podCount(A,o.heart); say(S(`The Heartroot: a knot of roots as thick as a house. It heals as fast as it burns. Glowing veins run from it to ${o.need} lantern-pods somewhere in this place. ${n} of them glow.`,`The Heartroot heals fast. Light its ${o.need} pods. ${n} glow now.`)); return true; }
      if(o.type==='roots'&&o.regrow&&!o.opened){ say(S('Living roots. Burn them and they grow right back, unless a lit lantern-pod is close by.','Burn the roots. A lit pod keeps them away.')); return true; }
      if(o.type==='gate'&&o.closed&&!o.tmp){ const R=A.rooms[o.gateRoom]; if(R&&GATE_WHY[R.kind]){ say(GATE_WHY[R.kind]); return true; } } }
    return base.apply(this,arguments); }; }
{ const base=caveGatePrompt; caveGatePrompt=function(o){
    if(o.type==='oneway'&&!o.opened) return S('Look at the barred door','Look at the door');
    if((o.type==='timed'||o.type==='plate')&&o.closed&&!o.tmp) return S('Look at the gate','Look at the gate');
    if(o.type==='roots'&&o.heart&&!o.opened) return S('Look at the Heartroot','Look at the Heartroot');
    return base.apply(this,arguments); }; }
function gateOnAsh(o){ const A=AREA, c=A.cave; return o.cells.some(k=>{ const i=k%c.w, j=(k-i)/c.w, x=A.x0+(i+0.5)*c.cell, y=A.y0+(j+0.5)*c.cell; return Math.abs(player.x-x)<c.cell*0.5+player.r&&Math.abs(player.y-y)<c.cell*0.5+player.r; }); }
{ const base=refreshCaveGates; refreshCaveGates=function(){
    base.apply(this,arguments); const A=AREA; if(!A||!A.gates||!A.dn) return;
    for(const o of A.gates){ let cl=null;
      if(o.type==='oneway') cl=!o.opened;
      else if(o.type==='timed'){ const rooms=Array.isArray(o.sw)?o.sw:[o.sw]; cl=!rooms.some(r=>{ const sw=A.objs.filter(q=>q.k==='tswitch'&&q.room===r); return sw.length&&sw.every(q=>q.on); }); }
      else if(o.type==='plate'){ const pl=A.objs.filter(q=>q.k==='plate'&&q.room===o.pr); cl=!(pl.length&&pl.every(q=>q.pressed)); }
      if(cl===null) continue; if(o.tmp) cl=true; if(cl&&!o.closed&&gateOnAsh(o)) cl=false; o.closed=cl; } }; }

// ---------- 9. dungeon items: Dungeon Map, Compass, Boss Key, treasure, Heart Embers
const hasDMap=A=>!!(A&&(G.found['dmap_'+caveDsid(A.def)]||G.found['tmap_'+caveDsid(A.def)]));
const hasDComp=A=>!!(A&&G.found['dcomp_'+caveDsid(A.def)]);
const hasBKey=A=>!!(A&&G.found['bkey_'+caveDsid(A.def)]);
function dunGift(g,o){
  const D=AREA&&AREA.dn&&AREA.dn.D, ok=D&&D.giftOK&&D.giftOK[g];
  if(ok&&!ok()) return '';
  if(g==='treat'){ G.pipTreats=Math.min(3,(G.pipTreats||0)+1); return S('a Pip treat','a Pip treat'); }
  if(g==='potion'){ player.potionsMax=Math.min(6,player.potionsMax+1); player.potions=player.potionsMax; return S('a bigger flask belt','one more flask'); }
  if(G.items[g]) return '';
  giveItems({[g]:1},true); return ITEM_NAMES[g]||g;
}
function dChestOpen(o){
  const A=AREA, T=A.tri, dn=A.dn, DK=dn.DK, lv=A.def.level||1;
  if(G.found[o.id]) return;
  if(dunSunk(o)){ runDialogue([['narr',S('The chest sits at the bottom of the water. You can see it shining, but you cannot open it down there. Lower the water first.','The chest is under the water. Lower the water first.')]],()=>{ scene='play'; }); return; }
  if(dChestSealed(o)){ const R=A.rooms[o.room]; runDialogue([['narr',R&&R.sealText?R.sealText:S('The chest is held shut by glowing roots of light. Solve this room and they will let go.','It is sealed. Solve this room first.')]],()=>{ scene='play'; }); return; }
  G.found[o.id]=true; SFX.play('chest'); flashA=0.3; flashCol='255,226,160'; shake(3);
  emit(o.x,o.y,30,{col:'255,214,120',ang:-Math.PI/2,spread:1.2,smin:40,smax:180,lmin:.5,lmax:1,zmin:1.5,zmax:3.5,rise:20});
  const extra=o.gifts.map(g=>dunGift(g,o)).filter(Boolean), plus=extra.length?S(` and ${extra.join(' and ')}`,` and ${extra.join(' and ')}`):'';
  switch(o.kind){
    case 'dmap': G.found['dmap_'+DK]=true; renderCaveMini(A); T.hold={item:'dmap',t:2.6}; jingle('item','chest'); setBanner(S('The Dungeon Map!','The Dungeon Map!'),S('Every room of this place now shows on your map.','Now you can see every room.')+plus,3); break;
    case 'compass': G.found['dcomp_'+DK]=true; T.hold={item:'compass',t:2.6}; jingle('item','chest'); setBanner(S('The Compass!','The Compass!'),S('Treasure chests and the boss now show on your map.','Now your map shows chests and the boss.')+plus,3); break;
    case 'bkey': G.found['bkey_'+DK]=true; T.hold={item:'bosskey',t:3}; jingle('item','chest'); setBanner(S('The Boss Key!','The Boss Key!'),S('It opens the great door with the flame lock.','It opens the big flame door.')+plus,3); break;
    case 'heart': { const c=20+10*lv; addCoins(c,o.x,o.y); gainXp(60+20*lv); gainHeartEmber(o.id); if(extra.length) later(3.2,()=>setBanner(S('Also inside','Also inside'),extra.join(', '),2.4)); break; }
    case 'treasure': { const c=20+10*lv; addCoins(c,o.x,o.y); gainXp(40+20*lv); if(player.potions<player.potionsMax) player.potions++; jingle('item','chest'); setBanner(S('Treasure!','Treasure!'),`+${c} ${S('coins','coins')}`+plus,2.6); break; }
  }
  questPoke(); saveGame();
}
// a Heart Ember: +10 max health, a little moment and a jingle. One per dungeon end chest; never twice for the same id.
function gainHeartEmber(id){
  if(!G||!player) return false;
  if(id&&G.found['he_'+id]) return false;
  if(id) G.found['he_'+id]=true;
  G.found.heartEmbers=(G.found.heartEmbers||0)+1;
  const p=player; p.maxHp+=10; p.hp=p.maxHp;
  jingle('heart','levelup'); flashA=0.55; flashCol='255,120,110'; shake(5); G.slowT=0.8; G.timeScale=0.45;
  if(AREA&&AREA.tri) AREA.tri.hold={item:'heart',t:3.2};
  for(let i=0;i<4;i++) later(i*0.15,()=>emit(p.x+rand(-30,30),p.y-30+rand(-20,20),16,{col:'255,120,120',ang:-Math.PI/2,spread:1.4,smin:40,smax:200,lmin:.5,lmax:1.1,zmin:2,zmax:4,rise:30}));
  setBanner(S('A Heart Ember!','A Heart Ember!'),S(`It sinks into your chest, warm as a hug. Max health +10 (now ${p.maxHp}).`,`Max health +10! Now ${p.maxHp}.`),3.4);
  if(G.stats) G.stats.hearts=(G.stats.hearts||0)+1;
  saveGame(); return true;
}
// the treasure held up over Ash's head
{ const base=drawTrialItemIcon; drawTrialItemIcon=function(item,x,y,s,t){
    if(s<=0.02) return;
    if(item==='heart'){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); glowAt(0,0,30,'255,110,100',0.6); ctx.fillStyle=r2rg(ctx,-4,-4,1,14,'#ffe0d8','#ff4a4a','#9a1010'); heartPath(0,0,13); ctx.fill(); ctx.fillStyle='rgba(255,220,150,.9)'; ctx.beginPath(); ctx.moveTo(0,-8); ctx.quadraticCurveTo(5,-1,3,4); ctx.quadraticCurveTo(0,7,-3,4); ctx.quadraticCurveTo(-5,-1,0,-8); ctx.fill(); ctx.restore(); return; }
    if(item==='compass'){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle='#c8a050'; ctx.beginPath(); ctx.arc(0,0,13,0,TAU); ctx.fill(); ctx.fillStyle='#f4ecd8'; ctx.beginPath(); ctx.arc(0,0,10,0,TAU); ctx.fill(); ctx.fillStyle='#d83a2a'; ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(3,0); ctx.lineTo(-3,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#3a4a6a'; ctx.beginPath(); ctx.moveTo(0,9); ctx.lineTo(3,0); ctx.lineTo(-3,0); ctx.closePath(); ctx.fill(); ctx.restore(); return; }
    if(item==='dmap') item='map';
    return base.call(this,item,x,y,s,t); }; }

// ---------- 10. art: the cached floor (cells and raised faces), the live floor layer, the new objects
function dunTile(g,x,y,cs,st,i,j,rng,k2){ // a plain cave floor tile, k2 lightens (+) or darkens (-)
  g.fillStyle=r2c((i+j)%2?st.floor:st.floor2,k2||0); g.fillRect(x,y,cs,cs);
  g.fillStyle='rgba(255,255,255,.035)'; g.fillRect(x+2,y+2,cs-4,3);
  g.strokeStyle='rgba(0,0,0,.22)'; g.lineWidth=1.5; g.strokeRect(x+0.5,y+0.5,cs-1,cs-1);
  if(rng()<0.3){ g.fillStyle='rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,2+rng()*5,1.5+rng()*3,rng()*3,0,TAU); g.fill(); }
}
function dunHoleArt(g,c,i,j,x,y,cs,st,glow){
  g.fillStyle='#060504'; g.fillRect(x,y,cs,cs);
  const up=j>0?c.typ[(j-1)*c.w+i]:0, upSolid=j<=0||c.grid[(j-1)*c.w+i]===1;
  if(!upSolid&&!dunHoleT(c,(j-1)*c.w+i)){ const gr=g.createLinearGradient(0,y,0,y+cs*0.7); gr.addColorStop(0,st.top); gr.addColorStop(0.5,st.face); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.7); g.fillStyle='rgba(255,240,210,.18)'; g.fillRect(x,y,cs,2); }
  if(glow){ const gr=g.createRadialGradient(x+cs/2,y+cs*0.6,2,x+cs/2,y+cs*0.6,cs*0.6); gr.addColorStop(0,`rgba(${glow},.22)`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs); }
}
const dunHoleT=(c,k)=>{ const t=c.typ[k]; return t===TY.pit||t===TY.crumble||t===DTY.drop||t===DTY.railpit||t===DTY.raft||t===DTY.raft2; };
function dunRailArt(g,c,k,x,y,cs){
  const nb=railNb(c,k); if(!nb.length) nb.push(1,3);
  g.save(); g.translate(x+cs/2,y+cs/2);
  for(const d of nb){ g.save(); g.rotate(d*Math.PI/2); g.fillStyle='#5a3e24'; for(let s=0;s<2;s++) g.fillRect(-14,-cs*0.5+s*cs*0.25+3,28,6); g.restore(); }
  g.fillStyle='#4a3420'; g.fillRect(-14,-3,28,6);
  for(const d of nb){ g.save(); g.rotate(d*Math.PI/2); for(const off of [-9,9]){ g.fillStyle='#2a2628'; g.fillRect(off-2,-cs*0.5,4,cs*0.5+2); g.fillStyle='#9a9aa6'; g.fillRect(off-1.5,-cs*0.5,3,cs*0.5+1); g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(off-1.5,-cs*0.5,1,cs*0.5); } g.restore(); }
  g.restore();
}
function dunPaintCell(g,c,k,i,j,x,y,cs,st,rng,def){
  const t=c.typ[k];
  switch(t){
    case DTY.crack: dunTile(g,x,y,cs,st,i,j,rng,-0.05); g.strokeStyle='rgba(0,0,0,.6)'; g.lineWidth=1.6; g.beginPath(); { const cx=x+cs*(0.35+rng()*0.3), cy=y+cs*(0.35+rng()*0.3); for(let a=0;a<5;a++){ const an=a*1.3+rng(); g.moveTo(cx,cy); const mx=cx+Math.cos(an)*cs*0.25, my=cy+Math.sin(an)*cs*0.25; g.lineTo(mx,my); g.lineTo(mx+Math.cos(an+0.6)*cs*0.22,my+Math.sin(an+0.6)*cs*0.22); } } g.stroke(); g.strokeStyle='rgba(255,230,190,.12)'; g.lineWidth=1; g.stroke(); return true;
    case DTY.drop: dunHoleArt(g,c,i,j,x,y,cs,st,'255,200,140'); return true;
    case DTY.high: case DTY.ledge: { g.fillStyle=r2c((i+j)%2?st.floor:st.floor2,0.22); g.fillRect(x,y,cs,cs); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1.5; g.strokeRect(x+0.5,y+0.5,cs-1,cs-1); g.fillStyle='rgba(255,255,255,.07)'; g.fillRect(x+2,y+2,cs-4,3);
      const low=(q)=>q>=0&&q<c.typ.length&&c.grid[q]===0&&dunHq(c,q)===0;
      g.fillStyle=`rgba(${hexRGB(st.edge).join(',')},.5)`; if(low(k-c.w)) g.fillRect(x,y,cs,2.5); if(low(k-1)) g.fillRect(x,y,2.5,cs); if(low(k+1)) g.fillRect(x+cs-2.5,y,2.5,cs);
      if(t===DTY.ledge){ g.fillStyle='rgba(255,236,190,.35)'; for(const [q,dx,dy] of [[k+c.w,0,1],[k-1,-1,0],[k+1,1,0]]) if(low(q)){ for(let n=0;n<3;n++){ const px=x+cs/2+dx*cs*0.38+(dy?(n-1)*12:0), py=y+cs/2+dy*cs*0.38+(dx?(n-1)*12:0); g.beginPath(); g.moveTo(px+dx*4,py+dy*4); g.lineTo(px-dy*4-dx*2,py-dx*4-dy*2); g.lineTo(px+dy*4-dx*2,py+dx*4-dy*2); g.closePath(); g.fill(); } } }
      return true; }
    case DTY.ramp: { dunTile(g,x,y,cs,st,i,j,rng,0.08); for(let s=0;s<4;s++){ const yy=y+s*cs/4; g.fillStyle=r2c(st.floor,0.05+s*0.06); g.fillRect(x+2,yy+1,cs-4,cs/4-2); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+2,yy+cs/4-3,cs-4,2); } return true; }
    case DTY.basin0: case DTY.terrace: { dunTile(g,x,y,cs,st,i,j,rng,t===DTY.basin0?-0.3:-0.14); const rim=q=>q>=0&&q<c.typ.length&&c.typ[q]!==t; if(rim(k-c.w)){ const gr=g.createLinearGradient(0,y,0,y+cs*0.45); gr.addColorStop(0,'rgba(0,0,0,.45)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.45); }
      g.strokeStyle=`rgba(${hexRGB(st.water).map(v=>Math.min(255,v+60)).join(',')},.35)`; g.lineWidth=1.2; g.beginPath(); g.moveTo(x,y+cs*0.3+rng()*4); g.lineTo(x+cs,y+cs*0.32+rng()*4); g.stroke(); return true; }
    case DTY.raft: case DTY.raft2: { dunHoleArt(g,c,i,j,x,y,cs,st,null); g.strokeStyle=`rgba(${hexRGB(st.water).map(v=>Math.min(255,v+40)).join(',')},.3)`; g.lineWidth=1.5; for(let s=1;s<=(t===DTY.raft2?3:2);s++){ g.beginPath(); g.moveTo(x+3,y+cs*0.2*s+6); g.lineTo(x+cs-3,y+cs*0.2*s+6); g.stroke(); } return true; }
    case DTY.belt: { g.fillStyle='#3a3a42'; g.fillRect(x,y,cs,cs); g.fillStyle='#22222a'; g.fillRect(x+3,y+3,cs-6,cs-6); const d=c.flow[k]; g.fillStyle='#5a5a66'; for(let s=0;s<4;s++){ if(d===0||d===2) g.fillRect(x+4,y+4+s*11,cs-8,3); else g.fillRect(x+4+s*11,y+4,3,cs-8); } return true; }
    case DTY.rail: dunTile(g,x,y,cs,st,i,j,rng,-0.04); dunRailArt(g,c,k,x,y,cs); return true;
    case DTY.railpit: { dunHoleArt(g,c,i,j,x,y,cs,st,null); g.fillStyle='#3a2a18'; g.fillRect(x+cs/2-3,y+cs*0.55,6,cs*0.45); dunRailArt(g,c,k,x,y,cs); return true; }
    case DTY.tileP: case DTY.tileB: case DTY.tileG: { dunTile(g,x,y,cs,st,i,j,rng,-0.1); const col=TILE_RGB[TILE_COL[t]]; g.fillStyle=`rgba(${col},.35)`; rrect(g,x+5,y+5,cs-10,cs-10,6); g.fill(); g.strokeStyle=`rgba(${col},.75)`; g.lineWidth=2; g.stroke(); g.fillStyle=`rgba(${col},.8)`; g.beginPath(); g.moveTo(x+cs/2,y+cs/2-8); g.lineTo(x+cs/2+8,y+cs/2); g.lineTo(x+cs/2,y+cs/2+8); g.lineTo(x+cs/2-8,y+cs/2); g.closePath(); g.fill(); return true; }
  }
  return false;
}
const dunHq=(c,q)=>{ const t=c.typ[q]; return t===DTY.ramp?-1:isRaised(t)?1:0; };
{ const base=trialPaintCell; trialPaintCell=function(g,c,k,i,j,x,y,cs,st,rng,def){
    if(c.typ[k]>=13) return dunPaintCell(g,c,k,i,j,x,y,cs,st,rng,def);
    const P=TPAL[def.theme];
    // Trial floors in a plain cave: the cave's own tiles under spikes, runes and basins
    if(P&&P.cave){ const t=c.typ[k]; if(t===TY.rune||t===TY.spike||t===TY.basin){ dunTile(g,x,y,cs,st,i,j,rng,t===TY.basin?-0.25:0);
      if(t===TY.spike){ g.fillStyle='rgba(40,36,40,.55)'; g.fillRect(x+4,y+4,cs-8,cs-8); g.fillStyle='rgba(0,0,0,.6)'; for(let a=0;a<3;a++) for(let b=0;b<3;b++){ g.beginPath(); g.arc(x+10+a*14,y+10+b*14,2.6,0,TAU); g.fill(); } }
      if(t===TY.rune){ g.strokeStyle=`rgba(${P.rune},.55)`; g.lineWidth=2; g.beginPath(); g.moveTo(x+cs/2,y+8); g.lineTo(x+cs-8,y+cs/2); g.lineTo(x+cs/2,y+cs-8); g.lineTo(x+8,y+cs/2); g.closePath(); g.stroke(); }
      return true; } }
    return base.apply(this,arguments); }; }
// raised floors hang a short face over the cell below them, and drop a shadow at their sides
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){
    base.apply(this,arguments);
    const c=A.cave, cs=c.cell, st=CAVE_STYLE[def.theme]||CAVE_STYLE.earth; let any=false;
    for(let k=0;k<c.typ.length;k++) if(isRaised(c.typ[k])){ any=true; break; }
    if(!any) return;
    const g=A.canvas.getContext('2d'); g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
    for(let j=1;j<c.h;j++) for(let i=0;i<c.w;i++){ const k=j*c.w+i; if(c.grid[k]!==0||dunHq(c,k)!==0) continue; const x=i*cs, y=j*cs;
      if(dunHq(c,k-c.w)===1){ const fh=cs*0.58, gr=g.createLinearGradient(0,y,0,y+fh); gr.addColorStop(0,r2c(st.face,0.04)); gr.addColorStop(1,r2c(st.face,-0.7)); g.fillStyle=gr; g.fillRect(x,y,cs,fh);
        // stone courses in the cliff face
        g.fillStyle='rgba(0,0,0,.38)'; g.fillRect(x,y+fh*0.36,cs,1.5); g.fillRect(x,y+fh*0.7,cs,1.5);
        for(const [yy,off] of [[0,i%2?0.3:0.65],[fh*0.36,i%2?0.75:0.2],[fh*0.7,i%2?0.4:0.85]]) g.fillRect(x+cs*off,y+yy,2,fh*0.34);
        // the lip of the platform above, and the shadow at the foot of the face
        g.fillStyle=`rgba(${hexRGB(st.edge).join(',')},.85)`; g.fillRect(x,y-1,cs,3); g.fillStyle='rgba(255,240,210,.22)'; g.fillRect(x,y-3,cs,2);
        const sg=g.createLinearGradient(0,y+fh,0,y+fh+14); sg.addColorStop(0,'rgba(0,0,0,.45)'); sg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sg; g.fillRect(x,y+fh,cs,14);
        if(c.typ[k-c.w]===DTY.ledge){ g.fillStyle='rgba(255,236,190,.5)'; g.fillRect(x+cs*0.2,y+fh-3,cs*0.6,2); } }
      if(dunHq(c,k-1)===1){ const sg=g.createLinearGradient(x,0,x+10,0); sg.addColorStop(0,'rgba(0,0,0,.42)'); sg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sg; g.fillRect(x,y,10,cs); }
      if(dunHq(c,k+1)===1){ const sg=g.createLinearGradient(x+cs,0,x+cs-8,0); sg.addColorStop(0,'rgba(0,0,0,.3)'); sg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sg; g.fillRect(x+cs-8,y,8,cs); } }
    g.restore(); }; }
// the minimap knows the new cells
{ const base=renderCaveMini; renderCaveMini=function(A){
    base.apply(this,arguments); const c=A.cave, mm=A.mini; if(!mm) return; const mg=mm.getContext('2d'), im=mg.getImageData(0,0,c.w,c.h); let ch=false;
    for(let k=0;k<c.typ.length;k++){ const t=c.typ[k]; if(t<13||c.grid[k]!==0) continue; const a=k*4; if(im.data[a]===10&&im.data[a+1]===8) continue; const dim=im.data[a]+im.data[a+1]+im.data[a+2]<150?0.55:1;
      const v=t===DTY.drop||t===DTY.railpit||t===DTY.raft||t===DTY.raft2?[22,18,24]:t===DTY.basin0||t===DTY.terrace?[60,100,140]:isRaised(t)?[150,130,110]:t===DTY.rail?[120,90,60]:isTile(t)?[170,120,170]:null;
      if(v){ im.data[a]=v[0]*dim; im.data[a+1]=v[1]*dim; im.data[a+2]=v[2]*dim; ch=true; } }
    if(ch) mg.putImageData(im,0,0); }; }
// ---- the live floor layer (under every object and actor)
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A.dn) dunDrawFloor(A,t); }; }
function dunDrawFloor(A,t){
  const dn=A.dn, c=A.cave, cs=c.cell, T=A.tri, st=CAVE_STYLE[A.def.theme]||CAVE_STYLE.earth, wl=T.lvlShow!=null?T.lvlShow:(T.lvl||0);
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1);
  const j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  const wrgb=hexRGB(st.water).join(',');
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
    const k=j*c.w+i, ty=c.typ[k]; if(ty<13) continue; const x=A.x0+i*cs, y=A.y0+j*cs;
    if(ty===DTY.basin0||ty===DTY.terrace){ const f=clamp(wl-(ty===DTY.basin0?0:1),0,1); if(f>0.01){ ctx.fillStyle=`rgba(${wrgb},${0.25+0.65*f})`; ctx.fillRect(x,y,cs,cs); const ph=t*1.6+i*0.7+j*1.3; ctx.strokeStyle=`rgba(200,240,255,${0.12*f})`; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x+6,y+cs*0.55+Math.sin(ph)*3); ctx.quadraticCurveTo(x+cs/2,y+cs*0.45+Math.sin(ph+1)*3,x+cs-6,y+cs*0.6+Math.sin(ph+2)*3); ctx.stroke(); } }
    else if(ty===DTY.raft||ty===DTY.raft2){ const thr=ty===DTY.raft?1:2, f=clamp(wl-(thr-1),0,1); if(f>0.01){ ctx.fillStyle=`rgba(${wrgb},${0.3+0.6*f})`; ctx.fillRect(x+1,y+1,cs-2,cs-2); }
      const up=f>0.95, bob=up?Math.sin(t*2+i+j)*1.5:0, s=0.55+0.45*f, rx=x+cs/2, ry=y+cs/2+bob+(1-f)*6;
      ctx.fillStyle=`rgba(0,0,0,${0.15+0.2*f})`; ctx.fillRect(rx-cs*0.42*s+3,ry-cs*0.36*s+5,cs*0.84*s,cs*0.72*s);
      ctx.fillStyle=r2c(ty===DTY.raft?'#8a6a42':'#7a8a9a',(f-1)*0.6); ctx.fillRect(rx-cs*0.42*s,ry-cs*0.36*s,cs*0.84*s,cs*0.72*s);
      ctx.fillStyle=`rgba(0,0,0,${0.25})`; for(let n=1;n<3;n++) ctx.fillRect(rx-cs*0.42*s,ry-cs*0.36*s+n*cs*0.24*s,cs*0.84*s,1.5);
      if(up){ ctx.strokeStyle='rgba(220,250,255,.35)'; ctx.lineWidth=1.2; ctx.strokeRect(rx-cs*0.45,ry-cs*0.39,cs*0.9,cs*0.78); } }
    else if(ty===DTY.belt){ const d=DIRS[c.flow[k]]||DIRS[1]; ctx.strokeStyle='rgba(255,210,120,.55)'; ctx.lineWidth=3; ctx.lineCap='round'; for(let n=0;n<2;n++){ const f=((t*1.6+n*0.5)%1)-0.5, px=x+cs/2+d[0]*f*cs, py=y+cs/2+d[1]*f*cs; ctx.beginPath(); ctx.moveTo(px-d[0]*6-d[1]*9,py-d[1]*6-d[0]*9); ctx.lineTo(px+d[0]*4,py+d[1]*4); ctx.lineTo(px-d[0]*6+d[1]*9,py-d[1]*6+d[0]*9); ctx.stroke(); } }
    else if(ty===DTY.crack){ const s=dn.crk[k]; if(s===2){ ctx.fillStyle='#050403'; ctx.fillRect(x+2,y+2,cs-4,cs-4); const gr=ctx.createRadialGradient(x+cs/2,y+cs*0.6,2,x+cs/2,y+cs*0.6,cs*0.55); gr.addColorStop(0,'rgba(255,200,140,.18)'); gr.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=gr; ctx.fillRect(x,y,cs,cs); ctx.fillStyle='rgba(120,100,80,.6)'; ctx.fillRect(x+2,y+2,cs-4,3); }
      else if(s===1){ const sh=Math.sin(t*60+i)*2; ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+8+sh,y+10); ctx.lineTo(x+cs/2+sh,y+cs/2); ctx.lineTo(x+cs-10+sh,y+cs-8); ctx.moveTo(x+cs/2+sh,y+cs/2); ctx.lineTo(x+cs-8+sh,y+12); ctx.stroke(); if(Math.random()<0.3) emit(x+rand(4,cs-4),y+cs-6,1,{col:'110,90,70',glow:false,ang:Math.PI/2,spread:0.4,smin:10,smax:40,lmin:.3,lmax:.5,zmin:1.5,zmax:3}); } }
    else if(isTile(ty)){ const R=caveRoomAt(x+cs/2,y+cs/2); const col=TILE_RGB[TILE_COL[ty]]; let a=0.08+0.06*Math.sin(t*2+i+j); if(R&&R.solved) a=0.3; if(R&&R.flash&&R.flash.k===k&&R.flash.t>0){ a=0.7*R.flash.t*2; if(!R.flash.ok){ ctx.fillStyle=`rgba(255,60,40,${a*0.7})`; ctx.fillRect(x+4,y+4,cs-8,cs-8); continue; } } ctx.fillStyle=`rgba(${col},${a})`; ctx.fillRect(x+4,y+4,cs-8,cs-8); }
  }
  for(const R of Object.values(A.rooms)) if(R.flash&&R.flash.t>0) R.flash.t-=1/60;
  // moving platforms
  for(const m of dn.movers){ if(!inView(m.x+m.w/2,m.y+m.h/2,m.w)) continue; ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(m.x+6,m.y+10,m.w,m.h);
    ctx.fillStyle=r2lg(ctx,m.x,m.y,m.x,m.y+m.h,'#a07a4a','#6a4a2a'); ctx.fillRect(m.x+2,m.y+2,m.w-4,m.h-4); ctx.fillStyle='rgba(0,0,0,.25)'; for(let n=1;n<Math.round(m.w/16);n++) ctx.fillRect(m.x+2+n*16,m.y+2,1.5,m.h-4);
    ctx.strokeStyle='#3a2a18'; ctx.lineWidth=3; ctx.strokeRect(m.x+3,m.y+3,m.w-6,m.h-6); ctx.fillStyle='#c8a050'; for(const [qx,qy] of [[6,6],[m.w-10,6],[6,m.h-10],[m.w-10,m.h-10]]) ctx.fillRect(m.x+qx,m.y+qy,4,4); }
  // light beams
  if(dn.beam) for(const pts of dn.beam.segs){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; ctx.lineJoin='round';
    for(const [w,a] of [[18,0.08],[9,0.22],[3.5,0.85]]){ ctx.strokeStyle=`rgba(255,240,170,${a*(0.85+0.15*Math.sin(t*9))})`; ctx.lineWidth=w; ctx.beginPath(); pts.forEach((q,n)=>n?ctx.lineTo(q.x,q.y-10):ctx.moveTo(q.x,q.y-10)); ctx.stroke(); }
    const e=pts[pts.length-1]; glowAt(e.x,e.y-10,26,'255,240,170',0.5); ctx.restore(); }
  // guard lantern cones
  for(const e of dn.guards){ if(e.dead||!e.guard||e.guard.alert||!inView(e.x,e.y,260)) continue; drawGuardCone(A,e,t); }
}
function drawGuardCone(A,e,t){
  const g=e.guard, c=A.cave, n=14, pts=[];
  for(let s=0;s<=n;s++){ const a=e.face-g.half+2*g.half*s/n; let d=g.cone;
    for(let r=12;r<=g.cone;r+=12){ const x=e.x+Math.cos(a)*r, y=e.y+Math.sin(a)*r, k=tCell(x,y); if(k<0||(c.grid[k]===1&&c.typ[k]!==1)||(c.dyn[k]&&A.gates[c.dyn[k]-1]&&A.gates[c.dyn[k]-1].closed)||A.blocks.some(b=>!b.sunk&&b.cj*c.w+b.ci===k)){ d=r; break; } }
    pts.push([e.x+Math.cos(a)*d,e.y+Math.sin(a)*d]); }
  const hot=g.sus, col=hot>0.05?`255,${Math.round(200-150*hot)},${Math.round(90-60*hot)}`:'255,226,140';
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const gr=ctx.createRadialGradient(e.x,e.y,8,e.x,e.y,g.cone); gr.addColorStop(0,`rgba(${col},${0.32+0.25*hot})`); gr.addColorStop(1,`rgba(${col},0)`);
  ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(e.x,e.y); for(const [x,y] of pts) ctx.lineTo(x,y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=`rgba(${col},${0.25+0.3*hot})`; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
}
function guardDraw(e){
  const t=e.type; e.type='cultist'; try{ drawEnemy(e); } finally { e.type=t; }
  if(e.dead) return;
  const g=e.guard, lx=e.x+Math.cos(e.face+0.5)*14, ly=e.y+Math.sin(e.face+0.5)*14-14;
  ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(lx,ly-10); ctx.lineTo(lx,ly-4); ctx.stroke();
  ctx.fillStyle='#2a2a30'; ctx.fillRect(lx-5,ly-4,10,10); ctx.fillStyle=g&&g.alert?'#ff7a4a':'#ffd27a'; ctx.fillRect(lx-3,ly-2,6,6); glowAt(lx,ly+1,26,'255,210,120',0.5);
  if(g&&!g.alert&&g.sus>0.12){ ctx.font=`900 ${16+g.sus*8|0}px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='rgba(0,0,0,.7)'; const s=g.sus>0.7?'!':'?'; ctx.strokeText(s,e.x,e.y-e.r-26); ctx.fillStyle=g.sus>0.7?'#ff6a3a':'#ffe08a'; ctx.fillText(s,e.x,e.y-e.r-26); }
}
// ---- objects
const DUN_DRAW={};
{ const base=FL.tv; FL.tv=(o,t)=>{ const f=DUN_DRAW[o.kind]; if(f) return f(o.ref,t,o); return base(o,t); }; }
FL.dv=(o,t)=>{ const f=DUN_DRAW[o.kind]; if(f) f(o.ref,t,o); };
DUN_DRAW.lpod=(q,t)=>{
  const x=q.x, y=q.y, lit=q.lit;
  r2put(r2S('dlpod',44,70,22,58,g=>{ r2e(g,2,6,14,6,'rgba(0,0,0,.35)'); g.strokeStyle='#3e5a24'; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(0,4); g.quadraticCurveTo(-6,-14,0,-30); g.stroke(); g.fillStyle='#5a8a34'; for(const s of [-1,1]){ g.beginPath(); g.ellipse(s*7,-8,7,3,s*0.5,0,TAU); g.fill(); } g.fillStyle='#4a3a20'; g.beginPath(); g.ellipse(0,-34,9,4,0,0,TAU); g.fill(); }),x,y);
  const by=y-44+Math.sin(t*2+x)*1.5;
  if(lit){ glowAt(x,by,60,'255,200,110',0.55+0.1*Math.sin(t*3+x)); ctx.fillStyle=r2rg(ctx,x-3,by-4,1,13,'#fff6d0','#ffc050','#c86a1a'); }
  else ctx.fillStyle=r2rg(ctx,x-3,by-4,1,13,'#8a8a70','#5a5a44','#2a2a20');
  ctx.beginPath(); ctx.ellipse(x,by,11,13,0,0,TAU); ctx.fill(); ctx.strokeStyle=lit?'rgba(255,240,190,.8)':'rgba(30,30,20,.6)'; ctx.lineWidth=1.2; for(let a=-1;a<=1;a++){ ctx.beginPath(); ctx.ellipse(x+a*4,by,2+Math.abs(a)*3,12,0,0,TAU); ctx.stroke(); }
  if(lit){ ctx.strokeStyle=`rgba(255,210,120,${0.12+0.05*Math.sin(t*2)})`; ctx.lineWidth=2; ctx.setLineDash([8,10]); ctx.beginPath(); ctx.ellipse(x,y,q.reach,q.reach*0.8,0,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
  else if(q.group){ ctx.strokeStyle=`rgba(255,200,120,${0.3+0.2*Math.sin(t*3)})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,by,17,0,TAU); ctx.stroke(); }
};
FL.dspore=(o,t)=>{
  const x=o.x, y=o.y, hy=o.high?y-64:y-30, sw=Math.sin(t*1.4+x)*2;
  if(!o.high){ ctx.strokeStyle='#4a5a3a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y+6); ctx.quadraticCurveTo(x+sw,y-10,x+sw,hy+8); ctx.stroke(); r2e(ctx,x+2,y+6,10,4,'rgba(0,0,0,.3)'); }
  else { ctx.strokeStyle='rgba(90,110,70,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+sw,hy-40); ctx.lineTo(x+sw,hy-6); ctx.stroke(); r2e(ctx,x,y+4,12,5,'rgba(0,0,0,.18)'); }
  if(!o.burst){ const g=0.35+0.15*Math.sin(t*3+x); glowAt(x+sw,hy,30,'170,255,150',g*0.6); ctx.fillStyle=r2rg(ctx,x+sw-3,hy-3,1,12,'#e8ffd8','#8ad870','#3a6a2a'); ctx.beginPath(); ctx.ellipse(x+sw,hy,10,12,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.55)'; for(let n=0;n<4;n++){ ctx.beginPath(); ctx.arc(x+sw+Math.cos(n*1.7)*5,hy+Math.sin(n*1.7)*6,1.4,0,TAU); ctx.fill(); } }
  else { ctx.fillStyle='rgba(60,90,50,.8)'; ctx.beginPath(); ctx.ellipse(x+sw,hy+4,6,4,0,0,TAU); ctx.fill(); }
  if(o.burst&&o.gT>0){ const k=clamp(o.gT/6,0,1); for(let n=0;n<10;n++){ const f=((t*0.12+n*0.1)%1), px=x+Math.sin(n*2.3+t*0.7)*60*f, py=hy+f*70; ctx.fillStyle=`rgba(200,255,170,${0.8*k*(1-f*0.5)})`; ctx.beginPath(); ctx.arc(px,py,2.2,0,TAU); ctx.fill(); } glowAt(x,y+10,90,'170,255,150',0.25*k); }
};
FL.dstairs=(o,t)=>{
  // the shared stair art (a3c_art3.js): a flight climbing north for up, a well falling south for down, in one cell
  drawStairArt(o.x,o.y+2,44,44,o.dir==='up'?'up':'down','dun',t,false);
};
DUN_DRAW.tidec=(q,t)=>{
  const x=q.x, y=q.y, T=AREA.tri, on=T&&T.lvl===q.tune, bob=Math.sin(t*2+x)*2;
  r2put(r2S('dtidebase',50,40,25,20,g=>{ r2e(g,2,10,17,7,'rgba(0,0,0,.35)'); g.fillStyle=r2lg(g,-16,0,16,14,'#9ab0c0','#5a6a7a','#2a3440'); g.beginPath(); g.ellipse(0,7,16,8,0,0,TAU); g.fill(); }),x,y);
  const c1=on?'#c8f6ff':'#8ab8d8', c2=on?'#3ab8e8':'#3a6a98';
  ctx.fillStyle=r2lg(ctx,x-10,y-34+bob,x+10,y+bob,'#ffffff',c1,c2); ctx.beginPath(); ctx.moveTo(x,y-36+bob); ctx.lineTo(x+11,y-16+bob); ctx.lineTo(x+6,y+2+bob); ctx.lineTo(x-6,y+2+bob); ctx.lineTo(x-11,y-16+bob); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(20,60,90,.8)'; ctx.lineWidth=2; for(let n=0;n<=q.tune;n++){ const yy=y-22+bob+n*6; ctx.beginPath(); ctx.moveTo(x-6,yy); ctx.quadraticCurveTo(x-3,yy-3,x,yy); ctx.quadraticCurveTo(x+3,yy+3,x+6,yy); ctx.stroke(); }
  glowAt(x,y-16+bob,on?50:30,'120,210,255',on?0.55:0.25);
  ctx.font=`800 9px ${UIF}`; ctx.textAlign='center'; ctx.fillStyle=on?'#c8f6ff':'rgba(200,220,240,.75)'; ctx.fillText(LVL_NAME[q.tune].toUpperCase(),x,y+20);
};
DUN_DRAW.mirror=(q,t)=>{
  const x=q.x, y=q.y, A=AREA, works=mirrorWorks(A,q);
  r2e(ctx,x+2,y+8,16,6,'rgba(0,0,0,.35)'); ctx.fillStyle='#5a5a66'; ctx.beginPath(); ctx.ellipse(x,y+4,14,7,0,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(x,y-12); ctx.rotate(q.rot?Math.PI/4:-Math.PI/4);
  ctx.fillStyle='#8a7a5a'; ctx.fillRect(-20,-4,40,8); const g=ctx.createLinearGradient(-18,-3,18,3); g.addColorStop(0,'#e8f4ff'); g.addColorStop(0.5,works?'#ffffff':'#8aa0b0'); g.addColorStop(1,'#a8c8e8'); ctx.fillStyle=g; ctx.fillRect(-18,-2.5,36,5); ctx.restore();
  if(dunSunk(q)) dunUnderWater(x,y+4,40,30,t);
  else if(!works){ ctx.fillStyle='rgba(60,120,170,.35)'; ctx.beginPath(); ctx.ellipse(x,y-6,20,14,0,0,TAU); ctx.fill(); }
  ctx.strokeStyle='rgba(255,240,190,.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y-12,24,-0.6,0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(x,y-12,24,Math.PI-0.6,Math.PI+0.6); ctx.stroke();
};
FL.dbeamsrc=(o,t)=>{
  const x=o.x, y=o.y; r2e(ctx,x+2,y+8,16,7,'rgba(0,0,0,.35)'); ctx.fillStyle='#6a5a3a'; ctx.beginPath(); ctx.ellipse(x,y+4,15,8,0,0,TAU); ctx.fill();
  const g=ctx.createRadialGradient(x-3,y-16,1,x,y-12,14); g.addColorStop(0,'#ffffff'); g.addColorStop(0.5,'#ffe08a'); g.addColorStop(1,'#c8901a'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y-12,12,0,TAU); ctx.fill();
  for(let n=0;n<8;n++){ const a=n/8*TAU+t; ctx.strokeStyle='rgba(255,230,150,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*15,y-12+Math.sin(a)*15); ctx.lineTo(x+Math.cos(a)*20,y-12+Math.sin(a)*20); ctx.stroke(); }
  glowAt(x,y-12,60,'255,230,150',0.6);
};
FL.dbeamtgt=(o,t)=>{
  const x=o.x, y=o.y, lit=o.lit, hot=clamp(o.hot/0.35,0,1);
  r2e(ctx,x+2,y+8,15,6,'rgba(0,0,0,.35)'); ctx.fillStyle='#4a4a58'; ctx.beginPath(); ctx.ellipse(x,y+4,14,7,0,0,TAU); ctx.fill();
  const c1=lit?'#fff4c8':hot>0?'#ffe8a0':'#9a8ab8', c2=lit?'#ffb020':'#5a4a7a';
  ctx.fillStyle=r2lg(ctx,x-9,y-32,x+9,y,'#ffffff',c1,c2); ctx.beginPath(); ctx.moveTo(x,y-34); ctx.lineTo(x+10,y-14); ctx.lineTo(x,y+2); ctx.lineTo(x-10,y-14); ctx.closePath(); ctx.fill();
  glowAt(x,y-14,lit?60:30,lit?'255,214,110':'180,160,255',lit?0.6:0.2+0.4*hot);
};
DUN_DRAW.cart=(q,t)=>{
  if(q.fade>0) ctx.globalAlpha=1-q.fade; const x=q.x, y=q.y, rk=q.moving?Math.sin(q.rock||0)*1.2:0, d=q.dir>=0?q.dir:1, horiz=d===1||d===3;
  ctx.save(); ctx.translate(x,y+rk);
  ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(-20,-10,44,32);
  ctx.fillStyle='#22222a'; for(const [dx,dy] of horiz?[[-13,14],[13,14],[-13,-10],[13,-10]]:[[-15,-12],[15,-12],[-15,12],[15,12]]){ ctx.beginPath(); ctx.arc(dx,dy,5,0,TAU); ctx.fill(); }
  ctx.fillStyle='#3e2a18'; ctx.fillRect(-20,-14,40,30); ctx.fillStyle=r2lg(ctx,0,-18,0,10,'#9a7a4a','#5a3e24'); ctx.fillRect(-19,-18,38,26);
  ctx.fillStyle='#5a5a62'; ctx.fillRect(-20,-18,40,4); ctx.fillRect(-20,2,40,4); ctx.fillStyle='#8a8a92'; ctx.fillRect(-20,-18,40,1.5);
  if(!(AREA.dn&&AREA.dn.ride===q)){ ctx.fillStyle='#1a120a'; ctx.fillRect(-15,-14,30,10); }
  ctx.restore(); ctx.globalAlpha=1;
  if(!q.moving&&!(AREA.dn&&AREA.dn.ride)&&q.away<=0&&dist(player.x,player.y,x,y)<120){ ctx.strokeStyle=`rgba(255,220,150,${0.3+0.2*Math.sin(t*4)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,30,0,TAU); ctx.stroke(); }
};
DUN_DRAW.point=(q,t)=>{
  const x=q.x, y=q.y, pr=q.pairs[q.si]||[];
  ctx.save(); ctx.translate(x,y); ctx.lineCap='round';
  for(const d of [0,1,2,3]){ if(!q.pairs.some(p=>p.includes(d))) continue; const on=pr.includes(d), a=d*Math.PI/2-Math.PI/2; ctx.strokeStyle=on?'rgba(255,214,110,.95)':'rgba(120,110,100,.6)'; ctx.lineWidth=on?5:3; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*22,Math.sin(a)*22); ctx.stroke(); }
  ctx.restore();
  const lx=x+16, ly=y-18; ctx.fillStyle='#3a3a42'; ctx.fillRect(lx-6,ly+6,12,8); ctx.save(); ctx.translate(lx,ly+8); ctx.rotate(q.si%2?0.6:-0.6); ctx.fillStyle='#6a4a2a'; ctx.fillRect(-2,-18,4,18); ctx.fillStyle='#e8402a'; ctx.beginPath(); ctx.arc(0,-18,5,0,TAU); ctx.fill(); ctx.restore();
  glowAt(x,y,22,'255,214,110',0.25);
};
DUN_DRAW.plever=(q,t)=>{
  const x=q.x, y=q.y, pt=leverPoint(AREA,q), pr=pt?pt.pairs[pt.si]:null;
  r2e(ctx,x+2,y+8,13,6,'rgba(0,0,0,.35)'); ctx.fillStyle='#3a3a42'; ctx.fillRect(x-12,y-2,24,12); ctx.fillStyle='#5a5a64'; ctx.fillRect(x-12,y-4,24,4);
  ctx.save(); ctx.translate(x,y); ctx.rotate(pt&&pt.si%2?0.7:-0.7); ctx.fillStyle='#6a4a2a'; ctx.fillRect(-2.5,-26,5,26); ctx.fillStyle='#e8402a'; ctx.beginPath(); ctx.arc(0,-26,6,0,TAU); ctx.fill(); ctx.restore();
  if(pr){ ctx.save(); ctx.translate(x,y-40); ctx.fillStyle='rgba(20,14,8,.75)'; ctx.beginPath(); ctx.arc(0,0,12,0,TAU); ctx.fill(); ctx.strokeStyle='#ffd27a'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); for(const d of pr){ const a=d*Math.PI/2-Math.PI/2; ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*9,Math.sin(a)*9); } ctx.stroke(); ctx.restore(); }
};
DUN_DRAW.dchest=(q,t)=>{
  const x=q.x, y=q.y, big=q.big, open=G.found[q.id], sealed=!open&&dChestSealed(q), w=big?50:36, h=big?34:24;
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(3,h*0.45,w*0.6,h*0.35,0,0,TAU); ctx.fill();
  const wood=q.kind==='bkey'?'#5a2a2a':q.kind==='heart'?'#7a2a3a':q.kind==='compass'||q.kind==='dmap'?'#3a4a6a':'#7a4a24', trim=big?'#ffd060':'#d8b04a';
  ctx.fillStyle=r2lg(ctx,0,-h/2,0,h/2,r2c(wood,0.25),wood,r2c(wood,-0.45)); rrect(ctx,-w/2,-h/2+4,w,h-4,4); ctx.fill();
  if(open){ ctx.fillStyle='#140a04'; rrect(ctx,-w/2+4,-h/2+6,w-8,h*0.5,3); ctx.fill(); ctx.fillStyle=r2lg(ctx,0,-h-8,0,-h/2+4,r2c(wood,0.3),wood); rrect(ctx,-w/2,-h-6,w,h*0.5+4,4); ctx.fill(); ctx.fillStyle=trim; ctx.fillRect(-w/2,-h/2+1,w,3); }
  else { ctx.fillStyle=r2lg(ctx,0,-h/2-8,0,-h/2+10,r2c(wood,0.4),r2c(wood,0.05)); rrect(ctx,-w/2-1,-h/2-6,w+2,16,6); ctx.fill(); ctx.fillStyle=trim; ctx.fillRect(-w/2-1,-h/2+6,w+2,3); for(const s of [-0.32,0.32]) ctx.fillRect(s*w-2,-h/2-6,4,h+2); rrect(ctx,-6,-h/2+2,12,11,2); ctx.fill(); ctx.fillStyle='#3a2008'; ctx.beginPath(); ctx.arc(0,-h/2+7,2,0,TAU); ctx.fill(); }
  ctx.restore();
  if(dunSunk(q)) dunUnderWater(x,y,w,h,t);
  if(!open){ if(sealed){ ctx.strokeStyle=`rgba(160,255,140,${0.5+0.25*Math.sin(t*3)})`; ctx.lineWidth=3; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x-w*0.65,y+s*6); ctx.quadraticCurveTo(x,y+s*2-6,x+w*0.65,y+s*6); ctx.stroke(); } glowAt(x,y,44,'160,255,140',0.2); }
    else glowAt(x,y-4,big?60:40,q.kind==='heart'?'255,120,120':'255,210,120',(big?0.45:0.3)+0.15*Math.sin(t*3)); }
};
// a single root cell: thorny roots that shrink to a stump when burnt and creep back (shaking first) when they regrow
DUN_DRAW.roots=(q,t)=>{
  const g=q.grow!=null?q.grow:(q.opened?0:1), x=q.x, y=q.y;
  ctx.fillStyle='rgba(20,10,4,.4)'; ctx.beginPath(); ctx.ellipse(x,y,22,14,0,0,TAU); ctx.fill();
  if(g<0.03) return;
  const warn=q.opened&&q.regrowT>0&&q.regrowT<1.6, sh=warn?Math.sin(t*30)*1.5:0, s=0.3+0.7*g;
  ctx.save(); ctx.translate(x+sh,y); ctx.scale(s,s); ctx.lineCap='round';
  for(let i=0;i<7;i++){ const a=i*0.9, l=26; ctx.strokeStyle=i%2?'#4a3018':'#6a4424'; ctx.lineWidth=7-i*0.5; ctx.beginPath(); ctx.moveTo(Math.cos(a)*-l,Math.sin(a)*-l*0.8); ctx.quadraticCurveTo(Math.sin(i)*8,Math.cos(i)*8,Math.cos(a)*l,Math.sin(a)*l*0.8); ctx.stroke(); }
  ctx.fillStyle='#2a1a0a'; for(let i=0;i<6;i++){ const a=i*1.05+0.4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*15,Math.sin(a)*11); ctx.lineTo(Math.cos(a)*23,Math.sin(a)*17); ctx.lineTo(Math.cos(a+0.25)*14,Math.sin(a+0.25)*10); ctx.closePath(); ctx.fill(); }
  if(warn){ ctx.strokeStyle=`rgba(140,220,90,${0.4+0.3*Math.sin(t*12)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,28,0,TAU); ctx.stroke(); }
  if(q.heat>0) glowAt(0,0,34,'255,130,40',Math.min(0.8,q.heat));
  ctx.restore();
};
// a thing under the water: a blue wash over it, a ripple ring and rising bubbles
function dunUnderWater(x,y,w,h,t){
  const st=CAVE_STYLE[AREA.def.theme]||CAVE_STYLE.earth, rgb=hexRGB(st.water).join(',');
  ctx.fillStyle=`rgba(${rgb},.62)`; ctx.beginPath(); ctx.ellipse(x,y-h*0.2,w*0.75,h*0.95,0,0,TAU); ctx.fill();
  ctx.strokeStyle=`rgba(200,240,255,${0.25+0.15*Math.sin(t*2+x)})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x,y-h*0.2,w*0.62+Math.sin(t*2)*3,h*0.5,0,0,TAU); ctx.stroke();
  ctx.fillStyle='rgba(220,245,255,.7)'; for(let n=0;n<3;n++){ const f=((t*0.6+n*0.33)%1); ctx.beginPath(); ctx.arc(x+Math.sin(n*2.1+t)*w*0.3,y-h*0.2-f*h*1.1,1.6+n*0.5,0,TAU); ctx.fill(); }
}
DUN_DRAW.rootdoor=(o,t)=>{
  const g=o.grow; if(g<0.02){ ctx.fillStyle='rgba(20,10,4,.35)'; ctx.beginPath(); ctx.ellipse(o.x,o.y,40,16,0,0,TAU); ctx.fill(); return; }
  const horiz=o.vertical, L=horiz?70:22, Hh=horiz?22:70, heart=!!o.heart;
  ctx.save(); ctx.translate(o.x,o.y); ctx.lineCap='round';
  const n=heart?12:8;
  for(let i=0;i<n;i++){ const s=(i/(n-1)-0.5)*2, sw=Math.sin(t*1.3+i)*2*(o.regrowT>0&&o.regrowT<1.6?3:1);
    ctx.strokeStyle=i%2?'#4a3018':'#6a4424'; ctx.lineWidth=(heart?10:7)-Math.abs(s)*2;
    ctx.beginPath(); if(horiz){ ctx.moveTo(s*L,-Hh*g); ctx.quadraticCurveTo(s*L*0.6+sw,0,s*L*0.9,Hh*g); } else { ctx.moveTo(-L*g,s*Hh); ctx.quadraticCurveTo(0,s*Hh*0.6+sw,L*g,s*Hh*0.9); } ctx.stroke(); }
  if(heart){ const A=AREA, nn=podCount(A,o.heart);
    ctx.fillStyle=r2rg(ctx,-6,-6,2,30*g,'#9a6a3a','#6a4424','#3a2410'); ctx.beginPath(); ctx.ellipse(0,0,30*g,26*g,0,0,TAU); ctx.fill(); ctx.strokeStyle='#2a1808'; ctx.lineWidth=3; ctx.stroke();
    // one socket per lantern-pod that must glow: dark with a pale rim, or lit
    for(let i=0;i<o.need;i++){ const a=i/o.need*TAU-Math.PI/2, sx=Math.cos(a)*15*g, sy=Math.sin(a)*13*g, on=i<nn;
      ctx.fillStyle=on?'#ffd27a':'#1a1008'; ctx.beginPath(); ctx.arc(sx,sy,5.5,0,TAU); ctx.fill(); ctx.strokeStyle=on?'#fff0c0':'rgba(255,220,150,.55)'; ctx.lineWidth=1.6; ctx.stroke(); if(on) glowAt(sx,sy,16,'255,210,120',0.65); } }
  if(o.heat>0) glowAt(0,0,40,'255,130,40',Math.min(0.8,o.heat));
  ctx.restore();
};
DUN_DRAW.door_oneway=(o,t)=>{ if(!o.closed) return; const horiz=o.vertical, x=o.x, y=o.y, W2=horiz?144:48, H2=horiz?48:144;
  stoneBlock(x,y,W2,H2,'#7a5a3a','#3a2814',horiz?12:6); ctx.fillStyle='#4a4a52'; if(horiz){ ctx.fillRect(x-W2/2,y-6,W2,10); } else { ctx.fillRect(x-6,y-H2/2,10,H2); }
  ctx.fillStyle='#8a8a92'; for(let i=-1;i<=1;i++){ if(horiz) ctx.fillRect(x+i*44-4,y-9,8,16); else ctx.fillRect(x-9,y+i*44-4,16,8); } };
DUN_DRAW.door_timed=(o,t)=>{ if(!o.closed||o.tmp) return; const horiz=o.vertical, x=o.x, y=o.y, W2=horiz?144:48, H2=horiz?48:144;
  stoneBlock(x,y,W2,H2,'#5a6a7a','#2a3440',horiz?12:6); ctx.strokeStyle=`rgba(150,230,255,${0.5+0.3*Math.sin(t*3)})`; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x,y-(horiz?4:0),11,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y-(horiz?4:0)); ctx.lineTo(x,y-(horiz?12:8)); ctx.moveTo(x,y-(horiz?4:0)); ctx.lineTo(x+6,y-(horiz?4:0)); ctx.stroke(); };
DUN_DRAW.door_plate=(o,t)=>{ if(!o.closed||o.tmp) return; const horiz=o.vertical, x=o.x, y=o.y, W2=horiz?144:48, H2=horiz?48:144;
  stoneBlock(x,y,W2,H2,'#6a6a74','#2a2a34',horiz?12:6); ctx.fillStyle=`rgba(255,220,150,${0.5+0.3*Math.sin(t*3)})`; ctx.fillRect(x-9,y-(horiz?10:6),18,10); };
FL.dgpost=(o,t)=>{ const x=o.x, y=o.y; r2e(ctx,x+2,y+6,10,5,'rgba(0,0,0,.35)'); ctx.fillStyle='#5a4a3a'; ctx.fillRect(x-4,y-30,8,34); ctx.fillStyle='#8a7a6a'; ctx.fillRect(x-4,y-30,3,34); ctx.strokeStyle='#c8a050'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y-34,7,0,TAU); ctx.stroke(); glowAt(x,y-34,16,'255,220,150',0.2+0.1*Math.sin(t*2)); };

// ---------- 11. HUD: the room minimap, the key and item strip, and the dungeon page of the map screen
const DOOR_COL={open:'230,214,180',lock:'255,206,80',boss:'255,120,60',roots:'120,200,80',crack:'150,130,110',gate:'170,170,190',red:'255,120,170',blue:'120,170,255',oneway:'210,170,120',timed:'150,230,255',plate:'220,220,160'};
function dunKnown(A,R){ const SK=caveSid(A.def); return !!(G.found[`cv_${SK}_v_${R.id}`]||(hasDMap(A)&&R.kind!=='secret')); }
function dunMiniDraw(g,toM,sc){
  const A=AREA, c=A.cave, SK=caveSid(A.def), t=G.time, comp=hasDComp(A);
  if(A.mini){ g.globalAlpha=0.55; g.imageSmoothingEnabled=false; const [mx,my]=toM(A.x0,A.y0); g.drawImage(A.mini,mx,my,c.w*c.cell*sc,c.h*c.cell*sc); g.globalAlpha=1; }
  for(const id in A.rooms){ const R=A.rooms[id]; if(!dunKnown(A,R)) continue; const vis=G.found[`cv_${SK}_v_${id}`], [x0,y0]=toM(R.x0,R.y0), w=(R.x1-R.x0)*sc, h=(R.y1-R.y0)*sc;
    if(R===A.curRoom){ g.fillStyle=`rgba(255,226,150,${0.1+0.06*Math.sin(t*4)})`; g.fillRect(x0,y0,w,h); }
    g.strokeStyle=R===A.curRoom?'rgba(255,226,150,.95)':vis?'rgba(230,210,170,.6)':'rgba(170,150,120,.4)'; g.lineWidth=R===A.curRoom?2:1; g.strokeRect(x0+0.5,y0+0.5,w-1,h-1);
    if(R.solved&&(PUZZLE_KINDS[R.kind]||R.puzzle)){ g.strokeStyle='rgba(140,230,120,.85)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x0+w-9,y0+5); g.lineTo(x0+w-6,y0+8); g.lineTo(x0+w-2,y0+2); g.stroke(); }
    if(comp&&(R.kind==='boss'||R.kind==='tboss')&&!R.solved){ const [bx,by]=toM(R.cx,R.cy); g.fillStyle='#ff6a3a'; g.beginPath(); g.arc(bx,by,3.5,0,TAU); g.fill(); g.fillStyle='#1a0a06'; g.fillRect(bx-1.5,by-1,1,1); g.fillRect(bx+0.5,by-1,1,1); } }
  for(const o of A.gates){ if(!o.link) continue; const a=A.rooms[o.link.a], b=A.rooms[o.link.b]; if(!(dunKnown(A,a)||dunKnown(A,b))) continue; if(o.type==='crack'&&!o.opened) continue;
    const [x,y]=toM(o.x,o.y), shut=o.closed&&!o.tmp, col=DOOR_COL[o.type]||DOOR_COL.open; g.fillStyle=`rgba(${col},${shut?0.95:0.55})`; const L=shut?7:5; if(o.vertical) g.fillRect(x-L,y-1.5,L*2,3); else g.fillRect(x-1.5,y-L,3,L*2); }
  for(const o of A.objs){ let col=null, s=2.4;
    if(o.k==='smallkey'&&!G.found[o.id]) col='#ffd84a';
    else if(o.k==='dstairs'){ const [x,y]=toM(o.x,o.y); g.fillStyle='#e8d0a0'; g.beginPath(); if(o.dir==='up'){ g.moveTo(x,y-3.5); g.lineTo(x+3,y+2.5); g.lineTo(x-3,y+2.5); } else { g.moveTo(x,y+3.5); g.lineTo(x+3,y-2.5); g.lineTo(x-3,y-2.5); } g.closePath(); g.fill(); continue; }
    else if(comp&&((o.tobj==='dchest'||o.tobj==='chest'||o.k==='cchest')&&!G.found[o.id])){ col=o.big?'#ff9a4a':'#ffd27a'; s=o.big?3.2:2.4; }
    if(!col) continue; const R=caveRoomAt(o.x,o.y); if(R&&!dunKnown(A,R)&&o.k==='smallkey') continue; const [x,y]=toM(o.x,o.y); g.fillStyle=col; g.fillRect(x-s,y-s*0.75,s*2,s*1.5); }
}
function dunHudIcon(g,kind,x,y,on){
  g.save(); g.translate(x,y); g.globalAlpha=on?1:0.3; g.lineWidth=1.4;
  if(kind==='key'){ g.strokeStyle='#ffd84a'; g.fillStyle='#ffd84a'; g.beginPath(); g.arc(-4,0,3,0,TAU); g.stroke(); g.fillRect(-1,-0.8,8,1.8); g.fillRect(4,0,1.6,3); }
  else if(kind==='map'){ g.fillStyle='#e8d8b0'; g.fillRect(-6,-4.5,12,9); g.strokeStyle='#7a5a2a'; g.strokeRect(-6,-4.5,12,9); g.strokeStyle='#c8322a'; g.beginPath(); g.moveTo(1,0); g.lineTo(4,3); g.moveTo(4,0); g.lineTo(1,3); g.stroke(); }
  else if(kind==='compass'){ g.fillStyle='#c8a050'; g.beginPath(); g.arc(0,0,5.5,0,TAU); g.fill(); g.fillStyle='#f4ecd8'; g.beginPath(); g.arc(0,0,4,0,TAU); g.fill(); g.fillStyle='#d83a2a'; g.beginPath(); g.moveTo(0,-3.5); g.lineTo(1.4,0); g.lineTo(-1.4,0); g.closePath(); g.fill(); }
  else if(kind==='bkey'){ g.strokeStyle='#ff9a3a'; g.fillStyle='#ff9a3a'; g.lineWidth=2; g.beginPath(); g.arc(-4,0,3.4,0,TAU); g.stroke(); g.fillRect(-1,-1,9,2.2); g.fillRect(4,0,2,3.4); g.fillRect(6.4,0,1.6,2.6); }
  g.restore();
}
function dunHudStrip(M){
  const A=AREA; if(!A||!A.rooms) return;
  const g=ctx, cx=M.x+M.r, y=M.y+M.r*2+40, keys=A.keys(), D=dunOfArea(A), multi=D&&D.floorIds.length>1;
  const w=multi?150:118; g.fillStyle='rgba(10,8,6,.62)'; rr(cx-w/2,y-10,w,20,10); g.fill(); g.strokeStyle='rgba(255,220,180,.16)'; g.lineWidth=1; g.stroke();
  let x=cx-w/2+14;
  dunHudIcon(g,'key',x,y,keys>0); g.font=`800 11px ${UIF}`; g.textAlign='left'; g.fillStyle=keys>0?'#ffe9a0':'rgba(230,215,190,.5)'; g.fillText(`×${keys}`,x+9,y+1); x+=40;
  dunHudIcon(g,'map',x,y,hasDMap(A)); x+=20; dunHudIcon(g,'compass',x,y,hasDComp(A)); x+=20; dunHudIcon(g,'bkey',x,y,hasBKey(A)); x+=22;
  if(multi){ g.font=`800 10px ${TF}`; g.fillStyle='#e8d6b8'; g.textAlign='left'; g.fillText(A.def.floorShort||(A.def.floorIdx===0?'1F':'B'+A.def.floorIdx),x-4,y+1); }
}
// the dungeon page of the map screen: every floor, the rooms Ash has seen (all of them with the Dungeon Map)
function dunTplMarks(R){ const tpl=R.tpl?(Array.isArray(R.tpl)?R.tpl:CAVE_TPL[R.tpl]):null, out=[]; if(!tpl) return out; tpl.forEach((row,r)=>{ for(let c=0;c<row.length;c++){ const ch=row[c]; if(ch==='<'||ch==='>') out.push({ch,c,r}); } }); return out; }
function dunMapDraw(g,w,h){
  const A=AREA, D=dunOfArea(A), ids=D?D.floorIds:[A.def.id], DK=caveDsid(A.def), mapped=hasDMap(A), comp=hasDComp(A), t=G.time;
  g.setTransform(1,0,0,1,0,0); g.fillStyle='#0e0a08'; g.fillRect(0,0,w,h);
  // text sizes follow the size the canvas is shown at, so the labels stay readable on a phone
  const cw0=g.canvas.getBoundingClientRect?g.canvas.getBoundingClientRect().width:w, cw=cw0||w, kf=w/Math.max(160,cw), FP=px=>Math.round(px*kf);
  if(!cw0) requestAnimationFrame(()=>{ if(scene==='map'&&MAPUI.view===-1&&g.canvas.getBoundingClientRect().width) drawMapScreen(); });   // not laid out yet
  const floors=ids.map(id=>{ const M=CAVEMAP[id], def=AREADEFS[id]; let gx=0, gy=0; for(const k in M.rooms){ const R=M.rooms[k], sp=R.span||[1,1]; gx=Math.max(gx,R.at[0]+sp[0]); gy=Math.max(gy,R.at[1]+sp[1]); } return {id,M,def,gx,gy}; });
  const pad=30, top=Math.max(56,FP(40)), gap=40, bot=Math.max(40,FP(24)), totW=floors.reduce((s,f)=>s+f.gx,0), maxH=Math.max(...floors.map(f=>f.gy));
  const s=Math.min((w-pad*2-gap*(floors.length-1))/(totW||1),(h-top-pad-bot)/(maxH||1));
  g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${Math.max(26,FP(15))}px Cinzel, Georgia, serif`; g.fillStyle='#f2e2c4'; g.fillText(simplify(A.def.name||''),w/2,Math.max(26,FP(13)));
  let ox=(w-(totW*s+gap*(floors.length-1)))/2;
  for(const F of floors){
    const here=F.id===A.def.id, sid=caveSid(F.def), oy=top+((maxH-F.gy)*s)/2+10;
    let minY=1e9; for(const k in F.M.rooms) minY=Math.min(minY,F.M.rooms[k].at[1]);
    g.font=`600 ${Math.max(17,FP(11))}px Rubik, system-ui, sans-serif`; g.fillStyle=here?'#ffe2a0':'#c8b898'; g.fillText(simplify(F.def.floorName||(floors.length>1?(F.def.floorIdx===0?S('Ground floor','Ground floor'):S('Lower floor','Lower floor')):'')),ox+F.gx*s/2,oy+minY*s-Math.max(14,FP(9)));
    const rect=R=>{ const sp=R.span||[1,1]; return [ox+R.at[0]*s+4,oy+R.at[1]*s+4,sp[0]*s-8,sp[1]*s-8]; };
    const known={}; for(const k in F.M.rooms){ const R=F.M.rooms[k]; known[k]=!!(G.found[`cv_${sid}_v_${k}`]||(mapped&&R.kind!=='secret')); }
    (F.M.links||[]).forEach(([a,b,type,opt],li)=>{ if(!known[a]&&!known[b]) return; const Ra=F.M.rooms[a], Rb=F.M.rooms[b]; if(!Ra||!Rb) return; const ty=type.split(':')[0]; if(ty==='crack'&&!G.found[`cv_${sid}_link${li}`]) return;
      const [ax,ay,aw,ah]=rect(Ra), [bx,by,bw,bh]=rect(Rb); const x=(Math.max(ax,bx)+Math.min(ax+aw,bx+bw))/2, y=(Math.max(ay,by)+Math.min(ay+ah,by+bh))/2;
      const vert=Math.abs((ay+ah/2)-(by+bh/2))>Math.abs((ax+aw/2)-(bx+bw/2)); let shut=false;
      if(here){ const o=A.gates.find(q=>q.link&&q.link.i===li); shut=!!(o&&o.closed&&!o.tmp); } else shut=(ty==='lock'||ty==='boss'||ty==='oneway')&&!G.found[`cv_${sid}_link${li}`];
      const col=DOOR_COL[ty]||DOOR_COL.open; g.fillStyle=`rgba(${col},${shut?1:0.6})`; if(vert) g.fillRect(x-9,y-5,18,10); else g.fillRect(x-5,y-9,10,18); if(ty==='boss'&&shut){ g.fillStyle='#2a1206'; g.beginPath(); g.arc(x,y,2.5,0,TAU); g.fill(); } });
    for(const k in F.M.rooms){ const R=F.M.rooms[k]; if(!known[k]) continue; const [x,y,rw,rh]=rect(R), vis=G.found[`cv_${sid}_v_${k}`], cur=here&&A.curRoom&&A.curRoom.id===k;
      g.fillStyle=vis?(cur?'#6a5232':'#4a3a28'):'#241c14'; rrect(g,x,y,rw,rh,8); g.fill(); g.strokeStyle=cur?`rgba(255,226,150,${0.75+0.25*Math.sin(t*4)})`:vis?'rgba(230,210,170,.55)':'rgba(170,150,120,.35)'; g.lineWidth=cur?3:1.5; g.stroke();
      const solved=G.found[`cv_${sid}_${k}_solved`]; let ic=null;
      if((R.kind==='boss'||R.kind==='tboss')&&(comp||vis)) ic=solved?'·':'☠';
      if(ic){ g.font=`700 ${Math.round(Math.min(s*0.45,Math.max(20,FP(13))))}px Rubik, system-ui, sans-serif`; g.fillStyle=solved?'#9a8a70':'#ff7a4a'; g.fillText(ic,x+rw/2,y+rh/2); }
      if(solved&&(PUZZLE_KINDS[R.kind]||R.puzzle)){ g.strokeStyle='rgba(140,230,120,.9)'; g.lineWidth=2.5; g.beginPath(); g.moveTo(x+rw-20,y+12); g.lineTo(x+rw-14,y+18); g.lineTo(x+rw-6,y+6); g.stroke(); }
      if(R.npc&&vis){ g.fillStyle='#7fe0ff'; g.font='800 15px Rubik, system-ui, sans-serif'; g.fillText('!',x+14,y+16); }
      let n=0; for(const L of R.loot||[]){ const [kind]=L.split('+'); if(!DCHEST[kind]||!comp) continue; if(G.found[`dc_${sid}_${k}_${kind}`]) continue; const big=DCHEST[kind].big; g.fillStyle=big?'#ff9a4a':'#ffd27a'; g.fillRect(x+rw/2-8+n*14,y+rh-18,big?12:9,big?9:7); n++; }
      for(const m of dunTplMarks(R)){ const px=x+((m.c+1.5)/16)*rw*(16/15)/(R.span?R.span[0]:1), py=y+((m.r+1.5)/12)*rh*(12/11)/(R.span?R.span[1]:1); g.fillStyle='#e8d0a0'; g.beginPath(); if(m.ch==='<'){ g.moveTo(px,py-7); g.lineTo(px+6,py+5); g.lineTo(px-6,py+5); } else { g.moveTo(px,py+7); g.lineTo(px+6,py-5); g.lineTo(px-6,py-5); } g.closePath(); g.fill(); }
    }
    if(here){ const c=A.cave, ex=ox+((player.x-A.x0)/(c.cell*RSX))*s, ey=oy+((player.y-A.y0)/(c.cell*RSY))*s; g.save(); g.translate(ex,ey); g.rotate(player.facing); g.fillStyle='#ffd27a'; g.strokeStyle='#2a1606'; g.lineWidth=2.5; g.beginPath(); g.moveTo(12,0); g.lineTo(-8,-8); g.lineTo(-4,0); g.lineTo(-8,8); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    ox+=F.gx*s+gap;
  }
  const keys=A.keys(), y=h-Math.max(24,FP(12)); g.font=`600 ${Math.max(16,FP(10))}px Rubik, system-ui, sans-serif`; g.fillStyle='#e8d8c0'; g.textAlign='center';
  const yes=S('yes','yes'), no=S('not yet','not yet'), small=cw<520;
  const brief=`Keys ${keys} · Map ${mapped?yes:no} · Compass ${comp?yes:no} · Boss Key ${hasBKey(A)?yes:no}`;
  g.fillText(simplify(small?S(brief,brief):S(`Small keys ${keys}  ·  Dungeon Map: ${mapped?yes:no}  ·  Compass: ${comp?yes:no}  ·  Boss Key: ${hasBKey(A)?yes:no}`,`Keys ${keys} · Map ${mapped?yes:no} · Compass ${comp?yes:no} · Boss Key ${hasBKey(A)?yes:no}`)),w/2,y,w-20);
}
{ const base=mapTabsSync; mapTabsSync=function(){
    base.apply(this,arguments); const el=MAPUI.tabs; if(!el) return;
    let b=el.querySelector('button[data-dun]'); const inD=!!(AREA&&AREA.rooms);
    if(inD&&!b){ b=document.createElement('button'); b.type='button'; b.dataset.dun='1'; b.addEventListener('click',()=>{ if(scene!=='map') return; MAPUI.view=-1; mapSel=null; $('#bTravel').hidden=true; $('#mapInfo').textContent=mapInfoText(); mapTabsSync(); drawMapScreen(); SFX.play('ui'); }); el.insertBefore(b,el.firstChild); }
    if(b){ b.hidden=!inD; if(inD){ b.textContent=simplify(AREA.name); b.setAttribute('aria-pressed',String(MAPUI.view===-1)); } }
    if(inD) el.hidden=false; }; }
{ const base=overviewStep; overviewStep=function(rows){ if(scene==='map'&&MAPUI.view===-1) return; return base.apply(this,arguments); }; }
{ const base=mapInfoText; mapInfoText=function(){ if(MAPUI.view===-1&&AREA&&AREA.rooms) return `${simplify(AREA.name)}${AREA.def.floorName?' · '+simplify(AREA.def.floorName):''} · ${caveProgressText()}`; return base.apply(this,arguments); }; }

// ---------- 12. music: the dungeon's own theme, and the puzzle theme in puzzle rooms
{ const base=musicMood; musicMood=function(dt){
    const A=AREA, gs=A&&A.dn?A.dn.guards.filter(e=>!e.dead&&e.guard&&!e.guard.alert):[];
    for(const e of gs) e.aggro=false;
    let m; try{ m=base.apply(this,arguments); } finally { for(const e of gs) e.aggro=true; }
    if(A&&A.rooms&&(m==='cave'||m==='puzzle'||m==='deep')){ if(A.puzzleOn) return 'puzzle'; const D=dunOfArea(A), mm=(D&&D.music)||DUN_MUSIC[A.def.theme]; if(mm&&MSCORE[mm]) return mm; }
    return m; }; }
MSTING.heart={g:1.5,key:'F',mode:'ion',bpm:118,meter:4,step:4,intro:['S'],
  parts:[
    {n:'cel',i:'celesta',o:4,v:1,lead:1,pan:.12},
    {n:'harp',t:'arp',i:'harp',o:3,v:.55,ctr:9,pan:-.25,pat:'0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 c:8 c:16'},
    {n:'timp',t:'bass',i:'timp',o:2,v:.75,pat:'R:2 R:2 r:12 R:12 r:4'},
    {n:'pad',t:'pad',i:'pad',o:3,v:.5,ctr:9,pat:true,att:.2,rel:1.2}
  ],
  sec:{S:{ch:'1 4|1',cel:'5:2 3:2 5:4 6:2 5:2 8:4 | 10,12:12 r:4'}}};

// ---------- 13. debug hooks (window.__eb): caveMap(id) draws the rooms as text, dunGo(id,room) jumps into a room
const LINK_CH={open:'-',lock:'L',boss:'B',roots:'r',crack:'c',gate:'g',red:'p',blue:'u',oneway:'>',timed:'t',plate:'P'};
function caveMapText(id){
  const ids=dunFloorList(id), out=[];
  for(const aid of ids){ const M=CAVEMAP[aid], def=AREADEFS[aid]; if(!M){ out.push(`(no map for ${aid})`); continue; }
    let gx=0, gy=0; for(const k in M.rooms){ const R=M.rooms[k], sp=R.span||[1,1]; gx=Math.max(gx,R.at[0]+sp[0]); gy=Math.max(gy,R.at[1]+sp[1]); }
    const CW=14, CH=3, Wd=gx*(CW+3), Hd=gy*(CH+2), g=[]; for(let y=0;y<Hd;y++) g.push(Array(Wd).fill(' '));
    const put=(x,y,s)=>{ for(let i=0;i<s.length;i++) if(g[y]&&x+i<Wd) g[y][x+i]=s[i]; };
    const box=k=>{ const R=M.rooms[k], sp=R.span||[1,1]; return {x:R.at[0]*(CW+3),y:R.at[1]*(CH+2),w:sp[0]*(CW+3)-3,h:sp[1]*(CH+2)-2}; };
    for(const k in M.rooms){ const R=M.rooms[k], b=box(k); put(b.x,b.y,'+'+'-'.repeat(b.w-2)+'+'); for(let y=1;y<b.h-1;y++){ put(b.x,b.y+y,'|'); put(b.x+b.w-1,b.y+y,'|'); } put(b.x,b.y+b.h-1,'+'+'-'.repeat(b.w-2)+'+');
      put(b.x+1,b.y+1,(k+':'+R.kind).slice(0,b.w-2)); const extra=[R.loot&&R.loot.length?'$':'',R.boss?'!':'',R.npc?'@':'',R.dark?'d':'',R.reward==='key'?'k':''].join(''); put(b.x+1,b.y+2,extra.slice(0,b.w-2)); }
    for(const [a,b,type] of M.links){ const A1=box(a), B1=box(b), ch=LINK_CH[type.split(':')[0]]||'?';
      if(A1.y+A1.h<=B1.y||B1.y+B1.h<=A1.y){ const top=A1.y<B1.y?A1:B1, x=Math.max(A1.x,B1.x)+6; put(x,top.y+top.h,ch); put(x,top.y+top.h+1,ch); }
      else { const left=A1.x<B1.x?A1:B1, y=Math.max(A1.y,B1.y)+1; put(left.x+left.w,y,ch+ch+ch); } }
    out.push(`== ${aid}${def&&def.floorName?' ('+def.floorName+')':''}: ${Object.keys(M.rooms).length} rooms`); out.push(...g.map(r=>r.join('').replace(/\s+$/,'')));
  }
  out.push('links: - open, L lock, B boss door, r roots, c crack, g gate:<room>, p/u pillars, > one-way, t timed, P plate. Room marks: $ loot, ! boss, @ person, d dark, k small key');
  return out.join('\n');
}
function dunGo(id,room){
  const ids=dunFloorList(id); let aid=ids.find(a=>CAVEMAP[a]&&CAVEMAP[a].rooms[room])||ids[0];
  if(!AREA||dunRoot(AREA.def.id)!==dunRoot(id)){ const d=DOORS.find(q=>q.area===id); if(AREA) exitArea(true); enterArea(id,d||{x:player.x,y:player.y}); }
  if(AREA&&AREA.def.id!==aid) dunGoFloor(aid,{});
  const R=AREA&&AREA.rooms[room]; if(R){ const s=dunNearGround(R.cx,R.cy,7); player.x=s.x; player.y=s.y; updateCam(0,true); }
  return AREA?AREA.id:null;
}
window.__ebX=Object.assign(window.__ebX||{},{caveMap:id=>caveMapText(id),dunGo,dunGoFloor,defineDungeon,DUNGEONS,gainHeartEmber,dunSetLevel:L=>dunSetLevel(L,null),
  dun:()=>{ const A=AREA; if(!A||!A.dn) return null; const dn=A.dn; return {id:A.id,floor:A.def.floor,lvl:A.tri.lvl,keys:A.keys(),map:hasDMap(A),comp:hasDComp(A),bkey:hasBKey(A),ride:!!dn.ride,
    pods:dn.pods.map(o=>({id:o.id,lit:o.lit,group:o.group})),spores:dn.spores.map(o=>({id:o.id,burst:o.burst,ever:o.ever,high:o.high})),roots:dn.roots.map(o=>({id:o.id,opened:o.opened,regrowT:o.regrowT,heart:o.heart})),
    targets:dn.targets.map(o=>({id:o.id,lit:o.lit})),mirrors:dn.mirrors.map(o=>({id:o.id,rot:o.rot})),points:dn.points.map(o=>({id:o.id,si:o.si,n:o.pairs.length})),carts:dn.carts.map(o=>({id:o.id,ci:o.ci,cj:o.cj,moving:o.moving})),
    guards:dn.guards.filter(e=>!e.dead).map(e=>({x:Math.round(e.x),y:Math.round(e.y),alert:e.guard.alert,sus:e.guard.sus})),stairs:dn.stairs.map(s=>({dir:s.dir,room:s.room,x:s.x,y:s.y}))}; },
  dunObj:id=>AREA&&AREA.objs.find(o=>o.id===id),
  dunAct:id=>{ const o=AREA&&AREA.objs.find(q=>q.id===id&&(q.k!=='tv')); if(o) areaObjAct(o); return !!o; },
  dunHit:(id,src)=>{ const o=AREA&&AREA.objs.find(q=>q.id===id); if(!o) return false; return areaObjHit(o.x,o.y,10,src||'arrow'); },
  dunBreathAt:(x,y,dt)=>breathWorld(x-90,y,0,dt||0.5),
  dunAlarm:room=>{ const A=AREA; if(A&&A.rooms[room]) dunAlarm(A,A.rooms[room],null); },
  cartRide:id=>{ const o=AREA.objs.find(q=>q.id===id); if(o) cartBoard(o); return !!(AREA.dn&&AREA.dn.ride); },
  // run the game for sec seconds of game time without drawing (tests on a slow machine)
  dunSim:(sec,step)=>{ const d=step||1/30; let n=Math.ceil((sec||1)/d), done=0;
    while(n-->0){ if(scene==='play'){ updateTimers(d); if(scene==='play'){ if(G.slowT>0){ G.slowT-=d; if(G.slowT<=0) G.timeScale=1; } update(d*G.timeScale); } } else if(scene==='dialogue'){ updateDialogue(d); liteUpdate(d); } else liteUpdate(d); done++; }
    return done; },
  dunH:k=>dunH(k), dunGround:k=>tGround(k), dunCheckMove:(f,k)=>{ const hf=dunH(f), hk=dunH(k); return !(hf>=0&&hk>=0&&hf!==hk&&(hk>hf||AREA.cave.typ[f]!==DTY.ledge)); },
  // the solvability checker (scratchpad/w1_dun/t_dungeon.py) drives the real mechanics through these
  dunDbg:{TY:DTY,DIRS,isRail,railNb,cartNext,cartBlocked,cartBoard,burnRoots:o=>burnRoots(o),podLight,sporeBurst,mirrorTurn,mirrorWorks:o=>mirrorWorks(AREA,o),pointFlip,leverPull,leverPoint:o=>leverPoint(AREA,o),
    dunSetLevel,dunBeamTrace:()=>dunBeamTrace(AREA),rootSafe:o=>rootSafe(AREA,o),podCount:g=>podCount(AREA,g),dunCrackBreak:k=>dunCrackBreak(AREA,k),dunSunk,dChestSealed,dunFloorNext:d=>dunFloorNext(AREA,d),
    tGround,tWet,tHole,tCell,tPos,dunH,caveRoomAt,breakCrack,solveRoom,trialSwitchOn,refreshCaveGates,killEnemy,caveSid,caveDsid,podsOf:()=>AREA.dn.pods,gates:()=>AREA.gates,dunGoFloor}});

// ---------- 14. the dungeons whose CAVEMAP entry carries a dun:{...} block (the Act I rebuilds in a2f_caves.js, and any
// later module that follows the same pattern before e9a loads; modules after e9a call defineDungeon themselves)
for(const id in CAVEMAP){ const M=CAVEMAP[id]; if(M&&M.dun&&!M.dun.done){ M.dun.done=true; defineDungeon(id,M.dun); } }
// old saves: a quest reward or a Pip treat that the old layout already gave is not given again
const ONCE_GIFT={map_x1:()=>!G.items.map_x1&&!G.found.x1&&!G.found.whisper_chest_d,treat:()=>!G.found.mirrow_chest_c};
for(const id in DUNGEONS){ const D=DUNGEONS[id]; D.giftOK=Object.assign({},ONCE_GIFT,D.giftOK||{}); }
{ const base=exitArea; exitArea=function(){ if(AREA&&AREA.dn) dunNoteCleared(AREA); return base.apply(this,arguments); }; }
// the room count covers every floor, and on a lower floor the way out is up the stairs
{ const base=caveProgressText; caveProgressText=function(){ const A=AREA, D=A&&A.dn&&A.dn.D; if(!D||D.floorIds.length<2) return base.apply(this,arguments);
    let v=0, tot=0; for(const aid of D.floorIds){ const M=CAVEMAP[aid], def=AREADEFS[aid]; if(!M||!def) continue; const sk=caveSid(def); for(const id in M.rooms){ if(M.rooms[id].kind==='secret') continue; tot++; if(G.found[`cv_${sk}_v_${id}`]) v++; } }
    const keys=A.keys(); return `${v}/${tot} rooms explored${keys?` · ${keys} small key${keys>1?'s':''}`:''}`; }; }
{ const base=questObjective; questObjective=function(){ const o=base.apply(this,arguments), A=AREA;
    if(!o||!A||!A.dn||!A.exit||!A.exit.none) return o;
    let best=null, bd=1e18; for(const s of A.dn.stairs){ if(s.dir!=='up') continue; const d=dist2(s.x,s.y,player.x,player.y); if(d<bd){ bd=d; best=s; } }
    const text=String(o.text||'').replace('The way out is the south door of the first room.',S('The way out is up the stairs.','Go up the stairs to get out.'));
    return Object.assign({},o,{text,x:best?best.x:o.x,y:best?best.y:o.y}); }; }
// D.carry:{oldKey:newKey} marks a pickup of the new layout as taken when the old layout's twin was taken
{ const base=enterArea; enterArea=function(id,door){ const D=DUNGEONS[dunRoot(id)]; if(D&&D.carry&&G&&G.found) for(const k in D.carry) if(G.found[k]&&!G.found[D.carry[k]]) G.found[D.carry[k]]=true; return base.apply(this,arguments); }; }
// @@END
