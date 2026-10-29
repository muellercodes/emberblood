
// ================= (v12 wave 10) PROPS: the Realistic look's trees, plants, rocks, houses and structures
// Only LOOK.re uses anything in this file; Storybook and Classic never reach it. Sprites are painted once into
// cached canvases by a small height-field renderer: every leaf, bough, branch, stone and plank is stamped as a
// little dome or cylinder (height, colour, material), then one pass lights the whole sprite from the fixed art
// light (upper left, soft, slightly warm) with ambient occlusion from the blurred height, translucent leaf edges
// and a little specular. Sizes, anchors (c.half, c.ox/c.oy) and footprints match the Classic sprites, so
// collision and depth sorting never move. No cast shadows are baked (LIGHT draws them); contact occlusion at the
// base of things is. Every cache here is keyed by LOOK.gen (rzCache) or rebuilt by buildSprites.

// ---------- the art light, ambient and materials
const RZL=(()=>{ const v=[-0.5,-0.62,0.6], l=Math.hypot(v[0],v[1],v[2]); return [v[0]/l,v[1]/l,v[2]/l]; })();
const RZH=(()=>{ const v=[RZL[0],RZL[1],RZL[2]+1], l=Math.hypot(v[0],v[1],v[2]); return [v[0]/l,v[1]/l,v[2]/l]; })();
const RZAMB=[0.52,0.58,0.68], RZSUN=[1.0,0.95,0.83];
// material ids for the stamps: wrap (soft light), spec strength and power, leaf translucency
const RZ={LEAF:1,BARK:2,ROCK:3,GLOSS:4,SNOW:5,EMIT:6,NEEDLE:7,WET:8,BONE:9,CLOTH:10,METAL:11,WOOD:12,PLAIN:0};
const RZM=[
  {w:0.3,sp:0.04,pw:10,tr:0},     // 0 plain
  {w:0.45,sp:0.07,pw:14,tr:0.55}, // 1 leaf
  {w:0.2,sp:0.03,pw:8,tr:0},      // 2 bark
  {w:0.16,sp:0.06,pw:10,tr:0},    // 3 rock
  {w:0.1,sp:0.9,pw:46,tr:0},      // 4 gloss (obsidian, berries)
  {w:0.4,sp:0.22,pw:22,tr:0,snow:1}, // 5 snow
  {w:0,sp:0,pw:1,tr:0,emit:1},    // 6 emissive
  {w:0.32,sp:0.06,pw:12,tr:0.22}, // 7 needles
  {w:0.2,sp:0.55,pw:30,tr:0},     // 8 wet, glass, water
  {w:0.3,sp:0.18,pw:16,tr:0},     // 9 bone, ivory
  {w:0.45,sp:0.02,pw:6,tr:0.1},   // 10 cloth, straw
  {w:0.12,sp:0.75,pw:26,tr:0},    // 11 metal
  {w:0.24,sp:0.05,pw:10,tr:0}     // 12 sawn wood
];

