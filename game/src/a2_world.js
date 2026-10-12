
// ================= world layout (the valley of Embermere)
const WORLD={w:14000,h:11000};
const BIOME_NAME=['the Southern Meadows','Whisperwood','the Ashen Road','the Drakeling Crags','the Cinderlands','the Frostpine Highlands','the Mirefen'];
const BIOME_LEVEL=[1,2,4,6,9,7,5];
const BSEEDS=[[2600,9300,0],[5200,9800,0],[4300,8600,0],[7600,9900,0],[6200,8600,0],[1200,10200,0],[6000,7200,0],[7400,7600,0],[8600,8300,0],
  [2400,6800,1],[3800,7400,1],[1200,7800,1],[4600,6200,1],[1400,5900,1],[5600,5600,1],
  [8400,5600,2],[7600,4600,2],[9600,6200,2],[8800,3800,2],[6400,4200,2],
  [12000,4400,3],[13000,5800,3],[11200,3400,3],[12800,3200,3],[11400,6600,3],
  [1800,3800,5],[3400,3300,5],[900,4800,5],[3200,4700,5],[4800,3600,5],
  [11000,9200,6],[12600,8600,6],[13200,10200,6],[10200,10400,6],[12000,7700,6]];
const WALL_Y=2900, GATE_X0=6940, GATE_X1=7060;
const RIVERS=[
  {pts:[[3600,3100],[3900,3900],[4300,4700],[4700,5500],[5200,6200],[5650,6780]],w:60},
  {pts:[[6500,7500],[7100,8100],[7800,8600],[8600,8900],[9400,9300],[10200,9800],[11000,10400],[11600,11150]],w:68},
  {pts:[[11800,3000],[11200,3700],[10600,4300],[10000,4900],[9800,5700],[9200,6300],[8300,6700],[7300,6900],[6550,7050]],w:58}
];
const LAKE={x:6000,y:7200,r:600};
const ROADS=[
  [[2600,9300],[2800,8800],[3000,8300],[3100,7850]],
  [[2600,9300],[3400,9500],[4400,9300],[5200,8900],[5900,8400],[6600,8000],[7100,7700],[7300,7500]],
  [[7300,7500],[7800,6800],[8400,6200],[8900,5700],[9200,5300]],
  [[9200,5300],[9900,4900],[10700,4600],[11500,4400],[12200,4300]],
  [[7300,7500],[8000,7800],[8900,8300],[9800,8700],[10800,9000],[11800,9200],[12400,9600],[12900,10000]],
  [[2600,9300],[2300,8600],[2000,7800],[2100,7000],[2400,6200],[2600,5400],[2500,4700],[2400,4200]],
  [[7300,7500],[7000,6500],[6800,5600],[6900,4700],[7000,3800],[7000,3100],[7000,2700],[6950,2000],[6800,1500],[7000,950]],
  [[2600,5400],[3300,5180],[4600,4900],[5800,4700],[6900,4700]],
  [[4400,9300],[4700,9800],[5000,10200]],
  [[12200,4300],[12600,5400],[12900,6500]],
  [[2400,4200],[1900,3750],[1500,3400]],
  [[6620,7400],[6800,7400],[7300,7500]]
];
const LAVAS=[{pts:[[800,2200],[2000,1900],[3200,2200],[4400,1800],[5600,2000],[6600,1700],[7600,1800],[8800,1600],[10000,2000],[11400,1700],[13200,2100]],w:50}];
const POI={
  village:{x:2600,y:9300,r:700,name:'Emberhollow',level:1},
  warcamp:{x:3100,y:7800,r:360,name:"Grizzlefang's War Camp",level:2},
  brindle:{x:7300,y:7500,r:620,name:'Brindlecross',level:2},
  oath:{x:9200,y:5300,r:400,name:'The Ash Ward',level:4},
  nests:{x:12200,y:4300,r:430,name:'The Crag Ward',level:6},
  mire:{x:11800,y:9200,r:420,name:'The Sunken Ward',level:5},
  frost:{x:2400,y:4200,r:420,name:'The Frost Ward',level:7},
  mosshut:{x:12900,y:10000,r:200,name:"Granny Moss's Hut",level:5},
  farm:{x:3300,y:5180,r:260,name:'Hollis Farm',level:6},
  gate:{x:7000,y:3150,r:380,name:'The Obsidian Gate',level:8},
  summit:{x:7000,y:950,r:600,name:'The Throne of Cinders',level:10},
  proving:{x:5000,y:10200,r:640,name:'The Proving Grounds',level:3},
  copper:{x:12900,y:6500,r:420,name:'Coppergulch',level:6,town:true},
  lodge:{x:1500,y:3400,r:330,name:'Frostpine Lodge',level:7,town:true},
  way:{x:8100,y:6500,r:300,name:'The Smoky Kettle',level:3,town:true}
};
const SHRINES=[
  {id:'s_village',x:2950,y:9150,name:'Emberhollow Shrine'},{id:'s_wood',x:2350,y:7300,name:'Whisperwood Shrine'},
  {id:'s_brindle',x:7700,y:7850,name:'Brindlecross Shrine'},{id:'s_lake',x:5300,y:8200,name:'Lakeside Shrine'},
  {id:'s_ash',x:8300,y:5200,name:'Ashen Road Shrine'},{id:'s_crag',x:11000,y:5050,name:'Crag Shrine'},
  {id:'s_mire',x:10600,y:8550,name:'Mirefen Shrine'},{id:'s_frost',x:2950,y:4550,name:'Frostpine Shrine'},
  {id:'s_north',x:4300,y:3450,name:'Highland Shrine'},{id:'s_gate',x:7350,y:3500,name:'Gatewatch Shrine'},
  {id:'s_cinder',x:7350,y:2300,name:'Cinder Shrine'},{id:'s_proving',x:5650,y:10550,name:'Proving Shrine'},
  {id:'s_copper',x:12450,y:6950,name:'Coppergulch Shrine'},{id:'s_lodge',x:1950,y:3650,name:'Lodge Shrine'},{id:'s_way',x:8450,y:6800,name:'Kettle Shrine'}
];
const CAMPS=[
  {id:'c1',x:4200,y:10350,units:[['kobold',4]]},{id:'c2',x:6400,y:9600,units:[['kobold',5]]},{id:'c3',x:1300,y:10200,units:[['kobold',4]]},{id:'c4',x:7700,y:10400,units:[['kobold',3],['wolf',2]]},
  {id:'c5',x:1500,y:6600,units:[['kobold',3],['wolf',2]]},{id:'c6',x:3800,y:6800,units:[['wolf',4]]},{id:'c7',x:1200,y:8400,units:[['kobold',4]]},{id:'c8',x:4600,y:6000,units:[['kobold',3],['cultist',2]]},
  {id:'c9',x:7900,y:4500,units:[['cultist',3],['kobold',3]]},{id:'c10',x:9800,y:6600,units:[['cultist',4]]},{id:'c11',x:8600,y:3800,units:[['cultist',3],['kobold',4]]},{id:'c12',x:10400,y:5600,units:[['drakeling',2],['cultist',2]]},
  {id:'c13',x:13400,y:5150,units:[['drakeling',4]]},{id:'c14',x:11300,y:3500,units:[['drakeling',3],['cultist',2]]},{id:'c15',x:13200,y:3200,units:[['drakeling',5]]},{id:'c16',x:11800,y:6400,units:[['drakeling',3],['kobold',3]]},
  {id:'c17',x:10000,y:10200,units:[['kobold',4],['cultist',2]]},{id:'c18',x:12500,y:8200,units:[['cultist',3],['kobold',2]]},{id:'c19',x:13300,y:9400,units:[['kobold',5]]},{id:'c20',x:12100,y:10700,units:[['kobold',4],['drakeling',2]]},
  {id:'c21',x:4300,y:5300,units:[['wolf',3],['kobold',2]]},{id:'c22',x:3300,y:3900,units:[['kobold',3],['wolf',3]]},{id:'c23',x:900,y:5000,units:[['wolf',3],['kobold',2]]},{id:'c24',x:4600,y:4200,units:[['wolf',2],['kobold',3]]},
  {id:'c25',x:6200,y:3500,units:[['knight',2],['cultist',2]]},{id:'c26',x:7900,y:3400,units:[['knight',2],['kobold',3]]},
  {id:'c27',x:5200,y:2350,units:[['knight',2],['drakeling',3]]},{id:'c28',x:8800,y:2300,units:[['knight',3],['drakeling',2]]},{id:'c29',x:6000,y:1300,units:[['knight',2],['drakeling',2]]},{id:'c30',x:8200,y:1100,units:[['drakeling',4]]}
];
const ORES=[{id:'o1',x:13400,y:4850},{id:'o2',x:1100,y:4250},{id:'o3',x:8150,y:3300}];
function mkSegs(polys,pad){
  const out=[];
  for(const p of polys){ const pts=p.pts||p; for(let i=0;i<pts.length-1;i++){ const [ax,ay]=pts[i],[bx,by]=pts[i+1]; out.push({ax,ay,bx,by,dx:bx-ax,dy:by-ay,l2:(bx-ax)**2+(by-ay)**2,minx:Math.min(ax,bx)-pad,maxx:Math.max(ax,bx)+pad,miny:Math.min(ay,by)-pad,maxy:Math.max(ay,by)+pad,ang:Math.atan2(by-ay,bx-ax),w:p.w||0}); } }
  return out;
}
const RIVER_SEGS=mkSegs(RIVERS,160), ROAD_SEGS=mkSegs(ROADS,90), LAVA_SEGS=mkSegs(LAVAS,160);
let lastSeg=null;
function segsDist(x,y,segs){
  let best=1e18, bs=null;
  for(const s of segs){
    if(x<s.minx||x>s.maxx||y<s.miny||y>s.maxy) continue;
    let t=((x-s.ax)*s.dx+(y-s.ay)*s.dy)/s.l2; t=t<0?0:t>1?1:t;
    const px=s.ax+s.dx*t-x, py=s.ay+s.dy*t-y, d=px*px+py*py;
    if(d<best){ best=d; bs=s; }
  }
  lastSeg=bs; return bs?Math.sqrt(best):1e9;
}
const riverW=(x,y)=>62+fbm(x*0.004,y*0.004,2)*20;
const lakeR=(x,y)=>LAKE.r+fbm(x*0.003+3,y*0.003-4,2)*130;
const cinderLine=x=>2790+fbm(x*0.0015,3.3,2)*70;
const LAVA_CLEAR=[[7350,2300,190],[5200,2350,220],[8800,2300,220],[6000,1300,200],[8200,1100,200],[7000,950,700]];
function biomeInfo(x,y,o){
  const wx=x+fbm(x*0.0005,y*0.0005,3)*640, wy=y+fbm(x*0.0005+40,y*0.0005-20,3)*640;
  let d1=1e18,d2=1e18,b1=0,b2=0;
  for(const s of BSEEDS){ const dx=wx-s[0], dy=wy-s[1], d=dx*dx+dy*dy; if(d<d1){ d2=d1; b2=b1; d1=d; b1=s[2]; } else if(d<d2){ d2=d; b2=s[2]; } }
  o.b=b1; o.b2=b2; o.t=0.5+0.5*clamp((Math.sqrt(d2)-Math.sqrt(d1))/280,0,1);
  const cy=cinderLine(x);
  if(y<cy){ o.b2=b1; o.b=4; o.t=0.5+0.5*clamp((cy-y)/110,0,1); }
  else if(y<cy+110){ o.b2=4; o.t=Math.min(o.t,0.5+0.5*(y-cy)/110); }
  return o;
}
const SAMPLE={};
function lavaS(x,y,rdd){
  if(y>=cinderLine(x)) return 0;
  let k=clamp((cinderLine(x)-y)/60,0,1);
  for(const c of LAVA_CLEAR){ const d=dist(x,y,c[0],c[1]); if(d<c[2]+80) k=Math.min(k,clamp((d-c[2])/80,0,1)); }
  if(k<=0) return 0;
  const s1=clamp((48+fbm(x*0.005,y*0.005,2)*16-segsDist(x,y,LAVA_SEGS))/16,0,1);
  const s2=clamp((fbm(x*0.0025+5,y*0.0025+9,3)-0.40)/0.06,0,1)*clamp((rdd-70)/70,0,1)*clamp((2700-y)/80,0,1);
  return Math.max(s1,s2)*k;
}
function lavaAt(x,y,rdd){ return lavaS(x,y,rdd)>0.5; }
function bogS(x,y,rdd){ const n=fbm(x*0.0032+13,y*0.0032-7,3); return clamp((n-0.1)/0.08,0,1)*clamp((rdd-45)/40,0,1); }
function T(x,y,o){
  o=o||SAMPLE;
  o.out=(x<0||y<0||x>WORLD.w||y>WORLD.h)?1:0;
  biomeInfo(x,y,o);
  o.n=fbm(x*0.004,y*0.004,3);
  const rdd=segsDist(x,y,ROAD_SEGS); o.roadAng=lastSeg?lastSeg.ang:0; o.roadD=rdd;
  const rv=segsDist(x,y,RIVER_SEGS)-riverW(x,y);
  const lk=dist(x,y,LAKE.x,LAKE.y)-lakeR(x,y);
  const wd=Math.min(rv,lk);
  o.water=wd<0?1:0; o.depth=clamp(-wd/70,0,1); o.shore=wd>=0&&wd<30?1-wd/30:0;
  const roadW=o.b===4?26:19;
  o.road=rdd<roadW?1:rdd<roadW+10?1-(rdd-roadW)/10:0;
  o.bridge=0; o.lava=0; o.bog=0;
  if(o.water&&rdd<34) o.bridge=1;
  o.lavaS=o.b===4?lavaS(x,y,rdd):0;
  if(o.lavaS>0.5){ if(rdd<36){ o.bridge=2; o.lavaS=0; } else o.lava=1; }
  if(rdd<36) o.lavaS=Math.min(o.lavaS,0.45);
  if(o.b===6&&!o.water&&o.t>0.6){ o.bog=bogS(x,y,rdd)*clamp((o.t-0.6)/0.2,0,1); if(o.bog>0){ o.bog*=clamp((dist(x,y,POI.mire.x,POI.mire.y)-280)/120,0,1)*clamp((dist(x,y,POI.mosshut.x,POI.mosshut.y)-200)/100,0,1); } }
  return o;
}
function blockedAt(x,y){
  if(x>=IZX-50) return areaBlocked(x,y);
  if(x<30||y<30||x>WORLD.w-30||y>WORLD.h-30) return true;
  const rdd=segsDist(x,y,ROAD_SEGS);
  if(rdd<34) return false;
  if(x>6430&&x<6810&&Math.abs(y-7400)<26) return false;
  if(segsDist(x,y,RIVER_SEGS)<riverW(x,y)) return true;
  if(dist2(x,y,LAKE.x,LAKE.y)<(LAKE.r+140)**2&&dist(x,y,LAKE.x,LAKE.y)<lakeR(x,y)) return true;
  if(y<2850&&lavaAt(x,y,rdd)) return true;
  return false;
}
function regionAt(x,y){
  if(x>=IZX-50&&AREA) return {name:AREA.name,level:AREA.level,key:'area_'+AREA.id};
  for(const k in POI){ const p=POI[k]; if(dist2(x,y,p.x,p.y)<(p.r+120)**2) return {name:p.name,level:p.level,key:k}; }
  if(dist2(x,y,LAKE.x,LAKE.y)<(LAKE.r+260)**2) return {name:'Lake Mirrow',level:2,key:'lake'};
  const b=biomeInfo(x,y,{}).b;
  return {name:BIOME_NAME[b],level:BIOME_LEVEL[b],key:'b'+b};
}
