// ================= x1_dun_a: the first two Act II dungeons (bible ACT2.md 5.1, 5.2, 6.2, 6.3, 6.7)
//   The Gullcrag Caves (c_gullcrag): Pearl's sea caves. The tide breathes through every room: Tide Bells turn it HIGH or
//     LOW for the whole cave (tidal sand floods and swirls, low tunnels fill to the roof, barnacle arches close, barrels
//     float up to the ledges, eels roam or get stranded). Pearl's statue gives the Climbing Claws; then the High Galleries
//     are climbing country: a stepped chalk chimney, a cistern that floods up from below (climb ahead of it), a tilted
//     wreck. Grand Admiral Pinch waits in the Drowned Lagoon under a Boss Key hatch.
//   The Brassworks (c_brassworks): Pearl's clockwork under the Great Clock. Conveyors that run in jerks while the clock is
//     stopped (levers reverse them), gear bridges that turn on a beat, steam vents on a rhythm, furnaces that build
//     pressure, pistons. Pearl's cushion gives the Grapple Tail; then crane hooks, a ferris gear and a ceiling trolley.
//     Ticktock the Brass Colossus guards the Drive Pit; the great lever in Pearl's First Workshop wakes the Great Clock.
// Everything is a wrapper or a registry entry (defineDungeon replaces x1_world's placeholders). Template letters, room
// fields, save keys and hooks are in scratchpad/C1DUN_A.md. Simple words: S(full, simple) inline.

// ---------- 0. ids, numbers and state
const D1A={cis:null,toH:0,noGift:false,seen:{},tip:{},sndT:{}};
const D1A_IDS={c_gullcrag:1,c_brassworks:1};
function d1aRoot(){ return AREA&&AREA.def?dunRoot(AREA.def.id):null; }
function d1aIn(id){ const r=d1aRoot(); return !!r&&(id?r===id:!!D1A_IDS[r]); }
const d1aDI=()=>clamp(typeof diffIdx==='number'?diffIdx:1,0,2);
const d1aDiff=(e,n,h)=>[e,n,h][d1aDI()];
const d1aCtl=k=>{ try{ return balCtls()[k]; }catch(e){ return {use:'E',jump:'C',attack:'J',roll:'Space',fire:'K'}[k]||k; } };
function d1aSay(lines,cb){ runDialogue(lines.map(l=>Array.isArray(l)?l:['narr',l]),()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function d1aTip(id,title,text,n){ const c=D1A.tip[id]||0; if(c>=(n||1)) return; D1A.tip[id]=c+1; try{ mvTip(title,text,6,'d1a_'+id); }catch(e){ setBanner(title,text,3); } }
function d1aOnce(key){ G.flags.c_dsn=G.flags.c_dsn||{}; if(G.flags.c_dsn[key]) return false; G.flags.c_dsn[key]=1; return true; }
function d1aSeen(key){ try{ if(typeof c1Seen==='function'&&c1Seen(key)) return true; }catch(e){} return !!(G.flags.c_dsn&&G.flags.c_dsn['play_'+key]); }
function d1aPlay(key,cb){ G.flags.c_dsn=G.flags.c_dsn||{}; G.flags.c_dsn['play_'+key]=1; if(typeof c1Play==='function'&&STORY[key]) c1Play(key,cb); else if(STORY[key]) runDialogue(STORY[key],()=>{ scene='play'; if(cb) cb(); }); else if(cb) cb(); }
// play a once-only key as soon as the game is free (a scene or a fight intro may be on), while Ash is still inside
function d1aSoon(key,cond,tries){ tries=tries==null?24:tries; later(0.6,()=>{ if(!d1aIn()||d1aSeen(key)||(cond&&!cond())) return; if(scene!=='play'||(typeof DLG!=='undefined'&&DLG)){ if(tries>0) d1aSoon(key,cond,tries-1); return; } d1aPlay(key); }); }
const D1A_SHRINE={c_gullcrag:{key:'c_gull_shrine',abil:'claws'},c_brassworks:{key:'c_brass_shrine',abil:'grapple'}};

// ---------- 1. new cells (template letters; TY ids 200 to 210, kept clear of other modules)
//   ⌒ low tunnel (floor at low tide, water to the roof at high tide)     β barrel (on the sand at low tide, afloat at high)
//   ⅱ / ² raised floor, level 2 (smooth / climbable)                     ⅲ / ³ raised floor, level 3 (smooth / climbable)
//   ‗ a level 2 ledge you can hop down from                              ç cistern crates (level 3 floor only while held up)
//   ↑→↓← conveyor belt, group 0     ⇑⇒⇓⇐ conveyor belt, group 1        ▦ a floor that drops away (Hook Hall)
//   ʃ a step a Double Jump can mount (level 1)
Object.assign(TY,{d1atun:200,d1abar:201,d1ah2:202,d1ac2:203,d1ah3:204,d1ac3:205,d1al2:206,d1afloat:207,d1abelt:208,d1adrop:209,d1astep:210});
Object.assign(TY_CH,{'⌒':200,'β':201,'ⅱ':202,'²':203,'ⅲ':204,'³':205,'‗':206,'ç':207,'↑':208,'→':208,'↓':208,'←':208,'⇑':208,'⇒':208,'⇓':208,'⇐':208,'▦':209,'ʃ':210});
Object.assign(TY_FLOW,{'↑':0,'→':1,'↓':2,'←':3,'⇑':0,'⇒':1,'⇓':2,'⇐':3});
for(const ch of '⇑⇒⇓⇐') TY_KEEP[ch]=1;   // the second belt group keeps a mark so the build can tell the loops apart
const D1A_T={tun:200,bar:201,h2:202,c2:203,h3:204,c3:205,l2:206,float:207,belt:208,drop:209,step:210};
const d1aMine=t=>t>=200&&t<=210;
const d1aClimb=t=>t===D1A_T.c2||t===D1A_T.c3;
Object.assign(DOOR_COL,{tide:'120,210,235'}); Object.assign(LINK_CH,{tide:'~'});
// puzzle kinds of these two dungeons: they play the puzzle theme until solved, and their chests stay sealed
Object.assign(PUZZLE_KINDS,{d1atilt:1,d1acistern:1,d1avalve:1,d1acrane:1,d1apipes:1,d1abarrels:1});
Object.assign(SEAL_KINDS,{d1atilt:1,d1avalve:1});

// the tide: 0 low, 2 high (the dungeon water level of e9a, so basins `a` are tidal sand)
function d1aTide(){ const A=AREA; return A&&A.tri?(A.tri.lvl|0):0; }
function d1aBarrelUp(k){ const A=AREA, X=A&&A.d1a; if(!X||d1aTide()<1) return false; const b=X.bar.get(k); return !(b&&b.sunk>0); }
function d1aFloatUp(){ const A=AREA, X=A&&A.d1a; return !!(X&&X.floatUp); }
function d1aDropped(k){ const A=AREA, X=A&&A.d1a; return !!(X&&X.dropped); }
function d1aHt(k,t){
  switch(t){ case 202: case 203: case 206: return 2; case 204: case 205: case 207: return 3; case 210: return 1; case 201: return d1aBarrelUp(k)?1:0; }
  return 0;
}
{ const base=dunH; dunH=function(k){ const A=AREA; if(A&&A.cave){ const t=A.cave.typ[k]; if(t>=200&&t<=210) return d1aHt(k,t); } return base(k); }; }
{ const base=dunGround; dunGround=function(k,t,T){
    if(t>=200&&t<=210){ const L=lvlOf(T);
      switch(t){ case 200: return L<1; case 201: return L<1||d1aBarrelUp(k); case 207: return d1aFloatUp(); case 209: return !d1aDropped(k); }
      return true; }
    return base(k,t,T); }; }
{ const base=dunWet; dunWet=function(k,t,T){ if(t===201) return lvlOf(T)>=1&&!d1aBarrelUp(k); return base(k,t,T); }; }
{ const base=dunHole; dunHole=function(k,t,T){ if(t===207) return !d1aFloatUp(); if(t===209) return d1aDropped(k); return base(k,t,T); }; }
// the cistern of the Drip Cistern floods its tiers from below (only while Ash is on that floor)
function d1aCisWet(k){ const C=D1A.cis; if(!C||C.wl<=0.02) return false; const h=C.h.get(k); return h!=null&&h<C.wl; }
{ const base=tGround; tGround=function(k){ if(D1A.cis&&d1aCisWet(k)) return false; return base(k); }; }
{ const base=tWet; tWet=function(k){ if(D1A.cis&&d1aCisWet(k)) return true; return base(k); }; }
// heights in these dungeons: a jump lands on anything no higher than where it took off (barrel to barrel, ledge to
// ledge); a Double Jump hops up onto a step; the level 2 ledges let Ash hop down; low tunnels are walls at high tide
{ const base=dunCheck; dunCheck=function(k,x,y,air,fly){
    const r=base(k,x,y,air,fly), A=AREA; if(!A||!A.d1a||!A.cave) return r;
    const t=A.cave.typ[k];
    if(t===D1A_T.tun&&d1aTide()>=1&&!(typeof P2!=='undefined'&&P2.mv)) return 'wall';
    if(r!=='wall') return r;
    const T=A.tri, hk=dunH(k);
    if(air&&D1A.toH!=null&&hk>=0&&hk<=D1A.toH) return undefined;
    if(air&&t===D1A_T.step&&player.dbl&&(player.z||0)>6) return undefined;
    if(!air&&T&&T.lx!=null){ const f=tCell(T.lx,T.ly); if(f>=0&&A.cave.typ[f]===D1A_T.l2&&hk>=0&&hk<dunH(f)) return undefined; }
    return r; }; }
// the gear bridges and the cistern crates are floor while they are in place
{ const base=dunCovered; dunCovered=function(k){ if(base(k)) return true; const A=AREA, X=A&&A.d1a; return !!(X&&X.cover&&X.cover.has(k)); }; }

// ---------- 2. the looks: wet sea rock and sand (c_sea), riveted brass and iron (c_brass)
defineDungeonTheme('c_sea',{style:{floor:'#b89a6a',floor2:'#ae9062',top:'#5c7486',face:'#2c3c4e',edge:'#d8f0f4',water:'#2a7aa0',accent:'#8ae8d8'},decor:'shell',
  pal:{tile:['#b89a6a','#ae9062','#b89a6a','#ae9062'],grout:'rgba(60,40,20,.22)',moss:'110,190,170',rune:'140,230,220',hole:'#0e1820',lip:['#5c7486','#2c3c4e'],water:'#2a7aa0',cave:true}});
defineDungeonTheme('c_brass',{style:{floor:'#7c6a58',floor2:'#746250',top:'#4c4446',face:'#2a2024',edge:'#e8b864',water:'#4a3c26',accent:'#ffb84a'},decor:'lamp',
  pal:{tile:['#7c6a58','#746250','#7c6a58','#746250'],grout:'rgba(30,20,10,.3)',moss:'230,170,80',rune:'255,200,110',hole:'#120c08',lip:['#c09a58','#4a3424'],water:'#4a3c26',cave:true}});

// ---------- 3. sounds (synthesized): a bronze bell, the sea, steam, clanks, ticks
function d1aSnd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted) return;
  const now=G?G.time:0; if(D1A.sndT[kind]&&now-D1A.sndT[kind]<0.05) return; D1A.sndT[kind]=now;
  try{
    const t0=ac.currentTime, out=ac.createGain(); out.gain.value=0.4*(v==null?1:v); out.connect(ac.destination);
    const tn=(type,f,dur,vol,dl,f1)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.008); g.gain.exponentialRampToValueAtTime(0.0006,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ if(!SFX.noise) return; const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.05,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    switch(kind){
      case 'bell': for(const [m,a,d] of [[1,0.16,3.2],[2.01,0.07,2.2],[2.42,0.06,1.8],[3.0,0.04,1.4],[4.16,0.025,0.9]]) tn('sine',196*m,d,a); tn('triangle',196*0.5,1.6,0.05); break;
      case 'bellhi': for(const [m,a,d] of [[1,0.12,2.2],[2.4,0.05,1.4],[3.1,0.03,1]]) tn('sine',392*m,d,a); break;
      case 'surge': nz(2.6,0.22,'lowpass',300,1400,0.7); nz(2.2,0.1,'bandpass',800,300,0.8,0.4); break;
      case 'drain': nz(2.2,0.18,'lowpass',1200,180,0.7); tn('sine',90,1.6,0.05,0,50); break;
      case 'hiss': nz(0.45,0.12,'highpass',2400,5200,0.6); break;
      case 'steam': nz(0.8,0.2,'bandpass',1800,600,0.9); nz(0.6,0.1,'highpass',3000,6000,0.7); break;
      case 'clank': tn('square',180,0.12,0.05,0,120); nz(0.12,0.16,'bandpass',900,400,2); tn('triangle',660,0.18,0.03,0.02); break;
      case 'tick': tn('square',1400,0.03,0.025); break;
      case 'tock': tn('square',900,0.04,0.03); break;
      case 'stamp': nz(0.3,0.3,'lowpass',400,60,0.8); tn('sine',70,0.3,0.15,0,40); break;
      case 'creak': tn('sawtooth',110,0.5,0.03,0,70); nz(0.5,0.05,'bandpass',500,250,4); break;
      case 'splash': nz(0.5,0.22,'bandpass',900,300,0.8); nz(0.3,0.1,'highpass',2500,1500,1,0.05); break;
      case 'whoosh': nz(0.5,0.15,'bandpass',300,1600,0.8); break;
      case 'gear': for(let i=0;i<4;i++) tn('square',220+i*30,0.05,0.025,i*0.06); break;
    }
  }catch(e){}
}
// ---------- 4. the rooms (15 x 11 cells; DUNGEON.md section 5 letters, plus the ones above and these marks:
//   ♪ a Tide Bell (room field bell: 'great' | 'little' | 'high')   ◔ a tide gauge   ¶ a page of Pearl's Logbook (room page:n)
//   ◎ Pearl's warp out (works once the altar is done)            λ a belt lever (room beltLevers: the group of each, in order)
//   ♨ a steam vent or jet (room vents / jets, in order)           ⊗ a valve wheel (press E)   ◐ a pipe valve (Wing-rang)
const D1A_G={
  a:['..◔............','.##..........#.','.#..*.......##.','...............','..~~..........*','.~~~~......~~..','..~~......~~~~.','.*.........~~..','.#..s.........#','.##..........##','...............'],
  b:['...............','.##aaaaaaaaa##.','.#aaaaaaaaaaa#.','..aaa.....aaa..','..aa.......aa..','..aa...♪...aa..','..aa.......aa..','..aaa.....aaa..','.#aaaaaaaaaaa#.','.##aaaaaaaaa##.','.◔.........s...'],
  c:['wwww.......wwww','wwwa.......awww','wwa.........aww','aa....X.....aa.','a..............','a..............','a..............','aa..........aa.','wwa.........aww','wwwa.......awww','wwww.......wwww'],
  p:['####.......####','###.........###','##..*.....*..##','#.............#','#......¶......#','#.............#','#..s..........#','##...........##','###.........###','####.......####','#####.....#####'],
  f:['{{{{.......{{{{','{{{{......{{X{{','{{{.........{{{','{{..*........{{','{.............{','...............','...........*...','{.............{','{{...........{{','{{{.........{{{','{{{{.......{{{{'],
  d:['####.......####','###.........###','###....X....###','###.........⌒⌒#','.⌒⌒#########rr#','.rr#########⌒⌒#','.⌒⌒#########⌒⌒#','#⌒⌒⌒⌒⌒⌒r⌒⌒⌒⌒⌒⌒#','#⌒⌒⌒⌒⌒⌒r⌒⌒⌒⌒⌒⌒#','###############','###############'],
  e:['#======####=}==','#======####{===','#==aaaaaaaa{===','#==aaaaaaaa{===','._=aaaaaaaa{===','._=aβaaaaaa{===','._=aaaaaaaa{===','#==aβaβ♪aaaa###','##=aaaaaaaaa###','###aaaaaaaaa###','######...######'],
  g:['###{{{}{{{#####','###{{{{{{{#####','##...........##','#..*.......*...','#......D.......','#..............','#..............','#..*.......*...','##...........##','###.........###','####.......####'],
  h:['ⅲⅲⅲⅲⅲⅲⅲⅲⅲⅲⅲⅲⅲⅲⅲ','ⅲⅲⅲⅲⅲⅲ³³³ⅲⅲⅲⅲⅲⅲ','ⅲⅲⅲⅱⅱⅱⅱⅱⅱⅱⅱⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱⅱⅱⅱⅱⅱⅱⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱ=====²ⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱ=====²ⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱ==.==²ⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱ{...=ⅱⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱ{...=ⅱⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱ{.}.=ⅱⅱⅲⅲⅲ','ⅲⅲⅲⅱⅱ=...=ⅱⅱⅲⅲⅲ'],
  i:['...............','{{{.......~~...','{{{.......~~...','{{{.........ⅲⅲⅲ','{{{.........³ⅲⅲ','{{{.........³ⅲⅲ','{{{.........³ⅲⅲ','{{{.~~......ⅲⅲⅲ','{{{.~~.....{{{{','...........{{{{','...........{{{{'],
  j:['#####ⅲⅲⅲⅲⅲ#####','ⅲⅲⅲⅱⅱⅲⅲⅲⅲⅲççⅲⅲⅲ','ⅲⅲⅲⅱⅱⅱⅱⅱⅱⅱⅱⅱⅲⅲⅲ','ⅲⅲ³ⅱⅱⅱⅱⅱⅱⅱⅱⅱ³ⅲⅲ','ⅲⅲ³ⅱⅱ=====²ⅱ³Hⅲ','ⅲⅲ³ⅱⅱ={{{=²ⅱ³ⅲⅲ','ⅲⅲ³ⅱⅱ=...=²ⅱ³ⅲⅲ','ⅲⅲ³ⅱⅱ=...=ⅱⅱ³ⅲⅲ','ⅲⅲⅲⅱⅱ=.♪.=ⅱⅱⅲⅲⅲ','ⅲ}ⅲⅱⅱ=====ⅱⅱⅲⅲⅲ','####ⅱⅱⅱⅱⅱⅱⅱ####'],
  k:['##......:::::##','#.......:::::::','#.......::ⅱⅱⅱ::','#..X....::ⅱHⅱ::','........::ⅱⅱⅱ::','........:::::::','........:::::::','##......:::::##','###..ⅲ³³³ⅲ..###','###..ⅲⅲⅲⅲⅲ..###','####.ⅲⅲⅲⅲⅲ.####'],
  l:['###ⅱⅱⅱⅱYⅱⅱⅱ####','###ⅱⅱⅱⅱⅱⅱⅱⅱ####','##...........##','#..aaa...aaa..#','#..aYa...aYa...','#..aaa.X.aaa...','#..............','#.....²²²......','##....²²²....##','###.........###','####.......####'],
  m:['####.......####','###..=====..###','##..==X====..##','#...===/===...#','...............','.......00......','.......00......','#.............#','##.*.......*.##','###.........###','####.......####'],
  z:['####.......####','###...*.*...###','##...........##','#.............#','.......u......#','...............','..............#','#......X......#','##..¶.....◎..##','###.........###','####.......####']
};
// the Drowned Lagoon: x1_foes' lagoon (climbable ledges for the surge) with a rope up to the Crab Pools in the corner
const D1A_GB=(typeof C1_TPL!=='undefined'&&C1_TPL.lagoon?C1_TPL.lagoon:Array.from({length:23},()=>'.'.repeat(31))).map((r,j)=>j===21?r.slice(0,1)+'}'+r.slice(2):r);
const D1A_W={
  a:['###.........###','##...........##','#..*.......*..#','#.............#','#....#...#....#','#.............#','#....#...#....#','#.............#','#..s..........#','##...........##','###.........###'],
  b:['ooooooooooooooo','oooooʃʃXʃʃooooo','oooooʃʃʃʃʃooooo','ooooo.....ooooo','..........ooooo','..........→→→o.','..........ooooo','..>.......ooooo','oooooo...oooooo','oooooo...oooooo','oooooo...oooooo'],
  c:['###############','###############','###############','###############','.⊗.♨.♨.♨.♨.♨...','...............','.X.............','###############','###############','###############','###############'],
  d:['###.........###','##...........##','#..*......*...#','#.............#','......¶.......#','..............#','.......s......#','#.............#','##...........##','###.........###','####.......####'],
  e:['#####.....#####','##..........###','#λ.⇒⇒⇒⇒⇒⇓...##λ','#..⇑####⇓#####.','...⇑####⇓←←←←←.','...⇑####⇓←←←←←.','...⇑⇐⇐⇐⇐⇐←←←←←.','#.<......#####.','#.....λ......##','##...........##','#####.....#####'],
  f:['###############','...ooooooooo...','...ooooooooo.B.','...ooooooooo...','...ooooooooo.P.','.X.ooooooooo...','...ooooooooo...','...ooooooooo...','...ooooooooo...','...ooooooooo.S.','###############'],
  g:['###############','#..Z...Z...Z..#','#.............#','#.............#','...............','...............','#.............#','#.............#','#..##.....##..#','#..##.....##..#','#####.....#####'],
  h:['######...######','######...######','#▦▦▦▦▦...▦▦▦▦▦#','#▦▦▦▦▦......▦▦#','..▦▦▦▦▦▦▦.D.▦▦#','.@▦▦&▦▦&▦...▦▦#','..▦▦▦▦▦▦▦...▦▦#','#▦▦▦▦▦▦▦▦▦▦▦▦▦#','#▦▦▦▦▦▦▦▦▦▦▦▦▦#','#▦▦▦▦▦▦▦▦▦▦▦▦▦#','###############'],
  i:['######...######','#.........#####','#..oooooooooo.#','#..oooooooooo.#','...oo...ooooo..','..@oo.P.ooooo..','...oo...ooooo..','#..oooooooooo.#','#..oooooooooo.#','#..oooooooooo.#','###############'],
  j:['###############','#.....X.......#','#.............#','#→→→→→→→→→→→→.#','#..............','#..............','#..............','#←←←←←←←←←←←←.#','#.............#','#.>...........#','###############'],
  k:['###############','ⅱⅱⅱ.ⅱⅱⅱ.ⅱXⅱ.ⅱⅱⅱ','ⅱⅱⅱ.ⅱⅱⅱ.²²².ⅱⅱⅱ','...............','.......<.......','...............','...............','#22222222222#..','#⊗###########..','#############.>','###############'],
  l:['###############','##◐###◐####◐###','##o###o####o###','#.............#','#.♨...♨....♨...','#..............','#..............','#..###...###..#','#..#s#...#.#..#','#.............#','###############'],
  m:['####ⅱⅱⅱXⅱⅱⅱ####','...‗ⅱⅱⅱⅱⅱⅱⅱ#...','...#ⅱⅱⅱⅱⅱⅱⅱ#...','...ooooooooo...','...ooooooooo...','...ooooooooo...','...ooooooooo...','...ooooooooo...','...ooooooooo...','...............','...............'],
  n:['####.......####','###.........###','##..*.....*..##','#.............#','#....s........#','#.............#','#.............#','#.............#','##...........##','###.........###','###############'],
  z:['###############','#...*.....*...#','#.............#','#.....u.......#','...............','...............','......X....¶...','#.............#','#..◎..........#','#.............#','###############']
};
// the Drive Pit: x1_foes' open round pit, with the long stair up to the Great Boilers
const D1A_WB=(typeof C1_TPL!=='undefined'&&C1_TPL.pit?C1_TPL.pit:Array.from({length:23},()=>'.'.repeat(31))).map((r,j)=>j===8?r.slice(0,29)+'<'+r.slice(30):r);

