
// ================= v9 terrain for maps 1 and up (wave 1): biome and prop registries, the shared sampler
// Embermere (map 0) keeps T, blockedAt and the rest from a2_world.js exactly as they were; every wrapper below
// sends y < BAND straight to the old code. Maps 1 and up are sampled from their `terrain` data (see defineMap in
// e1_maps.js), compiled once per map into M.tz with a coarse grid for road, river and lava segments so a sample
// never scans another map's (or far away) segments. See scratchpad/MAPS.md.

// ---------- biomes (ids 10 and up; map k uses k*10 .. k*10+9)
const BIOMES={};
// defineBiome(id,{name,level,col:[base,light,dark],road,water:{deep,shallow,lip?},shore,props(rng,x,y,s,grove),decor(g,rng,x,y,s),
//   music,ambient:{snow,mist,rain,wind,embers,ash,birds,night,lava},critters:[...]|false,speed,footprints:'snow'|'sand'|null,chests,
//   roadW?,bog?,like?:embermereBiomeId,events?:{id:weight|false|fn},rgb?(c,s,x,y)->c})   A later call replaces the biome.
function defineBiome(id,def){
  if(!(id>=10)){ console.warn('defineBiome: ids 0 to 9 belong to Embermere'); return null; }
  def=Object.assign({level:1,col:['#6f8a48','#86a058','#56703a'],road:'#8a7a5a',water:{},shore:'#bfb08a',speed:1,chests:3,critters:false,footprints:null,ambient:{}},def);
  const W=def.water||{};
  def._road=hexRGB(def.road); def._shore=hexRGB(def.shore);
  def._water=[hexRGB(W.shallow||'#4a7a76'),hexRGB(W.deep||'#163446'),hexRGB(W.lip||'#bec8be')];
  def._crit=null; def._amb=null;
  BIOMES[id]=def; BCOL[id]=def.col.map(hexRGB);
  BIOME_NAME[id]=def.name||'the wilds'; BIOME_LEVEL[id]=def.level;
  if(def.music) MUSIC_BIOME[id]=def.music;
  AMBM.clear();
  return def;
}
// biomes without their own music play their map's theme
function mapBiomeMusic(){ for(const id in BIOMES) if(!BIOMES[id].music){ const M=MAPS[Math.floor(id/10)]; MUSIC_BIOME[id]=(M&&M.music)||'meadow'; } }

// ---------- prop kinds: new tree, rock and plant sprites
// definePropKind(kind,{n:variants, make(seed,v)->canvas (use spriteOf), tall?, R?:radius, col?:{r,low?}, h?:depth height, rot?:false})
const PROPK={};
function definePropKind(kind,def){
  def=Object.assign({n:3,R:14},def); PROPK[kind]=def;
  if(def.tall){ TALL.add(kind); TREEK[kind]=[def.R||44,(def.col&&def.col.r)||10]; TREEH[kind]=def.h||64; }
  if(SPR.shadow) propKindSprites(kind);
  return def;
}
function propKindSprites(kind){
  const d=PROPK[kind], L=[]; let h=0; for(let i=0;i<kind.length;i++) h=(h*31+kind.charCodeAt(i))|0;
  for(let v=0;v<d.n;v++){ let c=null; try{ c=d.make((h&0xffff)+v*131,v); }catch(e){ console.error('prop kind',kind,e); } if(c){ if(!c.half) c.half=c.width/4; L.push(c); } }
  if(L.length) SPR[kind]=L;
}
{ const base=buildSprites; buildSprites=function(){ base(); for(const k in PROPK) propKindSprites(k); }; }
// critters other than deer and rabbits: defineCritter(type,{r,draw(c)}) (they move like rabbits)
const CRITTERS={};
function defineCritter(type,def){ CRITTERS[type]=def; return def; }

