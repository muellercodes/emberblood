// ================= Cinder Mountain (v9 Act I): the climb from the Obsidian Gate to Vorlaxis's crater
// Built with e3_elev. North of the gate the Cinderlands rise in five lava terraces to a summit crater around
// POI.summit: a flat floor about 1180 px across (level 7) inside a rim wall (level 8). The way up:
//   forecourt (0) -> grand stairs -> T1 (1) west -> stairs -> T2 (2) east past the Cinder Shrine -> a low step that
//   needs a Double Jump -> T3 (3) west -> a ladder -> T4 (4) east -> an updraft vent (Wings) -> T5 (6, the Crater
//   Shrine) -> a second vent -> the crater floor (7).
// Most of the mountain is a no-fly zone (the winds), so the Wings only help through the vents. Ledges are the quick
// way back down. Side secrets: a chest on a little mesa (Double Jump), star-iron on a pillar (a vent), the lookout on
// the rim. Everything else in the Cinderlands (camps, the lava islands, Ember Deep, the lava river) stays low ground.
const CINDER={x:7000,y:950,bb:[5300,-200,8700,2880],opts:{dblOnPath:true},
  // tier outlines (before noise); each one sits inside the one below
  T1:[[5580,2705],[6400,2712],[7000,2700],[7600,2712],[8420,2705],[8480,2580],[8420,2250],[8220,1850],[8000,1300],[7960,900],[7900,500],[7810,200],[7660,0],[7560,-160],[6440,-160],[6340,0],[6190,200],[6100,500],[6050,900],[6040,1300],[5780,1850],[5600,2250],[5520,2580]],
  T2:[[5720,2455],[6400,2450],[7200,2446],[7900,2452],[8280,2455],[8340,2330],[8270,2060],[8100,1760],[7980,1300],[7930,900],[7870,500],[7780,200],[7630,0],[7530,-160],[6470,-160],[6370,0],[6220,200],[6130,500],[6080,900],[6070,1300],[5900,1760],[5730,2060],[5660,2330]],
  T3:[[5860,2218],[6500,2214],[7150,2216],[7200,2150],[7520,2150],[7570,2216],[8140,2220],[8200,2100],[8130,1860],[8000,1600],[7950,1300],[7900,900],[7840,500],[7750,200],[7600,0],[7500,-160],[6500,-160],[6400,0],[6250,200],[6160,500],[6110,900],[6100,1300],[6000,1600],[5870,1860],[5800,2100]],
  T4:[[6000,1995],[6800,1990],[7400,1992],[8000,1995],[8060,1900],[8000,1700],[7900,1500],[7920,1300],[7870,900],[7810,500],[7720,200],[7570,0],[7470,-160],[6530,-160],[6430,0],[6280,200],[6190,500],[6140,900],[6130,1300],[6100,1500],[6020,1700],[5940,1900]],
  T5:[[6200,1768],[6700,1762],[7300,1764],[7800,1768],[7880,1650],[7850,1300],[7840,900],[7780,500],[7690,200],[7540,0],[7440,-160],[6560,-160],[6460,0],[6310,200],[6220,500],[6170,900],[6160,1300],[6120,1650]],
  floor:[7000,935,590,565], rimR:[690,650],
  // lava on the terraces: pools {x,y,r} and streams {pts,w}
  pools:[[6600,2528,58],[7660,2296,46],[7450,1886,38],[6560,1620,40],[6020,2610,40],[8160,2600,44],[5880,2380,34],[8050,1960,30],[6420,2770,42]],
  streams:[{pts:[[6600,2560],[6575,2630],[6470,2705]],w:17}],
  // the path markings on each terrace (gravel trail), from ramp to ramp
  trails:[
    [[7000,2860],[7000,2690]],
    [[7000,2690],[6900,2620],[6500,2632],[6200,2610],[6000,2560],[6000,2470]],
    [[6000,2440],[6200,2380],[6700,2360],[7150,2330],[7350,2330],[7600,2370],[7940,2350],[7940,2300]],
    [[7940,2180],[7700,2120],[7150,2120],[6700,2110],[6300,2120],[6110,2080],[6110,2010]],
    [[6110,1980],[6400,1940],[7000,1930],[7500,1940],[7760,1900]],
    [[7760,1700],[7500,1690],[7200,1680],[7000,1640],[7000,1580]],
    [[7000,1480],[7000,1150]]
  ]
};
// The stock world build (initWorld) runs exactly as before, with the mountain switched off, so every random draw it
// makes (Embermere's chests) lands the same; the mountain's own changes go in right after it (cinderAfterWorld).
// the summit road no longer runs straight up the cliffs: it ends at the gate (the mountain has its own trail)
function cinderRoads(){
  const keep=[]; for(const s of ROAD_SEGS){ const n=Math.max(s.ay,s.by)<2950&&Math.min(s.ax,s.bx)>6600&&Math.max(s.ax,s.bx)<7400; if(n) continue; if(s.ax===7000&&s.ay===3100&&s.bx===7000&&s.by===2700){ keep.push(...mkSegs([[[7000,3100],[7000,2878]]],90)); continue; } keep.push(s); }
  ROAD_SEGS.length=0; ROAD_SEGS.push(...keep);
  for(let i=BRIDGES.length-1;i>=0;i--){ const b=BRIDGES[i]; if(b.kind==='stone'&&b.y<2880&&b.x>6400&&b.x<7600) BRIDGES.splice(i,1); }
}