// ---------- 5. the two dungeons
defineDungeon('c_gullcrag',{name:S('The Gullcrag Caves','The Gullcrag Caves'),level:11,theme:'c_sea',seed:5101,save:'c_gullcrag',dark:0.45,
  water:{start:2},abil:'claws',abilName:S('Climbing Claws','Climbing Claws'),dunKind:S('Sea caves','Sea caves'),
  story:(()=>{ const s=typeof c1DunStory==='function'?c1DunStory('c_gullcrag'):{}; return s; })(),
  floors:[
    {id:'1',name:S('The Low Caves','The Low Caves'),map:{rooms:{
      a:{at:[1,2],kind:'start',tpl:D1A_G.a,noPots:true,sign:S(`PEARL'S CAVES. MIND THE TIDE. - P.`,`PEARL'S CAVES. MIND THE TIDE.`)},
      b:{at:[1,1],kind:'fight',tpl:D1A_G.b,foes:[['crab',2],['c_gulper',1]],bell:'great',swirl:true,noPots:true,sign:S(`The Great Tide Bell. One ring: the tide turns. Every room of these caves breathes with it.`,`Ring the bell. The tide turns everywhere.`)},
      c:{at:[0,1],kind:'fight',tpl:D1A_G.c,foes:[['crab',3],['eel',2]],lockFight:true,solveOnClear:true,reward:'key',noPots:true},
      p:{at:[0,2],kind:'secret',tpl:D1A_G.p,loot:['coins','treat'],page:1,sign:S(`Carved deep in the rock: BILGEWATER WOZ ERE.`,`It says: BILGEWATER WOZ ERE.`)},
      f:{at:[0,0],kind:'fight',tpl:D1A_G.f,foes:[['c_gull',4],['c_gulper',1]],loot:['treasure+treat'],nests:true,noPots:true},
      d:{at:[2,1],kind:'free',tpl:D1A_G.d,foes:[['c_gulper',1]],loot:['compass'],kelp:true,noPots:true,noDecor:true},
      e:{at:[2,0],kind:'d1abarrels',tpl:D1A_G.e,bell:'little',swirl:true,climbTo:'c_gullcrag_2',climbDir:'up',climbArrive:'j',noPots:true,noDecor:true},
      g:{at:[1,0],kind:'shrine',tpl:D1A_G.g,climbTo:'c_gullcrag_2',climbDir:'up',climbArrive:'h',noPots:true}},
      links:[['a','b','open'],['b','c','open'],['c','p','crack'],['c','f','open'],['b','d','lock'],['d','e','tide'],['e','g','open'],['b','g','gate:g']]}},
    {id:'2',name:S('The High Galleries','The High Galleries'),map:{rooms:{
      h:{at:[1,1],kind:'free',tpl:D1A_G.h,foes:[['c_gull',3]],deep:true,climbTo:'c_gullcrag',climbDir:'down',climbArrive:'g',noPots:true,noDecor:true,sign:null},
      i:{at:[0,1],kind:'miniboss',c1boss:'c_brute',tpl:D1A_G.i,noPots:true,noDecor:true},
      l:{at:[0,0],kind:'eyes',tpl:D1A_G.l,loot:['treasure+potion'],sealChest:true,highEye:[7,0],noPots:true,sealText:S(`The chest is held shut by three stone eyes. Wake them all with arrows.`,`Wake the three eyes with arrows.`)},
      m:{at:[1,0],kind:'d1atilt',tpl:D1A_G.m,loot:['bkey'],tilt:['j','l'],hatch:true,below:'c_gullcrag_0',noPots:true,sealText:S(`The great chest is jammed on the high side of the tilted wreck. It will not budge. Something needs to level this old ship.`,`It is stuck on the tilted ship.`)},
      j:{at:[2,1],kind:'d1acistern',tpl:D1A_G.j,bell:'high',cistern:true,deep:true,climbTo:'c_gullcrag',climbDir:'down',climbArrive:'e',acc:['slash','spear','hammer','daggers'],noPots:true,noDecor:true},
      k:{at:[2,0],kind:'switches',tpl:D1A_G.k,loot:['dmap'],acc:['boomerang','whip'],window:true,noPots:true,sign:null}},
      links:[['h','i','open',{lvl:3}],['i','l','gate:i'],['l','m','open'],['h','j','open',{lvl:3}],['j','k','gate:j',{lvl:3}],['k','m','gate:k']]}},
    {id:'0',name:S('The Drowned Lagoon','The Drowned Lagoon'),map:{rooms:{
      B:{at:[0,0],span:[2,2],kind:'boss',c1boss:'c_pinch',tpl:D1A_GB,noPots:true,noDecor:true,climbTo:'c_gullcrag',climbDir:'up',climbArrive:'c',climbCell:[6,8]},
      z:{at:[2,1],kind:'reward',tpl:D1A_G.z,loot:['heart'],page:2,cradle:true,noPots:true}},
      links:[['B','z','gate:B']]}}
  ]});
defineDungeon('c_brassworks',{name:S('The Brassworks','The Brassworks'),level:11,theme:'c_brass',seed:5203,save:'c_brassworks',dark:0.35,
  abil:'grapple',abilName:S('Grapple Tail','Grapple Tail'),dunKind:S('A clockwork works','A clockwork works'),
  story:(()=>{ const s=typeof c1DunStory==='function'?c1DunStory('c_brassworks'):{}; s.end=[['narr',S(`You grab the great lever with both claws and pull. It does not move. You pull harder. Something deep in the shaft groans, gives, and then the whole drive turns with a CLUNK you feel in your teeth.`,`You pull the great lever. It sticks. Then: CLUNK! The drive turns!`)]]; return s; })(),
  floors:[
    {id:'3',name:S('The Roof Works','The Roof Works'),map:{rooms:{
      a:{at:[1,1],kind:'start',tpl:D1A_W.a,foes:[['c_tickbug',2]],noPots:true,sign:S(`WHIRLIGIG BRASSWORKS. AUTHORIZED PERSONNEL ONLY. (THAT MEANS ME.) - Lord P. Whirligig`,`WHIRLIGIG BRASSWORKS. ONLY ME ALLOWED.`)},
      b:{at:[1,0],kind:'fight',tpl:D1A_W.b,foes:[['c_tickbug',4],['c_tinman',1]],loot:['treasure'],stairGate:{type:'gate',room:'c',look:'steam'},beltSpeed:{0:150},noPots:true,noDecor:true},
      c:{at:[0,0],kind:'d1avalve',tpl:D1A_W.c,loot:['compass'],vents:[{ph:0},{ph:0.9},{ph:1.8},{ph:2.6},{ph:0.4,hard:true}],noPots:true,noDecor:true,sign:null},
      d:{at:[2,0],kind:'secret',tpl:D1A_W.d,loot:['coins'],page:3,pigeons:true,sign:S(`An old coat hangs on a hook. In its pocket: a note in neat writing. "Gone to see a man about a clock. Back in a hundred years. - P."`,`A coat. A note: "Back in a hundred years. - P."`)}},
      links:[['a','b','open'],['b','c','open'],['b','d','crack']]}},
    {id:'2',name:S('The Assembly Floor','The Assembly Floor'),map:{rooms:{
      e:{at:[1,0],kind:'fight',tpl:D1A_W.e,foes:[['c_tickbug',4]],beltLevers:[1,0,0],beltSpeed:{0:270,1:130},press:[5,4],noPots:true,noDecor:true},
      f:{at:[0,0],kind:'free',tpl:D1A_W.f,loot:['skey'],gear:{c:[7,5],len:4,notch:[13,4]},noPots:true,noDecor:true,sign:null},
      g:{at:[2,0],kind:'braziers',tpl:D1A_W.g,furnace:true,pen:[12,8],noPots:true,noDecor:true},
      h:{at:[2,1],kind:'shrine',tpl:D1A_W.h,dropFloor:true,noPots:true,noDecor:true},
      i:{at:[1,1],kind:'d1acrane',tpl:D1A_W.i,foes:[['c_tinman',2]],crane:{a:[12.2,5],b:[6,5],per:3.6,wait:1.2,crate:[6,3],plate:[6,5]},noPots:true,noDecor:true},
      j:{at:[0,1],kind:'miniboss',boss:['c_ram',S('The Foreman','The Foreman')],tpl:D1A_W.j,loot:['dmap'],sealChest:true,stairGate:{type:'gate',room:'j',look:'lift'},beltSpeed:{0:150},
        pistons:[{at:[1,5],dir:'e',len:3,per:3.4,ph:0},{at:[13,8],dir:'w',len:3,per:3.4,ph:1.7}],rings:[{at:[7,5]}],noPots:true,noDecor:true}},
      links:[['e','f','open'],['e','g','lock'],['g','h','gate:g'],['h','i','gate:h'],['e','i','gate:h'],['i','j','gate:i']]}},
    {id:'1',name:S('The Boiler Deck','The Boiler Deck'),map:{rooms:{
      k:{at:[1,0],kind:'free',tpl:D1A_W.k,loot:['treasure+potion'],stairGate:{type:'boss',look:'stair'},boiler:{face:[[8,2],[9,2],[10,2]],top:[9,1]},trolley:{a:[1.5,3.4],b:[13.5,3.4],per:7,to:[9,1],near:1.2},noPots:true,noDecor:true},
      l:{at:[0,0],kind:'d1apipes',tpl:D1A_W.l,code:['L','R','L'],jets:[{v:0,when:'R'},{v:1,when:'L'},{v:2,when:'R'}],acc:['boomerang','arrow','whip'],noPots:true,noDecor:true,sign:S(`A dented lunch box with a name on the lid: "PEARL". Painted inside: "MONDAY: LEFT, RIGHT, LEFT." Under it, smaller: "Every other day: soup."`,`A lunch box. Inside: "MONDAY: LEFT, RIGHT, LEFT."`)},
      m:{at:[2,0],kind:'free',tpl:D1A_W.m,loot:['bkey'],wheel:{c:[7,5.7],r:3.6,n:4,per:13},noPots:true,noDecor:true},
      n:{at:[2,1],kind:'secret',tpl:D1A_W.n,loot:['ore','coins'],soldier:true,sign:S(`An old tin soldier, sitting very straight. A note is pinned to his chest: "The third Bob was here. He went funny. - A friend."`,`A tin soldier. A note: "The third Bob went funny."`)}},
      links:[['k','l','open'],['k','m','gate:l'],['m','n','crack']]}},
    {id:'0',name:S('The Deep','The Deep'),map:{rooms:{
      B:{at:[0,0],span:[2,2],kind:'boss',c1boss:'c_ticktock',tpl:D1A_WB,noPots:true,noDecor:true},
      z:{at:[2,1],kind:'reward',tpl:D1A_W.z,loot:['heart'],page:4,workshop:true,noPots:true}},
      links:[['B','z','gate:B']]}}
  ]});
STORY.trial_c_gullcrag_shrine=null; STORY.trial_c_brassworks_shrine=null;   // Pearl's shrine story is played by d1aOnRoom / the shrine itself
for(const [id,shorts] of [['c_gullcrag',['1F','2F','B1']],['c_brassworks',['3F','2F','1F','B1']]]) DUNGEONS[id].floorIds.forEach((aid,i)=>{ if(AREADEFS[aid]) AREADEFS[aid].floorShort=shorts[i]; });
DUNGEONS.c_gullcrag.giftOK=Object.assign({},DUNGEONS.c_gullcrag.giftOK||{}); DUNGEONS.c_brassworks.giftOK=Object.assign({},DUNGEONS.c_brassworks.giftOK||{});
// the Foreman's name on the boss bar (the bar reads EDEF[type].name; he is a c_ram with e.caveBoss)
if(EDEF.c_ram){ const D=EDEF.c_ram; let n0=D.name, t0=D.title; const fm=()=>!!(G&&G.boss&&G.boss.type==='c_ram'&&G.boss.caveBoss&&!G.boss.dead&&d1aIn());
  Object.defineProperty(D,'name',{get(){ return fm()?S('The Foreman','The Foreman'):n0; },set(v){ n0=v; },configurable:true,enumerable:true});
  Object.defineProperty(D,'title',{get(){ return fm()?S('Boss of the Assembly Floor','Boss of the works'):t0; },set(v){ t0=v; },configurable:true,enumerable:true}); }
// ---------- 6. building a floor
const d1aDun=def=>!!(def&&D1A_IDS[dunRoot(def.id)]);
const D1A_LVL={1:TY.high,2:D1A_T.h2,3:D1A_T.h3};
const d1aFam=t=>t===TY.high||t===TY.ledge||t===D1A_T.step?1:(t===D1A_T.h2||t===D1A_T.c2||t===D1A_T.l2)?2:(t===D1A_T.h3||t===D1A_T.c3)?3:0;
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(!d1aDun(def)) return c;
    const w=c.w, M=CAVEMAP[def.id];
    // doors at a height: a link with {lvl:L} puts the doorway and the floor on both sides of it at level L
    for(const L of c.links){ const opt=(M.links[L.i]||[])[3]; if(!opt||!opt.lvl) continue; const ty=D1A_LVL[opt.lvl];
      for(const k of L.cells){ const i=k%w, j=(k-i)/w; c.typ[k]=ty; c.grid[k]=0; for(const [dx,dy] of L.vertical?[[0,-1],[0,1]]:[[-1,0],[1,0]]){ const q=(j+dy)*w+i+dx; c.grid[q]=0; c.typ[q]=ty; } } }
    // a mark on a high platform stands on it (a chest, an eye, a switch, a climb spot)
    for(const m of c.marks){ const k=m.j*w+m.i; if(c.typ[k]!==0) continue; const cnt=[0,0,0,0];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const f=d1aFam(c.typ[k+dx+dy*w]); if(f>=2) cnt[f]++; }
      if(cnt[2]>=3) c.typ[k]=D1A_T.h2; else if(cnt[3]>=3) c.typ[k]=D1A_T.h3; else if(cnt[2]+cnt[3]>=3) c.typ[k]=cnt[3]>=cnt[2]?D1A_T.h3:D1A_T.h2;
      else if(m.ch==='X'||m.ch==='d'){ let st=0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(c.typ[k+dx+dy*w]===D1A_T.step) st++; if(st>=3) c.typ[k]=D1A_T.step; } }
    // the rings of the Hook Hall hang over the floor that drops away
    for(const id in c.rooms){ const R=c.rooms[id];
      if(R.dropFloor) for(const m of c.marks) if(m.room===id&&m.ch==='&') c.typ[m.j*w+m.i]=D1A_T.drop;
      if(R.furnace) R.timed=d1aDiff(18,12,9); }
    return c; }; }
// climbing between floors: a room's climbArrive names the room on the other floor whose } (or climbCell) Ash comes out at
function d1aSpotIn(aid,room,cell){
  const M=CAVEMAP[aid], R=M&&M.rooms[room], def=AREADEFS[aid]; if(!R||!def) return null; const cs=def.cell||48; let f=null;
  if(cell) f=cell; else (R.tpl||[]).forEach((row,r)=>{ const q=row.indexOf('}'); if(q>=0&&!f) f=[q,r]; });
  if(!f) return null; const ci=R.at[0]*RSX+1+f[0], cj=R.at[1]*RSY+1+f[1];
  return {x:IZX+200+(ci+0.5)*cs,y:IZY+200+(cj+0.5)*cs};
}
{ const base=dunGoFloor; dunGoFloor=function(aid,arrive){
    try{ if(arrive&&!arrive.stairs&&!arrive.fall&&AREA&&AREA.d1a){ const R=caveRoomAt(player.x,player.y)||(arrive.x!=null?caveRoomAt(arrive.x,arrive.y):null);
      if(R&&R.climbArrive){ const q=d1aSpotIn(aid,R.climbArrive,R.climbCell); if(q) arrive={x:q.x,y:q.y}; } } }catch(e){ console.error(e); }
    return base(aid,arrive); }; }
// the rope up out of the Drowned Lagoon is only for leaving (no climb spot on the floor above), and never mid-fight
{ const base=p2SpotLink; p2SpotLink=function(A,def,s){ base(A,def,s); const R=A.rooms[s.room]; if(d1aDun(def)&&R&&R.climbTo){ s.to=R.climbTo; s.up=R.climbDir==='up'; } }; }
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ D1A.cis=null; base.apply(this,arguments); if(d1aDun(def)) try{ d1aBuild(A,def); }catch(e){ console.error(e); } }; }
{ const base=exitArea; exitArea=function(){ D1A.cis=null; return base.apply(this,arguments); }; }
const d1aP=(A,R,ci,cj)=>({x:A.x0+(R.ox+1+ci+0.5)*A.cave.cell,y:A.y0+(R.oy+1+cj+0.5)*A.cave.cell});
const d1aK=(A,R,ci,cj)=>(R.oy+1+cj)*A.cave.w+(R.ox+1+ci);
function d1aGate(A,o,cells){ o.cells=cells; A.gates.push(o); for(const k of cells) A.cave.dyn[k]=A.gates.length; A.objs.push(o); return o; }
function d1aBuild(A,def){
  const c=A.cave, cs=c.cell, w=c.w, SK=caveSid(def), root=dunRoot(def.id), C=A.p2||p2Cave(A);
  const X=A.d1a={root,SK,bar:new Map(),cover:new Set(),bells:[],belts:[],bgroups:{},levers:[],vents:[],jets:[],pistons:[],pvalves:[],moving:[],pages:[],warps:[],gauges:[],
    floatUp:false,dropped:false,turn:null,t:0,flood:null,cis:null};
  A.objs=A.objs.filter(o=>o.k!=='tspirit');   // Pearl's places: no Ember spirit over the shrine
  const g1=new Set(); for(const m of c.marks) if('⇑⇒⇓⇐'.includes(m.ch)) g1.add(m.j*w+m.i);
  for(let k=0;k<c.typ.length;k++){ const t=c.typ[k];
    if(t===D1A_T.bar) X.bar.set(k,{on:0,sunk:0});
    if(d1aClimb(t)) C.climb.add(k);
    if(t===D1A_T.belt){ const R=caveRoomAt(A.x0+(k%w+0.5)*cs,A.y0+(Math.floor(k/w)+0.5)*cs); const b={k,g:g1.has(k)?1:0,room:R?R.id:null,f:c.flow[k]<0?1:c.flow[k]}; X.belts.push(b); } }
  const byRoom={}; for(const m of c.marks) (byRoom[m.room]=byRoom[m.room]||[]).push(m);
  for(const id in A.rooms){ const R=A.rooms[id], ms=byRoom[id]||[]; let nl=0, nv=0, np=0;
    for(const m of ms){ const p={x:A.x0+(m.i+0.5)*cs,y:A.y0+(m.j+0.5)*cs}, k=m.j*w+m.i, oid=`${SK}_d1a_${id}_${m.c}_${m.r}`;
      switch(m.ch){
        case '♪': { const o={k:'d1abell',kind:R.bell||'great',x:p.x,y:p.y,id:oid,room:id,r:26,cd:0,swing:0};
          o.prompt=()=>o.kind==='high'?S('Ring the High Bell','Ring the bell'):S('Ring the Tide Bell','Ring the bell'); o.d1aAct=()=>d1aRing(o);
          A.objs.push(o); X.bells.push(o); A.lights.push({x:p.x,y:p.y-40,r:200,i:0.55}); addAreaCol({t:'c',x:p.x,y:p.y,r:12}); break; }
        case '◔': { const o={k:'d1agauge',x:p.x,y:p.y,id:oid,room:id,r:14}; o.prompt=()=>S('Read the tide gauge','Read the gauge'); o.d1aAct=()=>d1aSay([d1aTide()>=1?S('The tide gauge says HIGH. The sea is in the caves. Low tunnels are full and the barnacle arches are shut.','HIGH tide. The tunnels are full.'):S('The tide gauge says LOW. The sand is out, the tunnels are open, and the barnacle arches are clear.','LOW tide. The tunnels are open.')]);
          A.objs.push(o); X.gauges.push(o); break; }
        case '¶': { const o={k:'d1apage',n:R.page||1,x:p.x,y:p.y,id:oid,room:id,r:14}; o.prompt=()=>d1aPageHave(o.n)?null:S("Pick up the old page","Pick up the page"); o.d1aAct=()=>d1aPage(o); A.objs.push(o); X.pages.push(o); A.lights.push({x:p.x,y:p.y,r:120,i:0.5}); break; }
        case '◎': { const o={k:'d1awarp',x:p.x,y:p.y,id:oid,room:id}; A.objs.push(o); X.warps.push(o); A.lights.push({x:p.x,y:p.y,r:200,i:0.6}); break; }
        case 'λ': { const g=(R.beltLevers||[])[nl++]||0, o={k:'d1alever',g,x:p.x,y:p.y,id:oid,room:id,r:16,cd:0}; o.prompt=()=>S('Pull the belt lever','Pull the lever'); o.d1aAct=()=>d1aLever(o); addAreaCol({t:'c',x:p.x,y:p.y,r:10}); A.objs.push(o); X.levers.push(o); break; }
        case '♨': { if(R.vents){ const s=R.vents[nv++]||{}; const o=Object.assign({k:'d1avent',x:p.x,y:p.y,i:m.i,j:m.j,room:id,id:oid,len:3,dir:2,ph:0,on:false,warn:false,hitT:0},s); A.objs.push(o); X.vents.push(o); }
          else if(R.jets){ const s=R.jets[np++]||{}; const o=Object.assign({k:'d1avent',jet:true,x:p.x,y:p.y,i:m.i,j:m.j,room:id,id:oid,len:3,dir:2,ph:0,on:false,warn:false,hitT:0},s); A.objs.push(o); X.vents.push(o); } break; }
        case '⊗': { const o={k:'d1awheel',x:p.x,y:p.y,id:oid,room:id,r:20,spin:0}; o.prompt=()=>d1aWheelText(o); o.d1aAct=()=>d1aWheel(o); addAreaCol({t:'c',x:p.x,y:p.y,r:12}); A.objs.push(o); X.wheel=X.wheel||o; (X.wheels=X.wheels||[]).push(o); break; }
        case '◐': { const o={k:'d1apvalve',n:X.pvalves.length,x:p.x,y:p.y,id:oid,room:id,r:18,cd:0,state:G.found[oid]||'R',spin:0}; A.objs.push(o); X.pvalves.push(o); A.lights.push({x:p.x,y:p.y,r:110,i:0.4}); break; }
      } }
    // a hatch over the drop holes (the Boss Key opens it) and gates over stairs
    if(R.hatch){ const cells=[]; for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*w+i; if(c.typ[k]===DTY.drop) cells.push(k); }
      if(cells.length){ let sx=0, sy=0; for(const k of cells){ const q=tPos(k); sx+=q.x; sy+=q.y; } const id2=`${SK}_d1a_${id}_hatch`;
        const o=d1aGate(A,{k:'cgate',type:'boss',x:sx/cells.length,y:sy/cells.length,id:id2,r:60,opened:!!G.found[id2],closed:true,tmp:false,vertical:false,d1aLook:'hatch',room:id},cells);
        o.prompt=()=>o.opened?null:G.found['bkey_'+caveDsid(def)]?S('Open the hatch with the Boss Key','Open the hatch'):S('Look at the hatch','Look at the hatch'); } }
    if(R.stairGate&&A.dn){ const s=A.dn.stairs.find(q=>q.room===id); if(s){ const k=tCell(s.x,s.y), G0=R.stairGate, id2=`${SK}_d1a_${id}_sgate`;
      const o=d1aGate(A,{k:'cgate',type:G0.type,gateRoom:G0.room,x:s.x,y:s.y,id:id2,r:44,opened:!!G.found[id2],closed:true,tmp:false,vertical:false,d1aLook:G0.look||'lift',room:id},[k]);
      o.prompt=()=>!o.closed?null:o.type==='boss'?(G.found['bkey_'+caveDsid(def)]?S('Open the great door with the Boss Key','Open the big door'):S('Look at the great door','Look at the big door')):S('Look at it','Look at it'); } }
    // mechanisms
    if(R.cistern){ const h=new Map(); for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*w+i; if(c.grid[k]!==0||c.typ[k]===D1A_T.float) continue; const hh=dunH(k); if(hh>=0) h.set(k,hh); }
      const held=!!G.found.c_gull_cis||!!R.solved; D1A.cis=X.cis={room:id,h,wl:held?2.95:0,phase:held?'held':'idle',t:0,held}; X.floatUp=held; }
    if(R.dropFloor){ X.dropped=!!G.found.c_brass_hdrop; X.dropRoom=id; for(const o of C.rings) if(o.room===id){ o.hang=X.dropped; o.lvl=X.dropped?null:0; } }
    if(R.gear){ const g=R.gear, hub=d1aK(A,R,g.c[0],g.c[1]), H=[], V=[]; for(let d=-g.len;d<=g.len;d++){ H.push(d1aK(A,R,g.c[0]+d,g.c[1])); V.push(d1aK(A,R,g.c[0],g.c[1]+d)); }
      const hp=d1aP(A,R,g.c[0],g.c[1]); X.gear={room:id,hub,H,V,x:hp.x,y:hp.y,t:0,stun:0,state:'h',ang:0,notch:g.notch?d1aK(A,R,g.notch[0],g.notch[1]):-1}; }
    if(R.crane){ const q=R.crane, a=d1aP(A,R,q.a[0],q.a[1]), b=d1aP(A,R,q.b[0],q.b[1]), cp=d1aP(A,R,q.crate[0],q.crate[1]), pl=d1aP(A,R,q.plate[0],q.plate[1]);
      const hook={k:'p2_ring',p2:'ring',x:a.x,y:a.y,id:`${SK}_d1a_${id}_hook`,room:id,h:70,hang:true,cave:true,lvl:null,d1ahook:true}; A.objs.push(hook); C.rings.push(hook);
      const did=`${SK}_d1a_${id}_crate`, done=!!G.found[did]||!!R.solved;
      const crate={k:'p2_chainring',p2:'chainring',mode:'custom',x:cp.x,y:cp.y,id:did,room:id,h:46,r:12,strain:0,need:0.5,done,cave:true,d1acrate:true};
      crate.then=o=>d1aCrateDrop(o); if(!done) C.chains.push(crate);
      X.crane={room:id,a,b,per:q.per||3.6,wait:q.wait||1,t:0,hook,crate,plate:pl,plateK:tCell(pl.x,pl.y),home:{x:cp.x,y:cp.y},drop:null,landed:done};
      if(done) d1aCrateBlock(A,X.crane); A.objs.push({k:'dv',kind:'d1acrane',ref:X.crane,x:(a.x+b.x)/2,y:a.y,id:`${SK}_d1a_${id}_cranev`}); }
    for(const P0 of R.pistons||[]){ const d=DIRN[P0.dir]!=null?DIRN[P0.dir]:1, cells=[]; for(let n=0;n<(P0.len||3);n++) cells.push(d1aK(A,R,P0.at[0]+DIRS[d][0]*n,P0.at[1]+DIRS[d][1]*n));
      const p0=d1aP(A,R,P0.at[0],P0.at[1]); const col={t:'r',x0:p0.x,y0:p0.y,x1:p0.x,y1:p0.y,off:true}; addAreaCol(col);
      X.pistons.push({room:id,cells,d,len:P0.len||3,per:P0.per||3.4,ph:P0.ph||0,ext:0,col,x0:p0.x-DIRS[d][0]*cs*0.5,y0:p0.y-DIRS[d][1]*cs*0.5}); }
    for(const r0 of R.rings||[]){ const p=d1aP(A,R,r0.at[0],r0.at[1]); const o={k:'p2_ring',p2:'ring',x:p.x,y:p.y,id:`${SK}_d1a_${id}_ring${r0.at[0]}_${r0.at[1]}`,room:id,h:72,hang:true,cave:true,lvl:null}; A.objs.push(o); C.rings.push(o); }
    if(R.trolley){ const q=R.trolley, a=d1aP(A,R,q.a[0],q.a[1]), b=d1aP(A,R,q.b[0],q.b[1]), to=d1aP(A,R,q.to[0],q.to[1]);
      const ring={k:'p2_ring',p2:'ring',x:a.x,y:a.y,id:`${SK}_d1a_${id}_trolley`,room:id,h:84,hang:false,cave:true,lvl:2,to:{x:to.x,y:to.y},d1atrolley:true}; A.objs.push(ring);
      X.trolley={room:id,a,b,per:q.per||7,t:0,ring,to,near:(q.near||1.2)*cs,inList:false}; A.objs.push({k:'dv',kind:'d1atrolley',ref:X.trolley,x:(a.x+b.x)/2,y:a.y,id:`${SK}_d1a_${id}_trolv`}); }
    if(R.wheel){ const q=R.wheel, cp=d1aP(A,R,q.c[0],q.c[1]), rings=[];
      for(let n=0;n<(q.n||4);n++){ const o={k:'p2_ring',p2:'ring',x:cp.x,y:cp.y,id:`${SK}_d1a_${id}_wring${n}`,room:id,h:60,hang:true,cave:true,lvl:null,d1awheel:true}; A.objs.push(o); C.rings.push(o); rings.push(o); }
      X.wheel2={room:id,cx:cp.x,cy:cp.y,r:q.r*cs,per:q.per||13,rings,ang:0}; A.objs.push({k:'dv',kind:'d1awheel2',ref:X.wheel2,x:cp.x,y:cp.y,id:`${SK}_d1a_${id}_wheelv`}); }
    if(R.boiler){ X.boiler={room:id,face:R.boiler.face.map(([a,b])=>d1aK(A,R,a,b)),cool:!!G.found.c_brass_b3cool}; d1aBoilerSync(A); }
    if(R.press){ const p=d1aP(A,R,R.press[0],R.press[1]); X.press={room:id,x:p.x+cs*0.5,y:p.y,t:0}; }
  }
  d1aBeltCache(A);
  d1aDecor(A,def);
  // Pearl's statue, cushion, cradle and lever (the Trials' prompts talk about Ember's flame)
  const gull=root==='c_gullcrag', SH=D1A_SHRINE[root];
  for(const o of A.objs){
    if(o.tobj==='shrine') o.prompt=()=>!hasAbil(SH.abil)?(gull?S(`Touch the statue's hand`,`Touch the statue's hand`):S('Look at the velvet cushion','Look at the cushion')):(gull?S(`Rest by Pearl's statue`,`Rest by the statue`):S(`Rest by Pearl's cushion`,`Rest by the cushion`));
    if(o.tobj==='altar') o.prompt=()=>trialDone(root)?(gull?S(`Look at Pearl's cradle`,`Look at the cradle`):S('Look at the great lever','Look at the lever')):(gull?S(`Touch Pearl's cradle`,`Touch the cradle`):S('Pull the great lever','Pull the lever')); }
  refreshCaveGates();
  // after Pearl's statue gave the claws, arriving on the High Galleries opens the grate in the Tide Hall for good
  if(root==='c_gullcrag'&&def.floor==='2'&&hasAbil('claws')) G.found['cv_c_gullcrag_g_solved']=true;
}
// ---------- 7. every frame
{ const base=updateCaveRooms; updateCaveRooms=function(dt){ const A=AREA; base.apply(this,arguments); if(A&&AREA===A&&A.d1a) try{ d1aUpdate(A,dt); }catch(e){ console.error(e); } }; }
function d1aUpdate(A,dt){
  const X=A.d1a, p=player, k=tCell(p.x,p.y), R=caveRoomAt(p.x,p.y), air=airborne();
  X.t+=dt;
  if(!air&&!p.flying&&k>=0){ const h=dunH(k); if(h>=0) D1A.toH=h; }
  if(R&&R!==X.room){ X.room=R; d1aOnRoom(A,R); }
  for(const o of X.bells){ if(o.cd>0) o.cd-=dt; o.swing*=Math.pow(0.3,dt); }
  for(const o of X.levers) if(o.cd>0) o.cd-=dt;
  for(const o of X.pvalves){ if(o.cd>0) o.cd-=dt; o.spin*=Math.pow(0.1,dt); }
  for(const o of X.wheels||[]) o.spin*=Math.pow(0.2,dt);
  if(X.root==='c_gullcrag') d1aGullTick(A,dt,R,k,air); else d1aBrassTick(A,dt,R,k,air);
  d1aHangFollow();
  for(const o of X.pages) if(!d1aPageHave(o.n)&&!air&&dist(p.x,p.y,o.x,o.y)<30) d1aPage(o);
  for(const o of X.warps) if(trialDone(X.root)&&!X.warping&&scene==='play'&&dist(p.x,p.y,o.x,o.y)<30) d1aWarp(A,o);
}
// a moving ring carries whoever hangs from it
function d1aHangFollow(){ if(typeof P2==='undefined'||!P2.mv) return; const M=P2.mv; if(M.kind==='hang'&&M.t&&M.t.o&&(M.t.o.d1ahook||M.t.o.d1awheel)){ M.x=M.t.o.x; M.y=M.t.o.y+2; } }
function d1aOnRoom(A,R){
  const X=A.d1a, first=d1aOnce(`v_${X.SK}_${R.id}`), SH=D1A_SHRINE[X.root];
  if(R.kind==='shrine'&&SH&&!hasAbil(SH.abil)) d1aSoon(SH.key,()=>!hasAbil(SH.abil));
  if(X.root==='c_gullcrag'){
    if(R.id==='e'&&first) d1aSoon('c_gull_barrel');
    if(R.id==='d'&&d1aTide()>=1) later(0.5,()=>{ if(scene==='play'&&d1aOnce('tip_d_high')) taunt('c_pearl',S(`My kelp tunnels fill to the roof at high tide. Ring the Great Bell and come back when the sea is out.`,`High tide fills the tunnels. Ring the Great Bell for low tide.`)); });
    if(R.id==='l'&&d1aTide()>=1) later(0.5,()=>{ if(scene==='play'&&d1aOnce('tip_l_high')) taunt('c_pearl',S(`Two of my echo eyes are under the water. You'll want the tide out. The Great Bell's down in the hub. Hit it hard.`,`Two eyes are under water. Ring the Great Bell for low tide.`)); });
    if(R.id==='j'&&first) later(0.6,()=>{ if(scene==='play') taunt('c_pearl',S(`My cistern. Ring the bell at the bottom and the sea comes up from below. You'd better be quicker than the sea.`,`Ring the bell at the bottom. Then climb fast!`)); });
  } else {
    if(R.id==='z') d1aSoon('c_brass_end');
    if(R.id==='e'&&first) later(1.2,()=>{ if(scene==='play') taunt('c_pearl',S(`My belts run in jerks while the clock is stopped. The levers turn them round. Mind the fast one.`,`The levers turn the belts round.`)); });
    if(R.id==='f'&&first) later(0.6,()=>{ if(scene==='play') taunt('c_pearl',S(`Cross while the bridge is lined up. Or jam it. Or give the gear a knock to make it think.`,`Cross when the bridge lines up. Or jam it!`)); });
    if(R.id==='g'&&first) later(0.6,()=>{ if(scene==='play'&&!R.solved) taunt('c_pearl',S(`Three furnaces, one breath each. They cool fast, so be quick. Pressure opens my doors.`,`Light all three furnaces. Be quick!`)); });
  }
}

