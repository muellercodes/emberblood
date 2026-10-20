
// ================= v9 multi-map engine (wave 1): maps, bounds, per-map fog and overview, towns, crossings, saves
// Map k is a y band: x in [0,w], y in [k*BAND, k*BAND+h]. Embermere is map 0 and keeps its own terrain code in
// a2_world.js; maps 1 and up are sampled by e2_terrain.js from the `terrain` data of their definition.
// Interiors, caves and dungeons stay at x >= IZX-50 and belong to no map. Everything uses ABSOLUTE coordinates.
// See scratchpad/MAPS.md for the API with examples and a step by step guide for building a map.
const BAND=20000;
const MAPS=[];
// runtime state: the map Ash was on last frame, debug switches
const MAPST={cur:0,debug:false,built:false,frame:0};
MAPS[0]={k:0,id:'embermere',name:'Embermere',y0:0,w:14000,h:11000,ov:OV,builtin:true,music:'meadow',ambient:{}};
OV.y0=0; OV.k=0;
// defineMap(k,def): def {id,name,w,h,terrain:{...},ambient:{...},music,sky?,onEnter?(fromK),build?(B),crossings?:[...],
//   spawn?:{x,y},chests?:n,placeholder?}. A later call replaces the whole definition (its overview and fog stay).
// Map 0 (Embermere) only takes the non-terrain fields (name, ambient, music, sky, onEnter, build, crossings).
function defineMap(k,def){
  def=def||{};
  if(k===0){ const M=MAPS[0]; for(const f of ['name','ambient','music','sky','onEnter','build','crossings','spawn']) if(def[f]!==undefined) M[f]=def[f]; return M; }
  const old=MAPS[k]||{};
  const M=Object.assign({ambient:{},music:'meadow',w:14000,h:11000},def,{k,y0:k*BAND,ov:old.ov||null,fogBits:old.fogBits||null,fogV:null,tz:null,fit:null});
  if(old.ov&&(old.ov.w!==Math.ceil(M.w/25)||old.ov.h!==Math.ceil(M.h/25))) M.ov=null;
  if(old.fogBits&&(old.fw!==Math.ceil(M.w/100)||old.fh!==Math.ceil(M.h/100))) M.fogBits=null; else { M.fw=old.fw; M.fh=old.fh; }
  MAPS[k]=M;
  for(let i=0;i<k;i++) if(!MAPS[i]) MAPS[i]=null;
  return M;
}
// ---------- bounds
// the map index for an outdoor y: the band it is in, and in a gap the nearer of the two maps
function mapAt(y){ const k=Math.floor((y+4500)/BAND); return k>0?(k<MAPS.length?k:MAPS.length-1):0; }
function mapOfY(y){ return MAPS[mapAt(y)]||MAPS[0]; }
// the map of a world object (-1 for anything inside an area)
function itemMap(o){ return o.x>=IZX-50?-1:typeof o.y==='number'?mapAt(o.y):0; }
// the map Ash is on (inside an area: the map of the door he came in by)
function curMap(){
  if(!player) return 0;
  if(AREA||player.x>=IZX-50){ const o=G&&G.ow; return o?mapAt(o.y):MAPST.cur; }
  return mapAt(player.y);
}
// true within m px of the edge of the map, outside it, or in a gap between maps (m may be negative)
function outOfMap(x,y,m){ const M=MAPS[mapAt(y)]; return !M||x<m||y<M.y0+m||x>M.w-m||y>M.y0+M.h-m; }
// clamp a point into its map with a margin m; refY picks the map (for example the y of the thrower)
function clampMap(x,y,m,refY){ const M=MAPS[mapAt(refY==null?y:refY)]||MAPS[0]; return [x<m?m:x>M.w-m?M.w-m:x,y<M.y0+m?M.y0+m:y>M.y0+M.h-m?M.y0+M.h-m:y]; }
// ---------- per-map views of the global arrays, so loops can skip other maps cheaply
// mapList(arr,k) returns the items of arr on map k (rebuilt when the array grows, shrinks or its last item changes)
const ML=new Map(), ML_EMPTY=[];
function mapList(arr,k){
  let c=ML.get(arr); const n=arr.length;
  if(!c||c.n!==n||c.last!==arr[n-1]){
    c={n,last:arr[n-1],l:[]};
    for(let i=0;i<n;i++){ const o=arr[i], m=itemMap(o); if(m<0) continue; (c.l[m]||(c.l[m]=[])).push(o); }
    ML.set(arr,c);
  }
  return c.l[k]||ML_EMPTY;
}
function mapListsReset(){ ML.clear(); }

// ---------- fog of war per map (map 0 keeps FOG from a4_ground.js; other maps get their own grid of 100 px cells)
const FOGV0={bits:null,w:FOG.w,h:FOG.h,cs:FOG.cs,y0:0};
function fogOf(k){
  if(!k){ FOGV0.bits=FOG.bits; return FOGV0; }
  const M=MAPS[k]; if(!M) return null;
  if(!M.fogBits){ M.fw=Math.ceil(M.w/100); M.fh=Math.ceil(M.h/100); M.fogBits=new Uint8Array(M.fw*M.fh); M.fogV=null; }
  if(!M.fogV) M.fogV={bits:M.fogBits,w:M.fw,h:M.fh,cs:100,y0:M.y0};
  return M.fogV;
}
function fogSeen(k,x,y){ const F=fogOf(k); if(!F||!F.bits) return 0; return F.bits[clamp(Math.floor((y-F.y0)/F.cs),0,F.h-1)*F.w+clamp(Math.floor(x/F.cs),0,F.w-1)]; }
// saves: 8 cells to a byte, then runs of equal bytes as (count,byte) pairs when that is shorter ('r64:'), else the
// bytes as they are ('b64:'), in base64. Old saves hold a '0'/'1' string for map 0, which still loads.
function fogPack(bits){
  const n=(bits.length+7)>>3, b=new Uint8Array(n); for(let i=0;i<bits.length;i++) if(bits[i]) b[i>>3]|=1<<(i&7);
  const r=[]; for(let i=0;i<n;){ const v=b[i]; let j=i+1; while(j<n&&b[j]===v&&j-i<255) j++; r.push(j-i,v); i=j; }
  const L=r.length<n?r:b; let s=''; for(let i=0;i<L.length;i++) s+=String.fromCharCode(L[i]);
  return (L===r?'r64:':'b64:')+btoa(s);
}
function fogUnpack(str,bits){
  str=String(str); let s=''; try{ s=atob(str.slice(4)); }catch(e){ s=''; }
  if(str.startsWith('r64:')){ let o=''; for(let i=0;i+1<s.length;i+=2) o+=s[i+1].repeat(s.charCodeAt(i)); s=o; }
  for(let i=0;i<bits.length;i++) bits[i]=((s.charCodeAt(i>>3)||0)>>(i&7))&1;
}
const fogPacked=s=>typeof s==='string'&&(s.startsWith('b64:')||s.startsWith('r64:'));
{ const base=fogInit; fogInit=function(str){
  for(const M of MAPS) if(M&&M.k>0&&M.fogBits) M.fogBits.fill(0);
  if(fogPacked(str)){ base(''); fogUnpack(str,FOG.bits); } else base(str);
}; }
{ const base=fogReveal; fogReveal=function(x,y,r){
  if(x>=IZX-50) return;
  const k=mapAt(y); if(!k) return base(x,y,r);
  const F=fogOf(k); if(!F) return; const ly=y-F.y0, cs=F.cs;
  const c0=Math.max(0,Math.floor((x-r)/cs)), c1=Math.min(F.w-1,Math.floor((x+r)/cs)), r0=Math.max(0,Math.floor((ly-r)/cs)), r1=Math.min(F.h-1,Math.floor((ly+r)/cs));
  for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++){ if(dist2((cx+0.5)*cs,(cy+0.5)*cs,x,ly)<r*r) F.bits[cy*F.w+cx]=1; }
}; }
{ const base=fogStr; fogStr=function(){ return FOG.bits?fogPack(FOG.bits):base(); }; }

// ---------- overview image per map (1 px per 25 world px), built a few rows a frame, only for the map in use
function ovOf(k){
  if(!k) return OV;
  const M=MAPS[k]; if(!M) return OV;
  if(!M.ov) M.ov={s:25,w:Math.ceil(M.w/25),h:Math.ceil(M.h/25),cv:null,g:null,img:null,row:0,done:false,y0:M.y0,k};
  return M.ov;
}
function ovStepMap(O,rows){
  if(O.done) return;
  if(!O.cv){ O.cv=mkCanvas(O.w,O.h); O.g=O.cv.getContext('2d'); O.img=O.g.createImageData(O.w,O.h); }
  const s={}, d=O.img.data;
  for(let n=0;n<rows&&O.row<O.h;n++,O.row++){
    const j=O.row;
    for(let i=0;i<O.w;i++){
      const x=(i+0.5)*O.s, y=O.y0+(j+0.5)*O.s; T(x,y,s);
      let c=groundRGB(s,x,y);
      if(s.road>0.3) c=mixRGB(c,[200,170,120],0.55);
      if(s.bridge===1) c=[120,90,60];
      if(s.bog>0.5) c=mixRGB(c,[40,52,36],0.4);
      const k=(j*O.w+i)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255;
    }
  }
  O.g.putImageData(O.img,0,0);
  if(O.row>=O.h) O.done=true;
}
{ const base=overviewStep; overviewStep=function(rows){
  const onMap=scene==='map', k=onMap?MAPUI.view:curMap(), O=ovOf(k);
  try{ if(onMap) mapHdWork(); else if(scene==='play') mapHdFogIdle(); }catch(e){ console.error(e); }   // (v12) the sharp map, below
  if(O.done) return;
  const n=onMap?24:rows;
  if(!k) base(n); else ovStepMap(O,n);
  if(onMap&&(O.done||(O.row%48)<n)) drawMapScreen();
}; }

// ---------- the map screen: which map is shown, how it fits the canvas, tabs for every map Ash has found
const MAPUI={view:0,tabs:null,fogCv:[],zm:{}};
// the whole map in the canvas (zoom 1)
function mapFit0(k){
  const M=MAPS[k]||MAPS[0], cw=mapCv.width, ch=mapCv.height;
  if(M.fit&&M.fit.cw===cw&&M.fit.ch===ch) return M.fit;
  const s=Math.min(cw/M.w,ch/M.h);
  M.fit={cw,ch,s,ox:(cw-M.w*s)/2,oy:(ch-M.h*s)/2,w:M.w*s,h:M.h*s,y0:M.y0};
  return M.fit;
}
// (v12) the map as shown: zoomed and panned by MAPUI.zm[k] (see "the big map zooms" below), never past its edges
function mapFit(k){
  const B=mapFit0(k), Z=MAPUI.zm&&MAPUI.zm[k];
  if(!Z||!(Z.z>1.001)) return B;
  const M=MAPS[k]||MAPS[0], cw=B.cw, ch=B.ch, s=B.s*Z.z, w=M.w*s, h=M.h*s;
  let ox=cw/2-Z.cx*s, oy=ch/2-(Z.cy-B.y0)*s;
  ox=w>=cw?clamp(ox,cw-w,0):(cw-w)/2; oy=h>=ch?clamp(oy,ch-h,0):(ch-h)/2;
  let F=Z.f; if(!F||F.cw!==cw||F.ch!==ch||F.s!==s||F.ox!==ox||F.oy!==oy) F=Z.f={cw,ch,s,ox,oy,w,h,y0:B.y0,z:Z.z};
  return F;
}
// canvas px on the map screen to world coordinates on the viewed map (zoomed or not: it inverts mapFit)
function mapInv(cx,cy){ const F=mapFit(MAPUI.view); return [(cx-F.ox)/F.s,F.y0+(cy-F.oy)/F.s]; }
function fogCanvas(k){ const F=fogOf(k); let c=MAPUI.fogCv[k]; if(!c||c.width!==F.w||c.height!==F.h){ c=mkCanvas(F.w,F.h); MAPUI.fogCv[k]=c; } return c; }
function mapsSeenList(){ const out=[]; for(const M of MAPS) if(M&&(M.k===0||(G&&G.mapsSeen&&G.mapsSeen[M.k]))) out.push(M.k); return out; }
function mapInfoText(){
  const k=MAPUI.view, M=MAPS[k]||MAPS[0], sh=mapList(SHRINES,k), found=sh.filter(s=>G.shrines[s.id]).length;
  const r=G.region||regionAt(player.x,player.y), here=curMap()===k;
  return `${here?(AREA?'Inside '+AREA.name:r.name):M.name} · Level ${player.level} · ${G.coins||0} coins · ${found} shrine${found===1?'':'s'} found`;
}
function mapTabsSync(){
  const list=mapsSeenList();
  let el=MAPUI.tabs;
  if(!el){
    el=document.createElement('div'); el.className='seg jtabs'; el.id='mapTabs'; el.setAttribute('role','group'); el.setAttribute('aria-label',S('Maps','Maps'));
    const wrap=document.querySelector('#mapov .mapwrap'); if(wrap&&wrap.parentElement) wrap.parentElement.insertBefore(el,wrap);
    MAPUI.tabs=el;
  }
  el.hidden=list.length<2;
  const want=list.join(',');
  if(el.dataset.maps!==want){
    el.dataset.maps=want; el.innerHTML='';
    for(const k of list){ const b=document.createElement('button'); b.type='button'; b.dataset.m=k; b.textContent=simplify((MAPS[k]||{}).name||'Map '+k); b.addEventListener('click',()=>mapView(k)); el.appendChild(b); }
  }
  for(const b of el.querySelectorAll('button')) b.setAttribute('aria-pressed',String(+b.dataset.m===MAPUI.view));
}
function mapView(k){
  if(scene!=='map'||!MAPS[k]) return;
  MAPUI.view=k; mapSel=null; $('#bTravel').hidden=true; mapHintSet();
  $('#mapInfo').textContent=mapInfoText(); mapTabsSync(); drawMapScreen(); SFX.play('ui');
}
// step through the tabs: , and . (or Page Up and Page Down) on the map screen; on a controller the tabs are buttons
// the D-pad reaches, and the bumpers keep cycling the shrines of the map on show
function mapViewStep(d){ const L=mapsSeenList(); if(L.length<2) return false; const i=L.indexOf(MAPUI.view); mapView(L[(i+d+L.length)%L.length]); return true; }
addEventListener('keydown',e=>{ if(scene!=='map') return; const c=e.code; if(c==='Comma'||c==='PageUp'){ e.preventDefault(); mapViewStep(-1); } else if(c==='Period'||c==='PageDown'){ e.preventDefault(); mapViewStep(1); } });