// ---------- compiled terrain per map
let TZL=null;   // the nearest segment of the last grid query (like lastSeg for segsDist)
function tzOf(M){ return M.tz||(M.tz=tzCompile(M)); }
function mapTerrainInit(M){ tzOf(M); if(!M.tz.bridged){ M.tz.bridged=true; mapBridges(M); } }
function tzCompile(M){
  const t=M.terrain||{}, okSeg=s=>s.l2>0;
  const rivW=(t.rivers||[]).reduce((a,r)=>Math.max(a,r.w||62),62), lavW=(t.lava||[]).reduce((a,r)=>Math.max(a,r.w||48),48);
  const Z={M,y0:M.y0,w:M.w,h:M.h,
    seeds:t.seeds&&t.seeds.length?t.seeds:[[M.w/2,M.y0+M.h/2,M.k*10]],
    roads:mkSegs(t.roads||[],90).filter(okSeg), rivers:mkSegs(t.rivers||[],rivW+110).filter(okSeg), lava:mkSegs(t.lava||[],lavW+110).filter(okSeg),
    lakes:(t.lakes||[]).map(L=>({x:L.x,y:L.y,r:L.r,amp:L.amp!=null?L.amp:Math.min(130,L.r*0.22)})),
    ponds:(t.ponds||[]).slice(), isles:(t.isles||[]).slice(), walkways:(t.walkways||[]).slice(), lavaFields:(t.lavaFields||[]).slice(), lavaClear:(t.lavaClear||[]).slice(),
    extra:t.extra||null, block:t.block||null, sea:null};
  Z.roadG=segGrid(Z.roads,M); Z.rivG=segGrid(Z.rivers,M); Z.lavaG=segGrid(Z.lava,M);
  Z.hasLava=Z.lava.length>0||Z.lavaFields.length>0;
  if(t.sea){ const S=t.sea; Z.sea={shore:S.shore||60,shelf:S.shelf||170,stride:!!S.stride,noise:S.noise!=null?S.noise:110,fn:S.landD||null,sdf:S.land&&!S.landD?polySDF(S.land,M,80):null}; }
  return Z;
}
function segGrid(segs,M,cs){
  cs=cs||512; const nx=Math.ceil(M.w/cs)+1, ny=Math.ceil(M.h/cs)+1, cells=new Array(nx*ny).fill(null);
  for(const s of segs){
    const i0=Math.max(0,Math.floor(s.minx/cs)), i1=Math.min(nx-1,Math.floor(s.maxx/cs)), j0=Math.max(0,Math.floor((s.miny-M.y0)/cs)), j1=Math.min(ny-1,Math.floor((s.maxy-M.y0)/cs));
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*nx+i; (cells[k]||(cells[k]=[])).push(s); }
  }
  return {cs,nx,ny,y0:M.y0,cells,n:segs.length};
}
function gsDist(x,y,G){
  if(!G.n){ TZL=null; return 1e9; }
  const i=Math.floor(x/G.cs), j=Math.floor((y-G.y0)/G.cs);
  if(i<0||j<0||i>=G.nx||j>=G.ny){ TZL=null; return 1e9; }
  const L=G.cells[j*G.nx+i]; if(!L){ TZL=null; return 1e9; }
  let best=1e18, bs=null;
  for(let n=0;n<L.length;n++){
    const s=L[n]; if(x<s.minx||x>s.maxx||y<s.miny||y>s.maxy) continue;
    let t=((x-s.ax)*s.dx+(y-s.ay)*s.dy)/s.l2; t=t<0?0:t>1?1:t;
    const px=s.ax+s.dx*t-x, py=s.ay+s.dy*t-y, d=px*px+py*py;
    if(d<best){ best=d; bs=s; }
  }
  TZL=bs; return bs?Math.sqrt(best):1e9;
}
// the sea: a signed distance grid of the land polygon (positive on land), sampled bilinearly, plus a noisy coastline
function polySD(P,x,y){
  let inside=false, best=1e18;
  for(let i=0,j=P.length-1;i<P.length;j=i++){
    const ax=P[j][0], ay=P[j][1], bx=P[i][0], by=P[i][1];
    if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax)) inside=!inside;
    const dx=bx-ax, dy=by-ay, l2=dx*dx+dy*dy||1; let t=((x-ax)*dx+(y-ay)*dy)/l2; t=t<0?0:t>1?1:t;
    const px=ax+dx*t-x, py=ay+dy*t-y, d=px*px+py*py; if(d<best) best=d;
  }
  const s=Math.sqrt(best); return inside?s:-s;
}
function polySDF(P,M,cs){
  const nx=Math.ceil(M.w/cs)+2, ny=Math.ceil(M.h/cs)+2, d=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++) d[j*nx+i]=polySD(P,i*cs,M.y0+j*cs);
  return {cs,nx,ny,y0:M.y0,d};
}
function sdfAt(S,x,y){
  let fx=x/S.cs, fy=(y-S.y0)/S.cs; if(fx<0) fx=0; if(fy<0) fy=0; if(fx>S.nx-1.001) fx=S.nx-1.001; if(fy>S.ny-1.001) fy=S.ny-1.001;
  const i=fx|0, j=fy|0, u=fx-i, v=fy-j, k=j*S.nx+i, d=S.d;
  return (d[k]*(1-u)+d[k+1]*u)*(1-v)+(d[k+S.nx]*(1-u)+d[k+S.nx+1]*u)*v;
}
function zLandD(x,y,Z){
  const S=Z.sea; if(S.fn) return S.fn(x,y);
  const d=sdfAt(S.sdf,x,y), A=S.noise;
  if(d>A*1.3+260||d<-A*1.3-500) return d;
  return d+fbm(x*0.0022+17,y*0.0022-5,3)*A+fbm(x*0.012,y*0.012,2)*A*0.12;
}
// signed distance to water (negative is water); ZW.sea says the nearest water is the sea
const ZW={sea:0};
function zWaterD(x,y,Z){
  let wd=1e9; ZW.sea=0;
  if(Z.rivG.n){ const d=gsDist(x,y,Z.rivG); if(d<1e8){ const w=TZL.w||62; wd=d-w-(d<w+170?fbm(x*0.004,y*0.004,2)*20:0); } }
  const LK=Z.lakes; for(let i=0;i<LK.length;i++){ const L=LK[i], dx=x-L.x, dy=y-L.y, R=L.r+L.amp+170; if(dx*dx+dy*dy>R*R) continue; const v=Math.sqrt(dx*dx+dy*dy)-(L.r+fbm(x*0.003+3,y*0.003-4,2)*L.amp); if(v<wd) wd=v; }
  const PD=Z.ponds; for(let i=0;i<PD.length;i++){ const p=PD[i], dx=x-p.x, dy=y-p.y; if(dx*dx+dy*dy>(p.r+200)*(p.r+200)) continue; const d=Math.sqrt(dx*dx+dy*dy), n=fbm(x*0.01+p.x*0.1,y*0.01,2)*14; const v=p.inner?Math.max(d-(p.r+n),(p.inner-n)-d):d-(p.r+n); if(v<wd) wd=v; }
  if(Z.sea){ const ld=zLandD(x,y,Z); if(ld<wd){ wd=ld; ZW.sea=1; } }
  if(Z.isles.length&&wd<120){ let id=1e9; for(const s of Z.isles){ const d=dist(x,y,s.x,s.y)-(s.r+fbm(x*0.012+s.x,y*0.012-s.y,2)*s.r*0.12); if(d<id) id=d; } if(id<160) wd=Math.max(wd,-id); }
  return wd;
}
function zLavaS(x,y,Z){
  let s=0;
  if(Z.lavaG.n){ const d=gsDist(x,y,Z.lavaG); if(d<1e8){ const w=TZL.w||48; s=clamp((w+fbm(x*0.005,y*0.005,2)*16-d)/16,0,1); } }
  const LF=Z.lavaFields; for(let i=0;i<LF.length;i++){ const F=LF[i], dx=x-F.x, dy=y-F.y, R=F.r*1.25+40; if(dx*dx+dy*dy>R*R) continue; const v=clamp((F.r+fbm(x*0.004+F.x*0.01,y*0.004,3)*F.r*0.22-Math.sqrt(dx*dx+dy*dy))/20,0,1); if(v>s) s=v; }
  if(s>0) for(const c of Z.lavaClear){ const d=dist(x,y,c[0],c[1]); if(d<c[2]+80) s=Math.min(s,clamp((d-c[2])/80,0,1)); }
  return s;
}
function zBiome(x,y,o,Z){
  const wx=x+fbm(x*0.0005,y*0.0005,3)*640, wy=y+fbm(x*0.0005+40,y*0.0005-20,3)*640, S=Z.seeds;
  let d1=1e18,d2=1e18,b1=S[0][2],b2=S[0][2];
  for(let i=0;i<S.length;i++){ const s=S[i], dx=wx-s[0], dy=wy-s[1], d=dx*dx+dy*dy; if(d<d1){ d2=d1; b2=b1; d1=d; b1=s[2]; } else if(d<d2){ d2=d; b2=s[2]; } }
  if(d2>=1e18){ b2=b1; d2=d1+280*280*4; }
  o.b=b1; o.b2=b2; o.t=0.5+0.5*clamp((Math.sqrt(d2)-Math.sqrt(d1))/280,0,1);
  return o;
}
function tOut(o,M){
  const b=M&&M.tz?M.tz.seeds[0][2]:M?M.k*10:0;
  // same field order as T in a2_world.js plus its wrapper below, so every sample object keeps one shape (fast)
  o.out=1; o.b=b; o.b2=b; o.t=1; o.n=0; o.roadAng=0; o.roadD=1e9; o.water=0; o.depth=0; o.shore=0; o.road=0; o.bridge=0; o.lava=0; o.bog=0; o.lavaS=0;
  o.ice=0; o.sand=0; o.snow=0; o.sea=0; o.deep=0; o.seaD=0;
  return o;
}
// the sample for maps 1 and up: the same fields as T in a2_world.js, plus ice, sand, snow (0 unless `extra` sets them),
// sea (water that is sea), deep (sea past the shelf: blocks even Water Stride) and seaD (0..1 how far out to sea)
function mapT(x,y,o){
  const M=MAPS[mapAt(y)];
  if(!M||x<0||y<M.y0||x>M.w||y>M.y0+M.h) return tOut(o,M);
  const Z=M.tz||tzOf(M);
  o.out=0;
  zBiome(x,y,o,Z);
  o.n=fbm(x*0.004,y*0.004,3);
  const rdd=gsDist(x,y,Z.roadG); o.roadAng=TZL?TZL.ang:0; o.roadD=rdd;
  const wd=zWaterD(x,y,Z), sea=ZW.sea;
  o.water=wd<0?1:0; o.depth=clamp(-wd/70,0,1);
  const sw=sea?Z.sea.shore:30; o.shore=wd>=0&&wd<sw?1-wd/sw:0;
  const B=BIOMES[o.b], roadW=B&&B.roadW||19;
  o.road=rdd<roadW?1:rdd<roadW+10?1-(rdd-roadW)/10:0;
  o.bridge=0; o.lava=0; o.bog=0;
  if(o.water&&rdd<34) o.bridge=1;
  o.lavaS=Z.hasLava?zLavaS(x,y,Z):0;
  o.ice=0; o.sand=0; o.snow=0;
  o.sea=o.water&&sea?1:0; o.deep=o.sea&&-wd>Z.sea.shelf?1:0; o.seaD=o.sea?clamp(-wd/420,0,1):0;
  if(o.lavaS>0.5){ if(rdd<36){ o.bridge=2; o.lavaS=0; } else o.lava=1; }
  if(rdd<36) o.lavaS=Math.min(o.lavaS,0.45);
  if(B&&B.bog&&!o.water&&o.t>0.6) o.bog=bogS(x,y,rdd)*clamp((o.t-0.6)/0.2,0,1);
  if(Z.extra) Z.extra(x,y,o);
  return o;
}
// walker blocking on maps 1 and up: the `block` hook, then roads (always pass, they are bridges), walkways, water, lava
function mapBlocked(x,y){
  const M=MAPS[mapAt(y)];
  if(!M||x<30||y<M.y0+30||x>M.w-30||y>M.y0+M.h-30) return true;
  const Z=M.tz||tzOf(M);
  if(Z.block&&Z.block(x,y)) return true;
  if(gsDist(x,y,Z.roadG)<34) return false;
  const WK=Z.walkways; for(let i=0;i<WK.length;i++){ const w=WK[i]; if(x>=w.x0&&x<=w.x1&&y>=w.y0&&y<=w.y1) return false; }
  if(zWaterD(x,y,Z)<0) return true;
  if(Z.hasLava&&zLavaS(x,y,Z)>0.5) return true;
  return false;
}
// what still blocks Ash with Water Stride: the block hook, lava, and the deep sea (unless the map's sea says stride:true)
function mapStrideBlocked(x,y){
  const M=MAPS[mapAt(y)];
  if(!M||x<30||y<M.y0+30||x>M.w-30||y>M.y0+M.h-30) return true;
  const Z=M.tz||tzOf(M);
  if(Z.block&&Z.block(x,y)) return true;
  if(gsDist(x,y,Z.roadG)<34) return false;
  const WK=Z.walkways; for(let i=0;i<WK.length;i++){ const w=WK[i]; if(x>=w.x0&&x<=w.x1&&y>=w.y0&&y<=w.y1) return false; }
  if(Z.hasLava&&zLavaS(x,y,Z)>0.5) return true;
  if(Z.sea&&!Z.sea.stride){ const wd=zWaterD(x,y,Z); if(ZW.sea&&-wd>Z.sea.shelf) return true; }
  return false;
}
function mapLavaHere(x,y){ const M=MAPS[mapAt(y)]; if(!M||!M.k) return false; const Z=M.tz||tzOf(M); return Z.hasLava&&gsDist(x,y,Z.roadG)>=36&&zLavaS(x,y,Z)>0.5; }
// bridges where a map's roads cross its water or lava: walk each road and drop a bridge on every wet run
function mapBridges(M){
  const Z=tzOf(M), s={};
  for(const r of Z.roads){
    const L=Math.sqrt(r.l2), n=Math.ceil(L/14); let run=-1, kind='wood';
    for(let i=0;i<=n+1;i++){
      let wet=false, lava=false;
      if(i<=n){ const t=i/n, x=r.ax+r.dx*t, y=r.ay+r.dy*t; wet=zWaterD(x,y,Z)<0; lava=!wet&&Z.hasLava&&zLavaS(x,y,Z)>0.5; }
      if((wet||lava)&&run<0){ run=i; kind=lava?'stone':'wood'; }
      else if(!(wet||lava)&&run>=0){
        const t0=Math.max(0,(run-1)/n), t1=Math.min(1,(i)/n), tm=(t0+t1)/2, len=(t1-t0)*L+40;
        BRIDGES.push({x:r.ax+r.dx*tm,y:r.ay+r.dy*tm,ang:r.ang,len:Math.max(len,120),w:kind==='wood'?58:62,kind,map:M.k}); run=-1;
      }
    }
  }
  // terrain walkways get plank decks (draw:false for one that is drawn some other way)
  for(const w of Z.walkways){ if(w.draw===false) continue; const ww=w.x1-w.x0, hh=w.y1-w.y0, v=hh>ww;
    BRIDGES.push({x:(w.x0+w.x1)/2,y:(w.y0+w.y1)/2,ang:v?Math.PI/2:0,len:v?hh:ww,w:(v?ww:hh)+4,kind:w.kind||'wood',map:M.k}); }
}