// ---- the Gullcrag Caves: the tide, the swirl, the barrels, Pearl's flood, the cistern, the tilted wreck
function d1aRing(o){
  const A=AREA, X=A&&A.d1a; if(!X||o.cd>0) return; o.cd=1.1; o.swing=1;
  d1aSnd(o.kind==='great'?'bell':'bellhi'); shake(2); emit(o.x,o.y-46,14,{col:'255,226,150',smin:30,smax:120,lmin:.3,lmax:.7,zmin:2,zmax:4});
  G.found.c_gull_bell_rung=true;
  if(o.kind==='high'){ d1aCisRing(A,o); return; }
  const cur=X.turn?X.turn.to:d1aTide(), to=cur>=1?0:2, d=d1aDiff(3.5,2.5,2.0);
  X.turn={to,t:d,T:d}; d1aSnd(to?'surge':'drain',0.7);
  setBanner(to?S('The tide is turning: HIGH','High tide is coming!'):S('The tide is turning: LOW','Low tide is coming!'),to?S('The sea is coming back into the caves.','The sea is coming in.'):S('The sea is running out of the caves.','The sea is going out.'),d);
}
function d1aSeenSafe(key){ try{ return typeof c1Seen==='function'&&c1Seen(key); }catch(e){ return false; } }
function d1aTideSet(A,L){
  dunSetLevel(L,null); G.found.c_gull_tide=L>=1?'high':'low';
  setBanner(L>=1?S('High tide!','High tide!'):S('Low tide!','Low tide!'),L>=1?S('The sea fills the caves. Sand turns to water, tunnels fill, the barnacle arches close and the barrels float.','Water everywhere! Barrels float.'):S('The sea drains away. Sand, open tunnels, open arches. The eels are stuck in their pools.','The sand is dry. Tunnels open.'),3);
  refreshCaveGates(); saveGame();
}
function d1aGullTick(A,dt,R,k,air){
  const X=A.d1a, p=player, c=A.cave, hi=d1aTide()>=1;
  // Pearl points out the Great Bell the first time Ash comes near it (after the fight)
  const gb=X.bells.find(o=>o.kind==='great'); if(gb&&!X.bellTold&&scene==='play'&&dist(p.x,p.y,gb.x,gb.y)<300&&!(R&&R.enemies.some(e=>!e.dead))){ X.bellTold=true; if(!d1aSeen('c_gull_bell')) d1aPlay('c_gull_bell'); }
  if(X.turn){ X.turn.t-=dt; if(Math.random()<dt*10){ const q=X.bells[0]; if(q) emit(q.x+rand(-220,220),q.y+rand(-160,160),1,{col:'220,245,255',glow:false,smin:10,smax:40,lmin:.4,lmax:.8,zmin:1,zmax:2}); } if(X.turn.t<=0){ const to=X.turn.to; X.turn=null; d1aTideSet(A,to); } }
  // tide arches follow the water (but never close on Ash)
  for(const o of A.gates) if(o.type==='tide'&&o.closed!==(hi&&!gateOnAsh(o))){ refreshCaveGates(); break; }
  // the slow clockwise swirl of high water in the round rooms
  if(hi&&R&&R.swirl&&k>=0&&tWet(k)&&!air&&!p.flying&&canWalkWater()&&scene==='play'&&!(typeof P2!=='undefined'&&P2.mv)){ const a=angTo(R.cx,R.cy,p.x,p.y)+Math.PI/2; tNudge(p,Math.cos(a)*70*dt,Math.sin(a)*70*dt); }
  // barrels sink if you stand on them too long (afloat only)
  const sinkT=d1aDiff(3.5,2,1.6);
  for(const [q,b] of X.bar){ if(b.sunk>0){ b.sunk-=dt; if(b.sunk<=0){ b.sunk=0; const s=tPos(q); emit(s.x,s.y,10,{col:'200,235,255',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:1,zmax:3}); } continue; }
    if(hi&&q===k&&!air){ b.on+=dt; if(!X.barTold&&scene==='play'){ X.barTold=true; d1aTip('barrel',S('Afloat!','Afloat!'),S('Barrels sink if you stand on one too long. Jump barrel to barrel!','Jump from barrel to barrel!')); }
      if(b.on>sinkT){ b.sunk=3.2; b.on=0; d1aSnd('splash'); const s=tPos(q); emit(s.x,s.y,16,{col:'200,235,255',glow:false,ang:-Math.PI/2,spread:1.2,smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:4}); ftext(s.x,s.y-30,S('Glug!','Glug!'),'#bfe6ff',13); } }
    else b.on=Math.max(0,b.on-dt*1.5); }
  // the barrel lift is done once Ash stands on the high ledge beside it
  if(R&&R.kind==='d1abarrels'&&!R.solved&&hi&&k>=0&&dunH(k)===1&&!X.bar.has(k)&&!air) solveRoom(R,true);
  if(X.flood) d1aFloodTick(A,dt,R,k,air);
  if(X.cis) d1aCisTick(A,dt,R,k,air);
  // the tilted wreck levels once the cistern and the echo eyes are both done
  for(const id in A.rooms){ const Q=A.rooms[id]; if(Q.kind==='d1atilt'&&!Q.solved&&(Q.tilt||[]).every(r=>A.rooms[r]&&A.rooms[r].solved)){ solveRoom(Q,true); X.tiltT=0;
    shake(6); d1aSnd('creak'); setBanner(S('The wreck groans and levels','The ship levels out!'),S('The great chest slides down the deck into reach.','The big chest slides down!'),3); } }
  if(X.tiltT!=null) X.tiltT=Math.min(1,X.tiltT+dt*0.6);
  // the rope out of the lagoon is for leaving, not for running from a fight
  if(A.p2) for(const s of A.p2.spots){ const Q=A.rooms[s.room]; if(Q&&Q.climbTo&&Q.climbCell) s.to=G.fightSite?null:Q.climbTo; }
}
// Pearl's hall: when the claws are given, the sea rises in the hall and the only way out is up the cracked wall
function d1aFloodStart(A){ const X=A&&A.d1a; if(!X) return; const R=caveRoomAt(player.x,player.y); if(!R||R.kind!=='shrine') return;
  X.flood={room:R.id,t:0,lvl:0,max:d1aDiff(0.45,1,1),stT:0,gates:[],shut:true}; for(const L of R.links){ const o=A.gates.find(g=>g.link===L); if(o){ o.tmp=true; X.flood.gates.push(o); } } refreshCaveGates();
  later(2.8,()=>{ if(AREA===A){ d1aSnd('surge'); setBanner(S('The tide is coming in!','The tide is coming in!'),S('Climb the cracked wall: walk into it and keep pushing.','Walk into the cracked wall to climb!'),4); } }); }
function d1aFloodTick(A,dt,R,k,air){
  const X=A.d1a, F=X.flood, p=player, Q=A.rooms[F.room]; F.t+=dt; if(F.t>2.6) F.lvl=Math.min(F.max,F.lvl+dt*0.3);
  const inQ=R===Q;
  if(inQ&&F.lvl>0.15&&k>=0&&dunH(k)===0&&!air&&!(typeof P2!=='undefined'&&P2.mv)){ p.slowT=Math.max(p.slowT||0,0.25);
    if(F.lvl>0.8&&d1aDI()>0){ F.stT-=dt; if(F.stT<=0){ F.stT=1.2; if(hurtPlayer(p.maxHp*0.03,p.x,p.y,0)) ftext(p.x,p.y-30,S('Brrr! Climb!','Brrr! Climb!'),'#bfe6ff',13); } } }
  if(Math.random()<dt*6&&inQ) emit(Q.cx+rand(-300,300),Q.cy+rand(-60,220),1,{col:'220,245,255',glow:false,smin:10,smax:40,lmin:.4,lmax:.8,zmin:1,zmax:2});
  // once Ash is up the wall (or gone), the hall calms down; the grate to the Tide Hall opens when he reaches the galleries
  if(F.shut&&(!inQ||(k>=0&&dunH(k)>=1))){ F.shut=false; for(const o of F.gates) o.tmp=false; refreshCaveGates(); }
}
// the Drip Cistern: the High Bell (a good whack, not a shot) floods the tiers from below, one level every few seconds.
// Hit the switch on the top ledge while the water is coming and it keeps rising to the top and stays there.
const D1A_CIS={per:()=>d1aDiff(5,3,2.4),off:0.8};   // water line = t/per - off: the floor goes under after (0.08+off)*per s
const D1A_MELEE={slash:1,spear:1,hammer:1,daggers:1};
function d1aCisRing(A,o){
  const C=A.d1a.cis; if(!C) return;
  if(C.held){ ftext(o.x,o.y-50,S('The cistern is already full.','It is full.'),'#bfe6ff',13); return; }
  if(C.phase!=='idle'){ ftext(o.x,o.y-50,S('The water is already coming! Climb!','Climb!'),'#bfe6ff',13); return; }
  C.phase='rise'; C.t=0; C.wl=-D1A_CIS.off; d1aSnd('surge'); shake(3);
  setBanner(S('The cistern floods!','The water rises!'),S('The sea comes up from below, one ledge at a time. Climb ahead of it and hit the switch on the top!','Climb up fast! Hit the switch on top!'),3.4);
}
function d1aCisTick(A,dt,R,k,air){
  const X=A.d1a, C=X.cis, p=player, Q=A.rooms[C.room], per=D1A_CIS.per();
  if(C.phase==='rise'){ C.t+=dt; C.wl=Math.min(2.95,-D1A_CIS.off+C.t/per); if(C.wl>=2.95){ C.phase=C.held?'held':'top'; C.t=0; } if(Math.random()<dt*3) d1aSnd('splash',0.25); }
  else if(C.phase==='top'){ C.t+=dt; if(C.t>d1aDiff(9,6,5)){ C.phase='drain'; d1aSnd('drain'); if(R===Q) ftext(p.x,p.y-40,S('The water drains away again.','It drains away.'),'#bfe6ff',13); } }
  else if(C.phase==='drain'){ C.wl=Math.max(0,C.wl-dt*0.6); if(C.wl<=0){ C.wl=0; C.phase='idle'; } }
  // the switch on the top ledge holds the water, but only while it is coming
  const sw=A.objs.find(o=>o.k==='tswitch'&&o.room===C.room);
  if(sw&&sw.on&&!C.held){ if(C.phase==='rise'||C.phase==='top'){ C.held=true; if(C.phase==='top') C.phase='held'; G.found.c_gull_cis=true; solveRoom(Q,true); d1aSnd('clank'); shake(4);
      setBanner(S('The water holds!','The water holds!'),S('The sea keeps rising to the very top and stays there. Old crates bob up by the north door!','Crates float up. A bridge!'),3.4); saveGame(); }
    else { sw.on=false; sw.lit=false; ftext(sw.x,sw.y-34,S('Nothing to hold back yet. Ring the High Bell at the bottom first!','Ring the bell first!'),'#ffe0b0',13); } }
  if(C.held&&C.wl>2.4&&!X.floatUp){ X.floatUp=true; d1aSnd('splash'); }
  // caught by the rising water: it carries Ash back up to the west ledge and drains away
  if(R===Q&&k>=0&&!air&&!(typeof P2!=='undefined'&&P2.mv)&&C.h.has(k)&&C.h.get(k)<C.wl-0.08){
    const to=d1aP(A,Q,1,5); d1aSnd('splash'); emit(p.x,p.y,20,{col:'200,235,255',glow:false,ang:-Math.PI/2,spread:1.4,smin:40,smax:160,lmin:.3,lmax:.7,zmin:2,zmax:4});
    p.x=to.x; p.y=to.y; p.kvx=p.kvy=0; const T=A.tri; T.lx=p.x; T.ly=p.y; T.safe={x:p.x,y:p.y}; G.fade=0.6;
    if(!C.held){ C.phase='drain'; if(d1aDI()>0&&!(window.__eb&&window.__eb.god)) hurtPlayer(p.maxHp*0.06,p.x,p.y,0); ftext(p.x,p.y-34,S('Splash! Too slow. Try again!','Splash! Try again!'),'#bfe6ff',14); } }
  D1A.cis=C;
}

