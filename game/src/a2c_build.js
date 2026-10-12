
// ================= static structures
const STRUCTS=[], DECALS=[], LIGHTS=[], BRIDGES=[], CHESTS=[], HOUSES=[], LILIES=[], WARDS={}, LANTERNS=[];
const NPCSPOT={};
let GATE_COL=null;
function segInter(a,b){
  const d=a.dx*b.dy-a.dy*b.dx; if(Math.abs(d)<1e-6) return null;
  const t=((b.ax-a.ax)*b.dy-(b.ay-a.ay)*b.dx)/d, u=((b.ax-a.ax)*a.dy-(b.ay-a.ay)*a.dx)/d;
  if(t<0||t>1||u<0||u>1) return null;
  return {x:a.ax+a.dx*t,y:a.ay+a.dy*t};
}
function inClearing(x,y,extra){
  const e=extra||0;
  for(const k in POI){ const p=POI[k]; if(dist2(x,y,p.x,p.y)<(p.r+30+e)**2) return true; }
  for(const s of SHRINES) if(dist2(x,y,s.x,s.y)<(90+e)**2) return true;
  for(const c of CAMPS) if(dist2(x,y,c.x,c.y)<(140+e)**2) return true;
  for(const c of CHESTS) if(dist2(x,y,c.x,c.y)<(40+e)**2) return true;
  for(const l of LANDMARKS) if(dist2(x,y,l.x,l.y)<((l.k==='ribs'?150:l.k==='hotspring'?70:40)+e)**2) return true;
  for(const m of CAVEMOUTHS) if(dist2(x,y,m.x,m.y)<(110+e)**2) return true;
  for(const o of ORES) if(dist2(x,y,o.x,o.y)<(60+e)**2) return true;
  for(const l of LILIES) if(dist2(x,y,l.x,l.y)<(30+e)**2) return true;
  return false;
}
function placeHouses(cx,cy,n,r0,r1,rng,avoid,roofs,list){
  let made=0;
  for(let tries=0;tries<600&&made<n;tries++){
    const a=rng()*TAU, rr=r0+rng()*(r1-r0), x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
    const vert=rng()<0.5, w=vert?70+rng()*18:100+rng()*30, h=vert?100+rng()*30:70+rng()*18;
    if(segsDist(x,y,ROAD_SEGS)<Math.max(w,h)*0.6+28) continue;
    if(blockedAt(x,y)||blockedAt(x-w/2,y-h/2)||blockedAt(x+w/2,y+h/2)||blockedAt(x-w/2,y+h/2)||blockedAt(x+w/2,y-h/2)) continue;
    if(avoid.some(([ax,ay,ar])=>dist(x,y,ax,ay)<ar+Math.max(w,h)/2)) continue;
    if(SHRINES.some(s=>dist(x,y,s.x,s.y)<150)) continue;
    if(HOUSES.some(o=>Math.abs(o.x-x)<(o.w+w)/2+50&&Math.abs(o.y-y)<(o.h+h)/2+50)) continue;
    const hs={k:'house',x,y,w,h,vert,roof:pick(roofs),burnt:list.burnt?rng()<list.burnt:false,seed:Math.floor(rng()*1e9),town:list.town,snow:!!list.snow};
    HOUSES.push(hs); STRUCTS.push(hs); made++;
    addCol({t:'r',x0:x-w/2,y0:y-h/2,x1:x+w/2,y1:y+h/2});
    const tx=x-Math.max(30,w*0.34), ty=y+h/2+12;
    STRUCTS.push({k:'torch',x:tx,y:ty}); LIGHTS.push({x:tx,y:ty,r:170,i:0.75,fire:true,night:true});
  }
}
function ringStones(cx,cy,r,n,gaps,kind,col){
  for(let i=0;i<n;i++){ const a=i/n*TAU; if(gaps.some(g=>Math.abs(angDiff(a,g))<0.3)) continue; const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r; STRUCTS.push({k:kind||'stone',x,y,a,s:0.9+((i*37)%10)/30,snow:col==='snow'}); addCol({t:'c',x,y,r:20}); }
}
function gapsFor(cx,cy){ const g=[]; for(const s of ROAD_SEGS){ for(const [px,py] of [[s.ax,s.ay],[s.bx,s.by]]){ const d=dist(px,py,cx,cy); if(d>150&&d<800) g.push(angTo(cx,cy,px,py)); } } return g; }
function addWard(id,x,y){ WARDS[id]={id,x,y}; STRUCTS.push({k:'ward',id,x,y}); addCol({t:'c',x,y,r:18}); LIGHTS.push({x,y,r:240,i:0.85,ward:id}); }
function initWorld(){
  const rng=mulberry32(4242);
  for(const r of ROAD_SEGS){
    for(const w of RIVER_SEGS){ const p=segInter(r,w); if(p) BRIDGES.push({x:p.x,y:p.y,ang:r.ang,len:240,w:58,kind:'wood'}); }
    for(const w of LAVA_SEGS){ const p=segInter(r,w); if(p) BRIDGES.push({x:p.x,y:p.y,ang:r.ang,len:200,w:62,kind:'stone'}); }
  }
  // Obsidian Wall
  addCol({t:'r',x0:0,y0:WALL_Y-26,x1:GATE_X0-80,y1:WALL_Y+26});
  addCol({t:'r',x0:GATE_X1+80,y0:WALL_Y-26,x1:WORLD.w,y1:WALL_Y+26});
  addCol({t:'r',x0:GATE_X0-80,y0:WALL_Y-60,x1:GATE_X0,y1:WALL_Y+60});
  addCol({t:'r',x0:GATE_X1,y0:WALL_Y-60,x1:GATE_X1+80,y1:WALL_Y+60});
  GATE_COL=addCol({t:'r',x0:GATE_X0,y0:WALL_Y-20,x1:GATE_X1,y1:WALL_Y+20});
  STRUCTS.push({k:'wall'});
  LIGHTS.push({x:GATE_X0-40,y:WALL_Y+70,r:200,i:0.8,fire:true},{x:GATE_X1+40,y:WALL_Y+70,r:200,i:0.8,fire:true});
  const roofs=['#5c6470','#8a6a3a','#8e4a34','#6e5a48','#7a3a2a'];
  // ---- Emberhollow
  const V=POI.village;
  STRUCTS.push({k:'well',x:V.x,y:V.y,r:22}); addCol({t:'c',x:V.x,y:V.y,r:22});
  addWard('hollow',V.x-40,V.y-190);
  STRUCTS.push({k:'bigoak',x:V.x+30,y:V.y-230,R:95}); addCol({t:'c',x:V.x+30,y:V.y-230,r:20});
  for(const [i,x,y] of [[0,V.x-80,V.y+60],[1,V.x+300,V.y+130],[2,V.x-200,V.y-300]]){ const L={id:'lan'+i,x,y,lit:false}; LANTERNS.push(L); STRUCTS.push({k:'lantern',ref:L,x,y}); addCol({t:'c',x,y,r:7}); LIGHTS.push({x,y,r:180,i:0.8,lantern:L}); }
  const forge={k:'forge',x:V.x-300,y:V.y+220,w:120,h:84,roof:'#3e3834',seed:55,vert:false}; STRUCTS.push(forge); HOUSES.push(forge); addCol({t:'r',x0:V.x-360,y0:V.y+178,x1:V.x-240,y1:V.y+262}); LIGHTS.push({x:V.x-300,y:V.y+275,r:220,i:0.85,fire:true});
  NPCSPOT.maren=[V.x-300,V.y+300]; NPCSPOT.yara=[V.x+90,V.y+40];
  placeHouses(V.x,V.y,12,230,600,rng,[[V.x,V.y,170],[V.x-40,V.y-190,120],[V.x+30,V.y-230,110],[V.x-300,V.y+220,120],[V.x-80,V.y+60,60],[V.x+300,V.y+130,60],[V.x-200,V.y-300,60]],roofs,{burnt:0.2,town:'village'});
  for(let i=0;i<4;i++){ const a=Math.PI*0.55+i*0.42, x=V.x+Math.cos(a)*820, y=V.y+Math.sin(a)*820*0.75; if(segsDist(x,y,ROAD_SEGS)<160) continue; DECALS.push({k:'field',x,y,w:220+rng()*80,h:150+rng()*50,rot:rng()*0.6-0.3,crop:pick(['#9a8a3a','#6f8a35','#a8913f'])}); }
  // ---- war camp
  const C=POI.warcamp;
  DECALS.push({k:'dirt',x:C.x,y:C.y,r:340});
  const cg=gapsFor(C.x,C.y);
  for(let a=0;a<TAU;a+=0.12){ if(cg.some(g=>Math.abs(angDiff(a,g))<0.4)) continue; const x=C.x+Math.cos(a)*330, y=C.y+Math.sin(a)*330; STRUCTS.push({k:'stake',x,y,a}); addCol({t:'c',x,y,r:9}); }
  for(const a of [3.6,4.6,5.6,0.6]){ const x=C.x+Math.cos(a)*190, y=C.y+Math.sin(a)*190; STRUCTS.push({k:'tent',x,y,r:38,a}); addCol({t:'c',x,y,r:34}); }
  STRUCTS.push({k:'campfire',x:C.x,y:C.y}); LIGHTS.push({x:C.x,y:C.y,r:260,i:0.9,fire:true});
  // ---- Brindlecross
  const B=POI.brindle;
  const lib={k:'library',x:B.x+150,y:B.y-250,w:180,h:120,roof:'#3c4a6e',seed:77,vert:false}; STRUCTS.push(lib); HOUSES.push(lib); addCol({t:'r',x0:B.x+60,y0:B.y-310,x1:B.x+240,y1:B.y-190});
  NPCSPOT.wren=[B.x+150,B.y-160];
  DECALS.push({k:'flagstone',x:B.x-20,y:B.y+40,r:170});
  for(let i=0;i<6;i++){ const a=i/6*TAU+0.3, x=B.x-20+Math.cos(a)*120, y=B.y+40+Math.sin(a)*120; STRUCTS.push({k:'stall',x,y,a,col:pick(['#b8432e','#2e6ab8','#d9a43a','#3a8a5a'])}); addCol({t:'c',x,y,r:18}); }
  STRUCTS.push({k:'well',x:B.x-20,y:B.y+40,r:22}); addCol({t:'c',x:B.x-20,y:B.y+40,r:22});
  placeHouses(B.x,B.y,15,260,600,rng,[[B.x+150,B.y-250,160],[B.x-20,B.y+40,210]],roofs,{town:'brindle'});
  BRIDGES.push({x:6620,y:7400,ang:0,len:360,w:56,kind:'wood'});
  NPCSPOT.town=[]; for(let i=0;i<5;i++){ const a=rng()*TAU, r=180+rng()*250; NPCSPOT.town.push([B.x+Math.cos(a)*r,B.y+Math.sin(a)*r]); }
  // ---- Ash Ward (Shrine of the Scaled Oath)
  const O=POI.oath;
  DECALS.push({k:'flagstone',x:O.x,y:O.y,r:270});
  ringStones(O.x,O.y,300,14,gapsFor(O.x,O.y));
  addWard('ash',O.x,O.y);
  for(let i=0;i<4;i++){ const a=i/4*TAU+Math.PI/4, x=O.x+Math.cos(a)*140, y=O.y+Math.sin(a)*140; STRUCTS.push({k:'brazier',x,y}); addCol({t:'c',x,y,r:14}); LIGHTS.push({x,y,r:200,i:0.85,fire:true}); }
  // ---- Crag Ward (nests)
  const N=POI.nests, ng=gapsFor(N.x,N.y);
  for(let i=0;i<7;i++){ const a=rng()*TAU, rr=120+rng()*200; DECALS.push({k:'nest',x:N.x+Math.cos(a)*rr,y:N.y+Math.sin(a)*rr,r:38+rng()*16}); }
  for(let i=0;i<18;i++){ const a=i/18*TAU; if(ng.some(g=>Math.abs(angDiff(a,g))<0.3)) continue; const x=N.x+Math.cos(a)*(420+rng()*40), y=N.y+Math.sin(a)*(420+rng()*40); STRUCTS.push({k:'boulder',x,y,s:1+rng()*0.5,v:i%3}); addCol({t:'c',x,y,r:30}); }
  addWard('crag',N.x,N.y);
  // ---- Sunken Ward (Mirefen)
  const M=POI.mire, mg=gapsFor(M.x,M.y);
  for(let a=0;a<TAU;a+=0.22){ if(mg.some(g=>Math.abs(angDiff(a,g))<0.35)) continue; const x=M.x+Math.cos(a)*(330+rng()*30), y=M.y+Math.sin(a)*(330+rng()*30); STRUCTS.push({k:'post',x,y,a:rng()*TAU}); addCol({t:'c',x,y,r:9}); }
  DECALS.push({k:'mudring',x:M.x,y:M.y,r:200});
  addWard('mire',M.x,M.y);
  // ---- Frost Ward
  const F=POI.frost;
  DECALS.push({k:'flagstone',x:F.x,y:F.y,r:230,snow:true});
  ringStones(F.x,F.y,300,12,gapsFor(F.x,F.y),'stone','snow');
  addWard('frost',F.x,F.y);
  // ---- Granny Moss's hut
  const H=POI.mosshut;
  STRUCTS.push({k:'hut',x:H.x,y:H.y,r:46}); addCol({t:'c',x:H.x,y:H.y,r:44});
  STRUCTS.push({k:'cauldron',x:H.x+80,y:H.y+40}); addCol({t:'c',x:H.x+80,y:H.y+40,r:14}); LIGHTS.push({x:H.x+80,y:H.y+40,r:200,i:0.85,fire:true});
  NPCSPOT.moss=[H.x+60,H.y+90];
  // ---- Hollis Farm
  const Fa=POI.farm;
  for(const [dx,dy,w,h,roof] of [[-120,-110,110,78,'#6e5a48'],[140,-120,140,96,'#8a2e22']]){ const hs={k:'house',x:Fa.x+dx,y:Fa.y+dy,w,h,vert:false,roof,burnt:false,seed:Math.floor(rng()*1e9),snow:true,town:'farm'}; HOUSES.push(hs); STRUCTS.push(hs); addCol({t:'r',x0:hs.x-w/2,y0:hs.y-h/2,x1:hs.x+w/2,y1:hs.y+h/2}); }
  DECALS.push({k:'pen',x:Fa.x+60,y:Fa.y+150,w:170,h:110});
  NPCSPOT.hollis=[Fa.x-40,Fa.y+70];
  LIGHTS.push({x:Fa.x-120,y:Fa.y-60,r:160,i:0.7,fire:true,night:true});
  // ---- Coppergulch, Frostpine Lodge, the Smoky Kettle
  const manual=(x,y,w,h,roof,town,snow)=>{ const hs={k:'house',x,y,w,h,vert:false,roof,burnt:false,seed:Math.floor(rng()*1e9),snow:!!snow,town}; HOUSES.push(hs); STRUCTS.push(hs); addCol({t:'r',x0:x-w/2,y0:y-h/2,x1:x+w/2,y1:y+h/2}); STRUCTS.push({k:'torch',x:x-w*0.32,y:y+h/2+12}); LIGHTS.push({x:x-w*0.32,y:y+h/2+12,r:170,i:0.75,fire:true,night:true}); return hs; };
  const Cg=POI.copper; DECALS.push({k:'dirt',x:Cg.x,y:Cg.y,r:400});
  manual(Cg.x-40,Cg.y-120,150,90,'#5a4a3a','copper'); manual(Cg.x+200,Cg.y-30,120,80,'#6e5a48','copper'); manual(Cg.x-230,Cg.y+40,120,80,'#4a4038','copper');
  STRUCTS.push({k:'campfire',x:Cg.x+20,y:Cg.y+60}); LIGHTS.push({x:Cg.x+20,y:Cg.y+60,r:240,i:0.9,fire:true});
  const Lg=POI.lodge; manual(Lg.x,Lg.y-40,210,130,'#5a3a24','lodge',true); manual(Lg.x+230,Lg.y+90,100,74,'#6e5a48','lodge',true);
  DECALS.push({k:'flagstone',x:Lg.x,y:Lg.y+80,r:120,snow:true});
  const Wy=POI.way; manual(Wy.x-150,Wy.y-120,200,120,'#8a4a2a','way'); manual(Wy.x+180,Wy.y+120,110,76,'#6e5a48','way');
  DECALS.push({k:'dirt',x:Wy.x-120,y:Wy.y-20,r:150});
  // ---- Obsidian Gate courtyard
  const Gt=POI.gate;
  DECALS.push({k:'paving',x:Gt.x,y:Gt.y+20,w:600,h:520});
  for(const [x,y] of [[Gt.x-140,Gt.y-100],[Gt.x+140,Gt.y-100],[Gt.x-140,Gt.y+160],[Gt.x+140,Gt.y+160]]){ STRUCTS.push({k:'brazier',x,y}); addCol({t:'c',x,y,r:14}); LIGHTS.push({x,y,r:210,i:0.85,fire:true}); }
  // ---- summit
  const S=POI.summit;
  DECALS.push({k:'sigil',x:S.x,y:S.y,r:380});
  for(let i=0;i<6;i++){ const a=i/6*TAU, x=S.x+Math.cos(a)*430, y=S.y+Math.sin(a)*400; STRUCTS.push({k:'pillar',x,y,broken:i%2===1}); addCol({t:'c',x,y,r:30}); if(i%2===0) LIGHTS.push({x,y,r:220,i:0.85,fire:true}); }
  STRUCTS.push({k:'throne',x:S.x,y:S.y-470}); addCol({t:'r',x0:S.x-80,y0:S.y-510,x1:S.x+80,y1:S.y-430});
  // ---- proving grounds
  const P=POI.proving;
  DECALS.push({k:'sand',x:P.x,y:P.y,r:600});
  for(let a=0;a<TAU;a+=0.075){
    const nearGate=[0,Math.PI/2,Math.PI,-Math.PI/2].some(g=>Math.abs(angDiff(a,g))<0.11);
    const x=P.x+Math.cos(a)*625, y=P.y+Math.sin(a)*625;
    STRUCTS.push({k:'arena',x,y,a,gate:nearGate}); addCol(nearGate?{t:'c',x,y,r:26,normalOnly:true}:{t:'c',x,y,r:26});
  }
  for(let i=0;i<4;i++){ const a=i/4*TAU+Math.PI/4, x=P.x+Math.cos(a)*560, y=P.y+Math.sin(a)*560; STRUCTS.push({k:'brazier',x,y}); LIGHTS.push({x,y,r:240,i:0.85,fire:true}); }
  // ---- shrines, camps, ores
  for(const s of SHRINES){ STRUCTS.push({k:'shrine',x:s.x,y:s.y,ref:s}); addCol({t:'c',x:s.x,y:s.y,r:16}); LIGHTS.push({x:s.x,y:s.y,r:150,i:0.6,shrine:s}); }
  for(const c of CAMPS){ STRUCTS.push({k:'campfire',x:c.x,y:c.y,small:true}); LIGHTS.push({x:c.x,y:c.y,r:200,i:0.8,fire:true}); }
  for(const o of ORES){ STRUCTS.push({k:'ore',ref:o,x:o.x,y:o.y}); addCol({t:'c',x:o.x,y:o.y,r:16}); LIGHTS.push({x:o.x,y:o.y,r:120,i:0.5,ore:o}); }
  // ---- moonlilies in the Mirefen
  const tmp={};
  for(let tries=0;tries<4000&&LILIES.length<7;tries++){
    const x=M.x+rand(-1700,1700), y=M.y+rand(-1300,1300); T(x,y,tmp);
    if(tmp.b!==6||tmp.water||tmp.road>0||tmp.bog<0.15||tmp.bog>0.7||inClearing(x,y,40)) continue;
    if(LILIES.some(l=>dist2(l.x,l.y,x,y)<350*350)) continue;
    LILIES.push({id:'li'+LILIES.length,x,y,taken:false});
  }
  buildPlaces(); assignHomes(); registerSpeakers();
  for(const h of HOUSES) if(h.owner&&!(CASTBY[h.owner]||{}).generic) h.burnt=false;
  // ---- chests
  const quota=[5,5,4,4,3,5,4], have=[0,0,0,0,0,0,0];
  for(let tries=0;tries<9000&&CHESTS.length<30;tries++){
    const x=rand(250,WORLD.w-250), y=rand(250,WORLD.h-250);
    T(x,y,tmp); const b=tmp.b;
    if(have[b]>=quota[b]||tmp.water||tmp.lava||tmp.road>0||tmp.shore>0||tmp.bridge||tmp.bog>0.3) continue;
    if(Math.abs(y-WALL_Y)<140||inClearing(x,y,60)) continue;
    if(CHESTS.some(c=>dist2(c.x,c.y,x,y)<700*700)) continue;
    have[b]++; CHESTS.push({id:'ch'+CHESTS.length,x,y,b,open:false});
  }
}