// ---------- the dispatch: Embermere keeps the stock code, the other maps use the sampler above
{ const base=T; T=function(x,y,o){ o=o||SAMPLE; if(y<BAND){ base(x,y,o); o.ice=0; o.sand=0; o.snow=0; o.sea=0; o.deep=0; o.seaD=0; return o; } return mapT(x,y,o); }; }
{ const base=blockedAt; blockedAt=function(x,y){ if(y<BAND||x>=IZX-50) return base(x,y); return mapBlocked(x,y); }; }
{ const base=biomeInfo; biomeInfo=function(x,y,o){ if(y<BAND) return base(x,y,o); const M=MAPS[mapAt(y)]; if(!M){ o.b=o.b2=0; o.t=1; return o; } return zBiome(x,y,o,M.tz||tzOf(M)); }; }
// segsDist(x,y,ROAD_SEGS) (and RIVER_SEGS, LAVA_SEGS) on another map measures that map's own roads, so placeHouses,
// addLandmark (nudge, spotOK) and any copied Embermere pattern keep off the right roads
{ const base=segsDist; segsDist=function(x,y,segs){
  if(y<BAND||x>=IZX-50) return base(x,y,segs);
  const M=MAPS[mapAt(y)]; if(!M){ lastSeg=null; return 1e9; }
  const Z=M.tz||tzOf(M), G=segs===ROAD_SEGS?Z.roadG:segs===RIVER_SEGS?Z.rivG:segs===LAVA_SEGS?Z.lavaG:null;
  if(!G) return base(x,y,segs);
  const d=gsDist(x,y,G); lastSeg=TZL; return d;
}; }
{ const base=gapsFor; gapsFor=function(cx,cy){ if(cy<BAND) return base(cx,cy); const M=MAPS[mapAt(cy)]; if(!M) return []; const g=[]; for(const s of tzOf(M).roads){ for(const [px,py] of [[s.ax,s.ay],[s.bx,s.by]]){ const d=dist(px,py,cx,cy); if(d>150&&d<800) g.push(angTo(cx,cy,px,py)); } } return g; }; }
{ const base=regionAt; regionAt=function(x,y){ const r=base(x,y); if(r&&r.name==null){ r.name=mapOfY(y).name; } if(r&&r.level==null) r.level=1; return r; }; }
{ const base=lavaSpot; lavaSpot=function(x,y){ if(y<BAND||x>=IZX-50) return base(x,y); return mapStrideBlocked(x,y); }; }
{ const base=landBad; landBad=function(x,y){
  if(y<BAND||x>=IZX-50) return base(x,y);
  if(outOfMap(x,y,30)) return null;
  if(!blockedAt(x,y)) return null;
  if(mapLavaHere(x,y)) return 'lava';
  const M=MAPS[mapAt(y)], Z=tzOf(M);
  if(Z.block&&Z.block(x,y)) return 'block';
  if(canWalkWater()&&!mapStrideBlocked(x,y)) return null;
  return T(x,y,{}).water?'water':null;
}; }
// a jump that lands on a `block` spot (deep snow wall, glass spikes) hops Ash back without a splash or a burn
{ const base=backToSafe; backToSafe=function(p,bad){
  if(bad!=='block') return base(p,bad);
  let sx=p.safeX, sy=p.safeY;
  if(sx==null||dist(sx,sy,p.x,p.y)>900||playerBlocked(sx,sy)){ const s=nearestLand(p.x,p.y); if(s){ sx=s.x; sy=s.y; } }
  if(sx!=null){ p.x=sx; p.y=sy; }
  p.avx=p.avy=0; p.kvx=p.kvy=0; MV.lx=p.x; MV.ly=p.y; p.iframes=Math.max(p.iframes,0.5);
  emit(p.x,p.y+5,10,{col:'150,130,110',glow:false,smin:30,smax:100,lmin:.25,lmax:.5,zmin:2,zmax:4,grow:7});
}; }