// ---- the Brassworks: belts, vents and jets, the gear bridge, pistons, the crane yard, the trolley, the ferris gear
function d1aBeltCache(A){ const X=A.d1a; X.brev={}; for(const b of X.belts){ const key=b.room+'_'+b.g; if(X.brev[key]==null) X.brev[key]=!!G.found[`c_bl_${X.SK}_${key}`]; } }
function d1aBeltDir(X,b){ return X.brev[b.room+'_'+b.g]?(b.f+2)%4:b.f; }
const d1aBeltsOn=X=>!!G.flags.c_clock_on||((X.t%4.5)<3);
function d1aOnBelt(e){ const A=AREA, X=A&&A.d1a; if(!X||!X.belts.length) return false; const k=tCell(e.x,e.y); return k>=0&&A.cave.typ[k]===D1A_T.belt; }
if(typeof c1Belt==='function'){ const base=c1Belt; c1Belt=function(e){ return base(e)||d1aOnBelt(e); }; }
function d1aLever(o){
  const A=AREA, X=A&&A.d1a; if(!X||o.cd>0) return; o.cd=0.6; const key=`${o.room}_${o.g}`; X.brev[key]=!X.brev[key]; G.found[`c_bl_${X.SK}_${key}`]=X.brev[key]; o.flip=!o.flip;
  d1aSnd('clank'); shake(2); setBanner(S('Clunk!','Clunk!'),S('The belts turn round and run the other way.','The belts run the other way!'),1.8); saveGame();
}
function d1aWheelText(o){ const A=AREA, R=A&&A.rooms[o.room]; if(!R) return null; if(R.boiler) return A.d1a.boiler&&A.d1a.boiler.cool?S('Open the boiler valve','Open the valve'):S('Shut the boiler valve','Shut the valve'); return R.solved?null:S('Turn the big valve wheel','Turn the valve'); }
function d1aWheel(o){
  const A=AREA, X=A&&A.d1a, R=A&&A.rooms[o.room]; if(!R) return; o.spin=1; d1aSnd('creak');
  if(R.boiler&&X.boiler){ X.boiler.cool=!X.boiler.cool; G.found.c_brass_b3cool=X.boiler.cool; d1aBoilerSync(A); d1aSnd(X.boiler.cool?'drain':'steam');
    setBanner(X.boiler.cool?S('The third boiler cools','The boiler cools'):S('The third boiler heats up','The boiler heats up'),X.boiler.cool?S('The steam dies down. Its riveted side is safe to climb now.','Now you can climb it.'):S('Steam pours out of its sides again.','Hot steam again!'),2.4); saveGame(); return; }
  if(!R.solved){ solveRoom(R,true); d1aSnd('steam'); shake(3); setBanner(S('The steam goes away down the pipes','The steam goes away'),S('Far off, the hatch on the catwalks stops hissing.','The hatch stops hissing.'),3); }
}
function d1aBoilerSync(A){ const X=A.d1a, B=X.boiler, C=A.p2; if(!B||!C) return; for(const k of B.face){ if(B.cool) C.climb.add(k); else C.climb.delete(k); } }
function d1aPValve(o,src){
  const A=AREA, X=A.d1a, R=A.rooms[o.room]; o.cd=0.5; o.spin=1; o.state=o.state==='L'?'R':'L'; G.found[o.id]=o.state; d1aSnd('clank');
  ftext(o.x,o.y-30,o.state==='L'?S('LEFT','LEFT'):S('RIGHT','RIGHT'),'#ffe6b0',14);
  if(R&&!R.solved&&R.code&&X.pvalves.filter(q=>q.room===o.room).map(q=>q.state).join()===R.code.join()){ solveRoom(R,true); d1aSnd('steam'); shake(4); setBanner(S('The steam is routed away!','The steam stops!'),S('With a long sigh the pipes go quiet. The steam blocking the Gearworks door vents into the sea.','The door to the Gearworks is clear!'),3.2); }
  saveGame();
}
function d1aGearStun(g){ if(g.jam) return; g.stun=3; g.state='h'; d1aSnd('clank'); shake(2); const A=AREA; ftext(g.x,g.y-40,S('CLANK! The gear stops!','CLANK!'),'#ffe0a0',14); }
function d1aBrassTick(A,dt,R,k,air){
  const X=A.d1a, p=player, c=A.cave, cs=c.cell, onFoot=!air&&!p.flying&&!(typeof P2!=='undefined'&&P2.mv)&&!(A.dn&&A.dn.ride)&&scene==='play';
  // conveyor belts: they run in jerks (3 s on, 1.5 s off) while the Great Clock is stopped
  if(X.belts.length){ const on=d1aBeltsOn(X); X.beltOn=on;
    if(on){ if(k>=0&&c.typ[k]===D1A_T.belt&&onFoot){ const b=X.belts.find(q=>q.k===k); if(b){ const Rb=A.rooms[b.room], spd=(Rb&&Rb.beltSpeed&&Rb.beltSpeed[b.g])||130, d=DIRS[d1aBeltDir(X,b)]; tNudge(p,d[0]*spd*dt,d[1]*spd*dt); } }
      for(const e of G.enemies){ if(e.dead||!e.inArea||e.flying) continue; const q=tCell(e.x,e.y); if(q<0||c.typ[q]!==D1A_T.belt) continue; const b=X.belts.find(z=>z.k===q); if(!b) continue; const d=DIRS[d1aBeltDir(X,b)]; tNudge(e,d[0]*100*dt,d[1]*100*dt); } } }
  // steam vents (on a beat) and pipe jets (set by the valves): they shove and sting
  for(const v of X.vents){
    if(v.jet){ const V=X.pvalves[v.v]; v.on=!!(V&&V.state===v.when&&!(A.rooms[v.room]&&A.rooms[v.room].solved)); v.warn=false; }
    else if(v.hard&&d1aDI()<2) { v.on=false; v.warn=false; continue; }
    else { const on=d1aDiff(0.8,1,1.2), off=d1aDiff(2.6,2,1.6), per=on+off, t=(X.t+(v.ph||0)*per/3.4)%per, was=v.on; v.on=t<on; v.warn=!v.on&&t>per-0.5;
      if(v.warn&&!v.hissed&&R&&R.id===v.room){ v.hissed=true; d1aSnd('hiss',0.5); } if(v.on&&!was&&R&&R.id===v.room) d1aSnd('steam',0.5); if(!v.warn) v.hissed=false; }
    if(v.hitT>0) v.hitT-=dt;
    if(v.on&&R&&R.id===v.room&&k>=0&&!(typeof P2!=='undefined'&&P2.mv&&P2.mv.kind==='hang')){ const i=k%c.w, j=(k-i)/c.w, d=DIRS[v.dir]; let inV=false; for(let n=0;n<v.len;n++) if(i===v.i+d[0]*n&&j===v.j+d[1]*n) inV=true;
      if(inV){ tNudge(p,d[0]*260*dt,d[1]*260*dt); if(v.hitT<=0){ v.hitT=0.8; if(hurtPlayer(p.maxHp*0.04,v.x,v.y,120)) ftext(p.x,p.y-32,S('Hot!','Hot!'),'#ffd0a0',13); } } } }
  // the gear bridge turns a quarter every few seconds; a crate in the notch jams it straight, a Wing-rang knock stops it
  if(X.gear){ const g=X.gear, al=d1aDiff(2.4,1.6,1.2), per=4, tr=0.35; g.t+=dt;
    const notch=g.notch>=0&&A.objs.find(o=>o.k==='plate'&&o.cj*c.w+o.ci===g.notch);
    g.jam=!!(notch&&notch.pressed); if(g.stun>0) g.stun-=dt;
    let st, ang; const ph=g.t%per;
    if(g.jam||g.stun>0){ st='h'; ang=0; if(g.stun>0) g.t=0; }
    else if(ph<al){ st='h'; ang=0; } else if(ph<al+tr){ st='turn'; ang=(ph-al)/tr*Math.PI/2; } else if(ph<per-tr){ st='v'; ang=Math.PI/2; } else { st='turn'; ang=Math.PI/2*(1-(ph-(per-tr))/tr); }
    if(st!==g.state){ if(st==='turn') d1aSnd('gear',0.6); g.state=st; }
    g.ang=ang; X.cover.clear(); X.cover.add(g.hub); if(st==='h') for(const q of g.H) X.cover.add(q); else if(st==='v') for(const q of g.V) X.cover.add(q); }
  // pistons slide out of the walls on a rhythm and shove
  for(const P0 of X.pistons){ const t=(X.t+P0.ph)%P0.per; let e;
    if(t<0.35) e=t/0.35; else if(t<1.35) e=1; else if(t<1.7) e=1-(t-1.35)/0.35; else e=0;
    if(e>0.05&&P0.ext<=0.05&&R&&R.id===P0.room) d1aSnd('stamp',0.5);
    P0.ext=e; const L=e*P0.len*cs, d=DIRS[P0.d], hw=cs*0.42;
    const x0=P0.x0, y0=P0.y0, x1=x0+d[0]*L, y1=y0+d[1]*L;
    P0.col.x0=Math.min(x0,x1)-(d[0]?0:hw); P0.col.x1=Math.max(x0,x1)+(d[0]?0:hw); P0.col.y0=Math.min(y0,y1)-(d[1]?0:hw); P0.col.y1=Math.max(y0,y1)+(d[1]?0:hw); P0.col.off=e<0.08;
    if(!P0.col.off&&p.x>P0.col.x0-p.r&&p.x<P0.col.x1+p.r&&p.y>P0.col.y0-p.r&&p.y<P0.col.y1+p.r){ tNudge(p,d[0]*320*dt,d[1]*320*dt); if(!(P0.hitT>0)&&d1aDI()>0){ P0.hitT=1; hurtPlayer(p.maxHp*0.05,p.x-d[0]*20,p.y-d[1]*20,160); } }
    if(P0.hitT>0) P0.hitT-=dt; }
  // the crane yard: the hook swings between the east side and the island; a pulled crate drops toward Ash
  if(X.crane){ const q=X.crane, T=q.per*2+q.wait*2; q.t=(q.t+dt)%T; let f;
    if(q.t<q.wait) f=0; else if(q.t<q.wait+q.per) f=(q.t-q.wait)/q.per; else if(q.t<q.wait*2+q.per) f=1; else f=1-(q.t-q.wait*2-q.per)/q.per;
    const e=f<0.5?2*f*f:1-Math.pow(-2*f+2,2)/2; q.f=e; q.hook.x=lerp(q.a.x,q.b.x,e); q.hook.y=lerp(q.a.y,q.b.y,e)-Math.sin(e*Math.PI)*cs*0.7;
    if(q.drop){ const D=q.drop; D.t+=dt; if(D.t>=0.55){ q.drop=null; d1aCrateLand(A,q,D); } } }
  // the ceiling trolley in the Great Boilers: a ring you can only reach while it is over the third boiler
  if(X.trolley){ const q=X.trolley, C=A.p2; q.t=(q.t+dt)%(q.per*2); const f=q.t<q.per?q.t/q.per:2-q.t/q.per, e=f<0.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
    q.ring.x=lerp(q.a.x,q.b.x,e); q.ring.y=q.a.y; const near=Math.abs(q.ring.x-q.to.x)<q.near;
    if(near&&!q.inList){ C.rings.push(q.ring); q.inList=true; } else if(!near&&q.inList&&!(P2.mv&&P2.mv.t&&P2.mv.t.o===q.ring)){ const i=C.rings.indexOf(q.ring); if(i>=0) C.rings.splice(i,1); q.inList=false; } }
  // the ferris gear in the Gearworks
  if(X.wheel2){ const q=X.wheel2; q.ang=(q.ang+dt*TAU/q.per)%TAU; q.rings.forEach((o,n)=>{ const a=q.ang+n*TAU/q.rings.length; o.x=q.cx+Math.cos(a)*q.r; o.y=q.cy+Math.sin(a)*q.r; }); }
  // the third boiler: steam off its sides while it is hot
  if(X.boiler&&!X.boiler.cool&&Math.random()<dt*5){ const q=tPos(X.boiler.face[(Math.random()*X.boiler.face.length)|0]); emit(q.x+rand(-16,16),q.y+10,1,{col:'240,240,245',glow:false,ang:Math.PI/2,spread:0.6,smin:20,smax:70,lmin:.5,lmax:1,zmin:2,zmax:5,grow:8,drag:1}); }
  // the stamping press in the Conveyor Hall
  if(X.press){ const q=X.press, was=q.t; q.t=(q.t+dt)%2.6; if(q.t<was&&R&&R.id===q.room) d1aSnd('stamp',0.6); }
  // the furnaces: lit all three, the pressure door rises and the ram pen bursts open
  for(const id in A.rooms){ const Q=A.rooms[id]; if(!Q.furnace||!Q.solved||G.found.c_brass_rams) continue; G.found.c_brass_rams=true; d1aRams(A,Q); }
  // the Hook Hall floor drops away after the gift
  if(X.dropAnim){ const D=X.dropAnim; D.t+=dt; if(Math.random()<dt*30){ const q=tPos(D.cells[(Math.random()*D.cells.length)|0]); emit(q.x+rand(-20,20),q.y+rand(-20,20),1,{col:'120,96,70',glow:false,smin:10,smax:60,lmin:.3,lmax:.7,zmin:1,zmax:3}); }
    if(D.t>=1.1&&!X.dropped){ X.dropped=true; G.found.c_brass_hdrop=true; shake(7); d1aSnd('stamp'); d1aSnd('creak'); for(const o of A.p2.rings) if(o.room===X.dropRoom){ o.hang=true; o.lvl=null; }
      if(d1aDI()===0){ G.slowT=3; G.timeScale=0.55; }
      setBanner(S('The floor drops away!','The floor falls away!'),S(`Grapple the gold ring: press ${d1aCtl('use')}! Then ring to ring to the west door.`,`Press ${d1aCtl('use')} at the gold ring!`),4.5); saveGame(); }
    if(D.t>2) X.dropAnim=null; }
  // the Foreman (a Steam Ram room boss that x1_foes dresses in a cap): he gets the boss bar while the office fight is on
  if(R&&R.kind==='miniboss'&&!R.c1boss&&!R.solved){ const e=R.enemies.find(q=>!q.dead&&q.caveBoss); if(e&&!G.boss&&(e.aggro||dist(p.x,p.y,e.x,e.y)<520)) G.boss=e; }
  if(G.boss&&G.boss.dead&&G.boss.caveBoss&&!X.bossClr){ X.bossClr=true; later(2.2,()=>{ X.bossClr=false; if(G.boss&&G.boss.dead&&G.boss.caveBoss) G.boss=null; }); }
  // Ticktock beaten: the front gate opens from outside from now on
  if((G.bossDone&&G.bossDone.c_ticktock)||G.flags.c_ticktock_won) G.flags.c_brass_gate=true;
}
function d1aDropStart(A){ const X=A&&A.d1a; if(!X||!X.dropRoom||X.dropped) return; const c=A.cave, cells=[]; for(let k=0;k<c.typ.length;k++) if(c.typ[k]===D1A_T.drop) cells.push(k); X.dropAnim={t:0,cells}; d1aSnd('creak'); shake(3); }
function d1aRams(A,Q){
  const p=d1aP(A,Q,(Q.pen||[12,8])[0],(Q.pen||[12,8])[1]);
  for(let n=0;n<2;n++){ const e=makeEnemy('c_ram',p.x+n*40-20,p.y,{level:A.def.level,aggro:true,homeX:Q.cx,homeY:Q.cy,leash:900,camp:A.camp});
    e.inArea=true; e.room=Q.id; e.spawnIn=0.6; Q.enemies.push(e); if(A.camp) A.camp.alive++; }
  Q.lockFight=true; Q.locked=false; d1aSnd('stamp'); shake(5); emit(p.x,p.y,30,{col:'240,240,245',glow:false,smin:40,smax:180,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:8});
  setBanner(S('The pen bursts open!','Steam Rams!'),S('Two Steam Rams charge out. Lure them into the hot furnaces!','Make them charge into the furnaces!'),3);
}
// the crate on the right crane: a pull drops it two cells toward Ash; on the plate it opens the way, in the pit it splashes
function d1aCrateDrop(o){
  const A=AREA, X=A&&A.d1a, q=X&&X.crane; if(!q) return; const p=player, dx=p.x-o.x, dy=p.y-o.y, cs=A.cave.cell;
  const ux=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0, uy=ux?0:Math.sign(dy), to={x:o.x+ux*cs*2,y:o.y+uy*cs*2};
  q.drop={t:0,from:{x:o.x,y:o.y},to,k:tCell(to.x,to.y)}; d1aSnd('whoosh'); const C=A.p2, i=C.chains.indexOf(o); if(i>=0) C.chains.splice(i,1);
}
function d1aCrateLand(A,q,D){
  const o=q.crate, R=A.rooms[q.room];
  if(D.k===q.plateK){ q.landed=true; G.found[o.id]=true; d1aCrateBlock(A,q); d1aSnd('stamp'); shake(5); refreshCaveGates();
    later(0.3,()=>{ if(AREA===A&&R&&!R.solved){ solveRoom(R,true); setBanner(S('Click!','Click!'),S('The crate lands right on the pressure plate. The west door rolls open.','The west door opens!'),2.8); saveGame(); } }); return; }
  // missed: into the pit (a splash and the crane winches it back up), or onto plain floor (it sits, then gets winched back)
  const pit=tHole(D.k)||!tGround(D.k); d1aSnd(pit?'splash':'clank'); emit(D.to.x,D.to.y,16,{col:pit?'90,80,70':'150,120,80',glow:false,smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:4});
  ftext(D.to.x,D.to.y-30,pit?S('Missed! Pull it from the island, over the plate.','Missed! Pull it from the island.'):S('Not on the plate!','Not on the plate!'),'#ffe0b0',13);
  q.miss={x:D.to.x,y:D.to.y,t:pit?0:2.2}; delete G.found[o.id]; o.done=false; o.strain=0;
  later(pit?1.6:2.6,()=>{ if(AREA!==A) return; q.miss=null; o.x=q.home.x; o.y=q.home.y; if(!A.p2.chains.includes(o)) A.p2.chains.push(o); d1aSnd('creak',0.6); });
}
function d1aCrateBlock(A,q){ const k=q.plateK, c=A.cave, i=k%c.w, j=(k-i)/c.w; if(A.blocks.some(b=>b.d1acrate)) return; const b={k:'block',ci:i,cj:j,si:i,sj:j,x:q.plate.x,y:q.plate.y,id:q.crate.id+'_b',room:q.room,cart:false,anim:0,fx:q.plate.x,fy:q.plate.y,live:true,d1acrate:true}; A.blocks.push(b); A.objs.push(b); }

// ---- pages, warps, gates, the gifts
function d1aPageHave(n){ return !!(G.flags['c_pg'+n]||(G.items&&G.items['c_page'+n])); }
function d1aPage(o){
  if(d1aPageHave(o.n)) return;
  if(typeof cPearlPage==='function') cPearlPage(o.n);
  else { G.flags['c_pg'+o.n]=true; giveItems({['c_page'+o.n]:1},true); setBanner(S(`Pearl's Logbook, page ${o.n}`,`Pearl's Logbook, page ${o.n}`),S('A page in neat, salty handwriting.','An old page.'),2.4); }
  emit(o.x,o.y,20,{col:'255,240,200',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20}); saveGame();
}
const D1A_WARP={c_gullcrag:{x:2300,y:28330,name:S('The Gullcrag Caves','The Gullcrag Caves'),sub:S("Pearl's warp sets you down on top of Gullcrag Head.",'You are on top of the cliff!')},
  c_brassworks:{x:10210,y:24915,name:S('The Brassworks','The Brassworks'),sub:S("Pearl's warp sets you down outside the front gate.",'You are outside the front gate.')}};
function d1aWarp(A,o){
  const X=A.d1a, W2=D1A_WARP[X.root]; X.warping=true; d1aSnd('bellhi'); SFX.play('shrine'); flashA=0.5; flashCol='190,240,255';
  later(0.2,()=>{ if(!AREA||dunRoot(AREA.def.id)!==X.root) return; G.ow={x:W2.x,y:W2.y}; exitArea(); setBanner(W2.name,W2.sub,2.6); if(X.root==='c_gullcrag'&&typeof c1Beat==='function') try{ c1Beat('gull_done'); }catch(e){ console.error(e); } saveGame(); });
}
// E on my own objects (bells, gauges, pages, levers, valve wheels)
{ const base=areaObjAct; areaObjAct=function(o){ if(o&&o.d1aAct){ o.d1aAct(o); return; } return base.apply(this,arguments); }; }
// the hatch, the gates over stairs and the barnacle arches
{ const base=refreshCaveGates; refreshCaveGates=function(){ base.apply(this,arguments); const A=AREA; if(!A||!A.d1a||!A.gates) return; const hi=d1aTide()>=1;
    for(const o of A.gates) if(o.type==='tide'){ let cl=hi||!!o.tmp; if(cl&&!o.closed&&gateOnAsh(o)) cl=false; o.closed=cl; } }; }
{ const base=caveGatePrompt; caveGatePrompt=function(o){ if(o&&o.type==='tide') return o.closed?S('Look at the barnacle arch','Look at the arch'):null; return base.apply(this,arguments); }; }
{ const base=caveObjAct; caveObjAct=function(o){
    const A=AREA; if(A&&A.d1a&&o&&o.k==='cgate'){
      if(o.type==='tide'&&o.closed&&!o.tmp){ d1aSay([S('A low arch of barnacles and mussels. At high tide the sea fills it right up to the roof. At low tide you could walk through.','The sea fills this arch at high tide. Come back at low tide.')]); return true; }
      if(o.d1aLook&&o.closed){ const bk=G.found['bkey_'+caveDsid(A.def)];
        if(o.type==='boss'&&bk){ o.opened=true; G.found[o.id]=true; refreshCaveGates(); jingle('secret','chest'); shake(6); d1aSnd('creak');
          setBanner(o.d1aLook==='hatch'?S('The hatch swings open','The hatch opens'):S('The great door opens','The big door opens'),o.d1aLook==='hatch'?S('Far below, something is humming a sea shanty. Badly.','Something hums below. Badly.'):S('A long stair winds down into the dark. Something down there is ticking.','Something is ticking down there.'),2.6); saveGame(); return true; }
        const T={hatch:S(`A heavy hatch in the wreck's deck, with a lock shaped like a flame. The Boss Key would open it. Through the cracks: the sound of the sea, and someone humming.`,`A hatch with a flame lock. Find the Boss Key.`),
          stair:S(`A great iron door over the long stair down, with a lock shaped like a flame. The Boss Key for it is somewhere in the Brassworks.`,`A big door. Find the Boss Key.`),
          steam:S(`Hot steam roars up out of the hatch. Somewhere, a valve must send it elsewhere.`,`Hot steam! Find a valve to stop it.`),
          lift:S(`The freight lift's cage is locked. A brass plate says: FOREMAN'S LIFT. NO PASSENGERS. NO PIGEONS.`,`The lift is locked. Only the Foreman can use it.`)}[o.d1aLook];
        d1aSay([T||S('It will not open.','It will not open.')]); return true; } }
    return base.apply(this,arguments); }; }
// strikes: bells, belt levers, pipe valves and the gear hub answer to weapons; stone eyes under water or out of reach do not
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){ base.apply(this,arguments); const A=AREA; if(!A||!A.d1a) return; const X=A.d1a, inA=o=>inArcC(px,py,dir,range+12,half,{x:o.x,y:o.y-14,r:22});
    for(const o of X.bells) if(o.cd<=0&&inA(o)) d1aRing(o);
    for(const o of X.levers) if(o.cd<=0&&inA(o)) d1aLever(o); }; }
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){
    const A=AREA; r=r||8;
    if(A&&A.d1a&&src!=='fire') for(const o of A.objs){ if(o.k!=='teye'||o.lit||dist(x,y,o.x,o.y)>=r+o.r) continue; const k=tCell(o.x,o.y), R=A.rooms[o.room];
      if(tWet(k)){ if(!(o.nope>G.time)){ o.nope=G.time+1; ftext(o.x,o.y-28,S('It is under the water! Lower the tide.','Under water!'),'#bfe6ff',12); } return true; }
      if(R&&R.highEye&&k===d1aK(A,R,R.highEye[0],R.highEye[1])&&src==='arrow'&&dunH(tCell(player.x,player.y))<2){ if(!(o.nope>G.time)){ o.nope=G.time+1; ftext(o.x,o.y-28,S('Too low! Shoot it from up high.','Shoot from up high!'),'#ffe0b0',12); } return true; } }
    let hit=base.apply(this,arguments); if(!A||!A.d1a||src==='fire') return hit; const X=A.d1a;
    for(const o of X.bells) if(o.cd<=0&&dist(x,y,o.x,o.y-20)<r+26){ if(o.kind==='high'&&!D1A_MELEE[src]){ if(!(o.nope>G.time)){ o.nope=G.time+1; ftext(o.x,o.y-60,S('It is too heavy to ring from far away. Give it a good whack!','Too heavy! Hit it up close.'),'#ffe0b0',12); } hit=true; continue; } d1aRing(o); hit=true; }
    for(const o of X.levers) if(o.cd<=0&&dist(x,y,o.x,o.y)<r+18){ d1aLever(o); hit=true; }
    for(const o of X.pvalves){ if(o.cd>0||dist(x,y,o.x,o.y)>=r+20) continue; const R=A.rooms[o.room]; if(R&&R.acc&&!R.acc.includes(src)) continue; d1aPValve(o,src); hit=true; }
    if(X.gear&&(src==='boomerang'||src==='arrow'||src==='whip')&&dist(x,y,X.gear.x,X.gear.y)<r+30){ d1aGearStun(X.gear); hit=true; }
    return hit; }; }
// a fall in the Hook Hall after the floor dropped puts Ash back by the cushion, unhurt
{ const base=trialFall; trialFall=function(){ const A=AREA, X=A&&A.d1a; if(D1A.traceFall) D1A.fallStack=(new Error('fall')).stack+' | k='+tCell(player.x,player.y)+' air='+airborne()+' z='+player.z;
    if(X&&X.dropped&&X.dropRoom){ const R=caveRoomAt(player.x,player.y); if(R&&R.id===X.dropRoom){ const s=A.objs.find(o=>o.tobj==='shrine'&&o.room===R.id), p=player, T=A.tri, to=s?{x:s.x,y:s.y+56}:{x:R.cx,y:R.cy};
      p.x=to.x; p.y=to.y; p.kvx=p.kvy=0; G.fade=0.7; updateCam(0,true); if(T){ T.lx=p.x; T.ly=p.y; T.safe={x:p.x,y:p.y}; T.grace=1; T.fallT=0.4; } p.iframes=Math.max(p.iframes,0.8); ftext(p.x,p.y-30,S('Whoops! Try the ring again.','Try again!'),'#ffd9a0',14); return; } }
    return base.apply(this,arguments); }; }
{ const base=grantAbility; grantAbility=function(id){
    if(D1A.noGift&&(id==='claws'||id==='grapple')&&d1aIn()) return;
    base(id);
    try{ if(id==='claws'&&d1aIn('c_gullcrag')) d1aFloodStart(AREA); if(id==='grapple'&&d1aIn('c_brassworks')){ d1aDropStart(AREA); const R=AREA.rooms[AREA.d1a.dropRoom]; if(R&&!R.solved) solveRoom(R,true); } }catch(e){ console.error(e); } }; }
// Pearl speaks in her own places (the altar line, the shrine when you already have her gift), and they are not Trials
{ const base=taunt; taunt=function(who,text){ if(who==='ember'&&d1aIn()&&AREA.rooms&&(AREA.curRoom||{}).kind==='reward') return base('c_pearl',pick([S(`Well done. The altar's yours. Go on.`,`Well done! Touch the altar.`),S(`That's the hard part over. Go on, it's yours.`,`The hard part is over. Go on!`)])); return base(who,text); }; }
{ const base=showCard; showCard=function(num,name){ if(d1aIn()&&String(num)==='Trial complete') num=S('Dungeon complete','Done!'); return base(num,name); }; }
{ const base=trialObjAct; trialObjAct=function(o){
    const A=AREA;
    // the end chest first: the altar (and the Brassworks lever, which carries Ash outside) waits for the Heart Ember
    if(A&&A.d1a&&o&&o.tobj==='altar'&&!trialDone(A.d1a.root)){ const ch=A.objs.find(q=>q.tobj==='dchest'&&q.kind==='heart'&&q.room===o.room&&!G.found[q.id]);
      if(ch){ d1aSay([['c_pearl',S(`Not so fast, Ash. Open the big chest first. It's yours.`,`Open the big chest first! It's yours.`)]]); return true; } }
    if(A&&A.d1a&&o&&o.tobj==='altar'&&trialDone(A.d1a.root)){ d1aSay([A.d1a.root==='c_gullcrag'?S(`Pearl's cradle rocks gently, all by itself. The warp by the wall still glows, whenever you are ready to go.`,`The cradle rocks gently. The warp still glows.`):S(`The great lever is down and the drive hums. Far above, the Great Clock ticks. The warp in the corner still glows.`,`The lever is down. The clock is awake! The warp still glows.`)]); return true; }
    if(A&&A.d1a&&o&&o.tobj==='shrine'){ const SH=D1A_SHRINE[dunRoot(A.def.id)];
      if(SH&&!hasAbil(SH.abil)&&!d1aSeen(SH.key)&&STORY[SH.key]){ d1aPlay(SH.key,()=>{ scene='play'; base(o); }); return true; } const TI=trialInfo(dunRoot(A.def.id)); if(TI&&TI.abil&&hasAbil(TI.abil)){ player.hp=player.maxHp; player.potions=player.potionsMax; SFX.play('shrine');
      d1aSay([A.d1a.root==='c_gullcrag'?S(`Pearl's statue holds out her stone hand. It feels warm. (Health and draughts restored.)`,`The statue's hand is warm. (You feel better!)`):S(`Pearl's velvet cushion. It smells of oil and old adventures. (Health and draughts restored.)`,`A soft cushion. (You feel better!)`)]); return true; } }
    return base.apply(this,arguments); }; }
