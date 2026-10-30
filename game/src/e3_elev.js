// ================= elevation (v9 engine, wave 1): plateaus, cliff faces, ramps, ledges, steps, climbable faces,
// updraft vents, no-fly zones and grapple posts, in the Link's Awakening style. Full guide: scratchpad/ELEV.md.
// A plateau's top is drawn where it is. Its south face hangs below it as a rock wall that takes up real ground
// (ELV.px per level, half that for a `step`), its east and west edges flare out as side walls, and its north (back)
// edge is a thin rim. Every boundary between two levels holds blocked cells, so plain blockedAt keeps every walker
// (Ash, foes, people) on its level. Only ramps (stairs, ramps, ladders) join levels for walkers; Ash also hops down
// ledges and steps, mounts a step face with a Double Jump, and flies at most one level above where he took off
// (vents lift that ceiling, no-fly zones ground him). Each map's features are rasterised lazily into a grid of 8 px
// cells (level and flag bytes), so elevLvl and elevFace are a couple of array reads.
const ELV={cs:8,px:48,step:24,seg:12,ign:0,shot:null,debug:false,maps:[],rev:0,deco:[],looks:[null],lookKey:new Map(),spotL:null,msgT:0,tipT:{}};
const EF={FACE:1,CLIMB:2,LEDGE:4,RAMP:8,STEP:16,RIM:32};
// face looks: face (mid), lit (upper band), dark (base band), lip (lit top edge), out (outline), top (plateau top tint)
const ELEV_STYLES={
  rock:{face:'#8a7c6e',lit:'#a6978a',dark:'#5e5249',lip:'#ecdfcc',out:'#2b2420',top:'#bcae9c',topK:0.07,tex:'crack'},
  chalk:{face:'#e9e2d0',lit:'#faf6ea',dark:'#c3b89e',lip:'#ffffff',out:'#6a6252',top:'#f6f2e6',topK:0.1,tex:'layers'},
  ice:{face:'#a2d4ee',lit:'#d0eefc',dark:'#669ec8',lip:'#ffffff',out:'#2c4c6c',top:'#e4f4fc',topK:0.1,tex:'streak'},
  obsidian:{face:'#3e3350',lit:'#5c4d70',dark:'#201a2c',lip:'#b4a0d4',out:'#0a080e',top:'#6a5c7c',topK:0.06,tex:'facet'},
  sand:{face:'#dcbc7c',lit:'#eed49a',dark:'#ae8a50',lip:'#fcecc0',out:'#5c4626',top:'#eedaa8',topK:0.08,tex:'wave'},
  basalt:{face:'#5c4c45',lit:'#7a675d',dark:'#342a29',lip:'#d6bca8',out:'#140e0e',top:'#a08a7c',topK:0.075,tex:'columns'},
  glass:{face:'#96c4e4',lit:'#c6e2f6',dark:'#56789e',lip:'#f4faff',out:'#1c2c48',top:'#d6eafa',topK:0.08,tex:'shine'},
  grass:{face:'#8c6c4a',lit:'#a6845c',dark:'#5e4630',lip:'#b0dc6c',out:'#2a2014',top:'#a8cc6a',topK:0.06,tex:'roots',fringe:'#78b048'}
};
function elvStyle(name){ return ELEV_STYLES[name]||ELEV_STYLES.rock; }
function elvRGB(h){ return typeof h==='string'?hexRGB(h):h; }
function elvLook(top,k,face){ const key=top+'|'+k+'|'+face; let i=ELV.lookKey.get(key); if(i==null){ i=ELV.looks.length; ELV.looks.push({top:elvRGB(top),k,face:elvRGB(face)}); ELV.lookKey.set(key,i); } return i; }
// one elevation record per map (index k)
function elvM(k){ let E=ELV.maps[k]; if(!E) E=ELV.maps[k]={k,plats:[],ramps:[],ledges:[],vents:[],nofly:[],posts:[],clears:[],falls:[],paths:[],dirty:true,G:null}; return E; }
function elvDirty(E){
  E.dirty=true; E.pbb=null;
  // anything already drawn or sampled from the old grid is redrawn (only matters for features added after the start)
  if(E.G&&typeof CHUNKS!=='undefined'){ const g=E.G; for(const [key] of CHUNKS){ const cx=Math.floor(key/1000), cy=key-cx*1000; if((cx+1)*CH>=g.x0&&cx*CH<=g.x0+g.w*g.cs&&(cy+1)*CH>=g.y0&&cy*CH<=g.y0+g.h*g.cs) CHUNKS.delete(key); } }
}
// ---------- shapes: poly [[x,y],...], rect [x0,y0,x1,y1], disc [x,y,r] or [x,y,rx,ry]
function elvBasePts(s){
  if(s.poly) return s.poly.map(p=>[p[0],p[1]]);
  if(s.rect){ const [a,b,c,d]=s.rect; return [[Math.min(a,c),Math.min(b,d)],[Math.max(a,c),Math.min(b,d)],[Math.max(a,c),Math.max(b,d)],[Math.min(a,c),Math.max(b,d)]]; }
  if(s.disc){ const [cx,cy,rx,ry0]=s.disc, ry=ry0==null?rx:ry0, n=Math.max(18,Math.ceil(TAU*Math.max(rx,ry)/36)), o=[]; for(let i=0;i<n;i++){ const a=i/n*TAU; o.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]); } return o; }
  return null;
}
function elvArea(P){ let a=0; for(let i=0,n=P.length;i<n;i++){ const p=P[i], q=P[(i+1)%n]; a+=p[0]*q[1]-q[0]*p[1]; } return a/2; }
// subdivide, orient (outer rings clockwise on screen, holes the other way, so (dy,-dx) is always the outward normal
// away from the solid), then push every point along its normal by smooth noise for a natural outline
function elvRing(s,noise,seed,hole){
  const b=elvBasePts(s); if(!b||b.length<3) return null;
  let P=[];
  for(let i=0,n=b.length;i<n;i++){ const a=b[i], c=b[(i+1)%n], L=Math.hypot(c[0]-a[0],c[1]-a[1]), m=Math.max(1,Math.ceil(L/ELV.seg)); for(let k=0;k<m;k++) P.push([a[0]+(c[0]-a[0])*k/m,a[1]+(c[1]-a[1])*k/m]); }
  if((elvArea(P)>0)===!!hole) P.reverse();
  const n=P.length, x=new Float32Array(n), y=new Float32Array(n);
  for(let i=0;i<n;i++){ x[i]=P[i][0]; y[i]=P[i][1]; }
  if(noise>0){
    const nx=new Float32Array(n), ny=new Float32Array(n), s1=seed*1.37+3.1, s2=seed*0.71-5.3;
    for(let i=0;i<n;i++){ const p=(i+n-1)%n, q=(i+1)%n, dx=x[q]-x[p], dy=y[q]-y[p], L=Math.hypot(dx,dy)||1; nx[i]=dy/L; ny[i]=-dx/L; }
    for(let i=0;i<n;i++){ const d=noise*(1.25*fbm(x[i]*0.0042+s1,y[i]*0.0042+s2,3)+0.45*fbm(x[i]*0.021+s2,y[i]*0.021-s1,2)); x[i]+=nx[i]*d; y[i]+=ny[i]*d; }
  }
  return {n,x,y};
}
function elvShapeRings(def,noise,seed){
  const out=[], o=elvRing(def,noise,seed,false); if(!o) return out; out.push(o);
  for(const h of def.holes||[]){ const r=elvRing(h,h.noise!=null?h.noise:noise,seed+11,true); if(r) out.push(r); }
  return out;
}
function elvRingsBB(R){ const b=[1e9,1e9,-1e9,-1e9]; for(const r of R) for(let i=0;i<r.n;i++){ if(r.x[i]<b[0]) b[0]=r.x[i]; if(r.y[i]<b[1]) b[1]=r.y[i]; if(r.x[i]>b[2]) b[2]=r.x[i]; if(r.y[i]>b[3]) b[3]=r.y[i]; } return b; }
function elvShapeIn(z,x,y){
  if(x<z.bb[0]||y<z.bb[1]||x>z.bb[2]||y>z.bb[3]) return false;
  if(z.disc){ const [cx,cy,rx,ry0]=z.disc, ry=ry0==null?rx:ry0, dx=(x-cx)/rx, dy=(y-cy)/ry; return dx*dx+dy*dy<=1; }
  if(z.rect) return true;
  if(z.path){ return elvPathD(z.path.pts,x,y)<=z.path.w; }
  const P=z.poly; let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i], b=P[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c;
}
function elvPathD(pts,x,y){ let best=1e9; for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], dx=b[0]-a[0], dy=b[1]-a[1], l2=dx*dx+dy*dy||1, t=clamp(((x-a[0])*dx+(y-a[1])*dy)/l2,0,1), d=Math.hypot(a[0]+dx*t-x,a[1]+dy*t-y); if(d<best) best=d; } return best; }
function elvZone(def){
  const z=Object.assign({},def);
  if(def.disc){ const [cx,cy,rx,ry0]=def.disc, ry=ry0==null?rx:ry0; z.bb=[cx-rx,cy-ry,cx+rx,cy+ry]; }
  else if(def.rect){ const [a,b,c,d]=def.rect; z.bb=[Math.min(a,c),Math.min(b,d),Math.max(a,c),Math.max(b,d)]; }
  else if(def.path){ const w=def.path.w||40; z.path={pts:def.path.pts,w}; z.bb=[1e9,1e9,-1e9,-1e9]; for(const p of def.path.pts){ z.bb[0]=Math.min(z.bb[0],p[0]-w); z.bb[1]=Math.min(z.bb[1],p[1]-w); z.bb[2]=Math.max(z.bb[2],p[0]+w); z.bb[3]=Math.max(z.bb[3],p[1]+w); } }
  else if(def.poly){ z.bb=[1e9,1e9,-1e9,-1e9]; for(const p of def.poly){ z.bb[0]=Math.min(z.bb[0],p[0]); z.bb[1]=Math.min(z.bb[1],p[1]); z.bb[2]=Math.max(z.bb[2],p[0]); z.bb[3]=Math.max(z.bb[3],p[1]); } }
  else return null;
  return z;
}
function elvMapOf(x,y){ return mapAt(y); }
function elvAnchor(def){ if(def.disc) return [def.disc[0],def.disc[1]]; if(def.rect) return [(def.rect[0]+def.rect[2])/2,(def.rect[1]+def.rect[3])/2]; if(def.poly){ let sx=0,sy=0; for(const p of def.poly){ sx+=p[0]; sy+=p[1]; } return [sx/def.poly.length,sy/def.poly.length]; } if(def.path) return def.path.pts[0]; if(def.x!=null) return [def.x,def.y!=null?def.y:def.y0]; return [(def.x0+def.x1)/2,(def.y0+def.y1)/2]; }

// ---------- the authoring API (absolute world coordinates; call at load time or inside a map's build(B))
const ELEV={
  px:ELV.px, step:ELV.step, cs:ELV.cs, styles:ELEV_STYLES, F:EF,
  // a raised area: {poly|rect|disc, holes?:[shape...], lvl:1..8, style, climb?, step?, noise?:px, seed?, id?, top?, topK?}
  plateau(def){
    const [ax,ay]=elvAnchor(def), E=elvM(def.k!=null?def.k:elvMapOf(ax,ay)), S=Object.assign({},elvStyle(def.style),def.look||{});
    const seed=def.seed!=null?def.seed:E.plats.length*7+3, noise=def.noise!=null?def.noise:14;
    const rings=elvShapeRings(def,noise,seed); if(!rings.length) return null;
    const P={i:E.plats.length,id:def.id||('p'+E.plats.length),lvl:clamp(Math.round(def.lvl||1),1,8),style:def.style||'rock',S,climb:!!def.climb,step:!!def.step,seed,rings,bb:elvRingsBB(rings),def};
    P.look=elvLook(def.top||S.top,def.topK!=null?def.topK:S.topK,S.face);
    E.plats.push(P); elvDirty(E); return P;
  },
  // walking up `dir` climbs one level: {x0,y0,x1,y1, dir:'n'|'s'|'e'|'w', kind:'stairs'|'ramp'|'ladder', foes?:true}
  ramp(def){ const [ax,ay]=elvAnchor(def), E=elvM(def.k!=null?def.k:elvMapOf(ax,ay)); const r=Object.assign({dir:'n',kind:'stairs'},def,{x0:Math.min(def.x0,def.x1),x1:Math.max(def.x0,def.x1),y0:Math.min(def.y0,def.y1),y1:Math.max(def.y0,def.y1),i:E.ramps.length}); E.ramps.push(r); elvDirty(E); return r; },
  // a one-way drop over the faces inside the rect: walking off it (south, east or west) hops Ash down
  ledge(def){ const [ax,ay]=elvAnchor(def), E=elvM(def.k!=null?def.k:elvMapOf(ax,ay)); const l=Object.assign({},def,{x0:Math.min(def.x0,def.x1),x1:Math.max(def.x0,def.x1),y0:Math.min(def.y0,def.y1),y1:Math.max(def.y0,def.y1)}); E.ledges.push(l); elvDirty(E); return l; },
  // an updraft: flying through it lifts the flight ceiling by `lift` levels (and flight works in it even in a no-fly zone)
  vent(def){ const E=elvM(def.k!=null?def.k:elvMapOf(def.x,def.y)); const v=Object.assign({r:70,lift:1},def,{i:E.vents.length}); E.vents.push(v); elvDirty(E); return v; },
  // no flying here: {poly|rect|disc, why:'The mountain winds are too strong to fly.'}
  noFly(def){ const [ax,ay]=elvAnchor(def), E=elvM(def.k!=null?def.k:elvMapOf(ax,ay)), z=elvZone(def); if(!z) return null; z.why=def.why||S('The winds are too strong to fly here.','Too windy to fly here.'); E.nofly.push(z); return z; },
  // a grapple post on top of a face (data for the Grapple Tail): {x,y,lvl?}
  grapple(def){ const E=elvM(def.k!=null?def.k:elvMapOf(def.x,def.y)); const g=Object.assign({},def); E.posts.push(g); elvDirty(E); return g; },
  // keep props (trees, rocks) out of an area: {poly|rect|disc|path:{pts,w}}
  clear(def){ const [ax,ay]=elvAnchor(def), E=elvM(def.k!=null?def.k:elvMapOf(ax,ay)), z=elvZone(def); if(z){ E.clears.push(z); E.pbb=null; } return z; },
  // water or lava pouring over the face below (x,y): {x,y,w:28,kind:'water'|'lava'}
  fall(def){ const E=elvM(def.k!=null?def.k:elvMapOf(def.x,def.y)); const f=Object.assign({w:28,kind:'water'},def); E.falls.push(f); elvDirty(E); return f; },
  // a trail painted on a terrace (gravel and stepping stones), kept clear of props and drawn on the maps:
  // {pts:[[x,y],...], w:36, lvl?: the level it is painted at (default: the level under its first point)}
  path(def){ const p0=def.pts[0], E=elvM(def.k!=null?def.k:elvMapOf(p0[0],p0[1])); const p=Object.assign({w:36},def,{i:(E.paths=E.paths||[]).length}); let b=[1e9,1e9,-1e9,-1e9]; for(const q of p.pts){ b[0]=Math.min(b[0],q[0]); b[1]=Math.min(b[1],q[1]); b[2]=Math.max(b[2],q[0]); b[3]=Math.max(b[3],q[1]); } p.bb=[b[0]-p.w,b[1]-p.w,b[2]+p.w,b[3]+p.w]; E.paths.push(p); ELEV.clear({k:E.k,path:{pts:p.pts,w:p.w*0.5+14}}); elvDirty(E); return p; },
  // extra ground art painted into the chunks over the cliffs: {k, bb:[x0,y0,x1,y1], lvl, paint(g,x0,y0,x1,y1,chunk)}
  deco(d){ ELV.deco.push(d); const E=elvM(d.k||0); elvDirty(E); return d; },
  style(name,def){ ELEV_STYLES[name]=Object.assign({},ELEV_STYLES.rock,def); return ELEV_STYLES[name]; },
  map(k){ return elvM(k); },
  rebuild(k){ const E=ELV.maps[k]; if(E){ elvDirty(E); elvBuild(E); } },
  grid(k){ const E=ELV.maps[k]; if(!E) return null; if(E.dirty) elvBuild(E); return E.G; },
  posts(k){ const E=ELV.maps[k]; if(!E) return []; if(E.dirty) elvBuild(E); return E.posts; },
  vents(k){ const E=ELV.maps[k]; if(!E) return []; if(E.dirty) elvBuild(E); return E.vents; },
  // for powers (Climbing Claws, Grapple Tail, Wind Riding): look things up, and move Ash over a face with the hop
  noFlyAt:(x,y)=>elvNoFly(x,y), ventAt:(x,y)=>elvVentAt(x,y), rampAt:(x,y)=>elvRampAt(x,y),
  // the landing spot across the faces from (x,y) along (dx,dy): mode 'down' (any lower level) or 'up' (level `to`)
  findHop:(x,y,dx,dy,mode,from,to)=>elvHopFind(x,y,dx,dy,mode,from==null?elevLvl(x,y):from,to),
  // hop Ash to (x,y) in a short arc (kind 'up' or 'down'); his own input is ignored until he lands
  hopTo(x,y,kind){ if(!player) return false; elvHopStart(player,{x,y},kind||'down'); return true; },
  standOK:(x,y)=>elvStandOK(x,y)
};

