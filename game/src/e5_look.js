
// ================= e5_look: the Storybook look (Settings > Look: Storybook or Classic)
// Storybook (the default) is a bright, cosy pass in the spirit of Cat Quest: clean saturated ground with little
// noise, crisp white foam that pulses along every shore, clean paths with edging, chunky props and buildings with a
// bold warm plum outline and flat cel shading (one highlight, one shadow tone), outlined toy figures, drifting cloud
// shadows, a blue readable night and a chunky parchment UI. Classic draws exactly as before: every Storybook path
// checks LOOK.sb and falls through to the old code. All outlines and shading are baked into cached canvases (the
// prop sprites, house sprites, landmark sprites, struct sprites below), never redone per frame.
// The style guide for new maps is scratchpad/STYLE.md (palettes, outline widths, the helpers exported here).
// LOOK is a var (not const) so the drawing code in earlier modules can read it at any time without a TDZ error.
var LOOK={sb:store.get('eb_look','storybook')!=='classic', gen:0, spr:new Map(), houses:new Map(), graded:new WeakMap(), cloud:null, off:{}};
// LOOK.off (debug, for measuring): {foam:true, clouds:true, structs:true, houses:true} switches a Storybook pass off

// ---------- palette: the shared colours of the look (helpers use these; see STYLE.md)
const SBC={
  outline:'#3b2233',      // the warm dark plum used for every outline
  outlineRGB:[59,34,51],
  ink:'#3b2233', cream:'#fff4dc', parch:'#f6e6c4', parch2:'#ead3a4', gold:'#ffcf5a', ember:'#ff7a3a',
  foam:'#ffffff', sand:[244,222,160], wetSand:[226,196,132],
  waterShallow:[118,214,226], waterMid:[74,182,222], waterDeep:[52,136,204],
  coldShallow:[170,226,240], coldDeep:[86,150,206],
  lava:[240,96,36], lavaHot:[255,200,80], lavaCrust:'#5a2420',
  shadowRGB:[58,30,72],   // shadows lean to this plum, not to black
  lightRGB:[255,250,226]  // highlights lean to this warm cream, not to white
};
// a tone of a colour: k>0 toward the warm highlight, k<0 toward the plum shadow (hex in, '#rrggbb' out)
const SBT=new Map();
function sbTone(hex,k){
  const key=hex+'|'+k; let v=SBT.get(key); if(v) return v;
  const c=typeof hex==='string'?hexRGB(hex):hex, m=k>=0?mixRGB(c,SBC.lightRGB,Math.min(1,k)):mixRGB(c,SBC.shadowRGB,Math.min(1,-k));
  v='#'+m.map(q=>Math.max(0,Math.min(255,Math.round(q))).toString(16).padStart(2,'0')).join(''); if(SBT.size>4000) SBT.clear(); SBT.set(key,v); return v;
}
// the three cel tones of a base colour: [highlight, base, shadow]
function celTones(hex,hi,lo){ return [sbTone(hex,hi==null?0.32:hi),typeof hex==='string'?hex:sbTone(hex,0),sbTone(hex,lo==null?-0.3:-lo)]; }
// outline width in world px by the size of the thing (radius or half height in world px)
function sbOW(size){ return size<10?1.1:size<18?1.4:size<34?1.8:size<60?2.2:2.6; }

// ---------- outlineSprite: a bold outline around a cached sprite canvas
// cv: a canvas from spriteOf, r2S, rSpr, houseSprite (all drawn at 2x, pass o.scale for others).
// col: outline colour (default SBC.outline). w: width in world px. Returns a NEW canvas with the same size and the
// same fields (half, ox, oy, w2, h2, ...). Pixels under o.thr alpha (default 0.42) are not outlined, so the soft
// baked shadows under a sprite stay soft. In Classic it returns cv untouched (unless o.force).
function outlineSprite(cv,col,w,o){
  if(!cv||!cv.width||(!LOOK.sb&&!(o&&o.force))) return cv;
  o=o||{}; col=col||SBC.outline; w=w==null?1.6:w;
  const s=o.scale||2, r=Math.max(0.8,w*s), W=cv.width, H=cv.height;
  let d, id;
  const m=mkCanvas(W,H), mg=m.getContext('2d'); mg.drawImage(cv,0,0);
  try{ id=mg.getImageData(0,0,W,H); d=id.data; }catch(e){ return cv; }
  const rgb=typeof col==='string'?hexRGB(col):col, thr=(o.thr==null?0.42:o.thr)*255, k=255/Math.max(1,255-thr)*1.7;
  for(let i=0;i<d.length;i+=4){ const a=d[i+3]; d[i]=rgb[0]; d[i+1]=rgb[1]; d[i+2]=rgb[2]; d[i+3]=a<=thr?0:Math.min(255,(a-thr)*k); }
  mg.putImageData(id,0,0);
  const out=mkCanvas(W,H), g=out.getContext('2d');
  const n=Math.max(10,Math.ceil(r*5));
  for(let i=0;i<n;i++){ const a=i/n*TAU; g.drawImage(m,Math.cos(a)*r,Math.sin(a)*r); }
  if(r>1.6) for(let i=0;i<8;i++){ const a=i/8*TAU+0.39; g.drawImage(m,Math.cos(a)*r*0.55,Math.sin(a)*r*0.55); }
  if(o.grade) gradeCanvas(cv,o.grade);
  g.drawImage(cv,0,0);
  for(const key of ['half','ox','oy','w2','h2','sc','cx','cy','burnt','snow']) if(cv[key]!==undefined) out[key]=cv[key];
  return out;
}
// gradeCanvas: a one-time colour pass on a cached canvas (saturation, lift, warmth). g={sat,lift,gamma,warm}
function gradeCanvas(cv,gr){
  const W=cv.width, H=cv.height; if(!W||!H) return cv;
  const g=cv.getContext('2d'); let id; try{ id=g.getImageData(0,0,W,H); }catch(e){ return cv; }
  const d=id.data, sat=gr.sat==null?1.2:gr.sat, lift=gr.lift||0, gam=gr.gamma||1, wr=gr.warm||0;
  let lut=null; if(gam!==1||lift){ lut=new Uint8ClampedArray(256); for(let i=0;i<256;i++) lut[i]=255*Math.pow(i/255,gam)*(1-lift)+255*lift; }
  for(let i=0;i<d.length;i+=4){
    if(d[i+3]===0) continue;
    let r=d[i], gg=d[i+1], b=d[i+2]; const l=0.299*r+0.587*gg+0.114*b;
    r=l+(r-l)*sat; gg=l+(gg-l)*sat; b=l+(b-l)*sat;
    if(wr){ r+=wr*14; gg+=wr*5; b-=wr*10; }
    if(lut){ r=lut[r<0?0:r>255?255:r|0]; gg=lut[gg<0?0:gg>255?255:gg|0]; b=lut[b<0?0:b>255?255:b|0]; }
    d[i]=r; d[i+1]=gg; d[i+2]=b;
  }
  g.putImageData(id,0,0); return cv;
}
// celFill: fill a path in three cel tones (a highlight crescent toward the top left light, a shadow crescent away
// from it). path(g,dx,dy) must add the shape offset by dx,dy to the current path. col: base colour (hex).
// o: {hi:px, lo:px, tones:[hl,base,sh]} (defaults scale with o.r, the size of the shape)
function celFill(g,path,col,o){
  o=o||{}; const R=o.r||16, hi=o.hi==null?Math.max(1,R*0.16):o.hi, lo=o.lo==null?Math.max(1.2,R*0.22):o.lo, T=o.tones||celTones(col);
  g.save(); g.beginPath(); path(g,0,0); g.clip();
  g.fillStyle=T[0]; g.beginPath(); path(g,0,0); g.fill();
  g.fillStyle=T[1]; g.beginPath(); path(g,hi,hi); g.fill();
  g.fillStyle=T[2]; g.beginPath(); g.rect(-4000,-4000,8000,8000); path(g,-lo,-lo); g.fill('evenodd');
  g.restore();
}
// celBall: a cel shaded disc (berries, stones, pots seen from above)
function celBall(g,x,y,r,col,tones){ celFill(g,(q,dx,dy)=>{ q.moveTo(x+dx+r,y+dy); q.arc(x+dx,y+dy,r,0,TAU); },col,{r,tones}); }
// sbSprite: a cached outlined sprite drawn once (key is unique to the drawing): R radius as spriteOf, w outline width
function sbSprite(key,R,draw,w){
  let c=LOOK.spr.get(key); if(c) return c;
  c=outlineSprite(spriteOf(R,draw),SBC.outline,w==null?sbOW(R):w,{force:true}); LOOK.spr.set(key,c); return c;
}

// ---------- the setting
function setLook(v){
  v=v==='classic'?'classic':'storybook'; const was=LOOK.sb; LOOK.sb=v==='storybook'; store.set('eb_look',v);
  lookSyncRow(); if(was!==LOOK.sb) lookRebuild(); return v;
}
function lookSyncRow(){
  for(const b of document.querySelectorAll('#setLook button')) b.setAttribute('aria-pressed',String(b.dataset.v===(LOOK.sb?'storybook':'classic')));
  try{ document.documentElement.classList.toggle('sb',LOOK.sb); }catch(e){}
}
// everything cached that the look changes is thrown away and built again (props regenerate from their seeds)
function lookRebuild(){
  LOOK.gen++; LOOK.spr.clear(); LOOK.houses.clear(); LOOK.cloud=null;
  try{ CHUNKS.clear(); placeholderCol.clear(); }catch(e){}
  try{ OV.row=0; OV.done=false; for(const M of MAPS) if(M&&M.ov){ M.ov.row=0; M.ov.done=false; } }catch(e){}
  try{ if(SPR.shadow) buildSprites(); for(const arr of PROPS.values()) for(const p of arr) p.sp=null; }catch(e){}
  try{ SCACHE.clear(); }catch(e){}
  try{ R2.spr.clear(); R2.base.length=0; RSP.clear(); }catch(e){}
  try{ if(AREA){ AREA._base=null; } }catch(e){}
  try{ T3G.clear(); }catch(e){}
  try{ vigKey=''; SHL.key=''; DP.ok=false; }catch(e){}
  if(G) G.chunkBurst=16;
}
(function lookRow(){
  try{
    lookSyncRow();
    const panel=document.querySelector('#settings .panel'); if(!panel||document.getElementById('setLook')) return;
    const r=document.createElement('div'); r.className='setrow';
    r.innerHTML='<span>Look<small>Storybook: bright colours, bold outlines and white foam on the shores. Classic: the original look.</small></span><div class="seg" id="setLook" role="group" aria-label="Look"><button type="button" data-v="storybook" aria-pressed="false">Storybook</button><button type="button" data-v="classic" aria-pressed="false">Classic</button></div>';
    // above the Characters row (or the 3D depth row, or the end of the list)
    const ref0=document.getElementById('setChars')||document.getElementById('setDepth'), done=document.getElementById('bSettingsClose');
    let ref=ref0?ref0.closest('.setrow'):done; while(ref&&ref.parentElement!==panel) ref=ref.parentElement;
    if(ref) panel.insertBefore(r,ref); else panel.appendChild(r);
    for(const b of r.querySelectorAll('button')) b.addEventListener('click',()=>{ try{ SFX.init(); }catch(e){} setLook(b.dataset.v); try{ SFX.play('ui'); }catch(e){} });
    lookSyncRow();
  }catch(e){}
})();

// ================= ground
// biome palettes for Embermere: [base, light, dark] (the noise only nudges them a little), plus path and edge colours
const SB_BCOL=[
  ['#82c65a','#92d266','#73b84f'],   // 0 the Southern Meadows
  ['#5aa850','#66b558','#4c9a47'],   // 1 Whisperwood
  ['#aaa196','#b8b0a4','#9a9186'],   // 2 the Ashen Road
  ['#e6bc7c','#eec88c','#d8ac6c'],   // 3 the Drakeling Crags
  ['#5e4a4c','#6b5556','#52403f'],   // 4 the Cinderlands
  ['#e8f0f7','#f6f9fd','#d6e2ee'],   // 5 the Frostpine Highlands
  ['#78a05c','#86ac66','#6a9252']    // 6 the Mirefen
].map(c=>c.map(hexRGB));
const SB_ROAD=[[236,212,152],[226,200,140],[214,206,192],[250,230,190],[122,102,98],[214,214,222],[206,184,132]];
const SB_EDGE=['rgba(150,112,62,.85)','rgba(120,88,48,.85)','rgba(112,104,96,.8)','rgba(168,112,64,.85)','rgba(40,28,30,.85)','rgba(140,150,172,.75)','rgba(110,92,54,.85)'];
const SB_SAND=[[244,222,160],[236,214,150],[214,206,190],[244,214,158],[120,96,90],[226,234,242],[214,200,148]];
// a biome from another map (ids 10 and up) keeps its own colours (BCOL, from defineBiome); they are chosen for this look (STYLE.md)
function sbBiomeRGB(b,n,m){
  const C=b<7?SB_BCOL[b]:(BCOL[b]||SB_BCOL[0]);
  let c=n>0?mixRGB(C[0],C[1],Math.min(1,n*0.55)):mixRGB(C[0],C[2],Math.min(1,-n*0.55));
  return mixRGB(c,m>0?C[1]:C[2],Math.min(1,Math.abs(m)*0.5));
}
// the road edge colour of a biome: Embermere's table, else the biome's roadEdge, else its road colour a good deal darker
function sbRoadEdge(b){
  if(b<7) return SB_EDGE[b]||SB_EDGE[0];
  const B=typeof BIOMES!=='undefined'?BIOMES[b]:null; if(!B) return SB_EDGE[0];
  if(B.roadEdge) return B.roadEdge;
  if(!B._edge){ const c=mixRGB(B._road||[200,170,120],SBC.shadowRGB,0.42); B._edge=`rgba(${c.map(Math.round)},.85)`; }
  return B._edge;
}
// biome blend: the same shape as the old ground, with a much narrower soft band at the borders
function sbBlend(t){ return 0.5+0.5*smooth(clamp((t-0.5)/0.11,0,1)); }
function sbGroundRGB(s,x,y){
  if(s.out) return [34,26,44];
  const m=fbm(x*0.0011+11,y*0.0011-7,2);
  let c=sbBiomeRGB(s.b,s.n,m);
  if(s.b2!==s.b&&s.t<1) c=mixRGB(sbBiomeRGB(s.b2,s.n,m),c,sbBlend(s.t));
  if(s.shore>0){ const sd=SB_SAND[s.b]||SBC.sand; c=mixRGB(c,sd,smooth(clamp((s.shore-0.3)/0.3,0,1))*0.95); }
  if(s.bog>0) c=mixRGB(c,mixRGB([92,140,104],[72,118,90],clamp(s.n+0.5,0,1)),smooth(clamp(s.bog*1.6-0.3,0,1))*0.9);
  if(s.road>0){ const rc=SB_ROAD[s.b]||SB_ROAD[0]; c=mixRGB(c,rc,smooth(clamp((s.road-0.15)/0.55,0,1))); }
  if(s.water){
    const cold=s.b===5, sh=cold?SBC.coldShallow:SBC.waterShallow, dp=cold?SBC.coldDeep:SBC.waterDeep, k=smooth(s.depth);
    c=k<0.5?mixRGB(sh,cold?mixRGB(sh,dp,0.5):SBC.waterMid,k*2):mixRGB(cold?mixRGB(sh,dp,0.5):SBC.waterMid,dp,(k-0.5)*2);
    c=mixRGB(c,[255,255,255],Math.max(0,s.n)*0.06);
  }
  if(s.lavaS>0) c=mixRGB(c,mixRGB(SBC.lava,SBC.lavaHot,smooth(clamp((s.n+0.04)*3.2,0,1))),smooth(clamp(s.lavaS*1.7-0.35,0,1)));
  const ed=Math.min(x,y,WORLD.w-x,WORLD.h-y); if(ed<160) c=mixRGB([34,26,44],c,clamp(ed/160,0,1));
  return c;
}
{ const base=groundRGB; groundRGB=function(s,x,y){ return LOOK.sb&&y<BAND?sbGroundRGB(s,x,y):base(s,x,y); }; }

