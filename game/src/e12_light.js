
// ================= e12_light: the Realistic look's light, shadows and air (v12 wave 10, LIGHT)
// Realistic draws the world through the Classic paths (LOOK.sb false) and this module puts real light over it:
//  * a time of day grade on a smooth curve (the base of ambientTint in a9a_env.js is reAmbient here): dawn gold and
//    pink, a clear morning, a neutral noon, a warm afternoon, dusk orange then violet, a deep blue moonlit night that is
//    brighter or darker with the moon; each biome adds its own air (reAir)
//  * a coloured light map at reduced resolution laid over the frame with multiply (drawLights in a11_render.js calls
//    reLights): the dark is tinted, and every light adds its own colour (`col`, or `kind` from RL_KC; entries without
//    one get a kind here), fire flickers; Ash's flame, Pip, projectiles, pools, burning foes and lava glows light the
//    ground; bright sources get a soft bloom
//  * sun and moon shadows from reSun(): the soft cached shadow layer (shadowLayer in a11c_depth.js) for trees, houses
//    and structures in every depth mode, a cast shadow per figure and a darker contact shadow under the feet
//  * figures take the light at their feet: a small bump of the strongest nearby light's colour on their lit side and a
//    cool moon side at night; foes and pickups get a faint lift so they never sink into the dark
//  * atmosphere: dappled light in the woods, haze in the mire and on cold mornings, heat shimmer near lava, sunbeams
//    and dust motes in houses, wet glints in the rain, a brighter and bluer light on snow
//  * RLQ, an automatic quality step: when frames run long the light map resolution, the bloom and the air layers step
//    down, and they climb back when there is room
// The UI keeps the Storybook style in Realistic: lookUI (section 1). Function declarations only, so earlier modules
// may call into this file at any time; all state is created lazily.

// ---------- 1. the UI keeps the Storybook style in Realistic
// lookUI(fn): while fn draws, LOOK.sb reads true (LOOK.re stays true). Nested calls pass straight through. The world
// tests in e5_look.js use sbW() (Storybook only), so a world cache that happens to be built inside a UI call still
// takes the Realistic path. __ebX.light.audit(true) lists every canvas made while the UI draws (see the notes).
function lookUI(fn){
  if(typeof fn!=='function'||fn._lookUI) return fn;
  const w=function(){
    if(!LOOK.re||LOOK.sb) return fn.apply(this,arguments);
    LOOK.sb=true; LOOK.uiN++;
    try{ return fn.apply(this,arguments); } finally{ LOOK.uiN--; if(LOOK.re) LOOK.sb=false; }
  };
  w._lookUI=true; return w;
}
// the UI draw calls: the HUD (vitals, minimap, banners, prompts, touch buttons, the case book chip, the act HUDs that
// wrap drawHUD), the dialogue portraits, item icons (HUD and every DOM panel), the map screen and its fog, the title
try{ drawHUD=lookUI(drawHUD); }catch(e){}
try{ drawPortrait=lookUI(drawPortrait); portraitGet=lookUI(portraitGet); }catch(e){}
try{ drawItemIcon=lookUI(drawItemIcon); }catch(e){}
try{ drawMapScreen=lookUI(drawMapScreen); mapHdFogJob=lookUI(mapHdFogJob); mapHdFogReady=lookUI(mapHdFogReady); mapHdFogIdle=lookUI(mapHdFogIdle); }catch(e){}
try{ ttlFrame=lookUI(ttlFrame); }catch(e){}

// ---------- 2. light kinds: the colour of each kind, how it flickers, how much it blooms
const RL_KC={fire:[255,146,58],lamp:[255,184,108],window:[255,186,100],moon:[140,170,255],magic:[128,164,255],lava:[255,92,32],
  shroom:[60,226,190],ember:[255,116,42],crystal:[146,206,255],cold:[150,206,255],glow:[255,212,160],sun:[255,236,200]};
const RL_FLICK={fire:2,ember:2,cold:2,lamp:1,lava:3,magic:4,crystal:4,shroom:4};
const RL_BLOOM={fire:1,ember:0.9,cold:0.9,lamp:0.85,window:0.55,lava:0.8,magic:0.7,crystal:0.7,shroom:0.75,glow:0.4,moon:0.3,sun:0};
const RL_TINT={crystal:'crystal',shroom:'shroom',lamp:'lamp',magma:'lava',icicle:'crystal',fern:'shroom',shell:'magic',chime:'magic',ember:'ember',lava:'lava'};
// the kind of a light entry (LIGHTS or AREA.lights): its own `kind`, else one worked out once from its flags (and
// written back as `kind`, so the entry carries it); a ward is fire once lit and magic before
function lightKindOf(L){
  if(L.kind&&RL_KC[L.kind]) return L.kind;
  if(L.ward) return G&&G.wards&&G.wards[L.ward]?'fire':'magic';
  if(L._lk) return L._lk;
  let k='glow'; const ok=L.obj&&L.obj.k?String(L.obj.k):'';
  if(L.win) k='window'; else if(L.lava) k='lava'; else if(L.shrine||L.trialGate) k='magic'; else if(L.shroom) k='shroom'; else if(L.ore) k='crystal';
  else if(L.lantern||L.lamp||L.lh||L.mlamp) k='lamp'; else if(L.cold) k='cold';
  else if(L.tint&&RL_TINT[L.tint]) k=RL_TINT[L.tint];
  else if(/lamp|lantern|lpod/.test(ok)) k='lamp'; else if(/crys/.test(ok)) k='crystal';
  else if(L.fire) k='fire';
  L._lk=k; if(!L.kind) L.kind=k;
  return k;
}
function lightColOf(L,k){ return L.col&&L.col.length===3?L.col:RL_KC[k]||RL_KC.glow; }
// every entry that exists at load gets its kind now (later ones get it the first time they are lit)
try{ for(const L of LIGHTS) if(!L.ward) lightKindOf(L); }catch(e){}

// ---------- 3. small helpers and state
const RLS={shN:0,shMs:0,shMax:0,cv:null,g:null,w:0,h:0,list:[],figs:[],spr:new Map(),cap:null,blob:null,dap:null,fog:null,beam:null,shim:null,
  amb:[255,255,255],base:[255,255,255],N:0,air:null,airT:-1,airG:null,ambT:-1,ambG:null,ambC:null,ms:0,frames:0,last:null};
