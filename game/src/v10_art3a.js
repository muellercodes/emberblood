// ================= v10_art3a (A3a): art for Act III's first chapters (game/story/act3 f_pass, f_thaw)
// Only looks: defineLook(id, {w, h, draw(g, x, y, t, state), live?}) for the places those chapters add, and three
// Case Book icons. (x, y) is the point on the ground the place stands on (an icon: its centre). The static part of a
// look is drawn once and cached by the gate library (e10c_gates); `live` adds the small twinkles every frame.
const A3A_INK='#1c2236';
function a3aEll(g,x,y,rx,ry,col,lw){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); if(lw){ g.strokeStyle=A3A_INK; g.lineWidth=lw; g.stroke(); } }
// a four-point twinkle
function a3aTwinkle(g,x,y,s,a){ if(a<=0.02) return; g.save(); g.globalAlpha=a; g.fillStyle='#ffffff'; g.fillRect(x-s,y-0.6,s*2,1.2); g.fillRect(x-0.6,y-s,1.2,s*2); g.restore(); }

// ---------- f_pass: the split in the old ice wall at the top of the High Pass, with soft white moth dust in it
defineLook('moth_dust_ice',{w:84,h:58,draw(g,x,y){
  g.save(); g.translate(x,y); g.lineJoin='round'; g.lineCap='round';
  // a soft shadow and the two halves of the old ice wall, pushed apart
  g.globalAlpha=0.25; a3aEll(g,0,2,40,7,'#203048'); g.globalAlpha=1;
  for(const s of [-1,1]){
    g.fillStyle=s<0?'#bfe2f6':'#a6d2ee'; g.strokeStyle=A3A_INK; g.lineWidth=2.2;
    g.beginPath(); g.moveTo(s*6,2); g.lineTo(s*38,2); g.lineTo(s*36,-22); g.lineTo(s*28,-34); g.lineTo(s*16,-40); g.lineTo(s*9,-30); g.lineTo(s*12,-18); g.lineTo(s*5,-8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(s*16,-38); g.lineTo(s*27,-32); g.lineTo(s*22,-24); g.closePath(); g.fill();
    g.strokeStyle='rgba(60,110,160,.45)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(s*30,-20); g.lineTo(s*22,-10); g.moveTo(s*33,-8); g.lineTo(s*27,-2); g.stroke();
  }
  // the crack between them, packed with fluffy white dust (soft, not shiny), and a few scale flakes on the snow
  g.fillStyle='#f6f2fa'; g.strokeStyle='rgba(120,110,150,.55)'; g.lineWidth=1;
  for(const [px,py,r] of [[0,-4,6],[-2,-12,5],[2,-20,4.5],[-1,-27,3.6],[1,1,6.5]]){ g.beginPath(); g.arc(px,py,r,0,TAU); g.fill(); g.stroke(); }
  g.fillStyle='rgba(250,248,255,.95)';
  for(const [px,py,a] of [[-16,6,0.4],[12,7,-0.6],[22,4,1.1],[-25,5,2],[6,9,0.2]]){ g.save(); g.translate(px,py); g.rotate(a); g.beginPath(); g.ellipse(0,0,3.6,2,0,0,TAU); g.fill(); g.strokeStyle='rgba(150,140,180,.6)'; g.lineWidth=0.8; g.stroke(); g.restore(); }
  g.restore();
},live(g,x,y,t){
  // the dust drifts a little in the wind
  for(let i=0;i<4;i++){ const k=(t*0.35+i*0.25)%1; g.save(); g.globalAlpha=0.7*(1-k); g.fillStyle='#ffffff'; g.beginPath(); g.arc(x+2+k*26+Math.sin(t*2+i)*2,y-14-k*18,1.3,0,TAU); g.fill(); g.restore(); }
}});

// ---------- f_thaw: Ylva's red yarn, frozen stiff, hanging down the front of the bell tower from the very top
// (the place stands at the foot of the tower's south face; the yarn climbs the face to the knitter's chair)
defineLook('red_yarn',{w:40,h:120,draw(g,x,y){
  g.save(); g.translate(x,y); g.lineCap='round';
  // the strand: a little wavy, stiff with frost, with icicle beads on it
  const pts=[]; for(let i=0;i<=14;i++){ const k=i/14; pts.push([Math.sin(k*9)*2.2*(1-k*0.4)+k*4,-k*104]); }
  g.strokeStyle=A3A_INK; g.lineWidth=4; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke();
  g.strokeStyle='#d63a34'; g.lineWidth=2.4; g.stroke();
  g.strokeStyle='rgba(255,255,255,.65)'; g.lineWidth=0.9; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0]-0.6,p[1]):g.moveTo(p[0]-0.6,p[1])); g.stroke();
  for(let i=2;i<14;i+=3){ const p=pts[i]; g.fillStyle='#e6f6ff'; g.beginPath(); g.moveTo(p[0]-2,p[1]); g.lineTo(p[0]+2,p[1]); g.lineTo(p[0],p[1]+6); g.closePath(); g.fill(); g.strokeStyle='rgba(60,110,160,.5)'; g.lineWidth=0.8; g.stroke(); }
  // the ball of yarn at the bottom, frozen into a little lump of snow
  a3aEll(g,1,4,11,4,'#f4f8fc'); a3aEll(g,0,-3,7.2,6.6,'#d63a34',2);
  g.strokeStyle='rgba(120,20,20,.55)'; g.lineWidth=1; for(const a of [0.3,1.2,2.1]){ g.beginPath(); g.ellipse(0,-3,6,3.4,a,0,Math.PI); g.stroke(); }
  a3aEll(g,-2.4,-6,1.8,1.4,'rgba(255,255,255,.7)');
  a3aEll(g,0,3,9,2.6,'#ffffff');
  g.restore();
},live(g,x,y,t){ const k=Math.sin(t*2.3); if(k>0.6) a3aTwinkle(g,x+3,y-40-((t*7|0)%3)*20,1.5+2*(k-0.6),0.9); }});