// ---------- ground chunks, colours and props for maps 1 and up
const chunkMapOf=cy=>mapAt(cy*CH+CH/2);
function groundRGBMap(s,x,y){
  if(s.out) return [12,16,10];
  const B=BIOMES[s.b]||BDEF, M=MAPS[mapAt(y)];
  const m=fbm(x*0.0011+11,y*0.0011-7,2);
  let c=BCOL[s.b]?biomeRGB(s.b,s.n,m):[90,110,60];
  if(s.b2!==s.b&&s.t<1&&BCOL[s.b2]) c=mixRGB(biomeRGB(s.b2,s.n,m),c,s.t);
  if(s.sand>0) c=mixRGB(c,B._sand||[214,190,134],clamp(s.sand,0,1)*0.8);
  if(s.snow>0) c=mixRGB(c,[236,241,246],clamp(s.snow,0,1)*0.85);
  if(s.ice>0) c=mixRGB(c,mixRGB([176,214,234],[214,236,246],clamp(s.n+0.5,0,1)),clamp(s.ice,0,1)*0.85);
  if(s.shore>0) c=mixRGB(c,B._shore,s.shore*0.75);
  if(s.bog>0) c=mixRGB(c,mixRGB([58,70,46],[30,40,30],clamp(s.n+0.5,0,1)),smooth(clamp(s.bog*1.4-0.15,0,1))*0.92);
  if(s.road>0) c=mixRGB(c,mixRGB(B._road,[0,0,0],Math.max(0,s.n)*0.15),s.road*0.92);
  if(s.water){ const Wc=B._water; c=mixRGB(Wc[0],Wc[1],smooth(s.depth)); if(s.seaD>0) c=mixRGB(c,mixRGB(Wc[1],[6,14,28],0.55),smooth(s.seaD)*0.8); if(s.depth<0.15) c=mixRGB(Wc[2],c,s.depth/0.15*0.7+0.3); }
  if(s.lavaS>0) c=mixRGB(c,mixRGB([255,138,40],[170,44,12],clamp(0.5+s.n,0,1)),smooth(clamp(s.lavaS*1.6-0.3,0,1)));
  if(B.rgb){ const r=B.rgb(c,s,x,y); if(r) c=r; }
  if(M){ const ed=Math.min(x,y-M.y0,M.w-x,M.y0+M.h-y); if(ed<160) c=mixRGB([10,12,8],c,clamp(ed/160,0,1)); }
  return c;
}
const BDEF={_road:[128,106,74],_shore:[170,154,112],_water:[[74,122,118],[22,52,70],[190,200,190]]};
// (v12 GROUND) built by a generator in small steps (see genChunkG in a4_ground.js); genChunkMap runs it in one go.
// With LOOK.sb it follows the Storybook copy of genChunkMap in e5_look.js step for step (900 decor marks, Storybook
// pebbles on roads, the contour lines before the decals), so the planner's slices draw exactly what that copy draws.
function genChunkMap(cx,cy){ return chunkRun(genChunkMapG(cx,cy)); }
function* genChunkMapG(cx,cy){
  const x0=cx*CH, y0=cy*CH, N=65, step=CH/(N-1), sb=!!LOOK.sb;
  const small=mkCanvas(N,N), sg=small.getContext('2d'), img=sg.createImageData(N,N), d=img.data;
  const glowS=mkCanvas(N,N), gg=glowS.getContext('2d'), gimg=gg.createImageData(N,N), gd=gimg.data;
  const grid=new Array(N*N); let hasLava=false, hasWater=false;
  for(let j=0;j<N;j++){ for(let i=0;i<N;i++){
    const x=x0+i*step, y=y0+j*step, s=T(x,y,{});
    grid[j*N+i]=s;
    const c=groundRGB(s,x,y), k=(j*N+i)*4;
    d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255;
    if(s.lavaS>0){ hasLava=true; gd[k]=255; gd[k+1]=120; gd[k+2]=30; gd[k+3]=Math.round(clamp(s.lavaS*1.4-0.2,0,1)*210); }
    if(s.water) hasWater=true;
  } if(j&1) yield; }
  sg.putImageData(img,0,0);
  const cv=mkCanvas(CPX,CPX), g=cv.getContext('2d');
  g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
  g.drawImage(small,0,0,N,N,-CPX/(N-1)/2,-CPX/(N-1)/2,CPX+CPX/(N-1),CPX+CPX/(N-1));
  g.setTransform(RES,0,0,RES,-x0*RES,-y0*RES);
  const at=(x,y)=>{ const i=clamp(Math.round((x-x0)/step),0,N-1), j=clamp(Math.round((y-y0)/step),0,N-1); return grid[j*N+i]; };
  const rng=mulberry32(((cx*92821)^(cy*68917)^7)|0);
  g.lineCap='round'; g.lineWidth=1.1;
  yield;
  for(let i=0,n=sb?900:1500;i<n;i++){
    if(i&&i%150===0) yield;
    const x=x0+rng()*CH, y=y0+rng()*CH, s=at(x,y), r=rng();
    if(s.out||s.water||s.lava) continue;
    if(s.road>0.5){ if(sb){ if(r<0.08) sbPebble(g,x,y,1.4+rng(),'rgba(170,140,100,.8)'); } else if(r<0.25){ g.fillStyle=rng()<0.5?'rgba(60,50,40,.35)':'rgba(200,190,170,.25)'; g.beginPath(); g.arc(x,y,0.8+rng()*1.6,0,TAU); g.fill(); } continue; }
    const b=s.t<0.75&&rng()<0.5?s.b2:s.b, B=BIOMES[b];
    if(B&&B.decor){ try{ B.decor(g,rng,x,y,s,r); }catch(e){} g.lineWidth=1.1; }
  }
  const ch={cv,g,glow:null,hasWater,used:chunkTick};
  if(sb){ yield; lookChunkLines(g,grid,N,step,x0,y0,ch); }
  yield* chunkDecalsG(g,x0,y0);
  if(hasLava){ gg.putImageData(gimg,0,0); const glow=mkCanvas(CPX/4,CPX/4); const g2=glow.getContext('2d'); g2.imageSmoothingEnabled=true; g2.drawImage(glowS,0,0,N,N,-CPX/4/(N-1)/2,-CPX/4/(N-1)/2,CPX/4+CPX/4/(N-1),CPX/4+CPX/4/(N-1)); ch.glow=glow; }
  return ch;
}
// colliders, radius and flags for a prop, by kind (the same rules genProps uses for the stock kinds)
function finishProp(p,x,y,rng){
  p.x=x; p.y=y; p.s=p.s||0.8+rng()*0.5; p.v=p.v!=null?p.v:Math.floor(rng()*997); p.ph=rng()*TAU; p.rot=p.rot!=null?p.rot:rng()*TAU;
  const K=PROPK[p.k], tk=TREEK[p.k], sc=p.s;
  if(K){ if(K.rot===false) p.rot=0; p.R=(K.R||14)*sc; if(K.tall) p.tall=true; if(K.col) p.col={t:'c',x,y,r:K.col.r*sc,low:!!K.col.low}; }
  else if(tk){ p.tall=true; p.R=tk[0]*sc; p.col={t:'c',x,y,r:tk[1]*sc}; }
  else if(p.k==='rock'||p.k==='obsid'||p.k==='srock'){ p.R=16*sc; p.col={t:'c',x,y,r:13*sc,low:true}; }
  else if(p.k==='crag'){ p.R=26*sc; p.col={t:'c',x,y,r:22*sc}; }
  else if(p.k==='spike'){ p.R=18*sc; p.col={t:'c',x,y,r:12*sc}; }
  else if(p.k==='stump'){ p.R=12*sc; p.col={t:'c',x,y,r:9*sc,low:true}; }
  else p.R=14*sc;
  return p;
}
function genPropsMap(cx,cy){
  const out=[], x0=cx*CH, y0=cy*CH, M=MAPS[chunkMapOf(cy)];
  if(!M||cx<0||x0>M.w||y0>M.y0+M.h||y0+CH<M.y0) return out;
  const rng=mulberry32(((cx*73856093)^(cy*19349663)^0x5bd1e995)|0), step=40, s={};
  for(let gy=0;gy<CH;gy+=step) for(let gx=0;gx<CH;gx+=step){
    const x=x0+gx+rng()*step, y=y0+gy+rng()*step, pick=rng();
    if(x<25||y<M.y0+25||x>M.w-25||y>M.y0+M.h-25) continue;
    if(inClearing(x,y)) continue;
    T(x,y,s);
    if(s.out||s.water||s.lava||s.bridge||s.road>0||s.roadD<30||s.shore>0.1) continue;
    const b=s.t<0.62&&pick<0.5?s.b2:s.b, B=BIOMES[b];
    if(!B||!B.props) continue;
    const grove=fbm(x*0.0016+7,y*0.0016-3,3);
    let p=null; try{ p=B.props(rng,x,y,s,grove); }catch(e){ p=null; }
    if(!p||!p.k) continue;
    out.push(finishProp(p,x,y,rng));
  }
  for(const p of out) if(p.col) addCol(p.col);
  return out;
}
{ const base=genChunk; genChunk=function(cx,cy){ return chunkPreTake(cx,cy)||(chunkMapOf(cy)>0?genChunkMap(cx,cy):base(cx,cy)); }; }
{ const base=chunkGen; chunkGen=function(cx,cy){ return chunkMapOf(cy)>0?genChunkMapG(cx,cy):base(cx,cy); }; }
{ const base=genProps; genProps=function(cx,cy){ return chunkMapOf(cy)>0?genPropsMap(cx,cy):base(cx,cy); }; }
{ const base=groundRGB; groundRGB=function(s,x,y){ return y<BAND?base(s,x,y):groundRGBMap(s,x,y); }; }

