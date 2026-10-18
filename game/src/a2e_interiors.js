
// ================= interiors and caves
// Interiors live far east of the valley (x >= IZX) so the normal physics, combat and collision code just works.
const IZX=20000, IZY=1000;
const AREADEFS={}, DOORS=[];
let AREA=null;
// walking in and out of doors (v11, see the end of this file): the door Ash came in by, the one he must step off before
// it works again, a short note over a locked door, and when it may show again
const DW={from:null,hold:null,holdT:0,note:null,bumpT:0,bumpD:null};
const BOOKS=['How to Train Your Goat (Don’t)','Dragons: A Very Warm History','101 Uses for a Bucket','The Wardens: Were They Cool? (Yes)','Knitting for Beginners and Their Victims','Fish, and Where to Find Them, by Dell Fisk','Lamp Oil: A Love Story','The Bakery Incident: A Survivor’s Account','Is My Cat a Wizard?','Kobolds: Tiny and Pointy','Advanced Napping','So You’ve Been Turned Into a Frog','Rock Soup: One Recipe, Four Hundred Rocks','Star-Iron and Other Stubborn Rocks, by Professor Quill','Brindlecross: Named After My Great ×4 Grandfather, by Mayor Brindle','The Big Book of Small Lanterns','A Field Guide to Things That Bite','Sheep Are Better: A Rebuttal, by Ulf Hollis','Goats Are Better: A Rebuttal to the Rebuttal, by Hollis'];
const PAINTINGS=['A bowl of fruit. One grape looks nervous.',S('A stern old woman holding up a lantern. Her eyebrows follow you around the room.','A stern woman with a lantern. Her eyes follow you!'),S('A goat. Just a goat, painted with a great deal of love.','A goat. Just a goat.'),'Five figures around a fire. Someone has drawn a mustache on one of them.','A dragon eating a birthday cake. It is titled "Grandpa’s Party." Nobody knows who painted it.',S('A hand-drawn map with a big red X on it. The X is on the kitchen.','A map with a red X. The X is on the kitchen!'),S('A sunset over a lake. There is a fish jumping in it. The fish looks smug.','A lake at sunset. A smug fish jumps.'),'A very old drawing of a girl with horns, holding a lantern up to a mountain.'];
const EGGS=[
  {k:'cat',label:'Pet the cat',say:['The cat allows it. You have been judged and found acceptable.','Mrrp.',S('The cat bites you gently, then purrs.','The cat nibbles you, then purrs.')]},
  {k:'mirror',label:'Look in the mirror',say:['A very handsome dragon looks back. Is that a new scale?','You practice your heroic face. It needs work.']},
  {k:'rock',label:'Look at the rock',say:[S('A smooth round stone, rubbed shiny from years on the windowsill. Somebody’s lucky stone.','A smooth, shiny lucky stone.')]},
  {k:'goose',label:'Pet the goose',say:['HONK.',S('The goose gives you the look it gives everybody. Then it honks.','The goose looks at you. Then it honks.')]},
  {k:'drawer',label:'Search the drawer',say:[S('Thick woolly socks, folded in pairs. Somebody in this house gets cold feet.','Woolly socks, in pairs.'),S('A tangle of string, three buttons and one very old biscuit.','String, buttons and an old biscuit.'),S('A child’s drawing of a dragon breathing fire on a birthday cake. Someone has written "NO" under it.','A drawing of a dragon burning a cake. It says NO.')]},
  {k:'clock',label:'Check the clock',say:['Tick. Tock. It is either very late or very early.',S('The clock is nine minutes fast, so nobody in this house is ever late.','The clock is fast, so nobody here is late.')]},
  {k:'toybox',label:'Rummage in the toy box',say:['A wooden dragon, a wooden knight, and a wooden sandwich.',S('A tiny wooden sword, its handle worn smooth from years of pretend battles.','A little wooden sword, worn smooth.')]},
  {k:'lute',label:'Play a tune',say:['You play a tune. It is mostly one note, but with feeling.','You play the Lantern Day song. A neighbour applauds through the wall.']}
];
// ---------- area registry
function defHouse(id,o){ AREADEFS[id]=Object.assign({id,kind:'house',dark:0.18},o); return AREADEFS[id]; }
function defCave(id,o){ AREADEFS[id]=Object.assign({id,kind:'cave',dark:0.74,cell:48,cw:52,ch:40},o); return AREADEFS[id]; }
// the caves (entrances are placed in a2d_places)
defCave('whisper',{name:'Whisperwood Hollow',level:2,theme:'earth',seed:11,enemies:[['bat',6],['slime',5],['kobold',4]],npc:'juniper',page:'p1',chest:true,braziers:3});
defCave('mirrow',{name:'Mirrow Grotto',level:2,theme:'crystal',seed:23,cw:40,ch:32,enemies:[['bat',4],['slime',4]],npc:'shellby',chest:true});
defCave('tunnel',{name:'The Oath’s Hidden Tunnel',level:4,theme:'earth',seed:37,enemies:[['cultist',6],['kobold',6],['knight',1]],item:{item:'oath_plans',label:'The Oath’s plans',flag:'tunnel_plans'},page:'p8',chest:true,braziers:2,locked:'tunnel_key'});
defCave('mine',{name:'Coppergulch Mine',level:6,theme:'mine',seed:41,cw:58,ch:42,enemies:[['drakeling',7],['egg',4],['bat',5]],item:{item:'lucky_pick',label:'Gorran’s lucky pick'},page:'p5',chest:true,ore:true});
defCave('grotto',{name:'The Sunken Grotto',level:5,theme:'bog',seed:53,enemies:[['slime',8],['kobold',5],['bat',4]],item:{item:'lucky_lure',label:'The wreck of the Soggy Biscuit',needQuest:'lure'},page:'p4',chest:true,braziers:3});
defCave('icefang',{name:'Icefang Cavern',level:7,theme:'ice',seed:67,enemies:[['wolf',6],['bat',6],['slime',3]],item:{item:'horn',label:'Ulf’s hunting horn',needQuest:'horn'},page:'p6',chest:true,braziers:3});
defCave('deep',{name:'The Ember Deep',level:9,theme:'ember',seed:79,cw:60,ch:44,enemies:[['knight',4],['drakeling',6],['slime',5],['cultist',4]],page:'p10',chest:true,braziers:4,relic:true});
// ---------- small helpers
function areaHas(x){ return x>=IZX-50; }
function addAreaCol(c){ addCol(c); AREA.cols.push(c); return c; }
function removeCol(c){
  const x0=c.t==='c'?c.x-c.r:c.x0, x1=c.t==='c'?c.x+c.r:c.x1, y0=c.t==='c'?c.y-c.r:c.y0, y1=c.t==='c'?c.y+c.r:c.y1;
  for(let cx=Math.floor(x0/GC);cx<=Math.floor(x1/GC);cx++) for(let cy=Math.floor(y0/GC);cy<=Math.floor(y1/GC);cy++){ const a=GRID.get(gkey(cx,cy)); if(!a) continue; const i=a.indexOf(c); if(i>=0) a.splice(i,1); }
}
function areaBlocked(x,y){
  const A=AREA; if(!A) return true;
  if(x<A.x0||y<A.y0||x>A.x1||y>A.y1) return true;
  if(A.kind==='cave'){ const c=A.cave, i=Math.floor((x-A.x0)/c.cell), j=Math.floor((y-A.y0)/c.cell); if(i<0||j<0||i>=c.w||j>=c.h) return true; const k=j*c.w+i;
    // pools stop everyone, except Ash with Water Stride or Ash in the air (only his own moves test his exact x or y)
    if(c.grid[k]===1){ if(c.typ&&c.typ[k]===1&&player&&(x===player.x||y===player.y)&&(canWalkWater()||airborne())) return false; return true; }
    return !!c.dyn&&caveBlockedAt(k); }
  return false;
}
// ---------- houses
function houseLayout(def){
  const rng=mulberry32(def.seed||7), st=def.style||'home';
  const W=def.w||560, H=def.h||400, items=[];
  const put=(k,x,y,o)=>items.push(Object.assign({k,x,y},o||{}));
  const wallY=34;
  // every room: rug, a window or two, a door mat
  put('rug',W/2,H*0.58,{w:W*0.38,h:H*0.32,col:pick2({x:W,y:H},['#7a2e22','#2e4a6a','#5a3a6a','#3a5a3a','#8a6a2a'])});
  put('window',W*0.22,wallY*0.5,{}); put('window',W*0.78,wallY*0.5,{});
  if(st==='home'||st==='kid'||st==='farmer'||st==='knitter'||st==='fiddler'||st==='herbalist'){
    put('bed',70,120,{w:62,h:96}); put('fireplace',W/2,wallY+14,{});
    put('table',W*0.62,H*0.55,{w:84,h:52}); put('chair',W*0.62-58,H*0.55,{}); put('chair',W*0.62+58,H*0.55,{});
    put('shelf',W-80,wallY+12,{w:110}); put('pot',W-40,H-60,{}); put('pot',40,H-60,{}); put('barrel',W-44,H*0.42,{});
  }
  if(st==='baker'){ put('oven',W/2,wallY+26,{}); put('counter',W*0.3,H*0.5,{w:150,h:40,goods:'bread'}); put('counter',W*0.72,H*0.5,{w:150,h:40,goods:'buns'}); put('sack',60,H-70,{}); put('sack',90,H-56,{}); put('barrel',W-50,H-70,{}); put('pot',W-50,120,{}); put('shelf',90,wallY+12,{w:110}); }
  if(st==='lamps'){ put('counter',W/2,H*0.45,{w:220,h:40,goods:'lamps'}); put('shelf',100,wallY+12,{w:150,lamps:true}); put('shelf',W-100,wallY+12,{w:150,lamps:true}); put('barrel',50,H-70,{}); put('barrel',86,H-64,{}); put('barrel',W-50,H-70,{}); put('drawer',W-60,H*0.62,{clue:true}); }
  if(st==='inn'){ put('fireplace',W/2,wallY+14,{}); put('counter',W*0.25,H*0.35,{w:180,h:40,goods:'mugs'}); for(const [x,y] of [[W*0.6,H*0.45],[W*0.82,H*0.45],[W*0.6,H*0.75],[W*0.35,H*0.72]]){ put('table',x,y,{w:64,h:44}); put('chair',x-44,y,{}); put('chair',x+44,y,{}); } put('barrel',40,H-60,{}); put('barrel',40,H-100,{}); put('bed',W-60,120,{w:62,h:96,inn:true}); }
  if(st==='guard'){ put('desk',W*0.3,H*0.45,{w:100,h:50}); put('board',W*0.3,wallY+8,{}); put('rack',70,H*0.5,{}); put('cell',W-140,H*0.42,{w:200,h:170}); put('barrel',50,H-60,{}); }
  if(st==='library'){ for(let i=0;i<4;i++){ put('shelf',90+i*((W-180)/3),wallY+12,{w:110}); } for(let i=0;i<3;i++) put('shelf',W*0.22+i*(W*0.28),H*0.42,{w:120,free:true}); put('table',W*0.35,H*0.72,{w:110,h:56,books:true}); put('table',W*0.7,H*0.72,{w:110,h:56,books:true}); put('candle',W*0.35,H*0.72-10,{}); put('candle',W*0.7,H*0.72-10,{}); }
  if(st==='tailor'){ put('counter',W*0.5,H*0.36,{w:200,h:40,goods:'cloth'}); put('hatstand',W*0.2,H*0.6,{}); put('hatstand',W*0.8,H*0.6,{}); put('mirror',W-60,wallY+8,{}); put('table',W*0.5,H*0.68,{w:100,h:50}); }
  if(st==='scholar'){ put('telescope',W*0.7,H*0.4,{}); put('desk',W*0.3,H*0.45,{w:110,h:52}); put('shelf',90,wallY+12,{w:120}); put('shelf',W-110,wallY+12,{w:120}); put('chart',W*0.5,wallY+8,{}); put('bed',60,H-90,{w:58,h:90}); }
  if(st==='mayor'){ for(let i=0;i<4;i++) put('painting',W*0.18+i*W*0.21,wallY*0.45,{mayor:i}); put('desk',W*0.5,H*0.45,{w:140,h:60}); put('trophy',W-60,H*0.5,{}); put('fireplace',70,wallY+14,{}); }
  if(st==='miner'){ put('bunk',70,110,{}); put('bunk',W-70,110,{}); put('table',W/2,H*0.58,{w:90,h:52}); put('cart',W-70,H-80,{}); put('rack',60,H*0.62,{picks:true}); put('barrel',W/2+80,H-60,{}); }
  if(st==='cook'){ put('cauldron',W/2,H*0.4,{}); put('counter',W*0.3,H*0.7,{w:140,h:40,goods:'rocks'}); put('sack',W-60,H-70,{}); put('barrel',50,H-60,{}); put('pot',W-50,110,{}); }
  if(st==='lodge'){ put('fireplace',W/2,wallY+14,{}); put('bearrug',W/2,H*0.55,{}); put('trophy',W*0.2,wallY+8,{antler:true}); put('table',W*0.78,H*0.6,{w:90,h:56}); put('chair',W*0.78-60,H*0.6,{}); put('sled',80,H-80,{}); put('bed',W-60,110,{w:62,h:96}); put('shelf',100,wallY+12,{w:110}); }
  if(st==='hut'){ put('cauldron',W/2,H*0.42,{}); put('shelf',90,wallY+12,{w:120,jars:true}); put('shelf',W-90,wallY+12,{w:120,jars:true}); put('bed',W-60,H-100,{w:56,h:88}); put('cat',90,H-70,{}); put('pot',W-40,120,{}); }
  if(st==='farmer'){ put('hay',W-70,H-80,{}); put('hay',W-120,H-60,{}); put('pail',W*0.4,H-60,{}); }
  if(st==='kid'){ put('toybox',W-70,H-70,{}); put('mapwall',W*0.3,wallY+8,{}); put('bunk',W-70,120,{}); }
  if(st==='knitter'){ put('yarn',W*0.3,H*0.75,{}); put('rocker',W*0.3,H*0.62,{}); put('cat',W*0.38,H*0.82,{}); }
  if(st==='fiddler'){ put('lute',W*0.3,H*0.78,{}); put('cat',W*0.75,H*0.8,{}); }
  if(st==='herbalist'){ put('herbs',W*0.3,wallY+10,{}); put('planter',W*0.28,H*0.78,{}); put('planter',W*0.4,H*0.8,{}); put('cauldron',W*0.82,H*0.78,{small:true}); }
  if(st==='ash'){ put('bed',70,120,{w:62,h:96,home:true}); put('bed',W-70,120,{w:62,h:96,mom:true}); put('fireplace',W/2,wallY+14,{}); put('table',W*0.55,H*0.58,{w:90,h:56}); put('chair',W*0.55-60,H*0.58,{}); put('chair',W*0.55+60,H*0.58,{}); put('portraits',W*0.3,wallY*0.45,{}); put('gchest',W-60,H-70,{page:'p9'}); put('toybox',60,H-70,{}); put('heights',W/2+60,H-10,{}); }
  if(st==='yara'){ put('bed',70,120,{w:62,h:96}); put('fireplace',W/2,wallY+14,{}); put('abacus',W*0.7,H*0.55,{}); put('perch',W-60,H*0.4,{}); put('shelf',W*0.25,wallY+12,{w:120,page:'p3'}); put('table',W*0.4,H*0.6,{w:80,h:50}); put('pot',40,H-60,{}); }
  // generic easter egg + diary for everyone else
  if(def.egg!=null){ const e=EGGS[def.egg%EGGS.length]; put(e.k,W*0.18+rng()*W*0.2,H*0.82,{egg:e}); }
  if(def.note) put('note',W*0.8,H*0.82,{text:def.note});
  if(def.painting!=null) put('painting',W*0.5+(rng()-0.5)*80,wallY*0.45,{caption:PAINTINGS[def.painting%PAINTINGS.length]});
  floorExtras(def,items,put,W,H,rng,wallY);
  return {W,H,items};
}
function buildHouse(A,def){
  const L=houseLayout(def), W=L.W, H=L.H, x0=IZX+300, y0=IZY+300, wt=26;
  Object.assign(A,{x0:x0-wt,y0:y0-wt,x1:x0+W+wt,y1:y0+H+wt+60,rx:x0,ry:y0,rw:W,rh:H,floor:def.floor||(def.style==='miner'||def.style==='hut'?'dirt':def.style==='library'||def.style==='mayor'||def.style==='guard'?'stone':'wood')});
  const dw=70, dx=x0+W/2;
  addAreaCol({t:'r',x0:x0-wt,y0:y0-wt,x1:x0+W+wt,y1:y0+34});
  addAreaCol({t:'r',x0:x0-wt,y0:y0-wt,x1:x0,y1:y0+H+wt});
  addAreaCol({t:'r',x0:x0+W,y0:y0-wt,x1:x0+W+wt,y1:y0+H+wt});
  if(def.noExit){ addAreaCol({t:'r',x0:x0-wt,y0:y0+H,x1:x0+W+wt,y1:y0+H+wt}); A.exit={x:dx,y:y0+H-56,r:0,none:true}; A.spawn={x:dx,y:y0+H-110}; }
  else{
  addAreaCol({t:'r',x0:x0-wt,y0:y0+H,x1:dx-dw/2,y1:y0+H+wt});
  addAreaCol({t:'r',x0:dx+dw/2,y0:y0+H,x1:x0+W+wt,y1:y0+H+wt});
  A.exit={x:dx,y:y0+H+30,r:40}; A.spawn={x:dx,y:y0+H-34}; }
  for(const it of L.items){
    const o=Object.assign({},it,{x:x0+it.x,y:y0+it.y,id:def.id+'_'+it.k+'_'+Math.round(it.x)+'_'+Math.round(it.y)});
    furnCollider(o); A.objs.push(o);
    if(o.k==='fireplace'||o.k==='oven') A.lights.push({x:o.x,y:o.y+16,r:220,i:0.0,fire:true,obj:o});
    if(o.k==='candle'||o.lamps) A.lights.push({x:o.x,y:o.y,r:140,i:0.6,fire:true});
  }
  A.lights.push({x:x0+W*0.22,y:y0+40,r:260,i:0,win:true},{x:x0+W*0.78,y:y0+40,r:260,i:0,win:true});
}
function furnCollider(o){
  const R=(w,h)=>addAreaCol({t:'r',x0:o.x-w/2,y0:o.y-h/2,x1:o.x+w/2,y1:o.y+h/2});
  switch(o.k){
    case 'bed': case 'table': case 'desk': case 'counter': o.col=R(o.w,o.h); break;
    case 'shelf': o.col=R(o.w||110,o.free?30:24); o.h=o.free?30:24; break;
    case 'fireplace': o.col=R(80,30); break; case 'oven': o.col=R(100,50); break;
    case 'bunk': o.col=R(62,100); break; case 'cell': o.col=null; o.bars=[R(o.w,10)]; break;
    case 'stairs': if(!(o.hidden&&!G.found[o.hidden])) o.col=R(o.w,o.h); break;
    case 'hchest': case 'crate': case 'musicbox': case 'telescope2': o.r=o.r||18; o.col=addAreaCol({t:'c',x:o.x,y:o.y,r:o.r}); break;
    case 'barrel': case 'pot': case 'chair': case 'sack': case 'cauldron': case 'telescope': case 'hatstand': case 'planter': case 'trophy': case 'rocker': case 'cart': case 'hay': case 'perch': case 'gchest': case 'toybox': case 'rack': case 'abacus':
      o.r=o.k==='chair'?11:o.k==='cauldron'?(o.small?16:24):o.k==='cart'||o.k==='hay'?26:o.k==='gchest'||o.k==='toybox'?20:16; o.col=addAreaCol({t:'c',x:o.x,y:o.y,r:o.r}); break;
  }
  if(o.k==='pot'||o.k==='barrel'||o.k==='sack') o.breakable=true;
}
// ---------- caves
function genCave(def){
  const rng=mulberry32(def.seed*7919+3), w=def.cw, h=def.ch, g=new Uint8Array(w*h).fill(1);
  const open=(i,j,r)=>{ for(let y=j-r;y<=j+r;y++) for(let x=i-r;x<=i+r;x++){ if(x>1&&y>1&&x<w-2&&y<h-2&&(x-i)**2+(y-j)**2<=r*r+1) g[y*w+x]=0; } };
  const ex=Math.floor(w/2), ey=h-3;
  // a few wandering tunnels from the entrance, biased upward
  for(let b=0;b<5;b++){
    let x=ex+(b?Math.floor((rng()-0.5)*w*0.4):0), y=b?Math.floor(h*(0.3+rng()*0.5)):ey, a=-Math.PI/2+(rng()-0.5)*1.6;
    const steps=b?220:420;
    for(let s=0;s<steps;s++){ open(Math.round(x),Math.round(y),rng()<0.15?2:1+(rng()<0.5?1:0)); a+=(rng()-0.5)*0.9; if(y<5) a=Math.PI/2*0.6+(rng()-0.5); if(y>h-5) a=-Math.PI/2; if(x<5) a=0; if(x>w-6) a=Math.PI; x+=Math.cos(a); y+=Math.sin(a)*0.8; if(rng()<0.02) open(Math.round(x),Math.round(y),3); }
  }
  for(let k=0;k<6;k++){ const cx=3+Math.floor(rng()*(w-6)), cy=3+Math.floor(rng()*(h-8)); open(cx,cy,2+Math.floor(rng()*2)); }
  // smooth
  for(let it=0;it<2;it++){ const n=g.slice(); for(let j=1;j<h-1;j++) for(let i=1;i<w-1;i++){ let c=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(dx||dy) c+=g[(j+dy)*w+i+dx]; n[j*w+i]=c>=5?1:c<=2?0:g[j*w+i]; } g.set(n); }
  for(let i=0;i<w;i++){ g[i]=1; g[(h-1)*w+i]=1; } for(let j=0;j<h;j++){ g[j*w]=1; g[j*w+w-1]=1; }
  for(let j=h-4;j<h;j++) for(let i=ex-1;i<=ex+1;i++) g[j*w+i]=0;
  // keep only what you can reach from the door
  const dist=new Int32Array(w*h).fill(-1), q=[ey*w+ex]; dist[ey*w+ex]=0;
  for(let qi=0;qi<q.length;qi++){ const c=q[qi], i=c%w, j=(c-i)/w; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ni=i+dx, nj=j+dy; if(ni<0||nj<0||ni>=w||nj>=h) continue; const nc=nj*w+ni; if(g[nc]===0&&dist[nc]<0){ dist[nc]=dist[c]+1; q.push(nc); } } }
  for(let c=0;c<w*h;c++) if(g[c]===0&&dist[c]<0) g[c]=1;
  return {w,h,grid:g,dist,cell:def.cell,ex,ey,open:q};
}
const CAVE_PAL={earth:['#3a2c22','#5a4434','#1a120c','#7a604a'],crystal:['#2a2438','#45385a','#120e1a','#8a70c0'],mine:['#3e3024','#5e4a36','#1a120a','#8a6a40'],bog:['#2a3424','#3e4a30','#10160c','#6a8a4a'],ice:['#3a4a5a','#6a8098','#16202a','#cfe6ff'],ember:['#2e1a18','#4a2a22','#120808','#ff7a3a']};
function renderCave(A,def){
  const c=A.cave, S=0.5, cs=c.cell, cv=mkCanvas(c.w*cs*S,c.h*cs*S), g=cv.getContext('2d'), pal=CAVE_PAL[def.theme]||CAVE_PAL.earth, rng=mulberry32(def.seed);
  g.scale(S,S);
  g.fillStyle=pal[0]; g.fillRect(0,0,c.w*cs,c.h*cs);
  // floor speckle
  for(let n=0;n<c.w*c.h*1.2;n++){ const x=rng()*c.w*cs, y=rng()*c.h*cs; g.fillStyle=rng()<0.5?'rgba(0,0,0,.18)':`rgba(${hexRGB(pal[3]).join(',')},.10)`; g.beginPath(); g.ellipse(x,y,2+rng()*8,1.5+rng()*5,rng()*3,0,TAU); g.fill(); }
  if(def.theme==='bog') for(let n=0;n<40;n++){ const ci=c.open[Math.floor(rng()*c.open.length)], i=ci%c.w, j=(ci-i)/c.w; g.fillStyle='rgba(40,60,30,.6)'; g.beginPath(); g.ellipse((i+0.5)*cs,(j+0.5)*cs,20+rng()*30,12+rng()*16,rng()*3,0,TAU); g.fill(); }
  if(def.theme==='ice') for(let n=0;n<50;n++){ const x=rng()*c.w*cs, y=rng()*c.h*cs; g.strokeStyle='rgba(220,240,255,.18)'; g.lineWidth=2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+rng()*40-20,y+rng()*40-20); g.stroke(); }
  if(def.theme==='mine'){ g.strokeStyle='#5a4a3a'; g.lineWidth=4; const path=c.open.filter((_,k)=>k%9===0).slice(0,140); for(const ci of path){ const i=ci%c.w, j=(ci-i)/c.w; if(rng()<0.25){ g.fillStyle='#4a3020'; g.fillRect(i*cs+6,j*cs+18,cs-12,5); g.fillRect(i*cs+6,j*cs+30,cs-12,5); } } }
  // walls: dark blobs with a lit rim
  const solidNear=(i,j)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const x=i+dx,y=j+dy; if(x>=0&&y>=0&&x<c.w&&y<c.h&&c.grid[y*c.w+x]===0) return true; } return false; };
  g.fillStyle=pal[3]; g.globalAlpha=0.35;
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++) if(c.grid[j*c.w+i]===1&&solidNear(i,j)){ g.beginPath(); g.arc((i+0.5)*cs-4,(j+0.5)*cs-5,cs*0.78,0,TAU); g.fill(); }
  g.globalAlpha=1; g.fillStyle=pal[1];
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++) if(c.grid[j*c.w+i]===1){ if(solidNear(i,j)){ g.beginPath(); g.arc((i+0.5)*cs,(j+0.5)*cs,cs*0.74,0,TAU); g.fill(); } else g.fillRect(i*cs-1,j*cs-1,cs+2,cs+2); }
  g.fillStyle=pal[2];
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++) if(c.grid[j*c.w+i]===1){ let inner=true; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const x=i+dx,y=j+dy; if(x>=0&&y>=0&&x<c.w&&y<c.h&&c.grid[y*c.w+x]===0) inner=false; } if(inner) g.fillRect(i*cs-2,j*cs-2,cs+4,cs+4); }
  for(let n=0;n<c.w*c.h*0.3;n++){ const i=Math.floor(rng()*c.w), j=Math.floor(rng()*c.h); if(c.grid[j*c.w+i]!==1||!solidNear(i,j)) continue; g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.arc((i+rng())*cs,(j+rng())*cs,3+rng()*7,0,TAU); g.fill(); }
  A.canvas=cv; A.canvasS=S;
  // minimap
  const mm=mkCanvas(c.w,c.h), mg=mm.getContext('2d'), im=mg.createImageData(c.w,c.h);
  for(let k=0;k<c.w*c.h;k++){ const v=c.grid[k]?[18,14,12]:hexRGB(pal[3]).map(q=>q*0.55); im.data[k*4]=v[0]; im.data[k*4+1]=v[1]; im.data[k*4+2]=v[2]; im.data[k*4+3]=255; }
  mg.putImageData(im,0,0); A.mini=mm;
}
function buildCave(A,def){
  const c=genCave(def), x0=IZX+200, y0=IZY+200;
  A.cave=c; Object.assign(A,{x0,y0,x1:x0+c.w*c.cell,y1:y0+c.h*c.cell});
  const P=(ci)=>{ const i=ci%c.w, j=(ci-i)/c.w; return {x:x0+(i+0.5)*c.cell,y:y0+(j+0.5)*c.cell,d:c.dist[ci]}; };
  A.exit={x:x0+(c.ex+0.5)*c.cell,y:y0+(c.h-0.9)*c.cell,r:44}; A.spawn={x:A.exit.x,y:A.exit.y-90};
  const cells=c.open.map(P), maxd=cells[cells.length-1].d;
  const rng=mulberry32(def.seed*31+1);
  const farPick=(minFrac,avoid)=>{ for(let t=0;t<200;t++){ const p=cells[Math.floor(cells.length*(minFrac+(1-minFrac)*rng()))]; if(!p) continue; if(avoid.some(a=>dist2(a.x,a.y,p.x,p.y)<240*240)) continue; let roomy=true; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(areaBlockedRaw(c,x0,y0,p.x+dx*c.cell,p.y+dy*c.cell)) roomy=false; if(!roomy&&t<150) continue; return p; } return cells[cells.length-1]; };
  const used=[A.spawn];
  const deepest=cells[cells.length-1]; used.push(deepest);
  if(def.chest){ A.objs.push({k:'cchest',x:deepest.x,y:deepest.y,id:def.id+'_chest',sealed:!!def.braziers,r:18}); addAreaCol({t:'c',x:deepest.x,y:deepest.y,r:16}); }
  if(def.braziers){ for(let b=0;b<def.braziers;b++){ const p=farPick(0.35,used); used.push(p); const o={k:'brazier',x:p.x,y:p.y,id:def.id+'_br'+b,lit:!!(G.found[def.id+'_solved']),r:14}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:13}); A.lights.push({x:p.x,y:p.y,r:260,i:0,fire:true,obj:o}); } }
  if(def.item){ const p=farPick(0.6,used); used.push(p); A.objs.push({k:'qitem',x:p.x,y:p.y,id:def.id+'_item',item:def.item.item,label:def.item.label,flag:def.item.flag,needQuest:def.item.needQuest}); }
  if(def.page){ const p=farPick(0.5,used); used.push(p); A.objs.push({k:'page',x:p.x,y:p.y,id:'page_'+def.page,page:def.page}); }
  if(def.ore){ const p=farPick(0.5,used); used.push(p); A.objs.push({k:'cave_ore',x:p.x,y:p.y,id:def.id+'_ore',r:16}); A.lights.push({x:p.x,y:p.y,r:140,i:0.6}); }
  if(def.relic){ const p=farPick(0.7,used); used.push(p); A.objs.push({k:'relic',x:p.x,y:p.y,id:def.id+'_relic',r:16}); A.lights.push({x:p.x,y:p.y,r:200,i:0.8}); }
  if(def.npc){ const p=farPick(def.npc==='shellby'?0.75:0.8,used); used.push(p); A.npcHere={id:def.npc,x:p.x,y:p.y}; }
  // decor lights: crystals, mushrooms, ice
  const dec=def.theme==='crystal'?'crystal':def.theme==='bog'?'shroom':def.theme==='ice'?'icicle':def.theme==='ember'?'magma':def.theme==='mine'?'lamp':'shroom';
  for(let k=0;k<26;k++){ const p=cells[Math.floor(rng()*cells.length)]; if(p.d<6) continue; const o={k:'decor',dk:dec,x:p.x+rand(-14,14),y:p.y+rand(-14,14),s:0.7+rng()*0.7,id:'d'+k}; A.objs.push(o); if(k%2===0) A.lights.push({x:o.x,y:o.y,r:dec==='lamp'?190:120,i:dec==='lamp'?0.7:0.45,tint:dec}); }
  // pots and crates
  for(let k=0;k<9;k++){ const p=cells[Math.floor(rng()*cells.length)]; if(p.d<5) continue; A.objs.push({k:rng()<0.5?'pot':'barrel',x:p.x+rand(-10,10),y:p.y+rand(-10,10),id:'bp'+k,breakable:true,r:14}); }
  // enemies (stay gone for a while once you clear the place)
  const cl=G.caveCleared[def.id];
  if(!(cl!=null&&G.worldTime-cl<420)){
    A.camp={id:'cave_'+def.id,alive:0,cave:def.id};
    for(const [type,n] of def.enemies){ for(let k=0;k<n;k++){ const p=farPick(0.15,[A.spawn]); const e=makeEnemy(type,p.x+rand(-12,12),p.y+rand(-12,12),{level:def.level,aggro:false,homeX:p.x,homeY:p.y,leash:700,camp:A.camp,face:rand(0,TAU),snowy:def.theme==='ice'}); e.inArea=true; A.camp.alive++; } }
  }
  renderCave(A,def);
}
function areaBlockedRaw(c,x0,y0,x,y){ const i=Math.floor((x-x0)/c.cell), j=Math.floor((y-y0)/c.cell); if(i<0||j<0||i>=c.w||j>=c.h) return true; return c.grid[j*c.w+i]===1; }
// ---------- enter / exit
function enterArea(id,door){
  const def=AREADEFS[id]; if(!def) return;
  if(def.trial&&!trialOpen(def.trial)){ runDialogue(STORY['trial_'+def.trial+'_sealed']||[['narr','The great stone doors will not move.']],()=>{ scene='play'; }); return; }
  if(def.locked&&!G.items[def.locked]&&!G.found[def.id+'_unlocked']){ runDialogue([['narr',def.lockText||'The way is sealed with an iron door and a very big lock. There’s a scale stamped on it.']],()=>{ scene='play'; }); return; }
  if(def.locked&&!G.found[def.id+'_unlocked']){ G.found[def.id+'_unlocked']=true; setBanner('Unlocked',def.name,1.8); }
  G.ow={x:door.x,y:door.y+(door.outY||40)}; DW.from=door; DW.note=null;
  for(const e of G.enemies) if(!e.boss) e.dead=true;
  G.projectiles=[]; G.hazards=[]; G.pools=[]; G.rings=[]; G.pickups=[]; G.critters=[];
  AREA={def,id,kind:def.kind,name:def.name,cols:[],objs:[],lights:[],npcs:[],dark:def.dark,level:def.level||1};
  G.area=id;
  if(def.kind==='house') buildHouse(AREA,def); else if(CAVEMAP[def.id]) buildCaveRooms(AREA,def); else buildCave(AREA,def);
  areaNPCs();
  player.x=AREA.spawn.x; player.y=AREA.spawn.y; player.kvx=player.kvy=0; player.facing=-Math.PI/2;
  if(G.pip){ G.pip.x=player.x; G.pip.y=player.y+30; } compsOnMove();
  if(G.goat&&G.side.duchess==='follow'){ G.goat.x=player.x+30; G.goat.y=player.y+30; }
  updateCam(0,true); G.fade=1; SFX.play('ui');
  { const TI=def.kind==='cave'&&trialInfo(def.trial||def.id), sh=TI&&TI.shrine; if(sh){ G.shrines[sh.id]=true; G.lastShrine=sh.id; } }
  if(!G.found['seen_'+id]){ G.found['seen_'+id]=true; if(def.kind==='cave'){ setBanner(def.name,def.trial?`One of Ember’s Trials · Danger level ${def.level}`:`${def.dunKind||'A cave'} · Danger level ${def.level}`,2.6,'region'); } }
  else if(def.kind==='cave') setBanner(def.name,'',1.6,'region');
  if(def.kind==='house'&&def.owner) setBanner(def.name,'',1.4,'region');
  questPoke();
}
function exitArea(silent){
  if(!AREA) return;
  for(const c of AREA.cols) removeCol(c);
  for(const e of G.enemies) if(e.inArea) e.dead=true;
  G.projectiles=[]; G.hazards=[]; G.pools=[]; G.pickups=[];
  const ow=G.ow||{x:POI.village.x,y:POI.village.y+150};
  AREA=null; G.area=null; DW.hold=DW.from||null; DW.holdT=0.4; DW.note=null;
  player.x=ow.x; player.y=ow.y; player.kvx=player.kvy=0; player.facing=Math.PI/2;
  if(G.pip){ G.pip.x=player.x-30; G.pip.y=player.y; } compsOnMove();
  if(G.goat&&G.side.duchess==='follow'){ G.goat.x=player.x-40; G.goat.y=player.y+30; }
  updateCam(0,true); G.chunkBurst=16; if(!silent){ G.fade=1; SFX.play('ui'); }
  G.regionT=0;
}
function areaNPCs(){
  const A=AREA;
  for(const c of CAST){ if(c.inside===A.id&&npcPresent(c.id)){ A.npcs.push(mkNPC(c,A.rx+A.rw*(c.ix||0.5),A.ry+A.rh*(c.iy||0.5))); } }
  for(const p of PRISONERS()){ if(p.area===A.id){ const o=A.objs.find(q=>q.k==='cell'); if(o){ const n=mkNPC(CASTBY[p.id]||{id:p.id,name:p.name,col:'#ccc',look:{}},o.x+p.dx,o.y+20); n.prisoner=true; A.npcs.push(n); } } }
  if(A.npcHere){ const h=A.npcHere; if(h.id==='juniper'&&!G.flags.juniper_found) A.npcs.push(mkNPC(SPECIAL.juniper,h.x,h.y)); if(h.id==='shellby') A.npcs.push(mkNPC(SPECIAL.shellby,h.x,h.y)); }
  if(A.trialNpcs) for(const t of A.trialNpcs) if(SPECIAL[t.id]&&trialNpcHere(t.id)) A.npcs.push(mkNPC(SPECIAL[t.id],t.x,t.y));
}
// ---------- per-frame
function updateArea(dt){
  const A=AREA, p=player;
  if(!A.exit.none&&dist(p.x,p.y,A.exit.x,A.exit.y)<A.exit.r&&p.y>A.exit.y-20&&scene==='play'){ exitArea(); return; }
  if(A.rooms) updateCaveRooms(dt);
  if(A.camp&&A.camp.alive<=0&&!A.camp.done){ A.camp.done=true; G.caveCleared[A.def.id]=G.worldTime; if(!A.def.trial){ setBanner('Cave cleared','',1.8); G.stats.caves=(G.stats.caves||0)+1; } }
  for(const L of A.lights){ if(L.obj) L.i=L.obj.lit?0.9:0; if(L.win) L.i=0.35*daylight(); }
  for(const n of A.npcs){ n.t+=dt; n.face=turnTo(n.face,angTo(n.x,n.y,p.x,p.y),dist(n.x,n.y,p.x,p.y)<240?3*dt:0); }
  if(A.def.kind==='cave'&&Math.random()<dt*0.25) SFX.play('step',0.4);
}