function rlSS(e0,e1,x){ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); }
function rlLum(c){ return 0.299*c[0]+0.587*c[1]+0.114*c[2]; }
function rlRain(){ return AREA||!G?0:G.rainK*(player&&player.y>WALL_Y?1:0); }
// the moon's light: 1 at full moon, lower as it is eaten (the story's moon, e7b_threads.js), 1 outside the story
function rlMoonK(){ try{ if(G&&G.mode==='story'&&typeof moonLeft==='function') return 0.35+0.65*clamp(moonLeft()/100,0,1); }catch(e){} return 1; }
function rlNight(){ return 1-daylight(); }
// a soft radial light sprite in one colour (64 px, a falloff that reads like a real lamp: bright core, long soft tail)
function rlSpr(c){
  const key=(c[0]|0)+','+(c[1]|0)+','+(c[2]|0); let s=RLS.spr.get(key); if(s) return s;
  if(RLS.spr.size>80) RLS.spr.clear();
  s=mkCanvas(64,64); const g=s.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32);
  for(const [u,a] of [[0,1],[0.1,0.86],[0.28,0.52],[0.5,0.25],[0.72,0.08],[1,0]]) gr.addColorStop(u,`rgba(${key},${a})`);
  g.fillStyle=gr; g.fillRect(0,0,64,64); RLS.spr.set(key,s); return s;
}
// the shadow sprites, in a cool blue-black (outdoor shadows are lit by the sky): a cast capsule (dense at the feet,
// softer and lighter toward its far end) and a tight contact blob
const RL_SHC=[8,12,30];
function rlCap(){
  if(RLS.cap) return RLS.cap;
  const W=96, H=32, c=mkCanvas(W,H), g=c.getContext('2d'), im=g.createImageData(W,H), d=im.data;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const u=(x+0.5)/W, v=((y+0.5)/H-0.5)*2, w=1-0.35*u, vv=Math.abs(v)/w;
    let a=vv>=1?0:Math.pow(1-vv*vv,1.4); a*=u<0.12?rlSS(0,0.12,u)*0.6+0.4:1; a*=1-rlSS(0.35,1,u)*0.92;
    const i=(y*W+x)*4; d[i]=RL_SHC[0]; d[i+1]=RL_SHC[1]; d[i+2]=RL_SHC[2]; d[i+3]=Math.round(255*a);
  }
  g.putImageData(im,0,0); return (RLS.cap=c);
}
function rlBlob(){
  if(RLS.blob) return RLS.blob;
  const c=mkCanvas(64,64), g=c.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32), s=RL_SHC.join(',');
  gr.addColorStop(0,`rgba(${s},.95)`); gr.addColorStop(0.45,`rgba(${s},.7)`); gr.addColorStop(0.75,`rgba(${s},.25)`); gr.addColorStop(1,`rgba(${s},0)`);
  g.fillStyle=gr; g.fillRect(0,0,64,64); return (RLS.blob=c);
}
// how tall a figure stands (world px), for its cast shadow
function rlFigH(e){ if(e===player) return 40; if(e.kind) return 42; if(e.boss) return (e.r||30)*2.2; return Math.max(16,(e.r||12)*2.2); }

// ---------- 4. the sun and the moon
// reSun() -> {dx,dy,len,col,amb,a,moon,el}: (dx,dy) is how far the shadow of a point one world px high falls (world
// px per px of height), len its length, col the sun or moon light, amb the ambient (the last grade), a the shadow
// strength (0 when the light is too low or too faint). The sun rises at 0.215 and sets at 0.785: its shadows sweep
// from the west (pointing down left) through short ones falling toward the camera at noon (with the art light from the
// upper left) to long ones pointing east at dusk; the moon does the same across the night, faint, and fainter as it
// is eaten. Rain clouds soften both.
const RL_SUN={t:-1,g:null,rk:-1,o:{dx:0.04,dy:0.32,len:0.32,col:[255,248,236],amb:[255,255,255],a:0.34,moon:false,el:1}};
function reSun(){
  // the time is taken in steps of 1/300 of a day (under two seconds), so the cached shadow layer is redrawn at most
  // that often while the sun moves (and the rain in steps of 1/20)
  const t=G?Math.round(G.tod*300)/300:0.35, o=RL_SUN.o, rk=Math.round(rlRain()*20)/20; if(RL_SUN.t===t&&RL_SUN.g===G&&RL_SUN.rk===rk) return o;
  RL_SUN.t=t; RL_SUN.g=G; RL_SUN.rk=rk;
  const D=Math.PI/180; let phi, len, a, col, el, moon=false;
  if(t>=0.215&&t<=0.785){ const u=(t-0.215)/0.57; el=Math.sin(u*Math.PI); phi=(150-135*u)*D; len=Math.min(2.6,0.42+2.2*Math.pow(1-el,2));
    a=0.38*rlSS(0,0.24,el)/(1+0.16*len); col=mixRGB([255,166,108],[255,248,236],rlSS(0.05,0.62,el)); if(t<0.5) col=mixRGB(col,[255,158,150],(1-rlSS(0,0.32,el))*0.45); }
  else{ moon=true; const v=clamp(((t-0.785+1)%1)/0.43,0,1); el=Math.sin(v*Math.PI); phi=(150-135*v)*D; len=Math.min(2.2,0.55+1.5*Math.pow(1-el,2));
    a=0.13*rlMoonK()*rlSS(0,0.3,el); col=mixRGB([150,170,240],[176,196,255],rlMoonK()); }
  a*=1-0.65*rk;
  o.dx=Math.cos(phi)*len; o.dy=Math.sin(phi)*len; o.len=len; o.a=a; o.col=col; o.moon=moon; o.el=el; o.amb=RLS.amb;
  return o;
}

// ---------- 5. the grade: a smooth curve through the day (Catmull-Rom through these keys; 255 leaves a colour as it is)
const RL_KEYS=[[0,[58,72,118]],[0.18,[61,74,118]],[0.212,[84,84,134]],[0.242,[192,142,154]],[0.272,[255,200,164]],[0.315,[252,232,212]],
  [0.38,[240,245,252]],[0.5,[255,255,253]],[0.615,[255,247,230]],[0.688,[255,228,190]],[0.732,[255,194,140]],[0.766,[212,142,150]],
  [0.795,[122,102,158]],[0.835,[72,82,130]]];
