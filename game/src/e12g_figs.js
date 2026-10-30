// ================= The Realistic look, wave 11: figures, effects, pickups and projectiles (FIGS)
// Ash, Pip, the cast, everyone the people generator makes, critters, beasts, foes and bosses are toy 3D figures
// (a3e_toy3d.js): every part is an ellipsoid, a limb, a cone, a cylinder, a panel or a dot, filled with a gradient
// made from its colour. In the Realistic look t3End hands the sorted part list to reT3End here, which paints the same
// parts with soft form shading and a material per part (skin, scales, cloth, leather, metal, fur, feathers, slime,
// stone, chitin, ice, gloss, glow), no bold outline, a faint cool rim on the shadow side, a little ground occlusion
// low on the body and, on big parts, a fine surface texture. Sizes, colours, silhouettes, hit flashes and hit
// boxes are untouched: only the fill of each part changes. Storybook and Classic never reach this code.
// LIGHT (e12_light.js) still tints figures by the light at their feet and draws their shadows on top of this.

// ---------- materials
// Each material is a list of stops for an ellipsoid's radial gradient, from the lit spot (t 0) to the far edge (t 1):
// [t, a, w, s, k]: a lightens (+, warm light, keeps the colour's saturation) or darkens (-, cooler), w mixes in the
// highlight white, s the warm light that scatters under skin and through wings and jelly, k the cool sky rim.
// Limbs, cones, cylinders and panels sample the same curve, so a material looks the same on every kind of part.
const RFM={
  matte:   {e:[[0,.3,0,0,0],[.3,.12,0,0,0],[.58,0,0,0,0],[.8,-.2,0,0,0],[.94,-.36,0,0,0],[1,-.3,0,0,.12]], pk:.8},
  cloth:   {e:[[0,.24,0,0,0],[.36,.08,0,0,0],[.62,0,0,0,0],[.84,-.26,0,0,0],[.96,-.42,0,0,0],[1,-.38,0,0,.07]], pk:.7, tex:'weave', ta:.3, ts:.13},
  skin:    {e:[[0,.3,.1,0,0],[.08,.25,.03,0,0],[.32,.12,0,0,0],[.58,0,0,0,0],[.78,-.12,0,.32,0],[.92,-.3,0,.18,0],[1,-.26,0,.08,.1]], pk:.75},
  scales:  {e:[[0,.48,.26,0,0],[.06,.36,.05,0,0],[.28,.13,0,0,0],[.56,0,0,0,0],[.8,-.24,0,.14,0],[.94,-.42,0,0,0],[1,-.32,0,0,.2]], pk:.95, tex:'scale', ta:.42, ts:.12},
  hide:    {e:[[0,.34,.07,0,0],[.1,.24,0,0,0],[.4,.06,0,0,0],[.64,0,0,0,0],[.86,-.3,0,.1,0],[1,-.42,0,0,.08]], pk:.85, tex:'hide', ta:.42, ts:.2},
  leather: {e:[[0,.38,.1,0,0],[.08,.27,0,0,0],[.38,.06,0,0,0],[.64,0,0,0,0],[.88,-.36,0,0,0],[1,-.44,0,0,.06]], pk:.9, tex:'grain', ta:.32, ts:.18},
  metal:   {e:[[0,.75,.72,0,0],[.06,.6,.24,0,0],[.18,.2,0,0,0],[.4,-.42,0,0,0],[.6,-.14,0,0,0],[.78,.1,0,0,.12],[.92,-.46,0,0,0],[1,-.3,0,0,.32]], pk:1.5, metal:true, tex:'brush', ta:.3, ts:.2},
  fur:     {e:[[0,.26,0,0,0],[.36,.1,0,0,0],[.62,0,0,0,0],[.86,-.24,0,0,0],[.95,-.16,0,0,.08],[1,-.02,0,0,.2]], pk:.7, tex:'fur', ta:.5, ts:.18},
  hair:    {e:[[0,.4,.12,0,0],[.12,.2,0,0,0],[.4,.04,0,0,0],[.66,0,0,0,0],[.9,-.36,0,0,0],[1,-.32,0,0,.1]], pk:.85, tex:'strand', ta:.45, ts:.15},
  feather: {e:[[0,.26,.02,0,0],[.38,.08,0,0,0],[.64,0,0,0,0],[.88,-.28,0,0,0],[1,-.18,0,0,.18]], pk:.75, tex:'feather', ta:.42, ts:.2},
  membrane:{e:[[0,.3,.05,0,0],[.3,.1,0,0,0],[.6,0,0,.1,0],[.86,-.2,0,.3,0],[1,-.24,0,.2,.08]], pk:.6, sss:true},
  slime:   {e:[[0,.62,.78,0,0],[.06,.42,.2,0,0],[.14,.16,0,0,0],[.46,0,0,0,0],[.72,-.08,0,0,0],[.88,.2,0,.25,0],[.97,.1,0,0,.1],[1,-.2,0,0,0]], pk:.9, sss:true, tex:'bubble', ta:.5, ts:.26},
  ice:     {e:[[0,.62,.8,0,0],[.06,.36,.26,0,0],[.2,.08,0,0,0],[.5,-.06,0,0,0],[.76,-.16,0,0,0],[.9,.16,.12,0,.2],[1,0,0,0,.42]], pk:1.1, tex:'crack', ta:.45, ts:.3},
  stone:   {e:[[0,.2,0,0,0],[.36,.07,0,0,0],[.62,0,0,0,0],[.85,-.3,0,0,0],[1,-.46,0,0,.04]], pk:.8, tex:'stone', ta:.55, ts:.24},
  bark:    {e:[[0,.22,0,0,0],[.36,.08,0,0,0],[.62,0,0,0,0],[.86,-.32,0,0,0],[1,-.46,0,0,.04]], pk:.8, tex:'bark', ta:.55, ts:.22},
  chitin:  {e:[[0,.62,.5,0,0],[.05,.36,.1,0,0],[.2,.1,0,0,0],[.54,0,0,0,0],[.84,-.38,0,0,0],[.96,-.5,0,0,0],[1,-.36,0,0,.22]], pk:1.2, tex:'speck', ta:.3, ts:.2},
  horn:    {e:[[0,.5,.3,0,0],[.07,.3,.05,0,0],[.3,.1,0,0,0],[.58,0,0,0,0],[.86,-.26,0,.08,0],[1,-.36,0,0,.1]], pk:1},
  gloss:   {e:[[0,.7,.7,0,0],[.05,.4,.1,0,0],[.2,.1,0,0,0],[.55,0,0,0,0],[.86,-.4,0,0,0],[1,-.5,0,0,.16]], pk:1.2},
  glow:    {e:[[0,.42,.45,0,0],[.3,.16,.05,0,0],[.7,0,0,0,0],[1,-.08,0,0,0]], pk:.3, glow:true},
  shade:   {e:[[0,.18,0,0,0],[.5,0,0,0,0],[.84,-.2,0,0,0],[.95,-.08,0,0,0],[1,.34,.12,0,0]], pk:.5, tex:'smoke', ta:.45, ts:.3},
  cloud:   {e:[[0,.3,.12,0,0],[.4,.1,0,0,0],[.7,0,0,0,0],[.92,-.14,0,0,0],[1,-.04,0,0,.3]], pk:.5},
  dust:    {e:[[0,.22,.04,0,0],[.4,.06,0,0,0],[.66,0,0,0,0],[.9,-.24,0,0,0],[1,-.12,0,0,.16]], pk:.6, tex:'dust', ta:.45, ts:.2},
};
RFM.brass=Object.assign({},RFM.metal,{tex:'brush',ta:.35});
// Vorlaxis: dark scales with the mountain's heat showing through in the shadows
RFM.ember=Object.assign({},RFM.scales,{e:[[0,.36,.14,0,0],[.06,.26,.03,0,0],[.28,.08,0,0,0],[.56,0,0,0,0],[.78,-.18,0,.26,0],[.92,-.32,0,.22,0],[1,-.24,0,.2,.06]]});
RFM.glass=Object.assign({},RFM.ice,{tex:null});
RFM.shell=Object.assign({},RFM.horn,{tex:'speck',ta:.35,ts:.3});
const RF={plain:false,fr:0,tn:0,tmax:160,tmin:2.4,tdev:5,on:true,tex:true,layerOn:true,lay:0,ln:0,lmax:6,lmax1:3,gc:new Map(),rgb:new Map(),heu:new Map(),ct:null,fm:null,fmap:null,
  pat:{},dm:null,stats:{parts:0,tex:0,miss:0},kids:0};
