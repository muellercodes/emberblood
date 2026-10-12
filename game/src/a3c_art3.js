
// ================= art for cave puzzles, doors and house secrets (drawn live, on top of the cached room art)
function drawSym(i,x,y,s,col){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.lineCap='round';
  if(i===0){ ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); for(let a=0;a<8;a++){ ctx.beginPath(); ctx.moveTo(Math.cos(a*TAU/8)*6,Math.sin(a*TAU/8)*6); ctx.lineTo(Math.cos(a*TAU/8)*9,Math.sin(a*TAU/8)*9); ctx.stroke(); } }
  else if(i===1){ ctx.beginPath(); ctx.arc(0,0,8,0.6,TAU-0.6); ctx.arc(3,0,6,TAU-1.0,1.0,true); ctx.closePath(); ctx.fill(); }
  else if(i===2){ ctx.beginPath(); for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, r=k%2?3.5:8.5; k?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(0,8); ctx.quadraticCurveTo(-9,0,0,-8); ctx.quadraticCurveTo(9,0,0,8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(0,-6); ctx.stroke(); }
  ctx.restore();
}
function caveSt(){ return (AREA&&CAVE_STYLE[AREA.def.theme])||CAVE_STYLE.earth; }
function stoneBlock(x,y,w,h,top,face,lift){
  lift=lift==null?10:lift;
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(x-w/2+3,y-h/2+5,w,h);
  ctx.fillStyle=face; ctx.fillRect(x-w/2,y-h/2+h-lift,w,lift);
  const g=ctx.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2-lift); g.addColorStop(0,mixHex(top,'#ffffff',0.18)); g.addColorStop(1,top); ctx.fillStyle=g; ctx.fillRect(x-w/2,y-h/2,w,h-lift);
  ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1.5; ctx.strokeRect(x-w/2+0.5,y-h/2+0.5,w-1,h-1);
}
function mixHex(a,b,t){ return `rgb(${mixRGB(hexRGB(a),hexRGB(b),t).map(Math.round).join(',')})`; }
function drawFurnX(o,t){
  const x=o.x, y=o.y, st=caveSt();
  switch(o.k){
    case 'cgate':{
      const horiz=o.vertical, W2=horiz?144:48, H2=horiz?48:144;
      if(!o.closed){
        if(o.type==='crack'&&o.opened){ ctx.fillStyle='rgba(0,0,0,.25)'; for(let i=0;i<7;i++){ const a=i*2.3; ctx.beginPath(); ctx.ellipse(x+Math.cos(a)*W2*0.4,y+Math.sin(a)*H2*0.4,6,4,a,0,TAU); ctx.fill(); } }
        if(o.type==='red'||o.type==='blue'){ ctx.strokeStyle=o.type==='red'?'rgba(255,110,160,.6)':'rgba(110,160,255,.6)'; ctx.lineWidth=3; ctx.strokeRect(x-W2/2+4,y-H2/2+4,W2-8,H2-8); }
        if(o.type==='lock'&&o.opened){ ctx.fillStyle='#4a2e18'; if(horiz) ctx.fillRect(x-W2/2,y-H2/2,10,H2); else ctx.fillRect(x-W2/2,y-H2/2,W2,10); }
        return true;
      }
      if(o.tmp||o.type==='open'){ // iron shutters for fights
        ctx.fillStyle='rgba(10,8,10,.55)'; ctx.fillRect(x-W2/2,y-H2/2,W2,H2);
        ctx.strokeStyle='#7a7a86'; ctx.lineWidth=5; const n=horiz?9:3;
        if(horiz){ for(let i=0;i<n;i++){ const xx=x-W2/2+8+i*(W2-16)/(n-1); ctx.beginPath(); ctx.moveTo(xx,y-H2/2+2); ctx.lineTo(xx,y+H2/2-2); ctx.stroke(); } ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x-W2/2,y); ctx.lineTo(x+W2/2,y); ctx.stroke(); }
        else{ for(let i=0;i<9;i++){ const yy=y-H2/2+8+i*(H2-16)/8; ctx.beginPath(); ctx.moveTo(x-W2/2+2,yy); ctx.lineTo(x+W2/2-2,yy); ctx.stroke(); } ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x,y-H2/2); ctx.lineTo(x,y+H2/2); ctx.stroke(); }
        ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=1; ctx.strokeRect(x-W2/2+1,y-H2/2+1,W2-2,H2-2);
        return true;
      }
      if(o.type==='lock'){
        stoneBlock(x,y,W2,H2,'#6a4426','#3a2212',horiz?12:6);
        ctx.strokeStyle='#2a1a0e'; ctx.lineWidth=2; if(horiz){ for(let i=1;i<6;i++){ ctx.beginPath(); ctx.moveTo(x-W2/2+i*W2/6,y-H2/2); ctx.lineTo(x-W2/2+i*W2/6,y+H2/2-12); ctx.stroke(); } } else { for(let i=1;i<6;i++){ ctx.beginPath(); ctx.moveTo(x-W2/2,y-H2/2+i*H2/6); ctx.lineTo(x+W2/2,y-H2/2+i*H2/6); ctx.stroke(); } }
        ctx.fillStyle='#8a8a92'; if(horiz){ ctx.fillRect(x-W2/2,y-H2/2+8,W2,5); ctx.fillRect(x-W2/2,y+H2/2-20,W2,5); } else { ctx.fillRect(x-W2/2+8,y-H2/2,5,H2); ctx.fillRect(x+W2/2-13,y-H2/2,5,H2); }
        ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(x,y-4,9,Math.PI,TAU); ctx.fill(); ctx.fillRect(x-11,y-4,22,16); ctx.fillStyle='#2a1a0e'; ctx.beginPath(); ctx.arc(x,y+2,3,0,TAU); ctx.fill(); ctx.fillRect(x-1.5,y+2,3,6);
        if(AREA.keys()>0) glowAt(x,y,40,'255,220,140',0.25+0.15*Math.sin(t*4));
        return true;
      }
      if(o.type==='crack'){
        ctx.fillStyle=st.top; ctx.fillRect(x-W2/2,y-H2/2,W2,H2);
        if(horiz){ ctx.fillStyle=st.face; ctx.fillRect(x-W2/2,y+H2/2-H2*0.4,W2,H2*0.4); }
        ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=2.2; ctx.beginPath();
        ctx.moveTo(x-W2*0.3,y-H2*0.35); ctx.lineTo(x-W2*0.1,y-H2*0.05); ctx.lineTo(x-W2*0.18,y+H2*0.2); ctx.moveTo(x-W2*0.1,y-H2*0.05); ctx.lineTo(x+W2*0.12,y-H2*0.12); ctx.lineTo(x+W2*0.28,y+H2*0.25); ctx.moveTo(x+W2*0.12,y-H2*0.12); ctx.lineTo(x+W2*0.2,y-H2*0.38); ctx.stroke();
        if(o.heat>0){ ctx.strokeStyle=`rgba(255,${150+o.heat*40|0},60,${Math.min(0.9,o.heat*0.6)})`; ctx.lineWidth=1.5; ctx.stroke(); }
        return true;
      }
      if(o.type==='gate'){
        stoneBlock(x,y,W2,H2,mixHex(st.top,'#000000',0.1),st.face,horiz?14:6);
        const R=AREA.rooms[o.gateRoom], k=R?R.kind:'';
        const pulse=0.5+0.3*Math.sin(t*2.5);
        ctx.strokeStyle=`rgba(${hexRGB(st.accent).join(',')},${pulse})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y-(horiz?4:0),12,0,TAU); ctx.stroke();
        if(k==='braziers'||k==='torches'||k==='dark'){ ctx.fillStyle=`rgba(255,170,80,${pulse})`; ctx.beginPath(); ctx.moveTo(x,y-14); ctx.quadraticCurveTo(x+7,y-4,x+5,y+2); ctx.quadraticCurveTo(x,y+6,x-5,y+2); ctx.quadraticCurveTo(x-7,y-4,x,y-14); ctx.fill(); }
        else if(k==='blocks'){ ctx.fillStyle=`rgba(200,220,255,${pulse})`; ctx.fillRect(x-6,y-10,12,12); }
        else if(k==='lever'){ ctx.strokeStyle=`rgba(255,220,150,${pulse})`; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-5,y+2); ctx.lineTo(x+4,y-10); ctx.stroke(); }
        else { drawSym(2,x,y-4,0.9,`rgba(255,220,150,${pulse})`); }
        return true;
      }
      if(o.type==='red'||o.type==='blue'){
        const col=o.type==='red'?['#e84a7a','#8a1a3a']:['#4a8ae8','#1a3a8a'];
        for(let i=0;i<3;i++){ const px=horiz?x-48+i*48:x, py=horiz?y:y-48+i*48; stoneBlock(px,py,40,40,col[0],col[1],12); glowAt(px,py-6,26,o.type==='red'?'255,120,170':'120,170,255',0.25); }
        return true;
      }
      return true; }
    case 'pillar':{
      const col=o.col==='red'?['#e84a7a','#8a1a3a','255,120,170']:['#4a8ae8','#1a3a8a','120,170,255'];
      if(o.closed){ stoneBlock(x,y,42,42,col[0],col[1],14); ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(x-16,y-17,32,3); glowAt(x,y-8,24,col[2],0.18+0.08*Math.sin(t*3+x)); }
      else { ctx.strokeStyle=`rgba(${col[2]},.55)`; ctx.lineWidth=3; ctx.strokeRect(x-18,y-18,36,36); ctx.fillStyle=`rgba(${col[2]},.12)`; ctx.fillRect(x-18,y-18,36,36); }
      return true; }
    case 'block':{
      if(o.cart){
        ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(x-20,y-12,44,32);
        ctx.fillStyle='#2a2a30'; for(const [dx,dy] of [[-14,14],[14,14],[-14,-12],[14,-12]]){ ctx.beginPath(); ctx.arc(x+dx,y+dy,5,0,TAU); ctx.fill(); }
        stoneBlock(x,y,40,34,'#7a5a3a','#3e2a18',10); ctx.fillStyle='#4a4a52'; ctx.fillRect(x-20,y-17,40,4); ctx.fillRect(x-20,y+3,40,4);
        ctx.fillStyle='#5a5a62'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(x-10+i*7,y-6+(i%2)*3,4,0,TAU); ctx.fill(); }
      } else {
        stoneBlock(x,y,44,44,mixHex(st.top,'#9aa0b0',0.25),st.face,14);
        ctx.strokeStyle=`rgba(${hexRGB(st.accent).join(',')},.5)`; ctx.lineWidth=2; ctx.strokeRect(x-12,y-14,24,18); ctx.beginPath(); ctx.moveTo(x-12,y-5); ctx.lineTo(x+12,y-5); ctx.stroke();
      }
      if(o.push>0.05){ ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,28,0,TAU*o.push/0.28); ctx.stroke(); }
      return true; }
    case 'plate':{
      ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(x-20,y-20,40,40);
      ctx.fillStyle=o.pressed?'#3a3a42':'#6a6a74'; ctx.fillRect(x-18,y-18,36,o.pressed?36:32);
      ctx.strokeStyle=o.pressed?`rgba(${hexRGB(st.accent).join(',')},.9)`:'rgba(255,255,255,.25)'; ctx.lineWidth=2; ctx.strokeRect(x-14,y-14,28,24);
      if(o.pressed) glowAt(x,y,34,hexRGB(st.accent).join(','),0.3);
      return true; }
    case 'resetstone':{
      stoneBlock(x,y,26,30,'#6a6a7a','#2a2a34',10);
      ctx.strokeStyle='rgba(180,220,255,.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y-4,6,0.4,TAU-0.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x+6,y-10); ctx.lineTo(x+6,y-4); ctx.lineTo(x+1,y-6); ctx.stroke();
      return true; }
    case 'crystal':{
      const blue=AREA.crys===1, c1=blue?'#7ab0ff':'#ff7aa8', c2=blue?'#2a4aa8':'#a82a5a';
      ctx.fillStyle='#3a3440'; ctx.beginPath(); ctx.ellipse(x,y+10,16,8,0,0,TAU); ctx.fill();
      const bob=Math.sin(t*2)*3;
      const g=ctx.createLinearGradient(x-10,y-26+bob,x+10,y+6+bob); g.addColorStop(0,'#ffffff'); g.addColorStop(0.4,c1); g.addColorStop(1,c2);
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x,y-28+bob); ctx.lineTo(x+11,y-10+bob); ctx.lineTo(x,y+6+bob); ctx.lineTo(x-11,y-10+bob); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,y-28+bob); ctx.lineTo(x,y+6+bob); ctx.stroke();
      glowAt(x,y-10+bob,44,blue?'120,170,255':'255,120,170',0.3+0.15*Math.sin(t*4));
      return true; }
    case 'ctorch': case 'lamp2':{
      const lit=o.lit;
      if(o.k==='ctorch'){ ctx.fillStyle='#3a3036'; ctx.beginPath(); ctx.ellipse(x,y+6,13,8,0,0,TAU); ctx.fill(); ctx.fillStyle='#5a4e56'; ctx.fillRect(x-4,y-14,8,20); ctx.fillStyle='#2a2228'; ctx.beginPath(); ctx.ellipse(x,y-14,11,6,0,0,TAU); ctx.fill(); drawSym(o.sym,x,y+7,0.55,lit?'#ffe0a0':'rgba(220,210,190,.75)'); }
      else { ctx.fillStyle='#3a2a1a'; ctx.fillRect(x-2,y-22,4,30); ctx.fillStyle='#2a2a30'; ctx.fillRect(x-8,y-30,16,14); ctx.fillStyle=lit?'#ffcf6a':'#4a4a50'; ctx.fillRect(x-5,y-27,10,8); }
      if(lit){ const fy=o.k==='ctorch'?y-18:y-23; glowAt(x,fy,34,'255,190,90',0.55+0.1*Math.sin(t*9+x)); if(Math.random()<0.5) emit(x+rand(-3,3),fy,1,{kind:'fire',ang:-Math.PI/2,spread:0.4,smin:15,smax:45,lmin:.3,lmax:.6,zmin:2,zmax:4,grow:3,drag:1}); }
      else { ctx.strokeStyle=`rgba(255,200,140,${0.25+0.15*Math.sin(t*2+x)})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y-8,20,0,TAU); ctx.stroke(); }
      return true; }
    case 'mural':{
      ctx.fillStyle='#5a4a3a'; ctx.fillRect(x-76,y-22,152,40); ctx.fillStyle='#3a2e24'; ctx.fillRect(x-70,y-17,140,30);
      (o.order||[0,1,2,3]).forEach((s,i)=>{ drawSym(s,x-52+i*35,y-2,0.8,'#e8c890'); if(i<3){ ctx.fillStyle='#b89870'; ctx.beginPath(); ctx.moveTo(x-36+i*35,y-5); ctx.lineTo(x-30+i*35,y-2); ctx.lineTo(x-36+i*35,y+1); ctx.fill(); } });
      return true; }
    case 'lever':{
      ctx.fillStyle='#3a3a42'; ctx.fillRect(x-14,y-4,28,14); ctx.fillStyle='#5a5a64'; ctx.fillRect(x-14,y-6,28,4);
      ctx.save(); ctx.translate(x,y); ctx.rotate(o.on?0.7:-0.7); ctx.fillStyle='#6a4a2a'; ctx.fillRect(-2.5,-26,5,26); ctx.fillStyle='#c83a2a'; ctx.beginPath(); ctx.arc(0,-26,6,0,TAU); ctx.fill(); ctx.restore();
      if(!o.on) glowAt(x,y-14,30,'255,200,120',0.2+0.1*Math.sin(t*3));
      return true; }
    case 'csign':{
      ctx.fillStyle='#4a3420'; ctx.fillRect(x-2.5,y-6,5,18); ctx.fillStyle='#8a6a42'; ctx.fillRect(x-20,y-22,40,20); ctx.strokeStyle='#4a3420'; ctx.lineWidth=2; ctx.strokeRect(x-20,y-22,40,20); ctx.strokeStyle='rgba(40,24,10,.6)'; ctx.lineWidth=1.2; for(let k=0;k<3;k++){ ctx.beginPath(); ctx.moveTo(x-14,y-17+k*5); ctx.lineTo(x+14,y-17+k*5); ctx.stroke(); }
      return true; }
    case 'coinpile':{
      if(G.found[o.id]) return true;
      for(let i=0;i<6;i++){ const a=i*1.1, d=i?5:0; ctx.fillStyle=i%2?'#ffd84a':'#e8b830'; ctx.beginPath(); ctx.ellipse(x+Math.cos(a)*d,y+Math.sin(a)*d*0.6-i*1.2,6,3.5,0,0,TAU); ctx.fill(); ctx.strokeStyle='#8a6a1a'; ctx.lineWidth=0.8; ctx.stroke(); }
      glowAt(x,y,22,'255,220,100',0.25+0.12*Math.sin(t*4+x));
      return true; }
    case 'treatpick':{
      if(G.found[o.id]) return true;
      const b=Math.sin(t*3)*2; ctx.fillStyle='#ff9ac0'; ctx.beginPath(); ctx.ellipse(x,y+b,8,6,0,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(x-8,y+b); ctx.lineTo(x-14,y-4+b); ctx.lineTo(x-14,y+4+b); ctx.fill(); ctx.beginPath(); ctx.moveTo(x+8,y+b); ctx.lineTo(x+14,y-4+b); ctx.lineTo(x+14,y+4+b); ctx.fill();
      glowAt(x,y,24,'255,160,200',0.3);
      return true; }
    case 'smallkey':{
      if(G.found[o.id]) return true;
      const b=Math.sin(t*3)*3; ctx.save(); ctx.translate(x,y-6+b); ctx.rotate(-0.6);
      ctx.strokeStyle='#ffd84a'; ctx.fillStyle='#ffd84a'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(-8,0,5,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-3,0); ctx.lineTo(12,0); ctx.stroke(); ctx.fillRect(7,0,3,6); ctx.fillRect(11,0,3,5);
      ctx.restore(); glowAt(x,y-6,34,'255,220,120',0.4+0.15*Math.sin(t*5));
      return true; }
  }
  return typeof drawFurnHouseX==='function'?drawFurnHouseX(o,t):false;
}
// ---------- house floors and secrets
Object.assign(R2ST,{
  attic:{fl:'grey',wl:{k:'timber',c:['#b8a888','#4a3420']},fab:7,wood:'pine',trim:'#4a3420',dec:['pennant','drawings','map'],rug:'braid'},
  cellar:{fl:'flags',flp:['#5e5a56','#6a6560','#56524e','#64605a','#4e4a46'],wl:{k:'stone',c:['#5a5650','#4e4a44','#66625a']},fab:7,wood:'oak',trim:'#3a3a40',dec:['garlic','shelfw','lantern','tools'],rug:'stripe'},
  vault:{fl:'flags',flp:['#4a4644','#565250','#423e3c','#504c4a','#3e3a38'],wl:{k:'stone',c:['#4a4648','#3e3a3c','#565254']},fab:6,wood:'dark',trim:'#c8a040',dec:['crest','banner'],rug:'persian'},
  secretroom:{fl:'walnut',wl:{k:'panel',c:['#3a2418']},fab:6,wood:'dark',trim:'#2a1a10',dec:['map','sconce','banner'],rug:'kilim'},
  guest:{fl:'oak',wl:{k:'floral',c:['#e0d4b4','#8a4a6a','#e8c050','#5a7a4a'],wain:'#6a4a30'},fab:5,wood:'cherry',trim:'#4a3020',dec:['sampler','wreath','clockw'],rug:'braid'},
  archive:{fl:'flags',flp:['#a08a6a','#ac9676','#94806a','#b09c7a','#8e7a5e'],wl:{k:'panel',c:['#4a2e1e']},fab:3,wood:'walnut',trim:'#2a1a10',dec:['banner','clockw','map'],arch:1,rug:'persian'},
  museum:{fl:'herring',wl:{k:'damask',c:['#6a2228','#8a3036'],wain:'#4a2a1a'},fab:6,wood:'dark',trim:'#c8a040',dec:['crest','banner'],arch:1,rug:'persian'},
  deck:{fl:'grey',wl:{k:'stone',c:['#3a3e58','#30344a','#464a66']},fab:6,wood:'grey',trim:'#2a2a3a',dec:['starchart','moonchart'],rug:'kilim'}
});
function hintedKey(key){ if(!G||!G.hints) return false; for(const h in G.hints) if(key.startsWith(h)) return true; return false; }
function drawFurnHouseX(o,t){
  const x=o.x, y=o.y;
  switch(o.k){
    case 'stairs':{
      if(o.hidden&&!G.found[o.hidden]) return true;
      const w=o.w, h=o.h;
      if(o.dir==='up'){
        ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(x-w/2+4,y-h/2+6,w,h);
        for(let i=0;i<5;i++){ const yy=y+h/2-(i+1)*h/5; ctx.fillStyle=i%2?'#8a6040':'#9a6e48'; ctx.fillRect(x-w/2,yy,w,h/5+1); ctx.fillStyle='rgba(255,240,210,.18)'; ctx.fillRect(x-w/2,yy,w,2); ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x-w/2,yy+h/5-2,w,2); }
        ctx.fillStyle='#4a2e18'; ctx.fillRect(x-w/2-4,y-h/2,5,h); ctx.fillRect(x+w/2-1,y-h/2,5,h);
        ctx.fillStyle='rgba(255,230,180,.75)'; ctx.beginPath(); ctx.moveTo(x,y-h/2-12); ctx.lineTo(x+7,y-h/2-4); ctx.lineTo(x-7,y-h/2-4); ctx.closePath(); ctx.fill();
      }else{
        ctx.fillStyle='#120c08'; ctx.fillRect(x-w/2,y-h/2,w,h);
        for(let i=0;i<4;i++){ const yy=y-h/2+i*h/4; const k=1-i*0.18; ctx.fillStyle=`rgba(${120*k|0},${86*k|0},${58*k|0},1)`; ctx.fillRect(x-w/2+6+i*3,yy+4,w-12-i*6,h/4-4); }
        const g=ctx.createLinearGradient(0,y-h/2,0,y+h/2); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.7)'); ctx.fillStyle=g; ctx.fillRect(x-w/2,y-h/2,w,h);
        ctx.strokeStyle='#5a3a22'; ctx.lineWidth=4; ctx.strokeRect(x-w/2,y-h/2,w,h);
        if(o.hidden){ ctx.fillStyle='#6a4428'; ctx.save(); ctx.translate(x-w/2,y-h/2); ctx.rotate(-0.25); ctx.fillRect(-6,-10,w*0.9,12); ctx.restore(); }
        ctx.fillStyle='rgba(255,230,180,.75)'; ctx.beginPath(); ctx.moveTo(x,y+4); ctx.lineTo(x+7,y-4); ctx.lineTo(x-7,y-4); ctx.closePath(); ctx.fill();
      }
      return true; }
    case 'trig':{
      if(G.found[o.key]) return true;
      if(hintedKey(o.key)){ const a=0.35+0.3*Math.sin(t*3+x); for(let i=0;i<3;i++){ const px=x+Math.cos(t*1.3+i*2.1)*18, py=y-6+Math.sin(t*1.7+i*2.1)*10; ctx.fillStyle=`rgba(255,240,190,${a})`; ctx.beginPath(); ctx.arc(px,py,2,0,TAU); ctx.fill(); } }
      return true; }
    case 'hchest':{
      const open=G.found[o.id];
      ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x-17,y-6,38,22);
      ctx.fillStyle=grad(x,y-12,x,y+12,'#9a6a3a','#5a3418'); ctx.fillRect(x-18,y-12,36,24);
      ctx.fillStyle='#c8a050'; ctx.fillRect(x-18,y-12,36,3); ctx.fillRect(x-18,y+9,36,3); ctx.fillRect(x-2,y-12,4,24);
      if(open){ ctx.fillStyle='#1a0e06'; ctx.fillRect(x-14,y-9,28,14); } else glowAt(x,y,32,'255,220,140',0.22+0.12*Math.sin(t*3+x));
      return true; }
    case 'crate':{ ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x-17,y-14,38,34); ctx.fillStyle='#8a6a42'; ctx.fillRect(x-19,y-19,38,38); ctx.strokeStyle='#5a4228'; ctx.lineWidth=3; ctx.strokeRect(x-17,y-17,34,34); ctx.beginPath(); ctx.moveTo(x-17,y-17); ctx.lineTo(x+17,y+17); ctx.moveTo(x+17,y-17); ctx.lineTo(x-17,y+17); ctx.stroke(); return true; }
    case 'cobweb':{ ctx.strokeStyle='rgba(230,230,240,.45)'; ctx.lineWidth=1; for(let i=0;i<5;i++){ const a=Math.PI*0.1+i*Math.PI*0.2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*30,y+Math.sin(a)*30); ctx.stroke(); } for(let r=8;r<=28;r+=7){ ctx.beginPath(); ctx.arc(x,y,r,Math.PI*0.1,Math.PI*0.9); ctx.stroke(); } return true; }
    case 'banner':{ ctx.fillStyle='#4a1e4a'; ctx.fillRect(x-14,y-18,28,40); ctx.beginPath(); ctx.moveTo(x-14,y+22); ctx.lineTo(x,y+14); ctx.lineTo(x+14,y+22); ctx.fill(); ctx.fillStyle='#c8a040'; ctx.beginPath(); ctx.ellipse(x,y,6,9,0,0,TAU); ctx.fill(); return true; }
    case 'candles':{ for(let i=0;i<3;i++){ const cx=x-10+i*10, h=14-i*3; ctx.fillStyle='#efe2c4'; ctx.fillRect(cx-2.5,y-h,5,h); glowAt(cx,y-h-3,16,'255,200,110',0.6+0.1*Math.sin(t*9+i)); ctx.fillStyle='#ffd27a'; ctx.beginPath(); ctx.ellipse(cx,y-h-3,1.8,3.2,0,0,TAU); ctx.fill(); } return true; }
    case 'nest':{ ctx.fillStyle='#6a4a2a'; ctx.beginPath(); ctx.ellipse(x,y,22,14,0,0,TAU); ctx.fill(); ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=2; for(let i=0;i<8;i++){ ctx.beginPath(); ctx.arc(x,y,16+i%3*2,i*0.8,i*0.8+1.2); ctx.stroke(); } if(!G.found[o.id]){ for(const [dx,dy,c] of [[-6,-2,'#ffd84a'],[4,2,'#c8c8d0'],[0,-5,'#e84a4a'],[8,-3,'#4ac8e8']]){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x+dx,y+dy,2.5,0,TAU); ctx.fill(); } glowAt(x,y,26,'255,230,150',0.2); } return true; }
    case 'recipebook':{ ctx.fillStyle='#6a2a22'; ctx.fillRect(x-14,y-10,28,20); ctx.fillStyle='#efe2c4'; ctx.fillRect(x-12,y-8,11,16); ctx.fillRect(x+1,y-8,11,16); if(!G.found[o.id]) glowAt(x,y,28,'255,230,170',0.3+0.15*Math.sin(t*3)); return true; }
    case 'musicbox':{ ctx.fillStyle='#8a4a6a'; ctx.fillRect(x-14,y-10,28,20); ctx.fillStyle='#d8b04a'; ctx.fillRect(x-14,y-10,28,3); const a=t*2; ctx.fillStyle='#ff9a7a'; ctx.beginPath(); ctx.ellipse(x+Math.cos(a)*4,y-14,6,3,a,0,TAU); ctx.fill(); if(!G.found[o.id]) glowAt(x,y,30,'255,200,220',0.3); return true; }
    case 'ghost':{ const b=Math.sin(t*2)*4; ctx.save(); ctx.globalAlpha=0.55+0.15*Math.sin(t*3); ctx.fillStyle='#d8f0ff'; ctx.beginPath(); ctx.arc(x,y-14+b,12,Math.PI,0); ctx.lineTo(x+12,y+8+b); for(let i=0;i<4;i++) ctx.lineTo(x+12-(i+0.5)*6,y+(i%2?4:10)+b); ctx.lineTo(x-12,y+8+b); ctx.closePath(); ctx.fill(); ctx.fillStyle='#1a2a3a'; ctx.beginPath(); ctx.arc(x-4,y-15+b,2,0,TAU); ctx.arc(x+4,y-15+b,2,0,TAU); ctx.fill(); ctx.fillStyle='#f4f2ea'; ctx.beginPath(); ctx.arc(x,y-27+b,7,0,TAU); ctx.fill(); ctx.restore(); glowAt(x,y-8,40,'200,230,255',0.25); return true; }
    case 'moosehead':{ ctx.fillStyle='#5a3a24'; ctx.beginPath(); ctx.ellipse(x,y+6,12,16,0,0,TAU); ctx.fill(); ctx.fillStyle='#3a2414'; ctx.beginPath(); ctx.ellipse(x,y+18,8,6,0,0,TAU); ctx.fill(); ctx.strokeStyle='#d8c8a8'; ctx.lineWidth=4; for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x+s*8,y-4); ctx.quadraticCurveTo(x+s*24,y-12,x+s*30,y-2); ctx.moveTo(x+s*20,y-8); ctx.lineTo(x+s*22,y-18); ctx.moveTo(x+s*26,y-6); ctx.lineTo(x+s*32,y-14); ctx.stroke(); } ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x-5,y+2,2,0,TAU); ctx.arc(x+5,y+2,2,0,TAU); ctx.fill(); return true; }
    case 'telescope2':{ ctx.fillStyle='#3a3a4a'; ctx.beginPath(); ctx.arc(x,y,16,0,TAU); ctx.fill(); ctx.save(); ctx.translate(x,y); ctx.rotate(-0.9); ctx.fillStyle=grad(0,-7,0,7,'#e8c060','#8a6a1a'); ctx.fillRect(-8,-7,60,14); ctx.fillStyle='#1a1a2a'; ctx.beginPath(); ctx.arc(52,0,7,0,TAU); ctx.fill(); ctx.restore(); if(isNight()) glowAt(x,y,30,'180,200,255',0.25); return true; }
    case 'mousehole':{ ctx.fillStyle='#1a0e08'; ctx.beginPath(); ctx.arc(x,y,9,Math.PI,0); ctx.lineTo(x+9,y+6); ctx.lineTo(x-9,y+6); ctx.fill(); ctx.fillStyle='#8a5a2a'; ctx.fillRect(x-4,y-3,8,9); ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(x+2,y+2,1,0,TAU); ctx.fill(); return true; }
  }
  return false;
}
