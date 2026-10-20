// ================= x2_dun_a: the first two Act III dungeons (bible ACT3.md 7.0, 7.1, 7.2, 9.1, 9.2, 9.6)
//   The Glacier Maze (f_maze): Ember's North Forge, swallowed by the glacier. Slick ice that Ash slides across until
//     something stops him, ice blocks that slide too (and float when pushed into slush, and melt into puddles that stop
//     a slide), frost vents that freeze slush into short-lived ice paths (and grow melted ice back), and MELTWATER: the
//     Ice Dam on the top floor drains down a waterslide and floods the Drip Shaft on the floor below, floating its ice
//     blocks up into stepping stones. Ember's flame in the Cold Forge gives Blaze Breath. Lord Blubberton guards the
//     furnace key; Old Bellows waits in the Great Bellows.
//   Skyreach Temple (f_sky): a tower of white stone and gold over the clouds. Gusts, grapple posts, a kite loft and a
//     wheel-lift platform on the way up; Ember's flame on the balcony gives Wind Riding. Then the ribbons are the floor
//     and WIND VANES pick which ribbon blows: a junction of four arms, a loop of fans with far braziers to Blaze on the
//     ride, a spiral well, the Great Bell's order puzzle. The Twin Squalls keep the Guardian Key; Old Frostfeather nests
//     at the top.
// Everything is a wrapper or a registry entry; nothing in another module is edited. Names start with d2a / D2A, the
// debug key is __ebX.d2a, cell type ids are 230..239. Guide: scratchpad/F2DUN_A.md.

// ---------- 0. ids, numbers and state
const D2A={seen:{},tip:{},sndT:{},noGift:false,gen:0};
const D2A_IDS={f_maze:1,f_sky:1};
function d2aRoot(A){ A=A||AREA; return A&&A.def?dunRoot(A.def.id):null; }
function d2aIn(id){ const r=d2aRoot(); return !!r&&(id?r===id:!!D2A_IDS[r]); }
const d2aDun=def=>!!(def&&D2A_IDS[dunRoot(def.id)]);
const d2aDI=()=>clamp(typeof diffIdx==='number'?diffIdx:1,0,2);
const d2aDiff=(e,n,h)=>[e,n,h][d2aDI()];
const d2aEasy=()=>d2aDI()===0;
function d2aCtl(k){ try{ return balCtls()[k]; }catch(e){ return {use:'E',jump:'C',attack:'J',roll:'Space',fire:'K'}[k]||k; } }
function d2aOnce(key){ const F=G.flags; F.d2a_sn=F.d2a_sn||{}; if(F.d2a_sn[key]) return false; F.d2a_sn[key]=1; return true; }
function d2aSeen(key){ try{ if(typeof f2sSeen==='function'&&f2sSeen(key)) return true; }catch(e){} return !!(G.flags.d2a_sn&&G.flags.d2a_sn['play_'+key]); }
// play a STORY key once (x2_story's scripts mark themselves; the mark here covers a story module that is not there)
function d2aPlay(key,cb){
  const F=G.flags; F.d2a_sn=F.d2a_sn||{}; if(d2aSeen(key)){ if(cb) cb(); return false; }
  F.d2a_sn['play_'+key]=1; const L=STORY[key];
  if(!L||!L.length){ if(cb) cb(); return false; }
  if(typeof f2sPlay==='function') f2sPlay(key,cb); else runDialogue(L,()=>{ scene='play'; if(cb) cb(); saveGame(); });
  return true;
}
// play a key as soon as the game is free (a fight intro or another scene may be on), while Ash is still inside
function d2aSoon(key,cond,tries){ tries=tries==null?30:tries; later(0.5,()=>{ if(!d2aIn()||d2aSeen(key)||(cond&&!cond())) return; if(scene!=='play'||DLG||G.fightIntro){ if(tries>0) d2aSoon(key,cond,tries-1); return; } d2aPlay(key); }); }
function d2aSay(lines,cb){ runDialogue(lines.map(l=>Array.isArray(l)?l:['narr',l]),()=>{ scene='play'; if(cb) cb(); saveGame(); }); }
function d2aTip(id,title,text,n){ const c=D2A.tip[id]||0; if(c>=(n||1)) return; D2A.tip[id]=c+1; try{ mvTip(title,text,6,'d2a_'+id); }catch(e){ setBanner(title,text,3); } }
function d2aFt(x,y,t,col,s,id,gap){ const k='ft_'+(id||t); if(D2A.tip[k]!=null&&G.time-D2A.tip[k]<(gap||2)) return; D2A.tip[k]=G.time; ftext(x,y,t,col||'#e8f6ff',s||13); }

// ---------- 1. new cells (template letters; TY ids 230 to 239, kept clear of other modules)
//   ▫ slick ice: step on it and you slide until something stops you (a wall, a block, plain floor, a puddle)
//   ≋ slush: icy water. Nobody wades it, not even with Water Stride; a frost vent freezes it into slick ice for a while,
//     and an ice block pushed into it floats there for good (a stepping stone)
//   ▓ the Ice Dam's lake: slush until the dam breaks, then a dry lake bed
//   ▥ the Drip Shaft: a deep dry shaft until the meltwater comes down; then deep water (Water Stride), and frost vents
//     freeze its surface
//   ▣ an ice block lying at the bottom of the shaft: once the shaft floods it floats up and is a stepping stone
//   ⇩ the waterslide: an ice-plugged hole until the dam breaks, then a chute down to the Drip Shaft
//   ∽ a puddle (plain floor that stops a slide)
const D2T={slick:230,puddle:231,slush:232,lake:233,shaft:234,floatb:235,chute:236};
Object.assign(TY,{d2aslick:230,d2apud:231,d2aslush:232,d2alake:233,d2ashaft:234,d2afloat:235,d2achute:236});
Object.assign(TY_CH,{'▫':230,'◆':230,'∽':231,'≋':232,'▓':233,'▥':234,'▣':235,'⇩':236});
TY_KEEP['◆']=1; TY_KEEP['⇩']=1;
const d2aMine=t=>t>=230&&t<=239;
Object.assign(PUZZLE_KINDS,{d2arink:1,d2aplate:1}); Object.assign(SEAL_KINDS,{d2arink:1,d2aplate:1});
Object.assign(DOOR_COL,{d2aseal:'200,230,255'});

// ---------- 2. the looks: blue glass ice (f_glacier), a black basalt forge (f_forge), white and gold sky stone (f_sky)
defineDungeonTheme('f_glacier',{style:{floor:'#d6e8f4',floor2:'#cde2f0',top:'#6c9cd0',face:'#2a4a82',edge:'#eef8ff',water:'#2a6ab0',accent:'#bfe8ff'},decor:'icicle',
  pal:{tile:['#d8eaf6','#cfe3f2','#dcedf8','#c8dff0'],grout:'rgba(120,170,220,.35)',moss:'200,230,255',rune:'150,210,255',hole:'#0a1a3a',lip:['#9ccaf0','#2a4a86'],water:'#2a6ab0',root:'#6a8aa8'},music:'f_glacier'});
defineDungeonTheme('f_forge',{style:{floor:'#5a5458',floor2:'#524c50',top:'#3e3436',face:'#1c1416',edge:'#e0a070',water:'#2a5a8a',accent:'#ff9a4a'},decor:'magma',
  pal:{tile:['#5c5658','#545052','#625a5c','#4e4a4c'],grout:'rgba(20,14,14,.5)',moss:'255,150,80',rune:'255,170,90',hole:'#1a1416',lip:['#6a5a58','#1a1214'],water:'#2a5a8a',root:'#6a4a3a'},music:'f_glacier'});
defineDungeonTheme('f_sky',{style:{floor:'#f2ece0',floor2:'#e9e2d4',top:'#ccb487',face:'#8a6a42',edge:'#ffd870',water:'#7ab0e8',accent:'#ffcf5a'},decor:'chime',
  pal:{tile:['#f4eee2','#ebe4d6','#f8f3ea','#e4dccc'],grout:'rgba(190,150,80,.4)',moss:'255,214,120',rune:'255,200,90',hole:'#2a2e48',lip:['#e8dcc0','#b09468'],water:'#7ab0e8',root:'#c8a860'},music:'f_wind'});

// ---------- 3. sounds (synthesized): ice cracking and sliding, the frost vent, the flood, a prayer wheel, a gong
function d2aSnd(kind,v){
  const ac=SFX.ac; if(!ac||SFX.muted||!SFX.noise) return;
  const now=ac.currentTime; if(D2A.sndT[kind]!=null&&now-D2A.sndT[kind]<0.06) return; D2A.sndT[kind]=now;
  try{
    const t0=now, out=ac.createGain(); out.gain.value=0.4*(v==null?1:v); out.connect(ac.destination);
    const nz=(dur,vol,ft,f0,f1,q,dl)=>{ const t=t0+(dl||0), s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=SFX.noise; f.type=ft; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); f.Q.value=q||1; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(out); s.start(t,Math.random()); s.stop(t+dur+0.05); };
    const tn=(type,f0,f1,dur,vol,dl)=>{ const t=t0+(dl||0), o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.01,dur/4)); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); };
    switch(kind){
      case 'slide': nz(0.35,0.08,'highpass',2400,4200,0.6); tn('sine',1400,1100,0.25,0.012); break;
      case 'bump': nz(0.12,0.18,'lowpass',700,120,0.8); tn('triangle',260,140,0.12,0.05); break;
      case 'push': nz(0.3,0.14,'bandpass',300,180,1.2); break;
      case 'glide': nz(0.6,0.07,'highpass',3000,1800,0.6); break;
      case 'plop': nz(0.3,0.25,'lowpass',1600,200,0.7); for(let i=0;i<3;i++) tn('sine',500+i*160,900+i*160,0.07,0.03,0.05+i*0.05); break;
      case 'vwarn': nz(0.8,0.06,'bandpass',900,2400,2); break;
      case 'vent': nz(0.7,0.22,'bandpass',1800,600,0.7); nz(0.5,0.08,'highpass',4000,6000,0.5,0.1); break;
      case 'freeze': for(let i=0;i<5;i++) tn('triangle',2200-i*200,1800-i*160,0.06,0.03,i*0.04); nz(0.25,0.08,'highpass',3500,5000,1); break;
      case 'seal': nz(0.4,0.2,'lowpass',900,200,0.8); tn('sine',180,90,0.3,0.08); break;
      case 'rumble': nz(2.2,0.4,'lowpass',260,40,0.6); tn('sine',60,30,2,0.2); break;
      case 'roar': nz(2.6,0.32,'bandpass',500,180,0.5); nz(2.2,0.18,'lowpass',900,120,0.7,0.3); break;
      case 'ladder': for(let i=0;i<3;i++) tn('square',300-i*40,280-i*40,0.05,0.025,i*0.09); break;
      case 'wheel': for(let i=0;i<6;i++) tn('triangle',520+((i*3)%5)*90,500+((i*3)%5)*90,0.08,0.03,i*0.07); nz(0.6,0.05,'bandpass',600,900,3); break;
      case 'gong': tn('sine',220,214,1.6,0.12); tn('sine',331,328,1.2,0.05); nz(0.3,0.06,'bandpass',900,700,4); break;
      case 'chime': for(let i=0;i<4;i++){ const f=[1568,1976,2349,2637][(i*7)%4]; tn('sine',f,f*0.998,0.9,0.025,i*0.09); } break;
      case 'whoosh': nz(0.5,0.18,'bandpass',300,1400,0.7); break;
    }
  }catch(e){}
}

// ---------- 4. the rooms (15 x 11 cells; DUNGEON.md section 5 letters, the ones above, POWERS2/POWERS3 letters, and marks:
//   ◆ ice block on slick ice   ◇ a block on plain floor (ice, or stone with room blockKind:'stone')   ℗ a plate under slick ice
//   ▲ frost vent (room vents:[{dir,len,per,ph}] in mark order)   Ħ ladder  ⤊ updraft to the floor above  ⤋ downdraft
//   (room portals:[...] in mark order, with the chute ⇩ counted too)   ♣ the frozen mammoth steak   ♜ an ice sculpture
//   ♫ a prayer wheel (room wheels:[{cover,screen}] in mark order)   ⌂ the monk's hat   ▤ the bell mural   ⊛ a plate on plain floor
// The frost layer (POWERS3.md 7) carries i ice walls, F frozen folk, Z far braziers, U updrafts, W bells, Q vanes.
Object.assign(TY_CH,{'℗':230}); TY_KEEP['℗']=1;
const D2A_M={   // the Glacier Maze
  a:['###.........###','##...........##','#..▫▫▫▫▫▫▫▫▫..#','#..▫#▫▫▫▫▫#▫..#','#..▫▫▫▫▫▫▫▫▫...','#..▫▫▫▫▫▫▫▫▫...','#..▫▫▫▫▫▫▫▫▫...','#..▫#▫▫▫▫▫#▫..#','#..▫▫▫▫▫▫▫▫▫..#','##.s.......*.##','###.........###'],
  aF:['...............','...............','...............','...............','...............','.F.............','...............','...............','...............','...............','...............'],
  f:['###############','##.#.#.#.#.#.##','#.............#','#.............#','..............#','.......♣......#','..............#','#.............#','#.*.........*.#','##.#.#.#.#.#.##','###############'],
  b:['##▫▫▫▫...▫▫▫▫##','#▫▫▫▫▫▫▫▫▫▫▫▫▫#','▫▫#▫▫▫▫▫▫▫▫▫#▫▫','▫▫▫▫▫▫#▫▫▫▫▫▫▫▫','...▫▫▫▫▫▫▫▫▫...','...▫▫▫#▫#▫▫▫...','...▫▫▫▫▫▫▫▫▫...','▫▫▫▫▫▫▫▫▫▫▫#▫▫▫','▫▫#▫▫▫▫▫▫▫▫▫▫▫▫','#▫▫▫▫▫▫▫▫▫▫▫#▫#','##▫▫▫▫...▫▫▫▫##'],
  c:['{{{{{#......###','{X{{{#.......##','{{{{{#ww......#','{{{{{wwww.....#','....wwwww......','....www...@....','...............','#.............#','##..*.....*..##','###.........###','####.......####'],
  g:['###############','#♜....#X#....♜#','#▫♜▫▫▫▫▫▫▫▫▫▫▫#','#▫▫▫▫▫▫◆▫▫▫▫▫▫#','#▫▫▫▫▫▫▫▫▫▫▫▫▫#','#▫▫▫▫▫▫▫▫▫▫▫▫▫#','#▫▫▫▫▫▫♜▫▫▫▫▫▫#','#▫▫▫▫▫♜▫▫▫▫▫▫▫#','#▫▫▫▫▫♜▫▫▫▫▫▫▫#','#.............#','######...######'],
  e:['======###...*.#','=>====###.....#','======###..X..#','===@==#.......#','...............','...............','...............','#.............#','##..*.....*..##','###.........###','####.......####'],
  l:['#Ħ.......#▓▓▓▓#','#........▲▓▓▓▓#','#*........▓▓▓▓#','#.........▓▓▓▓#','....⇩.....▓▓▓▓#','..........▓▓▓▓#','..........▓▓▓▓#','#*.......▲▓▓▓▓#','#..≋≋≋≋≋≋#▓▓▓▓#','#▲.≋≋≋.X≋#▓▓▓▓#','#..≋≋≋≋≋≋#▓▓▓▓#'],
  lF:['...............','...............','.........i.....','.........i.....','.........i.....','.........i.....','.........i.....','...............','...............','...............','...............'],
  d:['###############','#X▫▫▫▫▫#▫▫▫▫℗▫#','#▫▫▫▫▫▫▫▫▫▫▫▫##','#▫▫▫◆▫▫▫▫▫▫▫▫▫#','..▫▫▫▫▫▫#▫▫▫▫▫#','..▫▫▫▫▫▫▫▫▫▫▫▫#','..▫▫▫▫▫▫▫▫▫▫▫℗#','#▫▫▫▫▫▫◆▫▫▫▫▫▫#','#▫▫▫▫▫▫▫▫#▫▫▫▫#','#▫S▫▫▫▫▫#▫▫▫▫▫#','###############'],
  h:['#<..##...##...#','#.............#','#..#.......#..#','#.............#','...............','...............','...............','#.............#','#..#.......#..#','#.............#','###############'],
  i:['###############','##...........##','#..*.......*..#','#......D......#','...............','...............','...............','#.............#','#..*.......*..#','##...........##','###############'],
  j:['##.:::.....####','#..:::........#','#..:::........#','#..:::........#','...:::........#','...:::........#','...:::........#','#..:::........#','#..:::........#','##.:::........#','###:::#########'],
  jF:['...............','...............','...............','...............','...............','..........Z....','...............','...............','............F..','...............','...............'],
  k:['#####.....#####','##...........##','#▥▥▥▥▥▥▥▥▥▥▥▥▥#','▲▥▥▥▥▣▥▥▥▥▥▥▥▥#','#▥▥▥▥▥▥▥▥▣▥▥▥▥#','#▥▥▥▥▥▥▥▥▥▥▥▥▥#','#▥▥▥▣▥▥▥▥▥▥▥▥▥▲','#▥▥▥▥▥▥▥▥▥▥▥▥▥#','##.........*.Ħ#','#.............#','#####.....#####'],
  n:['###############','#.#ooooooooo#.#','#.#ooooooooo#.#','#..ooooooooo..#','#..ooooooooo...','#X.ooooooooo...','#..ooooooooo...','#..ooooooooo..#','#.#ooooooooo#.#','#.#ooooooooo#.#','###############'],
  nF:['...............','.............Z.','.......Z.....i.','...............','...............','...............','...............','.......Z.......','.............i.','.............Z.','...............'],
  z:['###############','##...........##','#..*...u...*..#','#.............#','..............#','......X.......#','..............#','#.............#','#..*.......W..#','##...........##','###############']
};
const D2A_S={   // Skyreach Temple
  a:['###.........###','##.*.......*.##','#.............#','#...#.....#...#','#..s...........','#..............','#..............','::::::...::::::',':::::#...::::::','::::::...::::::',':::::#...::::::'],
  e:['###############','##...........##','#.............#','#.............#','..............#','.......⌂......#','..............#','#.............#','#.............#','##...........##','###############'],
  b:['#####..<..#####','#####.....#####','#*...]]]]]...*#','#.............#','...............','...............','...............','#.............#','#..*.......*..#','##X..........##','######...######'],
  c:['###############','#..:::::::::..#','#..:::::::::.@#','#..:::::::::..#','...:::#:::#:...','.@.::@.::@.:...','...:::::::::...','#..:::::::::..#','#X.:::::::::..#','#..:::::::::..#','###############'],
  d:['#{{{{{{{{{{{{{#','#{{{{{{{{◇{{{{#','#{{{{{{{{{{{{{#','#{{{{{{{{{{{{{#','.........⊛....#','..............#','..............#','#.............#','#..X..........#','##.......S...##','###############'],
  f:['###############','#.♫...>...::.X#','#.........::..#','#.........::::#','...............','......♫........','...............','#.............#','#.♫.......♫...#','##...........##','###############'],
  g:['::::::...::::::',':::::::::::::::',':::::::::::::::',':::::.....:::::','::::...........',':::.*.......*..','::::...D.......',':::.........:::','::::.......::::',':::::.....:::::',':::::::::::::::'],
  i:[':::::::::::::::',':..:::...::::::',':..:::...::::::','::::::...::::::',':::::::::::::::',':...:::::::::::',':...:::::::::::',':...:::::::::::',':::::::::::::::',':::::.....:::::',':::::.....:::::'],
  iF:['....W..........','...............','........U......','.W.............','...............','...............','...............','.....W.........','...............','...............','...............'],
  j:['::::::...::::::','::::::...::.:::',':::::::::::::::','...::::::::::::','...:::...:::...','...:::.⤊.:::...','...:::...:::...','...::::::::::::',':::::::::::::::','::::::...::::::','::::::...::::::'],
  jF:['...............','...........Q...','........W......','...............','...........W...','...............','...............','...............','......W........','...............','...............'],
  h:['...............','...............','..##########.##','..#::::::::::::','..#::::::::::::','..#:::####:::::','..#:::####:::::','..#:::##.#:::::','..#::::#:#:♫:::','..#::::::::::::','..#::::::::::::'],
  hF:['...............','...............','...............','...............','.......Z.......','...............','.....Z....Z....','........Z......','...............','...............','...............'],
  m:[':::::::::::::::','::::::::::..#::',':::::::::::::::','....:::::::::::','....:::::::::::','....:::::::::::','....:::::::::::','....:::::::::::',':::::.....:::::',':::::.....:::::',':::::..⤋..:::::'],
  l:['###.......▤...#','###...........#',':::::::::::...#',':...:::::::....',':...::::.::....',':::::::::::....',':::::::::::....',':::::::::::....',':...:::::::::::',':...::...::::::','::::::...::::::'],
  lF:['...............','...............','...............','.W..............'.slice(0,15),'........Q......','...............','...............','...............','...............','.W..............'.slice(0,15),'........W......'],
  z:['###############','#.*.........*.#','#......u......#','#.............#','..............#','......X.......#','..............#','#.............#','#.....W.......#','##.*.......*.##','###############']
};
// the Gale Gallery with the Guardian Key chest on the middle platform
const D2A_GALE=(typeof F2_TPL!=='undefined'&&F2_TPL.gale?F2_TPL.gale:Array.from({length:11},()=>'.'.repeat(15))).map((r,j)=>j===5?r.slice(0,7)+'X'+r.slice(8):r);
const d2aF2=(t,o)=>Object.assign({},typeof F2_ROOM!=='undefined'&&F2_ROOM[t]?F2_ROOM[t]:{kind:t==='f_blubberton'||t==='f_squall'?'miniboss':'boss',span:t==='f_blubberton'||t==='f_squall'?[1,1]:[2,2],boss:[t==='f_squall'?'gust':'knight',t]},o||{});
// Hjalmar and Sigrid (their looks come from x2_people's CAST when it is there)
const d2aLook=(id,def)=>(typeof CASTBY!=='undefined'&&CASTBY[id]&&CASTBY[id].look)||def;
const D2A_HJ={skin:'#e8bc98',hair:'#c89a5a',hairdo:'short',outfit:'coat',shirt:'#5a7aa8',low:'#3a3a4a',hat:'beanie',hatc:'#c84a3a',beard:true,beardc:'#c89a5a'};
const D2A_SG={skin:'#e0ae88',hair:'#e8c060',hairdo:'braids',outfit:'coat',shirt:'#3a6aa8',low:'#3a3a4a',hat:'beanie',hatc:'#e8c03a',bag:'#7a5a32',freckles:true,build:'slim'};
function d2aStory(id){ try{ if(typeof f2sDunStory==='function') return f2sDunStory(id); }catch(e){} return {}; }