// ---------- ambience on maps 1 and up: the biome's ambient over the map's (Embermere keeps its own rules)
const AMBM=new Map(), AMB_O={}, AMBC={t:-1,a:null};
function ambOf(k,b){ const key=k*1000+b; let a=AMBM.get(key); if(!a){ const M=MAPS[k], B=BIOMES[b]; a=Object.assign({},M&&M.ambient||{},B&&B.ambient||{}); AMBM.set(key,a); } return a; }
// what the air is like where Ash is (null on Embermere and inside areas)
function ambHere(){
  if(!G||!player) return null;
  if(AMBC.t===G.time&&AMBC.g===G) return AMBC.a;
  AMBC.t=G.time; AMBC.g=G;
  const k=curMap(); if(!k||AREA){ AMBC.a=null; return null; }
  biomeInfo(player.x,player.y,AMB_O); AMBC.a=ambOf(k,AMB_O.b); return AMBC.a;
}
function mapNight(){ const a=ambHere(); return a&&a.night||0; }
function mapLavaGlow(){ const k=curMap(); if(!k||AREA) return false; const M=MAPS[k]; return !!(M&&M.tz&&M.tz.hasLava); }
function snowyAt(x,y){ const b=biomeInfo(x,y,{}).b; if(b<10) return b===5; const B=BIOMES[b]; return !!(B&&B.ambient&&B.ambient.snow>0.5); }
{ const base=updateWeather; updateWeather=function(dt){
  const a=ambHere(); if(!a) return base(dt);
  const w=G.weather; w.t-=dt;
  if(w.t<=0){ if(w.type==='clear'&&Math.random()<0.45){ w.type='rain'; w.t=rand(60,130); } else { w.type='clear'; w.t=rand(120,280); } }
  const target=(w.type==='rain'?1:0)*(a.rain||0); G.rainK+=(target-G.rainK)*Math.min(1,dt*0.25);
  if(G.rainK>0.75&&a.thunder!==false&&Math.random()<dt*0.03){ flashA=Math.max(flashA,0.35); flashCol='220,230,255'; later(rand(0.6,1.6),()=>SFX.play('thunder')); }
}; }
{ const base=updateAmbience; updateAmbience=function(dt){
  if(!G||G.mode==='menu'||AREA) return base(dt);
  const a=ambHere(); if(!a) return base(dt);
  const rk=G.rainK;
  SFX.ambient({wind:0.035+(a.wind||0)*0.035+rk*0.04,rain:0.12*rk,lava:(a.lava!=null?a.lava:a.embers||0)*0.12});
  G.chirpT=(G.chirpT||0)-dt;
  if(G.chirpT<=0){
    if(isNight()){ G.chirpT=rand(0.4,0.9); if(a.birds&&rk<0.3) SFX.play('cricket'); }
    else{ G.chirpT=rand(1.2,4); if(a.birds&&rk<0.3&&isDay()) SFX.play('bird',0.8); }
  }
}; }
{ const base=ambientEmit; ambientEmit=function(dt){
  base(dt);
  if(!G||AREA) return; const a=ambHere(); if(!a) return;
  const vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom;
  if(a.embers&&Math.random()<dt*14*a.embers) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'255,140,50',ang:-Math.PI/2,spread:0.8,smin:10,smax:40,lmin:2,lmax:4,zmin:0.8,zmax:1.8,drag:0.1,rise:4});
  if(a.ash&&Math.random()<dt*12*a.ash) emit(rand(vx,vx+vw),rand(vy,vy+vh),1,{col:'190,185,180',glow:false,ang:0.6,spread:0.4,smin:20,smax:50,lmin:3,lmax:5,zmin:1,zmax:2.2,drag:0.05});
}; }
{ const base=ambientTint; ambientTint=function(){
  const c=base(); if(!G||!player||AREA) return c;
  const k=curMap(); if(!k) return c; const s=MAPS[k]&&MAPS[k].sky; if(!s||!s.tint) return c;
  if(!s._t) s._t=hexRGB(s.tint); return mixRGB(c,s._t,s.k!=null?s.k:0.2);
}; }