// ---------- rasterising a map into its grid
// even-odd scanline fill over all rings: fn(rowStart, i0, i1) for each run of cells whose centres are inside
function elvScanSpans(rings,g,fn){
  const cs=g.cs, rows=new Map();
  for(const r of rings) for(let i=0;i<r.n;i++){
    const ax=r.x[i], ay=r.y[i], q=(i+1)%r.n, bx=r.x[q], by=r.y[q]; if(ay===by) continue;
    const ya=Math.min(ay,by), yb=Math.max(ay,by), ja=Math.ceil((ya-g.y0)/cs-0.5), jb=Math.floor((yb-g.y0)/cs-0.5);
    for(let j=Math.max(0,ja);j<=Math.min(g.h-1,jb);j++){ const yc=g.y0+(j+0.5)*cs; if(yc<ya||yc>=yb) continue; let a=rows.get(j); if(!a){ a=[]; rows.set(j,a); } a.push(ax+(yc-ay)*(bx-ax)/(by-ay)); }
  }
  for(const [j,xs] of rows){
    xs.sort((a,b)=>a-b);
    for(let k=0;k+1<xs.length;k+=2){
      const ia=Math.max(0,Math.ceil((xs[k]-g.x0)/cs-0.5)), ib=Math.min(g.w-1,Math.floor((xs[k+1]-g.x0)/cs-0.5));
      if(ib>=ia) fn(j*g.w,ia,ib);
    }
  }
}
function elvBuild(E){
  E.dirty=false; ELV.rev++; const PT0=performance.now(), PT=[], pt=l=>PT.push(l+' '+(performance.now()-PT0).toFixed(1));
  if(!E.plats.length){ E.G=null; return; }
  const cs=ELV.cs, M=MAPS[E.k]||MAPS[0];
  let bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
  for(const P of E.plats){ bx0=Math.min(bx0,P.bb[0]-60); by0=Math.min(by0,P.bb[1]-60); bx1=Math.max(bx1,P.bb[2]+60); by1=Math.max(by1,P.bb[3]+P.lvl*ELV.px+60); }
  for(const r of E.ramps){ bx0=Math.min(bx0,r.x0-40); by0=Math.min(by0,r.y0-340); bx1=Math.max(bx1,r.x1+40); by1=Math.max(by1,r.y1+340); }
  bx0=Math.max(bx0,-cs*4); by0=Math.max(by0,M.y0-cs*4); bx1=Math.min(bx1,M.w+cs*4); by1=Math.min(by1,M.y0+M.h+cs*4);
  const x0=Math.floor(bx0/cs)*cs, y0=Math.floor(by0/cs)*cs, w=Math.ceil((bx1-x0)/cs)+1, h=Math.ceil((by1-y0)/cs)+1, N=w*h;
  const g={x0,y0,w,h,cs,L:null,F:new Uint8Array(N),ST:new Uint8Array(N),RI:new Uint8Array(N),k:E.k};
  // R raw level, OWB the top owner's step (1) and climb (2) bits, TMP: 1 step face, 2 other face, 4 climbable, 8 rim, 16 rim candidate
  const R=new Uint8Array(N), OWB=new Uint8Array(N), TMP=new Uint8Array(N), ST=g.ST, FL=[];
  // 1. raw levels: the highest plateau over each cell (and its look)
  E.plats.forEach((P,pi)=>{ const lv=P.lvl, lk=P.look, ob=(P.step?1:0)|(P.climb?2:0); elvScanSpans(P.rings,g,(row,ia,ib)=>{ for(let c=row+ia,e=row+ib;c<=e;c++) if(lv>=R[c]){ R[c]=lv; OWB[c]=ob; ST[c]=lk; } }); });
  const rAt=(x,y)=>{ const i=Math.floor((x-x0)/cs), j=Math.floor((y-y0)/cs); return i<0||j<0||i>=w||j>=h?0:R[j*w+i]; };
  const L=R.slice(); g.L=L;
  pt('raw');
  // 2. face geometry (what lies just outside each vertex decides how tall the face below it is), then 3. its cells
  for(const P of E.plats){
    const per=P.step?ELV.step:ELV.px; let fb=P.bb.slice();
    for(const r of P.rings){
      const n=r.n, X=r.x, Y=r.y;
      const snx=new Float32Array(n), sny=new Float32Array(n), vnx=new Float32Array(n), vny=new Float32Array(n), H=new Float32Array(n), bxv=new Float32Array(n), byv=new Float32Array(n), front=new Uint8Array(n), sbb=new Float32Array(n*4);
      for(let i=0;i<n;i++){ const q=(i+1)%n, dx=X[q]-X[i], dy=Y[q]-Y[i], l=Math.hypot(dx,dy)||1; snx[i]=dy/l; sny[i]=-dx/l; }
      for(let i=0;i<n;i++){ const p=(i+n-1)%n; let ax=snx[p]+snx[i], ay=sny[p]+sny[i]; const l=Math.hypot(ax,ay)||1; vnx[i]=ax/l; vny[i]=ay/l; }
      for(let i=0;i<n;i++){
        let b=rAt(X[i]+vnx[i]*12,Y[i]+vny[i]*12); if(b>=P.lvl) b=Math.min(b,rAt(X[i]+vnx[i]*20,Y[i]+vny[i]*20));
        const hh=Math.max(0,P.lvl-b)*per; H[i]=hh; bxv[i]=vnx[i]*clamp(hh*0.3,0,18); byv[i]=hh;
      }
      const inner=new Uint8Array(n);
      for(let i=0;i<n;i++){
        const q=(i+1)%n; front[i]=sny[i]>-0.3&&(H[i]>0||H[q]>0)?1:0;
        // an edge that runs inside equal or higher ground (a step merging into its terrace, a floor under a rim) is not drawn
        inner[i]=rAt((X[i]+X[q])/2+snx[i]*10,(Y[i]+Y[q])/2+sny[i]*10)>=P.lvl&&!front[i]?1:0;
        const xa=Math.min(X[i],X[q],X[i]+bxv[i],X[q]+bxv[q]), xb=Math.max(X[i],X[q],X[i]+bxv[i],X[q]+bxv[q]), ya=Math.min(Y[i],Y[q]), yb=Math.max(Y[i]+byv[i],Y[q]+byv[q]);
        sbb[i*4]=xa; sbb[i*4+1]=ya; sbb[i*4+2]=xb; sbb[i*4+3]=yb+24;
        if(xa<fb[0]) fb[0]=xa; if(xb>fb[2]) fb[2]=xb; if(yb+24>fb[3]) fb[3]=yb+24;
      }
      Object.assign(r,{snx,sny,vnx,vny,H,bxv,byv,front,sbb,inner});
    }
    P.fb=fb;
  }
  pt('geom');
  // each front segment's face quad, filled row by row (a quad crosses a row at most at 4 points)
  const QX=new Float64Array(4), QY=new Float64Array(4), XS=new Float64Array(4);
  E.plats.forEach((P,pi)=>{
    const lv=P.lvl, tbits=(P.step?1:2)|(P.climb?4:0), lk=P.look;
    for(const r of P.rings) for(let i=0;i<r.n;i++){
      if(!r.front[i]) continue; const q=(i+1)%r.n;
      QX[0]=r.x[i]; QX[1]=r.x[q]; QX[2]=r.x[q]+r.bxv[q]; QX[3]=r.x[i]+r.bxv[i];
      QY[0]=r.y[i]; QY[1]=r.y[q]; QY[2]=r.y[q]+r.byv[q]; QY[3]=r.y[i]+r.byv[i];
      const ya=Math.min(QY[0],QY[1],QY[2],QY[3]), yb=Math.max(QY[0],QY[1],QY[2],QY[3]);
      const ja=Math.max(0,Math.ceil((ya-y0)/cs-0.5)), jb=Math.min(h-1,Math.floor((yb-y0)/cs-0.5));
      for(let j=ja;j<=jb;j++){
        const yc=y0+(j+0.5)*cs; let n=0;
        for(let e=0;e<4;e++){ const ax=QX[e], ay=QY[e], bx=QX[(e+1)&3], by=QY[(e+1)&3]; if(ay===by) continue; if(yc<Math.min(ay,by)||yc>=Math.max(ay,by)) continue; XS[n++]=ax+(yc-ay)*(bx-ax)/(by-ay); }
        if(n<2) continue;
        let xa=XS[0], xb=XS[0]; for(let k=1;k<n;k++){ if(XS[k]<xa) xa=XS[k]; if(XS[k]>xb) xb=XS[k]; }
        const ia=Math.max(0,Math.ceil((xa-x0)/cs-0.5)), ib=Math.min(w-1,Math.floor((xb-x0)/cs-0.5));
        for(let ii=ia;ii<=ib;ii++){
          const c=j*w+ii; if(R[c]>=lv) continue;
          if(lv>L[c]) L[c]=lv;
          if(lv>=L[c]){ if(!(g.F[c]&1)){ g.F[c]|=1; FL.push(c); } TMP[c]|=tbits; ST[c]=lk; }
        }
      }
    }
  });
  pt('faces');
  // 4. ramps cut through the faces (and reach on through any face cells beyond their rect)
  const F=g.F, ci=(x,y)=>{ const i=Math.floor((x-x0)/cs), j=Math.floor((y-y0)/cs); return i<0||j<0||i>=w||j>=h?-1:j*w+i; };
  E.ramps.forEach((rp,ri)=>{
    const i0=clamp(Math.floor((rp.x0-x0)/cs),0,w-1), i1=clamp(Math.floor((rp.x1-1-x0)/cs),0,w-1), j0=clamp(Math.floor((rp.y0-y0)/cs),0,h-1), j1=clamp(Math.floor((rp.y1-1-y0)/cs),0,h-1);
    const vert=rp.dir==='n'||rp.dir==='s', lows=[], highs=[]; let ex0=i0, ex1=i1, ey0=j0, ey1=j1;
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const c=j*w+i; F[c]=(F[c]&~(EF.FACE|EF.RIM))|EF.RAMP; g.RI[c]=ri+1; }
    const lim=Math.ceil(340/cs);
    if(vert){
      for(let i=i0;i<=i1;i++){
        let a=j0-1, b=j1+1, k=0; while(a>=0&&k<lim&&(F[a*w+i]&EF.FACE)){ F[a*w+i]=(F[a*w+i]&~EF.FACE)|EF.RAMP; g.RI[a*w+i]=ri+1; a--; k++; } k=0;
        while(b<h&&k<lim&&(F[b*w+i]&EF.FACE)){ F[b*w+i]=(F[b*w+i]&~EF.FACE)|EF.RAMP; g.RI[b*w+i]=ri+1; b++; k++; }
        if(a>=0) (rp.dir==='n'?highs:lows).push(L[a*w+i]); if(b<h) (rp.dir==='n'?lows:highs).push(L[b*w+i]);
        ey0=Math.min(ey0,a+1); ey1=Math.max(ey1,b-1);
      }
    }else{
      for(let j=j0;j<=j1;j++){
        let a=i0-1, b=i1+1, k=0; while(a>=0&&k<lim&&(F[j*w+a]&EF.FACE)){ F[j*w+a]=(F[j*w+a]&~EF.FACE)|EF.RAMP; g.RI[j*w+a]=ri+1; a--; k++; } k=0;
        while(b<w&&k<lim&&(F[j*w+b]&EF.FACE)){ F[j*w+b]=(F[j*w+b]&~EF.FACE)|EF.RAMP; g.RI[j*w+b]=ri+1; b++; k++; }
        if(a>=0) (rp.dir==='w'?highs:lows).push(L[j*w+a]); if(b<w) (rp.dir==='w'?lows:highs).push(L[j*w+b]);
        ex0=Math.min(ex0,a+1); ex1=Math.max(ex1,b-1);
      }
    }
    const med=a=>{ if(!a.length) return 0; const s=a.slice().sort((p,q)=>p-q); return s[s.length>>1]; };
    rp.lo=med(lows); rp.hi=Math.max(med(highs),rp.lo+(highs.length?0:1)); if(rp.hi===rp.lo&&!highs.length) rp.hi=rp.lo+1;
    rp.ax0=x0+ex0*cs; rp.ax1=x0+(ex1+1)*cs; rp.ay0=y0+ey0*cs; rp.ay1=y0+(ey1+1)*cs;
    for(let j=ey0;j<=ey1;j++) for(let i=ex0;i<=ex1;i++){ const c=j*w+i; if(g.RI[c]===ri+1) L[c]=rp.lo; }
  });
  pt('ramps');
  // 5. rims: any two touching walkable cells of different levels get the higher one blocked (the back edge of a top)
  // levels only change along plateau outlines and ramp edges, so only cells near those are checked (all 8 neighbours)
  const RI=g.RI, RP=E.ramps, RLO=new Uint8Array(RP.length+1), RHI=new Uint8Array(RP.length+1), CL=[], RL=[];
  RP.forEach((r,i)=>{ RLO[i+1]=r.lo; RHI[i+1]=r.hi; });
  const cand=(i,j)=>{ for(let b=Math.max(1,j-1);b<=Math.min(h-2,j+1);b++) for(let a=Math.max(1,i-1);a<=Math.min(w-2,i+1);a++){ const c=b*w+a; if(!(TMP[c]&16)){ TMP[c]|=16; CL.push(c); } } };
  for(const P of E.plats) for(const r of P.rings) for(let i=0;i<r.n;i++){
    const q=(i+1)%r.n, ax=r.x[i], ay=r.y[i], dx=r.x[q]-ax, dy=r.y[q]-ay, m=Math.max(1,Math.ceil(Math.hypot(dx,dy)/(cs*0.5)));
    for(let k=0;k<=m;k++) cand(Math.floor((ax+dx*k/m-x0)/cs),Math.floor((ay+dy*k/m-y0)/cs));
  }
  for(const rp of RP){ if(rp.ax0==null) continue; const i0=Math.floor((rp.ax0-x0)/cs), i1=Math.floor((rp.ax1-x0)/cs)-1, j0=Math.floor((rp.ay0-y0)/cs), j1=Math.floor((rp.ay1-y0)/cs)-1; for(let i=i0;i<=i1;i++){ cand(i,j0); cand(i,j1); } for(let j=j0;j<=j1;j++){ cand(i0,j); cand(i1,j); } }
  const mark=c=>{ if(!(TMP[c]&8)){ TMP[c]|=8; RL.push(c); } };
  const pair=(c,d)=>{
    const fc=F[c], fd=F[d]; if((fc|fd)&1) return;
    const lc=L[c], ld=L[d]; if(lc===ld&&!((fc|fd)&8)) return;
    const rc=fc&8, rd=fd&8; if(rc&&rd) return;
    if(rd){ const k=RI[d]; if(lc!==RLO[k]&&lc!==RHI[k]) mark(c); return; }
    if(rc){ const k=RI[c]; if(ld!==RLO[k]&&ld!==RHI[k]) mark(d); return; }
    if(lc>ld) mark(c); else mark(d);
  };
  for(const c of CL){ pair(c,c-w-1); pair(c,c-w); pair(c,c-w+1); pair(c,c-1); pair(c,c+1); pair(c,c+w-1); pair(c,c+w); pair(c,c+w+1); }
  for(const c of RL){ F[c]|=EF.FACE|EF.RIM; const o=OWB[c]; if(o&2) TMP[c]|=4; TMP[c]|=o&1?1:2; }
  pt('rims');
  // 6. ledges, steps, climbable faces, looks
  for(const l of E.ledges){ const i0=clamp(Math.floor((l.x0-x0)/cs)-1,0,w-1), i1=clamp(Math.floor((l.x1-x0)/cs)+1,0,w-1), j0=clamp(Math.floor((l.y0-y0)/cs)-1,0,h-1), j1=clamp(Math.floor((l.y1-y0)/cs)+1,0,h-1); for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const c=j*w+i; if(F[c]&EF.FACE) F[c]|=EF.LEDGE; } }
  for(const L2 of [FL,RL]) for(const c of L2){ const f=F[c]; if(!(f&1)) continue; const t=TMP[c]; if((t&1)&&!(t&2)) F[c]=f|16; if(t&4) F[c]|=2; }
  pt('flags');
  // ledge lips: the front segments along each ledge; segments over a ramp or a ledge keep their baked look in depth mode
  for(const P of E.plats) for(const r of P.rings){ r.noLean=new Uint8Array(r.n); for(let i=0;i<r.n;i++){ if(!r.front[i]) continue; const q=(i+1)%r.n, mx=(r.x[i]+r.x[q])/2, my=(r.y[i]+r.y[q])/2; for(const rp of E.ramps) if(rp.ax0!=null&&mx>rp.ax0-6&&mx<rp.ax1+6&&my>rp.ay0-30&&my<rp.ay1) r.noLean[i]=1; } }
  for(const l of E.ledges){ l.segs=[]; for(const P of E.plats) for(const r of P.rings) for(let i=0;i<r.n;i++){ if(!r.front[i]) continue; const q=(i+1)%r.n, mx=(r.x[i]+r.x[q])/2, my=(r.y[i]+r.y[q])/2; if(mx>=l.x0-10&&mx<=l.x1+10&&my>=l.y0-24&&my<=l.y1+10){ l.segs.push([P,r,i]); r.noLean[i]=1; } } }
  for(const v of E.vents){ const c=ci(v.x,v.y); v.lvl=v.lvl!=null?v.lvl:c<0?0:L[c]; }
  for(const p of E.paths){ if(p.lvl==null){ const c=ci(p.pts[0][0],p.pts[0][1]); p.lvl=c<0?0:L[c]; } }
  for(const p of E.posts){ const c=ci(p.x,p.y+2); if(p.lvl==null) p.lvl=c<0?0:L[c]; }
  for(const f of E.falls){
    let y=f.y, top=null, bot=null; for(let s=0;s<60;s++,y+=cs){ const c=ci(f.x,y); if(c<0) break; const fc=F[c]&EF.FACE&&!(F[c]&EF.RIM); if(fc&&top==null) top=y; if(top!=null&&!fc){ bot=y; break; } }
    f.y0=top!=null?Math.floor((top-y0)/cs)*cs+y0:f.y; f.y1=bot!=null?bot:f.y0+ELV.px; f.lvl=(()=>{ const c=ci(f.x,f.y0-6); return c<0?0:L[c]; })();
    f.bb=[f.x-f.w-30,f.y0-20,f.x+f.w+30,f.y1+40];
  }
  pt('end'); E.prof=PT; E.G=g;
}