// ---------- hashed noise
function rzHash(x,y,s){ let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
function rzVN(x,y,s){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=rzHash(xi,yi,s), b=rzHash(xi+1,yi,s), c=rzHash(xi,yi+1,s), d=rzHash(xi+1,yi+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function rzFbm(x,y,s,o){ let t=0,a=0.5,f=1,n=0; for(let i=0;i<(o||3);i++){ t+=a*rzVN(x*f,y*f,s+i*17); n+=a; a*=0.5; f*=2.03; } return t/n; }
const rzCol=(c,k)=>k>=0?[c[0]+(255-c[0])*k,c[1]+(255-c[1])*k,c[2]+(255-c[2])*k]:[c[0]*(1+k),c[1]*(1+k),c[2]*(1+k)];
const rzMix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const rzJit=(c,rng,a)=>{ const k=(rng()-0.5)*a; return [c[0]*(1+k),c[1]*(1+k*0.9),c[2]*(1+k*0.8)]; };
const rzHex=h=>typeof h==='string'?hexRGB(h):h;

// ---------- the height field: W x H pixels at k pixels per world px, world origin at (ox,oy)
function rzHF(w,h,ox,oy){ const k=SS, W=Math.ceil(w*k), Hp=Math.ceil(h*k), n=W*Hp;
  return {k,W,Hp,n,w,h,ox,oy,h0:new Float32Array(n),a:new Float32Array(n),c:new Float32Array(n*3),m:new Uint8Array(n)}; }
// the square field of a prop sprite: the same canvas size and half as spriteOf(R) in a3_art.js
function rzSq(R,pad){ const half=R+(pad==null?8:pad); const F=rzHF(half*2,half*2,half,half); F.half=half; return F; }
function rzPut(F,id,z,col,m){ if(z>F.h0[id]){ F.h0[id]=z; F.c[id*3]=col[0]; F.c[id*3+1]=col[1]; F.c[id*3+2]=col[2]; F.m[id]=m; } }
// a dome: an ellipse footprint (rx, ry, turned by rot) rising zh above z0 (pw flattens the top when < 1)
function rzDome(F,x,y,rx,ry,rot,z0,zh,col,m,pw){
  const k=F.k, W=F.W, cx=(x+F.ox)*k, cy=(y+F.oy)*k, Rx=Math.max(0.6,rx*k), Ry=Math.max(0.6,ry*k), rr=Math.max(Rx,Ry)+1;
  const x0=Math.max(0,Math.floor(cx-rr)), x1=Math.min(W-1,Math.ceil(cx+rr)), y0=Math.max(0,Math.floor(cy-rr)), y1=Math.min(F.Hp-1,Math.ceil(cy+rr));
  const cs=Math.cos(rot||0), sn=Math.sin(rot||0), iz0=z0*k, izh=zh*k, iRx=1/Rx, iRy=1/Ry, mr=Math.min(Rx,Ry), H=F.h0, A=F.a, C=F.c, M=F.m;
  for(let j=y0;j<=y1;j++){ const dy=j+0.5-cy; for(let i=x0;i<=x1;i++){ const dx=i+0.5-cx, u=(dx*cs+dy*sn)*iRx, v=(dy*cs-dx*sn)*iRy, q=u*u+v*v; if(q>=1) continue;
    const id=j*W+i, s=Math.sqrt(1-q), z=Math.max(0.05,iz0+izh*(pw?Math.pow(s,pw):s)), cov=(1-Math.sqrt(q))*mr+0.35;
    if(cov>A[id]) A[id]=cov>1?1:cov;
    if(z>H[id]){ H[id]=z; C[id*3]=col[0]; C[id*3+1]=col[1]; C[id*3+2]=col[2]; M[id]=m; } } }
}
// a round branch: a tapered cylinder from (x0,y0) at height z0 to (x1,y1) at z1; tex(t,u,len) returns a colour
// factor along (t 0..1) and across (u -1..1) for bark and grain
function rzCap(F,x0,y0,z0,x1,y1,z1,r0,r1,col,m,tex,flat){
  const k=F.k, W=F.W, ax=(x0+F.ox)*k, ay=(y0+F.oy)*k, bx=(x1+F.ox)*k, by=(y1+F.oy)*k, R0=Math.max(0.5,r0*k), R1=Math.max(0.5,r1*k), rr=Math.max(R0,R1)+1;
  const vx=bx-ax, vy=by-ay, L2=vx*vx+vy*vy||1e-6, L=Math.sqrt(L2), len=L/k, fz=flat==null?1:flat;
  const X0=Math.max(0,Math.floor(Math.min(ax,bx)-rr)), X1=Math.min(W-1,Math.ceil(Math.max(ax,bx)+rr)), Y0=Math.max(0,Math.floor(Math.min(ay,by)-rr)), Y1=Math.min(F.Hp-1,Math.ceil(Math.max(ay,by)+rr));
  const H=F.h0, A=F.a, C=F.c, M=F.m;
  for(let j=Y0;j<=Y1;j++) for(let i=X0;i<=X1;i++){
    const wx=i+0.5-ax, wy=j+0.5-ay; let t=(wx*vx+wy*vy)/L2; t=t<0?0:t>1?1:t;
    const qx=wx-vx*t, qy=wy-vy*t, d2=qx*qx+qy*qy, r=R0+(R1-R0)*t; if(d2>=r*r) continue;
    const d=Math.sqrt(d2), id=j*W+i, z=Math.max(0.05,(z0+(z1-z0)*t)*k+r*fz*Math.sqrt(1-d2/(r*r))), cov=r-d+0.35;
    if(cov>A[id]) A[id]=cov>1?1:cov;
    if(z>H[id]){ let f=1; if(tex){ const u=(wx*vy-wy*vx)/L/r; f=tex(t,u,len); } H[id]=z; C[id*3]=col[0]*f; C[id*3+1]=col[1]*f; C[id*3+2]=col[2]*f; M[id]=m; }
  }
}
// a flat leaf: a pointed ellipse (rx along rot, ry across) tilted by the slope (gx, gy) so each leaf catches the
// light as one facet, with a little cup in the middle
function rzLeaf(F,x,y,rx,ry,rot,z0,gx,gy,col,m){
  const k=F.k, W=F.W, cx=(x+F.ox)*k, cy=(y+F.oy)*k, Rx=Math.max(0.6,rx*k), Ry=Math.max(0.6,ry*k), rr=Rx+1;
  const x0=Math.max(0,Math.floor(cx-rr)), x1=Math.min(W-1,Math.ceil(cx+rr)), y0=Math.max(0,Math.floor(cy-rr)), y1=Math.min(F.Hp-1,Math.ceil(cy+rr));
  const cs=Math.cos(rot), sn=Math.sin(rot), iRx=1/Rx, iRy=1/Ry, iz0=z0*k, cup=ry*0.35*k, H=F.h0, A=F.a, C=F.c, M=F.m;
  for(let j=y0;j<=y1;j++){ const dy=j+0.5-cy; for(let i=x0;i<=x1;i++){ const dx=i+0.5-cx, u=(dx*cs+dy*sn)*iRx, v=(dy*cs-dx*sn)*iRy, w=(1-u*u), t=1-0.32*u, lim=w*t*t; if(w<=0||v*v>=lim) continue;
    const id=j*W+i, z=Math.max(0.05,iz0+dx*gx+dy*gy+cup*(1-v*v/lim)*w), cov=(1-Math.sqrt(v*v/lim))*Ry*0.9+0.3;
    if(cov>A[id]) A[id]=cov>1?1:cov;
    if(z>H[id]){ H[id]=z; C[id*3]=col[0]; C[id*3+1]=col[1]; C[id*3+2]=col[2]; M[id]=m; } } }
}
// a filled polygon (world points) at a height given by fn(x,y)->z or a constant, with colour fn(x,y)->rgb or rgb
function rzPoly(F,pts,zf,colf,m){
  const k=F.k, W=F.W; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const p of pts){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); y0=Math.min(y0,p[1]); y1=Math.max(y1,p[1]); }
  const I0=Math.max(0,Math.floor((x0+F.ox)*k)), I1=Math.min(W-1,Math.ceil((x1+F.ox)*k)), J0=Math.max(0,Math.floor((y0+F.oy)*k)), J1=Math.min(F.Hp-1,Math.ceil((y1+F.oy)*k)), n=pts.length;
  for(let j=J0;j<=J1;j++){ const wy=(j+0.5)/k-F.oy; for(let i=I0;i<=I1;i++){ const wx=(i+0.5)/k-F.ox; let inside=false;
    for(let a=0,b=n-1;a<n;b=a++){ const pa=pts[a], pb=pts[b]; if((pa[1]>wy)!==(pb[1]>wy)&&wx<(pb[0]-pa[0])*(wy-pa[1])/(pb[1]-pa[1])+pa[0]) inside=!inside; }
    if(!inside) continue; const id=j*W+i, z=(typeof zf==='function'?zf(wx,wy):zf)*k; if(F.a[id]<1) F.a[id]=1;
    if(z>F.h0[id]){ const c=typeof colf==='function'?colf(wx,wy):colf; F.h0[id]=z; F.c[id*3]=c[0]; F.c[id*3+1]=c[1]; F.c[id*3+2]=c[2]; F.m[id]=m; } } }
}
// visit every covered pixel (world x, y, id) to adjust colour or material before lighting
function rzEach(F,fn){ const k=F.k, W=F.W; for(let j=0;j<F.Hp;j++){ const wy=(j+0.5)/k-F.oy; for(let i=0;i<W;i++){ const id=j*W+i; if(F.a[id]<0.004) continue; fn((i+0.5)/k-F.ox,wy,id); } } }
// soft contact occlusion just outside the footprint (the ground darkening where a thing sits); drawn as a
// separate dark layer under the lit sprite
function rzContact(F,cx,cy,rx,ry,a){ F.ct=F.ct||[]; F.ct.push([cx,cy,rx,ry,a]); }
function rzBlur(src,W,H,r,out,tmp){
  for(let y=0;y<H;y++){ const row=y*W; let acc=0; for(let x=0;x<=r&&x<W;x++) acc+=src[row+x];
    for(let x=0;x<W;x++){ tmp[row+x]=acc; const xa=x-r, xb=x+r+1; if(xa>=0) acc-=src[row+xa]; if(xb<W) acc+=src[row+xb]; } }
  const inv=1/((2*r+1)*(2*r+1));
  for(let x=0;x<W;x++){ let acc=0; for(let y=0;y<=r&&y<H;y++) acc+=tmp[y*W+x];
    for(let y=0;y<H;y++){ out[y*W+x]=acc*inv; const ya=y-r, yb=y+r+1; if(ya>=0) acc-=tmp[ya*W+x]; if(yb<H) acc+=tmp[yb*W+x]; } }
  return out;
}
// light the field and return the canvas. o: ao (crevice darkening per world px), aoR (blur radius, world px),
// hao (darker low parts, 0..1), bump (normal strength), rim (dark shadow-side edge 0..1), sat, amb, sun
function rzShade(F,o){
  o=o||{};
  const W=F.W, Hp=F.Hp, n=F.n, H=F.h0, A=F.a, C=F.c, M=F.m, k=F.k;
  const tmp=new Float32Array(n), b1=new Float32Array(n), hb=new Float32Array(n), ab=new Float32Array(n);
  const r=Math.max(1,Math.round((o.aoR||3)*k));
  rzBlur(H,W,Hp,r,b1,tmp); rzBlur(b1,W,Hp,r,hb,tmp);
  rzBlur(A,W,Hp,Math.max(1,Math.round(1.2*k)),ab,tmp);
  let hmax=1e-3; for(let i=0;i<n;i++) if(H[i]>hmax) hmax=H[i];
  const Lx=RZL[0], Ly=RZL[1], Lz=RZL[2], Hx=RZH[0], Hy=RZH[1], Hz=RZH[2], amb=o.amb||RZAMB, sun=o.sun||RZSUN;
  const bump=o.bump||1, aoK=(o.ao==null?0.16:o.ao)/k, hao=o.hao||0, rim=o.rim==null?0.35:o.rim, sat=o.sat==null?1:o.sat, gain=o.gain||1;
  const ka=0.78*gain, ks=0.9*gain, tc=o.trans||[200,214,96];
  const cv=mkCanvas(W,Hp), g=cv.getContext('2d'), img=g.createImageData(W,Hp), d=img.data;
  for(let y=0;y<Hp;y++) for(let x=0;x<W;x++){
    const i=y*W+x, a=A[i]; if(a<0.004) continue;
    const hc=H[i], hL=x>0?H[i-1]:0, hR=x<W-1?H[i+1]:0, hU=y>0?H[i-W]:0, hD=y<Hp-1?H[i+W]:0;
    let nx=(hL-hR)*0.5*bump, ny=(hU-hD)*0.5*bump; const il=1/Math.sqrt(nx*nx+ny*ny+1); nx*=il; ny*=il; const nz=il;
    const m=M[i], P=RZM[m]||RZM[0]; let cr=C[i*3], cg=C[i*3+1], cb=C[i*3+2];
    if(P.emit){ d[i*4]=cr>255?255:cr; d[i*4+1]=cg>255?255:cg; d[i*4+2]=cb>255?255:cb; d[i*4+3]=a*255; continue; }
    const dl=nx*Lx+ny*Ly+nz*Lz; let dif=(dl+P.w)/(1+P.w); if(dif<0) dif=0;
    let ao=1+(hc-hb[i])*aoK; ao=ao<0.42?0.42:ao>1.14?1.14:ao;
    if(hao) ao*=1-hao+hao*Math.min(1,hc/hmax);
    const sa=0.5+0.5*Math.min(1,ao);
    let ar=amb[0], ag=amb[1], abl=amb[2]; if(P.snow){ ar=0.6; ag=0.7; abl=0.95; }
    cr*=ar*ao*ka+sun[0]*dif*sa*ks; cg*=ag*ao*ka+sun[1]*dif*sa*ks; cb*=abl*ao*ka+sun[2]*dif*sa*ks;
    if(P.sp>0){ const nh=nx*Hx+ny*Hy+nz*Hz; if(nh>0){ let s=Math.pow(nh,P.pw)*P.sp*sa*255; if(P.snow&&rzHash(x,y,7)>0.985) s+=140*dif; cr+=s*sun[0]; cg+=s*sun[1]; cb+=s*sun[2]; } }
    // edges: light through the lit edge of foliage, a thin darker edge on the shadow side
    const e=1-ab[i];
    if(e>0.02){ const gx=(x<W-1?ab[i+1]:0)-(x>0?ab[i-1]:0), gy=(y<Hp-1?ab[i+W]:0)-(y>0?ab[i-W]:0), gl=Math.hypot(gx,gy)+1e-4, lit=-(gx*Lx+gy*Ly)/gl/Math.hypot(Lx,Ly);
      if(lit>0&&P.tr){ const t=P.tr*e*lit*1.6; cr+=(tc[0]-cr)*t*0.6+tc[0]*t*0.25; cg+=(tc[1]-cg)*t*0.6+tc[1]*t*0.25; cb+=(tc[2]-cb)*t*0.5; }
      else if(lit<0&&rim){ const t=1-rim*e*(-lit)*1.4; cr*=t; cg*=t; cb*=t; } }
    if(sat!==1){ const l=cr*0.3+cg*0.59+cb*0.11; cr=l+(cr-l)*sat; cg=l+(cg-l)*sat; cb=l+(cb-l)*sat; }
    d[i*4]=cr>255?255:cr<0?0:cr; d[i*4+1]=cg>255?255:cg<0?0:cg; d[i*4+2]=cb>255?255:cb<0?0:cb; d[i*4+3]=a>=1?255:a*255;
  }
  g.putImageData(img,0,0);
  if(F.ct){ // contact occlusion goes under the lit pixels
    const q=mkCanvas(W,Hp), qg=q.getContext('2d'); qg.scale(k,k); qg.translate(F.ox,F.oy);
    for(const [cx,cy,rx,ry,al] of F.ct){ qg.save(); qg.translate(cx,cy); qg.scale(1,ry/rx); const gr=qg.createRadialGradient(0,0,rx*0.55,0,0,rx); gr.addColorStop(0,`rgba(8,10,6,${al})`); gr.addColorStop(1,'rgba(8,10,6,0)'); qg.fillStyle=gr; qg.beginPath(); qg.arc(0,0,rx,0,TAU); qg.fill(); qg.restore(); }
    qg.setTransform(1,0,0,1,0,0); qg.drawImage(cv,0,0); return rzFin(F,q);
  }
  return rzFin(F,cv);
}
function rzFin(F,cv){ if(F.half) cv.half=F.half; cv.ox=F.ox; cv.oy=F.oy; cv.w2=F.w; cv.h2=F.h; return cv; }

// ---------- canopies: big leaf masses, each made of rounded sub-clumps, each sub-clump of small lit leaves
// o: R, n (masses), sub (sub-clumps), leaves (count), ls [min,max] leaf size, innerCol (the shaded body), pal (deep,
// mid, light), tint (per mass variation), open (0..1 gaps), zTop, rng, under(F,masses,dome) drawn before the leaves
function rzCanopy(F,o){
  const rng=o.rng, R=o.R, cl=[], n=o.n||10, cx=o.cx||0, cy=o.cy||0, ey=o.ey||0.96;
  for(let i=0;i<n;i++){ const a=i/n*TAU+(rng()-0.5)*0.9, d=R*(0.36+rng()*0.28), r=R*(0.3+rng()*0.15); cl.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d*ey,r,t:rng()*2-1}); }
  const ni=o.innerN==null?3:o.innerN;
  for(let i=0;i<ni;i++){ const a=rng()*TAU, d=R*rng()*0.22, r=R*(0.32+rng()*0.1); cl.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d,r,t:rng()*2-1}); }
  const zT=o.zTop||R*0.55;
  for(const c of cl){ const dd=Math.hypot(c.x-cx,c.y-cy)/R; c.z=zT*(1-dd*0.85)*0.5; c.zh=c.r*0.8; }
  const dome=(x,y)=>{ let best=-1; for(const c of cl){ const dx=x-c.x, dy=y-c.y, q=(dx*dx+dy*dy)/(c.r*c.r); if(q<1){ const z=c.z+c.zh*Math.sqrt(1-q); if(z>best) best=z; } } return best; };
  const inner=o.innerCol||rzCol(o.pal[0],-0.42), P=o.pal, tk=o.tint==null?0.3:o.tint;
  const tone=t=>{ t=clamp(t,0,1); return t<0.5?rzMix(P[0],P[1],t*2):rzMix(P[1],P[2],(t-0.5)*2); };
  const ik=o.innerK||0.78; for(const c of cl) rzDome(F,c.x,c.y,c.r*ik,c.r*ik,0,c.z-2,c.zh*0.8,rzJit(inner,rng,0.16),RZ.LEAF);
  if(o.under) o.under(F,cl,dome);
  // sub-clumps on every mass (in proportion to its area, more toward its rim), so the outline is a row of lobes
  const sc=[], dens=o.sub?o.sub/cl.reduce((s,c)=>s+c.r*c.r,0):30/(R*R), sr=o.sr||[0.14,0.22];
  for(const c of cl){ const n=Math.max(3,Math.round(c.r*c.r*dens));
    for(let j=0;j<n;j++){ const a=j/n*TAU+rng()*0.8, dr=(j===0?0:Math.pow(rng(),0.4))*c.r*0.95, x=c.x+Math.cos(a)*dr, y=c.y+Math.sin(a)*dr, r=R*(sr[0]+rng()*(sr[1]-sr[0]));
      if(o.open&&j>0&&rng()<o.open*0.3) continue;
      let z=dome(x,y); if(z<0) z=c.z; sc.push({x,y,r,z:z-r*0.22,zh:r*0.34,t:c.t,lt:0}); } }
  sc.sort((p,q)=>p.z-q.z);
  for(const q of sc){ const lit=clamp(0.5+q.t*tk+(q.z/zT-0.45)*0.5-(q.x-cx+q.y-cy)/(R*1.6)*0.45+(rng()-0.5)*0.3,0,1); q.lt=lit; rzDome(F,q.x,q.y,q.r,q.r*0.94,0,q.z,q.zh,rzJit(tone(lit*0.7),rng,0.1),RZ.LEAF); }
  const surf=(x,y)=>{ let best=-1, bq=null; for(const q of sc){ const dx=x-q.x, dy=y-q.y, d2=dx*dx+dy*dy; if(d2<q.r*q.r){ const z=q.z+q.zh*Math.sqrt(1-d2/(q.r*q.r)); if(z>best){ best=z; bq=q; } } } return [best,bq]; };
  // leaves lying on every sub-clump: lighter on each lobe's lit side, a few sticking out past the rim
  const ls=o.ls||[1.6,2.8], lm=(ls[0]+ls[1])/2, ld=(o.leafK||1.15)*(1-(o.open||0)*0.35)/(lm*lm);
  for(const q of sc){ const n=Math.round(q.r*q.r*ld);
    for(let j=0;j<n;j++){
      const a=rng()*TAU, dr=Math.pow(rng(),0.6)*q.r*1.06, x=q.x+Math.cos(a)*dr, y=q.y+Math.sin(a)*dr;
      let [z,qq]=surf(x,y); if(z<0){ z=q.z+0.3; qq=q; }
      const s=ls[0]+rng()*(ls[1]-ls[0]), rot=Math.atan2(y-cy,x-cx)+(rng()-0.5)*1.8, ox=(x-qq.x)/qq.r, oy=(y-qq.y)/qq.r, side=-(ox+oy)/1.4;
      // the leaf faces outward from its lobe, plus a random tilt of its own
      const gx=-ox*0.55+(rng()-0.5)*0.9, gy=-oy*0.55+(rng()-0.5)*0.9;
      rzLeaf(F,x,y,s*1.3,s*0.72,rot,z-0.2,gx,gy,rzJit(tone(qq.lt+side*0.25+(rng()-0.5)*0.35),rng,0.1),RZ.LEAF);
    } }
  return {cl,dome,sc};
}
// bark: furrows along the length, a few knots
function rzBarkTex(seed,fur,knot){ return (t,u,len)=>{ const along=t*len, f=rzVN(u*fur+seed,along*0.22,seed)*0.6+rzVN(u*fur*2.1,along*0.6,seed+3)*0.4; let v=0.72+f*0.5; if(knot&&rzHash(Math.floor(along*0.4),Math.floor(u*2),seed)>0.93) v*=0.7; return v; }; }