// ---------- 5. the two dungeons
defineDungeon('f_maze',{name:S('The Glacier Maze','The Glacier Maze'),level:14,theme:'f_glacier',seed:3101,save:'f_maze',dark:0.28,
  abil:'blaze',abilName:S('Blaze Breath','Blaze Breath'),dunKind:S('An ice forge','An ice forge'),music:'f_glacier',story:d2aStory('f_maze'),
  floors:[
    {id:'1',name:S('The Ice Halls','The Ice Halls'),map:{rooms:{
      a:{at:[1,2],kind:'start',tpl:D2A_M.a,frost:D2A_M.aF,noPots:true,
         frozen:{'1,5':{id:'f_hjalmar',flag:'f_thaw_hjalmar',name:S('Hjalmar the explorer','Hjalmar'),look:d2aLook('f_hjalmar',D2A_HJ),coins:40,leave:true,face:0.3}},
         sign:S('THE GLACIER MAZE. Mind your feet on the ice, and mind your tail in the doors.','THE GLACIER MAZE. Mind your feet!')},
      f:{at:[2,2],kind:'secret',tpl:D2A_M.f,noDecor:true,props:[['jar',2,1],['jar',4,1],['jar',8,1],['jar',12,1],['jar',4,9],['jar',10,9],['sack',2,3],['sack',12,7]]},
      b:{at:[1,1],kind:'fight',tpl:D2A_M.b,foes:[['f_rimehound',2],['f_snowgob',2]],noPots:true,noDecor:true},
      c:{at:[0,1],kind:'free',tpl:D2A_M.c,foes:[['f_stalagbat',3]],loot:['skey'],noPots:true},
      g:{at:[0,0],kind:'treasure',tpl:D2A_M.g,loot:['treasure'],iceChests:true,diary:true,noPots:true,noDecor:true,
         sculpt:['cake','granny','twins','reader','sleeper','flame']},
      e:{at:[1,0],kind:'fight',tpl:D2A_M.e,foes:[['f_snowgob',3],['f_rimehound',1]],loot:['compass'],solveOnClear:true,sealChest:true,noPots:true,
         sealText:S('The chest is frozen to the floor while the snowballs roll. Win the fight first.','Win the fight first.')},
      l:{at:[2,0],kind:'melt',tpl:D2A_M.l,frost:D2A_M.lF,loot:['treasure'],noSeal:true,hat:'f_hat_frosty',noPots:true,noDecor:true,
         vents:[{dir:'s',len:2,per:4,ph:0},{dir:'n',len:2,per:4,ph:2},{dir:'e',len:4,per:6,ph:1,frz:4}],
         portals:[{look:'ladder',to:'f_maze_b1',room:'k',cell:[12,9]},{look:'chute',to:'f_maze_b1',room:'k',cell:[7,9],need:'flood'}]},
      d:{at:[2,1],kind:'d2arink',tpl:D2A_M.d,loot:['dmap'],noPots:true,noDecor:true,
         sign:null,sealText:S('The map chest is held shut by a frost seal. Slide both ice blocks onto the frozen plates. The rune stone puts the blocks back.','Slide both ice blocks onto the plates.')}},
      links:[['a','b','open'],['a','f','crack'],['b','c','open'],['b','d','open'],['b','e','lock'],['c','g','ice'],['e','l','ice']]}},
    {id:'b1',name:S('The Cold Forge','The Cold Forge'),map:{rooms:{
      h:{at:[1,2],kind:'fight',tpl:D2A_M.h,foes:[['f_rimeknight',2],['f_snowgob',2]],noPots:true,noDecor:true,props:[['anvil',7,5],['chain',3,4],['chain',11,4],['channel',7,8]]},
      i:{at:[2,2],kind:'shrine',tpl:D2A_M.i,noPots:true},
      j:{at:[3,2],kind:'braziers',tpl:D2A_M.j,frost:D2A_M.jF,noPots:true,noDecor:true,bridge:[[3,5],[4,5],[5,5]],bridgeText:S('An old ice bridge creaks out across the crevasse!','A bridge!'),
         frozen:{'12,8':{id:'f_sigrid',flag:'f_thaw_sigrid',name:S('Sigrid the explorer','Sigrid'),look:d2aLook('f_sigrid',D2A_SG),leave:true,face:Math.PI}},
         sign:null},
      k:{at:[3,1],kind:'free',tpl:D2A_M.k,noPots:true,noDecor:true,
         vents:[{dir:'e',len:14,per:5,ph:0,frz:3.2},{dir:'w',len:14,per:5,ph:2.5,frz:3.2}],
         portals:[{look:'ladder',to:'f_maze',room:'l',cell:[1,1]}]},
      m:d2aF2('f_blubberton',{at:[3,0],reward:'key'}),
      n:{at:[0,2],kind:'braziers',tpl:D2A_M.n,frost:D2A_M.nF,loot:['bkey'],noPots:true,noDecor:true,brazT:[14,10,8],sealChest:true,
         bridge:[[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5]],bridgeText:S('The forge roars! A bridge of hot iron slides across.','A bridge slides out!'),
         sealText:S('The great chest sits on the old forge, cold as a stone. The forge has to be warm before it lets go. Light all four braziers, quickly!','Light all four braziers fast!')},
      B:d2aF2('f_bellows',{at:[0,0]}),
      z:{at:[2,0],kind:'reward',tpl:D2A_M.z,loot:['heart'],noPots:true}},
      links:[['h','i','open'],['i','j','ice'],['j','k','lock'],['k','m','open'],['h','n','lock'],['h','B','boss',{at:1}],['B','z','gate:B']]}}
  ]});
defineDungeon('f_sky',{name:S('Skyreach Temple','Skyreach Temple'),level:15,theme:'f_sky',seed:3102,save:'f_sky',dark:0.1,
  abil:'windride',abilName:S('Wind Riding','Wind Riding'),dunKind:S('A sky temple','A sky temple'),music:'f_wind',story:d2aStory('f_sky'),
  floors:[
    {id:'1',name:S('The Cloud Gate','The Cloud Gate'),map:{rooms:{
      a:{at:[1,1],kind:'start',tpl:D2A_S.a,noPots:true,gust:{dir:[1,0],on:1.4,off:4.6,str:230,ph:3},flags:true,
         sign:S('SKYREACH. Leave your hat at the door. The wind will take it anyway.','SKYREACH. The wind takes hats.')},
      e:{at:[2,1],kind:'secret',tpl:D2A_S.e,loot:['coins'],noDecor:true,props:[['hats',3,2],['hats',11,2],['hats',3,8],['hats',11,8],['hats',7,8]]},
      b:{at:[1,0],kind:'fight',tpl:D2A_S.b,foes:[['gust',2],['f_mothling',3]],loot:['compass'],solveOnClear:true,sealChest:true,noPots:true,up:'f_sky_2',chimes:true,
         sealText:S('The chest is wrapped in humming wind. Calm the hall first.','Win the fight first.')},
      c:{at:[0,0],kind:'free',tpl:D2A_S.c,loot:['skey'],noPots:true,noDecor:true,gust:{dir:[0,1],on:1.2,off:3.8,str:240,ph:1}},
      d:{at:[2,0],kind:'d2aplate',tpl:D2A_S.d,loot:['dmap'],foes:[['f_stalagbat',2]],blockKind:'stone',noPots:true,noDecor:true,kites:true,
         sealText:S('The map chest sits in a cage of bamboo and rope. A plate in the floor works the cage. Something heavy would do it.','Put something heavy on the plate.')}},
      links:[['a','b','open'],['a','e','crack'],['b','c','open'],['b','d','open']]}},
    {id:'2',name:S('The Prayer Halls','The Prayer Halls'),map:{rooms:{
      f:{at:[1,1],kind:'fight',tpl:D2A_S.f,foes:[['f_rimeknight',2],['f_mothling',2],['f_stalagbat',2]],loot:['treasure'],noPots:true,noDecor:true,down:'f_sky',
         wheels:[{cover:[[10,2],[11,2]]},{},{},{}]},
      g:{at:[0,1],kind:'shrine',tpl:D2A_S.g,noPots:true,flags:true,ribbons:[{id:'sky_g',pts:[[7,3],[7,0],[7,-3]],both:true}]},
      i:{at:[0,0],kind:'free',tpl:D2A_S.i,frost:D2A_S.iF,noPots:true,noDecor:true,
         ribbons:[{id:'sky_i1',pts:[[6,9],[4,8],[2,7]],both:true},{id:'sky_i2',pts:[[2,5],[2,3]],both:true},{id:'sky_i3',pts:[[2,1],[4,1],[5,1]],both:true},
                  {id:'sky_i4',pts:[[10,2],[12,3],[13,5],[17,5]],both:true}],
         bells:{'4,0':{name:'lesson3',h:56},'1,3':{name:'lesson2',h:56},'5,7':{name:'lesson1',h:56}}},
      j:{at:[1,0],kind:'bells',timed:40,tpl:D2A_S.j,frost:D2A_S.jF,noPots:true,noDecor:true,windOnly:true,
         ribbons:[{id:'sky_jin',pts:[[2,4],[5,4]],both:true},
                  {id:'sky_jn',pts:[[7,4],[7,2]],vane:'jv',dir:'n'},{id:'sky_je',pts:[[8,5],[11,5]],vane:'jv',dir:'e'},{id:'sky_js',pts:[[7,6],[7,8]],vane:'jv',dir:'s'},{id:'sky_jw',pts:[[6,5],[3,5]],vane:'jv',dir:'w'},
                  {id:'sky_jrn',pts:[[6,1],[6,3]]},{id:'sky_jre',pts:[[12,6],[9,6]]},{id:'sky_jrs',pts:[[8,9],[8,7]]}],
         vanes:{'11,1':{id:'jv',dir:'w'}},bells:{'8,2':{name:'north'},'11,4':{name:'east'},'6,8':{name:'south'}},
         portals:[{look:'updraft',to:'f_sky_3',room:'m',cell:[7,8],need:'solved'}]},
      h:{at:[2,1],kind:'braziers',tpl:D2A_S.h,frost:D2A_S.hF,noPots:true,noDecor:true,flags:true,
         ribbons:[{id:'sky_hloop',pts:[[12,2],[13,4],[12,8],[10,9],[6,9],[4,8],[3,5],[4,3],[8,3],[11,3]]}],
         wheels:[{screen:[[8,8]],small:true}]},
      k:d2aF2('f_squall',{at:[2,0],loot:['bkey'],sealChest:true,tpl:D2A_GALE,
         sealText:S('The great chest is held shut by two little whirlwinds. They giggle.','Beat the Twin Squalls first.')})},
      links:[['f','g','lock'],['f','h','open'],['g','i','open'],['i','j','open'],['h','k','gate:h']]}},
    {id:'3',name:S('The Roost','The Roost'),map:{rooms:{
      m:{at:[1,2],kind:'free',tpl:D2A_S.m,foes:[['f_mothling',3],['gust',2]],noPots:true,noDecor:true,
         ribbons:[{id:'sky_m1',pts:[[9,9],[12,8],[13,5],[12,2],[11,1]],both:true},{id:'sky_m2',pts:[[10,1],[7,1],[5,2],[3,4]],both:true}],
         portals:[{look:'down',to:'f_sky_2',room:'j',cell:[7,4]}]},
      l:{at:[0,2],kind:'bells',tpl:D2A_S.l,frost:D2A_S.lF,noPots:true,noDecor:true,windOnly:true,wind:true,order:['small','big','medium'],
         ribbons:[{id:'sky_la',pts:[[11,6],[7,6],[3,7],[1,8]]},{id:'sky_lb',pts:[[3,9],[5,10],[8,9]]},{id:'sky_lc',pts:[[3,8],[2,6],[1,4]],vane:'lv',dir:'n'},
                  {id:'sky_ld',pts:[[3,4],[5,6],[8,9]]},{id:'sky_le',pts:[[6,9],[9,7],[12,6]]}],
         vanes:{'8,4':{id:'lv',dir:'s'}},bells:{'1,3':{name:'big',h:104},'1,9':{name:'small',h:58},'8,10':{name:'medium',h:80}}},
      B:d2aF2('f_frostfeather',{at:[0,0]}),
      z:{at:[2,0],kind:'reward',tpl:D2A_S.z,loot:['heart'],noPots:true}},
      links:[['m','l','open'],['l','B','boss',{at:0}],['B','z','gate:B']]}}
  ]});
for(const [id,shorts] of [['f_maze',['1F','B1']],['f_sky',['1F','2F','3F']]]) DUNGEONS[id].floorIds.forEach((aid,i)=>{ if(AREADEFS[aid]) AREADEFS[aid].floorShort=shorts[i]; });
// the Cold Forge is black basalt and a dead forge, not glacier ice
if(AREADEFS.f_maze_b1) AREADEFS.f_maze_b1.theme='f_forge';
DUNGEONS.f_maze.giftOK=Object.assign({},DUNGEONS.f_maze.giftOK||{}); DUNGEONS.f_sky.giftOK=Object.assign({},DUNGEONS.f_sky.giftOK||{});

// ---------- 6. building: my marks, my cells, the flood, foes put on good ground
const D2AF='d2a_maze_flood';
const d2aFlood=()=>!!(G&&G.found&&G.found[D2AF]);
const d2aK=(A,R,c,r)=>(R.oy+1+r)*A.cave.w+(R.ox+1+c);
const d2aRP=(A,R,c,r)=>{ const cs=A.cave.cell; return {x:A.x0+(R.ox+1+c+0.5)*cs,y:A.y0+(R.oy+1+r+0.5)*cs}; };
const d2aSolvedKey=(def,id)=>'cv_'+caveSid(def)+'_'+id+'_solved';
// the floor of a bridge that a solved room lowers (Maze j and n) is plain floor from then on
{ const base=genCaveRooms; genCaveRooms=function(def){
    const c=base.apply(this,arguments); if(!d2aDun(def)) return c; const w=c.w;
    for(const id in c.rooms){ const R=c.rooms[id];
      if(R.brazT) R.timed=d2aDiff(R.brazT[0],R.brazT[1],R.brazT[2]);
      if(R.f2boss==='f_bellows'){ R.f2cold=!G.found[d2aSolvedKey(def,'n')]; }
      if(R.bridge&&G.found[d2aSolvedKey(def,id)]) for(const [bc,br] of R.bridge){ const k=(R.oy+1+br)*w+R.ox+1+bc; c.typ[k]=0; c.grid[k]=0; }
    }
    return c; }; }
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ base.apply(this,arguments); if(d2aDun(def)&&A.cave) try{ d2aBuild(A,def); }catch(e){ console.error(e); } }; }
function d2aBuild(A,def){
  const c=A.cave, cs=c.cell, SK=caveSid(def), DK=caveDsid(def), root=dunRoot(def.id);
  const X=A.d2a={def,root,SK,DK,blocks:[],vents:[],frz:new Map(),pud:new Set(),solid:new Set(),cover:new Set(),wheels:[],portals:[],plates:[],props:[],sculpt:[],t:0,grace:0,go:null,fx:[]};
  const byRoom={}; for(const m of c.marks) (byRoom[m.room]=byRoom[m.room]||[]).push(m);
  for(const id in c.rooms){ const R=c.rooms[id], ms=byRoom[id]||[]; let nv=0, np=0, nw=0, ns=0, nb=0;
    const P=(i,j)=>({x:A.x0+(i+0.5)*cs,y:A.y0+(j+0.5)*cs});
    for(const m of ms){ const p=P(m.i,m.j), k=m.j*c.w+m.i, id2=`d2a_${SK}_${id}_${m.c}_${m.r}`;
      switch(m.ch){
        case '◆': case '◇': { const kind=m.ch==='◆'?'ice':(R.blockKind||'ice'); const b={id:id2,room:id,ci:m.i,cj:m.j,si:m.i,sj:m.j,kind,x:p.x,y:p.y,fx:p.x,fy:p.y,anim:0,mv:null,push:0,gone:false,n:nb++,z:0,vz:0};
          X.blocks.push(b); b.vis={k:'tv',kind:'d2ablock',ref:b,x:p.x,y:p.y,id:id2+'_v'}; A.objs.push(b.vis); break; }
        case '℗': case '⊛': { const o={k:'d2aplt',id:id2,room:id,ci:m.i,cj:m.j,x:p.x,y:p.y,pressed:false,ice:m.ch==='℗'}; X.plates.push(o); break; }
        case '▲': { const v=(R.vents||[])[nv++]||{dir:'s',len:2,per:5}; const d=DIRS[DIRN[v.dir]||0], o={id:id2,room:id,ci:m.i,cj:m.j,k,x:p.x,y:p.y,dx:d[0],dy:d[1],len:v.len||2,per:v.per||5,ph:v.ph||0,frz:v.frz||3,cells:[],t:0,seal:0,heat:0,blow:0,warn:false};
          for(let s=1;s<=o.len;s++){ const q=k+(d[0]+d[1]*c.w)*s; if(c.grid[q]===1&&c.typ[q]!==1) break; o.cells.push(q); }
          X.vents.push(o); X.solid.add(k); A.objs.push({k:'tv',kind:'d2avent',ref:o,x:p.x,y:p.y,id:id2+'_v'}); A.lights.push({x:p.x,y:p.y,r:120,i:0.3,tint:'crystal'}); break; }
        case 'Ħ': case '⤊': case '⤋': case '⇩': { const v=(R.portals||[])[np++]; if(!v) break; const o={id:id2,room:id,ci:m.i,cj:m.j,k,x:p.x,y:p.y,look:v.look,to:v.to,toRoom:v.room,cell:v.cell,need:v.need||null,t:0};
          X.portals.push(o); if(o.look==='ladder'){ A.objs.push({k:'tv',kind:'d2aladder',ref:o,x:p.x,y:p.y-cs*0.45,id:id2+'_v'}); }
          if(o.look==='updraft'||o.look==='down') A.lights.push({x:p.x,y:p.y,r:150,i:0.4}); break; }
        case '♣': { const o=tObj(A,'d2a_steak',p.x,p.y,id2,{room:id,r:30,heat:0}); o.prompt=()=>G.found[id2]?null:G.found[id2+'_ice']?S('Pick up the mammoth steak','Pick up the steak'):S('Look at the frozen steak','Look at the steak'); if(!G.found[id2]) X.solid.add(k); break; }
        case '♜': { const nm=(R.sculpt||[])[ns++]||'cake'; const o={id:id2,room:id,ci:m.i,cj:m.j,k,x:p.x,y:p.y,name:nm}; X.sculpt.push(o); X.solid.add(k); A.objs.push({k:'tv',kind:'d2asculpt',ref:o,x:p.x,y:p.y+4,id:id2+'_v'}); break; }
        case '♫': { const v=(R.wheels||[])[nw++]||{}; const o=tObj(A,'d2a_wheel',p.x,p.y,id2,{room:id,r:28,spin:0,rot:0,cd:0,cover:(v.cover||[]).map(q=>d2aK(A,R,q[0],q[1])),scr:(v.screen||[]).map(q=>d2aK(A,R,q[0],q[1])),small:!!v.small});
          o.prompt=()=>o.spin>0?null:S('Spin the prayer wheel','Spin the wheel'); X.wheels.push(o); X.solid.add(k); break; }
        case '⌂': { if(G.found[id2]) break; const o=tObj(A,'d2a_hat',p.x,p.y,id2,{room:id,r:30}); o.prompt=()=>G.found[id2]?null:S('Pick up the little monk hat','Pick up the hat'); break; }
        case '▤': { const o=tObj(A,'d2a_mural',p.x,p.y-cs*0.3,id2,{room:id,r:34}); o.prompt=()=>S('Read the mural','Read the picture'); break; }
      }
    }
    // screens the wheels open: little wooden shutters across a cell (shut unless the wheel spins)
    for(const o of X.wheels) if(o.room===id) for(const q of o.scr){ const qi=q%c.w, qj=(q-qi)/c.w, p=P(qi,qj); const g={k:'cgate',type:'d2ascreen',d2a:true,x:p.x,y:p.y,id:o.id+'_scr'+q,room:id,cells:[q],closed:true,opened:false,tmp:false,r:20,wheel:o};
      A.gates.push(g); c.dyn[q]=A.gates.length; A.objs.push({k:'tv',kind:'d2ascreen',ref:g,x:p.x,y:p.y+6,id:g.id+'_v'}); }
    // decorations
    for(const pr of R.props||[]){ const p=P(R.ox+1+pr[1],R.oy+1+pr[2]); const o={k:'tv',kind:'d2aprop',ref:{t:pr[0],x:p.x,y:p.y,n:X.props.length,room:id},x:p.x,y:p.y,id:`d2ap_${SK}_${id}_${X.props.length}`}; X.props.push(o.ref); A.objs.push(o);
      if(pr[0]==='anvil'||pr[0]==='sack'||pr[0]==='jar') addAreaCol({t:'c',x:p.x,y:p.y,r:pr[0]==='anvil'?18:12}); }
  }
  // blocks on the plates of a room solved on an earlier visit
  for(const id in c.rooms){ const R=c.rooms[id]; if(!R.solved||!(R.kind==='d2arink'||R.kind==='d2aplate')) continue;
    const bl=X.blocks.filter(b=>b.room===id), pl=X.plates.filter(o=>o.room===id); bl.forEach((b,i)=>{ const o=pl[i]; if(!o) return; b.ci=o.ci; b.cj=o.cj; d2aBlockSnap(A,b); o.pressed=true; }); }
  // foes: the stock spawner only uses plain floor; in these rooms put each one on a cell it can stand on
  const rng=mulberry32((def.seed|0)*13+7);
  for(const id in c.rooms){ const R=c.rooms[id]; if(!R.enemies||!R.enemies.length||R.f2boss) continue;
    const cells=[]; for(let j=R.oy+2;j<R.oy+R.ih;j++) for(let i=R.ox+2;i<R.ox+R.iw;i++){ const k=j*c.w+i; if(tGround(k)&&!caveBlockedAt(k)&&!tHole(k)&&dunH(k)===0){ const q=tPos(k); if(!colAt(q.x,q.y,14)) cells.push(q); } }
    if(!cells.length) continue;
    for(const e of R.enemies){ if(e.dead||e.flying) continue; const k=tCell(e.x,e.y); if(tGround(k)&&!caveBlockedAt(k)&&dunH(k)===0) continue; const q=cells[Math.floor(rng()*cells.length)]; e.x=e.homeX=q.x; e.y=e.homeY=q.y; e._tx=null; } }
  d2aRefreshScreens(A); refreshCaveGates();
  if(root==='f_maze'&&d2aFlood()) d2aFloodLook(A);
}
// the cells of my types, read through the game's own cell tests
function d2aWallCell(k,t){ const X=AREA&&AREA.d2a, fl=d2aFlood(), fz=!!(X&&X.frz.has(k));
  if(t===D2T.slush) return !fz;
  if(t===D2T.lake||t===D2T.floatb) return !fl;
  if(t===D2T.shaft) return !fl;
  return false; }
{ const base=dunGround; dunGround=function(k,t,T){
    const X=AREA&&AREA.d2a;
    if(X&&X.cover.has(k)) return true;
    if(t>=230&&t<=239){ const fl=d2aFlood(), fz=!!(X&&X.frz.has(k));
      switch(t){ case D2T.slick: case D2T.puddle: case D2T.chute: return true;
        case D2T.slush: return fz;
        case D2T.lake: case D2T.floatb: return fl;
        case D2T.shaft: return fl&&fz; }
      return false; }
    return base.apply(this,arguments); }; }
{ const base=dunWet; dunWet=function(k,t,T){ if(t===D2T.shaft){ const X=AREA&&AREA.d2a; return d2aFlood()&&!(X&&X.frz.has(k)); } return base.apply(this,arguments); }; }
{ const base=dunCovered; dunCovered=function(k){ if(base(k)) return true; const X=AREA&&AREA.d2a; return !!(X&&X.cover.has(k)); }; }
{ const base=dunCheck; dunCheck=function(k,x,y,air,fly){
    const A=AREA; if(A&&A.d2a){
      if(typeof P3!=='undefined'&&(P3.ride||P3.mv)) return null;          // a ride, a hop or its landing
      if(!fly&&!(typeof P2!=='undefined'&&P2.mv)){ const t=A.cave.typ[k]; if(t>=230&&t<=239&&d2aWallCell(k,t)){
          // (v12 ICE) slush and the dam's lake: never waded, but a jump passes over them, and one that comes down in
          // them is a cold splash back to where he last stood still
          if(t===D2T.slush||t===D2T.lake){ const p=player, z=p.z||0;
            if(air||(z>0&&(p.vz||0)>0)) return null;
            if(tCell(p.x,p.y)===k&&(z>0||(A.tri&&A.tri.wasAir))){ d2aSlushFall(A,p); return null; } }
          return 'wall'; } } }
    return base.apply(this,arguments); }; }
{ const base=caveBlockedAt; caveBlockedAt=function(k){
    if(base(k)) return true; const A=AREA, X=A&&A.d2a; if(!X) return false;
    if(X.solid.has(k)) return true;
    const w=A.cave.w; for(const b of X.blocks) if(!b.gone&&b.cj*w+b.ci===k) return true;
    return false; }; }
