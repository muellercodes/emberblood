// ================= (v12 wave 11) ART23: the Realistic look for Acts II and III outdoors, cliffs and bridges on every
// map, and the prop kinds of maps 1 and 2 that were only relit. Only LOOK.re reaches anything here (Storybook and
// Classic never do): the older files call in through small `if(LOOK.re)` hooks. Everything static is painted once
// into cached canvases (keyed by LOOK.gen) or into the ground chunks, lit from the fixed art light of e12c_props.js
// (upper left, soft, slightly warm); LIGHT (e12_light.js) adds the sun, the shadows and the night on top.

// ---------- 0. painting prop kinds without a hitch
// A Realistic map kind (e12c_props.js rzKindSprites) used to paint all its variants the first time a prop of it was
// drawn (20 to 75 ms here). Now the first variant is painted then and the rest in idle time (props pick up their own
// variant when the kind completes), and the props planner (a2c_build.js) asks for a kind as soon as it builds a chunk
// that holds one, about a screen ahead of Ash, so it is usually painted before it shows.
{ const base=rzKindBuild; rzKindBuild=function(kind,d){
  if(!LOOK.re) return base(kind,d);
  const K=RZK[kind], n=K&&K.make?Math.max(d.n,K.n||0):d.n; if(n<2) return base(kind,d);
  const c0=rzKindOne(kind,d,0); if(!c0) return base(kind,d);
  const all=[c0], gen=LOOK.gen;
  for(let v=1;v<n;v++) RZQ.q.unshift(()=>{ if(gen!==LOOK.gen) return; const c=rzKindOne(kind,d,v); if(c) all.push(c); if(v===n-1){ SPR[kind]=all.slice(); rzRepick(kind); } });
  RZQ.gen=LOOK.gen; rzPumpLater();
  return [c0];
}; }
propsSoon=function(k){
  if(!LOOK.re||RE0.soon.has(k)) return; RE0.soon.add(k);
  RZQ.q.unshift(()=>{ RE0.soon.delete(k); const d=Object.getOwnPropertyDescriptor(SPR,k); if(d&&d.get) void SPR[k]; });
  RZQ.gen=LOOK.gen; rzPumpLater();
};
const RE0={soon:new Set()};

// ---------- 1. cliffs on every map (e3_elev.js: elvPaintPlat, elvPaintRamp, elvPaintLedge, elvPaintFall, elvPaintPath,
// elvPaintVent and elvDepthLean hand over here). A face is layered rock lit from above: a lit band under the lip, darker
// toward the foot, the material's grain (a tile laid on with soft light, anchored to the world so chunk seams line
// up), strata that follow the edge, cracks with a lit side, scree at the foot, then the lip: grass hanging over it,
// snow with blue shade and icicles, a sand rim, coping stones on town walls or a lit rock edge. No bold outlines: the
// lip's light, the darker face and the soft shadow at its foot say "wall"; stairs keep bright treads and dark risers.
const reRGB=c=>`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`, reRGBA=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const reK=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
// a little greyer, and very bright values pulled down (Storybook's chalk white reads as lit chalk, not paper)
function reNat(c,k){ const l=c[0]*0.3+c[1]*0.59+c[2]*0.11, q=k==null?0.14:k; let r=[c[0]+(l-c[0])*q,c[1]+(l-c[1])*q,c[2]+(l-c[2])*q]; const m=Math.max(r[0],r[1],r[2]); if(m>214){ const s=(214+(m-214)*0.35)/m; r=r.map(v=>v*s); } return r; }
// the material of a plateau by its style (any other style by its texture)
const RE_ELM={rock:'rock',a1_crag:'rock',f_red:'rock',f_wind:'rock',f_stone:'rock',f_moor:'rock',f_snow:'rock',c_black:'obsid',
  chalk:'chalk',f_isle:'chalk',m_marble:'chalk',m_light:'chalk',n_chalk:'chalk',c_roof:'mason',c_clock:'mason',c_terrace:'mason',c_brass:'brick',
  ice:'ice',n_ice:'ice',obsidian:'obsid',f_dread:'obsid',n_obsid:'obsid',m_heights:'obsid',sand:'sand',m_dune:'sand',basalt:'basalt',cinder:'basalt',
  glass:'glass',m_mesa:'glass',m_dais:'glass',n_glass:'glass',n_summit:'glass',grass:'earth',m_trunk:'earth',m_shell:'earth',f_wood:'wood',m_wood:'wood',f_slate:'slate'};
const RE_TEXM={crack:'rock',layers:'chalk',streak:'ice',facet:'obsid',wave:'sand',columns:'basalt',shine:'glass',roots:'earth'};
const RE_STRATA={rock:1,chalk:1,sand:1,slate:1,ice:0.28,earth:0.4,glass:0.3};
function reElvM(P){
  if(P.reM&&P.reM.gen===LOOK.gen) return P.reM;
  const S=P.S, mat=RE_ELM[P.style]||RE_TEXM[S.tex]||'rock', H=elvRGB, q={ice:0.04,glass:0.04,obsid:0.06,chalk:0.08,basalt:0.5}[mat];
  const face=reNat(H(S.face),q), lit=reNat(H(S.lit),q), dark=reNat(H(S.dark),q), lip=reNat(H(S.lip),0.08);
  return P.reM={gen:LOOK.gen,mat,face,lit,dark,lip,deep:reK(dark,0.72)};
}
// what lies on top of a face (grass hangs over, snow drifts, a sand rim, coping stones, a plain rock edge): from the
// ground material under the top, sampled a little inside the edge
function reLipOf(P,M,x,y){
  if(M.mat==='mason'||M.mat==='brick') return {k:'cope'};
  if(M.mat==='wood') return {k:'plank'};
  const s=T(x,y,{}), b=s.b, m=typeof reMatOf==='function'&&typeof reB==='function'?reMatOf(b,s):-1, B=typeof reB==='function'?reB(b):null;
  if(m===RM.SNOW||m===RM.ICE||P.style==='f_snow') return {k:'snow'};
  if(m===RM.GRASS||m===RM.FOREST||m===RM.MARSH||M.mat==='earth') return {k:'grass',c:B?B.col:[[96,124,58],[120,140,70],[70,94,42]]};
  if(m===RM.SAND) return {k:'sand',c:B?B.col:[[208,190,150],[222,206,168],[184,164,124]]};
  return {k:'rock'};
}
// grain tiles (grey, 128 means no change, laid on with soft light): 128 world px square at the chunk's resolution
function reTile(kind){ return rzCache('elvtile:'+kind,()=>{
  const S=Math.round(128*RES), c=mkCanvas(S,S), g=c.getContext('2d'), im=g.createImageData(S,S), d=im.data, sd={mass:7,rock:11,chalk:23,mason:31,brick:37,ice:41,obsid:47,sand:53,basalt:59,glass:61,earth:67,wood:71,slate:73}[kind]||5;
  const k=128/S, P=(x,y,f,o)=>rzFbm(x*f,y*f,sd+o,3);
  // tiling noise: blend four offset samples so the tile wraps
  const wrap=(x,y,f,o)=>{ const u=x/128, v=y/128; return P(x,y,f,o)*(1-u)*(1-v)+P(x-128,y,f,o)*u*(1-v)+P(x,y-128,f,o)*(1-u)*v+P(x-128,y-128,f,o)*u*v; };
  for(let j=0;j<S;j++) for(let i=0;i<S;i++){ const x=i*k, y=j*k; let v=128;
    if(kind==='rock'){ v+=(wrap(x,y,0.06,0)-0.5)*90+(wrap(x,y,0.3,3)-0.5)*40; if(rzHash(i,j,sd)>0.985) v-=40; if(rzHash(i,j,sd+1)>0.99) v+=34; }
    else if(kind==='chalk'){ v+=(wrap(x,y,0.05,0)-0.5)*40+(wrap(x,y,0.4,3)-0.5)*16; }
    else if(kind==='mason'||kind==='brick'){ const bh=kind==='brick'?5:11, row=Math.floor(y/bh), bw=kind==='brick'?11:18+((row*7)%3)*5, off=(row%2)*bw*0.5, bx=((x+off)%bw+bw)%bw, by=y-row*bh;
      v+=(wrap(x,y,0.08,0)-0.5)*34+(rzHash(Math.floor((x+off)/bw),row,sd)-0.5)*30; if(by<1.1||bx<1.1) v=70+(wrap(x,y,0.5,5)-0.5)*20; else if(by<2.2) v+=22; else if(by>bh-1.6) v-=14; }
    else if(kind==='ice'){ v+=(wrap(x*0.3,y,0.05,0)-0.5)*70+(wrap(x,y,0.25,3)-0.5)*20; if(rzHash(i,j,sd)>0.992) v+=60; }
    else if(kind==='obsid'){ // glassy facets: each cell of a jittered grid one flat shade, a bright edge on its lit side
      let b1=1e9,b2=1e9,cid=0; const gx=Math.floor(x/32), gy=Math.floor(y/32); for(let a2=-1;a2<=1;a2++) for(let b3=-1;b3<=1;b3++){ const cx=((gx+a2)%4+4)%4, cy=((gy+b3)%4+4)%4, px=(gx+a2)*32+rzHash(cx,cy,sd)*32, py=(gy+b3)*32+rzHash(cx,cy,sd+1)*32, dd=(x-px)*(x-px)*1.6+(y-py)*(y-py)*0.35; if(dd<b1){ b2=b1; b1=dd; cid=cx*13+cy; } else if(dd<b2) b2=dd; }
      v+=(rzHash(cid,0,sd+2)-0.5)*60+(wrap(x,y,0.2,4)-0.5)*14; const e=Math.sqrt(b2)-Math.sqrt(b1); if(e<1.4) v+=rzHash(cid,1,sd)>0.6?60:-26; }
    else if(kind==='mass'){ v+=(wrap(x,y*0.55,0.03,0)-0.5)*120+(wrap(x,y,0.07,2)-0.5)*40; }
    else if(kind==='sand'){ v+=(Math.sin(y*0.55+wrap(x,y,0.03,0)*9)*0.5)*26+(rzHash(i,j,sd)-0.5)*26; }
    else if(kind==='basalt'){ const cw=10, col=Math.floor(x/cw), cx=x-col*cw; v+=(rzHash(col,0,sd)-0.5)*40+(wrap(x,y,0.12,0)-0.5)*24; if(cx<1.2) v=60; else if(cx<2.6) v+=30; else if(cx>cw-1.6) v-=20; if(rzHash(col,Math.floor(y/14),sd+2)>0.86&&(y%14)<1.2) v-=50; }
    else if(kind==='glass'){ v+=(wrap(x,y,0.03,0)-0.5)*40+((x+y*0.6)%46<3?40:0); }
    else if(kind==='earth'){ v+=(wrap(x,y,0.08,0)-0.5)*70+(wrap(x,y,0.5,3)-0.5)*24; if(rzHash(Math.floor(x/5),Math.floor(y/5),sd)>0.93) v+=40; }
    else if(kind==='wood'){ const pw=9, col=Math.floor(x/pw), cx=x-col*pw; v+=(wrap(x*3,y*0.25,0.05,0)-0.5)*50+(rzHash(col,0,sd)-0.5)*30; if(cx<1.1) v=58; else if(cx<2.2) v+=20; }
    else if(kind==='slate'){ v+=Math.sin(y*1.6+wrap(x,y,0.04,0)*6)*20+(wrap(x,y,0.2,0)-0.5)*36; }
    const id=(j*S+i)*4; d[id]=d[id+1]=d[id+2]=v<0?0:v>255?255:v; d[id+3]=255; }
  g.putImageData(im,0,0); return c; }); }
