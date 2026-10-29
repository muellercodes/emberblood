
// ================= e12b_ground: the Realistic look's ground, water and lava (v12 wave 10, GROUND)
// Every map's ground in the Realistic look (LOOK.re) is built here. A chunk (512 world px) is made in four stages, all
// inside one generator (reChunkG) that yields between small steps, so the chunk planner in a4_ground.js spreads it over
// frames like every other chunk:
//  1. samples: the 65x65 terrain samples (T) of the chunk become colour and shape channels: the land colour from the
//     biome's natural palette (REB below), the water colour by depth, the road colour, the signed distance to water,
//     the road distance, lava, bog, and the material of each biome (grass, forest floor, sand, snow, rock, ash ...).
//  2. the field: a 256x256 image (2 world px a pixel) worked out pixel by pixel from those channels: each material's
//     small tiling texture (built once, REX), large soft colour patches, ragged noisy edges where biomes, roads, shores
//     and bogs meet, ruts along the roads, a dark wet band at every waterline, water from light turquoise over sand
//     to deep blue-green, lava as dark crust over bright cracks. It is scaled up into the chunk canvas in one draw.
//  3. decals: small cached sprites drawn crisp at full resolution (grass tufts and clumps, flowers in clusters,
//     pebbles, leaves and twigs, shells, reeds, cinders, snow sparkle), all low contrast so nothing competes with Ash.
//  4. lines: thin broken foam lines along the shores (marching squares over the samples), then the decals and bridges
//     of the world (drawDecal, drawBridge) and, through genChunk, the cliffs and edges other modules paint.
// The moving water is per frame and cheap (reWater): caustics in the shallows from one shared set of 16 pre-built
// frames, clipped by a small per-chunk mask built with the chunk, soft lapping foam along the foam lines, and glints.
// Nothing here bakes the time of day; the art light is the fixed upper left one (highlights top left, AO under things).
// Storybook and Classic never reach this code: every entry point checks LOOK.re.

// ---------- materials
const RM={GRASS:0,FOREST:1,DRY:2,ROCK:3,ASH:4,SNOW:5,MARSH:6,SAND:7,YARD:8,ICE:9,DUSK:10,GLASS:11,CLOUD:12};
const RM_N=13;
// per material: patch tints (toward pt where the big soft noise is high, nt where it is low, amount pa), how much the
// waterline darkens it (wet), and which decals it gets
const RMAT=[
  {pa:0.17,pt:[132,130,68],nt:[42,66,28],wet:0.32},     // grass: drier yellow patches, lush dark ones
  {pa:0.2,pt:[92,84,48],nt:[28,40,22],wet:0.3},         // forest floor: leaf litter brown, mossy dark
  {pa:0.18,pt:[160,146,110],nt:[78,72,60],wet:0.3},     // dry ground
  {pa:0.18,pt:[184,140,104],nt:[92,62,46],wet:0.28},    // rock
  {pa:0.16,pt:[92,84,80],nt:[22,18,18],wet:0.2},        // ash
  {pa:0.2,pt:[250,252,255],nt:[170,188,218],wet:0.2},   // snow: blue shadows
  {pa:0.2,pt:[130,128,70],nt:[36,48,30],wet:0.25},      // marsh
  {pa:0.14,pt:[236,222,180],nt:[180,160,116],wet:0.42}, // sand: a strong dark wet band
  {pa:0.12,pt:[190,180,156],nt:[110,100,84],wet:0.3},   // yard (packed earth in towns)
  {pa:0.16,pt:[220,236,244],nt:[120,156,184],wet:0.15}, // ice
  {pa:0.14,pt:[110,100,140],nt:[30,24,40],wet:0.2},     // dusk stone
  {pa:0.12,pt:[220,214,236],nt:[110,100,140],wet:0.15}, // glass
  {pa:0.12,pt:[255,255,255],nt:[190,184,214],wet:0.1}   // cloud
];
// ---------- the natural palette of every biome: [material, base, light, dark, road, shore, water shallow?, deep?, cold?]
// Embermere 0..6; maps 1..4 use ids k*10.. (x1_world.js to x4_world.js); a biome missing here is derived from its own
// colours (desaturated, its material guessed from them)
const REB_DEF={
  0:['g','#617d39','#788944','#465f29','#977c58','#b8a880'],
  1:['f','#4a5e36','#5e663a','#33452a','#7e6648','#9a8c68'],
  2:['d','#7a7466','#968e7a','#5a564c','#8c8274','#a49a86'],
  3:['r','#94684b','#ac8460','#6c4a36','#aa8462','#b8987a'],
  4:['a','#3a3230','#4c4340','#241e1c','#4c4442','#4a4240'],
  5:['s','#dfe5ec','#f1f4f8','#b6c4d4','#b2a89e','#cfd6dc','#78a2b4','#2c5872',1],
  6:['m','#566238','#6a7040','#3c4a2a','#6e5c42','#7c7452','#4e7466','#1e3c3e'],
  10:['g','#7b9a4a','#90a65a','#62803c','#d4cab2','#d6caa4'],
  11:['g','#84a058','#98ac66','#6a8646','#d2c8b0','#d8ccac'],
  12:['y','#a8987a','#b8a888','#8c7e64','#857a6c','#c4b694'],
  13:['y','#76684f','#86785c','#5e523e','#978a72','#968a6c'],
  14:['m','#8a9a62','#9caa70','#707e4c','#c8b88e','#c6ba94'],
  15:['n','#d0c39a','#dacda8','#baac84','#e0d4b4','#d6caa2'],
  16:['g','#7e9c4e','#92aa5c','#66823f','#cfc09c','#d6caa8'],
  17:['g','#5c7248','#6c7e54','#485c3a','#a8a28c','#b2ac96'],
  18:['f','#5c685a','#6a7664','#485446','#a6a4a4','#a8a89e'],
  19:['k','#4c4a5e','#58566c','#3e3c50','#6c6880','#565068'],
  20:['s','#e4dfe3','#f2eff1','#c8c0cc','#c2b4a2','#d0d4da',null,null,1],
  21:['s','#e3e1d9','#f1f0eb','#c6c4bc','#bea888','#d6d8d8',null,null,1],
  22:['i','#b6d2e0','#cee4ee','#92b4c8','#c4cad4','#d8e6ee',null,null,1],
  23:['d','#b2aa8c','#c2ba9e','#968e72','#d2c8b0','#d6d0bc',null,null,1],
  24:['s','#dbe3e9','#edf1f5','#bccad6','#b8b0a8','#c8d0d8',null,null,1],
  25:['r','#a4765c','#b68a6e','#86583f','#cfbba0','#ceb29c',null,null,1],
  26:['i','#d0dce4','#e4ecf0','#b0c2ce','#c0bcb6','#c4ccd2',null,null,1],
  27:['k','#4e465e','#5a5068','#3c3448','#7a7090','#625a74',null,null,1],
  28:['s','#cfd7d5','#e1e7e5','#b0bcb8','#b6a488','#ccd4d2',null,null,1],
  29:['c','#dedbe9','#eeecf4','#c4c0d6','#e4dac6','#e2def0',null,null,1],
  30:['n','#dac998','#e6d6aa','#c2ae80','#c6a87c','#eadcb4'],
  31:['n','#d6c490','#e2d2a2','#bea978','#c8b086','#e8dab6'],
  32:['n','#c2bca2','#cec8ae','#a8a286','#bab296','#d6d0b8'],
  33:['m','#627c48','#728a56','#4c6438','#a09468','#a29a74'],
  34:['n','#dac084','#e4cc96','#c2a86e','#e2d0a6','#e6d6ae'],
  35:['n','#d4ac66','#e0ba76','#ba9252','#e2cc9e','#e0caa0'],
  36:['l','#a8a0b8','#b8b0c6','#8c84a0','#cfc8dc','#c4bcd2'],
  37:['g','#92a85c','#a4b66a','#788e48','#dac89c','#d6cca2'],
  38:['l','#c6c8da','#d6d8e6','#acaec6','#d2c4a6','#dadeea'],
  39:['k','#837896','#9186a4','#6c6280','#bcb2cc','#a69cb8']
};
const RM_CH={g:RM.GRASS,f:RM.FOREST,d:RM.DRY,r:RM.ROCK,a:RM.ASH,s:RM.SNOW,m:RM.MARSH,n:RM.SAND,y:RM.YARD,i:RM.ICE,k:RM.DUSK,l:RM.GLASS,c:RM.CLOUD};
const REB=[];   // resolved entries by biome id
const reGrey=(c,k)=>{ const l=c[0]*0.3+c[1]*0.59+c[2]*0.11; return [c[0]+(l-c[0])*k,c[1]+(l-c[1])*k,c[2]+(l-c[2])*k]; };
const reMul=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
function reB(b){
  let E=REB[b]; if(E) return E;
  const D=REB_DEF[b], B=b>=10&&typeof BIOMES!=='undefined'?BIOMES[b]:null, H=c=>typeof c==='string'?hexRGB(c):c;
  if(D){ E={mat:RM_CH[D[0]],col:[H(D[1]),H(D[2]),H(D[3])],road:H(D[4]),shore:H(D[5]),cold:!!D[8]};
    if(D[6]){ E.wsh=H(D[6]); E.wdp=H(D[7]); } }
  else{
    // not in the table: the biome's own colours, a little greyer and darker, its material guessed from them
    const C=(BCOL[b]||[[110,130,80],[130,150,90],[90,110,64]]).map(c=>reMul(reGrey(c,0.25),0.92));
    const c=C[0], l=(c[0]+c[1]+c[2])/3, sat=Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2]);
    const mat=l>200&&sat<40?RM.SNOW:c[2]>c[1]&&c[2]>c[0]-10&&l<120?RM.DUSK:c[1]>c[0]&&c[1]>c[2]?RM.GRASS:l>160?RM.SAND:RM.DRY;
    E={mat,col:C,road:B&&B._road?reMul(reGrey(B._road,0.25),0.9):[120,100,76],shore:B&&B._shore?reGrey(B._shore,0.2):[170,154,112],cold:false};
  }
  if(!E.wsh){
    // water: the biome's own (maps 1 and up) toned down toward natural, else Embermere's temperate water
    if(B&&B._water){ E.wsh=reMul(reGrey(B._water[0],0.32),0.86); E.wdp=reMul(reGrey(B._water[1],0.28),0.82); }
    else if(E.cold){ E.wsh=[112,152,170]; E.wdp=[36,66,92]; }
    else{ E.wsh=[66,140,130]; E.wdp=[20,60,76]; }
  }
  if(E.cold){ E.wsh=reGrey(E.wsh,0.18); E.wdp=reGrey(E.wdp,0.12); }
  E.wdeep=mixRGB(reMul(E.wdp,0.8),[14,52,66],0.25);
  E.mud=E.mat===RM.MARSH?[60,56,36]:[78,66,48];
  REB[b]=E; return E;
}
// Embermere's snow biome and the cold maps get grey-blue water; Frostreach (map 2) counts as cold everywhere
const reCold=(b,y)=>reB(b).cold||mapAt(y)===2;