function reGradeTod(t){
  const K=RL_KEYS, n=K.length; t=((t%1)+1)%1;
  let i=n-1; for(let j=0;j<n;j++){ if(K[j][0]<=t) i=j; else break; }
  const at=j=>{ const q=((j%n)+n)%n, w=Math.floor(j/n); return [K[q][0]+w,K[q][1]]; };
  const p0=at(i-1), p1=at(i), p2=at(i+1), p3=at(i+2), u=clamp((t-p1[0])/(p2[0]-p1[0]),0,1), u2=u*u, u3=u2*u, out=[0,0,0];
  for(let c=0;c<3;c++){ const a=p0[1][c], b=p1[1][c], d=p2[1][c], e=p3[1][c];
    out[c]=clamp(0.5*((2*b)+(-a+d)*u+(2*a-5*b+4*d-e)*u2+(-a+3*b-3*d+e)*u3),0,255); }
  return out;
}
// the air of each place: mul (a grade multiplier), haze (colour and alpha, laid over with screen), dap (dappled light
// through leaves), shim (heat shimmer), snow (snow light: brighter and bluer, brighter nights), salt (bright coast),
// silver (silver nights), warm (a warm night glow from the ground: the volcano)
const RL_AIR0=[
  {mul:[1,1,1]},                                                                         // 0 the Southern Meadows
  {mul:[0.9,0.98,0.86],haze:[150,190,140],ha:0.035,dap:1},                               // 1 Whisperwood
  {mul:[1,0.95,0.88],haze:[205,176,150],ha:0.06},                                        // 2 the Ashen Road: dust
  {mul:[0.98,0.96,0.95],haze:[200,196,200],ha:0.03},                                     // 3 the Drakeling Crags
  {mul:[1.04,0.9,0.78],haze:[255,128,70],ha:0.07,shim:1,warm:1},                         // 4 the Cinderlands
  {mul:[0.95,1,1.08],haze:[226,236,252],ha:0.05,snow:1},                                 // 5 the Frostpine Highlands
  {mul:[0.86,0.94,0.84],haze:[160,182,150],ha:0.13,dap:0.25,mist:1}];                    // 6 the Mirefen
const RL_AIRM={coast:{mul:[1.02,1.02,1],haze:[232,242,252],ha:0.022,salt:1},frost:{mul:[0.95,1,1.08],haze:[226,236,252],ha:0.05,snow:1},
  moon:{mul:[0.97,0.98,1.03],haze:[200,206,236],ha:0.03,silver:1},nightfall:{mul:[0.93,0.9,1],haze:[168,128,176],ha:0.06,silver:0.4}};
const RL_AIRN={mul:[1,1,1],haze:[0,0,0],ha:0,dap:0,shim:0,snow:0,salt:0,silver:0,warm:0,mist:0};
function rlAirMix(o,A,w){
  if(!A||w<=0) return;
  const m=A.mul||[1,1,1]; for(let c=0;c<3;c++) o.mul[c]+=(m[c]-1)*w;
  if(A.ha){ const t=o.ha+A.ha*w; for(let c=0;c<3;c++) o.haze[c]=t>0?(o.haze[c]*o.ha+A.haze[c]*A.ha*w)/t:A.haze[c]; o.ha=t; }
  for(const f of ['dap','shim','snow','salt','silver','warm','mist']) if(A[f]) o[f]+=A[f]*w;
}
const RL_BI={};
function reAir(){
  if(RLS.airT===(G?G.time:0)&&RLS.airG===G&&RLS.air) return RLS.air;
  RLS.airT=G?G.time:0; RLS.airG=G;
  const o=RLS.air||(RLS.air={mul:[1,1,1],haze:[0,0,0]}); o.mul[0]=o.mul[1]=o.mul[2]=1; o.haze[0]=o.haze[1]=o.haze[2]=0; o.ha=0; o.dap=o.shim=o.snow=o.salt=o.silver=o.warm=o.mist=0;
  if(!G||!player||AREA) return o;
  const k=curMap();
  if(!k){ biomeInfo(player.x,player.y,RL_BI); const b=RL_BI.b|0, b2=RL_BI.b2|0, w=clamp(RL_BI.t==null?1:RL_BI.t,0.5,1);
    rlAirMix(o,RL_AIR0[b],w); if(b2!==b) rlAirMix(o,RL_AIR0[b2],1-w);
    const rg=G.region&&G.region.key; if(rg==='lodge'||rg==='frost'||rg==='farm'){ if(o.snow<0.8) rlAirMix(o,RL_AIR0[5],0.8-o.snow); }
    if(rg==='mire'||rg==='mosshut'){ if(o.mist<0.9) rlAirMix(o,RL_AIR0[6],0.9-o.mist); }
    return o; }
  const M=MAPS[k]; rlAirMix(o,M&&RL_AIRM[M.id],1);
  const a=ambHere(); if(a){
    if(a.snow) o.snow=Math.max(o.snow,a.snow);
    if(a.mist||a.n4mist){ const m=Math.max(a.mist||0,a.n4mist||0); rlAirMix(o,{mul:[0.94,0.97,0.94],haze:a.n4mist?[176,150,186]:[176,192,178],ha:0.12},m); o.mist+=m; }
    if(a.embers||a.n4emb) rlAirMix(o,{mul:[1.03,0.94,0.86],haze:[255,140,80],ha:0.05,warm:0.6},Math.max(a.embers||0,a.n4emb||0));
    if(a.shimmer) o.shim=Math.max(o.shim,a.shimmer*0.6);
    if(a.waves||a.gulls) o.salt=Math.max(o.salt,Math.max(a.waves||0,a.gulls||0)*0.7);
  }
  return o;
}
// the ambient light outdoors: the grade at this time, the moon, the air of the place, the rain (ambientTint's base)
function reAmbient(){
  if(RLS.ambT===(G?G.time:0)&&RLS.ambG===G&&RLS.ambC&&RLS.ambTod===(G?G.tod:0)) return RLS.ambC.slice();
  const t=G?G.tod:0.35, n=rlNight(), A=reAir(); let c=reGradeTod(t);
  if(n>0){ const m=rlMoonK(); for(let i=0;i<3;i++) c[i]*=1+n*(m-0.7)*0.4; }
  for(let i=0;i<3;i++) c[i]*=A.mul[i];
  if(A.silver>0&&n>0) c=mixRGB(c,[104,112,148],n*0.45*Math.min(1,A.silver));
  // snow light: a touch bluer and brighter by day; at night the snow throws the moonlight back, a brighter silver blue
  if(A.snow>0){ const s=Math.min(1,A.snow); c=mixRGB(c,[Math.min(255,c[0]*0.96+6),Math.min(255,c[1]*1.0+8),Math.min(255,c[2]*1.06+14)],s);
    if(n>0){ const l=rlLum(c); c=mixRGB(c,[l*1.08,l*1.16,l*1.36],0.4*n*s); for(let i=0;i<3;i++) c[i]*=1+0.14*n*s; } }
  if(A.warm>0&&n>0) c=mixRGB(c,[c[0]*1.35+18,c[1]*1.05+6,c[2]*0.9],n*Math.min(1,A.warm)*0.6);
  const rk=rlRain(); if(rk>0) c=[c[0]*(1-0.2*rk),c[1]*(1-0.17*rk),c[2]*(1-0.11*rk)];
  for(let i=0;i<3;i++) c[i]=clamp(c[i],0,255);
  RLS.ambT=G?G.time:0; RLS.ambG=G; RLS.ambTod=t; RLS.ambC=c; RLS.amb=c; return c.slice();
}