// ---------- feel underfoot: biome speed, deep snow, ice, footprints
function terrSpeed(s){
  if(s.b<10&&!s.snow) return 1;
  const B=BIOMES[s.b]; let k=B&&B.speed!=null&&s.road<=0?B.speed:1;
  if(s.snow>0&&s.road<=0) k*=1-0.35*clamp(s.snow,0,1);
  return k;
}
function footKind(s){ if(s.snow>0.3) return 'snow'; if(s.b<10) return null; const B=BIOMES[s.b]; return B&&B.footprints||null; }
{ const base=footprint; footprint=function(x,y,f,wt){
  const k=y<BAND?null:footKind(PT); if(!k||k==='snow') return base(x,y,f,wt);
  const c=CHUNKS.get(ckey(Math.floor(x/CH),Math.floor(y/CH))); if(!c) return;
  const side=Math.sin(wt*10)>0?1:-1, px=x+Math.cos(f+Math.PI/2)*4*side, py=y+Math.sin(f+Math.PI/2)*4*side;
  const g=c.g; g.save(); g.translate(px,py); g.rotate(f); g.fillStyle=k==='sand'?'rgba(120,92,52,.32)':'rgba(40,30,20,.28)'; g.beginPath(); g.ellipse(0,0,4,2.4,0,0,TAU); g.fill(); g.restore();
}; }
// ---------- critters per biome
const CRIT_EMBER=['deer','rabbit'];
function critterKinds(b){
  if(b<10) return (b>1&&b!==5)?null:CRIT_EMBER;
  const B=BIOMES[b]; if(!B||!B.critters) return null;
  if(!B._crit) B._crit=B.critters.filter(t=>t==='deer'||t==='rabbit'||CRITTERS[t]);
  return B._crit.length?B._crit:null;
}
function critterType(ck,deer){ return ck.length===2?(deer?ck[0]:ck[1]):ck.length===1?ck[0]:ck[Math.floor(Math.random()*ck.length)]; }
{ const base=spawnCritters; spawnCritters=function(){
  const n0=G&&G.critters?G.critters.length:0; base();
  if(!G||!G.critters) return;
  for(let i=n0;i<G.critters.length;i++){ const c=G.critters[i], D=CRITTERS[c.type]; if(D&&!c.draw){ c.r=D.r||c.r; c.draw=()=>D.draw(c); }
    // a fresh critter has no wander target yet, and steering to undefined turns its position into NaN (the stock
    // Embermere critters have this bug too; it is fixed here for the new maps only so Embermere stays as it was)
    if(c.y>=BAND&&c.tx==null){ c.tx=c.x; c.ty=c.y; } }
}; }
// ---------- world events on new biomes: allowed by default (the best weight the event has in any Embermere biome),
// unless the biome says otherwise with like:<embermere id> or events:{id:weight|false|fn}
function evWAny(d,c){ let w=0; for(let b=0;b<=6;b++){ let v=0; try{ v=d.w(Object.assign({},c,{b}))||0; }catch(e){ v=0; } if(v>w) w=v; } return w; }
{ const base=evPick; evPick=function(c){
  if(!(c&&c.b>=10)) return base(c);
  const B=BIOMES[c.b]||{}, E=B.events||{}, cand=[]; let tot=0;
  for(const id in EVD){
    const d=EVD[id]; if(!reached(d.min)) continue;
    let w=0;
    try{ const e=E[id]; w=e===false?0:typeof e==='function'?e(c):typeof e==='number'?e:B.like!=null?d.w(Object.assign({},c,{b:B.like})):evWAny(d,c); }catch(er){ w=0; }
    if(!(w>0)) continue; if(!d.tk&&!d.chain) w*=evRep(id); cand.push([id,w]); tot+=w;
  }
  const out=[]; while(cand.length){ let r=Math.random()*tot, i=0; for(;i<cand.length-1;i++){ r-=cand[i][1]; if(r<=0) break; } const [id,w]=cand.splice(i,1)[0]; tot-=w; out.push(id); }
  return out;
}; }
window.__ebX=Object.assign(window.__ebX||{},{BIOMES,PROPK,mapT:(x,y)=>T(x,y,{}),mapBlocked,mapStrideBlocked,tzOf,ambHere,terrSpeed,blockedAt:(x,y)=>blockedAt(x,y),
  probeMap(x,y){ const s=T(x,y,{}); return {b:s.b,b2:s.b2,t:+s.t.toFixed(2),out:s.out,water:s.water,sea:s.sea,deep:s.deep,road:+s.road.toFixed(2),bridge:s.bridge,lava:s.lava,shore:+s.shore.toFixed(2),ice:s.ice,snow:s.snow,sand:s.sand,blocked:blockedAt(x,y),stride:y>=BAND?mapStrideBlocked(x,y):null,region:regionAt(x,y).name}; }});