// ---------- trees
const RZP={
  oak:[[46,74,32],[74,104,42],[112,138,56]], oakIn:[28,44,22],
  oak2:[[40,70,38],[66,98,46],[100,130,62]], oak3:[[58,80,32],[90,112,42],[130,146,60]],
  birch:[[78,110,50],[110,140,62],[150,170,84]], birchIn:[66,90,46],
  pine:[[24,48,38],[38,70,50],[60,94,62]], pineTip:[92,124,72], pineIn:[16,30,24],
  spine:[[22,44,42],[34,62,54],[52,84,66]],
  willow:[[78,104,50],[110,132,62],[150,164,86]], willowIn:[40,56,30],
  bush:[[50,86,36],[76,114,46],[110,142,60]], shrub:[[104,90,48],[136,118,62],[170,150,84]],
  fshrub:[[62,86,82],[88,110,104],[128,146,140]], mbush:[[44,58,30],[62,78,40],[86,98,52]],
  bark:[92,70,50], birchBark:[222,216,202], pineBark:[110,72,50], willowBark:[86,74,58], dead:[132,124,112], char:[38,32,30]
};
function rzMkOak(seed,kind){
  const rng=mulberry32(seed), R=48, F=rzSq(R);
  const pal=kind==='birch'?RZP.birch:[RZP.oak,RZP.oak2,RZP.oak3][seed%3];
  if(kind==='birch'){
    rzCanopy(F,{rng,R:R*0.9,n:11+Math.floor(rng()*3),sub:120,sr:[0.07,0.12],ls:[1.0,1.6],pal,innerCol:RZP.birchIn,innerK:0.5,open:0.55,tint:0.35,
      under:(F,cl)=>{ // pale branches showing through the open crown
        const bc=RZP.birchBark, tx=rzBarkTex(seed,1.2,true);
        for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.6, L=R*(0.34+rng()*0.22); rzCap(F,0,0,R*0.16,Math.cos(a)*L,Math.sin(a)*L,R*0.1,2.6,0.8,bc,RZ.BARK,(t,u,len)=>tx(t,u,len)*(rzHash(Math.floor(t*len*0.6),3,seed)>0.8?0.35:1)); }
      }});
  }else{
    rzCanopy(F,{rng,R:R*(0.88+rng()*0.1),n:8+Math.floor(rng()*5),ls:[1.5,2.5],pal,innerCol:RZP.oakIn,tint:0.32,ey:0.88+rng()*0.16});
  }
  return rzShade(F,{ao:0.22,aoR:2.2,hao:0.34,bump:1});
}
function rzMkBigOak(){
  const rng=mulberry32(1777), R=48, F=rzSq(R);
  rzCanopy(F,{rng,R:R*0.96,n:14,innerN:5,sub:80,ls:[1.5,2.6],pal:[[40,66,30],[66,96,40],[104,132,54]],innerCol:[24,38,20],tint:0.36});
  return rzShade(F,{ao:0.3,aoR:2.6,hao:0.3,bump:1});
}
// a stampable piece of height field (a pine frond): painted once, then stamped turned and scaled into a sprite's
// field, so every bough shares the needle detail but is lit for its own direction
function rzStamp(F,T,x,y,rot,sl,sw,z0,droop,tint){
  const k=F.k, W=F.W, cs=Math.cos(rot), sn=Math.sin(rot), L=T.w*sl, hw=T.h/2*sw, cx=(x+F.ox)*k, cy=(y+F.oy)*k;
  const ex=[[0,-hw],[L,-hw],[L,hw],[0,hw]].map(([u,v])=>[cx+(u*cs-v*sn)*k,cy+(u*sn+v*cs)*k]);
  const X0=Math.max(0,Math.floor(Math.min(...ex.map(e=>e[0])))), X1=Math.min(W-1,Math.ceil(Math.max(...ex.map(e=>e[0])))), Y0=Math.max(0,Math.floor(Math.min(...ex.map(e=>e[1])))), Y1=Math.min(F.Hp-1,Math.ceil(Math.max(...ex.map(e=>e[1]))));
  const TW=T.W, TH=T.Hp, tk=T.k, H=F.h0, A=F.a, C=F.c, M=F.m, iz=z0*k, dz=droop*k, tr=tint||[1,1,1];
  for(let j=Y0;j<=Y1;j++) for(let i=X0;i<=X1;i++){
    const dx=(i+0.5-cx)/k, dy=(j+0.5-cy)/k, u=(dx*cs+dy*sn)/sl, v=(dy*cs-dx*sn)/sw;
    const ti=Math.floor(u*tk), tj=Math.floor((v+T.oy)*tk); if(ti<0||tj<0||ti>=TW||tj>=TH) continue;
    const q=tj*TW+ti, ta=T.a[q]; if(ta<0.004) continue;
    const id=j*W+i, f=u/T.w, z=Math.max(0.05,T.h0[q]+iz-dz*f*f);
    if(ta>A[id]) A[id]=ta;
    if(z>H[id]){ H[id]=z; C[id*3]=T.c[q*3]*tr[0]; C[id*3+1]=T.c[q*3+1]*tr[1]; C[id*3+2]=T.c[q*3+2]*tr[2]; M[id]=T.m[q]; }
  }
}
function rzFrond(v,snow){
  return rzCache('frond'+v+(snow?'s':''),()=>{
    const T=rzHF(42,22,0,11), rng=mulberry32(3300+v*17), P=snow?RZP.spine:RZP.pine;
    rzCap(T,0,0,2.2,40,0,0.6,1.5,0.45,rzCol(P[0],-0.3),RZ.NEEDLE);
    for(let x=0.5;x<40.5;x+=0.85){
      const w=10*Math.pow(1-x/46,0.7)+1.8, tip=x>31;
      for(const sd of [-1,1]) for(let n=0;n<2;n++){
        const a=sd*(0.5+rng()*0.55), len=w*(0.75+rng()*0.4), cx=x+Math.cos(a)*len*0.5, cy=Math.sin(a)*len*0.5;
        const tone=clamp(0.3+x/40*0.35+(rng()-0.5)*0.45+(n?0.1:0),0,1), col=tip&&rng()<0.6?rzMix(P[2],RZP.pineTip,rng()*0.8):tone<0.5?rzMix(P[0],P[1],tone*2):rzMix(P[1],P[2],(tone-0.5)*2);
        rzLeaf(T,cx,cy,len*0.52,0.6,a,1.6+rng()*0.5,0,-sd*0.22,rzJit(col,rng,0.1),RZ.NEEDLE);
      }
    }
    if(snow) for(let x=1.5;x<31;x+=1.3){ if(rng()<0.16) continue; const w=10*Math.pow(1-x/46,0.7)*0.42+0.9;
      rzDome(T,x+(rng()-0.5)*0.8,(rng()-0.5)*w*0.4,1.8+rng()*1.2,w*(0.7+rng()*0.5),(rng()-0.5)*0.4,2.3,1.4,rzJit([234,240,246],rng,0.03),RZ.SNOW,0.55); }
    return T;
  });
}
function rzMkPine(seed,snow){
  const rng=mulberry32(seed), R=40, F=rzSq(R), S=[234,240,246];
  const tiers=[[R,1.5,13],[R*0.78,7,11],[R*0.56,12,9],[R*0.34,17,7]], r0=rng()*TAU;
  rzDome(F,0,0,R*0.6,R*0.6,0,0,6,RZP.pineIn,RZ.NEEDLE);
  for(let L=0;L<tiers.length;L++){
    const [r,z,nb]=tiers[L], rot=r0+L*Math.PI/nb+(rng()-0.5)*0.3;
    for(let b=0;b<nb;b++){
      const a=rot+b/nb*TAU+(rng()-0.5)*0.3, len=r*(0.88+rng()*0.16), sw=0.75+L*0.06+rng()*0.25, t=0.9+rng()*0.2;
      rzStamp(F,rzFrond((seed+b+L)%3,snow&&(L>0||rng()<0.75)),0,0,a,len/40,sw,z,Math.min(z+1,4.5+L*0.6),[t,t*(0.98+rng()*0.04),t]);
    }
  }
  for(let b=0;b<5;b++) rzStamp(F,rzFrond(b%3,snow),0,0,r0+b/5*TAU+0.3,0.16,0.5,20,1,[1.08,1.08,1.05]);
  return rzShade(F,{ao:0.24,aoR:2,hao:0.34,bump:1,rim:0.4,trans:[150,190,110]});
}
function rzMkWillow(seed){
  const rng=mulberry32(seed), R=52, F=rzSq(R), P=RZP.willow;
  const can=rzCanopy(F,{rng,R:R*0.6,n:8,ls:[1.3,2.1],pal:P,innerCol:RZP.willowIn,tint:0.25,zTop:R*0.55,cy:-R*0.08});
  // curtains of narrow leaves arch out of the crown and fall (south, in this view), in groups, longest in front
  const ng=26+Math.floor(rng()*6);
  for(let gI=0;gI<ng;gI++){ const ga=gI/ng*TAU+(rng()-0.5)*0.2, front=Math.max(0,Math.sin(ga)), gl=R*(0.2+rng()*0.14+front*0.2), tone=rng();
    for(let s=0;s<3+Math.floor(rng()*3);s++){
      const a=ga+(rng()-0.5)*0.26, d0=R*(0.4+rng()*0.16), sx=Math.cos(a)*d0, sy=Math.sin(a)*d0-R*0.08, L=gl*(0.8+rng()*0.35), out=R*(0.1+rng()*0.08);
      let z0=can.dome(sx,sy); if(z0<0) z0=8;
      for(let t=0;t<1;t+=0.055){
        const e=Math.sin(t*Math.PI/2), x=sx+Math.cos(a)*out*e, y=sy+Math.sin(a)*out*e+L*t*t*0.95+L*t*0.15, z=z0*(1-t*0.92)+0.5;
        const col=rzMix(P[Math.min(1,Math.floor(tone*2))],P[Math.min(2,Math.floor(tone*2)+1)],0.25+t*0.6), dir=Math.atan2(Math.sin(a)*out*Math.cos(t*Math.PI/2)*1.6+L*(t*1.9+0.15),Math.cos(a)*out*Math.cos(t*Math.PI/2)*1.6);
        rzLeaf(F,x,y,1.7,0.62,dir+(rng()-0.5)*0.6,z,(rng()-0.5)*0.5,-0.3,rzJit(col,rng,0.14),RZ.LEAF);
        if(rng()<0.6) rzLeaf(F,x+(rng()-0.5)*1.4,y+(rng()-0.5)*0.8,1.4,0.55,dir+(rng()-0.5)*1.1,z-0.15,(rng()-0.5)*0.5,-0.3,rzJit(col,rng,0.16),RZ.LEAF);
      }
    } }
  return rzShade(F,{ao:0.22,aoR:2.2,hao:0.3,bump:1,trans:[210,220,120]});
}
function rzMkDead(seed,charred){
  const rng=mulberry32(seed), R=40, F=rzSq(R), col=charred?RZP.char:RZP.dead, sd=seed%97;
  const tex=(t,u,len)=>{ const along=t*len; let v=0.78+0.32*rzVN(u*2.6+sd,along*0.5,sd); const cr=rzVN(u*4.5,along*0.16,sd+5); if(cr<0.28) v*=0.55+cr; if(u<-0.2) v*=1.05; return v; };
  const segs=[];
  const br=(x,y,z,a,len,w,d)=>{ if(d>4||len<4) return; const x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len, z2=z-len*0.22; segs.push([x,y,z,x2,y2,z2,w,w*0.66]); const k2=1+Math.floor(rng()*2); for(let i=0;i<=k2;i++) br(x2,y2,z2,a+(rng()-0.5)*1.4,len*(0.55+rng()*0.2),w*0.64,d+1); };
  const n=4+Math.floor(rng()*3); for(let i=0;i<n;i++) br(0,0,16,i/n*TAU+rng()*0.6,R*(0.42+rng()*0.2),3.4,0);
  let ext=0; for(const s of segs) ext=Math.max(ext,Math.hypot(s[3],s[4])+s[7]); const sk=ext>R*0.98?R*0.98/ext:1; if(sk<1) for(const s of segs){ s[0]*=sk; s[1]*=sk; s[3]*=sk; s[4]*=sk; }
  for(const s of segs) rzCap(F,s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],rzJit(col,rng,0.1),RZ.BARK,tex);
  rzDome(F,0,0,6.4,6.4,0,14,4.5,rzCol(col,0.06),RZ.BARK);
  // the broken top: pale splintered wood in the middle
  rzDome(F,-0.4,-0.4,3.4,3.4,0,18,1.2,charred?[26,20,18]:[176,164,140],RZ.WOOD,0.5);
  if(charred) rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.BARK&&rzVN(x*0.55+3,y*0.55,seed)>0.78&&rzHash(Math.floor(x*2),Math.floor(y*2),seed)>0.4){ F.m[id]=RZ.EMIT; F.c[id*3]=255; F.c[id*3+1]=110+rzHash(x|0,y|0,2)*60; F.c[id*3+2]=40; } });
  return rzShade(F,{ao:0.18,aoR:2.2,hao:0.25,bump:1,rim:0.3});
}
// trunks and roots for the 3D depth modes (the crown leans toward the camera; the trunk joins it to its roots)
function rzTrunkTex(kind){
  return rzCache('trunk:'+kind,()=>{
    const F=rzHF(16,64,8,0), c=kind==='birch'?RZP.birchBark:kind==='pine'||kind==='spine'?RZP.pineBark:kind==='willow'?RZP.willowBark:kind==='dead'?RZP.dead:kind==='char'?RZP.char:RZP.bark;
    const sd=kind.length*13, tx=rzBarkTex(sd,kind==='pine'||kind==='spine'?1.4:2.2,true);
    // a vertical tapered cylinder (top at y 0, base at y 64), widening into the root flare
    rzContact(F,0,63,7.5,2.6,0.45);
    rzCap(F,0,62,6,0,0,6,6.2,4.4,c,RZ.BARK,(t,u,len)=>{ let v=tx(t,u,len); if(kind==='birch'&&rzHash(Math.floor(t*len*0.45),Math.floor(u*1.5+2),sd)>0.72) v*=0.28; return v; },1);
    return rzShade(F,{ao:0.1,aoR:1.6,rim:0.5});
  });
}
function rzRoots(kind){
  return rzCache('roots:'+kind,()=>{
    const F=rzSq(14,4), rng=mulberry32(kind.length*71), c=kind==='birch'?[196,190,176]:kind==='pine'||kind==='spine'?RZP.pineBark:kind==='dead'?RZP.dead:kind==='char'?RZP.char:RZP.bark;
    const tx=rzBarkTex(9,1.6,false);
    rzContact(F,0,1,13,9,0.5);
    for(let i=0;i<5;i++){ const a=i/5*TAU+rng()*0.7+0.3, L=8+rng()*5; rzCap(F,0,0,3.5,Math.cos(a)*L,Math.sin(a)*L*0.8,0,3.2,0.8,rzJit(c,rng,0.1),RZ.BARK,tx); }
    rzDome(F,0,0,5.6,5,0,0,6,c,RZ.BARK);
    return rzShade(F,{ao:0.2,aoR:1.6,rim:0.4});
  });
}