// ---------- 6. the automatic quality step: 0 full, 1 lighter light map and no shimmer or fog banks, 2 no bloom halos,
// no dapple and no figure light, 3 the smallest light map and contact shadows only
const RLQ={lvl:0,fixed:null,last:0,ema:16,slow:0,fast:0,ups:0,downs:0};
const RL_Q=[0.5,0.38,0.3,0.24];
function rlQTick(){
  const now=performance.now(), dt=now-RLQ.last; RLQ.last=now;
  if(RLQ.fixed!=null){ RLQ.lvl=RLQ.fixed; return; }
  if(scene!=='play'||document.hidden||!(dt>0&&dt<150)) return;
  RLQ.ema+=(dt-RLQ.ema)*0.06;
  if(RLQ.ema>24){ if(++RLQ.slow>90&&RLQ.lvl<3){ RLQ.lvl++; RLQ.downs++; RLQ.slow=0; RLQ.fast=0; RLQ.ema=17; } } else RLQ.slow=Math.max(0,RLQ.slow-2);
  if(RLQ.ema<18.5){ if(++RLQ.fast>420&&RLQ.lvl>0){ RLQ.lvl--; RLQ.ups++; RLQ.fast=0; } } else RLQ.fast=0;
}
// phones start a step down (the governor climbs back up if there is room)
try{ if(typeof depthPhone==='function'&&depthPhone()) RLQ.lvl=1; }catch(e){}

// ---------- 7. the light map
function rlMap(w,h){
  if(!RLS.cv){ RLS.cv=mkCanvas(w,h); RLS.g=RLS.cv.getContext('2d'); }
  if(RLS.cv.width!==w||RLS.cv.height!==h){ RLS.cv.width=w; RLS.cv.height=h; }
  return RLS.g;
}
// the room's own light inside: houses lit warm by day through their windows and dark plum by night; caves and
// dungeons dark in their theme's colour (AREA.dark, as before, sets how dark)
const RL_CAVE={earth:[[30,22,18],[236,226,210]],mine:[[30,22,16],[240,222,196]],m_burrows:[[30,22,18],[236,226,210]],crystal:[[18,14,36],[220,214,255]],
  bog:[[14,24,18],[214,232,206]],ice:[[12,20,36],[226,240,255]],f_glacier:[[14,24,40],[232,244,255]],f_sky:[[16,22,40],[236,242,255]],sky:[[16,22,40],[236,242,255]],
  ember:[[40,12,8],[255,214,180]],f_forge:[[40,14,8],[255,214,180]],tide:[[8,22,30],[206,236,240]],c_tide:[[8,22,30],[206,236,240]],c_sea:[[8,20,32],[206,232,244]],
  m_coral:[[10,22,32],[210,236,244]],m3p_coral:[[10,22,32],[210,236,244]],c_brass:[[30,22,12],[255,232,196]],c_light:[[30,26,20],[255,244,224]],c_shadow:[[16,10,26],[214,204,236]],
  f_stone:[[20,20,24],[232,232,236]],f_dread:[[32,10,14],[240,210,214]],m_lumen:[[8,22,28],[204,240,236]],m_mirror:[[18,20,30],[232,236,248]],m_obs:[[10,12,32],[210,216,250]],
  m3lab:[[18,18,28],[232,232,244]],leap:[[14,24,16],[226,240,214]]};