// ================= placeholder biomes and prop kinds for maps 1 to 4 (wave 2 replaces them with defineBiome(id,...))
const PH=true;
definePropKind('pm_palm',{placeholder:PH,n:3,tall:true,R:40,col:{r:8},h:70,make(seed){ const rng=mulberry32(seed), R=40; return spriteOf(R,g=>{
  g.fillStyle='#6a4a2c'; g.beginPath(); g.arc(0,0,6,0,TAU); g.fill();
  for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.4, L=R*(0.75+rng()*0.25); g.strokeStyle=i%2?'#3e7a2a':'#5a9a34'; g.lineWidth=7; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(Math.cos(a+0.3)*L*0.5,Math.sin(a+0.3)*L*0.5,Math.cos(a)*L,Math.sin(a)*L); g.stroke(); }
  g.fillStyle='#8a6a3a'; for(let i=0;i<3;i++){ g.beginPath(); g.arc((rng()-0.5)*8,(rng()-0.5)*8,3,0,TAU); g.fill(); } }); }});
definePropKind('pm_crystal',{placeholder:PH,n:3,R:16,col:{r:12},make(seed){ const rng=mulberry32(seed), R=16; return spriteOf(R,g=>{
  for(let i=0;i<4;i++){ const a=rng()*TAU, L=8+rng()*8; g.fillStyle=i%2?'#7a5ad8':'#a88af0'; g.beginPath(); g.moveTo(Math.cos(a+1.6)*4,Math.sin(a+1.6)*4); g.lineTo(Math.cos(a)*L,Math.sin(a)*L); g.lineTo(Math.cos(a-1.6)*4,Math.sin(a-1.6)*4); g.closePath(); g.fill(); }
  g.fillStyle='rgba(240,230,255,.7)'; g.beginPath(); g.arc(0,0,2.5,0,TAU); g.fill(); }); }});