// shutters a prayer wheel opens: shut unless their wheel is spinning (and never shut on Ash)
function d2aRefreshScreens(A){ for(const g of A.gates){ if(g.type!=='d2ascreen') continue; let cl=!(g.wheel&&g.wheel.spin>0); if(cl&&!g.closed&&gateOnAsh(g)) cl=false; g.closed=cl; } }
{ const base=refreshCaveGates; refreshCaveGates=function(){ base.apply(this,arguments); const A=AREA; if(A&&A.d2a) d2aRefreshScreens(A); }; }
// a room solved: the bridges it lowers, and the dam
{ const base=solveRoom; solveRoom=function(R,quiet){
    const A=AREA, was=R&&R.solved; base.apply(this,arguments);
    if(!A||!A.d2a||was||!R||!R.solved) return;
    try{ d2aOnSolve(A,R); }catch(e){ console.error(e); } }; }
function d2aOnSolve(A,R){
  const c=A.cave, X=A.d2a;
  if(R.bridge){ for(const [bc,br] of R.bridge){ const k=d2aK(A,R,bc,br); c.typ[k]=0; c.grid[k]=0; } renderCaveRooms(A,A.def); SFX.play('boom'); shake(5);
    const a=d2aRP(A,R,R.bridge[0][0],R.bridge[0][1]), b=d2aRP(A,R,R.bridge[R.bridge.length-1][0],R.bridge[R.bridge.length-1][1]);
    for(let i=0;i<14;i++){ const f=i/13; emit(lerp(a.x,b.x,f),lerp(a.y,b.y,f),3,{col:X.root==='f_maze'?'230,170,120':'255,230,170',smin:20,smax:90,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); }
    later(0.3,()=>setBanner(R.bridgeText||S('A bridge slides out!','A bridge!'),'',2)); }
  if(R.id==='l'&&X.root==='f_maze') d2aDamBreak(A,R);
  if(R.wind) later(0.4,()=>{ if(AREA===A) setBanner(S('The wind seal lifts','The wind seal is gone'),S('The great door to the Roost is free of its whirlwind.','The great door is free!'),2.6); });
}

// ---------- 7. slick ice: Ash slides until something stops him; ice blocks slide too, stone blocks only budge
// The rule (the same in the checker, scratchpad/e_d2a): a push on slick ice sets Ash off in that direction (the stronger
// axis of the stick); he goes cell by cell while the next cell takes him, and stops at the centre of the last one, or
// on the first cell that is not slick (plain floor, a doorway, a puddle). Walls, shut doors, blocks, statues, chests,
// slush, holes and a step up or down all stop him. While he slides the stick does nothing; fire breath still works.
// Standing on the ice he cannot roll or dash (his feet go everywhere); holding fire breath lets him turn on the spot to
// aim. Blocks follow the same rule, but only inside their own room.
// (v12 ICE, the same rules as Icefang's ice in e9b_caves2.js) JUMP while he slides is a low quick hop along with the
// slide (D2AN.hop cells at the slide's speed); in the air the slide keeps its rules (floor and puddles still stop him,
// more ice keeps him going) and only slush or the dam's lake pass under him. A jump from a standstill goes straight up
// (no grip), unless the stick pushes him off along the ice or at one tile of slush. Slush and the lake are never waded,
// but a jump passes over them; landing in one is a cold splash back to where he last stood still. A jump that lands on
// the ice with speed sets him sliding the way he flew.
const D2AN={slide:330,bslide:360,push:0.25,melt:1.0,seal:[20,15,12],vwarn:0.8,vblow:0.5,thawK:1,hop:2.2};
function d2aSlick(A,k){ const X=A.d2a, c=A.cave; if(k<0||!X) return false; if(X.pud.has(k)) return false; const t=c.typ[k]; if(t===D2T.slick) return true; if(X.frz.has(k)&&(t===D2T.slush||t===D2T.shaft)) return true; return false; }
function d2aAshOn(A,k){ const p=player, q=tPos(k), cs=A.cave.cell; return Math.abs(p.x-q.x)<cs*0.5+p.r*0.8&&Math.abs(p.y-q.y)<cs*0.5+p.r*0.8; }
// can Ash (who='ash') or a block (who=the block) move from cell k into cell n?
function d2aEnter(A,k,n,who){
  const c=A.cave, w=c.w; if(n<0||n>=c.typ.length) return false;
  if(Math.abs((n%w)-(k%w))>1) return false;
  if(c.grid[n]!==0) return false;
  if(caveBlockedAt(n)) return false;
  if(!tGround(n)||tHole(n)) return false;
  const hk=Math.max(0,dunH(k)), hn=Math.max(0,dunH(n));
  if(who&&who.kind==='stone'){ if(hn>hk) return false; }
  else if(hn!==hk) return false;
  const q=tPos(n); if(colAt(q.x,q.y,12)) return false;
  if(who&&who!=='ash'){ const R=A.rooms[who.room], i=n%w, j=(n-i)/w; if(!R||!(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih)) return false;
    if(d2aAshOn(A,n)) return false;
    for(const e of G.enemies) if(!e.dead&&e.inArea&&!e.flying&&tCell(e.x,e.y)===n) return false; }
  return true;
}
function d2aBlockSnap(A,b){ const cs=A.cave.cell; b.x=A.x0+(b.ci+0.5)*cs; b.y=A.y0+(b.cj+0.5)*cs; b.fx=b.x; b.fy=b.y; if(b.vis){ b.vis.x=b.x; b.vis.y=b.y; } }
// every frame on Ash (wraps updatePlayer)
{ const base=updatePlayer; updatePlayer=function(dt,inp){
    const p=player, A=AREA;
    if(!p||!G||!A||!A.d2a) return base(dt,inp);
    try{ return d2aPlayer(A,p,dt,inp,base); }catch(e){ console.error(e); A.d2a.sl=null; return base(dt,inp); } }; }
function d2aBusy(p){ return (typeof P3!=='undefined'&&(P3.ride||P3.mv))||(typeof P2!=='undefined'&&(P2.mv||P2.dash))||p.flying||airborne()||p.dead; }
const d2aUp=p=>(p.z||0)>0||(p.vz||0)>0;
function d2aPlayer(A,p,dt,inp,base){
  const X=A.d2a, c=A.cave, cs=c.cell, w=c.w;
  if(X.dbgIn) inp=Object.assign({},inp,X.dbgIn);
  const up=d2aUp(p), avx=p.avx||0, avy=p.avy||0;
  const free=!p.flying&&!p.dead&&scene==='play'&&!(typeof P3!=='undefined'&&(P3.ride||P3.mv))&&!(typeof P2!=='undefined'&&(P2.mv||P2.dash));
  // (v12 ICE) a hop on the ice: no steering in the air (the slide goes on under him, or he went straight up); the
  // game's own Double Jump still works
  if(up&&free&&(X.sl||X.hop)){
    const q=Object.assign({},inp,{mx:0,my:0,roll:false,sprint:false}); const r=base(dt,q);
    if(X.sl) d2aSlideStep(A,p,dt); p.kvx=p.kvy=0;
    if(!d2aUp(p)) X.hop=false;
    return r; }
  X.hop=false;
  if(d2aBusy(p)||scene!=='play'){ X.sl=null; X.pushB=null; const r=base(dt,inp); if(up&&free&&!d2aUp(p)) d2aLandOnIce(A,p,avx,avy); return r; }
  const k=tCell(p.x,p.y), onIce=k>=0&&d2aSlick(A,k);
  const mx=inp.mx||0, my=inp.my||0, mag=Math.hypot(mx,my), aim=inp.fire||p.breathing;
  // pushing a block: walk (or lean, on the ice) into it for a moment
  d2aPushTick(A,p,dt,mx,my,mag);
  if(!onIce&&!X.sl){ const r=base(dt,inp); if(!d2aUp(p)){ if(up) d2aLandOnIce(A,p,avx,avy); d2aRest(A,p); } return r; }
  // on the ice: the stick only starts a slide (or turns Ash while he breathes fire); JUMP is a hop (see above)
  const q=Object.assign({},inp,{mx:0,my:0,jump:false,jumpHeld:false,roll:false,sprint:false});
  if(up){ q.jump=inp.jump; q.jumpHeld=inp.jumpHeld; }
  else if(inp.jump&&canJump()&&free&&p.drinkT<=0&&!G.fishing&&!MV.lk&&!(p.dashT>0.1)) d2aIceJump(A,p,k,mx,my,mag,aim);
  if(!X.sl&&!X.hop&&!d2aUp(p)&&mag>0.5){
    const ang=Math.atan2(my,mx);
    if(aim){ p.faceGoal=ang; p.facing=turnTo(p.facing,ang,12*dt); }
    else{ const ax=Math.abs(mx)>=Math.abs(my), dx=ax?Math.sign(mx):0, dy=ax?0:Math.sign(my), n=k+dx+dy*w;
      const q0=tPos(k), atC=Math.abs((p.x-q0.x)*dx+(p.y-q0.y)*dy)<2;
      if(!(atC&&!d2aEnter(A,k,n,'ash'))){ X.sl={dx,dy,d:0}; if(dx) p.y=q0.y; else p.x=q0.x; p.facing=p.faceGoal=Math.atan2(dy,dx); }
      else { p.facing=p.faceGoal=Math.atan2(dy,dx); if(!(X.bumpT>G.time)&&!(X.pushB)){ X.bumpT=G.time+0.6; d2aTip('slide',S('Slippery ice!','Slippery!'),S('You slide until something stops you. Walls, pillars, blocks and plain floor stop you. Hold fire breath to turn on the spot.','You slide until you hit something!')); } } } }
  const r=base(dt,q);
  if(X.sl) d2aSlideStep(A,p,dt);
  p.kvx=p.kvy=0;
  if(up&&!d2aUp(p)&&!X.sl&&!X.hop) d2aLandOnIce(A,p,avx,avy);
  if(!X.sl&&!d2aUp(p)) d2aRest(A,p);
  return r;
}
// JUMP pressed on the ice: a hop with the slide; from a standstill a push off along the stick (onto the ice, or over one
// tile of slush), else straight up
function d2aIceJump(A,p,k,mx,my,mag,aim){
  const X=A.d2a, w=A.cave.w;
  if(!X.sl&&mag>0.5&&!aim){ const ax=Math.abs(mx)>=Math.abs(my), dx=ax?Math.sign(mx):0, dy=ax?0:Math.sign(my), n=k+dx+dy*w, q0=tPos(k);
    if(d2aEnter(A,k,n,'ash')||(d2aAirGap(A,n)&&d2aEnterAir(A,n,n+dx+dy*w))){ X.sl={dx,dy,d:0}; if(dx) p.y=q0.y; else p.x=q0.x; p.facing=p.faceGoal=Math.atan2(dy,dx); } }
  if(X.sl){ d2aHop(A,p); return; }
  d2aTakeoff(p,1); X.hop=true;
  if((X.gripN||0)<2){ X.gripN=(X.gripN||0)+1; d2aFt(p.x,p.y-40,S('No grip! Slide, then jump.','Slide, then jump!'),'#dff4ff',13,'grip',1); }
}
function d2aTakeoff(p,f){
  const k=(p.stats&&p.stats.jumpK)||1;
  MV.jumpBuf=0; MV.takeSpd=0; MV.flapT=0.5; MV.jrec={x0:p.x,y0:p.y,t0:G.time,zmax:0};
  p.dashT=0; p.avx=p.avy=0; p.vz=JUMP_V*k*f; p.z=0.01; p.dbl=false; p.slam=false; p.sqT=0.12; p.sqD=0.12; p.sqA=-0.12;
  mvSnd('jump'); emit(p.x,p.y+5,6,{col:'230,245,255',glow:false,smin:20,smax:70,lmin:.2,lmax:.4,zmin:2,zmax:4,grow:5});
  if(G.stats) G.stats.jumps=(G.stats.jumps||0)+1;
}
// the hop with the slide: low and quick, D2AN.hop cells at the slide's speed
function d2aHop(A,p){ const S=A.d2a.sl, T=Math.min(0.5,D2AN.hop*A.cave.cell/D2AN.slide); d2aTakeoff(p,2*T);
  emit(p.x-S.dx*10,p.y+6,8,{col:'235,248,255',glow:false,ang:Math.atan2(-S.dy,-S.dx),spread:0.9,smin:30,smax:110,lmin:.2,lmax:.45,zmin:1.5,zmax:3,drag:2});
  if(G.stats) G.stats.d2aHops=(G.stats.d2aHops||0)+1; }
// a jump landing on the ice with speed slides on the way he flew (a landing is never a new place to stop)
function d2aLandOnIce(A,p,vx,vy){ const X=A.d2a, w=A.cave.w, k=tCell(p.x,p.y); if(k<0||!d2aSlick(A,k)||X.sl||Math.hypot(vx,vy)<60) return;
  const ax=Math.abs(vx)>=Math.abs(vy), dx=ax?Math.sign(vx):0, dy=ax?0:Math.sign(vy), q0=tPos(k), s=(p.x-q0.x)*dx+(p.y-q0.y)*dy;
  if(!d2aEnter(A,k,k+dx+dy*w,'ash')&&s>-2) return;
  X.sl={dx,dy,d:0}; if(dx) p.y=q0.y; else p.x=q0.x; p.facing=p.faceGoal=Math.atan2(dy,dx); }
// where he last stood still on solid ground (a fall into slush comes back here)
function d2aRest(A,p){ const X=A.d2a, k=tCell(p.x,p.y); if(k<0||X.sl||p.dead||!tGround(k)||X.frz.has(k)||tHole(k)) return; X.rest={x:p.x,y:p.y,k}; }
// slush and the dam's lake before it drains: cells a jump passes over
function d2aAirGap(A,k){ const c=A.cave; if(k<0||k>=c.typ.length||c.grid[k]!==0) return false; const t=c.typ[k]; return (t===D2T.slush||t===D2T.lake)&&d2aWallCell(k,t); }
// can Ash in the air go from cell k into cell n (over slush, or onto the far bank)
function d2aEnterAir(A,k,n){ const c=A.cave, w=c.w; if(n<0||n>=c.typ.length||Math.abs((n%w)-(k%w))>1) return false;
  if(c.grid[n]!==0||caveBlockedAt(n)) return false; if(d2aAirGap(A,n)) return true;
  if(d2aAirGap(A,k)){ if(!tGround(n)||tHole(n)) return false; const q=tPos(n); return !colAt(q.x,q.y,12); }
  return d2aEnter(A,k,n,'ash'); }
// a jump that came down in slush: a cold splash, back to where he last stood still
function d2aSlushFall(A,p){
  const X=A.d2a, R=X.rest, ok=R&&R.k>=0&&tGround(R.k)&&!caveBlockedAt(R.k)&&!X.frz.has(R.k), s=ok?R:dunNearGround(p.x,p.y,4);
  G.ripples.push({x:p.x,y:p.y,t:0,max:0.9,r:22,splash:true}); emit(p.x,p.y,16,{col:'215,235,250',glow:false,ang:-Math.PI/2,spread:1.3,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4}); SFX.play('pop'); d2aSnd('plop',0.6);
  p.x=s.x; p.y=s.y; p.z=0; p.vz=0; p.kvx=p.kvy=0; p.avx=p.avy=0; X.sl=null; X.hop=false;
  if(A.tri){ A.tri.lx=p.x; A.tri.ly=p.y; A.tri.wasAir=false; }
  d2aFt(p.x,p.y-40,S('Brrr! Slush!','Brrr!'),'#dff4ff',14,'slush');
  if(G.stats) G.stats.d2aDunks=(G.stats.d2aDunks||0)+1;
}
function d2aSlideStep(A,p,dt){
  const X=A.d2a, S=X.sl, c=A.cave, w=c.w, cs=c.cell, up=d2aUp(p); let rem=D2AN.slide*dt, guard=0;
  while(rem>0.001&&X.sl&&guard++<12){
    const k=tCell(p.x,p.y); if(k<0){ X.sl=null; break; } const q=tPos(k), s=(p.x-q.x)*S.dx+(p.y-q.y)*S.dy;
    if(S.dx) p.y=q.y; else p.x=q.x;
    if(s<-0.01){ const d=Math.min(rem,-s); p.x+=S.dx*d; p.y+=S.dy*d; rem-=d; S.d+=d; continue; }
    // (v12 ICE) in a hop only slush and the lake pass under him; anything he could stand on still ends the slide
    const gap=up&&d2aAirGap(A,k);
    if(!gap&&!d2aSlick(A,k)){ p.x=q.x; p.y=q.y; d2aSlideEnd(A,p,false); break; }
    const n=k+S.dx+S.dy*w;
    if(!(up?d2aEnterAir(A,k,n):d2aEnter(A,k,n,'ash'))){ p.x=q.x; p.y=q.y; d2aSlideEnd(A,p,true); break; }
    const d=Math.min(rem,cs*0.5-s+0.02); p.x+=S.dx*d; p.y+=S.dy*d; rem-=d; S.d+=d;
  }
  if(X.sl&&!up){ p.moving=false; X.slT=(X.slT||0)-dt; if(X.slT<=0){ X.slT=0.3; d2aSnd('slide',0.6); }
    if(Math.random()<0.5) emit(p.x-S.dx*14+rand(-6,6),p.y+8,1,{col:'235,248,255',glow:false,ang:Math.atan2(-S.dy,-S.dx),spread:0.5,smin:20,smax:70,lmin:.2,lmax:.4,zmin:1.5,zmax:3,drag:2}); }
  if(A.tri){ A.tri.lx=p.x; A.tri.ly=p.y; }
}
function d2aSlideEnd(A,p,bump){ const X=A.d2a, S=X.sl; X.sl=null; if(d2aUp(p)) X.hop=true; if(S&&S.d>20){ if(bump){ d2aSnd('bump',0.7); shake(1); } emit(p.x+S.dx*16,p.y+6,5,{col:'235,248,255',glow:false,smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.5,zmax:3}); }
  if(G.stats) G.stats.d2aSlides=(G.stats.d2aSlides||0)+1; }
// pushing: Ash beside a block, the stick toward it, for D2AN.push seconds
function d2aPushTick(A,p,dt,mx,my,mag){
  const X=A.d2a, cs=A.cave.cell; if(mag<0.5){ X.pushB=null; X.pushT=0; return; }
  let hit=null, di=0, dj=0; const lv=Math.max(0,dunH(tCell(p.x,p.y)));
  for(const b of X.blocks){ if(b.gone||b.mv||b.anim>0||b.z>0) continue; const dx=p.x-b.x, dy=p.y-b.y;
    if(Math.max(0,dunH(b.cj*A.cave.w+b.ci))!==lv) continue;
    if(Math.abs(mx)>Math.abs(my)){ if(Math.abs(dy)<cs*0.42&&Math.abs(dx)<cs+4&&Math.sign(-dx)===Math.sign(mx)){ hit=b; di=Math.sign(mx); break; } }
    else { if(Math.abs(dx)<cs*0.42&&Math.abs(dy)<cs+4&&Math.sign(-dy)===Math.sign(my)){ hit=b; dj=Math.sign(my); break; } } }
  if(!hit){ X.pushB=null; X.pushT=0; return; }
  if(X.pushB!==hit){ X.pushB=hit; X.pushT=0; }
  X.pushT+=dt; if(X.pushT<D2AN.push) return; X.pushT=-0.15;
  if(!d2aBlockMove(A,hit,di,dj)){ d2aSnd('bump',0.4); if(!(X.nopeT>G.time)){ X.nopeT=G.time+1.5; d2aFt(hit.x,hit.y-40,S('It will not budge that way.','Stuck!'),'#dff4ff',12,'nobudge'); } }
}
// start a block moving one way: ice slides on, stone moves one cell (and drops off a ledge)
function d2aBlockMove(A,b,di,dj){
  const c=A.cave, w=c.w, k=b.cj*w+b.ci, n=k+di+dj*w;
  if(!d2aEnter(A,k,n,b)) return false;
  b.mv={di,dj,d:0}; d2aSnd('push',0.8); shake(1);
  if(G.stats) G.stats.d2aPushes=(G.stats.d2aPushes||0)+1;
  return true;
}
function d2aBlocksTick(A,dt){
  const X=A.d2a, c=A.cave, w=c.w, cs=c.cell;
  for(const b of X.blocks){
    if(b.gone) continue;
    if(b.z>0||b.vz){ b.vz-=900*dt; b.z=Math.max(0,b.z+b.vz*dt); if(b.z<=0){ if(b.vz<-60){ d2aSnd('bump'); shake(3); emit(b.x,b.y+10,10,{col:'200,190,170',glow:false,smin:20,smax:80,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:5}); } b.vz=0; } }
    const M=b.mv; if(!M) continue;
    let rem=(b.kind==='stone'?160:D2AN.bslide)*dt, guard=0;
    while(rem>0.001&&b.mv&&guard++<12){
      const k=b.cj*w+b.ci, tx=A.x0+(b.ci+0.5)*cs, ty=A.y0+(b.cj+0.5)*cs, s=(b.x-tx)*M.di+(b.y-ty)*M.dj;
      if(s<-0.01){ const d=Math.min(rem,-s); b.x+=M.di*d; b.y+=M.dj*d; rem-=d; M.d+=d; continue; }
      // at the centre of its cell: go on into the next one (its cell is the next one from now on), or stop here
      const first=M.d===0, n=k+M.di+M.dj*w;
      const go=first||(b.kind==='ice'&&d2aSlick(A,k));
      if(!go||!d2aEnter(A,k,n,b)){ b.x=tx; b.y=ty; b.mv=null; if(M.d>cs*1.2){ d2aSnd('bump',0.6); shake(1.5); } d2aBlockStop(A,b); break; }
      const hk=Math.max(0,dunH(k)), hn=Math.max(0,dunH(n));
      b.ci+=M.di; b.cj+=M.dj; M.d+=0.01;
      if(hn<hk){ b.z=36*(hk-hn); b.vz=0; }
    }
    if(b.vis){ b.vis.x=b.x; b.vis.y=b.y; }
    if(b.mv&&b.kind==='ice'&&Math.random()<0.4) emit(b.x-M.di*20,b.y+12,1,{col:'235,248,255',glow:false,smin:20,smax:60,lmin:.2,lmax:.4,zmin:1.5,zmax:3,drag:2});
  }
}
function d2aBlockStop(A,b){ const X=A.d2a; for(const o of X.plates) if(o.ci===b.ci&&o.cj===b.cj&&!o.pressed){ d2aSnd('seal',0.6); SFX.play('block',0.6); } }
// a melted ice block leaves a puddle (on slick ice the puddle is a stopper) until a frost vent breathes on it
function d2aMeltBlock(A,b){
  const X=A.d2a, c=A.cave, k=b.cj*c.w+b.ci; b.gone=true; b.mv=null; X.pushB=null;
  if(c.typ[k]===D2T.slick) X.pud.add(k);
  d2aSnd('plop'); p3Snd('melt'); shake(2);
  for(let i=0;i<16;i++) emit(b.x+rand(-18,18),b.y-rand(0,40),1,{col:'235,248,255',glow:false,ang:-Math.PI/2,spread:1,smin:20,smax:80,lmin:.6,lmax:1.1,zmin:4,zmax:8,grow:9,drag:1,alpha:0.6});
  d2aFt(b.x,b.y-50,S('Hsss! A puddle.','A puddle!'),'#dff4ff',14,'meltb');
  d2aTip('puddle',S('A puddle','A puddle'),S('Water is not slippery. A slide stops on a puddle.','Puddles stop a slide!'));
  if(G.stats) G.stats.d2aMelts=(G.stats.d2aMelts||0)+1;
}
// plates under a block (my rooms d2arink and d2aplate): every plate pressed solves the room
function d2aPlatesTick(A){
  const X=A.d2a; if(!X.plates.length) return; const byRoom={};
  for(const o of X.plates){ const on=X.blocks.some(b=>!b.gone&&!b.mv&&b.z<=0&&b.ci===o.ci&&b.cj===o.cj); if(on&&!o.pressed){ emit(o.x,o.y,12,{col:'200,230,255',smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } o.pressed=on; (byRoom[o.room]=byRoom[o.room]||[]).push(o); }
  for(const id in byRoom){ const R=A.rooms[id]; if(!R||R.solved||!(R.kind==='d2arink'||R.kind==='d2aplate')) continue; if(byRoom[id].every(o=>o.pressed)) solveRoom(R); }
}
// the rune stone puts the blocks back (and dries the puddles they made)
{ const base=resetBlocks; resetBlocks=function(room){ base.apply(this,arguments); const A=AREA, X=A&&A.d2a; if(!X) return; const R=A.rooms[room]; if(R&&R.solved) return;
    for(const b of X.blocks) if(b.room===room){ b.ci=b.si; b.cj=b.sj; b.gone=false; b.mv=null; b.z=0; b.vz=0; d2aBlockSnap(A,b); }
    if(R) for(const k of [...X.pud]){ const i=k%A.cave.w, j=(k-i)/A.cave.w; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) X.pud.delete(k); }
    // never leave Ash inside a block
    const p=player; for(const b of X.blocks) if(!b.gone&&b.room===room&&d2aAshOn(A,b.cj*A.cave.w+b.ci)){ const s=dunNearGround(p.x,p.y,4); p.x=s.x; p.y=s.y; } }; }

// ---------- 8. every frame in my dungeons: blocks, plates, frost vents, what Blaze does to my things, portals, wheels
{ const base=updateCaveRooms; updateCaveRooms=function(dt){
    const A=AREA; base.apply(this,arguments);
    if(!A||AREA!==A||!A.d2a) return;
    try{ d2aTick(A,dt); }catch(e){ console.error(e); } }; }
function d2aTick(A,dt){
  const X=A.d2a; X.t+=dt;
  d2aBlocksTick(A,dt); d2aPlatesTick(A); d2aVentsTick(A,dt); d2aThawTick(A,dt); d2aFireTick(A,dt); d2aPortalsTick(A,dt); d2aWheelsTick(A,dt); d2aRoomBeats(A,dt);
}
// ---- frost vents: every per seconds a vent breathes its line of cells (a warning frost gathers first). The breath
// freezes slush and flooded water into slick ice for frz seconds, freezes puddles back into ice, grows melted ice walls
// back (unless their room is solved) and blows Ash back a little. Blaze on a vent for a second seals it for a while.
function d2aVentsTick(A,dt){
  const X=A.d2a, p=player, cs=A.cave.cell;
  for(const v of X.vents){
    if(v.seal>0){ v.seal-=dt; if(v.seal<=0){ d2aSnd('freeze',0.4); emit(v.x,v.y-10,8,{col:'220,240,255',smin:10,smax:50,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); } v.warn=false; v.blow=Math.max(0,v.blow-dt); continue; }
    const ph=(X.t+v.ph)%v.per, was=v.warn; v.warn=ph>v.per-D2AN.vwarn;
    if(v.warn&&!was&&A.curRoom&&A.curRoom.id===v.room) d2aSnd('vwarn',0.5);
    if(v.lastPh!=null&&ph<v.lastPh) d2aVentBlow(A,v);
    v.lastPh=ph; if(v.blow>0) v.blow-=dt;
    if(v.blow>0&&!p.dead){ for(const q of v.cells){ const c=tPos(q); if(Math.abs(p.x-c.x)<cs*0.5&&Math.abs(p.y-c.y)<cs*0.5&&!airborne()&&!(A.d2a.sl)){ tNudge(p,v.dx*90*dt,v.dy*90*dt); if(!(v.brrT>G.time)){ v.brrT=G.time+2; d2aFt(p.x,p.y-50,S('Brrr!','Brrr!'),'#dff4ff',14,'brr'); } break; } } }
  }
}
function d2aVentBlow(A,v){
  const X=A.d2a, c=A.cave, R=A.rooms[v.room]; v.blow=D2AN.vblow; let froze=false;
  for(const q of v.cells){ const t=c.typ[q];
    if(t===D2T.slush||(t===D2T.shaft&&d2aFlood())){ X.frz.set(q,v.frz); froze=true; }
    if(X.pud.has(q)){ X.pud.delete(q); froze=true; }
    const gi=c.dyn[q], g=gi&&A.gates[gi-1]; if(g&&g.g==='ice'&&g.melted&&!(R&&R.solved)){ if(p3Refreeze(g)){ froze=true; d2aFt(g.x,g.y-50,S('It froze back!','Frozen again!'),'#dff4ff',13,'refrz'); } } }
  if(A.curRoom&&A.curRoom.id===v.room){ d2aSnd('vent',0.7); if(froze) d2aSnd('freeze',0.5); }
  for(let s=0;s<v.cells.length;s++){ const q=tPos(v.cells[s]); emit(q.x,q.y-6,3,{col:'225,242,255',glow:false,ang:Math.atan2(v.dy,v.dx),spread:0.6,smin:40,smax:160,lmin:.3,lmax:.7,zmin:1.2,zmax:3,drag:1.5,alpha:0.7}); }
}
// frozen cells thaw back; nobody is left standing in slush
function d2aThawTick(A,dt){
  const X=A.d2a; if(!X.frz.size) return; const p=player;
  for(const [k,t] of X.frz){ const nt=t-dt*D2AN.thawK; if(nt>0){ X.frz.set(k,nt); continue; } X.frz.delete(k);
    if(!p.dead&&d2aAshOn(A,k)&&!airborne()&&!tGround(tCell(p.x,p.y))&&!tWet(tCell(p.x,p.y))){ d2aSafe(A,p,true); }
    else if(!p.dead&&d2aAshOn(A,k)&&X.sl){ X.sl=null; d2aSafe(A,p,true); } }
}
// put Ash on the nearest good floor (a thaw under him), with a cold splash
function d2aSafe(A,p,splash){
  const s=dunNearGround(p.x,p.y,4); p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; A.d2a.sl=null;
  if(A.tri){ A.tri.lx=p.x; A.tri.ly=p.y; A.tri.safe={x:p.x,y:p.y}; }
  if(splash){ G.ripples.push({x:p.x,y:p.y,t:0,max:0.9,r:22,splash:true}); SFX.play('pop'); d2aFt(p.x,p.y-40,S('Brrr! Slush!','Brrr!'),'#dff4ff',14,'slush'); }
}
// ---- fire on my things: ice blocks melt (Blaze, 1 s), vents seal (Blaze, 1 s), the frozen steak thaws
function d2aFireTick(A,dt){
  const X=A.d2a, p=player; if(!p.breathing) return; const blue=!!(typeof P3!=='undefined'&&P3.bz&&P3.bz.blue&&P3.jet);
  const hit=(x,y,r)=>(blue&&p3JetHits(x,y,r))||p3BreathHits(x,y,r);
  for(const b of X.blocks){ if(b.gone||b.kind!=='ice'||!hit(b.x,b.y-10,22)) continue;
    if(!blue){ if(!(b.swT>G.time)){ b.swT=G.time+3; d2aFt(b.x,b.y-50,canBlaze()?S('Hotter! Wait for blue fire.','Hold it! Blue fire!'):S('The ice block only sweats a little.','The ice just drips.'),'#dff4ff',13,'sweatb'); } continue; }
    b.heat=(b.heat||0)+dt; b.heatT=G.time; p3MeltFx(b.x,b.y-24,0.6); if(b.heat>=p3Need(D2AN.melt)){ b.heat=0; d2aMeltBlock(A,b); } }
  for(const v of X.vents){ if(v.seal>0||!hit(v.x,v.y-8,20)) continue; if(!blue){ if(!(v.swT>G.time)){ v.swT=G.time+3; d2aFt(v.x,v.y-46,S('The vent just hisses at you.','It hisses.'),'#dff4ff',13,'ventsw'); } continue; }
    v.heat+=dt; v.heatT=G.time; p3MeltFx(v.x,v.y-14,0.6); if(v.heat>=p3Need(1.0)){ v.heat=0; v.seal=d2aDiff(D2AN.seal[0],D2AN.seal[1],D2AN.seal[2]); v.warn=false; d2aSnd('seal'); p3Snd('melt'); shake(2); d2aFt(v.x,v.y-50,S('Sealed! For a while.','Sealed!'),'#ffd9a0',14,'seal');
      emit(v.x,v.y-10,16,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:30,smax:110,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:5}); d2aTip('seal',S('Frost vent sealed','Vent sealed'),S('A vent you seal with Blaze stops breathing for a while. Then it wakes up again.','A sealed vent stops for a while.')); } }
  for(const o of A.objs){ if(o.tobj!=='d2a_steak'||G.found[o.id+'_ice']||!hit(o.x,o.y-14,24)) continue; if(!blue){ if(!(o.swT>G.time)){ o.swT=G.time+3; d2aFt(o.x,o.y-50,S('The ice only sweats.','It just drips.'),'#dff4ff',13,'steaksw'); } continue; }
    o.heat+=dt; p3MeltFx(o.x,o.y-20,0.7); if(o.heat>=p3Need(1.4)){ G.found[o.id+'_ice']=true; p3Snd('melt'); d2aSnd('plop'); d2aFt(o.x,o.y-50,S('The steak is free! It smells amazing.','Free! Yum!'),'#ffe0b0',14,'steak'); saveGame(); } }
  for(const v of X.vents) if(v.heatT!=null&&G.time-v.heatT>1.2&&v.heat>0) v.heat=Math.max(0,v.heat-dt*0.5);
  for(const b of X.blocks) if(b.heatT!=null&&G.time-b.heatT>1.2&&b.heat>0) b.heat=Math.max(0,b.heat-dt*0.5);
}
// ---- the Ice Dam: the last ice wall melts, the meltwater roars west down the waterslide and floods the Drip Shaft
function d2aDamBreak(A,R){
  if(d2aFlood()) return; G.found[D2AF]=true;
  d2aSnd('rumble'); shake(10); flashA=0.2; flashCol='200,230,255';
  const c=A.cave; for(let r=0;r<11;r++) for(let cc=10;cc<14;cc++){ const q=d2aRP(A,R,cc,r); if(Math.random()<0.5) emit(q.x,q.y,2,{col:'170,210,250',glow:false,ang:Math.PI,spread:0.6,smin:60,smax:220,lmin:.4,lmax:.9,zmin:1.5,zmax:3,drag:1}); }
  renderCaveRooms(A,A.def); d2aFloodLook(A);
  later(0.8,()=>{ if(AREA!==A) return; d2aPlay('f_maze_dam',()=>{ setBanner(S('The Drip Shaft floods','The shaft fills up'),S('Far below, the meltwater fills the dry shaft. Ice that lay at the bottom floats up.','The water fills the shaft below!'),3); }); });
  saveGame();
}
function d2aFloodLook(A){ /* the static floor already knows the flood; the live layer draws the water (section 10) */ A.d2a.floodT=A.d2a.floodT||0; }
// ---- portals: the ladder between the Ice Dam and the Drip Shaft, the waterslide, the temple's updraft and downdraft
function d2aPortalCoord(aid,room,cell){ const M=CAVEMAP[aid], R=M&&M.rooms[room]; if(!R) return null; const cs=AREADEFS[aid]&&AREADEFS[aid].cell||48, x0=IZX+200, y0=IZY+200;
  return {x:x0+(R.at[0]*RSX+1+cell[0]+0.5)*cs,y:y0+(R.at[1]*RSY+1+cell[1]+0.5)*cs}; }
function d2aPortalOK(A,o){ if(o.need==='flood'&&!d2aFlood()) return false; if(o.need==='solved'&&!(A.rooms[o.room]&&A.rooms[o.room].solved)) return false; if((o.look==='updraft'||o.look==='down')&&!canWindride()) return false; return true; }
function d2aPortalsTick(A,dt){
  const X=A.d2a, p=player; for(const o of X.portals) o.t+=dt;
  if(D2A.graceT>G.time) return;
  if(d2aBusy(p)||scene!=='play'||!A.dn||A.dn.go||A.dn.drop) return;
  for(const o of X.portals){ if(dist(p.x,p.y,o.x,o.y)>20) continue;
    if(!d2aPortalOK(A,o)){ if(!(o.nope>G.time)){ o.nope=G.time+2.5;
        const t=o.look==='chute'?S('A round hole plugged with old ice. Water must have run down here once.','An old ice plug.'):o.need==='solved'?S('A gentle updraft. Not strong enough to lift you. Something in this room has to wake the wind up.','Too weak. Wake the wind first!'):S('Whoosh! A gust of warm air. It nearly blows your hat off.','Whoosh!');
        d2aFt(p.x,p.y-50,t,'#eef6ff',13,'portal'); if(o.look==='updraft') p3Snd('puff'); } continue; }
    d2aPortalGo(A,o); break; }
}
function d2aPortalGo(A,o){
  const to=d2aPortalCoord(o.to,o.toRoom,o.cell); if(!to) return;
  A.dn.go={to:o.to,arrive:{x:to.x,y:to.y}}; D2A.graceT=G.time+1.6; A.d2a.sl=null;
  if(o.look==='ladder'){ d2aSnd('ladder'); }
  else if(o.look==='chute'){ d2aSnd('glide'); later(0.2,()=>d2aFt(player.x,player.y-50,S('Wheeeee!','Wheee!'),'#e8f6ff',15,'chute')); }
  else { p3Snd('wind'); d2aSnd('whoosh'); later(0.25,()=>d2aFt(player.x,player.y-50,o.look==='updraft'?S('Up we go!','Up!'):S('Down we go!','Down!'),'#e8f6ff',15,'draft')); }
  if(G.stats) G.stats.d2aPortals=(G.stats.d2aPortals||0)+1;
}
// ---- prayer wheels: hit one (or press E beside it) and it spins for a while: its covers and shutters open while it spins
function d2aSpin(A,o){ if(o.cd>0) return; o.cd=0.4; const was=o.spin>0; o.spin=d2aDiff(9,6,5); d2aSnd('wheel'); emit(o.x,o.y-30,10,{col:'255,220,140',smin:20,smax:80,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4});
  if(!was&&(o.cover.length||o.scr.length)){ d2aSnd('chime'); d2aFt(o.x,o.y-70,o.cover.length?S('Somewhere, a little bridge unfolds!','A bridge!'):S('A shutter swings open!','It opens!'),'#ffe9a0',14,'wheel'); }
  for(const q of o.cover) A.d2a.cover.add(q); refreshCaveGates(); d2aTip('wheel',S('Prayer wheel','Prayer wheel'),S('A spinning wheel works its little bridge or shutter, but only while it spins.','It only works while it spins!')); }
function d2aWheelsTick(A,dt){
  const X=A.d2a, p=player; let ch=false;
  for(const o of X.wheels){ if(o.cd>0) o.cd-=dt; o.rot+=dt*(o.spin>0?9:0.3); if(o.spin<=0) continue; o.spin-=dt; if(o.spin>0&&o.spin<2&&!(o.tickT>G.time)){ o.tickT=G.time+0.35; d2aSnd('ladder',0.3); }
    if(o.spin<=0){ // its cover folds away, but never under Ash: it waits until he steps off
      if(o.cover.some(q=>d2aAshOn(A,q))){ o.spin=0.2; continue; } o.spin=0; for(const q of o.cover) X.cover.delete(q); ch=true; } }
  if(ch||X.wheels.some(o=>o.scr.length)) d2aRefreshScreens(A);
}
{ const base=areaObjHit; areaObjHit=function(x,y,r,src){ let hit=base.apply(this,arguments); const A=AREA; if(!A||!A.d2a||src==='fire') return hit; r=r||8;
    for(const o of A.d2a.wheels){ if(dist(x,y,o.x,o.y-20)<r+26){ d2aSpin(A,o); hit=true; } } return hit; }; }
{ const base=caveSwing; caveSwing=function(px,py,dir,range,half){ base.apply(this,arguments); const A=AREA; if(!A||!A.d2a) return;
    for(const o of A.d2a.wheels) if(o.cd<=0&&inArcC(px,py,dir,range+12,half,{x:o.x,y:o.y-20,r:22})) d2aSpin(A,o); }; }

// ---------- 9. people, treasure, story beats, the wind seal
// the explorers in the ice: Hjalmar (Ice Halls, a sneeze), Sigrid (Cold Forge, the shaft key)
{ const base=buildCaveRooms; buildCaveRooms=function(A,def){ base.apply(this,arguments); if(d2aDun(def)&&A.d2a) try{ d2aPeople(A,def); }catch(e){ console.error(e); } }; }
function d2aPeople(A,def){
  const X=A.d2a;
  for(const o of A.objs){ if(o.p3!=='frozen') continue;
    if(o.id==='f_hjalmar') o.onThaw=()=>{ d2aPlay('f_maze_hjalmar'); };
    if(o.id==='f_sigrid'){ o.onThaw=()=>{ d2aPlay('f_maze_sigrid',()=>d2aSigridKey(A,o)); }; if(p3Thawed(o)) d2aSigridKey(A,o,true); } }
  // the end chest before the altar; the Heart Ember waits there
  X.heartChest=A.objs.find(o=>o.tobj==='dchest'&&o.kind==='heart')||null;
  for(const g of A.gates) if(g.type==='boss'&&g.link&&[g.link.a,g.link.b].some(id=>A.rooms[id]&&A.rooms[id].wind)) A.objs.push({k:'tv',kind:'d2awhirl',ref:g,x:g.x,y:g.y+40,id:g.id+'_wh'});
}
function d2aSigridKey(A,o,quiet){ if(AREA!==A) return; const id=`cv_${A.d2a.SK}_${o.room}_keytaken`; if(G.found[id]||A.objs.some(q=>q.id===id&&q.k==='smallkey')) return;
  A.objs.push({k:'smallkey',x:o.x+30,y:o.y+20,id,room:o.room,live:true}); if(!quiet){ SFX.play('chest'); emit(o.x+30,o.y,14,{col:'255,226,140',smin:30,smax:110,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); setBanner(S('A small key','A small key'),S('Sigrid left it on the floor for you.','Sigrid left her key!'),2.2); } }
// E on my things
{ const base=trialObjAct; trialObjAct=function(o){
    const A=AREA; if(!A||!A.d2a||!o) return base.apply(this,arguments); const X=A.d2a;
    switch(o.tobj){
      case 'd2a_wheel': d2aSpin(A,o); return true;
      case 'd2a_mural': if(!d2aSeen('f_sky_mural')) d2aPlay('f_sky_mural'); else d2aSay([['narr',S('Three birds in a row: a small one, a big one, a medium one. Under them, three bells.','A small bird, a big bird, a medium bird.')]]); return true;
      case 'd2a_hat': if(G.found[o.id]) return true; G.found[o.id]=true; A.objs=A.objs.filter(q=>q!==o&&q!==o.vis); A.p3list=null; d2aHat('f_hat_monk'); later(0.8,()=>d2aPlay('f_sky_hats')); saveGame(); return true;
      case 'd2a_steak': { if(G.found[o.id]) return true; const k=tCell(o.x,o.y);
        if(!G.found[o.id+'_ice']){ const tail=()=>d2aSay([['narr',canBlaze()?S('A whole mammoth steak, frozen inside a block of ice. Blue fire would thaw it.','A frozen steak. Use blue fire!'):S('A whole mammoth steak, frozen inside a block of ice. Your breath only makes it sweat.','A frozen steak. Your fire is too weak.')]]);
          if(!d2aSeen('f_maze_pantry')) d2aPlay('f_maze_pantry',tail); else tail(); return true; }
        G.found[o.id]=true; X.solid.delete(k); A.objs=A.objs.filter(q=>q!==o&&q!==o.vis); addCoins(60,o.x,o.y); G.pipTreats=Math.min(3,(G.pipTreats||0)+1); jingle('item','chest');
        setBanner(S('A mammoth steak!','A mammoth steak!'),S('Pip will be thrilled. (+60 coins, and a treat for Pip.)','For Pip! (+60 coins)'),2.6); saveGame(); return true; }
      case 'altar': if(X.heartChest&&!G.found[X.heartChest.id]&&!trialDone(X.root)){ d2aSay([['ember',S(`Not yet, Ash. Open the big chest first. It's yours.`,`Open the big chest first!`)]]); return true; } break;
    }
    return base.apply(this,arguments); }; }
// the hats: a frosty bobble hat (the Ice Dam's island chest), a little saffron monk cap (Skyreach's hat room)
const D2A_HATN={f_hat_frosty:S('Snowflake Bobble Hat','Snowflake Bobble Hat'),f_hat_monk:S('Little Monk Cap','Little Monk Cap')};
function d2aHat(k){ G.hats=G.hats||{}; G.hats[k]=true; G.hat=k; jingle('item','chest'); setBanner(D2A_HATN[k]||'Hat',k==='f_hat_monk'?S('It has a tiny kite tail. Very windy-chic.','It has a tiny kite tail!'):S('A bobble like a snowball. Very warm.','Very warm!'),2.6); }
if(typeof EVHATN!=='undefined') Object.assign(EVHATN,D2A_HATN);
if(typeof ashHat==='function'){ const base=ashHat; ashHat=function(k){ const z0=6.2;
  if(k==='f_hat_frosty'){ aE(0,0,z0-0.7,7.9,8.3,5.1,'#5a8ad0'); aE(0,0,z0-2.8,8.1,8.5,1.7,'#f4f8ff'); for(let i=0;i<6;i++){ const a=i/6*TAU; aB(Math.cos(a)*7.6,Math.sin(a)*8,z0-1.2,0.8,'#f4f8ff',0.02); } aB(-0.4,0,z0+4.8,2.6,'#f8fbff'); return; }
  if(k==='f_hat_monk'){ aE(0,0,z0-0.9,7.6,8,4.4,'#e8a030'); aE(0,0,z0-2.6,7.9,8.3,1.3,'#c83a2a'); aL(-5.5,0,z0-1.2,-12,1.4,z0-0.2,0.9,'#c83a2a',0.6); aL(-12,1.4,z0-0.2,-16,-1,z0+1.4,0.8,'#ffd84a',0.4); aB(0,0,z0+3.2,1.2,'#ffd84a'); return; }
  return base(k); }; }
// chests: the island chest is not sealed by its room; some chests hold a hat or a diary as well
{ const base=dChestSealed; dChestSealed=function(o){ const A=AREA, R=A&&A.d2a&&A.rooms[o.room]; if(R&&R.noSeal) return p3ChestIce(o)||p3ChestDomed(o); return base.apply(this,arguments); }; }
{ const base=dChestOpen; dChestOpen=function(o){ const A=AREA, was=!!G.found[o.id]; const r=base.apply(this,arguments);
    if(A&&A.d2a&&!was&&G.found[o.id]){ const R=A.rooms[o.room];
      if(R&&R.hat) later(1.6,()=>d2aHat(R.hat));
      if(R&&R.diary) later(1.4,()=>d2aPlay('f_maze_diary',()=>{ G.pendingBless=(G.pendingBless||0)+1; later(0.8,offerPending); })); }
    return r; }; }
// ---- the wind seal on the Roost door (Skyreach l): a whirlwind stands in the doorway until the bells ring in order
function d2aWindGate(A,o){ if(!o||o.type!=='boss'||!o.link) return null; for(const id of [o.link.a,o.link.b]){ const R=A.rooms[id]; if(R&&R.wind&&!R.solved) return R; } return null; }
{ const base=refreshCaveGates; refreshCaveGates=function(){ base.apply(this,arguments); const A=AREA; if(!A||!A.d2a||!A.gates) return; for(const o of A.gates) if(d2aWindGate(A,o)) o.closed=true; }; }
{ const base=caveGatePrompt; caveGatePrompt=function(o){ const A=AREA; if(A&&A.d2a&&d2aWindGate(A,o)) return S('Look at the whirlwind','Look at the whirlwind'); return base.apply(this,arguments); }; }
{ const base=caveObjAct; caveObjAct=function(o){
    const A=AREA; if(A&&A.d2a&&o&&o.k==='cgate'&&d2aWindGate(A,o)){
      if(!o.opened&&hasBKey(A)){ o.opened=true; G.found[o.id]=true; SFX.play('chest'); }
      d2aSay([['narr',o.opened?S('The Boss Key turned in the lock, but a whirlwind still spins in the doorway, hard as a wall. It howls three notes over and over. Maybe the bells in this hall can calm it.','The door is unlocked. But a whirlwind blocks it. Ring the bells!'):S('A whirlwind spins in the great doorway, hard as a wall. Behind it, a door with a lock shaped like a flame. The whirlwind howls three notes: the bells in this hall might calm it.','A whirlwind blocks the door. Ring the bells! You also need the Boss Key.')]]); return true; }
    return base.apply(this,arguments); }; }
// bells that only the wind can ring (Skyreach j and l): hits do nothing, a ride past rings them
for(const f of ['hit','pound','ring']){ const base=P3K.wbell&&P3K.wbell[f]; if(base) P3K.wbell[f]=function(o){ const A=AREA, R=A&&A.d2a&&A.rooms[o.room]; if(R&&R.windOnly){ if(!(o.nope>G.time)){ o.nope=G.time+1.5; d2aFt(o.x,o.y-(o.h||70)-20,S('Only the wind can ring this bell. Ride past it!','Ride past it!'),'#ffe9a0',12,'windonly'); } return; } return base.apply(this,arguments); }; }
// ---- story beats in rooms (each once)
function d2aRoomBeats(A,dt){
  const X=A.d2a, p=player, R=caveRoomAt(p.x,p.y); if(scene!=='play'||DLG) return;
  if(R!==X.lastRoom){ X.lastRoom=R; if(R) d2aEnterRoom(A,R); }
  if(X.root==='f_maze'&&!canBlaze()&&!d2aSeen('f_maze_hjalmar_cold')){ const h=A.objs.find(o=>o.p3==='frozen'&&o.id==='f_hjalmar'&&o.st==='ice'); if(h&&dist(p.x,p.y,h.x,h.y)<120) d2aPlay('f_maze_hjalmar_cold'); }
}
function d2aEnterRoom(A,R){
  const X=A.d2a, id=R.id, fl=A.def.floor;
  if(X.root==='f_maze'){
    if(fl==='1'&&id==='f') d2aSoon('f_maze_pantry');
    if(fl==='1'&&id==='d'&&!R.solved) d2aTip('rink',S('The Block Rink','The Block Rink'),S('Push an ice block and it slides until something stops it. Slide both blocks onto the frozen plates. The rune stone puts them back.','Slide both blocks onto the plates!'));
    if(fl==='1'&&id==='g'&&!R.solved) d2aTip('gallery',S('The Sculpture Gallery','The Sculpture Gallery'),S('No ice sculpture stands in front of the chest. Something must stop you there.','How do you stop by the chest?'));
    if(fl==='1'&&id==='l'&&!R.solved) d2aTip('dam',S('The Ice Dam','The Ice Dam'),S('Melt every block of the dam. The frost vents grow it back: seal them with Blaze first.','Melt the dam! Seal the vents first.'));
    if(fl==='b1'&&id==='j'&&!R.solved&&canBlaze()) d2aTip('crevasse',S('Across the crevasse','Across the crevasse'),S('Blaze reaches far. Light the brazier on the other side.','Blue fire reaches far!'));
    if(fl==='b1'&&id==='n'&&!R.solved&&canBlaze()) d2aTip('forge',S('The Cold Forge','The Cold Forge'),S(`Four braziers, and each burns only ${R.timed||10} seconds. Melt the ice in front of them first, then light all four fast.`,`Light all four fast!`));
    if(fl==='b1'&&id==='k'&&!d2aFlood()) d2aTip('shaft',S('The Drip Shaft','The Drip Shaft'),S('A deep, dry shaft. Something big must have drained away up above. Water ran down here once.','A dry shaft. Water came from above once.'));
  } else {
    if(fl==='1'&&id==='e') d2aSoon('f_sky_hats');
    if(fl==='2'&&id==='i') d2aSoon('f_sky_lesson',()=>canWindride());
    if(fl==='3'&&id==='l'&&!R.solved) d2aTip('bells',S('The Bell Hall','The Bell Hall'),S('Ride past the bells to ring them. The mural knows the order. Hit the wind vane to change where the wind blows.','Ring the bells in order! Read the mural.'));
    if(fl==='2'&&id==='j'&&!R.solved&&canWindride()) d2aTip('junction',S('The Four Winds','The Four Winds'),S(`The wind vane picks which ribbon blows. Ring all three bells within ${Math.round((R.timed||40)*(p3Easy()?1.5:1))} seconds to wake the updraft.`,`Ring all three bells fast!`));
  }
}

// ---------- 10. art, baked: my cells, the crevasse, floors and walls in the three looks, the bridges
// Light from the upper left like everywhere; the plum outline colour for edges; cool blues for ice, warm gold for the sky.
const D2AP={
  ice:'#8cc6ee', ice2:'#9ccff2', iceHi:'#e9f7ff', iceLo:'#4f8fcf',
  slush:'#7f97ab', slushLo:'#5d7488', water:'#2f6db2', waterHi:'#7fb4e4', bed:'#a9b4bc', bedLo:'#8a96a0'
};
function d2aNb(c,k,fn){ const w=c.w, i=k%w; return {n:fn(k-w),s:fn(k+w),w:i>0?fn(k-1):false,e:i<w-1?fn(k+1):false}; }
{ const base=trialPaintCell; trialPaintCell=function(g,c,k,i,j,x,y,cs,st,rng,def){
    if(d2aDun(def)){ const t=c.typ[k];
      if(t>=230&&t<=239){ d2aPaintMine(g,c,k,i,j,x,y,cs,st,rng,def); return true; }
      if(t===TY.chasm&&def.theme!=='f_sky'){ d2aPaintCrevasse(g,c,k,i,j,x,y,cs,def,rng); return true; }
      if(t===TY.pit&&def.theme==='f_forge'){ d2aPaintCrevasse(g,c,k,i,j,x,y,cs,def,rng,true); return true; } }
    return base.apply(this,arguments); }; }
function d2aIceCell(g,x,y,cs,i,j,rng){
  const n=fbm(x*0.008,y*0.008,2); g.fillStyle=r2c((i+j)%2?D2AP.ice:D2AP.ice2,(n-0.5)*0.18); g.fillRect(x,y,cs,cs);
  // long glossy streaks, the same slant everywhere so a field of ice reads as one sheet
  g.strokeStyle='rgba(255,255,255,.32)'; g.lineWidth=2.2; g.beginPath(); const o=((i*17+j*31)%5)*7; g.moveTo(x+o,y+cs); g.lineTo(x+o+cs*0.55,y); g.stroke();
  g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=5; g.beginPath(); g.moveTo(x+o+16,y+cs); g.lineTo(x+o+16+cs*0.45,y+cs*0.18); g.stroke();
  if(rng()<0.35){ g.strokeStyle='rgba(60,110,170,.35)'; g.lineWidth=1; g.beginPath(); const sx=x+rng()*cs, sy=y+rng()*cs; g.moveTo(sx,sy); g.lineTo(sx+(rng()-0.5)*20,sy+(rng()-0.5)*14); g.lineTo(sx+(rng()-0.5)*26,sy+(rng()-0.5)*20); g.stroke(); }
  g.fillStyle='rgba(255,255,255,.75)'; if(rng()<0.4){ const sx=x+6+rng()*(cs-12), sy=y+6+rng()*(cs-12); g.fillRect(sx-0.8,sy-3,1.6,6); g.fillRect(sx-3,sy-0.8,6,1.6); }
}
function d2aWaterCell(g,x,y,cs,i,j,rng,col){ const n=fbm(x*0.006,y*0.006,2); g.fillStyle=r2c(col||D2AP.water,(n-0.5)*0.2); g.fillRect(x,y,cs,cs);
  g.strokeStyle='rgba(200,235,255,.16)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+5,y+cs*0.4+rng()*6); g.quadraticCurveTo(x+cs/2,y+cs*0.3,x+cs-5,y+cs*0.45); g.stroke(); }
function d2aPitCell(g,c,k,x,y,cs,col,lip){ g.fillStyle=col; g.fillRect(x,y,cs,cs); const up=k-c.w; const upOpen=c.grid[up]===0&&!d2aDeep(c,up);
  if(upOpen){ const gr=g.createLinearGradient(0,y,0,y+cs*0.7); gr.addColorStop(0,lip[0]); gr.addColorStop(0.5,lip[1]); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.7); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(x,y,cs,2); }
  else if(c.grid[up]===1){ g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(x,y,cs,cs*0.4); } }
const d2aDeep=(c,k)=>{ const t=c.typ[k]; return t===TY.chasm||t===TY.pit||((t===D2T.shaft||t===D2T.floatb)&&!d2aFlood()); };
function d2aPaintMine(g,c,k,i,j,x,y,cs,st,rng,def){
  const t=c.typ[k], fl=d2aFlood();
  switch(t){
    case D2T.slick: case D2T.puddle: {
      d2aIceCell(g,x,y,cs,i,j,rng);
      // a white rim where the ice meets floor, and a soft shade on the floor side
      const nb=d2aNb(c,k,q=>c.grid[q]===0&&c.typ[q]!==D2T.slick&&c.typ[q]!==D2T.puddle&&!d2aDeep(c,q));
      g.fillStyle='rgba(240,250,255,.85)'; if(nb.n) g.fillRect(x,y,cs,3); if(nb.w) g.fillRect(x,y,3,cs); if(nb.e) g.fillRect(x+cs-3,y,3,cs); if(nb.s) g.fillRect(x,y+cs-3,cs,3);
      const wl=d2aNb(c,k,q=>c.grid[q]===1&&c.typ[q]!==1); if(wl.n){ const gr=g.createLinearGradient(0,y,0,y+cs*0.5); gr.addColorStop(0,'rgba(30,50,110,.35)'); gr.addColorStop(1,'rgba(30,50,110,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.5); }
      if(t===D2T.puddle){ g.fillStyle='rgba(60,120,200,.55)'; g.beginPath(); g.ellipse(x+cs/2,y+cs/2,cs*0.4,cs*0.3,0,0,TAU); g.fill(); }
      return; }
    case D2T.slush: {
      g.fillStyle=D2AP.slush; g.fillRect(x,y,cs,cs); g.fillStyle=D2AP.slushLo; g.fillRect(x,y+cs*0.55,cs,cs*0.45);
      for(let q=0;q<4;q++){ g.fillStyle=q%2?'rgba(225,240,250,.8)':'rgba(190,214,232,.85)'; g.beginPath(); g.ellipse(x+4+rng()*(cs-8),y+4+rng()*(cs-8),3+rng()*5,2+rng()*3,rng()*3,0,TAU); g.fill(); }
      const nb=d2aNb(c,k,q=>c.grid[q]===0&&c.typ[q]!==D2T.slush); g.fillStyle='rgba(255,255,255,.5)'; if(nb.n) g.fillRect(x,y,cs,2.5); if(nb.w) g.fillRect(x,y,2.5,cs); if(nb.e) g.fillRect(x+cs-2.5,y,2.5,cs);
      g.fillStyle='rgba(20,40,70,.25)'; if(nb.s) g.fillRect(x,y+cs-3,cs,3);
      return; }
    case D2T.lake: {
      if(fl){ g.fillStyle=r2c(D2AP.bed,(rng()-0.5)*0.12); g.fillRect(x,y,cs,cs); g.strokeStyle='rgba(70,80,90,.45)'; g.lineWidth=1.2; g.beginPath(); for(let q=0;q<3;q++){ const sx=x+rng()*cs, sy=y+rng()*cs; g.moveTo(sx,sy); g.lineTo(sx+(rng()-0.5)*22,sy+(rng()-0.5)*16); } g.stroke();
        if(rng()<0.25){ g.fillStyle='rgba(120,170,220,.45)'; g.beginPath(); g.ellipse(x+cs/2,y+cs/2,8+rng()*8,4,0,0,TAU); g.fill(); } }
      else { d2aWaterCell(g,x,y,cs,i,j,rng,'#3a78bc'); if(rng()<0.3){ g.fillStyle='rgba(235,246,255,.85)'; g.beginPath(); g.ellipse(x+cs/2+(rng()-0.5)*16,y+cs/2,7+rng()*6,4,rng(),0,TAU); g.fill(); } }
      return; }
    case D2T.shaft: case D2T.floatb: {
      if(fl) d2aWaterCell(g,x,y,cs,i,j,rng,'#2a5c9e');
      else { d2aPitCell(g,c,k,x,y,cs,'#0c1424',['#7aa6cc','#2a3e60']); if(rng()<0.2){ g.fillStyle='rgba(120,170,220,.12)'; g.fillRect(x+rng()*cs,y+cs*0.5+rng()*cs*0.4,2,2); }
        if(t===D2T.floatb){ g.fillStyle='rgba(120,160,200,.35)'; rrect(g,x+8,y+12,cs-16,cs-20,5); g.fill(); g.strokeStyle='rgba(200,230,255,.25)'; g.lineWidth=1.2; g.stroke(); } }
      return; }
    case D2T.chute: {
      d2aIceCell(g,x,y,cs,i,j,rng);
      if(fl){ g.fillStyle='#0e2038'; g.beginPath(); g.ellipse(x+cs/2,y+cs/2,cs*0.42,cs*0.36,0,0,TAU); g.fill(); g.strokeStyle='#e9f7ff'; g.lineWidth=3; g.stroke(); }
      else { g.fillStyle='#bcd8ec'; g.beginPath(); g.ellipse(x+cs/2,y+cs/2,cs*0.42,cs*0.36,0,0,TAU); g.fill(); g.strokeStyle='rgba(70,110,160,.6)'; g.lineWidth=2; g.stroke();
        g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x+cs*0.3,y+cs*0.4); g.lineTo(x+cs*0.5,y+cs*0.55); g.lineTo(x+cs*0.7,y+cs*0.42); g.moveTo(x+cs*0.5,y+cs*0.55); g.lineTo(x+cs*0.48,y+cs*0.75); g.stroke(); }
      return; }
  }
  d2aIceCell(g,x,y,cs,i,j,rng);
}
// a crevasse in the glacier (deep blue dark, icy lips) or the black pit of the dead forge (an ember glow far down)
function d2aPaintCrevasse(g,c,k,i,j,x,y,cs,def,rng,forge){
  const ice=def.theme==='f_glacier'; const n=fbm(x*0.01,y*0.01,2);
  g.fillStyle=ice?r2c('#0e1c36',n*0.1):r2c('#0e0606',n*0.1); g.fillRect(x,y,cs,cs);
  if(!ice){ // far below: cold slag with the last embers in its cracks
    const gr=g.createRadialGradient(x+cs/2,y+cs*0.65,2,x+cs/2,y+cs*0.65,cs*0.75); gr.addColorStop(0,'rgba(200,70,30,.22)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs);
    g.strokeStyle='rgba(255,120,50,.32)'; g.lineWidth=1.2; g.beginPath(); const sx=x+rng()*cs, sy=y+cs*0.45+rng()*cs*0.5; g.moveTo(sx,sy); g.lineTo(sx+(rng()-0.5)*20,sy+(rng()-0.5)*10); g.lineTo(sx+(rng()-0.5)*26,sy+(rng()-0.5)*16); g.stroke();
    for(let q=0;q<3;q++){ g.fillStyle=`rgba(255,${120+((rng()*80)|0)},50,${0.2+rng()*0.4})`; g.fillRect(x+rng()*cs,y+cs*0.3+rng()*cs*0.7,1.8,1.8); } }
  d2aPitCell(g,c,k,x,y,cs,'rgba(0,0,0,0)',ice?['#cfe6f6','#3a5a8a']:['#8a7a76','#2a1c1a']);
  const lf=c.grid[k-1]===0&&!d2aDeep(c,k-1), rt=c.grid[k+1]===0&&!d2aDeep(c,k+1);
  if(lf){ g.fillStyle=ice?'rgba(200,230,255,.25)':'rgba(120,90,80,.35)'; g.fillRect(x,y,4,cs); }
  if(rt){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+cs-4,y,4,cs); }
  if(ice) for(let q=0;q<3;q++){ g.fillStyle=`rgba(150,200,255,${0.06+rng()*0.1})`; g.fillRect(x+rng()*cs,y+cs*0.4+rng()*cs*0.6,1.6,1.6); }
}
// floors and walls of the three looks, laid over the stock cave canvas
{ const base=renderCaveRooms; renderCaveRooms=function(A,def){ base.apply(this,arguments); if(d2aDun(def)&&A.canvas&&A.cave) try{ d2aPaint(A,def); }catch(e){ console.error(e); } }; }
function d2aPaint(A,def){
  const c=A.cave, cs=c.cell, w=c.w, g=A.canvas.getContext('2d'), th=def.theme, rng=mulberry32((def.seed|0)*11+5);
  g.save(); g.setTransform(A.canvasS,0,0,A.canvasS,0,0);
  const solid=q=>q<0||q>=c.typ.length||(c.grid[q]===1&&c.typ[q]!==1);
  const bridge=new Set(); for(const id in c.rooms){ const R=c.rooms[id]; if(R.bridge&&G.found[d2aSolvedKey(def,id)]) for(const [bc,br] of R.bridge) bridge.add((R.oy+1+br)*w+R.ox+1+bc); }
  for(let k=0;k<c.typ.length;k++){ const i=k%w, j=(k-i)/w, x=i*cs, y=j*cs, t=c.typ[k];
    // the pit cells again (the puzzle sigil of a brazier room is painted over everything by the stock canvas)
    if(c.grid[k]===0&&!bridge.has(k)&&((t===TY.pit&&th==='f_forge')||(t===TY.chasm&&th!=='f_sky'))){ d2aPaintCrevasse(g,c,k,i,j,x,y,cs,def,rng,th==='f_forge'); continue; }
    if(c.grid[k]===0&&t===0){
      if(bridge.has(k)){ d2aPaintBridge(g,x,y,cs,th,rng,c,k); continue; }
      if(j>0&&dunHq(c,k-w)===1) continue;       // the face of a raised floor above stays
      if(th==='f_glacier'){ const n=fbm(x*0.006,y*0.006,2); g.fillStyle=r2c((i+j)%2?'#dcebf5':'#d3e5f1',(n-0.5)*0.12); g.fillRect(x,y,cs,cs);
        g.strokeStyle='rgba(120,160,205,.35)'; g.lineWidth=1.3; g.strokeRect(x+1,y+1,cs-2,cs-2); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x+3,y+3,cs-6,2.5);
        if(rng()<0.3){ g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,5+rng()*9,2.5+rng()*3,rng()*3,0,TAU); g.fill(); }
        if(rng()<0.12){ g.fillStyle='rgba(150,190,230,.35)'; for(let q=0;q<2;q++){ const fx=x+10+q*14+rng()*6, fy=y+12+rng()*20; g.beginPath(); g.ellipse(fx,fy,3,4.5,0.3,0,TAU); g.fill(); } } }
      else if(th==='f_forge'){ const n=fbm(x*0.007,y*0.007,2); g.fillStyle=r2c((i+j)%2?'#5c5558':'#544e52',(n-0.5)*0.2); g.fillRect(x,y,cs,cs);
        g.strokeStyle='rgba(20,12,12,.55)'; g.lineWidth=1.6; g.strokeRect(x+1,y+1,cs-2,cs-2); g.fillStyle='rgba(255,220,180,.08)'; g.fillRect(x+3,y+3,cs-6,2.5);
        if(rng()<0.16){ g.strokeStyle='rgba(255,130,50,.5)'; g.lineWidth=1.6; g.beginPath(); const sx=x+rng()*cs, sy=y+rng()*cs; g.moveTo(sx,sy); g.lineTo(sx+(rng()-0.5)*24,sy+(rng()-0.5)*18); g.lineTo(sx+(rng()-0.5)*30,sy+(rng()-0.5)*26); g.stroke(); }
        if(rng()<0.2){ g.fillStyle='rgba(20,10,10,.3)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,6+rng()*6,3,rng()*3,0,TAU); g.fill(); } }
      else { const tl=['#f4eee2','#ebe4d6','#f8f3ea','#e4dccc'][((i*3+j*5)^(i>>1))&3]; g.fillStyle=tl; g.fillRect(x,y,cs,cs);
        g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x+2,y+2,cs-4,3); g.strokeStyle='rgba(190,150,80,.35)'; g.lineWidth=1.2; g.strokeRect(x+0.5,y+0.5,cs-1,cs-1);
        if(i%3===0){ g.fillStyle='rgba(220,180,90,.5)'; g.fillRect(x,y,2,cs); } if(j%3===0){ g.fillStyle='rgba(220,180,90,.5)'; g.fillRect(x,y,cs,2); }
        if(rng()<0.25){ g.strokeStyle='rgba(150,140,120,.22)'; g.lineWidth=1; g.beginPath(); g.moveTo(x+rng()*cs,y); g.bezierCurveTo(x+rng()*cs,y+cs*0.3,x+rng()*cs,y+cs*0.7,x+rng()*cs,y+cs); g.stroke(); } }
      // soft shade along walls
      if(solid(k-w)){ const gr=g.createLinearGradient(0,y,0,y+cs*0.55); gr.addColorStop(0,`rgba(${th==='f_sky'?'120,90,40,.3':'30,40,80,.4'})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.55); }
      if(solid(k-1)){ g.fillStyle=th==='f_sky'?'rgba(120,90,40,.16)':'rgba(30,40,80,.2)'; g.fillRect(x,y,cs*0.25,cs); }
      if(solid(k+1)){ g.fillStyle=th==='f_sky'?'rgba(120,90,40,.1)':'rgba(30,40,80,.14)'; g.fillRect(x+cs*0.78,y,cs*0.22,cs); }
      // a bright lip where the floor ends at a drop
      const dn=k+w; if(dn<c.typ.length&&c.grid[dn]===0&&d2aDeep(c,dn)){ g.fillStyle=th==='f_sky'?'rgba(255,226,140,.8)':th==='f_forge'?'rgba(230,160,110,.6)':'rgba(240,250,255,.8)'; g.fillRect(x,y+cs-3,cs,3); }
    }
    // wall tops and faces next to a floor: snow and icicles, embers, gold
    if(solid(k)&&k+w<c.typ.length&&!solid(k+w)&&j<c.h-1){ const fy=y+cs*0.6;
      if(th==='f_glacier'){ g.fillStyle='rgba(250,253,255,.95)'; g.beginPath(); g.moveTo(x,fy+1); for(let q=0;q<=4;q++) g.quadraticCurveTo(x+q*cs/4-cs/8,fy-5-rng()*4,x+q*cs/4,fy+1); g.lineTo(x+cs,fy+4); g.lineTo(x,fy+4); g.fill();
        g.fillStyle='rgba(225,242,255,.95)'; for(let q=0;q<3;q++){ if(rng()<0.45) continue; const ix=x+6+q*14+rng()*6, ih=6+rng()*10; g.beginPath(); g.moveTo(ix-3,fy+3); g.lineTo(ix+3,fy+3); g.lineTo(ix,fy+3+ih); g.closePath(); g.fill(); } }
      else if(th==='f_forge'){ if(rng()<0.35){ g.strokeStyle='rgba(255,120,40,.6)'; g.lineWidth=1.6; g.beginPath(); const sx=x+4+rng()*(cs-8); g.moveTo(sx,fy+4); g.lineTo(sx+(rng()-0.5)*10,fy+10); g.lineTo(sx+(rng()-0.5)*14,y+cs-2); g.stroke(); }
        g.fillStyle='rgba(240,170,110,.35)'; g.fillRect(x,fy-1,cs,2); }
      else { g.fillStyle='rgba(255,214,120,.85)'; g.fillRect(x,fy-2,cs,2.5); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(x,y,cs,2); if(i%2===0){ g.fillStyle='rgba(255,214,120,.6)'; g.beginPath(); g.arc(x+cs/2,fy+cs*0.2,2.4,0,TAU); g.fill(); } } }
  }
  g.restore();
}
function d2aPaintBridge(g,x,y,cs,th,rng,c,k){
  const w=c.w, vert=c.grid[k-1]===1||(k%w>0&&c.typ[k-1]!==0&&c.typ[k+1]!==0&&false);
  g.fillStyle=th==='f_forge'?'#140c0c':'#0e1c36'; g.fillRect(x,y,cs,cs);
  if(th==='f_forge'){ g.fillStyle='#4a4446'; g.fillRect(x,y+6,cs,cs-12); g.fillStyle='#6a6266'; g.fillRect(x,y+6,cs,4); g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(x,y+cs-10,cs,4);
    g.fillStyle='#c8784a'; for(const q of [6,cs-6]) { g.beginPath(); g.arc(x+q,y+cs/2,2.4,0,TAU); g.fill(); } g.strokeStyle='rgba(255,140,60,.5)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x,y+cs/2); g.lineTo(x+cs,y+cs/2); g.stroke(); }
  else { g.fillStyle='#b8dcf4'; g.fillRect(x,y+5,cs,cs-10); g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(x,y+5,cs,3); g.fillStyle='rgba(50,90,150,.35)'; g.fillRect(x,y+cs-9,cs,4);
    g.strokeStyle='rgba(255,255,255,.4)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x+rng()*cs,y+8); g.lineTo(x+rng()*cs,y+cs-8); g.stroke(); }
}
// the minimap: ice, slush, water and the dry shaft get their colours
{ const base=renderCaveMini; renderCaveMini=function(A){ base.apply(this,arguments); const c=A.cave, mm=A.mini; if(!mm||!A.d2a) return; const mg=mm.getContext('2d'), im=mg.getImageData(0,0,c.w,c.h); let ch=false, fl=d2aFlood();
    for(let k=0;k<c.typ.length;k++){ const t=c.typ[k]; if(t<230||t>239||c.grid[k]!==0) continue; const a=k*4; if(im.data[a]===10&&im.data[a+1]===8) continue; const dim=im.data[a]+im.data[a+1]+im.data[a+2]<150?0.55:1;
      const v=t===D2T.slick||t===D2T.puddle||t===D2T.chute?[150,200,240]:t===D2T.slush?[110,130,150]:t===D2T.lake?(fl?[150,150,140]:[60,110,180]):fl?[50,96,160]:[14,16,24];
      im.data[a]=v[0]*dim; im.data[a+1]=v[1]*dim; im.data[a+2]=v[2]*dim; ch=true; }
    if(ch) mg.putImageData(im,0,0); }; }

// ---------- 11. art, live: frozen slush, puddles, floodwater, plates, vents breathing, wheel bridges, drafts; the objects
{ const base=drawTrialFloor; drawTrialFloor=function(A,t){ base.apply(this,arguments); if(A&&A.d2a) try{ d2aFloor(A,t); }catch(e){ console.error(e); } }; }
function d2aFloor(A,t){
  const X=A.d2a, c=A.cave, cs=c.cell, w=c.w, fl=d2aFlood();
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+W/zoom-A.x0)/cs)+1);
  const j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+H/zoom-A.y0)/cs)+1);
  const vis=k=>{ const i=k%w, j=(k-i)/w; return i>=i0&&i<=i1&&j>=j0&&j<=j1; };
  // floodwater in the Drip Shaft: slow ripples, and the ice blocks that floated up, bobbing
  if(fl&&X.root==='f_maze'){ ctx.lineWidth=1.6;
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*w+i, ty=c.typ[k]; if(ty!==D2T.shaft&&ty!==D2T.floatb&&ty!==D2T.chute) continue; const x=A.x0+i*cs, y=A.y0+j*cs;
      if(ty===D2T.chute){ ctx.save(); ctx.translate(x+cs/2,y+cs/2); ctx.strokeStyle='rgba(170,215,255,.75)'; ctx.lineWidth=2.4; for(let q=0;q<3;q++){ ctx.beginPath(); ctx.arc(0,0,cs*(0.12+q*0.09),t*4+q*2,t*4+q*2+2.2); ctx.stroke(); } ctx.restore(); continue; }
      if(X.frz.has(k)) continue;
      const ph=t*1.5+i*0.8+j*1.2; ctx.strokeStyle=`rgba(200,235,255,${0.12+0.08*Math.sin(ph)})`; ctx.beginPath(); ctx.moveTo(x+5,y+cs*0.55+Math.sin(ph)*3); ctx.quadraticCurveTo(x+cs/2,y+cs*0.45+Math.sin(ph+1)*3,x+cs-5,y+cs*0.6+Math.sin(ph+2)*3); ctx.stroke();
      if(ty===D2T.floatb){ const bob=Math.sin(t*2+i+j)*1.6; p3Sh(x+cs/2+3,y+cs/2+8,cs*0.4,cs*0.18,0.3); p3Put(d2aFloeSpr(),x+cs/2,y+cs*0.82+bob); } } }
  // slush and water frozen by a vent: a sheet of new ice that flickers before it breaks up
  for(const [k,tl] of X.frz){ if(!vis(k)) continue; const q=tPos(k), x=q.x-cs/2, y=q.y-cs/2, fl2=tl<1?0.55+0.45*Math.abs(Math.sin(t*14)):1, a=clamp(tl/0.4,0,1)*fl2;
    ctx.fillStyle=`rgba(160,212,246,${0.9*a})`; ctx.fillRect(x,y,cs,cs); ctx.strokeStyle=`rgba(255,255,255,${0.5*a})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+6,y+cs-4); ctx.lineTo(x+cs*0.6,y+4); ctx.stroke();
    ctx.fillStyle=`rgba(240,250,255,${0.8*a})`; ctx.fillRect(x,y,cs,2); if(tl<1){ ctx.strokeStyle=`rgba(60,100,150,${0.5*a})`; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x+cs*0.2,y+cs*0.3); ctx.lineTo(x+cs*0.5,y+cs*0.6); ctx.lineTo(x+cs*0.8,y+cs*0.4); ctx.stroke(); } }
  // puddles from melted blocks
  for(const k of X.pud){ if(!vis(k)) continue; const q=tPos(k); ctx.fillStyle='rgba(50,110,190,.55)'; ctx.beginPath(); ctx.ellipse(q.x,q.y+2,cs*0.42,cs*0.3,0,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(225,245,255,.7)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.ellipse(q.x-4,q.y-2,cs*0.2,cs*0.08,0,Math.PI,TAU); ctx.stroke();
    const r=(t*0.8+k*0.37)%1; ctx.strokeStyle=`rgba(225,245,255,${0.4*(1-r)})`; ctx.beginPath(); ctx.ellipse(q.x,q.y+2,cs*0.4*r,cs*0.28*r,0,0,TAU); ctx.stroke(); }
  // plates
  for(const o of X.plates){ if(!inView(o.x,o.y,40)) continue; const on=o.pressed; ctx.fillStyle='rgba(30,40,80,.25)'; ctx.beginPath(); ctx.ellipse(o.x+2,o.y+4,19,13,0,0,TAU); ctx.fill();
    ctx.fillStyle=o.ice?(on?'#bfe6ff':'#9cc6e2'):(on?'#e8d8a8':'#c8b890'); ctx.beginPath(); ctx.ellipse(o.x,o.y+(on?2:0),18,12,0,0,TAU); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.6; ctx.stroke();
    ctx.strokeStyle=on?'rgba(255,240,170,.95)':'rgba(70,90,130,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(o.x-8,o.y); ctx.lineTo(o.x,o.y-6); ctx.lineTo(o.x+8,o.y); ctx.lineTo(o.x,o.y+6); ctx.closePath(); ctx.stroke(); if(on) glowAt(o.x,o.y,26,'255,236,170',0.35); }
  // the frost vents: frost gathers along the line before a breath, white wind while it blows
  for(const v of X.vents){ if(!inView(v.x,v.y,cs*v.len+40)) continue;
    if(v.warn){ const k=1-((v.per-((X.t+v.ph)%v.per))/D2AN.vwarn); for(const q0 of v.cells){ const q=tPos(q0); ctx.strokeStyle=`rgba(225,245,255,${0.25+0.45*k})`; ctx.lineWidth=1.6; for(let n=0;n<2;n++){ const sx=q.x+((q0*7+n*19)%30)-15, sy=q.y+((q0*11+n*13)%24)-12; ctx.beginPath(); ctx.moveTo(sx-4*k,sy); ctx.lineTo(sx+4*k,sy); ctx.moveTo(sx,sy-4*k); ctx.lineTo(sx,sy+4*k); ctx.stroke(); } } }
    if(v.blow>0){ const a=v.blow/D2AN.vblow; ctx.strokeStyle=`rgba(255,255,255,${0.55*a})`; ctx.lineWidth=3; ctx.lineCap='round'; for(const q0 of v.cells){ const q=tPos(q0); for(let n=0;n<2;n++){ const f=((t*3+n*0.5+q0*0.13)%1), px=q.x+v.dx*(f-0.5)*cs+(v.dy?(n-0.5)*18:0), py=q.y+v.dy*(f-0.5)*cs+(v.dx?(n-0.5)*18:0); ctx.beginPath(); ctx.moveTo(px-v.dx*12,py-v.dy*12); ctx.lineTo(px+v.dx*8,py+v.dy*8); ctx.stroke(); } } } }
  // a spinning prayer wheel's little bridge of gold-trimmed planks
  for(const k of X.cover){ if(!vis(k)) continue; const q=tPos(k), x=q.x-cs/2, y=q.y-cs/2; ctx.fillStyle='rgba(40,30,60,.3)'; ctx.fillRect(x,y+cs-6,cs,6); ctx.fillStyle='#c89a5a'; ctx.fillRect(x,y+4,cs,cs-10); ctx.fillStyle='#a87a3a'; for(let n=1;n<4;n++) ctx.fillRect(x+n*cs/4,y+4,2,cs-10); ctx.fillStyle='#ffd870'; ctx.fillRect(x,y+4,cs,3); ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.4; ctx.strokeRect(x,y+4,cs,cs-10); }
  // updrafts and downdrafts between the temple floors
  for(const o of X.portals){ if(!inView(o.x,o.y,80)) continue;
    if(o.look==='updraft'||o.look==='down'){ const on=d2aPortalOK(A,o), up=o.look==='updraft'; ctx.save(); ctx.translate(o.x,o.y); ctx.fillStyle=on?'rgba(230,245,255,.35)':'rgba(200,210,225,.18)'; ctx.beginPath(); ctx.ellipse(0,4,22,9,0,0,TAU); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.4; ctx.stroke();
      ctx.strokeStyle=on?'rgba(255,255,255,.8)':'rgba(255,255,255,.3)'; ctx.lineWidth=2.2; ctx.lineCap='round';
      for(let n=0;n<4;n++){ const f=((t*(on?1.4:0.5)+n*0.25)%1), yy=up?-f*70:-(1-f)*70, a=Math.sin(f*Math.PI); ctx.globalAlpha=a; ctx.beginPath(); ctx.ellipse(0,yy,10+6*(up?f:1-f),3.5,0,0.3+n,0.3+n+3.6); ctx.stroke(); }
      ctx.globalAlpha=1; ctx.restore(); }
    else if(o.look==='chute'&&!fl){ /* baked */ } }
  // prayer flags and chimes along the north wall of a room that has them
  for(const id in A.rooms){ const R=A.rooms[id]; if(!(R.flags||R.chimes)||!inView(R.cx,R.y0,R.x1-R.x0)) continue; d2aFlags(R,t); }
  // the whirlwind in the Roost doorway
  // (the whirlwind in the Roost doorway is an object, DUN_DRAW.d2awhirl, so it stands in front of the door)
}
function d2aFloeSpr(){ return p3Spr('d2a_floe',40,22,g=>{ g.fillStyle='#d8eefc'; rrect(g,-19,-20,38,18,7); g.fill(); g.fillStyle='#a8d0ee'; rrect(g,-19,-8,38,8,4); g.fill(); g.fillStyle='rgba(255,255,255,.8)'; rrect(g,-14,-17,18,3,1.5); g.fill(); }); }
function d2aFlags(R,t){
  const y=R.y0+10, x0=R.x0+30, x1=R.x1-30, n=Math.floor((x1-x0)/26), cols=['#e84a3a','#ffd84a','#3aa860','#3a7ae8','#f4f2ea'];
  ctx.strokeStyle='#6a4a2a'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x0,y); ctx.quadraticCurveTo((x0+x1)/2,y+26,x1,y); ctx.stroke();
  if(R.flags) for(let i=1;i<n;i++){ const f=i/n, x=lerp(x0,x1,f), yy=y+26*4*f*(1-f)*0.5+0, sw=Math.sin(t*3+i)*3; ctx.fillStyle=cols[i%5]; ctx.beginPath(); ctx.moveTo(x-7,yy); ctx.lineTo(x+7,yy); ctx.lineTo(x+sw,yy+16); ctx.closePath(); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=1; ctx.stroke(); }
  if(R.chimes) for(const f of [0.25,0.5,0.75]){ const x=lerp(x0,x1,f), yy=y+13, sw=Math.sin(t*2.4+f*9)*4; ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,yy); ctx.lineTo(x+sw*0.3,yy+10); ctx.stroke(); for(let q=-1;q<=1;q++){ ctx.fillStyle='#ffd870'; ctx.fillRect(x+q*5+sw*0.5-1,yy+10,2.4,10+Math.abs(q)*-3+6); } }
}
function d2aWhirl(x,y,t){ ctx.save(); ctx.translate(x,y); ctx.lineCap='round';
  ctx.fillStyle='rgba(120,150,230,.16)'; ctx.beginPath(); ctx.ellipse(0,-34,58,44,0,0,TAU); ctx.fill();
  for(let n=0;n<6;n++){ const a=t*6+n*1.05, r=22+n*7, yy=-12-n*10;
    ctx.strokeStyle=`rgba(59,34,51,${0.45-n*0.05})`; ctx.lineWidth=5.6-n*0.5; ctx.beginPath(); ctx.ellipse(0,yy,r,r*0.34,0,a,a+3.6); ctx.stroke();
    ctx.strokeStyle=n%2?'rgba(150,190,255,.95)':'rgba(200,180,255,.95)'; ctx.lineWidth=3.4-n*0.35; ctx.beginPath(); ctx.ellipse(0,yy,r,r*0.34,0,a,a+3.6); ctx.stroke(); }
  ctx.restore(); }
// ---- the objects (drawn among the figures, sorted by their foot)
DUN_DRAW.d2awhirl=(g,t)=>{ if(!AREA||!d2aWindGate(AREA,g)) return; d2aWhirl(g.x,g.y+18,t); if(Math.random()<0.25) emit(g.x+rand(-40,40),g.y+rand(0,24),1,{col:'230,240,255',glow:false,ang:rand(0,TAU),spread:0.4,smin:40,smax:120,lmin:.2,lmax:.4,zmin:1.2,zmax:2.4,drag:2,alpha:0.6}); };
DUN_DRAW.d2ablock=(b,t)=>{ if(b.gone) return; const A=AREA, cs=A.cave.cell, y=b.y+cs*0.42;
  p3Sh(b.x+3,y-2,24,8,0.28);
  if(b.kind==='stone'){ p3Put(d2aStoneSpr(),b.x,y-b.z); }
  else { p3Put(d2aIceBlkSpr(),b.x,y-b.z); if(b.heat>0) p3HeatOverlay(b.x,y-b.z,44,40,clamp(b.heat/p3Need(D2AN.melt),0,1),t); }
  if(AREA.d2a.pushB===b&&AREA.d2a.pushT>0.05){ ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(b.x,y-58,8,-Math.PI/2,-Math.PI/2+TAU*clamp(AREA.d2a.pushT/D2AN.push,0,1)); ctx.stroke(); } };
function d2aIceBlkSpr(){ return p3Spr('d2a_iceblk',46,50,g=>p3IceBlockArt(g,44,12,34)); }
function d2aStoneSpr(){ return p3Spr('d2a_stoneblk',46,52,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-22+dx,-36+dy,44,36); },'#a49a8c',{r:22}); g.fillStyle='#c8beb0'; rrect(g,-22,-48,44,14,5); g.fill();
  g.strokeStyle='rgba(60,40,30,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(-10,-26); g.lineTo(0,-14); g.lineTo(10,-26); g.moveTo(0,-14); g.lineTo(0,-6); g.stroke(); g.fillStyle='rgba(255,236,190,.45)'; g.fillRect(-18,-45,22,3);
  g.fillStyle='#8a6a3a'; g.fillRect(-23,-30,46,3); g.fillStyle='#c8a050'; for(const x of [-14,0,14]){ g.beginPath(); g.arc(x,-28.5,2,0,TAU); g.fill(); } }); }