// ---------- (v12) the big map zooms and pans. Drew: "Can you also make the main maps zoomable for the user? It's a bit
// hard to see it zoomed out all the way all the time."
// MAPUI.zm[k]={z,cx,cy}: z 1 is the whole map (as before), cx, cy the world point at the middle of the canvas. mapFit
// applies it, so everything drawn through mapXY moves with it (and the cheat panel's mapInv and chMapPt, which go
// through mapFit too), while labels and markers keep their size in canvas px. The map opens zoomed on Ash
// (MAPZ.start, a little less on a small map); other tabs open whole and keep their own zoom while the map is open.
// Wheel and pinch zoom about the pointer, a drag pans (and is never taken as a click on a shrine or a cheat
// teleport), the + and - buttons and keys zoom about the middle (+ from the whole map goes toward Ash), Whole map (or
// 0) goes back, W A S D pan. A controller zooms with the triggers (R2 in, L2 out) and pans with the right stick. The
// limits: never smaller than the whole map, never past its edges, and no closer than MAPZ.pxMax canvas px per world
// px (the overview is 1 px per 25 world px, so it stays a picture, not blocks). The dungeon page (view -1) is not
// zoomed.
const MAPZ={start:2.5,max:5,step:1.6,pxMax:0.32,startSpan:2600,res:1.9};
function mapZMax(k){ const B=mapFit0(k); return clamp(MAPZ.pxMax/B.s,2,MAPZ.max); }
function mapZOn(k){ return k!=null&&k!==-1&&!!MAPS[k]; }
function mapZClamp(k){
  const Z=MAPUI.zm[k]; if(!Z) return null;
  Z.z=clamp(Z.z,1,mapZMax(k)); if(!(Z.z>1.001)){ delete MAPUI.zm[k]; return null; }
  const M=MAPS[k]||MAPS[0], B=mapFit0(k), s=B.s*Z.z, hw=B.cw/2/s, hh=B.ch/2/s;
  Z.cx=M.w*s>=B.cw?clamp(Z.cx,hw,M.w-hw):M.w/2;
  Z.cy=M.h*s>=B.ch?clamp(Z.cy,B.y0+hh,B.y0+M.h-hh):B.y0+M.h/2;
  return Z;
}
function mapZoomOf(k){ const Z=MAPUI.zm[k==null?MAPUI.view:k]; return Z?Z.z:1; }
// zoom the viewed map to nz, keeping the world point under canvas point (px,py) where it is (default: the middle)
function mapZoomTo(nz,px,py){
  const k=MAPUI.view; if(!mapZOn(k)) return;
  const B=mapFit0(k); if(px==null){ px=B.cw/2; py=B.ch/2; }
  const [wx,wy]=mapInv(px,py), z=clamp(nz,1,mapZMax(k));
  if(!(z>1.001)){ delete MAPUI.zm[k]; mapZReq(); return; }
  const s=B.s*z; MAPUI.zm[k]={z,cx:wx-(px-B.cw/2)/s,cy:wy-(py-B.ch/2)/s}; mapZClamp(k); mapZReq();
}
function mapZoomBy(f,px,py){ mapZoomTo(mapZoomOf()*f,px,py); }
function mapPan(dx,dy){
  const k=MAPUI.view, Z=MAPUI.zm[k]; if(!Z) return;
  const s=mapFit0(k).s*Z.z; Z.cx-=dx/s; Z.cy-=dy/s; mapZClamp(k); mapZReq();
}
// where Ash is on the map on show (null when he is on another map)
function mapZAsh(){ const k=MAPUI.view; if(!G||!player||curMap()!==k) return null; const pp=AREA&&G.ow?G.ow:player; return {x:pp.x,y:pp.y}; }
// centre the zoomed view on a world point (or zoom in on it from the whole map)
function mapZCentre(x,y,z){
  const k=MAPUI.view; if(!mapZOn(k)) return;
  MAPUI.zm[k]={z:z||mapZoomOf(k),cx:x,cy:y}; mapZClamp(k); mapZReq();
}
// the canvas fills the map frame (it was a fixed 1120 x 880 picture with parchment bars beside it, and on a phone it
// was a small box with tiny words): MAPZ.res canvas px per CSS px, so labels and markers are the same size on a phone
// as on a desktop. A phone held upright gets a squarer box. Returns true when the size changed.
function mapZSize(){
  const wrap=mapCv.parentElement; if(!wrap) return false;
  const W0=wrap.clientWidth; if(!(W0>40)) return false;
  const Hc=Math.round(Math.min(innerHeight*0.58,W0*(W0<600?0.9:0.786))), cw=Math.round(W0*MAPZ.res), ch=Math.round(Hc*MAPZ.res);
  mapCv.style.width=W0+'px'; mapCv.style.height=Hc+'px';
  if(mapCv.width===cw&&mapCv.height===ch) return false;
  mapCv.width=cw; mapCv.height=ch; return true;
}
addEventListener('resize',()=>{ try{ if(scene==='map'&&MAPUI.bound&&mapZSize()) drawMapScreen(); }catch(e){} });
function mapZStartZ(k){ const M=MAPS[k]||MAPS[0]; return clamp(Math.min(MAPZ.start,M.w/MAPZ.startSpan),1,mapZMax(k)); }
// the map screen opens: every tab whole, the one Ash is on zoomed on him
function mapZoomStart(){
  mapZBind(); mapZSize(); MAPUI.zm={}; const k=MAPUI.view, a=mapZOn(k)&&mapZAsh();
  if(a){ MAPUI.zm[k]={z:mapZStartZ(k),cx:a.x,cy:a.y}; mapZClamp(k); }
  mapZUI();
}
// keep a picked shrine in view (the controller and [ ] step through them)
function mapZShow(x,y){
  const k=MAPUI.view, Z=MAPUI.zm[k]; if(!Z) return;
  const F=mapFit(k), cx=F.ox+x*F.s, cy=F.oy+(y-F.y0)*F.s, m=60;
  if(cx<m||cy<m||cx>F.cw-m||cy>F.ch-m) mapZCentre(x,y,Z.z);
}
// one redraw per frame however many wheel or move events arrive
let mapZPend=false;
function mapZReq(){ mapZUI(); if(mapZPend) return; mapZPend=true; requestAnimationFrame(()=>{ mapZPend=false; if(scene==='map') drawMapScreen(); }); }
// the buttons: + and - and Whole map, in the top right corner of the map
function mapZUI(){
  const wrap=document.querySelector('#mapov .mapwrap'); if(!wrap) return;
  let el=document.getElementById('mapZoom');
  if(!el){
    el=document.createElement('div'); el.id='mapZoom'; el.className='mapzoom'; el.setAttribute('role','group'); el.setAttribute('aria-label',S('Zoom the map','Zoom the map'));
    el.innerHTML='<button type="button" class="mzb" data-z="in" aria-label="Zoom in">+</button><button type="button" class="mzb" data-z="out" aria-label="Zoom out">&minus;</button><button type="button" class="mzb mzw" data-z="all">'+S('Whole map','Whole map')+'</button>';
    el.addEventListener('click',e=>{ const b=e.target.closest('button[data-z]'); if(!b||scene!=='map') return; e.stopPropagation(); mapZBtn(b.dataset.z); });
    wrap.appendChild(el);
  }
  const k=MAPUI.view, on=mapZOn(k), z=mapZoomOf(k);
  el.hidden=!on;
  for(const b of el.querySelectorAll('button')){ const d=b.dataset.z; b.disabled=!on||(d==='in'?z>=mapZMax(k)-0.001:z<=1.001); }
  mapCv.style.cursor=MAPUI.drag&&MAPUI.drag.moved?'grabbing':z>1.001?'grab':'';
}
function mapZBtn(d){
  const k=MAPUI.view; if(!mapZOn(k)) return;
  if(d==='all'){ delete MAPUI.zm[k]; mapZReq(); }
  else if(d==='in'){ const a=mapZAsh(); if(mapZoomOf(k)<=1.001&&a){ mapZCentre(a.x,a.y,Math.min(MAPZ.step,mapZMax(k))); } else mapZoomBy(MAPZ.step); }
  else mapZoomBy(1/MAPZ.step);
  try{ SFX.play('ui',0.4); }catch(e){}
}
// pointers: one drags, two pinch. A press that moved more than a few px is a drag: the click after it is dropped
// (this listener is registered before the cheat panel's teleport click, so neither a shrine nor a teleport fires)
// (the map canvas, mapCv, is made by a12b_ui.js, which loads last: these bind on the first openMap)
MAPUI.ptr=new Map(); MAPUI.drag=null; MAPUI.dragEnd=-1e9; MAPUI.bound=false;
function mapCvPt(e){ const r=mapCv.getBoundingClientRect(); return {x:(e.clientX-r.left)/(r.width||1)*mapCv.width,y:(e.clientY-r.top)/(r.height||1)*mapCv.height,cx:e.clientX,cy:e.clientY}; }
function mapZBind(){
if(MAPUI.bound) return; MAPUI.bound=true;
mapCv.addEventListener('pointerdown',e=>{
  if(scene!=='map'||!mapZOn(MAPUI.view)||(e.pointerType==='mouse'&&e.button!==0)) return;
  MAPUI.ptr.set(e.pointerId,mapCvPt(e)); try{ mapCv.setPointerCapture(e.pointerId); }catch(err){}
  if(!MAPUI.drag) MAPUI.drag={moved:false,sx:e.clientX,sy:e.clientY,pinch:null};
  if(MAPUI.ptr.size===2){ const [a,b]=[...MAPUI.ptr.values()]; MAPUI.drag.pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:mapZoomOf()}; MAPUI.drag.moved=true; }
});
mapCv.addEventListener('pointermove',e=>{
  const D=MAPUI.drag, last=MAPUI.ptr.get(e.pointerId); if(!D||!last||scene!=='map') return;
  const q=mapCvPt(e);
  if(MAPUI.ptr.size>=2){
    const o=[...MAPUI.ptr.values()], m0x=(o[0].x+o[1].x)/2, m0y=(o[0].y+o[1].y)/2;
    MAPUI.ptr.set(e.pointerId,q);
    const n=[...MAPUI.ptr.values()], mx=(n[0].x+n[1].x)/2, my=(n[0].y+n[1].y)/2, d=Math.hypot(n[0].x-n[1].x,n[0].y-n[1].y)||1;
    if(D.pinch){ mapPan(mx-m0x,my-m0y); mapZoomTo(D.pinch.z*d/D.pinch.d,mx,my); }
    e.preventDefault(); return;
  }
  MAPUI.ptr.set(e.pointerId,q);
  if(!D.moved&&Math.hypot(e.clientX-D.sx,e.clientY-D.sy)>6) D.moved=true;
  if(D.moved){ mapPan(q.x-last.x,q.y-last.y); e.preventDefault(); }
});
function mapPtrUp(e){
  if(!MAPUI.ptr.has(e.pointerId)) return;
  MAPUI.ptr.delete(e.pointerId); try{ mapCv.releasePointerCapture(e.pointerId); }catch(err){}
  const D=MAPUI.drag; if(D&&D.pinch&&MAPUI.ptr.size<2){ D.pinch=null; }
  if(!MAPUI.ptr.size){ if(D&&D.moved) MAPUI.dragEnd=performance.now(); MAPUI.drag=null; mapZUI(); }
}
mapCv.addEventListener('pointerup',mapPtrUp); mapCv.addEventListener('pointercancel',mapPtrUp);
mapCv.addEventListener('wheel',e=>{
  if(scene!=='map'||!mapZOn(MAPUI.view)) return;
  e.preventDefault();
  const q=mapCvPt(e), dy=e.deltaMode===1?e.deltaY*18:e.deltaMode===2?e.deltaY*300:e.deltaY;
  mapZoomBy(Math.exp(-clamp(dy,-240,240)*0.0022),q.x,q.y);
},{passive:false});
}
addEventListener('click',e=>{ if(MAPUI.bound&&e.target===mapCv&&performance.now()-MAPUI.dragEnd<400){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
// keys: + and - zoom, 0 shows the whole map, W A S D pan
addEventListener('keydown',e=>{
  if(scene!=='map'||!mapZOn(MAPUI.view)) return;
  const c=e.code, P=90;
  if(c==='Equal'||c==='NumpadAdd'){ e.preventDefault(); mapZBtn('in'); }
  else if(c==='Minus'||c==='NumpadSubtract'){ e.preventDefault(); mapZBtn('out'); }
  else if(c==='Digit0'||c==='Numpad0'){ e.preventDefault(); mapZBtn('all'); }
  else if(c==='KeyW'||c==='KeyA'||c==='KeyS'||c==='KeyD'){ e.preventDefault(); mapPan(c==='KeyA'?P:c==='KeyD'?-P:0,c==='KeyW'?P:c==='KeyS'?-P:0); }
});
// a controller on the map: the triggers zoom (R2 in, L2 out), the right stick pans; the rest of the menu is as before
// (the right stick no longer scrolls the map screen)
{ const base=padMenu; padMenu=function(root,s,dt){
  if(root&&root.id==='mapov'&&s&&mapZOn(MAPUI.view)){
    try{
      const tv=i=>Math.max(s.cur[i]?1:0,(s.val&&s.val[i])||0), zin=tv(PB.R2), zout=tv(PB.L2);
      if(zin>0.15||zout>0.15) mapZoomBy(Math.exp((zin-zout)*1.6*dt));
      const [ai,aj]=padAimAx(), x=s.ax[ai]||0, y=s.ax[aj]||0, m=Math.hypot(x,y);
      if(m>0.2){ const k=(m-0.2)/0.8*900*dt/m; mapPan(-x*k,-y*k); }
      if(m>0.2){ s=Object.assign({},s,{ax:s.ax.slice()}); s.ax[ai]=0; s.ax[aj]=0; }
    }catch(err){ console.error(err); }
  }
  return base.call(this,root,s,dt);
}; }

// ---------- (v12) the big map is sharp at every zoom. FIXES: "at 4x the map is soft, because the overview image is
// low resolution"; on a phone the explored blob and the fog's stair-stepped edge (100 px cells) looked pixelated
// from the opening zoom.
// The ground: the overview (1 px per 25 world px) is drawn first, as before. Zoomed in, tiles of MHD.N x MHD.N samples
// at 12.5 or 6.25 world px a sample go over it (about one sample per CSS px), built a few ms a frame while the map is
// open, once the view has been still for a moment, nearest the middle first, and only where Ash has explored (under
// the fog the overview is enough). A tile samples the world (T, groundRGB and the overview's own road, wall, bridge,
// bog and hillshade rules) only in the overview cells whose four corners differ: coasts, roads, rivers, cliffs, the
// edges of towns. Everywhere else the ground is smooth, so the tile blends the overview's own pixels, which costs
// almost nothing. At most MHD.cap tiles are kept (64 KB each, about 8 MB in all, fine on an iPhone), the least
// recently drawn go first; a new look (Storybook or Classic) throws them away with the overview.
// The fog: the explored cells are smoothed into a field (a cubic B-spline through the cell middles) and drawn with
// a soft edge about half a cell wide, at 4 px a cell (8 when zoomed in), so the edge is a smooth curve at any zoom.
const MHD={N:128,cap:130,tiles:new Map(),want:[],budget:7,idleMs:1.2,settle:140,moved:0,view:'',thr:7,cpx:2.6,cpxS:2,fogWant:null,full:false,fog:{},stats:{built:0,px:0,full:0,ms:0,fogPx:0}};
const mhdNow=()=>(window.__realNow||(()=>performance.now()))();
const mhdGen=()=>{ try{ return LOOK.gen|0; }catch(e){ return 0; } };
// the tile level for a view: 0 is the overview itself, then 12.5 and 6.25 world px a sample: at most MHD.cpx canvas px
// a sample (1.4 CSS px), or MHD.cpxS on a phone sized map (1.05 CSS px; it has a quarter of the pixels to fill)
function mapHdLevel(F){
  const c=25*F.s, m=F.cw*F.ch<7e5?MHD.cpxS:MHD.cpx;
  return c<=m?0:c/2<=m?1:2;
}
// explored within a cell of this world rectangle?
function mapHdSeen(FG,x0,y0,x1,y1){
  if(!FG||!FG.bits) return false;
  const cs=FG.cs, c0=Math.max(0,Math.floor(x0/cs)-1), c1=Math.min(FG.w-1,Math.floor(x1/cs)+1), r0=Math.max(0,Math.floor((y0-FG.y0)/cs)-1), r1=Math.min(FG.h-1,Math.floor((y1-FG.y0)/cs)+1);
  for(let r=r0;r<=r1;r++){ const o=r*FG.w; for(let c=c0;c<=c1;c++) if(FG.bits[o+c]) return true; }
  return false;
}
// one world sample in the overview's colours: the same rules as overviewStep (a4_ground.js) and ovStepMap, and the
// hillshade of e3_elev.js (offsets of one overview pixel, so the shading reads the same, only sharper)
const MHD_S={};
function mapHdPix(k,wx,wy,E,eg,rowPaths,out){
  const s=MHD_S; T(wx,wy,s);
  let c=groundRGB(s,wx,wy);
  if(s.road>0.3) c=mixRGB(c,[200,170,120],0.55);
  if(!k&&Math.abs(wy-WALL_Y)<30) c=[40,36,48];
  if(s.bridge===1) c=[120,90,60];
  if(s.bog>0.5) c=mixRGB(c,[40,52,36],0.4);
  let r=c[0], g=c[1], b=c[2];
  if(eg&&wy>=eg.y0&&wy<=eg.y0+eg.h*eg.cs&&wx>=eg.x0&&wx<=eg.x0+eg.w*eg.cs){
    let path=false;
    for(const p of rowPaths) if(wx>=p.bb[0]&&wx<=p.bb[2]&&elvPathD(p.pts,wx,wy)<p.w*0.5+4){ path=true; break; }
    if(path){ r=lerp(r,206,0.6); g=lerp(g,178,0.6); b=lerp(b,134,0.6); }
    else{
      const os=25, lv=elevLvl(wx,wy), up=elevLvl(wx,wy-os), lf=elevLvl(wx-os,wy);
      if(lv||up||lf){
        const f=elevFace(wx,wy); let m=1, add=0;
        if(f&EF.FACE&&!(f&EF.RAMP)) m=0.62; else if(up>lv) m=0.7; else if(lv>up) add=26;
        if(lf>lv) m*=0.88; else if(lv>lf) add+=10;
        r=r*m+add; g=g*m+add; b=b*m+add*0.8;
      }
    }
  }
  out[0]=r; out[1]=g; out[2]=b;
}
function mapHdElv(k){ try{ const E=ELV.maps[k||0]; if(!E||!E.plats.length) return null; if(E.dirty) elvBuild(E); return E.G?E:null; }catch(e){ return null; } }
// a tile: k, level L, column and row; its samples sit at (i+0.5)*sp from its corner
function mapHdTile(k,L,tx,ty){
  const key=k+':'+L+':'+tx+':'+ty; let t=MHD.tiles.get(key);
  if(t&&t.gen!==mhdGen()){ MHD.tiles.delete(key); t=null; }
  if(!t){ const M=MAPS[k]||MAPS[0], sp=25/(1<<L), span=MHD.N*sp; t={key,k,L,tx,ty,sp,x0:tx*span,y0:M.y0+ty*span,span,row:0,ready:false,cv:null,img:null,fl:null,gen:mhdGen()}; }
  return t;
}
// the overview cells under a tile whose corners differ (they get real samples)
function mapHdFlags(t,O){
  const d=O.img.data, w=O.w, I0=clamp(Math.floor(t.x0/25-0.5),0,w-2), I1=clamp(Math.floor((t.x0+t.span)/25-0.5)+1,0,w-2);
  const J0=clamp(Math.floor((t.y0-O.y0)/25-0.5),0,O.h-2), J1=clamp(Math.floor((t.y0+t.span-O.y0)/25-0.5)+1,0,O.h-2), fw=I1-I0+1, fl=new Uint8Array(fw*(J1-J0+1));
  let n=0;
  for(let J=J0;J<=J1;J++) for(let I=I0;I<=I1;I++){
    const a=(J*w+I)*4, b=a+4, c=a+w*4, e=c+4; let rg=0;
    for(let q=0;q<3;q++){ const v0=d[a+q], v1=d[b+q], v2=d[c+q], v3=d[e+q], mx=Math.max(v0,v1,v2,v3), mn=Math.min(v0,v1,v2,v3); if(mx-mn>rg) rg=mx-mn; }
    if(MHD.full||rg>MHD.thr){ fl[(J-J0)*fw+(I-I0)]=1; n++; }
  }
  t.fl=fl; t.I0=I0; t.J0=J0; t.fw=fw; t.nFlag=n;
}
// build rows of a tile until the clock says stop; true once the tile is ready
function mapHdStep(t,until){
  const k=t.k, O=ovOf(k); if(!O.done||!O.img) return false;
  if(!t.img){ t.cv=mkCanvas(MHD.N,MHD.N); t.img=t.cv.getContext('2d').createImageData(MHD.N,MHD.N); mapHdFlags(t,O); t.ms=0; }
  const N=MHD.N, d=t.img.data, od=O.img.data, ow=O.w, oh=O.h, sp=t.sp, E=mapHdElv(k), eg=E&&E.G, px=[0,0,0], t0=mhdNow();
  let rows=0;
  while(t.row<N){
    const j=t.row, wy=t.y0+(j+0.5)*sp, v=(wy-O.y0)/25-0.5; let J=Math.floor(v); J=J<0?0:J>oh-2?oh-2:J; const fy=clamp(v-J,0,1), fr=(J-t.J0)*t.fw;
    const rowPaths=eg?E.paths.filter(p=>wy>=p.bb[1]&&wy<=p.bb[3]):ML_EMPTY;
    for(let i=0;i<N;i++){
      const wx=t.x0+(i+0.5)*sp, u=wx/25-0.5; let I=Math.floor(u); I=I<0?0:I>ow-2?ow-2:I; const fx=clamp(u-I,0,1), kk=(j*N+i)*4;
      if(t.fl[fr+I-t.I0]){ mapHdPix(k,wx,wy,E,eg,rowPaths,px); d[kk]=px[0]; d[kk+1]=px[1]; d[kk+2]=px[2]; MHD.stats.full++; }
      else{
        const a=(J*ow+I)*4, b=a+4, c=a+ow*4, e=c+4, w00=(1-fx)*(1-fy), w10=fx*(1-fy), w01=(1-fx)*fy, w11=fx*fy;
        d[kk]=od[a]*w00+od[b]*w10+od[c]*w01+od[e]*w11; d[kk+1]=od[a+1]*w00+od[b+1]*w10+od[c+1]*w01+od[e+1]*w11; d[kk+2]=od[a+2]*w00+od[b+2]*w10+od[c+2]*w01+od[e+2]*w11;
      }
      d[kk+3]=255;
    }
    t.row++; rows++; MHD.stats.px+=N;
    if(mhdNow()>until||rows>=N) break;
  }
  t.ms+=mhdNow()-t0;
  if(t.row>=N){ t.cv.getContext('2d').putImageData(t.img,0,0); t.img=null; t.fl=null; t.ready=true; MHD.stats.built++; MHD.stats.ms+=t.ms; }
  return t.ready;
}
// the worker (from overviewStep, every frame while the map is open): the wanted tiles, a few ms a frame, once the
// view has been still for MHD.settle ms; one redraw when a tile is done
function mapHdWork(){
  const L8=MHD.fogWant;
  if(L8&&mhdNow()-MHD.moved>=MHD.settle){ if(mapHdFogJob(L8,mhdNow()+MHD.budget)){ MHD.fogWant=null; if(scene==='map') drawMapScreen(); } return; }
  if(!MHD.want.length||mhdNow()-MHD.moved<MHD.settle) return;
  const until=mhdNow()+MHD.budget; let done=0;
  while(MHD.want.length&&mhdNow()<until){
    const t=MHD.want[0];
    if(t.ready||t.gen!==mhdGen()){ MHD.want.shift(); continue; }
    if(!MHD.tiles.has(t.key)){ MHD.tiles.set(t.key,t); mapHdTrim(); }
    if(!mapHdStep(t,until)) break;
    MHD.want.shift(); done++;
  }
  if(done&&scene==='map') drawMapScreen();
}
function mapHdTrim(){ while(MHD.tiles.size>MHD.cap) MHD.tiles.delete(MHD.tiles.keys().next().value); }
// the fog: smooth, drawn over the ground. One canvas per map and detail (4 px a cell, or 8 when zoomed in close),
// Storybook parchment or Classic dark. It is built once (in the background while Ash plays, a ms or two a frame, so
// the map opens at once), then only the part Ash has explored since is redrawn (fogReveal marks it). A load, a new
// journey or a new look builds it again. The 8 px one is built by the map's worker while the 4 px one stands in.
const MHD_BW=[], MHD_FEP={n:0};
function mapHdFogW(sub){
  if(MHD_BW[sub]) return MHD_BW[sub];
  const W=[];
  for(let p=0;p<sub;p++){ let u=(p+0.5)/sub-0.5, off=0; if(u<0){ u+=1; off=-1; } const t=u, t2=t*t, t3=t2*t;
    W.push({off,w:[(1-t)*(1-t)*(1-t)/6,(3*t3-6*t2+4)/6,(-3*t3+3*t2+3*t+1)/6,t3/6]}); }
  return (MHD_BW[sub]=W);
}
const mhdSB=()=>!!(typeof LOOK!=='undefined'&&LOOK.sb);
function mapHdFogCol(sb){ return sb?[232,212,168]:[18,13,10]; }
function mapHdFogLUT(sb){
  if(MHD.fogLUT&&MHD.fogLUT.sb===sb) return MHD.fogLUT.t;
  const col=mapHdFogCol(sb), t=new Uint32Array(1025);
  for(let i=0;i<=1024;i++){ let e=(i/1024-0.32)/0.36; e=e<0?0:e>1?1:e*e*(3-2*e); const a=Math.round(235*(1-e)); t[i]=((a<<24)|(col[2]<<16)|(col[1]<<8)|col[0])>>>0; }
  MHD.fogLUT={sb,t}; return t;
}
// the explored cells: a hash (to know when they change), how many, and their box
function mapHdFogInfo(FG){
  const bits=FG.bits, cw=FG.w, ch=FG.h; let h=0, n=0, i0=cw, i1=-1, j0=ch, j1=-1;
  for(let j=0;j<ch;j++){ const o=j*cw; for(let i=0;i<cw;i++) if(bits[o+i]){ h=(Math.imul(h,31)+o+i)|0; n++; if(i<i0) i0=i; if(i>i1) i1=i; if(j<j0) j0=j; if(j>j1) j1=j; } }
  return {h:h+'|'+n,n,i0,i1,j0,j1};
}
function mapHdFogLayer(k,sub){
  const FG=fogOf(k); if(!FG||!FG.bits) return null;
  const key=k+':'+sub, W=FG.w*sub, H=FG.h*sub; let L=MHD.fog[key];
  if(!L||L.cv.width!==W||L.cv.height!==H){ L={k,sub,cv:mkCanvas(W,H),w:FG.w,h:FG.h,cs:FG.cs,built:false,hash:null,sb:null,ep:-1,dirty:null,job:null}; MHD.fog[key]=L; }
  return L;
}
// the field and its soft edge for the cells ci0..ci1, cj0..cj1 (inclusive), written into the layer's canvas
function mapHdFogPut(L,FG,ci0,cj0,ci1,cj1,sb){
  const sub=L.sub, cw=FG.w, ch=FG.h, bits=FG.bits;
  ci0=Math.max(0,ci0); cj0=Math.max(0,cj0); ci1=Math.min(cw-1,ci1); cj1=Math.min(ch-1,cj1); if(ci1<ci0||cj1<cj0) return 0;
  const X0=ci0*sub, X1=(ci1+1)*sub, Y0=cj0*sub, Y1=(cj1+1)*sub, RW=X1-X0, RH=Y1-Y0, Wt=mapHdFogW(sub);
  // the cells the taps reach (two more each way), zero outside the map, so no tap needs a bounds check
  const pi0=ci0-3, pj0=cj0-3, PW=ci1-ci0+7, PH=cj1-cj0+7, P=new Float32Array(PW*PH);
  for(let j=Math.max(0,pj0);j<Math.min(ch,pj0+PH);j++){ const o=j*cw, po=(j-pj0)*PW-pi0; for(let i=Math.max(0,pi0);i<Math.min(cw,pi0+PW);i++) P[po+i]=bits[o+i]; }
  const ix=new Int32Array(RW), w0=new Float32Array(RW), w1=new Float32Array(RW), w2=new Float32Array(RW), w3=new Float32Array(RW);
  for(let x=0;x<RW;x++){ const X=X0+x, i=Math.floor(X/sub), q=Wt[X-i*sub]; ix[x]=i+q.off-1-pi0; w0[x]=q.w[0]; w1[x]=q.w[1]; w2[x]=q.w[2]; w3[x]=q.w[3]; }
  // across: cell rows cj0-2 .. cj1+2 to RW samples each
  const NR=cj1-cj0+5, hz=new Float32Array(NR*RW);
  for(let r=0;r<NR;r++){ const base=(cj0-2+r-pj0)*PW, ro=r*RW;
    for(let x=0;x<RW;x++){ const b=base+ix[x]; hz[ro+x]=w0[x]*P[b]+w1[x]*P[b+1]+w2[x]*P[b+2]+w3[x]*P[b+3]; } }
  // down: the field, then the soft edge (the field from 0.32 to 0.68, smoothstep) as one 32-bit pixel from a table
  const LUT=mapHdFogLUT(sb), g=L.cv.getContext('2d'), img=g.createImageData(RW,RH), u=new Uint32Array(img.data.buffer);
  for(let Y=Y0;Y<Y1;Y++){ const j=Math.floor(Y/sub), q=Wt[Y-j*sub], jb=j+q.off-1, a0=q.w[0], a1=q.w[1], a2=q.w[2], a3=q.w[3], o=(Y-Y0)*RW;
    const r0=(jb-cj0+2)*RW, r1=r0+RW, r2=r1+RW, r3=r2+RW;
    for(let x=0;x<RW;x++){ let v=a0*hz[r0+x]+a1*hz[r1+x]+a2*hz[r2+x]+a3*hz[r3+x]; v=v<0?0:v>1?1:v; u[o+x]=LUT[(v*1024)|0]; }
  }
  g.putImageData(img,X0,Y0);
  return RW*RH;
}
// a full build, in bands of a few cell rows, until the clock says stop; true when the layer is done
function mapHdFogJob(L,until){
  const FG=fogOf(L.k); if(!FG||!FG.bits) return false;
  const sb=mhdSB();
  if(!L.job||L.job.ep!==MHD_FEP.n||L.job.sb!==sb){
    const I=mapHdFogInfo(FG), col=mapHdFogCol(sb), g=L.cv.getContext('2d');
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,L.cv.width,L.cv.height); g.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},${235/255})`; g.fillRect(0,0,L.cv.width,L.cv.height);
    L.built=false; L.dirty=null; L.dn=0;
    // the field is only above zero within two cells of an explored one: work in that box only
    L.job={ep:MHD_FEP.n,sb,hash:I.h,n:I.n,i0:I.i0-2,i1:I.i1+2,j:I.j0-2,j1:I.j1+2,t:0};
    if(!I.n) L.job.j=L.job.j1+1;
  }
  const J=L.job, t0=mhdNow();
  while(J.j<=J.j1){ const b=Math.min(J.j1,J.j+3); MHD.stats.fogPx+=mapHdFogPut(L,FG,J.i0,J.j,J.i1,b,sb); J.j=b+1; if(mhdNow()>until) break; }
  J.t+=mhdNow()-t0;
  if(J.j>J.j1){ L.built=true; L.sb=sb; L.ep=J.ep; L.hash=J.hash; L.n=J.n; L.job=null; MHD.stats.fogMs=+J.t.toFixed(1); return true; }
  return false;
}
// the layer to draw now: up to date, with what Ash explored since redrawn; null when it needs a full build first
function mapHdFogReady(L){
  if(!L||!L.built||L.sb!==mhdSB()||L.ep!==MHD_FEP.n) return false;
  const FG=fogOf(L.k), I=mapHdFogInfo(FG);
  if(I.h===L.hash) return true;
  // the marked part holds every change only if fogReveal counted them all (anything else that sets cells: build again)
  if(!L.dirty||I.n!==L.n+(L.dn||0)) return false;
  const D=L.dirty; L.dirty=null; MHD.stats.fogPx+=mapHdFogPut(L,FG,D.i0-2,D.j0-2,D.i1+2,D.j1+2,L.sb); L.hash=I.h; L.n=I.n; L.dn=0; MHD.stats.fogPart=(MHD.stats.fogPart||0)+1;
  return true;
}
function mapHdFog(k,F){
  const want=MHD.fogSub||(F.s*25<=6?4:8), L4=mapHdFogLayer(k,4);
  if(want===8){
    for(const key in MHD.fog) if(key.endsWith(':8')&&key!==k+':8') delete MHD.fog[key];   // one 8 px layer at a time (4 MB on the big maps)
    const L8=mapHdFogLayer(k,8); if(mapHdFogReady(L8)){ MHD.fogWant=null; return L8; } MHD.fogWant=L8;
  }
  else MHD.fogWant=null;
  if(!mapHdFogReady(L4)) mapHdFogJob(L4,1e18);   // only if the map opens before the background build is done
  return L4&&L4.built?L4:null;
}
// fogReveal marks the cells it really changed on every fog layer of that map; a load or a new journey starts again
{ const base=fogReveal; fogReveal=function(x,y,r){
  if(!(x<IZX-50)) return base(x,y,r);
  const k=mapAt(y), F=fogOf(k); if(!F||!F.bits) return base(x,y,r);
  const cs=F.cs, ly=y-F.y0, c0=Math.max(0,Math.floor((x-r)/cs)), c1=Math.min(F.w-1,Math.floor((x+r)/cs)), r0=Math.max(0,Math.floor((ly-r)/cs)), r1=Math.min(F.h-1,Math.floor((ly+r)/cs));
  let n0=0; for(let j=r0;j<=r1;j++) for(let i=c0;i<=c1;i++) n0+=F.bits[j*F.w+i];
  const out=base(x,y,r), F2=fogOf(k);
  let n1=0; for(let j=r0;j<=r1;j++) for(let i=c0;i<=c1;i++) n1+=F2.bits[j*F2.w+i];
  if(n1!==n0) for(const sub of [4,8]){ const L=MHD.fog[k+':'+sub]; if(!L) continue; L.dn=(L.dn||0)+n1-n0; const D=L.dirty; L.dirty=D?{i0:Math.min(D.i0,c0),j0:Math.min(D.j0,r0),i1:Math.max(D.i1,c1),j1:Math.max(D.j1,r1)}:{i0:c0,j0:r0,i1:c1,j1:r1}; }
  return out;
}; }
{ const base=fogInit; fogInit=function(){ MHD_FEP.n++; return base.apply(this,arguments); }; }
{ const base=loadGame; loadGame=function(){ MHD_FEP.n++; return base.apply(this,arguments); }; }
// while Ash plays: build the fog of the map he is on, a ms or so a frame, once the overview is done
function mapHdFogIdle(){
  const k=curMap(), O=ovOf(k); if(!O.done||!G||G.mode!=='story') return;
  const L=mapHdFogLayer(k,4); if(!L||(L.built&&L.sb===mhdSB()&&L.ep===MHD_FEP.n)) return;
  mapHdFogJob(L,mhdNow()+MHD.idleMs);
}
// the ground and the fog of map k as fitted by F (drawMapScreen in a12b_ui.js calls this); also lists the tiles
// this view still wants
function mapHdGround(g,k,F){
  const M=MAPS[k]||MAPS[0], O=ovOf(k), L=mapHdLevel(F);
  if(O.cv){ g.imageSmoothingEnabled=true; g.drawImage(O.cv,F.ox,F.oy,F.w,F.h); }
  const view=k+'|'+L+'|'+Math.round(F.ox)+'|'+Math.round(F.oy)+'|'+F.s.toFixed(5);
  if(view!==MHD.view){ MHD.view=view; MHD.moved=mhdNow(); }
  MHD.want.length=0; MHD.lvl=L;
  if(L>0&&O.done){
    const FG=fogOf(k), wx0=Math.max(0,-F.ox/F.s), wx1=Math.min(M.w,(F.cw-F.ox)/F.s), wy0=Math.max(0,-F.oy/F.s), wy1=Math.min(M.h,(F.ch-F.oy)/F.s);
    const cx=(wx0+wx1)/2, cy=(wy0+wy1)/2, gen=mhdGen();
    g.save(); g.beginPath(); g.rect(F.ox,F.oy,F.w,F.h); g.clip(); g.imageSmoothingEnabled=true;
    const drawLvl=(l,list)=>{
      const span=MHD.N*25/(1<<l), tx0=Math.floor(wx0/span), tx1=Math.floor((wx1-0.01)/span), ty0=Math.floor(wy0/span), ty1=Math.floor((wy1-0.01)/span);
      let all=true;
      for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++){
        const key=k+':'+l+':'+tx+':'+ty, t=MHD.tiles.get(key);
        if(t&&t.ready&&t.gen===gen){
          MHD.tiles.delete(key); MHD.tiles.set(key,t);   // the least recently drawn are dropped first
          const ax=Math.round(F.ox+tx*span*F.s), ay=Math.round(F.oy+ty*span*F.s), bx=Math.round(F.ox+(tx+1)*span*F.s), by=Math.round(F.oy+(ty+1)*span*F.s);
          g.drawImage(t.cv,ax,ay,bx-ax,by-ay);
        }else if(mapHdSeen(FG,tx*span,M.y0+ty*span,(tx+1)*span,M.y0+(ty+1)*span)){ all=false; if(list) list.push(mapHdTile(k,l,tx,ty)); }
      }
      return all;
    };
    // the wanted level first (to know what is missing), then the levels below fill the gaps, then the wanted level on top
    const wantL=[], all=drawLvl(L,wantL);
    if(!all){ for(let l=1;l<L;l++) drawLvl(l,null); drawLvl(L,null); }
    g.restore();
    const span=MHD.N*25/(1<<L);
    wantL.sort((a,b)=>dist2(a.x0+span/2,a.y0-M.y0+span/2,cx,cy)-dist2(b.x0+span/2,b.y0-M.y0+span/2,cx,cy));
    MHD.want=wantL;
  }
  const C=mapHdFog(k,F);
  if(C){ g.imageSmoothingEnabled=true; g.drawImage(C.cv,F.ox,F.oy,C.w*C.cs*F.s,C.h*C.cs*F.s); }
  else{ const FG=fogOf(k), c=fogCanvas(k), cg=c.getContext('2d'), img=cg.createImageData(FG.w,FG.h);   // (never expected: the old blocky fog)
    for(let i=0;i<FG.bits.length;i++){ img.data[i*4]=18; img.data[i*4+1]=13; img.data[i*4+2]=10; img.data[i*4+3]=FG.bits[i]?0:235; }
    cg.putImageData(img,0,0); g.drawImage(c,F.ox,F.oy,FG.w*FG.cs*F.s,FG.h*FG.cs*F.s); }
}

// ---------- (v12) the legend names a kind of marker only once the map has shown one on this journey (Drew: the
// story should not spill its mysteries; "Ward burning" and "Ward dark" were there from the first minute). drawMapScreen
// calls mapLeg(kind) as it draws each marker (the Wards only after Yara's lore), and mapLegSync shows the entries;
// G.mapLeg is saved with the journey. "You" is always there; the dungeon page shows only "You".
function mapLeg(kind){ if(!G) return; const L=G.mapLeg||(G.mapLeg={}); if(!L[kind]) L[kind]=1; }
function mapLegSync(){
  const el=document.getElementById('mapLegend'); if(!el) return;
  const L=(G&&G.mapLeg)||{}, dun=MAPUI.view===-1;
  for(const s of el.querySelectorAll('[data-k]')){ const k=s.dataset.k, on=k==='you'||(!dun&&!!L[k]); if(s.hidden===on) s.hidden=!on; }
}

// ---------- towns on new maps: names, music, events, house look, homes
const TOWNS={}, TOWN_ORDER=[];
// defineTown(key,{name, music:'town', hz?(hs,L)->fields, generics?:true|false|{ties:[...]}})
// key must also be a POI key (POI[key]={x,y,r,name,level,town:true}) so music, events and homes know where it is.
function defineTown(key,def){
  def=Object.assign({music:'town',generics:true},def||{});
  if(!TOWNS[key]) TOWN_ORDER.push(key);
  TOWNS[key]=def;
  TOWN_NAME[key]=def.name||key;
  TOWN_KEYS[key]=def.music||'town';
  if(!EVTOWNS.includes(key)) EVTOWNS.push(key);
  if(def.generics&&def.generics.ties) TIE_NAMES[key]=def.generics.ties;
  return def;
}
{ const base=hzPlan; hzPlan=function(hs){
  if(hs.L) return hs.L;
  const T=TOWNS[hs.town]; if(!T||!T.hz) return base(hs);
  const L=base(hs); let r=null; try{ r=T.hz(hs,L); }catch(e){ r=null; }
  if(r&&r!==L) for(const f in r) L[f]=(f==='wc'||f==='rc'||f==='gc'||f==='beam'||f==='trim')&&typeof r[f]==='string'?hexRGB(r[f]):r[f];
  return L;
}; }
// homes for the new towns, in defineTown order, after the stock towns: owners are CAST people with town:key and
// home:true (in CAST order), then generic neighbours n_<town>_<i>. House and generic ids are save keys.
function assignHomesNew(){
  let gi=CAST.filter(c=>c.generic).length;
  const rng=mulberry32(778);
  for(const town of TOWN_ORDER){
    const T=TOWNS[town], P=POI[town]||T.at||{x:0,y:0};
    const hs=HOUSES.filter(h=>h.town===town&&h.k==='house'&&!h.area).sort((a,b)=>dist2(a.x,a.y,P.x,P.y)-dist2(b.x,b.y,P.x,P.y));
    const owners=[];
    for(const c of CAST) if(c.town===town&&c.home&&!c.generic) owners.push({id:c.id,house:c.house,style:STYLE_OF[c.job]||c.style||'home'});
    let n=0;
    hs.forEach((h,i)=>{
      const o=owners[i], door=doorOf(h); let def;
      if(o){ def=defHouse('h_'+o.id,{name:o.house||'House',owner:o.id,style:o.style,seed:1000+i+town.length*31,painting:i,egg:i+3,w:o.style==='inn'||o.style==='lodge'?680:560,h:o.style==='inn'?460:400,town}); if(INDOOR[o.id]&&CASTBY[o.id]) CASTBY[o.id].inside=def.id; h.owner=o.id; }
      else{
        if(T.generics===false) return;
        const first=FIRST[(gi*7+3)%FIRST.length], last=LAST[(gi*5+1)%LAST.length], nm=`${first} ${last}`;
        const ties=TIE_NAMES[town]||TIE_NAMES.village, tie=ties[gi%ties.length], nid='n_'+town+'_'+n;
        CAST.push({id:nid,name:nm,town,generic:true,col:pick2({x:gi,y:3},['#d8c3a0','#cfd6e0','#e0c0a0','#c0d8b0','#e0b0c0']),look:{shirt:pick2({x:gi,y:1},['#6a4a8a','#3a6a8a','#8a5a3a','#5a7a3a','#7a3a3a','#3a5a5a']),hair:pick2({x:gi,y:2},['#2a1a10','#6a4a2a','#b8a070','#1a1a1a','#8a3a1a','#e8e4dc']),hat:gi%5===0?'straw':gi%7===0?'cap':null,beard:gi%4===1,glasses:gi%6===2},
          lines:[NEIGHBOR_LINES[gi%NEIGHBOR_LINES.length](tie),NEIGHBOR_ODD[gi%NEIGHBOR_ODD.length]]});
        CASTBY[nid]=CAST[CAST.length-1];
        def=defHouse('h_'+nid,{name:`${first}’s House`,owner:nid,style:'home',seed:3000+gi+Math.floor(rng()*97),egg:gi,painting:gi+2,note:`${nm}’s diary: "${NEIGHBOR_ODD[(gi+3)%NEIGHBOR_ODD.length]}"`,w:520,h:380,town});
        h.owner=nid; gi++; n++;
      }
      h.area=def.id; h.door=door;
      DOORS.push({x:door.x,y:door.y,area:def.id,label:`Enter ${def.name}`,outY:door.outY||0,hs:h,owner:def.owner});
    });
  }
}

// ---------- world building for the new maps: B, the builder handed to def.build(B)
// Everything is in absolute coordinates. Shrines, camps, ores and caves added here get the same structs,
// colliders and lights that initWorld and buildPlaces give the Embermere ones.
function mapBuilder(M){
  const B={
    M, k:M.k, y0:M.y0, rng:mulberry32(5150+M.k*977),
    poi(key,p){ POI[key]=Object.assign({level:1},p); return POI[key]; },
    shrine(s){ SHRINES.push(s); STRUCTS.push({k:'shrine',x:s.x,y:s.y,ref:s}); addCol({t:'c',x:s.x,y:s.y,r:16}); LIGHTS.push({x:s.x,y:s.y,r:150,i:0.6,shrine:s}); return s; },
    camp(c){ CAMPS.push(c); STRUCTS.push({k:'campfire',x:c.x,y:c.y,small:true}); LIGHTS.push({x:c.x,y:c.y,r:200,i:0.8,fire:true});
      for(let i=0;i<2;i++) LANDMARKS.push({id:`cpot_${c.id}_${i}`,k:i?'barrel':'pot',x:c.x+Math.cos(i*2+1)*80,y:c.y+Math.sin(i*2+1)*80,breakable:true}); return c; },
    ore(o){ ORES.push(o); STRUCTS.push({k:'ore',ref:o,x:o.x,y:o.y}); addCol({t:'c',x:o.x,y:o.y,r:16,low:true}); LIGHTS.push({x:o.x,y:o.y,r:120,i:0.5,ore:o}); return o; },
    // one house: {x,y,w,h,roof,town,snow?,vert?}
    house(o){ const hs={k:'house',x:o.x,y:o.y,w:o.w||120,h:o.h||80,vert:!!o.vert,roof:o.roof||'#6e5a48',burnt:!!o.burnt,seed:o.seed!=null?o.seed:Math.floor(B.rng()*1e9),snow:!!o.snow,town:o.town};
      HOUSES.push(hs); STRUCTS.push(hs); addCol({t:'r',x0:hs.x-hs.w/2,y0:hs.y-hs.h/2,x1:hs.x+hs.w/2,y1:hs.y+hs.h/2});
      if(o.torch!==false){ const tx=hs.x-hs.w*0.32, ty=hs.y+hs.h/2+12; STRUCTS.push({k:'torch',x:tx,y:ty}); LIGHTS.push({x:tx,y:ty,r:170,i:0.75,fire:true,night:true}); }
      return hs; },
    // n houses on a ring r0..r1 around (cx,cy), off this map's roads: {town, roofs:[...], avoid:[[x,y,r],...], snow?, burnt?, seed?}
    houses(cx,cy,n,r0,r1,o){ o=o||{}; return mapHouses(cx,cy,n,r0,r1,mulberry32(o.seed||(cx*7+cy*13)|0),o.avoid||[],o.roofs||['#5c6470','#8a6a3a','#8e4a34','#6e5a48','#7a3a2a'],o); },
    // a cave or dungeon mouth that opens AREADEFS[area] (define the area first)
    cave(o){ const def=AREADEFS[o.area]||{name:o.name||o.area,theme:o.theme}; const [x,y]=o.noNudge?[o.x,o.y]:nudge(o.x,o.y,80);
      const m={area:o.area,x,y,name:o.name||def.name}; CAVEMOUTHS.push(m); STRUCTS.push({k:'cavemouth',x,y,ref:m,theme:o.theme||def.theme});
      for(let a=Math.PI*1.1;a<=Math.PI*1.9+0.01;a+=Math.PI*0.2) addCol({t:'c',x:x+Math.cos(a)*58,y:y+Math.sin(a)*46,r:26});
      DOORS.push({x,y:y+14,area:o.area,label:o.label||`Enter ${m.name}`,outY:46,cave:true}); return m; },
    landmark(o){ return addLandmark(o); },
    sign(id,x,y,text){ return addLandmark({id,k:'sign',x,y,r:8,text,prompt:'Read the sign',noNudge:true}); },
    light(L){ LIGHTS.push(L); return L; },
    struct(s){ STRUCTS.push(s); return s; },
    decal(d){ DECALS.push(d); return d; },
    col(c){ return addCol(c); },
    door(d){ DOORS.push(d); return d; },
    crossing(def){ return buildCrossing(def); },
    town(key,def){ return defineTown(key,def); },
  };
  return B;
}
// placeHouses (a2c_build.js) with every draw from the seeded rng: the same rules (off this map's roads, not blocked,
// clear of the avoid discs, shrines and other houses), the same house, collider, torch and night light
function mapHouses(cx,cy,n,r0,r1,rng,avoid,roofs,list){
  const out=[];
  for(let tries=0;tries<600&&out.length<n;tries++){
    const a=rng()*TAU, rr=r0+rng()*(r1-r0), x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
    const vert=rng()<0.5, w=vert?70+rng()*18:100+rng()*30, h=vert?100+rng()*30:70+rng()*18;
    if(segsDist(x,y,ROAD_SEGS)<Math.max(w,h)*0.6+28) continue;
    if(blockedAt(x,y)||blockedAt(x-w/2,y-h/2)||blockedAt(x+w/2,y+h/2)||blockedAt(x-w/2,y+h/2)||blockedAt(x+w/2,y-h/2)) continue;
    if(avoid.some(([ax,ay,ar])=>dist(x,y,ax,ay)<ar+Math.max(w,h)/2)) continue;
    if(mapList(SHRINES,mapAt(y)).some(s=>dist(x,y,s.x,s.y)<150)) continue;
    if(HOUSES.some(o=>Math.abs(o.x-x)<(o.w+w)/2+50&&Math.abs(o.y-y)<(o.h+h)/2+50)) continue;
    const hs={k:'house',x,y,w,h,vert,roof:roofs[Math.floor(rng()*roofs.length)],burnt:list.burnt?rng()<list.burnt:false,seed:Math.floor(rng()*1e9),town:list.town,snow:!!list.snow};
    HOUSES.push(hs); STRUCTS.push(hs); out.push(hs);
    addCol({t:'r',x0:x-w/2,y0:y-h/2,x1:x+w/2,y1:y+h/2});
    const tx=x-Math.max(30,w*0.34), ty=y+h/2+12;
    STRUCTS.push({k:'torch',x:tx,y:ty}); LIGHTS.push({x:tx,y:ty,r:170,i:0.75,fire:true,night:true});
  }
  return out;
}
// random chests per map: quotas from each biome's `chests` (default 3), at most def.chests in all, 700 px apart
function scatterChests(M){
  const rng=mulberry32(9100+M.k*131), tmp={}, have={}, max=M.chests!=null?M.chests:28; let n=0;
  for(let tries=0;tries<9000&&n<max;tries++){
    const x=250+rng()*(M.w-500), y=M.y0+250+rng()*(M.h-500);
    T(x,y,tmp); const b=tmp.b, Bd=typeof BIOMES!=='undefined'?BIOMES[b]:null, q=Bd&&Bd.chests!=null?Bd.chests:3;
    if((have[b]||0)>=q||tmp.out||tmp.water||tmp.lava||tmp.road>0||tmp.shore>0||tmp.bridge||tmp.bog>0.3||blockedAt(x,y)) continue;
    if(inClearing(x,y,60)) continue;
    if(mapList(CHESTS,M.k).some(c=>dist2(c.x,c.y,x,y)<700*700)) continue;
    have[b]=(have[b]||0)+1; CHESTS.push({id:'m'+M.k+'ch'+n,x,y,b,open:false}); n++;
  }
}
// Nothing here draws from Math.random (B.houses has its own seeded copy of placeHouses), so the new maps come out the
// same on every load and Embermere's own random draws (chests, chunk decor) stay exactly as they were. (Do not swap
// Math.random out: writing to the Math object makes every Math call in the noise code about twice as slow.)
function buildMaps(){
  for(const M of MAPS) if(M&&M.k>0&&typeof mapTerrainInit==='function') mapTerrainInit(M);
  for(const M of MAPS){
    if(!M) continue;
    const B=mapBuilder(M);
    if(M.build) try{ M.build(B); }catch(e){ console.error('map build',M.k,e); }
    for(const c of M.crossings||[]) buildCrossing(c);
    if(M.k>0) scatterChests(M);
  }
  for(const id in CROSSINGS) buildCrossing(CROSSINGS[id]);
  assignHomesNew(); registerSpeakers();
  if(typeof mapBiomeMusic==='function') mapBiomeMusic();
  MAPST.built=true; mapListsReset(); BIGOAKS=null; OCCS=null;
}
// the maps are built after Embermere (and after its random chests, so Embermere's random sequence is untouched)
{ const base=initWorld; initWorld=function(){ base(); buildMaps(); }; }

// ---------- crossings: travel points between maps
// defineCrossing({id,x,y,to:{x,y},label:'Take the Southern Pass',name?,need?:()=>bool,locked?:'text',kind:'pass'|'dock'|'bridge'|'stair',
//   dir?:angle (which way the path, pier or stair runs, default toward the destination edge),hidden?:()=>bool,arrive?:'banner text',onTravel?()})
const CROSSINGS={};
function defineCrossing(def){ CROSSINGS[def.id]=def; if(MAPST.built) buildCrossing(def); return def; }
function buildCrossing(def){
  if(def._lm) return def._lm;
  const k=mapAt(def.y), tk=mapAt(def.to.y);
  if(def.dir==null) def.dir=tk===k?0:(tk>k?Math.PI/2:-Math.PI/2);
  def.kind=def.kind||'pass';
  // a placeholder crossing leaves no trace on the ground (no path, post collider or cleared props) so a map it sits on
  // looks exactly as before while the crossing is hidden; real crossings clear the props around them (def.clear px)
  const ph=!!def.placeholder;
  const lm={id:'xing_'+def.id,k:'crossing',x:def.x,y:def.y,r:0,clr:ph?0.001:def.clear!=null?def.clear:150,noNudge:true,always:false,prompt:def.label||'Travel',xing:def,
    hidden:()=>!!(def.hidden&&def.hidden()),draw:(o,t)=>{ if(!(def.hidden&&def.hidden())) drawCrossing(def,t); },act:()=>useCrossing(def)};
  LANDMARKS.push(lm); def._lm=lm; (XBY[k]||(XBY[k]=[])).push(def);
  if(!ph){ if(def.kind==='pass') DECALS.push({k:'dirt',x:def.x+Math.cos(def.dir)*40,y:def.y+Math.sin(def.dir)*40,r:110}); addCol({t:'c',x:def.x-30,y:def.y-6,r:7,low:true}); }
  // a dock's pier (and a bridge's deck) can be walked on when it runs straight north, south, east or west
  if(!ph&&(def.kind==='dock'||def.kind==='bridge')&&def.walk!==false){
    const c=Math.cos(def.dir), s=Math.sin(def.dir);
    if(Math.abs(c)<0.01||Math.abs(s)<0.01){ const ex=def.x+c*118, ey=def.y+s*118, hw=26, wk={x0:Math.min(def.x,ex)-(Math.abs(s)>0.5?hw:0),x1:Math.max(def.x,ex)+(Math.abs(s)>0.5?hw:0),y0:Math.min(def.y,ey)-(Math.abs(c)>0.5?hw:0),y1:Math.max(def.y,ey)+(Math.abs(c)>0.5?hw:0)};
      const M=MAPS[k]; if(k>0&&M&&M.tz) M.tz.walkways.push(wk); else if(!k) WALKWAYS.push(wk); }
  }
  return lm;
}
function useCrossing(def){
  if(def.need&&!def.need()){ SFX.play('ui'); setBanner(def.name||def.label||'',def.locked||S('The way is shut for now.','It is shut.'),3); return; }
  if(G.inCombat||(G.boss&&!G.boss.dead)){ setBanner(def.name||def.label||'',S('You can’t travel while enemies are close.','Enemies are close!'),2.4); return; }
  if(def.onTravel) try{ def.onTravel(); }catch(e){}
  mapTravel(def.to.x,def.to.y,{banner:def.arrive});
}
// what travelTo does, for any point on any map: fade, move Ash, Pip, the companions and the goat, then save
function mapTravel(x,y,o){
  o=o||{};
  closeMap(true);
  if(AREA) exitArea(true);
  const s=typeof nearestLand==='function'?(nearestLand(x,y)||{x,y}):{x,y};
  player.x=s.x; player.y=s.y; player.kvx=player.kvy=0; player.iframes=1; player.flying=false; player.landing=false; player.gliding=false; player.z=0; player.vz=0;
  for(const e of G.enemies) if(!e.boss&&dist(e.x,e.y,player.x,player.y)<500) e.aggro=false;
  if(G.fightSite) resetBoss();
  if(G.pip){ G.pip.x=player.x-30; G.pip.y=player.y; } compsOnMove();
  if(G.goat&&G.side.duchess==='follow'){ G.goat.x=player.x-40; G.goat.y=player.y+30; }
  updateCam(0,true); G.chunkBurst=16; G.fade=1; SFX.play('shrine');
  mapTick(o.banner);
  if(!o.noSave) saveGame();
}
// the crossings that start on map k (for the map screen, routing and tests)
const XBY=[];
function crossingsOn(k){ return XBY[k]||ML_EMPTY; }
// where to point Ash for a target on another map: the nearest crossing on this map that starts the shortest route there
// (hidden crossings do not count; locked ones do, so the compass shows the way to the gate that still needs opening)
const xOpen=c=>!(c.hidden&&c.hidden());
const ROUTEC={t:-1,x:0,y:0,from:-1,c:null};
function mapRoute(tx,ty){
  const from=curMap(), to=mapAt(ty);
  if(from===to||tx>=IZX-50) return null;
  if(G&&ROUTEC.t===G.time&&ROUTEC.x===tx&&ROUTEC.y===ty&&ROUTEC.from===from) return ROUTEC.c;
  const c=mapRouteNow(from,to);
  if(G){ ROUTEC.t=G.time; ROUTEC.x=tx; ROUTEC.y=ty; ROUTEC.from=from; ROUTEC.c=c; }
  return c;
}
function mapRouteNow(from,to){
  const via=new Map([[from,null]]), q=[from];
  while(q.length&&!via.has(to)){ const m=q.shift(); for(const c of crossingsOn(m)){ if(!xOpen(c)) continue; const n=mapAt(c.to.y); if(via.has(n)) continue; via.set(n,m===from?c:via.get(m)); q.push(n); } }
  const c0=via.get(to); if(!c0) return null;
  const nxt=mapAt(c0.to.y), p=player; let best=c0, bd=dist2(p.x,p.y,c0.x,c0.y);
  for(const c of crossingsOn(from)) if(xOpen(c)&&mapAt(c.to.y)===nxt){ const d=dist2(p.x,p.y,c.x,c.y); if(d<bd){ bd=d; best=c; } }
  return best;
}
// the compass, minimap and quest line point at the crossing when the goal is on another map
function routeObj(o){
  if(!o||o.x==null||AREA) return o;
  const c=mapRoute(o.x,o.y); if(!c) return o;
  const M=MAPS[mapAt(o.y)];
  return Object.assign({},o,{x:c.x,y:c.y,via:c.id,text:o.text+(M?simplify(` (${M.name}: ${c.name||c.label})`):'')});
}
{ const base=questObjective; questObjective=function(){ return routeObj(base()); }; }
{ const base=focusObjective; focusObjective=function(){ return routeObj(base()); }; }
// ---------- crossing art (cached sprites, a little live sparkle on top)
function drawCrossing(def,t){
  const x=def.x, y=def.y, a=def.dir, k=def.kind, key='xing_'+k+'_'+Math.round(a*10);
  if(k==='dock'){
    const sp=rSpr(key,260,260,130,130,g=>{ g.rotate(a-Math.PI/2);
      g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-26,6,56,120);
      g.fillStyle='#6a4a2c'; g.fillRect(-28,-10,56,128);
      for(let i=0;i<16;i++){ g.fillStyle=i%2?'#86603a':'#7a5634'; g.fillRect(-28,-10+i*8,56,7); }
      g.fillStyle='#3a2614'; g.fillRect(-31,-10,5,128); g.fillRect(26,-10,5,128);
      for(const yy of [0,40,80,114]) for(const xx of [-30,30]){ g.fillStyle='#2a1a0c'; g.beginPath(); g.arc(xx,yy,5,0,TAU); g.fill(); g.fillStyle='#5a3e24'; g.beginPath(); g.arc(xx,yy,3,0,TAU); g.fill(); }
      g.strokeStyle='#c8b080'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-30,114); g.quadraticCurveTo(-46,128,-40,140); g.stroke(); });
    rPut(sp,x,y);
    const bx=x+Math.cos(a)*122, by=y+Math.sin(a)*122+Math.sin(t*1.6)*1.5;
    ctx.save(); ctx.translate(bx,by); ctx.rotate(a+Math.sin(t*1.1)*0.04);
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(3,5,34,12,0,0,TAU); ctx.fill();
    ctx.fillStyle='#5a3a20'; ctx.beginPath(); ctx.ellipse(0,0,34,12,0,0,TAU); ctx.fill(); ctx.fillStyle='#8a6038'; ctx.beginPath(); ctx.ellipse(0,-1,29,8.5,0,0,TAU); ctx.fill();
    ctx.fillStyle='#3a2614'; ctx.fillRect(-2,-26,3,26); ctx.fillStyle='#efe6d0'; ctx.beginPath(); ctx.moveTo(1,-25); ctx.lineTo(17,-6); ctx.lineTo(1,-6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }else if(k==='stair'){
    // steps running off along `dir`: going up they brighten toward the far end, going down they sink into the dark
    const down=def.down!=null?!!def.down:/down|crawl|descend/i.test(String(def.label||'')), key2=key+(down?'_d':'_u');
    const sp=rSpr(key2,200,220,100,120,g=>{ g.rotate(a+Math.PI/2);
      g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(-44,-54,92,110);
      for(let i=0;i<7;i++){ const u=i/6, w=70-i*3, yy=40-i*14, lit=down?1-u*0.85:0.35+u*0.65;
        g.fillStyle=stC('#3a342e','#6e665c',lit); g.fillRect(-w/2,yy+8,w,6);
        g.fillStyle=stC('#4a443c','#d0c8b8',lit); g.fillRect(-w/2,yy,w,8.5);
        g.fillStyle=`rgba(255,250,235,${0.15+0.4*lit})`; g.fillRect(-w/2,yy+7,w,1.6); g.fillStyle='rgba(20,16,12,.35)'; g.fillRect(-w/2,yy+8.6,w,1.4); }
      for(const sx of [-1,1]){ g.fillStyle='#7d6d5c'; g.fillRect(sx*40-6,-56,12,108); g.fillStyle='#958a7c'; g.fillRect(sx*40-6,-56,12,6); g.fillStyle='rgba(255,250,235,.25)'; g.fillRect(sx*40-6,-56,2,108); }
      g.strokeStyle='rgba(40,36,30,.6)'; g.lineWidth=1.4; g.strokeRect(-46,-56,92,108); });
    rPut(sp,x,y);
  }else if(k==='bridge'){
    const sp=rSpr(key,260,260,130,130,g=>{ g.rotate(a-Math.PI/2);
      g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-30,0,64,130);
      const gr=g.createLinearGradient(-30,0,30,0); gr.addColorStop(0,'#3a3060'); gr.addColorStop(0.5,'#8a7ad8'); gr.addColorStop(1,'#3a3060'); g.fillStyle=gr; g.fillRect(-30,-6,60,132);
      g.strokeStyle='rgba(220,210,255,.7)'; g.lineWidth=2; for(let i=0;i<9;i++){ g.beginPath(); g.moveTo(-30,i*15); g.lineTo(30,i*15); g.stroke(); }
      g.fillStyle='#2a2440'; g.fillRect(-36,-8,8,136); g.fillRect(28,-8,8,136); });
    rPut(sp,x,y);
    const n=0.5+0.5*Math.sin(t*2); glowAt(x+Math.cos(a)*60,y+Math.sin(a)*60,70,'170,150,255',0.25+0.2*n);
  }
  // the signpost (every kind has one, so the way is easy to spot)
  const sp=rSpr('xing_post',90,110,45,92,g=>{
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4,2,14,5,0,0,TAU); g.fill();
    g.fillStyle='#4a3020'; g.fillRect(-3,-80,6,82); g.fillStyle='#62442a'; g.fillRect(-3,-80,2,82);
    g.fillStyle='#b8894e'; g.beginPath(); g.moveTo(-26,-74); g.lineTo(20,-74); g.lineTo(30,-64); g.lineTo(20,-54); g.lineTo(-26,-54); g.closePath(); g.fill();
    g.strokeStyle='#4a3020'; g.lineWidth=2; g.stroke();
    g.fillStyle='#a8794a'; g.beginPath(); g.moveTo(24,-46); g.lineTo(-22,-46); g.lineTo(-32,-37); g.lineTo(-22,-28); g.lineTo(24,-28); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#3a2614'; for(let i=0;i<4;i++) g.fillRect(-18+i*10,-66,6,3); for(let i=0;i<3;i++) g.fillRect(-12+i*10,-39,6,3);
    for(const [sx,sy,r] of [[-14,-2,7],[12,0,6],[-2,4,8]]){ g.fillStyle='#8e8c86'; g.beginPath(); g.arc(sx,sy,r,0,TAU); g.fill(); g.fillStyle='rgba(255,250,235,.25)'; g.beginPath(); g.arc(sx-2,sy-2,r*0.5,0,TAU); g.fill(); } });
  rPut(sp,x-30,y-6);
  const near=player&&dist2(player.x,player.y,x,y)<260*260;
  if(near) glowAt(x-30,y-70,26,'255,210,140',0.18+0.12*Math.sin(t*3));
}

// ---------- map changes: discovery, banners, freeing the props and house art of other maps
function mapTick(banner){
  if(!G||!player||(G.mode!=='story'&&G.mode!=='normal')) return;
  MAPST.frame++;
  const k=curMap(); let fresh=false;
  if(G.mapsSeen&&!G.mapsSeen[k]){ G.mapsSeen[k]=true; fresh=true; if(scene==='map') mapTabsSync(); }
  if(k!==MAPST.cur){ const old=MAPST.cur; MAPST.cur=k; mapChanged(old,k,banner||(fresh?S('A new land!','A new land!'):'')); }
}
function mapChanged(old,k,banner){
  mapEvict(k);
  // camps and their foes stay with their own map
  for(const c of CAMPS){ const st=G.campState[c.id]; if(st&&st.active&&itemMap(c)!==k){ for(const e of G.enemies) if(e.camp===st) e.dead=true; st.active=false; } }
  for(const e of G.enemies) if(!e.boss&&!e.inArea&&!e.dead&&itemMap(e)>=0&&itemMap(e)!==k) e.dead=true;
  const M=MAPS[k]; if(!M) return;
  if(G.mode==='story'&&(scene==='play'||scene==='map')) setBanner(M.name,banner||'',2.6,'region');
  G.region=null; G.regionT=0;
  if(M.onEnter) try{ M.onEnter(old); }catch(e){ console.error(e); }
}
// props regenerate the same from their seed, so the chunks of other maps are dropped (with their colliders)
function mapEvict(keep){
  let n=0;
  for(const [key,arr] of PROPS){
    const cy=((key%1000)+1000)%1000; if(mapAt(cy*CH+CH/2)===keep) continue;
    for(const p of arr) if(p.col) removeCol(p.col);
    PROPS.delete(key); n++;
  }
  for(const hs of [...SCACHE.keys()]) if(hs&&typeof hs==='object'&&itemMap(hs)!==keep&&itemMap(hs)>=0) SCACHE.delete(hs);
  MAPST.evicted=(MAPST.evicted||0)+n;
  return n;
}
{ const base=update; update=function(dt){ mapTick(); return base(dt); }; }

// ---------- saves: fog for every map (bit packed), the maps Ash has found
{ const base=newRun; newRun=function(mode){ base(mode); G.mapsSeen={0:true}; G.mapLeg={}; MAPST.cur=curMap(); }; }
{ const base=saveData; saveData=function(){
  const s=base(), fm={};
  for(const M of MAPS) if(M&&M.k>0&&M.fogBits&&M.fogBits.indexOf(1)>=0) fm[M.k]=fogPack(M.fogBits);
  s.fogM=fm; s.maps=Object.assign({},G.mapsSeen||{0:true}); s.mapLeg=Object.assign({},G.mapLeg||{});
  return s;
}; }
{ const base=loadGame; loadGame=function(s){
  base(s);
  if(s.fogM) for(const k in s.fogM){ const F=fogOf(+k); if(F) fogUnpack(s.fogM[k],F.bits); }
  G.mapsSeen=Object.assign({0:true},s.maps||{}); G.mapLeg=Object.assign({},s.mapLeg||{});
  const k=mapAt(s.y||0); if(s.x<IZX-50) G.mapsSeen[k]=true;
}; }

// ---------- debug hooks
window.__ebX=Object.assign(window.__ebX||{},{
  MAPS, BAND, CROSSINGS, mapAt, curMap, outOfMap, clampMap, mapList, itemMap, fogOf, fogSeen, ovOf, mapFit, mapRoute, crossingsOn, mapEvict,
  mapsDebug(on){ MAPST.debug=on==null?!MAPST.debug:!!on; return MAPST.debug; },
  goMap(k,x,y){ const M=MAPS[k]; if(!M) return false; let p=x!=null?{x,y}:M.spawn;
    if(!p){ const sh=mapList(SHRINES,k)[0]; p=sh?{x:sh.x+40,y:sh.y+50}:{x:M.w/2,y:M.y0+M.h/2}; }
    G.mapsSeen=G.mapsSeen||{}; G.mapsSeen[k]=true; mapTravel(p.x,p.y,{noSave:true}); return {k,x:player.x,y:player.y}; },
  useCrossing(id){ const c=XBY.flat().find(q=>q&&q.id===id); if(c) useCrossing(c); return !!c; },
  mapView, mapViewStep, MAPUI, defineCrossing, defineMap, questObj:()=>questObjective(), routeOf:(x,y)=>{ const c=mapRoute(x,y); return c?c.id:null; },
  mapInfo(){ const byMap=(m,key)=>{ let n=0; for(const kk of m.keys()) if(mapAt((((kk%1000)+1000)%1000)*CH+CH/2)===key) n++; return n; };
    return {cur:curMap(),built:MAPST.built,seen:Object.assign({},G&&G.mapsSeen||{}),props:PROPS.size,grid:GRID.size,evicted:MAPST.evicted||0,scache:SCACHE.size,
    maps:MAPS.filter(Boolean).map(M=>({k:M.k,id:M.id,name:M.name,y0:M.y0,w:M.w,h:M.h,placeholder:!!M.placeholder,ovRows:(ovOf(M.k)||{}).row,ovDone:!!(ovOf(M.k)||{}).done,
      chunks:byMap(CHUNKS,M.k),propChunks:byMap(PROPS,M.k),propsN:[...PROPS].filter(([kk])=>mapAt((((kk%1000)+1000)%1000)*CH+CH/2)===M.k).reduce((a,[,v])=>a+v.length,0),
      fogSeen:(()=>{ const F=fogOf(M.k); let n=0; if(F&&F.bits) for(const b of F.bits) n+=b; return n; })(),shrines:mapList(SHRINES,M.k).length,chests:mapList(CHESTS,M.k).length,
      camps:mapList(CAMPS,M.k).length,houses:mapList(HOUSES,M.k).length,landmarks:mapList(LANDMARKS,M.k).length,crossings:crossingsOn(M.k).map(c=>c.id)}))}; },
  bench(n){ n=n||60; const now=window.__realNow||(()=>performance.now()); let t0=now(); for(let i=0;i<n;i++) render(); const r=(now()-t0)/n; t0=now(); for(let i=0;i<n;i++) update(1/60); const u=(now()-t0)/n; return {render:r,update:u}; },
  benchT(n){ n=n||200000; const now=window.__realNow||(()=>performance.now()); const o={}; let t0=now(), s=0; for(let i=0;i<n;i++){ T((i*37)%14000,(i*53)%11000,o); s+=o.b; } const t=(now()-t0)/n*1000; t0=now(); for(let i=0;i<n;i++){ if(blockedAt((i*37)%14000,(i*53)%11000)) s++; } return {T_us:t,blocked_us:(now()-t0)/n*1000,s}; },
  benchTy(n,y0){ n=n||200000; const now=window.__realNow||(()=>performance.now()); const o={}; let t0=now(), s=0; for(let i=0;i<n;i++){ T((i*37)%14000,y0+(i*53)%11000,o); s+=o.b; } const t=(now()-t0)/n*1000; t0=now(); for(let i=0;i<n;i++){ if(blockedAt((i*37)%14000,y0+(i*53)%11000)) s++; } return {T_us:t,blocked_us:(now()-t0)/n*1000,s}; },
  benchChunk(n,cy0){ n=n||20; cy0=cy0||10; const now=window.__realNow||(()=>performance.now()); let t0=now(); for(let i=0;i<n;i++) genChunk(5+i%10,cy0+(i>>3)); const c=(now()-t0)/n; t0=now(); for(let i=0;i<n;i++){ genProps(3+i%12,cy0-2+(i%5)); } return {chunk_ms:c,props_ms:(now()-t0)/n}; }
});

// ================= placeholder maps 1 to 4 (wave 2 replaces each one by calling defineMap(k,{...}) again)
// One placeholder biome each (10, 20, 30, 40, defined in e2_terrain.js), a road, water, a test shrine and test crossings.
// The crossings that start in Embermere only show with __eb.mapsDebug(true), so a shipped game never offers a placeholder.
const PH_DBG=()=>!MAPST.debug;
defineMap(1,{id:'coast',name:'Clockwork Coast',placeholder:true,music:'meadow',spawn:{x:7000,y:20700},
  ambient:{wind:0.5,birds:true},
  terrain:{seeds:[[3000,23000,10],[10500,23500,10],[7000,26500,10],[2500,28000,10],[11500,28500,10]],
    roads:[[[7000,20300],[7100,22000],[6800,24000],[7000,26000],[7400,27600],[7400,28200]],[[6800,24000],[4800,24600],[3000,25400]]],
    rivers:[{pts:[[1200,21500],[2600,23000],[3400,24800],[3600,26600],[3300,28400]],w:56}],
    sea:{land:[[-200,19800],[14200,19800],[14200,28200],[12000,28900],[9600,28600],[7600,28300],[5600,28900],[3200,29300],[1200,28800],[-200,29000]]}},
  build(B){
    B.shrine({id:'s_pm1',x:7350,y:21300,name:'Test Shrine (Coast)'});
    B.poi('pm_port',{x:6900,y:23400,r:420,name:'Placeholder Port',level:9,town:true});
    B.town('pm_port',{name:'Placeholder Port',music:'town',hz:(hs,L)=>({wc:'#e8dcc0',rc:'#4a6a8a'})});
    B.houses(6900,23400,4,220,420,{town:'pm_port',seed:4201,roofs:['#4a6a8a','#5c6470']});
    B.camp({id:'pm1_camp',x:10200,y:24600,units:[['kobold',3]]});
    B.sign('pm1_sign',7180,20620,'PLACEHOLDER: the Clockwork Coast is built in wave 2.');
  },
  crossings:[
    {id:'pm_pass_0',x:3350,y:10800,to:{x:7000,y:20560},label:'Take the Southern Pass (test)',name:'The Southern Pass',kind:'pass',hidden:PH_DBG,placeholder:true},
    {id:'pm_pass_1',x:7000,y:20330,to:{x:3350,y:10640},label:'Climb back to Embermere',name:'The Southern Pass',kind:'pass'},
    {id:'pm_dock_1',x:7400,y:28290,to:{x:3330,y:60760},label:'Sail east to Moonfall (test)',name:'Gearhaven Dock',kind:'dock',dir:Math.PI/2}
  ]});
defineMap(2,{id:'frost',name:'Frostreach',placeholder:true,music:'frost',spawn:{x:7000,y:50400},
  ambient:{snow:1,wind:0.6},
  terrain:{seeds:[[3000,43000,20],[10000,43500,20],[7000,47500,20],[3500,49000,20],[11000,49500,20]],
    roads:[[[7000,50700],[7200,48800],[6600,46800],[7000,44200],[7600,41500]]],
    lakes:[{x:9200,y:46200,r:700}]},
  build(B){
    B.shrine({id:'s_pm2',x:7350,y:49600,name:'Test Shrine (Frost)'});
    B.sign('pm2_sign',7200,50300,'PLACEHOLDER: Frostreach is built in wave 2.');
  },
  crossings:[
    {id:'pm_stair_0',x:950,y:3250,to:{x:7000,y:50450},label:'Climb the high pass (test)',name:'The High Pass',kind:'stair',hidden:PH_DBG,dir:-Math.PI/2,placeholder:true},
    {id:'pm_stair_2',x:7000,y:50720,to:{x:950,y:3400},label:'Go down to Embermere',name:'The High Pass',kind:'stair',dir:Math.PI/2}
  ]});
defineMap(3,{id:'moon',name:'Moonfall',placeholder:true,music:'night',spawn:{x:4200,y:61000},
  ambient:{wind:0.3,night:0.1},
  terrain:{seeds:[[3000,63000,30],[9000,62000,30],[11500,66500,30],[8000,69000,30]],
    roads:[[[3300,60720],[4200,60900],[6500,63000],[9000,65000],[12600,65400]]],
    sea:{land:[[3400,59800],[14200,59800],[14200,71200],[3400,71200],[2800,68000],[4300,65000],[2600,62600]]},
    isles:[{x:1500,y:64000,r:260}]},
  build(B){
    B.shrine({id:'s_pm3',x:4700,y:61300,name:'Test Shrine (Moonfall)'});
    B.sign('pm3_sign',4400,60700,'PLACEHOLDER: Moonfall is built in wave 2.');
  },
  crossings:[
    {id:'pm_dock_3',x:3190,y:60700,to:{x:7400,y:28150},label:'Sail back to the Coast',name:'Moonfall Dock',kind:'dock',dir:Math.PI},
    {id:'pm_bridge_3',x:12800,y:65400,to:{x:4500,y:90300},label:'Cross the moonfire bridge (test)',name:'The Moonfire Bridge',kind:'bridge',dir:0}
  ]});
defineMap(4,{id:'nightfall',name:'Nightfall Peak',placeholder:true,music:'night',w:9000,h:11000,spawn:{x:4500,y:90200},
  ambient:{embers:0.6,night:0.15,wind:0.4},sky:{tint:'#8a70c8',k:0.18},
  terrain:{seeds:[[2500,82500,40],[6500,83500,40],[4500,87500,40]],
    roads:[[[4500,90600],[4300,88000],[4700,85500],[4500,82600]]],
    lavaFields:[{x:2200,y:85500,r:520},{x:6900,y:86600,r:420}],
    lava:[{pts:[[600,88500],[2200,88200],[3600,88900],[5600,88500]],w:44}]},
  build(B){
    B.shrine({id:'s_pm4',x:4850,y:89700,name:'Test Shrine (Nightfall)'});
    B.sign('pm4_sign',4700,90400,'PLACEHOLDER: Nightfall Peak is built in wave 2.');
  },
  crossings:[
    {id:'pm_bridge_4',x:4500,y:90750,to:{x:12600,y:65400},label:'Cross back to Moonfall',name:'The Moonfire Bridge',kind:'bridge',dir:Math.PI/2}
  ]});
window.__ebDbg=Object.assign(window.__ebDbg||{},{mapZ:{MAPZ,zm:()=>JSON.parse(JSON.stringify(MAPUI.zm,(k,v)=>k==='f'?undefined:v)),zoomOf:k=>mapZoomOf(k),zmax:k=>mapZMax(k==null?MAPUI.view:k),fit:k=>{ const F=mapFit(k==null?MAPUI.view:k); return {s:F.s,ox:F.ox,oy:F.oy,w:F.w,h:F.h,cw:F.cw,ch:F.ch,y0:F.y0}; },
  inv:(x,y)=>mapInv(x,y),btn:d=>mapZBtn(d),pan:(dx,dy)=>mapPan(dx,dy),pad:(s,dt)=>{ const r=document.getElementById('mapov'); return padMenu(r,s,dt||0.016); },open:()=>openMap(),sel:()=>mapSel?mapSel.id:null,
  draw:()=>drawMapScreen(),centre:(x,y,z)=>mapZCentre(x,y,z)},
  // (v12) the sharp map: its state, its knobs, and how far a tile built the cheap way is from one sampled everywhere
  mapHD:{MHD,state:()=>{ let ready=0; for(const t of MHD.tiles.values()) if(t.ready) ready++; return {lvl:MHD.lvl,want:MHD.want.length,tiles:MHD.tiles.size,ready,stats:Object.assign({},MHD.stats),fog:Object.keys(MHD.fog).map(k=>k+(MHD.fog[k].built?' built':'')),legend:Object.assign({},G&&G.mapLeg||{})}; },
    clear:()=>{ MHD.tiles.clear(); MHD.want.length=0; MHD.fog={}; MHD.fogWant=null; MHD.stats={built:0,px:0,full:0,ms:0,fogPx:0}; },
    // the 4 px fog of map k as it is now (built once, then patched as Ash explored) against one built from scratch
    fogCheck(k){ k=k||0; const L=MHD.fog[k+':4']; if(!L||!mapHdFogReady(L)) return null; const a=L.cv.getContext('2d').getImageData(0,0,L.cv.width,L.cv.height).data;
      const T2={k,sub:4,cv:mkCanvas(L.cv.width,L.cv.height),w:L.w,h:L.h,cs:L.cs,built:false,job:null}; mapHdFogJob(T2,1e18); const b=T2.cv.getContext('2d').getImageData(0,0,L.cv.width,L.cv.height).data;
      let mx=0, n=0; for(let i=3;i<a.length;i+=4){ const e=Math.abs(a[i]-b[i]); if(e>mx) mx=e; if(e>2) n++; } return {max:mx,off:n,part:MHD.stats.fogPart||0}; },
    reveal:(x,y,r)=>fogReveal(x,y,r),
    fogLayers:()=>Object.keys(MHD.fog).map(k=>{ const L=MHD.fog[k]; return {key:k,built:L.built,sb:L.sb,job:!!L.job,dirty:L.dirty}; }),
    err(k,L,tx,ty){ const one=full=>{ const was=MHD.full; MHD.full=full; const M=MAPS[k]||MAPS[0], sp=25/(1<<L), span=MHD.N*sp, t={key:'test',k,L,tx,ty,sp,x0:tx*span,y0:M.y0+ty*span,span,row:0,ready:false,cv:null,img:null,fl:null,gen:mhdGen()}; const t0=mhdNow(); mapHdStep(t,1e18); MHD.full=was; if(!t.ready) return null; return {d:t.cv.getContext('2d').getImageData(0,0,MHD.N,MHD.N).data,ms:mhdNow()-t0,n:t.nFlag}; };
      const a=one(false), b=a&&one(true); if(!b) return null; let sum=0, mx=0, big=0; for(let i=0;i<a.d.length;i+=4) for(let q=0;q<3;q++){ const e=Math.abs(a.d[i+q]-b.d[i+q]); sum+=e; if(e>mx) mx=e; if(e>24) big++; }
      return {mean:sum/(a.d.length*0.75),max:mx,big,flagged:a.n,msCheap:a.ms,msFull:b.ms}; },
    benchPix(n){ n=n||20000; const E=mapHdElv(0), eg=E&&E.G, px=[0,0,0], t0=mhdNow(); for(let i=0;i<n;i++){ const x=2000+(i*37)%9000, y=3200+(i*53)%7000; mapHdPix(0,x,y,E,eg,eg?E.paths.filter(p=>y>=p.bb[1]&&y<=p.bb[3]):ML_EMPTY,px); } const a=(mhdNow()-t0)/n*1000; const t1=mhdNow(), o={}; for(let i=0;i<n;i++){ T(2000+(i*37)%9000,3200+(i*53)%7000,o); } const b=(mhdNow()-t1)/n*1000; const t2=mhdNow(); for(let i=0;i<n;i++){ const x=2000+(i*37)%9000, y=3200+(i*53)%7000; T(x,y,o); groundRGB(o,x,y); } return {pix_us:a,T_us:b,Tg_us:(mhdNow()-t2)/n*1000,paths:E?E.paths.length:0}; }}});