// the 3D depth modes in this look (drawTallProps in a11c_depth.js hands over here): the same back-to-front order,
// halo and fade, a bark trunk from the roots to the leaning crown, and crowns that never turn
function rzTrunkKind(p){ return p.k==='dead'?(p.y<3000?'char':'dead'):p.k==='birch'||p.k==='pine'||p.k==='spine'||p.k==='willow'||p.k==='oak'?p.k:'oak'; }
function rzTallProps(props,t,bossE){
  TALLS.length=0; for(const p of props) if(TREEH[p.k]) TALLS.push(p);
  TALLS.sort((a,b)=>a.y-b.y);
  const halo=DV.full&&!DV.lite&&!DSKIP.halo, ha=AREA?0:0.16+0.1*daylight();
  for(const p of TALLS){
    const sp=propSprite(p), h=TREEH[p.k]*p.s, dx=leanDX(p.x,h), dy=leanDY(p.y,h), a=tallFade(p,dx,dy,bossE), rot=Math.sin(t*0.8+p.ph)*0.025*(1+G.rainK*1.5);
    if(halo&&a>0.9&&p.k!=='dead'){ const sil=silOf(sp), hh=sp.half*p.s*1.04; ctx.globalAlpha=ha; ctx.drawImage(sil,p.x+dx-hh+3,p.y+dy-hh+7,hh*2,hh*2); }
    ctx.globalAlpha=a;
    const L=Math.hypot(dx,dy);
    if(L>2.5||p.k==='dead') rzTrunk(rzTrunkKind(p),p.x,p.y,dx,dy,(p.k==='dead'?14:12)*p.s,L>5?Math.min(1,(L-5)/10)*p.s:0);
    drawSprite(sp,p.x+dx,p.y+dy,p.s,rot);
  }
  ctx.globalAlpha=1;
}
// a trunk from (x,y) to (x+dx,y+dy), w world px wide; rk>0 draws the root flare at the base at that scale
function rzTrunk(kind,x,y,dx,dy,w,rk){
  const L=Math.hypot(dx,dy); if(L<0.5) return;
  const tx=rzTrunkTex(kind), ga=ctx.globalAlpha;
  if(rk>0){ const R=rzRoots(kind), hw=R.half*rk*0.75; ctx.globalAlpha=ga*Math.min(1,rk); ctx.drawImage(R,x-hw,y-hw*0.9,hw*2,hw*2); ctx.globalAlpha=ga; }
  ctx.save(); ctx.translate(x,y); ctx.rotate(Math.atan2(dx,-dy)); ctx.drawImage(tx,-w*0.65,-L-2,w*1.3,L+6); ctx.restore();
}
// ---------- bushes, plants
function rzMkBush(seed,kind){
  const rng=mulberry32(seed), R=15, F=rzSq(R), P=RZP[kind]||RZP.bush;
  const sh=kind==='shrub';
  rzCanopy(F,{rng,R:R*0.95,n:5+Math.floor(rng()*3),innerN:1,leaves:sh?230:300,ls:sh?[0.9,1.5]:[1.0,1.7],pal:P,innerCol:rzCol(P[0],-0.45),tint:0.3,zTop:R*0.7,open:sh?0.5:0,
    under:sh?(F)=>{ for(let i=0;i<9;i++){ const a=rng()*TAU, L=R*(0.5+rng()*0.4); rzCap(F,0,0,5,Math.cos(a)*L,Math.sin(a)*L,2,0.9,0.35,[96,74,48],RZ.BARK); } }:null});
  if(kind==='bush'&&rng()<0.45){ const n=6+Math.floor(rng()*6); for(let i=0;i<n;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.7; rzDome(F,Math.cos(a)*d,Math.sin(a)*d,1.25,1.25,0,R*0.62,1.2,rzJit([176,34,44],rng,0.15),RZ.GLOSS); } }
  if(kind==='fshrub') rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.LEAF&&F.h0[id]>R*0.75*F.k&&rzHash(Math.floor(x*1.6),Math.floor(y*1.6),seed)>0.45){ F.m[id]=RZ.SNOW; F.c[id*3]=226; F.c[id*3+1]=234; F.c[id*3+2]=240; } });
  return rzShade(F,{ao:0.2,aoR:1.8,hao:0.3,bump:1.1});
}
function rzMkStump(seed){
  const rng=mulberry32(seed), R=12, F=rzSq(R), bark=RZP.bark, wood=[196,162,112];
  rzContact(F,0.5,1,R*0.95,R*0.8,0.45);
  const tx=rzBarkTex(seed,1.6,false);
  for(let i=0;i<4;i++){ const a=i/4*TAU+rng()*0.9, L=R*(0.75+rng()*0.25); rzCap(F,0,0,3,Math.cos(a)*L,Math.sin(a)*L*0.9,0,2.6,0.8,rzJit(bark,rng,0.1),RZ.BARK,tx); }
  const rr=R*0.78;
  rzDome(F,0,0,rr,rr,0,0,6,bark,RZ.BARK,0.25);
  rzEach(F,(x,y,id)=>{ const d=Math.hypot(x,y); if(d<rr*0.82&&F.h0[id]>4*F.k){ const ring=0.5+0.5*Math.sin(d*2.6+rzVN(x*0.4,y*0.4,seed)*3), crack=Math.abs(Math.atan2(y,x)-0.7)<0.05&&d>2?0.6:1;
    const c=rzMix(wood,[160,120,78],ring*0.45+d/rr*0.3); F.c[id*3]=c[0]*crack; F.c[id*3+1]=c[1]*crack; F.c[id*3+2]=c[2]*crack; F.m[id]=RZ.WOOD; F.h0[id]=6.2*F.k-(1-ring)*0.25*F.k; }
    else if(F.m[id]===RZ.BARK){ const f=0.75+0.4*rzVN(Math.atan2(y,x)*6,d*0.6,seed); F.c[id*3]*=f; F.c[id*3+1]*=f; F.c[id*3+2]*=f; } });
  if(rng()<0.5){ const a=rng()*TAU; rzDome(F,Math.cos(a)*rr*0.9,Math.sin(a)*rr*0.9,2.2,1.8,0,4,1.6,[196,58,44],RZ.GLOSS); }
  return rzShade(F,{ao:0.15,aoR:1.4,rim:0.35});
}
function rzMkBones(seed){
  const rng=mulberry32(seed), R=14, F=rzSq(R), c=[214,204,182];
  for(let i=0;i<4;i++){ const a=rng()*TAU, L=6+rng()*8, x=(rng()-0.5)*14, y=(rng()-0.5)*14, x2=x+Math.cos(a)*L, y2=y+Math.sin(a)*L;
    rzCap(F,x,y,1,x2,y2,1,1.1,1.1,rzJit(c,rng,0.08),RZ.BONE); rzDome(F,x,y,1.8,1.8,0,0.5,1.6,c,RZ.BONE); rzDome(F,x2,y2,1.8,1.8,0,0.5,1.6,c,RZ.BONE); }
  rzDome(F,2,1,4.6,3.8,0.3,1,3.6,[226,218,198],RZ.BONE);
  rzEach(F,(x,y,id)=>{ if(Math.hypot(x-1,y)<1.1||Math.hypot(x-3.4,y-0.6)<1.1){ F.c[id*3]=50; F.c[id*3+1]=42; F.c[id*3+2]=36; F.h0[id]-=2*F.k; } });
  rzContact(F,1,1,10,8,0.3);
  return rzShade(F,{ao:0.2,aoR:1.2,rim:0.3});
}
function rzMkHerb(seed){
  const rng=mulberry32(seed), R=10, F=rzSq(R);
  for(let i=0;i<9;i++){ const a=i/9*TAU+rng()*0.4, L=6+rng()*2.4; rzCap(F,0,0,2.2,Math.cos(a)*L,Math.sin(a)*L,0.6,1.7,0.5,rzJit(i%2?[70,124,52]:[90,142,60],rng,0.12),RZ.LEAF,null,0.5); }
  for(let i=0;i<6;i++){ const a=rng()*TAU, d=1.5+rng()*4; rzDome(F,Math.cos(a)*d,Math.sin(a)*d,1.7,1.7,0,3,1.4,i%2?[236,228,255]:[176,132,250],RZ.CLOTH); }
  rzDome(F,0,0,1,1,0,3.5,1,[255,230,120],RZ.CLOTH);
  return rzShade(F,{ao:0.18,aoR:1,rim:0.25,gain:1.05});
}
function rzMkReed(seed){
  const rng=mulberry32(seed), R=14, F=rzSq(R);
  rzContact(F,0,4,10,5,0.3);
  const st=[]; for(let i=0;i<10;i++) st.push([(rng()-0.5)*14,(rng()-0.5)*9,rng()]);
  st.sort((a,b)=>a[1]-b[1]);
  for(const [x,y,r] of st){ const a=-Math.PI/2+(r-0.5)*0.9, L=9+rng()*8, x2=x+Math.cos(a)*L, y2=y+4+Math.sin(a)*L, col=rng()<0.5?[84,112,48]:[108,128,58];
    rzCap(F,x,y+4,0,x2,y2,L*0.9,0.7,0.45,col,RZ.LEAF);
    if(rng()<0.5){ const tx=x+Math.cos(a)*L*0.72, ty=y+4+Math.sin(a)*L*0.72; rzCap(F,tx,ty,L*0.66,x2-Math.cos(a)*0.6,y2-Math.sin(a)*0.6,L*0.88,1.6,1.4,[104,66,38],RZ.CLOTH); }
    else{ const la=a+(rng()-0.5)*0.8; rzCap(F,x,y+4,0,x+Math.cos(la)*L*0.8,y+4+Math.sin(la)*L*0.8,L*0.6,1.1,0.3,rzCol(col,0.1),RZ.LEAF,null,0.4); } }
  return rzShade(F,{ao:0.12,aoR:1.2,rim:0.3,trans:[200,210,110]});
}
function rzMkVent(){
  const F=rzSq(16), rng=mulberry32(91);
  // the cone: a ring of cinders around a glowing throat
  for(let i=0;i<70;i++){ const a=rng()*TAU, d=8+rng()*6.5; rzDome(F,Math.cos(a)*d,Math.sin(a)*d*0.92,1.8+rng()*2,1.4+rng()*1.6,rng()*3,2.2-(d-8)*0.3,1.6+rng(),rzJit([74,62,58],rng,0.3),RZ.ROCK); }
  rzDome(F,0,0,14.5,13.5,0,0,3,[52,42,40],RZ.ROCK,0.5);
  rzEach(F,(x,y,id)=>{ const d=Math.hypot(x,y); if(d<7.4){ const k2=clamp(1-d/7.4,0,1); F.m[id]=RZ.EMIT; F.c[id*3]=90+165*k2; F.c[id*3+1]=26+150*k2*k2; F.c[id*3+2]=10+70*k2*k2*k2; } });
  return rzShade(F,{ao:0.25,aoR:1.6,rim:0.4});
}
function rzMkSpike(seed){
  const rng=mulberry32(seed), R=20, F=rzSq(R), n=5+Math.floor(rng()*3);
  for(let i=0;i<n;i++){ const a=rng()*TAU, L=R*(0.62+rng()*0.38), ca=Math.cos(a), sa=Math.sin(a);
    // a shard: a ridge from the root to the tip, two flat faces falling away from it
    const pts=[[ca*0-sa*4.4,sa*0+ca*4.4],[ca*L,sa*L],[sa*4.4,-ca*4.4]];
    rzPoly(F,pts,(x,y)=>{ const along=(x*ca+y*sa)/L, across=Math.abs(-x*sa+y*ca); return Math.max(0,(1-along)*9-across*1.6)+1; },[34,28,42],RZ.GLOSS); }
  rzDome(F,0,0,5.4,5.4,0,6,2.5,[24,20,30],RZ.GLOSS);
  rzContact(F,0,1,R*0.8,R*0.6,0.35);
  return rzShade(F,{ao:0.12,aoR:1.2,rim:0.2,bump:1.4});
}