DUN_DRAW.d2avent=(v,t)=>{ const sp=d2aVentSpr(v.dx,v.dy); p3Put(sp,v.x,v.y+14);
  const mx=v.x, my=v.y+3;
  if(v.seal>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(mx,my,20,'255,150,60',0.55+0.15*Math.sin(t*8)); ctx.restore(); if(Math.random()<0.1) emit(mx,my-4,1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:10,smax:40,lmin:.3,lmax:.5,zmin:2,zmax:4,grow:3}); }
  else if(v.warn){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(mx,my,24,'170,220,255',0.35+0.35*Math.sin(t*16)); ctx.restore(); if(Math.random()<0.4) emit(mx+rand(-8,8),my-2,1,{col:'230,246,255',glow:false,ang:-Math.PI/2,spread:0.6,smin:10,smax:40,lmin:.3,lmax:.6,zmin:1.2,zmax:2.4}); }
  if(v.heat>0) p3HeatOverlay(v.x,v.y+14,36,22,clamp(v.heat/p3Need(1),0,1),t); };
// a frost vent: a round stone mouth in the floor rimmed with frost, a carved notch showing which way it breathes
function d2aVentSpr(dx,dy){ return p3Spr('d2a_vent'+dx+'_'+dy,46,28,g=>{
  g.fillStyle='rgba(40,30,60,.25)'; g.beginPath(); g.ellipse(3,-8,22,10,0,0,TAU); g.fill();
  celFill(g,(q,ox,oy)=>{ q.moveTo(21+ox,-11+oy); q.ellipse(0+ox,-11+oy,21,11,0,0,TAU); },'#8e9cb0',{r:20});
  g.fillStyle='#16223c'; g.beginPath(); g.ellipse(0,-12,12.5,6.5,0,0,TAU); g.fill();
  g.fillStyle='rgba(150,210,255,.6)'; g.beginPath(); g.ellipse(1,-11,7,3.4,0,0,TAU); g.fill();
  for(let i=0;i<9;i++){ const a=i/9*TAU+0.3, x=Math.cos(a)*19, y=-11+Math.sin(a)*10; g.fillStyle='#f2f9ff'; g.beginPath(); g.moveTo(x-2.5,y); g.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*5); g.lineTo(x+2.5,y); g.closePath(); g.fill(); }
  const nx=dx*20, ny=-11+dy*10; g.fillStyle='#ffd870'; g.beginPath(); g.moveTo(nx+dx*6,ny+dy*4); g.lineTo(nx-dy*5,ny+dx*4); g.lineTo(nx+dy*5,ny-dx*4); g.closePath(); g.fill(); g.strokeStyle=SBC.outline; g.lineWidth=1.2; g.stroke(); }); }
