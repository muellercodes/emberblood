
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
  return kind==='birch'?rzBroadleaf(seed,48,{pal:RZP.birch,inner:RZP.birchIn,birch:1}):rzBroadleaf(seed,48,{pal:[RZP.oak,RZP.oak2,RZP.oak3][seed%3],inner:RZP.oakIn});
}
// a broadleaf crown of radius about R. o: pal, inner, birch (open, small leaves, pale branches), bark (branch
// colour), berries [rgb], flowers [rgb...], glints (silver specks), k (crown size 0..1)
function rzBroadleaf(seed,R,o){
  const rng=mulberry32(seed), F=rzSq(R), pal=o.pal;
  if(o.birch){
    rzCanopy(F,{rng,R:R*(o.k||0.9),n:11+Math.floor(rng()*3),sub:Math.round(120*(R/48)**2),sr:[0.07,0.12],ls:[1.0,1.6],pal,innerCol:o.inner,innerK:0.5,open:0.55,tint:0.35,
      under:(F)=>{ // pale branches showing through the open crown
        const bc=o.bark||RZP.birchBark, tx=rzBarkTex(seed,1.2,true);
        for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.6, L=R*(0.34+rng()*0.22); rzCap(F,0,0,R*0.16,Math.cos(a)*L,Math.sin(a)*L,R*0.1,2.6*R/48+0.6,0.8,bc,RZ.BARK,(t,u,len)=>tx(t,u,len)*(rzHash(Math.floor(t*len*0.6),3,seed)>0.8?0.35:1)); }
      }});
  }else{
    rzCanopy(F,{rng,R:R*(o.k||(0.88+rng()*0.1)),n:8+Math.floor(rng()*5),ls:R<40?[1.3,2.2]:[1.5,2.5],pal,innerCol:o.inner||rzCol(pal[0],-0.42),tint:0.32,ey:0.88+rng()*0.16});
  }
  const top=(n,r,col,m)=>{ for(let i=0;i<n;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.72; rzDome(F,Math.cos(a)*d,Math.sin(a)*d,r,r,0,R*0.6,r,rzJit(col,rng,0.15),m); } };
  if(o.berries) top(10+Math.floor(rng()*8),1.3,o.berries,RZ.GLOSS);
  if(o.flowers) for(const c of o.flowers) top(14,1.2,c,RZ.CLOTH);
  if(o.glints) top(8,0.8,[236,232,250],RZ.GLOSS);
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
// o (conifers): pal [deep, mid, light], tip (new growth), snow, frost (rime on the needle tips), key (cache name)
function rzFrond(v,snow,o){
  o=o||{}; const key=o.key||'pine';
  return rzCache('frond'+key+v+(snow?'s':''),()=>{
    const T=rzHF(42,22,0,11), rng=mulberry32(3300+v*17+key.length*5), P=o.pal||(snow?RZP.spine:RZP.pine), tipC=o.tip||RZP.pineTip;
    rzCap(T,0,0,2.2,40,0,0.6,1.5,0.45,rzCol(P[0],-0.3),RZ.NEEDLE);
    for(let x=0.5;x<40.5;x+=0.85){
      const w=10*Math.pow(1-x/46,0.7)+1.8, tip=x>31;
      for(const sd of [-1,1]) for(let n=0;n<2;n++){
        const a=sd*(0.5+rng()*0.55), len=w*(0.75+rng()*0.4), cx=x+Math.cos(a)*len*0.5, cy=Math.sin(a)*len*0.5;
        const tone=clamp(0.3+x/40*0.35+(rng()-0.5)*0.45+(n?0.1:0),0,1); let col=tip&&rng()<0.6?rzMix(P[2],tipC,rng()*0.8):tone<0.5?rzMix(P[0],P[1],tone*2):rzMix(P[1],P[2],(tone-0.5)*2);
        if(o.frost&&rng()<o.frost*(0.4+x/60)) col=rzMix(col,[214,228,238],0.7);
        rzLeaf(T,cx,cy,len*0.52,0.6,a,1.6+rng()*0.5,0,-sd*0.22,rzJit(col,rng,0.1),RZ.NEEDLE);
      }
    }
    if(snow) for(let x=1.5;x<31;x+=1.3){ if(rng()<0.16) continue; const w=10*Math.pow(1-x/46,0.7)*0.42+0.9;
      rzDome(T,x+(rng()-0.5)*0.8,(rng()-0.5)*w*0.4,1.8+rng()*1.2,w*(0.7+rng()*0.5),(rng()-0.5)*0.4,2.3,1.4,rzJit([234,240,246],rng,0.03),RZ.SNOW,0.55); }
    return T;
  });
}
function rzMkPine(seed,snow){ return rzConifer(seed,40,{snow}); }
function rzConifer(seed,R,o){
  o=o||{}; const rng=mulberry32(seed), F=rzSq(R), S=[234,240,246], snow=o.snow, k=R/40;
  const tiers=[[R,1.5,13],[R*0.78,7,11],[R*0.56,12,9],[R*0.34,17,7]], r0=rng()*TAU;
  rzDome(F,0,0,R*0.6,R*0.6,0,0,6,o.inCol||RZP.pineIn,RZ.NEEDLE);
  for(let L=0;L<tiers.length;L++){
    const [r,z0,nb]=tiers[L], z=z0*k, rot=r0+L*Math.PI/nb+(rng()-0.5)*0.3;
    for(let b=0;b<nb;b++){
      const a=rot+b/nb*TAU+(rng()-0.5)*0.3, len=r*(0.88+rng()*0.16), sw=(0.75+L*0.06+rng()*0.25)*Math.min(1.25,Math.max(0.85,k)), t=0.9+rng()*0.2;
      rzStamp(F,rzFrond((seed+b+L)%3,snow&&(L>0||rng()<0.75),o),0,0,a,len/40,sw,z,Math.min(z+1,(4.5+L*0.6)*k),[t,t*(0.98+rng()*0.04),t]);
    }
  }
  for(let b=0;b<5;b++) rzStamp(F,rzFrond(b%3,snow,o),0,0,r0+b/5*TAU+0.3,0.16*k,0.5,20*k,1,[1.08,1.08,1.05]);
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
function rzMkDead(seed,charred,o){
  const rng=mulberry32(seed), R=(o&&o.R)||40, F=rzSq(R), col=charred?RZP.char:RZP.dead, sd=seed%97;
  const tex=(t,u,len)=>{ const along=t*len; let v=0.78+0.32*rzVN(u*2.6+sd,along*0.5,sd); const cr=rzVN(u*4.5,along*0.16,sd+5); if(cr<0.28) v*=0.55+cr; if(u<-0.2) v*=1.05; return v; };
  const segs=[];
  const br=(x,y,z,a,len,w,d)=>{ if(d>4||len<4) return; const x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len, z2=z-len*0.22; segs.push([x,y,z,x2,y2,z2,w,w*0.66]); const k2=1+Math.floor(rng()*2); for(let i=0;i<=k2;i++) br(x2,y2,z2,a+(rng()-0.5)*1.4,len*(0.55+rng()*0.2),w*0.64,d+1); };
  const n=4+Math.floor(rng()*3); for(let i=0;i<n;i++) br(0,0,16*R/40,i/n*TAU+rng()*0.6,R*(0.42+rng()*0.2),3.4*Math.min(1,R/40+0.1),0);
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
    const F=rzHF(16,64,8,0), c={birch:RZP.birchBark,pine:RZP.pineBark,spine:RZP.pineBark,willow:RZP.willowBark,dead:RZP.dead,char:RZP.char,palm:[150,116,80],stone:[84,80,90],bone:[214,204,184],iron:[58,56,60],glass:[150,186,214]}[kind]||RZP.bark;
    const sd=kind.length*13, tx=rzBarkTex(sd,kind==='pine'||kind==='spine'?1.4:2.2,true);
    // a vertical tapered cylinder (top at y 0, base at y 64), widening into the root flare
    rzContact(F,0,63,7.5,2.6,0.45);
    rzCap(F,0,62,6,0,0,6,6.2,4.4,c,RZ.BARK,(t,u,len)=>{ let v=tx(t,u,len); if(kind==='birch'&&rzHash(Math.floor(t*len*0.45),Math.floor(u*1.5+2),sd)>0.72) v*=0.28; if(kind==='palm') v=0.8+0.3*Math.abs(Math.sin(t*len*0.55)); if(kind==='iron'||kind==='glass'||kind==='bone') v=0.95+0.05*v; return v; },1);
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
    const K=RZK[p.k], tk=K?K.trunk:rzTrunkKind(p);
    if(tk&&(L>2.5||p.k==='dead')) rzTrunk(tk,p.x,p.y,dx,dy,(p.k==='dead'?14:K&&K.tw||12)*p.s,L>5&&(!K||K.roots!==false)?Math.min(1,(L-5)/10)*p.s:0);
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
function rzMkBush(seed,kind,o){
  o=o||{}; const rng=mulberry32(seed), R=o.R||15, F=rzSq(R), P=o.pal||RZP[kind]||RZP.bush;
  const sh=kind==='shrub';
  rzCanopy(F,{rng,R:R*0.95,n:Math.max(4,Math.round((5+Math.floor(rng()*3))*R/15)),innerN:1,ls:sh?[0.9,1.5]:R<11?[0.8,1.3]:[1.0,1.7],pal:P,innerCol:rzCol(P[0],-0.45),tint:0.3,zTop:R*0.7,open:sh?0.5:0,
    under:sh?(F)=>{ for(let i=0;i<9;i++){ const a=rng()*TAU, L=R*(0.5+rng()*0.4); rzCap(F,0,0,5,Math.cos(a)*L,Math.sin(a)*L,2,0.9,0.35,[96,74,48],RZ.BARK); } }:null});
  const top=(n,r,col,m)=>{ for(let i=0;i<n;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.7; rzDome(F,Math.cos(a)*d,Math.sin(a)*d,r,r,0,R*0.62,r,rzJit(col,rng,0.15),m); } };
  if(o.flowers) for(const c of o.flowers) top(Math.round(R*0.8),R<11?0.8:1.1,c,RZ.CLOTH);
  if(o.berries) top(Math.round(R*0.6),1.2,o.berries,RZ.GLOSS);
  if(kind==='bush'&&rng()<0.45){ const n=6+Math.floor(rng()*6); for(let i=0;i<n;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.7; rzDome(F,Math.cos(a)*d,Math.sin(a)*d,1.25,1.25,0,R*0.62,1.2,rzJit([176,34,44],rng,0.15),RZ.GLOSS); } }
  if(kind==='fshrub'||o.frost) rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.LEAF&&F.h0[id]>R*0.75*F.k&&rzHash(Math.floor(x*1.6),Math.floor(y*1.6),seed)>0.45){ F.m[id]=RZ.SNOW; F.c[id*3]=226; F.c[id*3+1]=234; F.c[id*3+2]=240; } });
  return rzShade(F,{ao:0.2,aoR:1.8,hao:0.3,bump:1.1});
}
function rzMkStump(seed,o){
  o=o||{}; const rng=mulberry32(seed), R=12, F=rzSq(R), bark=RZP.bark, wood=[196,162,112];
  rzContact(F,0.5,1,R*0.95,R*0.8,0.45);
  const tx=rzBarkTex(seed,1.6,false);
  for(let i=0;i<4;i++){ const a=i/4*TAU+rng()*0.9, L=R*(0.75+rng()*0.25); rzCap(F,0,0,3,Math.cos(a)*L,Math.sin(a)*L*0.9,0,2.6,0.8,rzJit(bark,rng,0.1),RZ.BARK,tx); }
  const rr=R*0.78;
  rzDome(F,0,0,rr,rr,0,0,6,bark,RZ.BARK,0.25);
  rzEach(F,(x,y,id)=>{ const d=Math.hypot(x,y); if(d<rr*0.82&&F.h0[id]>4*F.k){ const ring=0.5+0.5*Math.sin(d*2.6+rzVN(x*0.4,y*0.4,seed)*3), crack=Math.abs(Math.atan2(y,x)-0.7)<0.05&&d>2?0.6:1;
    const c=rzMix(wood,[160,120,78],ring*0.45+d/rr*0.3); F.c[id*3]=c[0]*crack; F.c[id*3+1]=c[1]*crack; F.c[id*3+2]=c[2]*crack; F.m[id]=RZ.WOOD; F.h0[id]=6.2*F.k-(1-ring)*0.25*F.k; }
    else if(F.m[id]===RZ.BARK){ const f=0.75+0.4*rzVN(Math.atan2(y,x)*6,d*0.6,seed); F.c[id*3]*=f; F.c[id*3+1]*=f; F.c[id*3+2]*=f; } });
  if(o.snow) rzEach(F,(x,y,id)=>{ if(F.h0[id]>4*F.k&&rzFbm(x*0.4,y*0.4,seed,2)>0.38+(x+y)*0.012){ F.m[id]=RZ.SNOW; F.c[id*3]=236; F.c[id*3+1]=240; F.c[id*3+2]=246; F.h0[id]+=0.6*F.k; } });
  else if(rng()<0.5){ const a=rng()*TAU; rzDome(F,Math.cos(a)*rr*0.9,Math.sin(a)*rr*0.9,2.2,1.8,0,4,1.6,[196,58,44],RZ.GLOSS); }
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
// reeds and grasses; o: R, pal (two blade colours), heads (cattail chance), frost, seed heads colour, n (blades)
function rzMkReed(seed,o){
  o=o||{}; const rng=mulberry32(seed), R=o.R||14, F=rzSq(R), q=R/14, P=o.pal||[[84,112,48],[108,128,58]], hc=o.head||[104,66,38], hp=o.heads==null?0.5:o.heads;
  rzContact(F,0,4*q,10*q,5*q,0.3);
  const st=[]; for(let i=0;i<(o.n||10);i++) st.push([(rng()-0.5)*14*q,(rng()-0.5)*9*q,rng()]);
  st.sort((a,b)=>a[1]-b[1]);
  for(const [x,y,r] of st){ const a=-Math.PI/2+(r-0.5)*(o.spread||0.9), L=(9+rng()*8)*q, x2=x+Math.cos(a)*L, y2=y+4+Math.sin(a)*L; let col=rng()<0.5?P[0]:P[1]; if(o.frost&&rng()<o.frost) col=rzMix(col,[220,230,236],0.6);
    rzCap(F,x,y+4,0,x2,y2,L*0.9,0.7,0.45,col,RZ.LEAF);
    if(rng()<hp){ const tx=x+Math.cos(a)*L*0.72, ty=y+4+Math.sin(a)*L*0.72; rzCap(F,tx,ty,L*0.66,x2-Math.cos(a)*0.6,y2-Math.sin(a)*0.6,L*0.88,1.6*Math.min(1,q+0.2),1.4*Math.min(1,q+0.2),hc,RZ.CLOTH); }
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
// obsidian spikes, and (with o.col) crystal clusters: o: R, col, up (points lean north, seen from the front a little)
function rzMkSpike(seed,o){
  o=o||{}; const rng=mulberry32(seed), R=o.R||20, F=rzSq(R), n=5+Math.floor(rng()*3), q=R/20, sc=o.col||[34,28,42];
  for(let i=0;i<n;i++){ const a=rng()*TAU, L=R*(0.62+rng()*0.38), ca=Math.cos(a), sa=Math.sin(a);
    // a shard: a ridge from the root to the tip, two flat faces falling away from it
    const w=4.4*q, pts=[[-sa*w,ca*w],[ca*L,sa*L],[sa*w,-ca*w]], cc=rzJit(sc,rng,0.2);
    rzPoly(F,pts,(x,y)=>{ const along=(x*ca+y*sa)/L, across=Math.abs(-x*sa+y*ca); return Math.max(0,(1-along)*9*q-across*1.6)+1; },cc,RZ.GLOSS); }
  rzDome(F,0,0,5.4*q,5.4*q,0,6*q,2.5*q,rzMulC(sc,0.75),RZ.GLOSS);
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
function rzMkRock(seed,kind,o){
  o=o||{}; const rng=mulberry32(seed), R=o.R||(kind==='crag'?28:18), F=rzSq(R), K=o.K||RZROCK[kind==='crag'?'red':kind]||RZROCK.grey;
  rzContact(F,0.6,1.6,R*0.98,R*0.84,0.5);
  rzRockBody(F,R,rng,K,kind==='crag'?0.72:0.6,seed);
  if(kind==='crag'||o.lumps){ const rng2=mulberry32(seed+5); for(let i=0;i<2;i++){ const a=Math.PI*0.25+(rng2()-0.5)*2.2+i*Math.PI, d=R*0.5; rzRockBody(F,R*(0.36+rng2()*0.1),rng2,K,0.75,seed+i*7,Math.cos(a)*d,Math.sin(a)*d*0.8); } }
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
// [kind, variants, maker(i)]: the first variant of every kind is painted at once (so every prop has its sprite),
// the rest in idle time over the next moments (rzPump), and props pick up their own variant when a kind completes
const RZSET=[
  ['oak',6,i=>rzMkOak(1000+i,'oak')],['birch',4,i=>rzMkOak(2000+i,'birch')],['pine',6,i=>rzMkPine(3000+i,false)],['spine',6,i=>rzMkPine(3100+i,true)],
  ['willow',4,i=>rzMkWillow(3200+i)],['dead',4,i=>rzMkDead(4000+i,false)],['char',3,i=>rzMkDead(4500+i,true)],
  ['bush',6,i=>rzMkBush(7000+i,'bush')],['shrub',4,i=>rzMkBush(7100+i,'shrub')],['fshrub',4,i=>rzMkBush(7200+i,'fshrub')],['mbush',4,i=>rzMkBush(7300+i,'mbush')],
  ['rock',5,i=>rzMkRock(5000+i,'grey')],['mossrock',4,i=>rzMkRock(5100+i,'moss')],['crag',4,i=>rzMkRock(5200+i,'crag')],['obsid',3,i=>rzMkRock(5300+i,'obsid')],['srock',4,i=>rzMkRock(5400+i,'snow')],
  ['spike',3,i=>rzMkSpike(6000+i)],['stump',3,i=>rzMkStump(8000+i)],['bones',2,i=>rzMkBones(8100+i)],['reed',4,i=>rzMkReed(8300+i)],['herb',1,i=>rzMkHerb(8200)],['vent',1,i=>rzMkVent()]
];
const RZQ={q:[],gen:-1,t:0};
function rzBuildSprites(){
  const t0=performance.now(), T=RZT.kinds={};
  RZQ.q.length=0; RZQ.gen=LOOK.gen;
  for(const [k,n,mk] of RZSET){ const q=performance.now(), first=mk(1); SPR[k]=[first]; T[k]=+(performance.now()-q).toFixed(1);
    if(n>1){ const all=[first]; for(let i=2;i<=n;i++) RZQ.q.push(()=>{ all.push(mk(i)); if(all.length===n){ SPR[k]=all; rzRepick(k); } }); } }
  SPR.bigoak=rzMkBigOak();
  SPR.shadow=mkShadow();
  RZT.build=+(performance.now()-t0).toFixed(1);
  rzPumpLater();
  return true;
}
function rzRepick(k){ try{ for(const arr of PROPS.values()) for(const p of arr) if(p.k===k||(k==='mossrock'&&p.k==='rock')||(k==='char'&&p.k==='dead')) p.sp=null; }catch(e){} }
function rzPump(){
  RZQ.t=0;
  if(!LOOK.re||RZQ.gen!==LOOK.gen){ RZQ.q.length=0; return; }
  const t0=performance.now();
  do{ const it=RZQ.q.shift(); if(it) it(); } while(RZQ.q.length&&performance.now()-t0<8);
  if(RZQ.q.length) rzPumpLater();
}
function rzPumpLater(){ if(RZQ.t||!RZQ.q.length) return; RZQ.t=1; if(typeof requestIdleCallback==='function') requestIdleCallback(rzPump,{timeout:400}); else setTimeout(rzPump,40); }
// for tests: finish every queued sprite now
function rzFlush(){ while(RZQ.q.length&&RZQ.gen===LOOK.gen) RZQ.q.shift()(); }
const RZT={build:0};

// ---------- caches keyed by the look generation
const RZC={gen:-1,m:new Map()};
function rzCache(key,make){ if(RZC.gen!==LOOK.gen){ RZC.m.clear(); RZC.gen=LOOK.gen; } let c=RZC.m.get(key); if(!c){ c=make(); RZC.m.set(key,c); } return c; }

// ---------- debug: a sheet of sprites on a grass background (window.__ebDbg.rzSheet(['oak','pine'],scale))
function rzSheet(keys,sc,bg){
  rzFlush();
  sc=sc||1; const list=[]; for(const k of keys){ const L=Array.isArray(SPR[k])?SPR[k]:SPR[k]?[SPR[k]]:[]; for(const c of L) list.push(c); }
  const cell=Math.max(...list.map(c=>c.width/SS*sc))+6, cols=Math.min(8,list.length), rows=Math.ceil(list.length/cols);
  const cv=mkCanvas(cols*cell,rows*cell), g=cv.getContext('2d'); g.fillStyle=bg||'#5f7a3c'; g.fillRect(0,0,cv.width,cv.height);
  list.forEach((c,i)=>{ const w=c.width/SS*sc, h=c.height/SS*sc; g.drawImage(c,(i%cols)*cell+(cell-w)/2,Math.floor(i/cols)*cell+(cell-h)/2,w,h); });
  return cv.toDataURL();
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{rzSheet,rzBuildSprites,rzFlush,RZT,RZQ,SPR,buildSprites:()=>buildSprites()});
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

// ---------- structures (drawStruct in a3_art.js hands the kinds below to rzStruct in this look)
// a box (turned by rot about its centre) with a flat top at z and bevelled edges bev wide; tex(x,y)->factor
function rzBox(F,cx,cy,w,h,rot,z,bev,col,m,tex,z0){
  const k=F.k, W=F.W, cs=Math.cos(rot||0), sn=Math.sin(rot||0), hw=w/2, hh=h/2, rr=Math.hypot(hw,hh)+1, pcx=(cx+F.ox)*k, pcy=(cy+F.oy)*k;
  const X0=Math.max(0,Math.floor(pcx-rr*k)), X1=Math.min(W-1,Math.ceil(pcx+rr*k)), Y0=Math.max(0,Math.floor(pcy-rr*k)), Y1=Math.min(F.Hp-1,Math.ceil(pcy+rr*k)), b=Math.max(0.3,bev||1), zb=z0||0;
  for(let j=Y0;j<=Y1;j++) for(let i=X0;i<=X1;i++){
    const dx=(i+0.5)/k-F.ox-cx, dy=(j+0.5)/k-F.oy-cy, u=dx*cs+dy*sn, v=dy*cs-dx*sn, e=Math.min(hw-Math.abs(u),hh-Math.abs(v)); if(e<=0) continue;
    const id=j*W+i, zz=Math.max(0.05,(zb+(z-zb)*Math.sqrt(Math.min(1,e/b)))*k), cov=Math.min(1,e*k+0.3);
    if(cov>F.a[id]) F.a[id]=cov;
    if(zz>F.h0[id]){ const f=tex?tex(u,v):1; F.h0[id]=zz; F.c[id*3]=col[0]*f; F.c[id*3+1]=col[1]*f; F.c[id*3+2]=col[2]*f; F.m[id]=m; }
  }
}
const rzWoodTx=(sd,horiz)=>(u,v)=>{ const a=horiz?u:v, b=horiz?v:u; return 0.84+0.22*rzVN(a*0.18+sd,b*2.2,sd)+0.08*Math.sin(b*3.1+rzVN(a*0.3,b,sd+1)*4); };
const rzStoneTx=(sd)=>(u,v)=>0.82+0.3*rzFbm(u*0.35+sd,v*0.35,sd,2)+(rzHash(Math.floor(u*2),Math.floor(v*2),sd)>0.95?0.1:0);
function rzSpr(key,w,h,ox,oy,make,o){ return rzCache('st:'+key,()=>{ const F=rzHF(w,h,ox,oy); make(F); return rzShade(F,o||{ao:0.16,aoR:1.6,rim:0.35}); }); }
function rzPutC(c,x,y){ ctx.drawImage(c,x-c.ox,y-c.oy,c.w2,c.h2); }
const RZS={
  well(){ return rzSpr('well',64,64,32,32,F=>{
    rzContact(F,1,2,29,27,0.45);
    const rng=mulberry32(41), n=14;
    for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.08, c=rzJit([150,144,134],rng,0.22); rzBox(F,Math.cos(a)*19.5,Math.sin(a)*19.5,9.4,7.2,a+Math.PI/2,6.5+rng()*0.8,1.6,c,RZ.ROCK,rzStoneTx(i)); }
    rzDome(F,0,0,15.2,15.2,0,0.6,0.4,[58,52,46],RZ.ROCK);
    rzDome(F,0,0,14,14,0,0.8,0.15,[22,44,54],RZ.WET,0.3);
    for(const sx of [-1,1]) rzBox(F,sx*22,0,7,11,0,11,1.2,[110,80,52],RZ.WOOD,rzWoodTx(3,false));
    rzBox(F,0,0,52,5.4,0,13.5,1.4,[132,96,62],RZ.WOOD,rzWoodTx(5,true));
    rzCap(F,4,0,14,4,9,9,0.5,0.5,[150,130,100],RZ.CLOTH); rzDome(F,4,10.5,3,2.4,0,6,3,[112,82,52],RZ.WOOD,0.6);
  }); },
  torch(lit){ return rzSpr('torch'+(lit?1:0),24,44,12,34,F=>{
    rzContact(F,0,2,7,3.2,0.45);
    rzCap(F,0,3,4,0,-15,4,2.1,1.7,[96,70,46],RZ.WOOD,rzBarkTex(4,1.2,false));
    rzBox(F,0,-15.5,7,2.2,0,6,0.6,[44,40,40],RZ.METAL);
    // the lantern: an iron frame around four panes, a pyramid cap and a ring
    rzBox(F,0,-21.5,10.4,11,0,5.5,0.8,[38,36,38],RZ.METAL);
    rzBox(F,0,-21.5,7.6,8.4,0,6.2,0.4,lit?[255,206,120]:[70,78,84],lit?RZ.EMIT:RZ.WET);
    if(lit) rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.EMIT){ const d=Math.hypot(x,y+21.5)/5.5, f=1-Math.min(1,d)*0.35; F.c[id*3]=255; F.c[id*3+1]=205*f+30; F.c[id*3+2]=120*f; } });
    rzBox(F,0,-21.5,0.9,8.4,0,6.6,0.3,[38,36,38],RZ.METAL); rzBox(F,0,-21.5,7.6,0.9,0,6.6,0.3,[38,36,38],RZ.METAL);
    rzPoly(F,[[-7,-26.5],[0,-32],[7,-26.5]],(x,y)=>7+(y+26.5)*-0.6,[34,32,34],RZ.METAL);
    rzDome(F,0,-32.6,1.3,1.3,0,9,1,[60,56,54],RZ.METAL);
  },{ao:0.12,aoR:1.2,rim:0.35}); },
  stake(){ return rzSpr('stake',22,22,11,11,F=>{ rzContact(F,0.5,1,9.6,8.4,0.4); rzDome(F,0,0,8.6,8.6,0,0,4,[100,74,46],RZ.BARK,0.3); rzEach(F,(x,y,id)=>{ const d=Math.hypot(x+1,y+1); if(d<5.8){ const r=0.5+0.5*Math.sin(d*2.4); F.c[id*3]=180-30*r; F.c[id*3+1]=146-26*r; F.c[id*3+2]=100-20*r; F.m[id]=RZ.WOOD; } }); }); },
  tent(r,a){ r=Math.round(r); const ak=Math.round(((a%TAU)+TAU)%TAU*20)/20; return rzSpr('tent'+r+'_'+ak,r*2+8,r*2+8,r+4,r+4,F=>{
    rzContact(F,1,2,r+2,r+1.6,0.45);
    const rng=mulberry32(r*7), z0=r*0.55, c=[176,150,112];
    for(let i=0;i<8;i++){ const a0=ak+i/8*TAU, a1=ak+(i+1)/8*TAU, p0=[Math.cos(a0)*r,Math.sin(a0)*r], p1=[Math.cos(a1)*r,Math.sin(a1)*r], cc=rzJit(c,rng,0.08);
      // each panel sags a little between the seams
      rzPoly(F,[[0,0],p0,p1],(x,y)=>{ const d=Math.hypot(x,y)/r, ang=Math.atan2(y,x)-a0, sag=Math.sin(((ang%(TAU/8))+TAU/8)%(TAU/8)*8/2)*1.2*d; return Math.max(0.3,z0*(1-d)-sag+0.5); },(x,y)=>rzMulC(cc,0.9+0.12*rzVN(x*0.5,y*0.5,i)),RZ.CLOTH); }
    for(let i=0;i<8;i++){ const a0=ak+i/8*TAU; rzCap(F,0,0,z0+0.6,Math.cos(a0)*r,Math.sin(a0)*r,0.6,0.55,0.4,[120,96,66],RZ.CLOTH); }
    rzDome(F,0,0,3.6,3.6,0,z0,1.6,[96,70,44],RZ.WOOD);
  },{ao:0.14,aoR:1.6,rim:0.3}); },
  campfire(small){ const r=small?14:22; return rzSpr('fire'+(small?1:0),r*2+14,r*2+14,r+7,r+7,F=>{
    rzContact(F,0,1,r+5,r+4,0.4);
    const rng=mulberry32(r);
    rzDome(F,0,0,r*0.85,r*0.8,0,0,1.2,[54,48,44],RZ.ROCK,0.4);
    rzEach(F,(x,y,id)=>{ const d=Math.hypot(x,y)/(r*0.85); if(d<0.62&&rzVN(x*0.6,y*0.6,r)>0.52){ const k=1-d/0.62; F.m[id]=RZ.EMIT; F.c[id*3]=150+100*k; F.c[id*3+1]=40+80*k*k; F.c[id*3+2]=16; } });
    for(let a=0;a<TAU;a+=0.62){ const aa=a+rng()*0.2; rzDome(F,Math.cos(aa)*r,Math.sin(aa)*r*0.95,4.4+rng(),3.8+rng(),aa,0,4,rzJit([138,132,124],rng,0.2),RZ.ROCK,0.7); }
    const lg=(x0,y0,x1,y1)=>rzCap(F,x0,y0,3,x1,y1,3,2.1,2.1,[92,64,40],RZ.BARK,(t,u,len)=>{ const end=Math.min(t,1-t)*len; return end<3?0.35+end*0.15:0.8+0.3*rzVN(u*2,t*len*0.4,7); });
    lg(-r*0.6,-r*0.3,r*0.6,r*0.3); lg(-r*0.5,r*0.4,r*0.5,-r*0.4);
  },{ao:0.16,aoR:1.6,rim:0.3}); },
  stone(k,snow,a){ k=Math.round((k||1)*10)/10; const ak=Math.round(((a%TAU)+TAU)%TAU*20)/20; return rzSpr('stone'+k+(snow?'s':'')+'_'+ak,60*k+10,60*k+10,30*k+5,30*k+5,F=>{
    rzContact(F,1,2,18*k,22*k,0.45);
    const cs=Math.cos(ak), sn=Math.sin(ak), rng=mulberry32(Math.round(k*100));
    // the standing stone: an upright slab, rounded, with a carved spiral rune
    const F2=F; for(let j=0;j<F2.Hp;j++) for(let i=0;i<F2.W;i++){ const x=(i+0.5)/F2.k-F2.ox, y=(j+0.5)/F2.k-F2.oy, u=x*cs+y*sn, v=y*cs-x*sn, q=(u/(14*k))**2+(v/(22*k))**2; if(q>=1) continue;
      const id=j*F2.W+i, z=(1-q)**0.45*14*k+(rzFbm(u*0.3,v*0.3,7,3)-0.5)*2.4, rune=Math.abs(Math.hypot(u,v)-5*k)<0.7&&Math.atan2(v,u)>-2.2&&Math.atan2(v,u)<2.6, f=0.86+0.26*rzFbm(u*0.2+3,v*0.2,9,2);
      F2.a[id]=Math.min(1,(1-Math.sqrt(q))*14*k*F2.k*0.5+0.3); F2.h0[id]=Math.max(0.05,(z-(rune?1.2:0))*F2.k);
      let c=[150*f,146*f,138*f]; if(rune) c=[150,74,58]; else if(rzFbm(u*0.25+11,v*0.25,13,3)>0.6-((-u-v)/(40*k))) c=[104*f,122*f,74*f];
      if(snow&&q<0.8&&v<-k*4+rzFbm(u*0.3,v*0.3,5,2)*8){ c=[236,240,246]; F2.m[id]=RZ.SNOW; } else F2.m[id]=RZ.ROCK;
      F2.c[id*3]=c[0]; F2.c[id*3+1]=c[1]; F2.c[id*3+2]=c[2]; }
  },{ao:0.15,aoR:1.6,rim:0.4}); },
  brazier(){ return rzSpr('brazier',36,36,18,18,F=>{ rzContact(F,1,2,16,15,0.45); rzDome(F,0,0,14,14,0,0,6,[52,48,48],RZ.METAL,0.6); rzDome(F,0,0,10.6,10.6,0,3,0.6,[30,22,18],RZ.ROCK,0.4);
    rzEach(F,(x,y,id)=>{ const d=Math.hypot(x,y); if(d<10){ const k2=1-d/10, n=rzVN(x*0.9,y*0.9,4); F.m[id]=RZ.EMIT; F.c[id*3]=120+135*k2*(0.5+n); F.c[id*3+1]=30+120*k2*k2*n; F.c[id*3+2]=10+40*k2*k2*k2; } }); }); },
  pillar(broken){ return rzSpr('pillar'+(broken?1:0),70,70,35,35,F=>{ rzContact(F,1,2,32,31,0.45);
    const oct=(r)=>{ const p=[]; for(let i=0;i<8;i++){ const a=i/8*TAU+Math.PI/8; p.push([Math.cos(a)*r,Math.sin(a)*r]); } return p; }, tx=rzStoneTx(3);
    rzPoly(F,oct(30),(x,y)=>{ let e=1e9; const p=oct(30); for(let a=0,b=7;a<8;b=a++){ const [ax,ay]=p[b],[bx,by]=p[a], vx=bx-ax, vy=by-ay, t=clamp(((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy),0,1); e=Math.min(e,Math.hypot(x-ax-vx*t,y-ay-vy*t)); } return 10*Math.sqrt(Math.min(1,e/3)); },(x,y)=>rzMulC([96,90,104],tx(x,y)),RZ.ROCK);
    rzPoly(F,oct(23),broken?(x,y)=>11+rzFbm(x*0.2,y*0.2,4,3)*4:12,(x,y)=>rzMulC(broken?[70,66,78]:[112,106,122],tx(x+5,y)),RZ.ROCK);
  }); },
  altar(){ return rzSpr('altar',92,60,46,30,F=>{ rzContact(F,1,2,46,30,0.4); rzBox(F,0,0,84,52,0,9,2.4,[96,88,96],RZ.ROCK,rzStoneTx(5)); rzBox(F,0,-4,76,38,0,10.5,1.6,[110,102,110],RZ.ROCK,rzStoneTx(9)); }); },
  ward(){ return rzSpr('ward',76,76,38,38,F=>{ rzContact(F,1,2,36,34,0.45);
    const hex=(r)=>{ const p=[]; for(let i=0;i<6;i++){ const a=i/6*TAU+Math.PI/6; p.push([Math.cos(a)*r,Math.sin(a)*r]); } return p; };
    rzPoly(F,hex(34),(x,y)=>{ const r=Math.max(Math.abs(x)*0.866+Math.abs(y)*0.5,Math.abs(y)); return 8*Math.sqrt(Math.min(1,(34*0.866-r*0.866)/2.4+0.05)); },(x,y)=>rzMulC([150,144,136],rzStoneTx(2)(x,y)),RZ.ROCK);
    rzPoly(F,hex(22),6.5,(x,y)=>rzMulC([110,104,98],rzStoneTx(4)(x,y)),RZ.ROCK);
    rzEach(F,(x,y,id)=>{ if(Math.hypot(x,y)<12){ F.h0[id]=2*F.k; F.c[id*3]=24; F.c[id*3+1]=18; F.c[id*3+2]=16; } });
  }); },
  lantern(lit){ return rzSpr('lantern'+(lit?1:0),24,34,12,13,F=>{
    rzCap(F,0,-1,1,0,13,1,1.4,1.4,[96,70,46],RZ.WOOD);
    rzDome(F,0,0,9,10,0,2,6,lit?[255,180,90]:[226,206,170],lit?RZ.EMIT:RZ.CLOTH);
    if(lit) rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.EMIT){ const d=Math.hypot(x/9,y/10), f=1-d*0.45; F.c[id*3]=255; F.c[id*3+1]=150+70*f; F.c[id*3+2]=60+50*f*f; } });
    for(const dx of [-5,0,5]) rzEach(F,(x,y,id)=>{ if(Math.abs(x-dx*Math.sqrt(Math.max(0,1-(y/10)**2)))<0.45&&Math.abs(y)<9.6){ F.c[id*3]*=0.72; F.c[id*3+1]*=0.66; F.c[id*3+2]*=0.6; } });
    rzBox(F,0,-10.2,10,3,0,8.6,0.8,[130,46,34],RZ.WOOD); rzBox(F,0,9.8,8,2.6,0,8,0.8,[130,46,34],RZ.WOOD);
  },{ao:0.1,aoR:1.2,rim:0.3}); },
  bigoak(){ return rzSpr('bigoak_roots',100,100,50,50,F=>{
    rzContact(F,1,2,40,36,0.32);
    const rng=mulberry32(1777), tx=rzBarkTex(17,2.4,true), bc=[92,68,44];
    // buttress roots: thick where they leave the trunk, curving and thinning into the ground
    for(let i=0;i<7;i++){ const a=i/7*TAU+0.3+(rng()-0.5)*0.4, L=32+rng()*10, b=(rng()-0.5)*0.5;
      let px=Math.cos(a)*14, py=Math.sin(a)*14, pz=9, w=8.5;
      for(let s=1;s<=4;s++){ const f=s/4, aa=a+b*f, nx=Math.cos(aa)*(14+(L-14)*f), ny=Math.sin(aa)*(14+(L-14)*f)*0.92, nz=9*(1-f)**1.6+0.3, nw=8.5*(1-f*0.82);
        rzCap(F,px,py,pz,nx,ny,nz,w,nw,rzJit(bc,rng,0.06),RZ.BARK,tx,0.7); px=nx; py=ny; pz=nz; w=nw; } }
    rzDome(F,0,0,22,21,0,6,8,[98,72,46],RZ.BARK,0.5);
    rzEach(F,(x,y,id)=>{ const d=Math.hypot(x,y); if(d<21){ const a=Math.atan2(y,x), f=0.74+0.38*rzVN(a*6,d*0.22,3); F.c[id*3]*=f; F.c[id*3+1]*=f; F.c[id*3+2]*=f; } });
  },{ao:0.2,aoR:2.4,rim:0.35}); },
  stall(col,goods,a){ const ak=Math.round(((a%TAU)+TAU)%TAU*20)/20; return rzSpr('stall'+col+goods+'_'+ak,64,64,32,32,F=>{
    const cs=Math.cos(ak), sn=Math.sin(ak), P=(u,v)=>[u*cs-v*sn,u*sn+v*cs], c=hzC(col), cream=[226,214,190], gd=hzC(goods);
    const [cx,cy]=P(0,10); rzContact(F,cx,cy,26,14,0.35);
    const [bx,by]=P(0,10); rzBox(F,bx,by,40,8,ak,6,1,[116,82,52],RZ.WOOD,rzWoodTx(8,true));
    for(let i=0;i<4;i++){ const [gx,gy]=P(-14+i*9,10); rzDome(F,gx,gy,2.8,2.8,0,6.5,2.6,rzJit(gd,mulberry32(i+3),0.2),RZ.GLOSS); }
    // the striped awning: five cloth panels, each bellied a little
    for(let i=0;i<5;i++){ const [px,py]=P(-17.6+i*8.8,-3.5); const cc=i%2?cream:c;
      rzBox(F,px,py,8.8,21,ak,13,1,cc,RZ.CLOTH,(u,v)=>0.92+0.1*Math.cos(u/4.4*Math.PI*0.5)); }
    rzEach(F,(x,y,id)=>{ if(F.m[id]===RZ.CLOTH){ const u=x*cs+y*sn; const bump=Math.cos(((u+22)%8.8)/8.8*Math.PI-Math.PI/2); F.h0[id]+=bump*1.4*F.k; } });
  },{ao:0.14,aoR:1.6,rim:0.35}); },
  post(){ return rzSpr('post',22,22,11,11,F=>{ rzContact(F,0.5,1,9,8,0.4); rzDome(F,0,0,8,8,0,0,4,[94,72,46],RZ.BARK,0.3); rzEach(F,(x,y,id)=>{ const d=Math.hypot(x+1.5,y+1.5); if(d<4.8){ const r=0.5+0.5*Math.sin(d*2.6); F.c[id*3]=166-26*r; F.c[id*3+1]=134-22*r; F.c[id*3+2]=92-16*r; F.m[id]=RZ.WOOD; } }); rzDome(F,3,2,2.8,2.2,0,3.6,1.2,[92,120,56],RZ.LEAF); }); },
  hut(r){ r=Math.round(r); return rzSpr('hut'+r,r*2+20,r*2+26,r+10,r+10,F=>{
    rzContact(F,1,3,r+7,r+6,0.45);
    rzBox(F,0,r+3,18,10,0,4,1,[70,50,32],RZ.WOOD,rzWoodTx(2,false));
    const R=r+4;
    rzPoly(F,(()=>{ const p=[]; for(let i=0;i<24;i++){ const a=i/24*TAU; p.push([Math.cos(a)*R,Math.sin(a)*R]); } return p; })(),(x,y)=>{ const d=Math.hypot(x,y)/R; return Math.max(0.4,R*0.62*(1-d)**0.85+1.2); },(x,y)=>{ const a=Math.atan2(y,x), d=Math.hypot(x,y), s=0.8+0.3*rzVN(a*30,d*0.15,5)+0.1*Math.sin(d*0.9); return rzMulC([168,146,92],s); },RZ.CLOTH);
    rzEach(F,(x,y,id)=>{ if(Math.hypot(x,y)<6.5){ F.c[id*3]=52; F.c[id*3+1]=40; F.c[id*3+2]=26; } });
  },{ao:0.16,aoR:2,rim:0.35}); },
  cauldron(){ return rzSpr('cauldron',40,40,20,20,F=>{ rzContact(F,1,2,18,17,0.45); rzDome(F,0,0,16,16,0,0,7,[42,40,46],RZ.METAL,0.6);
    // the rim is a rounded lip; inside it, the brew sits lower
    rzEach(F,(x,y,id)=>{ const d=Math.hypot(x,y); if(d<13.6){ const lip=Math.max(0,1-Math.abs(d-13)/1.4); if(d<12.2){ F.h0[id]=(4.5+0.3*rzVN(x*0.8,y*0.8,3))*F.k; const k2=1-d/12.2; F.c[id*3]=70+40*k2; F.c[id*3+1]=140+50*k2; F.c[id*3+2]=50+20*k2; F.m[id]=RZ.WET; } else F.h0[id]=(6.5+lip*1.2)*F.k; } }); }); },
  ore(taken){ return rzSpr('ore'+(taken?1:0),44,40,22,20,F=>{ rzContact(F,1,3,19,15,0.4);
    rzDome(F,0,2,18,14,0,0,5,[96,90,100],RZ.ROCK,0.6);
    if(!taken){ const sh=[[-8,-2,0.4],[4,-6,-0.3],[8,4,0.9],[-4,6,2.2],[0,0,-1.2]];
      for(const [x,y,a] of sh){ const ca=Math.cos(a), sa=Math.sin(a); rzPoly(F,[[x-sa*3.6,y+ca*3.6],[x+ca*12,y+sa*12],[x+sa*3.6,y-ca*3.6]],(px,py)=>{ const al=((px-x)*ca+(py-y)*sa)/12, ac=Math.abs(-(px-x)*sa+(py-y)*ca); return 6+Math.max(0,(1-al)*5-ac*1.2); },[90,150,230],RZ.GLOSS); } }
    else { rzDome(F,-3,0,6,5,0,4,1.4,[60,56,64],RZ.ROCK); rzDome(F,5,3,4,3.4,0,4,1.2,[60,56,64],RZ.ROCK); }
  }); },
  shrine(){ return rzSpr('shrine',44,44,22,22,F=>{ rzContact(F,1,2,21,21,0.4);
    rzBox(F,0,0,36,36,0,4,1.4,[124,120,130],RZ.ROCK,rzStoneTx(6));
    rzPoly(F,[[-14,-14],[14,-14],[14,14],[-14,14]],(x,y)=>4+Math.max(0,8-Math.max(Math.abs(x),Math.abs(y))*0.57),(x,y)=>rzMulC([142,138,150],rzStoneTx(8)(x,y)),RZ.ROCK);
  }); },
  arena(gate,a){ const ak=Math.round(((a%TAU)+TAU)%TAU*20)/20; return rzSpr('arena'+(gate?1:0)+'_'+ak,64,64,32,32,F=>{
    if(gate){ rzBox(F,0,0,48,12,ak,4,0.8,[88,64,42],RZ.WOOD,rzWoodTx(4,true)); const cs=Math.cos(ak), sn=Math.sin(ak); for(let x=-20;x<=20;x+=8) rzBox(F,x*cs,x*sn,2,12,ak,4.6,0.4,[120,92,60],RZ.WOOD); return; }
    rzContact(F,0,1,27,18,0.35); rzBox(F,0,0,50,30,ak,8,2,[150,140,124],RZ.ROCK,rzStoneTx(Math.round(ak*10)));
    const cs=Math.cos(ak), sn=Math.sin(ak); rzEach(F,(x,y,id)=>{ const u=x*cs+y*sn; if(Math.abs(u)<0.5){ F.h0[id]-=1.5*F.k; F.c[id*3]*=0.6; F.c[id*3+1]*=0.6; F.c[id*3+2]*=0.6; } });
  }); },
  throne(){ return rzSpr('throne',200,140,100,96,F=>{ rzContact(F,0,4,86,46,0.4);
    rzPoly(F,[[-80,-40],[80,-40],[64,40],[-64,40]],12,(x,y)=>rzMulC([66,56,72],rzStoneTx(3)(x,y)),RZ.ROCK);
    rzBox(F,0,-1,92,46,0,14,1.2,[30,24,34],RZ.ROCK,rzStoneTx(5));
    for(const sx of [-1,1]) rzPoly(F,[[sx*70,-40],[sx*96,-90],[sx*54,-40]],(x,y)=>12+(-40-y)*0.3,(x,y)=>rzMulC([80,68,88],rzStoneTx(7)(x,y)),RZ.GLOSS);
  }); }
};
function rzStruct(s,t){
  switch(s.k){
    case 'well': rzPutC(RZS.well(),s.x,s.y); return true;
    case 'torch':{ const nt=G&&isNight(); rzPutC(RZS.torch(nt),s.x,s.y); if(nt) glowAt(s.x,s.y-21,14,'255,200,120',0.5); return true; }
    case 'stake': rzPutC(RZS.stake(),s.x,s.y); return true;
    case 'tent': rzPutC(RZS.tent(s.r,s.a),s.x,s.y); return true;
    case 'campfire':{ const r=s.small?14:22; rzPutC(RZS.campfire(s.small),s.x,s.y); glowAt(s.x,s.y,r*1.05,'255,170,70',0.7+0.08*Math.sin(t*9+s.x)); glowAt(s.x,s.y,r*0.42,'255,236,180',0.85);
      if(Math.random()<0.5) emit(s.x+rand(-5,5),s.y+rand(-5,5),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:5,drag:1}); return true; }
    case 'stone': rzPutC(RZS.stone(s.s,s.snow,s.a),s.x,s.y); return true;
    case 'altar': rzPutC(RZS.altar(),s.x,s.y); ctx.strokeStyle=`rgba(255,96,44,${0.5+0.3*Math.sin(t*2)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.x-26,s.y); ctx.quadraticCurveTo(s.x,s.y-18,s.x+26,s.y); ctx.quadraticCurveTo(s.x,s.y+18,s.x-26,s.y); ctx.stroke(); ctx.beginPath(); ctx.ellipse(s.x,s.y,3,9,0,0,TAU); ctx.stroke(); return true;
    case 'brazier': rzPutC(RZS.brazier(),s.x,s.y); glowAt(s.x,s.y,13,'255,160,60',0.75+0.1*Math.sin(t*11+s.x)); glowAt(s.x,s.y,5,'255,236,180',0.8);
      if(Math.random()<0.6) emit(s.x+rand(-4,4),s.y+rand(-4,4),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:15,smax:50,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:4,drag:1}); return true;
    case 'pillar': rzPutC(RZS.pillar(s.broken),s.x,s.y); ctx.strokeStyle=`rgba(255,130,50,${0.35+0.2*Math.sin(t*2+s.x)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(s.x,s.y,18,0,TAU); ctx.stroke(); return true;
    case 'throne': rzPutC(RZS.throne(),s.x,s.y); return true;
    case 'arena': if(s.gate&&!(G&&G.mode==='normal')) return true; rzPutC(RZS.arena(s.gate,s.a+Math.PI/2),s.x,s.y); return true;
    case 'ward':{
      const lit=G&&G.wards&&G.wards[s.id], heat=G&&G.wardHeat?G.wardHeat[s.id]||0:0;
      rzPutC(RZS.ward(),s.x,s.y);
      ctx.save(); ctx.translate(s.x,s.y);
      ctx.strokeStyle=lit?`rgba(255,${180+Math.sin(t*3)*30|0},90,.95)`:heat>0?`rgba(255,${120+heat*80|0},60,${0.4+heat*0.5})`:`rgba(140,180,220,${0.35+0.15*Math.sin(t*1.5+s.x)})`; ctx.lineWidth=2;
      for(let i=0;i<6;i++){ ctx.save(); ctx.rotate(i/6*TAU); ctx.beginPath(); ctx.moveTo(26,-4); ctx.lineTo(29,0); ctx.lineTo(26,4); ctx.moveTo(24,0); ctx.lineTo(30,0); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      if(lit||heat>0){ const k=lit?1:heat; glowAt(s.x,s.y,70*k+10,'255,180,80',0.45*k); glowAt(s.x,s.y,11,'255,240,190',k); glowAt(s.x,s.y,7,'255,150,50',k);
        if(lit&&Math.random()<0.7) emit(s.x+rand(-5,5),s.y+rand(-5,5),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.4,lmax:.8,zmin:3,zmax:7,grow:5,drag:1}); }
      return true; }
    case 'lantern':{ const lit=s.ref.lit; rzPutC(RZS.lantern(lit),s.x,s.y);
      if(lit) glowAt(s.x,s.y,30,'255,170,80',0.42+0.08*Math.sin(t*5+s.x));
      else if(G&&G.flags&&G.flags.forge&&!G.flags.lanterns){ ctx.strokeStyle=`rgba(255,220,140,${0.4+0.4*Math.sin(t*4)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(s.x,s.y,16,0,TAU); ctx.stroke(); }
      return true; }
    case 'bigoak':{ rzPutC(RZS.bigoak(),s.x,s.y);
      if(DV.on){ const sc=s.R/48, h=118*sc, dx=leanDX(s.x,h)*0.8, dy=leanDY(s.y,h)*0.8; if(Math.hypot(dx,dy)>2) rzTrunk('oak',s.x,s.y,dx,dy,34,0); }
      return true; }
    case 'stall': rzPutC(RZS.stall(s.col,pick2(s,['#c8503e','#d8a838','#6a9a40']),s.a+Math.PI/2),s.x,s.y); return true;
    case 'post': rzPutC(RZS.post(),s.x,s.y); return true;
    case 'hut': rzPutC(RZS.hut(s.r),s.x,s.y); if(Math.random()<0.08) emit(s.x,s.y,1,{alpha:0.35,col:'150,160,140',glow:false,ang:-Math.PI/2+0.3,spread:0.3,smin:12,smax:30,lmin:2,lmax:3,zmin:4,zmax:7,grow:8,drag:0.3}); return true;
    case 'cauldron':{ rzPutC(RZS.cauldron(),s.x,s.y); glowAt(s.x,s.y,14,'170,240,110',0.25); ctx.fillStyle='rgba(220,250,180,.7)'; for(let i=0;i<3;i++){ const a=t*1.3+i*2.1; ctx.beginPath(); ctx.arc(s.x+Math.cos(a)*6,s.y+Math.sin(a*1.3)*5,1.5+((t*2+i)%1)*2,0,TAU); ctx.fill(); }
      if(Math.random()<0.2) emit(s.x,s.y,1,{alpha:0.4,col:'190,220,170',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:25,lmin:1.2,lmax:2,zmin:3,zmax:6,grow:7,drag:0.4}); return true; }
    case 'ore':{ const taken=G&&G.ores&&G.ores[s.ref.id]; rzPutC(RZS.ore(taken),s.x,s.y); if(!taken) glowAt(s.x,s.y,34,'110,170,255',0.32+0.14*Math.sin(t*3+s.x)); return true; }
    case 'shrine':{ const on=G&&G.shrines&&G.shrines[s.ref.id]; rzPutC(RZS.shrine(),s.x,s.y);
      ctx.strokeStyle=on?`rgba(255,${190+Math.sin(t*3)*30|0},90,.95)`:'rgba(140,170,200,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.x-6,s.y); ctx.quadraticCurveTo(s.x,s.y-7,s.x+6,s.y); ctx.quadraticCurveTo(s.x,s.y+7,s.x-6,s.y); ctx.stroke();
      if(on){ glowAt(s.x,s.y,40,'255,160,70',0.35); glowAt(s.x,s.y,8,'255,236,170',0.5+0.2*Math.sin(t*3)); } return true; }
  }
  return false;
}
// debug: every structure sprite on one sheet
function rzStructSheet(sc){ sc=sc||2; const list=[RZS.well(),RZS.torch(false),RZS.torch(true),RZS.stake(),RZS.tent(40,0.3),RZS.campfire(false),RZS.campfire(true),RZS.stone(1,false,0.4),RZS.stone(1,true,-0.3),RZS.brazier(),RZS.pillar(false),RZS.pillar(true),RZS.altar(),RZS.ward(),RZS.lantern(false),RZS.lantern(true),RZS.bigoak(),RZS.stall('#3e6a8a','#c8503e',0.5),RZS.post(),RZS.hut(30),RZS.cauldron(),RZS.ore(false),RZS.shrine(),RZS.arena(false,0.7)];
  const cw=Math.max(...list.map(c=>c.w2))*sc*0.6+8, cols=6, rows=Math.ceil(list.length/cols), ch=Math.max(...list.map(c=>c.h2))*sc*0.6+8;
  const cv=mkCanvas(cols*cw,rows*ch), g=cv.getContext('2d'); g.fillStyle='#5f7a3c'; g.fillRect(0,0,cv.width,cv.height);
  list.forEach((c,i)=>{ const k=sc*0.6, w=c.w2*k, h=c.h2*k; g.drawImage(c,(i%cols)*cw+(cw-w)/2,Math.floor(i/cols)*ch+(ch-h)/2,w,h); });
  return cv.toDataURL(); }
window.__ebDbg.rzStructSheet=rzStructSheet;

// ---------- the Emberhollow wall, its gate towers and the portcullis (drawWall in a3_art.js)
function rzWallTile(){ return rzCache('walltile',()=>{
  // one 128 x 52 stretch of the wall top: big dressed blocks in two courses, worn, with moss in the joints
  const F=rzHF(128,52,0,0), rng=mulberry32(808), tx=rzStoneTx(12);
  for(let r=0;r<2;r++){ let x=-(r?18:0); while(x<128){ const w=26+rng()*14, cc=rzJit([88,84,96],rng,0.2);
      for(const ox of [0,128]) rzBox(F,x+w/2-ox,r*26+13,w-1.2,24.8,0,6,2.2,rzMix(cc,[96,92,84],rng()*0.4),RZ.ROCK,(u,v)=>tx(u+x,v+r*30));
      x+=w; } }
  rzEach(F,(x,y,id)=>{ if(F.h0[id]<3*F.k&&rzFbm(x*0.2,y*0.2,4,2)>0.55){ F.c[id*3]=70; F.c[id*3+1]=86; F.c[id*3+2]=50; F.m[id]=RZ.LEAF; } });
  for(let i=0;i<F.n;i++) if(F.a[i]<1){ F.a[i]=1; if(F.h0[i]<0.05){ F.h0[i]=0.05; F.c[i*3]=34; F.c[i*3+1]=32; F.c[i*3+2]=36; } }
  return rzShade(F,{ao:0.18,aoR:2,rim:0});
}); }
function rzWallPat(){ return rzCache('wallpat:'+WALL_Y,()=>{ const p=ctx.createPattern(rzWallTile(),'repeat'); try{ p.setTransform(new DOMMatrix().translate(0,WALL_Y-26).scale(1/SS)); }catch(e){} return p; }); }
const RZW={
  merlon(){ return rzSpr('merlon',26,14,13,7,F=>{ rzBox(F,0,0,22,10,0,7,1.8,[100,96,108],RZ.ROCK,rzStoneTx(3)); },{ao:0.12,aoR:1.2,rim:0.3}); },
  tower(){ return rzSpr('tower',88,128,44,64,F=>{
    const tx=rzStoneTx(21), rng=mulberry32(77);
    rzBox(F,0,0,80,120,0,6,2,[78,74,86],RZ.ROCK,(u,v)=>{ const bx=Math.floor((u+40)/16+(Math.floor((v+60)/12)%2)*0.5), by=Math.floor((v+60)/12), j=Math.min(Math.abs(((u+40)/16+(by%2)*0.5)%1-0.5),Math.abs(((v+60)/12)%1-0.5)); return (j>0.44?0.6:0.86+0.24*rzHash(bx,by,5))*tx(u,v); });
    // a crenellated rim around the tower top
    for(let i=0;i<5;i++){ const x=-32+i*16; rzBox(F,x,-55,10,8,0,11,1.4,rzJit([104,100,112],rng,0.1),RZ.ROCK,tx); rzBox(F,x,55,10,8,0,11,1.4,rzJit([104,100,112],rng,0.1),RZ.ROCK,tx); }
    for(let i=0;i<7;i++){ const y=-45+i*15; rzBox(F,-35,y,8,9,0,11,1.4,rzJit([104,100,112],rng,0.1),RZ.ROCK,tx); rzBox(F,35,y,8,9,0,11,1.4,rzJit([104,100,112],rng,0.1),RZ.ROCK,tx); }
  },{ao:0.16,aoR:2,rim:0.35}); }
};
function rzDrawWall(){
  if(WALL_Y+80<cam.y||WALL_Y-80>cam.y+H/zoom) return;
  if(DV.on){ const keep=wallPattern; wallPattern=rzWallPat(); try{ drawWall0(); } finally{ wallPattern=keep; } rzWallDepthDress(); return; }
  const x0=Math.max(0,cam.x-100), x1=Math.min(WORLD.w,cam.x+W/zoom+100);
  ctx.fillStyle='rgba(8,8,10,.32)'; ctx.fillRect(x0,WALL_Y+26,x1-x0,22); ctx.fillStyle='rgba(8,8,10,.18)'; ctx.fillRect(x0,WALL_Y+48,x1-x0,8);
  ctx.fillStyle=rzWallPat();
  const seg=(a,b)=>{ if(b<x0||a>x1) return; ctx.fillRect(Math.max(a,x0),WALL_Y-26,Math.min(b,x1)-Math.max(a,x0),52); };
  seg(0,GATE_X0-80); seg(GATE_X1+80,WORLD.w);
  const M=RZW.merlon(); for(let x=Math.floor(x0/40)*40;x<x1;x+=40){ if(x>GATE_X0-90&&x<GATE_X1+80) continue; ctx.drawImage(M,x-2,WALL_Y-32,26,14); }
  const T=RZW.tower(); for(const tx of [GATE_X0-80,GATE_X1]){ ctx.drawImage(T,tx-4,WALL_Y-64,88,128); ctx.strokeStyle='rgba(255,120,50,.3)'; ctx.lineWidth=1.5; ctx.strokeRect(tx+10,WALL_Y-50,60,100); }
  if(GATE_COL&&!GATE_COL.off){ ctx.fillStyle='#121014'; ctx.fillRect(GATE_X0,WALL_Y-20,GATE_X1-GATE_X0,40); ctx.lineCap='butt';
    for(const [w,c] of [[3.4,'#2a272c'],[2,'#6a6670'],[0.7,'rgba(220,220,230,.5)']]){ ctx.strokeStyle=c; ctx.lineWidth=w; ctx.beginPath(); for(let x=GATE_X0+8;x<GATE_X1;x+=14){ const o=c[0]==='r'?-0.6:0; ctx.moveTo(x+o,WALL_Y-20); ctx.lineTo(x+o,WALL_Y+20); } ctx.moveTo(GATE_X0,WALL_Y); ctx.lineTo(GATE_X1,WALL_Y); ctx.stroke(); } }
}
// in the depth modes the wall's south face and the gate towers (drawn by drawWallDepth in a11c_depth.js) get the
// same stone: the face is laid over with a shaded block texture, the tower tops with the tower sprite, using the
// same lean as that drawer
function rzFacePat(){ return rzCache('wallface',()=>{ const F=rzHF(96,30,0,0), rng=mulberry32(909), tx=rzStoneTx(31);
  for(let r=0;r<3;r++){ let x=-(r%2?9:0); while(x<96){ const w=14+rng()*10; for(const ox of [0,96]) rzBox(F,x+w/2-ox,r*10+5,w-1,9,0,3,1.2,rzJit([70,66,78],rng,0.22),RZ.ROCK,(u,v)=>tx(u+x,v+r*12)); x+=w; } }
  for(let i=0;i<F.n;i++) if(F.a[i]<1){ F.a[i]=1; if(F.h0[i]<0.05){ F.h0[i]=0.05; F.c[i*3]=26; F.c[i*3+1]=24; F.c[i*3+2]=28; } }
  const c=rzShade(F,{ao:0.18,aoR:1.6,rim:0,gain:0.8}); return c; }); }
function rzWallDepthDress(){
  const x0=Math.max(0,cam.x-100), x1=Math.min(WORLD.w,cam.x+W/zoom+100), L=wallLean(), fh=L.fh, sx=L.sx, cx=DV.cx, By=WALL_Y+26, X=(x,s)=>cx+(x-cx)*s;
  const pat=ctx.createPattern(rzFacePat(),'repeat'), face=(a,b,B,f,s)=>{ ctx.beginPath(); ctx.moveTo(a,B); ctx.lineTo(b,B); ctx.lineTo(X(b,s),B-f); ctx.lineTo(X(a,s),B-f); ctx.closePath(); };
  try{ pat.setTransform(new DOMMatrix().translate(0,By-fh).scale(1/SS,fh/30/SS)); }catch(e){}
  const segs=[[0,GATE_X0-80],[GATE_X1+80,WORLD.w]].map(([a,b])=>[Math.max(a,x0-60),Math.min(b,x1+60)]).filter(([a,b])=>b>a);
  ctx.fillStyle=pat; for(const [a,b] of segs){ face(a,b,By,fh,sx); ctx.fill(); }
  ctx.fillStyle='rgba(10,8,14,.28)'; for(const [a,b] of segs){ ctx.fillRect(a,By-2,b-a,2); }
  if(x1>GATE_X0-200&&x0<GATE_X1+200){
    const fT=fh*1.7+8, sT=1+(sx-1)*1.7, Bt=WALL_Y+60, T=RZW.tower();
    const tp=ctx.createPattern(rzFacePat(),'repeat'); try{ tp.setTransform(new DOMMatrix().translate(0,Bt-fT).scale(1/SS,fT/30/SS)); }catch(e){}
    for(const tx of [GATE_X0-80,GATE_X1]){
      ctx.fillStyle=tp; face(tx,tx+80,Bt,fT,sT); ctx.fill();
      ctx.save(); ctx.transform(sT,0,0,1,cx*(1-sT),-fT); ctx.drawImage(T,tx-4,WALL_Y-64,88,128); ctx.strokeStyle='rgba(255,120,50,.3)'; ctx.lineWidth=1.5; ctx.strokeRect(tx+10,WALL_Y-50,60,100); ctx.restore();
    }
  }
}
// ---------- chests (drawChest in a3_art.js)
function rzChestSpr(open){ return rzSpr('chest'+(open?1:0),40,30,20,14,F=>{
  rzContact(F,1,3,17,11,0.45);
  rzBox(F,0,0,30,20,0,8,1.6,[128,84,44],RZ.WOOD,rzWoodTx(6,true));
  if(open) rzBox(F,0,-1,24,14,0,2,1,[30,18,8],RZ.WOOD);
  else{ rzBox(F,0,-3,30,10,0,10,2.2,[138,92,50],RZ.WOOD,rzWoodTx(7,true)); }
  for(const y of [-8.5,8.5]) rzBox(F,0,y,30,3,0,open?8.6:10.4,0.6,[150,132,96],RZ.METAL);
  rzBox(F,0,0,4,20,0,open?8.8:10.8,0.6,[160,140,100],RZ.METAL);
  if(!open) rzBox(F,0,1.5,4.6,4.6,0,11.6,0.8,[196,164,84],RZ.METAL);
},{ao:0.14,aoR:1.2,rim:0.35}); }
function rzChest(c,t){
  rzPutC(rzChestSpr(!!c.open),c.x,c.y);
  if(!c.open) glowAt(c.x,c.y,30,'255,200,110',0.22+0.16*Math.sin(t*3+c.x));
}

// ---------- palms: a ringed trunk curving down to its foot (south of the crown, as in the Classic sprite) and a
// crown of feathered fronds stamped from one painted frond
function rzPalmFrond(v){ return rzCache('palmfrond'+v,()=>{
  const T=rzHF(50,30,0,15), rng=mulberry32(5100+v*13), P=[[52,96,44],[78,128,56],[120,162,74]];
  rzCap(T,0,0,2,47,0,0.4,1.1,0.3,[120,128,70],RZ.LEAF);
  for(let x=2;x<47;x+=1.3){ const len=11.5*Math.pow(1-x/52,0.55)+2;
    for(const sd of [-1,1]){ const a=sd*(0.95+rng()*0.25), cx=x+Math.cos(a)*len*0.5, cy=Math.sin(a)*len*0.5, tone=clamp(0.25+x/47*0.5+(rng()-0.5)*0.4,0,1);
      rzLeaf(T,cx,cy,len*0.52,0.85,a,1.5-len*0.04,0,-sd*0.18,rzJit(tone<0.5?rzMix(P[0],P[1],tone*2):rzMix(P[1],P[2],(tone-0.5)*2),rng,0.1),RZ.LEAF); } }
  return T; }); }
function rzPalm(seed,v,R,o){
  o=o||{}; const rng=mulberry32(seed), F=rzSq(R), lean=[-1,0.55,1][v%3];
  if(!o.noTrunk){ const n=7, fx=lean*15, fy=R*0.78, tx=[150,116,80];
    rzContact(F,fx,fy+2,9,4,0.4);
    for(let i=n;i>=0;i--){ const k=i/n, x=fx*k*k+lean*2*k, y=fy*k, r=4.6+k*1.6; rzDome(F,x,y,r,r*0.9,0,(1-k)*16,r*0.8,rzJit(tx,rng,0.08),RZ.BARK);
      } }
  const m=8+(v%2), a0=rng()*TAU;
  for(let pass=0;pass<2;pass++) for(let i=0;i<m;i++){ if((i%2)!==pass) continue; const a=a0+i/m*TAU+(rng()-0.5)*0.25, L=R*(0.78+rng()*0.22), t=pass?1.02:0.86;
    rzStamp(F,rzPalmFrond((i+v)%3),0,0,a,L/48,0.9+rng()*0.25,18+pass*2,13,[t,t,t*0.96]); }
  for(let i=0;i<3;i++) rzDome(F,Math.cos(i*2.1+0.4)*4.2,Math.sin(i*2.1+0.4)*3.4+1,3.2,3.2,0,19,3,rzJit([120,78,40],rng,0.1),RZ.GLOSS);
  return rzShade(F,{ao:0.2,aoR:2,hao:0.25,bump:1,trans:[190,210,110]});
}
// ---------- the prop kinds of maps 1 to 4 (definePropKind): Realistic makers by kind. A kind with no maker here
// keeps its own sprites, relit once (rzRelight) so it sits in the same light. trunk: the depth modes' trunk under a
// tall kind's leaning crown (false for none, or when the sprite paints its own)
const RZPAL={moth:[[92,88,120],[124,118,152],[170,164,196]],sea:[[26,60,48],[40,84,62],[70,112,80]],haw:[[44,82,40],[66,108,50],[104,140,64]],
  taiga:[[18,40,34],[30,58,46],[46,78,58]],ice:[[40,70,78],[60,96,104],[96,132,140]],mangrove:[[40,74,44],[58,98,56],[90,128,72]],
  gorse:[[52,88,40],[76,112,48],[106,138,60]],heath:[[82,62,92],[112,84,122],[150,116,158]]};
const RZK={
  c_mothbirch:{trunk:'birch',n:4,make:s=>rzBroadleaf(s,44,{birch:1,pal:RZPAL.moth,inner:[66,62,88],bark:[226,222,232],glints:1})},
  c_seapine:{trunk:'pine',n:4,make:s=>rzConifer(s,42,{key:'sea',pal:RZPAL.sea,tip:[110,140,90]})},
  c_hawthorn:{trunk:'oak',n:4,make:s=>rzBroadleaf(s,34,{pal:RZPAL.haw,berries:[168,36,40]})},
  f_snowpine:{trunk:'pine',n:4,make:s=>rzConifer(s,44,{snow:1,key:'snow',pal:RZP.spine})},
  f_taigapine:{trunk:'pine',n:4,tw:14,make:s=>rzConifer(s,52,{key:'taiga',pal:RZPAL.taiga,tip:[80,108,70]})},
  f_icepine:{trunk:'pine',n:4,make:s=>rzConifer(s,40,{key:'ice',pal:RZPAL.ice,tip:[160,190,200],frost:0.5})},
  f_deadpine:{trunk:'dead',n:3,make:s=>rzMkDead(s,false,{R:34})},
  m_palm:{trunk:false,n:3,make:(s,v)=>rzPalm(s,v,48)},
  pm_palm:{trunk:'palm',roots:false,n:3,make:(s,v)=>rzPalm(s,v,40,{noTrunk:1})},
  m_mangrove:{trunk:'oak',n:3,make:s=>rzBroadleaf(s,46,{pal:RZPAL.mangrove})},
  c_gorse:{n:3,make:s=>rzMkBush(s,'gorse',{R:17,pal:RZPAL.gorse,flowers:[[222,184,56],[238,206,90]]})},
  c_heather:{n:3,make:s=>rzMkBush(s,'heather',{R:12,pal:RZPAL.heath})},
  c_thrift:{n:3,make:s=>rzMkReed(s,{R:8,pal:[[86,120,62],[104,138,70]],heads:0.9,head:[222,146,176],n:9,spread:1.2})},
  f_snowbush:{n:3,make:s=>rzMkBush(s,'fshrub',{R:15})},
  f_tussock:{n:3,make:s=>rzMkReed(s,{R:11,pal:[[150,140,92],[124,122,80]],heads:0.15,head:[176,160,120],n:16,spread:1.6})},
  m_dunegrass:{n:3,make:s=>rzMkReed(s,{R:12,pal:[[150,150,98],[124,134,82]],heads:0.25,head:[196,180,130],n:14,spread:1.4})},
  m_seagrass:{n:3,make:s=>rzMkReed(s,{R:11,pal:[[58,104,70],[74,124,80]],heads:0,n:12,spread:1.2})},
  f_frostreed:{n:2,make:s=>rzMkReed(s,{R:12,frost:0.6})},
  c_chalkrock:{n:3,make:s=>rzMkRock(s,'grey',{R:15,K:{c:[212,206,190],v:[184,178,162],li:[196,200,150]}})},
  c_barnrock:{n:3,make:s=>rzMkRock(s,'grey',{R:15})},
  f_snowrock:{n:3,make:s=>rzMkRock(s,'snow',{R:16})},
  f_redrock:{n:3,make:s=>rzMkRock(s,'crag',{R:17})},
  f_hornrock:{n:3,make:s=>rzMkRock(s,'grey',{R:28,lumps:1,K:{c:[120,116,112],v:[96,94,92],li:[160,164,150]}})},
  f_windrock:{n:3,make:s=>rzMkRock(s,'grey',{R:26,lumps:1})},
  m_coralrock:{n:3,make:s=>rzMkRock(s,'grey',{R:17,K:{c:[200,170,150],v:[170,140,126],li:[222,192,172]}})},
  f_stump:{n:2,make:s=>rzMkStump(s,{snow:1})},
  // kinds that keep their own sprites (relit), with the trunk the depth modes give them
  c_lamppost:{trunk:'iron',roots:false,tw:5}, f_lanternpost:{trunk:'iron',roots:false,tw:5}, m_lamppost:{trunk:'iron',roots:false,tw:5},
  c_blackrock:{trunk:'stone',roots:false,tw:16}, f_dreadspire:{trunk:'stone',roots:false,tw:14}, m_glassspike:{trunk:'glass',roots:false,tw:10},
  m_bones:{trunk:'bone',roots:false,tw:8}, f_mammothrib:{trunk:'bone',roots:false,tw:8}, n_glasstree:{trunk:'glass',roots:false,tw:9}
};
// called by propKindSprites (e2_terrain.js) in this look; returns true when it built the kind
function rzKindSprites(kind){
  const d=PROPK[kind]; if(!d) return false;
  const gen=LOOK.gen, build=()=>rzKindBuild(kind,d);
  Object.defineProperty(SPR,kind,{configurable:true,enumerable:true,
    get(){ const v=gen===LOOK.gen&&LOOK.re?build():undefined; Object.defineProperty(SPR,kind,{value:v,writable:true,configurable:true,enumerable:true}); return v; },
    set(v){ Object.defineProperty(SPR,kind,{value:v,writable:true,configurable:true,enumerable:true}); }});
  RZQ.q.push(()=>{ void SPR[kind]; }); if(RZQ.gen!==LOOK.gen) RZQ.gen=LOOK.gen; rzPumpLater();
  return true;
}
function rzKindBuild(kind,d){
  const K=RZK[kind]; let h=0; for(let i=0;i<kind.length;i++) h=(h*31+kind.charCodeAt(i))|0;
  const L=[], n=K&&K.make?Math.max(d.n,K.n||0):d.n;
  for(let v=0;v<n;v++){ let c=null; const seed=(h&0xffff)+v*131;
    try{ if(K&&K.make) c=K.make(seed,v,d); else { c=d.make(seed,v); if(c){ if(!c.half) c.half=c.width/4; rzRelight(c,{bump:2.4,ao:0.08,aoR:2,edge:2,sat:0.92}); } } }catch(e){ console.error('prop kind',kind,e); }
    if(c){ if(!c.half) c.half=c.width/4; L.push(c); } }
  return L.length?L:undefined;
}