// ---------- queries
function elvGrid(x,y){ if(x>=IZX-50) return null; const E=ELV.maps[y<15500?0:mapAt(y)]; if(!E) return null; if(E.dirty) elvBuild(E); return E.G; }
function elvIdx(g,x,y){ const i=Math.floor((x-g.x0)/g.cs), j=Math.floor((y-g.y0)/g.cs); return i<0||j<0||i>=g.w||j>=g.h?-1:j*g.w+i; }
function elvRampLvl(E,c,x,y){ const r=E.ramps[E.G.RI[c]-1]; if(!r) return E.G.L[c]; let t; if(r.dir==='n') t=(r.ay1-y)/Math.max(1,r.ay1-r.ay0); else if(r.dir==='s') t=(y-r.ay0)/Math.max(1,r.ay1-r.ay0); else if(r.dir==='e') t=(x-r.ax0)/Math.max(1,r.ax1-r.ax0); else t=(r.ax1-x)/Math.max(1,r.ax1-r.ax0); return t<0.5?r.lo:r.hi; }
// level of the walkable surface at a point (0 is the ground); faces report the level above them
function elevLvl(x,y){ const g=elvGrid(x,y); if(!g) return 0; const c=elvIdx(g,x,y); if(c<0) return 0; if(g.F[c]&EF.RAMP) return elvRampLvl(ELV.maps[g.k],c,x,y); return g.L[c]; }
// 0 none; 1 face (blocks walking); 2 climbable; 4 ledge; 8 ramp; 16 step
function elevFace(x,y){ if(ELV.ign) return 0; const g=elvGrid(x,y); if(!g) return 0; const c=elvIdx(g,x,y); return c<0?0:g.F[c]&31; }
function elvRampAt(x,y){ const g=elvGrid(x,y); if(!g) return null; const c=elvIdx(g,x,y); if(c<0||!(g.F[c]&EF.RAMP)) return null; return ELV.maps[g.k].ramps[g.RI[c]-1]||null; }
// an entity's level (a flying Ash counts as the highest level he could be over right now)
function elevOf(e){ if(!e) return 0; if(e===player&&player&&player.flying) return Math.max(elevLvl(e.x,e.y),(player.elvCeil!=null?player.elvCeil:1)-1); return elevLvl(e.x,e.y); }
// can a walker go straight from a to b (no face on the way)
function elevMoveOK(x0,y0,x1,y1){ const d=dist(x0,y0,x1,y1), n=Math.max(1,Math.ceil(d/4)); for(let i=0;i<=n;i++){ const t=i/n; if(elevFace(x0+(x1-x0)*t,y0+(y1-y0)*t)&EF.FACE) return false; } return true; }
function elvNoFly(x,y){ if(x>=IZX-50) return null; const E=ELV.maps[y<15500?0:mapAt(y)]; if(!E||!E.nofly.length) return null; for(const z of E.nofly) if(elvShapeIn(z,x,y)) return z; return null; }
function elvVentAt(x,y){ if(x>=IZX-50) return null; const E=ELV.maps[y<15500?0:mapAt(y)]; if(!E||!E.vents.length) return null; if(E.dirty) elvBuild(E); for(const v of E.vents) if(dist2(x,y,v.x,v.y)<v.r*v.r) return v; return null; }
function elvClearAt(E,x,y,m){ for(const z of E.clears){ if(x<z.bb[0]-m||y<z.bb[1]-m||x>z.bb[2]+m||y>z.bb[3]+m) continue; if(z.path){ if(elvPathD(z.path.pts,x,y)<=z.path.w+m) return true; } else if(elvShapeIn(z,x,y)) return true; } return false; }

// ---------- the terrain sample and walker blocking
// T gains `elev` (level) and `face` (elevFace bits) after seaD, so sample objects keep one shape. On a face there is
// no water or lava (rock); its colour comes from the face art painted into the chunk.
{ const base=T; T=function(x,y,o){
  o=base(x,y,o);
  const g=ELV.ign?null:elvGrid(x,y); let lv=0, f=0;
  if(g){ const c=elvIdx(g,x,y); if(c>=0){ f=g.F[c]&31; lv=f&EF.RAMP?elvRampLvl(ELV.maps[g.k],c,x,y):g.L[c]; if(f&EF.FACE){ o.water=0; o.lava=0; o.lavaS=0; o.shore=0; o.bog=0; } } }
  o.elev=lv; o.face=f; return o;
}; }
// faces block everyone on foot, before roads and bridges (a road never runs up a cliff)
{ const base=blockedAt; blockedAt=function(x,y){ if(!ELV.ign&&x<IZX-50){ const g=elvGrid(x,y); if(g){ const c=elvIdx(g,x,y); if(c>=0&&(g.F[c]&EF.FACE)) return true; } } return base(x,y); }; }
// a spawn spot near (x,y) stays on the level of (x,y): camps on a plateau spawn up there, not on the ground below
{ const base=spotNear; spotNear=function(x,y,r0,r1,avoid){ const g=elvGrid(x,y); if(!g) return base(x,y,r0,r1,avoid); const was=ELV.spotL; ELV.spotL=elevLvl(x,y); try{ return base(x,y,r0,r1,avoid); } finally{ ELV.spotL=was; } }; }
// (and a companion who catches up with Ash lands on his level)
{ const base=compSpotNear; compSpotNear=function(x,y,a){ const g=elvGrid(x,y); if(!g) return base(x,y,a); const was=ELV.spotL; ELV.spotL=elevLvl(x,y); try{ return base(x,y,a); } finally{ ELV.spotL=was; } }; }
{ const base=freeSpot; freeSpot=function(x,y,r){ if(!base(x,y,r)) return false; if(ELV.spotL!=null&&elvGrid(x,y)&&elevLvl(x,y)!==ELV.spotL) return false; return true; }; }
// plateau tops a touch lighter with height (and in the style's top colour); faces read as rock on the overview
{ const base=groundRGB; groundRGB=function(s,x,y){
  const c=base(s,x,y); if(!s.elev&&!s.face) return c;
  const g=elvGrid(x,y); if(!g) return c; const i=elvIdx(g,x,y); if(i<0) return c;
  const Lk=ELV.looks[g.ST[i]]; if(!Lk) return c;
  if(s.face&EF.FACE&&!(g.F[i]&EF.RIM)) return mixRGB(Lk.face,[0,0,0],0.18);
  if(s.water||s.lavaS>0.3) return c;
  return mixRGB(c,Lk.top,Math.min(0.62,Lk.k*s.elev));
}; }
// no trees or rocks on faces, ramps, vents and falls (their colliders go too), nor in the clear zones
{ const base=genProps; genProps=function(cx,cy){
  const out=base(cx,cy); if(!out.length) return out;
  const E=ELV.maps[mapAt(cy*CH+CH/2)]; if(!E||(!E.plats.length&&!E.clears.length)) return out;
  if(E.dirty) elvBuild(E); const g=E.G;
  if(!E.pbb){ const b=g?[g.x0,g.y0,g.x0+g.w*g.cs,g.y0+g.h*g.cs]:[1e9,1e9,-1e9,-1e9]; for(const z of E.clears){ b[0]=Math.min(b[0],z.bb[0]); b[1]=Math.min(b[1],z.bb[1]); b[2]=Math.max(b[2],z.bb[2]); b[3]=Math.max(b[3],z.bb[3]); } E.pbb=b; }
  const x0=cx*CH, y0=cy*CH, pb=E.pbb; if(x0>pb[2]+60||x0+CH<pb[0]-60||y0>pb[3]+60||y0+CH<pb[1]-60) return out;
  const keep=[];
  for(const p of out){
    let bad=false;
    if(g){ const R=(p.R||14)*0.55; for(const [dx,dy] of [[0,0],[-R,0],[R,0],[0,R*0.9],[0,-R*0.5]]){ const c=elvIdx(g,p.x+dx,p.y+dy); if(c>=0&&(g.F[c]&(EF.FACE|EF.RAMP))){ bad=true; break; } } }
    if(!bad) for(const v of E.vents) if(dist2(p.x,p.y,v.x,v.y)<(v.r+30)**2){ bad=true; break; }
    if(!bad) for(const f of E.falls) if(f.bb&&p.x>f.bb[0]&&p.x<f.bb[2]&&p.y>f.bb[1]&&p.y<f.bb[3]){ bad=true; break; }
    if(!bad&&E.clears.length&&elvClearAt(E,p.x,p.y,(p.R||14)*0.6)) bad=true;
    if(bad){ if(p.col) removeCol(p.col); continue; }
    keep.push(p);
  }
  return keep;
}; }

