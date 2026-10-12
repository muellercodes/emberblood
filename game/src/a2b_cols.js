// ================= colliders (spatial grid)
const GRID=new Map(), GC=128;
const gkey=(cx,cy)=>cx*4096+cy;
function addCol(c){
  const x0=c.t==='c'?c.x-c.r:c.x0, x1=c.t==='c'?c.x+c.r:c.x1, y0=c.t==='c'?c.y-c.r:c.y0, y1=c.t==='c'?c.y+c.r:c.y1;
  for(let cx=Math.floor(x0/GC);cx<=Math.floor(x1/GC);cx++) for(let cy=Math.floor(y0/GC);cy<=Math.floor(y1/GC);cy++){
    const k=gkey(cx,cy); let a=GRID.get(k); if(!a){ a=[]; GRID.set(k,a); } a.push(c);
  }
  return c;
}
function forCols(x,y,r,fn){
  const c0=Math.floor((x-r)/GC), c1=Math.floor((x+r)/GC), r0=Math.floor((y-r)/GC), r1=Math.floor((y+r)/GC);
  for(let cx=c0;cx<=c1;cx++) for(let cy=r0;cy<=r1;cy++){ const a=GRID.get(gkey(cx,cy)); if(a) for(const c of a) fn(c); }
}
const colActive=c=>!c.off&&(!c.normalOnly||(G&&G.mode==='normal'));
function collideObs(e){
  // Ash in the air: a jump clears colliders marked low (fences, hedges, small rocks); flight clears everything on the valley floor
  const pl=e===player&&!!player, air=pl&&airborne();
  if(pl&&player.flying&&e.x<IZX-100) return;
  forCols(e.x,e.y,e.r+4,c=>{
    if(!colActive(c)) return;
    if(air&&c.low) return;
    if(c.t==='c'){
      const dx=e.x-c.x, dy=e.y-c.y, m=c.r+e.r, d2=dx*dx+dy*dy;
      if(d2<m*m){ const d=Math.sqrt(d2)||0.01; e.x=c.x+dx/d*m; e.y=c.y+dy/d*m; e.hitWall=true; }
    }else{
      const px=clamp(e.x,c.x0,c.x1), py=clamp(e.y,c.y0,c.y1), dx=e.x-px, dy=e.y-py, d2=dx*dx+dy*dy;
      if(d2<e.r*e.r){
        if(d2>0.0001){ const d=Math.sqrt(d2); e.x=px+dx/d*e.r; e.y=py+dy/d*e.r; }
        else{ const l=e.x-c.x0, r=c.x1-e.x, t=e.y-c.y0, b=c.y1-e.y, m=Math.min(l,r,t,b); if(m===l) e.x=c.x0-e.r; else if(m===r) e.x=c.x1+e.r; else if(m===t) e.y=c.y0-e.r; else e.y=c.y1+e.r; }
        e.hitWall=true;
      }
    }
  });
}
function colAt(x,y,r){ let hit=false; forCols(x,y,r,c=>{ if(hit||!colActive(c)||c.noProj) return; if(c.t==='c'){ if(dist2(x,y,c.x,c.y)<(c.r+r)**2) hit=true; } else if(x>c.x0-r&&x<c.x1+r&&y>c.y0-r&&y<c.y1+r) hit=true; }); return hit; }
function boundE(e){
  if(AREA&&e.x>=IZX-100){ const m=e.r+2; if(e.x<AREA.x0+m){e.x=AREA.x0+m;e.hitWall=true;} if(e.x>AREA.x1-m){e.x=AREA.x1-m;e.hitWall=true;} if(e.y<AREA.y0+m){e.y=AREA.y0+m;e.hitWall=true;} if(e.y>AREA.y1-m){e.y=AREA.y1-m;e.hitWall=true;} return; }
  const m=e.r+30, M=mapOfY(e.y), y0=M.y0, y1=M.y0+M.h;
  if(e.x<m){e.x=m;e.hitWall=true;} if(e.x>M.w-m){e.x=M.w-m;e.hitWall=true;}
  if(e.y<y0+m){e.y=y0+m;e.hitWall=true;} if(e.y>y1-m){e.y=y1-m;e.hitWall=true;}
  if(G&&G.arena){ const A=G.arena, d=dist(e.x,e.y,A.x,A.y), lim=A.r-e.r; if(d>lim){ const a=angTo(A.x,A.y,e.x,e.y); e.x=A.x+Math.cos(a)*lim; e.y=A.y+Math.sin(a)*lim; e.hitWall=true; } }
}
// move with terrain blocking (water, lava) for walkers
function terrainFix(e,ox,oy){
  if(e===player&&player){
    // Ash only: water stops blocking with stride, and nothing blocks in the air (see playerBlocked in a6c_moves.js)
    if(!playerBlocked(e.x,e.y)) return;
    if(!playerBlocked(e.x,oy)){ e.y=oy; } else if(!playerBlocked(ox,e.y)){ e.x=ox; } else { e.x=ox; e.y=oy; }
    e.hitWall=true; return;
  }
  if(e.noClip||(e.flying&&!e.inArea)) return;
  if(!blockedAt(e.x,e.y)) return;
  if(!blockedAt(e.x,oy)){ e.y=oy; }
  else if(!blockedAt(ox,e.y)){ e.x=ox; }
  else { e.x=ox; e.y=oy; }
  e.hitWall=true;
}