// ---------- rocks: a faceted dome over an irregular footprint, cracks, strata, lichen, moss and snow
const RZROCK={grey:{c:[132,128,120],v:[110,106,100],li:[176,172,124]},moss:{c:[118,120,108],v:[98,100,92],li:[90,112,60],moss:1},
  red:{c:[160,104,78],v:[124,80,62],li:[184,132,100],strata:1},obsid:{c:[30,26,36],v:[18,16,24],li:[70,62,86],gloss:1},snow:{c:[116,120,128],v:[96,100,110],li:[150,156,150],snow:1}};
function rzRockBody(F,R,rng,K,flat,seed,ox,oy){
  ox=ox||0; oy=oy||0;
  const n=8+Math.floor(rng()*4), v=[]; for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.32, m=0.76+rng()*0.26; v.push([ox+Math.cos(a)*R*m,oy+Math.sin(a)*R*m*0.84]); }
  const planes=[]; const np=K.gloss?8:4+Math.floor(rng()*3); for(let i=0;i<np;i++){ const a=rng()*TAU; planes.push([Math.cos(a),Math.sin(a),R*(0.5+rng()*0.35),0.45+rng()*0.5]); }
  const top=R*(flat||0.62), cracks=[]; for(let i=0;i<(K.strata?1:1+Math.floor(rng()*2));i++){ let x=(rng()-0.5)*R*0.7, y=(rng()-0.5)*R*0.6, a=rng()*TAU; const c=[[x,y]]; for(let s=0;s<6;s++){ a+=(rng()-0.5)*1.3; x+=Math.cos(a)*R*0.15; y+=Math.sin(a)*R*0.15; c.push([x,y]); } cracks.push(c); }
  const segD=(x,y,c)=>{ let best=1e9; for(let i=0;i<c.length-1;i++){ const [ax,ay]=c[i], [bx,by]=c[i+1], vx=bx-ax, vy=by-ay, t=clamp(((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy||1),0,1), dx=x-ax-vx*t, dy=y-ay-vy*t; best=Math.min(best,dx*dx+dy*dy); } return Math.sqrt(best); };
  const edgeD=(x,y)=>{ let best=1e9; for(let a=0,b=n-1;a<n;b=a++){ const [ax,ay]=v[b], [bx,by]=v[a], vx=bx-ax, vy=by-ay, t=clamp(((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy||1),0,1), dx=x-ax-vx*t, dy=y-ay-vy*t; best=Math.min(best,dx*dx+dy*dy); } return Math.sqrt(best); };
  rzPoly(F,v,(x,y)=>{
    const e=edgeD(x,y), base=top*Math.pow(clamp(e/(R*0.55),0,1),0.55);
    let z=base; for(const p of planes){ const q=p[2]-((x-ox)*p[0]+(y-oy)*p[1])*p[3]; if(q<z) z=Math.max(q,z*0.55); }
    z+=(rzFbm(x*0.28,y*0.28,seed,3)-0.5)*R*0.08;
    for(const c of cracks){ const d=segD(x,y,c); if(d<0.9) z-=(0.9-d)*0.9; }
    return Math.max(0.3,z);
  },(x,y)=>{
    let c=rzMix(K.v,K.c,clamp(0.5+(rzFbm(x*0.12,y*0.12,seed+4,2)-0.5)*1.6,0,1));
    if(K.strata){ const s=Math.sin((y+rzFbm(x*0.08,y*0.08,seed,2)*10)*0.9); c=rzCol(c,s*0.12); }
    const sp=rzHash(Math.floor(x*2.3),Math.floor(y*2.3),seed); if(sp>0.93) c=rzCol(c,0.12); else if(sp<0.06) c=rzCol(c,-0.18);
    for(const cr of cracks){ const d=segD(x,y,cr); if(d<0.5){ c=rzCol(c,-0.3*(1-d/0.5)); break; } }
    return c;
  },K.gloss?RZ.GLOSS:RZ.ROCK);
  return {v,top};
}
function rzRockFinish(F,R,K,seed){
  // snow settles on the high, north-facing parts; moss and lichen grow on the tops facing the light
  const k=F.k, W=F.W; let hm=1e-3; for(let i=0;i<F.n;i++) if(F.h0[i]>hm) hm=F.h0[i];
  rzEach(F,(x,y,id)=>{ const i=id%W, j=(id/W)|0, hr=F.h0[id]/hm, n1=rzFbm(x*0.22+9,y*0.22,seed+11,3), lit=-(x+y)/(R*1.6);
    if(K.snow){ if(hr+(n1-0.5)*0.55-y/(R*3.2)>0.5){ F.m[id]=RZ.SNOW; F.c[id*3]=236; F.c[id*3+1]=240; F.c[id*3+2]=246; F.h0[id]+=0.9*k; } return; }
    if(K.moss&&hr+(n1-0.5)*0.7+lit*0.25>0.62){ const f=0.85+rzVN(x*1.4,y*1.4,seed)*0.3; F.c[id*3]=K.li[0]*f; F.c[id*3+1]=K.li[1]*f; F.c[id*3+2]=K.li[2]*f; F.m[id]=RZ.LEAF; F.h0[id]+=0.4*k; return; }
    if(!K.gloss&&n1>0.66&&hr>0.35){ const c=rzMix([F.c[id*3],F.c[id*3+1],F.c[id*3+2]],K.li,0.45); F.c[id*3]=c[0]; F.c[id*3+1]=c[1]; F.c[id*3+2]=c[2]; } });
}
function rzMkRock(seed,kind){
  const rng=mulberry32(seed), R=kind==='crag'?28:18, F=rzSq(R), K=RZROCK[kind==='crag'?'red':kind]||RZROCK.grey;
  rzContact(F,0.6,1.6,R*0.98,R*0.84,0.5);
  rzRockBody(F,R,rng,K,kind==='crag'?0.72:0.6,seed);
  if(kind==='crag'){ const rng2=mulberry32(seed+5); for(let i=0;i<2;i++){ const a=Math.PI*0.25+(rng2()-0.5)*2.2+i*Math.PI, d=R*0.5; rzRockBody(F,R*(0.36+rng2()*0.1),rng2,K,0.75,seed+i*7,Math.cos(a)*d,Math.sin(a)*d*0.8); } }
  rzRockFinish(F,R,K,seed);
  return rzShade(F,{ao:0.2,aoR:R>20?2.4:1.8,rim:0.4,bump:1.15,sat:0.96});
}

// ---------- relighting a painted canvas: its brightness is read as relief (bright stands out, dark sinks in), then lit
// from the art light with crevice occlusion, a soft fall-off at the silhouette and a cool-shadow, warm-light split.
// Used for houses and landmark sprites painted by the older code, so their textures read as real materials.
// o: bump (relief per brightness, px), ao, aoR (px), edge (px of fall-off at the outline), sat, split, gain
function rzRelight(cv,o){
  o=o||{}; const W=cv.width, Hh=cv.height; if(!W||!Hh) return cv;
  const g=cv.getContext('2d'); let id; try{ id=g.getImageData(0,0,W,Hh); }catch(e){ return cv; }
  const d=id.data, n=W*Hh, h=new Float32Array(n), a=new Float32Array(n), tmp=new Float32Array(n), hb=new Float32Array(n), hb2=new Float32Array(n), ab=new Float32Array(n);
  const bump=o.bump==null?3:o.bump, edge=o.edge==null?3:o.edge;
  for(let i=0;i<n;i++){ const A=d[i*4+3]/255; a[i]=A; if(A>0) h[i]=(0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2])/255*bump; }
  rzBlur(a,W,Hh,Math.max(1,Math.round(edge)),ab,tmp);
  for(let i=0;i<n;i++) if(a[i]>0) h[i]+=Math.min(1,ab[i]*1.6)*edge*1.2;
  const r=Math.max(1,Math.round(o.aoR||3)); rzBlur(h,W,Hh,r,hb,tmp); rzBlur(hb,W,Hh,r,hb2,tmp);
  const Lx=RZL[0], Ly=RZL[1], Lz=RZL[2], ao=o.ao==null?0.12:o.ao, sat=o.sat==null?0.9:o.sat, sp=o.split==null?1:o.split, gain=o.gain||1;
  const flat=Lz*0.85+0.15;   // the light a flat, unoccluded surface gets: such pixels keep their painted colour
  for(let y=0;y<Hh;y++) for(let x=0;x<W;x++){ const i=y*W+x; if(a[i]<=0) continue;
    const hL=x>0?h[i-1]:0, hR=x<W-1?h[i+1]:0, hU=y>0?h[i-W]:0, hD=y<Hh-1?h[i+W]:0;
    let nx=(hL-hR)*0.5, ny=(hU-hD)*0.5; const il=1/Math.sqrt(nx*nx+ny*ny+1); nx*=il; ny*=il;
    const dl=nx*Lx+ny*Ly+il*Lz, dif=Math.max(0,dl*0.85+0.15)/flat;
    let oc=1+(h[i]-hb2[i])*ao; oc=oc<0.55?0.55:oc>1.12?1.12:oc;
    const k=(0.42+0.58*dif)*oc*gain, sh=1-Math.min(1,k);   // sh: how far into shadow, for the cool tint
    let R=d[i*4]*k, G=d[i*4+1]*k, B=d[i*4+2]*k;
    if(sp){ R+=(-10*sh+(k>1?6*(k-1)*sp:0))*sp; G+=(-3*sh+(k>1?3*(k-1)*sp:0))*sp; B+=(8*sh-(k>1?5*(k-1):0))*sp; }
    const l=0.299*R+0.587*G+0.114*B; R=l+(R-l)*sat; G=l+(G-l)*sat; B=l+(B-l)*sat;
    d[i*4]=R<0?0:R>255?255:R; d[i*4+1]=G<0?0:G>255?255:G; d[i*4+2]=B<0?0:B>255?255:B; }
  g.putImageData(id,0,0); return cv;
}
// ---------- the sprite set for the Realistic look (called by buildSprites in a3_art.js)
const RZV={oak:6,birch:4,pine:6,spine:6,willow:4,dead:4,char:3,bush:6,shrub:4,fshrub:4,mbush:4,rock:5,mossrock:4,crag:4,obsid:3,srock:4,spike:3,stump:3,bones:2,reed:4,herb:1,vent:1};
function rzBuildSprites(){
  const t0=performance.now(), V=RZV, sq=(n,f)=>{ const a=[], q=performance.now(); for(let i=1;i<=n;i++) a.push(f(i)); RZT.last=+(performance.now()-q).toFixed(1); return a; }, T=RZT.kinds={};
  SPR.oak=sq(V.oak,i=>rzMkOak(1000+i,'oak')); T.oak=RZT.last; SPR.birch=sq(V.birch,i=>rzMkOak(2000+i,'birch')); T.birch=RZT.last;
  SPR.pine=sq(V.pine,i=>rzMkPine(3000+i,false)); T.pine=RZT.last; SPR.spine=sq(V.spine,i=>rzMkPine(3100+i,true)); T.spine=RZT.last;
  SPR.willow=sq(V.willow,i=>rzMkWillow(3200+i)); T.willow=RZT.last; SPR.dead=sq(V.dead,i=>rzMkDead(4000+i,false)); T.dead=RZT.last; SPR.char=sq(V.char,i=>rzMkDead(4500+i,true)); T.char=RZT.last;
  SPR.bush=sq(V.bush,i=>rzMkBush(7000+i,'bush')); T.bush=RZT.last; SPR.shrub=sq(V.shrub,i=>rzMkBush(7100+i,'shrub')); T.shrub=RZT.last; SPR.fshrub=sq(V.fshrub,i=>rzMkBush(7200+i,'fshrub')); T.fshrub=RZT.last; SPR.mbush=sq(V.mbush,i=>rzMkBush(7300+i,'mbush')); T.mbush=RZT.last;
  SPR.rock=sq(V.rock,i=>rzMkRock(5000+i,'grey')); T.rock=RZT.last; SPR.mossrock=sq(V.mossrock,i=>rzMkRock(5100+i,'moss')); T.mossrock=RZT.last; SPR.crag=sq(V.crag,i=>rzMkRock(5200+i,'crag')); T.crag=RZT.last; SPR.obsid=sq(V.obsid,i=>rzMkRock(5300+i,'obsid')); T.obsid=RZT.last; SPR.srock=sq(V.srock,i=>rzMkRock(5400+i,'snow')); T.srock=RZT.last;
  SPR.spike=sq(V.spike,i=>rzMkSpike(6000+i)); T.spike=RZT.last; SPR.stump=sq(V.stump,i=>rzMkStump(8000+i)); T.stump=RZT.last; SPR.bones=sq(V.bones,i=>rzMkBones(8100+i)); T.bones=RZT.last; SPR.reed=sq(V.reed,i=>rzMkReed(8300+i)); T.reed=RZT.last;
  SPR.herb=[rzMkHerb(8200)]; SPR.vent=[rzMkVent()]; SPR.bigoak=rzMkBigOak();
  SPR.shadow=mkShadow();
  RZT.build=+(performance.now()-t0).toFixed(1);
  return true;
}
const RZT={build:0};