// ---------- the look: warm basalt columns, a peach lip, near-black outlines
ELEV.style('cinder',{face:'#644a42',lit:'#87655a',dark:'#33221f',lip:'#f0c49c',out:'#140909',top:'#9a7a6a',topK:0.1,tex:'columns'});
// ---------- the terraces
(function cinderBuild(){
  const C=CINDER, P=ELEV.plateau, look={top:'#9a8478'};
  P({poly:C.T1,lvl:1,style:'cinder',noise:16,seed:41,id:'cm_t1',top:'#8a7266',topK:0.12});
  P({poly:C.T2,lvl:2,style:'cinder',noise:16,seed:42,id:'cm_t2',top:'#8a7266',topK:0.12});
  P({poly:C.T3,lvl:3,style:'cinder',noise:14,seed:43,id:'cm_t3',top:'#927a6c',topK:0.12});
  P({poly:C.T4,lvl:4,style:'cinder',noise:14,seed:44,id:'cm_t4',top:'#927a6c',topK:0.115});
  P({poly:C.T5,lvl:6,style:'cinder',noise:14,seed:45,id:'cm_t5',top:'#9a8274',topK:0.085});
  // the crater: the floor, then the rim wall in three arcs: the south mouth (the way in, by the last vent) and two side
  // gaps (east and west: drops out to T5, the way out of a fight); the north arc has stairs up to its perches
  const [fx,fy,frx,fry]=C.floor, [orx,ory]=C.rimR;
  P({disc:[fx,fy,frx+30,fry+28],lvl:7,style:'cinder',noise:10,seed:46,id:'cm_floor',top:'#6e5046',topK:0.06});
  const arc=(a0,a1,rIn,rOut)=>{ const o=[], st=Math.ceil((a1-a0)/0.06); for(let i=0;i<=st;i++){ const a=a0+(a1-a0)*i/st; o.push([fx+Math.cos(a)*rOut[0],fy+Math.sin(a)*rOut[1]]); } for(let i=st;i>=0;i--){ const a=a0+(a1-a0)*i/st; o.push([fx+Math.cos(a)*rIn[0],fy+Math.sin(a)*rIn[1]]); } return o; };
  const D=Math.PI/180;
  for(const [a0,a1,id] of [[101,171,'cm_rim_sw'],[189,351,'cm_rim'],[9,79,'cm_rim_se']]) P({poly:arc(a0*D,a1*D,[frx,fry],[orx,ory]),lvl:8,style:'cinder',noise:9,seed:47+a0,id,top:'#bea292',topK:0.075});
  ELEV.ledge({x0:7580,y0:860,x1:7700,y1:1010});   // the east gap: the crater floor -> T5
  ELEV.ledge({x0:6300,y0:860,x1:6420,y1:1010});   // the west gap
  // Double Jump steps: the main one from T2 up to T3 (east end), and the little mesa with the chest on T2's east landing
  if(C.opts.dblOnPath) P({rect:[7880,2170,8010,2296],lvl:3,style:'cinder',step:true,noise:5,seed:51,id:'cm_step'});
  else ELEV.ramp({x0:7900,y0:2205,x1:7990,y1:2262,dir:'n',kind:'stairs'});
  P({disc:[8240,2330,46,40],lvl:3,style:'cinder',step:true,noise:6,seed:52,id:'cm_mesa'});
  // the star-iron pillar on T4's west shoulder (a vent gets you up now; its handholds wait for climbing claws)
  P({disc:[6070,1792,44,38],lvl:6,style:'cinder',noise:6,seed:53,id:'cm_pillar',climb:true});
  // ---------- the way up
  ELEV.ramp({x0:6950,y0:2690,x1:7050,y1:2752,dir:'n',kind:'stairs'});          // forecourt -> T1, the grand stairs
  ELEV.ramp({x0:5965,y0:2440,x1:6040,y1:2500,dir:'n',kind:'stairs'});          // T1 -> T2
  ELEV.ramp({x0:6092,y0:1985,x1:6128,y1:2040,dir:'n',kind:'ladder'});          // T3 -> T4
  ELEV.ramp({x0:6676,y0:405,x1:6730,y1:470,dir:'n',kind:'stairs',foes:false}); // crater floor -> the rim (west perch), not for Vorlaxis
  ELEV.ramp({x0:7270,y0:405,x1:7324,y1:470,dir:'n',kind:'stairs',foes:false}); // crater floor -> the rim (east perch)
  // vents: T4 -> T5 (the last cliffs need Wings), T5 -> the crater, and the pillar
  ELEV.vent({x:7768,y:1906,r:72,lift:1});
  ELEV.vent({x:7000,y:1612,r:72,lift:1});
  ELEV.vent({x:6170,y:1926,r:54,lift:1});
  // ledges: the quick ways down
  ELEV.ledge({x0:6380,y0:1740,x1:6600,y1:1860});    // T5 -> T4
  ELEV.ledge({x0:7200,y0:1975,x1:7380,y1:2040});    // T4 -> T3
  ELEV.ledge({x0:6400,y0:2200,x1:6620,y1:2270});    // T3 -> T2
  ELEV.ledge({x0:7150,y0:2430,x1:7330,y1:2500});    // T2 -> T1
  ELEV.ledge({x0:7600,y0:2690,x1:7900,y1:2760});    // T1 -> the forecourt
  ELEV.ledge({x0:6030,y0:1810,x1:6110,y1:1850});    // the pillar -> T4
  ELEV.ledge({x0:7380,y0:1450,x1:7560,y1:1560});    // the rim (south-east) -> T5
  ELEV.ledge({x0:6440,y0:1450,x1:6620,y1:1560});    // the rim (south-west) -> T5
  ELEV.ledge({x0:6600,y0:400,x1:6670,y1:480});      // the rim -> the crater floor
  ELEV.ledge({x0:7330,y0:400,x1:7400,y1:480});
  // falls of lava down the faces (each one feeds a pool below)
  ELEV.fall({x:6600,y:2440,w:30,kind:'lava'});
  ELEV.fall({x:7660,y:2205,w:24,kind:'lava'});
  ELEV.fall({x:7450,y:1756,w:24,kind:'lava'});
  ELEV.fall({x:6560,y:1500,w:26,kind:'lava'});
  ELEV.fall({x:6470,y:2700,w:22,kind:'lava'});
  // the winds: no flying over the mountain, only in the updrafts
  ELEV.noFly({poly:C.T1.map(([x,y])=>[x+(x-7000)*0.04,y+(y>2600?50:0)]),why:S('The mountain winds are too strong to fly.','Too windy to fly here!')});
  // keep the forecourt clear of spikes and rocks (the trails clear their own way)
  ELEV.clear({disc:[7000,2790,170,90]});
})();
// ---------- lava on the mountain: only these pools and streams (the noise lakes and the river stop at its foot)
function cinderLava(x,y){
  const C=CINDER; let s=0;
  for(const [px,py,r] of C.pools){ const dx=x-px, dy=y-py, R=r*1.3+30; if(dx*dx+dy*dy>R*R) continue; const v=clamp((r+fbm(x*0.02+px,y*0.02,2)*r*0.25-Math.sqrt(dx*dx+dy*dy))/14+0.5,0,1); if(v>s) s=v; }
  for(const st of C.streams){ const d=elvPathD(st.pts,x,y); if(d<st.w+20){ const v=clamp((st.w+fbm(x*0.03,y*0.03,2)*6-d)/10+0.5,0,1); if(v>s) s=v; } }
  return s;
}
{ const base=lavaS; lavaS=function(x,y,rdd){
  const B=CINDER.bb; if(CINDER.off||x<B[0]||x>B[2]||y<B[1]||y>B[3]) return base(x,y,rdd);
  const g=elvGrid(x,y); if(!g) return base(x,y,rdd);
  const c=elvIdx(g,x,y); if(c<0) return base(x,y,rdd);
  if(g.L[c]>0||(g.F[c]&EF.FACE)) return cinderLava(x,y);
  // the forecourt between the gate and the stairs stays clear
  let s=base(x,y,rdd); if(y>2720&&x>6100&&x<7900) s*=clamp((Math.abs(x-7000)-260)/160,0,1);
  return Math.max(s,cinderLava(x,y));
}; }