// ---------- noise and material textures (tiling 128x128, built once)
const REX={tex:null,pn:null,fn:null,lava:null,ok:false};
function reHash(i,j,s){ let h=Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(s,982451653)|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967295; }
// periodic value noise on a 128 torus, lattice step L (128 divisible by L), -1..1
function reVN(L,seed){
  const n=128, m=n/L, out=new Float32Array(n*n);
  for(let y=0;y<n;y++) for(let x=0;x<n;x++){
    const gx=x/L, gy=y/L, ix=Math.floor(gx), iy=Math.floor(gy), fx=gx-ix, fy=gy-iy, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
    const a=reHash(ix%m,iy%m,seed), b=reHash((ix+1)%m,iy%m,seed), c=reHash(ix%m,(iy+1)%m,seed), d=reHash((ix+1)%m,(iy+1)%m,seed);
    out[y*n+x]=(a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v)*2-1;
  }
  return out;
}
// a texture painted with canvas marks that wrap round the 128 tile, read back once as RGBA
function reTexPaint(seed,paint){
  const c=mkCanvas(128,128), g=c.getContext('2d'), rng=mulberry32(seed);
  const W=(f)=>{ for(const ox of [-128,0,128]) for(const oy of [-128,0,128]){ g.save(); g.translate(ox,oy); f(); g.restore(); } };
  paint(g,rng,W);
  return g.getImageData(0,0,128,128).data;
}
function reDots(g,rng,W,n,col,a0,a1,w,h){ for(let i=0;i<n;i++){ const x=rng()*128, y=rng()*128, a=a0+rng()*(a1-a0), ww=w||1, hh=h||1; g.fillStyle=`rgba(${col},${a.toFixed(3)})`; W(()=>g.fillRect(x|0,y|0,ww,hh)); } }
function reBlobs(g,rng,W,n,col,a,r0,r1,sx){ for(let i=0;i<n;i++){ const x=rng()*128, y=rng()*128, r=r0+rng()*(r1-r0); g.fillStyle=`rgba(${col},${a})`; W(()=>{ g.beginPath(); g.ellipse(x,y,r*(sx||1),r,rng()*0.0,0,TAU); g.fill(); }); } }
function reCracks(g,rng,W,n,col,lw,seg,len){ g.strokeStyle=col; g.lineWidth=lw; g.lineCap='round'; for(let i=0;i<n;i++){ let x=rng()*128, y=rng()*128, a=rng()*TAU; const P=[[x,y]]; for(let k=0;k<seg;k++){ a+=(rng()-0.5)*1.3; x+=Math.cos(a)*len*(0.5+rng()); y+=Math.sin(a)*len*(0.5+rng()); P.push([x,y]); } W(()=>{ g.beginPath(); P.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); }); } }
function reTexInit(){
  if(REX.ok) return; REX.ok=true;
  REX.pn=reVN(16,11); REX.pn2=reVN(32,23); REX.fn=reVN(2,37);
  const T=REX.tex=new Array(RM_N+2);
  T[RM.GRASS]=reTexPaint(101,(g,r,W)=>{ reBlobs(g,r,W,70,'34,54,18',0.12,2.5,6); reBlobs(g,r,W,40,'210,200,130',0.06,3,8); reBlobs(g,r,W,50,'40,64,22',0.1,1.5,3.5); reDots(g,r,W,1500,'30,48,14',0.16,0.32,1,2); reDots(g,r,W,900,'176,190,108',0.1,0.2,1,1); reDots(g,r,W,90,'226,220,166',0.14,0.24); });
  T[RM.FOREST]=reTexPaint(102,(g,r,W)=>{ reBlobs(g,r,W,60,'66,92,38',0.16,3,8); reBlobs(g,r,W,50,'20,26,12',0.16,2,5); for(let i=0;i<700;i++){ const x=r()*128, y=r()*128, c=['96,68,36','118,84,40','84,90,40','60,44,26','140,104,54'][Math.floor(r()*5)], a=r()*TAU; g.fillStyle=`rgba(${c},${(0.28+r()*0.22).toFixed(2)})`; W(()=>{ g.beginPath(); g.ellipse(x,y,1.6,0.8,a,0,TAU); g.fill(); }); } reDots(g,r,W,600,'18,22,10',0.25,0.4); });
  T[RM.DRY]=reTexPaint(103,(g,r,W)=>{ reBlobs(g,r,W,40,'150,134,96',0.1,3,8); reCracks(g,r,W,10,'rgba(44,38,32,.2)',0.8,4,4); reDots(g,r,W,1300,'176,160,110',0.18,0.34); reDots(g,r,W,1100,'46,42,34',0.2,0.34); reDots(g,r,W,160,'196,190,176',0.3,0.45,2,1); });
  T[RM.ROCK]=reTexPaint(104,(g,r,W)=>{ for(let i=0;i<14;i++){ const y=r()*128, a=0.1+r()*0.08; g.strokeStyle=`rgba(${r()<0.5?'214,176,136':'70,44,30'},${a.toFixed(2)})`; g.lineWidth=1+r()*1.5; W(()=>{ g.beginPath(); for(let x=-4;x<=132;x+=8) g.lineTo(x,y+Math.sin(x*0.09+i)*3); g.stroke(); }); } reCracks(g,r,W,16,'rgba(40,24,18,.34)',0.9,5,4); reDots(g,r,W,220,'176,178,96',0.22,0.36,1,1); reDots(g,r,W,900,'60,40,30',0.16,0.3); reDots(g,r,W,700,'206,176,146',0.14,0.26); });
  T[RM.ASH]=reTexPaint(105,(g,r,W)=>{ reBlobs(g,r,W,50,'86,78,74',0.1,3,8); reCracks(g,r,W,12,'rgba(8,6,6,.4)',0.9,4,4); reDots(g,r,W,1500,'10,8,8',0.24,0.42); reDots(g,r,W,900,'118,108,104',0.14,0.26); reDots(g,r,W,40,'255,110,40',0.12,0.22); });
  T[RM.SNOW]=reTexPaint(106,(g,r,W)=>{ reBlobs(g,r,W,46,'150,172,208',0.1,5,12,1.8); reBlobs(g,r,W,40,'255,255,255',0.16,3,9,1.6); reDots(g,r,W,500,'170,186,214',0.12,0.22); reDots(g,r,W,90,'255,255,255',0.5,0.8); });
  T[RM.MARSH]=reTexPaint(107,(g,r,W)=>{ reBlobs(g,r,W,60,'26,34,20',0.16,2,6); reBlobs(g,r,W,40,'150,146,80',0.1,3,7); reDots(g,r,W,1600,'64,74,34',0.24,0.4,1,2); reDots(g,r,W,900,'168,160,92',0.14,0.26); reDots(g,r,W,200,'22,30,26',0.3,0.45,2,1); });
  T[RM.SAND]=reTexPaint(108,(g,r,W)=>{ reBlobs(g,r,W,30,'240,226,186',0.12,4,10); reDots(g,r,W,1400,'250,240,212',0.18,0.32); reDots(g,r,W,1300,'136,116,80',0.14,0.26); reDots(g,r,W,60,'120,110,100',0.3,0.45,2,1); });
  T[RM.YARD]=reTexPaint(109,(g,r,W)=>{ reBlobs(g,r,W,40,'130,118,96',0.1,3,7); for(let i=0;i<70;i++){ const x=r()*128, y=r()*128, w=3+r()*5, h=2+r()*4; g.strokeStyle='rgba(70,60,46,.16)'; g.lineWidth=0.8; W(()=>{ g.beginPath(); g.ellipse(x,y,w,h,r()*3,0,TAU); g.stroke(); }); } reDots(g,r,W,1200,'60,52,40',0.18,0.3); reDots(g,r,W,900,'214,204,180',0.14,0.26); });
  T[RM.ICE]=reTexPaint(110,(g,r,W)=>{ for(let i=0;i<30;i++){ const x=r()*128, y=r()*128, a=-0.4+r()*0.3, L=10+r()*30; g.strokeStyle='rgba(255,255,255,.22)'; g.lineWidth=0.8+r(); W(()=>{ g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); g.stroke(); }); } reCracks(g,r,W,10,'rgba(80,120,150,.26)',0.8,4,5); reDots(g,r,W,200,'255,255,255',0.25,0.5); });
  T[RM.DUSK]=reTexPaint(111,(g,r,W)=>{ reBlobs(g,r,W,40,'24,18,34',0.16,3,7); reCracks(g,r,W,14,'rgba(18,12,28,.38)',0.9,4,4); reDots(g,r,W,1000,'20,14,30',0.2,0.34); reDots(g,r,W,400,'150,140,196',0.12,0.22); reDots(g,r,W,40,'210,200,255',0.3,0.5); });
  T[RM.GLASS]=reTexPaint(112,(g,r,W)=>{ for(let i=0;i<40;i++){ const x=r()*128, y=r()*128, a=r()*TAU, L=6+r()*18; g.strokeStyle=r()<0.5?'rgba(240,236,255,.24)':'rgba(60,50,90,.22)'; g.lineWidth=0.8; W(()=>{ g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); g.stroke(); }); } reDots(g,r,W,300,'250,248,255',0.2,0.4); });
  T[RM.CLOUD]=reTexPaint(113,(g,r,W)=>{ reBlobs(g,r,W,60,'255,255,255',0.14,4,12); reBlobs(g,r,W,40,'176,166,210',0.1,4,10); });
  // the road: packed earth with grit and small stones
  T[RM_N]=reTexPaint(114,(g,r,W)=>{ reBlobs(g,r,W,40,'80,64,46',0.1,2,6); reDots(g,r,W,1600,'58,46,34',0.2,0.36); reDots(g,r,W,700,'214,200,176',0.2,0.36); reDots(g,r,W,140,'150,140,128',0.35,0.5,2,1); });
  // mud (bogs)
  T[RM_N+1]=reTexPaint(115,(g,r,W)=>{ reBlobs(g,r,W,60,'20,22,14',0.18,2,6); reBlobs(g,r,W,30,'120,116,80',0.1,2,5); reDots(g,r,W,800,'24,26,16',0.25,0.4); });
  // lava cracks: the edges of a tiling cell pattern (1 on a crack, 0 inside a plate)
  const L=REX.lava=new Float32Array(128*128), P=[], rr=mulberry32(116);
  for(let i=0;i<64;i++) P.push([rr()*128,rr()*128]);
  for(let y=0;y<128;y++) for(let x=0;x<128;x++){
    let d1=1e9, d2=1e9;
    for(const p of P) for(const ox of [-128,0,128]) for(const oy of [-128,0,128]){ const dx=x-p[0]-ox, dy=y-p[1]-oy, d=dx*dx+dy*dy; if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; }
    const e=Math.sqrt(d2)-Math.sqrt(d1); L[y*128+x]=clamp(1-e/2.6,0,1)*(0.7+0.3*REX.fn[y*128+x]);
  }
}