// ---------- caches keyed by the look generation
const RZC={gen:-1,m:new Map()};
function rzCache(key,make){ if(RZC.gen!==LOOK.gen){ RZC.m.clear(); RZC.gen=LOOK.gen; } let c=RZC.m.get(key); if(!c){ c=make(); RZC.m.set(key,c); } return c; }

// ---------- debug: a sheet of sprites on a grass background (window.__ebDbg.rzSheet(['oak','pine'],scale))
function rzSheet(keys,sc,bg){
  sc=sc||1; const list=[]; for(const k of keys){ const L=Array.isArray(SPR[k])?SPR[k]:SPR[k]?[SPR[k]]:[]; for(const c of L) list.push(c); }
  const cell=Math.max(...list.map(c=>c.width/SS*sc))+6, cols=Math.min(8,list.length), rows=Math.ceil(list.length/cols);
  const cv=mkCanvas(cols*cell,rows*cell), g=cv.getContext('2d'); g.fillStyle=bg||'#5f7a3c'; g.fillRect(0,0,cv.width,cv.height);
  list.forEach((c,i)=>{ const w=c.width/SS*sc, h=c.height/SS*sc; g.drawImage(c,(i%cols)*cell+(cell-w)/2,Math.floor(i/cols)*cell+(cell-h)/2,w,h); });
  return cv.toDataURL();
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{rzSheet,rzBuildSprites,RZT,SPR,buildSprites:()=>buildSprites()});
// the Realistic sprites are lit from the art light, so a prop never turns (Classic spins each one at random);
// the old angle is kept and handed back when the look changes (propSprite in a3_art.js)
function rzNoTurn(p){ if(p.rz0===undefined){ p.rz0=p.rot; p.rot=0; } }
// debug: a sheet of house sprites (window.__ebDbg.rzHouseSheet(indices into HOUSES, scale))
function rzHouseSheet(ids,sc){
  sc=sc||1; const cs=ids.map(i=>houseSprite(HOUSES[i])), cw=Math.max(...cs.map(c=>c.width/HSC*sc))+8, ch=Math.max(...cs.map(c=>c.height/HSC*sc))+8, cols=Math.min(4,cs.length), rows=Math.ceil(cs.length/cols);
  const cv=mkCanvas(cols*cw,rows*ch), g=cv.getContext('2d'); g.fillStyle='#5f7a3c'; g.fillRect(0,0,cv.width,cv.height);
  cs.forEach((c,i)=>{ const w=c.width/HSC*sc, h=c.height/HSC*sc; g.drawImage(c,(i%cols)*cw+(cw-w)/2,Math.floor(i/cols)*ch+(ch-h)/2,w,h); });
  return cv.toDataURL();
}
window.__ebDbg.rzHouseSheet=rzHouseSheet; window.__ebDbg.rzRelight=rzRelight; window.__ebDbg.rzRoofTex=(...a)=>rzRoofTex(...a);
// ---------- houses: the painted house of a3_art.js (hzPlan decides everything), with Realistic roof and wall
// materials (rzRoofTex, rzWallTex) and this relight pass over the finished canvas
function rzHousePost(c,L){
  if(RZT.noPost) return;
  rzRelight(c,{bump:4.5,ao:0.1,aoR:3,edge:2.5,sat:0.88});
  // a lit ridge: the line where the two roof planes meet catches the light
  const g=c.getContext('2d'); g.setTransform(HSC,0,0,HSC,HSC*(HPX+L.W),HSC*(HPT+L.H));
  if(!L.vert&&L.ridgeY!=null&&L.st!=='forge'){ const hi=L.hip?Math.min(L.W*0.45,(L.eaveY-L.topY)*0.5):0, x0=-L.W-6+hi, x1=L.W+6-hi;
    g.fillStyle=L.snow?'rgba(255,255,255,.4)':'rgba(255,244,214,.3)'; g.fillRect(x0+1,L.ridgeY-(L.roof==='thatch'?2.7:1.9),x1-x0-2,0.9);
    g.fillStyle='rgba(20,14,24,.16)'; g.fillRect(x0+1,L.ridgeY+(L.roof==='thatch'?2.6:1.8),x1-x0-2,1.6); }
  g.setTransform(1,0,0,1,0,0);
}
// detail tiles: grey (mid 128) pictures of fibre, grain, grit and mottling, laid over a material's colour with the
// soft-light blend so they shade it without changing its hue. Built once per look generation.
function rzTile(key,S,paint){ return rzCache('tile:'+key,()=>{ const c=mkCanvas(S,S), g=c.getContext('2d'); g.fillStyle='rgb(128,128,128)'; g.fillRect(0,0,S,S); paint(g,S,mulberry32(key.length*977+S)); return c; }); }
function rzPat(g,key){ const S={straw:64,grainV:64,grainH:64,grit:64,plaster:96,slate:64,bark:64}[key]||64;
  const t=rzTile(key,S,(q,S,rng)=>{
    const wrap=(f)=>{ for(const ox of [-S,0,S]) for(const oy of [-S,0,S]){ q.save(); q.translate(ox,oy); f(); q.restore(); } };
    if(key==='straw'||key==='grainV'||key==='grainH'||key==='bark'){
      const n=key==='straw'?900:key==='bark'?500:260, strokes=[];
      for(let i=0;i<n;i++){ const x=rng()*S, y=rng()*S, L=key==='straw'?5+rng()*12:key==='bark'?4+rng()*10:14+rng()*30, a=(rng()-0.5)*(key==='straw'?0.3:0.06), v=Math.round(key==='bark'?40+rng()*150:70+rng()*120), w=key==='straw'?0.6+rng()*0.7:key==='bark'?0.8+rng()*1.6:0.5+rng()*0.8; strokes.push([x,y,L,a,v,w]); }
      q.lineCap='round';
      wrap(()=>{ for(const [x,y,L,a,v,w] of strokes){ q.strokeStyle=`rgba(${v},${v},${v},.55)`; q.lineWidth=w; q.beginPath(); if(key==='grainH'){ q.moveTo(x,y); q.lineTo(x+L,y+a*L); } else { q.moveTo(x,y); q.lineTo(x+a*L,y+L); } q.stroke(); } });
    } else {
      const id=q.getImageData(0,0,S,S), d=id.data, sd=key.length*31;
      for(let y=0;y<S;y++) for(let x=0;x<S;x++){ const i=(y*S+x)*4; let v;
        // tileable noise: the lattice wraps at the tile size
        const vn=(fx,fy,p,s)=>{ const X=fx*p/S, Y=fy*p/S, xi=Math.floor(X), yi=Math.floor(Y), tx=X-xi, ty=Y-yi, u=tx*tx*(3-2*tx), w=ty*ty*(3-2*ty), h=(a,b)=>rzHash(((a%p)+p)%p,((b%p)+p)%p,s); const A=h(xi,yi), B=h(xi+1,yi), C=h(xi,yi+1), D=h(xi+1,yi+1); return A+(B-A)*u+(C-A)*w+(A-B-C+D)*u*w; };
        if(key==='grit') v=128+(vn(x,y,16,sd)-0.5)*70+(vn(x,y,32,sd+1)-0.5)*50+(rzHash(x,y,sd)-0.5)*44;
        else if(key==='plaster') v=128+(vn(x,y,6,sd)-0.5)*44+(vn(x,y,24,sd+2)-0.5)*26+(rzHash(x,y,sd)>0.985?-40:0);
        else v=128+(vn(x,y,8,sd)-0.5)*30+(rzHash(x,y,sd)-0.5)*26+Math.sin((y+vn(x,y,4,sd+5)*6)*1.3)*8; // slate cleavage
        d[i]=d[i+1]=d[i+2]=v<0?0:v>255?255:v; }
      q.putImageData(id,0,0);
    }
  });
  return g.createPattern(t,'repeat');
}
function rzOver(g,key,x,y,w,h,a){ g.save(); g.globalCompositeOperation='soft-light'; g.globalAlpha=a==null?1:a; g.fillStyle=rzPat(g,key); g.fillRect(x,y,w,h); g.restore(); }
const rzMulC=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
// roof materials (the same frame as hzRoofTex: u along the roof, v from the ridge (v0) down to the eave (v1),
// vs the foreshortening of the plane)
function rzRoofTex(g,mat,col,u0,u1,v0,v1,vs,rng0){
  const sp=u1-u0, ht=v1-v0, c=hzC(col), rng=mulberry32(Math.floor(rng0()*1e9));
  if(mat==='thatch'){
    const base=rzMix(c,[150,132,100],0.22);
    g.fillStyle=hzLG(g,0,v0,0,v1,[[0,hzS(rzCol(base,0.05))],[0.6,hzS(base)],[1,hzS(rzMix(base,[112,100,82],0.35))]]); g.fillRect(u0,v0,sp,ht);
    // weathered patches and rain streaks running down the slope
    for(let i=0;i<sp*ht/260;i++){ g.fillStyle=rng()<0.5?'rgba(92,80,62,.16)':'rgba(255,236,190,.1)'; g.beginPath(); g.ellipse(u0+rng()*sp,v0+rng()*ht,6+rng()*14,(3+rng()*7)*vs,0,0,TAU); g.fill(); }
    for(let u=u0+rng()*5;u<u1;u+=3+rng()*7){ g.fillStyle=`rgba(70,56,40,${0.05+rng()*0.09})`; g.fillRect(u,v0+rng()*ht*0.4,0.8+rng()*2,ht); }
    rzOver(g,'straw',u0,v0,sp,ht,1);
    // courses: each layer of bundles ends in a fringe of cut straw that catches the light, then throws a soft
    // shadow on the layer below
    const bh=7*vs;
    for(let v=v1-bh;v>v0-1;v-=bh){
      g.fillStyle='rgba(36,22,10,.34)'; g.beginPath(); g.moveTo(u0,v); for(let u=u0;u<u1;u+=6){ g.quadraticCurveTo(u+3,v+1.7*vs+rng()*0.7,u+6,v); } g.lineTo(u1,v+2.6*vs); g.lineTo(u0,v+2.6*vs); g.closePath(); g.fill();
      g.fillStyle='rgba(255,236,190,.16)'; g.fillRect(u0,v-1.8*vs,sp,1.4*vs);
      g.strokeStyle='rgba(255,240,205,.28)'; g.lineWidth=0.4; g.beginPath(); for(let u=u0+rng();u<u1;u+=0.9+rng()*0.9){ const l=(0.8+rng()*1.4)*vs; g.moveTo(u,v-l); g.lineTo(u+(rng()-0.5)*0.4,v+0.2); } g.stroke();
    }
    return;
  }
  if(mat==='slate'){
    g.fillStyle=hzS(rzMulC(c,0.5)); g.fillRect(u0,v0,sp,ht);
    const rh=3.9*vs; let row=0;
    for(let v=v1;v>v0-rh;v-=rh,row++){ let u=u0-(row%2)*3-rng()*0.8;
      while(u<u1){ const sw=4.6+rng()*2.4, r=rng(), cc=r<0.08?rzMix(c,[120,128,120],0.4):r<0.14?rzMulC(c,0.82):rzJit(c,rng,0.18);
        g.fillStyle=hzS(cc); g.fillRect(u+0.4,v-rh+0.35,sw-0.8,rh-0.6);
        g.fillStyle='rgba(255,255,255,.1)'; g.fillRect(u+0.4,v-rh+0.35,sw-0.8,rh*0.35);
        g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(u+sw-1.1,v-rh+0.4,0.7,rh-0.7); u+=sw; }
      g.fillStyle='rgba(10,12,18,.35)'; g.fillRect(u0,v-0.7,sp,0.8);
    }
    rzOver(g,'slate',u0,v0,sp,ht,0.8);
    return;
  }
  if(mat==='clay'){
    // barrel tiles: columns of half-round tiles, lit on the left, each row lapping over the one below
    g.fillStyle=hzS(rzMulC(c,0.45)); g.fillRect(u0,v0,sp,ht);
    const tw=4.6, rh=4.8*vs;
    for(let u=u0;u<u1;u+=tw){ const cc=rzJit(c,rng,0.12);
      g.fillStyle=hzLG(g,u,0,u+tw,0,[[0,hzS(rzCol(cc,0.14))],[0.35,hzS(cc)],[1,hzS(rzMulC(cc,0.62))]]); g.fillRect(u+0.25,v0,tw-0.5,ht); }
    let row=0;
    for(let v=v1;v>v0-rh;v-=rh,row++){ for(let u=u0;u<u1;u+=tw){ const k=0.9+rng()*0.2;
      g.fillStyle='rgba(40,10,4,.34)'; g.beginPath(); g.arc(u+tw/2,v+0.8,tw/2-0.2,0,Math.PI); g.fill();
      g.fillStyle=`rgba(255,${200*k|0},${160*k|0},.18)`; g.beginPath(); g.ellipse(u+tw/2-0.4,v-0.6,tw/2-0.6,0.8,0,0,TAU); g.fill();
      if(rng()<0.06){ g.fillStyle='rgba(60,70,40,.25)'; g.fillRect(u+0.4,v-rh,tw-0.8,rh); } } }
    rzOver(g,'grit',u0,v0,sp,ht,0.6);
    return;
  }
  // wooden shingles: staggered rows, split grain, a few weathered grey or mossy ones
  g.fillStyle=hzS(rzMulC(c,0.42)); g.fillRect(u0,v0,sp,ht);
  const rh=4.4*vs;
  for(let v=v1;v>v0-rh;v-=rh){ let u=u0-rng()*6;
    while(u<u1){ const sw=3+rng()*4.4, r=rng(), cc=r<0.1?rzMix(c,[132,126,116],0.5):r<0.15?rzMix(c,[92,104,60],0.35):r<0.22?rzMulC(c,0.78):rzJit(c,rng,0.22);
      g.fillStyle=hzLG(g,0,v-rh,0,v,[[0,hzS(rzMulC(cc,0.86))],[1,hzS(rzCol(cc,0.06))]]); g.fillRect(u+0.3,v-rh,sw-0.6,rh-0.2);
      if(rng()<0.25){ g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(u+sw*(0.3+rng()*0.4),v-rh*0.8,0.45,rh*0.7); }
      u+=sw; }
    g.fillStyle='rgba(0,0,0,.36)'; g.fillRect(u0,v-0.9,sp,0.9);
  }
  rzOver(g,'grainV',u0,v0,sp,ht,0.9);
}
// wall materials (the same frame as hzWallTex)
function rzWallTex(g,mat,col,x0,y0,x1,y1,rng0){
  const w=x1-x0, h=y1-y0, c=hzC(col), rng=mulberry32(Math.floor(rng0()*1e9));
  switch(mat){
    case 'plaster':{
      g.fillStyle=hzS(c); g.fillRect(x0,y0,w,h);
      rzOver(g,'plaster',x0,y0,w,h,1);
      // grime toward the ground and under the eaves, a few hairline cracks
      g.fillStyle=hzLG(g,0,y0,0,y1,[[0,'rgba(70,56,40,.14)'],[0.25,'rgba(70,56,40,0)'],[0.72,'rgba(90,74,52,0)'],[1,'rgba(90,74,52,.3)']]); g.fillRect(x0,y0,w,h);
      g.strokeStyle='rgba(80,64,48,.28)'; g.lineWidth=0.35; g.beginPath(); for(let i=0;i<w*h/900;i++){ let x=x0+rng()*w, y=y0+rng()*h; g.moveTo(x,y); for(let k=0;k<3;k++){ x+=(rng()-0.5)*5; y+=rng()*3; g.lineTo(x,y); } } g.stroke();
      break; }
    case 'plank':{
      for(let y=y1;y>y0;y-=4){ const cc=rzJit(c,rng,0.18); g.fillStyle=hzLG(g,0,y-4,0,y,[[0,hzS(rzCol(cc,0.08))],[1,hzS(rzMulC(cc,0.84))]]); g.fillRect(x0,y-4,w,4);
        g.fillStyle='rgba(24,12,4,.42)'; g.fillRect(x0,y-0.8,w,0.8);
        g.fillStyle='rgba(24,12,4,.3)'; for(let x=x0+rng()*20;x<x1;x+=14+rng()*24) g.fillRect(x,y-4,0.6,3.2);
        if(rng()<0.3){ g.fillStyle='rgba(40,22,10,.35)'; g.beginPath(); g.ellipse(x0+rng()*w,y-2,0.9,0.6,0,0,TAU); g.fill(); } }
      rzOver(g,'grainH',x0,y0,w,h,0.9);
      break; }
    case 'board':{
      g.fillStyle=hzS(c); g.fillRect(x0,y0,w,h);
      for(let x=x0;x<x1;x+=5){ const cc=rzJit(c,rng,0.1); g.fillStyle=hzS(cc); g.fillRect(x,y0,5,h); g.fillStyle='rgba(255,250,240,.12)'; g.fillRect(x+0.4,y0,0.8,h); g.fillStyle='rgba(0,0,0,.26)'; g.fillRect(x+4.6,y0,0.6,h); }
      rzOver(g,'grainV',x0,y0,w,h,0.55);
      g.fillStyle=hzLG(g,0,y0,0,y1,[[0,'rgba(0,0,0,0)'],[0.75,'rgba(60,50,40,0)'],[1,'rgba(60,50,40,.22)']]); g.fillRect(x0,y0,w,h);
      break; }
    case 'stone': case 'rough': case 'ashlar':{
      const ash=mat==='ashlar', rough=mat==='rough';
      g.fillStyle=hzS(rzMulC(c,ash?0.66:0.5)); g.fillRect(x0,y0,w,h);
      let y=y1;
      while(y>y0-1){
        const ch=ash?5.5:rough?5+rng()*3.4:3.6+rng()*2.4; let x=x0-rng()*(ash?10:6);
        while(x<x1){ const sw=ash?11+rng()*3:rough?6.5+rng()*8:4.2+rng()*6.4; let cc=rzJit(c,rng,ash?0.1:0.3);
          if(!ash&&rng()<0.3) cc=rzMix(cc,rng()<0.5?[150,130,104]:[112,116,120],0.35);
          const rr=ash?0.4:1.3+rng()*0.6;
          g.fillStyle=hzLG(g,x,y-ch,x+sw*0.6,y,[[0,hzS(rzCol(cc,0.12))],[0.55,hzS(cc)],[1,hzS(rzMulC(cc,0.72))]]); rrect(g,x+0.45,y-ch+0.45,sw-0.9,ch-0.9,rr); g.fill();
          x+=sw; }
        y-=ch;
      }
      rzOver(g,'grit',x0,y0,w,h,0.85);
      break; }
    case 'brick':{
      g.fillStyle=hzS(rzMix(c,[196,184,164],0.55)); g.fillRect(x0,y0,w,h);
      let row=0; for(let y=y1;y>y0-1;y-=3.2,row++){ for(let x=x0-(row%2)*3.2;x<x1;x+=6.4){ const r=rng(), cc=r<0.08?rzMulC(c,0.7):r<0.14?rzCol(c,0.14):rzJit(c,rng,0.16);
        g.fillStyle=hzS(cc); g.fillRect(x+0.35,y-2.85,5.7,2.5); g.fillStyle='rgba(255,230,210,.12)'; g.fillRect(x+0.35,y-2.85,5.7,0.6); g.fillStyle='rgba(0,0,0,.16)'; g.fillRect(x+0.35,y-0.95,5.7,0.6); } }
      rzOver(g,'grit',x0,y0,w,h,0.7);
      break; }
    case 'log':{
      const lh=5.2;
      g.fillStyle='rgba(200,184,150,1)'; g.fillRect(x0,y0,w,h); // the chinking between the logs
      for(let y=y1;y>y0-1;y-=lh){
        const cc=rzJit(c,rng,0.16);
        g.fillStyle=hzLG(g,0,y-lh,0,y,[[0,hzS(rzCol(cc,0.16))],[0.4,hzS(cc)],[0.85,hzS(rzMulC(cc,0.62))],[1,hzS(rzMulC(cc,0.45))]]); g.fillRect(x0,y-lh+0.25,w,lh-0.5);
      }
      rzOver(g,'bark',x0,y0,w,h,0.8);
      break; }
    default: return hzWallTex0(g,mat,col,x0,y0,x1,y1,rng0);
  }
}

// ---------- landmarks, cave mouths and columns (a3b_art2.js): their painted sprites, relit once as they are cached.
// RZ2.on is raised only while drawLandmark, drawCaveMouth and drawColumn run, so other users of r2S (rooms,
// the acts' own structures) keep their sprites as they are.
const RZ2={on:0};
{ const base=r2S; r2S=function(key,w,h,ox,oy,draw){
  if(!LOOK.re||!RZ2.on) return base(key,w,h,ox,oy,draw);
  const k='rz:'+key; let c=R2.spr.get(k); if(c) return c;
  c=base(k,w,h,ox,oy,draw); rzRelight(c,{bump:3.2,ao:0.1,aoR:2,edge:2,sat:0.9}); return c;
}; }