// ---------- 8. art: the baked floor (my cells, faces at every height, the sea and brass dressing)
const d1aOL=()=>LOOK.sb?SBC.outline:'#1a1012';
function d1aHtStatic(k,t){ return t===D1A_T.bar||t===D1A_T.tun||t===D1A_T.belt||t===D1A_T.drop?0:t===D1A_T.float?-2:d1aHt(k,t); }
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){ base.apply(this,arguments); if(d1aDun(def)&&A.canvas&&A.cave) try{ d1aPaint(A,def); }catch(e){ console.error(e); } }; }
function d1aPaint(A,def){
  const c=A.cave, cs=c.cell, w=c.w, g=A.canvas.getContext('2d'), st=CAVE_STYLE[def.theme]||CAVE_STYLE.earth, rng=mulberry32((def.seed|0)*7+3), sea=dunRoot(def.id)==='c_gullcrag', F2=sea&&def.floor==='2';
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
  const H=k=>{ if(k<0||k>=c.typ.length||c.grid[k]!==0) return -9; const t=c.typ[k]; return d1aMine(t)?d1aHtStatic(k,t):(t===DTY.ramp?-1:(t===DTY.high||t===DTY.ledge)?1:0); };
  const solid=k=>k<0||k>=c.typ.length||(c.grid[k]===1&&c.typ[k]!==1);
  const open=k=>!solid(k);
  const roomOf=k=>{ const i=k%w, j=(k-i)/w; for(const id in c.rooms){ const R=c.rooms[id]; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) return R; } return null; };
  // 1. dressing on plain floors and wall tops
  for(let k=0;k<c.typ.length;k++){ const i=k%w, j=(k-i)/w, x=i*cs, y=j*cs, t=c.typ[k];
    if(c.grid[k]===0&&(t===0||t===DTY.basin0)){ const R=roomOf(k);
      if(sea&&LOOK.re){} else if(sea){ // soft sand with no tile seams: a smooth noise colour, wet sand in the tide basins
        const n=fbm(x*0.004+def.floorIdx*7,y*0.004,2), wet=t===DTY.basin0;
        const m=mixRGB(wet?[150,122,84]:[198,168,116],wet?[132,106,72]:[178,146,98],clamp(n,0,1)); g.fillStyle=`rgb(${m[0]|0},${m[1]|0},${m[2]|0})`; g.fillRect(x,y,cs,cs);
        if(R&&R.kind==='reward'){ if(rng()<0.3){ g.fillStyle='rgba(255,240,210,.12)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,4,2,0,0,TAU); g.fill(); } continue; }
        g.strokeStyle='rgba(255,246,220,.16)'; g.lineWidth=1.4; for(let n=0;n<2;n++){ const yy=y+cs*(0.3+n*0.38)+rng()*4; g.beginPath(); g.moveTo(x+3,yy); g.quadraticCurveTo(x+cs/2,yy-4-rng()*3,x+cs-3,yy); g.stroke(); }
        if(rng()<0.12){ g.fillStyle=rng()<0.5?'#f4e2d0':'#e8b8a8'; g.beginPath(); const sx=x+6+rng()*(cs-12), sy=y+6+rng()*(cs-12); g.moveTo(sx,sy-3); g.lineTo(sx+3.5,sy+2); g.lineTo(sx-3.5,sy+2); g.closePath(); g.fill(); }
        if(rng()<0.1){ g.fillStyle='rgba(40,70,90,.16)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,6+rng()*8,3+rng()*4,rng()*3,0,TAU); g.fill(); } }
      else { if(R&&R.workshop){ g.fillStyle=(i+j)%2?'#8a5a34':'#7e5230'; g.fillRect(x,y,cs,cs); g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x,y+cs*0.48,cs,1.5); g.fillRect(x,y,1.5,cs); g.fillStyle='rgba(255,220,170,.08)'; g.fillRect(x+2,y+2,cs-4,2); continue; }
        if(!LOOK.re){ g.strokeStyle='rgba(20,12,6,.32)'; g.lineWidth=1.2; g.strokeRect(x+1.5,y+1.5,cs-3,cs-3);
        g.fillStyle='rgba(255,226,170,.28)'; for(const [a,b] of [[5,5],[cs-5,5],[5,cs-5],[cs-5,cs-5]]){ g.beginPath(); g.arc(x+a,y+b,1.5,0,TAU); g.fill(); } }
        // hazard stripes along drops
        for(const [q,side] of [[k-w,'n'],[k+w,'s'],[k-1,'w'],[k+1,'e']]){ const tq=c.typ[q]; if(!(tq===TY.pit||tq===TY.chasm)) continue; g.save(); g.beginPath(); if(side==='n') g.rect(x,y,cs,5); else if(side==='s') g.rect(x,y+cs-5,cs,5); else if(side==='w') g.rect(x,y,5,cs); else g.rect(x+cs-5,y,5,cs); g.clip(); for(let s=-cs;s<cs*2;s+=10){ g.fillStyle='#e8b830'; g.beginPath(); g.moveTo(x+s,y); g.lineTo(x+s+5,y); g.lineTo(x+s+5-cs,y+cs); g.lineTo(x+s-cs,y+cs); g.closePath(); g.fill(); } g.restore(); } } }
    // wall tops beside a floor: barnacles and kelp by the sea, rivets and pipes in the works
    if(solid(k)&&(open(k+w)||open(k-w)||open(k+1)||open(k-1))){
      if(sea){ if(open(k+w)){ const fy=y+cs*0.6; g.fillStyle='rgba(230,236,240,.75)'; for(let n=0;n<4;n++){ const bx=x+4+rng()*(cs-8), by=fy-2-rng()*8; g.beginPath(); g.arc(bx,by,1.6+rng()*1.6,0,TAU); g.fill(); }
          if(rng()<0.45){ g.fillStyle='#2e4a6a'; for(let n=0;n<3;n++){ g.beginPath(); g.ellipse(x+6+rng()*(cs-12),fy-4-rng()*10,2.4,1.4,rng()*3,0,TAU); g.fill(); } }
          if(rng()<0.35){ g.strokeStyle='rgba(70,110,60,.85)'; g.lineWidth=2; const kx=x+6+rng()*(cs-12); g.beginPath(); g.moveTo(kx,fy-6); g.quadraticCurveTo(kx+5,fy+6,kx-2,fy+cs*0.38); g.stroke(); }
          g.fillStyle='rgba(220,240,240,.16)'; g.fillRect(x,fy+cs*0.18,cs,2); }
        else if(rng()<0.25){ g.fillStyle='rgba(230,236,240,.6)'; g.beginPath(); g.arc(x+rng()*cs,y+rng()*cs*0.5,1.8,0,TAU); g.fill(); } }
      else { g.fillStyle='rgba(255,230,170,.35)'; for(let n=0;n<2;n++){ g.beginPath(); g.arc(x+cs*(0.25+n*0.5),y+5,1.6,0,TAU); g.fill(); }
        if(open(k+w)){ const fy=y+cs*0.6; g.fillStyle='#8a4a26'; g.fillRect(x,fy+cs*0.12,cs,5); g.fillStyle='#c8784a'; g.fillRect(x,fy+cs*0.12,cs,1.6); if(i%3===0){ g.fillStyle='#5a3418'; g.fillRect(x+cs*0.5-3,fy+cs*0.08,6,9); } } } } }
  // 2. raised floors at every height: a top per level (shelves of sea rock, chalk up in the High Galleries, iron decks in
  //    the works), a face wherever the floor steps down (taller for a bigger drop), handholds on the climbable ones, a
  //    dark lip round every top and a soft shadow at the foot, so the levels read at a glance on a phone
  const raisedStd=t=>t===DTY.high||t===DTY.ledge;
  const isTop=t=>(d1aMine(t)&&t!==D1A_T.bar&&t!==D1A_T.tun&&t!==D1A_T.belt&&t!==D1A_T.drop&&t!==D1A_T.float)||raisedStd(t);
  const TOPS=sea?(F2?['#9a8462','#bea67a','#e0d3b2','#c6d39c']:['#b89a6a','#9aa0a0','#bcbcb0','#d8d4c4']):['#6a5a4a','#857563','#99876e','#ad9879'];
  const FACE=sea?(F2?'#94806a':'#5e6e7a'):'#4a3a2e';
  for(let k=0;k<c.typ.length;k++){ if(c.grid[k]!==0) continue; const t=c.typ[k], i=k%w, j=(k-i)/w, x=i*cs, y=j*cs, h=H(k), R=roomOf(k);
    if(h===0&&R&&R.deep){ const gg=g.createLinearGradient(0,y,0,y+cs); gg.addColorStop(0,'rgba(24,34,56,.34)'); gg.addColorStop(1,'rgba(24,34,56,.22)'); g.fillStyle=gg; g.fillRect(x,y,cs,cs); }
    if(!isTop(t)) { if(t===D1A_T.bar){ g.fillStyle=r2c(st.floor,-0.3); g.fillRect(x,y,cs,cs); } else if(t===D1A_T.tun){ g.fillStyle=r2c(st.floor,-0.32); g.fillRect(x,y,cs,cs); g.fillStyle='rgba(20,30,40,.35)'; g.fillRect(x,y,cs,cs*0.3); g.strokeStyle='rgba(200,230,240,.12)'; g.lineWidth=1; g.beginPath(); g.moveTo(x,y+cs*0.3); g.lineTo(x+cs,y+cs*0.3); g.stroke(); }
      else if(t===D1A_T.float){ g.fillStyle='#0c1418'; g.fillRect(x,y,cs,cs); }
      else if(t===D1A_T.drop){ g.fillStyle=(i+j)%2?'#8a6236':'#80592f'; g.fillRect(x,y,cs,cs); g.fillStyle='rgba(0,0,0,.25)'; for(let n=1;n<4;n++) g.fillRect(x,y+n*cs/4,cs,1.4); g.fillStyle='rgba(255,220,160,.1)'; g.fillRect(x,y+1,cs,2); }
      else if(t===D1A_T.belt){ g.fillStyle='#2e2a2a'; g.fillRect(x,y,cs,cs); g.fillStyle='#4a4038'; g.fillRect(x+2,y+2,cs-4,cs-4); const f=c.flow[k]; g.fillStyle='#6a5a48'; for(let n=0;n<4;n++){ if(f===0||f===2) g.fillRect(x+3,y+4+n*11,cs-6,4); else g.fillRect(x+4+n*11,y+3,4,cs-6); }
        g.fillStyle='#b08840'; if(f===0||f===2){ g.fillRect(x,y,3,cs); g.fillRect(x+cs-3,y,3,cs); } else { g.fillRect(x,y,cs,3); g.fillRect(x,y+cs-3,cs,3); } }
      continue; }
    const lv=clamp(h,0,3); if(!(LOOK.re&&riLevelTop(g,x,y,cs,TOPS[lv]))){ g.fillStyle=TOPS[lv]; g.fillRect(x,y,cs,cs); }
    g.fillStyle='rgba(255,250,226,.10)'; g.fillRect(x+2,y+2,cs-4,3); g.strokeStyle='rgba(58,30,72,.12)'; g.lineWidth=1.2; g.strokeRect(x+0.5,y+0.5,cs-1,cs-1);
    if(!sea){ g.fillStyle='rgba(30,16,8,.45)'; for(const [a,b] of [[6,6],[cs-6,6],[6,cs-6],[cs-6,cs-6]]){ g.beginPath(); g.arc(x+a,y+b,1.9,0,TAU); g.fill(); } g.fillStyle='rgba(255,226,170,.25)'; g.fillRect(x+cs*0.5-1,y+4,2,cs-8); }
    else if(F2&&lv>=3){ // the cliff top: turf over chalk
      g.fillStyle='rgba(150,180,100,.35)'; for(let q=0;q<3;q++){ g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,8+rng()*8,5+rng()*5,rng()*3,0,TAU); g.fill(); }
      g.strokeStyle='#7fa452'; g.lineWidth=1.5; for(let q=0;q<4;q++){ const tx=x+4+rng()*(cs-8), ty=y+6+rng()*(cs-8); g.beginPath(); g.moveTo(tx,ty); g.lineTo(tx-2,ty-6); g.moveTo(tx,ty); g.lineTo(tx+2,ty-5); g.stroke(); }
      if(rng()<0.1){ g.fillStyle=rng()<0.5?'#f4f0f8':'#f0a8c0'; for(let q=0;q<3;q++){ g.beginPath(); g.arc(x+6+rng()*(cs-12),y+6+rng()*(cs-12),1.8,0,TAU); g.fill(); } } }
    else if(lv>=2){ if(rng()<0.35){ g.strokeStyle='rgba(96,96,108,.32)'; g.lineWidth=1.2; let px=x+4+rng()*(cs-8), py=y+4+rng()*(cs-8); g.beginPath(); g.moveTo(px,py); for(let n=0;n<3;n++){ px+=(rng()-0.5)*14; py+=4+rng()*6; g.lineTo(px,Math.min(y+cs-2,py)); } g.stroke(); }
      if(rng()<0.12){ g.fillStyle='#5a5e68'; g.beginPath(); g.ellipse(x+6+rng()*(cs-12),y+6+rng()*(cs-12),3,2.2,rng()*3,0,TAU); g.fill(); }
      if(rng()<0.18){ g.fillStyle='rgba(110,150,80,.55)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,4,2,0,0,TAU); g.fill(); } }
    else { g.fillStyle='rgba(230,236,240,.55)'; for(let n=0;n<2;n++) if(rng()<0.5){ g.beginPath(); g.arc(x+5+rng()*(cs-10),y+5+rng()*(cs-10),1.4+rng()*1.4,0,TAU); g.fill(); }
      if(rng()<0.25){ g.fillStyle='rgba(40,70,90,.25)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,7,3,rng()*3,0,TAU); g.fill(); } }
    if(t===D1A_T.step){ g.fillStyle='rgba(255,230,170,.45)'; g.fillRect(x+4,y+cs-8,cs-8,3); g.fillStyle='rgba(255,230,170,.25)'; g.fillRect(x+4,y+4,cs-8,2); }
    if(t===D1A_T.l2||t===DTY.ledge){ g.fillStyle=sea?'rgba(255,250,226,.5)':'rgba(255,214,120,.55)'; for(let n=0;n<3;n++){ const px=x+cs*0.5, py=y+cs*(0.25+n*0.25); g.beginPath(); g.moveTo(px-6,py-3); g.lineTo(px+6,py-3); g.lineTo(px,py+4); g.closePath(); g.fill(); } } }
  // faces: in the lower cell, under any higher one
  for(let k=w;k<c.typ.length;k++){ if(c.grid[k]!==0) continue; const i=k%w, j=(k-i)/w, x=i*cs, y=j*cs, hk=H(k), n=k-w, hn=H(n); if(hk<-1||hn<0||hn<=Math.max(0,hk)) continue;
    const tn=c.typ[n]; if(!isTop(tn)) continue;
    const d=hn-Math.max(0,hk), fh=cs*Math.min(0.96,0.44+0.18*d), climbF=d1aClimb(tn)||(raisedStd(tn)&&A.p2&&A.p2.climb.has(n));
    const gr=g.createLinearGradient(0,y,0,y+fh); gr.addColorStop(0,F2?'#d8ccb0':r2c(FACE,0.08)); gr.addColorStop(1,F2?'#6e5e4c':r2c(FACE,-0.5)); g.fillStyle=gr; g.fillRect(x,y,cs,fh);
    if(F2){ g.fillStyle='rgba(58,50,56,.55)'; for(let s2=1;s2<=d;s2++){ const fy=y+fh*(s2-0.45)/(d+0.2); for(let q=0;q<4;q++){ g.beginPath(); g.ellipse(x+4+rng()*(cs-8),fy+(rng()-0.5)*4,3+rng()*3,1.6,0,0,TAU); g.fill(); } } }
    g.fillStyle='rgba(58,30,72,.32)'; for(let s=1;s<d+1;s++) g.fillRect(x,y+fh*s/(d+1),cs,1.6);
    if(sea){ g.strokeStyle=F2?'rgba(80,72,64,.45)':'rgba(20,30,40,.45)'; g.lineWidth=1.2; for(let s2=0;s2<2;s2++){ const cx0=x+cs*(0.2+rng()*0.6); g.beginPath(); g.moveTo(cx0,y+2); g.lineTo(cx0+(rng()-0.5)*8,y+fh*0.5); g.lineTo(cx0+(rng()-0.5)*10,y+fh-2); g.stroke(); }
      if(!F2&&rng()<0.6){ g.fillStyle='rgba(235,240,240,.7)'; for(let q=0;q<3;q++){ g.beginPath(); g.arc(x+4+rng()*(cs-8),y+fh*(0.5+rng()*0.45),1.3+rng(),0,TAU); g.fill(); } } }
    else { g.fillStyle='rgba(255,220,160,.45)'; for(let s2=0;s2<3;s2++){ g.beginPath(); g.arc(x+cs*(0.2+s2*0.3),y+fh*0.3,1.6,0,TAU); g.fill(); } g.fillStyle='rgba(232,184,48,.9)'; g.fillRect(x,y,cs,3); g.fillStyle='rgba(40,24,10,.9)'; for(let s2=0;s2<cs;s2+=10) g.fillRect(x+s2,y,5,3); }
    g.fillStyle=sea?'rgba(250,250,240,.6)':'rgba(255,220,150,.6)'; g.fillRect(x,y-1,cs,2.5);
    const sh=12+6*d, sg=g.createLinearGradient(0,y+fh,0,y+fh+sh); sg.addColorStop(0,'rgba(58,30,72,.5)'); sg.addColorStop(1,'rgba(58,30,72,0)'); g.fillStyle=sg; g.fillRect(x,y+fh,cs,sh);
    g.fillStyle='rgba(28,18,24,.55)'; g.fillRect(x,y+fh-1.5,cs,2.5);
    if(climbF){ g.strokeStyle='rgba(30,16,16,.55)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x+cs*0.3,y+2); g.lineTo(x+cs*0.36,y+fh*0.5); g.lineTo(x+cs*0.28,y+fh-2); g.moveTo(x+cs*0.72,y+3); g.lineTo(x+cs*0.66,y+fh*0.6); g.stroke();
      for(const [a,b] of [[0.18,0.22],[0.5,0.18],[0.82,0.3],[0.32,0.55],[0.66,0.5],[0.15,0.8],[0.5,0.82],[0.86,0.75]]){ const kx=x+cs*a, ky=y+fh*b; g.fillStyle='rgba(30,16,20,.5)'; g.beginPath(); g.ellipse(kx+0.8,ky+1.4,2.4,1.7,0,0,TAU); g.fill(); g.fillStyle=sea?'#f6f0e0':'#f0c878'; g.beginPath(); g.ellipse(kx,ky,2.4,1.7,0,0,TAU); g.fill(); }
      if(sea){ g.strokeStyle='rgba(80,150,70,.85)'; g.lineWidth=1.8; g.beginPath(); g.moveTo(x+cs*0.9,y); g.quadraticCurveTo(x+cs,y+fh*0.5,x+cs*0.86,y+fh); g.stroke(); } } }
  // climbable edges facing west, east or north: a strip of cracks and handholds along the top's edge (the south ones are
  // on the face itself), so a climbable side reads as one at a glance
  for(let k=w;k<c.typ.length-w;k++){ if(c.grid[k]!==0) continue; const t=c.typ[k], h=H(k); if(h<=0||!(d1aClimb(t)||(raisedStd(t)&&A.p2&&A.p2.climb.has(k)))) continue;
    const x=(k%w)*cs, y=Math.floor(k/w)*cs;
    for(const [q,side] of [[k-1,'w'],[k+1,'e'],[k-w,'n']]){ const hq=H(q); if(hq<=-9||hq>=h) continue; const vert=side!=='n';
      g.fillStyle=sea?'rgba(58,40,40,.28)':'rgba(40,24,10,.32)'; if(vert) g.fillRect(side==='w'?x:x+cs-9,y,9,cs); else g.fillRect(x,y,cs,9);
      for(let n=0;n<4;n++){ const a=(n+0.5)/4, hx=vert?(side==='w'?x+4.5:x+cs-4.5):x+cs*a, hy=vert?y+cs*a:y+4.5; g.fillStyle='rgba(30,16,20,.5)'; g.beginPath(); g.ellipse(hx+0.8,hy+1.3,2.6,1.8,0,0,TAU); g.fill(); g.fillStyle=sea?'#f6f0e0':'#f0c878'; g.beginPath(); g.ellipse(hx,hy,2.6,1.8,0,0,TAU); g.fill(); }
      if(sea){ g.strokeStyle='rgba(80,150,70,.8)'; g.lineWidth=1.8; g.beginPath(); if(vert){ const vx=side==='w'?x+2:x+cs-2; g.moveTo(vx,y); g.quadraticCurveTo(vx+(side==='w'?6:-6),y+cs*0.5,vx,y+cs); } else { g.moveTo(x,y+2); g.quadraticCurveTo(x+cs*0.5,y+8,x+cs,y+2); } g.stroke(); } } }
  // lips: a dark outline on the back and side edges of a raised top, so the levels read at phone size
  for(let k=w;k<c.typ.length-w;k++){ if(c.grid[k]!==0) continue; const t=c.typ[k], h=H(k); if(h<=0||!isTop(t)) continue; const x=(k%w)*cs, y=Math.floor(k/w)*cs, lo=q=>{ const hq=H(q); return hq>-9&&hq<h; };
    g.strokeStyle='rgba(58,30,72,.62)'; g.lineWidth=2.6; g.beginPath(); if(lo(k-w)){ g.moveTo(x,y+1.3); g.lineTo(x+cs,y+1.3); } if(lo(k-1)){ g.moveTo(x+1.3,y); g.lineTo(x+1.3,y+cs); } if(lo(k+1)){ g.moveTo(x+cs-1.3,y); g.lineTo(x+cs-1.3,y+cs); } g.stroke();
    if(F2&&lo(k+w)&&rng()<0.5){ g.strokeStyle='#7fa452'; g.lineWidth=1.6; for(let n=0;n<3;n++){ const tx=x+5+rng()*(cs-10); g.beginPath(); g.moveTo(tx,y+cs-1); g.lineTo(tx-2,y+cs-7); g.moveTo(tx,y+cs-1); g.lineTo(tx+2,y+cs-6); g.stroke(); } } }
  // side shadows where a higher floor meets a lower one east or west
  for(let k=1;k<c.typ.length-1;k++){ if(c.grid[k]!==0) continue; const hk=H(k), x=(k%w)*cs, y=Math.floor(k/w)*cs; if(hk<0) continue;
    if(H(k-1)>hk&&isTop(c.typ[k-1])){ const sg=g.createLinearGradient(x,0,x+12,0); sg.addColorStop(0,'rgba(58,30,72,.42)'); sg.addColorStop(1,'rgba(58,30,72,0)'); g.fillStyle=sg; g.fillRect(x,y,12,cs); }
    if(H(k+1)>hk&&isTop(c.typ[k+1])){ const sg=g.createLinearGradient(x+cs,0,x+cs-9,0); sg.addColorStop(0,'rgba(58,30,72,.32)'); sg.addColorStop(1,'rgba(58,30,72,0)'); g.fillStyle=sg; g.fillRect(x+cs-9,y,9,cs); } }
  // 3. a few room pieces baked in: Pearl's carvings, the sea window, the tilted wreck's deck, nests, the workshop wall
  for(const id in c.rooms){ const R=c.rooms[id], X0=(R.ox+1)*cs, Y0=(R.oy+1)*cs, W0=R.iw*cs;
    if(sea&&(R.kind==='start'||R.kind==='shrine'||R.kind==='reward')) for(let n=0;n<3;n++){ const x=X0+cs*(2+n*5.2), y=Y0-cs*0.5; g.strokeStyle='rgba(250,240,210,.55)'; g.lineWidth=1.6; g.beginPath(); g.arc(x,y,5,0,TAU); g.moveTo(x,y+5); g.lineTo(x,y+11); g.moveTo(x-6,y-2); g.quadraticCurveTo(x-12,y+6,x-6,y+12); g.stroke(); g.fillStyle='rgba(255,220,120,.6)'; g.beginPath(); g.arc(x,y,2,0,TAU); g.fill(); }
    if(R.window){ const x=X0+cs*2, y=Y0-cs*0.9, ww=cs*5, hh=cs*0.7; const sk=g.createLinearGradient(0,y,0,y+hh); sk.addColorStop(0,'#8ad0f0'); sk.addColorStop(0.6,'#c8ecf8'); sk.addColorStop(1,'#3a8ab8'); g.fillStyle=sk; rrect(g,x,y,ww,hh,10); g.fill();
      g.fillStyle='#2a6a9a'; g.fillRect(x,y+hh*0.62,ww,hh*0.38); g.fillStyle='rgba(255,255,255,.6)'; for(let n=0;n<6;n++) g.fillRect(x+10+n*36,y+hh*0.68+(n%2)*4,14,1.6); g.fillStyle='#fff8e0'; g.beginPath(); g.arc(x+ww*0.78,y+hh*0.3,6,0,TAU); g.fill();
      g.strokeStyle=d1aOL(); g.lineWidth=3; rrect(g,x,y,ww,hh,10); g.stroke(); g.strokeStyle='#5c7486'; g.lineWidth=2; g.beginPath(); g.moveTo(x+ww/2,y); g.lineTo(x+ww/2,y+hh); g.stroke(); }
    if(R.nests) for(let n=0;n<5;n++){ const i=R.ox+1+Math.floor(rng()*R.iw), j=R.oy+1+Math.floor(rng()*R.ih), k=j*w+i; if(c.typ[k]!==TY.high) continue; const x=i*cs+cs/2, y=j*cs+cs/2; g.fillStyle='#8a6a3a'; g.beginPath(); g.ellipse(x,y,13,8,0,0,TAU); g.fill(); g.strokeStyle='#5a4220'; g.lineWidth=1.5; for(let s=0;s<6;s++){ g.beginPath(); g.moveTo(x-12+s*4,y-5); g.lineTo(x-8+s*4,y+6); g.stroke(); } g.fillStyle='#f4f0e4'; for(const dx of [-4,3]){ g.beginPath(); g.ellipse(x+dx,y-1,3.4,4.2,0,0,TAU); g.fill(); } }
    if(R.workshop){ for(let n=0;n<3;n++){ const x=X0+cs*(2+n*4), y=Y0-cs*0.85; g.fillStyle='#f4ecd8'; g.fillRect(x,y,cs*1.4,cs*0.7); g.strokeStyle='#6a4a2a'; g.lineWidth=1.5; g.strokeRect(x,y,cs*1.4,cs*0.7); g.strokeStyle='#3a5a8a'; g.lineWidth=1.4; g.beginPath(); if(n===0){ g.arc(x+cs*0.7,y+cs*0.35,10,0,TAU); g.moveTo(x+cs*0.7,y+cs*0.35); g.lineTo(x+cs*0.7,y+cs*0.18); } else if(n===1){ g.moveTo(x+cs*0.5,y+cs*0.6); g.lineTo(x+cs*0.7,y+cs*0.1); g.lineTo(x+cs*0.9,y+cs*0.6); } else { g.moveTo(x+12,y+cs*0.5); g.quadraticCurveTo(x+cs*0.7,y,x+cs*1.2,y+cs*0.45); } g.stroke(); } }
    if(R.kind==='d1atilt'){ // the wreck jammed into the roof: its deck is the raised floor, its ribs hang from the north wall
      for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*w+i; if(c.grid[k]!==0||H(k)<1) continue; const x=i*cs, y=j*cs;
        g.fillStyle=(i+j)%2?'#9a6a3c':'#93643a'; g.fillRect(x,y,cs,cs); g.fillStyle='rgba(58,30,20,.45)'; for(let n=1;n<4;n++) g.fillRect(x,y+n*cs/4-0.7,cs,1.4);
        g.fillStyle='rgba(255,226,170,.16)'; for(let n=0;n<4;n++) g.fillRect(x+2,y+n*cs/4+1,cs-4,1.4); g.fillStyle='#4a3020'; for(let n=0;n<4;n++){ g.beginPath(); g.arc(x+((n*13+i*7)%cs),y+n*cs/4+cs/8,1.3,0,TAU); g.fill(); }
        for(const [q,side] of [[k-w,'n'],[k-1,'w'],[k+1,'e']]){ if(H(q)>=1) continue; g.fillStyle='#5a3a22'; if(side==='n') g.fillRect(x,y,cs,6); else if(side==='w') g.fillRect(x,y,6,cs); else g.fillRect(x+cs-6,y,6,cs); g.fillStyle='#c89a5a'; if(side==='n') g.fillRect(x,y,cs,2); else if(side==='w') g.fillRect(x,y,2,cs); else g.fillRect(x+cs-2,y,2,cs); } }
      g.lineCap='round'; for(let n=0;n<6;n++){ const x=X0+cs*(3.4+n*1.6), y=Y0-cs*0.9; for(const [lw,col] of [[9,'#2a1a12'],[5.5,'#7a5030']]){ g.strokeStyle=col; g.lineWidth=lw; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+(n<3?-10:10),y+cs*0.55,x+(n<3?-4:4),y+cs*1.05); g.stroke(); } }
      const mx=X0+cs*9.5, my=Y0+cs*1.4; g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(mx+4,my+8,16,7,0,0,TAU); g.fill(); g.fillStyle='#5a3a22'; g.beginPath(); g.ellipse(mx,my,13,9,0,0,TAU); g.fill(); g.fillStyle='#8a5a32'; g.beginPath(); g.ellipse(mx,my-3,11,7,0,0,TAU); g.fill(); g.strokeStyle='#4a3020'; g.lineWidth=1.2; for(let r=3;r<10;r+=3){ g.beginPath(); g.ellipse(mx,my-3,r,r*0.6,0,0,TAU); g.stroke(); }
      g.strokeStyle='#c8b080'; g.lineWidth=2.4; g.beginPath(); for(let a=0;a<TAU*2.2;a+=0.3){ const rr=4+a*1.6; g.lineTo(X0+cs*4.4+Math.cos(a)*rr,Y0+cs*1.6+Math.sin(a)*rr*0.6); } g.stroke(); }
    if(R.c1boss==='c_pinch'){ const W0=R.iw*cs, H0=R.ih*cs;
      for(let n=0;n<5;n++){ let px=X0+W0*(0.12+n*0.19), py=Y0+H0*0.18; g.strokeStyle='rgba(110,84,52,.32)'; g.lineWidth=16+rng()*10; g.lineCap='round'; g.beginPath(); g.moveTo(px,py); for(let q=0;q<5;q++){ px+=(rng()-0.5)*90; py+=H0*0.15; g.lineTo(px,py); } g.stroke(); g.strokeStyle='rgba(220,236,236,.18)'; g.lineWidth=2; g.stroke(); }
      for(let n=0;n<9;n++){ const px=X0+W0*(0.1+rng()*0.8), py=Y0+H0*(0.2+rng()*0.7); g.fillStyle='rgba(60,110,140,.35)'; g.beginPath(); g.ellipse(px,py,18+rng()*26,8+rng()*10,rng()*0.6,0,TAU); g.fill(); g.fillStyle='rgba(230,248,255,.35)'; g.beginPath(); g.ellipse(px-6,py-3,8,2,0,0,TAU); g.fill(); }
      for(let n=0;n<7;n++){ const px=X0+W0*(0.08+rng()*0.84), py=Y0+H0*(0.25+rng()*0.65); for(let q=0;q<3;q++){ const rx=px+(rng()-0.5)*30, ry=py+(rng()-0.5)*16, rr=7+rng()*9; g.fillStyle='rgba(58,30,72,.25)'; g.beginPath(); g.ellipse(rx+2,ry+4,rr,rr*0.6,0,0,TAU); g.fill(); g.fillStyle='#6e7c86'; g.beginPath(); g.ellipse(rx,ry,rr,rr*0.7,0,0,TAU); g.fill(); g.fillStyle='rgba(240,244,240,.75)'; for(let b=0;b<3;b++){ g.beginPath(); g.arc(rx+(rng()-0.5)*rr,ry-rr*0.3+(rng()-0.5)*4,1.5,0,TAU); g.fill(); } }
        if(rng()<0.6){ g.strokeStyle='rgba(60,120,60,.85)'; g.lineWidth=2.4; for(let q=0;q<3;q++){ g.beginPath(); g.moveTo(px+q*6-6,py+4); g.quadraticCurveTo(px+q*6+4,py-10,px+q*6-2,py-24); g.stroke(); } } } }
    if(R.cradle){ const x=X0+W0*0.75, y=Y0-cs*0.6; g.fillStyle='rgba(250,240,220,.5)'; for(let n=0;n<5;n++){ const hx=x+n*14-30, hy=y+(n%2)*6; g.beginPath(); g.ellipse(hx,hy,4,5,0,0,TAU); g.fill(); for(let f=0;f<4;f++){ g.beginPath(); g.arc(hx-4+f*2.6,hy-6,1.3,0,TAU); g.fill(); } } }
  }
  g.restore();
}
// ---------- 9. art: the live floor (water, belts, the gear bridge, steam, the dropped floor, crates on the cistern)
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A&&A.d1a) try{ d1aFloor(A,t); }catch(e){ console.error(e); } }; }
function d1aFloor(A,t){
  const X=A.d1a, c=A.cave, cs=c.cell, w=c.w, st=CAVE_STYLE[A.def.theme]||CAVE_STYLE.earth, wrgb=hexRGB(st.water).join(','), hi=d1aTide()>=1;
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1), j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  const T=A.tri, wl=T&&T.lvlShow!=null?T.lvlShow:(T?T.lvl:0), tf=clamp(wl/2,0,1);
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*w+i, t0=c.typ[k]; if(t0<200) continue; const x=A.x0+i*cs, y=A.y0+j*cs;
    if(t0===D1A_T.tun){ if(tf>0.02){ ctx.fillStyle=`rgba(${wrgb},${0.25+0.7*tf})`; ctx.fillRect(x,y,cs,cs); ctx.strokeStyle=`rgba(210,240,255,${0.18*tf})`; ctx.lineWidth=1.5; ctx.beginPath(); const ph=t*1.4+i*0.8+j; ctx.moveTo(x+4,y+cs*0.5+Math.sin(ph)*3); ctx.quadraticCurveTo(x+cs/2,y+cs*0.4,x+cs-4,y+cs*0.55+Math.sin(ph+1)*3); ctx.stroke(); if(tf>0.9){ ctx.fillStyle='rgba(14,24,34,.35)'; ctx.fillRect(x,y,cs,cs*0.35); } }
      else if(Math.random()<0.004) emit(x+rand(6,cs-6),y+cs*0.3,1,{col:'200,230,255',glow:false,ang:Math.PI/2,spread:0.1,smin:60,smax:90,lmin:.3,lmax:.4,zmin:1,zmax:2}); }
    else if(t0===D1A_T.bar){ const b=X.bar.get(k), up=hi&&!(b&&b.sunk>0); if(tf>0.02){ ctx.fillStyle=`rgba(${wrgb},${0.25+0.65*tf})`; ctx.fillRect(x,y,cs,cs); }
      if(b&&b.sunk>0){ ctx.fillStyle='rgba(220,245,255,.7)'; for(let n=0;n<3;n++){ const f=(t*0.8+n*0.33)%1; ctx.beginPath(); ctx.arc(x+cs/2+Math.sin(n*2+t)*8,y+cs*0.7-f*cs*0.5,1.6+n*0.4,0,TAU); ctx.fill(); } continue; }
      const bob=up?Math.sin(t*2.2+i*1.7)*2:0, s=up?1.04:1, warn=up&&b&&b.on>d1aDiff(3.5,2,1.6)*0.55;
      if(up){ ctx.strokeStyle=`rgba(220,245,255,${0.35+0.15*Math.sin(t*3+i)})`; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(x+cs/2,y+cs/2+10,cs*0.46,cs*0.2,0,0,TAU); ctx.stroke(); }
      r2put(d1aBarrelSpr(),x+cs/2+(warn?Math.sin(t*40)*1.5:0),y+cs/2+bob+(warn?2:0),s); }
    else if(t0===D1A_T.belt){ const b=X.belts.find(q=>q.k===k); if(!b) continue; const d=DIRS[d1aBeltDir(X,b)], ph=X.beltOn?(t*1.8):(Math.floor(X.t/4.5)*0.37), R=A.rooms[b.room], fast=R&&R.beltSpeed&&R.beltSpeed[b.g]>200;
      ctx.strokeStyle=fast?'rgba(255,140,90,.8)':'rgba(255,214,120,.7)'; ctx.lineWidth=3; ctx.lineCap='round'; for(let n=0;n<2;n++){ const f=((ph*(fast?1.8:1)+n*0.5)%1)-0.5, px=x+cs/2+d[0]*f*cs, py=y+cs/2+d[1]*f*cs; ctx.beginPath(); ctx.moveTo(px-d[0]*6-d[1]*9,py-d[1]*6-d[0]*9); ctx.lineTo(px+d[0]*4,py+d[1]*4); ctx.lineTo(px-d[0]*6+d[1]*9,py-d[1]*6+d[0]*9); ctx.stroke(); } }
    else if(t0===D1A_T.drop){ if(X.dropped){ ctx.fillStyle='#070504'; ctx.fillRect(x,y,cs,cs); const up=c.typ[k-w]; if(up!==D1A_T.drop){ ctx.fillStyle='rgba(120,86,50,.8)'; ctx.fillRect(x,y,cs,5); } } else if(X.dropAnim){ ctx.fillStyle=`rgba(0,0,0,${0.5*clamp(X.dropAnim.t,0,1)})`; ctx.fillRect(x+Math.sin(t*50+i)*2,y,cs,cs); } }
    else if(t0===D1A_T.float){ ctx.fillStyle=`rgba(${wrgb},${X.cis?clamp(X.cis.wl/3,0,1)*0.85:0.2})`; ctx.fillRect(x,y,cs,cs); if(X.floatUp){ const bob=Math.sin(t*1.8+i)*1.5; r2put(d1aCrateSpr(),x+cs/2,y+cs/2+bob,1.08); } }
  }
  // the cistern water: every tier below the water line is under water
  if(X.cis&&X.cis.wl>0.02){ const C=X.cis; for(const [k,h] of C.h){ if(h>=C.wl) continue; const i=k%w, j=(k-i)/w; if(i<i0||i>i1||j<j0||j>j1) continue; const x=A.x0+i*cs, y=A.y0+j*cs, d=clamp(C.wl-h,0,1);
      ctx.fillStyle=`rgba(${wrgb},${0.35+0.5*d})`; ctx.fillRect(x,y,cs,cs); if((i+j)%2===0){ ctx.strokeStyle=`rgba(220,245,255,${0.2*d})`; ctx.lineWidth=1.4; ctx.beginPath(); const ph=t*1.6+i+j*0.7; ctx.moveTo(x+4,y+cs*0.5+Math.sin(ph)*3); ctx.quadraticCurveTo(x+cs/2,y+cs*0.42,x+cs-4,y+cs*0.56); ctx.stroke(); } } }
  // Pearl's flood in the shrine hall
  if(X.flood&&X.flood.lvl>0.02){ const R=A.rooms[X.flood.room], a=X.flood.lvl; for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*w+i; if(c.grid[k]!==0||dunH(k)!==0) continue; const x=A.x0+i*cs, y=A.y0+j*cs; ctx.fillStyle=`rgba(${wrgb},${0.2+0.5*a})`; ctx.fillRect(x,y,cs,cs); }
    for(let n=0;n<6;n++){ const x=R.x0+((t*40+n*97)%(R.x1-R.x0)), y=R.y0+60+((n*53)%Math.max(60,R.y1-R.y0-90)); ctx.strokeStyle=`rgba(220,245,255,${0.25*a})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x,y,18,4,0,0,TAU); ctx.stroke(); } }
  // high water swirls in the round rooms
  if(hi) for(const id in A.rooms){ const R=A.rooms[id]; if(!R.swirl||!inView(R.cx,R.cy,400)) continue; for(let n=0;n<10;n++){ const a=t*0.5+n*TAU/10, rr=150+((n*37)%120); ctx.strokeStyle=`rgba(220,245,255,${0.22*tf})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(R.cx,R.cy,rr,a,a+0.5); ctx.stroke(); } }
  // the tilted wreck: until it levels, its deck slopes into shadow and two ropes creak from the roof
  for(const id in A.rooms){ const R=A.rooms[id]; if(R.kind!=='d1atilt'||!inView(R.cx,R.cy,500)) continue; const f=R.solved?Math.max(0,1-(X.tiltT||0)):1; if(f<=0.01) continue;
    const x0=A.x0+(R.ox+1+3)*cs, x1=A.x0+(R.ox+1+12)*cs, y0=A.y0+(R.oy+1)*cs, y1=A.y0+(R.oy+1+3)*cs, gr=ctx.createLinearGradient(x0,0,x1,0); gr.addColorStop(0,'rgba(255,240,200,0)'); gr.addColorStop(1,`rgba(40,20,30,${0.42*f})`); ctx.fillStyle=gr; ctx.fillRect(x0,y0,x1-x0,y1-y0);
    for(const [rx,ph] of [[x0+cs*1.4,0],[x1-cs*1.2,1.7]]){ const sw=Math.sin(t*1.3+ph)*6*f, by=y0+cs*1.6+(rx>x0+cs*3?cs*0.35*f:0); ctx.strokeStyle=d1aOL(); ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(rx,y0-cs*0.6); ctx.quadraticCurveTo(rx+sw,y0+cs*0.4,rx+sw*0.5,by); ctx.stroke(); ctx.strokeStyle='#d8c090'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(rx,y0-cs*0.6); ctx.quadraticCurveTo(rx+sw,y0+cs*0.4,rx+sw*0.5,by); ctx.stroke(); }
    if(!R.solved&&Math.random()<0.02) emit(x0+rand(0,x1-x0),y0+rand(0,cs),1,{col:'150,120,90',glow:false,ang:Math.PI/2,spread:0.3,smin:20,smax:50,lmin:.4,lmax:.8,zmin:2,zmax:4}); }
  // the gear bridge
  if(X.gear&&inView(X.gear.x,X.gear.y,300)) d1aDrawGear(X.gear,t,cs);
  // steam vents and pipe jets
  for(const v of X.vents){ if(!inView(v.x,v.y,200)) continue; const d=DIRS[v.dir];
    if(v.on){ for(let n=0;n<v.len;n++){ const px=v.x+d[0]*n*cs, py=v.y+d[1]*n*cs; ctx.fillStyle=`rgba(245,245,250,${0.45+0.15*Math.sin(t*20+n)})`; for(let s=0;s<3;s++){ ctx.beginPath(); ctx.ellipse(px+Math.sin(t*9+s*2+n)*8,py+Math.cos(t*7+s)*6,16+s*4,11+s*3,0,0,TAU); ctx.fill(); } }
      if(Math.random()<0.5) emit(v.x+rand(-10,10),v.y+rand(0,v.len*cs),1,{col:'250,250,255',glow:false,ang:Math.atan2(d[1],d[0]),spread:0.5,smin:60,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:10,drag:1}); }
    else if(v.warn&&Math.random()<0.4) emit(v.x+rand(-5,5),v.y+8,1,{col:'250,250,255',glow:false,ang:Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.2,lmax:.4,zmin:1,zmax:3,grow:5}); }
  // pistons
  for(const P0 of X.pistons){ if(!inView(P0.x0,P0.y0,220)) continue; const d=DIRS[P0.d], L=P0.ext*P0.len*cs, hw=cs*0.36, x1=P0.x0+d[0]*L, y1=P0.y0+d[1]*L;
    ctx.fillStyle='#4a4a52'; if(d[0]) ctx.fillRect(Math.min(P0.x0,x1),P0.y0-6,Math.abs(L),12); else ctx.fillRect(P0.x0-6,Math.min(P0.y0,y1),12,Math.abs(L)); ctx.fillStyle='#8a8a96'; if(d[0]) ctx.fillRect(Math.min(P0.x0,x1),P0.y0-6,Math.abs(L),3); else ctx.fillRect(P0.x0-6,Math.min(P0.y0,y1),3,Math.abs(L));
    ctx.fillStyle=d1aOL(); ctx.fillRect(x1-(d[0]?6:hw+2),y1-(d[1]?6:hw+2),d[0]?14:hw*2+4,d[1]?14:hw*2+4); ctx.fillStyle='#c09a58'; ctx.fillRect(x1-(d[0]?4:hw),y1-(d[1]?4:hw),d[0]?10:hw*2,d[1]?10:hw*2); ctx.fillStyle='#ffe2a0'; ctx.fillRect(x1-(d[0]?4:hw),y1-(d[1]?4:hw),d[0]?10:hw*2,2.5); }
  // the ferris gear (under its rings)
  if(X.wheel2&&inView(X.wheel2.cx,X.wheel2.cy,X.wheel2.r+80)) d1aDrawWheel(X.wheel2,t);
}
function d1aBarrelSpr(){ return r2S('d1a_barrel',44,48,22,26,g=>{ g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(2,14,17,7,0,0,TAU); g.fill();
  celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy,16,15,0,0,TAU); },'#a8743e',{r:15}); g.strokeStyle='#5a3a1a'; g.lineWidth=2; for(const yy of [-8,7]){ g.beginPath(); g.moveTo(-15,yy); g.quadraticCurveTo(0,yy+3,15,yy); g.stroke(); }
  g.fillStyle='#6a6a72'; g.fillRect(-16,-2,32,4); g.fillStyle='#c8c8d0'; g.fillRect(-16,-2,32,1.3); g.fillStyle='#d8a868'; g.beginPath(); g.ellipse(-4,-10,6,3,0,0,TAU); g.fill(); }); }