// ---------- the trails (gravel and stepping stones from ramp to ramp), each painted at its terrace's level
CINDER.trails.forEach((t,i)=>ELEV.path({k:0,pts:t,w:36,lvl:[0,1,2,3,4,6,7][i]}));

// ---------- places: the Crater Shrine, camps on the terraces, the star-iron, signs, braziers, the chest, the lookout
{ const base=initWorld; initWorld=function(){
  CINDER.off=true; ELV.ign++;
  try{ base(); } finally{ CINDER.off=false; ELV.ign--; }
  cinderAfterWorld();
}; }
function cinderAfterWorld(){
  cinderRoads();
  // camp 29 moves a little west, off the mountain's flank, so its fight stays on the low ground (its fire goes with it)
  const c29=CAMPS.find(c=>c.id==='c29');
  if(c29){ const ox=c29.x, oy=c29.y; c29.x=5860; c29.y=1320; for(const s of STRUCTS) if(s.k==='campfire'&&s.x===ox&&s.y===oy){ s.x=c29.x; s.y=c29.y; } for(const L of LIGHTS) if(L.fire&&L.x===ox&&L.y===oy){ L.x=c29.x; L.y=c29.y; } for(const o of LANDMARKS) if(o.id&&o.id.startsWith('cpot_c29_')){ o.x+=c29.x-ox; o.y+=c29.y-oy; } }
  // the Crater Shrine, camps on the terraces, the star-iron on the pillar (the same structs, colliders and lights the stock ones get)
  for(const s of [{id:'a1_s_crater',x:7330,y:1676,name:'Crater Shrine'}]){ SHRINES.push(s); STRUCTS.push({k:'shrine',x:s.x,y:s.y,ref:s}); addCol({t:'c',x:s.x,y:s.y,r:16}); LIGHTS.push({x:s.x,y:s.y,r:150,i:0.6,shrine:s}); }
  for(const c of [{id:'a1_cm1',x:6620,y:2640,units:[['knight',1],['drakeling',2]]},{id:'a1_cm2',x:6720,y:2360,units:[['knight',2],['cultist',1]]},{id:'a1_cm3',x:7140,y:1924,units:[['cultist',2],['drakeling',2]]}]){ CAMPS.push(c); STRUCTS.push({k:'campfire',x:c.x,y:c.y,small:true}); LIGHTS.push({x:c.x,y:c.y,r:200,i:0.8,fire:true}); }
  for(const o of [{id:'a1_o_pillar',x:6070,y:1786}]){ ORES.push(o); STRUCTS.push({k:'ore',ref:o,x:o.x,y:o.y}); addCol({t:'c',x:o.x,y:o.y,r:16,low:true}); LIGHTS.push({x:o.x,y:o.y,r:120,i:0.5,ore:o}); }
  for(const [x,y] of [[6905,2790],[7095,2790],[6935,2655],[7065,2655],[7700,1650],[7120,1500],[6880,1500]]){ STRUCTS.push({k:'brazier',x,y}); addCol({t:'c',x,y,r:14}); LIGHTS.push({x,y,r:210,i:0.85,fire:true}); }
  cinderPlaces();
  // anything the stock build dropped on a cliff or into the mountain's lava hops to the nearest good spot on its terrace
  const bad=(x,y)=>(elevFace(x,y)&EF.FACE)||lavaAt(x,y,999);
  const move=o=>{ for(let d=24;d<420;d+=24) for(let a=0;a<TAU;a+=0.45){ const x=o.x+Math.cos(a)*d, y=o.y+Math.sin(a)*d; if(!bad(x,y)&&!blockedAt(x,y)&&!inClearing(x,y,30)){ o.x=x; o.y=y; return true; } } return false; };
  const inB=o=>o.x>CINDER.bb[0]&&o.x<CINDER.bb[2]&&o.y>CINDER.bb[1]&&o.y<CINDER.bb[3];
  for(const c of CHESTS) if(inB(c)&&bad(c.x,c.y)) move(c);
  for(const o of LANDMARKS) if(inB(o)&&!o.noNudge&&!o.id?.startsWith?.('a1_')&&bad(o.x,o.y)){ const ox=o.x, oy=o.y; if(move(o)&&o.colRef){ removeCol(o.colRef); o.colRef=addCol({t:'c',x:o.x,y:o.y,r:o.r}); } }
  mapListsReset(); BIGOAKS=null; OCCS=null;
}
function cinderPlaces(){
  const sign=(id,x,y,full,simple)=>addLandmark({id,k:'sign',x,y,r:8,text:S(full,simple),prompt:'Read the sign',noNudge:true});
  sign('a1_cm_sign0',7130,2830,'Cinder Mountain. The Throne of Cinders is at the very top. Stairs and ramps go up; the edges you can hop down are the quick way back.','Cinder Mountain. Climb to the top!');
  sign('a1_cm_sign1',7830,2330,'The winds are too strong for wings here. Hot air vents carry you up, so look for the glowing cracks. Also: the low ledge to the north wants a Double Jump.','No flying here. Look for vents. Double Jump the low ledge!');
  sign('a1_cm_sign2',7640,1940,'Step into the vent, jump and spread your wings. Ride the hot air up!','Jump in the vent and fly up!');
  if(typeof reachChest==='function') reachChest('a1_cm_chest',8240,2318,{coins:70,xp:240,title:S('The mesa chest','Mesa chest'),sub:S('70 coins, and a fine view of the stairs','70 coins!'),say:[S(`A little flat-topped rock with a chest on it. Only a double jump gets up here.`,`A rock with a chest on top. Two jumps got you here!`),S(`Inside: 70 coins and a note. "If you can read this, you can jump twice. Show-off." Ha.`,`70 coins and a note: "Show-off!" Ha.`)]});
  addLandmark({id:'a1_cm_view',k:'reach',x:7240,y:330,noNudge:true,prompt:S('Look out','Look'),always:false,hidden:()=>false,draw:cinderViewDraw,act:cinderView});
}
function cinderViewDraw(o,t){
  ctx.save(); ctx.translate(o.x,o.y);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(2,4,16,7,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#2a1a10'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-8,4); ctx.lineTo(0,-12); ctx.lineTo(8,4); ctx.moveTo(0,-12); ctx.lineTo(0,4); ctx.stroke();
  ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-8,4); ctx.lineTo(0,-12); ctx.lineTo(8,4); ctx.moveTo(0,-12); ctx.lineTo(0,4); ctx.stroke();
  ctx.save(); ctx.translate(0,-16); ctx.rotate(-0.35); ctx.fillStyle='#2a1a10'; rrect(ctx,-12,-4.5,24,9,4); ctx.fill(); ctx.fillStyle='#c8a050'; rrect(ctx,-10.5,-3,21,6,3); ctx.fill(); ctx.fillStyle='#6ac0ff'; ctx.beginPath(); ctx.arc(11,0,2.6,0,TAU); ctx.fill(); ctx.restore();
  if(!G.found.a1_cm_view){ const a=0.5+0.5*Math.sin(t*3); ctx.fillStyle=`rgba(255,230,150,${0.35+0.4*a})`; ctx.beginPath(); ctx.arc(0,-30,3+a*2,0,TAU); ctx.fill(); }
  ctx.restore();
}
function cinderView(o){
  const first=!G.found.a1_cm_view; G.found.a1_cm_view=true;
  // the whole valley spread out below: reveal the map
  for(const [x,y,r] of [[2600,9300,1500],[7300,7500,1500],[6000,7200,1200],[11800,9200,1400],[12200,4300,1400],[2400,4200,1400],[9200,5300,1300],[4600,6000,1300],[10000,2500,1100],[3500,2000,1100]]) fogReveal(x,y,r);
  runDialogue([['narr',S('From the rim of the crater you can see all of Embermere: the smoke of Emberhollow, the bright eye of Lake Mirrow, the fog over the Mirefen.','You can see all of Embermere from here!')],['ash',first?S('Whoa. Everything looks so small. Even Grandpa\'s ego. Okay, not that.','Whoa. Everything looks tiny!'):S('Still the best view in the world.','Best view ever.')]],()=>{ scene='play'; setBanner(S('The view from the top','What a view!'),S('Your map fills in.','Your map fills in.'),2.6); if(first){ gainXp(150); saveGame(); } });
}
// ---------- the region banner: "Cinder Mountain" on its terraces (the crater keeps its own name)
{ const base=regionAt; regionAt=function(x,y){
  if(x<IZX-50&&y<2880&&x>CINDER.bb[0]&&x<CINDER.bb[2]&&!(dist2(x,y,POI.summit.x,POI.summit.y)<(POI.summit.r+120)**2)){
    const lv=elevLvl(x,y); if(lv>0||(y>2720&&Math.abs(x-7000)<700)) return {name:S('Cinder Mountain','Cinder Mountain'),level:9,key:'a1_cinder'};
  }
  return base(x,y);
}; }
// ---------- a kid-sized welcome the first time Ash sets foot on the mountain
{ const base=simUpdate; simUpdate=function(dt){
  base(dt);
  if(!G||G.mode!=='story'||AREA||!player||scene!=='play') return;
  const p=player; if(p.y>2880||p.x<CINDER.bb[0]||p.x>CINDER.bb[2]||p.y<0) return;
  if(!G.flags.a1_cm_hi&&elevLvl(p.x,p.y)>=1){ G.flags.a1_cm_hi=true; try{ mvTip(S('Cinder Mountain','Cinder Mountain'),S('Climb the terraces: stairs and ramps go up, and you can hop down the edges with a bright lip. The winds stop your wings, except in the hot air vents.','Climb up! Hop down bright edges. Vents let you fly.'),9,'a1_cm'); }catch(e){} }
};}
// ---------- Vorlaxis lands on the crater floor, not on the terraces outside the rim
{ const base=AI.vorlaxis; AI.vorlaxis=function(e,dt){
  base(e,dt);
  if(e.state==='landW'&&!e._cmFix){
    e._cmFix=true; const hx=e.homeX||POI.summit.x, hy=e.homeY||POI.summit.y, want=elevLvl(hx,hy);
    if(elevLvl(e.landX,e.landY)!==want||(elevFace(e.landX,e.landY)&EF.FACE)){
      const ox=e.landX, oy=e.landY; let x=ox, y=oy;
      for(let k=0;k<40&&(elevLvl(x,y)!==want||(elevFace(x,y)&EF.FACE)||dist(x,y,hx,hy)>480);k++){ x=lerp(x,hx,0.12); y=lerp(y,hy,0.12); }
      e.landX=x; e.landY=y;
      for(const h of G.hazards) if(h.kind==='blast'&&Math.abs(h.x-ox)<1&&Math.abs(h.y-oy)<1){ h.x=x; h.y=y; }
    }
  }else if(e.state!=='landW') e._cmFix=false;
}; }
// ---------- debug: Ash at the foot of the climb with jump, double jump and wings, the gate open
window.__ebX=Object.assign(window.__ebX||{},{
  CINDER,
  cinderStart(where){
    if(!G) return false;
    G.abil=G.abil||{}; G.abil.jump=true; G.abil.wings=true; G.abil.dbljump=true; G.skills=G.skills||{}; G.skills.dbljump=1;
    G.flags.gate=true; if(GATE_COL) GATE_COL.off=true;
    const spots={foot:[7000,2840],t1:[6950,2640],t2:[6100,2400],shrine:[7390,2350],step:[7940,2340],t3:[7900,2120],t4:[6110,1960],vent:[7768,1906],t5:[7600,1700],top:[7000,1600],crater:[7000,1300]};
    const s=spots[where||'foot']||spots.foot; if(AREA) exitArea(); player.x=s[0]; player.y=s[1]; moveReset(player); updateCam(0,true); G.chunkBurst=16; player.flyE=flyMax(); player.hp=player.maxHp;
    return {x:player.x,y:player.y,lvl:elevLvl(player.x,player.y)};
  },
  cinderLava,
  // reveal the map over the mountain (screenshots)
  cinderReveal(){ for(let y=0;y<=2900;y+=400) for(let x=5200;x<=8800;x+=400) fogReveal(x,y,420); return true; }
});