function rePat(kind){ return rzCache('elvpat:'+kind,()=>{ const p=ctx.createPattern(reTile(kind),'repeat'); try{ p.setTransform(new DOMMatrix().scale(1/RES)); }catch(e){} return p; }); }
// the soft-light grain over the path already set on g (a face, a step, a wall)
function reGrain(g,kind,a,bb,op){ g.save(); g.clip(); g.globalCompositeOperation=op||'soft-light'; g.globalAlpha=a; g.fillStyle=rePat(kind); g.fillRect(bb[0]-2,bb[1]-2,bb[2]-bb[0]+4,bb[3]-bb[1]+4); g.restore(); }
// the face's colour from its lip (f 0) to its foot (f 1)
function reFaceCol(M,f){ return f<0.12?rzMix(rzMix(M.lit,M.face,0.15),M.face,f/0.12):f<0.55?rzMix(M.face,reK(M.face,0.88),(f-0.12)/0.43):rzMix(reK(M.face,0.88),reK(M.dark,0.8),(f-0.55)/0.45); }
function reElvPlat(g,P,rx0,ry0,rx1,ry1){
  const M=reElvM(P), mat=M.mat, seed=P.seed|0;
  g.save(); g.lineJoin='round'; g.lineCap='round';
  for(const r of P.rings){
    const n=r.n, X=r.x, Y=r.y, BX=r.bxv, BY=r.byv, FR=r.front, SB=r.sbb;
    const on=i=>SB[i*4]<rx1&&SB[i*4+2]>rx0&&SB[i*4+1]<ry1&&SB[i*4+3]>ry0;
    let s0=0; for(let i=0;i<n;i++) if(!FR[i]){ s0=i; break; }
    const runs=[]; let cur=null;
    for(let t=1;t<=n;t++){ const i=(s0+t)%n; if(FR[i]&&on(i)){ if(!cur){ cur=[i]; runs.push(cur); } else cur.push(i); } else cur=null; }
    const vx=(i,f)=>X[i]+BX[i]*f, vy=(i,f)=>Y[i]+BY[i]*f;
    for(const run of runs){
      const vs=run.slice(); vs.push((run[run.length-1]+1)%n);
      const path=(f0,f1)=>{ g.beginPath(); g.moveTo(vx(vs[0],f0),vy(vs[0],f0)); for(let k=1;k<vs.length;k++) g.lineTo(vx(vs[k],f0),vy(vs[k],f0)); for(let k=vs.length-1;k>=0;k--) g.lineTo(vx(vs[k],f1),vy(vs[k],f1)); g.closePath(); };
      const line=(f,dy)=>{ g.beginPath(); for(let k=0;k<vs.length;k++){ const x=vx(vs[k],f), y=vy(vs[k],f)+(dy||0); k?g.lineTo(x,y):g.moveTo(x,y); } };
      let bb=[1e9,1e9,-1e9,-1e9]; for(const i of vs){ bb[0]=Math.min(bb[0],X[i],vx(i,1)); bb[2]=Math.max(bb[2],X[i],vx(i,1)); bb[1]=Math.min(bb[1],Y[i]); bb[3]=Math.max(bb[3],vy(i,1)); }
      // the ground darkens under the foot of the face (sky light is cut off), soft and cool
      for(const [lw,a,oy] of [[34,0.07,12],[18,0.1,6],[8,0.16,2.5]]){ g.strokeStyle=`rgba(10,14,26,${a})`; g.lineWidth=lw; line(1,oy); g.stroke(); }
      // the face in bands that follow the edge, then the material's grain
      const NB=12; for(let b=0;b<NB;b++){ const f0=b/NB, f1=(b+1)/NB; g.fillStyle=reRGB(reFaceCol(M,(f0+f1)/2)); path(f0,f1+0.004); g.fill(); }
      path(0,1); reGrain(g,mat,mat==='ice'||mat==='glass'?0.6:1,bb,mat==='chalk'||mat==='mason'?'overlay':null);
      // side walls: east faces turn from the light, west faces into it
      g.beginPath(); let any=false;
      for(const i of run){ const q=(i+1)%n; if(r.snx[i]<0.3) continue; any=true; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); g.lineTo(vx(q,1),vy(q,1)); g.lineTo(vx(i,1),vy(i,1)); g.closePath(); }
      if(any){ g.fillStyle='rgba(12,14,30,.24)'; g.fill(); }
      g.beginPath(); any=false;
      for(const i of run){ const q=(i+1)%n; if(r.snx[i]>-0.3) continue; any=true; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); g.lineTo(vx(q,1),vy(q,1)); g.lineTo(vx(i,1),vy(i,1)); g.closePath(); }
      if(any){ g.fillStyle='rgba(255,240,214,.08)'; g.fill(); }
      reElvMass(g,P,M,r,run,vx,vy);
      reElvStrata(g,P,M,r,run,vs,vx,vy);
      reElvCracks(g,P,M,r,run,vx,vy);
      if(P.climb) reElvClimb(g,P,M,r,run,vx,vy);
      if(P.step) reElvStep(g,P,M,r,run,vs,vx,vy);
      // the shadow under the lip's overhang, then a fine dark line where the face meets the ground
      g.strokeStyle=reRGBA(M.deep,0.35); g.lineWidth=2.2; line(0.05,1.2); g.stroke();
      reElvScree(g,P,M,r,run,vx,vy);
      g.strokeStyle=reRGBA(reK(M.deep,0.55),0.55); g.lineWidth=1.3; line(1,0.2); g.stroke();
    }
    // a step's top is a pale slab, so the low spot in a cliff stands out
    if(P.step&&r===P.rings[0]){ g.fillStyle='rgba(255,236,214,.1)'; g.beginPath(); g.moveTo(X[0],Y[0]); for(let i=1;i<n;i++) g.lineTo(X[i],Y[i]); g.closePath(); g.fill(); }
    // the lip: the front edges get the material's top (grass, snow, sand, coping, a lit edge); the back rim a fine line
    const segsOn=[]; for(let i=0;i<n;i++) if(on(i)&&!r.inner[i]) segsOn.push(i);
    if(!segsOn.length) continue;
    const ix=(i,d)=>X[i]-r.vnx[i]*d, iy=(i,d)=>Y[i]-r.vny[i]*d;
    g.strokeStyle=reRGBA(M.deep,0.32); g.lineWidth=1.6; g.beginPath(); for(const i of segsOn){ if(FR[i]) continue; const q=(i+1)%n; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); } g.stroke();
    g.strokeStyle=reRGBA(M.lip,0.3); g.lineWidth=1.4; g.beginPath(); for(const i of segsOn){ if(FR[i]) continue; const q=(i+1)%n; g.moveTo(ix(i,1.8),iy(i,1.8)); g.lineTo(ix(q,1.8),iy(q,1.8)); } g.stroke();
    const fr=segsOn.filter(i=>FR[i]); if(!fr.length) continue;
    const mid=fr[fr.length>>1], lip=reLipOf(P,M,ix(mid,14),iy(mid,14));
    reElvLip(g,P,M,r,fr,lip,ix,iy);
  }
  g.restore();
}
// strata: layers that follow the edge, each a dark seam with a lit ledge just above it, broken here and there
function reElvStrata(g,P,M,r,run,vs,vx,vy){
  const w=RE_STRATA[M.mat]; if(!w) return;
  const X=r.x, H=r.H; let hmax=0; for(const i of vs) hmax=Math.max(hmax,H[i]); if(hmax<10) return;
  const nL=Math.max(2,Math.round(hmax/(M.mat==='slate'?6:M.mat==='sand'?9:M.mat==='ice'?20:15))), sd=(P.seed|0)*13+7;
  const dk=reRGBA(reK(M.dark,0.7),0.3*w), lt=reRGBA(rzMix(M.lit,[255,250,236],0.2),0.22*w);
  for(let L=1;L<=nL;L++){
    const f=L/(nL+1)+(rzHash(L,sd,3)-0.5)*0.06, amp=M.mat==='sand'||M.mat==='ice'?2.6:1.6;
    const pts=[]; for(const i of vs){ const x=vx(i,f); pts.push([x,vy(i,f)+(rzVN(x*0.045,L*3.1,sd)-0.5)*amp*2]); }
    for(const [col,dy,lw] of [[dk,0.6,1.3],[lt,-0.9,1]]){ g.strokeStyle=col; g.lineWidth=lw; g.beginPath();
      for(let k=0;k<pts.length-1;k++){ const a=pts[k], b=pts[k+1]; if(rzVN(a[0]/26,L*1.7,sd)<0.38) continue; g.moveTo(a[0],a[1]+dy); g.lineTo(b[0],b[1]+dy); }
      g.stroke(); }
  }
}
// rock masses (soft lighter and darker blocks along the face), rain streaks from the lip, flints in chalk, then
// cracks: a dark line with a lit side toward the light, forking now and then; ice cracks are deep blue and bright edged
function reElvMass(g,P,M,r,run,vx,vy){
  const X=r.x, Y=r.y, n=r.n, mat=M.mat; if(mat==='glass'||mat==='wood') return;
  const sd=(P.seed|0)*101+17, quad=(i,q,ta,tb,f0,f1)=>{ g.moveTo(lerp(vx(i,f0),vx(q,f0),ta),lerp(vy(i,f0),vy(q,f0),ta)); g.lineTo(lerp(vx(i,f0),vx(q,f0),tb),lerp(vy(i,f0),vy(q,f0),tb)); g.lineTo(lerp(vx(i,f1),vx(q,f1),tb),lerp(vy(i,f1),vy(q,f1),tb)); g.lineTo(lerp(vx(i,f1),vx(q,f1),ta),lerp(vy(i,f1),vy(q,f1),ta)); g.closePath(); };
  // big soft masses (a coarse tile, stretched down the face like jointed rock), then rain streaks from the lip
  let bb=[1e9,1e9,-1e9,-1e9]; for(const i of run){ const q=(i+1)%n; bb[0]=Math.min(bb[0],X[i],vx(q,1)); bb[2]=Math.max(bb[2],X[q],vx(i,1)); bb[1]=Math.min(bb[1],Y[i],Y[q]); bb[3]=Math.max(bb[3],vy(i,1),vy(q,1)); }
  g.beginPath(); for(const i of run){ const q=(i+1)%n; g.moveTo(X[i],Y[i]); g.lineTo(X[q],Y[q]); g.lineTo(vx(q,1),vy(q,1)); g.lineTo(vx(i,1),vy(i,1)); g.closePath(); }
  reGrain(g,'mass',mat==='ice'?0.45:mat==='chalk'||mat==='mason'?0.7:0.85,bb,'overlay');
  if(mat==='ice'||mat==='obsid') return;
  const st=[];
  for(const i of run){ const q=(i+1)%n; if(Math.max(r.H[i],r.H[q])<12) continue; const rng=mulberry32(sd+i*7919); if(rng()<0.7) continue; const t=rng(); st.push([lerp(X[i],X[q],t),lerp(Y[i],Y[q],t),lerp(vx(i,1),vx(q,1),t)-lerp(X[i],X[q],t),lerp(r.H[i],r.H[q],t)*(0.3+rng()*0.6),1.2+rng()*3]); }
  g.strokeStyle=mat==='chalk'?'rgba(84,92,76,.09)':mat==='mason'||mat==='brick'?'rgba(40,34,30,.11)':reRGBA(M.deep,0.09);
  for(const [x,y,dx,h,w] of st){ g.lineWidth=w; g.beginPath(); g.moveTo(x,y+1); g.lineTo(x+dx*0.5,y+h); g.stroke(); }
  if(mat==='chalk'){   // flint bands: rows of dark nodules along two layers
    const fl=[]; for(const f of [0.34,0.66]) for(const i of run){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]), rng=mulberry32(sd+i*31+Math.round(f*100)); if(r.H[i]<20) continue; for(let k=0;k<L/7;k++){ if(rng()<0.45) continue; const t=rng(); fl.push([lerp(vx(i,f),vx(q,f),t),lerp(vy(i,f),vy(q,f),t)+(rng()-0.5)*2,0.9+rng()*1.3]); } }
    g.fillStyle='rgba(70,72,74,.5)'; g.beginPath(); for(const [x,y,s] of fl){ g.moveTo(x+s*1.4,y); g.ellipse(x,y,s*1.4,s,0,0,TAU); } g.fill();
    g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); for(const [x,y,s] of fl){ g.moveTo(x+s*0.2,y-s*0.4); g.ellipse(x-s*0.4,y-s*0.4,s*0.6,s*0.4,0,0,TAU); } g.fill();
  }
}
function reElvCracks(g,P,M,r,run,vx,vy){
  const X=r.x, Y=r.y, n=r.n, mat=M.mat; if(mat==='mason'||mat==='brick'||mat==='wood') return;
  const dk=mat==='ice'?'rgba(30,70,120,.5)':mat==='glass'?'rgba(255,255,255,.3)':reRGBA(reK(M.dark,0.45),0.5), lt=mat==='ice'?'rgba(240,250,255,.55)':reRGBA(rzMix(M.lit,[255,250,236],0.2),0.26);
  const segs=[];
  for(const i of run){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]), rng=mulberry32((P.seed|0)*7919+i*104729+11);
    if(r.H[i]<14||rng()>L/(mat==='basalt'?70:44)) continue;
    const at=(t,f)=>[lerp(vx(i,f),vx(q,f),t),lerp(vy(i,f),vy(q,f),t)];
    const walk=(t,f,len,depth)=>{ const pts=[at(t,f)], steps=2+Math.floor(rng()*4); for(let s=0;s<steps;s++){ f+=(0.07+rng()*0.14)*len; t=clamp(t+(rng()-0.5)*(L>4?18/L:0.5),0,1); if(f>0.97) break; pts.push(at(t,f)); if(depth<1&&rng()<0.3) walk(t,f,0.6,depth+1); } segs.push(pts); };
    walk(rng(),0.03+rng()*0.1,rng()<0.35?0.5:1,0); }
  for(const [col,dx,lw] of [[lt,-1.1,1],[dk,0,1.4]]){ g.strokeStyle=col; g.lineWidth=lw; g.beginPath(); for(const pts of segs){ g.moveTo(pts[0][0]+dx,pts[0][1]); for(let k=1;k<pts.length;k++) g.lineTo(pts[k][0]+dx,pts[k][1]); } g.stroke(); }
}
// scree at the foot: a few stones fallen from the face, lit on top, each with its own small shadow
function reElvScree(g,P,M,r,run,vx,vy){
  const X=r.x, Y=r.y, n=r.n; if(M.mat==='mason'||M.mat==='brick'||M.mat==='wood'||M.mat==='glass') return;
  const st=[];
  for(const i of run){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]), rng=mulberry32((P.seed|0)*31+i*977+5); if(r.H[i]<12) continue;
    const m=Math.floor(L/18*rng()+rng()*0.8); for(let k=0;k<m;k++){ const t=rng(), x=lerp(vx(i,1),vx(q,1),t)+(rng()-0.5)*6, y=lerp(vy(i,1),vy(q,1),t)+1+rng()*7; st.push([x,y,1.4+rng()*2.8,rng()]); } }
  if(!st.length) return;
  g.fillStyle='rgba(10,12,24,.28)'; g.beginPath(); for(const [x,y,s] of st){ g.moveTo(x+s*1.1+1,y+1.2); g.ellipse(x+1,y+1.2,s*1.1,s*0.6,0,0,TAU); } g.fill();
  g.fillStyle=reRGB(rzMix(M.face,M.dark,0.35)); g.beginPath(); for(const [x,y,s] of st){ g.moveTo(x+s,y); g.ellipse(x,y,s,s*0.72,0,0,TAU); } g.fill();
  g.fillStyle=reRGBA(rzMix(M.lit,[255,250,236],0.25),0.7); g.beginPath(); for(const [x,y,s] of st){ g.moveTo(x-s*0.2+s*0.5,y-s*0.3); g.ellipse(x-s*0.25,y-s*0.3,s*0.5,s*0.32,0,0,TAU); } g.fill();
}
// climbable faces: knobbly holds (rock) or vines with leaves (grass, sand, earth); they must read at a glance
function reElvClimb(g,P,M,r,run,vx,vy){
  const X=r.x, Y=r.y, n=r.n, vine=P.style==='grass'||P.style==='sand'||M.mat==='earth';
  const at=(i,t,f)=>{ const q=(i+1)%n; return [lerp(vx(i,f),vx(q,f),t),lerp(vy(i,f),vy(q,f),t)]; };
  if(vine){
    const st=[], lv=[];
    for(const i of run){ const rng=mulberry32((P.seed|0)*53+i*13); if(rng()>0.6) continue; const t=rng(), pts=[]; for(let f=0.02;f<=0.96;f+=0.07){ const [a,b]=at(i,t,f); const x=a+Math.sin(f*11+i)*3.2; pts.push([x,b]); if(rng()<0.8) lv.push([x,b,rng()]); } st.push(pts); }
    g.strokeStyle='rgba(20,30,12,.35)'; g.lineWidth=2.6; g.beginPath(); for(const p of st){ g.moveTo(p[0][0]+1,p[0][1]+1); for(const q of p) g.lineTo(q[0]+1,q[1]+1); } g.stroke();
    g.strokeStyle='#3e6a26'; g.lineWidth=1.8; g.beginPath(); for(const p of st){ g.moveTo(p[0][0],p[0][1]); for(const q of p) g.lineTo(q[0],q[1]); } g.stroke();
    for(const [c,k0,k1] of [['#2f5a20',0,0.45],['#4f8a32',0.45,0.8],['#7cb04a',0.8,1.01]]){ g.fillStyle=c; g.beginPath(); for(const [x,y,u] of lv){ if(u<k0||u>=k1) continue; const s=u>0.5?1:-1; g.moveTo(x+s*5,y); g.ellipse(x+s*2.6,y,2.8,1.7,s*0.5,0,TAU); } g.fill(); }
    return;
  }
  const kn=[];
  for(const i of run){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]), m=Math.max(1,Math.round(L/13)); for(let k=0;k<m;k++) for(let row=0;row<4;row++){ const t=(k+0.5+(row%2)*0.5)/m; if(t>1) continue; kn.push(at(i,t,0.2+row*0.2)); } }
  g.fillStyle='rgba(8,8,16,.42)'; g.beginPath(); for(const [x,y] of kn){ g.moveTo(x+4,y+2.2); g.ellipse(x+0.8,y+2.2,3.4,2.1,0,0,TAU); } g.fill();
  g.fillStyle=reRGB(rzMix(M.lit,[236,222,190],0.45)); g.beginPath(); for(const [x,y] of kn){ g.moveTo(x+3,y); g.ellipse(x,y,3,1.9,0,0,TAU); } g.fill();
  g.fillStyle='rgba(255,252,240,.55)'; g.beginPath(); for(const [x,y] of kn){ g.moveTo(x+0.4,y-0.8); g.ellipse(x-0.9,y-0.8,1.3,0.8,0,0,TAU); } g.fill();
}
// a step face: cut blocks with worn joints and a pale top, so it reads as "this one is low, jump it"
function reElvStep(g,P,M,r,run,vs,vx,vy){
  const X=r.x, Y=r.y, n=r.n;
  g.fillStyle='rgba(255,238,214,.14)'; g.beginPath(); g.moveTo(vx(vs[0],0),vy(vs[0],0)); for(let k=1;k<vs.length;k++) g.lineTo(vx(vs[k],0),vy(vs[k],0)); for(let k=vs.length-1;k>=0;k--) g.lineTo(vx(vs[k],1),vy(vs[k],1)); g.closePath(); g.fill();
  g.strokeStyle=reRGBA(M.deep,0.4); g.lineWidth=1.3; g.beginPath();
  for(const i of run){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]); if(((i*7)%3)!==0||L<4) continue; g.moveTo(lerp(vx(i,0.12),vx(q,0.12),0.5),lerp(vy(i,0.12),vy(q,0.12),0.5)); g.lineTo(lerp(vx(i,0.96),vx(q,0.96),0.5),lerp(vy(i,0.96),vy(q,0.96),0.5)); }
  g.stroke();
  g.fillStyle=reRGBA(rzMix(M.lip,[255,248,230],0.3),0.8); for(const i of run){ if(((i*5)%2)!==0) continue; const q=(i+1)%n, x=(X[i]+X[q])/2, y=(Y[i]+Y[q])/2+2.5; g.beginPath(); g.ellipse(x,y,3.4,1.6,0,0,TAU); g.fill(); }
}
// the top edge of the front faces
function reElvLip(g,P,M,r,fr,lip,ix,iy){
  const X=r.x, Y=r.y, n=r.n, seg=(d,dy)=>{ g.beginPath(); for(const i of fr){ const q=(i+1)%n; g.moveTo(ix(i,d),iy(i,d)+(dy||0)); g.lineTo(ix(q,d),iy(q,d)+(dy||0)); } };
  const each=(step,fn)=>{ for(const i of fr){ const q=(i+1)%n, L=Math.hypot(X[q]-X[i],Y[q]-Y[i]), m=Math.max(1,Math.round(L/step)), rng=mulberry32((P.seed|0)*977+i*31+3); for(let k=0;k<m;k++){ const t=(k+rng())/m; fn(lerp(X[i],X[q],t),lerp(Y[i],Y[q],t),rng,i); } } };
  if(lip.k==='grass'){
    const C=lip.c, dk=reRGB(reK(C[2],0.8)), md=reRGB(C[0]), lt=reRGB(rzMix(C[1],[226,236,150],0.25));
    g.strokeStyle='rgba(40,28,16,.5)'; g.lineWidth=3.2; seg(-1.6); g.stroke();   // the soil and roots under the turf
    const bl=[[],[],[]];
    each(2.2,(x,y,rng)=>{ const L=2+rng()*5.5, a=(rng()-0.5)*0.9, c=rng()<0.35?0:rng()<0.7?1:2; bl[c].push([x,y-1,x+Math.sin(a)*L*0.6,y+L*Math.cos(a)*0.9]); });
    for(let c=0;c<3;c++){ g.strokeStyle=[dk,md,lt][c]; g.lineWidth=c===2?1:1.3; g.beginPath(); for(const [a,b,x,y] of bl[c]){ g.moveTo(a,b); g.lineTo(x,y); } g.stroke(); }
    g.strokeStyle=reRGBA(rzMix(C[1],[230,240,160],0.35),0.55); g.lineWidth=1.6; seg(1.4); g.stroke();
    return;
  }
  if(lip.k==='snow'){
    g.strokeStyle='rgba(92,112,150,.42)'; g.lineWidth=4.6; seg(-2.4,2.2); g.stroke();   // the drift's blue shade on the face
    g.strokeStyle='rgb(226,234,246)'; g.lineWidth=5; seg(0.6); g.stroke();
    g.strokeStyle='rgb(248,251,255)'; g.lineWidth=2.4; seg(2.2); g.stroke();
    const lumps=[], ic=[];
    each(7,(x,y,rng)=>{ if(rng()<0.55) lumps.push([x,y+1.5,2.5+rng()*3.5]); if(rng()<0.22) ic.push([x+(rng()-0.5)*4,y+2,3+rng()*8]); });
    g.fillStyle='rgba(92,112,150,.35)'; g.beginPath(); for(const [x,y,s] of lumps){ g.moveTo(x+s,y+1.6); g.ellipse(x,y+1.6,s,s*0.55,0,0,TAU); } g.fill();
    g.fillStyle='rgb(232,240,250)'; g.beginPath(); for(const [x,y,s] of lumps){ g.moveTo(x+s,y); g.ellipse(x,y,s,s*0.55,0,0,TAU); } g.fill();
    g.fillStyle='rgba(206,228,246,.9)'; g.beginPath(); for(const [x,y,h] of ic){ g.moveTo(x-1.6,y); g.lineTo(x+1.6,y); g.lineTo(x,y+h); g.closePath(); } g.fill();
    g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=0.7; g.beginPath(); for(const [x,y,h] of ic){ g.moveTo(x-0.6,y+0.5); g.lineTo(x-0.1,y+h*0.7); } g.stroke();
    return;
  }
  if(lip.k==='sand'){
    const C=lip.c; g.strokeStyle=reRGBA(reK(C[2],0.75),0.4); g.lineWidth=3; seg(-1.2,1.4); g.stroke();
    g.strokeStyle=reRGB(rzMix(C[1],[240,226,190],0.3)); g.lineWidth=2.6; seg(0.8); g.stroke();
    const tufts=[]; each(16,(x,y,rng)=>{ if(rng()<0.25) tufts.push([x,y]); });
    g.strokeStyle='rgba(120,128,72,.8)'; g.lineWidth=1; g.beginPath(); for(const [x,y] of tufts) for(let k=-2;k<=2;k++){ g.moveTo(x+k,y+1); g.lineTo(x+k*2.2,y-4+Math.abs(k)); } g.stroke();
    return;
  }
  if(lip.k==='cope'){   // coping stones on a town wall: a lit cap, joints, a shadow under it
    g.strokeStyle=reRGBA(M.deep,0.5); g.lineWidth=3; seg(-2,2.4); g.stroke();
    g.strokeStyle=reRGB(rzMix(M.lit,[244,236,220],0.25)); g.lineWidth=4; seg(1.4); g.stroke();
    g.strokeStyle='rgba(255,250,240,.6)'; g.lineWidth=1.2; seg(2.6); g.stroke();
    const jt=[]; each(15,(x,y)=>jt.push([x,y])); g.strokeStyle=reRGBA(M.deep,0.45); g.lineWidth=1; g.beginPath(); for(const [x,y] of jt){ g.moveTo(x,y-0.6); g.lineTo(x,y+2.8); } g.stroke();
    return;
  }
  // a plain edge: the lit rim of the top and the dark line of its own shadow just under it
  g.strokeStyle=reRGBA(M.deep,0.38); g.lineWidth=2; seg(-1.4,1.6); g.stroke();
  g.strokeStyle=reRGBA(rzMix(M.lip,M.lit,0.4),0.8); g.lineWidth=2.2; seg(1.4); g.stroke();
  g.strokeStyle=reRGBA(M.lip,0.35); g.lineWidth=1.2; seg(3.2); g.stroke();
}
// stairs, ramps and ladders over the face they cut through
function reElvRamp(g,E,rp){
  const P=elvOwnerAt(E,(rp.ax0+rp.ax1)/2,rp.dir==='n'?rp.ay0-6:rp.dir==='s'?rp.ay1+6:(rp.ay0+rp.ay1)/2,rp)||E.plats[0];
  const M0=reElvM(P), M=rp.look?Object.assign({},M0,{face:reNat(elvRGB(rp.look.face||P.S.face)),lit:reNat(elvRGB(rp.look.lit||P.S.lit)),dark:reNat(elvRGB(rp.look.dark||P.S.dark))}):M0;
  const x0=rp.ax0, x1=rp.ax1, y0=rp.ay0, y1=rp.ay1, W=x1-x0, Hh=y1-y0, vert=rp.dir==='n'||rp.dir==='s';
  g.save(); g.lineJoin='round'; g.lineCap='round';
  if(rp.kind==='ladder'){
    const rx=[x0+W*0.22,x1-W*0.22];
    g.strokeStyle='rgba(8,10,20,.38)'; g.lineWidth=5; g.beginPath(); for(const x of rx){ g.moveTo(x+2.5,y0+2); g.lineTo(x+2.5,y1+3); } for(let y=y0+5;y<y1-2;y+=9){ g.moveTo(rx[0]+2,y+2.5); g.lineTo(rx[1]+2,y+2.5); } g.stroke();
    g.strokeStyle='#5a3c22'; g.lineWidth=3; g.beginPath(); for(let y=y0+5;y<y1-2;y+=9){ g.moveTo(rx[0],y); g.lineTo(rx[1],y); } g.stroke();
    g.strokeStyle='#a07a4c'; g.lineWidth=1.3; g.beginPath(); for(let y=y0+5;y<y1-2;y+=9){ g.moveTo(rx[0]+1,y-0.8); g.lineTo(rx[1]-1,y-0.8); } g.stroke();
    g.strokeStyle='#4a3020'; g.lineWidth=4.2; g.beginPath(); for(const x of rx){ g.moveTo(x,y0-2); g.lineTo(x,y1); } g.stroke();
    g.strokeStyle='#8a6640'; g.lineWidth=1.6; g.beginPath(); for(const x of rx){ g.moveTo(x-1.1,y0-2); g.lineTo(x-1.1,y1); } g.stroke();
    g.strokeStyle='rgba(214,196,150,.75)'; g.lineWidth=1.2; g.beginPath(); for(let y=y0+5;y<y1-2;y+=9) for(const x of rx){ g.moveTo(x-2.4,y-1.6); g.lineTo(x+2.4,y+1.6); } g.stroke();   // the rope lashings
    g.restore(); return;
  }
  // the cut: shade where it meets the ground, then the slope or the flight
  g.fillStyle='rgba(10,12,24,.22)'; if(vert) g.fillRect(x0-5,y1-4,W+10,12); else g.fillRect(x0,y1,W,10);
  if(rp.kind==='ramp'){
    const lo=vert?(rp.dir==='n'?y1:y0):(rp.dir==='e'?x0:x1), hi=vert?(rp.dir==='n'?y0:y1):(rp.dir==='e'?x1:x0);
    const gr=vert?g.createLinearGradient(0,lo,0,hi):g.createLinearGradient(lo,0,hi,0); gr.addColorStop(0,reRGB(reK(M.face,0.82))); gr.addColorStop(1,reRGB(rzMix(M.lit,[250,244,228],0.12)));
    g.fillStyle=gr; g.fillRect(x0,y0,W,Hh); g.beginPath(); g.rect(x0,y0,W,Hh); reGrain(g,'earth',0.6,[x0,y0,x1,y1]);
    g.strokeStyle='rgba(20,16,12,.16)'; g.lineWidth=2; g.beginPath(); if(vert){ for(const k of [0.32,0.68]){ g.moveTo(x0+W*k,y0); g.lineTo(x0+W*k,y1); } } else { for(const k of [0.32,0.68]){ g.moveTo(x0,y0+Hh*k); g.lineTo(x1,y0+Hh*k); } } g.stroke();
    g.fillStyle='rgba(10,12,24,.26)'; if(vert){ g.fillRect(x0,y0,3,Hh); g.fillRect(x1-3,y0,3,Hh); } else { g.fillRect(x0,y1-3,W,3); }
    g.restore(); return;
  }
  reElvStairs(g,M,rp,x0,y0,x1,y1);
  g.restore();
}
// stone steps: a lit tread with a worn middle and a rounded nose, a riser in shade, cut cheek walls with lit caps
function reElvStairs(g,M,rp,x0,y0,x1,y1){
  const W=x1-x0, H=y1-y0, d=rp.dir, vert=d==='n'||d==='s', L=vert?H:W, n=Math.max(3,Math.round(L/(vert?12:16))), p=L/n;
  const cw=Math.max(5,Math.min(11,Math.round((vert?W:H)*0.09)));
  const stone=rzMix(M.lit,[206,198,184],0.35), tr=u=>reRGB(rzMix(reK(stone,0.9),rzMix(stone,[248,242,228],0.3),u)), rs=u=>reRGB(rzMix(reK(M.dark,0.75),reK(M.face,0.8),0.2+0.5*u));
  g.fillStyle=reRGB(reK(M.dark,0.7)); g.fillRect(x0,y0,W,H);
  if(vert){
    const sx0=x0+cw, sx1=x1-cw, sw=sx1-sx0;
    for(let i=0;i<n;i++){ const u=n>1?i/(n-1):1;
      if(d==='n'){ const a=y1-(i+1)*p, th=p*0.58;
        g.fillStyle=tr(u); g.fillRect(sx0,a,sw,th+0.5); g.fillStyle=rs(u); g.fillRect(sx0,a+th,sw,p-th+0.5);
        g.fillStyle='rgba(255,252,240,.16)'; g.fillRect(sx0+sw*0.3,a+1,sw*0.4,th-2);
        g.fillStyle=`rgba(255,250,236,${0.3+0.3*u})`; g.fillRect(sx0,a+th-1.6,sw,1.4); g.fillStyle='rgba(8,10,20,.36)'; g.fillRect(sx0,a+th,sw,1.6); g.fillStyle='rgba(8,10,20,.2)'; g.fillRect(sx0,a+p-2,sw,2);
      }else{ const a=y0+i*p;
        g.fillStyle=tr(u); g.fillRect(sx0,a,sw,p+0.5); g.fillStyle='rgba(8,10,20,.3)'; g.fillRect(sx0,a,sw,1.8); g.fillStyle=`rgba(255,250,236,${0.22+0.3*u})`; g.fillRect(sx0,a+1.8,sw,1.2); }
      g.fillStyle='rgba(8,10,20,.16)'; const jx=sx0+sw*(0.3+0.4*((i*7)%3)/2); g.fillRect(jx,(d==='n'?y1-(i+1)*p:y0+i*p)+2,1.1,p*0.45); }
    g.beginPath(); g.rect(sx0,y0,sw,H); reGrain(g,'chalk',0.7,[sx0,y0,sx1,y1]);
    g.fillStyle='rgba(8,10,20,.2)'; g.fillRect(sx0,y0,4,H);
    const hy=d==='n'?y0:y1, ly=d==='n'?y1:y0;
    for(const cx of [x0,x1-cw]){ const cg=g.createLinearGradient(0,ly,0,hy); cg.addColorStop(0,reRGB(rzMix(M.face,M.dark,0.3))); cg.addColorStop(1,reRGB(rzMix(M.lit,M.lip,0.25))); g.fillStyle=cg; g.fillRect(cx,y0,cw,H);
      g.fillStyle='rgba(255,250,236,.32)'; g.fillRect(cx+0.6,y0,1.3,H); g.fillStyle='rgba(8,10,20,.32)'; g.fillRect(cx+cw-1.4,y0,1.4,H);
      g.strokeStyle='rgba(8,10,20,.24)'; g.lineWidth=1; g.beginPath(); for(let y=y0+p*0.8;y<y1-2;y+=p*1.6){ g.moveTo(cx+1,y); g.lineTo(cx+cw-1,y); } g.stroke(); }
    g.beginPath(); g.rect(x0,y0,cw,H); g.rect(x1-cw,y0,cw,H); reGrain(g,'mason',0.75,[x0,y0,x1,y1]);
    g.fillStyle=reRGB(rzMix(M.lip,[255,250,240],0.2)); g.fillRect(x0,hy-(d==='n'?0:2.2),W,2.2);
    g.fillStyle='rgba(10,12,24,.26)'; g.fillRect(x0-3,ly+(d==='n'?0:-4),W+6,4);
  }else{
    const sy0=y0+cw*0.6, sy1=y1-cw, sh=sy1-sy0, side=Math.min(H*0.45,40);
    for(let i=0;i<n;i++){ const u=n>1?i/(n-1):1, a=d==='e'?x0+i*p:x1-(i+1)*p;
      g.fillStyle=tr(u); g.fillRect(a,sy0,p+0.5,sh); g.fillStyle='rgba(8,10,20,.3)'; g.fillRect(d==='e'?a:a+p-1.6,sy0,1.6,sh);
      g.fillStyle=`rgba(255,250,236,${0.22+0.3*u})`; g.fillRect(d==='e'?a+1.6:a+p-2.8,sy0,1.2,sh);
      const fh=side*(i+1)/n; g.fillStyle=rs(u); g.fillRect(a,sy1-fh,p+0.5,fh+cw); g.fillStyle=`rgba(255,250,236,${0.25+0.3*u})`; g.fillRect(a,sy1-fh,p+0.5,1.3); }
    g.beginPath(); g.rect(x0,y0,W,H); reGrain(g,'chalk',0.6,[x0,y0,x1,y1]);
    g.fillStyle=reRGB(rzMix(M.lit,M.lip,0.3)); g.fillRect(x0,y0,W,cw*0.6); g.fillStyle='rgba(8,10,20,.2)'; g.fillRect(x0,sy0,W,3);
    g.fillStyle=reRGB(M.lip); g.fillRect(d==='e'?x1-2.2:x0,y0,2.2,H);
  }
  g.strokeStyle='rgba(8,10,20,.3)'; g.lineWidth=1.2; g.strokeRect(x0+0.5,y0,W-1,H);
}
// ledges: a bright worn lip with small drop marks, so a kid can see "I can hop down here"
function reElvLedge(g,E,l){
  if(!l.segs||!l.segs.length) return;
  g.save(); g.lineCap='round'; g.lineJoin='round';
  for(const [P,r,i] of l.segs){
    const q=(i+1)%r.n, M=reElvM(P), ix=k=>r.x[k]-r.vnx[k]*3, iy=k=>r.y[k]-r.vny[k]*3;
    g.strokeStyle=reRGBA(M.deep,0.42); g.lineWidth=7; g.beginPath(); g.moveTo(ix(i),iy(i)+1.6); g.lineTo(ix(q),iy(q)+1.6); g.stroke();
    g.strokeStyle=reRGB(rzMix(M.lip,[255,248,230],0.25)); g.lineWidth=4.4; g.beginPath(); g.moveTo(ix(i),iy(i)); g.lineTo(ix(q),iy(q)); g.stroke();
    g.strokeStyle='rgba(255,255,250,.5)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(ix(i),iy(i)-1.2); g.lineTo(ix(q),iy(q)-1.2); g.stroke();
    const mx=(r.x[i]+r.x[q])/2+r.bxv[i]*0.3, my=(r.y[i]+r.y[q])/2+r.byv[i]*0.42;
    if(((i*5)%3)===0&&r.byv[i]>12){ g.strokeStyle='rgba(255,244,220,.6)'; g.lineWidth=2; g.beginPath(); g.moveTo(mx-4,my-3); g.lineTo(mx,my+1); g.lineTo(mx+4,my-3); g.stroke(); }
  }
  g.restore();
}
// water or lava pouring down a face: a lit sheet with streaks, wet dark rock at its sides, foam or glow at its foot
function reElvFall(g,f){
  const x=f.x, w=f.w, y0=f.y0-4, y1=f.y1, lava=f.kind==='lava', h=y1-y0;
  g.save();
  const sheet=(o)=>{ g.beginPath(); g.moveTo(x-w/2-o,y0); g.quadraticCurveTo(x-w/2-o-1,y0+h*0.6,x-w/2-o-3,y1+2); g.lineTo(x+w/2+o+3,y1+2); g.quadraticCurveTo(x+w/2+o+1,y0+h*0.6,x+w/2+o,y0); g.closePath(); };
  g.fillStyle=lava?'rgba(40,10,4,.5)':'rgba(10,20,30,.42)'; sheet(4); g.fill();   // the wet rock round it
  const gr=g.createLinearGradient(0,y0,0,y1); if(lava){ gr.addColorStop(0,'#ffc65a'); gr.addColorStop(0.5,'#ff7a1e'); gr.addColorStop(1,'#c8380e'); } else { gr.addColorStop(0,'#8ccad8'); gr.addColorStop(0.45,'#4a94b4'); gr.addColorStop(1,'#2e6a8a'); }
  g.fillStyle=gr; sheet(0); g.fill();
  g.lineCap='round';
  for(const [col,lw,n] of lava?[['rgba(90,20,6,.45)',2.2,3],['rgba(255,236,170,.75)',1.2,4]]:[['rgba(20,60,90,.35)',2,3],['rgba(236,250,255,.7)',1.3,5]]){
    g.strokeStyle=col; g.lineWidth=lw; g.beginPath(); for(let k=0;k<n;k++){ const xx=x-w*0.36+k*w*0.72/(n-1||1)+((k*37)%5-2)*0.6; g.moveTo(xx,y0+2+k*3); g.quadraticCurveTo(xx+Math.sin(k*2.3)*2,y0+h*0.5,xx+Math.sin(k)*1.5,y1-3); } g.stroke(); }
  const fg=g.createRadialGradient(x,y1+3,1,x,y1+3,w*0.85); if(lava){ fg.addColorStop(0,'rgba(255,240,170,.9)'); fg.addColorStop(1,'rgba(255,140,40,0)'); } else { fg.addColorStop(0,'rgba(255,255,255,.9)'); fg.addColorStop(0.6,'rgba(230,246,255,.5)'); fg.addColorStop(1,'rgba(230,246,255,0)'); }
  g.fillStyle=fg; g.beginPath(); g.ellipse(x,y1+3,w*0.85,7,0,0,TAU); g.fill();
  g.restore();
}
// a trail: a soft worn bed, a lighter middle and flat stepping stones that sit in it (lit tops, a dark seam below)
function reElvPath(g,p,x0,y0,x1,y1){
  if(p.bb[2]<x0||p.bb[0]>x1||p.bb[3]<y0||p.bb[1]>y1) return;
  const pts=p.pts, w=p.w, C=p.look||{};
  g.save(); g.lineCap='round'; g.lineJoin='round';
  const line=()=>{ g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) g.lineTo(pts[i][0],pts[i][1]); };
  line(); g.strokeStyle='rgba(30,22,16,.16)'; g.lineWidth=w+12; g.stroke();
  line(); g.strokeStyle=C.bed?C.bed:'rgba(140,120,100,.5)'; g.lineWidth=w; g.stroke();
  line(); g.strokeStyle='rgba(190,170,146,.28)'; g.lineWidth=w*0.5; g.stroke();
  const rng=mulberry32(Math.floor(pts[0][0]*3+pts[0][1]*7)), st=[], col=C.stone?hexRGB(C.stone.length===7?C.stone:'#b6a08c'):[182,160,140];
  for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.floor(L/26); for(let k=0;k<n;k++){ const t=(k+0.5)/n, x=lerp(a[0],b[0],t)+(rng()-0.5)*w*0.55, y=lerp(a[1],b[1],t)+(rng()-0.5)*w*0.4, r=4+rng()*4; if(x<x0-20||x>x1+20||y<y0-20||y>y1+20) continue; st.push([x,y,r]); } }
  g.fillStyle='rgba(16,12,10,.4)'; g.beginPath(); for(const [x,y,r] of st){ g.moveTo(x+r+0.6,y+1.4); g.ellipse(x+0.6,y+1.4,r,r*0.7,0,0,TAU); } g.fill();
  g.fillStyle=reRGB(reK(col,0.92)); g.beginPath(); for(const [x,y,r] of st){ g.moveTo(x+r,y); g.ellipse(x,y,r,r*0.7,0,0,TAU); } g.fill();
  g.fillStyle=reRGBA(rzMix(col,[255,250,236],0.35),0.75); g.beginPath(); for(const [x,y,r] of st){ g.moveTo(x-r*0.1+r*0.6,y-r*0.2); g.ellipse(x-r*0.18,y-r*0.2,r*0.6,r*0.38,0,0,TAU); } g.fill();
  g.restore();
}
// the ground under a vent: a ring of dark stones round glowing cracks
function reElvVent(g,v){
  const R=Math.min(46,v.r*0.55), rng=mulberry32(v.i*913+77);
  g.save(); g.lineCap='round';
  g.fillStyle='rgba(8,6,10,.3)'; g.beginPath(); g.ellipse(v.x,v.y+3,R+12,(R+12)*0.62,0,0,TAU); g.fill();
  g.fillStyle='#2a2020'; g.beginPath(); g.ellipse(v.x,v.y,R,R*0.6,0,0,TAU); g.fill();
  const gr=g.createRadialGradient(v.x,v.y,1,v.x,v.y,R*0.6); gr.addColorStop(0,'#fff0b0'); gr.addColorStop(0.35,'#ffb04a'); gr.addColorStop(0.8,'#c8461a'); gr.addColorStop(1,'rgba(120,30,10,0)');
  g.fillStyle=gr; g.beginPath(); g.ellipse(v.x,v.y,R*0.62,R*0.37,0,0,TAU); g.fill();
  g.strokeStyle='rgba(255,150,60,.85)'; g.lineWidth=1.6; g.beginPath(); for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.4, r0=R*0.5, r1=R*(0.9+rng()*0.3); g.moveTo(v.x+Math.cos(a)*r0,v.y+Math.sin(a)*r0*0.6); g.lineTo(v.x+Math.cos(a+0.15)*r1,v.y+Math.sin(a+0.15)*r1*0.6); } g.stroke();
  const st=[]; for(let i=0;i<9;i++){ const a=i/9*TAU+rng()*0.3, rr=R*(1.02+rng()*0.12); st.push([v.x+Math.cos(a)*rr,v.y+Math.sin(a)*rr*0.6,5+rng()*4,3.5+rng()*2]); }
  g.fillStyle='rgba(8,6,10,.4)'; g.beginPath(); for(const [x,y,a,b] of st){ g.moveTo(x+a+1,y+1.6); g.ellipse(x+1,y+1.6,a,b,0,0,TAU); } g.fill();
  g.fillStyle='#4a3e3a'; g.beginPath(); for(const [x,y,a,b] of st){ g.moveTo(x+a,y); g.ellipse(x,y,a,b,0,0,TAU); } g.fill();
  g.fillStyle='rgba(170,150,140,.45)'; g.beginPath(); for(const [x,y,a,b] of st){ g.moveTo(x-a*0.2+a*0.55,y-b*0.3); g.ellipse(x-a*0.2,y-b*0.3,a*0.55,b*0.4,0,0,TAU); } g.fill();
  g.restore();
}
// depth mode: a cliff further up the screen leans away and shows a taller face (drawn each frame, so kept to fills)
function reElvLean(E){
  if(typeof DV==='undefined'||!DV.on||!E.G) return;
  const vx0=cam.x-80, vy0=cam.y-80, vx1=cam.x+W/zoom+80, vy1=cam.y+H/zoom+80, K=DV.k*DV.vf*3;
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  for(const P of E.plats){
    if(!P.fb||P.fb[0]>vx1||P.fb[2]<vx0||P.fb[1]>vy1||P.fb[3]<vy0) continue;
    const M=reElvM(P), lit=reRGB(rzMix(M.lit,M.face,0.25)), lip=reRGBA(rzMix(M.lip,M.lit,0.4),0.85), dk=reRGBA(M.deep,0.38);
    for(const r of P.rings){
      const n=r.n, X=r.x, Y=r.y, Hh=r.H, FR=r.front, SB=r.sbb;
      let s0=0; for(let i=0;i<n;i++) if(!FR[i]){ s0=i; break; }
      const runs=[]; let cur=null;
      for(let t=1;t<=n;t++){ const i=(s0+t)%n; const on=FR[i]&&!(r.noLean&&r.noLean[i])&&SB[i*4]<vx1&&SB[i*4+2]>vx0&&SB[i*4+1]<vy1&&SB[i*4+3]>vy0&&Y[i]<DV.cy; if(on){ if(!cur){ cur=[i]; runs.push(cur); } else cur.push(i); } else cur=null; }
      for(const run of runs){
        const vs=run.slice(); vs.push((run[run.length-1]+1)%n);
        const ex=vs.map(i=>clamp((DV.cy-Y[i])*Hh[i]*K,0,Hh[i]*0.3));
        if(Math.max(...ex)<1.2) continue;
        ctx.fillStyle=lit; ctx.beginPath(); ctx.moveTo(X[vs[0]],Y[vs[0]]+1); for(let k=0;k<vs.length;k++) ctx.lineTo(X[vs[k]],Y[vs[k]]-ex[k]); for(let k=vs.length-1;k>=0;k--) ctx.lineTo(X[vs[k]],Y[vs[k]]+1); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.clip(); ctx.globalCompositeOperation='soft-light'; ctx.globalAlpha=0.8; ctx.fillStyle=rePat(M.mat); let xa=1e9,xb=-1e9,ya=1e9,yb=-1e9; for(let k=0;k<vs.length;k++){ const i=vs[k]; xa=Math.min(xa,X[i]); xb=Math.max(xb,X[i]); ya=Math.min(ya,Y[i]-ex[k]); yb=Math.max(yb,Y[i]); } ctx.fillRect(xa-2,ya-2,xb-xa+4,yb-ya+5); ctx.restore();
        ctx.strokeStyle=dk; ctx.lineWidth=1.4; ctx.beginPath(); for(let k=0;k<vs.length;k++){ const x=X[vs[k]], y=Y[vs[k]]-ex[k]; k?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke();
        ctx.strokeStyle=lip; ctx.lineWidth=2.2; ctx.beginPath(); for(let k=0;k<vs.length;k++){ const i=vs[k], x=X[i]-r.vnx[i]*2.2, y=Y[i]-ex[k]-r.vny[i]*2.2; k?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// ---------- 2. bridges and plank decks (drawBridge, a4_ground.js, painted into the ground chunks; wrapped below)
// Road bridges: weathered planks of uneven width and colour with grain and nails on two dark stringers, rope rails on
// posts and stone footings at both ends. Decks and piers (the map's walkways): the same planks on piles, no rails, so
// joined pieces read as one walkway. Over lava: a stone bridge with paving and low parapets, scorched toward the heat.
function rePlankCol(rng,base,grey){ const k=0.82+rng()*0.3, gr=grey+rng()*0.25; const c=rzMix(base,[128,122,110],Math.min(0.7,gr)); return [c[0]*k,c[1]*k,c[2]*k]; }
function reBridge(g,br){
  const L=br.len/2, w=br.w/2, rng=mulberry32(Math.floor(br.x*7+br.y*13)|0), kind=br.kind;
  const road=(kind==='wood'||kind==='a1_char')&&(br.w===58||br.w===62||kind==='a1_char');
  g.save(); g.translate(br.x,br.y); g.rotate(br.ang); g.lineCap='round'; g.lineJoin='round';
  // the shadow it throws on the water or lava, soft at its edges
  g.fillStyle='rgba(6,14,24,.2)'; g.fillRect(-L+2,-w+5,br.len+4,br.w+6); g.fillStyle='rgba(6,14,24,.22)'; g.fillRect(-L+4,-w+7,br.len,br.w);
  if(kind==='stone'){
    const st=[150,140,128];
    g.fillStyle='rgb(70,62,58)'; g.fillRect(-L,-w-4,br.len,br.w+8);
    for(let x=-L;x<L;){ const pw=12+rng()*10, c=rzJit(st,rng,0.2); for(let y=-w;y<w;){ const ph=Math.min(w-y,9+rng()*8); g.fillStyle=reRGB(c.map(v=>v*(0.9+rng()*0.16))); g.fillRect(x+0.8,y+0.8,Math.min(pw,L-x)-1.6,ph-1.6); g.fillStyle='rgba(255,246,230,.18)'; g.fillRect(x+0.8,y+0.8,Math.min(pw,L-x)-1.6,1.2); y+=ph; } x+=pw; }
    g.beginPath(); g.rect(-L,-w,br.len,br.w); reGrain(g,'rock',0.7,[-L,-w,L,w]);
    for(const s of [-1,1]){ const y0=s<0?-w-6:w-2; g.fillStyle='rgb(96,88,80)'; g.fillRect(-L,y0,br.len,8); for(let x=-L;x<L;x+=16){ g.fillStyle=reRGB(rzJit([126,118,108],rng,0.2)); g.fillRect(x+0.8,y0+0.8,14.4,6.4); g.fillStyle='rgba(255,246,230,.28)'; g.fillRect(x+0.8,y0+0.8,14.4,1.4); } g.fillStyle='rgba(8,8,14,.35)'; g.fillRect(-L,s<0?y0+8:y0-2,br.len,2); }
    // scorch toward the lava at both ends of the span, and its glow from below
    const sg=g.createLinearGradient(0,-w,0,w); sg.addColorStop(0,'rgba(255,110,30,.18)'); sg.addColorStop(0.2,'rgba(30,10,6,0)'); sg.addColorStop(0.8,'rgba(30,10,6,0)'); sg.addColorStop(1,'rgba(255,110,30,.18)'); g.fillStyle=sg; g.fillRect(-L,-w-6,br.len,br.w+12);
    g.restore(); return true;
  }
  const charred=kind==='a1_char', base=charred?[74,58,48]:[132,100,66];
  // stringers (the beams under the deck), showing a little at the sides
  g.fillStyle=charred?'rgb(34,26,22)':'rgb(58,40,24)'; g.fillRect(-L,-w-2,br.len,4.5); g.fillRect(-L,w-2.5,br.len,4.5);
  // the planks: across the deck, uneven, each with grain, a lit leading edge and a shaded gap
  for(let x=-L;x<L-0.5;){ const pw=Math.min(L-x,7.5+rng()*3), c=rePlankCol(rng,base,charred?0.05:0.12), sag=(rng()-0.5)*1.2;
    g.fillStyle=reRGB(c); g.fillRect(x+0.6,-w+sag,pw-1.2,br.w);
    g.strokeStyle=reRGBA(reK(c,0.72),0.55); g.lineWidth=0.7; g.beginPath(); for(let k=0;k<3;k++){ const gx=x+1.6+rng()*(pw-3.2); g.moveTo(gx,-w+sag+1); g.bezierCurveTo(gx+(rng()-0.5)*2,-w*0.3,gx+(rng()-0.5)*2,w*0.3,gx+(rng()-0.5)*1.5,w+sag-1); } g.stroke();
    g.fillStyle=charred?'rgba(255,120,60,.16)':'rgba(255,240,214,.22)'; g.fillRect(x+0.6,-w+sag,1.1,br.w);
    g.fillStyle='rgba(10,8,6,.5)'; g.fillRect(x+pw-0.8,-w+sag,0.9,br.w);
    if(rng()<0.12){ g.fillStyle='rgba(20,14,10,.35)'; g.beginPath(); g.ellipse(x+pw*0.5,(rng()-0.5)*w,1.6,2.4,0,0,TAU); g.fill(); }   // a knot
    g.fillStyle='rgba(30,30,34,.7)'; for(const yy of [-w+3.4,w-3.4]){ g.fillRect(x+pw*0.5-0.7,yy+sag-0.7,1.4,1.4); }   // nails over the stringers
    x+=pw; }
  g.beginPath(); g.rect(-L,-w,br.len,br.w); reGrain(g,'wood',0.35,[-L,-w,L,w]);
  if(charred){ g.fillStyle='rgba(255,120,60,.22)'; g.fillRect(-L,-w,4,br.w); g.fillRect(L-4,-w,4,br.w); g.restore(); return true; }
  // a soft darker band along both edges (weathered, damp), lighter where feet wear the middle
  const eg=g.createLinearGradient(0,-w,0,w); eg.addColorStop(0,'rgba(20,24,20,.22)'); eg.addColorStop(0.18,'rgba(20,24,20,0)'); eg.addColorStop(0.5,'rgba(255,240,210,.08)'); eg.addColorStop(0.82,'rgba(20,24,20,0)'); eg.addColorStop(1,'rgba(20,24,20,.25)'); g.fillStyle=eg; g.fillRect(-L,-w,br.len,br.w);
  if(road){
    // rope rails on posts, and stone footings at both ends
    const posts=[]; for(let x=-L+6;x<=L-6;x+=40) posts.push(x); if(posts[posts.length-1]<L-12) posts.push(L-6);
    for(const s of [-1,1]){ const y=s*(w-1);
      g.strokeStyle='rgba(8,10,16,.3)'; g.lineWidth=2.4; g.beginPath(); for(let k=0;k<posts.length-1;k++){ g.moveTo(posts[k]+2,y+3); g.quadraticCurveTo((posts[k]+posts[k+1])/2+2,y+3+s*3.4,posts[k+1]+2,y+3); } g.stroke();
      g.strokeStyle='rgb(176,150,104)'; g.lineWidth=1.8; g.beginPath(); for(let k=0;k<posts.length-1;k++){ g.moveTo(posts[k],y); g.quadraticCurveTo((posts[k]+posts[k+1])/2,y+s*3,posts[k+1],y); } g.stroke();
      g.strokeStyle='rgba(255,246,214,.45)'; g.lineWidth=0.6; g.beginPath(); for(let k=0;k<posts.length-1;k++){ g.moveTo(posts[k],y-0.5); g.quadraticCurveTo((posts[k]+posts[k+1])/2,y-0.5+s*3,posts[k+1],y-0.5); } g.stroke();
      for(const x of posts){ g.fillStyle='rgba(8,10,16,.35)'; g.beginPath(); g.ellipse(x+2.4,y+3,3.6,3,0,0,TAU); g.fill(); g.fillStyle='rgb(70,48,28)'; g.beginPath(); g.ellipse(x,y,3.4,3.2,0,0,TAU); g.fill(); g.fillStyle='rgb(140,108,70)'; g.beginPath(); g.ellipse(x-0.6,y-0.6,2.2,2,0,0,TAU); g.fill(); g.strokeStyle='rgba(60,40,24,.6)'; g.lineWidth=0.5; g.beginPath(); g.arc(x-0.6,y-0.6,1.1,0,TAU); g.stroke(); } }
    for(const e of [-1,1]){ const x0=e*L; for(let k=0;k<5;k++){ const sx=x0+e*(2+rng()*8), sy=(k-2)*w*0.42+(rng()-0.5)*4, r=4+rng()*3.5; g.fillStyle='rgba(8,10,16,.3)'; g.beginPath(); g.ellipse(sx+1.4,sy+2,r,r*0.7,0,0,TAU); g.fill(); g.fillStyle=reRGB(rzJit([128,122,112],rng,0.2)); g.beginPath(); g.ellipse(sx,sy,r,r*0.72,0,0,TAU); g.fill(); g.fillStyle='rgba(255,250,236,.3)'; g.beginPath(); g.ellipse(sx-r*0.25,sy-r*0.3,r*0.5,r*0.32,0,0,TAU); g.fill(); } }
  }else{
    // piles at the corners and every so often along the sides, with a dark wet ring where they meet the water
    for(const s of [-1,1]) for(let x=-L+4;x<=L-4+0.1;x+=Math.max(30,(br.len-8)/Math.max(1,Math.round((br.len-8)/60)))){ const y=s*(w-0.5);
      g.fillStyle='rgba(8,14,22,.3)'; g.beginPath(); g.ellipse(x+1.6,y+2.6,4.4,3.4,0,0,TAU); g.fill();
      g.fillStyle='rgb(62,46,32)'; g.beginPath(); g.arc(x,y,3.6,0,TAU); g.fill(); g.fillStyle='rgb(132,104,72)'; g.beginPath(); g.arc(x-0.5,y-0.5,2.5,0,TAU); g.fill();
      g.strokeStyle='rgba(70,50,30,.6)'; g.lineWidth=0.5; g.beginPath(); g.arc(x-0.5,y-0.5,1.3,0,TAU); g.stroke(); }
  }
  g.restore(); return true;
}
{ const base=drawBridge; drawBridge=function(g,br){ if(LOOK.re&&!LOOK.sb&&reBridge(g,br)) return; return base(g,br); }; }

// ---------- 3. the hand-drawn art of the acts in this look (the standing things of Acts II and III, their story place
// looks, the leftover prop kinds): drawn by their own code with the plum outlines softened (reSoftCtx), then
// repainted as materials by colour (brass brushed and shining with verdigris in its creases, copper and clay, iron
// with rust, weathered wood grain, slate, plaster and chalk with grime toward the ground, glass and ice that shine)
// and relit from the art light with relief and occlusion. The work is cut into small steps that run in the frame's
// spare time (rePump, a few ms a frame), never in one go: until a sprite is ready its Classic one is drawn.
const REA={BRASS:1,CLAY:2,WHITE:3,STONE:4,IRON:5,WOOD:6,SLATE:7,GLASS:8,PAINT:9,SNOW:10,EMIT:11};
// specular strength and power by material (index REA.*)
const REA_SP=[0,0.85,0.16,0.06,0.05,0.5,0.06,0.28,0.85,0.08,0.3,0], REA_PW=[1,22,12,10,10,18,10,16,40,10,26,1];
function reMatClass(r,g,b){
  const mx=r>g?(r>b?r:b):(g>b?g:b), mn=r<g?(r<b?r:b):(g<b?g:b), v=mx/255, s=mx?(mx-mn)/mx:0; let h=0;
  if(mx!==mn){ if(mx===r) h=((g-b)/(mx-mn))%6; else if(mx===g) h=(b-r)/(mx-mn)+2; else h=(r-g)/(mx-mn)+4; h*=60; if(h<0) h+=360; }
  if(v>0.97&&s<0.25) return REA.EMIT;                       // lit windows, flames, the hottest highlights stay as painted
  if(h>=35&&h<=56&&s>0.5&&v>0.5) return REA.BRASS;
  if((h<30||h>350)&&s>0.35&&v>0.28) return REA.CLAY;
  if(h>=18&&h<35&&s>=0.22&&v<0.72) return REA.WOOD;
  if(h>=168&&h<=218&&s>0.12&&v>=0.66) return REA.GLASS;
  if(s<0.14&&v>0.86) return h>=190&&h<=240&&s>0.02?REA.SNOW:REA.WHITE;
  if(s<0.24&&v>0.5) return REA.STONE;
  if(s<0.26&&v<=0.5) return b>=r*0.92?REA.IRON:REA.STONE;
  if(h>=185&&h<=240&&s>0.15) return REA.SLATE;
  return REA.PAINT;
}
// a 2d context for drawing a sprite in this look: the plum outlines (the Storybook outline colour and the hand-drawn
// plum strokes) come out as a thin soft dark edge, and every flat opaque fill is shaded as a form lit from the upper
// left (tall shapes as upright drums, wide ones as walls under the sky, the rest from corner to corner), so the
// relight finds volumes instead of cut paper
const RE_OUT=new Set(['#3b2233','#3b2a2a','#2a1a10','#3a2a20','#2a2a30']);
function reParseCol(v){
  if(typeof v!=='string') return null; let m;
  if(v[0]==='#'){ if(v.length===7) return [parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16),1]; if(v.length===4) return [parseInt(v[1]+v[1],16),parseInt(v[2]+v[2],16),parseInt(v[3]+v[3],16),1]; return null; }
  if((m=/^rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[, /]+([\d.]+))?\)$/.exec(v))) return [+m[1],+m[2],+m[3],m[4]==null?1:+m[4]];
  return null;
}
function reSoftCtx(g,noForm){
  const O=RE_OUT; O.add(String(RE1.real||SBC.outline).toLowerCase());
  let soft=0, bb=[1e9,1e9,-1e9,-1e9];
  const pt=(x,y)=>{ if(x<bb[0]) bb[0]=x; if(y<bb[1]) bb[1]=y; if(x>bb[2]) bb[2]=x; if(y>bb[3]) bb[3]=y; };
  const formed=(t,x0,y0,x1,y1)=>{ if(noForm) return null; const c=reParseCol(t.fillStyle); if(!c||c[3]<0.9) return null; const w=x1-x0, h=y1-y0; if(!(w>2.5&&h>2.5)) return null;
    let gr; const L=reRGB(rzMix(c,[255,248,234],0.16)), B=reRGB(c), D1=reRGB(reK(c,0.86)), D2=reRGB(reK(c,0.72));
    if(h>w*1.6){ gr=t.createLinearGradient(x0,0,x1,0); gr.addColorStop(0,reRGB(reK(c,0.92))); gr.addColorStop(0.22,L); gr.addColorStop(0.45,B); gr.addColorStop(0.8,D1); gr.addColorStop(1,D2); }
    else if(w>h*1.6){ gr=t.createLinearGradient(0,y0,0,y1); gr.addColorStop(0,L); gr.addColorStop(0.4,B); gr.addColorStop(1,D1); }
    else { gr=t.createLinearGradient(x0,y0,x1,y1); gr.addColorStop(0,L); gr.addColorStop(0.45,B); gr.addColorStop(1,D2); }
    return gr; };
  const P=new Proxy(g,{
    get(t,p){
      if(p==='stroke') return (...a)=>{ if(soft){ const lw=t.lineWidth; t.lineWidth=Math.max(0.6,lw*0.5); t.stroke(...a); t.lineWidth=lw; } else t.stroke(...a); };
      if(p==='beginPath') return ()=>{ bb=[1e9,1e9,-1e9,-1e9]; t.beginPath(); };
      if(p==='moveTo'||p==='lineTo') return (x,y)=>{ pt(x,y); t[p](x,y); };
      if(p==='quadraticCurveTo') return (a,b,x,y)=>{ pt(a,b); pt(x,y); t.quadraticCurveTo(a,b,x,y); };
      if(p==='bezierCurveTo') return (a,b,c,d,x,y)=>{ pt(a,b); pt(c,d); pt(x,y); t.bezierCurveTo(a,b,c,d,x,y); };
      if(p==='arcTo') return (a,b,c,d,r)=>{ pt(a,b); pt(c,d); t.arcTo(a,b,c,d,r); };
      if(p==='arc') return (x,y,r,a0,a1,ccw)=>{ pt(x-r,y-r); pt(x+r,y+r); t.arc(x,y,r,a0,a1,ccw); };
      if(p==='ellipse') return (x,y,rx,ry,rot,a0,a1,ccw)=>{ const m=Math.max(rx,ry); pt(x-m,y-m); pt(x+m,y+m); t.ellipse(x,y,rx,ry,rot,a0,a1,ccw); };
      if(p==='rect') return (x,y,w,h)=>{ pt(x,y); pt(x+w,y+h); t.rect(x,y,w,h); };
      if(p==='fill') return (...a)=>{ if(a.length&&typeof a[0]!=='string'){ t.fill(...a); return; } const gr=bb[0]<bb[2]?formed(t,bb[0],bb[1],bb[2],bb[3]):null; if(gr){ const f=t.fillStyle; t.fillStyle=gr; t.fill(...a); t.fillStyle=f; } else t.fill(...a); };
      if(p==='fillRect') return (x,y,w,h)=>{ const gr=formed(t,Math.min(x,x+w),Math.min(y,y+h),Math.max(x,x+w),Math.max(y,y+h)); if(gr){ const f=t.fillStyle; t.fillStyle=gr; t.fillRect(x,y,w,h); t.fillStyle=f; } else t.fillRect(x,y,w,h); };
      if(p==='__target') return t; const v=t[p]; return typeof v==='function'?v.bind(t):v; },
    set(t,p,v){ if((p==='strokeStyle'||p==='fillStyle')&&typeof v==='string'&&O.has(v.toLowerCase())){ if(p==='strokeStyle'){ soft=1; v='rgba(36,28,30,.5)'; } else v='rgba(36,28,30,.42)'; }
      else if(p==='strokeStyle') soft=0;
      t[p]=v; return true; } });
  return P;
}
// the steps of repainting one canvas (sc pixels per world px); yields between rows so the pump can stop any time
function* reArtG(cv,o){
  o=o||{}; const W=cv.width, Hh=cv.height; if(!W||!Hh) return cv;
  const g=cv.getContext('2d'); let id; try{ id=g.getImageData(0,0,W,Hh); }catch(e){ return cv; }
  const d=id.data, n=W*Hh, sc=o.sc||2, h=new Float32Array(n), a=new Float32Array(n), M=new Uint8Array(n), base=o.base!=null?o.base*sc:Hh, gr=o.grime==null?1:o.grime;
  const bump=(o.bump==null?2.6:o.bump), sd=o.seed||7, f1=0.5/sc;
  yield;
  // 1. classify every pixel and lay the material's grain on its colour
  for(let y=0;y<Hh;y++){
    for(let x=0;x<W;x++){ const i=y*W+x, A=d[i*4+3]/255; a[i]=A; if(A<=0) continue;
      let r=d[i*4], gg=d[i*4+1], b=d[i*4+2]; const m=A<0.6?REA.PAINT:reMatClass(r,gg,b); M[i]=m; let k=1;
      const wx=x*f1, wy=y*f1;
      if(m===REA.BRASS) k=1+0.1*(rzVN(wx*0.06+sd,wy*1.4,sd)-0.5)+0.05*(rzHash(x,y,sd)-0.5);
      else if(m===REA.CLAY) k=1+0.12*(rzFbm(wx*0.2,wy*0.2,sd,2)-0.5)+0.06*(rzHash(x>>1,y>>1,sd)-0.5);
      else if(m===REA.WHITE||m===REA.STONE){ k=1+(m===REA.STONE?0.16:0.08)*(rzFbm(wx*0.12,wy*0.12,sd+3,3)-0.5)+0.04*(rzHash(x,y,sd)-0.5)-0.025*(rzVN(wx*0.5,wy*0.03,sd+5)>0.72?1:0);
        const dy=(base-y)/sc; if(dy<14&&dy>-4) k*=1-gr*0.1*(1-Math.max(0,dy)/14); }
      else if(m===REA.IRON){ k=1+0.07*(rzHash(x,y,sd)-0.5); if(Math.abs(r-b)<22&&rzFbm(wx*0.25,wy*0.25,sd+9,2)>0.7){ r=r*0.8+118*0.2; gg=gg*0.8+72*0.2; b=b*0.8+44*0.2; } }
      else if(m===REA.WOOD) k=1+0.16*(rzVN(wx*1.1+sd,wy*0.07,sd)-0.5)+0.07*(rzHash(x>>1,y,sd)-0.5);
      else if(m===REA.SLATE) k=1+0.12*(rzHash(Math.floor(wx/6),Math.floor(wy/4),sd)-0.5)+0.04*(rzHash(x,y,sd)-0.5);
      else if(m===REA.GLASS) k=1+0.08*(0.5-((y%Math.max(4,Math.round(18*sc)))/(18*sc)));
      else if(m===REA.PAINT||m===REA.SNOW) k=1+0.05*(rzHash(x,y,sd)-0.5);
      if(m!==REA.EMIT){ r*=k; gg*=k; b*=k; }
      d[i*4]=r; d[i*4+1]=gg; d[i*4+2]=b;
      h[i]=(0.299*r+0.587*gg+0.114*b)/255*bump; }
    if((y+1)%Math.max(1,Math.floor(2000/W))===0) yield;
  }
  // 2. the relief at the outline, then the blurred height for creases and occlusion
  const tmp=new Float32Array(n), ab=new Float32Array(n), hb=new Float32Array(n), hb2=new Float32Array(n), edge=(o.edge==null?2:o.edge)*sc*0.5;
  rzBlur(a,W,Hh,Math.max(1,Math.round(edge)),ab,tmp); yield;
  for(let i=0;i<n;i++) if(a[i]>0) h[i]+=Math.min(1,ab[i]*1.6)*edge*1.1;
  const rr=Math.max(1,Math.round((o.aoR||2.2)*sc*0.5)); rzBlur(h,W,Hh,rr,hb,tmp); yield; rzBlur(hb,W,Hh,rr,hb2,tmp); yield;
  // 3. light it: art light, occlusion, a cool shade and a warm light, the material's shine, verdigris in brass creases
  const Lx=RZL[0], Ly=RZL[1], Lz=RZL[2], Hx=RZH[0], Hy=RZH[1], Hz=RZH[2], ao=o.ao==null?0.11:o.ao, sat=o.sat==null?0.92:o.sat, flat=Lz*0.85+0.15, gain=o.gain||1;
  for(let y=0;y<Hh;y++){
    for(let x=0;x<W;x++){ const i=y*W+x; if(a[i]<=0) continue; const m=M[i]; if(m===REA.EMIT) continue;
      const hL=x>0?h[i-1]:0, hR=x<W-1?h[i+1]:0, hU=y>0?h[i-W]:0, hD=y<Hh-1?h[i+W]:0;
      let nx=(hL-hR)*0.5, ny=(hU-hD)*0.5; const il=1/Math.sqrt(nx*nx+ny*ny+1); nx*=il; ny*=il; const nz=il;
      const dl=nx*Lx+ny*Ly+nz*Lz, dif=Math.max(0,dl*0.85+0.15)/flat;
      let oc=1+(h[i]-hb2[i])*ao; oc=oc<0.55?0.55:oc>1.12?1.12:oc;
      const kk=(0.44+0.56*dif)*oc*gain, sh=1-Math.min(1,kk);
      let R=d[i*4]*kk, G2=d[i*4+1]*kk, B=d[i*4+2]*kk;
      R+=-10*sh+(kk>1?6*(kk-1):0); G2+=-3*sh+(kk>1?3*(kk-1):0); B+=9*sh-(kk>1?5*(kk-1):0);
      if(m===REA.BRASS&&oc<0.97&&(d[i*4]-d[i*4+2])>d[i*4]*0.55){ const pv=Math.min(1,(0.97-oc)*5)*(rzVN(x*0.09,y*0.09,sd+11)>0.45?1:0.3); R+=(96-R)*pv*0.5; G2+=(150-G2)*pv*0.5; B+=(126-B)*pv*0.5; }
      const sp=REA_SP[m]; if(sp>0){ const nh=nx*Hx+ny*Hy+nz*Hz; if(nh>0){ let s=Math.pow(nh,REA_PW[m])*sp*255*Math.min(1,oc); if(m===REA.SNOW&&rzHash(x,y,7)>0.985) s+=120*dif; R+=s; G2+=s*0.97; B+=s*0.9; } }
      const l=0.299*R+0.587*G2+0.114*B; R=l+(R-l)*sat; G2=l+(G2-l)*sat; B=l+(B-l)*sat;
      d[i*4]=R<0?0:R>255?255:R; d[i*4+1]=G2<0?0:G2>255?255:G2; d[i*4+2]=B<0?0:B>255?255:B; }
    if((y+1)%Math.max(1,Math.floor(2000/W))===0) yield;
  }
  g.putImageData(id,0,0);
  return cv;
}
// the queue of sprites being repainted, worked on in the spare time of each frame (chunkPlan calls rePump)
const REQ={jobs:new Map(),order:[],gen:-1,budget:3,st:{done:0,steps:0,maxStep:0,maxMake:0,ms:0}};
const RET=new Map();   // finished sprites by key (cleared when the look changes)
function reArtGet(key){ if(REQ.gen!==LOOK.gen){ REQ.gen=LOOK.gen; RET.clear(); REQ.jobs.clear(); REQ.order.length=0; } return RET.get(key); }
// ask for a sprite: make() returns {cv, o} (the drawn canvas and the repaint options) and runs when the job starts
function reArtAsk(key,make,pri){
  if(REQ.jobs.has(key)) return; const J={key,make,it:null,cv:null,pri:pri||0}; REQ.jobs.set(key,J); REQ.order.push(J);
}
function rePump(){
  if(!LOOK.re||!REQ.order.length) return;
  const t0=performance.now(), end=t0+REQ.budget;
  while(REQ.order.length&&performance.now()<end){
    // first asked, first painted (a draw asks for what is on screen; the planners ask for what is coming)
    const J=REQ.order[0];
    try{
      if(!J.it){ const tm=performance.now(), r=J.make(); if(!r){ REQ.order.shift(); REQ.jobs.delete(J.key); continue; } J.cv=r.cv; J.fin=r.fin; J.it=reArtG(r.cv,r.o); J.n=0; const dm=performance.now()-tm; if(dm>REQ.st.maxMake){ REQ.st.maxMake=dm; REQ.st.makeKey=J.key; } continue; }
      const ts=performance.now(); const st=J.it.next(); const dt=performance.now()-ts; REQ.st.steps++; J.n++; if(dt>REQ.st.maxStep){ REQ.st.maxStep=dt; REQ.st.stepKey=J.key+'#'+J.n; }
      if(st.done){ REQ.order.shift(); REQ.jobs.delete(J.key); let c=J.cv; if(J.fin) c=J.fin(c)||c; RET.set(J.key,c); REQ.st.done++; }
    }catch(e){ console.error('re art',J.key,e); REQ.order.shift(); REQ.jobs.delete(J.key); }
  }
  REQ.st.ms+=performance.now()-t0;
}
// tests: finish every queued sprite now
function reFlush(){ let n=0; while(REQ.order.length&&n<100000){ const b=REQ.budget; REQ.budget=1e9; rePump(); REQ.budget=b; n++; } }
{ const base=chunkPlan; chunkPlan=function(){ base(); if(LOOK.re) try{ reActPlan(); rePump(); }catch(e){} }; }
// what is coming: every few frames the standing things just outside the view (600 px round it) are drawn once into
// nothing (a clip with no area), which asks for their sprites, so they are usually painted before they show. Kinds
// whose drawing does anything besides drawing (sounds, particles, timers, words) are left out.
const REP={tick:0,pure:new Map()};
function rePure(D){ let v=REP.pure.get(D); if(v==null){ v=!/emit\(|later\(|SFX|ftext|Snd\(|Math\.random|G\.found\.|setBanner|shake\(/.test(String(D._re0||D.draw)); REP.pure.set(D,v); } return v; }
function reActPlan(){
  if(!G||AREA||!player||scene!=='play'||(++REP.tick)%15) return;
  const m=curMap(), A=m===1&&typeof C1WD!=='undefined'?[C1WD,C1K]:m===2&&typeof F2WD!=='undefined'?[F2WD,F2WK]:null; if(!A||!A[0].built) return;
  const [Wd,K]=A, s=Wd.bs, M=600, vx0=cam.x, vy0=cam.y, vx1=cam.x+W/zoom, vy1=cam.y+H/zoom, t=G.time;
  const i0=Math.floor((vx0-M)/s), i1=Math.floor((vx1+M)/s), j0=Math.floor((vy0-M)/s), j1=Math.floor((vy1+M+400)/s);
  ctx.save(); ctx.beginPath(); ctx.rect(0,0,0,0); ctx.clip(); RE1.plan=1;
  try{ for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const b=Wd.bk.get(i+'|'+j); if(!b) continue;
    for(const o of b){ const D=K[o.k]; if(!D||!rePure(D)) continue; if(o.x>vx0-40&&o.x<vx1+40&&o.y>vy0-40&&o.y<vy1+200) continue; try{ D.draw(o,t); }catch(e){} } } }
  finally{ RE1.plan=0; ctx.restore(); }
}
// the Realistic tall sprite for the act modules' cached sprites (c1wTall, f2wTall: w x h world px, base at bx,by).
// The drawing is made at once (as Classic would, with softened outlines and formed fills) and shown as it is until the
// repaint is done; the planner (RE1.plan) only asks, and the pump makes it later.
function reTall(pre,key,w,h,bx,by,draw,base,o){
  const k=pre+key, c=reArtGet(k); if(c) return c;
  const J0=REQ.jobs.get(k); if(J0&&J0.cv) return J0.cv;
  const make=()=>{ const sc=2, cv=mkCanvas(Math.ceil(w*sc),Math.ceil(h*sc)), g0=cv.getContext('2d'); g0.scale(sc,sc); g0.translate(bx,by); g0.lineCap='round'; g0.lineJoin='round';
    const g=reSoftCtx(g0), was=SBC.outline; RE1.paint++; SBC.outline=RE1.real; try{ draw(g); } finally{ RE1.paint--; SBC.outline=was; }
    if(RE_SOOT.test(key)) reSoot(g0,w,h,bx,by);
    cv.ox=bx; cv.oy=by; cv.w2=w; cv.h2=h; cv.ww=w; cv.hh=h;
    return {cv,o:Object.assign({sc,base:by,seed:k.length*31+7},o||{}),fin:c=>{ c.ox=bx; c.oy=by; c.w2=w; c.h2=h; c.ww=w; c.hh=h; return c; }}; };
  reArtAsk(k,make);
  if(RE1.plan) return RE1.empty();
  const J=REQ.jobs.get(k); if(J&&!J.it){ const r=make(); J.cv=r.cv; J.fin=r.fin; J.it=reArtG(r.cv,r.o); J.n=0; return r.cv; }
  return J&&J.cv?J.cv:base();
}
// soot: chimneys, stacks, mills and the works darken toward their tops (laid over the drawn pixels only)
const RE_SOOT=/^(chim|stack|mill|works|smoke|forge|kiln)/;
function reSoot(g,w,h,bx,by){ g.save(); g.globalCompositeOperation='source-atop'; const gr=g.createLinearGradient(0,-by,0,-by+h*0.45); gr.addColorStop(0,'rgba(24,20,20,.55)'); gr.addColorStop(0.35,'rgba(30,26,24,.22)'); gr.addColorStop(1,'rgba(30,26,24,0)'); g.fillStyle=gr; g.fillRect(-bx,-by,w,h*0.45);
  for(let i=0;i<5;i++){ const x=-bx+w*(0.15+i*0.17), sg=g.createLinearGradient(0,-by,0,-by+h*0.6); sg.addColorStop(0,'rgba(20,16,16,.18)'); sg.addColorStop(1,'rgba(20,16,16,0)'); g.fillStyle=sg; g.fillRect(x,-by,w*0.04,h*0.6); } g.restore(); }
const RE1={paint:0,plan:0,kind:0,real:null,ecv:null,empty(){ if(!RE1.ecv){ RE1.ecv=mkCanvas(2,2); RE1.ecv.ox=RE1.ecv.oy=0; RE1.ecv.w2=RE1.ecv.h2=1; } return RE1.ecv; }};
// the outline colour the drawings ask for: while an act's standing thing draws itself in this look (its live parts:
// sails, belts, chains, boats, flags), SBC.outline is a soft dark instead of Storybook's plum
const RE_SOFTO='rgba(36,28,30,.45)';
function reSoftly(D){ if(!D||D._re0) return; const b=D.draw; D._re0=b; D.draw=function(o,t){ if(!LOOK.re||LOOK.sb) return b.call(this,o,t); const was=SBC.outline; if(RE1.real==null) RE1.real=was; SBC.outline=RE_SOFTO; try{ return b.call(this,o,t); } finally{ SBC.outline=was; } }; }
function reSoftFn(name,fn){ return function(...a){ if(!LOOK.re||LOOK.sb) return fn.apply(this,a); const was=SBC.outline; if(RE1.real==null) RE1.real=was; SBC.outline=RE_SOFTO; try{ return fn.apply(this,a); } finally{ SBC.outline=was; } }; }
for(const K of [C1K,F2WK]) for(const k in K) reSoftly(K[k]);
// while a sprite is drawn for this look, the cel helpers shade softly (one tone with a gradient from the lit top left)
// instead of in flat bands, so the relight above finds round forms rather than steps
function reGradFill(g,path,col,x0,y0,x1,y1,k){
  const c=typeof col==='string'?hexRGB(col.length===7?col:'#808080'):col, gr=g.createLinearGradient(x0,y0,x1,y1);
  gr.addColorStop(0,reRGB(rzMix(c,[255,248,232],0.2*k))); gr.addColorStop(0.45,reRGB(c)); gr.addColorStop(1,reRGB(reK(c,1-0.3*k)));
  g.fillStyle=gr; g.beginPath(); path(g,0,0); g.fill();
}
{ const base=celFill; celFill=function(g,path,col,o){ if(!RE1.paint||!LOOK.re||typeof col!=='string'||col[0]!=='#') return base(g,path,col,o);
  const R=(o&&o.r)||16; return reGradFill(g,path,col,-R,-R,R,R,1); }; }
{ const base=celBall; celBall=function(g,x,y,r,col,tones){ if(!RE1.paint||!LOOK.re||typeof col!=='string'||col[0]!=='#') return base(g,x,y,r,col,tones);
  const c=hexRGB(col.length===7?col:'#808080'), gr=g.createRadialGradient(x-r*0.35,y-r*0.4,r*0.1,x,y,r); gr.addColorStop(0,reRGB(rzMix(c,[255,250,236],0.35))); gr.addColorStop(0.55,reRGB(c)); gr.addColorStop(1,reRGB(reK(c,0.62)));
  g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }; }
// boxes: a soft light from the left over the face, a darker right edge
{ const base=c1Shade; c1Shade=function(g,x,y,w,h,col){ if(!RE1.paint||!LOOK.re||typeof col!=='string'||col[0]!=='#') return base(g,x,y,w,h,col); reGradFill(g,q=>q.rect(x,y,w,h),col,x,y,x+w,y+h*0.25,0.9); }; }
{ const base=f2wShade; f2wShade=function(g,x,y,w,h,col,r){ if(!RE1.paint||!LOOK.re||typeof col!=='string'||col[0]!=='#') return base(g,x,y,w,h,col,r); reGradFill(g,q=>{ if(r) rrect(q,x,y,w,h,r); else q.rect(x,y,w,h); },col,x,y,x+w,y+h*0.25,0.9); }; }
// snow on the north's roofs, caps and ledges: one soft drift with a blue shade under it and a lit crest, instead of a
// row of balls (the same random numbers are drawn, so the rest of the sprite is laid out as before)
{ const base=f2wSnowCap; f2wSnowCap=function(g,x0,x1,y,th,rng){ if(!RE1.paint||!LOOK.re) return base(g,x0,x1,y,th,rng);
  const n=Math.max(2,Math.round((x1-x0)/9)), R=[]; for(let i=0;i<=n;i++) R.push(rng?rng():0.5);
  const top=i=>y-th*(0.55+R[i]*0.5), X=i=>lerp(x0,x1,i/n), drift=(dy,sh)=>{ g.beginPath(); g.moveTo(x0-th*0.5,y+th*0.55+dy); g.lineTo(x0-th*0.3,top(0)+th*0.4+dy);
    for(let i=0;i<n;i++){ const xm=(X(i)+X(i+1))/2; g.quadraticCurveTo(X(i),top(i)+dy,xm,(top(i)+top(i+1))/2+th*0.12+dy); }
    g.quadraticCurveTo(X(n),top(n)+dy,x1+th*0.3,top(n)+th*0.4+dy); g.lineTo(x1+th*0.5,y+th*0.55+dy); g.quadraticCurveTo((x0+x1)/2,y+th*(sh||0.95)+dy,x0-th*0.5,y+th*0.55+dy); g.closePath(); };
  g.fillStyle='rgba(104,124,168,.5)'; drift(th*0.45,1.2); g.fill();
  const gr=g.createLinearGradient(0,y-th,0,y+th); gr.addColorStop(0,'#fbfdff'); gr.addColorStop(0.55,'#e6eef8'); gr.addColorStop(1,'#b8c8de'); g.fillStyle=gr; drift(0); g.fill();
  g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=Math.max(0.8,th*0.22); g.beginPath(); for(let i=0;i<=n;i++){ const xx=X(i), yy=top(i)+th*0.12; i?g.lineTo(xx,yy):g.moveTo(xx,yy); } g.stroke();
}; }
// Act II and Act III standing things (C1K, F2WK and every other cached tall sprite of x1_world.js and x2_world.js)
{ const base=c1wTall; c1wTall=function(key,w,h,bx,by,draw,ow){ if(LOOK.re&&!LOOK.sb) return reTall('c1:',key,w,h,bx,by,draw,()=>base(key,w,h,bx,by,draw,ow)); return base(key,w,h,bx,by,draw,ow); }; }
{ const base=f2wTall; f2wTall=function(key,w,h,bx,by,draw,ow){ if(LOOK.re&&!LOOK.sb) return reTall('f2:',key,w,h,bx,by,draw,()=>base(key,w,h,bx,by,draw,ow)); return base(key,w,h,bx,by,draw,ow); }; }

// the Act III powers' standing things outdoors (frozen folk, ice, locks, braziers, drums, bells: p3Spr sprites); in
// caves they stay as they are (interiors and caves are another artist's)
{ const base=p3Spr; p3Spr=function(key,w,h,draw,ow){ if(!LOOK.re||LOOK.sb||AREA) return base(key,w,h,draw,ow); const pad=8; return reTall('p3:',key,w+pad*2,h+pad*2,pad+w/2,pad+h,draw,()=>base(key,w,h,draw,ow)); }; }
// the Act II powers' grapple posts and rings: brass on a stone footing, painted for this look
function reP2Post(){ return rzCache('p2post',()=>{ const F=rzSq(32);
  rzContact(F,2,23,13,5.5,0.42);
  rzBox(F,0,19.5,20,7,0,4.5,1.6,[112,108,118],RZ.ROCK,rzStoneTx(3));
  rzCap(F,0,17,4.5,0,-15,4.5,4.4,4.1,[204,156,66],RZ.METAL,(t,u)=>0.9+0.12*Math.cos(u*3));
  for(const y of [-7,7]) rzBox(F,0,y,10,2.6,0,9.4,0.5,[146,104,40],RZ.METAL);
  for(let i=0;i<20;i++){ const a0=i/20*TAU, a1=(i+1)/20*TAU, r=7.6; rzCap(F,Math.cos(a0)*r,-24+Math.sin(a0)*r,6,Math.cos(a1)*r,-24+Math.sin(a1)*r,6,1.9,1.9,[232,184,84],RZ.METAL); }
  rzDome(F,0,-14,2.2,2.2,0,9.6,1.4,[58,140,140],RZ.GLOSS);
  return rzShade(F,{ao:0.12,aoR:1.2,rim:0.3}); }); }
function reP2Ring(){ return rzCache('p2ring',()=>{ const F=rzSq(18);
  for(let i=0;i<22;i++){ const a0=i/22*TAU, a1=(i+1)/22*TAU, r=9; rzCap(F,Math.cos(a0)*r,4+Math.sin(a0)*r,4,Math.cos(a1)*r,4+Math.sin(a1)*r,4,2.2,2.2,[226,178,80],RZ.METAL); }
  rzBox(F,0,-7,6,6,0,5,1,[160,122,48],RZ.METAL);
  return rzShade(F,{ao:0.1,aoR:1,rim:0.3}); }); }
{ const base=p2PostSprite; p2PostSprite=function(){ return LOOK.re&&!AREA?reP2Post():base(); }; }
{ const base=p2RingSprite; p2RingSprite=function(){ return LOOK.re&&!AREA?reP2Ring():base(); }; }
// rings, chain rings, crates and drawbridges outdoors: their dark outlines are drawn soft (the Storybook branch asks
// for SBC.outline, which is the soft dark while they draw)
{ const W=fn=>function(...a){ if(!LOOK.re||LOOK.sb||AREA) return fn.apply(this,a); const was=SBC.outline; if(RE1.real==null) RE1.real=was; LOOK.sb=true; SBC.outline=RE_SOFTO; try{ return fn.apply(this,a); } finally{ LOOK.sb=false; SBC.outline=was; } };
  p2DrawRing=W(p2DrawRing); p2DrawChainRing=W(p2DrawChainRing); p2DrawCrate=W(p2DrawCrate); p2DrawBridge=W(p2DrawBridge); }

// the story place looks of Acts II and III (v10_art2a, 2b, 2s, 3a, 3b, 3s and the pilot's v10_art_eng): those files
// call reLooksAt() before their looks and reLooksMine() after them, so only their looks are repainted here. They run
// at load time, before this module's constants exist, so they keep their list on window.
function reLooksAt(){ const W=window.__re23L||(window.__re23L={mine:new Set(),pre:null}); W.pre=new Set(Object.keys(LOOKS)); }
function reLooksMine(){ const W=window.__re23L; if(!W||!W.pre) return; for(const k of Object.keys(LOOKS)) if(!W.pre.has(k)) W.mine.add(k); W.pre=null; }
const reLookMine=id=>{ const W=window.__re23L; return !!(W&&W.mine.has(id))&&!/^icon_/.test(id); };
{ const base=gtLookSprite; gtLookSprite=function(id,L,state){
  if(!LOOK.re||LOOK.sb||!reLookMine(id)) return base(id,L,state);
  const pad=10, Wd=Math.ceil(L.w*2+pad*2), Hd=Math.ceil(L.h*2+pad*2), cx=Wd/2, cy=Hd/2+L.h*0.25;
  return reTall('lk:',id+'|'+(state==null?'':state),Wd,Hd,cx,cy,g=>L.draw(g,0,0,0,state),()=>base(id,L,state));
}; }
// the looks that move (anim) draw every frame: through the softening context, outlines only
{ const base=lookDraw; lookDraw=function(a,b,x,y,t,state){
  const id=typeof a==='string'?a:b, L=LOOKS[id];
  if(!LOOK.re||LOOK.sb||!L||!L.anim||!reLookMine(id)) return base(a,b,x,y,t,state);
  const g0=typeof a!=='string'&&typeof b==='string'?a:b, g=reSoftCtx(g0||ctx,true), was=SBC.outline; if(RE1.real==null) RE1.real=was; SBC.outline=RE_SOFTO;
  try{ return typeof a==='string'?base(a,g,x,y,t,state):base(g,b,x,y,t,state); } finally{ SBC.outline=was; }
}; }

// ---------- 4. the acts' ground art (ELEV.deco paints: town floors, quays, plazas, rails, fields, roofs, the Great
// Clock's face, causeways...): painted through the same softening context (no plum outlines; each opaque stone, tile
// and slab shaded from the upper left), with the real outline colour asked for by name turned soft
function reDeco(d,g,x0,y0,x1,y1,ch){
  const was=SBC.outline; if(RE1.real==null) RE1.real=was; SBC.outline=RE_SOFTO; RE1.paint++;
  try{ return d.paint(reSoftCtx(g),x0,y0,x1,y1,ch); } finally{ RE1.paint--; SBC.outline=was; }
}

// ---------- 5. the prop kinds of maps 1 and 2 that were only relit (PROPS_NOTES): their own drawing through the
// softening context, repainted as materials and relit like the standing things (small sprites, so it runs whole in
// the idle painter); the showpieces below have height-field makers of their own
{ const base=spriteOf; spriteOf=function(R,draw){ if(!RE1.kind||!LOOK.re) return base(R,draw); return base(R,g=>{ const was=SBC.outline; SBC.outline=RE1.real||was; RE1.paint++; try{ draw(reSoftCtx(g)); } finally{ RE1.paint--; SBC.outline=was; } }); }; }
function reKindArt(kind,o){ return (seed,v,d)=>{ RE1.kind++; let c; try{ c=d.make(seed,v); } finally{ RE1.kind--; } if(!c) return c; const it=reArtG(c,Object.assign({sc:SS,base:c.height/SS*0.62,seed:seed&1023,bump:2.2,edge:1.6,aoR:1.6},o||{})); let r; do{ r=it.next(); }while(!r.done); if(!c.half) c.half=c.width/4; return c; }; }
for(const k of ['c_gear','c_scrap','c_pipe','c_kelp','c_shroom','c_driftwood','c_nest','c_crabpot','c_netpole','c_mooring','c_boat','c_standstone','c_crate','c_barrel','c_haybale','c_lamppost','c_blackrock',
  'f_iceshard','f_violetice','f_dreadspire','f_haystack','f_fishrack','f_cairn','f_mammothrib','f_geyser','f_isleflower','f_lanternpost']){
  const K=RZK[k]||(RZK[k]={}); if(!K.make){ K.make=reKindArt(k); K.n=K.n||0; } }
// a crystal lying in the picture plane: from (x,y) toward angle a, len long and wid wide at its base, a sharp ridge
// down its middle (lit on the side toward the light) rising zh above z0
function rePrism(F,x,y,a,len,wid,z0,zh,col,m){
  const cs=Math.cos(a), sn=Math.sin(a), tx=x+cs*len, ty=y+sn*len, px=-sn, py=cs;
  const pts=[[x+px*wid,y+py*wid],[x+cs*len*0.72+px*wid*0.6,y+sn*len*0.72+py*wid*0.6],[tx,ty],[x+cs*len*0.72-px*wid*0.6,y+sn*len*0.72-py*wid*0.6],[x-px*wid,y-py*wid]];
  rzPoly(F,pts,(X,Y)=>{ const u=((X-x)*cs+(Y-y)*sn)/len, v=Math.abs((X-x)*px+(Y-y)*py), w=wid*(u<0.72?1-u*0.55:0.6*(1-u)/0.28)+0.01; return z0+zh*(1-u*0.6)*Math.max(0,1-v/w); },col,m);
}
function reMkIce(seed,v,vio){ const R=vio?24:22, rng=mulberry32(seed), F=rzSq(R);
  rzContact(F,2,6,R*0.85,R*0.34,0.35);
  const base=vio?[150,120,210]:[150,200,232], deep=vio?[86,60,140]:[70,130,190], n=(vio?5:4)+v, L=[];
  for(let i=0;i<n;i++){ const x=(rng()-0.5)*R*(vio?0.6:1.1), a=-Math.PI/2+(rng()-0.5)*(vio?1.6:0.5), len=R*(0.65+rng()*0.65), w=3.5+rng()*4.5, y=4+(rng()-0.5)*6; L.push([x,y,a,len,w]); }
  L.sort((p,q)=>p[1]-q[1]);
  for(const [x,y,a,len,w] of L) rePrism(F,x,y,a,len,w,2,6+len*0.25,rzMix(base,deep,rng()*0.5),RZ.WET);
  // deep colour toward the base inside each crystal, bright facets toward the tip
  rzEach(F,(x,y,id)=>{ if(F.m[id]!==RZ.WET) return; const k=clamp((y+R*0.2)/(R*0.9),0,1); F.c[id*3]=lerp(F.c[id*3],deep[0],k*0.45); F.c[id*3+1]=lerp(F.c[id*3+1],deep[1],k*0.45); F.c[id*3+2]=lerp(F.c[id*3+2],deep[2],k*0.3); });
  rzDome(F,0,6,R*0.62,3.6,0,0.4,2.2,[236,242,250],RZ.SNOW);
  return rzShade(F,{ao:0.12,aoR:1.2,rim:0.25}); }
function reMkSpire(seed,R,pal,frost){ const rng=mulberry32(seed), F=rzSq(R), n=6+Math.floor(rng()*2), pts=[], tip=[-R*0.14,-R*0.2];
  rzContact(F,3,4,R*0.85,R*0.65,0.4);
  for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.3; pts.push([Math.cos(a)*R*(0.72+rng()*0.25),Math.sin(a)*R*(0.68+rng()*0.25)]); }
  for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], c=rzJit(pal,rng,0.25);
    rzPoly(F,[a,b,tip],(X,Y)=>{ const dd=Math.hypot(X-tip[0],Y-tip[1]), dm=Math.max(1,(Math.hypot(a[0]-tip[0],a[1]-tip[1])+Math.hypot(b[0]-tip[0],b[1]-tip[1]))/2); return 2+R*0.9*Math.max(0,1-dd/dm); },c,RZ.GLOSS); }
  if(frost) rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.GLOSS&&rzVN(x*0.18,y*0.18,seed)>0.6&&x+y<-R*0.35&&F.h0[id]>R*0.3*F.k){ F.c[id*3]=236; F.c[id*3+1]=242; F.c[id*3+2]=252; F.m[id]=RZ.SNOW; } else if(F.m[id]===RZ.GLOSS&&Math.abs(rzVN(x*0.12,y*0.12,seed+3)-0.5)<0.025){ F.c[id*3]=frost[0]; F.c[id*3+1]=frost[1]; F.c[id*3+2]=frost[2]; } });
  return rzShade(F,{ao:0.14,aoR:1.6,rim:0.3}); }
