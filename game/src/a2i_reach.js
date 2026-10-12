// ================= places only jumping, water striding or flying can reach
// Terrain (ponds, islands, plank walkways, cleared lava) goes in at load, before any ground chunk is drawn.
// Landmarks, colliders and props are added right after buildPlaces (wrapped below), before the random chests.
const REACH={clear:[],props:[]};
// ---------- terrain
// Bramble Pond, south of Emberhollow: an islet and one stepping stone (jump). Hal's sheep ends up here.
PONDS.push({x:2850,y:10350,r:240});
ISLES.push({x:2850,y:10350,r:58},{x:2850,y:10206,r:26});
// the Broken Footbridge over the river east of Brindlecross (jump): a pool, an islet, two plank runs with gaps
PONDS.push({x:8300,y:8790,r:230});
ISLES.push({x:8300,y:8790,r:62});
WALKWAYS.push({x0:8282,y0:8520,x1:8318,y1:8648},{x0:8282,y0:8930,x1:8318,y1:9050});
BRIDGES.push({x:8300,y:8586,ang:Math.PI/2,len:132,w:40,kind:'wood'},{x:8300,y:8994,ang:Math.PI/2,len:120,w:40,kind:'wood'});
// Heron Islet in the west of Lake Mirrow, two stepping stones out from the shore (jump)
ISLES.push({x:5436,y:7240,r:30},{x:5560,y:7240,r:28},{x:5700,y:7240,r:44});
// the Turtle Shrine out in the north of the lake (stride)
ISLES.push({x:5880,y:6940,r:56});
// the Lone Tree in the Frostpine river, ringed by a wide pool (stride)
PONDS.push({x:4100,y:4300,r:285});
ISLES.push({x:4100,y:4300,r:84});
// treasure islands in the Cinderlands lava (wings)
LAVA_CLEAR.push([1560,1480,46],[4250,620,40]);