// ---------- the colour of a sample: land, and water (also the minimap and the far placeholders)
const RE_O=[0,0,0];
function reBiomeCol(b,n,m,o){
  const C=reB(b).col, A=C[0], P=n>0?C[1]:C[2], k=Math.min(1,Math.abs(n)*0.9), Q=m>0?C[1]:C[2], q=Math.min(1,Math.abs(m)*0.45);
  let r=A[0]+(P[0]-A[0])*k, g=A[1]+(P[1]-A[1])*k, bl=A[2]+(P[2]-A[2])*k;
  o[0]=r+(Q[0]-r)*q; o[1]=g+(Q[1]-g)*q; o[2]=bl+(Q[2]-bl)*q; return o;
}
const RE_T=[0,0,0];
function reLandRGB(s,x,y,o){
  if(s.out){ o[0]=12; o[1]=14; o[2]=10; return o; }
  const m=fbm(x*0.0011+11,y*0.0011-7,2);
  reBiomeCol(s.b,s.n,m,o);
  if(s.b2!==s.b&&s.t<1){ reBiomeCol(s.b2,s.n,m,RE_T); const t=s.t; o[0]=RE_T[0]+(o[0]-RE_T[0])*t; o[1]=RE_T[1]+(o[1]-RE_T[1])*t; o[2]=RE_T[2]+(o[2]-RE_T[2])*t; }
  let c=o;
  if(s.sand>0){ const E=typeof BIOMES!=='undefined'&&BIOMES[s.b], sd=E&&E._sand?reGrey(E._sand,0.25):[206,188,142]; c=mixRGB(c,sd,clamp(s.sand,0,1)*0.85); }
  if(s.snow>0) c=mixRGB(c,[226,232,240],clamp(s.snow,0,1)*0.88);
  if(s.ice>0) c=mixRGB(c,mixRGB([168,198,214],[202,222,232],clamp(s.n+0.5,0,1)),clamp(s.ice,0,1)*0.85);
  if(s.shore>0) c=mixRGB(c,reB(s.b).shore,s.shore*0.78);
  if(s.b>=10){ const B=BIOMES[s.b]; if(B&&B.rgb){ let r=null; try{ r=B.rgb(c.slice?c.slice():[c[0],c[1],c[2]],s,x,y); }catch(e){ r=null; } if(r) c=reGrey(r,0.14); } }
  const ed=reEdge(x,y); if(ed<160){ const k=ed/160; c=[10+(c[0]-10)*k,12+(c[1]-12)*k,8+(c[2]-8)*k]; }
  o[0]=c[0]; o[1]=c[1]; o[2]=c[2]; return o;
}
function reEdge(x,y){ if(y<BAND) return Math.min(x,y,WORLD.w-x,WORLD.h-y); const M=MAPS[mapAt(y)]; return M?Math.min(x,y-M.y0,M.w-x,M.y0+M.h-y):1e9; }
// how far out into a lake or the sea (0 at the shelf, 1 far out): Embermere's lake by its centre, map lakes the same,
// the sea by seaD
function reDeep(s,x,y){
  if(!s.water) return 0;
  if(s.seaD>0) return s.seaD;
  if(y<BAND){ const d=dist(x,y,LAKE.x,LAKE.y); return d<LAKE.r+140?clamp((LAKE.r-80-d)/360,0,1):0; }
  const M=MAPS[mapAt(y)], Z=M&&M.tz; if(!Z) return 0;
  let k=0; for(const L of Z.lakes){ const d=dist(x,y,L.x,L.y); if(d<L.r) k=Math.max(k,clamp((L.r-60-d)/Math.max(120,L.r*0.6),0,1)); } return k;
}
function reWaterRGB(s,x,y,o){
  const E=reB(s.b), d=s.water?smooth(s.depth):0, dp=reDeep(s,x,y);
  let c=mixRGB(E.wsh,E.wdp,d); if(dp>0) c=mixRGB(c,E.wdeep,smooth(dp)*0.8);
  if(s.water&&s.b>=10){ const B=BIOMES[s.b]; if(B&&B.rgb){ let r=null; try{ r=B.rgb(c,s,x,y); }catch(e){ r=null; } if(r) c=reGrey(r,0.2); } }
  const ed=reEdge(x,y); if(ed<160){ const k=ed/160; c=[8+(c[0]-8)*k,10+(c[1]-10)*k,12+(c[2]-12)*k]; }
  o[0]=c[0]; o[1]=c[1]; o[2]=c[2]; return o;
}
// the one colour of a spot (the minimap, the map screen, a placeholder before a chunk is built)
function reGroundRGB(s,x,y){
  if(s.out) return [12,14,10];
  if(s.water) return reWaterRGB(s,x,y,[0,0,0]);
  let c=reLandRGB(s,x,y,[0,0,0]);
  if(s.bog>0) c=mixRGB(c,reB(s.b).mud,smooth(clamp(s.bog*1.4-0.15,0,1))*0.85);
  if(s.road>0) c=mixRGB(c,reB(s.b).road,s.road*0.9);
  if(s.lavaS>0) c=mixRGB(c,[200,74,24],smooth(clamp(s.lavaS*1.6-0.3,0,1)));
  return c;
}
// the material of a sample's biome, overlays first (snow, ice, sand laid over another biome)
function reMatOf(b,s){ if(s.snow>0.5) return RM.SNOW; if(s.ice>0.5) return RM.ICE; if(s.sand>0.5) return RM.SAND; if(s.void) return RM.CLOUD; return reB(b).mat; }

// ---------- decal sprites (built once, at 2.5 px a world px; anchor at the foot)
const RES_SPR={ok:false};
const RSC=2.5;
function reSpr(w,h,ax,ay,draw){ const c=mkCanvas(Math.ceil(w*RSC),Math.ceil(h*RSC)), g=c.getContext('2d'); g.scale(RSC,RSC); g.translate(ax,ay); draw(g); return {cv:c,w,h,ax,ay}; }
// tuft palettes: [dark, mid, light] blades
const RE_TUFT={meadow:['#3a5a20','#5a7a2e','#9aaa52'],lush:['#2c4a1a','#466a26','#7a9640'],forest:['#22361a','#365024','#5c7434'],dry:['#6e6440','#948454','#c2b27a'],
  marsh:['#3e4a22','#5c6430','#8c8a4c'],pale:['#8c8670','#aaa288','#d2cab0'],coast:['#5a7448','#76905a','#a6b67a'],dusk:['#3a3450','#544c6c','#7c7298']};
function reTuftSpr(pal,rng,big){
  const P=RE_TUFT[pal], n=big?9+Math.floor(rng()*5):4+Math.floor(rng()*4), H=big?11:7.5, w=big?16:11;
  return reSpr(w,H+3,w/2,H+1,g=>{
    g.fillStyle='rgba(20,26,10,.16)'; g.beginPath(); g.ellipse(0.6,0.4,w*0.34,1.6,0,0,TAU); g.fill();
    g.lineCap='round';
    const B=[]; for(let i=0;i<n;i++){ const a=-Math.PI/2+(rng()-0.5)*(big?1.5:1.25), L=H*(0.55+rng()*0.45), bx=(rng()-0.5)*(big?6:3.5); B.push([bx,a,L]); }
    B.sort((p,q)=>q[2]-p[2]);
    for(const [bx,a,L] of B){ const tx=bx+Math.cos(a)*L, ty=Math.sin(a)*L, cx=bx+Math.cos(a)*L*0.5+(rng()-0.5)*1.2, cy=ty*0.5;
      g.strokeStyle=P[0]; g.lineWidth=1.05; g.beginPath(); g.moveTo(bx,0.6); g.quadraticCurveTo(cx,cy,tx,ty); g.stroke();
      g.strokeStyle=rng()<0.5?P[1]:P[2]; g.lineWidth=0.7; g.beginPath(); g.moveTo(bx+(cx-bx)*0.6,cy*0.6); g.quadraticCurveTo(cx,cy,tx,ty); g.stroke(); }
  });
}
function reFlowerSpr(col,rng){
  return reSpr(6,7,3,4.5,g=>{
    g.strokeStyle='#4a6a28'; g.lineWidth=0.6; g.beginPath(); g.moveTo(0,2); g.lineTo(0.3,-0.4); g.stroke();
    g.fillStyle='rgba(20,30,10,.2)'; g.beginPath(); g.ellipse(0.5,1.6,1.8,0.8,0,0,TAU); g.fill();
    const r=0.9+rng()*0.5; g.fillStyle=col; for(let i=0;i<5;i++){ const a=i/5*TAU+rng(); g.beginPath(); g.arc(Math.cos(a)*r*0.8,-0.8+Math.sin(a)*r*0.7,r*0.62,0,TAU); g.fill(); }
    g.fillStyle='rgba(255,255,255,.28)'; g.beginPath(); g.arc(-r*0.4,-1.3,r*0.4,0,TAU); g.fill();
    g.fillStyle=col==='#f2efe2'||col==='#f4f0dc'?'#d8b83a':'#f2e2a0'; g.beginPath(); g.arc(0,-0.8,0.45,0,TAU); g.fill();
  });
}
function rePebbleSpr(base,rng,big){
  const r=(big?2.6:1.1)+rng()*(big?1.6:1.1), e=0.62+rng()*0.25, c=hexRGB(base), hi=`rgb(${mixRGB(c,[255,250,236],0.35).map(Math.round)})`, lo=`rgb(${mixRGB(c,[20,16,12],0.4).map(Math.round)})`;
  return reSpr(r*2.6+2,r*2.2+2,r*1.3+1,r*1.1+1,g=>{
    g.fillStyle='rgba(16,12,8,.28)'; g.beginPath(); g.ellipse(r*0.3,r*0.38,r*1.1,r*e*1.05,0,0,TAU); g.fill();
    g.fillStyle=lo; g.beginPath(); g.ellipse(0,0,r,r*e,0,0,TAU); g.fill();
    g.fillStyle=base; g.beginPath(); g.ellipse(-r*0.1,-r*0.12,r*0.86,r*e*0.82,0,0,TAU); g.fill();
    g.fillStyle=hi; g.globalAlpha=0.7; g.beginPath(); g.ellipse(-r*0.36,-r*0.32,r*0.42,r*e*0.34,-0.4,0,TAU); g.fill(); g.globalAlpha=1;
  });
}
function reLeafSpr(col,rng){
  const a=rng()*TAU, L=2.2+rng()*1.4;
  return reSpr(8,8,4,4,g=>{ g.rotate(a);
    g.fillStyle='rgba(16,12,6,.22)'; g.beginPath(); g.ellipse(0.5,0.6,L,L*0.5,0,0,TAU); g.fill();
    g.fillStyle=col; g.beginPath(); g.moveTo(-L,0); g.quadraticCurveTo(0,-L*0.62,L,0); g.quadraticCurveTo(0,L*0.62,-L,0); g.fill();
    g.strokeStyle='rgba(40,26,12,.45)'; g.lineWidth=0.35; g.beginPath(); g.moveTo(-L*0.9,0); g.lineTo(L*0.9,0); g.stroke(); });
}
function reTwigSpr(rng){ const a=rng()*TAU, L=5+rng()*5;
  return reSpr(14,14,7,7,g=>{ g.rotate(a); g.lineCap='round'; g.strokeStyle='rgba(16,10,6,.25)'; g.lineWidth=1.3; g.beginPath(); g.moveTo(-L/2+0.6,0.7); g.lineTo(L/2+0.6,0.7); g.stroke();
    g.strokeStyle='#5a4028'; g.lineWidth=0.9; g.beginPath(); g.moveTo(-L/2,0); g.lineTo(L/2,0); g.moveTo(L*0.1,0); g.lineTo(L*0.3,-2); g.stroke(); g.strokeStyle='#8a6a48'; g.lineWidth=0.35; g.beginPath(); g.moveTo(-L/2,-0.3); g.lineTo(L/2,-0.3); g.stroke(); }); }