// ---------- Ash: faces block walking and jumping, flight has a ceiling, ledges hop him down, steps take a Double Jump
const hasDbl=()=>!!G&&((typeof hasAbil==='function'&&hasAbil('dbljump'))||hasSkill('dbljump'));
function elvCeil(p){ if(p.elvCeil==null){ p.elvBase=elevLvl(p.x,p.y); p.elvCeil=p.elvBase+1; } return p.elvCeil; }
{ const base=playerBlocked; playerBlocked=function(x,y){
  if(x>=IZX-50||ELV.ign) return base(x,y);
  const p=player; if(p&&p.hop) return false;
  const g=elvGrid(x,y); if(!g) return base(x,y);
  const c=elvIdx(g,x,y);
  if(p&&p.flying){ if(base(x,y)) return true; if(c<0) return false; const lv=g.F[c]&EF.RAMP?elvRampLvl(ELV.maps[g.k],c,x,y):g.L[c]; if(lv>elvCeil(p)){ p.elvBump=G.time; return true; } return false; }
  if(c>=0&&(g.F[c]&EF.FACE)) return true;
  return base(x,y);
}; }
{ const base=landOK; landOK=function(x,y){
  if(x<IZX-50){ const g=elvGrid(x,y); if(g){ const c=elvIdx(g,x,y); if(c>=0){ if(g.F[c]&EF.FACE) return false; const p=player; if(p&&p.flying&&elevLvl(x,y)>elvCeil(p)) return false; } } }
  return base(x,y);
}; }
// remember the last spot each walker stood on that was not inside a face (to put it back if a push lands it there)
function elvSafe(e){ const f=elevFace(e.x,e.y); if(!(f&EF.FACE)){ e._ex=e.x; e._ey=e.y; return true; } return false; }
{ const base=terrainFix; terrainFix=function(e,ox,oy){
  if(e.x>=IZX-100||e.noClip||(e.flying&&e!==player&&!e.inArea)) return base(e,ox,oy);
  const g=elvGrid(e.x,e.y)||elvGrid(ox,oy); if(!g) return base(e,ox,oy);
  const tx=e.x, ty=e.y, pl=e===player&&!!player, fly=pl&&player.flying, hop=pl&&!!player.hop;
  // already inside a face (a spawn, a teleport, a shove): back to the last good spot, or walk out freely
  if(!fly&&!hop&&(elevFace(ox,oy)&EF.FACE)){
    if(e._ex!=null&&dist2(e._ex,e._ey,ox,oy)<70*70&&!(elevFace(e._ex,e._ey)&EF.FACE)){ e.x=e._ex; e.y=e._ey; return; }
    ELV.ign++; try{ base(e,ox,oy); } finally{ ELV.ign--; } return;
  }
  base(e,ox,oy);
  // fast movers (rolls, knockback, low frame rates): the straight line must not jump over a thin rim
  if(!fly&&!hop){ const d=Math.hypot(e.x-ox,e.y-oy); if(d>5&&!elevMoveOK(ox,oy,e.x,e.y)){ e.x=ox; e.y=oy; e.hitWall=true; } }
  // a ramp marked foes:false is for Ash and friends only
  if(!pl&&e.type&&EDEF[e.type]&&(elevFace(e.x,e.y)&EF.RAMP)){ const rp=elvRampAt(e.x,e.y); if(rp&&rp.foes===false&&!(elevFace(ox,oy)&EF.RAMP)){ e.x=ox; e.y=oy; e.hitWall=true; } }
  if(pl&&!fly) elvAfterMove(tx,ty,ox,oy);
  if(!fly) elvSafe(e);
}; }
// pushes between Ash and foes never shove Ash into a face
{ const base=separate; separate=function(){ const p=player, ox=p?p.x:0, oy=p?p.y:0; base(); if(p&&!p.flying&&!p.hop&&p.x<IZX-50&&(elevFace(p.x,p.y)&EF.FACE)){ p.x=ox; p.y=oy; if((elevFace(p.x,p.y)&EF.FACE)&&p._ex!=null){ p.x=p._ex; p.y=p._ey; } } }; }
// Ash bumped into a face: a ledge (or a step, going down) hops him off; a Double Jump against a step lifts him up
function elvAfterMove(tx,ty,ox,oy){
  const p=player; if(!p||p.hop||p.flying||p.dead||AREA) return;
  const f=elevFace(tx,ty);
  // only Ash's own push (the stick or the keys) takes him off an edge, never a knock from a foe
  let mx=p.inMx||0, my=p.inMy||0;
  const ml=Math.hypot(mx,my); if(ml<0.2||!(f&EF.FACE)){ p.elvPushT=null; return; }
  mx/=ml; my/=ml;
  const here=elevLvl(ox,oy);
  if(f&EF.STEP&&p.z>0&&p.dbl){
    const gg=elvGrid(tx,ty), cc=gg?elvIdx(gg,tx,ty):-1, tl=cc<0?here+1:gg.L[cc];
    if(tl>here){ const t=elvHopFind(ox,oy,mx,my,'up',here,tl)||elvHopFind(ox,oy,0,-1,'up',here,tl); if(t){ elvHopStart(p,t,'up'); return; } }
  }
  if(f&(EF.LEDGE|EF.STEP)&&my>-0.55){
    if(p.elvPushT==null) p.elvPushT=G.time;
    if(G.time-p.elvPushT>=0.06||p.z>0){
      const t=elvHopFind(ox,oy,mx,my,'down',here)||(Math.abs(mx)>Math.abs(my)?null:elvHopFind(ox,oy,0,1,'down',here));
      if(t){ p.elvPushT=null; elvHopStart(p,t,'down'); return; }
    }
  }else p.elvPushT=null;
  // tips for kids: the low ledge that wants a Double Jump, handholds for later
  if(f&EF.STEP&&my<0.3&&elevLvl(tx,ty)>here) elvTip('step',hasDbl()?S('A low ledge! Jump, then jump again in the air to get up.','Jump, then jump again!'):S('This ledge is too high for one jump. Maybe two jumps would do it.','Too high for one jump.'),hasDbl()?S('Double Jump up','Double Jump'):S('Too high','Too high'));
  else if(f&EF.CLIMB&&my<0.3) elvTip('climb',S('Cracks and handholds. With climbing claws you could climb this.','Handholds! Claws could climb this.'),S('Handholds','Handholds'));
}
function elvTip(id,text,title){ const t=ELV.tipT[id]; if(t!=null&&G.time-t<4) return; ELV.tipT[id]=G.time; const p=player; ftext(p.x,p.y-(p.z||0)-34,title,'#ffe6b0',13); try{ mvTip(title,text,6,'elv_'+id); }catch(e){} }
// where a hop lands: across the face cells along (dx,dy), the first free spot on a lower level (down) or on level tl (up)
function elvStandOK(x,y){
  const f=elevFace(x,y); if(f&EF.FACE) return false;
  if(blockedAt(x,y)&&!(canWalkWater()&&!lavaSpot(x,y))) return false;
  const r=(player&&player.r)||14; let hit=false;
  forCols(x,y,r,c=>{ if(hit||!colActive(c)||c.low) return; if(c.t==='c'){ if(dist2(x,y,c.x,c.y)<(c.r+r*0.7)**2) hit=true; } else if(x>c.x0-r*0.7&&x<c.x1+r*0.7&&y>c.y0-r*0.7&&y<c.y1+r*0.7) hit=true; });
  return !hit;
}
function elvHopFind(x,y,dx,dy,mode,here,tl){
  let crossed=false;
  for(let s=3;s<=300;s+=3){
    const px=x+dx*s, py=y+dy*s, f=elevFace(px,py);
    if(f&EF.FACE){ crossed=true; continue; }
    if(!crossed){ if(s>24) return null; continue; }
    const lv=elevLvl(px,py);
    if(mode==='down'?lv>=here:lv!==tl) return null;
    for(const e of [12,18,6,24]){ const lx=px+dx*e, ly=py+dy*e; if(elevLvl(lx,ly)===lv&&elvStandOK(lx,ly)) return {x:lx,y:ly,l:lv,d:s+e}; }
    return null;
  }
  return null;
}
function elvHopStart(p,t,kind){
  const d=Math.hypot(t.x-p.x,t.y-p.y);
  p.hop={x0:p.x,y0:p.y,z0:p.z||0,x1:t.x,y1:t.y,t:0,dur:kind==='up'?0.26+d/900:0.24+d/650,peak:kind==='up'?Math.max(10,(p.z||0)*0.6+8):10+Math.min(26,d*0.14),kind};
  p.avx=p.avy=0; p.vz=0; p.dashT=0; p.swingT=0; p.breathing=false; p.elvPushT=null;
  try{ mvSnd(kind==='up'?'dbl':'jump',0.7); }catch(e){}
  if(G.stats) G.stats.elvHops=(G.stats.elvHops||0)+1;
}
function elvHopStep(p,dt){
  const H=p.hop; H.t+=dt; const k=clamp(H.t/H.dur,0,1), e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  p.x=lerp(H.x0,H.x1,e); p.y=lerp(H.y0,H.y1,e); p.z=Math.max(0,H.z0*(1-k)+H.peak*4*k*(1-k));
  p.t+=dt; p.iframes-=dt; p.hurtFlash-=dt; p.atkCd-=dt; p.dashCd-=dt; p.comboTimer-=dt; p.moving=false; p.sprinting=false; p.breathing=false;
  if(typeof MV!=='undefined'){ MV.lx=p.x; MV.ly=p.y; MV.jumpBuf=0; }
  if(k>=1){
    p.hop=null; p.z=0; p.vz=0; p.dbl=false; p.slam=false; p.x=H.x1; p.y=H.y1; p.safeX=p.x; p.safeY=p.y; p._ex=p.x; p._ey=p.y;
    p.sqT=0.16; p.sqD=0.16; p.sqA=0.16; shake(H.kind==='up'?1.5:2.5);
    try{ mvSnd('land',1.1); }catch(e){}
    emit(p.x,p.y+5,12,{col:'150,130,110',glow:false,smin:30,smax:120,lmin:.25,lmax:.55,zmin:2,zmax:4.5,grow:8});
    collideObs(p);
  }
}
{ const base=updatePlayer; updatePlayer=function(dt,inp){
  const p=player;
  if(p&&p.hop){ if(AREA||p.dead){ p.hop=null; p.z=0; } else { elvHopStep(p,dt); try{ SFX.setFire(false); }catch(e){} return; } }
  base(dt,inp);
  if(p&&!AREA&&p.x<IZX-50) elvFlight(p,dt);
  // a big grid of a map Ash has left is dropped (it is rebuilt the same if he comes back)
  const k=curMap(); if(k!==ELV.lastK){ ELV.lastK=k; for(const E of ELV.maps) if(E&&E.k!==k&&E.G&&E.G.w*E.G.h>400000){ E.G=null; E.dirty=true; } }
}; }
// take-off fixes the flight ceiling: one level above where he stood (vents lift it)
{ const base=takeOff; takeOff=function(p){ base(p); p.elvBase=elevLvl(p.x,p.y); p.elvCeil=p.elvBase+1; const v=elvVentAt(p.x,p.y); if(v){ p.elvCeil=Math.max(p.elvCeil,v.lvl+1+v.lift); p.elvVentT=1.6; } }; }
// no-fly zones (outside the vents) ground him gently; vents work even over a boss fight
{ const base=canFlyHere; canFlyHere=function(){
  const p=player; if(!p||!G||AREA||G.mode!=='story'||p.x>=IZX-50) return base();
  const v=elvVentAt(p.x,p.y), carry=!!v||(p.elvVentT||0)>0;
  if(carry&&hasAbil('wings')) return true;
  if(!base()) return false;
  const z=elvNoFly(p.x,p.y); if(!z) return true;
  elvNoFlyNote(p,z); return false;
}; }
function elvNoFlyNote(p,z){
  // airborne and about to try: say why (and keep the stock "No room to fly here" quiet); flying: as he sinks
  const dblLeft=hasDbl()&&!p.dbl&&!p.flying;
  if(p.flying||((MV.jumpBuf>0||MV.holdT>0.3)&&p.z>0&&!dblLeft)){
    if(G.time-ELV.msgT>3.2){ ELV.msgT=G.time; ftext(p.x,p.y-(p.z||0)-34,z.why,'#ffd9a0',13); try{ mvTip(S('No flying','No flying'),z.why+' '+S('Look for hot air vents: their updrafts carry you up.','Find a hot air vent. It lifts you up!'),7,'elv_nofly'); }catch(e){} }
    if(!p.flying) MV.noFlyT=Math.max(MV.noFlyT||0,2);
  }
}
// every frame in the open: the updraft, the ceiling, the ceiling bump message
function elvFlight(p,dt){
  if(p.elvVentT>0) p.elvVentT-=dt;
  const v=elvVentAt(p.x,p.y);
  if(p.flying){
    elvCeil(p);
    if(v){ p.elvCeil=Math.max(p.elvCeil,v.lvl+1+v.lift); p.elvVentT=1.6; if(!p.landing&&!p.gliding){ p.z=Math.min(FLY_Z+38,p.z+70*dt); p.flyE=Math.min(flyMax(),p.flyE+dt*1.5); } }
    // never stuck over ground higher than the ceiling (a teleport, a vent ending): count it as reachable
    const lv=elevLvl(p.x,p.y); if(lv>p.elvCeil) p.elvCeil=lv;
    if(p.elvBump&&G.time-p.elvBump<0.05&&(ELV.tipT.ceil==null||G.time-ELV.tipT.ceil>3.5)){ ELV.tipT.ceil=G.time; ftext(p.x,p.y-p.z-34,S('Too high to fly up there','Too high!'),'#ffd9a0',13); try{ mvTip(S('Too high','Too high'),S('Your wings lift you one level above where you took off. Hot air vents lift you higher.','Wings go up one step. Vents go higher!'),7,'elv_ceil'); }catch(e){} }
    if(Math.random()<dt*20&&(p.landing||p.gliding)&&!v&&elvNoFly(p.x,p.y)) emit(p.x+rand(-60,60),p.y-p.z-rand(30,90),1,{col:'235,228,220',glow:false,ang:Math.PI/2,spread:0.2,smin:160,smax:260,lmin:.2,lmax:.4,zmin:1,zmax:1.8,drag:0.5,alpha:0.5});
  }else{
    if(!p.dead&&(p.z||0)<=0) p.elvCeil=null;
    // an updraft catches a jumping Ash with wings: up he goes
    if(v&&p.z>2&&p.vz>0&&hasAbil('wings')&&G.mode==='story'&&p.flyE>=1&&!p.slam){ takeOff(p); p.elvVentT=1.6; ftext(p.x,p.y-p.z-34,S('Updraft!','Whoosh!'),'#ffe6b0',13); }
  }
  if(!p.flying&&!p.hop&&(p.z||0)<=0&&!elvSafe(p)&&!p.dead) elvUnstick(p);
}
// standing inside a face (an old save, a teleport): step out to the nearest open ground, the higher side first
function elvUnstick(p){
  if(p._ex!=null&&!(elevFace(p._ex,p._ey)&EF.FACE)&&dist2(p._ex,p._ey,p.x,p.y)<90*90){ p.x=p._ex; p.y=p._ey; return; }
  let best=null, bs=-1e9;
  for(let d=8;d<=240&&!best;d+=8){ const n=Math.max(8,Math.round(d/6)); for(let i=0;i<n;i++){ const a=i/n*TAU, x=p.x+Math.cos(a)*d, y=p.y+Math.sin(a)*d; if(elevFace(x,y)&EF.FACE||playerBlocked(x,y)) continue; const s=elevLvl(x,y)*20-Math.sin(a)*4; if(s>bs){ bs=s; best={x,y}; } } }
  if(best){ p.x=best.x; p.y=best.y; p._ex=p.x; p._ey=p.y; p.safeX=p.x; p.safeY=p.y; }
}
{ const base=terrSpeed; terrSpeed=function(s){ const k=base(s); return s&&s.face&EF.RAMP?k*0.9:k; }; }