// ---------- art helpers (static parts are cached at 2x, live sparkle drawn on top)
const RSP=new Map();
function rSpr(key,w,h,ox,oy,fn){ let c=RSP.get(key); if(!c){ const sc=2; c=mkCanvas(w*sc,h*sc); const g=c.getContext('2d'); g.scale(sc,sc); g.translate(ox,oy); g.lineCap='round'; g.lineJoin='round'; fn(g); c.w2=w; c.h2=h; c.ox=ox; c.oy=oy; RSP.set(key,c); } return c; }
function rPut(c,x,y,s){ s=s||1; ctx.drawImage(c,x-c.ox*s,y-c.oy*s,c.w2*s,c.h2*s); }
function rBlob(g,x,y,r,n,rng,j){ g.beginPath(); for(let i=0;i<=n;i++){ const a=i/n*TAU, rr=r*(1-j+rng()*j*2); const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr*0.86; i?g.lineTo(px,py):g.moveTo(px,py); } g.closePath(); }
// a flat, mossy stepping stone sitting in the water
function rStone(g,r,seed,moss){
  const rng=mulberry32(seed); g.fillStyle='rgba(10,30,40,.35)'; rBlob(g,2,3,r+2,10,rng,0.08); g.fill();
  g.fillStyle='rgba(220,235,240,.35)'; g.lineWidth=1.2; g.strokeStyle='rgba(230,240,245,.4)'; g.beginPath(); g.ellipse(0,1,r+4,(r+4)*0.86,0,0,TAU); g.stroke();
  const pts=mulberry32(seed+1); g.fillStyle=r2lg(g,-r,-r,r,r,'#b4aea2','#8a857a','#5c5850'); rBlob(g,0,0,r,11,pts,0.1); g.fill();
  g.fillStyle='rgba(255,250,235,.22)'; rBlob(g,-r*0.2,-r*0.25,r*0.62,9,mulberry32(seed+2),0.12); g.fill();
  g.strokeStyle='rgba(40,38,34,.35)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-r*0.4,r*0.1); g.lineTo(r*0.1,-r*0.05); g.lineTo(r*0.35,r*0.2); g.stroke();
  if(moss){ for(let i=0;i<6;i++){ const a=rng()*TAU, d=r*(0.45+rng()*0.4); r2e(g,Math.cos(a)*d,Math.sin(a)*d*0.86,2+rng()*3.5,1.4+rng()*2,i%2?'rgba(110,140,58,.85)':'rgba(140,166,72,.8)'); } }
}
function rReeds(g,x,y,n,rng,col){ g.strokeStyle=col||'#5a7a34'; g.lineWidth=1.3; for(let i=0;i<n;i++){ const bx=x+(rng()-0.5)*10, h=8+rng()*9, lean=(rng()-0.5)*5; g.beginPath(); g.moveTo(bx,y); g.quadraticCurveTo(bx+lean*0.4,y-h*0.6,bx+lean,y-h); g.stroke(); if(rng()<0.35){ r2e(g,bx+lean,y-h-1.5,1.4,3,'#6a4a2a'); } } }
function rLily(g,x,y,r,rng){ g.fillStyle=rng()<0.5?'#4f8a3a':'#5f9a44'; g.beginPath(); g.arc(x,y,r,0.35,TAU-0.15); g.lineTo(x,y); g.closePath(); g.fill(); if(rng()<0.35){ r2o(g,x+r*0.2,y-r*0.2,r*0.42,rng()<0.5?'#f2e2ea':'#f2b8c8'); r2o(g,x+r*0.2,y-r*0.2,r*0.16,'#f2d24a'); } }
function rGlint(x,y,t,ph,s){ const a=Math.max(0,Math.sin(t*2.4+ph)); if(a<0.05) return; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(255,240,190,${0.8*a})`; const k=(s||1)*(2+a*3); ctx.beginPath(); ctx.moveTo(x,y-k*2); ctx.lineTo(x+k*0.4,y-k*0.4); ctx.lineTo(x+k*2,y); ctx.lineTo(x+k*0.4,y+k*0.4); ctx.lineTo(x,y+k*2); ctx.lineTo(x-k*0.4,y+k*0.4); ctx.lineTo(x-k*2,y); ctx.lineTo(x-k*0.4,y-k*0.4); ctx.closePath(); ctx.fill(); ctx.restore(); }
// the side wall of a raised rock (an elliptic cylinder seen from above and in front), with a long shadow
function rCliff(g,R,sq,H,rng,c0,c1,c2,flare){
  g.fillStyle='rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(H*0.45,H+8,R+10,(R+6)*sq,0,0,TAU); g.fill();
  const bR=flare?R+H*0.18:R;
  g.fillStyle=r2lg(g,-R,0,R,0,c1,c0,c1,c2);
  g.beginPath(); g.moveTo(-R,0); g.lineTo(-bR,H); g.ellipse(0,H,bR,bR*sq,0,Math.PI,0,true); g.lineTo(R,0); g.ellipse(0,0,R,R*sq,0,0,Math.PI,false); g.closePath(); g.fill();
  g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(-bR,H); g.ellipse(0,H,bR,bR*sq,0,Math.PI,0,true); g.lineTo(bR,H-6); g.ellipse(0,H-6,bR,bR*sq,0,0,Math.PI,false); g.closePath(); g.fill();
  g.lineWidth=1.1; for(let i=0;i<60;i++){ const a=Math.PI*0.04+rng()*Math.PI*0.92, x=Math.cos(a)*R, y=Math.sin(a)*R*sq, L=H*(0.4+rng()*0.6); g.strokeStyle=rng()<0.6?'rgba(30,14,8,.45)':'rgba(255,220,180,.16)'; g.beginPath(); g.moveTo(x,y+2); g.lineTo(x*(1+(bR/R-1)*L/H)+(rng()-0.5)*3,y+L); g.stroke(); }
  for(let k=1;k<3;k++){ const yy=H*k/3; g.strokeStyle='rgba(30,14,8,.35)'; g.lineWidth=1.4; g.beginPath(); g.ellipse(0,yy,R+(bR-R)*k/3,(R+(bR-R)*k/3)*sq,0,Math.PI*0.08,Math.PI*0.92); g.stroke(); }
}
// a treasure chest of this module, drawn with the game's chest art
function rChestDraw(o,t){ drawChest({x:o.x,y:o.y,open:!!G.found[o.id]},t); }

// ---------- treasure: what each one gives
function reachLoot(o){
  if(G.found[o.id]) return; G.found[o.id]=true;
  const L=o.loot||{}; SFX.play('chest'); jingle('item',null); shake(2);
  if(L.coins) addCoins(L.coins,o.x,o.y);
  if(L.xp) gainXp(L.xp);
  if(L.iron) G.iron=(G.iron||0)+L.iron;
  if(L.treat) G.pipTreats=(G.pipTreats||0)+L.treat;
  if(L.items) giveItems(L.items,true);
  if(L.maxhp){ player.maxHp+=L.maxhp; player.hp=Math.min(player.maxHp,player.hp+L.maxhp); }
  if(player.potions<player.potionsMax) player.potions++;
  emit(o.x,o.y,34,{col:'255,210,120',ang:-Math.PI/2,spread:1.1,smin:40,smax:170,lmin:.5,lmax:1.1,zmin:1.5,zmax:3,rise:15});
  G.stats.reachFound=(G.stats.reachFound||0)+1; deed('reach_'+o.id);
  const after=()=>{ if(L.bless){ G.pendingBless+=L.bless; later(0.8,offerPending); } saveGame(); };
  if(L.say){ runDialogue(L.say.map(s=>Array.isArray(s)?s:['narr',s]),()=>{ scene='play'; setBanner(L.title,L.sub||'',2.6); after(); }); }
  else { setBanner(L.title,L.sub||'',2.8); after(); }
}
function reachChest(id,x,y,loot,extra){
  const o=Object.assign({id,k:'reach',x,y,noNudge:true,prompt:'Open the chest',always:true,loot,hidden:()=>!!G.found[id],draw:rChestDraw,act:reachLoot},extra||{});
  return addLandmark(o);
}
// purely decorative art: never prompts, never shows on the map
function reachArt(id,x,y,draw,extra){ return addLandmark(Object.assign({id,k:'reach',x,y,noNudge:true,hidden:()=>true,draw},extra||{})); }

// ---------- art for each place
function rBramble(){ return rSpr('bramble',170,170,85,85,g=>{
  const rng=mulberry32(91);
  for(let i=0;i<30;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*46; grassTuft(g,Math.cos(a)*d,Math.sin(a)*d,pick(['rgba(40,70,24,.6)','rgba(110,140,60,.55)']),5+rng()*4,rng); }
  for(let i=0;i<9;i++){ const a=rng()*TAU; rReeds(g,Math.cos(a)*52,Math.sin(a)*48,4,rng); }
  // a little duck house on a post
  r2e(g,-20,22,9,3.5,'rgba(0,0,0,.25)'); g.fillStyle='#5a3a20'; g.fillRect(-23,6,3,16);
  r2rr(g,-32,-6,22,14,2,'#a0744a'); g.fillStyle='#7a2e22'; g.beginPath(); g.moveTo(-35,-5); g.lineTo(-21,-14); g.lineTo(-7,-5); g.closePath(); g.fill(); r2o(g,-21,1,3,'#2a1a10');
}); }
// lily pads and reeds around a pond rim, drawn live from a cached list (a sprite this big would waste memory)
const RRIM={};
function rPondRim(key,x,y,R,n,seed,t){
  let L=RRIM[key]; if(!L){ const rng=mulberry32(seed); L=RRIM[key]={lily:[],reed:[]}; for(let i=0;i<n;i++){ const a=rng()*TAU, d=R*(0.62+rng()*0.3); L.lily.push([x+Math.cos(a)*d,y+Math.sin(a)*d,4+rng()*4,rng()<0.5?'#4f8a3a':'#5f9a44',rng()<0.35?(rng()<0.5?'#f2e2ea':'#f2b8c8'):null,rng()*TAU]); } for(let i=0;i<Math.round(n*0.6);i++){ const a=rng()*TAU, d=R-4+rng()*12; L.reed.push([x+Math.cos(a)*d,y+Math.sin(a)*d,rng()*TAU]); } }
  for(const [lx,ly,r,c,fl,ph] of L.lily){ if(!inView(lx,ly,20)) continue; const bob=Math.sin(t*1.2+ph)*0.6; ctx.fillStyle=c; ctx.beginPath(); ctx.arc(lx,ly+bob,r,ph*0.2+0.35,ph*0.2+TAU-0.15); ctx.lineTo(lx,ly+bob); ctx.closePath(); ctx.fill(); if(fl){ ctx.fillStyle=fl; ctx.beginPath(); ctx.arc(lx+r*0.2,ly+bob-r*0.2,r*0.42,0,TAU); ctx.fill(); ctx.fillStyle='#f2d24a'; ctx.beginPath(); ctx.arc(lx+r*0.2,ly+bob-r*0.2,r*0.16,0,TAU); ctx.fill(); } }
  ctx.strokeStyle='#5a7a34'; ctx.lineWidth=1.3; ctx.lineCap='round'; ctx.beginPath();
  for(const [rx,ry,ph] of L.reed){ if(!inView(rx,ry,20)) continue; for(let k=0;k<4;k++){ const bx=rx+(k-1.5)*2.5, h=9+((k*7+ph*10)%7), lean=Math.sin(t*1.1+ph+k)*1.6+(k-1.5); ctx.moveTo(bx,ry); ctx.quadraticCurveTo(bx+lean*0.4,ry-h*0.6,bx+lean,ry-h); } }
  ctx.stroke();
}
function rStoneSpr(r,seed){ return rSpr('stone'+r+'_'+seed,r*2+16,r*2+16,r+8,r+8,g=>rStone(g,r,seed,true)); }
function rGarden(w,h){ return rSpr('garden',w+60,h+70,(w+60)/2,(h+70)/2-6,g=>{
  const rng=mulberry32(55), hw=w/2, hh=h/2, T=18;
  // gravel paths and lawn
  r2rr(g,-hw+T,-hh+T,w-T*2,h-T*2,6,'#6f8f3e');
  for(let i=0;i<70;i++) grassTuft(g,-hw+T+rng()*(w-T*2),-hh+T+rng()*(h-T*2),pick(['rgba(40,70,24,.5)','rgba(130,160,70,.45)']),4+rng()*3,rng);
  r2rr(g,-12,-hh+T,24,h-T*2,4,'#c9b894'); r2rr(g,-hw+T,-12,w-T*2,24,4,'#c9b894');
  for(let i=0;i<120;i++){ const onV=rng()<0.5, x=onV?(rng()-0.5)*22:-hw+T+rng()*(w-T*2), y=onV?-hh+T+rng()*(h-T*2):(rng()-0.5)*22; r2o(g,x,y,0.7+rng()*0.8,rng()<0.5?'rgba(120,100,70,.45)':'rgba(240,230,210,.4)'); }
  // four flower beds
  for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
    const bx=sx*(hw-T)/2+sx*6, by=sy*(hh-T)/2+sy*6, bw=(hw-T)-28, bh=(hh-T)-28;
    r2rr(g,bx-bw/2,by-bh/2,bw,bh,8,'#5a4228'); r2rr(g,bx-bw/2+2,by-bh/2+2,bw-4,bh-4,7,'#6a4e30');
    const cols=[['#e8586a','#f28a9a'],['#f2c84a','#f6e08a'],['#b48ad8','#d0b0f0'],['#f2efe4','#ffffff']][(sx+1)/2+(sy+1)];
    for(let i=0;i<26;i++){ const x=bx+(rng()-0.5)*(bw-8), y=by+(rng()-0.5)*(bh-8); r2o(g,x+0.8,y+0.8,2.6,'rgba(40,60,20,.7)'); r2o(g,x,y,2.3,cols[0]); r2o(g,x-0.5,y-0.5,1,cols[1]); }
  }
  // the old birdbath
  r2e(g,4,8,15,6,'rgba(0,0,0,.28)'); r2rr(g,-4,-2,8,12,2,'#8a867c'); r2e(g,0,-4,13,9,'#a8a49a'); r2e(g,0,-5,10.5,7,'#4a7a8a'); r2e(g,-3,-7,4,2,'rgba(255,255,255,.45)');
  // hedges: four thick walls with rounded leafy tops, topiary balls on the corners
  const hedge=(x,y,ww,hh2)=>{
    r2rr(g,x+4,y+9,ww,hh2,7,'rgba(0,0,0,.3)');
    r2rr(g,x,y+7,ww,hh2,7,'#1e3e18'); r2rr(g,x,y+3.5,ww,hh2,7,'#2a5422'); r2rr(g,x,y,ww,hh2,7,'#33642a');
    const n=Math.max(3,Math.round((ww+hh2)/9));
    for(let i=0;i<n;i++){ const px=x+4+rng()*(ww-8), py=y+3+rng()*(hh2-8); r2o(g,px,py,4+rng()*3,rng()<0.5?'#3f7832':'#4a8a3a'); }
    for(let i=0;i<n;i++){ const px=x+4+rng()*(ww-8), py=y+2+rng()*(hh2-9); r2o(g,px,py,1.6+rng()*1.6,'rgba(150,200,100,.45)'); }
  };
  hedge(-hw,-hh,w,T); hedge(-hw,hh-T,w,T); hedge(-hw,-hh+T-4,T,h-T*2+8); hedge(hw-T,-hh+T-4,T,h-T*2+8);
  for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const x=sx*(hw-T/2), y=sy*(hh-T/2); r2e(g,x+3,y+8,13,6,'rgba(0,0,0,.3)'); r2o(g,x,y,13,'#2a5420'); r2o(g,x-1,y-3,12,'#3f7832'); r2o(g,x-4,y-7,5,'rgba(160,210,110,.4)'); }
  // a few white hedge flowers
  for(let i=0;i<24;i++){ const side=i%4, u=rng(); const x=side<2?-hw+u*w:(side===2?-hw+T/2:hw-T/2), y=side<2?(side===0?-hh+T/2:hh-T/2):-hh+u*h; r2o(g,x+(rng()-0.5)*8,y+(rng()-0.5)*8,1.3,'#f6f0e0'); }
}); }
function rHollowRing(R){ return rSpr('hollow',R*2+70,R*2+70,R+35,R+35,g=>{
  const rng=mulberry32(77);
  // soft moss floor
  g.fillStyle=r2rg(g,0,0,10,R+8,'rgba(70,110,50,.75)','rgba(60,95,45,.55)','rgba(50,80,40,0)'); g.beginPath(); g.arc(0,0,R+8,0,TAU); g.fill();
  for(let i=0;i<60;i++){ const a=rng()*TAU, d=rng()*R*0.9; r2e(g,Math.cos(a)*d,Math.sin(a)*d,3+rng()*6,2+rng()*3,rng()<0.5?'rgba(110,150,70,.4)':'rgba(40,70,35,.35)',rng()*3); }
  // ferns
  for(let i=0;i<12;i++){ const a=rng()*TAU, d=R*(0.55+rng()*0.3), x=Math.cos(a)*d, y=Math.sin(a)*d; g.strokeStyle='rgba(70,120,50,.85)'; g.lineWidth=1.2; for(let k=0;k<6;k++){ const b=k/6*TAU+rng()*0.3; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(b)*5,y+Math.sin(b)*5-2,x+Math.cos(b)*10,y+Math.sin(b)*9); g.stroke(); } }
  // the fairy stone in the middle-back: a standing stone with a carved spiral
  r2e(g,-34,-18,12,5,'rgba(0,0,0,.3)'); g.fillStyle=r2lg(g,-44,-60,-26,-16,'#a8a49a','#7a766c','#5a564e'); g.beginPath(); g.moveTo(-44,-18); g.quadraticCurveTo(-46,-48,-36,-58); g.quadraticCurveTo(-26,-52,-26,-20); g.closePath(); g.fill();
  g.strokeStyle='rgba(140,220,200,.75)'; g.lineWidth=1.2; g.beginPath(); for(let k=0;k<26;k++){ const a=k*0.5, r=1+k*0.33; const px=-36+Math.cos(a)*r, py=-38+Math.sin(a)*r; k?g.lineTo(px,py):g.moveTo(px,py); } g.stroke();
  r2e(g,-40,-26,4,2,'rgba(110,150,70,.8)');
  // ring of mossy boulders
  const n=Math.round(TAU*R/34);
  for(let i=0;i<n;i++){ const a=i/n*TAU, x=Math.cos(a)*R, y=Math.sin(a)*R*0.9, s=15+rng()*5;
    r2e(g,x+3,y+5,s+2,s*0.6,'rgba(0,0,0,.3)'); g.fillStyle=r2lg(g,x-s,y-s,x+s,y+s,'#9a968c','#74706a','#4a4844'); rBlob(g,x,y,s,9,rng,0.12); g.fill();
    r2e(g,x-s*0.25,y-s*0.35,s*0.55,s*0.32,'rgba(255,255,255,.12)');
    for(let k=0;k<3;k++) r2e(g,x+(rng()-0.5)*s,y-s*0.2-rng()*s*0.4,2.5+rng()*4,1.5+rng()*2,rng()<0.5?'rgba(110,150,60,.85)':'rgba(140,170,70,.8)'); }
}); }
function rTurtle(){ return rSpr('turtle',140,120,70,70,g=>{
  const rng=mulberry32(33);
  for(let i=0;i<24;i++){ const a=rng()*TAU, d=rng()*46; grassTuft(g,Math.cos(a)*d,Math.sin(a)*d*0.9,pick(['rgba(40,70,24,.6)','rgba(110,140,60,.55)']),5+rng()*3,rng); }
  // stone plinth
  r2e(g,6,14,34,12,'rgba(0,0,0,.3)'); r2e(g,0,8,32,14,'#6a665e'); r2e(g,0,5,32,13,'#8a867c'); r2e(g,-6,2,18,6,'rgba(255,255,255,.12)');
  // the stone turtle: four feet, head, a domed shell of carved plates
  for(const [fx,fy] of [[-17,-2],[17,-2],[-15,12],[15,12]]) r2e(g,fx,fy,6,4.5,'#7a8a78');
  r2e(g,0,-17,8,7,'#8a9a86'); r2o(g,-3,-19,1.4,'#2a3028'); r2o(g,3,-19,1.4,'#2a3028');
  g.fillStyle=r2lg(g,-20,-20,20,16,'#a8b4a0','#7c8a76','#4e5a4c'); g.beginPath(); g.ellipse(0,0,21,17,0,0,TAU); g.fill();
  g.strokeStyle='rgba(40,50,38,.55)'; g.lineWidth=1.1;
  const hx=(x,y,r)=>{ g.beginPath(); for(let k=0;k<6;k++){ const a=k/6*TAU+Math.PI/6; k?g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*0.82):g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r*0.82); } g.closePath(); g.stroke(); };
  hx(0,-1,6.5); for(let k=0;k<6;k++){ const a=k/6*TAU; hx(Math.cos(a)*12,Math.sin(a)*9.6-1,5.4); }
  r2e(g,-6,-8,7,4,'rgba(255,255,255,.18)');
  r2e(g,8,4,4,3,'rgba(110,150,60,.75)'); r2e(g,-12,6,3,2,'rgba(110,150,60,.7)');
  // stone lanterns and an offering bowl
  for(const sx of [-1,1]){ const x=sx*40, y=-4; r2e(g,x+3,y+12,6,3,'rgba(0,0,0,.28)'); r2rr(g,x-2.5,y-4,5,15,1,'#7a766c'); r2rr(g,x-6,y-11,12,8,2,'#8a867c'); r2rr(g,x-4,y-9,8,4,1,'#2a2420'); g.fillStyle='#6a665e'; g.beginPath(); g.moveTo(x-8,y-11); g.lineTo(x,y-17); g.lineTo(x+8,y-11); g.closePath(); g.fill(); }
  r2e(g,0,26,9,4,'#6a5a48'); r2e(g,0,25,7,2.6,'#3a2a1a'); for(let k=0;k<5;k++) r2o(g,-5+k*2.5,24+Math.sin(k)*1,1.6,['#f2d24a','#e8586a','#f2efe4'][k%3]);
}); }
function rRowboat(){ return rSpr('rowboat',150,110,75,55,g=>{
  // the hull, seen through the water
  g.save(); g.globalAlpha=0.55; g.rotate(-0.35);
  g.fillStyle='#2a3a3a'; g.beginPath(); g.ellipse(0,0,44,15,0,0,TAU); g.fill();
  g.fillStyle='#3e4c48'; g.beginPath(); g.ellipse(0,0,40,12,0,0,TAU); g.fill();
  g.strokeStyle='rgba(20,30,30,.8)'; g.lineWidth=1.4; for(const x of [-18,0,18]){ g.beginPath(); g.moveTo(x,-11); g.lineTo(x,11); g.stroke(); }
  g.fillStyle='#5a6a5a'; g.font=`900 6px ${UIF}`; g.textAlign='center'; g.fillText('LEAKY TEACUP',0,2);
  g.restore();
  // the broken mast poking out, a rope and a float
  g.save(); g.rotate(-0.35); r2e(g,4,4,4,2,'rgba(0,0,0,.35)'); g.restore();
  r2rr(g,-2,-34,4,36,1.5,'#6a4a2a'); g.fillStyle='rgba(255,230,190,.25)'; g.fillRect(-2,-34,1.2,36);
  g.fillStyle='#e8e0cc'; g.beginPath(); g.moveTo(2,-32); g.lineTo(18,-24); g.lineTo(2,-18); g.closePath(); g.fill(); g.strokeStyle='rgba(120,100,80,.6)'; g.lineWidth=0.8; g.stroke();
  g.strokeStyle='#b8a070'; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,-20); g.quadraticCurveTo(20,-6,30,8); g.stroke();
  r2o(g,30,9,4,'#c8322a'); r2o(g,30,8,2,'#fff');
  // floating planks
  g.save(); g.translate(-38,16); g.rotate(0.6); r2rr(g,-12,-2.5,24,5,1,'#7a5634'); g.restore();
  g.save(); g.translate(30,-22); g.rotate(-0.3); r2rr(g,-8,-2,16,4,1,'#86603a'); g.restore();
}); }
function rLavaIsle(R,seed){ return rSpr('lavaisle'+seed,R*2+60,R*2+70,R+30,R+38,g=>{
  const rng=mulberry32(seed);
  // dark basalt top with glowing cracks
  g.fillStyle=r2rg(g,-10,-10,4,R,'#3a3230','#2a2422','#1a1514'); rBlob(g,0,0,R-6,14,rng,0.06); g.fill();
  g.strokeStyle='rgba(255,120,40,.55)'; g.lineWidth=1.1; for(let i=0;i<7;i++){ let x=(rng()-0.5)*R, y=(rng()-0.5)*R*0.8, a=rng()*TAU; g.beginPath(); g.moveTo(x,y); for(let k=0;k<3;k++){ a+=(rng()-0.5)*1.4; x+=Math.cos(a)*7; y+=Math.sin(a)*7; g.lineTo(x,y); } g.stroke(); }
  // a ring of obsidian shards (they block a jump, a dragon on the wing just flies over)
  const n=Math.round(TAU*R/24);
  for(let i=0;i<n;i++){ const a=i/n*TAU+rng()*0.1, x=Math.cos(a)*R, y=Math.sin(a)*R*0.9, h=16+rng()*14, w=6+rng()*4;
    r2e(g,x+4,y+5,w+3,4,'rgba(0,0,0,.45)');
    g.fillStyle=r2lg(g,x-w,y-h,x+w,y,'#5a4a68','#241c2c','#0c0a10'); g.beginPath(); g.moveTo(x-w,y+2); g.lineTo(x-w*0.3,y-h); g.lineTo(x+w*0.5,y-h*0.55); g.lineTo(x+w,y+2); g.closePath(); g.fill();
    g.strokeStyle='rgba(200,170,255,.35)'; g.lineWidth=0.8; g.beginPath(); g.moveTo(x-w*0.3,y-h); g.lineTo(x-w*0.1,y-2); g.stroke();
    g.strokeStyle='rgba(255,140,60,.5)'; g.beginPath(); g.moveTo(x-w,y+2); g.lineTo(x+w,y+2); g.stroke(); }
  // an old adventurer's helmet and a scatter of coins
  r2e(g,-R*0.4+2,R*0.25+3,7,3,'rgba(0,0,0,.35)'); g.fillStyle=r2lg(g,-R*0.4-7,R*0.25-7,-R*0.4+7,R*0.25+5,'#c8ccd4','#6a6e76'); g.beginPath(); g.ellipse(-R*0.4,R*0.25,7,6,0,Math.PI,0); g.fill(); g.fillRect(-R*0.4-8,R*0.25,16,2.5);
  for(let i=0;i<14;i++){ const a=rng()*TAU, d=8+rng()*R*0.35; r2o(g,Math.cos(a)*d+R*0.15,Math.sin(a)*d*0.7+R*0.1,1.8,rng()<0.5?'#ffd84a':'#e0a828'); }
}); }
function rEagleRock(R){ return rSpr('eaglerock',R*2+110,R*2+130,R+55,R+40,g=>{
  const rng=mulberry32(808);
  // cliff face below the rim (the perch stands proud of the crag floor)
  rCliff(g,R+10,0.86,34,rng,'#8a5638','#5a3424','#34190e');
  // the flat top
  g.fillStyle=r2rg(g,-R*0.3,-R*0.3,8,R,'#c08a62','#a8764e','#8a5c3e'); g.beginPath(); g.ellipse(0,0,R,R*0.86,0,0,TAU); g.fill();
  for(let i=0;i<40;i++){ const a=rng()*TAU, d=rng()*R*0.85; r2o(g,Math.cos(a)*d,Math.sin(a)*d*0.86,1+rng()*2,rng()<0.5?'rgba(90,50,30,.4)':'rgba(230,190,150,.35)'); }
  g.strokeStyle='rgba(70,40,24,.45)'; g.lineWidth=1; for(let i=0;i<6;i++){ let x=(rng()-0.5)*R, y=(rng()-0.5)*R*0.7, a=rng()*TAU; g.beginPath(); g.moveTo(x,y); for(let k=0;k<4;k++){ a+=(rng()-0.5)*1.2; x+=Math.cos(a)*9; y+=Math.sin(a)*8; g.lineTo(x,y); } g.stroke(); }
  for(let i=0;i<10;i++){ const a=rng()*TAU, d=rng()*R*0.7; grassTuft(g,Math.cos(a)*d,Math.sin(a)*d*0.86,'rgba(150,130,70,.6)',4,rng); }
  // a big old nest of sticks with long feathers
  const nx=-R*0.35, ny=-R*0.15; r2e(g,nx+3,ny+5,24,12,'rgba(0,0,0,.3)');
  for(let i=0;i<70;i++){ const a=rng()*TAU, d=12+rng()*10, l=8+rng()*12, b=a+Math.PI/2+(rng()-0.5)*0.8; const x=nx+Math.cos(a)*d, y=ny+Math.sin(a)*d*0.7; g.strokeStyle=pick(['#6a4a2a','#8a6a3a','#4a3018','#9a7a4a']); g.lineWidth=1.4+rng(); g.beginPath(); g.moveTo(x-Math.cos(b)*l/2,y-Math.sin(b)*l/2*0.7); g.lineTo(x+Math.cos(b)*l/2,y+Math.sin(b)*l/2*0.7); g.stroke(); }
  r2e(g,nx,ny,13,8,'#3a2614');
  for(let i=0;i<3;i++){ const a=-0.5+i*0.5; g.save(); g.translate(nx+8+i*6,ny+2+i*3); g.rotate(a); g.fillStyle=['#e8e0cc','#c8a878','#f2f0ea'][i]; g.beginPath(); g.ellipse(0,0,10,2.6,0,0,TAU); g.fill(); g.strokeStyle='rgba(80,60,40,.6)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(-10,0); g.lineTo(10,0); g.stroke(); g.restore(); }
  // rim boulders all the way round: no way up on foot
  const n=Math.round(TAU*R/40);
  for(let i=0;i<n;i++){ const a=i/n*TAU, x=Math.cos(a)*R, y=Math.sin(a)*R*0.86, s=19+rng()*7;
    r2e(g,x+4,y+6,s+2,s*0.55,'rgba(0,0,0,.35)'); g.fillStyle=r2lg(g,x-s,y-s,x+s,y+s,'#b07a54','#86563a','#5a3624'); rBlob(g,x,y,s,9,rng,0.14); g.fill();
    r2e(g,x-s*0.3,y-s*0.35,s*0.5,s*0.3,'rgba(255,230,200,.18)'); }
}); }
function rSkyNest(R){ return rSpr('skynest',R*2+130,R*2+150,R+65,R+40,g=>{
  const rng=mulberry32(1201);
  // a tall spire: long shadow, stacked cliff bands, a narrow top
  rCliff(g,R+14,0.84,50,rng,'#946040','#5e3826','#2e160c',true);
  g.fillStyle=r2rg(g,-R*0.3,-R*0.3,6,R,'#c4906a','#a8764e','#86563a'); g.beginPath(); g.ellipse(0,0,R,R*0.84,0,0,TAU); g.fill();
  // the giant nest
  r2e(g,3,6,R*0.72,R*0.48,'rgba(0,0,0,.3)');
  for(let i=0;i<110;i++){ const a=rng()*TAU, d=R*0.42+rng()*R*0.24, l=10+rng()*14, b=a+Math.PI/2+(rng()-0.5)*0.9; const x=Math.cos(a)*d, y=Math.sin(a)*d*0.72; g.strokeStyle=pick(['#6a4a2a','#8a6a3a','#4a3018','#9a7a4a','#5a3a1e']); g.lineWidth=1.6+rng()*1.2; g.beginPath(); g.moveTo(x-Math.cos(b)*l/2,y-Math.sin(b)*l/2*0.72); g.lineTo(x+Math.cos(b)*l/2,y+Math.sin(b)*l/2*0.72); g.stroke(); }
  r2e(g,0,0,R*0.44,R*0.3,'#3a2614'); r2e(g,0,1,R*0.38,R*0.25,'#4a3420');
  // broken egg shells, huge
  for(const [x,y,a] of [[-10,-2,0.3],[9,3,-0.5]]){ g.save(); g.translate(x,y); g.rotate(a); g.fillStyle='#f2ead8'; g.beginPath(); g.ellipse(0,0,8,6,0,Math.PI*0.05,Math.PI*1.05); g.fill(); g.fillStyle='#e0a868'; for(let k=0;k<4;k++) r2o(g,-4+k*2.6,-1+Math.sin(k)*2,0.9,'#c88a4a'); g.strokeStyle='#d8ccb0'; g.lineWidth=0.8; g.beginPath(); g.moveTo(-8,0); for(let k=0;k<6;k++) g.lineTo(-8+k*3.2,k%2?-1.5:1); g.stroke(); g.restore(); }
  // rim rocks: no way up on foot
  const n=Math.round(TAU*R/34);
  for(let i=0;i<n;i++){ const a=i/n*TAU, x=Math.cos(a)*R, y=Math.sin(a)*R*0.84, s=14+rng()*5; g.fillStyle=r2lg(g,x-s,y-s,x+s,y+s,'#b8845e','#8a5a3c','#5a3624'); rBlob(g,x,y,s,8,rng,0.16); g.fill(); r2e(g,x-s*0.3,y-s*0.35,s*0.45,s*0.28,'rgba(255,230,200,.2)'); }
}); }
// the hat on the sky nest: a crest of red-gold roc feathers
function rSkyHat(g,s){ g.save(); g.scale(s,s); const F=[['#c8322a',-0.5],['#e8862a',0],['#ffd84a',0.5]]; for(const [c,a] of F){ g.save(); g.rotate(a); g.fillStyle=c; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(-7,-5,-16,-1.5); g.quadraticCurveTo(-7,2,0,0); g.fill(); g.strokeStyle='rgba(60,20,10,.55)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(0,0); g.lineTo(-15,-1.2); g.stroke(); g.restore(); } g.fillStyle='#7a2a1a'; g.beginPath(); g.arc(0,0,5.5,0,TAU); g.fill(); g.fillStyle='#ffd84a'; g.beginPath(); g.arc(0.5,-0.5,2,0,TAU); g.fill(); g.restore(); }
// Ash wears it like any other hat
{ const base=drawHatShape; drawHatShape=function(x,y,k,s){ if(k==='Sky Feather'){ ctx.save(); ctx.translate(x,y); rSkyHat(ctx,(s||1)*0.95); ctx.restore(); return; } return base(x,y,k,s); }; }

// ---------- build the places (runs inside initWorld, right after the stock landmarks)
function reachPlaces(){
  // Bramble Pond and its islet (Hal's sheep waits here during his quest)
  reachArt('rc_bramble',2850,10350,(o,t)=>{ rPondRim('bramble',2850,10350,240,30,92,t); rPut(rBramble(),2850,10350); rPut(rStoneSpr(26,7),2850,10206); });
  addLandmark({id:'rc_bramblesign',k:'sign',x:2850,y:10052,r:8,noNudge:true,text:'BRAMBLE POND. No swimming. No sheep. (This means you, Clover.)',prompt:'Read the sign'});
  // the Broken Footbridge
  reachArt('rc_footbridge',8300,8790,(o,t)=>{
    for(const [y,dir] of [[8648,1],[8930,-1]]){ ctx.save(); ctx.translate(8300,y); ctx.fillStyle='#5a3a20'; ctx.beginPath(); ctx.moveTo(-18,0); for(let i=0;i<=6;i++) ctx.lineTo(-18+i*6,dir*(i%2?7:2)); ctx.lineTo(18,0); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.translate(8312,8690); ctx.rotate(0.9+Math.sin(t*1.3)*0.06); r2rr(ctx,-14,-3,28,6,1.5,'#7a5634'); ctx.restore();
    const a=0.3+0.2*Math.sin(t*2); ctx.strokeStyle=`rgba(220,235,245,${a})`; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(8312,8692,18+Math.sin(t*2)*3,7,0,0,TAU); ctx.stroke();
    rPondRim('bridge',8300,8790,230,22,93,t); rReachIsletDecor(8300,8790,62,t,11);
  });
  addLandmark({id:'rc_bridgesign',k:'sign',x:8340,y:8500,r:8,noNudge:true,text:'BRIDGE OUT. Fixing it Tuesday. (Signed, the Bridge Committee, which is just Gus.)',prompt:'Read the sign'});
  reachChest('rc_ch_bridge',8300,8800,{coins:45,xp:70,title:'Smuggler’s stash',sub:'45 coins, hidden where nobody could walk to it.'});
  // Heron Islet
  reachArt('rc_heron',5570,7240,(o,t)=>{ rPut(rStoneSpr(30,21),5436,7240); rPut(rStoneSpr(28,22),5560,7240); rReachIsletDecor(5700,7240,44,t,23); });
  reachChest('rc_ch_heron',5706,7234,{coins:35,xp:60,treat:1,title:'A heron’s hoard',sub:'Three shiny spoons, a thimble, 35 coins and a Pip treat.'});
  // the Forgotten Garden behind its hedges (south meadows)
  const GW=240, GH=196, GX=3760, GY=10010;
  reachArt('rc_garden',GX,GY,(o,t)=>{ rPut(rGarden(GW,GH),GX,GY); });
  for(const c of [{t:'r',x0:GX-GW/2,y0:GY-GH/2,x1:GX+GW/2,y1:GY-GH/2+18},{t:'r',x0:GX-GW/2,y0:GY+GH/2-18,x1:GX+GW/2,y1:GY+GH/2},{t:'r',x0:GX-GW/2,y0:GY-GH/2,x1:GX-GW/2+18,y1:GY+GH/2},{t:'r',x0:GX+GW/2-18,y0:GY-GH/2,x1:GX+GW/2,y1:GY+GH/2}]) addCol(Object.assign(c,{low:true}));
  addCol({t:'c',x:GX,y:GY-3,r:13});
  reachChest('rc_ch_garden',GX,GY-58,{coins:40,xp:60,treat:1,title:'The forgotten garden',sub:'An old seed tin with 40 coins and a Pip treat. The hedges kept it safe.'});
  REACH.clear.push({x:GX,y:GY,r:175});
  // Mossy Hollow, a hidden grove in Whisperwood behind a ring of low rocks
  const HX=820, HY=7450, HR=118;
  reachArt('rc_hollow',HX,HY,(o,t)=>{
    rPut(rHollowRing(HR),HX,HY);
    const night=1-daylight();
    for(let i=0;i<9;i++){ const a=i/9*TAU+0.3, x=HX+Math.cos(a)*HR*0.68, y=HY+Math.sin(a)*HR*0.6; drawGlowShroom({x,y,s:0.7+(i%3)*0.2},t); }
    for(let i=0;i<7;i++){ const a=t*0.4+i*0.9, x=HX+Math.cos(a)*(40+i*7), y=HY-10+Math.sin(a*1.3)*(30+i*4); glowAt(x,y,6,'200,255,220',0.25+0.35*night*Math.max(0,Math.sin(t*2+i))); }
  });
  { const n=Math.round(TAU*HR/34); for(let i=0;i<n;i++){ const a=i/n*TAU; addCol({t:'c',x:HX+Math.cos(a)*HR,y:HY+Math.sin(a)*HR*0.9,r:17,low:true}); } }
  addCol({t:'c',x:HX-36,y:HY-26,r:9});
  reachChest('rc_ch_hollow',HX+20,HY+8,{coins:30,xp:80,bless:1,title:'The fairies’ chest',sub:'30 coins, and the hollow hums. A blessing waits for you.'});
  REACH.clear.push({x:HX,y:HY,r:HR+8});
  // the Turtle Shrine (stride)
  reachArt('rc_turtleart',5880,6940,(o,t)=>{ rPut(rTurtle(),5880,6940); if(!G.found.rc_turtle) rGlint(5884,6932,t,1.3,0.8); const nt=1-daylight(); if(nt>0.2) for(const sx of [-1,1]) glowAt(5880+sx*40,6928,16,'255,200,120',0.5*nt); });
  addCol({t:'c',x:5880,y:6940,r:22});
  addLandmark({id:'rc_turtle',k:'reach',always:true,x:5880,y:6946,noNudge:true,r:0,prompt:'Look under the stone turtle',hidden:()=>!!G.found.rc_turtle,act:o=>reachLoot(Object.assign(o,{loot:{coins:50,xp:90,bless:1,title:'Under the turtle',sub:'50 coins and a blessing',say:[`An old stone turtle sits on the island, all by itself in the middle of the lake. Someone has been leaving it flowers.`,`The wishing well said you would find something under a turtle. You lift the edge of the shell. Underneath: a pouch of coins and a note.`,`"For whoever walks on water to visit me. I knew one of you would. Love, Old Shellby's great-great-grandma."`]}}))});
  // the sunken rowboat (stride)
  reachArt('rc_rowboatart',5560,7400,(o,t)=>{ const a=0.25+0.15*Math.sin(t*1.7); ctx.strokeStyle=`rgba(230,240,250,${a})`; ctx.lineWidth=1.2; for(let k=0;k<2;k++){ const r=30+((t*10+k*18)%36); ctx.beginPath(); ctx.ellipse(5560,7400,r*1.4,r*0.7,-0.35,0,TAU); ctx.stroke(); } rPut(rRowboat(),5560,7400); if(!G.found.rc_rowboat) rGlint(5546,7404,t,0.4,0.7); });
  addLandmark({id:'rc_rowboat',k:'reach',always:true,x:5560,y:7404,noNudge:true,prompt:'Reach into the sunken boat',hidden:()=>!!G.found.rc_rowboat,act:o=>reachLoot(Object.assign(o,{loot:{coins:60,xp:100,treat:1,title:'The Leaky Teacup',sub:'60 coins and a Pip treat',say:[`A little rowboat called the LEAKY TEACUP is sitting on the bottom of the lake. It lived up to its name.`,`You stand on the water right above it and reach down. The water hisses and steams around your arm. Inside the boat: a tin box of coins, and a biscuit for Pip that is somehow still dry.`]}}))});
  // the Lone Tree in the Frostpine river: a big snowy pine, a beehive and a hollow between the roots (stride)
  REACH.clear.push({x:4100,y:4300,r:92}); REACH.props.push({k:'spine',x:4110,y:4280,s:1.65,v:7});
  addLandmark({id:'rc_hive',k:'beehive',x:4060,y:4320,r:14,noNudge:true,prompt:'Look at the beehive',smokeable:true});
  reachArt('rc_lonetree',4100,4300,(o,t)=>{ rPondRim('lonetree',4100,4300,285,10,94,t); rReachIsletDecor(4100,4300,84,t,41,true); });
  addLandmark({id:'rc_roots',k:'reach',always:true,x:4134,y:4318,noNudge:true,prompt:'Reach into the hollow between the roots',hidden:()=>!!G.found.rc_roots,draw:(o,t)=>{ r2e(ctx,o.x,o.y,9,5,'#1a120a'); r2e(ctx,o.x-1,o.y-1,7,3.5,'#0a0604'); if(!G.found.rc_roots) rGlint(o.x+2,o.y-1,t,2.1,0.6); },act:o=>reachLoot(Object.assign(o,{loot:{coins:40,xp:110,items:{honey:2},title:'The lone tree',sub:'40 coins and two jars of frost honey',say:[`Between the roots of the lonely old pine there's a dry little hollow. Someone has hidden two jars of honey here, wrapped in wool.`,`A note: "Frost honey, from the bravest bees in the valley. They live out here so nobody bothers them. Well. Bother."`]}}))});
  // the lava islands (wings). Obsidian shards ring them, so a jump cannot land there.
  for(const [id,x,y,R,seed,loot] of [['rc_lava1',1560,1480,70,61,{coins:50,xp:220,iron:1,title:'Star-iron!',sub:'A chunk of star-iron, glowing in the heat. Take it to Mom.',say:[`A little island of black rock in a sea of lava. It's so hot the air wobbles.`,`Wedged in the rock: a chunk of star-iron, glowing orange, and an old adventurer's helmet. The adventurer clearly did not have wings.`]}],['rc_lava2',4250,620,62,62,{coins:90,xp:260,bless:1,title:'The fire-proof chest',sub:'90 coins and a blessing',say:[`A fire-proof chest, sitting on a lump of rock in the middle of the lava. Somebody really didn't want this found.`,`Inside: 90 coins and a scrap of paper. "Only an Emberblood would come here. Well done. Signed, Ember." Ember. Your ancestor.`]}]]){
    reachArt(id+'art',x,y,(o,t)=>{ rPut(rLavaIsle(R,seed),x,y); if(!G.found[id]) rGlint(x+8,y-4,t,seed,1); if(Math.random()<0.05) emit(x+rand(-R,R),y+rand(-R,R)*0.8,1,{col:'255,150,70',ang:-Math.PI/2,spread:0.4,smin:10,smax:30,lmin:.5,lmax:1,zmin:1,zmax:2,rise:20}); });
    const n=Math.round(TAU*R/24); for(let i=0;i<n;i++){ const a=i/n*TAU; addCol({t:'c',x:x+Math.cos(a)*R,y:y+Math.sin(a)*R*0.9,r:14}); }
    reachChest(id,x+6,y+2,loot);
    REACH.clear.push({x,y,r:R+10});
  }
  // Eagle Rock, a perch in the Drakeling Crags ringed by boulders (wings)
  const ER=118, EX=11250, EY=5750;
  reachArt('rc_eagleart',EX,EY,(o,t)=>{ rPut(rEagleRock(ER),EX,EY); if(!G.found.rc_eagle) rGlint(EX+30,EY+10,t,0.7,1); });
  { const n=Math.round(TAU*ER/40); for(let i=0;i<n;i++){ const a=i/n*TAU; addCol({t:'c',x:EX+Math.cos(a)*ER,y:EY+Math.sin(a)*ER*0.86,r:25}); } }
  reachChest('rc_eagle',EX+30,EY+14,{coins:70,xp:240,title:'Eagle Rock',sub:'70 coins in an old eagle’s treasure pile',say:[`The top of Eagle Rock. Nobody has stood up here in a hundred years. Nobody without wings, anyway.`,`An eagle used to live here and collected shiny things. You find 70 coins, a spoon, and a very old bottle cap.`]});
  REACH.clear.push({x:EX,y:EY,r:ER+40});
  // the Sky Nest on top of a crag spire, with the Sky Feather hat (wings)
  const NR=64, NX=13500, NY=4250;
  reachArt('rc_nestart',NX,NY,(o,t)=>{ rPut(rSkyNest(NR),NX,NY); if(!G.found.rc_nest){ ctx.save(); ctx.translate(NX+2,NY-2+Math.sin(t*2)*1); rSkyHat(ctx,1.2); ctx.restore(); rGlint(NX+6,NY-8,t,2.4,1); } });
  { const n=Math.round(TAU*NR/34); for(let i=0;i<n;i++){ const a=i/n*TAU; addCol({t:'c',x:NX+Math.cos(a)*NR,y:NY+Math.sin(a)*NR*0.84,r:19}); } }
  addLandmark({id:'rc_nest',k:'reach',always:true,x:NX,y:NY,noNudge:true,prompt:'Look in the giant nest',hidden:()=>false,act:o=>{
    if(G.found.rc_nest){ if(G.hat!=='Sky Feather'){ G.hat='Sky Feather'; setBanner('Sky Feather','You put the feathers back on. Very dashing.',2); saveGame(); } else runDialogue([['narr',`The giant nest is empty now. It smells faintly of eagle and adventure.`]],()=>{ scene='play'; }); return; }
    reachLoot(Object.assign(o,{loot:{coins:30,xp:300,title:'The Sky Feather',sub:'A crest of roc feathers. Ash is wearing it now.',say:[`A nest as big as a cart, right on top of the spire. The egg hatched long ago. Whoever hatched from it was enormous.`,`Tucked in the sticks: three huge feathers, red and gold, as warm as embers. You stick them in your hair. You look AMAZING.`,['ash',`I look amazing.`]]}}));
    G.hats=G.hats||{}; G.hats['Sky Feather']=true; G.hat='Sky Feather'; deed('skyfeather');
  }});
  REACH.clear.push({x:NX,y:NY,r:NR+30});
  // islet clear zones (no random props on the small islands)
  REACH.clear.push({x:2850,y:10350,r:70},{x:8300,y:8790,r:72},{x:5700,y:7240,r:54},{x:5880,y:6940,r:64});
  // stones and hedges that only feel solid on the ground
  const LOWK={grave:1,frostberry:1,sign:1};
  for(const o of LANDMARKS) if(o.colRef&&LOWK[o.k]) o.colRef.low=true;
  reachQuestPlaces();
}
// grass, reeds and pebbles on a small island (drawn live, cheap)
function rReachIsletDecor(x,y,R,t,seed,snow){
  const key='islet'+seed;
  const sp=rSpr(key,R*2+40,R*2+40,R+20,R+20,g=>{ const rng=mulberry32(seed); for(let i=0;i<R*0.9;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.82; grassTuft(g,Math.cos(a)*d,Math.sin(a)*d,snow?pick(['rgba(110,120,100,.55)','rgba(140,150,130,.5)']):pick(['rgba(40,70,24,.6)','rgba(110,140,60,.55)','rgba(70,100,40,.55)']),5+rng()*4,rng); } for(let i=0;i<R/5;i++){ const a=rng()*TAU; rReeds(g,Math.cos(a)*(R-4),Math.sin(a)*(R-6),3,rng,snow?'#7a8a6a':null); } for(let i=0;i<R/6;i++){ const a=rng()*TAU, d=rng()*R*0.7; r2e(g,Math.cos(a)*d,Math.sin(a)*d,2+rng()*2.5,1.5+rng()*1.5,'#8a867c'); } });
  rPut(sp,x,y);
}
// ---------- hooks into the stock world builder (one line each, no edits to the other modules)
{ const base=buildPlaces; buildPlaces=function(){ base(); reachPlaces(); }; }
// treasure and custom places use o.draw and o.act
{ const base=drawLandmark; drawLandmark=function(o,t){ if(o.draw){ o.draw(o,t); return; } return base(o,t); }; }
{ const base=lmAct; lmAct=function(o){ if(o&&o.act){ o.act(o); return; } return base(o); }; }
// keep random props off the special spots, and plant the Lone Tree
{ const base=genProps; genProps=function(cx,cy){
  let out=base(cx,cy);
  if(REACH.clear.length) out=out.filter(p=>{ for(const z of REACH.clear) if(dist2(p.x,p.y,z.x,z.y)<z.r*z.r){ if(p.col) p.col.off=true; return false; } return true; });
  for(const q of REACH.props){ if(Math.floor(q.x/CH)!==cx||Math.floor(q.y/CH)!==cy) continue; const tk=TREEK[q.k], p={k:q.k,x:q.x,y:q.y,s:q.s,v:q.v,ph:1.3,rot:0.4,tall:!!tk}; if(tk){ p.R=tk[0]*q.s; p.col=addCol({t:'c',x:q.x,y:q.y,r:tk[1]*q.s}); } out.push(p); }
  return out; }; }
window.__ebX=Object.assign(window.__ebX||{},{T:(x,y)=>T(x,y,{}),blockedAt,lavaAt:(x,y)=>lavaAt(x,y,segsDist(x,y,ROAD_SEGS)),rdd:(x,y)=>segsDist(x,y,ROAD_SEGS),REACH,reachLoot});
