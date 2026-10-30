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