const RF_CT=
  '7c4c30ska0e0b0co7a5a32lr3a6a4acoe4cec4skc792eaco2a1a2aha7a4a2esk8a9aaaco9a3420skefe0bfhhd2c29ehha8987ahhffd34dgg'+
  '2a0a02gg6e2214ha7a2a20co4a1410co2e0a06co9a7048lr6a4a2clr4a2c18lrd8a840mtb8c0camt4a3020lrefe2c4hhc8502emb94341emb'+
  '3e0e08mb3a0e08hhffcf86coffd29acoe6f0ffcoffa060coc84a3aco2a1a10hac8946csk3a7ab0coe8c060haf2c8a6sk5a8a3aco8a3a1aha'+
  'e0ae88ske0a030co1a1a1aha3a6a9aco8f8d87ff77756flr3c3a36ffd2d8deffadb6belr6c757effdde4eaff8fa2b6lr56687cffbfe6fffe'+
  'e8edf2ffc9d3ddlr55606cfff6f9fchaa4b2c2hhe4ebf2ha3a1a08mt10202emtf5f1e7ff3a302ahhad986chhf2c84amtf2884askfff0d0hh'+
  'ffab6ambb84a1embffd27ahhff8f86sk86a062sk6e8a4esk7a6640cca08a58mta96e40co24160chhe2d2b0hh9a8670fffbf2dcccf6f3eaff'+
  'f08850skfff4dchhf4a26amba8481cmbffe0a0hhff9a8ask9ec4ffiiff7a3agwc8a0ffiia89458sk7a6834sk3e3418sk5a3a20lrffd84agg'+
  'c9ced6mt8a6a42bd8a7a6affa8988aff5a4a3affece2cchh9aa2acmt9a5a32coe0b048mtd8b898ska8844alrdc7c46mbb8467ambefe0c0hh'+
  'f49ab8mb2e2e38mtd0a444mta01e16co4a0a08co6e1c18cod6dae0mt3a2a1alrd8301efe24242ahhdcc49chh6e9a3cffe8d84agg4a0e18sk'+
  'd8607eskf08aa4hhece4cchh4c6a2csl6e8e40slc8c890slc6d860sl7a5636bd6a8a34ff9cc452ff4a7628mb7cae3cmbc8ff70ggffe066gg'+
  'ffa838bdffe08abd2a170amt8a5a30bdd0aa78bd4ac0d8mb5ad8e8mb1e6a84hh0a1e2askeef8f4hh4e66aamb3c5290mbffcc40mtbfefffgg'+
  '2a1a3ask2a2a38hhb08a5amtdccaa2hh7a6448hh621a1amb420c0emba02a08snff7a1asnffa040snffd060snffb020gg1a0303skece0c4hh'+
  '2a0a0ahh7e8898mtd27a4amt9a5030mt788292mt566070mt7c7898co58546fcodcd6ecmb9a94b4mbfbf8ffco4a3e62coc2cad6mt8a94a6mt'+
  'd8a848mtb0925ask7e6236skd0606esk4a4a56hhf2c040hh9a6a40bd6e4826bdc8945abde0b050mt7a8494mt5a6272mtf4ecd2skd6cce6ff'+
  'f4faffii6a5a84co7a6a92co4e4266co4e4662lre6b894skece8f6co5e5478codfe4eehhc8c0d8co6a9a5aff5a4884skd0c4f4hhb0a2dchh'+
  '9284c0hhf0dcffgg1e1030gg3e3060ha40305eco2c2046co1e1632co56467clr3a2e5alr2e2448lrb8a0f0mta898d4mt30264clr7050a8mb'+
  '52387emb2a1c44mbdde6f2ffa6b4dclr565f8cffc8b8fffe2a2630gwe6f6ffiia888e0mb7458b8mbf4eefcffd6ccffiif2eeffiie8b894sk'+
  '7a5a3aff5a5e6emt3a3c48mt9e9a92ff7a766effc2beb4ffd8cdb4hha89a7ahhf4f0fambd8d0e8mbe8f6ffhh9ccbf0hha88a76sk7e6252sk'+
  'c8ac96skf4ecd8hh9aa2b0mt6a7282mt9a8a78sn6e6052snbcae9asnd8a888ska8dcf6iic8d8f4ii94acdciif2f8ffgwd8dce4mt2e3a6aco'+
  'f4fdffiiff7ad8hh9a98a8mt6a6878mtcfcdd8mtb8b4c4mb6e6880mbb04a6afed8d0b8mt6a5a8ask4a3c66sk7a4ab0sk56308aska274d8sk'+
  'ffcf3aggf0c850skc09030skd8b070skecd09askbfe8e0ii7ab8b0iie8eef4mtffcf5amtd8e8e4mt7ad0f0mbf6fdffiie8f8ffhac8e8ffha'+
  '6a4a8aco3e2a5acob8b0c8ffe4e0ecff8a78a8mb4a3a66mbcfe0ffii2e3048sk2a6a9aii9690acff645e7cffbdb7cffff4f2fcha77708fmb'+
  '968cb6mb352d4cmt554d6emb2a2340mt221b38mtbfc4dcii0b0716ggff7a30mt3c3f48bd4c505bbd9a6a52mt';

const RF_CODE={bd:'bark',cc:'chitin',co:'cloth',fe:'feather',ff:'fur',gg:'gloss',gw:'glow',ha:'hair',hh:'horn',ii:'ice',lr:'leather',
  mb:'membrane',mt:'metal',sk:'skin',sl:'slime',sn:'stone'};
function rfCT(){ if(RF.ct) return RF.ct; const M=new Map(); RF_CT.replace(/([0-9a-f]{6})([a-z]{2})/g,(q,h,c)=>{ M.set('#'+h,RF_CODE[c]||'matte'); return q; }); return (RF.ct=M); }
function rfRGB(col){ let c=RF.rgb.get(col); if(c) return c; c=hexRGB(col); if(RF.rgb.size>4000) RF.rgb.clear(); RF.rgb.set(col,c); return c; }
function rfHex(r,g,b){ return '#'+((1<<24)|(clamp(Math.round(r),0,255)<<16)|(clamp(Math.round(g),0,255)<<8)|clamp(Math.round(b),0,255)).toString(16).slice(1); }
// a colour under a stop: a lightens (multiplied, a little toward warm white) or darkens (cooler); then scatter, white, sky
function rfTone(c,a,w,s,k){
  let r=c[0], g=c[1], b=c[2];
  if(a>0){ const m=1+a*1.15, u=a*0.22; r=r*m+(255-r)*u; g=g*m+(248-g)*u; b=b*m+(232-b)*u; }
  else if(a<0){ const q=-a; r*=1-q*1.08; g*=1-q*1.0; b*=1-q*0.8; }
  if(s){ r+=(Math.min(255,r*1.12+30)-r)*s; g+=(g*0.76-g)*s; b+=(b*0.66-b)*s; }
  if(w){ r+=(255-r)*w; g+=(252-g)*w; b+=(244-b)*w; }
  if(k){ r+=(150-r)*k; g+=(178-g)*k; b+=(216-b)*k; }
  return rfHex(r,g,b);
}
// the colour of a material's curve at t (between its stops), with ao darkening for parts near the ground
function rfAt(c,M,t,ao){
  const E=M.e; let i=1; while(i<E.length-1&&E[i][0]<t) i++;
  const A=E[i-1], B=E[i], u=B[0]>A[0]?clamp((t-A[0])/(B[0]-A[0]),0,1):0;
  return rfTone(c,lerp(A[1],B[1],u)-ao,lerp(A[2],B[2],u),lerp(A[3],B[3],u),lerp(A[4],B[4],u));
}
// which material a part is: the figure's own colour map (exact, then the nearest hue of the same family), the colour
// table scanned from the figure files' named colours, the figure's default, and last a guess from the colour
function rfMat(col){
  const fm=RF.fmap;
  if(fm){ let v=fm.m.get(col); if(v===undefined){ v=rfNear(fm,col); fm.m.set(col,v); } if(v) return v; }
  const t=rfCT().get(col); if(t) return t;
  let h=RF.heu.get(col);
  if(h===undefined){ const c=rfRGB(col), mx=Math.max(c[0],c[1],c[2]), mn=Math.min(c[0],c[1],c[2]);
    // very bright, strongly coloured parts are lights (glowing eyes, cores, weak spots, runes): kept bright and flat
    h=(mx>=235&&mx-mn>=120)?'glow':mx<46?'gloss':(mx>238&&mn>214)?'horn':null;
    if(RF.heu.size>3000) RF.heu.clear(); RF.heu.set(col,h); }
  if(h==='glow') return h;
  return RF.fm||h||'matte';
}
function rfChroma(c){ const s=c[0]+c[1]+c[2]+1; return [c[0]/s,c[1]/s,s]; }
function rfNear(fm,col){
  const c=rfChroma(rfRGB(col)); let best=null, bd=0.03;
  for(const q of fm.list){ const d=Math.hypot(c[0]-q[0],c[1]-q[1]), lr=c[2]/q[2]; if(d<bd&&lr>0.35&&lr<2.6){ bd=d; best=q[3]; } }
  return best||null;
}
// a figure's colour map from {colour:material} pairs
function rfMap(pairs){
  const m=new Map(), list=[];
  for(const [col,mat] of pairs){ if(typeof col!=='string'||col[0]!=='#'||col.length!==7) continue; m.set(col,mat); const c=rfChroma(rfRGB(col)); list.push([c[0],c[1],c[2],mat]); }
  return {m,list};
}
function rfValid(col){ return typeof col==='string'&&col.length===7&&col.charCodeAt(0)===35; }

// ---------- gradients (cached; the same unit spaces as t3Grad, so the parts' geometry is untouched)
function rfGE(col,mat,qx,qy,ao){
  const key=col+'|'+mat+'|'+qx+'|'+qy+'|'+ao; let gr=RF.gc.get(key); if(gr) return gr;
  if(RF.gc.size>9000) RF.gc.clear(); RF.stats.miss++;
  const M=RFM[mat]||RFM.matte, c=rfRGB(col), hx=qx/10, hy=qy/10, a=ao*0.07;
  gr=ctx.createRadialGradient(hx,hy,0.02,hx*0.25,hy*0.25,1.04);
  for(const s of M.e) gr.addColorStop(s[0],rfTone(c,s[1]-a,s[2],s[3],s[4]));
  RF.gc.set(key,gr); return gr;
}
// across a limb, from its lit edge (u 0) to its shadow edge (u 1), sampling the material's curve
const RF_LU=[[0,.34],[.16,.05],[.34,.22],[.56,.5],[.76,.72],[.9,.9],[1,1]];
function rfGL(col,mat,R2,side,ao){
  const key=col+'|L'+mat+'|'+R2+'|'+side+'|'+ao; let gr=RF.gc.get(key); if(gr) return gr;
  if(RF.gc.size>9000) RF.gc.clear(); RF.stats.miss++;
  const M=RFM[mat]||RFM.matte, c=rfRGB(col), R=R2/2, a=ao*0.07;
  gr=ctx.createLinearGradient(0,-R*side,0,R*side);
  for(const s of RF_LU) gr.addColorStop(s[0],rfAt(c,M,s[1],a));
  RF.gc.set(key,gr); return gr;
}
function rfGC(col,mat,rm,ao){
  const key=col+'|C'+mat+'|'+rm+'|'+ao; let gr=RF.gc.get(key); if(gr) return gr;
  if(RF.gc.size>9000) RF.gc.clear(); RF.stats.miss++;
  const M=RFM[mat]||RFM.matte, c=rfRGB(col), a=ao*0.07;
  gr=ctx.createLinearGradient(-rm,0,rm,0);
  for(const s of RF_LU) gr.addColorStop(s[0],rfAt(c,M,s[1],a));
  RF.gc.set(key,gr); return gr;
}
// a flat panel (capes, wings, blades, ears): its facing light (lk) sets the tone, a soft ramp along the light gives it form
function rfGP(col,mat,lq,rq,lx,ly){
  const key=col+'|P'+mat+'|'+lq+'|'+rq+'|'+lx+'|'+ly; let gr=RF.gc.get(key); if(gr) return gr;
  if(RF.gc.size>9000) RF.gc.clear(); RF.stats.miss++;
  const M=RFM[mat]||RFM.matte, c=rfRGB(col), a=lq/20*M.pk, r=rq, dx=lx/10*r, dy=ly/10*r;
  gr=ctx.createLinearGradient(dx,dy,-dx,-dy);
  if(M.metal){ gr.addColorStop(0,rfTone(c,a+.5,.4,0,0)); gr.addColorStop(.28,rfTone(c,a+.12,0,0,0)); gr.addColorStop(.55,rfTone(c,a-.32,0,0,0)); gr.addColorStop(.8,rfTone(c,a+.04,0,0,.1)); gr.addColorStop(1,rfTone(c,a-.22,0,0,0)); }
  else if(M.sss){ gr.addColorStop(0,rfTone(c,a+.14,0,0,0)); gr.addColorStop(.5,rfTone(c,a,0,.12,0)); gr.addColorStop(1,rfTone(c,a-.16,0,.26,0)); }
  else if(M.glow){ gr.addColorStop(0,rfTone(c,a+.12,.1,0,0)); gr.addColorStop(1,rfTone(c,a,0,0,0)); }
  else { gr.addColorStop(0,rfTone(c,a+.16,0,0,0)); gr.addColorStop(.6,rfTone(c,a,0,0,0)); gr.addColorStop(1,rfTone(c,a-.2,0,0,.04)); }
  RF.gc.set(key,gr); return gr;
}
function rfGlint(col){ const key=col+'|G'; let v=RF.gc.get(key); if(v) return v; v=rfTone(rfRGB(col),.6,.5,0,0); RF.gc.set(key,v); return v; }
function rfFlat(col,mat,lq){
  const key=col+'|F'+mat+'|'+lq; let v=RF.gc.get(key); if(v) return v;
  const M=RFM[mat]||RFM.matte; v=rfTone(rfRGB(col),lq/20*M.pk,0,0,0); RF.gc.set(key,v); return v;
}