function reSparkSpr(col,s){ return reSpr(5,5,2.5,2.5,g=>{ g.fillStyle=col; g.beginPath(); g.moveTo(0,-s); g.quadraticCurveTo(0,0,s*0.8,0); g.quadraticCurveTo(0,0,0,s); g.quadraticCurveTo(0,0,-s*0.8,0); g.quadraticCurveTo(0,0,0,-s); g.fill(); }); }
function reShellSpr(rng){ const a=rng()*TAU, c=['#efe2cc','#e8cfc0','#ddd2bc','#f2e6d2'][Math.floor(rng()*4)];
  return reSpr(6,6,3,3,g=>{ g.rotate(a); g.fillStyle='rgba(60,40,20,.22)'; g.beginPath(); g.ellipse(0.4,0.5,1.7,1.3,0,0,TAU); g.fill();
    g.fillStyle=c; g.beginPath(); g.moveTo(0,1.2); g.arc(0,0.2,1.6,Math.PI*1.05,Math.PI*1.95); g.closePath(); g.fill(); g.strokeStyle='rgba(120,90,60,.4)'; g.lineWidth=0.3; for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(0,1.1); g.lineTo(i*0.6,-1.1); g.stroke(); } }); }
function reReedSpr(rng){ const n=5+Math.floor(rng()*4);
  return reSpr(10,16,5,14,g=>{ g.fillStyle='rgba(16,20,10,.2)'; g.beginPath(); g.ellipse(0.5,0.4,3.2,1.2,0,0,TAU); g.fill(); g.lineCap='round';
    for(let i=0;i<n;i++){ const bx=(rng()-0.5)*4, a=-Math.PI/2+(rng()-0.5)*0.5, L=8+rng()*5; g.strokeStyle=i%2?'#5a6230':'#7a7a3e'; g.lineWidth=0.8; g.beginPath(); g.moveTo(bx,0); g.lineTo(bx+Math.cos(a)*L,Math.sin(a)*L); g.stroke(); if(rng()<0.35){ g.strokeStyle='#6a4a2a'; g.lineWidth=1.4; g.beginPath(); g.moveTo(bx+Math.cos(a)*L*0.8,Math.sin(a)*L*0.8); g.lineTo(bx+Math.cos(a)*L*0.95,Math.sin(a)*L*0.95); g.stroke(); } } }); }
function reMushSpr(rng){ const c=rng()<0.5?'#9a6a44':'#b8885a';
  return reSpr(6,6,3,4,g=>{ g.fillStyle='rgba(16,10,6,.25)'; g.beginPath(); g.ellipse(0.5,0.5,1.8,0.8,0,0,TAU); g.fill(); g.fillStyle='#d8ccb4'; g.fillRect(-0.4,-1.2,0.8,1.6); g.fillStyle=c; g.beginPath(); g.arc(0,-1.2,1.5,Math.PI,0); g.fill(); g.fillStyle='rgba(255,240,210,.35)'; g.beginPath(); g.arc(-0.5,-1.8,0.5,0,TAU); g.fill(); }); }
function reSprInit(){
  if(RES_SPR.ok) return; RES_SPR.ok=true;
  const rng=mulberry32(4242), S=RES_SPR;
  S.tuft={}; S.clump={};
  for(const k in RE_TUFT){ S.tuft[k]=[]; S.clump[k]=[]; for(let i=0;i<6;i++) S.tuft[k].push(reTuftSpr(k,rng,false)); for(let i=0;i<4;i++) S.clump[k].push(reTuftSpr(k,rng,true)); }
  S.flower={}; for(const c of ['#f2efe2','#e8d25a','#b898d8','#e494aa','#8eb0e0','#e8a050']){ S.flower[c]=[]; for(let i=0;i<3;i++) S.flower[c].push(reFlowerSpr(c,rng)); }
  S.peb={}; const PB={grey:['#8a8680','#9a948a','#7a766e'],brown:['#8a7458','#9a8264','#76624a'],dark:['#3a3230','#2e2826','#463c38'],pale:['#b4b2ac','#c2beb6','#a8a8a6'],red:['#a0684c','#b07a58','#8a5840'],violet:['#5a5070','#6a6080','#4a4260']};
  for(const k in PB){ S.peb[k]=[]; for(let i=0;i<6;i++) S.peb[k].push(rePebbleSpr(PB[k][i%3],rng,false)); S.peb[k+'B']=[]; for(let i=0;i<3;i++) S.peb[k+'B'].push(rePebbleSpr(PB[k][i%3],rng,true)); }
  S.leaf=[]; for(let i=0;i<10;i++) S.leaf.push(reLeafSpr(['#8a5a2a','#a8702e','#6a5226','#7a7a32','#b8862e','#5a4a24'][i%6],rng));
  S.twig=[]; for(let i=0;i<4;i++) S.twig.push(reTwigSpr(rng));
  S.spark=[reSparkSpr('rgba(255,255,255,.85)',1.2),reSparkSpr('rgba(255,255,255,.7)',0.9),reSparkSpr('rgba(230,240,255,.8)',1.5)];
  S.vspark=[reSparkSpr('rgba(210,200,255,.6)',1.1),reSparkSpr('rgba(230,226,255,.5)',0.8)];
  S.ember=[reSparkSpr('rgba(255,150,60,.55)',0.8),reSparkSpr('rgba(255,200,110,.45)',0.6)];
  S.shell=[]; for(let i=0;i<5;i++) S.shell.push(reShellSpr(rng));
  S.reed=[]; for(let i=0;i<4;i++) S.reed.push(reReedSpr(rng));
  S.mush=[]; for(let i=0;i<3;i++) S.mush.push(reMushSpr(rng));
}
const reDraw=(g,sp,x,y,k)=>{ if(k&&k!==1) g.drawImage(sp.cv,x-sp.ax*k,y-sp.ay*k,sp.w*k,sp.h*k); else g.drawImage(sp.cv,x-sp.ax,y-sp.ay,sp.w,sp.h); };
// which tuft palette and pebbles a material gets
const RE_TP=[ 'meadow','forest','dry','dry','dusk','pale','marsh','coast','dry','pale','dusk','pale','pale' ];
const RE_PB=[ 'grey','brown','grey','red','dark','pale','brown','pale','brown','pale','violet','violet','pale' ];
const RE_FLOWERS=['#f2efe2','#e8d25a','#b898d8','#e494aa','#8eb0e0','#e8a050'];