// ---------- shots: from higher ground they fly over lower ground; a face stops a shot fired from below
function elvPlayerShotLvl(){ const p=player; if(!p) return 0; if(p.flying) return Math.max(elevLvl(p.x,p.y),elvCeil(p)); return elevLvl(p.x,p.y); }
// the level a shot leaves from: where it spawns, or just behind that if it spawns inside a face (a foe at the foot)
function elvShotFrom(x,y,vx,vy){
  let lv=elevLvl(x,y);
  if(elevFace(x,y)&EF.FACE){ const s=Math.hypot(vx,vy)||1; for(const d of [12,24,36]){ const bx=x-vx/s*d, by=y-vy/s*d; if(!(elevFace(bx,by)&EF.FACE)){ lv=elevLvl(bx,by); break; } } }
  return lv;
}
{ const base=shoot; shoot=function(x,y,ang,spd,r,dmg,kind,owner,extra){
  base(x,y,ang,spd,r,dmg,kind,owner,extra);
  const pr=G.projectiles[G.projectiles.length-1];
  if(pr&&!AREA&&elvGrid(x,y)) pr.elv=(owner==='player')?elvPlayerShotLvl():elvShotFrom(x,y,pr.vx,pr.vy);
}; }
{ const base=updateProjectiles; updateProjectiles=function(dt){
  if(!AREA&&G&&G.projectiles.length) for(const pr of G.projectiles){
    if(pr.dead) continue;
    if(!elvGrid(pr.x,pr.y)) continue;
    if(pr.owner==='player'&&!pr._elvR){ pr._elvR=true; pr.elv=elvPlayerShotLvl(); }
    if(pr.elv==null) pr.elv=elevLvl(pr.x,pr.y);
    const nx=pr.x+pr.vx*dt, ny=pr.y+pr.vy*dt;
    if(elevLvl(nx,ny)>pr.elv){ pr.dead=true; smallBoom(nx,ny); }
  }
  base(dt);
}; }
{ const base=wWall; wWall=function(x,y){ if(base(x,y)) return true; return ELV.shot!=null&&!AREA&&elevLvl(x,y)>ELV.shot; }; }
function elvWProj(a){ if(a.elv==null||(a.elv<0&&a.t>0.05)){ if(elvGrid(a.x,a.y)) a.elv=a.t<0.05?elvPlayerShotLvl():elevLvl(a.x,a.y); else a.elv=-1; } ELV.shot=a.elv>=0?a.elv:null; }
{ const base=stepArrow; stepArrow=function(a,dt){ elvWProj(a); try{ base(a,dt); } finally{ ELV.shot=null; ELV.lastArrow={x:a.x,y:a.y,dead:!!a.dead,elv:a.elv}; } }; }
{ const base=stepRang; stepRang=function(r,dt){ elvWProj(r); try{ base(r,dt); } finally{ ELV.shot=null; } }; }