function d1aCrateSpr(){ return r2S('d1a_crate',48,48,24,26,g=>{ g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(-18,8,40,10); celFill(g,(q,dx,dy)=>{ q.rect(-19+dx,-17+dy,38,34); },'#b07c44',{r:17}); g.strokeStyle='#6a4420'; g.lineWidth=2.4; g.strokeRect(-17,-15,34,30); g.beginPath(); g.moveTo(-17,-15); g.lineTo(17,15); g.moveTo(17,-15); g.lineTo(-17,15); g.stroke(); g.fillStyle='rgba(255,230,180,.35)'; g.fillRect(-17,-15,34,3); }); }
function d1aDrawGear(g,t,cs){
  const x=g.x, y=g.y, L=(g.H.length-1)/2*cs+cs*0.5;
  ctx.save(); ctx.translate(x,y);
  ctx.save(); ctx.rotate(g.ang); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(-L+6,-cs*0.42+8,L*2,cs*0.84);
  ctx.fillStyle=d1aOL(); rrect(ctx,-L-3,-cs*0.45-3,L*2+6,cs*0.9+6,8); ctx.fill(); ctx.fillStyle='#9a7448'; rrect(ctx,-L,-cs*0.45,L*2,cs*0.9,6); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.25)'; for(let s=-L+16;s<L;s+=16) ctx.fillRect(s,-cs*0.45,1.6,cs*0.9); ctx.fillStyle='#c09a58'; ctx.fillRect(-L,-cs*0.45,L*2,4); ctx.fillRect(-L,cs*0.45-4,L*2,4);
  ctx.fillStyle='#ffe2a0'; for(let s=-L+10;s<L;s+=24){ ctx.beginPath(); ctx.arc(s,-cs*0.45+2,1.6,0,TAU); ctx.fill(); }
  ctx.restore();
  // the hub gear: teeth turning, gold while stunned or jammed
  const R0=cs*0.62, spin=g.stun>0||g.jam?0:t*2; ctx.rotate(spin); ctx.fillStyle=d1aOL(); ctx.beginPath(); for(let n=0;n<10;n++){ const a=n/10*TAU; ctx.lineTo(Math.cos(a-0.12)*(R0+7),Math.sin(a-0.12)*(R0+7)); ctx.lineTo(Math.cos(a+0.12)*(R0+7),Math.sin(a+0.12)*(R0+7)); ctx.lineTo(Math.cos(a+0.3)*R0,Math.sin(a+0.3)*R0); } ctx.closePath(); ctx.fill();
  ctx.fillStyle=g.stun>0||g.jam?'#ffd060':'#b08840'; ctx.beginPath(); ctx.arc(0,0,R0-1,0,TAU); ctx.fill(); ctx.fillStyle='#6a4a24'; ctx.beginPath(); ctx.arc(0,0,R0*0.45,0,TAU); ctx.fill(); ctx.fillStyle='#ffe2a0'; ctx.beginPath(); ctx.arc(-R0*0.3,-R0*0.3,R0*0.16,0,TAU); ctx.fill();
  ctx.restore();
  if(g.stun>0||g.jam) glowAt(x,y,60,'255,214,110',0.35);
  if(g.state==='h'&&!g.jam&&!(g.stun>0)){ const ph=g.t%4, al=d1aDiff(2.4,1.6,1.2), left=al-ph; if(left<0.7&&left>0){ ctx.strokeStyle=`rgba(255,120,80,${0.5+0.4*Math.sin(t*20)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,cs*0.9,0,TAU); ctx.stroke(); } }
}
function d1aDrawWheel(q,t){
  const x=q.cx, y=q.cy, R=q.r;
  ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(8,12,R+10,0,TAU); ctx.fill();
  ctx.rotate(q.ang); ctx.lineWidth=14; ctx.strokeStyle=d1aOL(); ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.stroke(); ctx.lineWidth=10; ctx.strokeStyle='#b08840'; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.stroke(); ctx.lineWidth=3; ctx.strokeStyle='#ffe2a0'; ctx.beginPath(); ctx.arc(0,0,R-3,-2.4,-0.8); ctx.stroke();
  for(let n=0;n<16;n++){ const a=n/16*TAU; ctx.fillStyle='#8a6830'; ctx.save(); ctx.rotate(a); ctx.fillRect(R+3,-6,10,12); ctx.restore(); }
  for(let n=0;n<8;n++){ const a=n/8*TAU; ctx.strokeStyle=d1aOL(); ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R); ctx.stroke(); ctx.strokeStyle='#9a7a48'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R); ctx.stroke(); }
  ctx.fillStyle=d1aOL(); ctx.beginPath(); ctx.arc(0,0,22,0,TAU); ctx.fill(); ctx.fillStyle='#c09a58'; ctx.beginPath(); ctx.arc(0,0,19,0,TAU); ctx.fill(); ctx.fillStyle='#6a4a24'; ctx.beginPath(); ctx.arc(0,0,7,0,TAU); ctx.fill();
  ctx.restore();
}
// ---------- 10. art: objects (FL draws them in the furniture layer) and the tall pieces that sort with the figures
FL.d1agauge=(o,t)=>{ const hi=d1aTide()>=1, A=AREA, X=A&&A.d1a, turn=X&&X.turn, f=turn?1-turn.t/turn.T:0, lv=turn?(turn.to?f:1-f):(hi?1:0);
  r2put(r2S('d1a_gauge',40,64,20,52,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,4,12,5,0,0,TAU); g.fill(); g.fillStyle='#5a4a3a'; g.fillRect(-3,-40,6,44);
    celFill(g,(q,dx,dy)=>{ q.rect(-12+dx,-50+dy,24,30); },'#e8e0cc',{r:12}); g.fillStyle='#c83a2a'; g.fillRect(-10,-48,20,8); g.fillStyle='#3a6a9a'; g.fillRect(-10,-30,20,8); g.fillStyle='#fff'; g.font='700 6px sans-serif'; g.textAlign='center'; g.fillText('HIGH',0,-42); g.fillText('LOW',0,-24); }),o.x,o.y);
  const yy=o.y-48+(1-lv)*20; ctx.fillStyle=d1aOL(); ctx.fillRect(o.x+8,yy-2,8,5); ctx.fillStyle='#ffd060'; ctx.fillRect(o.x+9,yy-1,6,3); };
FL.d1apage=(o,t)=>{ if(d1aPageHave(o.n)) return; const b=Math.sin(t*2+o.x)*2; glowAt(o.x,o.y-6,26,'255,230,170',0.35+0.15*Math.sin(t*3));
  r2put(r2S('d1a_page',30,30,15,15,g=>{ g.rotate(-0.18); celFill(g,(q,dx,dy)=>{ q.rect(-9+dx,-11+dy,18,22); },'#f2e4c4',{r:10}); g.strokeStyle='rgba(90,60,30,.6)'; g.lineWidth=1; for(let k=-6;k<=6;k+=3){ g.beginPath(); g.moveTo(-6,k); g.lineTo(6,k); g.stroke(); } g.strokeStyle='#8a5a2a'; g.lineWidth=1.4; g.beginPath(); g.arc(3,-5,3,0,TAU); g.moveTo(3,-2); g.lineTo(3,2); g.stroke(); }),o.x,o.y+b); };
FL.d1awarp=(o,t)=>{ const on=trialDone(dunRoot(AREA.def.id)); ctx.save(); ctx.translate(o.x,o.y); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0,4,30,12,0,0,TAU); ctx.fill();
  ctx.strokeStyle=d1aOL(); ctx.lineWidth=7; ctx.beginPath(); ctx.ellipse(0,0,26,11,0,0,TAU); ctx.stroke(); ctx.strokeStyle=on?'#8ae8f8':'#5a6a7a'; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(0,0,26,11,0,0,TAU); ctx.stroke();
  if(on){ for(let n=0;n<6;n++){ const a=t*1.6+n*TAU/6; ctx.fillStyle='rgba(200,250,255,.85)'; ctx.beginPath(); ctx.arc(Math.cos(a)*24,Math.sin(a)*10-((t*30+n*9)%30),2.2,0,TAU); ctx.fill(); } glowAt(0,-10,50,'150,230,255',0.4); }
  ctx.restore(); };
FL.d1alever=(o,t)=>{ const A=AREA, X=A.d1a, rev=X&&X.brev[`${o.room}_${o.g}`];
  r2put(r2S('d1a_leverbase',36,28,18,14,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,7,15,6,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.rect(-13+dx,-6+dy,26,13); },'#6a5a4a',{r:12}); g.fillStyle='#c09a58'; g.fillRect(-13,-6,26,3); }),o.x,o.y);
  ctx.save(); ctx.translate(o.x,o.y-2); ctx.rotate(rev?0.7:-0.7); ctx.fillStyle=d1aOL(); ctx.fillRect(-3.5,-28,7,28); ctx.fillStyle='#8a6a3a'; ctx.fillRect(-2,-27,4,26); ctx.fillStyle=d1aOL(); ctx.beginPath(); ctx.arc(0,-28,7.5,0,TAU); ctx.fill(); ctx.fillStyle=o.g?'#4aa0e8':'#e85a3a'; ctx.beginPath(); ctx.arc(0,-28,5.5,0,TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle=o.g?'rgba(120,190,255,.9)':'rgba(255,140,100,.9)'; ctx.font=`800 10px ${UIF}`; ctx.textAlign='center'; ctx.fillText(rev?'⟲':'⟳',o.x,o.y+20); };
FL.d1avent=(o,t)=>{ r2put(r2S('d1a_vent'+(o.jet?'j':''),44,30,22,15,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0,6,18,7,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy,17,9,0,0,TAU); },o.jet?'#8a6a5a':'#7a6a5a',{r:12}); g.fillStyle='#1a1210'; g.beginPath(); g.ellipse(0,0,11,5,0,0,TAU); g.fill(); g.strokeStyle='#c09a58'; g.lineWidth=2; g.beginPath(); g.ellipse(0,0,15,7.5,0,0,TAU); g.stroke(); }),o.x,o.y);
  if(!o.jet){ // the gauge on the wall above: its needle ticks toward red before the puff
    const A=AREA, X=A.d1a, on=d1aDiff(0.8,1,1.2), off=d1aDiff(2.6,2,1.6), per=on+off, ph=(X.t+(o.ph||0)*per/3.4)%per, f=o.on?1:ph<on?1:clamp((ph-on)/off,0,1);
    const gx=o.x, gy=o.y-58; r2put(r2S('d1a_dial',34,34,17,17,g=>{ celFill(g,(q,dx,dy)=>{ q.arc(dx,dy,14,0,TAU); },'#e8e0cc',{r:14}); g.strokeStyle='#c83a2a'; g.lineWidth=4; g.beginPath(); g.arc(0,0,10,-0.6,0.4); g.stroke(); g.strokeStyle='#5aa04a'; g.beginPath(); g.arc(0,0,10,-3.0,-1.0); g.stroke(); g.strokeStyle='#c09a58'; g.lineWidth=2.4; g.beginPath(); g.arc(0,0,14,0,TAU); g.stroke(); }),gx,gy);
    const a=lerp(-2.6,0.2,f); ctx.strokeStyle=d1aOL(); ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+Math.cos(a)*10,gy+Math.sin(a)*10); ctx.stroke(); if(o.warn||o.on) glowAt(gx,gy,20,'255,100,70',0.35); } };
FL.d1awheel=(o,t)=>{ const A=AREA, R=A.rooms[o.room], B=A.d1a.boiler, done=R&&(R.boiler?B&&B.cool:R.solved);
  ctx.save(); ctx.translate(o.x,o.y-14); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(2,20,16,6,0,0,TAU); ctx.fill(); ctx.fillStyle='#4a3a2a'; ctx.fillRect(-4,0,8,20);
  ctx.rotate(o.spin*6+(done?0.8:0)); ctx.strokeStyle=d1aOL(); ctx.lineWidth=7; ctx.beginPath(); ctx.arc(0,0,14,0,TAU); ctx.stroke(); ctx.strokeStyle=done?'#5ab04a':'#d84a2a'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,14,0,TAU); ctx.stroke();
  ctx.lineWidth=3; for(let n=0;n<4;n++){ const a=n*Math.PI/2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*13,Math.sin(a)*13); ctx.stroke(); } ctx.fillStyle='#c09a58'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill(); ctx.restore(); };
FL.d1apvalve=(o,t)=>{ const L=o.state==='L'; ctx.save(); ctx.translate(o.x,o.y); ctx.fillStyle='#5a3a24'; ctx.fillRect(-20,-6,40,12); ctx.fillStyle='#c8784a'; ctx.fillRect(-20,-6,40,3);
  ctx.rotate(o.spin*5); ctx.strokeStyle=d1aOL(); ctx.lineWidth=6; ctx.beginPath(); ctx.arc(0,-10,12,0,TAU); ctx.stroke(); ctx.strokeStyle='#ffd060'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.arc(0,-10,12,0,TAU); ctx.stroke(); ctx.restore();
  ctx.fillStyle=d1aOL(); ctx.font=`900 13px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle=d1aOL(); ctx.strokeText(L?'◀ L':'R ▶',o.x,o.y+20); ctx.fillStyle=L?'#9ad8ff':'#ffd8a0'; ctx.fillText(L?'◀ L':'R ▶',o.x,o.y+20); };
DUN_DRAW.d1acrane=(q,t)=>{ if(!q) return;
  // the right crane's crate hangs on its rope until pulled; a falling crate arcs down toward Ash
  const o=q.crate, cs=48; if(!q.landed&&!q.drop&&!q.miss){ ctx.strokeStyle=d1aOL(); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(o.x,o.y-140); ctx.lineTo(o.x,o.y-30); ctx.stroke(); ctx.strokeStyle='#d8c8a0'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(o.x,o.y-140); ctx.lineTo(o.x,o.y-30); ctx.stroke(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(o.x+6,o.y+12,18,7,0,0,TAU); ctx.fill(); r2put(d1aCrateSpr(),o.x+Math.sin(t*1.2)*2,o.y-28,1); const S0=o.strain||0; if(S0>0){ ctx.strokeStyle='rgba(255,214,110,.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(o.x,o.y-28,26,-Math.PI/2,-Math.PI/2+TAU*clamp(S0/0.5,0,1)); ctx.stroke(); } }
  if(q.drop){ const D=q.drop, k=clamp(D.t/0.55,0,1), x=lerp(D.from.x,D.to.x,k), y=lerp(D.from.y-28,D.to.y,k)-Math.sin(k*Math.PI)*30; r2put(d1aCrateSpr(),x,y,1); }
  if(q.miss&&q.miss.t>0){ q.miss.t-=1/60; r2put(d1aCrateSpr(),q.miss.x,q.miss.y,1); } };
DUN_DRAW.d1atrolley=(q,t)=>{ if(!q) return; const y=q.a.y-90; ctx.strokeStyle=d1aOL(); ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(q.a.x-30,y); ctx.lineTo(q.b.x+30,y); ctx.stroke(); ctx.strokeStyle='#8a8a96'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(q.a.x-30,y); ctx.lineTo(q.b.x+30,y); ctx.stroke();
  const x=q.ring.x; ctx.fillStyle=d1aOL(); ctx.fillRect(x-16,y-8,32,16); ctx.fillStyle='#c09a58'; ctx.fillRect(x-14,y-6,28,12); ctx.fillStyle='#2a2a30'; for(const dx of [-9,9]){ ctx.beginPath(); ctx.arc(x+dx,y-7,4,0,TAU); ctx.fill(); } if(q.inList) glowAt(x,y,40,'255,214,110',0.3); };
DUN_DRAW.d1awheel2=()=>{};
// Pearl's places draw their own statue, cushion and altars; kelp instead of roots by the sea; furnaces in the works
{ const base=FL.tv; FL.tv=(o,t)=>{ if(AREA&&AREA.d1a&&o.ref&&(o.kind==='shrine'||o.kind==='altar')) return; return base(o,t); }; }
{ const base=DUN_DRAW.roots; DUN_DRAW.roots=(q,t,o)=>{ if(AREA&&AREA.d1a&&AREA.d1a.root==='c_gullcrag') return d1aKelp(q,t); return base(q,t,o); }; }
function d1aKelp(q,t){ const g=q.grow!=null?q.grow:(q.opened?0:1), x=q.x, y=q.y; if(q.opened&&g<0.05){ ctx.fillStyle='rgba(40,30,20,.35)'; ctx.beginPath(); ctx.ellipse(x,y+10,16,6,0,0,TAU); ctx.fill(); return; }
  for(let n=0;n<6;n++){ const ox=-18+n*7.2, sw=Math.sin(t*1.6+n*1.3+x)*4; ctx.strokeStyle=d1aOL(); ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x+ox,y-26); ctx.quadraticCurveTo(x+ox+sw,y,x+ox-sw*0.5,y+20); ctx.stroke(); ctx.strokeStyle=n%2?'#6a8a3a':'#8aa84a'; ctx.lineWidth=4.4; ctx.beginPath(); ctx.moveTo(x+ox,y-26); ctx.quadraticCurveTo(x+ox+sw,y,x+ox-sw*0.5,y+20); ctx.stroke(); }
  ctx.fillStyle='#c8b060'; for(let n=0;n<4;n++){ ctx.beginPath(); ctx.arc(x-12+n*8,y-10+(n%2)*12,2.6,0,TAU); ctx.fill(); }
  if(q.heat>0) glowAt(x,y,34,'255,130,40',Math.min(0.8,q.heat)); }
{ const base=drawFurnX; drawFurnX=function(o,t){
    if(o&&AREA&&AREA.d1a){
      if(o.k==='brazier'&&AREA.d1a.root==='c_brassworks'){ d1aFurnace(o,t); return true; }
      if(o.k==='block'&&o.d1acrate){ r2put(d1aCrateSpr(),o.x,o.y,1); return true; }
      if(o.k==='cgate'&&(o.d1aLook||o.type==='tide')){ d1aDrawGate(o,t); return true; } }
    return base(o,t); }; }
function d1aFurnace(o,t){ const x=o.x, y=o.y, lit=o.lit, R=AREA.rooms[o.room], left=lit&&o.burn!=null&&!(R&&R.solved)?o.burn/(o.timed||12):1;
  r2put(r2S('d1a_furnace',72,80,36,58,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,14,30,10,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.moveTo(-26+dx,12+dy); q.lineTo(-22+dx,-30+dy); q.quadraticCurveTo(dx,-48+dy,22+dx,-30+dy); q.lineTo(26+dx,12+dy); q.closePath(); },'#6a4e3a',{r:26});
    g.fillStyle='#2a1a12'; rrect(g,-13,-16,26,22,8); g.fill(); g.fillStyle='#c09a58'; g.fillRect(-26,6,52,5); g.fillRect(-8,-56,16,16); g.fillStyle='#ffe2a0'; for(const dx of [-20,-8,8,20]){ g.beginPath(); g.arc(dx,9,1.5,0,TAU); g.fill(); } }),x,y);
  if(lit){ const f=0.75+0.25*Math.sin(t*12+x); ctx.fillStyle=`rgba(255,${150+60*f|0},60,.95)`; rrect(ctx,x-11,y-14,22,18,6); ctx.fill(); ctx.fillStyle='rgba(255,240,180,.9)'; rrect(ctx,x-6,y-8,12,9,4); ctx.fill(); glowAt(x,y-6,70,'255,150,60',0.55*f); if(Math.random()<0.3) emit(x+rand(-5,5),y-62,1,{col:'90,80,80',glow:false,ang:-Math.PI/2,spread:0.4,smin:20,smax:50,lmin:.8,lmax:1.4,zmin:3,zmax:6,grow:9,drag:0.6});
    if(left<1){ ctx.fillStyle=d1aOL(); ctx.fillRect(x-20,y+18,40,7); ctx.fillStyle=left<0.3?'#ff5a3a':'#ffc040'; ctx.fillRect(x-19,y+19,38*left,5); } }
  else { ctx.fillStyle='rgba(20,12,8,.9)'; rrect(ctx,x-11,y-14,22,18,6); ctx.fill(); } }
