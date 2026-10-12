
// ================= wilderness landmarks, cave mouths, homes and doors
const LANDMARKS=[], CAVEMOUTHS=[], ITEMSPOTS=[];
const CAVE_SITES=[
  {area:'whisper',x:1650,y:7050},{area:'mirrow',x:5720,y:6440},{area:'tunnel',x:8700,y:5950},{area:'mine',x:13350,y:6800},
  {area:'grotto',x:11200,y:10450},{area:'icefang',x:1250,y:4650},{area:'deep',x:10400,y:2500}
];
const INDOOR={bertram:1,fennick:1,tilly:1,osric:1,marigold:1,quill:1,cookie:1,ulf:1,hob:1,wren:1};
const STYLE_OF={baker:'baker',lamps:'lamps',herbalist:'herbalist',kid:'kid',fiddler:'fiddler',knitter:'knitter',farmer:'farmer',inn:'inn',guard:'guard',tailor:'tailor',scholar:'scholar',mayor:'mayor',miner:'miner',cook:'cook',hunter:'lodge'};
function spotOK(x,y,r){ if(blockedAt(x,y)) return false; if(segsDist(x,y,ROAD_SEGS)<(r||40)) return false; return true; }
function nudge(x,y,r){ if(spotOK(x,y,r)) return [x,y]; for(let d=40;d<600;d+=40) for(let a=0;a<TAU;a+=0.5){ const nx=x+Math.cos(a)*d, ny=y+Math.sin(a)*d; if(spotOK(nx,ny,r)) return [nx,ny]; } return [x,y]; }
function addLandmark(o){ if(!o.noNudge){ const [x,y]=nudge(o.x,o.y,o.rr||50); o.x=x; o.y=y; } LANDMARKS.push(o); if(o.r) o.colRef=addCol({t:'c',x:o.x,y:o.y,r:o.r}); return o; }
function doorOf(hs){ return hs.vert?{x:hs.x+hs.w/2+16,y:hs.y,outY:0,side:'e'}:{x:hs.x,y:hs.y+hs.h/2+16,outY:16,side:'s'}; }
function buildPlaces(){
  // ---- cave mouths
  for(const s of CAVE_SITES){
    const [x,y]=nudge(s.x,s.y,80); const def=AREADEFS[s.area];
    const m={area:s.area,x,y,name:def.name}; CAVEMOUTHS.push(m);
    STRUCTS.push({k:'cavemouth',x,y,ref:m,theme:def.theme});
    for(let a=Math.PI*1.1;a<=Math.PI*1.9+0.01;a+=Math.PI*0.2) addCol({t:'c',x:x+Math.cos(a)*58,y:y+Math.sin(a)*46,r:26});
    DOORS.push({x,y:y+14,area:s.area,label:`Enter ${def.name}`,outY:46,cave:true});
  }
  // ---- the Warden statues
  const statues=[['iska',3350,8850],['bram',9700,5900],['oriel',11600,5200],['sedge',11000,8800],['tove',3000,3400]];
  for(const [w,x,y] of statues) addLandmark({id:'st_'+w,k:'statue',who:w,x,y,r:20,prompt:'Read the inscription'});
  // ---- odd things in the wild
  addLandmark({id:'well',k:'wishwell',x:4700,y:8900,r:24,prompt:'Toss a coin in the wishing well'});
  addLandmark({id:'barkley',k:'facetree',x:3900,y:7300,r:30,prompt:'Talk to the old tree'});
  addLandmark({id:'fairy',k:'fairyring',x:1900,y:8500,prompt:'Step into the mushroom ring'});
  addLandmark({id:'ribs',k:'ribs',x:9300,y:6400,prompt:'Look at the giant bones'});
  addLandmark({id:'wagon',k:'wagon',x:7600,y:6150,r:30,prompt:'Search the abandoned wagon'});
  addLandmark({id:'strawsworth',k:'scarecrow',x:2120,y:9850,r:10,prompt:'Talk to the scarecrow'});
  addLandmark({id:'reginald',k:'grave',x:5600,y:5800,r:12,prompt:'Read the gravestone'});
  addLandmark({id:'brisket',k:'iceblock',x:3500,y:3520,r:22,prompt:'Look at the block of ice'});
  addLandmark({id:'spring',k:'hotspring',x:1000,y:3650,prompt:'Soak in the hot spring'});
  addLandmark({id:'sal',k:'boatframe',x:5450,y:7050,r:34,prompt:'Look at the half-built boat'});
  addLandmark({id:'bootprints',k:'prints',x:POI.village.x-10,y:POI.village.y-140,noNudge:true,prompt:'Examine the bootprints',hidden:()=>!(G.quests.gate&&G.quests.gate.step===0)});
  addLandmark({id:'kettle',k:'kettle',x:9800,y:6600,noNudge:true,prompt:'Grab the kettle',hidden:()=>!(G.quests.kettle&&G.quests.kettle.step===0)});
  addLandmark({id:'helm',k:'helm',x:POI.gate.x+90,y:POI.gate.y-60,noNudge:true,prompt:'Look at the helmet',hidden:()=>G.choices.cinder!=='rest'});
  addLandmark({id:'greyhome',k:'greywolf',x:POI.frost.x+200,y:POI.frost.y+60,noNudge:true,prompt:'Pet Greymane',hidden:()=>G.choices.greymane!=='home'});
  const snow=[[2000,4800],[2900,4000],[3650,4300],[1300,3950],[2600,3620]];
  snow.forEach(([x,y],i)=>addLandmark({id:'snowman'+i,k:'snowman',x,y,r:16,prompt:'Look at the snowman',meltable:true}));
  const hives=[[5400,9300],[6900,8900],[4100,8400]];
  hives.forEach(([x,y],i)=>addLandmark({id:'hive'+i,k:'beehive',x,y,r:14,prompt:'Look at the beehive',smokeable:true}));
  const berries=[[3700,5500],[3000,5600],[3850,4950],[2800,4900],[3550,5800],[2650,5250]];
  berries.forEach(([x,y],i)=>addLandmark({id:'berry'+i,k:'frostberry',x,y,r:14,prompt:'Pick frostberries'}));
  const signs=[[2780,8950,'↑ The War Camp & Whisperwood  ·  → Brindlecross  ·  ↖ Frostpine Highlands'],[7050,7150,'↑ The Obsidian Gate (please don’t)  ·  ↗ The Ashen Road  ·  ↘ The Mirefen  ·  ← Emberhollow'],[9050,5650,'← The Smoky Kettle  ·  → The Drakeling Crags  ·  ↑ Mountain of Certain Doom (not a metaphor)'],[12250,4700,'↓ Coppergulch Mining Camp. Mind the lizards.'],[2300,4500,'↖ Frostpine Lodge  ·  ↓ Hollis Farm (goats)  ·  Sheep are better. (signed, U.)'],[10900,9100,'→ Granny Moss. Follow the smell of tea.']];
  signs.forEach(([x,y,t],i)=>addLandmark({id:'sign'+i,k:'sign',x,y,r:8,text:t,prompt:'Read the sign'}));
  // ruins with breakable pots
  const ruins=[[8700,4700],[11000,4000],[12300,8600],[2900,6600],[6300,3900],[5000,8200]];
  ruins.forEach(([x0,y0],ri)=>{ const [x,y]=nudge(x0,y0,120); for(let i=0;i<6;i++){ const a=i/6*TAU+ri, cx=x+Math.cos(a)*90, cy=y+Math.sin(a)*70; STRUCTS.push({k:'column',x:cx,y:cy,broken:(i+ri)%3!==0,s:0.8+((i*7)%5)/10}); addCol({t:'c',x:cx,y:cy,r:18}); }
    for(let i=0;i<3;i++) LANDMARKS.push({id:`rpot${ri}_${i}`,k:'pot',x:x+rand(-40,40),y:y+rand(-30,30),breakable:true}); });
  // pots in camps
  CAMPS.forEach((c,ci)=>{ for(let i=0;i<2;i++) LANDMARKS.push({id:`cpot${ci}_${i}`,k:i?'barrel':'pot',x:c.x+Math.cos(ci+i*2)*80,y:c.y+Math.sin(ci+i*2)*80,breakable:true}); });
  // fishing spots on the lake shore and the rivers
  const fishTries=[[6620+170,7400],[5400,7000],[6250,6620],[6050,7830],[5500,7600],[7500,8350],[4700,5500],[10000,4950],[9600,9280]];
  for(const [fx,fy] of fishTries){ let best=null,bd=1e9; for(let a=0;a<TAU;a+=0.2) for(let d=0;d<260;d+=20){ const x=fx+Math.cos(a)*d, y=fy+Math.sin(a)*d; if(blockedAt(x,y)) continue; let nearW=false; for(let b=0;b<TAU;b+=0.6) if(T(x+Math.cos(b)*40,y+Math.sin(b)*40,{}).water) nearW=true; if(nearW&&d<bd){ bd=d; best=[x,y]; } } if(best) LANDMARKS.push({id:'fish'+LANDMARKS.length,k:'fishspot',x:best[0],y:best[1],prompt:'Fish here'}); }
  // treasure X marks (revealed by maps)
  [['x1',5200,6400],['x2',10300,7400],['x3',1800,6000]].forEach(([id,x,y])=>addLandmark({id,k:'xmark',x,y,prompt:'Dig here',hidden:()=>!G.items['map_'+id]||G.found[id]}));
  // glowing mushrooms in the Mirefen
  for(let i=0;i<14;i++){ const a=i*2.4, r=600+((i*137)%900), x=POI.mire.x+Math.cos(a)*r, y=POI.mire.y+Math.sin(a)*r*0.8; if(blockedAt(x,y)) continue; STRUCTS.push({k:'glowshroom',x,y,s:0.8+(i%3)*0.25}); LIGHTS.push({x,y,r:120,i:0.5,shroom:true,night:true}); }
}
// ---------- homes: who lives where
function assignHomes(){
  const used=new Set(), rng=mulberry32(777);
  let gi=0;
  for(const town of ['village','brindle','copper','lodge','way','farm']){
    const P=town==='farm'?POI.farm:POI[town];
    const hs=HOUSES.filter(h=>h.town===town&&h.k==='house').sort((a,b)=>dist2(a.x,a.y,P.x,P.y)-dist2(b.x,b.y,P.x,P.y));
    const owners=[];
    if(town==='village'){ const start={x:P.x+60,y:P.y+150}; hs.sort((a,b)=>dist2(a.x,a.y,start.x,start.y)-dist2(b.x,b.y,start.x,start.y)); owners.push({id:'ash',house:'Home',style:'ash'}); owners.push({id:'yara',house:'Elder Yara’s House',style:'yara'}); }
    for(const c of CAST) if(c.town===town&&c.home) owners.push({id:c.id,house:c.house,style:STYLE_OF[c.job]||'home'});
    if(town==='farm') owners.push({id:'hollis',house:'Hollis Farmhouse',style:'farmer'});
    hs.forEach((h,i)=>{
      const o=owners[i];
      const door=doorOf(h);
      let def;
      if(o){ def=defHouse('h_'+o.id,{name:o.house,owner:o.id,style:o.style,seed:1000+i+town.length*31,painting:i,egg:i+3,w:o.style==='inn'||o.style==='lodge'?680:o.style==='ash'?600:560,h:o.style==='inn'?460:400,town}); if(INDOOR[o.id]) CASTBY[o.id].inside=def.id; h.owner=o.id; }
      else{
        const first=FIRST[(gi*7+3)%FIRST.length], last=LAST[(gi*5+1)%LAST.length], nm=`${first} ${last}`;
        const ties=TIE_NAMES[town]||TIE_NAMES.village, tie=ties[gi%ties.length];
        const nid='n'+gi;
        CAST.push({id:nid,name:nm,town,generic:true,col:pick2({x:gi,y:3},['#d8c3a0','#cfd6e0','#e0c0a0','#c0d8b0','#e0b0c0']),look:{shirt:pick2({x:gi,y:1},['#6a4a8a','#3a6a8a','#8a5a3a','#5a7a3a','#7a3a3a','#3a5a5a']),hair:pick2({x:gi,y:2},['#2a1a10','#6a4a2a','#b8a070','#1a1a1a','#8a3a1a','#e8e4dc']),hat:gi%5===0?'straw':gi%7===0?'cap':null,beard:gi%4===1,glasses:gi%6===2},
          lines:[NEIGHBOR_LINES[gi%NEIGHBOR_LINES.length](tie),NEIGHBOR_ODD[gi%NEIGHBOR_ODD.length]]});
        CASTBY[nid]=CAST[CAST.length-1];
        def=defHouse('h_'+nid,{name:`${first}’s House`,owner:nid,style:'home',seed:2000+gi,egg:gi,painting:gi+2,note:`${nm}’s diary: "${NEIGHBOR_ODD[(gi+3)%NEIGHBOR_ODD.length]}"`,w:520,h:380,town});
        h.owner=nid; gi++;
      }
      h.area=def.id; h.door=door;
      DOORS.push({x:door.x,y:door.y,area:def.id,label:`Enter ${def.name}`,outY:door.outY||0,hs:h,owner:def.owner});
    });
  }
  // the library, the hut
  const lib=STRUCTS.find(s=>s.k==='library'); if(lib){ defHouse('h_library',{name:'The Brindlecross Library',style:'library',w:720,h:460,seed:5,painting:7}); CASTBY.wren.inside='h_library'; CASTBY.wren.ix=0.5; CASTBY.wren.iy=0.62; lib.area='h_library'; DOORS.push({x:lib.x,y:lib.y+lib.h/2+16,area:'h_library',label:'Enter the Library',outY:16}); }
  const hut=STRUCTS.find(s=>s.k==='hut'); if(hut){ defHouse('h_moss',{name:'Granny Moss’s Hut',style:'hut',w:480,h:360,seed:9,painting:6}); DOORS.push({x:hut.x,y:hut.y+hut.r+14,area:'h_moss',label:'Enter Granny Moss’s Hut',outY:18}); }
}