DUN_DRAW.d2asculpt=(o,t)=>{ const sp=d2aSculptSpr(o.name); p3Sh(o.x+3,o.y+16,22,7,0.25); p3Put(sp,o.x,o.y+18); ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x-6,o.y-26,20,'200,235,255',0.12+0.06*Math.sin(t*2+o.x)); ctx.restore(); };
function d2aSculptSpr(nm){ return p3Spr('d2a_sc_'+nm,46,70,g=>{
  const I='#bfe2f8', I2='#d8eefc', D='#7fb4e0'; const blob=(x,y,rx,ry,col)=>celFill(g,(q,dx,dy)=>{ q.moveTo(x+rx+dx,y+dy); q.ellipse(x+dx,y+dy,rx,ry,0,0,TAU); },col||I,{r:Math.max(rx,ry)});
  // a snowy plinth under every sculpture
  celFill(g,(q,dx,dy)=>{ q.rect(-18+dx,-10+dy,36,10); },'#e8f2fa',{r:16}); g.fillStyle='#fbfdff'; rrect(g,-20,-13,40,6,3); g.fill();
  if(nm==='cake'){ for(const [y,w,h] of [[-13,34,14],[-27,26,12],[-39,18,10]]) celFill(g,(q,dx,dy)=>{ q.rect(-w/2+dx,y-h+dy,w,h); },I,{r:w/2}); g.fillStyle=I2; for(const [y,w] of [[-27,34],[-39,26],[-49,18]]){ g.beginPath(); g.ellipse(0,y,w/2,3,0,0,TAU); g.fill(); } g.fillStyle=I; g.fillRect(-2,-62,4,13); blob(0,-66,3.5,5.5,I2); }
  else if(nm==='granny'){ blob(0,-30,15,18); blob(0,-52,9,9,I2); blob(0,-62,5,4.5); g.strokeStyle=D; g.lineWidth=1.4; g.beginPath(); g.arc(-3.5,-52,2.6,0,TAU); g.arc(3.5,-52,2.6,0,TAU); g.stroke(); g.strokeStyle=D; g.beginPath(); g.moveTo(-10,-28); g.lineTo(-2,-36); g.moveTo(10,-28); g.lineTo(2,-36); g.stroke(); blob(0,-26,5,4,I2); }
  else if(nm==='twins'){ for(const s of [-1,1]){ blob(s*9,-26,8,13); blob(s*9,-43,6.5,6.5,I2); } g.strokeStyle=I2; g.lineWidth=3; g.beginPath(); g.moveTo(-3,-28); g.lineTo(3,-28); g.stroke(); }
  else if(nm==='reader'){ blob(0,-24,14,12); blob(0,-42,8,8,I2); celFill(g,(q,dx,dy)=>{ q.moveTo(-13+dx,-30+dy); q.lineTo(0+dx,-26+dy); q.lineTo(13+dx,-30+dy); q.lineTo(13+dx,-22+dy); q.lineTo(0+dx,-18+dy); q.lineTo(-13+dx,-22+dy); q.closePath(); },I2,{r:12}); g.strokeStyle=D; g.lineWidth=1; g.beginPath(); g.moveTo(0,-26); g.lineTo(0,-18); g.stroke(); }
  else if(nm==='sleeper'){ blob(4,-18,17,8); blob(-14,-21,7,6,I2); blob(-19,-15,9,4,I2); g.fillStyle=D; g.font='bold 9px sans-serif'; g.fillText('z',8,-34); g.fillText('z',14,-42); }
  else { celFill(g,(q,dx,dy)=>{ q.moveTo(0+dx,-62+dy); q.bezierCurveTo(14+dx,-42+dy,16+dx,-26+dy,0+dx,-14+dy); q.bezierCurveTo(-16+dx,-26+dy,-12+dx,-42+dy,0+dx,-62+dy); },I,{r:16}); celFill(g,(q,dx,dy)=>{ q.moveTo(0+dx,-44+dy); q.bezierCurveTo(7+dx,-34+dy,7+dx,-24+dy,0+dx,-18+dy); q.bezierCurveTo(-7+dx,-24+dy,-6+dx,-34+dy,0+dx,-44+dy); },I2,{r:8}); }
  g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(-8,-40,2,10); }); }