defineBiome(10,{placeholder:PH,name:'the Chalk Downs (placeholder)',level:9,col:['#8fa65a','#a8b870','#6e8a48'],road:'#cfc6ad',water:{deep:'#174a6a',shallow:'#3f9aaa',lip:'#e8f0ea'},shore:'#e2d8b4',
  ambient:{wind:0.5,birds:true,rain:0.6},critters:['rabbit'],chests:4,
  props(rng,x,y,s,grove){ const r=rng(); if(grove>0.15&&r<0.16) return {k:'pm_palm'}; if(r<0.05) return {k:'bush'}; if(r<0.08) return {k:'rock'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.5) grassTuft(g,x,y,'rgba(70,100,40,.5)',5+rng()*3,rng); else if(r<0.54){ g.fillStyle='#f2efe4'; g.beginPath(); g.arc(x,y,1.3,0,TAU); g.fill(); } }});
defineBiome(20,{placeholder:PH,name:'the Frozen Steppe (placeholder)',level:13,col:['#dfe6ee','#f4f7fa','#b4c2d0'],road:'#b8b4b0',water:{deep:'#284a66',shallow:'#7aa6c0',lip:'#eef4f8'},shore:'#cdd6de',
  ambient:{snow:1,wind:0.7},footprints:'snow',speed:0.93,critters:['rabbit'],chests:4,
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.12+Math.max(0,grove)*0.4) return {k:'spine'}; if(r<0.2) return {k:'srock'}; if(r<0.24) return {k:'fshrub'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.2){ g.fillStyle='rgba(150,170,195,.28)'; g.beginPath(); g.ellipse(x,y,5+rng()*12,2+rng()*5,rng()*3,0,TAU); g.fill(); } else if(r<0.35){ g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.arc(x,y,0.8,0,TAU); g.fill(); } }});
defineBiome(30,{placeholder:PH,name:'the Moon Dunes (placeholder)',level:17,col:['#c8b48a','#dccaa0','#a8946a'],road:'#9a8a6a',water:{deep:'#141e44',shallow:'#2f4a8a',lip:'#c8d0f0'},shore:'#e6d6a8',
  ambient:{wind:0.3,night:0.1},footprints:'sand',chests:3,
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.03) return {k:'dead'}; if(r<0.07) return {k:'rock'}; if(r<0.08) return {k:'bones'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.25){ g.strokeStyle='rgba(150,120,80,.3)'; g.beginPath(); g.moveTo(x-8,y); g.quadraticCurveTo(x,y-3,x+8,y); g.stroke(); } }});
defineBiome(40,{placeholder:PH,name:'the Black Glass (placeholder)',level:21,col:['#2a2430','#3a3240','#18141c'],road:'#4a4048',water:{deep:'#0e0a1a',shallow:'#2a2248'},shore:'#3a3444',
  ambient:{embers:0.6,night:0.15,wind:0.4},chests:3,roadW:24,
  props(rng,x,y,s,grove){ const r=rng(); if(r<0.05) return {k:'spike'}; if(r<0.1) return {k:'pm_crystal'}; if(r<0.115) return {k:'vent'}; return null; },
  decor(g,rng,x,y,s,r){ if(r<0.25){ g.strokeStyle='rgba(150,110,255,.25)'; g.beginPath(); let px=x,py=y,a=rng()*TAU; g.moveTo(px,py); for(let k=0;k<3;k++){ a+=(rng()-0.5)*1.2; px+=Math.cos(a)*(6+rng()*8); py+=Math.sin(a)*(6+rng()*8); g.lineTo(px,py); } g.stroke(); } }});