function rlRoomBase(){
  const A=AREA, dl=daylight();
  if(A.kind==='cave'){ const T=RL_CAVE[A.def&&A.def.theme]||[[12,14,26],[236,234,230]], dk=clamp(A.dark||0,0,1); return mixRGB(T[1],T[0],dk); }
  const dk=clamp((A.dark||0)+(1-dl)*0.3,0,1), lit=mixRGB([190,178,196],[255,246,232],dl);
  return mixRGB(lit,[36,26,32],dk);
}
// a light into the light map: world (x,y), radius r, intensity i (0..1), colour c
function rlLt(g,s,x,y,r,i,c){
  if(!(i>0.004)||!(r>1)) return;
  const sx=(x-cam.x)*s, sy=(y-cam.y)*s, sr=r*s;
  if(sx<-sr||sy<-sr||sx>RLS.w+sr||sy>RLS.h+sr) return;
  g.globalAlpha=Math.min(1,i); g.drawImage(rlSpr(c),sx-sr,sy-sr,sr*2,sr*2);
}
// flicker: fire (a fast double sine, per light), lamps barely, lava and magic a slow pulse
function rlFlick(kind,L,t){
  const f=RL_FLICK[kind]; if(!f) return 1;
  if(f===2) return 1+0.07*Math.sin(t*9.3+L.x*0.7)+0.05*Math.sin(t*23.1+L.y*1.3)+0.03*Math.sin(t*41+L.x);
  if(f===1) return 1+0.015*Math.sin(t*3.1+L.x);
  if(f===3) return 1+0.08*Math.sin(t*1.3+L.x*0.01);
  return 1+0.06*Math.sin(t*2.2+L.x*0.3+L.y*0.2);
}
const RL_ASH=[255,182,118], RL_ASHB=[255,148,66], RL_PIP=[255,206,130];
function rlPrCol(pr){ if(pr.kind==='pip') return [255,150,60]; if(pr.owner==='player') return [120,220,255]; if(pr.kind==='orb') return [190,100,255]; if(pr.kind==='ice') return [160,210,255]; return [255,120,40]; }
function rlPlCol(pl){ return pl.kind==='toxic'?[110,200,60]:pl.owner==='player'?[255,170,60]:[255,80,30]; }
// gather this frame's lights: {x,y,r,i,c,k,self}
function rlGather(inA,dl,t){
  const out=RLS.list; out.length=0;
  const src=inA?AREA.lights:mapList(LIGHTS,curMap());
  for(const L of src){
    if(L.night&&dl>0.6) continue; if(L.shrine&&!(G.shrines&&G.shrines[L.shrine.id])) continue;
    const k=lightKindOf(L); let i=L.i, c=lightColOf(L,k);
    // a window inside: warm daylight by day (a2e_interiors.js sets i), a faint blue moonlight at night
    if(inA&&L.win){ if(i>0.02) c=RL_KC.sun; else { i=0.24*(1-dl); c=RL_KC.moon; } }
    if(!(i>0.01)) continue; if(!inView(L.x,L.y,L.r)) continue; if(inA&&AREA.rooms&&!roomLightOn(L)) continue;
    const fl=rlFlick(k,L,t); out.push({x:L.x,y:L.y,r:L.r*(RL_FLICK[k]===2?1+(fl-1)*0.5:1),i:i*fl,c,k,L,self:null});
  }
  if(!player.dead){
    const cave=inA&&AREA.kind==='cave', pr0=cave?(AREA.plr||(G.items&&G.items.lantern?470:330)):inA?240:275, br=!!player.breathing;
    const mg=typeof moonGlowK==='function'?moonGlowK():1, fl=1+0.04*Math.sin(t*11)+0.03*Math.sin(t*27+1)+(br?0.08*Math.sin(t*31):0);
    out.push({x:player.x,y:player.y-8,r:(br?pr0+90:pr0)*mg*fl,i:(br?1:0.86),c:br?RL_ASHB:RL_ASH,k:'fire',L:null,self:player,ash:true});
  }
  if(G.pip&&typeof pipGlowR==='function') out.push({x:G.pip.x,y:G.pip.y,r:pipGlowR(),i:pipGlowI(),c:RL_PIP,k:'lamp',L:null,self:G.pip});
  for(const pr of G.projectiles) if(!pr.dead&&inView(pr.x,pr.y,90)) out.push({x:pr.x,y:pr.y,r:80,i:0.7,c:rlPrCol(pr),k:'fire',L:null,self:null,fx:1});
  for(const pl of G.pools) if(inView(pl.x,pl.y,pl.r*2.4)) out.push({x:pl.x,y:pl.y,r:pl.r*2.4,i:0.6*clamp(pl.life/pl.max*2,0,1),c:rlPlCol(pl),k:'fire',L:null,self:null,fx:1});
  for(const e of G.enemies){
    if(e.dead||e.frozen) continue;
    if(e.type==='vorlaxis'){ if(e.alpha>0.2){ out.push({x:e.x,y:e.y,r:260,i:0.5,c:RL_KC.ember,k:'ember',L:null,self:e}); if(e.mouthGlow>0) out.push({x:e.mouthX,y:e.mouthY,r:320,i:0.9,c:RL_KC.fire,k:'fire',L:null,self:null}); } }
    else if(e.burnT>0) out.push({x:e.x,y:e.y,r:80,i:0.55,c:RL_KC.fire,k:'fire',L:null,self:e});
    else if(e.state==='cast'||e.state==='breath') out.push({x:e.x,y:e.y,r:90,i:0.5,c:e.state==='breath'?RL_KC.fire:RL_KC.magic,k:'magic',L:null,self:e});
  }
  for(const h of G.hazards) if((h.kind==='blast'||h.big)&&inView(h.x,h.y,(h.r||60)*1.5)) out.push({x:h.x,y:h.y,r:(h.r||60)*1.5,i:0.4,c:RL_KC.fire,k:'fire',L:null,self:null,fx:1});
  return out;
}
// the figures that take light this frame (and cast shadows): Ash, foes, people, critters, the goat, allies, pickups
function rlFigs(inA){
  const out=RLS.figs; out.length=0;
  if(!player.dead) out.push(player);
  for(const e of G.enemies) if(!e.dead&&!e.frozen&&e.type!=='vorlaxis'&&e.alpha!==0&&inView(e.x,e.y,60)) out.push(e);
  for(const n of (inA?AREA.npcs:G.npcs)) if(inView(n.x,n.y,50)) out.push(n);
  for(const c of G.critters) if(inView(c.x,c.y,40)) out.push(c);
  if(G.goat&&inView(G.goat.x,G.goat.y,40)&&(!inA||G.side.duchess==='follow')) out.push(G.goat);
  if(G.allies) for(const a of G.allies) if(inView(a.x,a.y,60)) out.push(a);
  return out;
}
// the strongest light at a point (not counting a figure's own light): [light, strength]
const RL_BEST=[null,0];
function rlBestAt(x,y,self){
  let best=null, bs=0;
  for(const l of RLS.list){ if(l.self===self&&self) continue; const dx=l.x-x, dy=l.y-y, d2=dx*dx+dy*dy; if(d2>=l.r*l.r) continue; const f=1-Math.sqrt(d2)/l.r, s=l.i*f*f; if(s>bs){ bs=s; best=l; } }
  RL_BEST[0]=best; RL_BEST[1]=bs; return RL_BEST;
}
// the dappled light through leaves: a tile of soft leaf shade with bright gaps, built once (white is no change)
function rlDapple(){
  if(RLS.dap) return RLS.dap;
  const S=256, c=mkCanvas(S,S), g=c.getContext('2d'), R=mulberry32(4242);
  g.fillStyle='#fff'; g.fillRect(0,0,S,S);
  const blob=(x,y,r,col,a)=>{ for(const ox of [-S,0,S]) for(const oy of [-S,0,S]){ const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x+ox-r,y+oy-r,r*2,r*2); } };
  for(let i=0;i<34;i++) blob(R()*S,R()*S,18+R()*34,'92,112,96',0.55+R()*0.3);
  for(let i=0;i<26;i++) blob(R()*S,R()*S,6+R()*12,'255,255,255',0.9);
  return (RLS.dap=c);
}
function reLights(){
  rlQTick();
  const t0=performance.now();
  const inA=!!AREA, dl=daylight(), t=G.time, q=RL_Q[RLQ.lvl]||0.5, A=reAir();
  // 1. the base: the grade outdoors (with the place's extra dark: the moon, the Crag Ward, the mire), the room inside
  let base;
  if(!inA){
    base=ambientTint();
    let ex=mapNight(); const rg=G.region&&G.region.key;
    if(rg==='nests') ex+=0.1; if(rg==='b6'||rg==='mire'||rg==='mosshut') ex+=0.06;
    const k=clamp(1-ex*0.95,0.05,1); base=[base[0]*k,base[1]*k,base[2]*k];
  }else base=rlRoomBase();
  RLS.base=base;
  const N=clamp((235-rlLum(base))/150,0,1); RLS.N=N;
  const list=rlGather(inA,dl,t), figs=rlFigs(inA), S=reSun(), lvl=RLQ.lvl;
  const lava=!inA&&(player.y<3300||mapLavaGlow());
  const dap=!inA&&lvl<2?A.dap*dl*(1-0.6*rlRain()):0;
  // 2. a frame with nothing to light (a clear day out in the open): one flat multiply, or nothing at noon
  if(N<0.015&&dap<0.02&&!lava){
    if(base[0]<253||base[1]<253||base[2]<253){ ctx.globalCompositeOperation='multiply'; ctx.fillStyle=`rgb(${base.map(Math.round)})`; ctx.fillRect(0,0,cvs.width,cvs.height); ctx.globalCompositeOperation='source-over'; }
  }else{
    const lw=Math.max(16,Math.ceil(W*q)), lh=Math.max(16,Math.ceil(H*q)), s=zoom*q, g=rlMap(lw,lh); RLS.w=lw; RLS.h=lh;
    g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation='source-over'; g.globalAlpha=1;
    g.fillStyle=`rgb(${base.map(Math.round)})`; g.fillRect(0,0,lw,lh);
    // dappled light under the leaves (multiply: the shade darkens, the gaps stay bright), world anchored, swaying a little
    if(dap>0.02){ const D=rlDapple(), ts=256*s, ox=(-cam.x*s)%ts-ts+Math.sin(t*0.4)*3*s, oy=(-cam.y*s)%ts-ts+Math.cos(t*0.33)*2*s;
      g.globalCompositeOperation='multiply'; g.globalAlpha=Math.min(1,dap*0.6);
      for(let x=ox;x<lw;x+=ts) for(let y=oy;y<lh;y+=ts) g.drawImage(D,x,y,ts+0.5,ts+0.5); }
    g.globalCompositeOperation='lighter';
    // lava glows from the ground chunks (orange), stronger in the dark
    if(lava){ g.globalAlpha=0.35+0.55*N; for(let cx=Math.floor(cam.x/CH);cx<=Math.floor((cam.x+W/zoom)/CH);cx++) for(let cy=Math.floor(cam.y/CH);cy<=Math.floor((cam.y+H/zoom)/CH);cy++){ const ch=CHUNKS.get(ckey(cx,cy)); if(ch&&ch.glow) g.drawImage(ch.glow,(cx*CH-cam.x)*s-20*s,(cy*CH-cam.y)*s-20*s,(CH+40)*s,(CH+40)*s); } }
    if(N>0.015){
      for(const l of list) rlLt(g,s,l.x,l.y,l.r,l.i*N,l.c);
      // figures: the strongest light around each one adds a little of its colour on the side facing it, the moon a
      // cool side at night outdoors; foes and pickups get a faint lift so they never sink into the dark
      if(lvl<2){
        const mk=!inA&&S.moon?S.a/0.13*N:0, mL=S.len||1;
        for(const e of figs){
          const r=e.r||12, h=rlFigH(e), fy=e.y-h*0.45, B=rlBestAt(e.x,fy,e), bl=B[0], bs=B[1];
          if(bl&&bs>0.05){ const dx=bl.x-e.x, dy=bl.y-fy, d=Math.hypot(dx,dy)||1; rlLt(g,s,e.x+dx/d*r*0.55,fy+dy/d*r*0.35,r*1.35,Math.min(0.55,bs*0.8)*N,bl.c); }
          if(mk>0.05) rlLt(g,s,e.x-S.dx/mL*r*0.5,fy-S.dy/mL*r*0.4,r*1.3,0.2*mk,RL_KC.moon);
        }
      }
      for(const e of figs) if(e!==player&&!e.kind&&e.hp!=null) rlLt(g,s,e.x,e.y-rlFigH(e)*0.4,(e.r||12)*2.4,0.2*N,[176,184,214]);
      for(const k of G.pickups) rlLt(g,s,k.x,k.y,44,0.5*N,[255,132,140]);
    }
    g.globalAlpha=1; g.globalCompositeOperation='source-over';
    ctx.globalCompositeOperation='multiply'; ctx.drawImage(RLS.cv,0,0,lw,lh,0,0,cvs.width,cvs.height); ctx.globalCompositeOperation='source-over';
  }
  // 3. bloom: a soft halo and a hot core on bright sources (cached glow sprites, added)
  ctx.save(); ctx.setTransform(DPR*zoom,0,0,DPR*zoom,-cam.x*zoom*DPR,-cam.y*zoom*DPR);
  const bk=inA?0.35+0.65*N:N;
  for(const l of list){
    if(l.self||l.fx) continue; const b=RL_BLOOM[l.k]||0; if(!b) continue;   // (figures carry their own glow)
    const k=(l.k==='fire'||l.k==='ember'||l.k==='cold'?0.3+0.7*bk:bk)*b*Math.min(1,l.i*1.25); if(k<0.02||!inView(l.x,l.y,l.r*0.3)) continue;
    const cs=l.c[0]+','+l.c[1]+','+l.c[2];
    if(lvl<2) glowAt(l.x,l.y,l.r*0.24,cs,0.34*k);
    glowAt(l.x,l.y,l.r*0.065,'255,240,214',0.5*k);
  }
  // 4. the air
  rlAtmos(inA,A,dl,t,lvl,S);
  ctx.restore();
  RLS.ms+=performance.now()-t0; RLS.frames++;
}