function d1aDrawGate(o,t){
  const x=o.x, y=o.y, cs=48;
  if(o.type==='tide'){ if(!o.closed) return; const horiz=o.vertical, W2=horiz?144:48, H2=horiz?48:144; ctx.fillStyle='rgba(42,122,160,.82)'; ctx.fillRect(x-W2/2,y-H2/2,W2,H2); ctx.strokeStyle='rgba(220,245,255,.5)'; ctx.lineWidth=2; for(let n=0;n<3;n++){ ctx.beginPath(); const yy=y-H2/2+8+n*(H2/3), ph=t*2+n; ctx.moveTo(x-W2/2+4,yy+Math.sin(ph)*3); ctx.quadraticCurveTo(x,yy-4,x+W2/2-4,yy+Math.sin(ph+1)*3); ctx.stroke(); }
    ctx.fillStyle='rgba(235,240,245,.85)'; for(let n=0;n<10;n++){ const bx=x-W2/2+((n*29)%W2), by=y-H2/2+((n*17)%H2); ctx.beginPath(); ctx.arc(bx,by,2.4,0,TAU); ctx.fill(); } return; }
  if(o.d1aLook==='hatch'){ const n=Math.max(1,o.cells.length), sz=Math.sqrt(n)*cs; if(o.closed){ ctx.fillStyle=d1aOL(); rrect(ctx,x-sz/2-3,y-sz/2-3,sz+6,sz+6,6); ctx.fill(); ctx.fillStyle='#7a5430'; rrect(ctx,x-sz/2,y-sz/2,sz,sz,4); ctx.fill(); ctx.fillStyle='rgba(0,0,0,.25)'; for(let s=1;s<4;s++) ctx.fillRect(x-sz/2,y-sz/2+s*sz/4,sz,2); ctx.fillStyle='#5a5a62'; ctx.fillRect(x-sz/2,y-4,sz,8);
      ctx.fillStyle='#ff9a3a'; ctx.beginPath(); ctx.moveTo(x,y-14); ctx.quadraticCurveTo(x+10,y,x,y+10); ctx.quadraticCurveTo(x-10,y,x,y-14); ctx.fill(); glowAt(x,y,30,'255,150,60',0.3+0.15*Math.sin(t*3)); }
    else { ctx.fillStyle='#7a5430'; ctx.save(); ctx.translate(x-sz/2,y-sz/2); ctx.fillRect(-10,-sz*0.2,10,sz*0.4+sz*0.2); ctx.restore(); } return; }
  if(!o.closed) return;
  if(o.d1aLook==='steam'){ ctx.fillStyle=d1aOL(); ctx.beginPath(); ctx.arc(x,y,24,0,TAU); ctx.fill(); ctx.fillStyle='#5a5a62'; ctx.beginPath(); ctx.arc(x,y,21,0,TAU); ctx.fill(); ctx.strokeStyle='#2a2a30'; ctx.lineWidth=3; for(let n=-2;n<=2;n++){ ctx.beginPath(); ctx.moveTo(x+n*7,y-18); ctx.lineTo(x+n*7,y+18); ctx.stroke(); }
    if(Math.random()<0.6) emit(x+rand(-12,12),y,1,{col:'250,250,255',glow:false,ang:-Math.PI/2,spread:0.5,smin:40,smax:110,lmin:.4,lmax:.9,zmin:2,zmax:6,grow:9,drag:1}); return; }
  if(o.d1aLook==='lift'){ ctx.strokeStyle=d1aOL(); ctx.lineWidth=5; ctx.strokeRect(x-26,y-30,52,54); ctx.strokeStyle='#c09a58'; ctx.lineWidth=2.6; ctx.strokeRect(x-26,y-30,52,54); for(let n=-2;n<=2;n++){ ctx.beginPath(); ctx.moveTo(x+n*10,y-30); ctx.lineTo(x+n*10,y+24); ctx.stroke(); } ctx.fillStyle='#ffd060'; ctx.fillRect(x-6,y-6,12,10); return; }
  if(o.d1aLook==='stair'){ stoneBlock(x,y,52,52,'#6a6a74','#2a2a34',8); ctx.fillStyle='#ff9a3a'; ctx.beginPath(); ctx.moveTo(x,y-16); ctx.quadraticCurveTo(x+10,y-4,x,y+8); ctx.quadraticCurveTo(x-10,y-4,x,y-16); ctx.fill(); glowAt(x,y-4,30,'255,150,60',0.3+0.15*Math.sin(t*3)); }
}
// tall pieces: the bells, Pearl's statue, the cushion, the boilers, the press, the crane arm, the lever in the workshop
{ const base=eventsForRender; eventsForRender=function(list){ base(list); const A=AREA; if(!A||!A.d1a||!G) return; const X=A.d1a, t=G.time;
    for(const o of X.bells) if(inView(o.x,o.y,200)) list.push({x:o.x,y:o.y+2,r:10,draw:()=>d1aBell(o,t)});
    for(const o of A.objs){ if(o.tobj==='shrine'&&inView(o.x,o.y,200)) list.push({x:o.x,y:o.y,r:10,draw:()=>X.root==='c_gullcrag'?d1aStatue(o,t):d1aCushion(o,t)});
      if(o.tobj==='altar'&&inView(o.x,o.y,200)) list.push({x:o.x,y:o.y,r:10,draw:()=>X.root==='c_gullcrag'?d1aCradle(o,t):d1aDrive(o,t)}); }
    if(X.boiler) for(const id in A.rooms){ const R=A.rooms[id]; if(!R.boiler||!inView(R.cx,R.cy,500)) continue; for(const [c0,r0,i] of [[1,1.5,0],[5,1.5,1],[9,1.5,2],[13,1.5,3]]){ const p=d1aP(A,R,c0,r0); list.push({x:p.x,y:p.y+44,r:10,draw:()=>d1aBoiler(p,i,t,X)}); } }
    if(X.press&&inView(X.press.x,X.press.y,300)) list.push({x:X.press.x,y:X.press.y+70,r:10,draw:()=>d1aPress(X.press,t)});
    if(X.crane&&inView(X.crane.a.x,X.crane.a.y,500)) list.push({x:X.crane.a.x,y:X.crane.a.y+400,r:6,flying:true,draw:()=>d1aCraneArm(X.crane,t)});
    if(X.cis&&X.cis.held){}
  }; }
function d1aBell(o,t){
  const x=o.x, y=o.y, sw=Math.sin(t*9)*o.swing*0.35, big=o.kind==='great', s=big?1.25:1;
  if(big){ // the whale rib it hangs from
    r2put(r2S('d1a_rib',150,140,75,120,g=>{ g.lineCap='round'; for(const [lw,col] of [[16,d1aOL()],[11,'#efe6d0']]){ g.strokeStyle=col; g.lineWidth=lw; g.beginPath(); g.moveTo(-58,8); g.quadraticCurveTo(-60,-110,0,-112); g.quadraticCurveTo(60,-110,58,8); g.stroke(); } g.strokeStyle='rgba(180,170,150,.8)'; g.lineWidth=2; for(let n=0;n<6;n++){ g.beginPath(); g.moveTo(-52+n*3,-20-n*15); g.lineTo(-44+n*3,-22-n*15); g.stroke(); } }),x,y); }
  const top=y-(big?104:80); ctx.strokeStyle=d1aOL(); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,top); ctx.lineTo(x+Math.sin(sw)*18,top+22); ctx.stroke();
  ctx.save(); ctx.translate(x,top+20); ctx.rotate(sw); ctx.scale(s,s);
  r2put(r2S('d1a_bellbody',48,52,24,6,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-6+dx,dy); q.quadraticCurveTo(-12+dx,8+dy,-16+dx,30+dy); q.quadraticCurveTo(-20+dx,38+dy,0+dx,38+dy); q.quadraticCurveTo(20+dx,38+dy,16+dx,30+dy); q.quadraticCurveTo(12+dx,8+dy,6+dx,dy); q.closePath(); },'#c8903a',{r:18});
    g.fillStyle='#8a5a24'; g.fillRect(-17,30,34,4); g.fillStyle='#ffe0a0'; g.beginPath(); g.ellipse(-7,14,2.4,7,0.15,0,TAU); g.fill(); g.fillStyle='#6a4018'; g.beginPath(); g.arc(0,40,4,0,TAU); g.fill(); g.fillStyle='rgba(120,200,190,.55)'; for(const [a,b] of [[8,20],[-10,26],[11,30]]){ g.beginPath(); g.arc(a,b,2.2,0,TAU); g.fill(); } }),0,0,1);
  ctx.restore();
  glowAt(x,top+40,big?60:44,'255,220,140',0.2+0.4*o.swing+(o.cd>0?0.1:0));
  if(o.kind!=='high'&&inView(x,y,60)){ const hi=d1aTide()>=1, A=AREA, turn=A.d1a.turn; ctx.font=`800 10px ${UIF}`; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle=d1aOL(); const txt=turn?S('TURNING','TURNING'):hi?S('HIGH TIDE','HIGH'):S('LOW TIDE','LOW'); ctx.strokeText(txt,x,y+22); ctx.fillStyle=turn?'#ffe0a0':hi?'#9ae0ff':'#f0d8a0'; ctx.fillText(txt,x,y+22); }
}
function d1aStatue(o,t){ const x=o.x, y=o.vis?o.vis.y:o.y-10, has=hasAbil('claws');
  r2put(r2S('d1a_pearlstatue',100,150,50,128,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,12,38,12,0,0,TAU); g.fill();
    celFill(g,(q,dx,dy)=>{ q.rect(-34+dx,-6+dy,68,18); },'#8a98a4',{r:30}); const st='#c8d0d4';
    celFill(g,(q,dx,dy)=>{ q.moveTo(-18+dx,-6+dy); q.lineTo(-14+dx,-60+dy); q.quadraticCurveTo(dx,-70+dy,14+dx,-60+dy); q.lineTo(18+dx,-6+dy); q.closePath(); },st,{r:20});
    celFill(g,(q,dx,dy)=>{ q.arc(dx,-80+dy,13,0,TAU); },st,{r:13});
    g.strokeStyle=d1aOL(); g.lineWidth=4; for(const s of [-1,1]){ g.beginPath(); g.moveTo(s*8,-90); g.quadraticCurveTo(s*16,-104,s*12,-114); g.stroke(); g.strokeStyle='#e8e0d0'; g.lineWidth=2.4; g.beginPath(); g.moveTo(s*8,-90); g.quadraticCurveTo(s*16,-104,s*12,-114); g.stroke(); g.strokeStyle=d1aOL(); g.lineWidth=4; }
    g.strokeStyle='#a8865a'; g.lineWidth=3; g.beginPath(); g.ellipse(-12,-34,8,6,0.4,0,TAU); g.stroke(); g.beginPath(); g.ellipse(-12,-34,5,3.6,0.4,0,TAU); g.stroke();
    g.fillStyle='#8a98a4'; g.fillRect(15,-46,3,22); g.fillStyle='#a8b4bc'; rrect(g,10,-30,13,15,3); g.fill(); g.strokeStyle=d1aOL(); g.lineWidth=1.5; g.strokeRect(10,-30,13,15);
    celFill(g,(q,dx,dy)=>{ q.ellipse(26+dx,-44+dy,9,5,-0.4,0,TAU); },st,{r:8}); }),x,y);
  if(!has){ const f=0.5+0.5*Math.sin(t*3); glowAt(x+26,y-44,24,'255,230,150',0.35+0.3*f); ctx.fillStyle=`rgba(255,240,190,${0.5+0.4*f})`; ctx.beginPath(); ctx.arc(x+26,y-44,3,0,TAU); ctx.fill(); }
  else glowAt(x,y-60,40,'255,240,210',0.15); }