// ---------- art: cliffs painted into the ground chunks (Cat Quest bold: flat tones, a lit lip, dark outlines)
function elvPath(g,X,Y,idx,close){ g.moveTo(X(idx[0]),Y(idx[0])); for(let k=1;k<idx.length;k++) g.lineTo(X(idx[k]),Y(idx[k])); if(close) g.closePath(); }
function elvPaintPlat(g,P,rx0,ry0,rx1,ry1){
  if(LOOK.re) return reElvPlat(g,P,rx0,ry0,rx1,ry1);   // (v12 ART23) the Realistic look's rock faces (e12d_acts23.js)
  const S=P.S, tex=S.tex;
  for(const r of P.rings){
    const n=r.n, X=r.x, Y=r.y, BX=r.bxv, BY=r.byv, FR=r.front, SB=r.sbb;
    const on=i=>SB[i*4]<rx1&&SB[i*4+2]>rx0&&SB[i*4+1]<ry1&&SB[i*4+3]>ry0;
    // runs of consecutive front segments in view
    let s0=0; for(let i=0;i<n;i++) if(!FR[i]){ s0=i; break; }
    const runs=[]; let cur=null;
    for(let t=1;t<=n;t++){ const i=(s0+t)%n; if(FR[i]&&on(i)){ if(!cur){ cur=[i]; runs.push(cur); } else cur.push(i); } else cur=null; }
    const vx=(i,f)=>X[i]+BX[i]*f, vy=(i,f)=>Y[i]+BY[i]*f;
    for(const run of runs){
      const vs=run.slice(); vs.push((run[run.length-1]+1)%n);
      const band=(f0,f1,col)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(vx(vs[0],f0),vy(vs[0],f0)); for(let k=1;k<vs.length;k++) g.lineTo(vx(vs[k],f0),vy(vs[k],f0)); for(let k=vs.length-1;k>=0;k--) g.lineTo(vx(vs[k],f1),vy(vs[k],f1)); g.closePath(); g.fill(); };
      // soft contact shadow on the ground below the face
      g.save(); g.lineJoin='round'; g.lineCap='round';
      for(const [lw,a,oy] of [[30,0.10,10],[16,0.16,5],[6,0.22,2]]){ g.strokeStyle=`rgba(0,0,0,${a})`; g.lineWidth=lw; g.beginPath(); g.moveTo(vx(vs[0],1),vy(vs[0],1)+oy); for(let k=1;k<vs.length;k++) g.lineTo(vx(vs[k],1),vy(vs[k],1)+oy); g.stroke(); }
      g.restore();
      band(0,1,S.face); band(0,0.16,S.lit); band(0.64,1,S.dark);
      // side walls: east faces in shade, west faces catch the light
      g.beginPath(); let any=false;
      for(const i of run){ const q=(i+1)%n, sx=r.snx[i]; if(sx<0.3) continue; any=true; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); g.lineTo(vx(q,1),vy(q,1)); g.lineTo(vx(i,1),vy(i,1)); g.closePath(); }
      if(any){ g.fillStyle='rgba(10,6,4,.26)'; g.fill(); }
      g.beginPath(); any=false;
      for(const i of run){ const q=(i+1)%n, sx=r.snx[i]; if(sx>-0.3) continue; any=true; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); g.lineTo(vx(q,1),vy(q,1)); g.lineTo(vx(i,1),vy(i,1)); g.closePath(); }
      if(any){ g.fillStyle='rgba(255,246,230,.10)'; g.fill(); }
      elvTexture(g,P,r,run,vx,vy);
      if(P.climb) elvClimbArt(g,P,r,run,vx,vy);
      if(P.step) elvStepArt(g,P,r,run,vx,vy);
      // outline: the foot of the face and its two ends
      g.strokeStyle=S.out; g.lineWidth=2.4; g.lineJoin='round'; g.lineCap='round'; g.beginPath();
      g.moveTo(X[vs[0]],Y[vs[0]]); for(let k=0;k<vs.length;k++) g.lineTo(vx(vs[k],1),vy(vs[k],1)); g.lineTo(X[vs[vs.length-1]],Y[vs[vs.length-1]]); g.stroke();
    }
    // a step's top is a pale slab, so the low spot in a cliff stands out
    if(P.step&&r===P.rings[0]){ g.fillStyle='rgba(255,236,214,.13)'; g.beginPath(); g.moveTo(X[0],Y[0]); for(let i=1;i<n;i++) g.lineTo(X[i],Y[i]); g.closePath(); g.fill(); }
    // the top's outline all round, then the lit lip just inside it (bright on the front, soft on the back rim)
    g.lineJoin='round'; g.lineCap='round';
    const segsOn=[]; for(let i=0;i<n;i++) if(on(i)&&!r.inner[i]) segsOn.push(i);
    if(!segsOn.length) continue;
    g.strokeStyle=S.out; g.lineWidth=2.6; g.beginPath(); for(const i of segsOn){ const q=(i+1)%n; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); } g.stroke();
    const ix=(i,d)=>X[i]-r.vnx[i]*d, iy=(i,d)=>Y[i]-r.vny[i]*d;
    g.strokeStyle=S.lip; g.lineWidth=2.6; g.beginPath(); for(const i of segsOn){ if(!FR[i]) continue; const q=(i+1)%n; g.moveTo(ix(i,2.6),iy(i,2.6)); g.lineTo(ix(q,2.6),iy(q,2.6)); } g.stroke();
    g.globalAlpha=0.45; g.lineWidth=1.6; g.beginPath(); for(const i of segsOn){ if(FR[i]) continue; const q=(i+1)%n; g.moveTo(ix(i,2.4),iy(i,2.4)); g.lineTo(ix(q,2.4),iy(q,2.4)); } g.stroke(); g.globalAlpha=1;
    if(S.fringe){ g.fillStyle=S.fringe; for(const i of segsOn){ if(!FR[i]) continue; const q=(i+1)%n, rng=mulberry32(P.seed*977+i*31); const L=Math.hypot(X[q]-X[i],Y[q]-Y[i]), m=Math.max(1,Math.round(L/6)); for(let k=0;k<m;k++){ const t=(k+0.5)/m, x=lerp(X[i],X[q],t), y=lerp(Y[i],Y[q],t); g.beginPath(); g.ellipse(x,y+1.5,3.6,2.4+rng()*3.2,0,0,TAU); g.fill(); } } }
  }
}
// face texture by style (deterministic per segment, so chunk seams line up)
function elvTexture(g,P,r,run,vx,vy){
  const S=P.S, tex=S.tex, X=r.x, Y=r.y, n=r.n;
  g.lineCap='round'; g.lineJoin='round';
  const segLen=i=>{ const q=(i+1)%n; return Math.hypot(X[q]-X[i],Y[q]-Y[i]); };
  const at=(i,t,f)=>{ const q=(i+1)%n; return [lerp(vx(i,f),vx(q,f),t),lerp(vy(i,f),vy(q,f),t)]; };
  if(tex==='columns'||tex==='crack'||tex==='facet'||tex==='roots'){
    g.strokeStyle=tex==='columns'?'rgba(16,10,8,.34)':'rgba(20,12,8,.32)'; g.lineWidth=tex==='columns'?1.6:1.3; g.beginPath();
    const hi=[];
    for(const i of run){
      const rng=mulberry32(P.seed*7919+i*104729), L=segLen(i);
      if(tex==='columns'){ const m=Math.max(1,Math.round(L/9)); for(let k=0;k<m;k++){ const t=(k+rng()*0.4)/m, f0=0.16+rng()*0.06, f1=0.9-rng()*0.12, [ax,ay]=at(i,t,f0), [bx,by]=at(i,t,f1); g.moveTo(ax,ay); g.lineTo(bx,by); hi.push([ax+2,ay+1,bx+2,by-2]); if(rng()<0.35){ const f=0.35+rng()*0.4, [cx,cy]=at(i,t,f), [dx2,dy2]=at(i,Math.min(1,t+1/m),f+0.04); g.moveTo(cx,cy); g.lineTo(dx2,dy2); } } }
      else if(tex==='crack'||tex==='roots'){ if(rng()<L/30){ let t=rng(), f=0.18+rng()*0.1; let [x,y]=at(i,t,f); g.moveTo(x,y); const steps=2+Math.floor(rng()*3); for(let s=0;s<steps;s++){ f+=0.12+rng()*0.16; t=clamp(t+(rng()-0.5)*0.5,0,1); [x,y]=at(i,t,Math.min(0.94,f)); g.lineTo(x,y); } } }
      else if(tex==='facet'){ if(rng()<L/20){ const t=rng(), [ax,ay]=at(i,t,0.2), [bx,by]=at(i,Math.min(1,t+0.5),0.55+rng()*0.3); g.moveTo(ax,ay); g.lineTo(bx,by); hi.push([ax+1.5,ay,bx+1.5,by]); } }
    }
    g.stroke();
    if(hi.length){ g.strokeStyle='rgba(255,236,214,.10)'; g.lineWidth=1.4; g.beginPath(); for(const h of hi){ g.moveTo(h[0],h[1]); g.lineTo(h[2],h[3]); } g.stroke(); }
    if(tex==='roots'){ g.fillStyle='rgba(40,28,16,.45)'; for(const i of run){ const rng=mulberry32(P.seed*31+i*7); if(rng()<0.6){ const [x,y]=at(i,rng(),0.3+rng()*0.6); g.beginPath(); g.arc(x,y,1.4+rng()*1.8,0,TAU); g.fill(); } } }
  }else if(tex==='layers'||tex==='wave'){
    const vs=run.slice(); vs.push((run[run.length-1]+1)%n);
    for(const f of [0.3,0.52,0.76]){
      g.strokeStyle='rgba(60,40,20,.20)'; g.lineWidth=1.5; g.beginPath();
      for(let k=0;k<vs.length;k++){ const i=vs[k], w=tex==='wave'?Math.sin(X[i]*0.08+f*9)*2.2:Math.sin(X[i]*0.03+f*5)*1.2, x=vx(i,f), y=vy(i,f)+w; k?g.lineTo(x,y):g.moveTo(x,y); }
      g.stroke();
      g.strokeStyle='rgba(255,255,250,.22)'; g.lineWidth=1; g.beginPath();
      for(let k=0;k<vs.length;k++){ const i=vs[k], w=tex==='wave'?Math.sin(X[i]*0.08+f*9)*2.2:Math.sin(X[i]*0.03+f*5)*1.2, x=vx(i,f), y=vy(i,f)+w-1.8; k?g.lineTo(x,y):g.moveTo(x,y); }
      g.stroke();
    }
  }else if(tex==='streak'||tex==='shine'){
    g.strokeStyle=tex==='shine'?'rgba(255,255,255,.34)':'rgba(255,255,255,.4)'; g.lineWidth=tex==='shine'?3:1.4; g.beginPath();
    for(const i of run){ const rng=mulberry32(P.seed*131+i*977), L=segLen(i); if(rng()<L/(tex==='shine'?40:22)){ const t=rng(), [ax,ay]=at(i,t,0.14), [bx,by]=at(i,Math.min(1,t+0.35),0.7); g.moveTo(ax,ay); g.lineTo(bx,by); } }
    g.stroke();
  }
}
// climbable faces: rows of knobbly handholds (rock styles) or vines (grass, sand)
function elvClimbArt(g,P,r,run,vx,vy){
  const X=r.x, Y=r.y, n=r.n, vine=P.style==='grass'||P.style==='sand';
  const at=(i,t,f)=>{ const q=(i+1)%n; return [lerp(vx(i,f),vx(q,f),t),lerp(vy(i,f),vy(q,f),t)]; };
  if(vine){
    g.strokeStyle='#4f8a2e'; g.lineWidth=2; g.beginPath(); const leaves=[];
    for(const i of run){ const rng=mulberry32(P.seed*53+i*13); if(rng()>0.55) continue; const t=rng(); let [x,y]=at(i,t,0.05); g.moveTo(x,y); for(let f=0.15;f<=0.95;f+=0.14){ const [a,b]=at(i,t,f); const xx=a+Math.sin(f*12+i)*3; g.lineTo(xx,b); leaves.push([xx,b]); } }
    g.stroke(); g.fillStyle='#78b848'; for(const [x,y] of leaves){ g.beginPath(); g.ellipse(x+2.5,y,3,1.8,0.5,0,TAU); g.fill(); }
    return;
  }
  const knobs=[];
  for(const i of run){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]), m=Math.max(1,Math.round(L/13)); for(let k=0;k<m;k++){ for(let row=0;row<4;row++){ const t=(k+0.5+(row%2)*0.5)/m; if(t>1) continue; const f=0.2+row*0.2; knobs.push(at(i,t,f)); } } }
  g.fillStyle='rgba(0,0,0,.38)'; g.beginPath(); for(const [x,y] of knobs){ g.moveTo(x+3.2,y+1.6); g.ellipse(x,y+1.6,3.2,2,0,0,TAU); } g.fill();
  g.fillStyle='#e8d6a8'; g.beginPath(); for(const [x,y] of knobs){ g.moveTo(x+2.8,y); g.ellipse(x,y,2.8,1.8,0,0,TAU); } g.fill();
}
// a step face: short blocks with worn joints, so it reads as "jumpable with two jumps"
function elvStepArt(g,P,r,run,vx,vy){
  // a paler, blockier face than the cliffs round it, with worn notches along its top: "this one is low"
  const X=r.x, Y=r.y, n=r.n, vs=run.slice(); vs.push((run[run.length-1]+1)%n);
  g.fillStyle='rgba(255,236,210,.16)'; g.beginPath(); g.moveTo(vx(vs[0],0),vy(vs[0],0)); for(let k=1;k<vs.length;k++) g.lineTo(vx(vs[k],0),vy(vs[k],0)); for(let k=vs.length-1;k>=0;k--) g.lineTo(vx(vs[k],1),vy(vs[k],1)); g.closePath(); g.fill();
  g.strokeStyle='rgba(0,0,0,.34)'; g.lineWidth=1.6; g.beginPath();
  for(const i of run){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]); if(((i*7)%3)!==0||L<4) continue; const t=0.5; g.moveTo(lerp(vx(i,0.12),vx(q,0.12),t),lerp(vy(i,0.12),vy(q,0.12),t)); g.lineTo(lerp(vx(i,0.96),vx(q,0.96),t),lerp(vy(i,0.96),vy(q,0.96),t)); }
  g.stroke();
  g.fillStyle=P.S.lip; for(const i of run){ if(((i*5)%2)!==0) continue; const q=(i+1)%n, x=(X[i]+X[q])/2, y=(Y[i]+Y[q])/2+2.5; g.beginPath(); g.ellipse(x,y,3.4,1.8,0,0,TAU); g.fill(); }
}
// stairs, ramps and ladders, over the face they cut through
function elvPaintRamp(g,E,rp){
  if(LOOK.re) return reElvRamp(g,E,rp);
  const P=elvOwnerAt(E,(rp.ax0+rp.ax1)/2,rp.dir==='n'?rp.ay0-6:rp.dir==='s'?rp.ay1+6:(rp.ay0+rp.ay1)/2,rp)||E.plats[0], S=rp.look?Object.assign({},P.S,rp.look):P.S;
  const x0=rp.ax0, x1=rp.ax1, y0=rp.ay0, y1=rp.ay1, W=x1-x0, Hh=y1-y0, vert=rp.dir==='n'||rp.dir==='s';
  g.save(); g.lineJoin='round'; g.lineCap='round';
  if(rp.kind==='ladder'){
    const rx=[x0+W*0.22,x1-W*0.22];
    g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=5; g.beginPath(); for(const x of rx){ g.moveTo(x+2,y0); g.lineTo(x+2,y1+2); } g.stroke();
    g.strokeStyle='#3a2410'; g.lineWidth=4.4; g.beginPath(); for(const x of rx){ g.moveTo(x,y0-2); g.lineTo(x,y1); } for(let y=y0+5;y<y1-2;y+=9){ g.moveTo(rx[0],y); g.lineTo(rx[1],y); } g.stroke();
    g.strokeStyle='#a8763e'; g.lineWidth=2.4; g.beginPath(); for(const x of rx){ g.moveTo(x,y0-2); g.lineTo(x,y1); } for(let y=y0+5;y<y1-2;y+=9){ g.moveTo(rx[0]+1,y); g.lineTo(rx[1]-1,y); } g.stroke();
    g.restore(); return;
  }
  // the cut: dark cheeks and a soft shadow at the foot
  g.fillStyle='rgba(0,0,0,.22)'; if(vert) g.fillRect(x0-4,y1-4,W+8,12); else g.fillRect(x0,y1,W,10);
  g.fillStyle=S.dark; g.fillRect(x0,y0,W,Hh);
  if(rp.kind==='ramp'){
    if(vert){ g.fillStyle=S.lit; g.fillRect(x0+5,y0,W-10,Hh); g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(x0+W*0.35,y0,W*0.3,Hh); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1; g.beginPath(); for(let y=y0+10;y<y1;y+=12){ g.moveTo(x0+8,y); g.lineTo(x1-8,y); } g.stroke(); }
    else{ g.fillStyle=S.lit; g.fillRect(x0,y0+5,W,Hh-10); g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(x0,y0+Hh*0.35,W,Hh*0.3); }
  }else{ elvPaintStairs(g,S,rp,x0,y0,x1,y1); g.restore(); return; }
  g.strokeStyle=S.out; g.lineWidth=2.2; g.strokeRect(x0+0.5,y0,W-1,Hh);
  if(vert){ g.beginPath(); g.moveTo(x0+5,y0); g.lineTo(x0+5,y1); g.moveTo(x1-5,y0); g.lineTo(x1-5,y1); g.lineWidth=1.4; g.strokeStyle='rgba(0,0,0,.35)'; g.stroke(); }
  g.restore();
}
// stairs cut into a face: real steps (a lit tread and a shaded riser each), lighter toward the high end, stone cheek
// walls with lit caps down both sides, a bright lip where they meet the top and a shadow at the foot. Climbing north the
// risers face you; climbing south only the treads show; climbing east or west the flight's south side shows its steps.
function elvPaintStairs(g,S,rp,x0,y0,x1,y1){
  const W=x1-x0, H=y1-y0, d=rp.dir, vert=d==='n'||d==='s', L=vert?H:W, n=Math.max(3,Math.round(L/(vert?12:16))), p=L/n;
  const cw=Math.max(5,Math.min(11,Math.round((vert?W:H)*0.09)));
  const tr=u=>stC(stC(S.face,S.lit,0.75),'#fff4dc',0.04+0.32*u), rs=u=>stC(S.dark,S.face,0.2+0.6*u);
  g.fillStyle=S.dark; g.fillRect(x0,y0,W,H);
  if(vert){
    const sx0=x0+cw, sx1=x1-cw, sw=sx1-sx0;
    for(let i=0;i<n;i++){ const u=n>1?i/(n-1):1;
      if(d==='n'){ const a=y1-(i+1)*p, th=p*0.56;
        g.fillStyle=tr(u); g.fillRect(sx0,a,sw,th+0.5); g.fillStyle=rs(u); g.fillRect(sx0,a+th,sw,p-th+0.5);
        g.fillStyle=`rgba(255,250,236,${0.25+0.35*u})`; g.fillRect(sx0,a+th-1.5,sw,1.5); g.fillStyle='rgba(0,0,0,.32)'; g.fillRect(sx0,a+th,sw,1.6);
      }else{ const a=y0+i*p;
        g.fillStyle=tr(u); g.fillRect(sx0,a,sw,p+0.5); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(sx0,a,sw,1.8); g.fillStyle=`rgba(255,250,236,${0.2+0.3*u})`; g.fillRect(sx0,a+1.8,sw,1.2); }
      // worn joints in each step
      g.fillStyle='rgba(0,0,0,.12)'; const jx=sx0+sw*(0.3+0.4*((i*7)%3)/2); g.fillRect(jx,(d==='n'?y1-(i+1)*p:y0+i*p)+2,1.2,p*0.5); }
    // the west cheek's shadow on the steps, then both cheeks: lit caps that brighten toward the high end
    g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(sx0,y0,4,H);
    const hy=d==='n'?y0:y1, ly=d==='n'?y1:y0;
    for(const cx of [x0,x1-cw]){ const cg=g.createLinearGradient(0,ly,0,hy); cg.addColorStop(0,stC(S.face,S.dark,0.25)); cg.addColorStop(1,stC(S.lit,S.lip,0.35)); g.fillStyle=cg; g.fillRect(cx,y0,cw,H);
      g.fillStyle='rgba(255,250,236,.3)'; g.fillRect(cx+1,y0,1.4,H); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(cx+cw-1.4,y0,1.4,H);
      g.strokeStyle='rgba(0,0,0,.22)'; g.lineWidth=1; g.beginPath(); for(let y=y0+p*0.8;y<y1-2;y+=p*1.6){ g.moveTo(cx+1,y); g.lineTo(cx+cw-1,y); } g.stroke(); }
    // the lip at the top and the shadow at the foot
    g.fillStyle=S.lip; g.fillRect(x0,hy-(d==='n'?0:2.4),W,2.4);
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x0-3,ly+(d==='n'?0:-4),W+6,4);
  }else{
    const sy0=y0+cw*0.6, sy1=y1-cw, sh=sy1-sy0, side=Math.min(H*0.45,40);
    for(let i=0;i<n;i++){ const u=n>1?i/(n-1):1, a=d==='e'?x0+i*p:x1-(i+1)*p;
      g.fillStyle=tr(u); g.fillRect(a,sy0,p+0.5,sh); g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(d==='e'?a:a+p-1.6,sy0,1.6,sh);
      g.fillStyle=`rgba(255,250,236,${0.2+0.3*u})`; g.fillRect(d==='e'?a+1.6:a+p-2.8,sy0,1.2,sh);
      // the flight's south side: a stepped face that grows toward the high end
      const fh=side*(i+1)/n; g.fillStyle=rs(u); g.fillRect(a,sy1-fh,p+0.5,fh+cw); g.fillStyle=`rgba(255,250,236,${0.25+0.3*u})`; g.fillRect(a,sy1-fh,p+0.5,1.4); }
    g.fillStyle=stC(S.lit,S.lip,0.3); g.fillRect(x0,y0,W,cw*0.6); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(x0,sy0,W,3);
    g.fillStyle=S.lip; g.fillRect(d==='e'?x1-2.4:x0,y0,2.4,H);
  }
  g.strokeStyle=S.out; g.lineWidth=2.2; g.strokeRect(x0+0.5,y0,W-1,H);
}
// the plateau a point belongs to (for colours)
function elvOwnerAt(E,x,y,rp){ const g=E.G; if(!g) return null; let best=null; for(const P of E.plats){ if(x<P.fb[0]||x>P.fb[2]||y<P.fb[1]||y>P.fb[3]) continue; if(!best||P.lvl>best.lvl){ if(elvRingsIn(P.rings,x,y)) best=P; } } if(!best&&rp){ for(const P of E.plats) if(P.lvl===rp.hi&&x>=P.fb[0]&&x<=P.fb[2]&&y>=P.fb[1]&&y<=P.fb[3]) return P; } return best; }
function elvRingsIn(R,x,y){ let c=false; for(const r of R){ for(let i=0,j=r.n-1;i<r.n;j=i++){ if((r.y[i]>y)!==(r.y[j]>y)&&x<(r.x[j]-r.x[i])*(y-r.y[i])/(r.y[j]-r.y[i])+r.x[i]) c=!c; } } return c; }
// ledges: a bright rounded lip with little drop marks, so a kid can see "I can hop down here"
function elvPaintLedge(g,E,l){
  if(LOOK.re) return reElvLedge(g,E,l);
  if(!l.segs||!l.segs.length) return;
  g.save(); g.lineCap='round'; g.lineJoin='round';
  for(const [P,r,i] of l.segs){
    const q=(i+1)%r.n, S=P.S, ix=k=>r.x[k]-r.vnx[k]*3, iy=k=>r.y[k]-r.vny[k]*3;
    g.strokeStyle=S.out; g.lineWidth=7; g.beginPath(); g.moveTo(ix(i),iy(i)); g.lineTo(ix(q),iy(q)); g.stroke();
    g.strokeStyle=S.lip; g.lineWidth=4.4; g.beginPath(); g.moveTo(ix(i),iy(i)); g.lineTo(ix(q),iy(q)); g.stroke();
    const mx=(r.x[i]+r.x[q])/2+r.bxv[i]*0.3, my=(r.y[i]+r.y[q])/2+r.byv[i]*0.42;
    if(((i*5)%3)===0&&r.byv[i]>12){ g.strokeStyle='rgba(255,240,210,.55)'; g.lineWidth=2; g.beginPath(); g.moveTo(mx-4,my-3); g.lineTo(mx,my+1); g.lineTo(mx+4,my-3); g.stroke(); }
  }
  g.restore();
}
// water or lava pouring down a face
function elvPaintFall(g,f){
  if(LOOK.re) return reElvFall(g,f);
  const x=f.x, w=f.w, y0=f.y0-4, y1=f.y1, lava=f.kind==='lava', h=y1-y0;
  g.save();
  const col=lava?['#ff7a1e','#ffd36a','#b8320c','#fff2b8']:['#4aa8d8','#bfeaff','#2a6a9a','#ffffff'];
  g.fillStyle=col[2]; g.beginPath(); g.moveTo(x-w/2-2,y0); g.quadraticCurveTo(x-w/2-4,y0+h*0.6,x-w/2-6,y1+4); g.lineTo(x+w/2+6,y1+4); g.quadraticCurveTo(x+w/2+4,y0+h*0.6,x+w/2+2,y0); g.closePath(); g.fill();
  g.fillStyle=col[0]; g.beginPath(); g.moveTo(x-w/2,y0); g.quadraticCurveTo(x-w/2-1,y0+h*0.6,x-w/2-3,y1+2); g.lineTo(x+w/2+3,y1+2); g.quadraticCurveTo(x+w/2+1,y0+h*0.6,x+w/2,y0); g.closePath(); g.fill();
  g.strokeStyle=col[1]; g.lineWidth=2.2; g.lineCap='round'; g.beginPath(); for(let k=0;k<4;k++){ const xx=x-w*0.32+k*w*0.21; g.moveTo(xx,y0+3+k*3); g.lineTo(xx+Math.sin(k)*2,y1-4); } g.stroke();
  g.fillStyle=col[3]; g.globalAlpha=0.85; g.beginPath(); g.ellipse(x,y1+3,w*0.75,6,0,0,TAU); g.fill(); g.globalAlpha=1;
  g.strokeStyle=lava?'#3a1004':'#1a3448'; g.lineWidth=2; g.beginPath(); g.moveTo(x-w/2-2,y0); g.quadraticCurveTo(x-w/2-4,y0+h*0.6,x-w/2-6,y1+4); g.moveTo(x+w/2+2,y0); g.quadraticCurveTo(x+w/2+4,y0+h*0.6,x+w/2+6,y1+4); g.stroke();
  g.restore();
}
// a trail: a dark edge, a lighter gravel bed with a worn middle, and flat stepping stones
function elvPaintPath(g,p,x0,y0,x1,y1){
  if(LOOK.re) return reElvPath(g,p,x0,y0,x1,y1);
  if(p.bb[2]<x0||p.bb[0]>x1||p.bb[3]<y0||p.bb[1]>y1) return;
  const pts=p.pts, w=p.w, C=p.look||{};
  g.save(); g.lineCap='round'; g.lineJoin='round';
  const line=()=>{ g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) g.lineTo(pts[i][0],pts[i][1]); };
  line(); g.strokeStyle=C.edge||'rgba(30,20,16,.30)'; g.lineWidth=w+8; g.stroke();
  line(); g.strokeStyle=C.bed||'rgba(150,124,104,.55)'; g.lineWidth=w; g.stroke();
  line(); g.strokeStyle=C.mid||'rgba(186,160,136,.35)'; g.lineWidth=w*0.5; g.stroke();
  const rng=mulberry32(Math.floor(pts[0][0]*3+pts[0][1]*7));
  for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.floor(L/26); for(let k=0;k<n;k++){ const t=(k+0.5)/n, x=lerp(a[0],b[0],t)+(rng()-0.5)*w*0.55, y=lerp(a[1],b[1],t)+(rng()-0.5)*w*0.4, r=4+rng()*4; if(x<x0-20||x>x1+20||y<y0-20||y>y1+20) continue; g.fillStyle=C.stone||'#b6a08c'; g.beginPath(); g.ellipse(x,y,r,r*0.7,0,0,TAU); g.fill(); g.strokeStyle=C.out||'#2a1c18'; g.lineWidth=1.4; g.stroke(); } }
  g.restore();
}
// the ground mark under a vent: a ring of rock round glowing cracks
function elvPaintVent(g,v){
  if(LOOK.re) return reElvVent(g,v);
  const R=Math.min(46,v.r*0.55), rng=mulberry32(v.i*913+77);
  g.save(); g.lineCap='round';
  g.fillStyle='rgba(0,0,0,.30)'; g.beginPath(); g.ellipse(v.x,v.y+3,R+10,(R+10)*0.62,0,0,TAU); g.fill();
  g.fillStyle='#2a1c18'; g.beginPath(); g.ellipse(v.x,v.y,R,R*0.6,0,0,TAU); g.fill();
  g.fillStyle='#ff9a3a'; g.beginPath(); g.ellipse(v.x,v.y,R*0.55,R*0.32,0,0,TAU); g.fill();
  g.fillStyle='#ffe08a'; g.beginPath(); g.ellipse(v.x,v.y,R*0.25,R*0.14,0,0,TAU); g.fill();
  g.strokeStyle='#ff8a2a'; g.lineWidth=2; g.beginPath(); for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.4, r0=R*0.5, r1=R*(0.9+rng()*0.3); g.moveTo(v.x+Math.cos(a)*r0,v.y+Math.sin(a)*r0*0.6); g.lineTo(v.x+Math.cos(a+0.15)*r1,v.y+Math.sin(a+0.15)*r1*0.6); } g.stroke();
  for(let i=0;i<9;i++){ const a=i/9*TAU+rng()*0.3, rr=R*(1.02+rng()*0.12), x=v.x+Math.cos(a)*rr, y=v.y+Math.sin(a)*rr*0.6; g.fillStyle='#4a3a34'; g.beginPath(); g.ellipse(x,y,5+rng()*4,3.5+rng()*2,0,0,TAU); g.fill(); g.strokeStyle='#140e0c'; g.lineWidth=1.6; g.stroke(); }
  g.strokeStyle='#140e0c'; g.lineWidth=2.2; g.beginPath(); g.ellipse(v.x,v.y,R,R*0.6,0,0,TAU); g.stroke();
  g.restore();
}
// paint every cliff, ramp, ledge, fall, vent and deco that touches a chunk (lower levels first)
function elvPaintChunk(ch,cx,cy){
  const x0=cx*CH, y0=cy*CH, x1=x0+CH, y1=y0+CH, E=ELV.maps[mapAt(y0+CH/2)];
  if(!E) return; if(E.dirty) elvBuild(E); const gd=E.G;
  const decos=ELV.deco.filter(d=>(d.k||0)===E.k&&d.bb[0]<x1+20&&d.bb[2]>x0-20&&d.bb[1]<y1+20&&d.bb[3]>y0-20);
  if(!gd&&!decos.length) return;
  if(gd&&(x0>gd.x0+gd.w*gd.cs||x1<gd.x0||y0>gd.y0+gd.h*gd.cs||y1<gd.y0)&&!decos.length) return;
  const g=ch.g, m=40, items=[];
  for(const P of E.plats) if(P.fb&&P.fb[0]<x1+m&&P.fb[2]>x0-m&&P.fb[1]<y1+m&&P.fb[3]>y0-m) items.push([P.lvl,0,P.i,()=>elvPaintPlat(g,P,x0-m,y0-m,x1+m,y1+m)]);
  for(const rp of E.ramps) if(rp.ax0!=null&&rp.ax0<x1+20&&rp.ax1>x0-20&&rp.ay0<y1+20&&rp.ay1>y0-20) items.push([rp.hi+(rp.kind==='stairs'?0.15:0),1,rp.i,()=>elvPaintRamp(g,E,rp)]);   // stairs after the trails on their level, so no path is painted over the steps
  for(const l of E.ledges) if(l.x0<x1+40&&l.x1>x0-40&&l.y0<y1+60&&l.y1>y0-60) items.push([99,2,0,()=>elvPaintLedge(g,E,l)]);
  for(const f of E.falls) if(f.bb&&f.bb[0]<x1&&f.bb[2]>x0&&f.bb[1]<y1&&f.bb[3]>y0) items.push([f.lvl,3,0,()=>elvPaintFall(g,f)]);
  for(const v of E.vents) if(v.x+80>x0&&v.x-80<x1&&v.y+60>y0&&v.y-60<y1) items.push([v.lvl||0,4,v.i,()=>elvPaintVent(g,v)]);
  for(const p of E.paths) if(p.bb[0]<x1&&p.bb[2]>x0&&p.bb[1]<y1&&p.bb[3]>y0) items.push([(p.lvl||0)+0.1,0,p.i,()=>elvPaintPath(g,p,x0,y0,x1,y1)]);
  for(const d of decos) items.push([d.lvl!=null?d.lvl:99,d.order!=null?d.order:5,0,LOOK.re?()=>reDeco(d,g,x0,y0,x1,y1,ch):()=>d.paint(g,x0,y0,x1,y1,ch)]);
  if(!items.length) return;
  items.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
  g.save(); g.beginPath(); g.rect(x0-1,y0-1,CH+2,CH+2); g.clip();
  for(const it of items){ try{ it[3](); }catch(e){ if(!ELV.err){ ELV.err=1; console.error('elev paint',e); } } }
  g.restore();
  // lava falls and vents glow in the chunk's glow layer
  const glows=E.falls.filter(f=>f.kind==='lava'&&f.bb&&f.bb[0]<x1&&f.bb[2]>x0&&f.bb[1]<y1&&f.bb[3]>y0), vg=E.vents.filter(v=>v.x+80>x0&&v.x-80<x1&&v.y+60>y0&&v.y-60<y1);
  if(glows.length||vg.length){
    if(!ch.glow) ch.glow=mkCanvas(CPX/4,CPX/4);
    const q=(CPX/4)/CH, gl=ch.glow.getContext('2d'); gl.save(); gl.setTransform(q,0,0,q,-x0*q,-y0*q);
    for(const f of glows){ const gr=gl.createLinearGradient(f.x-f.w*1.4,0,f.x+f.w*1.4,0); gr.addColorStop(0,'rgba(255,120,30,0)'); gr.addColorStop(0.5,'rgba(255,140,40,.85)'); gr.addColorStop(1,'rgba(255,120,30,0)'); gl.fillStyle=gr; gl.fillRect(f.x-f.w*1.4,f.y0-10,f.w*2.8,f.y1-f.y0+30); }
    for(const v of vg){ const gr=gl.createRadialGradient(v.x,v.y,0,v.x,v.y,60); gr.addColorStop(0,'rgba(255,150,60,.85)'); gr.addColorStop(1,'rgba(255,120,40,0)'); gl.fillStyle=gr; gl.fillRect(v.x-60,v.y-60,120,120); }
    gl.restore();
  }
}
{ const base=genChunk; genChunk=function(cx,cy){ const ch=base(cx,cy); const t0=performance.now(); try{ elvPaintChunk(ch,cx,cy); }catch(e){ console.error('elev chunk',e); } const st=ELV.pstat||(ELV.pstat={n:0,ms:0,max:0}), d=performance.now()-t0; if(d>0.2){ st.n++; st.ms+=d; st.max=Math.max(st.max,d); } return ch; }; }