// ---------- 8. atmosphere (screen space after the light): haze, fog banks, heat shimmer, sunbeams and motes, wet glints
function rlFog(){
  if(RLS.fog) return RLS.fog;
  const c=mkCanvas(128,128), g=c.getContext('2d'), gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,.55)'); gr.addColorStop(0.5,'rgba(255,255,255,.28)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.fillRect(0,0,128,128); return (RLS.fog=c);
}
// a sunbeam: bright at the window, fading along its length, soft at the sides
function rlBeam(){
  if(RLS.beam) return RLS.beam;
  const W=64, H=256, c=mkCanvas(W,H), g=c.getContext('2d'), im=g.createImageData(W,H), d=im.data;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const u=y/H, v=Math.abs((x+0.5)/W-0.5)*2, a=(1-rlSS(0.6,1,v))*(1-rlSS(0.15,1,u))*rlSS(0,0.06,u); const i=(y*W+x)*4; d[i]=255; d[i+1]=236; d[i+2]=196; d[i+3]=Math.round(255*a); }
  g.putImageData(im,0,0); return (RLS.beam=c);
}
function rlAtmos(inA,A,dl,t,lvl,S){
  // the world transform is set (world px); W, H are CSS px
  const vx=cam.x, vy=cam.y, vw=W/zoom, vh=H/zoom;
  if(!inA){
    // haze: the place's air, plus a morning mist on cold, wet or green ground, laid over with screen
    const morn=rlSS(0.2,0.25,G.tod)*(1-rlSS(0.31,0.38,G.tod)), cold=Math.min(1,A.snow+A.mist+A.dap*0.5+(G.region&&G.region.key==='lake'?0.8:0));
    let ha=A.ha*(0.55+0.45*dl)+morn*0.1*cold, hz=A.haze;
    if(morn*cold>0.05){ const w=morn*0.1*cold/Math.max(0.001,ha); hz=mixRGB(A.ha>0?A.haze:[230,236,240],[236,240,244],w); }
    if(A.salt>0) { ha+=0.012*A.salt*dl; hz=A.ha>0?hz:[240,246,252]; }
    // the haze is lit by the light of the hour (a pale haze over a dark night would wash it out)
    const B=RLS.base, lit=clamp(rlLum(B)/235,0.18,1); hz=[hz[0]*Math.min(1,B[0]/235+0.1),hz[1]*Math.min(1,B[1]/235+0.1),hz[2]*Math.min(1,B[2]/235+0.1)];
    if(ha>0.01){ ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=Math.min(0.3,ha); ctx.fillStyle=`rgb(${hz.map(Math.round)})`; ctx.fillRect(0,0,cvs.width,cvs.height); ctx.restore(); }
    // fog banks drifting over the mire and on cold mornings
    // fog banks drifting over the mire and on cold mornings (world anchored: one bank per 560 px cell, drifting east)
    const fogK=Math.min(1,A.mist*0.8+morn*cold*0.7)*(lvl<1?1:0);
    if(fogK>0.04){ const F=rlFog(), C=560; ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=fogK*0.3*lit;
      for(let cx=Math.floor((vx-C)/C);cx<=Math.floor((vx+vw+C)/C);cx++) for(let cy=Math.floor((vy-C*0.5)/C);cy<=Math.floor((vy+vh+C*0.5)/C);cy++){
        const h1=hash2(cx,cy*7+3), h2=hash2(cx*5+1,cy), R=230+h2*170, x=cx*C+((h1*C+t*(8+h2*6))%C), y=cy*C+h2*C+Math.sin(t*0.2+h1*6)*24;
        if(x+R<vx||x-R>vx+vw||y+R<vy||y-R>vy+vh) continue; ctx.drawImage(F,x-R,y-R*0.5,R*2,R); }
      ctx.restore(); }
    // heat shimmer near lava: thin strips of the frame shifted a pixel or so, only where lava is on screen
    const sh=A.shim; if(sh>0.05&&lvl<1) rlShimmer(sh,t);
    // rain: wet glints flicker on the ground
    const rk=rlRain(); if(rk>0.15){ ctx.save(); ctx.globalCompositeOperation='lighter'; const n=Math.floor(46*rk), sz=1.6/zoom;
      for(let i=0;i<n;i++){ const x=vx+Math.random()*vw, y=vy+Math.random()*vh; ctx.globalAlpha=0.25+Math.random()*0.45; ctx.fillStyle='#e8f0ff'; ctx.fillRect(x,y,sz*(1+Math.random()*2),sz); }
      ctx.restore(); }
    return;
  }
  // inside: a soft shaft of light under each window by day (over the pool the room's art lays on the floor; a faint
  // blue one by moonlight), with dust motes drifting in it
  if(AREA.kind!=='cave'){
    const day=dl>0.08, k=day?clamp(dl,0,1):0.45*(1-dl); if(k<0.03) return;
    const B=day?rlBeam():rlBeamN(), side=day&&S&&!S.moon?clamp(S.dx*0.12,-0.25,0.25):0, y0=AREA.ry+22, len=Math.min(250,AREA.rh*0.62);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(const o of AREA.objs){
      if(o.k!=='window'||o._hid||!inView(o.x,y0+len*0.5,len)) continue; const w0=(o._ww||22)*2.4;
      ctx.save(); ctx.translate(o.x,y0); ctx.transform(1,0,side,1,0,0); ctx.globalAlpha=(day?0.26:0.16)*k; ctx.drawImage(B,-w0/2,0,w0,len); ctx.restore();
      if(!day||lvl>=2) continue;
      ctx.fillStyle='#fff4dc'; const n=lvl?8:16;
      for(let j=0;j<n;j++){ const ph=j*1.618+o.x*0.01, u=((t*0.03+ph*0.37)%1), yy=y0+u*len*0.92, xx=o.x+side*(yy-y0)+Math.sin(t*0.45+ph*3)*w0*0.36;
        ctx.globalAlpha=(0.3+0.25*Math.sin(t*1.7+ph*5))*k*(1-u)*(u<0.08?u/0.08:1); ctx.fillRect(xx,yy,1.4,1.4); }
    }
    ctx.restore();
  }
}
function rlBeamN(){ if(RLS.beamN) return RLS.beamN; const c=mkCanvas(64,256), g=c.getContext('2d'); g.drawImage(rlBeam(),0,0); g.globalCompositeOperation='source-in'; g.fillStyle='rgb(150,176,255)'; g.fillRect(0,0,64,256); return (RLS.beamN=c); }
// strips of the frame shifted sideways by a pixel or so (a copy first, so every strip reads the unshifted frame)
function rlShimmer(sh,t){
  let y0=1e9, y1=-1e9;
  for(let cx=Math.floor(cam.x/CH);cx<=Math.floor((cam.x+W/zoom)/CH);cx++) for(let cy=Math.floor(cam.y/CH);cy<=Math.floor((cam.y+H/zoom)/CH);cy++){ const ch=CHUNKS.get(ckey(cx,cy)); if(ch&&ch.glow){ y0=Math.min(y0,cy*CH-80); y1=Math.max(y1,(cy+1)*CH); } }
  if(y1<y0) return;
  const cw=cvs.width, chh=cvs.height, a=Math.max(0,Math.floor(((y0-cam.y)*zoom)*DPR)), b=Math.min(chh,Math.ceil(((y1-cam.y)*zoom)*DPR)); if(b-a<8) return;
  if(!RLS.shim||RLS.shim.width!==cw||RLS.shim.height<chh){ RLS.shim=mkCanvas(cw,chh); }
  const sg=RLS.shim.getContext('2d'); sg.globalCompositeOperation='copy'; sg.drawImage(cvs,0,a,cw,b-a,0,a,cw,b-a);
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  const st=Math.max(4,Math.round(5*DPR)), amp=Math.min(1.6,sh)*0.9*DPR;
  for(let y=a;y<b;y+=st){ const dx=Math.sin(t*3.7+y*0.043/DPR)*amp+Math.sin(t*5.3+y*0.11/DPR)*amp*0.4; if(Math.abs(dx)<0.25) continue; ctx.drawImage(RLS.shim,0,y,cw,st,dx,y,cw,st); }
  ctx.restore();
}