function reMkBale(seed,v,snow){ const R=snow?17:15, F=rzSq(R), rng=mulberry32(seed);
  rzContact(F,2,R*0.45,R,R*0.4,0.4);
  if(!snow){ rzDome(F,0,0,R,R,0,0,R*0.8,[214,172,82],RZ.CLOTH,0.8);
    rzEach(F,(x,y,id)=>{ const r=Math.hypot(x,y), a=Math.atan2(y,x), s=Math.sin(r*1.35-a*0.95), f=0.86+0.1*s+0.08*(rzHash(Math.floor(x*3),Math.floor(y*3),seed)-0.5); F.c[id*3]*=f; F.c[id*3+1]*=f; F.c[id*3+2]*=f*0.96; });
    rzBox(F,0,-3,R*2,1.6,0,R*0.82,0.3,[120,80,40],RZ.CLOTH); }
  else{ rzPoly(F,[[-R,R*0.4],[-R*0.92,-R*0.1],[-R*0.7,-R*0.62],[-R*0.35,-R*0.92],[0,-R],[R*0.35,-R*0.92],[R*0.7,-R*0.62],[R*0.92,-R*0.1],[R,R*0.4]],(X,Y)=>2+R*0.8*(1-Math.abs(X)/R)*(0.6+0.4*(R*0.4-Y)/(R*1.4)),(X,Y)=>{ const f=0.85+0.15*Math.sin(X*0.9+Y*0.3)+0.06*(rzHash(Math.floor(X*2),Math.floor(Y*2),seed)-0.5); return [206*f,162*f,80*f]; },RZ.CLOTH);
    rzDome(F,-1,-R*0.5,R*0.66,R*0.42,0,R*0.5,R*0.38,[238,244,252],RZ.SNOW,0.7);
    for(let i=0;i<7;i++){ const x=-R*0.55+i*R*0.18; rzCap(F,x,-R*0.2,R*0.5,x+0.2,-R*0.2+3+rng()*4,R*0.45,0.9,0.2,[200,228,246],RZ.WET); } }
  return rzShade(F,{ao:0.12,aoR:1.4,rim:0.3}); }