// ---------- the chunk
const RE={st:{n:0,ms:0,max:0,last:0},on:true};
// bilinear weights for the four spots a field pixel can take inside a sample cell (u,v in 1/8, 3/8, 5/8, 7/8)
const RE_WU=new Float32Array([1/8,3/8,5/8,7/8]), RE_MUD=[60,56,38];
// the generator only steps; the work is in plain functions (a hot loop runs much faster outside a generator)
function* reChunkG(cx,cy){
  reTexInit(); reSprInit();
  let ms=0, ts=performance.now();
  const C=reChunkCtx(cx,cy);
  // 1. samples, two rows a step
  for(let j=0;j<C.N;j++){ reSampleRow(C,j); if(j&1){ ms+=performance.now()-ts; yield; ts=performance.now(); } }
  reCellFlags(C);
  // 2. the field, 16 rows a step, then scaled into the chunk
  for(let fy=0;fy<256;fy+=16){ reFieldRows(C,fy,fy+16); ms+=performance.now()-ts; yield; ts=performance.now(); }
  const ch=reChunkCanvas(C);
  ms+=performance.now()-ts; yield; ts=performance.now();
  // 3. decals: planned, then drawn 256 at a time (low ones first, tall ones sorted by their foot)
  reDecalPlan(C);
  for(const L of [C.low,C.mid,C.top]) for(let n=0;n<L.length;n+=256){ reDrawList(C.g,L,n,Math.min(L.length,n+256)); ms+=performance.now()-ts; yield; ts=performance.now(); }
  // 4. thin broken foam lines along the shores, the caustics mask, then the world's decals and bridges
  reFoamLines(C,ch);
  C.g.lineWidth=1.1; C.g.lineCap='round'; C.g.globalAlpha=1; C.g.globalCompositeOperation='source-over';
  ms+=performance.now()-ts; yield; ts=performance.now();
  yield* chunkDecalsG(C.g,C.x0,C.y0);
  reChunkGlow(C,ch);
  ms+=performance.now()-ts;
  const St=RE.st; St.n++; St.ms+=ms; if(ms>St.max) St.max=ms; St.last=ms;
  return ch;
}
function reChunkCtx(cx,cy){
  const N=65, NN=N*N, k=chunkMapOf(cy), M=k>0?MAPS[k]:null;
  return {cx,cy,x0:cx*CH,y0:cy*CH,N,NN,step:CH/(N-1),sea:M&&M.tz&&M.tz.sea||null,
    LC:new Float32Array(NN*3),WC:new Float32Array(NN*3),RC:new Float32Array(NN*3),F:new Float32Array(NN),RD:new Float32Array(NN),RW:new Float32Array(NN),
    LV:new Float32Array(NN),BG:new Float32Array(NN),TT:new Float32Array(NN),MA:new Uint8Array(NN),MB:new Uint8Array(NN),OUT:new Uint8Array(NN),SH:new Float32Array(NN),
    GD:new Uint8ClampedArray(NN*4),CF:new Uint8Array(64*64),WM:new Uint8ClampedArray(128*128*4),D:new Uint8ClampedArray(256*256*4),
    hasLava:false,hasWater:false,hasShallow:false,g:null,low:null,mid:null,top:null};
}
function reSampleRow(C,j){
  const N=C.N, x0=C.x0, y=C.y0+j*C.step, sea=C.sea, s={};
  for(let i=0;i<N;i++){
    const x=x0+i*C.step, k=j*N+i, k3=k*3;
    T(x,y,s);
    reLandRGB(s,x,y,RE_O); C.LC[k3]=RE_O[0]; C.LC[k3+1]=RE_O[1]; C.LC[k3+2]=RE_O[2];
    if(s.water||s.shore>0){ reWaterRGB(s,x,y,RE_O); C.WC[k3]=RE_O[0]; C.WC[k3+1]=RE_O[1]; C.WC[k3+2]=RE_O[2]; }   // (only read next to water)
    const E=reB(s.b); C.RC[k3]=E.road[0]; C.RC[k3+1]=E.road[1]; C.RC[k3+2]=E.road[2];
    const sw=sea&&y>=BAND?sea.shore:30;
    C.F[k]=s.out?40:s.water?(s.bridge?-8:-Math.max(0.5,s.depth*70)):s.shore>0?(1-s.shore)*sw:Math.max(sw,30);
    C.RD[k]=s.water?1e3:s.roadD; C.RW[k]=y<BAND?(s.b===4?26:19):((BIOMES[s.b]&&BIOMES[s.b].roadW)||19);
    C.LV[k]=s.lavaS; C.BG[k]=s.bog; C.TT[k]=s.b2===s.b?1:s.t; C.SH[k]=s.shore;
    C.MA[k]=reMatOf(s.b,s); C.MB[k]=reMatOf(s.b2,s); C.OUT[k]=s.out||s.bridge?1:0;
    if(s.lavaS>0){ C.hasLava=true; const q=k*4; C.GD[q]=255; C.GD[q+1]=120; C.GD[q+2]=30; C.GD[q+3]=Math.round(clamp(s.lavaS*1.4-0.2,0,1)*210); }
    if(s.water) C.hasWater=true;
  }
}
// cell flags: 1 water near, 2 road near, 4 lava, 8 bog, 16 two materials meet
function reCellFlags(C){
  const N=C.N, F=C.F, RD=C.RD, RW=C.RW, LV=C.LV, BG=C.BG, MA=C.MA, MB=C.MB, TT=C.TT, CF=C.CF;
  for(let j=0;j<64;j++) for(let i=0;i<64;i++){
    const a=j*N+i, b=a+1, c=a+N, d=c+1; let f=0;
    if(Math.min(F[a],F[b],F[c],F[d])<14) f|=1;
    if(Math.min(RD[a]-RW[a],RD[b]-RW[b],RD[c]-RW[c],RD[d]-RW[d])<10) f|=2;
    if(Math.max(LV[a],LV[b],LV[c],LV[d])>0.12) f|=4;
    if(Math.max(BG[a],BG[b],BG[c],BG[d])>0.1) f|=8;
    if(MA[a]!==MA[b]||MA[a]!==MA[c]||MA[a]!==MA[d]||(Math.min(TT[a],TT[b],TT[c],TT[d])<0.85&&(MA[a]!==MB[a]||MA[d]!==MB[d]))) f|=16;
    CF[j*64+i]=f;
  }
}
function reFieldRows(C,fy0,fy1){
  const N=C.N, x0=C.x0, y0=C.y0, LC=C.LC, WC=C.WC, RC=C.RC, F=C.F, RD=C.RD, RW=C.RW, LV=C.LV, BG=C.BG, TT=C.TT, MA=C.MA, MB=C.MB, CF=C.CF, WM=C.WM, D=C.D, FS=256;
  const TX=REX.tex, PN=REX.pn, PN2=REX.pn2, FN=REX.fn, LVX=REX.lava, ROADT=TX[RM_N], MUDT=TX[RM_N+1];
  const ox=((x0>>1)%128+128)%128, oy=((y0>>1)%128+128)%128;   // texture offset, so the textures run on across chunks
  let hasShallow=false;
  for(let fy=fy0;fy<fy1;fy++){
    const py=fy*2+1, j=py>>3, v=RE_WU[(py&7)>>1], ty=((fy+oy)&127)<<7, ty2=(((fy+oy)>>1)&127)<<7;
    for(let fx=0;fx<FS;fx++){
      const px=fx*2+1, i=px>>3, u=RE_WU[(px&7)>>1];
      const k00=j*N+i, k10=k00+1, k01=k00+N, k11=k01+1;
      const w00=(1-u)*(1-v), w10=u*(1-v), w01=(1-u)*v, w11=u*v;
      const tx=(fx+ox)&127, ti=ty|tx, ti2=ty2|((fx+ox)>>1&127), q4=ti<<2;
      const flags=CF[j*64+i];
      let r=LC[k00*3]*w00+LC[k10*3]*w10+LC[k01*3]*w01+LC[k11*3]*w11;
      let g=LC[k00*3+1]*w00+LC[k10*3+1]*w10+LC[k01*3+1]*w01+LC[k11*3+1]*w11;
      let b=LC[k00*3+2]*w00+LC[k10*3+2]*w10+LC[k01*3+2]*w01+LC[k11*3+2]*w11;
      const kn=u<0.5?(v<0.5?k00:k01):(v<0.5?k10:k11), fn=FN[ti], pn=PN[ti], pn2=PN2[ti2];
      let mat=MA[kn];
      if(flags&16){ const tt=TT[k00]*w00+TT[k10]*w10+TT[k01]*w01+TT[k11]*w11; if((1-tt)+(fn*0.11+pn*0.09)>0.5) mat=MB[kn]; }
      // large soft patches, then the material's own texture
      const M=RMAT[mat], pm=(pn*0.6+pn2*0.6)*M.pa;
      if(pm>0){ r+=(M.pt[0]-r)*pm; g+=(M.pt[1]-g)*pm; b+=(M.pt[2]-b)*pm; } else { r+=(M.nt[0]-r)*-pm; g+=(M.nt[1]-g)*-pm; b+=(M.nt[2]-b)*-pm; }
      const Tm=TX[mat], ta=Tm[q4+3]*0.00392;
      if(ta>0){ r+=(Tm[q4]-r)*ta; g+=(Tm[q4+1]-g)*ta; b+=(Tm[q4+2]-b)*ta; }
      if(mat===RM.SAND){ const rp=Math.sin((px+x0)*0.33+(py+y0)*0.21+pn*3.2+pn2*2)*0.045; r*=1+rp; g*=1+rp; b*=1+rp*1.1; }
      else if(mat===RM.SNOW){ const sh=pn2<-0.1?(-0.1-pn2)*0.3:0; r-=sh*60; g-=sh*44; b-=sh*14; }
      if(flags&14){
        // bog: mud, then dark puddles with a sheen
        if(flags&8){ const bg=BG[k00]*w00+BG[k10]*w10+BG[k01]*w01+BG[k11]*w11+(fn-0.5)*0.2+pn*0.08;
          if(bg>0.22){ const kk=smooth(clamp((bg-0.22)/0.36,0,1))*0.88, mu=RE_MUD, ma=MUDT[q4+3]*0.00392;
            let mr=mu[0]+(MUDT[q4]-mu[0])*ma, mg=mu[1]+(MUDT[q4+1]-mu[1])*ma, mb=mu[2]+(MUDT[q4+2]-mu[2])*ma;
            if(bg>0.78){ const pk=clamp((bg-0.78)/0.08,0,1); mr+=(30+pn2*8-mr)*pk; mg+=(40+pn2*10-mg)*pk; mb+=(36+pn2*12-mb)*pk; if(bg>0.8&&bg<0.84){ mr+=16; mg+=18; mb+=16; } }
            r+=(mr-r)*kk; g+=(mg-g)*kk; b+=(mb-b)*kk; } }
        // road: packed earth with ruts, a worn middle and a ragged edge that fades into the ground
        if(flags&2){ const rd=RD[k00]*w00+RD[k10]*w10+RD[k01]*w01+RD[k11]*w11, rw=RW[k00]*w00+RW[k10]*w10+RW[k01]*w01+RW[k11]*w11;
          const e=rw+2+(fn-0.5)*3.2+pn*3, a=clamp((e-rd)/3.2,0,1);
          if(a>0){ let rr=RC[k00*3]*w00+RC[k10*3]*w10+RC[k01*3]*w01+RC[k11*3]*w11, rg=RC[k00*3+1]*w00+RC[k10*3+1]*w10+RC[k01*3+1]*w01+RC[k11*3+1]*w11, rb=RC[k00*3+2]*w00+RC[k10*3+2]*w10+RC[k01*3+2]*w01+RC[k11*3+2]*w11;
            const ra=ROADT[q4+3]*0.00392; rr+=(ROADT[q4]-rr)*ra; rg+=(ROADT[q4+1]-rg)*ra; rb+=(ROADT[q4+2]-rb)*ra;
            const rel=rd/rw, rut=rel>0.3&&rel<0.5?0.86+0.06*fn:rel<0.16?1.05:1;
            const pv=1+pn2*0.06; rr*=rut*pv; rg*=rut*pv; rb*=rut*pv;
            r+=(rr-r)*a; g+=(rg-g)*a; b+=(rb-b)*a; }
          else if(rd<e+3){ const dk=0.94+0.06*(rd-e)/3; r*=dk; g*=dk; b*=dk; } }
        // lava: dark crust plates over bright cracks, molten in the middle of a field
        if(flags&4){ const lv=LV[k00]*w00+LV[k10]*w10+LV[k01]*w01+LV[k11]*w11+(fn-0.5)*0.1;
          if(lv>0.26){ const kk=smooth(clamp((lv-0.26)/0.3,0,1)), heat=smooth(clamp((lv-0.5)/0.45,0,1));
            const wi=((((fy+oy+(pn2*5|0))&127)<<7)|((fx+ox+(pn*5|0))&127)), cr=LVX[wi];
            const cw=0.16+0.5*heat, br=clamp((cr-(1-cw))/0.18,0,1);
            const cru=0.8+0.2*fn, hh=heat*heat*0.5, crr=(46+pn*10+44*hh)*cru, crg=(30+pn*6+4*hh)*cru, crb=(26+pn*4)*cru;
            const mr=196+59*cr*heat, mg=62+130*cr*heat*heat, mb=18+60*cr*heat*heat;
            const lr=crr+(mr-crr)*br, lg=crg+(mg-crg)*br, lb=crb+(mb-crb)*br;
            r+=(lr-r)*kk; g+=(lg-g)*kk; b+=(lb-b)*kk; }
          else if(lv>0.1){ const sc=1-(lv-0.1)*0.9; r*=sc; g*=sc*0.95; b*=sc*0.92; } }
      }
      // water: depth colour, light turquoise over the sand near the shore, a soft bright fringe; on land a wet band
      if(flags&1){ const f=F[k00]*w00+F[k10]*w10+F[k01]*w01+F[k11]*w11+(fn-0.5)*2.4+pn*1.2;
        if(f<0){ let wr=WC[k00*3]*w00+WC[k10*3]*w10+WC[k01*3]*w01+WC[k11*3]*w11, wg=WC[k00*3+1]*w00+WC[k10*3+1]*w10+WC[k01*3+1]*w01+WC[k11*3+1]*w11, wb=WC[k00*3+2]*w00+WC[k10*3+2]*w10+WC[k01*3+2]*w01+WC[k11*3+2]*w11;
          const sh=clamp(1+f/26,0,1), sk=sh*sh*0.5; wr+=(r*0.78+6-wr)*sk; wg+=(g*0.86+14-wg)*sk; wb+=(b*0.86+18-wb)*sk;
          const sv=pn2*7+pn*3; wr+=sv; wg+=sv; wb+=sv*1.2;
          if(f>-3.2){ const fq=(1+f/3.2)*0.32; wr+=(232-wr)*fq; wg+=(240-wg)*fq; wb+=(236-wb)*fq; }
          r=wr; g=wg; b=wb;
          if(!(fx&1)&&!(fy&1)){ const wa=clamp(1+f/46,0,1); if(wa>0){ const q=(((fy>>1)<<7)|(fx>>1))<<2; WM[q]=WM[q+1]=WM[q+2]=255; WM[q+3]=Math.round(wa*wa*235); hasShallow=true; } }
        } else if(f<11){ const wq=(1-f/11), wk=wq*wq*RMAT[mat].wet; r*=1-wk; g*=1-wk*0.92; b*=1-wk*0.8; } }
      const q=(fy*FS+fx)<<2; D[q]=r; D[q+1]=g; D[q+2]=b; D[q+3]=255;
    }
  }
  if(hasShallow) C.hasShallow=true;
}
function reChunkCanvas(C){
  const field=mkCanvas(256,256), fg=field.getContext('2d'), img=fg.createImageData(256,256); img.data.set(C.D); fg.putImageData(img,0,0);
  const cv=mkCanvas(CPX,CPX), g=cv.getContext('2d');
  g.imageSmoothingEnabled=true; g.imageSmoothingQuality='medium';
  g.drawImage(field,0,0,256,256,0,0,CPX,CPX);
  g.setTransform(RES,0,0,RES,-C.x0*RES,-C.y0*RES);
  C.g=g; C.D=null;
  return {cv,g,glow:null,hasWater:C.hasWater,used:chunkTick,foam:null,re:{wm:null}};
}
function reDecalPlan(C){
  const N=C.N, x0=C.x0, y0=C.y0, step=C.step, cx=C.cx, cy=C.cy, F=C.F, RD=C.RD, RW=C.RW, LV=C.LV, BG=C.BG, TT=C.TT, MA=C.MA, MB=C.MB, OUT=C.OUT, SH=C.SH;
  const at=(x,y)=>{ const i=clamp(Math.round((x-x0)/step),0,N-1), j=clamp(Math.round((y-y0)/step),0,N-1); return j*N+i; };
  const rng=mulberry32(((cx*92821)^(cy*68917)^0x2e12b)|0), S=RES_SPR, low=[], mid=[], top=[];
  C.rng=rng;
  const matAt=(k)=>{ const t=TT[k]; if(t<0.9&&MA[k]!==MB[k]){ const d=(1-t)+(rng()-0.5)*0.3; return d>0.5?MB[k]:MA[k]; } return MA[k]; };
  const land=(k)=>F[k]>4&&LV[k]<0.3&&!OUT[k];
  for(let n=0;n<2600;n++){
    const x=x0+rng()*CH, y=y0+rng()*CH, k=at(x,y), r=rng();
    if(!land(k)) continue;
    const mat=matAt(k);
    const onRoad=RD[k]<RW[k]+1, nearRoad=!onRoad&&RD[k]<RW[k]+6;
    if(onRoad){ if(r<0.07) low.push([S.peb[RE_PB[mat]==='grey'||RE_PB[mat]==='brown'?'brown':RE_PB[mat]][Math.floor(rng()*6)],x,y,1]); else if(r<0.075) low.push([S.peb.grey[Math.floor(rng()*6)],x,y,1.2]); continue; }
    if(BG[k]>0.55){ if(r<0.03) top.push([S.reed[Math.floor(rng()*4)],x,y,0.9+rng()*0.3]); continue; }
    const clump=0.5+0.5*REX.pn[((((y>>1)%128)+128)%128)*128+((((x>>1)%128)+128)%128)];
    const tp=RE_TP[mat];
    if(mat===RM.GRASS||mat===RM.MARSH||mat===RM.FOREST){
      if(nearRoad&&r<0.3){ top.push([S.tuft[tp][Math.floor(rng()*6)],x,y,0.85+rng()*0.3]); continue; }
      if(mat===RM.FOREST){ if(r<0.2) low.push([S.leaf[Math.floor(rng()*10)],x,y,1]); else if(r<0.27) top.push([S.tuft.forest[Math.floor(rng()*6)],x,y,0.8+rng()*0.3]); else if(r<0.283) low.push([S.twig[Math.floor(rng()*4)],x,y,1]); else if(r<0.2865) top.push([S.mush[Math.floor(rng()*3)],x,y,1]); else if(r<0.295) low.push([S.peb.brown[Math.floor(rng()*6)],x,y,1]); continue; }
      const pt=(0.08+0.24*clump*clump)*(mat===RM.MARSH?1.2:1);
      if(r<pt) top.push([S.tuft[clump>0.7&&mat===RM.GRASS?'lush':tp][Math.floor(rng()*6)],x,y,0.8+rng()*0.35]);
      else if(r<pt+0.008) low.push([S.peb.grey[Math.floor(rng()*6)],x,y,1]);
      else if(mat===RM.MARSH&&r<pt+0.018&&SH[k]>0.2) top.push([S.reed[Math.floor(rng()*4)],x,y,0.8]);
      continue;
    }
    if(mat===RM.DRY){ if(r<0.07) top.push([S.tuft.dry[Math.floor(rng()*6)],x,y,0.8+rng()*0.3]); else if(r<0.11) low.push([S.peb.grey[Math.floor(rng()*6)],x,y,1]); else if(r<0.113) low.push([S.peb.greyB[Math.floor(rng()*3)],x,y,1]); continue; }
    if(mat===RM.ROCK){ if(r<0.06) low.push([S.peb.red[Math.floor(rng()*6)],x,y,1]); else if(r<0.068) low.push([S.peb.redB[Math.floor(rng()*3)],x,y,1]); else if(r<0.09) top.push([S.tuft.dry[Math.floor(rng()*6)],x,y,0.7]); continue; }
    if(mat===RM.ASH){ if(r<0.07) low.push([S.peb.dark[Math.floor(rng()*6)],x,y,1]); else if(r<0.076) low.push([S.peb.darkB[Math.floor(rng()*3)],x,y,1]); else if(r<0.086) mid.push([S.ember[Math.floor(rng()*2)],x,y,1]); continue; }
    if(mat===RM.SNOW||mat===RM.ICE){ if(r<0.05) mid.push([S.spark[Math.floor(rng()*3)],x,y,1]); else if(mat===RM.SNOW&&r<0.058) top.push([S.tuft.pale[Math.floor(rng()*6)],x,y,0.7]); else if(r<0.062) low.push([S.peb.pale[Math.floor(rng()*6)],x,y,1]); continue; }
    if(mat===RM.SAND){ if(r<0.006) low.push([S.shell[Math.floor(rng()*5)],x,y,1]); else if(r<0.016) low.push([S.peb.pale[Math.floor(rng()*6)],x,y,0.9]); else if(r<0.024&&SH[k]<0.1) top.push([S.tuft.coast[Math.floor(rng()*6)],x,y,0.8]); continue; }
    if(mat===RM.YARD){ if(r<0.035) low.push([S.peb.brown[Math.floor(rng()*6)],x,y,1]); else if(r<0.04) top.push([S.tuft.dry[Math.floor(rng()*6)],x,y,0.7]); continue; }
    if(mat===RM.DUSK){ if(r<0.035) low.push([S.peb.violet[Math.floor(rng()*6)],x,y,1]); else if(r<0.042) mid.push([S.vspark[Math.floor(rng()*2)],x,y,1]); continue; }
    if(mat===RM.GLASS){ if(r<0.03) mid.push([S.vspark[Math.floor(rng()*2)],x,y,1]); continue; }
  }
  // flowers in clusters (one colour each) and tight grass clumps
  for(let n=0;n<14;n++){
    const x=x0+rng()*CH, y=y0+rng()*CH, k=at(x,y), kind=rng();
    if(!land(k)||RD[k]<RW[k]+10||MA[k]!==RM.GRASS) continue;
    if(kind<0.55){ const col=RE_FLOWERS[Math.floor(rng()*RE_FLOWERS.length)], nf=5+Math.floor(rng()*11), R=8+rng()*16;
      for(let f=0;f<nf;f++){ const a=rng()*TAU, d=Math.sqrt(rng())*R, fx=x+Math.cos(a)*d, fy=y+Math.sin(a)*d*0.8, kk=at(fx,fy); if(!land(kk)||RD[kk]<RW[kk]+4) continue; top.push([S.flower[col][Math.floor(rng()*3)],fx,fy,0.9+rng()*0.25]); } }
    else{ const nc=4+Math.floor(rng()*6); for(let f=0;f<nc;f++){ const fx=x+(rng()-0.5)*16, fy=y+(rng()-0.5)*10, kk=at(fx,fy); if(!land(kk)) continue; top.push([S.clump[rng()<0.5?'lush':'meadow'][Math.floor(rng()*4)],fx,fy,0.85+rng()*0.3]); } }
  }
  top.sort((a,b)=>a[2]-b[2]);
  C.low=low; C.mid=mid; C.top=top;
}
function reDrawList(g,L,n0,n1){ g.globalAlpha=1; for(let n=n0;n<n1;n++){ const d=L[n]; reDraw(g,d[0],d[1],d[2],d[3]); } }
function reFoamLines(C,ch){
  const N=C.N, NN=C.NN, x0=C.x0, y0=C.y0, step=C.step, g=C.g, rng=C.rng;
  if(C.hasWater){
    const FW=new Float32Array(NN); for(let k=0;k<NN;k++) FW[k]=-C.F[k];
    const brs=[]; for(const br of BRIDGES){ if(br.x+220<x0||br.x-220>x0+CH||br.y+220<y0||br.y-220>y0+CH) continue; brs.push(br); }
    let sk=null; if(brs.length||WALKWAYS.length){ sk=new Uint8Array(NN); for(let j=0;j<N;j++) for(let i=0;i<N;i++) sk[j*N+i]=sbOnDeck(x0+(i+0.5)*step,y0+(j+0.5)*step,brs)?1:0; }
    const L=msLines(FW,N,x0,y0,step,0.4,[],sk), L2=msLines(FW,N,x0,y0,step,7,[],sk);
    g.lineCap='round';
    g.strokeStyle='rgba(234,242,238,.46)'; g.lineWidth=1.15; g.beginPath();
    for(let i=0;i<L.length;i+=6){ if(rng()<0.22) continue; g.moveTo(L[i],L[i+1]); g.lineTo(L[i+2],L[i+3]); } g.stroke();
    g.strokeStyle='rgba(226,238,236,.18)'; g.lineWidth=0.9; g.beginPath();
    for(let i=0;i<L2.length;i+=6){ if(rng()<0.45) continue; g.moveTo(L2[i],L2[i+1]); g.lineTo(L2[i+2],L2[i+3]); } g.stroke();
    ch.foam=L.length?new Float32Array(L):null;
  }
  if(C.hasShallow){ const m=mkCanvas(128,128), mg=m.getContext('2d'), id=mg.createImageData(128,128); id.data.set(C.WM); mg.putImageData(id,0,0); ch.re.wm=m; }
}
function reChunkGlow(C,ch){
  if(!C.hasLava) return;
  const N=C.N, glowS=mkCanvas(N,N), gg=glowS.getContext('2d'), gimg=gg.createImageData(N,N); gimg.data.set(C.GD); gg.putImageData(gimg,0,0);
  const glow=mkCanvas(CPX/4,CPX/4), g2=glow.getContext('2d'); g2.imageSmoothingEnabled=true; g2.drawImage(glowS,0,0,N,N,-CPX/4/(N-1)/2,-CPX/4/(N-1)/2,CPX/4+CPX/4/(N-1),CPX/4+CPX/4/(N-1)); ch.glow=glow;
}