// ================= props (trees, rocks, plants) per chunk
const CH=512, PROPS=new Map();
const ckey=(cx,cy)=>cx*1000+cy;
function propsFor(cx,cy){ const k=ckey(cx,cy); let a=PROPS.get(k); if(a) return a; a=genProps(cx,cy); PROPS.set(k,a); return a; }
const TREEK={oak:[48,11],pine:[40,11],birch:[36,8],dead:[40,8],spine:[40,11],willow:[52,10]};
function genProps(cx,cy){
  const rng=mulberry32(((cx*73856093)^(cy*19349663)^0x5bd1e995)|0), out=[], x0=cx*CH, y0=cy*CH, step=40, s={};
  if(cx<0||cy<0||x0>WORLD.w||y0>WORLD.h) return out;
  for(let gy=0;gy<CH;gy+=step) for(let gx=0;gx<CH;gx+=step){
    const x=x0+gx+rng()*step, y=y0+gy+rng()*step, r=rng(), v=rng(), sc=0.8+rng()*0.5;
    if(x<25||y<25||x>WORLD.w-25||y>WORLD.h-25) continue;
    if(Math.abs(y-WALL_Y)<80||inClearing(x,y)) continue;
    T(x,y,s);
    if(s.water||s.lava||s.bridge||s.road>0||s.roadD<30||s.shore>0.1) continue;
    const b=s.t<0.62&&rng()<0.5?s.b2:s.b;
    const grove=fbm(x*0.0016+7,y*0.0016-3,3);
    let p=null;
    if(b===1){
      if(r<0.42+grove*0.35) p={k:v<0.45?'oak':v<0.8?'pine':'birch'};
      else if(r<0.62) p={k:'bush'}; else if(r<0.66) p={k:'rock'}; else if(r<0.675) p={k:'herb'};
    }else if(b===0){
      if(grove>0.22&&r<0.45) p={k:v<0.7?'oak':'birch'};
      else if(r<0.03) p={k:'oak'}; else if(r<0.08) p={k:'bush'}; else if(r<0.1) p={k:'rock'}; else if(r<0.11) p={k:'herb'};
    }else if(b===2){
      if(r<0.06) p={k:'dead'}; else if(r<0.1) p={k:'stump'}; else if(r<0.15) p={k:'rock'}; else if(r<0.165) p={k:'bones'};
    }else if(b===3){
      if(r<0.12+Math.max(0,grove)*0.25) p={k:'crag'}; else if(r<0.18) p={k:'shrub'};
    }else if(b===4){
      if(r<0.06) p={k:'spike'}; else if(r<0.13) p={k:'obsid'}; else if(r<0.145) p={k:'vent'};
    }else if(b===5){
      if(r<0.18+Math.max(0,grove)*0.45) p={k:'spine'}; else if(r<0.27) p={k:'srock'}; else if(r<0.32) p={k:'fshrub'};
    }else if(b===6){
      if(s.bog>0.55) continue;
      if(s.bog>0.12&&r<0.5) p={k:'reed'};
      else if(r<0.1+Math.max(0,grove)*0.2) p={k:'willow'}; else if(r<0.2) p={k:'mbush'}; else if(r<0.24) p={k:'stump'}; else if(r<0.25) p={k:'herb'};
    }
    if(!p) continue;
    p.x=x; p.y=y; p.s=sc; p.v=Math.floor(v*997); p.ph=rng()*TAU; p.rot=rng()*TAU;
    const tk=TREEK[p.k];
    if(tk){ p.tall=true; p.R=tk[0]*sc; p.col={t:'c',x,y,r:tk[1]*sc}; }
    else if(p.k==='rock'||p.k==='obsid'||p.k==='srock'){ p.R=16*sc; p.col={t:'c',x,y,r:13*sc}; }
    else if(p.k==='crag'){ p.R=26*sc; p.col={t:'c',x,y,r:22*sc}; }
    else if(p.k==='spike'){ p.R=18*sc; p.col={t:'c',x,y,r:12*sc}; }
    else if(p.k==='stump'){ p.R=12*sc; p.col={t:'c',x,y,r:9*sc}; }
    else p.R=14*sc;
    out.push(p);
  }
  for(const p of out) if(p.col) addCol(p.col);
  return out;
}
function ensureProps(x,y,R){
  const c0=Math.floor((x-R)/CH), c1=Math.floor((x+R)/CH), r0=Math.floor((y-R)/CH), r1=Math.floor((y+R)/CH);
  for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++) propsFor(cx,cy);
}
