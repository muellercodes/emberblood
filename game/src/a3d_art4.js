// ================= dungeon art: Ember's Trials (floors and walls, live floor effects, puzzle pieces, the guardians, the gates outside)
// Light falls from the upper left, like everywhere else. Static floor art is painted once into the cave canvas (renderCaveRooms);
// moving things (water, crumbling tiles, spikes, wind, boss effects) are drawn live by drawTrialFloor.
const TPAL={
  leap:{tile:['#55603e','#4c5838','#5a6442','#4a5236'],grout:'rgba(30,36,20,.55)',moss:'110,150,60',rune:'190,240,120',hole:'#070806',lip:['#4a4430','#1a160e'],water:'#1e4a44',root:'#5a3e24'},
  tide:{tile:['#6c96ae','#628ca4','#7aa2b8','#5c86a0'],grout:'rgba(220,240,250,.28)',moss:'120,200,190',rune:'130,215,255',hole:'#05080c',lip:['#3e5a6a','#101820'],water:'#1a4f78',root:'#3a6a6a'},
  sky:{tile:['#e8e1d0','#dfd7c4','#ece6d8','#d8d0bc'],grout:'rgba(160,130,80,.35)',moss:'255,220,140',rune:'255,214,120',hole:'#0a0c12',lip:['#d8c8a0','#7a6a48'],water:'#3a6aa8',root:'#c8a860'}
};
function tpKind(c,i,j){ if(i<0||j<0||i>=c.w||j>=c.h) return 'wall'; const k=j*c.w+i; if(c.grid[k]===1) return c.typ[k]===1?'pool':'wall'; const t=c.typ[k]; if(t===TY.pit||t===TY.crumble) return 'hole'; if(t===TY.chasm) return 'sky'; if(t===TY.deep||t===TY.current||t===TY.stones) return 'deep'; return 'floor'; }
// one cell of the static cave canvas (returns true when it painted the cell)
function trialPaintCell(g,c,k,i,j,x,y,cs,st,rng,def){
  const th=def.theme, P=TPAL[th]; if(!P) return false;
  const t=c.typ[k], kind=tpKind(c,i,j), up=tpKind(c,i,j-1), lf=tpKind(c,i-1,j), rt=tpKind(c,i+1,j), dn=tpKind(c,i,j+1);
  if(kind==='hole'){
    const n=fbm(x*0.01,y*0.01,2); g.fillStyle=r2c(P.hole,0.04+n*0.05); g.fillRect(x,y,cs,cs);
    if(up==='floor'){ // the cliff face of the floor above, falling away into the dark
      const fh=cs*0.72, gr=g.createLinearGradient(0,y,0,y+fh); gr.addColorStop(0,r2c(P.lip[0],0.12)); gr.addColorStop(0.45,P.lip[0]); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,fh);
      g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(x,y+fh*0.3,cs,1.6); g.fillRect(x+((i%2)?cs*0.3:cs*0.7),y,1.6,fh*0.3); g.fillRect(x+((i%2)?cs*0.65:cs*0.2),y+fh*0.3,1.6,fh*0.3);
      g.fillStyle='rgba(255,240,210,.18)'; g.fillRect(x,y,cs,2);
      if(th==='leap') for(let q=0;q<3;q++){ const rx=x+4+rng()*(cs-8); g.strokeStyle=q%2?P.root:'#3e5a24'; g.lineWidth=2.6-q*0.6; g.beginPath(); g.moveTo(rx,y); g.quadraticCurveTo(rx+rng()*10-5,y+cs*0.4,rx+rng()*12-6,y+cs*(0.6+rng()*0.5)); g.stroke(); }
    } else if(up==='wall'){ const gr=g.createLinearGradient(0,y,0,y+cs*0.6); gr.addColorStop(0,'rgba(20,16,10,.9)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.6); }
    if(lf==='floor'){ const gr=g.createLinearGradient(x,0,x+cs*0.3,0); gr.addColorStop(0,'rgba(0,0,0,.55)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs*0.3,cs); }
    if(rt==='floor'){ const gr=g.createLinearGradient(x+cs,0,x+cs*0.75,0); gr.addColorStop(0,'rgba(255,240,210,.06)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x+cs*0.75,y,cs*0.25,cs); }
    for(let q=0;q<4;q++){ g.fillStyle=`rgba(${P.moss},${0.04+rng()*0.08})`; g.fillRect(x+rng()*cs,y+cs*0.4+rng()*cs*0.6,1.5,1.5); }
    if(t===TY.crumble){ g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x,y,cs,cs); }
    return true;
  }
  if(kind==='sky'){
    g.save(); g.beginPath(); g.rect(x,y,cs,cs); g.clip();
    const gr=g.createLinearGradient(0,y,0,y+cs); const yy=(y/cs)%24/24, c0=[118+yy*20,168+yy*16,226+yy*8]; gr.addColorStop(0,`rgb(${c0.map(v=>v|0)})`); gr.addColorStop(1,`rgb(${c0.map((v,q)=>(v+[3,2,1][q])|0)})`); g.fillStyle=`rgb(${c0.map(v=>v|0)})`; g.fillRect(x,y,cs,cs);
    // big soft clouds on a fixed lattice, so neighbouring cells join up
    const L=150, li=Math.floor(x/L), lj=Math.floor(y/L);
    for(let a=li-1;a<=li+1;a++) for(let b=lj-1;b<=lj+1;b++){ const h=((a*73856093)^(b*19349663))>>>0, cx=a*L+(h%97)/97*L, cy=b*L+((h>>8)%89)/89*L, r=50+((h>>16)%40);
      for(let q=0;q<4;q++){ const qx=cx+((h>>(q*3))%60)-30, qy=cy+((h>>(q*4))%26)-13, qr=r*(0.55+q*0.12); const cg=g.createRadialGradient(qx,qy,qr*0.2,qx,qy,qr); cg.addColorStop(0,'rgba(255,255,255,.5)'); cg.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=cg; g.beginPath(); g.ellipse(qx,qy,qr*1.4,qr*0.7,0,0,TAU); g.fill(); } }
    g.restore();
    if(up!=='sky'&&up!=='hole'){ const gr=g.createLinearGradient(0,y,0,y+cs*0.7); gr.addColorStop(0,P.lip[0]); gr.addColorStop(0.55,P.lip[1]); gr.addColorStop(1,'rgba(120,160,220,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.7); g.fillStyle='rgba(255,226,140,.85)'; g.fillRect(x,y,cs,2.5); for(let q=0;q<3;q++){ g.fillStyle='rgba(90,70,40,.35)'; g.fillRect(x+rng()*cs,y+4,1.6,cs*0.3*rng()); } }
    if(lf!=='sky'&&lf!=='hole'){ g.fillStyle='rgba(60,50,30,.25)'; g.fillRect(x,y,3,cs); }
    if(rt!=='sky'&&rt!=='hole'){ g.fillStyle='rgba(60,50,30,.25)'; g.fillRect(x+cs-3,y,3,cs); }
    return true;
  }
  if(kind==='deep'){
    const n=fbm(x*0.006,y*0.006,2);
    g.fillStyle=r2c(P.water,-0.12+n*0.15); g.fillRect(x,y,cs,cs);
    const rim=(a,dx0,dy0,w0,h0)=>{ if(a==='floor'||a==='wall'){ g.fillStyle='rgba(150,220,240,.22)'; g.fillRect(x+dx0,y+dy0,w0,h0); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x+dx0+(w0>4?0:0),y+dy0,w0>4?w0:2,h0>4?h0:2); } };
    rim(up,0,0,cs,7); rim(lf,0,0,7,cs); rim(rt,cs-7,0,7,cs); rim(dn,0,cs-7,cs,7);
    g.strokeStyle='rgba(255,255,255,.07)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+4,y+cs*0.35+rng()*8); g.quadraticCurveTo(x+cs/2,y+cs*0.25,x+cs-4,y+cs*0.4); g.stroke();
    if(up==='floor'||up==='wall'){ const gr=g.createLinearGradient(0,y,0,y+cs*0.4); gr.addColorStop(0,'rgba(0,0,0,.35)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.4); }
    return true;
  }
  // floors: tiles, mosaics, marble
  const tl=P.tile[((i*3+j*5)^(i>>1))&3];
  g.fillStyle=t===TY.basin?r2c(tl,-0.28):tl; g.fillRect(x,y,cs,cs);
  if(th==='leap'){
    g.fillStyle='rgba(255,255,240,.04)'; g.fillRect(x+2,y+2,cs-4,3);
    g.strokeStyle=P.grout; g.lineWidth=2; g.strokeRect(x+1,y+1,cs-2,cs-2);
    if(rng()<0.45){ g.fillStyle=`rgba(${P.moss},${0.25+rng()*0.25})`; g.beginPath(); g.ellipse(x+(rng()<0.5?2:cs-2),y+rng()*cs,4+rng()*7,3+rng()*5,rng()*3,0,TAU); g.fill(); }
    if(rng()<0.12){ g.fillStyle=pick(['#e8e070','#f0f0f0','#c890e0']); for(let q=0;q<3;q++) g.fillRect(x+6+rng()*(cs-12),y+6+rng()*(cs-12),2,2); }
    if(rng()<0.08){ g.strokeStyle='rgba(70,48,28,.7)'; g.lineWidth=3; g.beginPath(); g.moveTo(x,y+rng()*cs); g.bezierCurveTo(x+cs*0.3,y+rng()*cs,x+cs*0.7,y+rng()*cs,x+cs,y+rng()*cs); g.stroke(); }
  }else if(th==='tide'){
    const h=cs/2; for(let q=0;q<4;q++){ const qx=x+(q&1)*h, qy=y+(q>>1)*h; g.fillStyle=r2c(tl,(rng()-0.5)*0.12); g.fillRect(qx+1,qy+1,h-2,h-2); }
    g.fillStyle=P.grout; g.fillRect(x,y,cs,1.5); g.fillRect(x,y,1.5,cs); g.fillRect(x+h-0.7,y,1.4,cs); g.fillRect(x,y+h-0.7,cs,1.4);
    g.fillStyle='rgba(255,255,255,.07)'; g.fillRect(x+3,y+3,cs*0.3,2);
    if(rng()<0.05){ g.fillStyle='#f0c8a0'; g.save(); g.translate(x+cs/2,y+cs/2); g.rotate(rng()*3); for(let q=0;q<5;q++){ g.rotate(TAU/5); g.beginPath(); g.ellipse(5,0,5,1.8,0,0,TAU); g.fill(); } g.restore(); }
  }else{
    g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(x+2,y+2,cs-4,3);
    g.strokeStyle='rgba(150,140,120,.25)'; g.lineWidth=1; g.beginPath(); g.moveTo(x+rng()*cs,y); g.bezierCurveTo(x+rng()*cs,y+cs*0.3,x+rng()*cs,y+cs*0.7,x+rng()*cs,y+cs); g.stroke();
    g.strokeStyle=P.grout; g.lineWidth=1.2; g.strokeRect(x+0.5,y+0.5,cs-1,cs-1);
    if(i%3===0){ g.fillStyle='rgba(220,180,90,.45)'; g.fillRect(x,y,2,cs); } if(j%3===0){ g.fillStyle='rgba(220,180,90,.45)'; g.fillRect(x,y,cs,2); }
  }
  if(t===TY.rune){
    g.save(); g.translate(x+cs/2,y+cs/2);
    if(th==='tide'){ const s=cs/6; for(let a=0;a<6;a++) for(let b=0;b<6;b++){ const wx=x+a*s, wy=y+b*s, v=Math.sin(wx*0.045+wy*0.02)+Math.sin(wy*0.06-wx*0.01); g.fillStyle=v>0.9?'#e8f6ff':v>0.2?'#3aa0c8':v>-0.5?'#2a6a98':'#9ad8e8'; g.fillRect(-cs/2+a*s+0.5,-cs/2+b*s+0.5,s-1,s-1); } }
    else { const nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(([di,dj])=>{ const q=(j+dj)*c.w+(i+di); return c.grid[q]===0&&c.typ[q]===TY.rune; });
      g.lineCap='round';
      for(const [w,col] of [[9,'rgba(0,0,0,.32)'],[5,r2c(P.tile[0],-0.35)],[2.2,`rgba(${P.rune},.7)`]]){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); for(const [di,dj] of nb){ g.moveTo(0,0); g.lineTo(di*cs/2,dj*cs/2); } if(!nb.length){ g.arc(0,0,cs*0.25,0,TAU); } g.stroke(); }
      if((i+j)%2===0||nb.length!==2||(nb[0][0]!==-nb[1][0])){ g.fillStyle=r2c(P.tile[0],-0.4); g.beginPath(); g.moveTo(0,-8); g.lineTo(8,0); g.lineTo(0,8); g.lineTo(-8,0); g.closePath(); g.fill(); g.fillStyle=`rgba(${P.rune},.85)`; g.beginPath(); g.moveTo(0,-5); g.lineTo(5,0); g.lineTo(0,5); g.lineTo(-5,0); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.45)'; g.fillRect(-1.5,-3.5,2,2); } }
    g.restore();
  }
  if(t===TY.spike){ g.fillStyle='rgba(40,36,40,.55)'; g.fillRect(x+4,y+4,cs-8,cs-8); g.fillStyle='rgba(0,0,0,.6)'; for(let a=0;a<3;a++) for(let b=0;b<3;b++){ g.beginPath(); g.arc(x+10+a*14,y+10+b*14,2.6,0,TAU); g.fill(); } g.strokeStyle='rgba(200,200,210,.25)'; g.lineWidth=1; g.strokeRect(x+4.5,y+4.5,cs-9,cs-9); }
  if(t===TY.basin){ g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x,y,cs,cs); if(up!=='floor'||c.typ[(j-1)*c.w+i]!==TY.basin){ const gr=g.createLinearGradient(0,y,0,y+cs*0.5); gr.addColorStop(0,'rgba(0,0,0,.35)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.5); } }
  // soft shadow along walls
  if(up==='wall'){ const gr=g.createLinearGradient(0,y,0,y+cs*0.6); gr.addColorStop(0,'rgba(0,0,0,.42)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.6); }
  if(lf==='wall'){ const gr=g.createLinearGradient(x,0,x+cs*0.4,0); gr.addColorStop(0,'rgba(0,0,0,.28)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs*0.4,cs); }
  if(rt==='wall'){ const gr=g.createLinearGradient(x+cs,0,x+cs*0.6,0); gr.addColorStop(0,'rgba(0,0,0,.28)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x+cs*0.6,y,cs*0.4,cs); }
  // a lip of floor where the ground drops away below
  if(dn==='hole'||dn==='sky'){ g.fillStyle=th==='sky'?'rgba(255,226,140,.75)':'rgba(255,240,210,.22)'; g.fillRect(x,y+cs-3,cs,3); }
  if(up==='hole'||up==='sky'){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x,y,cs,3); g.fillStyle='rgba(255,240,210,.12)'; g.fillRect(x,y+3,cs,2); }
  if(lf==='hole'||lf==='sky'){ g.fillStyle='rgba(255,240,210,.14)'; g.fillRect(x,y,3,cs); }
  if(rt==='hole'||rt==='sky'){ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+cs-3,y,3,cs); }
  return true;
}
// extra trim on the Trial walls, painted over the plain cave wall
function trialPaintWall(g,c,i,j,x,y,cs,st,rng,def,face,th){
  const P=TPAL[def.theme]; if(!P) return;
  if(def.theme==='leap'){
    if(rng()<0.5){ g.fillStyle=`rgba(${P.moss},${0.35+rng()*0.3})`; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*th*0.8,6+rng()*10,4+rng()*6,rng()*3,0,TAU); g.fill(); g.fillStyle='rgba(200,240,140,.2)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*th*0.5,3,2,0,0,TAU); g.fill(); }
    if(face&&rng()<0.55){ for(let q=0;q<2;q++){ const rx=x+4+rng()*(cs-8); g.strokeStyle=rng()<0.5?'#3e5a24':P.root; g.lineWidth=2.2; g.beginPath(); g.moveTo(rx,y+th-2); g.quadraticCurveTo(rx+rng()*8-4,y+th+(cs-th)*0.5,rx+rng()*10-5,y+cs-1); g.stroke(); g.fillStyle='#5a8a34'; g.beginPath(); g.ellipse(rx+2,y+th+(cs-th)*0.55,3,1.6,0.6,0,TAU); g.fill(); } }
  }else if(def.theme==='tide'){
    g.fillStyle='rgba(180,230,255,.25)'; g.fillRect(x,y,cs,2);
    if(face){ g.fillStyle='rgba(120,200,230,.35)'; g.fillRect(x,y+th+2,cs,3); if(rng()<0.25){ g.fillStyle='#f4dcc0'; g.beginPath(); g.arc(x+cs/2,y+th+(cs-th)*0.55,5,Math.PI,TAU); g.fill(); g.strokeStyle='#c8a080'; g.lineWidth=1; for(let q=-2;q<=2;q++){ g.beginPath(); g.moveTo(x+cs/2,y+th+(cs-th)*0.55); g.lineTo(x+cs/2+q*2.4,y+th+(cs-th)*0.55-4.5); g.stroke(); } } }
    if(rng()<0.12){ g.fillStyle='rgba(255,140,120,.55)'; for(let q=0;q<4;q++){ g.beginPath(); g.arc(x+rng()*cs,y+rng()*th,2+rng()*2,0,TAU); g.fill(); } }
  }else{
    g.fillStyle='rgba(255,226,140,.8)'; if(face) g.fillRect(x,y+th-3,cs,2.4);
    g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(x,y,cs,2);
    if(face){ g.fillStyle='rgba(220,180,90,.35)'; g.fillRect(x,y+th+(cs-th)*0.45,cs,2); if(i%2===0){ g.fillStyle='rgba(255,226,140,.5)'; g.beginPath(); g.arc(x+cs/2,y+th+(cs-th)*0.46,2.4,0,TAU); g.fill(); } }
    g.strokeStyle='rgba(160,150,130,.25)'; g.lineWidth=1; g.beginPath(); g.moveTo(x+rng()*cs,y); g.quadraticCurveTo(x+rng()*cs,y+th*0.5,x+rng()*cs,y+th); g.stroke();
  }
}

// ---------- live floor effects (drawn right after the cave canvas, under everything else)
function drawTrialFloor(A,t){
  const T=A.tri; if(!T) return;
  const c=A.cave, cs=c.cell, P=TPAL[A.def.theme]||TPAL.leap;
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1);
  const j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  ctx.save();
  // water ripples are batched into a few paths by brightness, so a big lake room stays cheap
  const rip=[new Path2D(),new Path2D(),new Path2D(),new Path2D()], gl=[new Path2D(),new Path2D()];
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
    const k=j*c.w+i, ty=c.typ[k]; if(ty<3||ty===TY.rune) continue;
    const x=A.x0+i*cs, y=A.y0+j*cs;
    if(ty===TY.deep||ty===TY.current||(ty===TY.stones&&!T.high)||(ty===TY.basin&&T.high)){
      if(ty===TY.basin){ ctx.fillStyle=r2a(P.water,0.82); ctx.fillRect(x,y,cs,cs); }
      const ph=t*1.6+i*0.7+j*1.3, sp=Math.sin(ph), rp=rip[Math.min(3,Math.floor((sp+1)*2))]; rp.moveTo(x+6,y+cs*0.55+sp*3); rp.quadraticCurveTo(x+cs/2,y+cs*0.45+Math.sin(ph+1)*3,x+cs-6,y+cs*0.6+Math.sin(ph+2)*3);
      if(((i*7+j*3)%5)===0){ const gx=x+((t*14+i*13)%cs), gy=y+cs*0.3+((j*17)%20); gl[Math.sin(t*3+i)>0?1:0].rect(gx,gy,4,1.2); }
      if(ty===TY.current){ const d=FLOW[c.flow[k]]||FLOW[1]; ctx.strokeStyle='rgba(220,250,255,.32)'; ctx.lineWidth=2; for(let q=0;q<2;q++){ const f=((t*1.3+q*0.5+(i+j)*0.17)%1), px=x+cs/2+d[0]*(f-0.5)*cs+(d[1]?(q-0.5)*cs*0.5:0), py=y+cs/2+d[1]*(f-0.5)*cs+(d[0]?(q-0.5)*cs*0.5:0); ctx.globalAlpha=Math.sin(f*Math.PI); ctx.beginPath(); ctx.moveTo(px-d[0]*9-d[1]*4,py-d[1]*9-d[0]*4); ctx.lineTo(px,py); ctx.lineTo(px-d[0]*9+d[1]*4,py-d[1]*9+d[0]*4); ctx.stroke(); } ctx.globalAlpha=1; }
    }
    if(ty===TY.stones&&T.high){ // floating stepping stones
      const bob=Math.sin(t*2+i+j)*1.2; ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+cs/2+3,y+cs/2+5,cs*0.42,cs*0.34,0,0,TAU); ctx.fill();
      ctx.fillStyle=r2lg(ctx,x,y,x+cs,y+cs,'#b8c8c8','#7a8e94'); ctx.beginPath(); ctx.ellipse(x+cs/2,y+cs/2+bob,cs*0.44,cs*0.36,0.2,0,TAU); ctx.fill();
      ctx.strokeStyle='rgba(220,250,255,.35)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x+cs/2,y+cs/2+bob+2,cs*0.47,cs*0.39,0.2,0,TAU); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(x+cs*0.4,y+cs*0.4+bob,cs*0.16,cs*0.08,-0.4,0,TAU); ctx.fill();
    }
    if(ty===TY.crumble){ const s=T.crS[k], tm=T.crT[k];
      if(s!==2||tm>3.7){ const back=s===2?clamp((tm-3.7)/0.5,0,1):1, sh=s===1?Math.sin(t*60+i)*2.2*(tm/0.55):0;
        ctx.globalAlpha=back; ctx.fillStyle=r2c(P.tile[(i+j)&3],-0.05); ctx.fillRect(x+2+sh,y+2,cs-4,cs-4); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x+2+sh,y+cs-8,cs-4,6);
        ctx.strokeStyle='rgba(0,0,0,.5)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+cs*0.2+sh,y+cs*0.3); ctx.lineTo(x+cs*0.5+sh,y+cs*0.5); ctx.lineTo(x+cs*0.45+sh,y+cs*0.8); ctx.moveTo(x+cs*0.5+sh,y+cs*0.5); ctx.lineTo(x+cs*0.8+sh,y+cs*0.42); ctx.stroke();
        if(s===1&&Math.random()<0.3) emit(x+rand(4,cs-4),y+cs-4,1,{col:'120,104,84',glow:false,ang:Math.PI/2,spread:0.4,smin:10,smax:40,lmin:.3,lmax:.5,zmin:1.5,zmax:3});
        ctx.globalAlpha=1; } }
    if(ty===TY.spike){ const upk=tSpikeUp(k); const wob=T.spk[k]===2&&!upk&&((T.t*0.7+(i%9)*0.08)%1)>0.86;
      if(upk||wob){ const hgt=upk?1:0.35; for(let a=0;a<3;a++) for(let b=0;b<3;b++){ const sx=x+10+a*14, sy=y+12+b*14; ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(sx-4,sy+2); ctx.lineTo(sx+5,sy+3); ctx.lineTo(sx+1,sy-11*hgt+3); ctx.fill(); ctx.fillStyle=r2lg(ctx,sx-4,0,sx+4,0,'#e8eaf0','#7a7e8a'); ctx.beginPath(); ctx.moveTo(sx-4,sy); ctx.lineTo(sx+4,sy); ctx.lineTo(sx,sy-12*hgt); ctx.closePath(); ctx.fill(); } } }
    if(ty===TY.chasm){ if(((i*5+j*11)%7)===0){ const dx=((t*6+i*31)%(cs*2))-cs*0.5; ctx.fillStyle='rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(x+dx,y+cs*0.5,cs*0.6,cs*0.22,0,0,TAU); ctx.fill(); } }
  }
  ctx.lineWidth=1.6; for(let b=0;b<4;b++){ ctx.strokeStyle=`rgba(200,240,255,${0.035+b*0.03})`; ctx.stroke(rip[b]); }
  ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fill(gl[0]); ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fill(gl[1]);
  // wind bridges from the vents
  if(T.stream.size){ ctx.lineCap='round'; for(const [k,o] of T.stream){ const q=tPos(k); if(!inView(q.x,q.y,40)) continue; const d=o.dir; ctx.fillStyle='rgba(235,245,255,.16)'; ctx.fillRect(q.x-cs/2,q.y-cs/2,cs,cs);
      for(let n=0;n<2;n++){ const f=((t*1.8+n*0.5+(q.i+q.j)*0.21)%1), px=q.x+d[0]*(f-0.5)*cs+(d[1]?(n-0.5)*20:0), py=q.y+d[1]*(f-0.5)*cs+(d[0]?(n-0.5)*20:0); ctx.strokeStyle=`rgba(255,255,255,${0.55*Math.sin(f*Math.PI)})`; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(px-d[0]*14,py-d[1]*14); ctx.lineTo(px+d[0]*8,py+d[1]*8); ctx.stroke(); } } }
  // boss ground effects
  drawTrialBossFx(T,t);
  // a fall: a little dust shadow where Ash dropped
  if(T.fallT>0){ const k=T.fallT/0.5; ctx.fillStyle=`rgba(0,0,0,${0.5*k})`; ctx.beginPath(); ctx.ellipse(T.fallX,T.fallY,14*k,9*k,0,0,TAU); ctx.fill(); }
  ctx.restore();
}
function drawTrialBossFx(T,t){
  for(const R of T.rings){ if(R.delay>0) continue; const a=clamp(1-R.rad/R.max,0,1);
    ctx.strokeStyle=`rgba(110,80,40,${0.35+a*0.4})`; ctx.lineWidth=R.thick+6; ctx.beginPath(); ctx.arc(R.x,R.y,R.rad,0,TAU); ctx.stroke();
    ctx.strokeStyle=`rgba(255,190,90,${0.4+a*0.5})`; ctx.lineWidth=R.thick*0.5; ctx.stroke();
    ctx.strokeStyle=`rgba(255,240,200,${0.5*a+0.2})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(R.x,R.y,R.rad-R.thick*0.3,0,TAU); ctx.stroke(); }
  for(const r of T.roots){
    if(r.up===0&&!r.burnt){ const k=clamp(r.t/r.delay,0,1); ctx.fillStyle=`rgba(255,120,40,${0.1+0.14*k})`; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(255,150,60,${0.5+0.4*k})`; ctx.lineWidth=2; ctx.stroke(); ctx.beginPath(); ctx.arc(r.x,r.y,r.r*k,0,TAU); ctx.stroke();
      ctx.strokeStyle=`rgba(70,48,24,${0.5*k})`; ctx.lineWidth=3; for(let a=0;a<5;a++){ const an=a*1.26+r.x; ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.lineTo(r.x+Math.cos(an)*r.r*0.8*k,r.y+Math.sin(an)*r.r*0.8*k); ctx.stroke(); } }
    else if(r.up>0||r.burnt){ const k=r.burnt?clamp(1-(r.t-r.delay)/0.3,0,1):clamp(r.up/0.25,0,1)*clamp((0.9-r.up)/0.1+0.4,0,1);
      for(let a=0;a<6;a++){ const an=a*1.05+r.x*0.1, ox=Math.cos(an)*r.r*0.45, oy=Math.sin(an)*r.r*0.35, h=(24+((a*7)%9))*k;
        ctx.fillStyle=r.burnt?'#2a1408':'#4a3018'; ctx.beginPath(); ctx.moveTo(r.x+ox-6,r.y+oy+4); ctx.quadraticCurveTo(r.x+ox-2,r.y+oy-h*0.6,r.x+ox+2*Math.sin(t*3+a),r.y+oy-h); ctx.quadraticCurveTo(r.x+ox+3,r.y+oy-h*0.5,r.x+ox+6,r.y+oy+4); ctx.closePath(); ctx.fill();
        ctx.fillStyle=r.burnt?'rgba(255,120,40,.6)':'rgba(140,110,70,.6)'; ctx.fillRect(r.x+ox-1,r.y+oy-h*0.7,2,h*0.5); }
      if(r.burnt) glowAt(r.x,r.y-10,30,'255,120,40',0.5*k); }
  }
  for(const L of T.logs){ if(L.delay>0) continue; ctx.save(); ctx.translate(L.x,L.y); ctx.rotate(L.ang+Math.PI/2);
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(-L.len/2+4,-10,L.len,24);
    ctx.fillStyle=r2lg(ctx,0,-13,0,13,'#9a6a3a','#6a4424','#3a2410'); rrect(ctx,-L.len/2,-13,L.len,26,10); ctx.fill();
    ctx.strokeStyle='rgba(30,16,6,.55)'; ctx.lineWidth=1.6; for(let q=0;q<5;q++){ const yy=((L.roll*8+q*6)%26)-13; ctx.beginPath(); ctx.moveTo(-L.len/2+6,yy); ctx.lineTo(L.len/2-6,yy+1); ctx.stroke(); }
    for(const s of [-1,1]){ ctx.fillStyle='#c8a070'; ctx.beginPath(); ctx.ellipse(s*(L.len/2-2),0,5,12,0,0,TAU); ctx.fill(); ctx.strokeStyle='#8a6040'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(s*(L.len/2-2),0,2.5,6,0,0,TAU); ctx.stroke(); }
    ctx.restore(); }
  for(const z of T.zones){
    if(z.kind==='sweep'){ const k=clamp(z.t/z.delay,0,1);
      if(z.t<z.delay){ ctx.fillStyle=`rgba(80,200,255,${0.08+0.12*k})`; ctx.beginPath(); ctx.moveTo(z.x,z.y); ctx.arc(z.x,z.y,z.r,z.a0,z.a1); ctx.closePath(); ctx.fill(); ctx.strokeStyle=`rgba(120,220,255,${0.45+0.4*k})`; ctx.lineWidth=2; ctx.stroke(); }
      else { const kk=clamp((z.t-z.delay)/z.dur,0,1), ang=lerp(z.a0,z.a1,kk); ctx.save(); ctx.translate(z.x,z.y); ctx.rotate(ang); ctx.lineCap='round';
        ctx.strokeStyle='rgba(20,60,80,.5)'; ctx.lineWidth=30; ctx.beginPath(); ctx.moveTo(18,4); ctx.quadraticCurveTo(z.r*0.5,10,z.r,4); ctx.stroke();
        ctx.strokeStyle='#2a8aa8'; ctx.lineWidth=24; ctx.beginPath(); ctx.moveTo(18,0); ctx.quadraticCurveTo(z.r*0.5,6,z.r,0); ctx.stroke();
        ctx.strokeStyle='rgba(190,240,250,.7)'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(24,-6); ctx.quadraticCurveTo(z.r*0.5,0,z.r-6,-6); ctx.stroke();
        ctx.fillStyle='#4ac0d8'; ctx.beginPath(); ctx.moveTo(z.r-4,0); ctx.lineTo(z.r+26,-16); ctx.lineTo(z.r+18,0); ctx.lineTo(z.r+26,16); ctx.closePath(); ctx.fill();
        ctx.restore(); for(let q=0;q<2;q++) emit(z.x+Math.cos(ang)*z.r*rand(0.4,1),z.y+Math.sin(ang)*z.r*rand(0.4,1),1,{col:'200,240,255',glow:false,smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:4}); } }
    else if(z.kind==='whirl'){ const k=clamp(Math.min(z.t/0.6,(z.dur-z.t)/0.6),0,1); ctx.save(); ctx.translate(z.x,z.y);
      for(let q=0;q<5;q++){ const rr=z.r*(1-q*0.18); ctx.strokeStyle=`rgba(${q%2?'150,220,255':'40,110,160'},${0.35*k})`; ctx.lineWidth=6-q*0.8; ctx.beginPath(); ctx.arc(0,0,rr,t*(2+q*0.6),t*(2+q*0.6)+4.2); ctx.stroke(); }
      const gr=ctx.createRadialGradient(0,0,0,0,0,80); gr.addColorStop(0,`rgba(10,30,50,${0.7*k})`); gr.addColorStop(1,'rgba(10,30,50,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,80,0,TAU); ctx.fill(); ctx.restore(); }
    else if(z.kind==='bolt'&&!z.struck){ const k=clamp(z.t/z.delay,0,1); ctx.fillStyle=`rgba(180,210,255,${0.1+0.18*k})`; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,TAU); ctx.fill(); ctx.strokeStyle=`rgba(220,235,255,${0.5+0.45*k})`; ctx.lineWidth=2; ctx.stroke(); ctx.beginPath(); ctx.arc(z.x,z.y,z.r*k,0,TAU); ctx.stroke(); }
  }
}

// ---------- Trial furniture (drawn live; FL entries are looked up by drawFurn in a3b_art2.js)
// Ember's statue: a hooded girl with little horns, holding up a lantern
function tStatueSpr(th){ const st=CAVE_STYLE[th]||CAVE_STYLE.earth; return r2S('tstatue_'+th,64,92,32,74,g=>{
  const stone=th==='sky'?'#ece4d2':th==='tide'?'#c8dce4':'#8e9478', dk=r2c(stone,-0.45);
  r2e(g,3,6,22,9,'rgba(0,0,0,.3)');
  r2rr(g,-18,-6,36,14,3,r2c(stone,-0.25)); r2rr(g,-18,-8,36,8,3,r2c(stone,0.1)); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(-18,2,36,4);
  g.fillStyle=r2lg(g,-14,-60,14,-6,r2c(stone,0.25),stone,dk); g.beginPath(); g.moveTo(-13,-8); g.quadraticCurveTo(-16,-36,-8,-48); g.lineTo(8,-48); g.quadraticCurveTo(16,-36,13,-8); g.closePath(); g.fill();
  g.strokeStyle='rgba(0,0,0,.22)'; g.lineWidth=1; for(const q of [-6,0,6]){ g.beginPath(); g.moveTo(q,-44); g.lineTo(q*1.4,-9); g.stroke(); }
  r2o(g,0,-54,9,r2c(stone,0.12)); g.fillStyle=r2c(stone,-0.15); g.beginPath(); g.arc(0,-54,9,Math.PI*0.1,Math.PI*0.9); g.fill();
  g.fillStyle=r2c(stone,0.3); for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*5,-61); g.quadraticCurveTo(s*10,-70,s*7,-74); g.quadraticCurveTo(s*7,-66,s*2,-62); g.fill(); }
  g.strokeStyle=r2c(stone,-0.2); g.lineWidth=3; g.beginPath(); g.moveTo(8,-38); g.quadraticCurveTo(16,-46,16,-58); g.stroke();
  r2rr(g,11,-66,10,10,2,r2c(stone,-0.3)); r2rr(g,12.5,-64.5,7,7,1.5,th==='tide'?'#9ae0ff':th==='sky'?'#ffe8a0':'#d8f0a0');
  g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-10,-46,3,36);
}); }
FL.tstatue=(o,t)=>{ r2put(tStatueSpr(o.th),o.x,o.y); const c=o.th==='tide'?'150,225,255':o.th==='sky'?'255,226,140':'200,240,140'; glowAt(o.x+16,o.y-60,22+2*Math.sin(t*3+o.x),c,0.55); };
FL.tfount=(o,t)=>{
  r2put(r2S('tfount',70,70,35,38,g=>{ r2e(g,3,8,30,18,'rgba(0,0,0,.3)'); g.fillStyle=r2lg(g,-30,-20,30,20,'#e0f0f4','#9ab8c4','#5a7a88'); g.beginPath(); g.ellipse(0,0,30,20,0,0,TAU); g.fill(); g.fillStyle='#2a6a98'; g.beginPath(); g.ellipse(0,-1,24,15,0,0,TAU); g.fill(); g.fillStyle='rgba(160,230,255,.35)'; g.beginPath(); g.ellipse(-6,-5,12,5,-0.3,0,TAU); g.fill(); r2rr(g,-5,-16,10,16,3,'#c8dce4'); g.fillStyle='#e8f4f8'; g.beginPath(); g.ellipse(0,-16,9,5,0,0,TAU); g.fill(); }),o.x,o.y);
  for(let i=0;i<5;i++){ const f=((t*1.4+i*0.2)%1), a=i*1.26; ctx.fillStyle=`rgba(200,240,255,${0.8*(1-f)})`; ctx.beginPath(); ctx.arc(o.x+Math.cos(a)*f*18,o.y-18+Math.sin(a)*f*10-Math.sin(f*Math.PI)*14,2.2,0,TAU); ctx.fill(); }
  ctx.strokeStyle=`rgba(220,250,255,${0.25+0.15*Math.sin(t*3)})`; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(o.x,o.y-1,10+((t*20)%14),6+((t*12)%8),0,0,TAU); ctx.stroke();
};
// crystal switch on a little pedestal: dim when asleep, bright when struck
FL.tswitch=(o,t)=>{
  const x=o.x, y=o.y, on=o.on;
  r2put(r2S('tswbase',44,40,22,22,g=>{ r2e(g,2,8,15,7,'rgba(0,0,0,.35)'); g.fillStyle=r2lg(g,-14,-4,14,12,'#9a9aa8','#5a5a6a','#2a2a34'); g.beginPath(); g.ellipse(0,4,14,8,0,0,TAU); g.fill(); g.fillStyle='#6a6a7a'; g.beginPath(); g.ellipse(0,1,12,6,0,0,TAU); g.fill(); }),x,y);
  const bob=Math.sin(t*2.4+x)*2, c1=on?'#c8f6ff':'#7a8aa8', c2=on?'#3ab8e8':'#3a4660', c3=on?'#10507a':'#1a2030';
  const g=ctx.createLinearGradient(x-9,y-26+bob,x+9,y+bob); g.addColorStop(0,'#ffffff'); g.addColorStop(0.35,c1); g.addColorStop(0.7,c2); g.addColorStop(1,c3);
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x,y-28+bob); ctx.lineTo(x+9,y-14+bob); ctx.lineTo(x+5,y-2+bob); ctx.lineTo(x-5,y-2+bob); ctx.lineTo(x-9,y-14+bob); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,y-28+bob); ctx.lineTo(x,y-2+bob); ctx.moveTo(x-9,y-14+bob); ctx.lineTo(x+9,y-14+bob); ctx.stroke();
  if(on){ glowAt(x,y-14+bob,40,'120,220,255',0.45+0.15*Math.sin(t*5)); if(o.timed&&o.t>0){ ctx.strokeStyle='rgba(200,245,255,.85)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x,y-14+bob,20,-Math.PI/2,-Math.PI/2+TAU*clamp(o.t/o.timed,0,1)); ctx.stroke(); } }
  else { glowAt(x,y-14+bob,20,'140,160,220',0.12+0.08*Math.sin(t*2+x)); ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font=`700 9px ${UIF}`; ctx.textAlign='center'; if(o.acc&&!o.acc.includes('slash')){ ctx.save(); ctx.translate(x,y+16); ctx.strokeStyle='rgba(220,230,255,.6)'; ctx.lineWidth=1.6; if(o.acc.includes('boomerang')){ ctx.beginPath(); ctx.moveTo(-6,2); ctx.quadraticCurveTo(0,-6,6,2); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.moveTo(3,-3); ctx.lineTo(6,0); ctx.lineTo(3,3); ctx.stroke(); } ctx.restore(); } }
};
// stone eye: carved lids that open and shut; an arrow while it is open wakes it gold
FL.teye=(o,t)=>{
  const x=o.x, y=o.y;
  r2put(r2S('teye_'+(AREA?AREA.def.theme:'x'),56,50,28,26,g=>{ const th=AREA?AREA.def.theme:'leap', stone=th==='sky'?'#ddd2bc':th==='tide'?'#9ab8c8':'#7a8068'; r2e(g,2,6,24,18,'rgba(0,0,0,.35)'); g.fillStyle=r2lg(g,-24,-18,24,18,r2c(stone,0.25),stone,r2c(stone,-0.45)); g.beginPath(); g.ellipse(0,0,24,18,0,0,TAU); g.fill(); g.strokeStyle=r2c(stone,-0.5); g.lineWidth=2; g.beginPath(); g.ellipse(0,0,19,13,0,0,TAU); g.stroke(); for(let a=0;a<8;a++){ const an=a/8*TAU; r2l(g,Math.cos(an)*19,Math.sin(an)*13,Math.cos(an)*23,Math.sin(an)*17,r2c(stone,-0.35),1.5); } }),x,y);
  const open=o.lit?1:o.open?1:0; o.ok=lerp(o.ok||0,open,0.18); const k=o.ok;
  ctx.fillStyle='#14100c'; ctx.beginPath(); ctx.ellipse(x,y,15,10*k+0.6,0,0,TAU); ctx.fill();
  if(k>0.1){ ctx.save(); ctx.beginPath(); ctx.ellipse(x,y,15,10*k,0,0,TAU); ctx.clip();
    ctx.fillStyle=o.lit?'#fff4c8':'#e8e0d0'; ctx.beginPath(); ctx.ellipse(x,y,14,9,0,0,TAU); ctx.fill();
    const px=x+Math.cos(o.face)*3, py=y+Math.sin(o.face)*2; ctx.fillStyle=o.lit?'#ffb020':'#3a6aa8'; ctx.beginPath(); ctx.arc(px,py,6,0,TAU); ctx.fill(); ctx.fillStyle='#120a04'; ctx.beginPath(); ctx.arc(px,py,2.8,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(px-2,py-2,1.4,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.fillStyle=AREA&&AREA.def.theme==='sky'?'#c8bca0':'#6a7058'; ctx.beginPath(); ctx.ellipse(x,y-10*k-1,16,4,0,Math.PI,TAU); ctx.fill();
  if(o.lit){ glowAt(x,y,40,'255,210,110',0.5+0.12*Math.sin(t*4)); if(o.timed&&o.t>0){ ctx.strokeStyle='rgba(255,230,160,.85)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x,y,24,-Math.PI/2,-Math.PI/2+TAU*clamp(o.t/o.timed,0,1)); ctx.stroke(); } }
  else if(open) glowAt(x,y,24,'140,200,255',0.2);
};
// wind vent: a grate breathing a bridge of wind when it is awake
FL.tvent=(o,t)=>{
  const x=o.x, y=o.y; ctx.save(); ctx.translate(x,y);
  r2e(ctx,2,4,20,14,'rgba(0,0,0,.3)'); ctx.fillStyle=r2lg(ctx,-18,-12,18,12,'#f0e8d4','#b8a888','#6a5a40'); ctx.beginPath(); ctx.ellipse(0,0,19,13,0,0,TAU); ctx.fill();
  ctx.fillStyle='#2a2620'; ctx.beginPath(); ctx.ellipse(0,0,14,9,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#c8b080'; ctx.lineWidth=2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*5,-8); ctx.lineTo(i*5,8); ctx.stroke(); }
  ctx.restore();
  if(o.on){ glowAt(x,y,30,'220,240,255',0.3); for(let i=0;i<3;i++){ const f=((t*2+i/3)%1); ctx.strokeStyle=`rgba(255,255,255,${0.6*(1-f)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x+o.dir[0]*f*30,y+o.dir[1]*f*30-f*6,6+f*10,0,TAU); ctx.stroke(); } }
};
FL.tpick=(o,t)=>{
  if(G.found[o.id]) return; const b=Math.sin(t*3+o.x)*3, x=o.x, y=o.y-8+b;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x,o.y+6,10,4,0,0,TAU); ctx.fill();
  if(o.item==='tide_pearl'){ glowAt(x,y,30,'200,240,255',0.55+0.2*Math.sin(t*4)); ctx.fillStyle=r2rg(ctx,x-2,y-2,1,8,'#ffffff','#d8f0ff','#8ab8d8'); ctx.beginPath(); ctx.arc(x,y,7,0,TAU); ctx.fill(); }
  else if(o.item==='marlo_hat'){ ctx.save(); ctx.translate(x,y); ctx.rotate(Math.sin(t*1.5)*0.2); ctx.fillStyle='#5a2a6a'; ctx.beginPath(); ctx.ellipse(0,2,13,5,0,0,TAU); ctx.fill(); ctx.fillStyle='#7a3a8a'; ctx.beginPath(); ctx.moveTo(-8,2); ctx.quadraticCurveTo(-6,-10,1,-11); ctx.quadraticCurveTo(8,-9,8,2); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#ffb86a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(4,-8); ctx.quadraticCurveTo(14,-18,10,-24); ctx.stroke(); ctx.restore(); glowAt(x,y,26,'255,220,150',0.3); }
  else { ctx.save(); ctx.translate(x,y); ctx.rotate(0.5+Math.sin(t*2)*0.3); ctx.fillStyle='#f4f8ff'; ctx.beginPath(); ctx.moveTo(0,-12); ctx.quadraticCurveTo(7,-2,0,12); ctx.quadraticCurveTo(-7,-2,0,-12); ctx.fill(); ctx.strokeStyle='#a8b8d0'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(0,13); ctx.stroke(); ctx.restore(); glowAt(x,y,26,'220,235,255',0.4); }
};
FL.twarp=(o,t)=>{
  const on=AREA&&trialDone(AREA.def.id), x=o.x, y=o.y;
  ctx.save(); ctx.translate(x,y); ctx.scale(1,0.62);
  ctx.strokeStyle=on?'rgba(255,214,120,.95)':'rgba(140,130,110,.55)'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,0,26,0,TAU); ctx.stroke();
  ctx.strokeStyle=on?'rgba(255,245,210,.8)':'rgba(90,80,70,.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,20,0,TAU); ctx.stroke();
  for(let i=0;i<6;i++){ const a=i/6*TAU+(on?t*1.5:0); ctx.fillStyle=on?'#ffe8a0':'#7a7060'; ctx.fillRect(Math.cos(a)*26-2,Math.sin(a)*26-2,4,4); }
  ctx.restore();
  if(on){ glowAt(x,y,46,'255,214,120',0.45+0.15*Math.sin(t*3)); for(let i=0;i<2;i++){ const f=((t*0.9+i*0.5)%1); ctx.fillStyle=`rgba(255,240,200,${0.7*(1-f)})`; ctx.beginPath(); ctx.arc(x+Math.cos(t*3+i*3)*14,y-f*40,2,0,TAU); ctx.fill(); } }
};
FL.tnest=(o,t)=>{
  const x=o.x, y=o.y;
  r2put(r2S('tnest',70,56,35,28,g=>{ r2e(g,3,6,28,16,'rgba(0,0,0,.3)'); g.fillStyle='#7a5a32'; g.beginPath(); g.ellipse(0,0,28,17,0,0,TAU); g.fill(); g.fillStyle='#3a2810'; g.beginPath(); g.ellipse(0,-1,19,11,0,0,TAU); g.fill(); g.strokeStyle='#a07a48'; g.lineWidth=2; for(let a=0;a<18;a++){ const an=a/18*TAU; g.beginPath(); g.moveTo(Math.cos(an)*18,Math.sin(an)*11); g.lineTo(Math.cos(an+0.5)*29,Math.sin(an+0.5)*18); g.stroke(); } g.fillStyle='#efe4cc'; g.beginPath(); g.ellipse(-6,0,5,6.5,0.3,0,TAU); g.fill(); g.beginPath(); g.ellipse(5,2,4.5,6,-0.2,0,TAU); g.fill(); }),x,y);
  if(G.flags.puff_home) drawHatchling(x,y-4,0,t,true);
};
// Puff the drakeling hatchling
function drawHatchling(x,y,face,t,sleep){
  ctx.save(); ctx.translate(x,y); ctx.rotate(face);
  const L=lightLocal(face), flap=sleep?0:Math.sin(t*14)*0.5+0.5;
  for(const s of [-1,1]){ ctx.fillStyle='rgba(200,110,60,.85)'; ctx.beginPath(); ctx.moveTo(1,s*2); ctx.lineTo(-3,s*(5+flap*5)); ctx.lineTo(-7,s*(3+flap*3)); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle='#8a3a18'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-5,0); ctx.quadraticCurveTo(-10,Math.sin(t*4)*3,-12,Math.sin(t*4+1)*4); ctx.stroke();
  ctx.fillStyle=rg(0,0,7,L,'#ffc080','#f08850','#9a4018'); ctx.beginPath(); ctx.ellipse(0,0,7,5,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6,0,4,3.6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff0d0'; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(5,s*2); ctx.lineTo(3,s*5); ctx.lineTo(6,s*3); ctx.fill(); }
  if(sleep){ ctx.strokeStyle='#3a1a08'; ctx.lineWidth=0.9; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(7,s*1.5,1,0,Math.PI); ctx.stroke(); } }
  else { ctx.fillStyle='#2a1208'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(7.5,s*1.5,0.9,0,TAU); ctx.fill(); } }
  ctx.restore();
  if(sleep){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`700 10px ${UIF}`; ctx.textAlign='center'; const f=(t*0.6)%1; ctx.globalAlpha=1-f; ctx.fillText('z',x+10+f*8,y-12-f*14); ctx.globalAlpha=1; }
}
// Ember's spirit floats over her shrine
FL.tspirit=(o,t)=>{
  const id=AREA&&AREA.def.id, gifted=id&&hasAbil(TRIALS[id].abil), a=gifted?0.45:0.9;
  ctx.save(); ctx.translate(o.x,o.y+Math.sin(t*1.6)*5); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a;
  const g=ctx.createRadialGradient(0,0,0,0,0,80); g.addColorStop(0,'rgba(255,190,110,.42)'); g.addColorStop(1,'rgba(255,130,50,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,80,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,180,110,.5)'; ctx.beginPath(); ctx.moveTo(0,-14); ctx.quadraticCurveTo(15,-2,13,22); ctx.quadraticCurveTo(0,30,-13,22); ctx.quadraticCurveTo(-15,-2,0,-14); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-20,8,0,TAU); ctx.fill();
  for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*4,-26); ctx.quadraticCurveTo(s*9,-35,s*7,-38); ctx.quadraticCurveTo(s*6,-31,s*1.5,-27); ctx.fill(); }
  ctx.fillStyle='rgba(255,236,190,.4)'; ctx.beginPath(); ctx.moveTo(0,-10); ctx.quadraticCurveTo(8,0,7,18); ctx.quadraticCurveTo(0,22,-7,18); ctx.quadraticCurveTo(-8,0,0,-10); ctx.fill();
  ctx.fillStyle='rgba(255,230,160,.9)'; ctx.beginPath(); ctx.arc(10,4,4+Math.sin(t*6)*0.8,0,TAU); ctx.fill();
  ctx.restore();
  if(Math.random()<0.2) emit(o.x+rand(-12,12),o.y+rand(-10,20),1,{col:'255,210,150',ang:-Math.PI/2,spread:0.5,smin:10,smax:40,lmin:.6,lmax:1.1,zmin:1.2,zmax:2.4,rise:16});
};
// a round stone dais with carved steps and a ring of runes
function tDais(x,y,th,s){
  r2put(r2S('tdais_'+th,170,110,85,55,g=>{ const stone=th==='sky'?'#efe8d8':th==='tide'?'#b0ccd8':'#7c8466', P=TPAL[th]||TPAL.leap;
    r2e(g,4,8,80,44,'rgba(0,0,0,.28)');
    for(let k=0;k<3;k++){ const rx=78-k*14, ry=42-k*8, yy=4-k*5; g.fillStyle=r2c(stone,-0.35+k*0.08); g.beginPath(); g.ellipse(0,yy+4,rx,ry,0,0,TAU); g.fill(); g.fillStyle=r2lg(g,-rx,yy-ry,rx,yy+ry,r2c(stone,0.25),stone,r2c(stone,-0.2)); g.beginPath(); g.ellipse(0,yy,rx,ry,0,0,TAU); g.fill(); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1.2; g.stroke(); }
    g.strokeStyle=`rgba(${P.rune},.6)`; g.lineWidth=1.6; for(let a=0;a<16;a++){ const an=a/16*TAU; g.beginPath(); g.moveTo(Math.cos(an)*44,-6+Math.sin(an)*21); g.lineTo(Math.cos(an)*48,-6+Math.sin(an)*23); g.stroke(); }
    g.beginPath(); g.ellipse(0,-6,40,19,0,0,TAU); g.stroke(); }),x,y,s);
  glowAt(x,y-4,70*s,(TPAL[th]||TPAL.leap).rune,0.12+0.05*Math.sin(G.time*1.5));
}
// the interactive twins (shrine flame, chests, valve wheel, the reward altar, Puff waiting on a perch, roots across a door)
FL.tv=(o,t)=>{
  const q=o.ref, x=o.x, y=o.y, th=AREA?AREA.def.theme:'leap';
  switch(o.kind){
    case 'shrine': {
      tDais(x,y+8,th,1.25);
      r2put(r2S('tshrine_'+th,110,96,55,58,g=>{ const stone=th==='sky'?'#ece4d2':th==='tide'?'#b8d0dc':'#848a70'; r2e(g,3,12,46,22,'rgba(0,0,0,.3)'); for(let s=0;s<3;s++){ const w=44-s*10, h=20-s*4, yy=10-s*9; g.fillStyle=r2lg(g,-w,yy-h,w,yy+h,r2c(stone,0.2-s*0.05),stone,r2c(stone,-0.4)); g.beginPath(); g.ellipse(0,yy,w,h,0,0,TAU); g.fill(); g.strokeStyle='rgba(0,0,0,.2)'; g.lineWidth=1.2; g.stroke(); }
        g.fillStyle=r2c(stone,-0.55); g.beginPath(); g.ellipse(0,-10,15,7,0,0,TAU); g.fill(); g.fillStyle='#2a1208'; g.beginPath(); g.ellipse(0,-10,11,5,0,0,TAU); g.fill();
        g.strokeStyle=th==='tide'?'rgba(120,210,255,.6)':th==='sky'?'rgba(255,214,120,.7)':'rgba(190,240,120,.6)'; g.lineWidth=1.6; for(let a=0;a<12;a++){ const an=a/12*TAU; g.beginPath(); g.moveTo(Math.cos(an)*36,10+Math.sin(an)*16); g.lineTo(Math.cos(an)*42,10+Math.sin(an)*19); g.stroke(); } }),x,y);
      const lit=AREA&&!hasAbil(TRIALS[AREA.def.id].abil), s=lit?1:0.6, fy=y-12;
      glowAt(x,fy-14,lit?80:50,'255,170,70',lit?0.55:0.3);
      for(let i=0;i<3;i++){ const k=1-i*0.28, sw=Math.sin(t*7+i*2)*3*s; ctx.fillStyle=['#ff7a2a','#ffb040','#fff0b0'][i]; ctx.beginPath(); ctx.moveTo(x-12*k*s,fy); ctx.quadraticCurveTo(x-10*k*s+sw,fy-26*k*s,x+sw*1.5,fy-(40+Math.sin(t*9)*4)*k*s); ctx.quadraticCurveTo(x+10*k*s+sw,fy-26*k*s,x+12*k*s,fy); ctx.closePath(); ctx.fill(); }
      if(Math.random()<0.3) emit(x+rand(-6,6),fy-20,1,{kind:'fire',ang:-Math.PI/2,spread:0.4,smin:20,smax:60,lmin:.4,lmax:.8,zmin:2,zmax:4,grow:3});
      break; }
    case 'chest': {
      const big=q.big, open=G.found[q.id], sealed=!open&&tSealed(q), w=big?50:36, h=big?34:24;
      if(big) tDais(x,y+4,th,1);
      ctx.save(); ctx.translate(x,y);
      ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(3,h*0.45,w*0.6,h*0.35,0,0,TAU); ctx.fill();
      const wood=big?(q.item==='bosskey'?'#5a2a2a':'#6a3a1a'):'#7a4a24', trim=big?'#ffd060':'#d8b04a';
      ctx.fillStyle=r2lg(ctx,0,-h/2,0,h/2,r2c(wood,0.25),wood,r2c(wood,-0.45)); rrect(ctx,-w/2,-h/2+4,w,h-4,4); ctx.fill();
      if(open){ ctx.fillStyle='#140a04'; rrect(ctx,-w/2+4,-h/2+6,w-8,h*0.5,3); ctx.fill(); ctx.fillStyle=r2lg(ctx,0,-h-8,0,-h/2+4,r2c(wood,0.3),wood); rrect(ctx,-w/2,-h-6,w,h*0.5+4,4); ctx.fill(); ctx.fillStyle=trim; ctx.fillRect(-w/2,-h/2+1,w,3); }
      else { ctx.fillStyle=r2lg(ctx,0,-h/2-8,0,-h/2+10,r2c(wood,0.4),r2c(wood,0.05)); rrect(ctx,-w/2-1,-h/2-6,w+2,16,6); ctx.fill(); ctx.fillStyle=trim; ctx.fillRect(-w/2-1,-h/2+6,w+2,3); for(const s of [-0.32,0.32]) ctx.fillRect(s*w-2,-h/2-6,4,h+2); rrect(ctx,-6,-h/2+2,12,11,2); ctx.fill(); ctx.fillStyle='#3a2008'; ctx.beginPath(); ctx.arc(0,-h/2+7,2,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(-w/2+3,-h/2-4,w-6,2);
        if(big){ ctx.fillStyle=q.item==='bosskey'?'#ff8a3a':'#9ae0ff'; ctx.beginPath(); ctx.moveTo(0,-h/2-2); ctx.lineTo(4,3); ctx.lineTo(0,7); ctx.lineTo(-4,3); ctx.closePath(); ctx.globalAlpha=0.0; ctx.fill(); ctx.globalAlpha=1; } }
      ctx.restore();
      if(!open){ if(sealed){ ctx.strokeStyle=`rgba(255,214,120,${0.55+0.25*Math.sin(t*3)})`; ctx.lineWidth=3; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x-w*0.65,y+s*6); ctx.quadraticCurveTo(x,y+s*2-6,x+w*0.65,y+s*6); ctx.stroke(); } glowAt(x,y,44,'255,214,120',0.25); }
        else { glowAt(x,y-4,big?60:40,big?'255,214,120':'255,210,120',(big?0.45:0.3)+0.15*Math.sin(t*3)); if(big&&Math.random()<0.25) emit(x+rand(-w/2,w/2),y-h/2,1,{col:'255,230,160',ang:-Math.PI/2,spread:0.4,smin:10,smax:40,lmin:.5,lmax:1,zmin:1.2,zmax:2.4,rise:14}); } }
      break; }
    case 'valve': {
      const T=AREA.tri; o.spin=Math.max(0,(o.spin||0)-1/60); o.ang=(o.ang||0)+(o.spin>0?0.2:0);
      r2e(ctx,x+2,y+6,18,9,'rgba(0,0,0,.3)'); ctx.fillStyle='#5a6a74'; ctx.beginPath(); ctx.ellipse(x,y+2,14,7,0,0,TAU); ctx.fill(); ctx.fillStyle='#3a4a54'; ctx.fillRect(x-3,y-14,6,16);
      ctx.save(); ctx.translate(x,y-16); ctx.rotate(o.ang); ctx.strokeStyle='#c8a050'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(0,0,12,0,TAU); ctx.stroke(); for(let a=0;a<4;a++){ ctx.rotate(Math.PI/4*2); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(12,0); ctx.stroke(); } ctx.fillStyle='#e8c060'; ctx.beginPath(); ctx.arc(0,0,3.5,0,TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle=T.high?'#7ad0ff':'#c8a070'; ctx.font=`800 10px ${UIF}`; ctx.textAlign='center'; ctx.fillText(T.high?'HIGH':'LOW',x,y+18);
      break; }
    case 'altar': {
      const done=AREA&&trialDone(AREA.def.id); tDais(x,y+6,th,1.15);
      r2put(r2S('taltar_'+th,100,90,50,56,g=>{ r2e(g,3,12,40,18,'rgba(0,0,0,.3)'); g.fillStyle=r2lg(g,-36,-20,36,20,'#fff2c8','#d8b060','#7a5a20'); g.beginPath(); g.ellipse(0,8,36,16,0,0,TAU); g.fill(); g.fillStyle=r2lg(g,-22,-34,22,6,'#fff8e0','#e8c870','#8a6a28'); rrect(g,-20,-30,40,38,6); g.fill(); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(-20,2,40,6); g.strokeStyle='#8a6a28'; g.lineWidth=1.4; g.strokeRect(-14,-24,28,22); }),x,y);
      const hy=y-44+Math.sin(t*2)*3;
      if(!done){ glowAt(x,hy,60,'255,120,110',0.5+0.15*Math.sin(t*3)); ctx.fillStyle=r2rg(ctx,x-4,hy-4,1,14,'#ffd8d0','#ff4a4a','#9a1010'); heartPath(x,hy,11); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(x-4,hy-4,3,2,-0.5,0,TAU); ctx.fill(); }
      else glowAt(x,y-30,40,'255,214,140',0.3);
      break; }
    case 'puff': drawHatchling(x,y+Math.sin(t*3)*1,Math.PI/2,t,false); if(Math.random()<0.05) emit(x,y-8,1,{col:'200,200,200',glow:false,ang:-Math.PI/2,spread:0.5,smin:10,smax:30,lmin:.5,lmax:.9,zmin:2,zmax:4,grow:4}); if(Math.sin(t*2)>0.6){ ctx.fillStyle='#fff'; ctx.font=`700 11px ${UIF}`; ctx.textAlign='center'; ctx.fillText('peep!',x,y-22); } break;
    case 'roots': {
      if(q.opened){ ctx.fillStyle='rgba(20,10,4,.4)'; ctx.beginPath(); ctx.ellipse(x,y,22,14,0,0,TAU); ctx.fill(); break; }
      ctx.save(); ctx.translate(x,y); ctx.lineCap='round';
      for(let i=0;i<7;i++){ const a=i*0.9, l=26; ctx.strokeStyle=i%2?'#4a3018':'#6a4424'; ctx.lineWidth=7-i*0.5; ctx.beginPath(); ctx.moveTo(Math.cos(a)*-l,Math.sin(a)*-l*0.8); ctx.quadraticCurveTo(Math.sin(i)*8,Math.cos(i)*8,Math.cos(a)*l,Math.sin(a)*l*0.8); ctx.stroke(); }
      if(q.heat>0){ glowAt(0,0,34,'255,130,40',Math.min(0.8,q.heat)); }
      ctx.restore(); break; }
  }
};
// held-up treasure, the gust streaks and Puff, drawn over the floor once per frame
FL.tfx=(o,t)=>{
  const A=AREA, T=A&&A.tri; if(!T) return;
  const R=A.curRoom, th=A.def.theme;
  if(R) trialRoomLight(R,th,t);
  if(R&&R.gust&&(R.gustK>0.05||R.gustWarn)){ const d=R.gust.dir, gk=R.gustWarn?0.3:R.gustK; ctx.strokeStyle=`rgba(255,255,255,${0.35*gk})`; ctx.lineWidth=2; ctx.lineCap='round';
    for(let n=0;n<26;n++){ const f=((t*1.6+n*0.137)%1), sx=R.x0+((n*97)%Math.round(R.x1-R.x0)), sy=R.y0+((n*61)%Math.round(R.y1-R.y0)), px=sx+d[0]*(f-0.5)*360, py=sy+d[1]*(f-0.5)*360; ctx.globalAlpha=Math.sin(f*Math.PI); ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+d[0]*34+d[1]*3,py+d[1]*34+d[0]*3); ctx.stroke(); }
    ctx.globalAlpha=1; }
  if(T.puff) drawHatchling(T.puff.x,T.puff.y,T.puff.face,t,false);
  if(T.hold&&!player.dead){ const k=clamp((3.4-T.hold.t)/0.3,0,1), x=player.x, y=player.y-50-k*6; glowAt(x,y,50,'255,226,150',0.6*k); drawTrialItemIcon(T.hold.item,x,y,1.3*k,t); }
};
// the mood of each Trial: sunbeams through the roots, light dancing off water, cloud shadows sliding by
function trialRoomLight(R,th,t){
  const seed=(R.id.charCodeAt(0)*131+R.ox*7+R.oy*3)%997, w=R.x1-R.x0, h=R.y1-R.y0;
  ctx.save();
  if(th==='leap'){
    ctx.globalCompositeOperation='lighter';
    const nb=R.sw>1?5:3;
    for(let b=0;b<nb;b++){ const fx=R.x0+w*((0.18+0.32*b/(nb>3?1.6:1)+((seed*(b+1))%11)/60)%0.9+0.05), fy=R.y0+h*(0.35+((seed*(b+3))%7)/14), a=0.075+0.025*Math.sin(t*0.6+b*2.1);
      const g=ctx.createRadialGradient(fx,fy,4,fx,fy,100); g.addColorStop(0,`rgba(255,236,160,${a*1.9})`); g.addColorStop(1,'rgba(255,236,160,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(fx,fy,100,64,-0.5,0,TAU); ctx.fill();
      ctx.save(); ctx.translate(fx,fy); ctx.rotate(-2.25); const lg=ctx.createLinearGradient(0,-46,0,46); lg.addColorStop(0,'rgba(255,240,180,0)'); lg.addColorStop(0.5,`rgba(255,240,180,${a})`); lg.addColorStop(1,'rgba(255,240,180,0)'); ctx.fillStyle=lg; ctx.beginPath(); ctx.moveTo(0,-46); ctx.lineTo(520,-70); ctx.lineTo(520,70); ctx.lineTo(0,46); ctx.closePath(); ctx.fill(); ctx.restore();
      for(let m=0;m<6;m++){ const f=((t*0.07+m*0.17+b*0.31)%1), mx=fx+Math.cos(-2.25)*f*360+Math.sin(t*0.9+m)*10, my=fy+Math.sin(-2.25)*f*360; ctx.fillStyle=`rgba(255,250,215,${0.55*Math.sin(f*Math.PI)})`; ctx.fillRect(mx,my,2,2); } }
  }else if(th==='tide'){
    ctx.globalCompositeOperation='lighter';
    for(let b=0;b<7;b++){ const fx=R.x0+w*(0.5+0.42*Math.sin(t*0.13+b*1.9+seed)), fy=R.y0+h*(0.5+0.4*Math.cos(t*0.11+b*2.7)), r=70+30*Math.sin(t*0.5+b);
      const g=ctx.createRadialGradient(fx,fy,0,fx,fy,r); g.addColorStop(0,'rgba(140,220,255,.07)'); g.addColorStop(0.6,'rgba(120,210,255,.03)'); g.addColorStop(1,'rgba(120,210,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(fx,fy,r,0,TAU); ctx.fill(); }
    ctx.strokeStyle='rgba(200,240,255,.05)'; ctx.lineWidth=3; for(let b=0;b<6;b++){ const yy=R.y0+h*((b/6+t*0.02)%1); ctx.beginPath(); ctx.moveTo(R.x0,yy); for(let xx=0;xx<=w;xx+=40) ctx.lineTo(R.x0+xx,yy+Math.sin(xx*0.02+t*1.4+b)*8); ctx.stroke(); }
  }else{
    for(let b=0;b<3;b++){ const fx=R.x0-200+((t*22+b*420+seed)%(w+400)), fy=R.y0+h*(0.25+0.3*b), g=ctx.createRadialGradient(fx,fy,10,fx,fy,180); g.addColorStop(0,'rgba(70,80,120,.10)'); g.addColorStop(1,'rgba(70,80,120,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(fx,fy,200,110,0.2,0,TAU); ctx.fill(); }
    ctx.globalCompositeOperation='lighter';
    for(let b=0;b<12;b++){ const f=((t*0.05+b*0.083)%1), x=R.x0+w*((b*0.37+seed*0.01)%1), y=R.y0+h*f; ctx.fillStyle=`rgba(255,240,190,${0.35*Math.sin(f*Math.PI)})`; ctx.fillRect(x,y,2,2); }
  }
  ctx.restore();
}
function drawTrialItemIcon(item,x,y,s,t){
  if(s<=0.02) return;
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  if(item==='boomerang'){ ctx.rotate(Math.sin(t*2)*0.2); ctx.strokeStyle='#5a2a10'; ctx.lineWidth=8; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-14,8); ctx.quadraticCurveTo(0,-14,14,8); ctx.stroke(); ctx.strokeStyle='#d8743a'; ctx.lineWidth=5.5; ctx.stroke(); ctx.strokeStyle='#ffd27a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-11,5); ctx.quadraticCurveTo(0,-10,11,5); ctx.stroke(); }
  else if(item==='bow'){ ctx.strokeStyle='#e8dcc0'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(0,0,14,-1.2,1.2); ctx.stroke(); ctx.strokeStyle='#bfe8ff'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(Math.cos(-1.2)*14,Math.sin(-1.2)*14); ctx.lineTo(Math.cos(1.2)*14,Math.sin(1.2)*14); ctx.stroke(); ctx.strokeStyle='#c8a060'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(16,0); ctx.stroke(); ctx.fillStyle='#e8f0f8'; ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(13,-3); ctx.lineTo(13,3); ctx.fill(); }
  else if(item==='bosskey'){ ctx.rotate(-0.5); ctx.strokeStyle='#ffc040'; ctx.fillStyle='#ffc040'; ctx.lineWidth=4.5; ctx.beginPath(); ctx.arc(-9,0,7,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-2,0); ctx.lineTo(16,0); ctx.stroke(); ctx.fillRect(10,0,3.5,7); ctx.fillRect(14,0,3.5,5); ctx.fillStyle='#ff6a2a'; ctx.beginPath(); ctx.moveTo(-9,-5); ctx.quadraticCurveTo(-5,-1,-9,4); ctx.quadraticCurveTo(-13,-1,-9,-5); ctx.fill(); }
  else { ctx.fillStyle='#e8d8b0'; rrect(ctx,-13,-10,26,20,2); ctx.fill(); ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=1.2; ctx.strokeRect(-11,-8,22,16); ctx.fillStyle='#7a5a2a'; for(let i=0;i<3;i++) ctx.fillRect(-8+i*6,-4+(i%2)*4,4,3); ctx.strokeStyle='#c8322a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4,2); ctx.lineTo(8,6); ctx.moveTo(8,2); ctx.lineTo(4,6); ctx.stroke(); }
  ctx.restore();
}
// boss doors and rune overlays on the sealed doors that need a dungeon item
FL.tdoor=(o,t)=>{
  const g=o.ref, x=g.x, y=g.y, horiz=g.vertical, th=AREA?AREA.def.theme:'leap';
  if(g.type==='boss'){
    if(g.opened&&!g.closed){ ctx.fillStyle='rgba(0,0,0,.2)'; if(horiz) ctx.fillRect(x-72,y-8,144,16); else ctx.fillRect(x-8,y-72,16,144); return; }
    if(g.tmp) return;
    const W2=horiz?150:52, H2=horiz?52:150, stone=th==='sky'?'#e8dcc0':th==='tide'?'#8ab0c4':'#6a7050';
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(x-W2/2+4,y-H2/2+6,W2,H2);
    ctx.fillStyle=r2lg(ctx,x-W2/2,y-H2/2,x+W2/2,y+H2/2,r2c(stone,0.2),stone,r2c(stone,-0.5)); ctx.fillRect(x-W2/2,y-H2/2,W2,H2);
    ctx.strokeStyle='#ffc040'; ctx.lineWidth=3; ctx.strokeRect(x-W2/2+3,y-H2/2+3,W2-6,H2-6);
    ctx.fillStyle=r2c(stone,-0.35); ctx.beginPath(); ctx.arc(x,y,18,0,TAU); ctx.fill();
    ctx.fillStyle=`rgba(255,150,60,${0.6+0.3*Math.sin(t*3)})`; ctx.beginPath(); ctx.moveTo(x,y-13); ctx.quadraticCurveTo(x+9,y-2,x+6,y+6); ctx.quadraticCurveTo(x,y+11,x-6,y+6); ctx.quadraticCurveTo(x-9,y-2,x,y-13); ctx.fill();
    ctx.fillStyle='#2a1a0a'; ctx.beginPath(); ctx.arc(x,y+1,3,0,TAU); ctx.fill(); ctx.fillRect(x-1.5,y+1,3,6);
    if(G.found['bkey_'+AREA.def.id]) glowAt(x,y,60,'255,200,110',0.35+0.15*Math.sin(t*4));
  }else if(g.type==='gate'&&g.closed&&!g.tmp){
    const R=AREA.rooms[g.gateRoom], need=R&&R.need; if(!need) return;
    ctx.save(); ctx.translate(x,y-(horiz?4:0)); ctx.fillStyle='rgba(20,14,8,.75)'; ctx.beginPath(); ctx.arc(0,0,14,0,TAU); ctx.fill();
    ctx.strokeStyle=`rgba(255,226,150,${0.75+0.2*Math.sin(t*3)})`; ctx.lineWidth=2.2; ctx.lineCap='round';
    if(need.includes('boomerang')){ ctx.beginPath(); ctx.moveTo(-8,5); ctx.quadraticCurveTo(0,-11,8,5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(-3,0,9,-1.1,1.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(9,0); ctx.moveTo(5,-3); ctx.lineTo(9,0); ctx.lineTo(5,3); ctx.stroke(); }
    ctx.restore();
  }
};

// glowing decorations along the Trial walls: ferns (Leap), shells (Tide), wind chimes (Sky)
function drawTrialDecor(o,t){
  const x=o.x, y=o.y, s=o.s||1;
  if(o.dk==='fern'){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*0.55+Math.sin(t*1.2+x+i)*0.05; ctx.strokeStyle='#4a7a2a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,4); ctx.quadraticCurveTo(Math.cos(a)*8,4+Math.sin(a)*8,Math.cos(a)*16,4+Math.sin(a)*16); ctx.stroke(); ctx.fillStyle='#7ab040'; for(let k=1;k<4;k++){ const px=Math.cos(a)*k*4.5, py=4+Math.sin(a)*k*4.5; ctx.beginPath(); ctx.ellipse(px,py,3,1.4,a+1,0,TAU); ctx.fill(); } } ctx.fillStyle=`rgba(210,255,140,${0.7+0.3*Math.sin(t*2+x)})`; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(Math.cos(i*2.1)*6,Math.sin(i*2.1)*4-6,1.6,0,TAU); ctx.fill(); } ctx.restore(); glowAt(x,y-4,22*s,'190,240,120',0.32); }
  else if(o.dk==='shell'){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); for(let i=0;i<3;i++){ ctx.save(); ctx.translate((i-1)*7,(i%2)*4); ctx.rotate(i*0.7-0.7); ctx.fillStyle=['#ffd8c8','#f0b8d0','#e8e0f8'][i]; ctx.beginPath(); ctx.arc(0,0,6,Math.PI,TAU); ctx.lineTo(0,3); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(150,90,100,.5)'; ctx.lineWidth=0.8; for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(0,3); ctx.lineTo(k*2.6,-5); ctx.stroke(); } ctx.restore(); } ctx.restore(); glowAt(x,y-2,22*s,'150,225,255',0.3+0.1*Math.sin(t*2+x)); }
  else if(o.dk==='chime'){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle='#c8a050'; ctx.fillRect(-8,-18,16,3); for(let i=0;i<3;i++){ const sw=Math.sin(t*2.4+i+x)*2; ctx.strokeStyle='#8a7040'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(-5+i*5,-15); ctx.lineTo(-5+i*5+sw,-6+i*2); ctx.stroke(); ctx.fillStyle='#ffe6a0'; ctx.fillRect(-6+i*5+sw,-6+i*2,2.4,8); } ctx.restore(); glowAt(x,y-8,20*s,'255,226,140',0.3); }
}

// ---------- the Trial gates out in the valley (and the broken pier to the Tide)
function tGateSpr(id){
  return r2S('tgate_'+id,240,210,120,150,g=>{
    const stone=id==='sky'?'#ece4d0':id==='tide'?'#c8dce6':'#8a9070', dk=r2c(stone,-0.5), lt=r2c(stone,0.3);
    // a round plaza in front
    g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0,24,104,42,0,0,TAU); g.fill();
    g.fillStyle=id==='sky'?'#e8dcc0':id==='tide'?'#9cc0d0':'#6e7258'; g.beginPath(); g.ellipse(0,20,100,40,0,0,TAU); g.fill();
    if(id==='tide'){ for(let a=0;a<14;a++) for(let r=1;r<5;r++){ const an=a/14*TAU+r*0.2, x=Math.cos(an)*r*21, y=20+Math.sin(an)*r*8.4; g.fillStyle=(a+r)%3===0?'#2a7aa8':(a+r)%3===1?'#e8f6ff':'#5ab0d0'; g.fillRect(x-4,y-2,8,4); } }
    else { g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1.4; for(let r=1;r<4;r++){ g.beginPath(); g.ellipse(0,20,r*30,r*12,0,0,TAU); g.stroke(); } for(let a=0;a<10;a++){ const an=a/10*TAU; g.beginPath(); g.moveTo(Math.cos(an)*30,20+Math.sin(an)*12); g.lineTo(Math.cos(an)*96,20+Math.sin(an)*38); g.stroke(); } }
    if(id==='leap'){ g.fillStyle='rgba(110,150,60,.5)'; for(let i=0;i<16;i++){ const an=i*2.4, r=40+(i*13)%56; g.beginPath(); g.ellipse(Math.cos(an)*r,20+Math.sin(an)*r*0.4,8+(i%3)*4,4,an,0,TAU); g.fill(); } }
    // steps up to the door
    for(let s=0;s<3;s++){ g.fillStyle=s%2?r2c(stone,-0.1):stone; rrect(g,-48+s*6,-6-s*7,96-s*12,12,3); g.fill(); g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(-48+s*6,4-s*7,96-s*12,2); }
    // the doorway
    g.fillStyle='#0a0806'; g.beginPath(); g.moveTo(-34,-14); g.lineTo(-34,-76); g.quadraticCurveTo(0,-112,34,-76); g.lineTo(34,-14); g.closePath(); g.fill();
    const dg=g.createLinearGradient(0,-100,0,-14); dg.addColorStop(0,'rgba(0,0,0,0)'); dg.addColorStop(1,id==='tide'?'rgba(60,120,160,.35)':id==='sky'?'rgba(255,220,150,.3)':'rgba(120,160,70,.3)'); g.fillStyle=dg; g.fill();
    // pillars and the arch
    for(const s of [-1,1]){
      g.fillStyle=r2lg(g,s*48-14,0,s*48+14,0,s<0?lt:stone,s<0?stone:dk); rrect(g,s*52-16,-118,32,110,5); g.fill();
      g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(s*52-16,-14,32,6);
      g.fillStyle=lt; rrect(g,s*52-20,-126,40,12,3); g.fill(); rrect(g,s*52-19,-16,38,10,3); g.fill();
      g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1; for(let yy=-104;yy<-18;yy+=16){ g.beginPath(); g.moveTo(s*52-16,yy); g.lineTo(s*52+16,yy); g.stroke(); }
    }
    g.fillStyle=r2lg(g,0,-150,0,-104,lt,stone,dk); g.beginPath(); g.moveTo(-74,-118); g.quadraticCurveTo(0,-170,74,-118); g.lineTo(74,-104); g.quadraticCurveTo(0,-150,-74,-104); g.closePath(); g.fill();
    g.strokeStyle=dk; g.lineWidth=1.5; g.stroke();
    // the carved flame over the door
    g.fillStyle=r2c(stone,-0.3); g.beginPath(); g.arc(0,-128,14,0,TAU); g.fill();
    g.fillStyle=dk; g.beginPath(); g.moveTo(0,-139); g.quadraticCurveTo(8,-130,5,-123); g.quadraticCurveTo(0,-119,-5,-123); g.quadraticCurveTo(-8,-130,0,-139); g.fill();
    // theme details
    if(id==='leap'){ g.lineCap='round'; for(let i=0;i<9;i++){ const s=i%2?1:-1, x0=s*(40+i*4), y0=-150+i*16; g.strokeStyle=i%3?'#5a3e24':'#3e5a24'; g.lineWidth=7-i*0.4; g.beginPath(); g.moveTo(x0,y0); g.bezierCurveTo(x0+s*20,y0+30,x0-s*10,y0+60,x0+s*14,y0+90); g.stroke(); }
      g.fillStyle='#6a9a3a'; for(let i=0;i<22;i++){ const an=i*0.9, x=Math.cos(an)*70, y=-120+Math.sin(an)*30; g.beginPath(); g.ellipse(x,y,6,3,an,0,TAU); g.fill(); } }
    else if(id==='tide'){ for(const s of [-1,1]) for(let i=0;i<4;i++){ g.fillStyle=['#f4dcc0','#f0c0d0','#e0e8f8'][i%3]; g.beginPath(); g.arc(s*52,-108+i*24,6,Math.PI,TAU); g.lineTo(s*52,-104+i*24); g.closePath(); g.fill(); }
      g.strokeStyle='#5aa0c0'; g.lineWidth=2; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(-70+i*30,-118+Math.abs(i-2)*-6); g.quadraticCurveTo(-60+i*30,-128,-50+i*30,-118+Math.abs(i-2)*-6); g.stroke(); } }
    else { g.fillStyle='#ffd060'; for(const s of [-1,1]){ g.fillRect(s*52-16,-118,32,3); g.fillRect(s*52-16,-58,32,2); } g.strokeStyle='#ffd060'; g.lineWidth=2; g.beginPath(); g.moveTo(-74,-118); g.quadraticCurveTo(0,-170,74,-118); g.stroke(); }
  });
}
function drawTrialGate(s,t){
  if(s.pier){ drawTrialPier(s,t); return; }
  const id=s.trial, x=s.x, y=s.y, open=trialOpen(id), done=trialDone(id), col=TRIALS[id].col;
  r2put(tGateSpr(id),x,y);
  if(s.light) s.light.i=open?0.78:0.12;
  // three runes over the door, awake when the Trial is open (and gold once it is passed)
  for(let i=0;i<3;i++){ const rx=x-40+i*40, ry=y-(i===1?150:134), pulse=0.6+0.4*Math.sin(t*2.2+i*1.3), c=done?'255,214,120':col;
    ctx.fillStyle=open?`rgba(${c},${0.75*pulse+0.2})`:'rgba(90,90,90,.7)'; ctx.save(); ctx.translate(rx,ry); ctx.rotate(i*0.4);
    ctx.beginPath(); if(i===0){ ctx.moveTo(0,-7); ctx.lineTo(6,6); ctx.lineTo(-6,6); ctx.closePath(); } else if(i===1){ ctx.arc(0,0,6,0,TAU); ctx.moveTo(3,0); ctx.arc(0,0,3,0,TAU,true); } else { ctx.moveTo(-6,-6); ctx.lineTo(6,6); ctx.lineTo(6,-6); ctx.lineTo(-6,6); ctx.closePath(); } ctx.fill('evenodd'); ctx.restore();
    if(open) glowAt(rx,ry,26,c,0.45*pulse); }
  if(open){ glowAt(x,y-60,70,done?'255,214,120':col,0.22+0.08*Math.sin(t*1.7)); if(Math.random()<0.12) emit(x+rand(-30,30),y-20,1,{col:done?'255,226,150':col,ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.8,lmax:1.4,zmin:1.2,zmax:2.4,rise:12}); }
  else { ctx.strokeStyle='rgba(60,70,40,.85)'; ctx.lineWidth=4; ctx.lineCap='round'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(x-32,y-30-i*16); ctx.quadraticCurveTo(x,y-22-i*16+Math.sin(i)*6,x+32,y-34-i*14); ctx.stroke(); } }
  if(id==='tide'){ for(const sx of [-86,86]){ for(let i=0;i<4;i++){ const f=((t*1.2+i*0.25)%1); ctx.fillStyle=`rgba(200,240,255,${0.7*(1-f)})`; ctx.beginPath(); ctx.arc(x+sx+Math.cos(i*1.6)*f*10,y+10-Math.sin(f*Math.PI)*16,2,0,TAU); ctx.fill(); } } }
  if(id==='sky'){ for(const sx of [-1,1]){ ctx.save(); ctx.translate(x+sx*52,y-126); const w=Math.sin(t*3+sx)*0.25; ctx.fillStyle=open?'#ffd060':'#b8a070'; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(sx*24,-6+w*20,sx*46,4+w*30); ctx.lineTo(sx*40,12+w*28); ctx.quadraticCurveTo(sx*20,6+w*18,0,8); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  if(id==='leap'&&open&&isNight()) for(let i=0;i<4;i++){ const a=t*0.6+i*1.57; glowAt(x+Math.cos(a)*80,y-40+Math.sin(a*1.3)*30,5,'210,255,140',0.7); }
}
function drawTrialPier(s,t){
  // planks of the broken pier: the pieces Ash can stand on, plus snapped stubs and lonely posts in the gaps
  const W0=TIDE_PIER;
  const plank=(x0,x1,y0,y1,broken)=>{
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x0+3,y0+5,x1-x0,y1-y0);
    for(let x=x0;x<x1;x+=9){ const w=Math.min(8.4,x1-x); ctx.fillStyle=((x/9)|0)%2?'#8a6040':'#7a5434'; ctx.fillRect(x,y0+(broken&&x>x1-14?3:0),w,y1-y0-(broken&&x>x1-14?6:0)); ctx.fillStyle='rgba(255,230,190,.12)'; ctx.fillRect(x,y0,w,2); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x+w-1,y0,1,y1-y0); }
    ctx.fillStyle='#4a3020'; ctx.fillRect(x0,y0-2,x1-x0,3); ctx.fillRect(x0,y1-1,x1-x0,3);
    for(const px of [x0+3,x1-5]) for(const py of [y0-3,y1+1]){ ctx.fillStyle='#3a2414'; ctx.beginPath(); ctx.arc(px,py,4,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,230,190,.2)'; ctx.beginPath(); ctx.arc(px-1,py-1,1.6,0,TAU); ctx.fill(); }
  };
  for(const w of W0) plank(w.x0,w.x1,w.y0,w.y1,false);
  // snapped ends and old posts in the gaps
  const gaps=[[W0[0].x1,6430],[W0[1].x1,W0[0].x0]];
  for(const [a,b] of gaps){ for(const gx of [a+12,b-12]) for(const py of [7376,7424]){ ctx.fillStyle='#3a2414'; ctx.beginPath(); ctx.arc(gx,py,4.5,0,TAU); ctx.fill(); G.ripples&&Math.random()<0.004&&G.ripples.push({x:gx,y:py+2,t:0,max:1.2,r:9}); }
    ctx.fillStyle='#6a4a2e'; ctx.save(); ctx.translate((a+b)/2,7402); ctx.rotate(0.35+Math.sin(t*1.3)*0.05); ctx.fillRect(-14,-3,28,6); ctx.restore(); }
  const gl=0.25+0.15*Math.sin(t*2.5); glowAt((W0[0].x0+W0[0].x1)/2,7400,22,'150,225,255',trialOpen('tide')?gl:0.05);
}

// ---------- new Trial foes (same recipe as the others: rotate to face, light from the upper left, radial shading)
function drawCrab(e,fl){
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face);
  const L=lightLocal(e.face), sh=fl?['#fff','#eee','#ccc']:['#f08a5a','#c8503a','#6a1e14'], mv=Math.hypot(e.dx,e.dy)>5, w=Math.sin(e.t*(mv?18:3));
  ctx.strokeStyle=sh[2]; ctx.lineWidth=2; ctx.lineCap='round';
  for(const s of [-1,1]) for(let i=0;i<3;i++){ const lx=-6+i*5, o=mv?Math.sin(e.t*18+i*2+s)*2.5:0; ctx.beginPath(); ctx.moveTo(lx,s*7); ctx.lineTo(lx-3+o,s*13); ctx.lineTo(lx-6+o,s*16); ctx.stroke(); }
  const up=e.blocking, snap=e.snap>0;
  for(const s of [-1,1]){
    const cx=up?13:11, cy=s*(up?8:11), ca=s*(snap?0.15:up?0.55:0.9);
    ctx.strokeStyle=sh[1]; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(6,s*6); ctx.lineTo(cx,cy); ctx.stroke();
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(ca);
    ctx.fillStyle=rg(4,0,8,L,sh[0],sh[1],sh[2]); ctx.beginPath(); ctx.ellipse(5,0,8,5.5,0,0,TAU); ctx.fill();
    const op=snap?0.1:up?0.25:0.55; ctx.fillStyle=sh[1]; ctx.beginPath(); ctx.moveTo(9,-1); ctx.lineTo(16,-4-op*8); ctx.lineTo(12,1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(9,1); ctx.lineTo(16,4+op*6); ctx.lineTo(12,1); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle=rg(0,0,12,L,sh[0],sh[1],sh[2]); ctx.beginPath(); ctx.ellipse(0,0,10.5,12.5,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,230,210,.35)'; for(const [x,y] of [[-3,-5],[2,4],[-4,5],[3,-3]]){ ctx.beginPath(); ctx.arc(x,y,1.3,0,TAU); ctx.fill(); }
  ctx.strokeStyle='rgba(80,20,10,.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(-2,0,7,-1,1); ctx.stroke();
  for(const s of [-1,1]){ ctx.strokeStyle=sh[2]; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(7,s*3); ctx.lineTo(11,s*4.5); ctx.stroke(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(11.5,s*4.5,2.4,0,TAU); ctx.fill(); ctx.fillStyle='#120a08'; ctx.beginPath(); ctx.arc(12.2,s*4.5,1.2,0,TAU); ctx.fill(); }
  ctx.restore();
}
function drawEel(e,fl){
  const sub=e.sub&&e.state!=='rise'&&e.state!=='spit'&&e.state!=='up';
  ctx.save(); ctx.globalAlpha=1; ctx.translate(e.x,e.y);
  if(sub){ ctx.rotate(e.face); ctx.fillStyle='rgba(10,30,40,.35)'; ctx.beginPath(); ctx.moveTo(10,0); ctx.quadraticCurveTo(0,-5,-16,Math.sin(e.t*6)*4); ctx.quadraticCurveTo(0,5,10,0); ctx.fill(); ctx.strokeStyle='rgba(200,240,255,.25)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(0,0,14,8,0,0,TAU); ctx.stroke(); ctx.restore(); return; }
  const k=e.state==='rise'?0.4:e.state==='dive'?clamp(e.st/0.3,0,1):1;
  ctx.strokeStyle=`rgba(220,245,255,${0.4*k})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(0,4,15+Math.sin(e.t*4)*2,7,0,0,TAU); ctx.stroke();
  ctx.rotate(e.face); ctx.scale(0.6+0.4*k,0.6+0.4*k);
  const L=lightLocal(e.face), sk=fl?['#fff','#eee','#ccc']:['#7ad0d8','#2e8a9a','#103a48'];
  ctx.lineCap='round'; ctx.strokeStyle=sk[2]; ctx.lineWidth=9; ctx.beginPath(); ctx.moveTo(-10,0); ctx.quadraticCurveTo(-4,Math.sin(e.t*5)*5,4,0); ctx.stroke(); ctx.strokeStyle=sk[1]; ctx.lineWidth=7; ctx.stroke();
  ctx.fillStyle=rg(7,0,8,L,sk[0],sk[1],sk[2]); ctx.beginPath(); ctx.ellipse(7,0,8,6,0,0,TAU); ctx.fill();
  ctx.fillStyle='#5ae0e8'; ctx.beginPath(); ctx.moveTo(2,-5); ctx.lineTo(-4,-11); ctx.lineTo(6,-6); ctx.fill(); ctx.beginPath(); ctx.moveTo(2,5); ctx.lineTo(-4,11); ctx.lineTo(6,6); ctx.fill();
  const op=e.state==='spit'; ctx.fillStyle='#0a1a20'; ctx.beginPath(); ctx.ellipse(13,0,op?3.5:1.2,op?3:1,0,0,TAU); ctx.fill();
  ctx.fillStyle='#ffe066'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(10,s*3,1.6,0,TAU); ctx.fill(); }
  ctx.restore();
}
function drawGust(e,fl){
  const x=e.x, y=e.y+Math.sin(e.t*2.4)*3, ch=e.cheeks||0, blow=e.state==='blow';
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(4,26,14,5,0,0,TAU); ctx.fill();
  const puffs=[[-8,2,8],[0,-4,10],[9,1,8],[2,5,9],[-3,-1,9]];
  for(const [px,py,r] of puffs){ const g=ctx.createRadialGradient(px-r*0.4,py-r*0.4,1,px,py,r*(1+ch*0.15)); g.addColorStop(0,fl?'#fff':'#ffffff'); g.addColorStop(0.7,fl?'#fff':'#dce8f6'); g.addColorStop(1,fl?'#ddd':'#9ab0cc'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,r*(1+ch*0.15),0,TAU); ctx.fill(); }
  ctx.rotate(e.face);
  ctx.fillStyle='#2a3448'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(6,s*4,1.8,2.4,0,0,TAU); ctx.fill(); }
  ctx.fillStyle='#2a3448'; ctx.beginPath(); if(blow){ ctx.ellipse(12,0,2.8,2.2,0,0,TAU); } else ctx.ellipse(11,0,1.3,1,0,0,TAU); ctx.fill();
  if(ch>0.2){ ctx.fillStyle='rgba(255,170,190,.5)'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(8,s*8,2.6*ch,0,TAU); ctx.fill(); } }
  ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(-8,0,5,e.t*4,e.t*4+3.4); ctx.stroke();
  ctx.restore();
}
// Bramblehorn: a bark beetle the size of a cart, with a horn like a battering ram
function drawBramble(e,fl){
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face); const k=(e.r/24); ctx.scale(k,k);
  const L=lightLocal(e.face), sh=fl?['#fff','#eee','#ccc']:['#9a7a4a','#5e4424','#24160a'], mv=Math.hypot(e.dx,e.dy)>5||e.state==='charge', g=e.t*(e.state==='charge'?26:12);
  ctx.strokeStyle='#1e1408'; ctx.lineWidth=3; ctx.lineCap='round';
  for(const s of [-1,1]) for(let i=0;i<3;i++){ const lx=10-i*11, o=mv?Math.sin(g+i*2+(s>0?0:Math.PI))*4:0; ctx.beginPath(); ctx.moveTo(lx,s*14); ctx.lineTo(lx+4+o,s*24); ctx.lineTo(lx+8+o,s*28); ctx.stroke(); }
  // shell halves
  for(const s of [-1,1]){ ctx.fillStyle=rg(-4,s*8,24,L,sh[0],sh[1],sh[2]); ctx.beginPath(); ctx.moveTo(14,0); ctx.quadraticCurveTo(12,s*22,-6,s*22); ctx.quadraticCurveTo(-26,s*18,-26,0); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle='#1e1408'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(-26,0); ctx.stroke();
  ctx.strokeStyle='rgba(30,18,8,.45)'; ctx.lineWidth=1.2; for(const s of [-1,1]) for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(8-i*8,s*3); ctx.quadraticCurveTo(4-i*8,s*12,-2-i*7,s*19); ctx.stroke(); }
  ctx.fillStyle='rgba(110,160,60,.55)'; for(const [x,y,r] of [[-12,-10,5],[-4,12,4],[-18,6,3.5],[2,-14,3]]){ ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
  ctx.fillStyle='rgba(255,240,210,.25)'; ctx.beginPath(); ctx.ellipse(-4,-9,10,4,-0.3,0,TAU); ctx.fill();
  // head and the horn
  ctx.fillStyle=rg(18,0,10,L,sh[0],sh[1],sh[2]); ctx.beginPath(); ctx.ellipse(18,0,9,11,0,0,TAU); ctx.fill();
  const hornUp=e.blocking?1:0.7;
  ctx.fillStyle=fl?'#fff':r2lg(ctx,20,-4,46,4,'#d8c09a','#8a6a40'); ctx.beginPath(); ctx.moveTo(22,-5); ctx.quadraticCurveTo(36,-10*hornUp,46,-3); ctx.lineTo(40,0); ctx.quadraticCurveTo(46,4,38,8*hornUp); ctx.quadraticCurveTo(30,6,22,5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(60,40,20,.5)'; ctx.lineWidth=1; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(26+i*4,-5+i*0.6); ctx.lineTo(26+i*4,5-i*0.6); ctx.stroke(); }
  ctx.fillStyle=e.stun>0?'#ffe066':'#e84a2a'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(22,s*7,2,0,TAU); ctx.fill(); }
  ctx.restore();
}
// Old Gnarl: a giant made of a whole old tree. Roots for legs, a beard of moss, and a soft glowing knot on his back.
function drawGnarl(e,fl){
  const dying=e.dead&&e.deathT!=null;
  ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face);
  const L=lightLocal(e.face), bark=fl?['#fff','#eee','#ccc']:['#8e6a44','#5a3e24','#24160a'], moss=fl?'#fff':'#6a8a34', t=e.t;
  const stuck=e.state==='stuck'||e.state==='flinch', walk=(e.walk||0)*5, lift=e.lift||0;
  ctx.lineCap='round'; ctx.lineJoin='round';
  // root legs spreading into the floor
  for(let i=0;i<8;i++){ const a=i/8*TAU+0.2, w=Math.sin(walk+i*1.7)*(stuck?0:0.15), len=e.r*(stuck?1.25:1.05)+Math.sin(i*3)*6;
    ctx.strokeStyle=bark[2]; ctx.lineWidth=11-i%3*2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*e.r*0.5,Math.sin(a)*e.r*0.5); ctx.quadraticCurveTo(Math.cos(a+w)*len*0.8,Math.sin(a+w)*len*0.8,Math.cos(a+w*1.6)*len,Math.sin(a+w*1.6)*len); ctx.stroke();
    ctx.strokeStyle=bark[1]; ctx.lineWidth=6-i%3; ctx.stroke(); }
  // arms
  const sw=e.swing>0?Math.sin((0.3-e.swing)/0.3*Math.PI)*1.2:0, arms=e.arms||0, logH=e.holdLog||0;
  for(const s of [-1,1]){
    const ang=s*(1.0-arms*0.5-logH*0.6)+(s>0?sw:-sw*0.3), sx=6, sy=s*e.r*0.62, hx=sx+Math.cos(ang)*e.r*0.95, hy=sy+Math.sin(ang)*e.r*0.55+lift*s*8;
    ctx.strokeStyle=bark[2]; ctx.lineWidth=17; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(sx+e.r*0.4,sy+s*e.r*0.35,hx,hy); ctx.stroke();
    ctx.strokeStyle=bark[1]; ctx.lineWidth=12; ctx.stroke();
    ctx.fillStyle=rg(hx,hy,12,L,bark[0],bark[1],bark[2]); ctx.beginPath(); ctx.arc(hx,hy,12,0,TAU); ctx.fill();
    ctx.strokeStyle=bark[2]; ctx.lineWidth=4; for(let f=-1;f<=1;f++){ ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx+Math.cos(ang+f*0.5)*20,hy+Math.sin(ang+f*0.5)*20); ctx.stroke(); }
  }
  if(logH>0){ ctx.save(); ctx.translate(16,0); ctx.fillStyle=r2lg(ctx,0,-12,0,12,'#9a6a3a','#5a3a1e'); rrect(ctx,-14,-56,28,112,10); ctx.fill(); ctx.fillStyle='#c8a070'; ctx.beginPath(); ctx.ellipse(0,-54,12,5,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0,54,12,5,0,0,TAU); ctx.fill(); ctx.restore(); }
  // the great trunk body
  const bs=1+lift*0.06;
  ctx.fillStyle=rg(-4,0,e.r,L,bark[0],bark[1],bark[2]); ctx.beginPath(); ctx.ellipse(-4,0,e.r*0.98*bs,e.r*0.84*bs,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(20,10,4,.45)'; ctx.lineWidth=2.4; for(let i=0;i<7;i++){ const yy=(i-3)*e.r*0.24; ctx.beginPath(); ctx.moveTo(-e.r*0.8,yy*0.9); ctx.bezierCurveTo(-e.r*0.3,yy+Math.sin(i)*6,e.r*0.2,yy-Math.sin(i)*6,e.r*0.6,yy*0.8); ctx.stroke(); }
  // a crown of old branches with leaves on his back
  for(const [bx,by,ba,bl] of [[-24,-14,-2.4,30],[-30,10,2.5,26],[-6,-4,-1.9,22]]){ const sw=Math.sin(t*1.4+bx)*0.08; ctx.strokeStyle=bark[2]; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(bx,by); const ex=bx+Math.cos(ba+sw)*bl, ey=by+Math.sin(ba+sw)*bl; ctx.lineTo(ex,ey); ctx.stroke(); ctx.strokeStyle=bark[1]; ctx.lineWidth=4; ctx.stroke();
    ctx.fillStyle=fl?'#fff':'#4e7a2a'; for(let q=0;q<5;q++){ const la=ba+sw+(q-2)*0.55; ctx.beginPath(); ctx.ellipse(ex+Math.cos(la)*9,ey+Math.sin(la)*9,8,5,la,0,TAU); ctx.fill(); } ctx.fillStyle=fl?'#fff':'rgba(160,210,90,.8)'; ctx.beginPath(); ctx.arc(ex-2,ey-2,4,0,TAU); ctx.fill(); }
  // moss on the shoulders
  ctx.fillStyle=moss; for(const [x,y,r] of [[-10,-26,12],[6,-30,9],[-18,24,11],[4,28,9],[-30,-6,8],[12,6,7]]){ ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
  ctx.fillStyle=fl?'#fff':'rgba(190,230,120,.55)'; for(const [x,y,r] of [[-13,-29,5],[3,-33,4],[-21,21,4]]){ ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
  // the knot on his back
  const kx=-e.r*0.62, ky=0, kp=stuck?0.75+0.25*Math.sin(t*10):0.35+0.1*Math.sin(t*2);
  ctx.fillStyle=bark[2]; ctx.beginPath(); ctx.ellipse(kx,ky,14,12,0,0,TAU); ctx.fill();
  ctx.fillStyle=`rgba(255,${stuck?210:160},${stuck?90:60},${kp})`; ctx.beginPath(); ctx.ellipse(kx,ky,10,8,0,0,TAU); ctx.fill();
  ctx.strokeStyle=`rgba(255,240,180,${kp})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(kx,ky,6,4.5,0,0,TAU); ctx.stroke();
  // head with a moss beard
  const hx=e.r*0.66;
  ctx.fillStyle=moss; for(let i=0;i<6;i++){ const a=-0.9+i*0.36; ctx.beginPath(); ctx.ellipse(hx+12+Math.cos(a)*8,Math.sin(a)*14,7,4,a,0,TAU); ctx.fill(); }
  ctx.fillStyle=rg(hx,0,19,L,bark[0],bark[1],bark[2]); ctx.beginPath(); ctx.ellipse(hx,0,18,20,0,0,TAU); ctx.fill();
  ctx.fillStyle=bark[2]; ctx.beginPath(); ctx.moveTo(hx+4,-16); ctx.quadraticCurveTo(hx+14,-8,hx+16,0); ctx.quadraticCurveTo(hx+14,8,hx+4,16); ctx.lineTo(hx+8,0); ctx.closePath(); ctx.fill();
  for(const s of [-1,1]){ ctx.strokeStyle=bark[1]; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(hx-6,s*14); ctx.quadraticCurveTo(hx-16,s*28,hx-10,s*40); ctx.stroke(); ctx.strokeStyle=moss; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hx-12,s*30); ctx.lineTo(hx-6,s*34); ctx.stroke(); }
  ctx.save(); if(!fl){ ctx.shadowColor='#b8ff60'; ctx.shadowBlur=8; } ctx.fillStyle=stuck?'#ffe066':'#c8ff70'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(hx+8,s*7,3.4,2.4,0,0,TAU); ctx.fill(); } ctx.restore();
  if(dying||e.trialSprout){ ctx.strokeStyle='#5a9a2a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hx-4,0); ctx.lineTo(hx-4,-10); ctx.stroke(); ctx.fillStyle='#8ad04a'; ctx.beginPath(); ctx.ellipse(hx-8,-12,4,2,-0.5,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx,-12,4,2,0.5,0,TAU); ctx.fill(); }
  ctx.restore();
  if(e.burnT>0) glowAt(e.x,e.y,e.r*1.3,'255,130,50',0.35);
  if(stuck) glowAt(e.x-Math.cos(e.face)*e.r*0.62,e.y-Math.sin(e.face)*e.r*0.62,30,'255,210,110',0.6);
}
// the Mirrow Serpent: coils that break the water here and there, and a big crested head when he comes up
function drawSerpent(e,fl){
  const tr=e.trail; if(!tr) return;
  const t=e.t, up=!e.sub, rise=e.rise||0, S=1.3;
  ctx.save(); ctx.globalAlpha=1; ctx.lineCap='round'; ctx.lineJoin='round';
  const sk=fl?['#fff','#eee','#ccc']:['#6ad0e0','#2a7a98','#0e3448'];
  // the body: a wavy line along the trail; humps break the surface, the rest is a shadow under the water
  const n=tr.length, P=[];
  for(let i=0;i<n;i++){ const a=tr[Math.max(0,i-1)], b=tr[Math.min(n-1,i+1)], dx=a.x-b.x, dy=a.y-b.y, l=Math.hypot(dx,dy)||1, w=Math.sin(i*0.3-t*2.6)*11*Math.min(1,i/8); P.push({x:tr[i].x-dy/l*w,y:tr[i].y+dx/l*w,r:(20-i*0.22)*S,h:Math.sin(i*0.26-t*1.3)}); }
  ctx.strokeStyle='rgba(6,22,32,.32)'; for(let i=2;i<n-1;i++){ ctx.lineWidth=P[i].r*2.2; ctx.beginPath(); ctx.moveTo(P[i].x,P[i].y+4); ctx.lineTo(P[i+1].x,P[i+1].y+4); ctx.stroke(); }
  if(up){
    for(let i=3;i<n-1;i++){ const a=P[i], b=P[i+1]; if(a.h<0.18) continue; const k=clamp((a.h-0.18)/0.4,0,1), lift=k*6;
      ctx.strokeStyle='rgba(10,40,56,.9)'; ctx.lineWidth=a.r*2+3; ctx.beginPath(); ctx.moveTo(a.x,a.y-lift); ctx.lineTo(b.x,b.y-lift); ctx.stroke();
      ctx.strokeStyle=sk[1]; ctx.lineWidth=a.r*2; ctx.stroke();
      ctx.strokeStyle=`rgba(170,240,250,${0.55*k})`; ctx.lineWidth=a.r*0.55; ctx.beginPath(); ctx.moveTo(a.x-a.r*0.25,a.y-lift-a.r*0.45); ctx.lineTo(b.x-a.r*0.25,b.y-lift-a.r*0.45); ctx.stroke();
      if(i%3===0){ ctx.fillStyle=fl?'#fff':'#4ac0d8'; ctx.beginPath(); ctx.moveTo(a.x,a.y-lift-a.r*0.6); ctx.lineTo(a.x-4,a.y-lift-a.r*0.6-10*k); ctx.lineTo(a.x+6,a.y-lift-a.r*0.5); ctx.closePath(); ctx.fill(); }
      const pa=P[i-1]; if(pa.h<0.18||(P[i+2]&&P[i+2].h<0.18)){ ctx.strokeStyle='rgba(225,250,255,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(a.x,a.y+a.r*0.3,a.r*1.15,a.r*0.5,0,0,TAU); ctx.stroke(); }
    }
    const a=P[n-1], b=P[n-6]||P[0]; if(a.h>0.18){ const ta=angTo(b.x,b.y,a.x,a.y); ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(ta); ctx.fillStyle=sk[1]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(26,-18); ctx.lineTo(18,0); ctx.lineTo(26,18); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  if(!up){ // just a dark shape under the water and ripples
    ctx.translate(e.x,e.y); ctx.rotate(e.face); ctx.scale(S,S); ctx.fillStyle='rgba(8,24,34,.42)'; ctx.beginPath(); ctx.ellipse(0,0,30,18,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(220,250,255,.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(4,0,38+Math.sin(t*5)*3,24,0,0,TAU); ctx.stroke();
    ctx.fillStyle='rgba(255,230,120,.55)'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(14,s*9,2.4,0,TAU); ctx.fill(); }
    ctx.restore(); return; }
  // the neck rising out of the water, then the head
  const L=lightLocal(e.face), k=0.65+0.35*rise;
  ctx.strokeStyle='rgba(220,250,255,.55)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(e.x-Math.cos(e.face)*18,e.y-Math.sin(e.face)*18,34+Math.sin(t*4)*3,18,e.face,0,TAU); ctx.stroke();
  ctx.translate(e.x,e.y-14*rise); ctx.rotate(e.face); ctx.scale(k*S,k*S);
  ctx.strokeStyle=sk[2]; ctx.lineWidth=30; ctx.beginPath(); ctx.moveTo(-34,14*rise); ctx.quadraticCurveTo(-18,6,0,0); ctx.stroke(); ctx.strokeStyle=sk[1]; ctx.lineWidth=24; ctx.stroke();
  ctx.strokeStyle='rgba(200,240,235,.6)'; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(-30,14*rise+6); ctx.quadraticCurveTo(-16,10,0,6); ctx.stroke();
  // crest fins
  ctx.fillStyle=fl?'#fff':'#4ac0d8'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(-6-i*9,-10+i*1); ctx.lineTo(-14-i*9,-24+i*2); ctx.lineTo(-18-i*9,-8+i); ctx.closePath(); ctx.fill(); }
  for(const s of [-1,1]){ ctx.fillStyle=fl?'#fff':'#5ad8e8'; ctx.beginPath(); ctx.moveTo(4,s*14); ctx.quadraticCurveTo(-8,s*34,-22,s*30); ctx.quadraticCurveTo(-10,s*22,-4,s*12); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(14,52,72,.5)'; ctx.lineWidth=1; ctx.stroke(); }
  ctx.fillStyle=rg(6,0,26,L,sk[0],sk[1],sk[2]); ctx.beginPath(); ctx.ellipse(6,0,26,18,0,0,TAU); ctx.fill();
  const open=e.spit>0||e.state==='whirl'; e.spit=(e.spit||0)-1/60;
  ctx.fillStyle=sk[1]; ctx.beginPath(); ctx.moveTo(14,-14); ctx.quadraticCurveTo(42,-10,46,0); ctx.quadraticCurveTo(42,10,14,14); ctx.closePath(); ctx.fill();
  if(open){ ctx.fillStyle='#0a1e2a'; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(46,-7); ctx.lineTo(46,7); ctx.closePath(); ctx.fill(); ctx.fillStyle='#e8f4f0'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(26+i*5,-5+i*0.6); ctx.lineTo(28+i*5,-1); ctx.lineTo(30+i*5,-5+i*0.6); ctx.fill(); } }
  ctx.fillStyle='rgba(180,240,250,.45)'; for(const [x,y] of [[0,-8],[8,-10],[-4,6],[10,8],[18,-4]]){ ctx.beginPath(); ctx.arc(x,y,2,0,TAU); ctx.fill(); }
  ctx.save(); if(!fl){ ctx.shadowColor='#ffe066'; ctx.shadowBlur=8; } ctx.fillStyle='#ffe066'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(20,s*9,4.5,3,s*0.3,0,TAU); ctx.fill(); } ctx.fillStyle='#0a1a20'; for(const s of [-1,1]){ ctx.fillRect(19.4,s*9-2.4,1.4,4.8); } ctx.restore();
  ctx.fillStyle='rgba(10,30,40,.6)'; for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(42,s*4,1.6,0,TAU); ctx.fill(); }
  ctx.restore();
  if(Math.random()<0.2) emit(e.x+rand(-20,20),e.y+rand(-6,10),1,{col:'200,240,255',glow:false,ang:Math.PI/2,spread:0.6,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:3});
}
// Skrae the Storm Wyvern: white and storm-blue, with gold stripes and a lightning-bolt tail
function drawSkrae(e,fl){
  const t=e.t, perched=e.state==='perched'||e.state==='peck'||e.state==='takeoff', dive=e.state==='dive', flap=perched?0:Math.sin(e.flap||0);
  const T=AREA&&AREA.tri;
  if(T) for(const b of T.bolts){ const k=1-b.t/0.35; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(220,235,255,${k})`; ctx.lineWidth=5*k+1; ctx.beginPath(); let x=b.x+rand(-20,20), y=b.y-420; ctx.moveTo(x,y); for(let i=0;i<7;i++){ x=lerp(x,b.x,0.35)+rand(-18,18); y+=60; ctx.lineTo(i===6?b.x:x,i===6?b.y:y); } ctx.stroke(); ctx.strokeStyle=`rgba(255,255,255,${k})`; ctx.lineWidth=1.6; ctx.stroke(); ctx.restore(); glowAt(b.x,b.y,70,'200,220,255',0.6*k); }
  ctx.save(); ctx.translate(e.x,e.y-(perched?0:18)); ctx.rotate(e.face); ctx.scale(1.35,1.35);
  const L=lightLocal(e.face), body=fl?['#fff','#eee','#ccc']:['#ffffff','#9aaccc','#26345a'], mem=fl?'rgba(255,255,255,.85)':'rgba(64,86,150,.9)', gold='#ffcc40';
  ctx.lineCap='round'; ctx.lineJoin='round';
  // tail with a lightning tip
  let px=-26, py=0, ang=Math.PI; const segs=[];
  for(let i=0;i<8;i++){ ang+=Math.sin(t*2.4-i*0.6)*0.12; px+=Math.cos(ang)*11; py+=Math.sin(ang)*11; segs.push([px,py,9-i*0.8]); }
  for(const [x,y,r] of segs){ ctx.fillStyle=body[2]; ctx.beginPath(); ctx.arc(x,y,r+1.5,0,TAU); ctx.fill(); }
  for(const [x,y,r] of segs){ ctx.fillStyle=body[1]; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
  { const [x,y]=segs[7], [x2,y2]=segs[6], ta=Math.atan2(y-y2,x-x2); ctx.save(); ctx.translate(x,y); ctx.rotate(ta); ctx.fillStyle=gold; ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(10,-2); ctx.lineTo(6,2); ctx.lineTo(18,6); ctx.lineTo(4,6); ctx.lineTo(8,2); ctx.lineTo(0,3); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // wings
  for(const s of [-1,1]){
    const w=perched?0.38:dive?0.55:(0.82+flap*0.25);
    ctx.save(); ctx.scale(1,s*w);
    ctx.fillStyle=mem; ctx.beginPath(); ctx.moveTo(10,10); ctx.lineTo(-6,78); ctx.lineTo(-40,96); ctx.quadraticCurveTo(-46,70,-62,66); ctx.quadraticCurveTo(-58,46,-74,36); ctx.quadraticCurveTo(-56,22,-26,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(150,180,240,.35)'; ctx.beginPath(); ctx.moveTo(6,14); ctx.lineTo(-6,70); ctx.lineTo(-26,20); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(30,40,80,.35)'; ctx.beginPath(); ctx.moveTo(-6,78); ctx.lineTo(-40,96); ctx.quadraticCurveTo(-46,70,-62,66); ctx.closePath(); ctx.fill();
    if(!fl&&(e.angry||e.state==='storm')){ ctx.strokeStyle=`rgba(200,225,255,${0.4+0.4*Math.random()})`; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-40,96); ctx.lineTo(-48,84); ctx.lineTo(-56,90); ctx.lineTo(-62,66); ctx.stroke(); }
    ctx.strokeStyle=body[2]; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(10,10); ctx.lineTo(-6,78); ctx.lineTo(-40,96); ctx.moveTo(-6,78); ctx.lineTo(-62,66); ctx.moveTo(-6,78); ctx.lineTo(-74,36); ctx.stroke();
    ctx.strokeStyle=gold; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(8,14); ctx.lineTo(-5,72); ctx.stroke();
    ctx.restore();
  }
  // body
  ctx.fillStyle=rg(0,0,24,L,body[0],body[1],body[2]); ctx.beginPath(); ctx.ellipse(0,0,26,15,0,0,TAU); ctx.fill();
  ctx.strokeStyle=gold; ctx.lineWidth=2.2; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(-16+i*9,-9); ctx.lineTo(-12+i*9,0); ctx.lineTo(-16+i*9,9); ctx.stroke(); }
  for(const s of [-1,1]){ ctx.fillStyle=body[2]; ctx.beginPath(); ctx.ellipse(10,s*14,6,4,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-12,s*14,6,4,0,0,TAU); ctx.fill(); }
  // neck and head
  ctx.strokeStyle=body[2]; ctx.lineWidth=14; ctx.beginPath(); ctx.moveTo(16,0); ctx.quadraticCurveTo(28,Math.sin(t*2)*4,40,0); ctx.stroke(); ctx.strokeStyle=body[1]; ctx.lineWidth=10; ctx.stroke();
  ctx.save(); ctx.translate(44,0);
  for(const s of [-1,1]){ ctx.strokeStyle=gold; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-2,s*6); ctx.quadraticCurveTo(-10,s*14,-20,s*16); ctx.stroke(); }
  ctx.fillStyle=rg(2,0,11,L,body[0],body[1],body[2]); ctx.beginPath(); ctx.ellipse(2,0,11,8,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6,-6); ctx.quadraticCurveTo(20,-4,22,0); ctx.quadraticCurveTo(20,4,6,6); ctx.closePath(); ctx.fill();
  ctx.save(); if(!fl){ ctx.shadowColor='#8ad8ff'; ctx.shadowBlur=8; } ctx.fillStyle='#bfefff'; for(const s of [-1,1]){ ctx.beginPath(); ctx.ellipse(6,s*4.5,2.8,1.6,s*0.3,0,TAU); ctx.fill(); } ctx.restore();
  ctx.restore();
  ctx.restore();
  if(e.charge>0||e.state==='storm'){ for(let i=0;i<3;i++){ const a=rand(0,TAU), r=rand(20,46); ctx.strokeStyle='rgba(210,230,255,.85)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(e.x,e.y-18); ctx.lineTo(e.x+Math.cos(a)*r*0.5+rand(-6,6),e.y-18+Math.sin(a)*r*0.5); ctx.lineTo(e.x+Math.cos(a)*r,e.y-18+Math.sin(a)*r); ctx.stroke(); } glowAt(e.x,e.y-18,60,'190,220,255',0.45); }
}