// ---------- f_thaw: Ylva's brass spyglass on its tripod, pointing at Mount Dread (north-east), rimed with frost
defineLook('spyglass',{w:46,h:52,draw(g,x,y){
  g.save(); g.translate(x,y); g.lineCap='round'; g.lineJoin='round';
  g.globalAlpha=0.28; a3aEll(g,0,1,14,4,'#102030'); g.globalAlpha=1;
  // three wooden legs
  g.strokeStyle=A3A_INK; g.lineWidth=4.2; for(const [lx,ly] of [[-11,2],[11,2],[2,-3]]){ g.beginPath(); g.moveTo(0,-24); g.lineTo(lx,ly); g.stroke(); }
  g.strokeStyle='#8a5e34'; g.lineWidth=2.4; for(const [lx,ly] of [[-11,2],[11,2],[2,-3]]){ g.beginPath(); g.moveTo(0,-24); g.lineTo(lx,ly); g.stroke(); }
  // the brass tube, tilted up toward the mountain
  g.save(); g.translate(0,-26); g.rotate(-0.5);
  g.fillStyle='#c89a3a'; g.strokeStyle=A3A_INK; g.lineWidth=2; g.beginPath(); g.moveTo(-12,-3.4); g.lineTo(10,-4.6); g.lineTo(10,4.6); g.lineTo(-12,3.4); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#e8c060'; g.beginPath(); g.moveTo(10,-6); g.lineTo(18,-6.6); g.lineTo(18,6.6); g.lineTo(10,6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#9ad8ff'; g.beginPath(); g.ellipse(18,0,1.8,5.6,0,0,TAU); g.fill();
  g.fillStyle='#8a6420'; g.fillRect(-14,-2.6,3,5.2);
  g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(-10,-3,18,1.4);
  // frost on top of the tube
  g.fillStyle='#f4fbff'; g.beginPath(); g.ellipse(2,-4.4,9,2,0,0,TAU); g.fill();
  g.restore();
  g.fillStyle='#5a3e22'; g.beginPath(); g.arc(0,-24,2.6,0,TAU); g.fill();
  g.restore();
},live(g,x,y,t){ const k=Math.sin(t*1.7+1); if(k>0.7) a3aTwinkle(g,x+14,y-40,1.4+3*(k-0.7),0.95); }});

// ---------- Case Book icons (drawn round their centre, about 24 px)
defineLook('icon_yarn',{w:24,h:24,draw(g,x,y){
  g.save(); g.translate(x,y); a3aEll(g,0,1,8,7.6,'#d63a34',1.6);
  g.strokeStyle='rgba(110,20,20,.6)'; g.lineWidth=1; for(const a of [0.2,1.1,2]){ g.beginPath(); g.ellipse(0,1,6.4,3.6,a,0,Math.PI); g.stroke(); }
  g.strokeStyle='#d63a34'; g.lineWidth=1.8; g.beginPath(); g.moveTo(6,-3); g.quadraticCurveTo(10,-8,7,-11); g.stroke(); g.restore(); }});
defineLook('icon_spyglass',{w:24,h:24,draw(g,x,y){
  g.save(); g.translate(x,y); g.rotate(-0.6); g.fillStyle='#c89a3a'; g.strokeStyle=A3A_INK; g.lineWidth=1.6;
  g.beginPath(); g.moveTo(-9,-2.4); g.lineTo(4,-3.4); g.lineTo(4,3.4); g.lineTo(-9,2.4); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#e8c060'; g.beginPath(); g.moveTo(4,-4.6); g.lineTo(10,-5); g.lineTo(10,5); g.lineTo(4,4.6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#9ad8ff'; g.beginPath(); g.ellipse(10,0,1.4,4,0,0,TAU); g.fill(); g.restore(); }});
defineLook('icon_snowflake',{w:24,h:24,draw(g,x,y){
  g.save(); g.translate(x,y); g.lineCap='round';
  for(const [col,lw] of [[A3A_INK,3.6],['#bfe6ff',1.8]]){ g.strokeStyle=col; g.lineWidth=lw;
    for(let i=0;i<6;i++){ const a=i/6*TAU; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*9,Math.sin(a)*9);
      const bx=Math.cos(a)*5.4, by=Math.sin(a)*5.4; for(const s of [-1,1]){ g.moveTo(bx,by); g.lineTo(bx+Math.cos(a+s*0.8)*3,by+Math.sin(a+s*0.8)*3); } g.stroke(); } }
  g.restore(); }});