// ---------- the world's ground decals in this look (drawDecal in a4_ground.js asks here first): stone plazas and
// pavings laid in slabs with mortar, moss and worn edges, soft dirt and sand patches, the mud ring, the crop field.
// Each decal draws from its own seed, so the parts of it in neighbouring chunks meet exactly.
function reSlabs(g,rng,x0,y0,x1,y1,pal,rowH){
  g.fillStyle=pal.mortar; g.fillRect(x0,y0,x1-x0,y1-y0);
  for(let y=y0,row=0;y<y1;row++){ const h=rowH*(0.8+rng()*0.4); let x=x0-rng()*rowH;
    while(x<x1){ const w=rowH*(0.8+rng()*0.9), v=rng(), c=pal.stone[Math.floor(v*pal.stone.length)], i=1.3+rng()*0.6;
      const sx=x+i, sy=y+i, sw=w-i*2, sh=h-i*2;
      g.fillStyle=c; rrect(g,sx,sy,sw,sh,2.5); g.fill();
      g.fillStyle='rgba(255,248,230,.09)'; g.fillRect(sx+1,sy+0.6,sw-2,1.2); g.fillRect(sx+0.6,sy+1,1.1,sh-2);
      g.fillStyle='rgba(20,14,10,.14)'; g.fillRect(sx+1,sy+sh-1.6,sw-2,1.6); g.fillRect(sx+sw-1.5,sy+1,1.5,sh-2);
      if(rng()<0.3){ g.strokeStyle='rgba(30,24,20,.3)'; g.lineWidth=0.7; g.beginPath(); const a=sx+rng()*sw; g.moveTo(a,sy+1); g.lineTo(a+(rng()-0.5)*8,sy+sh*0.6); g.lineTo(a+(rng()-0.5)*10,sy+sh-1); g.stroke(); }
      if(rng()<0.45){ g.fillStyle=`rgba(${pal.moss},.3)`; for(let k=0;k<4;k++){ g.beginPath(); g.arc(sx+(rng()<0.5?0:sw),sy+rng()*sh,0.8+rng()*1.4,0,TAU); g.fill(); } }
      if(rng()<0.25){ g.fillStyle='rgba(0,0,0,.06)'; g.beginPath(); g.ellipse(sx+sw*rng(),sy+sh*rng(),sw*0.3,sh*0.25,0,0,TAU); g.fill(); }
      x+=w; }
    y+=h; }
}
const RE_STONE={stone:['#8e887e','#948e84','#88827a','#9a9488','#8c867e','#96908a'],mortar:'#6a645a',moss:'78,104,46'};
const RE_STONE_D={stone:['#5c5654','#625c58','#58524e','#66605c','#5e5856'],mortar:'#3e3a36',moss:'90,70,50'};
function reDecal(g,dc){
  const k=dc.k; if(k!=='flagstone'&&k!=='paving'&&k!=='dirt'&&k!=='sand'&&k!=='mudring'&&k!=='field') return false;
  reSprInit(); reTexInit();
  const rng=mulberry32(Math.floor(dc.x*7+dc.y*13)^0x51ab), S=RES_SPR;
  g.save();
  if(k==='flagstone'||k==='paving'){
    const pal=dc.y<2900||dc.k==='paving'?RE_STONE_D:RE_STONE;
    let x0,y0,x1,y1;
    if(k==='flagstone'){ const R=dc.r; g.beginPath(); for(let i=0;i<=72;i++){ const a=i/72*TAU, rr=R*(1+0.025*Math.sin(a*5+dc.x)+0.015*Math.sin(a*11)); i?g.lineTo(dc.x+Math.cos(a)*rr,dc.y+Math.sin(a)*rr):g.moveTo(dc.x+Math.cos(a)*rr,dc.y+Math.sin(a)*rr); } g.closePath();
      g.fillStyle='rgba(30,24,16,.25)'; g.save(); g.translate(1.5,2.5); g.fill(); g.restore(); g.clip(); x0=dc.x-R; y0=dc.y-R; x1=dc.x+R; y1=dc.y+R; }
    else{ x0=dc.x-dc.w/2; y0=dc.y-dc.h/2; x1=dc.x+dc.w/2; y1=dc.y+dc.h/2; g.beginPath(); g.rect(x0,y0,x1-x0,y1-y0); g.clip(); }
    reSlabs(g,rng,x0,y0,x1,y1,pal,k==='paving'?30:24);
    // worn and shaded toward the rim
    if(k==='flagstone'){ const e=g.createRadialGradient(dc.x,dc.y,dc.r*0.7,dc.x,dc.y,dc.r); e.addColorStop(0,'rgba(20,16,10,0)'); e.addColorStop(1,'rgba(20,16,10,.28)'); g.fillStyle=e; g.fillRect(x0,y0,x1-x0,y1-y0); }
    if(dc.snow){ for(let i=0;i<44;i++){ const a=rng()*TAU, r=Math.sqrt(rng())*(dc.r||200), x=dc.x+Math.cos(a)*r, y=dc.y+Math.sin(a)*r, rr=6+rng()*16, sg=g.createRadialGradient(x,y,0,x,y,rr); sg.addColorStop(0,'rgba(232,238,246,.72)'); sg.addColorStop(1,'rgba(232,238,246,0)'); g.fillStyle=sg; g.beginPath(); g.arc(x,y,rr,0,TAU); g.fill(); }
      const e=g.createRadialGradient(dc.x,dc.y,(dc.r||200)*0.6,dc.x,dc.y,dc.r||200); e.addColorStop(0,'rgba(228,234,242,0)'); e.addColorStop(1,'rgba(228,234,242,.8)'); g.fillStyle=e; g.fillRect(x0,y0,x1-x0,y1-y0); }
    g.restore();
    // grass and pebbles creeping onto the edge
    if(k==='flagstone'&&!dc.snow&&dc.y>=2900) for(let i=0;i<Math.round(dc.r*0.5);i++){ const a=rng()*TAU, r=dc.r*(0.95+rng()*0.08), x=dc.x+Math.cos(a)*r, y=dc.y+Math.sin(a)*r; reDraw(g,S.tuft.meadow[Math.floor(rng()*6)],x,y,0.8+rng()*0.3); }
    return true;
  }
  if(k==='dirt'||k==='sand'){
    const col=k==='dirt'?'112,92,66':'190,170,126', R=dc.r;
    for(let i=0;i<26;i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.55, x=dc.x+Math.cos(a)*d, y=dc.y+Math.sin(a)*d, rr=R*(0.35+rng()*0.3), gr=g.createRadialGradient(x,y,rr*0.2,x,y,rr); gr.addColorStop(0,`rgba(${col},.42)`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.beginPath(); g.arc(x,y,rr,0,TAU); g.fill(); }
    for(let i=0;i<Math.round(R*0.6);i++){ const a=rng()*TAU, d=Math.sqrt(rng())*R*0.8; reDraw(g,(k==='dirt'?S.peb.brown:S.peb.pale)[Math.floor(rng()*6)],dc.x+Math.cos(a)*d,dc.y+Math.sin(a)*d,1); }
    if(k==='sand'){ g.strokeStyle='rgba(140,116,80,.18)'; g.lineWidth=1.2; for(let i=0;i<12;i++){ const y=dc.y-R*0.6+i*R*0.1; g.beginPath(); for(let x=dc.x-R*0.6;x<=dc.x+R*0.6;x+=6) g.lineTo(x,y+Math.sin(x*0.12+i)*2); g.stroke(); } }
    g.restore(); return true;
  }
  if(k==='mudring'){
    const gr=g.createRadialGradient(dc.x,dc.y,dc.r*0.15,dc.x,dc.y,dc.r); gr.addColorStop(0,'rgba(64,54,36,.92)'); gr.addColorStop(0.75,'rgba(58,50,34,.8)'); gr.addColorStop(1,'rgba(58,50,34,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(dc.x,dc.y,dc.r,0,TAU); g.fill();
    for(let i=0;i<10;i++){ const a=rng()*TAU, d=rng()*dc.r*0.55, x=dc.x+Math.cos(a)*d, y=dc.y+Math.sin(a)*d, rr=8+rng()*18; g.fillStyle='rgba(26,30,22,.45)'; g.beginPath(); g.ellipse(x,y,rr,rr*0.6,rng()*3,0,TAU); g.fill(); g.fillStyle='rgba(200,214,200,.12)'; g.beginPath(); g.ellipse(x-rr*0.3,y-rr*0.2,rr*0.4,rr*0.15,0,0,TAU); g.fill(); }
    for(let i=0;i<14;i++){ const a=i/14*TAU, x=dc.x+Math.cos(a)*dc.r*0.62, y=dc.y+Math.sin(a)*dc.r*0.62;
      g.save(); g.translate(x,y); g.rotate(a+Math.PI/2); g.fillStyle='rgba(20,14,8,.3)'; g.fillRect(-8,-3,18,9); g.fillStyle='#5e4a32'; g.fillRect(-9,-5,18,9); g.fillStyle='#76603e'; g.fillRect(-9,-5,18,2.2); g.strokeStyle='rgba(30,20,10,.5)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(-6,-1); g.lineTo(6,-1); g.moveTo(-4,2); g.lineTo(5,2); g.stroke(); g.restore(); }
    g.restore(); return true;
  }
  // a crop field: furrowed soil, rows of plants, a rail fence
  g.translate(dc.x,dc.y); g.rotate(dc.rot);
  const w=dc.w, h=dc.h;
  g.fillStyle='#5c4630'; g.fillRect(-w/2,-h/2,w,h);
  for(let i=0;i<Math.round(w*h/120);i++){ g.fillStyle=rng()<0.5?'rgba(36,26,16,.3)':'rgba(140,110,76,.22)'; g.fillRect(-w/2+rng()*w,-h/2+rng()*h,1.5,1.2); }
  const cc=hexRGB(dc.crop||'#b8a04a'), pal=cc[1]>cc[0]?'meadow':'dry';
  for(let y=-h/2+6;y<h/2;y+=10){ g.fillStyle='rgba(30,20,12,.35)'; g.fillRect(-w/2+3,y+3,w-6,2.4); g.fillStyle='rgba(150,118,80,.2)'; g.fillRect(-w/2+3,y-2,w-6,1.4);
    for(let x=-w/2+6;x<w/2-4;x+=4+rng()*2) reDraw(g,S.tuft[pal][Math.floor(rng()*6)],x,y+1.5,0.75+rng()*0.25); }
  const post=(x,y)=>{ g.fillStyle='rgba(20,14,8,.3)'; g.fillRect(x-1.5,y-1,5,5); g.fillStyle='#4a3420'; g.fillRect(x-2.5,y-2.5,5,5); g.fillStyle='#6a4e30'; g.fillRect(x-2.5,y-2.5,5,1.5); };
  g.strokeStyle='rgba(20,14,8,.3)'; g.lineWidth=2.4; g.strokeRect(-w/2-5,-h/2-4.5,w+12,h+12);
  g.strokeStyle='#6e5234'; g.lineWidth=2; g.strokeRect(-w/2-6,-h/2-6,w+12,h+12); g.strokeStyle='rgba(200,170,120,.3)'; g.lineWidth=0.7; g.strokeRect(-w/2-6.5,-h/2-6.5,w+12,h+12);
  for(let x=-w/2-6;x<=w/2+6;x+=30){ post(x,-h/2-6); post(x,h/2+6); }
  g.restore(); return true;
}

// ---------- the moving water, once a frame (from the ground chunk loop in render)
// caustics: 16 frames of one tiling 128 px pattern (2 world px a pixel), made a frame at a time the first time water
// is in view; each visible chunk with shallows gets its mask scaled up into a scratch canvas, the frame laid into it
// (source-in), and the result added onto the world
const REW={frames:[],pats:[],scr:null,sg:null,foamT:0,st:{ms:0,n:0,chunks:0}};
function reCausticFrame(f){
  const c=mkCanvas(128,128), g=c.getContext('2d'), id=g.createImageData(128,128), d=id.data, t=f/16*TAU, P=TAU/128;
  for(let y=0;y<128;y++) for(let x=0;x<128;x++){
    const wx=x+2.2*Math.sin((y*2)*P+t), wy=y+2.2*Math.sin((x*3)*P-t);
    const v=Math.sin((wx*3+wy*1)*P+t)+Math.sin((wx*-1+wy*4)*P+t*2)+Math.sin((wx*2-wy*3)*P-t);
    const k=Math.pow(clamp(1-Math.abs(v)*0.6,0,1),5), q=(y*128+x)*4;
    d[q]=225; d[q+1]=246; d[q+2]=236; d[q+3]=Math.round(k*255);
  }
  g.putImageData(id,0,0); return c;
}
function reWater(vis,t){
  if(!LOOK.re||!RE.on) return;
  const t0=performance.now();
  if(REW.frames.length<16){ REW.frames.push(reCausticFrame(REW.frames.length)); }
  if(!REW.scr){ REW.scr=mkCanvas(256,256); REW.sg=REW.scr.getContext('2d'); }
  const nf=REW.frames.length, fi=Math.floor(t*7)%nf, fr=REW.frames[fi], sg=REW.sg;
  if(!REW.pats[fi]) REW.pats[fi]=sg.createPattern(fr,'repeat');
  const pat=REW.pats[fi], dl=typeof daylight==='function'?daylight():1;
  let n=0;
  ctx.save();
  for(const v of vis){ const ch=CHUNKS.get(ckey(v[0],v[1])); if(!ch||!ch.re||!ch.re.wm) continue;
    const x0=v[0]*CH, y0=v[1]*CH; if(!inView(x0+CH/2,y0+CH/2,CH*0.75)) continue;
    sg.setTransform(1,0,0,1,0,0); sg.globalCompositeOperation='copy'; sg.imageSmoothingEnabled=true; sg.drawImage(ch.re.wm,0,0,256,256);
    sg.globalCompositeOperation='source-in'; const ox=((x0/2)%128+128)%128, oy=((y0/2)%128+128)%128; sg.setTransform(1,0,0,1,-ox,-oy); sg.fillStyle=pat; sg.fillRect(ox,oy,256,256);
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.1+0.16*dl; ctx.drawImage(REW.scr,0,0,256,256,x0,y0,CH,CH); n++;
  }
  sg.setTransform(1,0,0,1,0,0); sg.globalCompositeOperation='source-over';
  // soft lapping foam: every other segment of each shore's foam line drifts out from the shore and fades
  const u=(t*0.3)%1, d=1.5+u*8, a=0.34*(1-u)*Math.min(1,u*5), X0=cam.x-20, Y0=cam.y-20, X1=cam.x+W/zoom+20, Y1=cam.y+H/zoom+20;
  if(a>0.03){ ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=a; ctx.strokeStyle='#eef6f2'; ctx.lineWidth=1.1; ctx.lineCap='round'; ctx.beginPath();
    const odd=Math.floor(t*0.3)%2?6:0;
    for(const v of vis){ const ch=CHUNKS.get(ckey(v[0],v[1])), L=ch&&ch.re&&ch.foam; if(!L) continue;
      for(let i=odd;i<L.length;i+=12){ const ax=L[i], ay=L[i+1]; if(ax<X0||ax>X1||ay<Y0||ay>Y1) continue; const nx=L[i+4]*d, ny=L[i+5]*d; ctx.moveTo(ax+nx,ay+ny); ctx.lineTo(L[i+2]+nx,L[i+3]+ny); } }
    ctx.stroke(); }
  ctx.restore();
  // glints: a few sparkles on open water by day (they live in G.ripples and fade out by themselves)
  if(G.ripples&&G.ripples.length<34&&Math.random()<0.45*dl){ const x=cam.x+Math.random()*W/zoom, y=cam.y+Math.random()*H/zoom, s=T(x,y,{}); if(s.water&&!s.bridge&&!s.lava&&s.depth>0.25) G.ripples.push({x,y,t:0,max:0.5+Math.random()*0.6,r:4+Math.random()*6,glint:true}); }
  const dt=performance.now()-t0; REW.st.ms+=dt; REW.st.n++; REW.st.chunks+=n;
}
// a glint in this look: a small warm white four point sparkle that swells and fades, with a soft halo
function reGlint(r,k){ const a=Math.sin(Math.PI*k); if(a<0.05) return; const s=r.r*0.3*a+0.4;
  ctx.fillStyle=`rgba(255,252,236,${(0.7*a).toFixed(3)})`; ctx.fillRect(r.x-s,r.y-0.45,s*2,0.9); ctx.fillRect(r.x-0.45,r.y-s*0.6,0.9,s*1.2);
  ctx.fillStyle=`rgba(255,250,230,${(0.22*a).toFixed(3)})`; ctx.fillRect(r.x-s*0.5,r.y-s*0.35,s,s*0.7); }
// the lava glow's slow pulse in this look (render's chunk glow pass)
function reGlowA(t,cx,cy){ return 0.24+0.12*Math.sin(t*1.05+cx*1.3+cy*0.7); }

// ---------- lava lights (kind 'lava') for LIGHT's light engine, only while the Realistic look is on: one per lava rich
// 320 px cell of the map Ash is on, added the first time he is there in this look, all taken out when the look changes
const RLL={on:false,maps:{}};
function reLavaLights(){
  if(!LOOK.re){ if(RLL.on){ for(let i=LIGHTS.length-1;i>=0;i--) if(LIGHTS[i].reLava) LIGHTS.splice(i,1); RLL.on=false; RLL.maps={}; } return; }
  RLL.on=true;
  const k=curMap(); if(RLL.maps[k]) return; RLL.maps[k]=1;
  const M=MAPS[k]; let box=null;
  if(!k) box=[0,0,WORLD.w,2900]; else if(M&&M.tz&&M.tz.hasLava) box=[0,M.y0,M.w,M.y0+M.h];
  if(!box) return;
  const s={};
  for(let y=box[1]+160;y<box[3];y+=320) for(let x=160;x<box[2];x+=320){ T(x,y,s); if(!(s.lavaS>0.7)||s.out) continue;
    let n=0; for(const [dx,dy] of [[-90,0],[90,0],[0,-90],[0,90]]){ T(x+dx,y+dy,s); if(s.lavaS>0.6) n++; }
    if(n>=3) LIGHTS.push({x,y,r:240,i:0.5,kind:'lava',reLava:true}); }
}

// ---------- hooks (Storybook and Classic never take them)
{ const base=chunkGen; chunkGen=function(cx,cy){ return LOOK.re&&RE.on?reChunkG(cx,cy):base(cx,cy); }; }
{ const base=groundRGB; groundRGB=function(s,x,y){ return LOOK.re&&RE.on?reGroundRGB(s,x,y):base(s,x,y); }; }
// the frame hook from render's ground chunk loop: water motion, and keeping the lava lights in step with the look
function reGroundFrame(vis,t){ if(LOOK.re||RLL.on) reLavaLights(); if(LOOK.re) reWater(vis,t); }

// debug: numbers, a chunk bench, the switch
window.__ebX=Object.assign(window.__ebX||{},{reGround:{RE,REW,REX,RES_SPR,reB,RLL,
  stages(cx,cy){ reTexInit(); reSprInit(); const o={}, t=()=>performance.now(); let a=t(); const C=reChunkCtx(cx,cy); for(let j=0;j<C.N;j++) reSampleRow(C,j); o.sample=t()-a; a=t(); reCellFlags(C); o.flags=t()-a; a=t(); reFieldRows(C,0,256); o.field=t()-a; a=t(); const ch=reChunkCanvas(C); o.canvas=t()-a; a=t(); reDecalPlan(C); o.plan=t()-a; a=t(); for(const L of [C.low,C.mid,C.top]) reDrawList(C.g,L,0,L.length); o.draw=t()-a; o.nDecals=C.low.length+C.mid.length+C.top.length; a=t(); reFoamLines(C,ch); o.foam=t()-a; a=t(); chunkRun(chunkDecalsG(C.g,C.x0,C.y0)); o.wdecals=t()-a; for(const k in o) o[k]=+o[k].toFixed(2); return o; },
  bench(list){ const out=[]; for(const [cx,cy] of list){ const t=performance.now(); chunkRun(reChunkG(cx,cy)); out.push([cx,cy,+(performance.now()-t).toFixed(2)]); } return out; },
  on(v){ if(v!=null){ RE.on=!!v; if(typeof lookRebuild==='function') lookRebuild(); } return RE.on; }}});