function reMkCrate(seed,v){ const F=rzSq(12); rzContact(F,3,6,10.5,4.4,0.42);
  const c=v?[166,124,76]:[142,106,64]; rzBox(F,0,-2,18,16,0,9,1.2,c,RZ.WOOD,rzWoodTx(seed&63,true));
  for(const [x,y,w,h] of [[0,-9.4,18,2.4],[0,5.4,18,2.4],[-8,-2,2.4,16],[8,-2,2.4,16]]) rzBox(F,x,y,w,h,0,10,0.5,reK(c,0.78),RZ.WOOD);
  rzCap(F,-7,-8,10.2,7,4,10.2,1.1,1.1,reK(c,0.82),RZ.WOOD);
  return rzShade(F,{ao:0.14,aoR:1.2,rim:0.35}); }
function reMkBarrel(seed,v){ const F=rzSq(11); rzContact(F,2,5,9,3.8,0.42);
  const c=v?[138,90,50]:[122,86,52]; rzDome(F,0,0,8,10,0,0,8,c,RZ.WOOD,0.6);
  rzEach(F,(x,y,id)=>{ const f=0.86+0.16*(rzVN(x*1.4+seed,y*0.2,seed)); F.c[id*3]*=f; F.c[id*3+1]*=f; F.c[id*3+2]*=f; });
  for(const y of [-3,4]) rzCap(F,-7.6,y,6,7.6,y,6,1,1,[176,136,64],RZ.METAL);
  rzDome(F,0,-7,6.4,2.8,0,7.2,0.8,[160,122,78],RZ.WOOD,0.4); rzDome(F,0,-7,4.6,1.8,0,7.6,0.3,[96,70,44],RZ.WOOD,0.4);
  return rzShade(F,{ao:0.12,aoR:1,rim:0.35}); }