// ---------- surface textures: small tiles of light and dark marks, laid over big parts as a pattern
function rfTile(kind){
  const N=32, c=mkCanvas(N,N), g=c.getContext('2d'), R=mulberry32(phash('rf'+kind)), D='rgba(0,0,0,', Lt='rgba(255,250,240,';
  const wrap=(f)=>{ for(const ox of [-N,0,N]) for(const oy of [-N,0,N]){ g.save(); g.translate(ox,oy); f(); g.restore(); } };
  g.lineCap='round';
  if(kind==='scale'){ // small overlapping scales, a little uneven: a soft dark crescent under each, a faint lit rim above
    for(let row=0;row<5;row++) for(let i=0;i<5;i++){ const x=i*6.4+(row%2)*3.2+(R()-0.5)*1.4, y=row*6.4+(R()-0.5)*1.2, w=2.6+R()*1.1, da=(0.14+R()*0.14).toFixed(2), la=(0.1+R()*0.14).toFixed(2);
      wrap(()=>{ g.fillStyle=D+da+')'; g.beginPath(); g.ellipse(x,y+2.4,w,w*0.8,0,0.15,Math.PI-0.15); g.fill();
        g.strokeStyle=Lt+la+')'; g.lineWidth=0.8; g.beginPath(); g.ellipse(x,y+0.3,w*0.8,w*0.62,0,Math.PI+0.6,TAU-0.6); g.stroke(); }); }
  }else if(kind==='fur'){ for(let i=0;i<70;i++){ const x=R()*N, y=R()*N, l=3+R()*4, a=Math.PI/2+(R()-0.5)*0.6, d=R()<0.55;
      wrap(()=>{ g.strokeStyle=(d?D:Lt)+(0.18+R()*0.22).toFixed(2)+')'; g.lineWidth=0.7+R()*0.6; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); }); }
  }else if(kind==='strand'){ for(let i=0;i<26;i++){ const x=R()*N, d=R()<0.6; wrap(()=>{ g.strokeStyle=(d?D:Lt)+(0.14+R()*0.18).toFixed(2)+')'; g.lineWidth=0.6+R()*0.5; g.beginPath(); g.moveTo(x,0); g.quadraticCurveTo(x+2,N/2,x,N); g.stroke(); }); }
  }else if(kind==='feather'){ for(let row=0;row<4;row++) for(let i=0;i<3;i++){ const x=i*11+(row%2)*5.5, y=row*8;
      wrap(()=>{ g.fillStyle=D+'.26)'; g.beginPath(); g.ellipse(x,y+4,6,3.4,0,0.05,Math.PI-0.05); g.fill(); g.strokeStyle=Lt+'.3)'; g.lineWidth=0.8; g.beginPath(); g.ellipse(x,y+1,5,2.6,0,Math.PI+0.3,TAU-0.3); g.stroke();
        g.strokeStyle=D+'.18)'; g.lineWidth=0.5; g.beginPath(); g.moveTo(x,y-2); g.lineTo(x,y+5); g.stroke(); }); }
  }else if(kind==='weave'){ for(let i=0;i<N;i+=2){ g.fillStyle=D+(i%4?'.1)':'.16)'); g.fillRect(0,i,N,1); g.fillStyle=Lt+(i%4?'.06)':'.1)'); g.fillRect(i,0,1,N); }
    for(let i=0;i<10;i++){ g.fillStyle=(R()<0.5?D:Lt)+'.14)'; g.fillRect(R()*N|0,R()*N|0,3,1); }
  }else if(kind==='hide'||kind==='grain'){ const n=kind==='hide'?90:60; for(let i=0;i<n;i++){ const x=R()*N, y=R()*N, r=0.5+R()*(kind==='hide'?1.1:0.7); wrap(()=>{ g.fillStyle=(R()<0.6?D:Lt)+(0.16+R()*0.2).toFixed(2)+')'; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }); }
    for(let i=0;i<(kind==='hide'?7:4);i++){ const x=R()*N, y=R()*N, l=4+R()*6, a=R()*Math.PI; wrap(()=>{ g.strokeStyle=D+'.22)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*l*0.5+1.5,y+Math.sin(a)*l*0.5-1.5,x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); }); }
  }else if(kind==='brush'){ for(let i=0;i<40;i++){ const y=R()*N, x=R()*N, l=6+R()*14; wrap(()=>{ g.strokeStyle=(R()<0.5?D:Lt)+(0.08+R()*0.12).toFixed(2)+')'; g.lineWidth=0.5; g.beginPath(); g.moveTo(x,y); g.lineTo(x+l,y+0.4); g.stroke(); }); }
    for(let i=0;i<3;i++){ const x=R()*N, y=R()*N; wrap(()=>{ g.fillStyle=D+'.16)'; g.beginPath(); g.arc(x,y,1.3,0,TAU); g.fill(); g.fillStyle=Lt+'.2)'; g.beginPath(); g.arc(x-0.5,y-0.5,0.7,0,TAU); g.fill(); }); }
  }else if(kind==='stone'||kind==='speck'||kind==='dust'){ const n=kind==='stone'?120:kind==='dust'?90:50; for(let i=0;i<n;i++){ const x=R()*N, y=R()*N, r=0.4+R()*(kind==='stone'?1.2:0.8); wrap(()=>{ g.fillStyle=(R()<0.55?D:Lt)+(0.12+R()*(kind==='dust'?0.16:0.24)).toFixed(2)+')'; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }); }
    if(kind==='stone') for(let i=0;i<3;i++){ let x=R()*N, y=R()*N; wrap(()=>{ g.strokeStyle=D+'.3)'; g.lineWidth=0.7; g.beginPath(); g.moveTo(x,y); let px=x, py=y; for(let j=0;j<4;j++){ px+=(R()-0.5)*7; py+=R()*5; g.lineTo(px,py); } g.stroke(); }); }
  }else if(kind==='bark'){ for(let i=0;i<14;i++){ const x=R()*N; wrap(()=>{ g.strokeStyle=D+(0.2+R()*0.2).toFixed(2)+')'; g.lineWidth=0.8+R()*1.2; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+(R()-0.5)*6,N*0.33,x+(R()-0.5)*6,N*0.66,x,N); g.stroke(); }); }
    for(let i=0;i<8;i++){ const x=R()*N; wrap(()=>{ g.strokeStyle=Lt+'.16)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(x,0); g.lineTo(x+1,N); g.stroke(); }); }
  }else if(kind==='bubble'){ for(let i=0;i<9;i++){ const x=R()*N, y=R()*N, r=0.8+R()*2.2; wrap(()=>{ g.strokeStyle=Lt+'.3)'; g.lineWidth=0.6; g.beginPath(); g.arc(x,y,r,0,TAU); g.stroke(); g.fillStyle=Lt+'.4)'; g.beginPath(); g.arc(x-r*0.4,y-r*0.4,r*0.3,0,TAU); g.fill(); }); }
  }else if(kind==='crack'){ for(let i=0;i<5;i++){ let x=R()*N, y=R()*N; wrap(()=>{ g.strokeStyle=Lt+'.42)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(x,y); let px=x, py=y; for(let j=0;j<3;j++){ px+=(R()-0.5)*10; py+=(R()-0.5)*10; g.lineTo(px,py); } g.stroke(); }); }
    for(let i=0;i<4;i++){ const x=R()*N, y=R()*N; wrap(()=>{ g.fillStyle=Lt+'.14)'; g.beginPath(); g.moveTo(x,y); g.lineTo(x+5,y+2); g.lineTo(x+2,y+6); g.closePath(); g.fill(); }); }
  }else if(kind==='smoke'){ for(let i=0;i<16;i++){ const x=R()*N, y=R()*N, r=2+R()*4; wrap(()=>{ g.fillStyle=(R()<0.5?D:Lt)+(0.06+R()*0.08).toFixed(2)+')'; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }); } }
  return c;
}
function rfPat(kind){ let p=RF.pat[kind]; if(p!==undefined) return p; try{ p=ctx.createPattern(rfTile(kind),'repeat'); }catch(e){ p=null; } RF.pat[kind]=p; return p; }
// a texture may be drawn on this part (big enough, the frame's budget, the light's quality step)
function rfTexOK(){ if(!RF.tex) return false; if(typeof RLQ!=='undefined'&&RLQ.lvl>=2&&!RF.bake) return false; return RF.bake||RF.tn<RF.tmax; }

// ---------- the Realistic t3End: the same parts, sort and transforms as t3End; only the fills change
function reT3End(){
  if(RF.plain) return false;
  const R=T3R, g=R.g, m=R.m, n=R.n, list=R.list;
  for(let i=1;i<n;i++){ const p=list[i]; let j=i-1; while(j>=0&&list[j].d>p.d){ list[j+1]=list[j]; j--; } list[j+1]=p; }
  RF.stats.parts+=n;
  if(RF.bake){ rfParts(g,m,R.x,R.y,true); rfFeetAO(g,m,R.x,R.y); return true; }    // a person's sprite: its canvas holds only the figure
  if(!R.flash&&rfLayerOK()&&rfLayer()) return true;
  const a0=g.globalAlpha; if(R.alpha!==1) g.globalAlpha=a0*R.alpha;
  rfParts(g,m,R.x,R.y,false);
  g.setTransform(m); g.globalAlpha=a0;
  return true;
}
// the parts, back to front. occ: the canvas holds only this figure, so each part first lays a soft shadow on the parts
// already drawn behind it (source-atop: nothing outside the figure is touched), down and right, away from the light
function rfParts(g,m,ox,oy,occ){
  const R=T3R, L=T3.L, n=R.n, list=R.list, fl=R.flash, ga=g.globalAlpha, k=R.k, tmin=Math.max(RF.tmin*k,RF.tdev/(Math.abs(m.a)||1));   // textures only where they show
  const DM=RF.dm||(RF.dm=new DOMMatrix()), OB=occ?rfxSoft('0,0,0'):null;
  for(let i=0;i<n;i++){
    const p=list[i], col=p.col;
    if(fl||!rfValid(col)){ rfOldPart(g,p,ox,oy,m,fl,L); continue; }
    const mat=rfMat(col), M=RFM[mat]||RFM.matte, hz=p.hz, ao=hz==null||R.zl>3?0:hz<2.6?2:hz<6.5?1:0;
    if(occ&&i>0&&!M.glow) rfOcc(g,p,m,ox,oy,L,k,ga,OB);
    if(p.t===0){ // ellipsoid
      const c=Math.cos(p.ang), s=Math.sin(p.ang), mr=Math.sqrt(p.s1*p.s2);
      g.setTransform(m); g.transform(c*p.s1,s*p.s1,-s*p.s2,c*p.s2,ox+p.sx,oy+p.sy);
      let hx=(c*L[0]+s*L[1])*0.46*mr/p.s1, hy=(-s*L[0]+c*L[1])*0.46*mr/p.s2; const hl=Math.hypot(hx,hy); if(hl>0.62){ hx*=0.62/hl; hy*=0.62/hl; }
      g.fillStyle=rfGE(col,mat,Math.round(hx*10),Math.round(hy*10),ao);
      g.beginPath(); g.arc(0,0,1,0,TAU); g.fill();
      if(M.tex&&p.s2>=tmin&&rfTexOK()){ const pt=rfPat(M.tex); if(pt){ const ts=M.ts*k;
        DM.a=ts/p.s1; DM.b=0; DM.c=0; DM.d=ts/p.s2; DM.e=(i*0.37)%1; DM.f=(i*0.61)%1; pt.setTransform(DM);
        g.globalAlpha=ga*M.ta; g.fillStyle=pt; g.fill(); g.globalAlpha=ga; RF.tn++; RF.stats.tex++; } }
    }else if(p.t===1){ // limb or cone
      const dx=p.bx-p.ax, dy=p.by-p.ay, len=Math.hypot(dx,dy), an=Math.atan2(dy,dx), c=Math.cos(an), s=Math.sin(an);
      g.setTransform(m); g.transform(c,s,-s,c,ox+p.ax,oy+p.ay);
      const side=(-s*L[0]+c*L[1])<0?1:-1, rm=Math.max(p.r1,p.r2);
      g.fillStyle=rfGL(col,mat,Math.max(1,Math.round(rm*2)),side,ao);
      g.beginPath();
      if(len<0.5){ g.arc(0,0,rm,0,TAU); }
      else if(p.cone){ g.moveTo(0,-p.r1); g.lineTo(len,0); g.lineTo(0,p.r1); g.arc(0,0,p.r1,Math.PI/2,Math.PI*1.5); }
      else{ const r1=p.r1, r2=p.r2, sn=clamp((r1-r2)/len,-0.95,0.95), al=Math.asin(sn); g.arc(0,0,r1,Math.PI/2+al,Math.PI*1.5-al); g.arc(len,0,r2,-Math.PI/2-al,Math.PI/2+al); }
      g.closePath(); g.fill();
      if(M.tex&&!p.cone&&rm>=tmin*0.8&&len>rm*1.6&&rfTexOK()){ const pt=rfPat(M.tex); if(pt){ const ts=M.ts*k;
        DM.a=ts; DM.b=0; DM.c=0; DM.d=ts; DM.e=(i*1.7)%8; DM.f=0; pt.setTransform(DM);
        g.globalAlpha=ga*M.ta; g.fillStyle=pt; g.fill(); g.globalAlpha=ga; RF.tn++; RF.stats.tex++; } }
    }else if(p.t===5){ // line
      const dx=p.bx-p.ax, dy=p.by-p.ay, len=Math.hypot(dx,dy), an=Math.atan2(dy,dx), c=Math.cos(an), s=Math.sin(an);
      g.setTransform(m); g.transform(c,s,-s,c,ox+p.ax,oy+p.ay);
      g.strokeStyle=M.metal&&p.r1>0.5?rfFlat(col,mat,4):col; g.lineWidth=p.r1*2; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.lineTo(len,0); g.stroke();
    }else if(p.t===2){ // upright cylinder or frustum
      g.setTransform(m); const x=ox+p.ax, yb=oy+p.ay, yt=oy+p.by, r1=p.r1, r2=p.r2, e1=r1*T3.ct, e2=r2*T3.ct, rm=Math.max(r1,r2);
      g.translate(x,0); g.fillStyle=rfGC(col,mat,Math.round(rm),ao);
      g.beginPath(); g.moveTo(-r1,yb); g.ellipse(0,yb,r1,e1,0,Math.PI,0,true); g.lineTo(r2,yt); g.ellipse(0,yt,r2,e2,0,0,Math.PI,true); g.closePath(); g.fill();
      if(M.tex&&rm>=tmin*1.2&&rfTexOK()){ const pt=rfPat(M.tex); if(pt){ const ts=M.ts*k; DM.a=ts; DM.b=0; DM.c=0; DM.d=ts; DM.e=0; DM.f=(i*3.1)%8; pt.setTransform(DM); g.globalAlpha=ga*M.ta; g.fillStyle=pt; g.fill(); g.globalAlpha=ga; RF.tn++; RF.stats.tex++; } }
      if(!p.open){ g.fillStyle=p.top?p.top:rfAt(rfRGB(col),M,0.3,0); g.beginPath(); g.ellipse(0,yt,r2,e2,0,0,TAU); g.fill(); }
    }else if(p.t===3){ // panel
      g.setTransform(m); const q=p.pts, lq=Math.round(clamp(p.lk,-0.5,0.4)*20);
      let cx=0, cy=0; const np=q.length/2; for(let j=0;j<q.length;j+=2){ cx+=q[j]; cy+=q[j+1]; } cx/=np; cy/=np;
      let rr=0; for(let j=0;j<q.length;j+=2){ const d=Math.abs(q[j]-cx)+Math.abs(q[j+1]-cy); if(d>rr) rr=d; }
      g.translate(ox+cx,oy+cy);
      if(rr>3*k) g.fillStyle=rfGP(col,mat,lq,rr<12?Math.round(rr):Math.round(Math.pow(2,Math.round(Math.log2(rr)*4)/4)),Math.round(L[0]*10),Math.round(L[1]*10)); else g.fillStyle=rfFlat(col,mat,lq);   // big wings: sizes in steps, so a flapping wing reuses its ramps
      g.beginPath(); g.moveTo(q[0]-cx,q[1]-cy); for(let j=2;j<q.length;j+=2) g.lineTo(q[j]-cx,q[j+1]-cy); g.closePath(); g.fill();
      if(M.tex&&rr>5*k&&(M.tex==='dust'||M.tex==='feather'||M.tex==='fur'||M.tex==='scale'||M.tex==='weave')&&rfTexOK()){ const pt=rfPat(M.tex); if(pt){ const ts=M.ts*k; DM.a=ts; DM.b=0; DM.c=0; DM.d=ts; DM.e=0; DM.f=0; pt.setTransform(DM); g.globalAlpha=ga*M.ta*0.8; g.fillStyle=pt; g.fill(); g.globalAlpha=ga; RF.tn++; RF.stats.tex++; } }
      if(p.edge){ g.strokeStyle=p.edge; g.lineWidth=0.8*k; g.lineJoin='round'; g.globalAlpha=ga*0.75; g.stroke(); g.globalAlpha=ga; }
    }else if(p.t===4){ // dot (eyes, buttons, studs, rivets): metal and glossy ones catch a glint on the lit side
      g.setTransform(m); g.fillStyle=col; g.beginPath(); g.arc(ox+p.sx,oy+p.sy,p.r1,0,TAU); g.fill();
      if((M.metal||mat==='chitin'||mat==='horn')&&p.r1>0.55*k){ g.fillStyle=rfGlint(col); g.beginPath(); g.arc(ox+p.sx+L[0]*p.r1*0.38,oy+p.sy+L[1]*p.r1*0.38,p.r1*0.42,0,TAU); g.fill(); }
    }
  }
}
// one part's soft shadow on what is behind it
function rfOcc(g,p,m,ox,oy,L,k,ga,OB){
  const pc=g.globalCompositeOperation;
  if(p.t===0){ if(p.s2<1.5*k) return; const d=0.3*Math.min(p.s1,p.s2)+0.5*k, dx=-L[0]*d, dy=-L[1]*d+0.25*k, c=Math.cos(p.ang), s=Math.sin(p.ang);
    g.setTransform(m); g.transform(c*p.s1,s*p.s1,-s*p.s2,c*p.s2,ox+p.sx+dx,oy+p.sy+dy); g.globalCompositeOperation='source-atop'; g.globalAlpha=ga*0.5; g.drawImage(OB,-1.32,-1.32,2.64,2.64); }
  else if(p.t===1){ const rm=Math.max(p.r1,p.r2); if(rm<1.2*k) return; const d=0.35*rm+0.45*k, dx=-L[0]*d, dy=-L[1]*d+0.2*k;
    g.setTransform(m); g.globalCompositeOperation='source-atop'; g.strokeStyle='#000'; g.lineCap='round';
    g.globalAlpha=ga*0.12; g.lineWidth=(p.r1+p.r2)+1.6*k; g.beginPath(); g.moveTo(ox+p.ax+dx,oy+p.ay+dy); g.lineTo(ox+p.bx+dx,oy+p.by+dy); g.stroke();
    g.globalAlpha=ga*0.14; g.lineWidth=(p.r1+p.r2)*0.9; g.stroke(); }
  else if(p.t===3){ const q=p.pts; if(q.length<6) return; const d=0.7*k, dx=-L[0]*d, dy=-L[1]*d+0.3*k;
    g.setTransform(m); g.globalCompositeOperation='source-atop'; g.globalAlpha=ga*0.16; g.fillStyle='#000'; g.beginPath(); g.moveTo(ox+q[0]+dx,oy+q[1]+dy); for(let j=2;j<q.length;j+=2) g.lineTo(ox+q[j]+dx,oy+q[j+1]+dy); g.closePath(); g.fill(); }
  else if(p.t===2){ const rm=Math.max(p.r1,p.r2); if(rm<1.2*k) return; const d=0.3*rm+0.4*k;
    g.setTransform(m); g.globalCompositeOperation='source-atop'; g.globalAlpha=ga*0.4; g.drawImage(OB,ox+p.ax-rm*1.25-L[0]*d,oy+p.by-rm*0.9-L[1]*d,rm*2.5,(p.ay-p.by)+rm*1.8); }
  g.globalCompositeOperation=pc; g.globalAlpha=ga;
}
// the ground's occlusion at the feet: the lowest part of the figure a little darker (source-atop on its own canvas)
function rfFeetAO(g,m,ox,oy){
  const k=T3R.k; if(T3R.zl>3) return; let s=RF.aoS; if(!s){ s=mkCanvas(4,32); const q=s.getContext('2d'), gr=q.createLinearGradient(0,0,0,32); gr.addColorStop(0,'rgba(8,10,22,0)'); gr.addColorStop(0.6,'rgba(8,10,22,.16)'); gr.addColorStop(1,'rgba(8,10,22,.34)'); q.fillStyle=gr; q.fillRect(0,0,4,32); RF.aoS=s; }
  const pc=g.globalCompositeOperation, ga=g.globalAlpha; g.setTransform(m); g.globalCompositeOperation='source-atop'; g.drawImage(s,ox-60*k,oy-7*k,120*k,9*k); g.globalCompositeOperation=pc; g.globalAlpha=ga;
}
// ---------- the figure layer: a live figure painted on a scratch canvas of its own (so its parts can shade each other),
// then laid on the frame in one blit. Ash always; others while the frame's budget lasts and the light's quality allows.
function rfLayerOK(){
  if(!RF.layerOn||!RF.lay) return false; const m=T3R.m; if(Math.abs(m.b)>1e-6||Math.abs(m.c)>1e-6) return false;
  if(T3R.g!==ctx) return false;
  if(RF.lay===2) return true;                                         // Ash
  const q=typeof RLQ!=='undefined'?RLQ.lvl:0; if(q>=2) return false;
  return RF.ln<(q?RF.lmax1:RF.lmax);
}
function rfLayer(){
  const R=T3R, list=R.list, n=R.n, ct=T3.ct, m=R.m, g=R.g; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let i=0;i<n;i++){ const p=list[i];
    if(p.t===0){ const q=Math.max(p.s1,p.s2); if(p.sx-q<x0) x0=p.sx-q; if(p.sx+q>x1) x1=p.sx+q; if(p.sy-q<y0) y0=p.sy-q; if(p.sy+q>y1) y1=p.sy+q; }
    else if(p.t===1||p.t===5){ const q=Math.max(p.r1,p.r2); x0=Math.min(x0,p.ax-q,p.bx-q); x1=Math.max(x1,p.ax+q,p.bx+q); y0=Math.min(y0,p.ay-q,p.by-q); y1=Math.max(y1,p.ay+q,p.by+q); }
    else if(p.t===2){ const q=Math.max(p.r1,p.r2); x0=Math.min(x0,p.ax-q); x1=Math.max(x1,p.ax+q); y0=Math.min(y0,p.by-p.r2*ct,p.ay-p.r1*ct); y1=Math.max(y1,p.ay+p.r1*ct,p.by+p.r2*ct); }
    else if(p.t===3){ const q=p.pts; for(let j=0;j<q.length;j+=2){ if(q[j]<x0) x0=q[j]; if(q[j]>x1) x1=q[j]; if(q[j+1]<y0) y0=q[j+1]; if(q[j+1]>y1) y1=q[j+1]; } }
    else if(p.t===4){ x0=Math.min(x0,p.sx-p.r1); x1=Math.max(x1,p.sx+p.r1); y0=Math.min(y0,p.sy-p.r1); y1=Math.max(y1,p.sy+p.r1); }
  }
  if(!(x1>x0)) return false;
  const res=Math.min(4,Math.max(Math.abs(m.a),Math.abs(m.d))), pad=2/res; x0-=pad; y0-=pad; x1+=pad; y1+=pad;
  const W=Math.ceil((x1-x0)*res), H=Math.ceil((y1-y0)*res); if(W>1100||H>1100||W*H>600000) return false;
  let c=RF.lc; if(!c||c.width<W||c.height<H){ c=mkCanvas(Math.max(W,c?c.width:0,256),Math.max(H,c?c.height:0,256)); RF.lc=c; RF.lg=c.getContext('2d'); }
  const lg=RF.lg; lg.setTransform(1,0,0,1,0,0); lg.globalAlpha=1; lg.globalCompositeOperation='source-over'; lg.clearRect(0,0,W+2,H+2);
  const lm=RF.lm||(RF.lm=new DOMMatrix()); lm.a=res; lm.b=0; lm.c=0; lm.d=res; lm.e=-x0*res; lm.f=-y0*res;
  lg.setTransform(lm); const keep=R.g; R.g=lg; rfParts(lg,lm,0,0,true); rfFeetAO(lg,lm,0,0); R.g=keep;
  const a0=g.globalAlpha; g.setTransform(m); if(R.alpha!==1) g.globalAlpha=a0*R.alpha;
  g.drawImage(c,0,0,W,H,R.x+x0,R.y+y0,W/res,H/res); g.globalAlpha=a0;
  if(RF.lay!==2) RF.ln++; RF.stats.lay=(RF.stats.lay||0)+1;
  return true;
}
// a part drawn exactly as the Classic engine draws it (hit flashes, colours that are not #rrggbb)
function rfOldPart(g,p,ox,oy,m,fl,L){
  if(p.t===0){ const c=Math.cos(p.ang), s=Math.sin(p.ang), mr=Math.sqrt(p.s1*p.s2);
    g.setTransform(m); g.transform(c*p.s1,s*p.s1,-s*p.s2,c*p.s2,ox+p.sx,oy+p.sy);
    let hx=(c*L[0]+s*L[1])*0.46*mr/p.s1, hy=(-s*L[0]+c*L[1])*0.46*mr/p.s2; const hl=Math.hypot(hx,hy); if(hl>0.62){ hx*=0.62/hl; hy*=0.62/hl; }
    g.fillStyle=fl?'#ffffff':t3Grad(p.col,Math.round(hx*10),Math.round(hy*10),0); g.beginPath(); g.arc(0,0,1,0,TAU); g.fill(); }
  else if(p.t===1||p.t===5){ const dx=p.bx-p.ax, dy=p.by-p.ay, len=Math.hypot(dx,dy), an=Math.atan2(dy,dx), c=Math.cos(an), s=Math.sin(an);
    g.setTransform(m); g.transform(c,s,-s,c,ox+p.ax,oy+p.ay);
    if(p.t===5){ g.strokeStyle=fl?'#fff':p.col; g.lineWidth=p.r1*2; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.lineTo(len,0); g.stroke(); return; }
    const side=(-s*L[0]+c*L[1])<0?1:-1, rm=Math.max(p.r1,p.r2);
    g.fillStyle=fl?'#ffffff':t3Grad(p.col,Math.max(1,Math.round(rm*2)),side,1); g.beginPath();
    if(len<0.5) g.arc(0,0,rm,0,TAU); else if(p.cone){ g.moveTo(0,-p.r1); g.lineTo(len,0); g.lineTo(0,p.r1); g.arc(0,0,p.r1,Math.PI/2,Math.PI*1.5); }
    else{ const r1=p.r1, r2=p.r2, sn=clamp((r1-r2)/len,-0.95,0.95), al=Math.asin(sn); g.arc(0,0,r1,Math.PI/2+al,Math.PI*1.5-al); g.arc(len,0,r2,-Math.PI/2-al,Math.PI/2+al); }
    g.closePath(); g.fill(); }
  else if(p.t===2){ g.setTransform(m); const x=ox+p.ax, yb=oy+p.ay, yt=oy+p.by, r1=p.r1, r2=p.r2, e1=r1*T3.ct, e2=r2*T3.ct;
    g.translate(x,0); g.fillStyle=fl?'#fff':p.col; g.beginPath(); g.moveTo(-r1,yb); g.ellipse(0,yb,r1,e1,0,Math.PI,0,true); g.lineTo(r2,yt); g.ellipse(0,yt,r2,e2,0,0,Math.PI,true); g.closePath(); g.fill();
    if(!p.open){ g.fillStyle=fl?'#fff':(p.top||p.col); g.beginPath(); g.ellipse(0,yt,r2,e2,0,0,TAU); g.fill(); } }
  else if(p.t===3){ g.setTransform(m); g.fillStyle=fl?'#fff':p.col; const q=p.pts; g.beginPath(); g.moveTo(ox+q[0],oy+q[1]); for(let k=2;k<q.length;k+=2) g.lineTo(ox+q[k],oy+q[k+1]); g.closePath(); g.fill();
    if(p.edge){ g.strokeStyle=p.edge; g.lineWidth=0.8*T3R.k; g.lineJoin='round'; g.stroke(); } }
  else if(p.t===4){ g.setTransform(m); g.fillStyle=fl?'#fff':p.col; g.beginPath(); g.arc(ox+p.sx,oy+p.sy,p.r1,0,TAU); g.fill(); }
}

// ---------- which material each figure is made of
// A figure's default material (for the colours the table does not know, such as shaded variants); the main figures
// also get their own colour map, so every named colour of Ash, Pip, the dragons and Vorlaxis has its material.
const RF_TYPE=[
  [/^(wolf|greymane|f_rimehound|f_squeak|f_grumbo|f_grumblehorn|deer|rabbit|goat|sheep|cat|f_yeti|turtle0|m_mirrorimp|lakeking0)$/,'fur'],
  [/^(c_gull|f_frostfeather|crow|goose|birds|f_hush|f_hushfake|m_hushboss|n_echo_hush)$/,'feather'],
  [/moth|^c_silkspinner$|^c_gloomwing$|^m_umberwing$|^n_nyxara$/,'dust'],
  [/^(slime|m_moonjelly|m_octavia|c_gulper|gloamjaw)$/,'slime'],
  [/^(kobold|sneak|grizzlefang|f_snowgob|f_blubberton|m_sandshark|m_bigfin|m_puffington|c_brute)$/,'hide'],
  [/^(cultist|morrow|c_husher|c_saltbeard|n_echo_vesper|n_echo_vclone|c_mothclone)$/,'cloth'],
  [/^(drakeling|broodmother|eel|serpent|skrae|pip|hatchling|vorlaxis|m_sandshark0)$/,'scales'],
  [/^(knight|cindervane|c_tinman|f_rimeknight|n_inkknight|cinder|grey)$/,'metal'],
  [/^(c_tickbug|c_ram|c_ticktock|f_bellows|m_fanfare|m_zapp|c_bolt)$/,'brass'],
  [/^(crab|c_pinch|m_crabpirate|f_frostshell)$/,'chitin'],
  [/^(gust|f_squall|spirit)$/,'cloud'],
  [/^(bramble|gnarl|knot)$/,'bark'],
  [/^(egg|c_cocoon)$/,'shell'],
  [/^(f_shardling|f_glaciar|m_prism|n_frostshade|n_echo_glaciar|n_glasswing|m_glassscorp)$/,'ice'],
  [/^(f_rockjaw|m_gravelgut|f_stalagbat0)$/,'stone'],
  [/^(m_shade|n_shade|n_shade_wolf|n_shade_drake|n_echo_vor|c_shadowash|f_stalagbat)$/,'shade'],
  [/^(npc|brisket|juniper|duchess0)$/,'cloth'],
];
const RF_TD=new Map();
function rfTypeMat(type){ let v=RF_TD.get(type); if(v!==undefined) return v; v=null; for(const [re,m] of RF_TYPE) if(re.test(type)){ v=m; break; } RF_TD.set(type,v); return v; }
// colour maps for the main figures (built once, on first use)
const RF_MAPS={};
function rfPalMap(pal,rules,def){ const pairs=[]; for(const k in pal){ const v=pal[k]; let m=def; for(const [re,mm] of rules) if(re.test(k)){ m=mm; break; } if(m) pairs.push([v,m]); } return pairs; }
function rfFigMap(id){
  let M=RF_MAPS[id]; if(M!==undefined) return M; M=null;
  try{
    if(id==='ash'&&typeof ASHP!=='undefined'){ const R=[[/^(horn\d?|claw|bone)$/,'horn'],[/^(eye|pupil)$/,'gloss'],[/^cloak/,'cloth'],[/^(vest|vestD|belt|boot)$/,'leather'],[/^(gold|steel)$/,'metal'],[/^mem/,'membrane']];
      const pairs=rfPalMap(ASHP,R,'scales'); if(typeof ASHG!=='undefined') pairs.push(...rfPalMap(ASHG,R,'scales')); M=rfMap(pairs); }
    else if((id==='pip'||id==='hatchling')&&typeof PPAL!=='undefined'){ const R=[[/^(horn|spine)$/,'horn'],[/^wing/,'membrane'],[/^blush$/,'skin']];
      M=rfMap(rfPalMap(PPAL,R,'scales').concat(typeof HPAL!=='undefined'?rfPalMap(HPAL,R,'scales'):[])); }
    else if(id==='vorlaxis'&&typeof VX!=='undefined'){ M=rfMap(rfPalMap(VX,[[/^(plate|bone|boneD|claw|spike)$/,'horn'],[/^mem/,'membrane'],[/^(crack\d?|eye)$/,'glow'],[/^crackD$/,'glow'],[/^mouth$/,'gloss'],[/^belly$/,'hide']],'ember')); }
    else if(id==='goat'&&typeof GPAL!=='undefined') M=rfMap(rfPalMap(GPAL,[[/^(hoof|horn)$/,'horn'],[/^gold$/,'metal'],[/^nose$/,'skin']],'fur'));
    else if(id==='deer'&&typeof DPAL!=='undefined') M=rfMap(rfPalMap(DPAL,[[/^(hoof|antler)$/,'horn'],[/^nose$/,'gloss'],[/^inner$/,'skin']],'fur'));
    else if(id==='rabbit'&&typeof RPAL!=='undefined') M=rfMap(rfPalMap(RPAL,[[/^inner$/,'skin']],'fur'));
  }catch(e){ M=null; }
  RF_MAPS[id]=M; return M;
}
// people: the profile's colours say what each part is made of
function rfPersonMap(P){
  if(!P) return null; if(P._rfm) return P._rfm;
  const O=P.outfit, top=O==='armor'?'metal':O==='fur'?'fur':O==='vest'?'leather':'cloth', pairs=[];
  pairs.push([P.skin,'skin'],[P.hair,'hair'],[P.shoe,'leather'],[P.legs,'cloth'],[P.shirt,O==='armor'?'cloth':top],[P.low,O==='fur'?'fur':O==='vest'?'leather':'cloth'],[P.top,top],[P.sleeveL,top],[P.sleeveD,top],[P.trim,'cloth']);
  if(P.hand&&P.hand!==P.skin) pairs.push([P.hand,'cloth'],[P.handL,'cloth']); else if(P.handL) pairs.push([P.handL,'skin']);
  if(P.hatc) pairs.push([P.hatc,P.hat==='helm'||P.hat==='miner'?'metal':P.hat==='fur'?'fur':'cloth']);
  for(const q of [P.hood,P.scarf,P.scarfL,P.cape,P.shawl]) if(q) pairs.push([q,'cloth']);
  const o=P.o||{}; if(o.belt) pairs.push([o.belt,'leather']); if(o.bag) pairs.push([o.bag,'leather']); if(o.necklace) pairs.push([o.necklace,'metal']);
  return (P._rfm=rfMap(pairs));
}
// the figure being drawn sets its materials for the parts it makes (registries wrapped once, at load)
function rfWrapReg(reg,name){
  for(const k of Object.keys(reg)){ const f=reg[k]; if(typeof f!=='function'||f._rf) continue;
    const id=name==='X'?k:name==='B'?k:k, def=rfTypeMat(name==='X'&&k==='npc'?'npc':name==='X'&&k==='spirit'?'spirit':id);
    const lay=name==='X'&&k==='ash'?2:(name==='X'&&(k==='npc'||k==='spirit'))?0:1;
    const w=function(){ if(!LOOK.re) return f.apply(this,arguments);
      const s0=RF.fm, m0=RF.fmap, l0=RF.lay; RF.fm=def; RF.fmap=rfFigMap(id); RF.lay=lay;
      try{ return f.apply(this,arguments); } finally{ RF.fm=s0; RF.fmap=m0; RF.lay=l0; } };
    w._rf=true; reg[k]=w; }
}
try{ rfWrapReg(T3E,'E'); rfWrapReg(T3B,'B'); rfWrapReg(T3X,'X'); rfWrapReg(T3C,'C'); rfWrapReg(T3A,'A'); }catch(e){}
// people sprites: their own colour map while the sprite is baked (and textures always, a bake is cached)
function rfBakeBegin(P){ if(!LOOK.re) return; RF.bk0=RF.fmap; RF.bkd=RF.fm; RF.fmap=rfPersonMap(P&&P.skin?P:null)||RF.fmap; RF.fm=RF.fm||'cloth'; RF.bake=true; }
function rfBakeEnd(){ if(!RF.bake) return; RF.fmap=RF.bk0; RF.fm=RF.bkd; RF.bake=false; }
// one count per frame for the texture budget
{ const base=render; render=function(){ RF.fr++; RF.tn=0; RF.ln=0; return base.apply(this,arguments); }; }

// ================= effects in the Realistic look: fire, smoke, sparks, dust and splashes, projectiles, pickups
// Every effect keeps its place, size, colour, timing and hit box; only how it is painted changes. All of it is
// cached sprites drawn with drawImage (no gradient is made per frame), so a big fight stays light.
const RFX={soft:new Map(),glow:new Map(),str:new Map(),fire:null,ember:null,heart:null,coin:null,hglow:null,trail:[]};
// a soft round puff of one colour (smoke, dust, steam, splashes): normal blending
function rfxSoft(col){
  let s=RFX.soft.get(col); if(s) return s; if(RFX.soft.size>220) RFX.soft.clear();
  s=mkCanvas(32,32); const g=s.getContext('2d'), gr=g.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,`rgba(${col},1)`); gr.addColorStop(0.3,`rgba(${col},.82)`); gr.addColorStop(0.62,`rgba(${col},.34)`); gr.addColorStop(0.85,`rgba(${col},.08)`); gr.addColorStop(1,`rgba(${col},0)`);
  g.fillStyle=gr; g.fillRect(0,0,32,32); RFX.soft.set(col,s); return s;
}
// a light: a hot white middle in its own colour, falling off softly (drawn with 'lighter')
function rfxGlow(col){
  let s=RFX.glow.get(col); if(s) return s; if(RFX.glow.size>220) RFX.glow.clear();
  const c=col.split(',').map(Number), hot=`${Math.min(255,c[0]+70)},${Math.min(255,c[1]+70)},${Math.min(255,c[2]+70)}`;
  s=mkCanvas(32,32); const g=s.getContext('2d'), gr=g.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,`rgba(${hot},1)`); gr.addColorStop(0.18,`rgba(${col},.9)`); gr.addColorStop(0.45,`rgba(${col},.42)`); gr.addColorStop(0.75,`rgba(${col},.1)`); gr.addColorStop(1,`rgba(${col},0)`);
  g.fillStyle=gr; g.fillRect(0,0,32,32); RFX.glow.set(col,s); return s;
}
function rfxRGB(col){ let v=RFX.str.get(col); if(v) return v; if(RFX.str.size>300) RFX.str.clear(); v='rgb('+col+')'; RFX.str.set(col,v); return v; }
// flame sprites by temperature (0 cool red to 7 white hot): a bright core in a flame-shaped soft body
const RFX_FIRE=[[150,40,18,110,26,10],[196,66,22,150,40,14],[232,102,30,196,58,18],[250,140,44,232,86,24],[255,172,64,246,118,32],[255,204,104,255,150,46],[255,232,160,255,184,72],[255,250,226,255,214,120]];
function rfxFire(){
  if(RFX.fire) return RFX.fire; const out=[];
  for(const q of RFX_FIRE){ const s=mkCanvas(48,48), g=s.getContext('2d'), core=`${q[0]},${q[1]},${q[2]}`, mid=`${q[3]},${q[4]},${q[5]}`;
    const gr=g.createRadialGradient(24,27,0,24,24,24);
    gr.addColorStop(0,`rgba(${core},1)`); gr.addColorStop(0.22,`rgba(${core},.85)`); gr.addColorStop(0.46,`rgba(${mid},.5)`); gr.addColorStop(0.74,`rgba(${mid},.14)`); gr.addColorStop(1,`rgba(${mid},0)`);
    g.fillStyle=gr; g.beginPath(); g.moveTo(24,1); g.bezierCurveTo(38,14,46,26,44,34); g.bezierCurveTo(42,44,32,47,24,47); g.bezierCurveTo(16,47,6,44,4,34); g.bezierCurveTo(2,26,10,14,24,1); g.fill();
    out.push(s); }
  return (RFX.fire=out);
}
function rfxEmber(){ if(RFX.ember) return RFX.ember; const s=mkCanvas(16,16), g=s.getContext('2d'), gr=g.createRadialGradient(8,8,0,8,8,8); gr.addColorStop(0,'rgba(255,246,210,1)'); gr.addColorStop(0.25,'rgba(255,190,90,.9)'); gr.addColorStop(0.6,'rgba(255,110,30,.25)'); gr.addColorStop(1,'rgba(255,80,20,0)'); g.fillStyle=gr; g.fillRect(0,0,16,16); return (RFX.ember=s); }

// the particles: one pass of soft puffs (normal blending, behind), then the lights (fire, sparks, magic) added on top
function reParticles(){
  const P=G.particles, n=P.length; if(!n) return;
  const t=G.time, rm=typeof reduceMotion!=='undefined'&&reduceMotion, a0=ctx.globalAlpha;
  // 1. smoke, dust, steam and splashes, and the smoke that cooling fire leaves
  for(let i=0;i<n;i++){ const q=P[i], f=q.life/q.max;
    if(!q.glow){ const a=f*0.6*q.al*1.12; if(a<=0.004) continue; const r=q.size*1.42; ctx.globalAlpha=a0*Math.min(1,a); ctx.drawImage(rfxSoft(q.col),q.x-r,q.y-r,r*2,r*2); }
    else if(q.kind==='fire'&&f<0.4){ const u=(0.4-f)/0.4, r=q.size*(1.7+u*2.6); ctx.globalAlpha=a0*0.22*u*(1-u*0.5); ctx.drawImage(rfxSoft('62,54,50'),q.x-r,q.y-r-u*6,r*2,r*2); }
  }
  // 2. lights
  ctx.globalAlpha=a0; const pc=ctx.globalCompositeOperation; ctx.globalCompositeOperation='lighter';
  const FS=rfxFire(), EM=rfxEmber();
  for(let i=0;i<n;i++){ const q=P[i]; if(!q.glow) continue; const f=q.life/q.max;
    if(q.kind==='fire'){
      const a=Math.min(1,f*1.6)*0.85; if(a<=0.01) continue; const lv=clamp(Math.floor(f*8.4)-1,0,7), sp=Math.hypot(q.vx,q.vy)+1e-3, ux=q.vx/sp, uy=q.vy/sp;
      const r=q.size*(1.12+((i*37)%10)*0.03), fl=rm?0:Math.sin(t*23+i*1.7)*0.14, tall=1.25+(rm?0:Math.sin(t*17+i*2.3)*0.18);
      ctx.globalAlpha=a0*a*0.36; ctx.drawImage(FS[Math.max(0,lv-2)],q.x-r*1.3-ux*r*0.5,q.y-r*1.45-uy*r*0.5,r*2.6,r*2.6);   // the soft body behind
      ctx.globalAlpha=a0*a*0.85; ctx.drawImage(FS[lv],q.x-r*(1+fl),q.y-r*(2*tall-0.9),r*2*(1+fl),r*2*tall);              // the flame, licking upward
      if(f>0.62){ const c=r*0.5; ctx.globalAlpha=a0*a*0.7; ctx.drawImage(FS[7],q.x-c,q.y-c,c*2,c*2); }                   // a white hot heart
      if(i%5===0&&f<0.7&&f>0.08){ const e=1.6+q.size*0.18, ex=q.x+(rm?0:Math.sin(t*7+i)*3), ey=q.y-(1-f)*16; ctx.globalAlpha=a0*Math.min(1,f*1.8); ctx.drawImage(EM,ex-e*2,ey-e*2,e*4,e*4); }   // embers
    }else if(q.kind==='bfire'||q.kind==='moon'){
      const a=Math.min(1,f*1.6)*0.85; if(a<=0.01) continue; const r=q.size*1.6;
      ctx.globalAlpha=a0*a*0.6; ctx.drawImage(rfxGlow(q.col),q.x-r*1.4,q.y-r*1.5,r*2.8,r*2.8);
      ctx.globalAlpha=a0*a; ctx.drawImage(rfxGlow(q.col),q.x-r*0.8,q.y-r*0.9,r*1.6,r*1.6);
    }else{
      const a=f*(q.al!=null?q.al:1); if(a<=0.01) continue; const sp=Math.hypot(q.vx,q.vy), L=Math.min(12,sp*0.03);
      if(L>1.6){ ctx.globalAlpha=a0*Math.min(1,a); ctx.strokeStyle=rfxRGB(q.col); ctx.lineWidth=Math.max(0.6,q.size*0.85); ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(q.x-q.vx/sp*L,q.y-q.vy/sp*L); ctx.stroke(); }
      const r=q.size*(L>1.6?1.9:1.5); ctx.globalAlpha=a0*Math.min(1,a)*(L>1.6?0.55:1); ctx.drawImage(rfxGlow(q.col),q.x-r,q.y-r,r*2,r*2);
    }
  }
  ctx.globalCompositeOperation=pc; ctx.globalAlpha=a0;
}
// projectiles: a soft trail along their flight, a glow, a hot core; fire licks, an ice shard, a turning magic orb
function reProjectiles(){
  const t=G.time, pc=ctx.globalCompositeOperation, a0=ctx.globalAlpha;
  for(const pr of G.projectiles){
    if(pr.kind==='wave'&&!pr.reflected){ ctx.globalCompositeOperation='lighter';
      ctx.save(); ctx.translate(pr.x,pr.y); ctx.rotate(Math.atan2(pr.vy,pr.vx)); const la=clamp(pr.life*2,0,1);
      ctx.strokeStyle=`rgba(255,150,60,${0.35*la})`; ctx.lineWidth=12; ctx.beginPath(); ctx.arc(-10,0,26,-1.1,1.1); ctx.stroke();
      ctx.strokeStyle=`rgba(255,170,70,${la})`; ctx.lineWidth=6; ctx.stroke(); ctx.strokeStyle='rgba(255,244,214,.9)'; ctx.lineWidth=2.2; ctx.stroke(); ctx.restore(); continue; }
    let c1='255,120,40', c2='255,240,190', kind='fire';
    if(pr.kind==='pip'){ c1='255,150,60'; c2='255,240,200'; } else if(pr.owner==='player'){ c1='120,220,255'; c2='255,255,255'; kind='bolt'; } else if(pr.kind==='orb'){ c1='190,100,255'; c2='255,220,255'; kind='orb'; } else if(pr.kind==='ice'){ c1='160,210,255'; c2='240,250,255'; kind='ice'; }
    const r=pr.r*(pr.kind==='orb'?1+0.15*Math.sin(pr.t*12):1)*2.4, sp=Math.hypot(pr.vx||0,pr.vy||0)+1e-3, ux=(pr.vx||0)/sp, uy=(pr.vy||0)/sp, G1=rfxGlow(c1), G2=rfxGlow(c2);
    ctx.globalCompositeOperation='lighter';
    for(let j=3;j>=1;j--){ const d=j*r*0.42, rr=r*(1-j*0.18); ctx.globalAlpha=a0*(0.32-j*0.07); ctx.drawImage(G1,pr.x-ux*d-rr,pr.y-uy*d-rr,rr*2,rr*2); }
    ctx.globalAlpha=a0*0.95; ctx.drawImage(G1,pr.x-r,pr.y-r,r*2,r*2);
    const c=r*0.46; ctx.globalAlpha=a0; ctx.drawImage(G2,pr.x-c,pr.y-c,c*2,c*2);
    if(kind==='fire'){ const FS=rfxFire(); for(let j=0;j<2;j++){ const ph=t*17+j*2.4+pr.x*0.01, ox=Math.sin(ph)*r*0.22-ux*r*0.3, oy=Math.cos(ph*1.3)*r*0.18-uy*r*0.3, s=r*0.62; ctx.globalAlpha=a0*0.7; ctx.drawImage(FS[5-j*2],pr.x+ox-s,pr.y+oy-s*1.1,s*2,s*2); } }
    else if(kind==='orb'){ for(let j=0;j<2;j++){ const ph=t*6+j*Math.PI, ox=Math.cos(ph)*r*0.34, oy=Math.sin(ph)*r*0.2, s=r*0.2; ctx.globalAlpha=a0*0.9; ctx.drawImage(G2,pr.x+ox-s,pr.y+oy-s,s*2,s*2); } }
    if(kind==='ice'){ ctx.globalCompositeOperation=pc; ctx.globalAlpha=a0*0.95; const a=Math.atan2(uy,ux), L=pr.r*1.7, w=pr.r*0.7;
      ctx.save(); ctx.translate(pr.x,pr.y); ctx.rotate(a); ctx.fillStyle='#e6f6ff'; ctx.beginPath(); ctx.moveTo(L,0); ctx.lineTo(0,-w); ctx.lineTo(-L*0.7,0); ctx.lineTo(0,w); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#9fd2f4'; ctx.beginPath(); ctx.moveTo(L,0); ctx.lineTo(0,w); ctx.lineTo(-L*0.7,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillRect(-L*0.2,-w*0.35,L*0.6,w*0.22); ctx.restore(); }
  }
  ctx.globalCompositeOperation=pc; ctx.globalAlpha=a0;
}
// shock rings (the roar, slams, blasts): a soft band of light and kicked-up air under the ring the old code draws next
function reRings(){
  const pc=ctx.globalCompositeOperation; ctx.globalCompositeOperation='lighter';
  for(const R of G.rings){ if(R.delay>0) continue; const a=clamp(1-R.rad/R.max,0,1); if(a<=0.01) continue;
    const col=R.owner==='player'?'255,190,110':R.dmg>0?'255,90,40':'255,170,90';
    ctx.strokeStyle=`rgba(${col},${(0.16*a).toFixed(3)})`; ctx.lineWidth=(R.thick||4)*2.6+8*a; ctx.beginPath(); ctx.arc(R.x,R.y,R.rad,0,TAU); ctx.stroke(); }
  ctx.globalCompositeOperation=pc;
}
// a shock ring on the ground (the hammer's slam): soft dust kicked up along its edge, settling as it spreads
function reRingDust(f,k,r,a){
  const S=rfxSoft('150,130,104'), n=14, a0=ctx.globalAlpha;
  for(let i=0;i<n;i++){ const b=i/n*TAU+(f.x*0.013+f.y*0.007), j=((i*37)%7)/7, rr=r*(0.92+j*0.16), s=(4+j*5)*(0.6+k*0.9);
    ctx.globalAlpha=a0*0.3*a*(0.6+j*0.4); ctx.drawImage(S,f.x+Math.cos(b)*rr-s,f.y+Math.sin(b)*rr*0.92-s-k*4,s*2,s*2); }
  ctx.globalAlpha=a0;
}
// pickups: a glossy heart of the same red with a soft glow, coins as spinning gold coins that catch the light
function rfxHeart(){
  if(RFX.heart) return RFX.heart; const S=64, c=mkCanvas(S,S), g=c.getContext('2d'), s=22, x=32, y=31;
  const hp=()=>{ g.beginPath(); g.moveTo(x,y+s*0.9); g.bezierCurveTo(x-s*1.2,y+s*0.1,x-s*0.6,y-s*0.9,x,y-s*0.3); g.bezierCurveTo(x+s*0.6,y-s*0.9,x+s*1.2,y+s*0.1,x,y+s*0.9); g.closePath(); };
  let gr=g.createRadialGradient(x-s*0.4,y-s*0.35,s*0.1,x,y,s*1.25); gr.addColorStop(0,'#ff8a96'); gr.addColorStop(0.35,'#ff4d63'); gr.addColorStop(0.8,'#c81e38'); gr.addColorStop(1,'#8a0f22');
  hp(); g.fillStyle=gr; g.fill();
  g.save(); hp(); g.clip(); gr=g.createLinearGradient(0,y+s*0.2,0,y+s); gr.addColorStop(0,'rgba(255,120,140,0)'); gr.addColorStop(1,'rgba(255,150,160,.45)'); g.fillStyle=gr; g.fillRect(0,0,S,S);   // light through the glass at the bottom
  g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x-s*0.42,y-s*0.28,s*0.2,s*0.12,-0.7,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x+s*0.36,y-s*0.3,s*0.12,s*0.07,0.6,0,TAU); g.fill(); g.restore();
  hp(); g.strokeStyle='rgba(110,10,28,.75)'; g.lineWidth=1.6; g.stroke();
  return (RFX.heart=c);
}
function rfxCoin(){
  if(RFX.coin) return RFX.coin; const S=48, c=mkCanvas(S,S), g=c.getContext('2d'), r=20;
  let gr=g.createRadialGradient(24-r*0.4,24-r*0.45,r*0.1,24,24,r); gr.addColorStop(0,'#fff4b8'); gr.addColorStop(0.35,'#ffd84a'); gr.addColorStop(0.8,'#d89a22'); gr.addColorStop(1,'#8a5a12');
  g.fillStyle=gr; g.beginPath(); g.arc(24,24,r,0,TAU); g.fill();
  g.strokeStyle='rgba(120,74,14,.8)'; g.lineWidth=2.4; g.beginPath(); g.arc(24,24,r*0.72,0,TAU); g.stroke();
  g.strokeStyle='rgba(255,246,200,.55)'; g.lineWidth=1.4; g.beginPath(); g.arc(24,24,r*0.72,Math.PI*1.05,Math.PI*1.7); g.stroke();
  g.fillStyle='rgba(150,98,20,.55)'; g.beginPath(); g.arc(24,24,r*0.34,0,TAU); g.fill(); g.fillStyle='rgba(255,236,160,.5)'; g.beginPath(); g.arc(22.6,22.6,r*0.18,0,TAU); g.fill();
  g.strokeStyle='rgba(90,56,10,.7)'; g.lineWidth=1.2; g.beginPath(); g.arc(24,24,r-0.6,0,TAU); g.stroke();
  return (RFX.coin=c);
}
function rePickups(){
  const H=rfxHeart(), C=rfxCoin(), a0=ctx.globalAlpha;
  for(const k of G.pickups){
    if(k.life<3&&Math.floor(k.life*8)%2===0) continue;
    const s=(k.big?10:7)*(1+0.12*Math.sin(k.t*6)), y=k.y-4+Math.sin(k.t*4)*2;
    ctx.globalAlpha=a0*0.2; ctx.drawImage(rfxSoft('0,0,0'),k.x-s*0.9,k.y+s*0.55,s*1.8,s*0.7);   // its shadow on the ground below
    ctx.globalAlpha=a0;
    if(k.coin){
      const w=Math.abs(Math.cos(k.t*5))*0.82+0.18, R=s*0.95;
      ctx.drawImage(rfxGlow('255,200,80'),k.x-R*2,y-R*2,R*4,R*4);
      ctx.drawImage(C,k.x-R*w,y-R,R*2*w,R*2);
      const tw=(Math.sin(k.t*3.1+k.x)*0.5+0.5); if(tw>0.7){ ctx.globalAlpha=a0*(tw-0.7)/0.3; pStar(ctx,k.x-R*0.35*w,y-R*0.45,R*0.55,'#fffbe8'); ctx.globalAlpha=a0; }
    }else{
      const pc=ctx.globalCompositeOperation; ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a0*0.55; ctx.drawImage(rfxGlow('255,70,90'),k.x-s*2.6,y-s*2.6,s*5.2,s*5.2); ctx.globalCompositeOperation=pc; ctx.globalAlpha=a0;
      const q=s/22; ctx.drawImage(H,k.x-32*q,y-31*q,64*q,64*q);
    }
  }
  ctx.globalAlpha=a0;
}

// ---------- debug: a sheet of figures at a big zoom, drawn on the main canvas (tests only)
function figSheet(o){
  o=o||{}; const z=o.zoom||3, cw=o.cw||52, ch=o.ch||60, items=o.items||[], cols=o.cols||8, rows=Math.ceil(items.length/cols);
  const ow=cvs.width, oh=cvs.height, Wc=Math.ceil(cols*cw*z), Hc=Math.ceil(rows*ch*z);
  cvs.width=Wc; cvs.height=Hc; ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=o.bg||'#5e7440'; ctx.fillRect(0,0,Wc,Hc);
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if((r+c)%2){ ctx.fillStyle=o.bg2||'#647a46'; ctx.fillRect(c*cw*z,r*ch*z,cw*z,ch*z); }
  const errs=[];
  items.forEach((it,i)=>{
    const x=(i%cols+0.5)*cw, y=Math.floor(i/cols)*ch+ch*0.7;
    ctx.setTransform(z,0,0,z,0,0);
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y,9,3.6,0,0,TAU); ctx.fill();
    try{ figSheetOne(it,x,y); }catch(err){ errs.push(String(it.k||it.type)+': '+err.message); }
    ctx.setTransform(z,0,0,z,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='5px sans-serif'; ctx.textAlign='left'; ctx.fillText(String(it.label||it.type||it.k).slice(0,18),(i%cols)*cw+1.5,Math.floor(i/cols)*ch+6);
  });
  const url=cvs.toDataURL(); cvs.width=ow; cvs.height=oh; return {url,errs};
}
function figSheetOne(it,x,y){
  const face=it.face!=null?it.face:Math.PI/2;
  if(it.k==='ash'){
    const p=player, keep={x:p.x,y:p.y,facing:p.facing,moving:p.moving,walkT:p.walkT,hurtFlash:p.hurtFlash,iframes:p.iframes,_vf:p._vf,_vft:p._vft};
    p.x=x; p.y=y-6; p.facing=face; p._vf=face; p._vft=G.time; p.moving=!!it.walk; p.walkT=it.walk||0; p.hurtFlash=it.flash?1:0; p.iframes=0;
    try{ ashDraw(ctx,p,x,y,{z:0,alpha:1,flash:!!it.flash}); } finally { Object.assign(p,keep); }
  }else if(it.k==='pip'){
    const q={x,y:y-6,face,cd:0,chirp:0,t:1}; T3B.pip(q);
  }else if(it.k==='npc'){
    const c=CASTBY[it.id]||SPECIAL[it.id]; if(!c) return; const n=mkNPC(c,x,y-6); n.face=face; n.t=1.2; n._vf=face; n._ht=0; n._wk=0;
    T3X.npc(n);
  }else if(it.k==='beast'){
    const f=T3B[it.type]; if(!f) return; const n={x,y:y-6,face,t:1.3,kind:it.type,r:10,dx:0,dy:0,state:'idle'}; Object.assign(n,it.o||{}); f(n,G.time);
  }else{
    const type=it.type, r0=EDEF[type]?EDEF[type].r:14;
    const e=Object.assign({type,r:r0,t:1.3,state:'chase',st:0.2,dx:0,dy:0,speed:EDEF[type]?EDEF[type].speed:100,alpha:1,hp:100,maxHp:100,stun:0,cd:1,tint:null,elite:false,swung:0,blocking:false,snap:0,cheeks:0,_wp:0,_wa:0},it.o||{});
    e.face=face; e._vf=face; e._ps=e.state; e.x=x; e.y=y-e.r*0.45;
    const f=T3E[type]; if(f) f(e,!!it.flash);
  }
}
window.__ebDbg=Object.assign(window.__ebDbg||{},{figSheet,RF,RFM,rfMat,figStats:()=>Object.assign({fr:RF.fr,tn:RF.tn,gc:RF.gc.size},RF.stats)});