// ---------- contour lines baked into each ground chunk: the foam, road edges, lava crust, bog rims
// marching squares over the chunk's sample grid; pushes segments [ax,ay,bx,by,nx,ny] (n points to higher F)
function msLines(F,N,x0,y0,st,lev,out,skip){
  for(let j=0;j<N-1;j++) for(let i=0;i<N-1;i++){
    const ia=j*N+i, a=F[ia]-lev, b=F[ia+1]-lev, c=F[ia+N+1]-lev, d=F[ia+N]-lev;
    const k=(a>0?8:0)|(b>0?4:0)|(c>0?2:0)|(d>0?1:0); if(k===0||k===15) continue;
    if(skip&&skip[ia]) continue;
    const X=x0+i*st, Y=y0+j*st;
    const tx=X+st*a/(a-b), ry=Y+st*b/(b-c), bx=X+st*d/(d-c), ly=Y+st*a/(a-d);
    let gx=((b-a)+(c-d)), gy=((d-a)+(c-b)); const gl=Math.hypot(gx,gy)||1; gx/=gl; gy/=gl;
    const S=(p,q,r,s)=>out.push(p,q,r,s,gx,gy);
    switch(k){
      case 1: case 14: S(X,ly,bx,Y+st); break;
      case 2: case 13: S(bx,Y+st,X+st,ry); break;
      case 3: case 12: S(X,ly,X+st,ry); break;
      case 4: case 11: S(tx,Y,X+st,ry); break;
      case 6: case 9: S(tx,Y,bx,Y+st); break;
      case 7: case 8: S(X,ly,tx,Y); break;
      case 5: S(tx,Y,X+st,ry); S(X,ly,bx,Y+st); break;
      case 10: S(X,ly,tx,Y); S(bx,Y+st,X+st,ry); break;
    }
  }
  return out;
}
function msStroke(g,L,col,w,dash){
  if(!L.length) return;
  g.strokeStyle=col; g.lineWidth=w; g.beginPath();
  for(let i=0;i<L.length;i+=6){ g.moveTo(L[i],L[i+1]); g.lineTo(L[i+2],L[i+3]); }
  if(dash) g.setLineDash(dash); g.stroke(); if(dash) g.setLineDash([]);
}
// is a world point on a bridge deck or a walkway (no foam or road edges there)
function sbOnDeck(x,y,list){
  for(const br of list){ const dx=x-br.x, dy=y-br.y, c=Math.cos(br.ang), s=Math.sin(br.ang), u=dx*c+dy*s, v=-dx*s+dy*c; if(Math.abs(u)<br.len/2+14&&Math.abs(v)<br.w/2+16) return true; }
  for(const w of WALKWAYS) if(x>w.x0-14&&x<w.x1+14&&y>w.y0-14&&y<w.y1+14) return true;
  return false;
}
const SB_F=new Float32Array(65*65), SB_R=new Float32Array(65*65), SB_L=new Float32Array(65*65), SB_B=new Float32Array(65*65), SB_SK=new Uint8Array(65*65);
// called by genChunk (and the Storybook copy of genChunkMap) after the ground and decor, before decals and bridges
function lookChunkLines(g,grid,N,st,x0,y0,ch){
  let water=false, road=false, lava=false, bog=false;
  for(let i=0;i<N*N;i++){
    const s=grid[i];
    SB_F[i]=s.water?s.depth*70:(s.shore>0?-(1-s.shore)*30:-30);
    const rw=(s.b===4?26:(typeof BIOMES!=='undefined'&&BIOMES[s.b]&&BIOMES[s.b].roadW)||19);
    SB_R[i]=s.water||s.bridge?-40:rw+1-Math.min(s.roadD,rw+40);
    SB_L[i]=s.lavaS; SB_B[i]=s.bog;
    if(s.water) water=true; if(s.road>0) road=true; if(s.lavaS>0.3) lava=true; if(s.bog>0.3) bog=true;
  }
  const brs=[]; for(const br of BRIDGES){ if(br.x+220<x0||br.x-220>x0+CH||br.y+220<y0||br.y-220>y0+CH) continue; brs.push(br); }
  if(brs.length||WALKWAYS.length){ for(let j=0;j<N;j++) for(let i=0;i<N;i++) SB_SK[j*N+i]=sbOnDeck(x0+(i+0.5)*st,y0+(j+0.5)*st,brs)?1:0; }
  const sk=brs.length||WALKWAYS.length?SB_SK:null;
  g.lineCap='round'; g.lineJoin='round';
  if(bog){ const L=msLines(SB_B,N,x0,y0,st,0.48,[]); msStroke(g,L,'rgba(52,86,62,.55)',2.2); }
  if(road){
    // the edge takes the colour of the biome it runs through (one stroke per biome in the chunk)
    const L=msLines(SB_R,N,x0,y0,st,0,[],sk), by={};
    for(let i=0;i<L.length;i+=6){ const ii=clamp(Math.round(((L[i]+L[i+2])/2-x0)/st),0,N-1), jj=clamp(Math.round(((L[i+1]+L[i+3])/2-y0)/st),0,N-1), b=grid[jj*N+ii].b; (by[b]||(by[b]=[])).push(L[i],L[i+1],L[i+2],L[i+3],0,0); }
    for(const b in by) msStroke(g,by[b],sbRoadEdge(+b),2.6);
  }
  if(lava){ const L=msLines(SB_L,N,x0,y0,st,0.5,[]); msStroke(g,L,SBC.lavaCrust,3.4); const L2=msLines(SB_L,N,x0,y0,st,0.74,[]); msStroke(g,L2,'rgba(255,236,150,.8)',1.6); }
  if(water){
    // the deep ring, a soft second line, then the crisp foam line right at the edge
    const L2=msLines(SB_F,N,x0,y0,st,15,[],sk); msStroke(g,L2,'rgba(255,255,255,.32)',1.8,[7,9]);
    const L=msLines(SB_F,N,x0,y0,st,2.6,[],sk); msStroke(g,L,'rgba(255,255,255,.96)',3.4);
    if(ch) ch.foam=L.length?new Float32Array(L):null;
  }
  g.lineWidth=1.1; g.lineCap='round';
}
// the animated pass along the shores in view: a dashed ring (every other segment of the foam line) rolls out from
// the shore and fades, then the next one starts; segments outside the view are skipped
function lookFoam(vis,t){
  if(LOOK.off.foam) return;
  const u=(t*0.42)%1, d=3+u*14, a=0.62*(1-u)*Math.min(1,u*6), x0=cam.x-20, y0=cam.y-20, x1=cam.x+W/zoom+20, y1=cam.y+H/zoom+20;
  if(a<0.03) return;
  const odd=Math.floor(t*0.42)%2?6:0;
  let started=false;
  for(const v of vis){ const ch=CHUNKS.get(ckey(v[0],v[1])); const L=ch&&ch.foam; if(!L) continue;
    if(!started){ started=true; ctx.save(); ctx.lineCap='butt'; ctx.strokeStyle='#ffffff'; ctx.globalAlpha=a; ctx.lineWidth=2.6-u*1.2; ctx.beginPath(); }
    for(let i=odd;i<L.length;i+=12){ const ax=L[i], ay=L[i+1]; if(ax<x0||ax>x1||ay<y0||ay>y1) continue; const nx=L[i+4]*d, ny=L[i+5]*d; ctx.moveTo(ax+nx,ay+ny); ctx.lineTo(L[i+2]+nx,L[i+3]+ny); } }
  if(started){ ctx.stroke(); ctx.restore(); }
}
// a water glint in this look: a crisp little four point sparkle that swells and fades (no glow)
function lookGlint(r,k){ const a=Math.sin(Math.PI*k), s=r.r*0.55*a+0.6; if(a<0.05) return; ctx.fillStyle=`rgba(255,255,255,${0.85*a})`; ctx.beginPath(); ctx.moveTo(r.x,r.y-s); ctx.quadraticCurveTo(r.x,r.y,r.x+s*0.8,r.y); ctx.quadraticCurveTo(r.x,r.y,r.x,r.y+s); ctx.quadraticCurveTo(r.x,r.y,r.x-s*0.8,r.y); ctx.quadraticCurveTo(r.x,r.y,r.x,r.y-s); ctx.fill(); }
// ground decor in the Storybook look: few, chunky marks (tufts, flower clusters, pebbles, leaves, snow glints)
function sbTuft(g,x,y,col,s){ g.strokeStyle=col; g.lineWidth=1.7*s; g.beginPath(); g.moveTo(x-2.6*s,y-3.2*s); g.lineTo(x-0.6*s,y+1); g.lineTo(x,y-4.6*s); g.lineTo(x+0.7*s,y+1); g.lineTo(x+2.8*s,y-3*s); g.stroke(); }
function sbFlowers(g,rng,x,y,col,n){ for(let k=0;k<n;k++){ const fx=x+(rng()-0.5)*12, fy=y+(rng()-0.5)*8; g.fillStyle='rgba(59,34,51,.35)'; g.beginPath(); g.arc(fx+0.5,fy+0.8,2.3,0,TAU); g.fill(); g.fillStyle=col; g.beginPath(); g.arc(fx,fy,2.1,0,TAU); g.fill(); g.fillStyle=col==='#ffffff'||col==='#fff6e0'?'#ffd84a':'#fff6e0'; g.beginPath(); g.arc(fx,fy,0.8,0,TAU); g.fill(); } }
function sbPebble(g,x,y,r,col){ g.fillStyle='rgba(59,34,51,.28)'; g.beginPath(); g.ellipse(x+0.6,y+0.9,r*1.25,r*0.85,0,0,TAU); g.fill(); g.fillStyle=col; g.beginPath(); g.ellipse(x,y,r*1.2,r*0.8,0,0,TAU); g.fill(); g.fillStyle='rgba(255,250,230,.45)'; g.beginPath(); g.ellipse(x-r*0.35,y-r*0.3,r*0.5,r*0.3,0,0,TAU); g.fill(); }
function lookDecor(g,rng,at,x0,y0){
  g.lineCap='round'; g.lineJoin='round';
  for(let i=0;i<340;i++){
    const x=x0+rng()*CH, y=y0+rng()*CH, s=at(x,y), r=rng();
    if(s.out) continue;
    if(s.lava){ if(s.lavaS<0.8) continue;
      if(r<0.42){ g.strokeStyle=rng()<0.5?'rgba(255,232,140,.9)':'rgba(255,190,80,.95)'; g.lineWidth=2.2+rng()*2; g.beginPath(); const a=rng()*TAU; g.arc(x,y,5+rng()*9,a,a+1.1+rng()*1.4); g.stroke(); }
      else if(r<0.5){ g.fillStyle='rgba(255,246,200,.9)'; g.beginPath(); g.arc(x,y,1.6+rng()*2,0,TAU); g.fill(); }
      else if(r<0.53){ const q=4+rng()*5; g.fillStyle='#5a2a26'; g.beginPath(); g.ellipse(x,y,q*1.3,q,rng()*3,0,TAU); g.fill(); g.strokeStyle='rgba(59,34,51,.9)'; g.lineWidth=1.4; g.stroke(); g.fillStyle='#7a3a30'; g.beginPath(); g.ellipse(x-q*0.3,y-q*0.3,q*0.6,q*0.4,0,0,TAU); g.fill(); }
      continue; }
    if(s.water){ if(s.depth>0.75&&!s.bridge&&r<0.09){ g.strokeStyle='rgba(255,255,255,.26)'; g.lineWidth=1.8; g.beginPath(); g.arc(x-4,y,4,0.3,Math.PI-0.3); g.arc(x+4,y,4,0.3,Math.PI-0.3); g.stroke(); } continue; }
    if(s.road>0.5){ if(r<0.08) sbPebble(g,x,y,1.4+rng(),'rgba(170,140,100,.8)'); continue; }
    if(s.shore>0.35){ if(r<0.05) sbPebble(g,x,y,1.3+rng()*0.8,'#e6cf98'); continue; }
    const b=s.t<0.75&&rng()<0.5?s.b2:s.b;
    if(b===0){
      if(r<0.42) sbTuft(g,x,y,'rgba(64,132,44,.6)',0.9+rng()*0.5);
      else if(r<0.5) sbFlowers(g,rng,x,y,pick(['#ffffff','#ffe066','#ff9ec0','#c8a2ff','#fff6e0']),3+Math.floor(rng()*3));
      else if(r<0.53) sbPebble(g,x,y,1.6+rng(),'#b8b4aa');
    }else if(b===1){
      if(r<0.4) sbTuft(g,x,y,'rgba(38,100,40,.6)',0.9+rng()*0.5);
      else if(r<0.5){ g.fillStyle=pick(['rgba(214,150,60,.75)','rgba(200,110,50,.7)','rgba(232,190,80,.7)']); g.beginPath(); g.ellipse(x,y,2.8,1.6,rng()*3,0,TAU); g.fill(); }
      else if(r<0.515){ g.fillStyle='#f4ead6'; g.fillRect(x-0.9,y-1,1.8,3.4); g.fillStyle='#e8483e'; g.beginPath(); g.arc(x,y-1,2.6,Math.PI,0); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(x-0.9,y-2,0.6,0,TAU); g.arc(x+1,y-1.6,0.5,0,TAU); g.fill(); }
      else if(r<0.54) sbFlowers(g,rng,x,y,pick(['#ffffff','#c8a2ff']),2+Math.floor(rng()*2));
    }else if(b===2){
      if(r<0.18) sbPebble(g,x,y,1.4+rng()*1.4,'#8e877e');
      else if(r<0.28){ g.strokeStyle='rgba(84,76,70,.45)'; g.lineWidth=1.4; g.beginPath(); let px=x,py=y,a=rng()*TAU; g.moveTo(px,py); for(let k=0;k<3;k++){ a+=(rng()-0.5)*1.2; px+=Math.cos(a)*(5+rng()*6); py+=Math.sin(a)*(5+rng()*6); g.lineTo(px,py); } g.stroke(); }
      else if(r<0.34) sbTuft(g,x,y,'rgba(150,140,96,.6)',0.8);
    }else if(b===3){
      if(r<0.2) sbPebble(g,x,y,1.4+rng()*1.6,'#c07a4e');
      else if(r<0.3){ g.strokeStyle='rgba(140,82,48,.45)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+8,y+rng()*6-3,x+16,y+rng()*6-3); g.stroke(); }
      else if(r<0.36) sbTuft(g,x,y,'rgba(176,150,80,.65)',0.85);
    }else if(b===4){
      if(r<0.08){ g.strokeStyle='rgba(30,20,22,.6)'; g.lineWidth=2.2; g.beginPath(); let px=x,py=y,a=rng()*TAU; g.moveTo(px,py); const P=[[px,py]]; for(let k=0;k<3;k++){ a+=(rng()-0.5)*1.2; px+=Math.cos(a)*(6+rng()*7); py+=Math.sin(a)*(6+rng()*7); g.lineTo(px,py); P.push([px,py]); } g.stroke(); g.strokeStyle='rgba(255,128,48,.55)'; g.lineWidth=0.9; g.beginPath(); P.forEach((q,k)=>k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.stroke(); }
      else if(r<0.32) sbPebble(g,x,y,1.3+rng()*1.4,'#3e3234');
    }else if(b===5){
      if(r<0.16){ g.fillStyle='rgba(160,186,224,.32)'; g.beginPath(); g.ellipse(x,y,6+rng()*10,2.4+rng()*3,0,0,TAU); g.fill(); }
      else if(r<0.3){ g.fillStyle='rgba(255,255,255,.95)'; const q=1+rng(); g.fillRect(x-q*1.5,y-0.4,q*3,0.8); g.fillRect(x-0.4,y-q*1.5,0.8,q*3); }
      else if(r<0.34) sbPebble(g,x,y,1.4+rng(),'#9aa6b6');
      else if(r<0.37) sbTuft(g,x,y,'rgba(130,120,96,.55)',0.8);
    }else if(b===6){
      if(s.bog>0.5){ if(r<0.08){ g.fillStyle='rgba(59,34,51,.3)'; g.beginPath(); g.arc(x+0.6,y+1,4.4,0,TAU); g.fill(); g.fillStyle='#6ab45a'; g.beginPath(); g.arc(x,y,4.2,0.5,TAU-0.1); g.lineTo(x,y); g.fill(); if(rng()<0.3){ g.fillStyle='#ffb8d0'; g.beginPath(); g.arc(x+1,y-1,1.6,0,TAU); g.fill(); } } else if(r<0.12){ g.strokeStyle='rgba(220,240,230,.35)'; g.lineWidth=1.2; g.beginPath(); g.arc(x,y,2+rng()*2,0,TAU); g.stroke(); } continue; }
      if(r<0.38) sbTuft(g,x,y,'rgba(60,110,52,.6)',0.95+rng()*0.4);
      else if(r<0.44){ g.strokeStyle='rgba(70,120,50,.8)'; g.lineWidth=1.5; g.beginPath(); for(let k=0;k<4;k++){ g.moveTo(x+k*2,y); g.lineTo(x+k*2+(rng()-0.5)*3,y-6-rng()*5); } g.stroke(); g.fillStyle='#8a5a32'; g.fillRect(x+2.2,y-11,1.8,4); }
      else if(r<0.46) sbFlowers(g,rng,x,y,'#ffe066',2);
    }else{
      const B=typeof BIOMES!=='undefined'?BIOMES[b]:null;
      if(B&&B.decor&&r<0.35){ try{ B.decor(g,rng,x,y,s,rng()); }catch(e){} g.lineWidth=1.1; }
    }
  }
  g.lineWidth=1.1;
}
// maps 1 and up: the same chunk as genChunkMap (e2_terrain.js), with the contour lines added before decals and bridges
{ const base=genChunkMap; genChunkMap=function(cx,cy){
  if(!LOOK.sb) return base(cx,cy);
  const x0=cx*CH, y0=cy*CH, N=65, step=CH/(N-1);
  const small=mkCanvas(N,N), sg=small.getContext('2d'), img=sg.createImageData(N,N), d=img.data;
  const glowS=mkCanvas(N,N), gg=glowS.getContext('2d'), gimg=gg.createImageData(N,N), gd=gimg.data;
  const grid=new Array(N*N); let hasLava=false, hasWater=false;
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const x=x0+i*step, y=y0+j*step, s=T(x,y,{});
    grid[j*N+i]=s;
    const c=groundRGB(s,x,y), k=(j*N+i)*4;
    d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255;
    if(s.lavaS>0){ hasLava=true; gd[k]=255; gd[k+1]=120; gd[k+2]=30; gd[k+3]=Math.round(clamp(s.lavaS*1.4-0.2,0,1)*210); }
    if(s.water) hasWater=true;
  }
  sg.putImageData(img,0,0);
  const cv=mkCanvas(CPX,CPX), g=cv.getContext('2d');
  g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
  g.drawImage(small,0,0,N,N,-CPX/(N-1)/2,-CPX/(N-1)/2,CPX+CPX/(N-1),CPX+CPX/(N-1));
  g.setTransform(RES,0,0,RES,-x0*RES,-y0*RES);
  const at=(x,y)=>{ const i=clamp(Math.round((x-x0)/step),0,N-1), j=clamp(Math.round((y-y0)/step),0,N-1); return grid[j*N+i]; };
  const rng=mulberry32(((cx*92821)^(cy*68917)^7)|0);
  g.lineCap='round'; g.lineWidth=1.1;
  for(let i=0;i<900;i++){
    const x=x0+rng()*CH, y=y0+rng()*CH, s=at(x,y), r=rng();
    if(s.out||s.water||s.lava) continue;
    if(s.road>0.5){ if(r<0.08) sbPebble(g,x,y,1.4+rng(),'rgba(170,140,100,.8)'); continue; }
    const b=s.t<0.75&&rng()<0.5?s.b2:s.b, B=BIOMES[b];
    if(B&&B.decor){ try{ B.decor(g,rng,x,y,s,r); }catch(e){} g.lineWidth=1.1; }
  }
  const ch={cv,g,glow:null,hasWater,used:chunkTick};
  lookChunkLines(g,grid,N,step,x0,y0,ch);
  for(const dc of DECALS){ if(dc.x+(dc.r||dc.w||300)<x0||dc.x-(dc.r||dc.w||300)>x0+CH||dc.y+(dc.r||dc.h||300)<y0||dc.y-(dc.r||dc.h||300)>y0+CH) continue; drawDecal(g,dc); }
  for(const br of BRIDGES){ if(br.x+200<x0||br.x-200>x0+CH||br.y+200<y0||br.y-200>y0+CH) continue; drawBridge(g,br); }
  if(hasLava){ gg.putImageData(gimg,0,0); const glow=mkCanvas(CPX/4,CPX/4); const g2=glow.getContext('2d'); g2.imageSmoothingEnabled=true; g2.drawImage(glowS,0,0,N,N,-CPX/4/(N-1)/2,-CPX/4/(N-1)/2,CPX/4+CPX/4/(N-1),CPX/4+CPX/4/(N-1)); ch.glow=glow; }
  return ch;
}; }
// groundRGB for maps 1 and up in this look: the biome's own palette (STYLE.md), cleaner borders and shore bands
{ const base=groundRGBMap; groundRGBMap=function(s,x,y){
  if(!LOOK.sb||s.out) return base(s,x,y);
  const B=BIOMES[s.b]||BDEF, M=MAPS[mapAt(y)];
  const m=fbm(x*0.0011+11,y*0.0011-7,2);
  let c=BCOL[s.b]?sbBiomeRGB(s.b,s.n,m):[120,170,90];
  if(s.b2!==s.b&&s.t<1&&BCOL[s.b2]) c=mixRGB(sbBiomeRGB(s.b2,s.n,m),c,sbBlend(s.t));
  if(s.sand>0) c=mixRGB(c,B._sand||[240,214,150],clamp(s.sand,0,1)*0.85);
  if(s.snow>0) c=mixRGB(c,[240,245,250],clamp(s.snow,0,1)*0.9);
  if(s.ice>0) c=mixRGB(c,mixRGB([186,228,246],[222,244,252],clamp(s.n+0.5,0,1)),clamp(s.ice,0,1)*0.9);
  if(s.shore>0) c=mixRGB(c,B._shore,smooth(clamp((s.shore-0.3)/0.3,0,1))*0.95);
  if(s.bog>0) c=mixRGB(c,mixRGB([92,140,104],[72,118,90],clamp(s.n+0.5,0,1)),smooth(clamp(s.bog*1.6-0.3,0,1))*0.9);
  if(s.road>0) c=mixRGB(c,B._road,smooth(clamp((s.road-0.15)/0.55,0,1)));
  if(s.water){ const Wc=B._water; c=mixRGB(Wc[0],Wc[1],smooth(s.depth)); if(s.seaD>0) c=mixRGB(c,mixRGB(Wc[1],[20,40,90],0.4),smooth(s.seaD)*0.7); }
  if(s.lavaS>0) c=mixRGB(c,mixRGB(SBC.lava,SBC.lavaHot,smooth(clamp((s.n+0.04)*3.2,0,1))),smooth(clamp(s.lavaS*1.7-0.35,0,1)));
  if(B.rgb){ const r=B.rgb(c,s,x,y); if(r) c=r; }
  if(M){ const ed=Math.min(x,y-M.y0,M.w-x,M.y0+M.h-y); if(ed<160) c=mixRGB([34,26,44],c,clamp(ed/160,0,1)); }
  return c;
}; }
// ================= prop sprites (trees, bushes, rocks, plants): cel shaded and outlined, built once
// the light comes from the top left, like the toy figures (T3.L); every sprite keeps its old size and radius
const SBPAL={
  oak:['#3f8a3e','#58a845','#8ccf55'], birch:['#5f9a3e','#86bf4c','#b8e06a'], pine:['#2c6e52','#3f925e','#6cba6e'],
  willow:['#4f8048','#6a9e58','#9cc676'], bush:['#3d8a3c','#5aac46','#8fd25a'], shrub:['#a0823a','#c4a650','#e6cc78'],
  fshrub:['#5a8a86','#7caca6','#e2f0f2'], mbush:['#4f7a40','#6a9450','#94b86a'],
  rock:['#7d8794','#a3abb6','#cfd5dc'], crag:['#9e4e36','#c4704a','#e6966a'], obsid:['#2c2236','#4a3c5a','#8a76a6'],
  bark:['#5e4636','#8a6a4e','#b08e6a'], char:['#2e2224','#4e3a38','#6a5048'], snow:['#c6d6ea','#eef4fb','#ffffff']
};
// a puffy canopy of clumps: each clump gets a shadow disc, a base disc nudged to the light and a highlight blob,
// drawn from the low outer clumps to the high centre so the crown reads as a soft dome
function sbCanopy(g,R,rng,pal,n,inner){
  const cl=[];
  for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.55, d=R*(0.42+rng()*0.14), r=R*(0.32+rng()*0.1); cl.push([Math.cos(a)*d,Math.sin(a)*d*0.94,r]); }
  for(let i=0;i<inner;i++){ const a=rng()*TAU, d=R*(0.12+rng()*0.16), r=R*(0.3+rng()*0.08); cl.push([Math.cos(a)*d,Math.sin(a)*d,r]); }
  cl.push([-R*0.05,-R*0.07,R*0.36]);
  for(const c of cl){ const h=1-Math.hypot(c[0],c[1])/R; c[3]=h-(c[0]+c[1])/(R*6); }
  cl.sort((a,b)=>a[3]-b[3]);
  // one shadow body so no gaps show between clumps
  g.fillStyle=pal[0]; g.beginPath(); for(const c of cl){ g.moveTo(c[0]+c[2]*1.02,c[1]); g.arc(c[0],c[1],c[2]*1.02,0,TAU); } g.fill();
  for(const c of cl){
    const [x,y,r]=c, lit=clamp(-(x+y)/(R*0.9),-1,1);
    g.fillStyle=pal[0]; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
    const br=r*(0.8+0.08*lit); g.fillStyle=pal[1]; g.beginPath(); g.arc(x-r*0.14,y-r*0.17,br,0,TAU); g.fill();
    if(lit>-0.55){ g.fillStyle=pal[2]; g.beginPath(); g.ellipse(x-r*0.34,y-r*0.4,r*(0.36+0.1*lit),r*(0.28+0.08*lit),-0.6,0,TAU); g.fill(); }
  }
  // a few leaf ticks in the shadow tone for a little texture
  g.strokeStyle=pal[0]; g.lineWidth=1.3; g.lineCap='round';
  for(let i=0;i<Math.round(n*1.3);i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.7, x=Math.cos(a)*d, y=Math.sin(a)*d; if(x+y<-R*0.3) continue; g.beginPath(); g.arc(x,y,2.6+rng()*1.6,0.3,1.9); g.stroke(); }
}
function sbStar(g,n,r0,r1,rot,dx,dy,s){ s=s||1; for(let i=0;i<n*2;i++){ const a=rot+i/(n*2)*TAU, rr=(i%2?r1:r0)*s, x=Math.cos(a)*rr+dx, y=Math.sin(a)*rr+dy; i?g.lineTo(x,y):g.moveTo(x,y); } g.closePath(); }
function sbMkOak(seed,kind){
  const rng=mulberry32(seed), R=48, P=SBPAL[kind]||SBPAL.oak;
  return outlineSprite(spriteOf(R,g=>sbCanopy(g,R*0.94,rng,P,8+Math.floor(rng()*3),3)),SBC.outline,2.3,{force:true});
}
function sbMkPine(seed,snow){
  const rng=mulberry32(seed), R=40, P=SBPAL.pine, S=SBPAL.snow;
  return outlineSprite(spriteOf(R,g=>{
    const layers=[[R,0.62],[R*0.72,0.6],[R*0.45,0.58]];
    for(let L=0;L<layers.length;L++){
      const [r,k]=layers[L], n=9+Math.floor(rng()*3)-L, rot=rng()*TAU;
      const tones=[sbTone(P[2],L*0.06),sbTone(P[1],L*0.07),P[0]];
      celFill(g,(q,dx,dy)=>sbStar(q,n,r,r*k,rot,dx,dy),P[1],{r,tones,hi:r*0.12,lo:r*0.16});
      if(snow){ g.save(); g.beginPath(); sbStar(g,n,r,r*k,rot,0,0); g.clip(); g.fillStyle=S[1]; g.beginPath(); sbStar(g,n,r*0.8,r*k*0.8,rot,-r*0.22,-r*0.26); g.fill(); g.fillStyle=S[2]; g.beginPath(); sbStar(g,n,r*0.5,r*k*0.5,rot,-r*0.36,-r*0.4); g.fill(); g.restore(); }
      // a soft shadow ring under the next layer up so the tiers read
      if(L<layers.length-1){ g.fillStyle='rgba(30,40,40,.22)'; g.beginPath(); g.arc(r*0.06,r*0.08,layers[L+1][0]*1.04,0,TAU); g.fill(); }
    }
    g.fillStyle=snow?S[2]:P[2]; g.beginPath(); g.arc(-2,-2,3,0,TAU); g.fill();
  }),SBC.outline,2.1,{force:true});
}
function sbMkWillow(seed){
  const rng=mulberry32(seed), R=52, P=SBPAL.willow;
  return outlineSprite(spriteOf(R,g=>{
    // a skirt of hanging leaf fronds around the crown (they droop a little south), then the crown on top
    const n=20;
    for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.12, d=R*(0.7+rng()*0.08), x=Math.cos(a)*d, y=Math.sin(a)*d+5, lit=-(Math.cos(a)+Math.sin(a))/1.42;
      g.save(); g.translate(x,y); g.rotate(a+Math.PI/2);
      g.fillStyle=P[0]; g.beginPath(); g.ellipse(0,0,6.4,11,0,0,TAU); g.fill();
      g.fillStyle=lit>-0.2?P[1]:sbTone(P[1],-0.12); g.beginPath(); g.ellipse(-1,-1.6,4.4,8.4,0,0,TAU); g.fill();
      g.strokeStyle=P[0]; g.lineWidth=1.1; g.beginPath(); g.moveTo(0,-8); g.lineTo(0,8); g.stroke();
      g.restore(); }
    sbCanopy(g,R*0.7,rng,P,7,2);
  }),SBC.outline,2.1,{force:true});
}
function sbMkDead(seed,charred){
  const rng=mulberry32(seed), R=40, P=charred?SBPAL.char:SBPAL.bark;
  return outlineSprite(spriteOf(R,g=>{
    g.lineCap='round'; g.lineJoin='round';
    const segs=[];
    const br=(x,y,a,len,w,d)=>{ if(d>3||len<5) return; const x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len; segs.push([x,y,x2,y2,w]); const k=1+Math.floor(rng()*2); for(let i=0;i<=k;i++) br(x2,y2,a+(rng()-0.5)*1.3,len*(0.56+rng()*0.18),w*0.62,d+1); };
    const n=4+Math.floor(rng()*2); for(let i=0;i<n;i++) br(0,0,i/n*TAU+rng()*0.6,R*(0.42+rng()*0.16),6.4,0);
    for(const s of segs){ g.strokeStyle=P[0]; g.lineWidth=s[4]; g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); }
    for(const s of segs){ g.strokeStyle=P[1]; g.lineWidth=s[4]*0.62; g.beginPath(); g.moveTo(s[0]-s[4]*0.12,s[1]-s[4]*0.12); g.lineTo(s[2]-s[4]*0.12,s[3]-s[4]*0.12); g.stroke(); }
    for(const s of segs){ g.strokeStyle=P[2]; g.lineWidth=Math.max(0.8,s[4]*0.22); g.beginPath(); g.moveTo(s[0]-s[4]*0.25,s[1]-s[4]*0.25); g.lineTo(s[2]-s[4]*0.25,s[3]-s[4]*0.25); g.stroke(); }
    celBall(g,0,0,7.2,P[1],[P[2],P[1],P[0]]);
    g.strokeStyle=P[0]; g.lineWidth=1; g.beginPath(); g.arc(0.5,0.5,3.4,0,TAU); g.stroke();
    if(charred){ for(let i=0;i<6;i++){ const a=rng()*TAU, d=6+rng()*18; g.fillStyle='#ff9a3a'; g.beginPath(); g.arc(Math.cos(a)*d,Math.sin(a)*d,1.5,0,TAU); g.fill(); g.fillStyle='#ffe08a'; g.beginPath(); g.arc(Math.cos(a)*d-0.4,Math.sin(a)*d-0.4,0.6,0,TAU); g.fill(); } }
  }),SBC.outline,1.8,{force:true});
}
function sbRockPts(R,rng,flat){ const n=7+Math.floor(rng()*3), v=[]; for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.28, m=0.8+rng()*0.22; v.push([Math.cos(a)*R*m,Math.sin(a)*R*m*(flat||0.84)]); } return v; }
function sbRoundPoly(q,v,dx,dy,s){ s=s||1; const n=v.length; for(let i=0;i<n;i++){ const a=v[i], b=v[(i+1)%n], mx=(a[0]+b[0])/2*s+dx, my=(a[1]+b[1])/2*s+dy; if(!i) q.moveTo(mx,my); else q.quadraticCurveTo(a[0]*s+dx,a[1]*s+dy,mx,my); } const a=v[0], b=v[1]; q.quadraticCurveTo(a[0]*s+dx,a[1]*s+dy,(a[0]+b[0])/2*s+dx,(a[1]+b[1])/2*s+dy); q.closePath(); }
function sbMkRock(seed,kind){
  const rng=mulberry32(seed), R=kind==='crag'?28:18, P=kind==='crag'?SBPAL.crag:kind==='obsid'?SBPAL.obsid:SBPAL.rock;
  return outlineSprite(spriteOf(R,g=>{
    const v=sbRockPts(R,rng);
    celFill(g,(q,dx,dy)=>sbRoundPoly(q,v,dx,dy),P[1],{r:R,tones:[P[2],P[1],P[0]],hi:R*0.14,lo:R*0.26});
    // a flat top facet toward the light makes it chunky
    g.save(); g.beginPath(); sbRoundPoly(g,v,0,0); g.clip();
    g.fillStyle=kind==='obsid'?'rgba(190,170,230,.35)':'rgba(255,250,230,.28)'; g.beginPath(); sbRoundPoly(g,v,-R*0.16,-R*0.2,0.55); g.fill();
    g.strokeStyle=sbTone(P[0],-0.2); g.lineWidth=1.3; g.lineCap='round';
    for(let i=0;i<(kind==='crag'?3:2);i++){ let x=(rng()-0.3)*R*0.7, y=(rng()-0.3)*R*0.6; g.beginPath(); g.moveTo(x,y); for(let k=0;k<2;k++){ x+=(rng()-0.4)*R*0.45; y+=(rng()-0.4)*R*0.45; g.lineTo(x,y); } g.stroke(); }
    if(kind==='moss'){ for(let i=0;i<5;i++){ const x=-R*0.25+(rng()-0.5)*R*0.9, y=-R*0.25+(rng()-0.5)*R*0.5; celBall(g,x,y,2.4+rng()*2.6,'#6aaa4a',['#9ad46a','#6aaa4a','#4a8a3e']); } }
    if(kind==='snow'){ const S=SBPAL.snow; g.fillStyle=S[1]; g.beginPath(); g.ellipse(-R*0.2,-R*0.32,R*0.82,R*0.46,-0.35,0,TAU); g.fill(); g.fillStyle=S[2]; g.beginPath(); g.ellipse(-R*0.32,-R*0.42,R*0.42,R*0.2,-0.35,0,TAU); g.fill(); g.fillStyle=S[0]; g.beginPath(); g.ellipse(-R*0.1,-R*0.05,R*0.62,R*0.12,-0.35,0,Math.PI); g.fill(); }
    g.restore();
  }),SBC.outline,R>20?2:1.6,{force:true});
}
function sbMkSpike(seed){
  const rng=mulberry32(seed), R=20, P=SBPAL.obsid;
  return outlineSprite(spriteOf(R,g=>{
    const n=5+Math.floor(rng()*3), sh=[];
    for(let i=0;i<n;i++) sh.push([rng()*TAU,R*(0.62+rng()*0.38)]);
    sh.sort((a,b)=>Math.sin(a[0])-Math.sin(b[0]));
    for(const [a,L] of sh){ g.save(); g.rotate(a);
      const lightTop=Math.sin(a)>0; // the face toward the top left gets the light
      g.fillStyle=lightTop?P[0]:P[2]; g.beginPath(); g.moveTo(0,-4.6); g.lineTo(L,0); g.lineTo(0,0); g.closePath(); g.fill();
      g.fillStyle=lightTop?P[2]:P[0]; g.beginPath(); g.moveTo(0,4.6); g.lineTo(L,0); g.lineTo(0,0); g.closePath(); g.fill();
      g.strokeStyle='rgba(200,180,255,.6)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(1,0); g.lineTo(L-2,0); g.stroke(); g.restore(); }
    celBall(g,0,0,5.6,P[1],[P[2],P[1],P[0]]);
  }),SBC.outline,1.5,{force:true});
}
function sbMkBush(seed,kind){
  const rng=mulberry32(seed), R=15, P=SBPAL[kind]||SBPAL.bush;
  return outlineSprite(spriteOf(R,g=>{
    sbCanopy(g,R,rng,P,5,1);
    if(kind==='bush'&&rng()<0.45){ for(let i=0;i<5;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.7; celBall(g,Math.cos(a)*d,Math.sin(a)*d,1.8,'#e8403a',['#ff9a8a','#e8403a','#a82a30']); } }
    if(kind==='fshrub'){ g.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<6;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.7; g.beginPath(); g.ellipse(Math.cos(a)*d-2,Math.sin(a)*d-2,2.6,1.6,-0.5,0,TAU); g.fill(); } }
  }),SBC.outline,1.5,{force:true});
}
function sbMkStump(seed){
  const rng=mulberry32(seed), R=12, P=SBPAL.bark;
  return outlineSprite(spriteOf(R,g=>{
    celBall(g,0,0,R*0.82,P[1],[P[2],P[1],P[0]]);
    g.fillStyle='#e2bc84'; g.beginPath(); g.arc(-0.6,-0.8,R*0.6,0,TAU); g.fill();
    g.strokeStyle='#b88a54'; g.lineWidth=0.9; for(let r=1.8;r<R*0.56;r+=2.2){ g.beginPath(); g.arc(-0.6,-0.8,r,0,TAU); g.stroke(); }
    g.strokeStyle=P[0]; g.lineWidth=1.2; g.beginPath(); g.moveTo(-0.6,-0.8); g.lineTo(-0.6+R*0.5,-0.8+R*0.18); g.stroke();
    if(rng()<0.5){ celBall(g,R*0.5,R*0.4,2.2,'#e8483e',['#ff9a8a','#e8483e','#a82a30']); }
  }),SBC.outline,1.4,{force:true});
}
function sbMkBones(seed){
  const rng=mulberry32(seed), R=14;
  return outlineSprite(spriteOf(R,g=>{
    g.lineCap='round';
    for(let i=0;i<4;i++){ const a=rng()*TAU, L=6+rng()*8, x=(rng()-0.5)*14, y=(rng()-0.5)*14; g.strokeStyle='#cfc4ac'; g.lineWidth=3; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); g.stroke(); g.strokeStyle='#f6f0e0'; g.lineWidth=1.6; g.beginPath(); g.moveTo(x-0.5,y-0.5); g.lineTo(x+Math.cos(a)*L-0.5,y+Math.sin(a)*L-0.5); g.stroke(); for(const e of [0,1]){ const ex=x+Math.cos(a)*L*e, ey=y+Math.sin(a)*L*e; g.fillStyle='#f6f0e0'; g.beginPath(); g.arc(ex,ey,2,0,TAU); g.fill(); } }
    celBall(g,2,1,4.6,'#f2ead8',['#ffffff','#f2ead8','#cfc4ac']);
    g.fillStyle='#3b2233'; g.beginPath(); g.arc(1,0.4,1.1,0,TAU); g.arc(3.6,0.9,1.1,0,TAU); g.fill();
  }),SBC.outline,1.2,{force:true});
}
function sbMkHerb(seed){
  const rng=mulberry32(seed), R=10;
  return outlineSprite(spriteOf(R,g=>{
    for(let i=0;i<7;i++){ const a=i/7*TAU+rng()*0.4; g.save(); g.rotate(a); g.fillStyle=i%2?'#4e9a3c':'#62b04a'; g.beginPath(); g.ellipse(4.6,0,4.6,1.9,0,0,TAU); g.fill(); g.restore(); }
    for(let i=0;i<5;i++){ const a=rng()*TAU, d=2+rng()*4; celBall(g,Math.cos(a)*d,Math.sin(a)*d,1.9,i%2?'#ece2ff':'#b88cff',['#ffffff',i%2?'#ece2ff':'#b88cff','#8a5ad8']); }
  }),SBC.outline,1.1,{force:true});
}
function sbMkReed(seed){
  const rng=mulberry32(seed), R=14;
  return outlineSprite(spriteOf(R,g=>{
    g.lineCap='round';
    for(let i=0;i<8;i++){ const x=(rng()-0.5)*14, y=(rng()-0.5)*10, a=-Math.PI/2+(rng()-0.5)*0.9, L=8+rng()*8; g.strokeStyle=rng()<0.5?'#5a9a3a':'#7ab44a'; g.lineWidth=1.9; g.beginPath(); g.moveTo(x,y+4); g.lineTo(x+Math.cos(a)*L,y+4+Math.sin(a)*L); g.stroke(); if(rng()<0.45){ g.strokeStyle='#8a5430'; g.lineWidth=3.4; g.beginPath(); g.moveTo(x+Math.cos(a)*L*0.72,y+4+Math.sin(a)*L*0.72); g.lineTo(x+Math.cos(a)*L*0.98,y+4+Math.sin(a)*L*0.98); g.stroke(); } }
  }),SBC.outline,1.1,{force:true});
}
function sbMkVent(){
  return outlineSprite(spriteOf(16,g=>{
    celBall(g,0,0,14,'#5a4646',['#7a6262','#5a4646','#3a2c2e']);
    const gr=g.createRadialGradient(0,0,1,0,0,9); gr.addColorStop(0,'#ffe08a'); gr.addColorStop(0.35,'#ff8a3a'); gr.addColorStop(1,'#3a1a14'); g.fillStyle=gr; g.beginPath(); g.arc(0.5,0.5,8.5,0,TAU); g.fill();
  }),SBC.outline,1.4,{force:true});
}
// called by buildSprites (a3_art.js) in the Storybook look; returns true when it built the set
function sbBuildSprites(){
  SPR.oak=[1,2,3,4,5].map(i=>sbMkOak(1000+i,'oak')); SPR.birch=[1,2,3].map(i=>sbMkOak(2000+i,'birch'));
  SPR.pine=[1,2,3,4].map(i=>sbMkPine(3000+i)); SPR.dead=[1,2,3].map(i=>sbMkDead(4000+i,false)); SPR.char=[1,2].map(i=>sbMkDead(4500+i,true));
  SPR.rock=[1,2,3].map(i=>sbMkRock(5000+i,'grey')); SPR.mossrock=[1,2,3].map(i=>sbMkRock(5100+i,'moss')); SPR.crag=[1,2,3,4].map(i=>sbMkRock(5200+i,'crag')); SPR.obsid=[1,2,3].map(i=>sbMkRock(5300+i,'obsid'));
  SPR.spike=[1,2,3].map(i=>sbMkSpike(6000+i)); SPR.bush=[1,2,3,4].map(i=>sbMkBush(7000+i,'bush')); SPR.shrub=[1,2,3].map(i=>sbMkBush(7100+i,'shrub'));
  SPR.spine=[1,2,3,4].map(i=>sbMkPine(3100+i,true)); SPR.srock=[1,2,3].map(i=>sbMkRock(5400+i,'snow')); SPR.fshrub=[1,2,3].map(i=>sbMkBush(7200+i,'fshrub'));
  SPR.willow=[1,2,3].map(i=>sbMkWillow(3200+i)); SPR.reed=[1,2,3].map(i=>sbMkReed(8300+i)); SPR.mbush=[1,2,3].map(i=>sbMkBush(7300+i,'mbush'));
  SPR.bigoak=(()=>{ const rng=mulberry32(1777), R=48; return outlineSprite(spriteOf(R,g=>sbCanopy(g,R*0.95,rng,SBPAL.oak,11,4)),SBC.outline,1.8,{force:true}); })();
  SPR.stump=[1,2].map(i=>sbMkStump(8000+i)); SPR.bones=[1,2].map(i=>sbMkBones(8100+i)); SPR.herb=[sbMkHerb(8200)]; SPR.vent=[sbMkVent()];
  SPR.shadow=sbShadow();
  return true;
}
// the soft round shadow under props and figures, in plum (the Classic one is black)
function sbShadow(){ const c=mkCanvas(64,64), g=c.getContext('2d'); const gr=g.createRadialGradient(32,32,4,32,32,32); gr.addColorStop(0,'rgba(46,22,58,.58)'); gr.addColorStop(0.6,'rgba(46,22,58,.32)'); gr.addColorStop(1,'rgba(46,22,58,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return c; }
// prop kinds from definePropKind (new maps) get the outline automatically in this look (def.outline:false skips it,
// def.ow sets the width in world px; the default follows the kind's radius)
{ const base=propKindSprites; propKindSprites=function(kind){
  base(kind);
  const d=PROPK[kind]; if(!LOOK.sb||!d||d.outline===false||!SPR[kind]) return;
  SPR[kind]=SPR[kind].map(c=>{ const o=outlineSprite(c,d.oc||SBC.outline,d.ow||sbOW(d.R||14),{force:true}); if(!o.half) o.half=c.half; return o; });
}; }

// ================= houses: the old painted house, a touch brighter and warmer, with the bold outline baked in
const SB_HPAD=6; // canvas px of room for the outline
function sbHouseCanvas(b){
  const P=SB_HPAD, c=mkCanvas(b.width+P*2,b.height+P*2), g=c.getContext('2d');
  g.drawImage(b,P,P); gradeCanvas(c,{sat:1.2,warm:0.35,lift:0.02});
  const o=outlineSprite(c,SBC.outline,2.3,{force:true,thr:0.5});
  const sc=b.sc||HSC; o.ox=b.ox+P/sc; o.oy=b.oy+P/sc; o.sc=sc; o.burnt=b.burnt; o.snow=b.snow; o.cx=b.cx; o.cy=b.cy;
  return o;
}
{ const base=houseSprite; houseSprite=function(hs){
  if(!LOOK.sb||LOOK.off.houses) return base(hs);
  let c=LOOK.houses.get(hs);
  if(c&&c.burnt===!!hs.burnt&&c.snow===!!hs.snow) return c;
  const b=base(hs); c=sbHouseCanvas(b); LOOK.houses.set(hs,c);
  SCACHE.delete(hs); // the painted original is not needed again unless the house changes
  return c;
}; }
{ const base=mapEvict; mapEvict=function(keep){ const n=base(keep); for(const hs of [...LOOK.houses.keys()]) if(itemMap(hs)!==keep&&itemMap(hs)>=0) LOOK.houses.delete(hs); return n; }; }

// ================= landmark and reach sprites (r2S in a3b_art2.js, rSpr in a2i_reach.js): outlined in this look
// (they keep their own key with an sb: prefix, so the Classic ones are never touched)
{ const base=r2S; r2S=function(key,w,h,ox,oy,draw){
  if(!LOOK.sb) return base(key,w,h,ox,oy,draw);
  const k='sb:'+key; let c=R2.spr.get(k); if(c) return c;
  c=base(k,w,h,ox,oy,draw); const o=outlineSprite(gradeCanvas(c,{sat:1.16,warm:0.2}),SBC.outline,Math.min(2,Math.max(1.3,Math.max(w,h)/60)),{force:true});
  R2.spr.set(k,o); return o;
}; }
{ const base=rSpr; rSpr=function(key,w,h,ox,oy,fn){
  if(!LOOK.sb) return base(key,w,h,ox,oy,fn);
  const k='sb:'+key; let c=RSP.get(k); if(c) return c;
  c=base(k,w,h,ox,oy,fn); const o=outlineSprite(gradeCanvas(c,{sat:1.16,warm:0.2}),SBC.outline,1.6,{force:true});
  RSP.set(k,o); return o;
}; }

// ================= structs (wells, lamps, stalls, shrines, wards...): cached outlined bodies, live glows on top
function sbOutlineStroke(g,w){ g.strokeStyle=SBC.outline; g.lineWidth=w||1.6; g.lineJoin='round'; g.stroke(); }
function sbRRect(g,x,y,w,h,r){ rrect(g,x,y,w,h,Math.min(r,w/2,h/2)); }
const SB_STRUCT={
  well(){ return sbSprite('well',30,g=>{
    celBall(g,0,0,24,'#b8b0a6',['#dcd6cc','#b8b0a6','#8a8278']);
    g.strokeStyle='#8a8278'; g.lineWidth=1.2; for(let a=0;a<TAU;a+=TAU/12){ g.beginPath(); g.moveTo(Math.cos(a)*15.5,Math.sin(a)*15.5); g.lineTo(Math.cos(a)*23,Math.sin(a)*23); g.stroke(); }
    g.fillStyle=SBC.outline; g.beginPath(); g.arc(0,0,15.6,0,TAU); g.fill();
    g.fillStyle='#3a86c8'; g.beginPath(); g.arc(0,0,14,0,TAU); g.fill(); g.fillStyle='#5aaee0'; g.beginPath(); g.arc(-2,-2,10,0,TAU); g.fill();
    g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=1.6; g.lineCap='round'; g.beginPath(); g.arc(-3,-3,6,3.6,4.6); g.stroke();
    for(const sx of [-1,1]){ g.fillStyle='#8a5e3c'; g.beginPath(); sbRRect(g,sx*22-4,-6,8,12,2); g.fill(); sbOutlineStroke(g,1.3); }
    g.fillStyle='#a8744a'; g.beginPath(); sbRRect(g,-26,-3,52,6,2.5); g.fill(); sbOutlineStroke(g,1.4); g.fillStyle='#c89262'; g.fillRect(-24,-2.4,48,1.6);
  }); },
  torch(lit){ return sbSprite('torch'+(lit?1:0),34,g=>{
    g.fillStyle='rgba(59,34,51,.28)'; g.beginPath(); g.ellipse(3,3,6,3,0,0,TAU); g.fill();
    g.fillStyle='#6a4a32'; g.beginPath(); sbRRect(g,-2.2,-16,4.4,19,1.5); g.fill(); sbOutlineStroke(g,1.2);
    g.fillStyle='#4a4048'; g.beginPath(); sbRRect(g,-6,-27,12,12,2.5); g.fill(); sbOutlineStroke(g,1.4);
    g.fillStyle=lit?'#ffe08a':'#c8b890'; g.beginPath(); sbRRect(g,-3.6,-24.6,7.2,7.6,1.5); g.fill();
    if(lit){ g.fillStyle='#fff6d0'; g.beginPath(); g.arc(-0.6,-21.6,1.6,0,TAU); g.fill(); }
    g.fillStyle='#3e3640'; g.beginPath(); g.moveTo(-7.5,-26); g.lineTo(0,-32); g.lineTo(7.5,-26); g.closePath(); g.fill(); sbOutlineStroke(g,1.3);
  },0.8); },
  stake(){ return sbSprite('stake',10,g=>{ celBall(g,0,0,8.4,'#8a6a42',['#b89060','#8a6a42','#5e4428']); g.fillStyle='#c8a070'; g.beginPath(); g.arc(-1.2,-1.2,4.4,0,TAU); g.fill(); g.strokeStyle='#8a6a42'; g.lineWidth=0.8; g.beginPath(); g.arc(-1.2,-1.2,2.4,0,TAU); g.stroke(); }); },
  tent(r){ r=Math.round(r); return sbSprite('tent'+r,r+2,g=>{
    const pts=[]; for(let i=0;i<8;i++){ const a=i/8*TAU; pts.push([Math.cos(a)*r,Math.sin(a)*r]); }
    for(let i=0;i<8;i++){ const a=pts[i], b=pts[(i+1)%8], mid=(i+0.5)/8*TAU, lit=-(Math.cos(mid)+Math.sin(mid))/1.42;
      g.fillStyle=lit>0.3?'#e2b884':lit>-0.3?'#c99a66':'#a87a50'; g.beginPath(); g.moveTo(0,0); g.lineTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.closePath(); g.fill(); }
    g.strokeStyle='rgba(90,58,34,.6)'; g.lineWidth=1.2; for(const p of pts){ g.beginPath(); g.moveTo(0,0); g.lineTo(p[0],p[1]); g.stroke(); }
    g.fillStyle='#6a4428'; g.beginPath(); g.arc(0,0,4,0,TAU); g.fill();
  },2); },
  campfire(small){ const r=small?14:22; return sbSprite('fire'+(small?1:0),r+6,g=>{
    for(let a=0;a<TAU;a+=0.7) celBall(g,Math.cos(a)*r,Math.sin(a)*r,4.4,'#a8a29a',['#d0cac2','#a8a29a','#7a746e']);
    g.lineCap='round'; for(const [x0,y0,x1,y1] of [[-r*0.6,-r*0.3,r*0.6,r*0.3],[-r*0.5,r*0.4,r*0.5,-r*0.4]]){ g.strokeStyle=SBC.outline; g.lineWidth=6.4; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); g.strokeStyle='#8a5e3c'; g.lineWidth=4; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); }
  },1.2); },
  stone(k,snow){ k=Math.round((k||1)*10)/10; return sbSprite('stone'+k+(snow?'s':''),24*k+4,g=>{
    celFill(g,(q,dx,dy)=>{ q.moveTo(dx+14*k,dy); q.ellipse(dx,dy,14*k,22*k,0,0,TAU); },'#a8a49c',{r:18*k,tones:['#d2cec6','#a8a49c','#7c7872']});
    celBall(g,-4*k,-6*k,4*k,'#6aaa4a',['#9ad46a','#6aaa4a','#4a8a3e']);
    g.strokeStyle='#ff6a40'; g.lineWidth=1.8; g.lineCap='round'; g.beginPath(); g.moveTo(-4,0); g.lineTo(4,-6); g.lineTo(4,6); g.stroke();
    if(snow){ g.fillStyle='#f4f8fc'; g.beginPath(); g.ellipse(-3*k,-8*k,10*k,12*k,0,0,TAU); g.fill(); g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(-5*k,-11*k,5*k,5*k,0,0,TAU); g.fill(); }
  },1.6); },
  altar(){ return sbSprite('altar',52,g=>{ g.fillStyle='#5e5662'; g.beginPath(); sbRRect(g,-42,-26,84,52,5); g.fill(); g.fillStyle='#7a7280'; g.beginPath(); sbRRect(g,-42,-26,84,40,5); g.fill(); g.fillStyle='#968ea0'; g.fillRect(-38,-23,76,4); },2); },
  brazier(){ return sbSprite('brazier',18,g=>{ celBall(g,0,0,14,'#4a4448',['#6a6268','#4a4448','#2e2a2e']); g.fillStyle='#2a1a14'; g.beginPath(); g.arc(0,0,10.5,0,TAU); g.fill(); },1.6); },
  pillar(broken){ return sbSprite('pillar'+(broken?1:0),34,g=>{ const oct=(k,dx,dy)=>{ for(let i=0;i<8;i++){ const a=i/8*TAU+Math.PI/8; i?g.lineTo(Math.cos(a)*30*k+dx,Math.sin(a)*30*k+dy):g.moveTo(Math.cos(a)*30*k+dx,Math.sin(a)*30*k+dy); } g.closePath(); };
    celFill(g,(q,dx,dy)=>{ for(let i=0;i<8;i++){ const a=i/8*TAU+Math.PI/8; i?q.lineTo(Math.cos(a)*30+dx,Math.sin(a)*30+dy):q.moveTo(Math.cos(a)*30+dx,Math.sin(a)*30+dy); } q.closePath(); },'#6a6278',{r:30,tones:['#8e86a0','#6a6278','#48405a']});
    g.fillStyle=broken?'#4a4256':'#7a7290'; g.beginPath(); oct(0.76,0,0); g.fill(); },2); },
  throne(){ return sbSprite('throne',100,g=>{ g.fillStyle='#4a3e52'; g.beginPath(); g.moveTo(-80,-40); g.lineTo(80,-40); g.lineTo(64,40); g.lineTo(-64,40); g.closePath(); g.fill(); sbOutlineStroke(g,2.4); g.fillStyle='#2e2636'; g.fillRect(-46,-24,92,46); g.strokeStyle='#d8a848'; g.lineWidth=2; g.strokeRect(-46,-24,92,46);
    for(const sx of [-1,1]){ g.fillStyle='#5e5068'; g.beginPath(); g.moveTo(sx*70,-40); g.lineTo(sx*96,-90); g.lineTo(sx*54,-40); g.closePath(); g.fill(); sbOutlineStroke(g,2); } },2.2); },
  arena(gate){ return sbSprite('arena'+(gate?1:0),30,g=>{ if(gate){ g.fillStyle='#7a5636'; g.beginPath(); sbRRect(g,-24,-6,48,12,2); g.fill(); g.strokeStyle='#a87a4a'; g.lineWidth=2; for(let x=-20;x<=20;x+=8){ g.beginPath(); g.moveTo(x,-6); g.lineTo(x,6); g.stroke(); } return; }
    celFill(g,(q,dx,dy)=>{ rrect(q,-25+dx,-15+dy,50,30,4); },'#c2b4a0',{r:16,tones:['#e2d6c4','#c2b4a0','#988a76']}); g.strokeStyle='#988a76'; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,-13); g.lineTo(0,13); g.stroke(); },1.8); },
  ward(){ return sbSprite('ward',38,g=>{ const hex=(r,dx,dy,q)=>{ for(let i=0;i<6;i++){ const a=i/6*TAU+Math.PI/6; i?q.lineTo(Math.cos(a)*r+dx,Math.sin(a)*r+dy):q.moveTo(Math.cos(a)*r+dx,Math.sin(a)*r+dy); } q.closePath(); };
    celFill(g,(q,dx,dy)=>hex(34,dx,dy,q),'#aaa49c',{r:34,tones:['#d4cec6','#aaa49c','#7a746e']});
    g.fillStyle='#7a746e'; g.beginPath(); hex(22,0,0,g); g.fill(); g.fillStyle='#8e8880'; g.beginPath(); hex(20,-1.5,-1.5,g); g.fill();
    g.fillStyle=SBC.outline; g.beginPath(); g.arc(0,0,12.4,0,TAU); g.fill(); g.fillStyle='#2a1c1e'; g.beginPath(); g.arc(0,0,11,0,TAU); g.fill(); },2); },
  lantern(lit){ return sbSprite('lantern'+(lit?1:0),18,g=>{
    g.fillStyle='#6a4a32'; g.fillRect(-1.5,-1.5,3,14);
    celFill(g,(q,dx,dy)=>{ q.moveTo(9+dx,dy); q.ellipse(dx,dy,9,10,0,0,TAU); },lit?'#ffb54a':'#e8d4b0',{r:9,tones:lit?['#ffe08a','#ffb54a','#e07a2e']:['#fff2d8','#e8d4b0','#c4a880']});
    g.strokeStyle=lit?'rgba(170,60,20,.7)':'rgba(140,100,60,.6)'; g.lineWidth=1; for(const dx of [-5,0,5]){ g.beginPath(); g.ellipse(dx*0.4,0,Math.abs(dx)*0.9+1.5,10,0,0,TAU); g.stroke(); }
    g.fillStyle='#8a2e22'; g.beginPath(); sbRRect(g,-5,-11.5,10,3.5,1); g.fill(); g.beginPath(); sbRRect(g,-4,8.6,8,3,1); g.fill();
  },1.4); },
  bigoak(){ return sbSprite('bigoak_roots',42,g=>{
    for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; g.fillStyle='#8a5e3c'; g.beginPath(); g.moveTo(Math.cos(a-0.25)*14,Math.sin(a-0.25)*14); g.quadraticCurveTo(Math.cos(a)*30,Math.sin(a)*30,Math.cos(a)*40,Math.sin(a)*40); g.quadraticCurveTo(Math.cos(a)*26,Math.sin(a)*26,Math.cos(a+0.25)*14,Math.sin(a+0.25)*14); g.fill(); }
    celBall(g,0,0,21,'#8a5e3c',['#b0805a','#8a5e3c','#5e3e28']);
  },2.2); },
  stall(col,goods){ return sbSprite('stall'+col+goods,26,g=>{
    g.fillStyle='#8a5e3c'; g.beginPath(); sbRRect(g,-20,5,40,9,2); g.fill(); sbOutlineStroke(g,1.4);
    for(let i=0;i<4;i++){ celBall(g,-14+i*9,9.6,2.8,goods,[sbTone(goods,0.35),goods,sbTone(goods,-0.3)]); }
    g.save(); g.beginPath(); sbRRect(g,-22,-14,44,21,4); g.clip(); for(let i=0;i<5;i++){ g.fillStyle=i%2?'#fff4dc':col; g.fillRect(-22+i*8.8,-14,8.8,21); } g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(-22,-14,44,4); g.fillStyle='rgba(59,34,51,.18)'; g.fillRect(-22,3,44,4); g.restore();
    g.beginPath(); sbRRect(g,-22,-14,44,21,4); sbOutlineStroke(g,1.6);
    g.fillStyle=col; for(let i=0;i<5;i++){ g.beginPath(); g.arc(-17.6+i*8.8,7,4.4,0,Math.PI); g.fill(); }
  },1.4); },
  post(){ return sbSprite('post',10,g=>{ celBall(g,0,0,8,'#8a6a42',['#b89060','#8a6a42','#5e4428']); celBall(g,3,2,2.8,'#6aaa4a',['#9ad46a','#6aaa4a','#4a8a3e']); }); },
  hut(r){ r=Math.round(r); return sbSprite('hut'+r,r+8,g=>{
    celFill(g,(q,dx,dy)=>{ q.moveTo(dx+r+4,dy); q.arc(dx,dy,r+4,0,TAU); },'#c4a660',{r:r,tones:['#e2c67c','#c4a660','#94783e']});
    g.strokeStyle='rgba(110,82,40,.55)'; g.lineWidth=1.3; for(let i=0;i<32;i++){ const a=i/32*TAU; g.beginPath(); g.moveTo(Math.cos(a)*7,Math.sin(a)*7); g.lineTo(Math.cos(a+0.06)*(r+3),Math.sin(a+0.06)*(r+3)); g.stroke(); }
    g.fillStyle='#6a5030'; g.beginPath(); g.arc(0,0,7,0,TAU); g.fill();
    g.fillStyle='#5a3a22'; g.beginPath(); sbRRect(g,-9,r-2,18,10,2); g.fill(); sbOutlineStroke(g,1.4);
  },2); },
  cauldron(){ return sbSprite('cauldron',20,g=>{ celBall(g,0,0,16,'#3a3640',['#5e5868','#3a3640','#22202a']); g.fillStyle='#22202a'; g.beginPath(); g.arc(0,0,12.6,0,TAU); g.fill(); g.fillStyle='#7ac850'; g.beginPath(); g.arc(0,0,11.4,0,TAU); g.fill(); g.fillStyle='#b8e870'; g.beginPath(); g.arc(-2,-2,7,0,TAU); g.fill(); },1.6); },
  ore(taken){ return sbSprite('ore'+(taken?1:0),22,g=>{
    celFill(g,(q,dx,dy)=>{ q.moveTo(dx+18,dy+2); q.ellipse(dx,dy+2,18,14,0,0,TAU); },'#6e6874',{r:16,tones:['#948e9a','#6e6874','#4a4450']});
    if(!taken){ const sh=[[-8,-2,0.4],[4,-6,-0.3],[8,4,0.9],[-4,6,2.2],[0,0,-1.2]];
      for(const [x,y,a] of sh){ g.save(); g.translate(x,y); g.rotate(a); g.fillStyle='#3a7ad8'; g.beginPath(); g.moveTo(0,-3.8); g.lineTo(12,0); g.lineTo(0,3.8); g.closePath(); g.fill(); g.fillStyle='#bfe2ff'; g.beginPath(); g.moveTo(0,-3.8); g.lineTo(12,0); g.lineTo(0,0); g.closePath(); g.fill(); g.strokeStyle=SBC.outline; g.lineWidth=1; g.beginPath(); g.moveTo(0,-3.8); g.lineTo(12,0); g.lineTo(0,3.8); g.closePath(); g.stroke(); g.restore(); } }
    else{ g.fillStyle='#4a4450'; g.beginPath(); g.arc(-3,0,6,0,TAU); g.arc(5,3,4,0,TAU); g.fill(); }
  },1.6); },
  shrine(on){ return sbSprite('shrine'+(on?1:0),22,g=>{
    g.fillStyle='#8a8494'; g.beginPath(); sbRRect(g,-18,-18,36,36,4); g.fill();
    const tri=(a,b,c,col)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(c[0],c[1]); g.closePath(); g.fill(); };
    tri([-14,-14],[14,-14],[0,0],'#c4bed0'); tri([14,-14],[14,14],[0,0],'#9a94a8'); tri([14,14],[-14,14],[0,0],'#7a7488'); tri([-14,14],[-14,-14],[0,0],'#aea8bc');
    g.strokeStyle='rgba(59,34,51,.4)'; g.lineWidth=1; g.beginPath(); g.moveTo(-14,-14); g.lineTo(14,14); g.moveTo(14,-14); g.lineTo(-14,14); g.stroke();
    g.strokeStyle=on?'#ffcf5a':'#a8c8e0'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-6,0); g.quadraticCurveTo(0,-7,6,0); g.quadraticCurveTo(0,7,-6,0); g.stroke();
  },1.8); }
};
// a struct sprite at x,y; a rotated one is turned once per angle and kept, so every frame is a plain blit
function sbPut(sp,x,y,rot){
  if(!rot){ drawSprite(sp,x,y,1,0); return; }
  const k=Math.round(((rot%TAU)+TAU)%TAU*40); let m=sp._rot; if(!m) m=sp._rot=new Map();
  let c=m.get(k);
  if(!c){ const a=k/40, S=Math.ceil(sp.width*1.42), q=mkCanvas(S,S), g=q.getContext('2d'); g.translate(S/2,S/2); g.rotate(a); g.drawImage(sp,-sp.width/2,-sp.height/2); q.half=sp.half*S/sp.width; c=q; if(m.size<160) m.set(k,c); }
  drawSprite(c,x,y,1,0);
}
// the Storybook drawer for a struct; returns false for kinds it leaves to the old code
function lookStruct(s,t){
  switch(s.k){
    case 'well': sbPut(SB_STRUCT.well(),s.x,s.y); return true;
    case 'torch':{ const nt=G&&isNight(); sbPut(SB_STRUCT.torch(nt),s.x,s.y); if(nt){ glowAt(s.x,s.y-20,26,'255,200,110',0.45); if(Math.random()<0.15) emit(s.x,s.y-22,1,{kind:'fire',ang:-Math.PI/2,spread:0.3,smin:8,smax:20,lmin:.2,lmax:.4,zmin:1.5,zmax:2.5,grow:2,drag:1}); } return true; }
    case 'stake': sbPut(SB_STRUCT.stake(),s.x,s.y); return true;
    case 'tent': sbPut(SB_STRUCT.tent(s.r),s.x,s.y,s.a); return true;
    case 'campfire':{ const r=s.small?14:22; sbPut(SB_STRUCT.campfire(s.small),s.x,s.y); glowAt(s.x,s.y,r*1.1,'255,180,80',0.85); glowAt(s.x,s.y,r*0.45,'255,240,190',0.9); if(Math.random()<0.5) emit(s.x+rand(-5,5),s.y+rand(-5,5),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:5,drag:1}); return true; }
    case 'stone': sbPut(SB_STRUCT.stone(s.s,s.snow),s.x,s.y,s.a); return true;
    case 'altar': sbPut(SB_STRUCT.altar(),s.x,s.y); ctx.strokeStyle=`rgba(255,110,50,${0.6+0.3*Math.sin(t*2)})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(s.x-26,s.y); ctx.quadraticCurveTo(s.x,s.y-18,s.x+26,s.y); ctx.quadraticCurveTo(s.x,s.y+18,s.x-26,s.y); ctx.stroke(); ctx.beginPath(); ctx.ellipse(s.x,s.y,3,9,0,0,TAU); ctx.stroke(); return true;
    case 'brazier': sbPut(SB_STRUCT.brazier(),s.x,s.y); glowAt(s.x,s.y,13,'255,170,70',0.9); glowAt(s.x,s.y,6,'255,240,190',0.9); if(Math.random()<0.6) emit(s.x+rand(-4,4),s.y+rand(-4,4),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:15,smax:50,lmin:.4,lmax:.7,zmin:3,zmax:6,grow:4,drag:1}); return true;
    case 'pillar': sbPut(SB_STRUCT.pillar(s.broken),s.x,s.y); ctx.strokeStyle=`rgba(255,140,60,${0.45+0.25*Math.sin(t*2+s.x)})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(s.x,s.y,18,0,TAU); ctx.stroke(); return true;
    case 'throne': sbPut(SB_STRUCT.throne(),s.x,s.y); return true;
    case 'arena': if(s.gate&&!(G&&G.mode==='normal')) return true; sbPut(SB_STRUCT.arena(s.gate),s.x,s.y,s.a+Math.PI/2); return true;
    case 'ward':{
      const lit=G&&G.wards&&G.wards[s.id], heat=G&&G.wardHeat?G.wardHeat[s.id]||0:0;
      sbPut(SB_STRUCT.ward(),s.x,s.y);
      ctx.save(); ctx.translate(s.x,s.y);
      const rc=lit?`rgba(255,${190+Math.sin(t*3)*30|0},90,.98)`:heat>0?`rgba(255,${120+heat*80|0},60,${0.5+heat*0.5})`:`rgba(150,200,240,${0.55+0.2*Math.sin(t*1.5+s.x)})`;
      ctx.strokeStyle=rc; ctx.lineWidth=2.4; ctx.lineCap='round';
      for(let i=0;i<6;i++){ const a=i/6*TAU; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(26,-4); ctx.lineTo(29,0); ctx.lineTo(26,4); ctx.moveTo(24,0); ctx.lineTo(30,0); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      if(lit||heat>0){ const k=lit?1:heat; glowAt(s.x,s.y,70*k+10,'255,190,90',0.5*k); glowAt(s.x,s.y,12,'255,242,192',k); glowAt(s.x,s.y,7,'255,150,50',k);
        if(lit&&Math.random()<0.7) emit(s.x+rand(-5,5),s.y+rand(-5,5),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.4,lmax:.8,zmin:3,zmax:7,grow:5,drag:1}); }
      return true; }
    case 'lantern':{
      const lit=s.ref.lit; sbPut(SB_STRUCT.lantern(lit),s.x,s.y);
      if(lit) glowAt(s.x,s.y,34,'255,180,80',0.5+0.1*Math.sin(t*5+s.x));
      else if(G&&G.flags&&G.flags.forge&&!G.flags.lanterns){ ctx.strokeStyle=`rgba(255,220,140,${0.5+0.4*Math.sin(t*4)})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(s.x,s.y,16,0,TAU); ctx.stroke(); }
      return true; }
    case 'bigoak': sbPut(SB_STRUCT.bigoak(),s.x,s.y); bigOakTrunk(s); return true;
    case 'stall': sbPut(SB_STRUCT.stall(s.col,pick2(s,['#e85a48','#f0c040','#6ab04a'])),s.x,s.y,s.a+Math.PI/2); return true;
    case 'post': sbPut(SB_STRUCT.post(),s.x,s.y); return true;
    case 'hut': sbPut(SB_STRUCT.hut(s.r),s.x,s.y); if(Math.random()<0.08) emit(s.x,s.y,1,{alpha:0.35,col:'150,160,140',glow:false,ang:-Math.PI/2+0.3,spread:0.3,smin:12,smax:30,lmin:2,lmax:3,zmin:4,zmax:7,grow:8,drag:0.3}); return true;
    case 'cauldron':{ sbPut(SB_STRUCT.cauldron(),s.x,s.y); ctx.fillStyle='rgba(240,255,200,.85)'; for(let i=0;i<3;i++){ const a=t*1.3+i*2.1; ctx.beginPath(); ctx.arc(s.x+Math.cos(a)*6,s.y+Math.sin(a*1.3)*5,1.5+((t*2+i)%1)*2,0,TAU); ctx.fill(); }
      if(Math.random()<0.2) emit(s.x,s.y,1,{alpha:0.4,col:'190,220,170',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:25,lmin:1.2,lmax:2,zmin:3,zmax:6,grow:7,drag:0.4}); return true; }
    case 'ore':{ const taken=G&&G.ores&&G.ores[s.ref.id]; sbPut(SB_STRUCT.ore(taken),s.x,s.y); if(!taken) glowAt(s.x,s.y,34,'120,180,255',0.35+0.15*Math.sin(t*3+s.x)); return true; }
    case 'shrine':{ const on=G&&G.shrines&&G.shrines[s.ref.id]; sbPut(SB_STRUCT.shrine(on),s.x,s.y); if(on){ glowAt(s.x,s.y,40,'255,170,70',0.4); glowAt(s.x,s.y,8,'255,236,170',0.55+0.2*Math.sin(t*3)); } return true; }
  }
  return false;
}
{ const base=drawStruct; drawStruct=function(s,t){ if(LOOK.sb&&!LOOK.off.structs&&lookStruct(s,t)) return; return base(s,t); }; }

// ================= ground decals and bridges (painted into the chunks): clean shapes with an edge line
function lookDecal(g,dc){
  const rng=mulberry32(Math.floor(dc.x*7+dc.y*13)), O=SBC.outline;
  if(dc.k==='field'){
    g.save(); g.translate(dc.x,dc.y); g.rotate(dc.rot);
    const w=dc.w, h=dc.h;
    g.fillStyle='#b07c4c'; g.beginPath(); sbRRect(g,-w/2,-h/2,w,h,6); g.fill();
    for(let y=-h/2+6;y<h/2;y+=10){ g.strokeStyle='#8a5e38'; g.lineWidth=6; g.beginPath(); g.moveTo(-w/2+5,y+1.5); g.lineTo(w/2-5,y+1.5); g.stroke(); g.strokeStyle=dc.crop; g.lineWidth=5; g.beginPath(); g.moveTo(-w/2+5,y); g.lineTo(w/2-5,y); g.stroke(); g.strokeStyle='rgba(255,255,220,.35)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(-w/2+5,y-1.2); g.lineTo(w/2-5,y-1.2); g.stroke(); }
    g.strokeStyle=O; g.lineWidth=2; g.beginPath(); sbRRect(g,-w/2,-h/2,w,h,6); g.stroke();
    g.strokeStyle='#a87a4a'; g.lineWidth=3; g.beginPath(); sbRRect(g,-w/2-7,-h/2-7,w+14,h+14,4); g.stroke();
    for(let x=-w/2-7;x<=w/2+7;x+=30) for(const y of [-h/2-7,h/2+7]){ g.fillStyle='#8a5e38'; g.beginPath(); g.arc(x,y,3,0,TAU); g.fill(); g.strokeStyle=O; g.lineWidth=1.2; g.stroke(); }
    g.restore(); return true;
  }
  if(dc.k==='dirt'||dc.k==='sand'||dc.k==='mudring'){
    const col=dc.k==='dirt'?[214,176,120]:dc.k==='sand'?[240,218,160]:[150,120,84], c=`rgb(${col})`, e=`rgba(${mixRGB(col,SBC.shadowRGB,0.35).map(Math.round)},.8)`;
    g.fillStyle=c; g.beginPath(); for(let i=0;i<=24;i++){ const a=i/24*TAU, r=dc.r*(0.93+0.07*Math.sin(a*3+dc.x)); i?g.lineTo(dc.x+Math.cos(a)*r,dc.y+Math.sin(a)*r):g.moveTo(dc.x+Math.cos(a)*r,dc.y+Math.sin(a)*r); } g.closePath(); g.fill();
    g.strokeStyle=e; g.lineWidth=2.6; g.stroke();
    for(let i=0;i<Math.round(dc.r/7);i++){ const a=rng()*TAU, r=Math.sqrt(rng())*dc.r*0.85; sbPebble(g,dc.x+Math.cos(a)*r,dc.y+Math.sin(a)*r,1.2+rng()*1.4,dc.k==='mudring'?'#7a5a3a':'#c49a66'); }
    if(dc.k==='sand'){ g.strokeStyle='rgba(180,140,90,.5)'; g.lineWidth=2; g.beginPath(); g.arc(dc.x,dc.y,dc.r*0.55,0,TAU); g.stroke(); }
    if(dc.k==='mudring') for(let i=0;i<14;i++){ const a=i/14*TAU; g.fillStyle='#8a6a48'; g.beginPath(); sbRRect(g,dc.x+Math.cos(a)*dc.r*0.62-9,dc.y+Math.sin(a)*dc.r*0.62-5,18,10,3); g.fill(); g.strokeStyle='rgba(59,34,51,.5)'; g.lineWidth=1.2; g.stroke(); }
    return true;
  }
  if(dc.k==='flagstone'||dc.k==='paving'){
    g.save();
    const round=dc.k==='flagstone', x0=dc.x-(dc.r||dc.w/2), y0=dc.y-(dc.r||dc.h/2), x1=dc.x+(dc.r||dc.w/2), y1=dc.y+(dc.r||dc.h/2);
    if(round){ g.beginPath(); g.arc(dc.x,dc.y,dc.r,0,TAU); g.clip(); }
    g.fillStyle='#a49686'; g.fillRect(x0,y0,x1-x0,y1-y0);
    for(let y=y0;y<y1;y+=26) for(let x=x0+((y/26)|0)%2*14;x<x1;x+=28){ const v=rng(), c=mixRGB([226,214,192],[204,190,168],v);
      g.fillStyle=`rgb(${mixRGB(c,SBC.shadowRGB,0.2).map(Math.round)})`; g.beginPath(); sbRRect(g,x+2,y+2.5,24,22,5); g.fill();
      g.fillStyle=`rgb(${c.map(Math.round)})`; g.beginPath(); sbRRect(g,x+1.5,y+1.5,23.5,20.5,5); g.fill();
      if(v<0.3){ g.fillStyle='rgba(255,252,240,.45)'; g.beginPath(); sbRRect(g,x+4,y+4,9,4,2); g.fill(); } }
    if(dc.snow){ for(let i=0;i<30;i++){ const a=rng()*TAU, r=Math.sqrt(rng())*dc.r, x=dc.x+Math.cos(a)*r, y=dc.y+Math.sin(a)*r; g.fillStyle='rgba(246,250,253,.85)'; g.beginPath(); g.ellipse(x,y,8+rng()*14,5+rng()*8,0,0,TAU); g.fill(); } }
    g.restore();
    if(round){ g.strokeStyle=O; g.lineWidth=3; g.beginPath(); g.arc(dc.x,dc.y,dc.r-1,0,TAU); g.stroke(); g.strokeStyle='rgba(255,250,230,.5)'; g.lineWidth=1.4; g.beginPath(); g.arc(dc.x,dc.y,dc.r-4,0,TAU); g.stroke(); }
    else{ g.strokeStyle=O; g.lineWidth=2.6; g.strokeRect(x0,y0,x1-x0,y1-y0); }
    return true;
  }
  if(dc.k==='pen'){
    g.save(); g.translate(dc.x,dc.y);
    g.fillStyle='#c8a870'; g.beginPath(); sbRRect(g,-dc.w/2,-dc.h/2,dc.w,dc.h,6); g.fill();
    for(let i=0;i<40;i++){ g.fillStyle='rgba(246,250,253,.7)'; g.beginPath(); g.ellipse((rng()-0.5)*dc.w*0.9,(rng()-0.5)*dc.h*0.9,4+rng()*8,3+rng()*5,0,0,TAU); g.fill(); }
    g.strokeStyle=O; g.lineWidth=4.4; g.strokeRect(-dc.w/2,-dc.h/2,dc.w,dc.h); g.strokeStyle='#b08452'; g.lineWidth=2.6; g.strokeRect(-dc.w/2,-dc.h/2,dc.w,dc.h);
    for(let x=-dc.w/2;x<=dc.w/2;x+=24) for(const y of [-dc.h/2,dc.h/2]){ g.fillStyle='#8a5e38'; g.beginPath(); g.arc(x,y,3.2,0,TAU); g.fill(); g.strokeStyle=O; g.lineWidth=1.2; g.stroke(); }
    g.fillStyle='#e8cc78'; g.beginPath(); sbRRect(g,dc.w/2-40,-dc.h/2+10,26,18,3); g.fill(); g.strokeStyle=O; g.lineWidth=1.4; g.stroke();
    g.restore(); return true;
  }
  if(dc.k==='nest'){
    g.fillStyle='#8a6a48'; g.beginPath(); g.arc(dc.x,dc.y,dc.r-6,0,TAU); g.fill();
    g.lineCap='round'; for(let k=0;k<36;k++){ const a=rng()*TAU; g.strokeStyle=k%2?'#c49a62':'#9a7044'; g.lineWidth=3.4; g.beginPath(); g.arc(dc.x,dc.y,dc.r+(rng()-0.5)*14,a,a+0.4+rng()*0.8); g.stroke(); }
    g.strokeStyle=O; g.lineWidth=2.2; g.beginPath(); g.arc(dc.x,dc.y,dc.r+9,0,TAU); g.stroke();
    for(let k=0;k<3;k++) celFill(g,(q,dx,dy)=>{ const ex=dc.x+(k-1)*12+dx, ey=dc.y+((k%2)*8-4)+dy; q.moveTo(ex+5,ey); q.ellipse(ex,ey,5,7,0,0,TAU); },'#f2ead8',{r:6,tones:['#ffffff','#f2ead8','#cfc4ac']});
    return true;
  }
  return false;
}
{ const base=drawDecal; drawDecal=function(g,dc){ if(LOOK.sb&&lookDecal(g,dc)) return; return base(g,dc); }; }
function lookBridge(g,br){
  g.save(); g.translate(br.x,br.y); g.rotate(br.ang);
  const L=br.len/2, w=br.w/2, O=SBC.outline;
  g.fillStyle='rgba(30,40,80,.3)'; g.fillRect(-L+4,-w+7,br.len,br.w);
  if(br.kind==='wood'){
    g.fillStyle=O; g.fillRect(-L-1,-w-1,br.len+2,br.w+2);
    for(let x=-L;x<L;x+=9){ const i=((x/9)|0)%3; g.fillStyle=i===0?'#c08a56':i===1?'#b07a4a':'#c89460'; g.fillRect(x+0.6,-w,8.2,br.w); g.fillStyle='rgba(255,240,210,.3)'; g.fillRect(x+0.6,-w,8.2,2); g.fillStyle='rgba(59,34,51,.25)'; g.fillRect(x+7,-w,1.8,br.w); }
    for(const y of [-w-3,w-2]){ g.fillStyle=O; g.fillRect(-L-1,y-1,br.len+2,7); g.fillStyle='#8a5e38'; g.fillRect(-L,y,br.len,5); g.fillStyle='#a87a4a'; g.fillRect(-L,y,br.len,1.6); }
    for(let x=-L;x<=L;x+=40) for(const y of [-w-5,w-3]){ g.fillStyle='#6a4428'; g.beginPath(); sbRRect(g,x-3.5,y,7,9,2); g.fill(); g.strokeStyle=O; g.lineWidth=1.3; g.stroke(); }
  }else{
    g.fillStyle=O; g.fillRect(-L-1,-w-1,br.len+2,br.w+2);
    g.fillStyle='#bcb2a6'; g.fillRect(-L,-w,br.len,br.w);
    for(let x=-L;x<L;x+=22){ g.fillStyle='#ccc4b8'; g.beginPath(); sbRRect(g,x+1.5,-w+2,19,br.w-4,4); g.fill(); g.fillStyle='rgba(255,250,240,.4)'; g.fillRect(x+3,-w+3,15,2); }
    for(const y of [-w-4,w-2]){ g.fillStyle=O; g.fillRect(-L-1,y-1,br.len+2,8); g.fillStyle='#8a8278'; g.fillRect(-L,y,br.len,6); g.fillStyle='#a8a096'; g.fillRect(-L,y,br.len,1.8); }
  }
  g.restore();
}
{ const base=drawBridge; drawBridge=function(g,br){ if(LOOK.sb){ lookBridge(g,br); return; } return base(g,br); }; }

// ================= atmosphere: drifting cloud shadows, a friendly day, a blue readable night
// a few soft cloud sprites drift over the land in a slowly moving grid of 1150 px cells (about half the cells hold a
// cloud of about 560 by 350 px); only the clouds in view are drawn, so a frame paints a small part of the screen
const SB_CLOUD_CELL=1150;
function lookCloudTex(v){
  if(!LOOK.cloud) LOOK.cloud=[];
  if(LOOK.cloud[v]) return LOOK.cloud[v];
  const S=128, c=mkCanvas(S,S*0.62), g=c.getContext('2d'), rng=mulberry32(4242+v*977);
  for(let k=0;k<7;k++){ const x=S*(0.22+rng()*0.56), y=S*0.62*(0.3+rng()*0.4), r=S*(0.14+rng()*0.1);
    const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(44,40,96,.5)'); gr.addColorStop(0.6,'rgba(44,40,96,.38)'); gr.addColorStop(1,'rgba(44,40,96,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
  LOOK.cloud[v]=c; return c;
}
function lookClouds(t){
  if(LOOK.off.clouds) return;
  const dl=daylight(); if(dl<0.05) return;
  const C=SB_CLOUD_CELL, ox=t*16, oy=t*7, vw=W/zoom, vh=H/zoom, cw=560, chh=350;
  const i0=Math.floor((cam.x-ox-cw)/C), i1=Math.floor((cam.x+vw-ox)/C), j0=Math.floor((cam.y-oy-chh)/C), j1=Math.floor((cam.y+vh-oy)/C);
  ctx.save(); ctx.globalAlpha=0.32*dl*(1-0.6*(G?G.rainK:0)); ctx.imageSmoothingEnabled=true;
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){
    const h=hash2(i*7+3,j*13+5); if(h>0.5) continue;
    const k=0.75+hash2(i,j+91)*0.5, x=ox+i*C+hash2(i+17,j)*(C-cw*0.6), y=oy+j*C+hash2(i,j+29)*(C-chh*0.6), w=cw*k, hh=chh*k;
    if(x>cam.x+vw||y>cam.y+vh||x+w<cam.x||y+hh<cam.y) continue;
    ctx.drawImage(lookCloudTex(Math.floor(h*7)%3),x,y,w,hh);
  }
  ctx.restore();
}
{ const base=ambientTint; ambientTint=function(){
  const c0=base(); if(!LOOK.sb||!G||AREA) return c0;
  const t=G.tod, d=daylight();
  let c=mixRGB([116,138,216],[255,255,255],d);
  const w=clamp(1-Math.min(Math.abs(t-0.25),Math.abs(t-0.75))/0.07,0,1); c=mixRGB(c,[255,196,156],w*0.45);
  const rk=G.rainK*(player&&player.y>WALL_Y?1:0); c=mixRGB(c,[172,182,204],rk*0.38);
  // a map's own sky tint (the base handles it for maps 1 and up) still applies
  const k=curMap(); const s=k&&MAPS[k]&&MAPS[k].sky; if(s&&s.tint){ if(!s._t) s._t=hexRGB(s.tint); c=mixRGB(c,s._t,s.k!=null?s.k:0.2); }
  return c;
}; }
// the night darkness: bluer and lighter in this look (called by drawLights in a11_render.js)
function lookDark(dk,inA){ return dk*(inA?(AREA.kind==='cave'?0.66:0.85):0.84); }
// its colour: a deep blue night outdoors, a warm plum dark in houses and caves
function lookDarkCol(inA){ return inA?(AREA.kind==='cave'?'22,12,30':'30,16,34'):'16,20,62'; }

// ================= interiors and caves: the baked room and the cave canvas get a brighter, warmer pass
function lookRoom(cv){ gradeCanvas(cv,{sat:1.14,warm:0.22,lift:0.02}); }
// the cave canvas is graded into a copy (the original stays for Classic); a new canvas (a rebuilt cave) is graded again
function lookCave(A){
  const src=A.canvas; let c=LOOK.graded.get(src); if(c) return c;
  c=mkCanvas(src.width,src.height); c.getContext('2d').drawImage(src,0,0);
  const th=A.def&&A.def.theme, warm=th==='ice'||th==='crystal'||th==='tide'?0:0.3;
  gradeCanvas(c,{sat:1.28,gamma:0.8,lift:0.035,warm});
  LOOK.graded.set(src,c); return c;
}
// chests: a chunky outlined chest, cached, with the soft glow on top while closed
function lookChest(c,t){
  const sp=sbSprite('chest'+(c.open?1:0),18,g=>{
    g.fillStyle='rgba(59,34,51,.3)'; g.beginPath(); sbRRect(g,-13,-5,30,18,3); g.fill();
    celFill(g,(q,dx,dy)=>rrect(q,-15+dx,-10+dy,30,20,3),'#b0703a',{r:12,tones:['#d89a5a','#b0703a','#7a4a26']});
    g.fillStyle='#ffcf5a'; g.fillRect(-15,-10,30,3); g.fillRect(-15,7,30,3); g.fillRect(-2.5,-10,5,20);
    g.fillStyle='#fff0a8'; g.fillRect(-15,-10,30,1.2);
    if(c.open){ g.fillStyle='#3b2233'; g.beginPath(); sbRRect(g,-12,-7,24,13,2); g.fill(); g.fillStyle='#ffcf5a'; g.beginPath(); g.arc(-4,0,2,0,TAU); g.arc(3,1,2.4,0,TAU); g.fill(); }
    else{ g.fillStyle='#3b2233'; g.beginPath(); sbRRect(g,-3.4,-3,6.8,6,1.5); g.fill(); g.fillStyle='#ffe066'; g.fillRect(-1,-1.6,2,3); }
  },1.6);
  drawSprite(sp,c.x,c.y,1,0);
  if(!c.open) glowAt(c.x,c.y,30,'255,210,120',0.25+0.2*Math.sin(t*3+c.x));
}
{ const base=drawChest; drawChest=function(c,t){ if(LOOK.sb){ lookChest(c,t); return; } return base(c,t); }; }

// ================= HUD pieces drawn on the canvas (a11b_hud.js and a11_render.js call these in this look)
// a chunky plum panel with a cream rim, a plum edge and a little drop under it (screen px, ctx in screen space);
// panels and pills are painted once per size into a small canvas and blitted
const SBPN=new Map();
function sbHudSpr(kind,w,h,r,draw){
  w=Math.round(w); h=Math.round(h); const key=kind+w+'x'+h+'x'+r+'x'+DPR; let c=SBPN.get(key);
  if(!c){ if(SBPN.size>80) SBPN.clear(); const P=4; c=mkCanvas((w+P*2)*DPR,(h+P*2+4)*DPR); const g=c.getContext('2d'); g.scale(DPR,DPR); g.translate(P,P); draw(g,w,h,r); c.P=P; c.w0=w; c.h0=h; SBPN.set(key,c); }
  return c;
}
function sbPanel(x,y,w,h,r){
  const c=sbHudSpr('p',w,h,r,(g,w,h,r)=>{
    g.fillStyle='rgba(59,34,51,.5)'; rrect(g,0,3,w,h,r); g.fill();
    g.fillStyle='rgba(59,34,51,.84)'; rrect(g,0,0,w,h,r); g.fill();
    g.lineWidth=3.2; g.strokeStyle=SBC.outline; g.stroke();
    g.lineWidth=1.6; g.strokeStyle='rgba(255,243,214,.9)'; rrect(g,2.4,2.4,w-4.8,h-4.8,Math.max(2,r-2.4)); g.stroke();
  });
  ctx.drawImage(c,x-c.P,y-c.P,c.w0+c.P*2,c.h0+c.P*2+4);
}
// the weapon bar's panel (a6b_weapons.js) matches the vitals panel
{ const base=wPanel; wPanel=function(x,y,w,h){ if(LOOK.sb) return sbPanel(x,y,w,h,13); return base(x,y,w,h); }; }
// a parchment pill (the use prompt)
function sbPill(x,y,w,h){
  const c=sbHudSpr('l',w,h,0,(g,w,h)=>{
    g.fillStyle=SBC.outline; rrect(g,0,3,w,h,h/2); g.fill();
    g.fillStyle='#fff3d6'; rrect(g,0,0,w,h,h/2); g.fill(); g.lineWidth=2.6; g.strokeStyle=SBC.outline; g.stroke();
    g.fillStyle='rgba(255,255,255,.6)'; rrect(g,h*0.4,3,w-h*0.8,4,2); g.fill();
  });
  ctx.drawImage(c,x-c.P,y-c.P,c.w0+c.P*2,c.h0+c.P*2+4);
}
// a ribbon banner behind a title, centred on cx,cy: a red band with folded tails
function sbRibbon(cx,cy,w,h,col){
  col=col||'#d8503a'; const x0=cx-w/2, x1=cx+w/2, y0=cy-h/2, y1=cy+h/2, t=h*0.55, dk=sbTone(col,-0.35);
  ctx.save(); ctx.lineJoin='round'; ctx.lineWidth=3; ctx.strokeStyle=SBC.outline;
  for(const s of [-1,1]){ const xe=s<0?x0:x1, xo=xe+s*t*1.3; ctx.fillStyle=dk; ctx.beginPath(); ctx.moveTo(xe-s*6,y0+h*0.28); ctx.lineTo(xo,y0+h*0.28); ctx.lineTo(xo-s*t*0.45,cy+h*0.14); ctx.lineTo(xo,y1+h*0.28); ctx.lineTo(xe-s*6,y1+h*0.28); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo(cx,y0-h*0.16,x1,y0); ctx.lineTo(x1,y1); ctx.quadraticCurveTo(cx,y1-h*0.16,x0,y1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(255,236,200,.55)'; ctx.lineWidth=1.6; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(x0+6,y0+5); ctx.quadraticCurveTo(cx,y0-h*0.16+5,x1-6,y0+5); ctx.moveTo(x0+6,y1-5); ctx.quadraticCurveTo(cx,y1-h*0.16-5,x1-6,y1-5); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
// a bar with a plum outline and a glossy stripe
function sbBar(x,y,w,h,f,col,bg){
  if(bg){ ctx.fillStyle=SBC.outline; rr(x-1.6,y-1.6,w+3.2,h+3.2,(h+3.2)/2); ctx.fill(); ctx.fillStyle=bg; rr(x,y,w,h,h/2); ctx.fill(); }
  if(f>0){ const fw=Math.max(h,w*clamp(f,0,1)); ctx.fillStyle=col; rr(x,y,fw,h,h/2); ctx.fill();
    if(h>=5){ ctx.fillStyle='rgba(255,255,255,.38)'; rr(x+h*0.35,y+h*0.16,Math.max(0,fw-h*0.7),Math.max(1.2,h*0.26),h*0.13); ctx.fill(); } }
}

// ================= the dialogue portrait: the face is drawn on its own layer, outlined, and set on a sunny backdrop
const SB_PBG={vor:['#ffcf9a','#c84a3a'],voice:['#ffcf9a','#c84a3a'],morrow:['#e8c8f0','#7a4a9a'],brood:['#ffc8d8','#b04a6a'],griz:['#f6e0a0','#b88a3a'],gloam:['#d8f0b0','#5a8a3a'],cinder:['#f0d0b0','#8a5a3a'],wren:['#d8e4ff','#5a6aa8'],moss:['#e0f0c0','#6a9a4a'],ash:['#ffe2b0','#e8763a'],pip:['#ffe8b8','#f08a3a']};
function lookPortraitCv(){ return LOOK.pcv||(LOOK.pcv=mkCanvas(176,176)); }
function lookPortraitFinish(who,face){
  const c=$('#portrait'), g=c.getContext('2d'), S=176, P=SB_PBG[who]||['#fff3d6','#f2b878'];
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,S,S);
  const gr=g.createRadialGradient(S/2,S*0.4,8,S/2,S*0.5,S*0.78); gr.addColorStop(0,P[0]); gr.addColorStop(1,P[1]); g.fillStyle=gr; g.fillRect(0,0,S,S);
  g.fillStyle='rgba(255,255,255,.22)'; for(let i=0;i<6;i++){ const a=i/6*TAU+0.3; g.beginPath(); g.moveTo(S/2,S*0.46); g.arc(S/2,S*0.46,S,a,a+0.3); g.closePath(); g.fill(); }
  g.drawImage(outlineSprite(face,SBC.outline,2.8,{scale:1,force:true}),0,0);
}

// ================= the map screen: unexplored land is blank parchment instead of dark (the fog canvas that
// drawMapScreen fills is wrapped so its pixels take the parchment colour; the explored map shows through as before)
{ const base=fogCanvas; fogCanvas=function(k){
  const c=base(k); if(c._sbp) return c; c._sbp=true;
  const g=c.getContext('2d'), put=g.putImageData.bind(g);
  g.putImageData=function(img,x,y){ if(LOOK.sb){ const d=img.data; for(let i=0;i<d.length;i+=4) if(d[i+3]){ d[i]=232; d[i+1]=212; d[i+2]=168; } } return put(img,x,y); };
  return c;
}; }

// ================= debug: the cost of each live Storybook pass next to the Classic one (best of 9 runs, real clock)
function lookBench(n){
  n=n||20; const now=window.__realNow||(()=>performance.now()), r={}, sb0=LOOK.sb, t=G?G.time:0;
  // canvas drawing is deferred: a 1 px readback makes the browser really paint before the clock stops
  const flush=()=>{ try{ ctx.getImageData(0,0,1,1); }catch(e){} };
  const tm=(f,k)=>{ let best=1e9; flush(); for(let rep=0;rep<9;rep++){ const t0=now(); for(let i=0;i<k;i++) f(); flush(); best=Math.min(best,(now()-t0)/k); } return +best.toFixed(3); };
  const world=()=>ctx.setTransform(DPR*zoom,0,0,DPR*zoom,-cam.x*zoom*DPR,-cam.y*zoom*DPR);
  const vis=[]; for(let cx=Math.floor(cam.x/CH);cx<=Math.floor((cam.x+W/zoom)/CH);cx++) for(let cy=Math.floor(cam.y/CH);cy<=Math.floor((cam.y+H/zoom)/CH);cy++) vis.push([cx,cy]);
  ctx.save(); world();
  r.clouds=tm(()=>lookClouds(t),n);
  r.foam=tm(()=>lookFoam(vis,t),n);
  const sts=STRUCTS.filter(s=>s.k!=='wall'&&inView(s.x,s.y,100)&&!['house','forge','library','cavemouth','column','glowshroom'].includes(s.k));
  r.structs_n=sts.length;
  LOOK.sb=true; r.structs_sb=tm(()=>{ for(const s of sts) drawStruct(s,t); },n);
  LOOK.off.structs=true; r.structs_classic=tm(()=>{ for(const s of sts) drawStruct(s,t); },n); LOOK.off.structs=false;
  LOOK.sb=true; T3.ol=true; r.figs40_sb=tm(()=>t3Bench(40),3); T3.ol=false; r.figs40_sb_no_outline=tm(()=>t3Bench(40),3); T3.ol=true;
  LOOK.sb=false; r.figs40_classic=tm(()=>t3Bench(40),3);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  LOOK.sb=true; r.hud_sb=tm(()=>drawHUD(),n); LOOK.sb=false; r.hud_classic=tm(()=>drawHUD(),n);
  LOOK.sb=sb0; ctx.restore();
  r.render=tm(()=>render(),3);
  return r;
}
// debug: one whole frame, painted for real (best of 9)
function lookRenderBench(n){ const now=window.__realNow||(()=>performance.now()), fl=()=>{ try{ ctx.getImageData(0,0,1,1); }catch(e){} }; let best=1e9; fl(); for(let r=0;r<9;r++){ const t0=now(); for(let i=0;i<(n||3);i++) render(); fl(); best=Math.min(best,(now()-t0)/(n||3)); } return +best.toFixed(2); }

window.__ebX=Object.assign(window.__ebX||{},{setLook,getLook:()=>LOOK.sb?'storybook':'classic',LOOK,outlineSprite,celFill,celBall,celTones,sbTone,gradeCanvas,lookRebuild,sbSprite,lookBench,lookRenderBench});