// ---------- live art: vents breathe hot air, falls splash, and the debug grid
function elvLiveE(){ if(!G||AREA||!player) return null; const E=ELV.maps[curMap()]; if(!E) return null; if(E.dirty) elvBuild(E); return E; }
// depth mode: like the Wall, a cliff further up the screen leans away and shows a taller face (its lip rises a little)
function elvDepthLean(E){
  if(LOOK.re) return reElvLean(E);
  if(typeof DV==='undefined'||!DV.on||!E.G) return;
  const vx0=cam.x-80, vy0=cam.y-80, vx1=cam.x+W/zoom+80, vy1=cam.y+H/zoom+80, K=DV.k*DV.vf*3;
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  for(const P of E.plats){
    if(!P.fb||P.fb[0]>vx1||P.fb[2]<vx0||P.fb[1]>vy1||P.fb[3]<vy0) continue;
    const S=P.S;
    for(const r of P.rings){
      const n=r.n, X=r.x, Y=r.y, Hh=r.H, FR=r.front, SB=r.sbb;
      let s0=0; for(let i=0;i<n;i++) if(!FR[i]){ s0=i; break; }
      const runs=[]; let cur=null;
      for(let t=1;t<=n;t++){ const i=(s0+t)%n; const on=FR[i]&&!(r.noLean&&r.noLean[i])&&SB[i*4]<vx1&&SB[i*4+2]>vx0&&SB[i*4+1]<vy1&&SB[i*4+3]>vy0&&Y[i]<DV.cy; if(on){ if(!cur){ cur=[i]; runs.push(cur); } else cur.push(i); } else cur=null; }
      for(const run of runs){
        const vs=run.slice(); vs.push((run[run.length-1]+1)%n);
        const ex=vs.map(i=>clamp((DV.cy-Y[i])*Hh[i]*K,0,Hh[i]*0.3));
        if(Math.max(...ex)<1.2) continue;
        ctx.fillStyle=S.lit; ctx.beginPath(); ctx.moveTo(X[vs[0]],Y[vs[0]]+1); for(let k=0;k<vs.length;k++) ctx.lineTo(X[vs[k]],Y[vs[k]]-ex[k]); for(let k=vs.length-1;k>=0;k--) ctx.lineTo(X[vs[k]],Y[vs[k]]+1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle=S.out; ctx.lineWidth=2.6; ctx.beginPath(); for(let k=0;k<vs.length;k++){ const x=X[vs[k]], y=Y[vs[k]]-ex[k]; k?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke();
        ctx.strokeStyle=S.lip; ctx.lineWidth=2.4; ctx.beginPath(); for(let k=0;k<vs.length;k++){ const i=vs[k], x=X[i]-r.vnx[i]*2.6, y=Y[i]-ex[k]-r.vny[i]*2.6; k?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke();
      }
    }
  }
  ctx.restore();
}
{ const base=drawHazards; drawHazards=function(){
  const E=elvLiveE();
  if(E) try{ elvDepthLean(E); }catch(e){}
  base();
  if(!E) return;
  const t=G.time;
  for(const v of E.vents){
    if(!inView(v.x,v.y,v.r+120)) continue;
    ctx.save(); ctx.lineCap='round';
    const R=v.r;
    // the updraft column: soft rings rising and fading, curls of hot air
    for(let k=0;k<4;k++){ const ph=(t*0.7+k/4)%1, y=v.y-ph*140, a=(1-ph)*0.32; ctx.strokeStyle=`rgba(255,${200-ph*60|0},${140-ph*80|0},${a})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(v.x+Math.sin(t*2+k)*6,y,R*(0.35+ph*0.45),R*(0.35+ph*0.45)*0.42,0,0,TAU); ctx.stroke(); }
    ctx.strokeStyle='rgba(255,236,200,.28)'; ctx.lineWidth=2;
    for(let k=0;k<5;k++){ const ph=(t*0.9+k*0.2)%1, x=v.x+(k-2)*R*0.18, y0=v.y-ph*30, y1=y0-50-ph*40; ctx.globalAlpha=Math.sin(ph*Math.PI); ctx.beginPath(); ctx.moveTo(x,y0); ctx.bezierCurveTo(x+8,y0-18,x-8,y1+18,x+Math.sin(t*3+k)*5,y1); ctx.stroke(); }
    ctx.globalAlpha=1;
    // the edge of the updraft, so a kid can see how far it reaches
    ctx.setLineDash([6,8]); ctx.lineDashOffset=-t*20; ctx.strokeStyle='rgba(255,210,150,.22)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(v.x,v.y,R,R*0.6,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  for(const f of E.falls){ if(!f.bb||!inView(f.x,(f.y0+f.y1)/2,120)) continue; const lava=f.kind==='lava'; ctx.save(); ctx.globalAlpha=0.55; ctx.strokeStyle=lava?'rgba(255,240,170,.9)':'rgba(255,255,255,.9)'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); for(let k=0;k<3;k++){ const ph=(t*(lava?0.9:1.8)+k/3)%1, y=lerp(f.y0,f.y1,ph), x=f.x-f.w*0.3+k*f.w*0.3; ctx.moveTo(x,y); ctx.lineTo(x,Math.min(f.y1,y+10)); } ctx.stroke(); ctx.restore(); }
  if(ELV.debug) elvDebugDraw(E);
}; }
{ const base=ambientEmit; ambientEmit=function(dt){
  base(dt);
  const E=elvLiveE(); if(!E) return;
  for(const v of E.vents){ if(!inView(v.x,v.y,v.r+60)) continue; if(Math.random()<dt*9) emit(v.x+rand(-v.r,v.r)*0.4,v.y+rand(-v.r,v.r)*0.25,1,{col:'255,190,110',ang:-Math.PI/2,spread:0.25,smin:60,smax:130,lmin:.6,lmax:1.1,zmin:1.2,zmax:2.4,drag:0.4,rise:40}); if(Math.random()<dt*3) emit(v.x+rand(-12,12),v.y,1,{col:'210,190,180',glow:false,alpha:0.35,ang:-Math.PI/2,spread:0.3,smin:40,smax:90,lmin:1,lmax:1.6,zmin:5,zmax:9,grow:14,drag:0.6}); }
  for(const f of E.falls){ if(!f.bb||!inView(f.x,f.y1,80)) continue; if(Math.random()<dt*(f.kind==='lava'?5:7)) emit(f.x+rand(-f.w,f.w)*0.5,f.y1+2,1,f.kind==='lava'?{kind:'fire',ang:-Math.PI/2,spread:0.9,smin:30,smax:90,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:5,drag:2}:{col:'235,245,255',glow:false,alpha:0.5,ang:-Math.PI/2,spread:1.2,smin:20,smax:60,lmin:.5,lmax:1,zmin:3,zmax:6,grow:10,drag:1}); }
}; }
// vents and lava falls light the night
{ const base=initWorld; initWorld=function(){
  base();
  for(const E of ELV.maps){ if(!E) continue; if(E.dirty) elvBuild(E);
    for(const v of E.vents) LIGHTS.push({x:v.x,y:v.y,r:Math.max(150,v.r*2),i:0.75,fire:true});
    for(const f of E.falls) if(f.kind==='lava') LIGHTS.push({x:f.x,y:(f.y0+f.y1)/2,r:150,i:0.7,fire:true});
  }
}; }
// a translucent view of the grid (__eb.elevDebug(true)): level tints, faces, ramps, ledges, steps, climbable, vents, no-fly
function elvDebugDraw(E){
  const g=E.G; if(!g) return;
  const vx0=cam.x, vy0=cam.y, vx1=cam.x+W/zoom, vy1=cam.y+H/zoom, cs=g.cs;
  const i0=Math.max(0,Math.floor((vx0-g.x0)/cs)), i1=Math.min(g.w-1,Math.ceil((vx1-g.x0)/cs)), j0=Math.max(0,Math.floor((vy0-g.y0)/cs)), j1=Math.min(g.h-1,Math.ceil((vy1-g.y0)/cs));
  const LC=['rgba(0,0,0,0)','rgba(80,200,255,.16)','rgba(80,255,140,.16)','rgba(255,240,80,.16)','rgba(255,150,60,.18)','rgba(255,80,80,.18)','rgba(220,80,255,.18)','rgba(255,255,255,.2)','rgba(120,120,255,.22)'];
  ctx.save();
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
    const c=j*g.w+i, f=g.F[c], x=g.x0+i*cs, y=g.y0+j*cs;
    if(f&EF.RAMP) ctx.fillStyle='rgba(60,255,90,.45)';
    else if(f&EF.FACE){ ctx.fillStyle=f&EF.STEP?'rgba(0,240,255,.45)':f&EF.LEDGE?'rgba(255,230,0,.5)':f&EF.CLIMB?'rgba(200,90,255,.45)':f&EF.RIM?'rgba(255,120,0,.4)':'rgba(255,30,30,.38)'; }
    else{ const l=g.L[c]; if(!l) continue; ctx.fillStyle=LC[l]||LC[8]; }
    ctx.fillRect(x,y,cs,cs);
  }
  ctx.font='bold 11px sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign='center';
  for(let j=j0;j<=j1;j+=8) for(let i=i0;i<=i1;i+=8){ const c=j*g.w+i; if(g.F[c]&EF.FACE) continue; const l=g.L[c]; if(l) ctx.fillText(String(l),g.x0+i*cs+cs/2,g.y0+j*cs+cs); }
  ctx.lineWidth=2;
  for(const v of E.vents){ ctx.strokeStyle='rgba(255,200,80,.9)'; ctx.beginPath(); ctx.arc(v.x,v.y,v.r,0,TAU); ctx.stroke(); ctx.fillText('vent L'+v.lvl+' +'+v.lift,v.x,v.y-v.r-4); }
  for(const p of E.posts){ ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.arc(p.x,p.y,6,0,TAU); ctx.fill(); ctx.fillText('post L'+p.lvl,p.x,p.y-10); }
  ctx.strokeStyle='rgba(180,220,255,.7)'; ctx.setLineDash([10,6]);
  for(const z of E.nofly){ ctx.beginPath(); if(z.disc){ const [cx,cy,rx,ry]=z.disc; ctx.ellipse(cx,cy,rx,ry==null?rx:ry,0,0,TAU); } else if(z.rect){ const [a,b,c2,d]=z.rect; ctx.rect(a,b,c2-a,d-b); } else if(z.poly){ z.poly.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); } ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.restore();
}

// ---------- depth mode: cliffs cast long soft sun shadows on the ground below them
{ const base=drawShadowLayer; drawShadowLayer=function(g,lw,lh,ox,oy,q,ux,uy){
  base(g,lw,lh,ox,oy,q,ux,uy);
  const E=elvLiveE(); if(!E||!E.G) return;
  const x0=ox, y0=oy, x1=ox+lw/q, y1=oy+lh/q, TL=SHL.tiles, ntx=SHL.ntx, nty=SHL.nty;
  const mark=(xa,ya,xb,yb)=>{ const a=Math.max(0,Math.floor((xa-ox)/STW)), b=Math.min(ntx-1,Math.floor((xb-ox)/STW)), c=Math.max(0,Math.floor((ya-oy)/STW)), d=Math.min(nty-1,Math.floor((yb-oy)/STW)); for(let ty=c;ty<=d;ty++) for(let tx=a;tx<=b;tx++) TL[ty*ntx+tx]=1; };
  g.setTransform(q,0,0,q,-ox*q,-oy*q); g.fillStyle='#000'; g.beginPath(); let any=false;
  for(const P of E.plats){
    if(!P.fb||P.fb[0]>x1+200||P.fb[2]<x0-200||P.fb[1]>y1+200||P.fb[3]<y0-200) continue;
    for(const r of P.rings) for(let i=0;i<r.n;i++){
      if(!r.front[i]) continue; const k=(i+1)%r.n, h0=r.H[i], h1=r.H[k];
      if(h0<=0&&h1<=0) continue; if(r.snx[i]*ux+r.sny[i]*uy<=0) continue;
      const ax=r.x[i]+r.bxv[i], ay=r.y[i]+r.byv[i], bx=r.x[k]+r.bxv[k], by=r.y[k]+r.byv[k];
      if(Math.max(ax,bx)<x0-60||Math.min(ax,bx)>x1+60||Math.max(ay,by)<y0-60||Math.min(ay,by)>y1+60) continue;
      const sa=h0*0.9, sb=h1*0.9;
      g.moveTo(ax,ay-2); g.lineTo(bx,by-2); g.lineTo(bx+ux*sb,by+uy*sb); g.lineTo(ax+ux*sa,ay+uy*sa); g.closePath(); any=true;
      mark(Math.min(ax,bx,ax+ux*sa,bx+ux*sb)-6,Math.min(ay,by)-6,Math.max(ax,bx,ax+ux*sa,bx+ux*sb)+6,Math.max(ay+uy*sa,by+uy*sb)+6);
    }
  }
  if(any) g.fill();
  g.setTransform(1,0,0,1,0,0);
}; }

// ---------- overview, minimap and map screen: hillshading, so height reads on the map
{ const base=overviewStep; overviewStep=function(rows){
  const k=scene==='map'?MAPUI.view:curMap(), O=ovOf(k), r0=O.row;
  base(rows);
  const E=ELV.maps[k||0]; if(!E||!E.plats.length||!O.img||O.row<=r0) return;
  if(E.dirty) elvBuild(E); const g=E.G; if(!g) return;
  const d=O.img.data, s=O.s, y0=O.y0||0;
  let any=false;
  for(let j=r0;j<O.row;j++){
    const wy=y0+(j+0.5)*s; if(wy<g.y0||wy>g.y0+g.h*g.cs) continue;
    const rowPaths=E.paths.filter(p=>wy>=p.bb[1]&&wy<=p.bb[3]);
    for(let i=0;i<O.w;i++){
      const wx=(i+0.5)*s; if(wx<g.x0||wx>g.x0+g.w*g.cs) continue;
      if(rowPaths.length){ let on=false; for(const p of rowPaths) if(wx>=p.bb[0]&&wx<=p.bb[2]&&elvPathD(p.pts,wx,wy)<p.w*0.5+4){ on=true; break; } if(on){ const kk=(j*O.w+i)*4; d[kk]=lerp(d[kk],206,0.6); d[kk+1]=lerp(d[kk+1],178,0.6); d[kk+2]=lerp(d[kk+2],134,0.6); any=true; continue; } }
      const lv=elevLvl(wx,wy), up=elevLvl(wx,wy-s), lf=elevLvl(wx-s,wy), f=elevFace(wx,wy);
      if(!lv&&!up&&!lf) continue;
      const kk=(j*O.w+i)*4; let m=1, add=0;
      if(f&EF.FACE&&!(f&EF.RAMP)) m=0.62;
      else if(up>lv) m=0.7;            // just below a cliff: its shadow
      else if(lv>up) add=26;           // the back rim catches the light
      if(lf>lv) m*=0.88; else if(lv>lf) add+=10;
      d[kk]=clamp(d[kk]*m+add,0,255); d[kk+1]=clamp(d[kk+1]*m+add,0,255); d[kk+2]=clamp(d[kk+2]*m+add*0.8,0,255); any=true;
    }
  }
  if(any) O.g.putImageData(O.img,0,0,0,r0,O.w,O.row-r0);
}; }

// ---------- debug hooks
// tests can skip drawing for a while (__eb.elevFastSim(true)): the game still runs every system each frame
{ const base=render; render=function(){ if(ELV.fast) return; base(); }; }
window.__ebX=Object.assign(window.__ebX||{},{
  elevFastSim(on){ ELV.fast=!!on; return ELV.fast; },
  // a foe's fireball from (x,y) at angle a: where it ends after n frames (tests with the stepped clock)
  elevTestShot(x,y,a,spd,n){ shoot(x,y,a,spd||300,8,1,'fireball','enemy',{life:3}); const pr=G.projectiles[G.projectiles.length-1], lv=pr.elv; if(window.__step) window.__step(n||60); return {x:Math.round(pr.x),y:Math.round(pr.y),dead:pr.dead,elv:lv}; },
  elevLastArrow:()=>ELV.lastArrow||null,
  elevColLine(x,y0,y1){ for(let y=y0;y<=y1;y+=6) if(colAt(x,y,6)) return false; return true; },
  // what the elevation adds to a frame where Ash stands (ms), and a terrain sample on the mountain (us)
  elevBench(n){ n=n||100; const now=window.__realNow||(()=>performance.now()), E=elvLiveE(); let t0=now();
    for(let i=0;i<n;i++){ if(E) elvDepthLean(E); } const lean=(now()-t0)/n; t0=now();
    for(let i=0;i<n;i++) drawHazards(); const haz=(now()-t0)/n; t0=now();
    for(let i=0;i<n;i++) elvFlight(player,0); const fl=(now()-t0)/n;
    const o={}; t0=now(); for(let i=0;i<n*100;i++) T(5600+(i*37)%2800,300+(i*53)%2500,o); const tm=(now()-t0)/(n*100)*1000;
    t0=now(); for(let i=0;i<n*100;i++) blockedAt(5600+(i*37)%2800,300+(i*53)%2500); const bm=(now()-t0)/(n*100)*1000;
    return {lean_ms:lean,hazards_ms:haz,flight_ms:fl,T_us_mountain:tm,blocked_us_mountain:bm}; },
  ELEV, ELV,
  elev(x,y){ if(x==null&&player){ x=player.x; y=player.y; } const f=elevFace(x,y), z=elvNoFly(x,y), v=elvVentAt(x,y), r=elvRampAt(x,y); return {lvl:elevLvl(x,y),face:f,faceBits:{face:!!(f&1),climb:!!(f&2),ledge:!!(f&4),ramp:!!(f&8),step:!!(f&16)},blocked:blockedAt(x,y),noFly:z?z.why:null,vent:v?{x:v.x,y:v.y,lvl:v.lvl,lift:v.lift}:null,ramp:r?{lo:r.lo,hi:r.hi,dir:r.dir,kind:r.kind}:null}; },
  elevDebug(on){ ELV.debug=on==null?!ELV.debug:!!on; return ELV.debug; },
  elevOf:e=>elevOf(e||player), elevMoveOK, elevLvl, elevFace,
  elevInfo(k){ const E=ELV.maps[k||0]; if(!E) return null; if(E.dirty) elvBuild(E); const g=E.G; return {plats:E.plats.length,ramps:E.ramps.map(r=>({lo:r.lo,hi:r.hi,dir:r.dir,kind:r.kind,x0:r.ax0,y0:r.ay0,x1:r.ax1,y1:r.ay1})),ledges:E.ledges.length,vents:E.vents.map(v=>({x:v.x,y:v.y,lvl:v.lvl,lift:v.lift,r:v.r})),nofly:E.nofly.length,posts:E.posts.length,falls:E.falls.map(f=>({x:f.x,y0:f.y0,y1:f.y1,kind:f.kind})),grid:g?{x0:g.x0,y0:g.y0,w:g.w,h:g.h,cs:g.cs}:null}; },
  elevImage(k,scale){ const E=ELV.maps[k||0]; if(!E) return null; if(E.dirty) elvBuild(E); const g=E.G; if(!g) return null; const s=scale||1, c=mkCanvas(g.w*s,g.h*s), x=c.getContext('2d'), im=x.createImageData(g.w,g.h);
    for(let i=0;i<g.w*g.h;i++){ const f=g.F[i], l=g.L[i], k4=i*4; let col=[30+l*26,30+l*22,30+l*18]; if(f&EF.RAMP) col=[60,220,90]; else if(f&EF.FACE) col=f&EF.STEP?[0,220,240]:f&EF.LEDGE?[250,220,0]:f&EF.CLIMB?[190,90,250]:f&EF.RIM?[230,110,0]:[200,30,30]; im.data[k4]=col[0]; im.data[k4+1]=col[1]; im.data[k4+2]=col[2]; im.data[k4+3]=255; }
    const t=mkCanvas(g.w,g.h); t.getContext('2d').putImageData(im,0,0); x.imageSmoothingEnabled=false; x.drawImage(t,0,0,g.w*s,g.h*s);
    x.strokeStyle='#fff'; x.lineWidth=1; for(const v of E.vents){ x.beginPath(); x.arc((v.x-g.x0)/g.cs*s,(v.y-g.y0)/g.cs*s,v.r/g.cs*s,0,TAU); x.stroke(); }
    return c.toDataURL('image/png'); }
});