DUN_DRAW.d2aladder=(o,t)=>{ p3Put(p3Spr('d2a_ladder',30,84,g=>{ for(const s of [-10,10]) celFill(g,(q,dx,dy)=>{ q.rect(s-2.5+dx,-84+dy,5,84); },'#9a6a3a',{r:6}); for(let y=-76;y<-4;y+=12) celFill(g,(q,dx,dy)=>{ q.rect(-10+dx,y+dy,20,3.5); },'#b8844a',{r:4}); g.fillStyle='#e8f4ff'; for(let y=-80;y<-8;y+=24){ g.fillRect(-12,y,3,5); g.fillRect(9,y+10,3,5); } }),o.x,o.y+AREA.cave.cell*0.5); };
DUN_DRAW.d2ascreen=(g,t)=>{ const o=g, a=o.closed?1:0.25; ctx.globalAlpha=a; p3Put(p3Spr('d2a_screen',44,52,q=>{ celFill(q,(p,dx,dy)=>{ p.rect(-20+dx,-50+dy,40,50); },'#b8844a',{r:20}); q.fillStyle='rgba(60,30,20,.35)'; for(let x=-12;x<20;x+=8) q.fillRect(x,-48,2,46); q.fillStyle='#ffd870'; q.fillRect(-20,-50,40,4); q.fillRect(-20,-4,40,4); q.fillStyle='#c83a2a'; q.beginPath(); q.arc(0,-26,6,0,TAU); q.fill(); }),o.x,o.y+20); ctx.globalAlpha=1; };
DUN_DRAW.d2aprop=(o,t)=>{ const sp=d2aPropSpr(o.t); if(!sp) return; if(o.t!=='chain') p3Sh(o.x+2,o.y+10,16,5,0.22); p3Put(sp,o.x,o.y+(o.t==='chain'?-10:12)); };
function d2aPropSpr(k){ return p3Spr('d2a_p_'+k,44,k==='chain'?96:44,g=>{
  if(k==='jar'){ celFill(g,(q,dx,dy)=>{ q.moveTo(-10+dx,-2+dy); q.quadraticCurveTo(-16+dx,-18+dy,-9+dx,-26+dy); q.lineTo(9+dx,-26+dy); q.quadraticCurveTo(16+dx,-18+dy,10+dx,-2+dy); q.closePath(); },'#c8784a',{r:13}); g.fillStyle='#e8e2d8'; rrect(g,-10,-31,20,6,2); g.fill(); g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(-7,-22,3,12); }
  else if(k==='sack'){ celFill(g,(q,dx,dy)=>{ q.moveTo(-14+dx,0+dy); q.quadraticCurveTo(-18+dx,-24+dy,-4+dx,-28+dy); q.lineTo(4+dx,-28+dy); q.quadraticCurveTo(18+dx,-24+dy,14+dx,0+dy); q.closePath(); },'#c8a870',{r:15}); g.strokeStyle='#7a5a32'; g.lineWidth=2; g.beginPath(); g.moveTo(-5,-24); g.lineTo(5,-24); g.stroke(); }
  else if(k==='anvil'){ celFill(g,(q,dx,dy)=>{ q.rect(-10+dx,-14+dy,20,14); },'#6a4a2a',{r:10}); celFill(g,(q,dx,dy)=>{ q.moveTo(-20+dx,-26+dy); q.lineTo(16+dx,-26+dy); q.quadraticCurveTo(22+dx,-24+dy,14+dx,-19+dy); q.lineTo(8+dx,-19+dy); q.lineTo(6+dx,-14+dy); q.lineTo(-6+dx,-14+dy); q.lineTo(-8+dx,-19+dy); q.lineTo(-20+dx,-21+dy); q.closePath(); },'#4a4a54',{r:16}); g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(-16,-25,22,2); }
  else if(k==='chain'){ g.strokeStyle='#5a5a66'; g.lineWidth=3; for(let y=-92;y<-4;y+=10){ g.beginPath(); g.ellipse(0,y,3.5,5.5,0,0,TAU); g.stroke(); } celFill(g,(q,dx,dy)=>{ q.moveTo(-6+dx,-6+dy); q.lineTo(6+dx,-6+dy); q.lineTo(0+dx,6+dy); q.closePath(); },'#6a6a76',{r:6}); }
  else if(k==='channel'){ g.fillStyle='#2a2224'; rrect(g,-20,-10,40,10,4); g.fill(); g.fillStyle='#5a3a30'; rrect(g,-17,-8,34,5,2); g.fill(); g.strokeStyle='rgba(255,120,50,.35)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(-14,-6); g.lineTo(14,-6); g.stroke(); }
  else if(k==='hats'){ const H=[['#c84a3a',0],['#3a7ae8',1],['#e8a030',2],['#3aa860',3],['#f4f2ea',4]]; for(const [col,n] of H){ const x=-12+((n*11)%24), y=-4-n*6; celFill(g,(q,dx,dy)=>{ q.moveTo(x-9+dx,y+dy); q.quadraticCurveTo(x+dx,y-12+dy,x+9+dx,y+dy); q.closePath(); },col,{r:8}); g.fillStyle=sbTone(col,-0.3); g.fillRect(x-10,y-1,20,2.5); } }
  else if(k==='kite'){ celFill(g,(q,dx,dy)=>{ q.moveTo(0+dx,-40+dy); q.lineTo(12+dx,-24+dy); q.lineTo(0+dx,-6+dy); q.lineTo(-12+dx,-24+dy); q.closePath(); },'#e84a3a',{r:14}); g.strokeStyle='#ffd870'; g.lineWidth=1.6; g.beginPath(); g.moveTo(0,-40); g.lineTo(0,-6); g.moveTo(-12,-24); g.lineTo(12,-24); g.stroke(); g.strokeStyle='#6a4a2a'; g.lineWidth=1; g.beginPath(); g.moveTo(0,-6); g.quadraticCurveTo(8,0,2,6); g.stroke(); }
  else return null; }); }
// tObj twins (cgate objects with an E prompt): the steak, the wheels, the hat, the mural
DUN_DRAW.d2a_steak=(o,t)=>{ if(G.found[o.id]) return; const free=G.found[o.id+'_ice']; p3Sh(o.x+3,o.y+14,24,7,0.28);
  p3Put(p3Spr('d2a_steak',46,30,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-16+dx,-6+dy); q.bezierCurveTo(-20+dx,-24+dy,10+dx,-30+dy,16+dx,-14+dy); q.bezierCurveTo(18+dx,-4+dy,-6+dx,0+dy,-16+dx,-6+dy); },'#c8503a',{r:16}); g.fillStyle='#f4e8d8'; g.beginPath(); g.ellipse(-2,-14,6,4,0.3,0,TAU); g.fill(); celFill(g,(q,dx,dy)=>{ q.rect(12+dx,-15+dy,14,5); },'#f4ecd8',{r:6}); g.fillStyle='#f4ecd8'; g.beginPath(); g.arc(26,-15,3.4,0,TAU); g.arc(26,-10,3.4,0,TAU); g.fill(); }),o.x,o.y+12);
  if(!free){ ctx.globalAlpha=0.72; p3Put(p3Spr('d2a_steakice',50,52,g=>p3IceBlockArt(g,48,12,38,{noSnow:true})),o.x,o.y+16); ctx.globalAlpha=1; if(o.heat>0) p3HeatOverlay(o.x,o.y+16,48,40,clamp(o.heat/p3Need(1.4),0,1),t); }
  else { ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y,24,'255,220,160',0.25+0.1*Math.sin(t*4)); ctx.restore(); } };