// ================= walking in and out (v11 UX)
// Like Link's Awakening: walking into an unlocked door takes Ash inside at once (no prompt, no key, no dialogue box),
// and the doormat inside takes him back out (updateArea). House stairs work the same way (floorStairsWalk in
// a2g_floors.js). A locked door shows a padlock before he gets to it (doorLocksDraw), and bumping it puts a short note
// over it instead of a dialogue box; the note goes in the Log too. In a dungeon, walking into a locked door with a
// small key (or the great door with the Boss Key) opens it, and a closed door says what opens it.
// After any of these moves, the trigger Ash arrives next to waits until he has stepped off it, so he never bounces back.
// Doors that still ask: roof hatches and crossings (deliberate climbs), and anything that is not a plain way in.
function doorWalkable(d){
  if(d.walk!=null) return !!d.walk;
  if(d.hs||d.cave) return true;
  let l=''; try{ l=String(d.label||''); }catch(e){}
  return /^(enter|go in|go into|try|climb down)\b/i.test(l.trim());
}
// the way into the door: up for houses and caves; for the others, the side where something solid is
function doorIn(d){
  if(d._in!=null) return d._in;
  let a=-Math.PI/2;
  if(!d.hs&&!d.cave){
    const solid=(x,y)=>{ try{ return colAt(x,y,4)||blockedAt(x,y); }catch(e){ return false; } };
    let best=null;
    for(const k of [-Math.PI/2,0,Math.PI,Math.PI/2]){ let n=0; for(const r of [22,34,48]) if(solid(d.x+Math.cos(k)*r,d.y+Math.sin(k)*r)) n++; if(n&&(!best||n>best.n)) best={k,n}; }
    if(best) a=best.k;
  }
  return d._in=a;
}
// where Ash stands next to a door: how far in (al, plus is inside) and how far to the side (lat)
function doorRel(d,p){ const a=doorIn(d), ux=Math.cos(a), uy=Math.sin(a), rx=p.x-d.x, ry=p.y-d.y; return {al:rx*ux+ry*uy,lat:Math.abs(rx*uy-ry*ux),ux,uy}; }
function inDoorZone(d,p){ const r=doorRel(d,p); return r.lat<(d.cave?26:18)&&r.al>-9&&r.al<40; }
// what keeps a door shut right now (the text it would say), or null when it opens. The same rules enterArea and the
// act modules use (door.need, door.m3need, the Trials, the Oath's tunnel key, the goats' little cave)
function doorLockText(d){
  const def=AREADEFS[d.area]; if(!def||!G) return null;
  const T=v=>typeof v==='function'?v():v;
  try{
    if(d.need&&!d.need()) return T(d.locked)||S('It will not open.','It is shut.');
    if(d.m3need&&!d.m3need()) return T(d.m3locked)||S('It will not open.','It is shut.');
    if(G.mode!=='story') return null;
    if(def.trial&&!trialOpen(def.trial)) return S('The great stone doors will not move.','The doors will not move.');
    if(def.locked&&!G.items[def.locked]&&!G.found[def.id+'_unlocked']) return def.lockText||'The way is sealed with an iron door and a very big lock. There’s a scale stamped on it.';
    if(d.area==='a1_nursery'&&typeof a1NurseryOpen==='function'&&!a1NurseryOpen()) return S('Too dark to go in alone.','Too dark to go in alone.');
  }catch(e){}
  return null;
}
// the way Ash is pushing: the stick or the keys, or his roll
function dwPush(p){
  if(p.dashT>0) return {x:Math.cos(p.dashDir),y:Math.sin(p.dashDir)};
  const mx=p.inMx||0, my=p.inMy||0, m=Math.hypot(mx,my);
  return m>0.35?{x:mx/m,y:my/m}:null;
}
// run fn with runDialogue held back: what it would have said comes back as lines instead of a dialogue box
function dwCapture(fn){
  const real=runDialogue, calls=[];
  runDialogue=function(lines,done,opt){ calls.push([lines,done,opt]); };
  try{ fn(); } catch(e){ console.error(e); } finally { runDialogue=real; }
  return calls;
}
function dwLinesText(calls){
  const out=[];
  for(const c of calls) for(const l of c[0]||[]){
    const L=lineParts(l); if(!L) continue;
    try{ if(L.skipIf&&L.skipIf()) continue; }catch(e){}
    let t=typeof L.text==='function'?L.text():L.text; if(!t) continue; t=simplify(String(t));
    const who=typeof L.who==='function'?L.who():L.who, nm=who&&who!=='narr'&&SPK[who]?SPK[who].name:'';
    out.push(nm?`${nm}: ${t}`:t);
  }
  return out.join(' ');
}
// a short note over a door (or anything Ash bumps): wraps to a few lines, fades after a while, goes in the Log
function doorNote(x,y,text,lock){
  text=String(text||'').trim(); if(!text) return;
  let s=text;
  if(s.length>170){ const cut=s.slice(0,170), i=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('! '),cut.lastIndexOf('? ')); s=i>60?cut.slice(0,i+1):cut.replace(/\s+\S*$/,'')+'…'; }
  DW.note={x,y,text:s,t:0,dur:clamp(1.6+s.length*0.045,2.6,7),lock:!!lock};
  try{ SFX.play(lock?'block':'ui',0.7); }catch(e){}
  try{ logAdd({k:'narr',who:'',col:'#d8c3a0',text}); }catch(e){}
}
function doorBump(d){
  if(DW.bumpT>0&&DW.bumpD===d) return;
  DW.bumpT=2.4; DW.bumpD=d;
  const calls=dwCapture(()=>enterArea(d.area,d));
  // it opened after all: let anything it wanted to say be said
  if(AREA){ for(const c of calls) runDialogue(c[0],c[1],c[2]); return; }
  { const L=doorLockAt(d); doorNote(L.x,L.y-14,dwLinesText(calls)||doorLockText(d)||S('It will not open.','It is shut.'),true); }
}
function doorWalkIn(d){
  if(doorLockText(d)!=null){ doorBump(d); return; }
  if(G.inCombat||(G.boss&&!G.boss.dead)){ if(!(DW.bumpT>0&&DW.bumpD===d)){ DW.bumpT=2.4; DW.bumpD=d; const L=doorLockAt(d); doorNote(L.x,L.y-14,S('Not with foes this close!','Foes are near!'),false); } return; }
  enterArea(d.area,d);
  if(AREA) G.prompt=null;
}
// a dungeon door Ash walks into: a key opens it, else it says what it needs (the same words its Look prompt gives)
function caveDoorBump(push){
  const A=AREA, p=player; if(!A||!A.gates||!push) return false;
  for(const o of A.gates){
    if(o.k!=='cgate'||!o.closed||o.tmp||o.opened) continue;
    const dx=o.x-p.x, dy=o.y-p.y, d=Math.hypot(dx,dy); if(d>(A.cave?A.cave.cell*1.15:56)||d<1) continue;
    if((push.x*dx+push.y*dy)/d<0.55) continue;
    if(DW.bumpT>0&&DW.bumpD===o) return true;
    DW.bumpT=2.4; DW.bumpD=o;
    const calls=dwCapture(()=>caveObjAct(o));
    if(o.opened||!o.closed){ for(const c of calls) runDialogue(c[0],c[1],c[2]); return true; }
    const t=dwLinesText(calls); if(t) doorNote(o.x,o.y-40,t,o.type==='lock'||o.type==='boss');
    else for(const c of calls) runDialogue(c[0],c[1],c[2]);
    return true;
  }
  return false;
}
function doorWalkTick(dt){
  const p=player; if(!p||!G||G.mode!=='story') return;
  if(DW.holdT>0) DW.holdT-=dt;
  if(DW.bumpT>0) DW.bumpT-=dt;
  if(DW.note){ DW.note.t+=dt; if(DW.note.t>DW.note.dur) DW.note=null; }
  if(scene!=='play'||p.dead||p.flying||(p.z||0)>2||G.fishing||G.fade>0.6) return;
  const push=dwPush(p);
  if(AREA){
    if(AREA.kind==='house') floorStairsWalk(push);
    else caveDoorBump(push);
    return;
  }
  if(DW.hold&&!(DW.holdT>0)&&!inDoorZone(DW.hold,p)) DW.hold=null;
  if(!push) return;
  for(const d of mapList(DOORS,curMap())){
    if(Math.abs(d.x-p.x)>70||Math.abs(d.y-p.y)>70||d===DW.hold||!doorWalkable(d)) continue;
    const r=doorRel(d,p);
    // a locked door is often barred by its gate before Ash reaches it: it answers from a little further out
    const lk=r.al>-46&&r.al<=-9&&doorLockText(d)!=null;
    if(r.lat>=(d.cave?26:18)||(r.al<=-9&&!lk)||r.al>=40) continue;
    if(push.x*r.ux+push.y*r.uy<0.4) continue;
    doorWalkIn(d); return;
  }
}
// the doors Ash walks into have no prompt: they step aside while the prompts are picked
const DW_OFF=1e7;
function dwHide(){
  const p=player, out=[]; if(AREA||!p||!G||G.mode!=='story') return out;
  for(const d of mapList(DOORS,curMap())){ if(Math.abs(d.x-p.x)>90||Math.abs(d.y-p.y)>90||!doorWalkable(d)) continue; d.x+=DW_OFF; out.push(d); }
  return out;
}
{ const base=updateInteractions; updateInteractions=function(dt){
  try{ doorWalkTick(dt); }catch(e){ console.error(e); }
  const hid=dwHide();
  try{ base(dt); } finally { for(const d of hid) d.x-=DW_OFF; }
  // the doormat takes him out: "Leave" is not something to press any more
  if(AREA&&G.prompt&&G.prompt.text==='Leave') G.prompt=null;
}; }
// ---------- how a locked door looks: a plank barred across it and a padlock, in both looks (drawn with the world)
function doorLockAt(d){
  if(d.hs) return {x:d.x,y:d.y-30,w:28};
  if(d.trial) return {x:d.x,y:d.y-62,w:44};
  if(d.cave) return {x:d.x,y:d.y-24,w:40};
  const a=doorIn(d); return {x:d.x+Math.cos(a)*14,y:d.y+Math.sin(a)*14-14,w:30};
}
function drawPadlock(g,x,y,s,sb){
  const ol=sb?SBC.outline:'#1a120c';
  g.save(); g.translate(x,y); g.scale(s,s);
  g.lineWidth=3.2; g.strokeStyle=ol; g.beginPath(); g.arc(0,-5,5.2,Math.PI,0); g.lineTo(5.2,-1); g.moveTo(-5.2,-1); g.lineTo(-5.2,-5); g.stroke();
  g.lineWidth=1.8; g.strokeStyle=sb?'#d8d2c4':'#b8b4ac'; g.beginPath(); g.arc(0,-5,5.2,Math.PI,0); g.lineTo(5.2,-1); g.moveTo(-5.2,-1); g.lineTo(-5.2,-5); g.stroke();
  g.fillStyle=sb?SBC.gold:'#e0b040'; g.strokeStyle=ol; g.lineWidth=sb?2.2:1.6; rrect(g,-7.5,-2,15,12,2.5); g.fill(); g.stroke();
  g.fillStyle='rgba(255,255,255,.45)'; g.fillRect(-5.5,-0.5,11,2);
  g.fillStyle=ol; g.beginPath(); g.arc(0,3,1.9,0,TAU); g.fill(); g.fillRect(-0.9,3.5,1.8,4);
  g.restore();
}
function drawDoorLock(d,t){
  const L=doorLockAt(d), sb=LOOK.sb, g=ctx, w=L.w;
  g.save();
  // the bar: a dark plank with two nails, across the doorway
  g.translate(L.x,L.y+2); g.rotate(-0.12);
  g.fillStyle=sb?SBC.outline:'rgba(0,0,0,.45)'; rrect(g,-w/2-1,-3,w+2,9,2); g.fill();
  g.fillStyle=sb?'#a8743e':'#7a5230'; rrect(g,-w/2,-4,w,7,2); g.fill();
  if(sb){ g.strokeStyle=SBC.outline; g.lineWidth=1.6; g.stroke(); }
  g.fillStyle=sb?'#5a3a24':'#3a2414'; g.beginPath(); g.arc(-w/2+4,-0.5,1.3,0,TAU); g.arc(w/2-4,-0.5,1.3,0,TAU); g.fill();
  g.restore();
  // a soft dark disc so the lock reads on any wall, then the padlock (it breathes a little so the eye finds it)
  const s=1+Math.sin(t*2.4)*0.04;
  g.fillStyle=sb?'rgba(59,34,51,.35)':'rgba(10,6,4,.45)'; g.beginPath(); g.arc(L.x,L.y+1,11.5,0,TAU); g.fill();
  drawPadlock(g,L.x,L.y+1,s,sb);
}
function doorLocksDraw(){
  if(!G||G.mode!=='story'||AREA) return;
  const t=G.time||0;
  for(const d of mapList(DOORS,curMap())){
    if(!inView(d.x,d.y,80)) continue;
    const lk=doorLockText(d)!=null;
    // a door that just opened (story progress, a key): a puff of dust where the bar was
    if(d._lk&&!lk){ const L=doorLockAt(d); emit(L.x,L.y,16,{col:'230,210,170',glow:false,smin:30,smax:110,lmin:.4,lmax:.8,zmin:1.5,zmax:3,grow:6}); try{ SFX.play('chest',0.6); }catch(e){} }
    d._lk=lk;
    if(lk) drawDoorLock(d,t);
  }
}
{ const base=drawWall; drawWall=function(){ base.apply(this,arguments); try{ doorLocksDraw(); }catch(e){ console.error(e); } }; }
// ---------- the note over a locked door (drawn with the HUD, a11b_hud.js), so it never hides under a roof
function doorNoteDraw(){
  const N=DW.note; if(!N||scene!=='play') return;
  const sx=(N.x-cam.x)*zoom, sy=(N.y-cam.y)*zoom, a=clamp(Math.min(N.t/0.15,(N.dur-N.t)/0.4),0,1); if(a<=0) return;
  const g=ctx, sb=LOOK.sb, maxW=Math.min(300,W-40), lh=19, pad=12, iw=N.lock?22:0;
  g.save(); g.globalAlpha=a; g.font=`600 14px ${UIF}`;
  const words=N.text.split(/\s+/), lines=[]; let cur='';
  for(const w of words){ const tr=cur?cur+' '+w:w; if(g.measureText(tr).width>maxW-pad*2-iw&&cur){ lines.push(cur); cur=w; } else cur=tr; }
  if(cur) lines.push(cur);
  let tw=0; for(const l of lines) tw=Math.max(tw,g.measureText(l).width);
  const bw=Math.ceil(tw+pad*2+iw), bh=lines.length*lh+pad*1.4;
  const bx=clamp(sx-bw/2,SAFE.l+12,W-SAFE.r-12-bw), by=clamp(sy-bh-18,SAFE.t+12,H-SAFE.b-bh-12);
  const tx=clamp(sx,bx+16,bx+bw-16), below=by+bh<sy-4;
  if(sb){ g.fillStyle=SBC.outline; rrect(g,bx,by+3,bw,bh,10); g.fill(); g.fillStyle='#fff3d6'; rrect(g,bx,by,bw,bh,10); g.fill(); g.lineWidth=2.6; g.strokeStyle=SBC.outline; g.stroke(); }
  else{ g.fillStyle='rgba(12,9,6,.86)'; rrect(g,bx,by,bw,bh,10); g.fill(); g.strokeStyle='rgba(255,210,150,.45)'; g.lineWidth=1; g.stroke(); }
  if(below){ g.fillStyle=sb?'#fff3d6':'rgba(12,9,6,.86)'; g.beginPath(); g.moveTo(tx-7,by+bh-0.5); g.lineTo(tx,by+bh+8); g.lineTo(tx+7,by+bh-0.5); g.closePath(); g.fill(); if(sb){ g.strokeStyle=SBC.outline; g.lineWidth=2.2; g.beginPath(); g.moveTo(tx-7,by+bh); g.lineTo(tx,by+bh+8); g.lineTo(tx+7,by+bh); g.stroke(); } }
  if(N.lock) drawPadlock(g,bx+pad+7,by+pad*0.7+lh/2-1,0.85,sb);
  g.fillStyle=sb?SBC.outline:'#ffe6c0'; g.textAlign='left'; g.textBaseline='middle';
  lines.forEach((l,i)=>g.fillText(l,bx+pad+iw,by+pad*0.7+lh*i+lh/2));
  g.restore();
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{doorInfo:d=>({walk:doorWalkable(d),inA:doorIn(d),lock:doorLockText(d)}),note:()=>DW.note?DW.note.text:null,DW});