Object.assign(RZK.f_iceshard,{n:3,make:(s,v)=>reMkIce(s,v,false)}); Object.assign(RZK.f_violetice,{n:3,make:(s,v)=>reMkIce(s,v,true)});
Object.assign(RZK.f_dreadspire,{n:3,make:s=>reMkSpire(s,38,[52,44,66],[176,140,240])}); Object.assign(RZK.c_blackrock,{n:3,make:s=>reMkSpire(s,30,[44,40,58],null)});
Object.assign(RZK.c_haybale,{n:2,make:(s,v)=>reMkBale(s,v,false)}); Object.assign(RZK.f_haystack,{n:2,make:(s,v)=>reMkBale(s,v,true)});
Object.assign(RZK.c_crate,{n:2,make:(s,v)=>reMkCrate(s,v)}); Object.assign(RZK.c_barrel,{n:2,make:(s,v)=>reMkBarrel(s,v)});

// ---------- debug and tests
window.__ebDbg=Object.assign(window.__ebDbg||{},{re23:{bridges:()=>BRIDGES.map(b=>[Math.round(b.x),Math.round(b.y),b.kind,Math.round(b.len),b.w,b.map]),REQ,RET,flush:reFlush,kinds:(list,sc)=>{ const L=[]; for(const k of list){ const d=PROPK[k], K=RZK[k]; if(!d) continue; const n=K&&K.make?Math.max(d.n,K.n||0):d.n; for(let v=0;v<n;v++){ const c=rzKindOne(k,d,v); if(c) L.push(c); } } sc=sc||2; const cell=Math.max(...L.map(c=>c.width/SS*sc))+6, cols=Math.min(10,L.length), cv=mkCanvas(cols*cell,Math.ceil(L.length/cols)*cell), g=cv.getContext('2d'); g.fillStyle='#8a9068'; g.fillRect(0,0,cv.width,cv.height); L.forEach((c,i)=>g.drawImage(c,(i%cols)*cell,Math.floor(i/cols)*cell,c.width/SS*sc,c.height/SS*sc)); return cv.toDataURL(); },
  // a sheet of finished act sprites (keys starting with pre), on a mid grey, for looking at them closely
  sheet(pre,sc,maxW){ reFlush(); const L=[...RET.entries()].filter(([k])=>k.startsWith(pre||'')).map(e=>e[1]).sort((p,q)=>q.height-p.height); if(!L.length) return null; sc=sc||1; maxW=maxW||1600;
    const pos=[]; let x=4,y=4,rh=0,W2=0; for(const c of L){ const w=c.width*sc/2, h=c.height*sc/2; if(x+w>maxW){ x=4; y+=rh+6; rh=0; } pos.push([x,y,w,h]); x+=w+6; rh=Math.max(rh,h); W2=Math.max(W2,x); }
    const cv=mkCanvas(Math.ceil(W2),Math.ceil(y+rh+4)), g=cv.getContext('2d'); g.fillStyle='#8a8a7a'; g.fillRect(0,0,cv.width,cv.height); L.forEach((c,i)=>g.drawImage(c,pos[i][0],pos[i][1],pos[i][2],pos[i][3])); return cv.toDataURL(); }}});