DUN_DRAW.d2a_wheel=(o,t)=>{ const sm=o.small, s=sm?0.8:1; p3Sh(o.x+3,o.y+12,16*s,6,0.25);
  p3Put(p3Spr('d2a_wheelp'+(sm?1:0),40*s,80*s,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-3+dx,-80*s+dy,6,80*s); },'#8a5a2a',{r:4}); celFill(g,(q,dx,dy)=>{ q.rect(-12*s+dx,-8+dy,24*s,8); },'#c8a050',{r:10}); }),o.x,o.y+12);
  const cx=o.x, cy=o.y-44*s, r=14*s, h=34*s; ctx.fillStyle='#b83a2a'; rrect(ctx,cx-r,cy-h/2,r*2,h,5); ctx.fill(); ctx.strokeStyle=SBC.outline; ctx.lineWidth=1.6; ctx.stroke();
  ctx.save(); ctx.beginPath(); rrect(ctx,cx-r,cy-h/2,r*2,h,5); ctx.clip(); for(let n=0;n<6;n++){ const a=o.rot+n*TAU/6, sx=Math.sin(a); if(Math.cos(a)<0) continue; ctx.fillStyle='#ffd870'; ctx.fillRect(cx+sx*r-2,cy-h/2,4,h); } ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(cx-r+3,cy-h/2,4,h); ctx.restore();
  ctx.fillStyle='#ffd870'; ctx.fillRect(cx-r-2,cy-h/2-3,r*2+4,4); ctx.fillRect(cx-r-2,cy+h/2-1,r*2+4,4);
  if(o.spin>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(cx,cy,30,'255,220,140',0.25+0.1*Math.sin(t*10)); ctx.restore(); } };