function d1aCushion(o,t){ const x=o.x, y=o.vis?o.vis.y:o.y-10, has=hasAbil('grapple');
  r2put(r2S('d1a_rack',150,110,75,96,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-70+dx,-92+dy,140,14); },'#7a5230',{r:30}); g.fillStyle='#5a3a20'; g.fillRect(-66,-80,6,80); g.fillRect(60,-80,6,80);
    const tools=[['#9a9aa6',-48,'w'],['#c09a58',-24,'h'],['#9a9aa6',4,'s'],['#b07040',30,'w'],['#9a9aa6',50,'h']]; for(const [col,dx,k] of tools){ g.strokeStyle=d1aOL(); g.lineWidth=5; g.beginPath(); g.moveTo(dx,-78); g.lineTo(dx,-40); g.stroke(); g.strokeStyle=col; g.lineWidth=3; g.beginPath(); g.moveTo(dx,-78); g.lineTo(dx,-40); g.stroke(); g.fillStyle=col; if(k==='h') g.fillRect(dx-9,-46,18,10); else if(k==='w'){ g.beginPath(); g.arc(dx,-40,6,0,TAU); g.fill(); } else g.fillRect(dx-3,-44,6,10); } }),x,y-78);
  r2put(r2S('d1a_cushion',80,60,40,40,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,10,30,10,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.rect(-22+dx,-18+dy,44,30); },'#5a4a3a',{r:22}); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-20+dy,24,10,0,0,TAU); },'#a83a4a',{r:22}); g.fillStyle='#ffd060'; for(const s of [-1,1]){ g.beginPath(); g.arc(s*22,-20,3,0,TAU); g.fill(); } }),x,y);
  if(!has){ const f=0.5+0.5*Math.sin(t*3); ctx.strokeStyle=d1aOL(); ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y-30,7,Math.PI*0.2,Math.PI*1.7); ctx.stroke(); ctx.strokeStyle='#ffd060'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y-30,7,Math.PI*0.2,Math.PI*1.7); ctx.stroke(); glowAt(x,y-30,26,'255,220,120',0.35+0.3*f); } }
function d1aCradle(o,t){ const x=o.x, y=o.vis?o.vis.y:o.y-10, done=trialDone('c_gullcrag');
  r2put(r2S('d1a_cradle',110,90,55,64,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(3,14,42,12,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.moveTo(-40+dx,-10+dy); q.quadraticCurveTo(dx,30+dy,40+dx,-10+dy); q.lineTo(34+dx,-14+dy); q.quadraticCurveTo(dx,18+dy,-34+dx,-14+dy); q.closePath(); },'#9aa4ac',{r:36});
    celFill(g,(q,dx,dy)=>{ q.ellipse(dx,-12+dy,32,10,0,0,TAU); },'#b8c0c6',{r:30}); g.fillStyle='#e8d8b0'; g.beginPath(); g.ellipse(-6,-14,18,6,0,0,TAU); g.fill(); g.fillStyle='#d8a8a8'; g.beginPath(); g.arc(12,-15,5,0,TAU); g.fill();
    g.strokeStyle='#ffd060'; g.lineWidth=2; g.beginPath(); g.arc(-30,-40,6,0,TAU); g.moveTo(-30,-34); g.lineTo(-30,-22); g.stroke(); }),x,y);
  if(!done) glowAt(x,y-14,50,'255,230,170',0.35+0.15*Math.sin(t*2.4)); }
function d1aDrive(o,t){ const x=o.x, y=o.vis?o.vis.y:o.y-10, done=trialDone('c_brassworks');
  // the great drive shaft through the workshop and its big lever
  ctx.fillStyle=d1aOL(); ctx.fillRect(x+44,y-150,28,170); ctx.fillStyle='#8a8a96'; ctx.fillRect(x+47,y-150,22,170); ctx.fillStyle='#c8c8d0'; ctx.fillRect(x+48,y-150,5,170);
  ctx.save(); ctx.translate(x+58,y-40); ctx.rotate(done?t*1.2:Math.sin(t*20)*0.02); ctx.fillStyle=d1aOL(); ctx.beginPath(); for(let n=0;n<12;n++){ const a=n/12*TAU; ctx.lineTo(Math.cos(a-0.12)*36,Math.sin(a-0.12)*36); ctx.lineTo(Math.cos(a+0.12)*36,Math.sin(a+0.12)*36); ctx.lineTo(Math.cos(a+0.26)*29,Math.sin(a+0.26)*29); } ctx.closePath(); ctx.fill(); ctx.fillStyle=done?'#c09a58':'#8a7a5a'; ctx.beginPath(); ctx.arc(0,0,28,0,TAU); ctx.fill(); ctx.fillStyle='#5a4424'; ctx.beginPath(); ctx.arc(0,0,9,0,TAU); ctx.fill(); ctx.restore();
  if(!done){ ctx.fillStyle='rgba(200,200,210,.7)'; for(let n=0;n<4;n++){ ctx.beginPath(); ctx.arc(x+58+rand(-26,26),y-40+rand(-26,26),2,0,TAU); ctx.fill(); } }
  ctx.fillStyle=d1aOL(); ctx.fillRect(x-14,y-8,28,16); ctx.fillStyle='#5a5a62'; ctx.fillRect(x-12,y-6,24,12);
  ctx.save(); ctx.translate(x,y-2); ctx.rotate(done?0.9:-0.6); ctx.fillStyle=d1aOL(); ctx.fillRect(-5,-52,10,52); ctx.fillStyle='#8a6a3a'; ctx.fillRect(-3,-50,6,48); ctx.fillStyle=d1aOL(); ctx.beginPath(); ctx.arc(0,-54,10,0,TAU); ctx.fill(); ctx.fillStyle='#e8402a'; ctx.beginPath(); ctx.arc(0,-54,7.5,0,TAU); ctx.fill(); ctx.restore();
  if(!done) glowAt(x,y-40,50,'255,200,120',0.3+0.15*Math.sin(t*3)); }
function d1aBoiler(p,i,t,X){ const hot=i!==2||!X.boiler.cool, x=p.x, y=p.y;
  r2put(r2S('d1a_boiler',156,140,78,108,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4,30,70,14,0,0,TAU); g.fill();
    celFill(g,(q,dx,dy)=>{ q.moveTo(-66+dx,26+dy); q.lineTo(-66+dx,-60+dy); q.quadraticCurveTo(dx,-100+dy,66+dx,-60+dy); q.lineTo(66+dx,26+dy); q.closePath(); },'#b08848',{r:60});
    g.fillStyle='rgba(60,30,10,.45)'; for(let r=-50;r<20;r+=18) for(let c=-58;c<=58;c+=14){ g.beginPath(); g.arc(c,r,1.8,0,TAU); g.fill(); } g.fillStyle='#7a5a2a'; for(const yy of [-40,-6]) g.fillRect(-66,yy,132,6);
    g.fillStyle='#e8e0cc'; g.beginPath(); g.arc(-30,-30,12,0,TAU); g.fill(); g.strokeStyle=d1aOL(); g.lineWidth=2; g.stroke(); g.strokeStyle='#c83a2a'; g.beginPath(); g.moveTo(-30,-30); g.lineTo(-24,-36); g.stroke(); }),x,y-44);
  if(i===2){ glowAt(x,y-90,40,hot?'255,140,80':'150,220,255',0.3); if(!hot){ ctx.fillStyle='rgba(180,230,255,.25)'; ctx.fillRect(x-66,y-10,132,30); } }
  if(hot&&Math.random()<0.08) emit(x+rand(-40,40),y-100,1,{col:'245,245,250',glow:false,ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.8,lmax:1.4,zmin:3,zmax:6,grow:10,drag:0.6}); }
function d1aPress(q,t){ const x=q.x, y=q.y, ph=q.t/2.6, down=ph<0.12?1-ph/0.12:ph>0.85?(ph-0.85)/0.15:0;
  r2put(r2S('d1a_press',200,190,100,150,g=>{ celFill(g,(qq,dx,dy)=>{ qq.rect(-92+dx,-140+dy,184,40); },'#7a6a5a',{r:60}); g.fillStyle='#4a3a2a'; g.fillRect(-88,-100,18,140); g.fillRect(70,-100,18,140); g.fillStyle='#c09a58'; g.fillRect(-92,-140,184,6); g.fillStyle='#ffe2a0'; for(let n=0;n<8;n++){ g.beginPath(); g.arc(-80+n*23,-120,2,0,TAU); g.fill(); } }),x,y);
  const py=y-96+down*70; ctx.fillStyle=d1aOL(); ctx.fillRect(x-12,y-100,24,down*70+6); ctx.fillStyle='#9a9aa6'; ctx.fillRect(x-9,y-100,18,down*70+4); ctx.fillStyle=d1aOL(); ctx.fillRect(x-66,py,132,28); ctx.fillStyle='#8a8a96'; ctx.fillRect(x-63,py+3,126,22); ctx.fillStyle='#c8c8d0'; ctx.fillRect(x-63,py+3,126,4);
  if(down>0.9){ glowAt(x,y+20,60,'255,220,170',0.25); } }
function d1aCraneArm(q,t){ const top=q.a.y-160; ctx.strokeStyle=d1aOL(); ctx.lineWidth=12; ctx.beginPath(); ctx.moveTo(q.a.x+60,q.a.y+30); ctx.lineTo(q.a.x+60,top); ctx.lineTo(q.b.x-40,top); ctx.stroke(); ctx.strokeStyle='#d0a040'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(q.a.x+60,q.a.y+30); ctx.lineTo(q.a.x+60,top); ctx.lineTo(q.b.x-40,top); ctx.stroke();
  ctx.strokeStyle='rgba(40,20,10,.6)'; ctx.lineWidth=2; for(let x=q.b.x-30;x<q.a.x+50;x+=18){ ctx.beginPath(); ctx.moveTo(x,top-4); ctx.lineTo(x+9,top+4); ctx.stroke(); }
  const hx=q.hook.x, hy=q.hook.y-q.hook.h; ctx.strokeStyle=d1aOL(); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(hx,top); ctx.lineTo(hx,hy); ctx.stroke(); ctx.strokeStyle='#d8c8a0'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(hx,top); ctx.lineTo(hx,hy); ctx.stroke();
  ctx.fillStyle=d1aOL(); ctx.fillRect(hx-10,top-8,20,14); ctx.fillStyle='#8a8a96'; ctx.fillRect(hx-8,top-6,16,10); }
// ---------- 11. small decor objects (pigeons, the tin soldier, Pearl's coat)
function d1aDecor(A,def){
  const X=A.d1a;
  for(const id in A.rooms){ const R=A.rooms[id];
    if(R.pigeons) for(let n=0;n<4;n++){ const p=d1aP(A,R,3+n*3,2+(n%2)); A.objs.push({k:'d1adeco',kind:'pigeon',x:p.x,y:p.y,ph:n*1.7,id:`${X.SK}_d1a_${id}_pg${n}`}); }
    if(R.pigeons){ const p=d1aP(A,R,10,1); A.objs.push({k:'d1adeco',kind:'coat',x:p.x,y:p.y,id:`${X.SK}_d1a_${id}_coat`}); }
    if(R.soldier){ const p=d1aP(A,R,5,5); A.objs.push({k:'d1adeco',kind:'soldier',x:p.x,y:p.y,id:`${X.SK}_d1a_${id}_sold`}); for(let n=0;n<6;n++){ const q=d1aP(A,R,2+n*2,7+(n%2)); A.objs.push({k:'d1adeco',kind:'scrap',x:q.x,y:q.y,ph:n,id:`${X.SK}_d1a_${id}_scrap${n}`}); } }
    if(R.workshop){ const p=d1aP(A,R,10,2), q=d1aP(A,R,2,6); A.objs.push({k:'d1adeco',kind:'bench',x:p.x,y:p.y,id:`${X.SK}_d1a_${id}_bench`},{k:'d1adeco',kind:'cot',x:q.x,y:q.y,id:`${X.SK}_d1a_${id}_cot`}); }
  }
}
FL.d1adeco=(o,t)=>{ const x=o.x, y=o.y;
  switch(o.kind){
    case 'pigeon': { const b=Math.abs(Math.sin(t*3+o.ph))*3; r2put(r2S('d1a_pigeon',30,26,15,18,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(1,5,9,3,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.ellipse(dx,dy,10,7,0,0,TAU); },'#9aa0b0',{r:9}); celFill(g,(q,dx,dy)=>{ q.arc(8+dx,-6+dy,5,0,TAU); },'#8a90a8',{r:5}); g.fillStyle='#6ac0a0'; g.fillRect(4,-3,7,3); g.fillStyle='#e8a050'; g.beginPath(); g.moveTo(13,-6); g.lineTo(17,-5); g.lineTo(13,-4); g.fill(); g.fillStyle='#1a1010'; g.beginPath(); g.arc(9,-7,1.2,0,TAU); g.fill(); }),x,y-b); break; }
    case 'coat': r2put(r2S('d1a_coat',50,70,25,60,g=>{ g.fillStyle='#5a3a20'; g.fillRect(-2,-58,4,8); celFill(g,(q,dx,dy)=>{ q.moveTo(-6+dx,-52+dy); q.lineTo(-18+dx,-6+dy); q.lineTo(18+dx,-6+dy); q.lineTo(6+dx,-52+dy); q.closePath(); },'#4a6a8a',{r:18}); g.fillStyle='#ffd060'; for(let n=0;n<3;n++){ g.beginPath(); g.arc(0,-42+n*12,1.8,0,TAU); g.fill(); } }),x,y); break;
    case 'soldier': r2put(r2S('d1a_soldier',44,70,22,60,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2,4,14,5,0,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.rect(-9+dx,-40+dy,18,40); },'#8a8a96',{r:12}); celFill(g,(q,dx,dy)=>{ q.arc(dx,-48+dy,8,0,TAU); },'#9a9aa6',{r:8}); g.fillStyle='#3a5aa0'; g.fillRect(-10,-58,20,6); g.fillStyle='#f4ecd8'; g.fillRect(-6,-30,12,9); g.fillStyle='#1a1010'; g.fillRect(-4,-50,2,2); g.fillRect(2,-50,2,2); }),x,y); break;
    case 'scrap': r2put(r2S('d1a_scrap'+(o.ph%3),40,30,20,18,g=>{ const r=mulberry32(77+(o.ph%3)); for(let n=0;n<4;n++){ const a=r()*TAU, d=r()*10; celFill(g,(q,dx,dy)=>{ q.arc(Math.cos(a)*d+dx,Math.sin(a)*d*0.6+dy,4+r()*4,0,TAU); },r()<0.5?'#b08848':'#8a8a96',{r:6}); } }),x,y); break;
    case 'bench': r2put(r2S('d1a_bench',110,70,55,50,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-48,4,100,10); celFill(g,(q,dx,dy)=>{ q.rect(-50+dx,-18+dy,100,14); },'#9a6a3a',{r:40}); g.fillStyle='#6a4424'; g.fillRect(-46,-4,6,14); g.fillRect(40,-4,6,14); g.fillStyle='#9a9aa6'; g.fillRect(-30,-26,22,8); g.fillStyle='#c09a58'; g.fillRect(4,-30,8,12); g.strokeStyle='#5a5a62'; g.lineWidth=3; g.beginPath(); g.moveTo(22,-22); g.lineTo(38,-28); g.stroke(); }),x,y); break;
    case 'cot': r2put(r2S('d1a_cot',70,90,35,60,g=>{ g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-26,10,56,10); celFill(g,(q,dx,dy)=>{ q.rect(-26+dx,-50+dy,52,62); },'#7a5230',{r:30}); celFill(g,(q,dx,dy)=>{ q.rect(-22+dx,-46+dy,44,54); },'#c8a878',{r:26}); g.fillStyle='#e8e0cc'; g.fillRect(-18,-44,36,12); g.fillStyle='#8a3a4a'; g.fillRect(-22,-20,44,28); }),x,y); break;
  } };

// ---------- 12. debug hooks (window.__eb.d1a) for the tests in scratchpad/c_d1a
window.__ebX=Object.assign(window.__ebX||{},{d1a:{
  D1A, D1A_G, D1A_W, D1A_T,
  set noGift(v){ D1A.noGift=!!v; }, get noGift(){ return D1A.noGift; },
  state(){ const A=AREA, X=A&&A.d1a; if(!X) return null; const C=X.cis;
    return {area:A.id,room:A.curRoom?A.curRoom.id:null,tide:d1aTide(),turn:X.turn?{to:X.turn.to,t:+X.turn.t.toFixed(2)}:null,cis:C?{phase:C.phase,wl:+C.wl.toFixed(2),held:C.held}:null,flood:X.flood?{lvl:+X.flood.lvl.toFixed(2)}:null,
      floatUp:X.floatUp,dropped:X.dropped,belts:X.brev,gear:X.gear?{state:X.gear.state,jam:X.gear.jam,stun:+X.gear.stun.toFixed(2)}:null,crane:X.crane?{f:+(X.crane.f||0).toFixed(2),landed:X.crane.landed}:null,
      pvalves:X.pvalves.map(o=>o.state),boiler:X.boiler?X.boiler.cool:null,bells:X.bells.map(o=>({kind:o.kind,x:Math.round(o.x),y:Math.round(o.y),room:o.room}))}; },
  // set the tide at once (tests): 0 low, 2 high
  tide(L){ const A=AREA; if(!A||!A.d1a) return null; A.d1a.turn=null; d1aTideSet(A,L); return d1aTide(); },
  ring(kind){ const A=AREA, o=A&&A.d1a&&A.d1a.bells.find(q=>!kind||q.kind===kind); if(!o) return false; o.cd=0; d1aRing(o); return true; },
  bells(){ const A=AREA; return A&&A.d1a?A.d1a.bells.map(o=>({id:o.id,kind:o.kind,x:o.x,y:o.y,room:o.room})):[]; },
  objs(k){ const A=AREA; return A?A.objs.filter(o=>!k||o.k===k).map(o=>({k:o.k,id:o.id,x:Math.round(o.x),y:Math.round(o.y),room:o.room,state:o.state,g:o.g})):[]; },
  lever(id){ const o=AREA.objs.find(q=>q.id===id); if(!o) return false; o.cd=0; d1aLever(o); return true; },
  wheel(id){ const o=AREA.objs.find(q=>q.k==='d1awheel'&&(!id||q.id===id)); if(!o) return false; d1aWheel(o); return true; },
  pvalve(n,want){ const A=AREA, o=A.d1a.pvalves[n]; if(!o) return false; if(want&&o.state===want) return o.state; o.cd=0; d1aPValve(o,'boomerang'); return o.state; },
  gearStun(){ const g=AREA.d1a.gear; if(!g) return false; d1aGearStun(g); return true; },
  crate(fromIsland){ const A=AREA, q=A.d1a.crane; if(!q) return false; const o=q.crate; if(fromIsland){ player.x=q.plate.x; player.y=q.plate.y+48; } o.done=true; G.found[o.id]=true; d1aCrateDrop(o); return true; },
  cover:()=>AREA&&AREA.d1a?[...AREA.d1a.cover]:[], climb:()=>AREA&&AREA.p2?[...AREA.p2.climb]:[],
  covered:k=>dunCovered(k), ht:k=>dunH(k), ground:k=>tGround(k), wet:k=>tWet(k), hole:k=>tHole(k),
  spot:(aid,room,cell)=>d1aSpotIn(aid,room,cell),
  movers(){ const A=AREA, X=A&&A.d1a; if(!X) return []; const out=[]; if(X.crane) out.push({k:'crane',room:X.crane.room,a:X.crane.a,b:X.crane.b}); if(X.wheel2) out.push({k:'wheel',room:X.wheel2.room,cx:X.wheel2.cx,cy:X.wheel2.cy,r:X.wheel2.r}); if(X.trolley) out.push({k:'trolley',room:X.trolley.room,a:X.trolley.a,b:X.trolley.b,to:X.trolley.to,near:X.trolley.near}); return out; },
  sim(sec){ return window.__eb.dunSim(sec); },
  cisPer:()=>D1A_CIS.per(), cisOff:()=>D1A_CIS.off,
  // stand Ash on a room cell of this floor (room-local, interior coordinates); hush() clears the speech toasts
  put(room,ci,cj){ const A=AREA, R=A&&A.rooms[room]; if(!R) return null; const p=d1aP(A,R,ci,cj); player.x=p.x; player.y=p.y; player.z=0; player.vz=0; if(A.tri){ A.tri.lx=p.x; A.tri.ly=p.y; } updateCam(0,true); return {x:p.x,y:p.y,k:d1aK(A,R,ci,cj),h:dunH(d1aK(A,R,ci,cj))}; },
  hush(){ if(G){ G.taunt=null; G.tauntQ=[]; G.banner=null; G.bannerQ=[]; } },
  dlg(){ if(typeof DLG==='undefined'||!DLG||!DLG.lines) return null; try{ const L=lineParts(DLG.lines[DLG.i])||{}; return {who:L.who,text:String(L.text||'').slice(0,90),i:DLG.i,n:DLG.lines.length,opts:DLG.opts?DLG.opts.length:0,all:DLG.lines.map(q=>{ const P=lineParts(q)||{}; return typeof P.text==='string'?P.text.slice(0,90):''; }).filter(Boolean)}; }catch(e){ return {who:'?',text:String(e)}; } },
  // the boss tests (scratchpad/c_d1a/t_boss.py) drive x1_foes' scripted fighter (its own debug object is shadowed by
  // x1_story's __eb.c1 in the merged build, so it is reached from here)
  bossBot(type,o){ if(typeof C1B==='undefined'||typeof c1BotFrame!=='function') return false; o=o||{};
    Object.assign(C1B,{on:true,type,mech:o.mech!==false,heal:o.heal!==false,t:0,hitT:0,heals:0,pullT:0,yankT:0,mirT:0,fireT:0,hamT:0,ev:{},dealt:0,zt:0,tx:null,ty:null,dodges:0}); C1.bot=c1BotFrame; C1.dmg=0; C1.hits=0; C1.bySrc={}; return true; },
  bossStop(){ if(typeof C1B!=='undefined'){ C1B.on=false; C1.bot=null; C1B.tx=null; } },
  bossState(){ const e=G.boss; return {scene,site:G.fightSite,done:Object.assign({},G.bossDone),dmg:typeof C1!=='undefined'?Math.round(C1.dmg||0):0,heals:typeof C1B!=='undefined'?C1B.heals:0,ev:typeof C1B!=='undefined'?Object.assign({},C1B.ev):{},
    boss:e&&!e.dead?{type:e.type,hp:Math.round(e.hp),max:Math.round(e.maxHp),pct:+(e.hp/e.maxHp).toFixed(3),bph:e.bph||0,level:e.level}:null,foes:G.enemies.filter(q=>!q.dead&&q.inArea).map(q=>q.type),
    player:{hp:Math.round(player.hp),max:player.maxHp,level:player.level}}; },
  // the solvability checker (scratchpad/c_d1a/t_dun_a.py) drives the real mechanics through these
  dbg:{p2Targets,p2TgtOK,p2LandSpot,p2XClimbStart,p2Use,d1aCisRing,dunCheck:(k,x,y,air,fly)=>dunCheck(k,x,y,air,fly),areaBlocked:(x,y)=>areaBlocked(x,y),playerBlocked:(x,y)=>playerBlocked(x,y),setMv:m=>{ P2.mv=m; },getMv:()=>P2.mv,trialObjAct,caveObjAct,areaObjHit,solveRoom,refreshCaveGates,killEnemy,trialSwitchOn,
    d1aRing,d1aLever,d1aWheel,d1aPValve,d1aGearStun,d1aCrateDrop,d1aTideSet,grantAbility,hasAbil,dunH,tGround,tWet,tHole,tCell,tPos,caveRoomAt,breakCrack,dunCovered,dChestSealed,
    canClaws,canGrapple,p2Range,D1A_T,d1aTide,d1aP,d1aK,climb:()=>AREA&&AREA.p2?AREA.p2.climb:new Set(),C:()=>AREA&&AREA.p2,pass:v=>{ P2.pass+=v; return P2.pass; }}
}});
// @@END