// ---------- 9. shadows: the shadow layer for what stands still, a cast and a contact shadow for every figure
// (called by render in a11_render.js before the props and figures are drawn; the world transform is set)
function reShadows(props,npcs,inA){
  const S=reSun(), lvl=RLQ.lvl;
  if(!inA&&!DSKIP.shadow){ const n0=SHL.redraws, t0=performance.now(); shadowLayer(S,props); if(SHL.redraws!==n0){ const ms=performance.now()-t0; RLS.shN++; RLS.shMs+=ms; if(ms>RLS.shMax) RLS.shMax=ms; } }
  if(lvl>=3) return;
  const figs=rlFigs(inA), C=rlCap();
  ctx.globalAlpha=1;
  const cast=(e,dx,dy,a)=>{
    const r=e.r||10, h=rlFigH(e), z=e===player?(player.z||0):(e.z||0), up=z+(e.flying?20:0), L=Math.hypot(dx,dy)*h;
    if(L<1.5||a<0.01) return;
    ctx.save(); ctx.translate(e.x+dx*up,e.y+dy*up); ctx.rotate(Math.atan2(dy,dx)); ctx.globalAlpha=Math.min(0.8,a)*(up>4?0.6:1);
    const w=r*1.55; ctx.drawImage(C,-r*0.55,-w/2,L+r*1.1,w); ctx.restore();
  };
  for(const e of figs){
    if(e===player&&(player.dead||(typeof airborne==='function'&&airborne()))) continue;
    // the sun or the moon
    if(!inA&&S.a>0.012) cast(e,S.dx,S.dy,S.a*1.05);
    // a strong light nearby (last frame's lights: a lamp, a hearth, Ash's flame for everybody else) casts its own
    if(RLS.N>0.15||inA){ const B=rlBestAt(e.x,e.y-6,e), bl=B[0], bs=B[1];
      if(bl&&bs>0.12){ const dx=e.x-bl.x, dy=e.y-bl.y, d=Math.hypot(dx,dy)||1, k=clamp(d/(bl.r*0.3),0.35,1.8)*0.9; cast(e,dx/d*k,dy/d*k,Math.min(0.5,bs*0.6)*(inA?1:RLS.N)); } }
  }
  ctx.globalAlpha=1;
}
// the structures the shadow layer does not know (wells, stakes, tents, stalls, posts, huts, boulders...): a soft
// stroke from the base along the sun, as wide as the thing, for its height (shadowLayer's drawShadowLayer calls this)
const RL_SHH={well:[26,30],stake:[30,6],tent:[42,46],stall:[34,44],post:[26,7],hut:[50,60],boulder:[20,34],throne:[44,40],cauldron:[18,26],
  brazier:[24,18],shrine:[34,26],ore:[18,22],sign:[24,10],fence:[18,6],crate:[16,22],barrel:[18,18],lamppost:[56,6],lamp:[56,6],statue:[90,26],
  scarecrow:[44,14],well2:[26,30],cart:[22,40],wagon:[22,44],totem:[48,14],obelisk:[70,22],ward:[0,0]};