DUN_DRAW.d2a_hat=(o,t)=>{ if(G.found[o.id]) return; p3Sh(o.x+2,o.y+10,18,6,0.25); p3Put(p3Spr('d2a_hatc',42,34,g=>{ celFill(g,(q,dx,dy)=>{ q.moveTo(-18+dx,-2+dy); q.quadraticCurveTo(-20+dx,-14+dy,0+dx,-14+dy); q.quadraticCurveTo(20+dx,-14+dy,18+dx,-2+dy); q.closePath(); },'#7a3aa0',{r:16});
  celFill(g,(q,dx,dy)=>{ q.moveTo(-11+dx,-14+dy); q.quadraticCurveTo(-10+dx,-30+dy,0+dx,-30+dy); q.quadraticCurveTo(10+dx,-30+dy,11+dx,-14+dy); q.closePath(); },'#e8a030',{r:12}); g.fillStyle='#c83a2a'; g.fillRect(-12,-17,24,4); g.fillStyle='#ffd84a'; g.beginPath(); g.arc(0,-31,2.6,0,TAU); g.fill(); }),o.x,o.y+10);
  ctx.save(); ctx.globalCompositeOperation='lighter'; glowAt(o.x,o.y-14,22,'255,230,160',0.2+0.1*Math.sin(t*3)); ctx.restore(); };
DUN_DRAW.d2a_mural=(o,t)=>{ p3Put(p3Spr('d2a_mural',96,60,g=>{ celFill(g,(q,dx,dy)=>{ q.rect(-46+dx,-58+dy,92,56); },'#f0e2c0',{r:30}); g.strokeStyle='#c8a050'; g.lineWidth=3; g.strokeRect(-46,-58,92,56);
  const bird=(x,y,s)=>{ g.fillStyle='#3a5a8a'; g.beginPath(); g.ellipse(x,y,7*s,5*s,0,0,TAU); g.fill(); g.beginPath(); g.arc(x+6*s,y-4*s,3.6*s,0,TAU); g.fill(); g.fillStyle='#e8a030'; g.beginPath(); g.moveTo(x+9*s,y-4*s); g.lineTo(x+13*s,y-3*s); g.lineTo(x+9*s,y-2*s); g.fill(); g.strokeStyle='#3a5a8a'; g.lineWidth=1.6*s; g.beginPath(); g.moveTo(x-4*s,y-2*s); g.lineTo(x-10*s,y-9*s); g.stroke(); };
  bird(-28,-40,0.8); bird(0,-42,1.45); bird(28,-40,1.1);
  const bell=(x,s)=>{ g.fillStyle='#c8a050'; g.beginPath(); g.moveTo(x-7*s,-10); g.quadraticCurveTo(x-7*s,-24*s+4,x,-24*s+2); g.quadraticCurveTo(x+7*s,-24*s+4,x+7*s,-10); g.closePath(); g.fill(); };
  bell(-28,0.7); bell(0,1.05); bell(28,0.85); }),o.x,o.y+20); };

// ---------- 12. debug hooks (window.__ebX.d2a): the checker (scratchpad/e_d2a/d2a_chk.js) drives the real rules through these
// where a slide from cell k going (dx,dy) ends (Ash: the same test the game uses frame by frame)
function d2aSlideEndCell(A,k,dx,dy){ const w=A.cave.w; let cur=k, n=k+dx+dy*w; if(!d2aEnter(A,cur,n,'ash')) return k; cur=n; for(let g=0;g<64&&d2aSlick(A,cur);g++){ n=cur+dx+dy*w; if(!d2aEnter(A,cur,n,'ash')) break; cur=n; } return cur; }
// where block b comes to rest if pushed (di,dj) now (null if it cannot move)
function d2aBlockEndCell(A,b,di,dj){ const w=A.cave.w, sv=[b.ci,b.cj]; let k=b.cj*w+b.ci, n=k+di+dj*w; if(!d2aEnter(A,k,n,b)) return null;
  let cur=n; b.ci=cur%w; b.cj=(cur-b.ci)/w;
  try{ if(b.kind==='ice') for(let g=0;g<64&&d2aSlick(A,cur);g++){ n=cur+di+dj*w; if(!d2aEnter(A,cur,n,b)) break; cur=n; b.ci=cur%w; b.cj=(cur-b.ci)/w; } }
  finally{ b.ci=sv[0]; b.cj=sv[1]; }
  return cur; }
// where a ride on o that ends at s sets Ash down in a dungeon (p3RideOff's 'land': the end cell, or the nearest floor)
function d2aRideLand(A,o,s){ const e=p2PolyAt(o.pts,s), k=tCell(e[0],e[1]); if(k>=0&&tGround(k)&&!tHole(k)) return k; const g=dunNearGround(e[0],e[1],3); return tCell(g.x,g.y); }
function d2aRideBells(A,o){ const out=[]; for(const b of A.objs){ if(b.p3!=='wbell') continue; for(let s=0;s<=o.L;s+=8){ const q=p2PolyAt(o.pts,s); if(Math.hypot(q[0]-b.x,q[1]-b.y)<70){ out.push(b.name||b.id); break; } } } return out; }
window.__ebX=Object.assign(window.__ebX||{},{d2a:{D2A,D2T,D2AN,
  X:()=>AREA&&AREA.d2a,
  flood:()=>d2aFlood(),
  slick:k=>d2aSlick(AREA,k), enter:(k,n)=>d2aEnter(AREA,k,n,'ash'), slideEnd:(k,dx,dy)=>d2aSlideEndCell(AREA,k,dx,dy),
  blockEnd:(i,di,dj)=>{ const b=AREA.d2a.blocks[i]; return b?d2aBlockEndCell(AREA,b,di,dj):null; },
  blocks:()=>AREA&&AREA.d2a?AREA.d2a.blocks.map((b,i)=>({i,id:b.id,room:b.room,ci:b.ci,cj:b.cj,k:b.cj*AREA.cave.w+b.ci,kind:b.kind,gone:b.gone,mv:!!b.mv,z:b.z,x:b.x,y:b.y})):[],
  setBlock:(i,k,gone)=>{ const A=AREA, b=A.d2a.blocks[i]; if(!b) return false; if(k!=null){ b.ci=k%A.cave.w; b.cj=(k-b.ci)/A.cave.w; d2aBlockSnap(A,b); } if(gone!=null) b.gone=gone; b.mv=null; return true; },
  plates:()=>AREA&&AREA.d2a?AREA.d2a.plates.map(o=>({room:o.room,k:o.cj*AREA.cave.w+o.ci,pressed:o.pressed})):[],
  pud:()=>AREA&&AREA.d2a?[...AREA.d2a.pud]:[], setPud:list=>{ const X=AREA.d2a; X.pud.clear(); for(const k of list||[]) X.pud.add(k); },
  frz:()=>AREA&&AREA.d2a?[...AREA.d2a.frz.entries()]:[],
  vents:()=>AREA&&AREA.d2a?AREA.d2a.vents.map(v=>({id:v.id,room:v.room,k:v.k,cells:v.cells,seal:+v.seal.toFixed(2),warn:v.warn,blow:v.blow>0,x:v.x,y:v.y})):[],
  portals:()=>{ const A=AREA; if(!A||!A.d2a) return []; return A.d2a.portals.map(o=>({id:o.id,room:o.room,k:o.k,look:o.look,to:o.to,toRoom:o.toRoom,cell:o.cell,ok:d2aPortalOK(A,o),at:d2aPortalCoord(o.to,o.toRoom,o.cell)})); },
  portalGo:id=>{ const A=AREA, o=A&&A.d2a&&A.d2a.portals.find(q=>q.id===id); if(!o||!d2aPortalOK(A,o)) return false; D2A.graceT=0; d2aPortalGo(A,o); return true; },
  wheels:()=>AREA&&AREA.d2a?AREA.d2a.wheels.map(o=>({id:o.id,room:o.room,x:o.x,y:o.y,spin:+o.spin.toFixed(2),cover:o.cover,scr:o.scr})):[],
  spin:id=>{ const A=AREA, o=A.d2a.wheels.find(q=>q.id===id); if(!o) return false; o.cd=0; d2aSpin(A,o); return true; },
  melt:i=>{ const A=AREA, b=A.d2a.blocks[i]; if(!b||b.gone||b.kind!=='ice') return false; d2aMeltBlock(A,b); return true; },
  seal:i=>{ const v=AREA.d2a.vents[i]; if(!v) return false; v.seal=d2aDiff(D2AN.seal[0],D2AN.seal[1],D2AN.seal[2]); return true; },
  // the checker's hands: a held stick (and fire) that only my updatePlayer wrapper reads
  stick:(mx,my,fire)=>{ const X=AREA&&AREA.d2a; if(!X) return false; X.dbgIn=mx==null?null:{mx,my,fire:!!fire}; return true; },
  sl:()=>{ const X=AREA&&AREA.d2a; return X&&X.sl?{dx:X.sl.dx,dy:X.sl.dy}:null; },
  windGate:()=>{ const A=AREA; if(!A||!A.d2a) return null; const g=A.gates.find(o=>d2aWindGate(A,o)); return g?g.id:null; },
  seen:k=>d2aSeen(k), play:k=>d2aPlay(k),
  // the powers as the game reads them, and the game functions the checker calls
  abil:()=>({jump:canJump(),dbl:canDblJump(),stride:canWalkWater(),claws:canClaws(),grapple:canGrapple(),shadow:canShadow(),blaze:canBlaze(),windride:canWindride(),pound:canPound(),
    bow:!!(G.weapons&&G.weapons.bow),rang:!!(G.weapons&&G.weapons.boomerang)}),
  dbg:{p2Targets,p2TgtOK,p2LandSpot,p2DashBlocked,p2DashLen,P2,P3,p3JetTrace,p3JetLen,p3StreamOn,p3StreamLv,p2PolyAt,p2PolyD,p3MeltGate:o=>p3MeltGate(AREA,o),p3ThawStart,p3ThawDone,p3VaneTurn:o=>p3VaneTurn(AREA,o),p3RideStart,
    caveRoomAt,caveInterior,dunNearGround,colAt,caveBlocked:k=>caveBlockedAt(k),areaObjHit,caveObjAct,trialObjAct,areaObjAct,dChestSealed,breakCrack,solveRoom,refreshCaveGates,resetBlocks,d2aSafe:()=>d2aSafe(AREA,player,false)},
  // the wind ribbons of this floor: on or off now, both ways or not, and where each end sets Ash down
  rides:()=>{ const A=AREA; if(!A||!A.p3) return []; return A.p3.ribbons.map(o=>({id:o.id,room:o.room,on:p3StreamOn(o),both:!!o.both,vane:o.vane||null,dir:o.dir||null,L:o.L,w:o.w,
      a:{x:o.pts[0][0],y:o.pts[0][1]},b:{x:o.pts[o.pts.length-1][0],y:o.pts[o.pts.length-1][1]},lvA:p3StreamLv(o,0),lvB:p3StreamLv(o,o.L),landB:d2aRideLand(A,o,o.L),landA:d2aRideLand(A,o,0),bells:d2aRideBells(A,o)})); },
  // a real ride: Ash at one end of ribbon id, in the air, the ride starts (p3RideStart) and the game runs until he is down
  rideGo:(id,dir)=>{ const A=AREA, o=A&&A.p3&&A.p3.ribbons.find(q=>q.id===id); if(!o||!canWindride()||!p3StreamOn(o)) return null; const p=player, s=dir<0?o.L:0, e=p2PolyAt(o.pts,s);
    p.x=e[0]; p.y=e[1]; p.z=20; p.vz=0; P3.mv=null; P3.ride=null; P3.reCd=0; P3.lx=p.x; P3.ly=p.y; p3RideStart(p,o,s,dir<0?-1:1); for(let i=0;i<300&&(P3.ride||P3.mv);i++){ if(scene==='dialogue'&&window.__eb.skipDialogue) window.__eb.skipDialogue(); window.__eb.dunSim(1/30); } window.__eb.dunSim(0.2); return tCell(p.x,p.y); },
  rideStart:(id,dir)=>{ const A=AREA, o=A&&A.p3&&A.p3.ribbons.find(q=>q.id===id); if(!o) return false; const p=player, s=dir<0?o.L:0, e=p2PolyAt(o.pts,s);
    p.x=e[0]; p.y=e[1]; p.z=20; p.vz=0; P3.mv=null; P3.ride=null; P3.reCd=0; P3.lx=p.x; P3.ly=p.y; p3RideStart(p,o,s,dir<0?-1:1); return true; },
  ups:()=>{ const A=AREA; if(!A||!A.p3) return []; const cs=A.cave.cell; return A.p3.ups.map(u=>{ let best=null, bd=cs*2.4; for(const o of A.p3.ribbons){ if(!p3StreamOn(o)) continue; const q=p2PolyD(o.pts,u.x,u.y); if(q.d<bd){ bd=q.d; best={id:o.id,s:q.s,dir:o.both&&q.s>o.L*0.5?-1:1}; } } return {id:u.id,room:u.room,k:u.ck,to:best}; }); },
  vanes:()=>{ const A=AREA; if(!A||!A.p3) return []; return A.p3.vanes.map(o=>({vid:o.vid,room:o.room,dir:'nesw'[o.dir],x:o.x,y:o.y,k:tCell(o.x,o.y)})); },
  vaneTurn:vid=>{ const A=AREA, o=A.p3.vanes.find(q=>q.vid===vid); if(!o) return null; o.cd=0; p3VaneTurn(A,o); return 'nesw'[o.dir]; },
  bells:()=>AREA?AREA.objs.filter(o=>o.p3==='wbell').map(o=>({id:o.id,room:o.room,name:o.name,x:o.x,y:o.y,rungT:o.rungT})):[],
  jetLen:()=>p3JetLen(),
  // can blue fire from cell k reach the point (x,y) (within r)? the jet's own trace (walls and shut doors stop it)
  jetFrom:(k,x,y,r)=>{ const q=tPos(k), ang=Math.atan2(y-q.y,x-q.x), ox=q.x+Math.cos(ang)*16, oy=q.y+Math.sin(ang)*16, d=Math.hypot(x-ox,y-oy), L=p3JetTrace(ox,oy,ang,p3JetLen()); return d<=L+(r||0); },
  jetFromXY:(px,py,x,y,r)=>{ const ang=Math.atan2(y-py,x-px), ox=px+Math.cos(ang)*16, oy=py+Math.sin(ang)*16, d=Math.hypot(x-ox,y-oy), L=p3JetTrace(ox,oy,ang,p3JetLen()); return d<=L+(r||0); },
  // perf sanity: the average cost of one drawn frame here (ms)
  renderMs:n=>{ n=n||30; const t=performance.now(); for(let i=0;i<n;i++) render(); return +((performance.now()-t)/n).toFixed(2); },
  quiet:()=>{ try{ MV.tip=null; }catch(e){} G.banner=null; G.bannerQ=[]; return true; },
  info:()=>{ const A=AREA; if(!A||!A.d2a) return null; const X=A.d2a; return {area:A.id,root:X.root,flood:d2aFlood(),blocks:X.blocks.length,vents:X.vents.length,portals:X.portals.length,wheels:X.wheels.length,plates:X.plates.length,sculpt:X.sculpt.length,props:X.props.length,pud:X.pud.size,frz:X.frz.size,cover:X.cover.size,sl:!!X.sl}; }
}});
// @@END x2_dun_a