function reStructShadows(g,mk,inR,ux,uy,markS){
  g.globalAlpha=0.9; g.lineCap='round';
  for(const s of mapList(STRUCTS,mk)){
    const H=RL_SHH[s.k]; if(!H||!H[0]||!inR(s.x,s.y,90)) continue;
    const k=s.s||1, h=H[0]*k, w=H[1]*k; markS(s.x,s.y,w,h);
    g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x+ux*h,s.y+uy*h); g.lineWidth=w; g.stroke();
  }
  g.lineWidth=4; g.globalAlpha=1;
}
// soften the cached shadow layer when it is redrawn (only then): down to half and back up, a cheap blur of about
// 8 world px, so the edges read as soft penumbra rather than cut paper
function reSoften(g,lw,lh){
  if(RLQ.lvl>=3) return;
  const w=Math.max(4,Math.ceil(lw/2)), h=Math.max(4,Math.ceil(lh/2));
  if(!RLS.soft||RLS.soft.width!==w||RLS.soft.height!==h){ RLS.soft=mkCanvas(w,h); RLS.softG=RLS.soft.getContext('2d'); }
  const sg=RLS.softG; sg.imageSmoothingEnabled=true; g.imageSmoothingEnabled=true; try{ sg.imageSmoothingQuality='medium'; g.imageSmoothingQuality='medium'; }catch(e){}
  sg.globalCompositeOperation='copy'; sg.drawImage(g.canvas,0,0,lw,lh,0,0,w,h);
  g.globalCompositeOperation='copy'; g.drawImage(RLS.soft,0,0,w,h,0,0,lw,lh);
  g.globalCompositeOperation='source-over';
}
// the dark blob right under the feet (contactShadow in a11c_depth.js calls this in Realistic, just before the figure)
function reContact(e){
  if(e===player&&((typeof airborne==='function'&&airborne())||player.dead)) return;
  if(e.flying||e.dead) return;
  const r=(e.r||10)*(e===player?0.95:0.9);
  ctx.globalAlpha=AREA?0.55:0.5; ctx.drawImage(rlBlob(),e.x-r,e.y-r*0.3,r*2,r*0.82); ctx.globalAlpha=1;
}

// ---------- 10. the vignette of this look: a soft, neutral dark at the corners (drawVignette in a11_render.js)
function reVignette(vg,dm){
  const g=vg.createRadialGradient(W/2,H*0.5,Math.min(W,H)*0.42,W/2,H*0.5,Math.max(W,H)*0.78);
  g.addColorStop(0,'rgba(8,10,18,0)'); g.addColorStop(0.55,'rgba(8,10,18,.08)'); g.addColorStop(1,`rgba(6,8,16,${dm==='off'?0.3:0.36})`);
  return g;
}

// ---------- 11. the caches this look keeps (lookRebuild in e5_look.js calls this)
function lightRebuild(){ RLS.ambC=null; RLS.air=null; RL_SUN.t=-1; RLQ.slow=RLQ.fast=0; }

// ---------- 12. debug: __ebX.light
window.__ebX=Object.assign(window.__ebX||{},{light:{
  sun:()=>Object.assign({},reSun()), grade:t=>reGradeTod(t==null?G.tod:t), amb:()=>reAmbient(), air:()=>JSON.parse(JSON.stringify(reAir())),
  q(l){ if(l==='auto'||l==null){ RLQ.fixed=null; } else RLQ.fixed=clamp(l|0,0,3); RLQ.lvl=RLQ.fixed==null?RLQ.lvl:RLQ.fixed; return {lvl:RLQ.lvl,fixed:RLQ.fixed}; },
  stats(){ const r={lvl:RLQ.lvl,fixed:RLQ.fixed,ema:+RLQ.ema.toFixed(1),downs:RLQ.downs,ups:RLQ.ups,ms:RLS.frames?+(RLS.ms/RLS.frames).toFixed(3):0,frames:RLS.frames,lights:RLS.list.length,N:+RLS.N.toFixed(3),base:RLS.base.map(Math.round),shadowRedraws:RLS.shN,shadowMs:RLS.shN?+(RLS.shMs/RLS.shN).toFixed(2):0,shadowMax:+RLS.shMax.toFixed(2)}; RLS.ms=0; RLS.frames=0; RLS.shN=0; RLS.shMs=0; RLS.shMax=0; return r; },
  kinds(){ const o={}; for(const L of LIGHTS){ const k=lightKindOf(L); o[k]=(o[k]||0)+1; } if(AREA) for(const L of AREA.lights){ const k='area:'+lightKindOf(L); o[k]=(o[k]||0)+1; } return o; },
  // every canvas made while the UI draws in Realistic, by where it was made (a world cache there would be built with
  // LOOK.sb true): audit(true) starts, audit() reads, audit(false) stops
  audit(on){ if(on===true&&!RLS.mk0){ RLS.mk0=mkCanvas; RLS.aud=new Map(); mkCanvas=function(w,h){ if(LOOK.uiN>0){ const s=(new Error().stack||'').split('\n').slice(2,7).map(x=>x.trim().replace(/^at /,'').replace(/ \(.*\)$/,'')).join(' < '); RLS.aud.set(s,(RLS.aud.get(s)||0)+1); } return RLS.mk0(w,h); }; }
    else if(on===false&&RLS.mk0){ mkCanvas=RLS.mk0; RLS.mk0=null; }
    return RLS.aud?[...RLS.aud].map(([k,n])=>n+'x '+k):[]; }}});
