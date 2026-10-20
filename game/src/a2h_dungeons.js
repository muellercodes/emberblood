// ================= Ember's Trials: three grand dungeons built on the cave room system (a2f_caves.js)
// A thousand years ago Ember, Ash's ancestor, built three Trials so her children could wake their dragon gifts.
// Nobody since Ember was born with real fire, so nobody has been able to open them. Until Ash.
// Each Trial: first half (fights, a puzzle, a small key), Ember's shrine in the middle (an ability), second half
// (the dungeon item in a big chest, puzzles that need it, the Guardian Key), the guardian boss, and a reward room.
const TRIAL_IDS=['leap','tide','sky'];
const TRIALS={
  leap:{id:'leap',name:'Trial of the Leap',abil:'jump',item:'boomerang',boss:'gnarl',stage:'lore',level:3,x:4250,y:6650,seed:131,col:'190,240,120',
    shrine:{id:'s_leap',x:4520,y:6900,name:'Leapwood Shrine'},abilName:'Leap',
    hint:'Deep in Whisperwood, east of the war camp road. Look for the stone arch the roots are eating.'},
  tide:{id:'tide',name:'Trial of the Tide',abil:'stride',item:'bow',boss:'serpent',stage:'warcamp',level:5,x:6050,y:7380,seed:149,col:'130,215,255',
    shrine:{id:'s_tide',x:6930,y:7270,name:'Pierside Shrine'},abilName:'Water Stride',
    hint:'On the little island in Lake Mirrow. Walk out along the Brindlecross dock and jump the broken planks.'},
  sky:{id:'sky',name:'Trial of the Sky',abil:'wings',boss:'skrae',stage:'oath',level:7,x:12600,y:3580,seed:167,col:'255,226,140',
    shrine:{id:'s_sky',x:13030,y:4170,name:'Cragwind Shrine'},abilName:'Wings',
    hint:'On the crag in the Drakeling Crags, ringed by a moat far too wide to jump. You will have to walk on the water.'}
};
const trialOpen=id=>{ const T=TRIALS[id]; if(!T||!G) return false; if(G.mode!=='story') return true; return reached(T.stage); };
const trialDone=id=>!!(G&&G.flags&&G.flags['trial_'+id+'_done']);
// (v12 META) on the map, the HUD region label and the first-visit banner a Trial goes by what Ash can see (the folk
// names R1's door prompts and signs use, x0_act1.js A1_FOLK, here as place names) until Ember names it: inside it, or
// at the end of the Trial before it ("Two more Trials are waiting. The Trial of the Tide ..."). Same rule as R1's
// a1TrialKnown, plus its boss or its gift (old saves that never recorded the visit). The Arena knows them all.
const TRIAL_FOLK={leap:S('Old Rooted Arch','Rooted Arch'),tide:S('Shell Doors','Shell Doors'),sky:S('White Gate','White Gate')};
function trialKnown(id){ if(!G||G.mode!=='story') return true; const F=G.found||{}, f=G.flags||{}; return !!F['seen_'+id]||trialDone(id)||!!f['trial_'+id+'_boss']||!!(TRIALS[id]&&hasAbil(TRIALS[id].abil))||(id==='tide'&&!!f.trial_leap_boss)||(id==='sky'&&!!f.trial_tide_boss); }
function trialFolk(id){ return TRIAL_FOLK[id]||(TRIALS[id]&&TRIALS[id].name)||''; }
function trialPlace(id){ const T=TRIALS[id]; return !T?'':trialKnown(id)?T.name:trialFolk(id); }
// the dungeon an area belongs to (a floor of a multi-floor dungeon names it in def.dun), and its Trial-like info
// (TRIALS for Ember's Trials, DUNGEONS for anything made with defineDungeon): abil, abilName, boss, bossY, level, shrine
function dunRoot(id){ const d=AREADEFS[id]; return (d&&d.dun)||id; }
function trialInfo(id){ const r=dunRoot(id); return TRIALS[r]||DUNGEONS[r]||null; }

// ---------- room templates (15 x 11 cells; boss rooms are 31 x 23). Letters: see TY_CH in a2f_caves.js, plus
// J statue, F fountain, D Ember's shrine, b big chest, X chest or key spot, H crystal switch, Y stone eye, V wind vent,
// v tide valve, r roots, q quest pickup, u reward altar, W warp, n perch, E nest, N person, s sign, * light, B block, S rune stone
const TT={
  // Trial of the Leap
  l_a:['...............','.J....g.g....J.','..*.........*..','...............','...gg.....gg...','...g.......g...','...gg.....gg...','...............','..*.........*..','.J.s.........J.','...............'],
  l_c:['...............','.##..*...*..##.','.#...........#.','...............','....gg...gg....','...............','....gg...gg....','...............','.#...........#.','.##..*...*..##.','...............'],
  l_b:['.....oo........','.*...oo......*.','.....oo........','.....oo........','.....oo........','..X..oo.B..B...','.....oo........','.....oo........','.....oo........','.....oo...S....','.*...oo..s...*.'],
  l_d:['...............','.#*.........*#.','...............','...##.....##...','...#.......#...','.......X.......','...#.......#...','...##.....##...','...............','.#*.........*#.','...............'],
  l_e:['...............','.J...*...*...J.','...............','....ggggggg....','....g.....g....','....g..D..g....','....g.....g....','....ggggggg....','...............','.J...*.s.*...J.','...............'],
  l_g:['ooooo.....ooooo','ooooo.....ooooo','ooooo^^^^^ooooo','ooooo.....ooooo','ooooo^^^^^.....','ooooo..........','ooooo^^^^^..s..','ooooo.....ooooo','ooooookkkoooooo','oooooo...oooooo','oooooo.X.oooooo'],
  l_h:['...............','.*...........*.','...##.....##...','...#.......#...','...............','...............','...............','...#.......#...','...##.....##...','.*...........*.','...............'],
  l_i:['...............','.J....*.*....J.','...............','....ggggggg....','....g.....g....','....g..b..g....','....g.....g....','....ggggggg....','...............','.J...........J.','...............'],
  l_f:['######.H.######','ooooooooooooooo','ooooooooooooooo','ooooooooooooooo','...oo...oo.....','...oo...oo.....','...oo...oo..s..','ooooooooooooooo','ooooo...ooooooo','ooooo.N.ooooooo','ooooo...ooooooo'],
  l_k:['...ooo...ooo...','.H.ooo.k.ooo.H.','...ooo.k.ooo...','ooooooo.ooooooo','...oooo.ooooooo','...kkkk.ooooooo','..soooo.ooooooo','ooooooo...ooooo','ooooooo.q.ooooo','ooooooo...ooooo','ooooooooooooooo'],
  l_j:['...............','.J...........J.','...............','...#.......#...','.......b.......','...............','...............','...#.......#...','...............','.*...........*.','...............'],
  l_z:['...............','.J...........J.','...*.......*...','....ggggggg....','....g.....g....','....g..u..g....','....g.....g....','....ggggggg....','...*...W...*...','.J...........J.','...............'],
  // Trial of the Tide
  t_a:['...............','.F...........F.','...............','...~~.....~~...','...~~.....~~...','......ggg......','......ggg......','......ggg......','...............','.F.s.........F.','...............'],
  t_c:['...............','.~~.........~~.','.~...........~.','...............','......ggg......','......gFg......','......ggg......','...............','.~...........~.','.~~.........~~.','...............'],
  t_b:['...wwhhhhhh....','.X.wwhhhhhh.v..','...wwhhhhhh....','wwpwwhhhhhh....','wwpwwhhhhhh....','wwpwwhhhhhh....','.....hhhhhh....','.....hhhhhh....','.v...hhhhhh....','.....hhhhhh..s.','.....hhhhhh....'],
  t_d:['...............','.wwww.....wwww.','.wwww.....wwww.','.wwww.....wwww.','...............','.......X.......','...............','.wwww.....wwww.','.wwww.....wwww.','.wwww.....wwww.','...............'],
  t_e:['...............','.F...........F.','...~.......~...','....ggggggg....','....g.....g....','....g..D..g....','....g.....g....','....ggggggg....','...~.......~...','.F.....s.....F.','...............'],
  t_g:['wwwwww...wwwwww','wwwwww...wwwwww','wwwwwwwwwwwwwww','wwwwwwwwwwwwwww','www...www......','www.N.www......','www...www...s..','wwwwwwwwwwwwwww','w...wwwwwwwwwww','w.q.wwwwwwwwwww','w...wwwwwwwwwww'],
  t_h:['...............','.*..##...##..*.','...............','222222222222ooo','222222222222ooo','2222222q2222ooo','222222222222ooo','222222222222ooo','...s...........','.*..##...##..*.','...............'],
  t_i:['...............','.F....*.*....F.','...............','....ggggggg....','....gwwwwwg....','....gwwbwwg....','....gwwwwwg....','....ggggggg....','...............','.F...........F.','...............'],
  t_f:['#######Y#######','wwwwwwwwwwwwwww','wwwwwwwwwwwwwww','wwwwwwwwwwwwwww','...wwwwwwwwws..','...wwwwwwwww...','...wwwwwwwww...','wwwwwwwwwwwwwww','wwwwwwwwwwwwwww','wwwwwwwwwwwwwww','wwwwwwwwwwwwwww'],
  t_k:['wwwwww...wwwwww','wwwwww...wwwwww','wwwwwwwwwwwwwww','wwwww.....wwwww','...ww.Y.Y.wwwww','...ww.....wwwww','..swwwwwwwwwwww','wwwwwwwwwwwwwww','wwwwwwwwwww...w','wwwwwwwwwww.q.w','wwwwwwwwwww...w'],
  t_j:['...............','.F...........F.','...ww.....ww...','...ww.....ww...','.......b.......','...............','...............','...ww.....ww...','...ww.....ww...','.F...........F.','...............'],
  t_z:['...............','.F...........F.','...*.......*...','....ggggggg....','....g.....g....','....g..u..g....','....g.....g....','....ggggggg....','...*...W...*...','.F...........F.','...............'],
  // Trial of the Sky
  s_a:['::...........::',':..J.......J..:',':.............:','....ggggggg....','....g.....g....','....g.....g....','....g.....g....','....ggggggg....',':.............:',':..J..s....J..:','::...........::'],
  s_c:['...............','.J...........J.','...............','...::.....::...','...::.....::...','...............','...::.....::...','...::.....::...','...............','.J...........J.','...............'],
  s_b:['...............','.J.....X.....J.','...............','..#...#...#....','............s..','...............','...............',':::::::::::::::',':::::::::::::::','::H::::::::::::',':::::::::::::::'],
  s_d:['.....::::::....','.....::::::..Y.','.....::::::....','.....::::::....','...V.::::::....','.....::::::.X..','.....::::::....','.....::::::....','.....::::::....','.s........:::::','..........:::::'],
  s_e:['...............','.J...*...*...J.','...............','....ggggggg....','....g.....g....','....g..D..g....','....g.....g....','....ggggggg....','...............','.J...*.s.*...J.','...............'],
  s_g:[':::::.....:::::',':::::.....:::::','::::::::::::::.','::::::::::::::.','::::::::::.....','::..::::::.....','::..::::::..s..','::::::::::::::.',':::::::::::::::','::::...::::::::','::::.q.::::::::'],
  s_h:[':::::.....:::::',':::::.....:::::',':::::::::::::::','::...:::::...::','::.N.:::::...::','::...:::::...::',':::::::::::::::',':::::::::::::::',':::::.....:::::',':::::.....:::::',':::::.....:::::'],
  s_i:['...............','.J....*.*....J.','...............','....ggggggg....','....g.....g....','....g..b..g....','....g.....g....','....ggggggg....','...............','.J...........J.','...............'],
  s_f:[':::::::::::::::',':::.Y.:::.Y.:::',':::::::::::::::',':::::::::::::::','...::::::::::s.','...:::::Y::::..','...::::::::::..',':::::::::::::::',':::::::::::::::',':::::::::::::::',':::::::::::::::'],
  s_k:[':::::.....:::::','.H:::.....:::H.',':::::::.:::::::',':::::::.:::::::','...::::.:::::::','...::::.:::::::','..s::::.:::::::',':::::::...:::::',':::::::.q.:::::',':::::::...:::::',':::::::::::::::'],
  s_j:['...............','.J...........J.','...............','...::.....::...','...::..E..::...','...............','...............','...::.....::...','...::.....::...','.J...........J.','...............'],
  s_z:['...............','.J...........J.','...*.......*...','....ggggggg....','....g.....g....','....g..u..g....','....g.....g....','....ggggggg....','...*...W...*...','.J...........J.','...............']
};
// the guardian arenas are drawn by code (31 x 23)
function arenaTpl(kind){
  const W=31, H=23, out=[];
  for(let r=0;r<H;r++){ let s='';
    for(let c=0;c<W;c++){
      let ch='.'; const d=Math.hypot(c-15,(r-11)*1.3);
      if(kind==='leap'){
        for(const [x,y] of [[6,5],[23,5],[6,16],[23,16]]) if(c>=x&&c<=x+1&&r>=y&&r<=y+1) ch='#';
        if((c===2||c===28)&&(r===2||r===20)) ch='*';
      }else if(kind==='tide'){
        if(c>=3&&c<=27&&r>=3&&r<=19) ch='w';
        for(const [x,y] of [[8,7],[21,7],[8,14],[21,14]]) if(c>=x&&c<=x+1&&r>=y&&r<=y+1) ch='.';
        if((c===1||c===29)&&(r===1||r===21)) ch='F';
        if(c===15&&(r===1||r===21)) ch='*';
      }else{ // sky: an open sky with stone perches
        ch=':';
        const plat=(x0,y0,x1,y1)=>c>=x0&&c<=x1&&r>=y0&&r<=y1;
        if(plat(12,9,18,13)||plat(26,14,30,20)||plat(26,2,30,8)) ch='.';
        for(const [x,y] of [[5,4],[5,18],[15,2],[15,20],[23,11]]) if(plat(x-1,y-1,x+1,y+1)) ch=(c===x&&r===y)?'n':'.';
        if(c===15&&r===11) ch='n';
      }
      s+=ch;
    }
    out.push(s);
  }
  return out;
}
// one shape for all three Trials: a start room, a hub, two side rooms (one holds the small key), Ember's shrine in
// the middle, a west wing (dungeon item) and an east wing (puzzles that need it, then the Guardian Key), the guardian, the reward
function trialMap(p,o){
  const R={
    a:{at:[1,4],kind:'start',tpl:TT[p+'_a'],sign:o.signA},
    c:{at:[1,3],kind:'fight',tpl:TT[p+'_c'],foes:o.foesC,tint:o.tint},
    b:Object.assign({at:[0,3],tpl:TT[p+'_b']},o.b),
    d:Object.assign({at:[2,3],tpl:TT[p+'_d']},o.d),
    s:{at:o.secretAt,kind:'secret',loot:['coins','treat']},
    e:{at:[1,2],kind:'shrine',tpl:TT[p+'_e'],sign:o.signE},
    g:Object.assign({at:[0,2],tpl:TT[p+'_g']},o.g),
    h:Object.assign({at:[0,1],tpl:TT[p+'_h']},o.h),
    i:Object.assign({at:[0,0],kind:'free',tpl:TT[p+'_i']},o.i),
    f:Object.assign({at:[2,2],tpl:TT[p+'_f']},o.f),
    k:Object.assign({at:[3,2],tpl:TT[p+'_k']},o.k),
    j:Object.assign({at:[3,1],tpl:TT[p+'_j']},o.j),
    boss:{at:[1,0],span:[2,2],kind:'tboss',tpl:arenaTpl(o.arena),noDecor:true,noPots:true},
    z:{at:[3,0],kind:'reward',tpl:TT[p+'_z'],noPots:true}
  };
  for(const k in R){ R[k].trial=true; if(!R[k].kind) R[k].kind='free'; if(['a','e','i','j','z'].includes(k)) R[k].noPots=true; }
  return {rooms:R,links:[['a','c','open'],['c','b','open'],['c','d','open'],['d','s','crack'],['c','e','lock'],['e','g','open'],['g','h','open'],['h','i','gate:h'],['e','f','open'],['f','k','gate:f'],['k','j','gate:k'],['j','boss','boss'],['boss','z','gate:boss']]};
}
CAVEMAP.leap=trialMap('l',{arena:'leap',secretAt:[2,4],tint:'#7ab05a',
  signA:S('TRIAL OF THE LEAP. For my children, when the fire wakes. Mind the roots. They only nibble.','TRIAL OF THE LEAP. For my children. Mind the roots!'),
  foesC:[['slime',3],['kobold',2],['bat',2]],
  b:{kind:'free',reward:'key',sign:'These pits are hungry. Feed them something heavy. The rune stone puts the blocks back.'},
  d:{kind:'fight',foes:[['kobold',3],['bat',3]],loot:['tmap']},
  signE:S('Press jump to hop over pits and spikes. Jump while you run to leap farther.','Press jump to hop. Run first to jump far.'),
  g:{kind:'free',loot:['chest'],spikes:'static',sign:'Spikes do not bite a dragon who is in the air.'},
  h:{kind:'miniboss',boss:['bramble','Bramblehorn'],foes:[['slime',2]]},
  i:{big:'boomerang'},
  f:{kind:'switches',need:'a boomerang',acc:['boomerang','arrow'],npc:'marlo',sign:'The crystal on the far ledge sleeps. No claw can reach it. Something that flies out and comes back might.'},
  k:{kind:'switches',need:'a boomerang',acc:['boomerang','arrow'],timed:6,pick:'marlo_hat',sign:'Two crystals, one breath apart. Wake both before the first falls back asleep.'},
  j:{kind:'fight',foes:[['kobold',3],['slime',2],['bat',2]],big:'bosskey',solveOnClear:true,sealChest:true}
});
CAVEMAP.tide=trialMap('t',{arena:'tide',secretAt:[3,3],tint:'#5ab0d8',
  signA:'TRIAL OF THE TIDE. The water remembers every step. Wet feet are part of the lesson.',
  foesC:[['crab',2],['slime',3]],
  b:{kind:'free',reward:'key',tide:true,sign:'Turn a valve to lower the tide. Turn it again to raise it. Some stones only float when the water is high.'},
  d:{kind:'fight',foes:[['eel',4],['crab',2]],loot:['tmap']},
  signE:'With Water Stride you can walk on deep water. Sprint on it to skim even faster.',
  g:{kind:'free',npc:'minnow',pick:'tide_pearl'},
  h:{kind:'fight',foes:[['eel',2],['crab',3]],solveOnClear:true,pick:'tide_pearl',sign:'The current runs to the falls. Do not let it carry you over.'},
  i:{big:'bow'},
  f:{kind:'eyes',need:'a bow',sign:'The eye over the water only wakes for an arrow.'},
  k:{kind:'eyes',need:'a bow',timed:5,pick:'tide_pearl',sign:'Two eyes that never blink together. Wake both, quickly.'},
  j:{kind:'fight',foes:[['crab',3],['eel',2],['slime',2]],big:'bosskey',solveOnClear:true,sealChest:true}
});
CAVEMAP.sky=trialMap('s',{arena:'sky',secretAt:[2,4],tint:'#d8c890',
  signA:'TRIAL OF THE SKY. The last gift is the hardest. You will need everything the other Trials gave you.',
  foesC:[['drakeling',2],['gust',2],['bat',2]],
  b:{kind:'switches',need:'a boomerang',acc:['boomerang','arrow'],reward:'key',gust:{dir:[0,1],on:1.4,off:2.6,str:215},sign:S('You will need a boomerang here. The wind gusts down this hall. Hide behind the pillars when it blows.','You need a boomerang. Hide from the wind!')},
  d:{kind:'eyes',need:'a bow',onSolve:'vent',vent:{dir:[1,0],len:6},loot:['tmap'],sign:'You will need a bow here. Wake the eye and the vent will breathe a bridge of wind.'},
  signE:S('Jump, then hold jump in the air to spread your wings. Press jump again to land.','Jump and hold jump to fly. Press jump to land.'),
  g:{kind:'free',gust:{dir:[-1,0],on:1.6,off:2.6,str:170},pick:'sky_feather',sign:'Fly! The wind will try to push you back. Fly anyway.'},
  h:{kind:'fight',foes:[['gust',3],['drakeling',2]],solveOnClear:true,npc:'puff'},
  i:{big:'bosskey'},
  f:{kind:'eyes',need:'a bow',sign:'Three eyes watch from the pillars. You will need a bow. Shoot them as you fly.'},
  k:{kind:'switches',need:'a boomerang',acc:['boomerang','arrow'],timed:7,sign:'You will need a boomerang. Two crystals on two cliffs. Wake both before the first one sleeps.'},
  j:{kind:'free',nest:true}
});
for(const id of TRIAL_IDS){ const T=TRIALS[id]; defCave(id,{name:T.name,level:T.level,theme:id,seed:T.seed,trial:id,dark:id==='sky'?0.1:id==='tide'?0.3:0.38,enemies:[]}); }
CAVE_SECRETS=countCaveSecrets();
// keep the start-room sign text reachable for the generic sign code
for(const id of TRIAL_IDS){ const M=CAVEMAP[id]; for(const k in M.rooms){ if(M.rooms[k].kind==='start'&&!M.rooms[k].sign) M.rooms[k].sign=''; } }

// ---------- the overworld: islands, a broken pier, a moat, three gates and three shrines
// Trial of the Tide: an island in Lake Mirrow, reached from the Brindlecross dock by a pier with two broken gaps
ISLES.push({x:6050,y:7400,r:150});
const TIDE_PIER=[{x0:6286,y0:7378,x1:6350,y1:7422},{x0:6150,y0:7378,x1:6206,y1:7422}];
for(const w of TIDE_PIER) WALKWAYS.push(w);
// Trial of the Sky: a crag inside a moat too wide to jump
PONDS.push({x:12600,y:3600,r:520,inner:220});
for(const id of TRIAL_IDS){ const T=TRIALS[id]; SHRINES.push(T.shrine); POI['trial_'+id]={x:T.x,y:T.y-30,r:id==='tide'?110:id==='leap'?250:170,get name(){ return trialPlace(id); },level:T.level}; }
function buildTrialGates(){
  for(const id of TRIAL_IDS){
    const T=TRIALS[id];
    const m={area:id,x:T.x,y:T.y,get name(){ return trialPlace(id); },trial:id}; CAVEMOUTHS.push(m);
    const L={x:T.x,y:T.y-40,r:320,i:0.2,trialGate:id}; LIGHTS.push(L);
    STRUCTS.push({k:'cavemouth',x:T.x,y:T.y,ref:m,theme:'trial',trial:id,r:140,light:L});
    addCol({t:'c',x:T.x-66,y:T.y-6,r:22}); addCol({t:'c',x:T.x+66,y:T.y-6,r:22}); addCol({t:'r',x0:T.x-74,y0:T.y-70,x1:T.x+74,y1:T.y-26});
    DOORS.push({x:T.x,y:T.y+6,area:id,get label(){ return trialOpen(id)?`Enter the ${T.name}`:`Look at the ${T.name}`; },outY:54,cave:true,trial:id});
    const sx=T.x+(id==='tide'?-96:116), sy=T.y+(id==='tide'?64:72);
    LANDMARKS.push({id:'tsign_'+id,k:'sign',x:sx,y:sy,r:8,prompt:'Read the sign',get text(){ return trialOpen(id)?`${T.name.toUpperCase()}. The runes are awake. Recommended for dragons of level ${T.level} and up.`:`${T.name.toUpperCase()}. The runes are asleep. They are waiting for someone. (Ask Elder Yara.)`; }});
  }
  // the Sky moat floods part of the old boulder ring around the Crag Ward: those boulders are gone now
  for(let i=STRUCTS.length-1;i>=0;i--){ const q=STRUCTS[i]; if(q.k!=='boulder'||pondD(q.x,q.y)>30) continue; STRUCTS.splice(i,1); const gone=[]; forCols(q.x,q.y,4,c=>{ if(c.t==='c'&&Math.abs(c.x-q.x)<0.5&&Math.abs(c.y-q.y)<0.5) gone.push(c); }); gone.forEach(removeCol); }
  // the broken pier planks are drawn as one struct over the water
  STRUCTS.push({k:'cavemouth',x:6300,y:7400,r:200,pier:true});
  // people who turn up inside the Trials
  Object.assign(SPECIAL,{
    marlo:{id:'marlo',name:'Marlo the Magnificent',col:'#ffb86a',inside:'leap',kid:true,look:{shirt:'#7a3a8a',hair:'#3a2210',hat:'feather',hatc:'#7a3a8a',skin:'#c8946c',hairdo:'spiky',outfit:'tunic',cape:'#ffb86a',trim:'#ffd27a',freckles:true},
      lines:[S(`I'm not stuck. Marlo the Magnificent is never stuck. I am resting between feats.`,`I am not stuck! I am resting.`),`One day they'll write songs about me. Tamsin said she'd think about it.`]},
    minnow:{id:'minnow',name:'Minnow Fisk',col:'#8ad8c8',inside:'tide',kid:true,look:{shirt:'#2a6a7a',hair:'#b8a070',hat:'rain',hatc:'#e8c03a',skin:'#e0b48c',hairdo:'pigtails',outfit:'coat',low:'#2a5a6a',trim:'#8ad8c8',hold:'rod'},
      lines:[S(`Dad says the fish out here sing. I've been listening all morning and I haven't heard one note.`,`Dad says these fish sing. I have not heard one.`),S(`Do turtles count as fish? Because I've caught three turtles.`,`Do turtles count as fish?`)]}
  });
}
// a person who belongs to a Trial room, once they are here at all
function trialNpcHere(id){
  if(id==='marlo') return !(G.quests.marlo&&G.quests.marlo.done);
  if(id==='minnow') return !(G.quests.minnow&&G.quests.minnow.done);
  return false;
}

// ---------- inside a Trial: the per-visit state and the cells
const FLOW=[[0,-1],[1,0],[0,1],[-1,0]];
function trialState(A){
  if(A.tri) return A.tri;
  const c=A.cave, n=c.w*c.h, id=caveSid(A.def);
  const T=A.tri={t:0,crS:new Uint8Array(n),crT:new Float32Array(n),crum:[],spk:new Uint8Array(n),rings:[],logs:[],roots:[],zones:[],bolts:[],
    high:!G.found['tlow_'+caveDsid(A.def)],safe:null,entry:null,lx:null,ly:null,wasAir:false,wasFly:false,pushed:false,room:null,boss:null,hold:null,stream:new Map(),perches:[],nest:null,fallT:0,puff:null};
  for(let k=0;k<n;k++){ const t=c.typ[k]; if(t===TY.crumble) T.crum.push(k); if(t===TY.pit&&G.found[`tpit_${id}_${k}`]) c.typ[k]=0; }
  for(const rid in c.rooms){ const R=c.rooms[rid]; for(let j=R.oy+1;j<=R.oy+R.ih;j++) for(let i=R.ox+1;i<=R.ox+R.iw;i++){ const k=j*c.w+i; if(c.typ[k]===TY.spike) T.spk[k]=R.spikes==='timed'?2:1; } }
  return T;
}
function tCell(x,y){ const A=AREA, c=A.cave, i=Math.floor((x-A.x0)/c.cell), j=Math.floor((y-A.y0)/c.cell); if(i<0||j<0||i>=c.w||j>=c.h) return -1; return j*c.w+i; }
function tPos(k){ const A=AREA, c=A.cave, i=k%c.w, j=(k-i)/c.w; return {x:A.x0+(i+0.5)*c.cell,y:A.y0+(j+0.5)*c.cell,i,j}; }
// where you can simply stand
function tGround(k){
  const A=AREA, c=A.cave, T=A.tri; if(k<0||c.grid[k]!==0) return false; const t=c.typ[k];
  if(t===0||t===2||t===TY.rune) return true;
  if(t===TY.crumble) return !T||T.crS[k]!==2;
  if(t===TY.basin) return !!T&&!T.high;
  if(t===TY.stones) return !!T&&T.high;
  return typeof dunGround==='function'&&dunGround(k,t,T);   // the cells e9a_dungeon.js adds
}
function tWet(k){ const A=AREA, c=A.cave, T=A.tri; if(k<0) return false; const t=c.typ[k]; return t===TY.deep||t===TY.current||(t===TY.basin&&!!T&&T.high)||(t===TY.stones&&!!T&&!T.high)||(typeof dunWet==='function'&&dunWet(k,t,T)); }
function tHole(k){ const A=AREA, c=A.cave, T=A.tri; if(k<0) return false; const t=c.typ[k]; return t===TY.pit||(t===TY.crumble&&!!T&&T.crS[k]===2)||(typeof dunHole==='function'&&dunHole(k,t,T)); }
function tSpikeUp(k){ const T=AREA.tri; if(!T||!T.spk[k]) return false; if(T.spk[k]===1) return true; const i=k%AREA.cave.w; return ((T.t*0.7+(i%9)*0.08)%1)<0.48; }
// a gentle shove that never pushes through walls or furniture
function tNudge(e,dx,dy){ const nx=e.x+dx; if(!blockedAt(nx,e.y)&&!colAt(nx,e.y,e.r*0.5)) e.x=nx; const ny=e.y+dy; if(!blockedAt(e.x,ny)&&!colAt(e.x,ny,e.r*0.5)) e.y=ny; }
function tSheltered(x,y,dir){ const A=AREA, c=A.cave; for(let s=1;s<=3;s++){ const k=tCell(x-dir[0]*s*c.cell,y-dir[1]*s*c.cell); if(k<0||c.grid[k]===1) return true; } return false; }
// a safe spot a step inside the door Ash just came through
function tEntryPoint(R,x,y){
  const A=AREA, c=A.cave, a=angTo(x,y,R.cx,R.cy);
  for(let d=20;d<220;d+=14){ const px=x+Math.cos(a)*d, py=y+Math.sin(a)*d, k=tCell(px,py); if(tGround(k)&&!c.dyn[k]&&caveRoomAt(px,py)===R){ const q=tPos(k); if(!colAt(q.x,q.y,14)) return {x:q.x,y:q.y}; } }
  for(let r=1;r<8;r++) for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ const k=tCell(x+di*c.cell,y+dj*c.cell); if(tGround(k)&&!c.dyn[k]){ const q=tPos(k); if(caveRoomAt(q.x,q.y)===R&&!colAt(q.x,q.y,14)) return {x:q.x,y:q.y}; } }
  return {x:R.cx,y:R.cy};
}
// interactive things are cave objects of kind 'cgate' with a tobj tag (so the shared E-button code reaches caveObjAct);
// each one gets a separate drawn twin of kind 'tv'
function tObj(A,kind,x,y,id,extra){ const o=Object.assign({k:'cgate',type:'tobj',tobj:kind,closed:false,x,y,id,r:24},extra||{}); const v={k:'tv',kind,ref:o,x,y,id:id+'_v'}; o.vis=v; A.objs.push(v,o); return o; }
function tChest(A,R,p,id,item,big){
  const o=tObj(A,'chest',p.x,p.y,id,{r:big?28:20,room:R.id,item,big});
  addAreaCol({t:'c',x:p.x,y:p.y,r:big?20:15});
  o.prompt=()=>tTaken(o)?null:tSealed(o)?'Look at the chest':big?'Open the great chest':'Open the chest';
  if(!G.found[id]) A.lights.push({x:p.x,y:p.y,r:big?220:150,i:big?0.7:0.5});
  return o;
}
// (v12) a great chest whose weapon never reached Ash (the game closed during its scene) is still full
function tTaken(o){ return !!G.found[o.id]&&!(o.item&&typeof WEAPONS!=='undefined'&&WEAPONS[o.item]&&!(G.weapons&&G.weapons[o.item])); }
function tSealed(o){ const R=AREA.rooms[o.room]; return !!(R&&R.sealChest&&!R.solved); }

// ---------- building a Trial room (called by buildCaveRooms for every room with trial:true)
function trialBuildRoom(A,def,R,ms,P,spot,freeSpot,rng){
  const T=trialState(A), c=A.cave, id=caveSid(def), root=dunRoot(def.id);
  let eyeN=0;
  for(const m of ms){
    const p=P(m.i,m.j), oid=`tr_${id}_${R.id}_${m.ch}${m.c}_${m.r}`;
    switch(m.ch){
      case 'J': A.objs.push({k:'tstatue',x:p.x,y:p.y,id:oid,th:def.theme,v:(m.c*7+m.r*3)%3}); addAreaCol({t:'c',x:p.x,y:p.y+4,r:16}); break;
      case 'F': A.objs.push({k:'tfount',x:p.x,y:p.y,id:oid,th:def.theme}); addAreaCol({t:'c',x:p.x,y:p.y,r:19}); A.lights.push({x:p.x,y:p.y,r:170,i:0.5}); break;
      case 'D': { const o=tObj(A,'shrine',p.x,p.y+10,oid,{r:36,room:R.id}); o.vis.y=p.y; o.prompt=()=>{ const TI=trialInfo(root); return TI&&TI.abil&&!hasAbil(TI.abil)?'Touch Ember’s flame':'Warm your claws at Ember’s flame'; }; addAreaCol({t:'c',x:p.x,y:p.y,r:22}); A.lights.push({x:p.x,y:p.y-24,r:360,i:0.95,fire:true}); break; }
      case 'H': { const o={k:'tswitch',x:p.x,y:p.y,id:oid,room:R.id,r:16,acc:R.acc||['boomerang','arrow','slash','spear','hammer','daggers'],timed:R.timed||0,t:0,on:R.solved,lit:R.solved}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:12}); A.lights.push({x:p.x,y:p.y,r:170,i:0,obj:o}); break; }
      case 'Y': { const o={k:'teye',x:p.x,y:p.y,id:oid,room:R.id,r:18,lit:R.solved,ph:eyeN++*1.9,t:0,timed:R.timed||0,face:angTo(p.x,p.y,R.cx,R.cy)}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:13}); A.lights.push({x:p.x,y:p.y,r:170,i:0,obj:o}); break; }
      case 'V': { const v=R.vent||{dir:[1,0],len:6}; A.objs.push({k:'tvent',x:p.x,y:p.y,id:oid,room:R.id,dir:v.dir,len:v.len,ci:m.i,cj:m.j,on:false}); addAreaCol({t:'c',x:p.x,y:p.y,r:14}); break; }
      case 'v': { const o=tObj(A,'valve',p.x,p.y,oid,{r:22,room:R.id}); o.prompt=()=>T.high?'Turn the valve (lower the tide)':'Turn the valve (raise the tide)'; addAreaCol({t:'c',x:p.x,y:p.y,r:14}); break; }
      case 'r': { const k=m.j*c.w+m.i, o={k:'cgate',type:'roots',x:p.x,y:p.y,id:oid,opened:!!G.found[oid],cells:[k],r:30,vertical:false,closed:true,tmp:false,heat:0}; A.gates.push(o); c.dyn[k]=A.gates.length; A.objs.push(o,{k:'tv',kind:'roots',ref:o,x:p.x,y:p.y,id:oid+'_v'}); o.prompt=()=>caveGatePrompt(o); break; }
      case 'q': if(R.pick&&!G.found[oid]) A.objs.push({k:'tpick',x:p.x,y:p.y,id:oid,item:R.pick}); break;
      case 'u': { const o=tObj(A,'altar',p.x,p.y,oid,{r:32,room:R.id}); o.prompt=()=>trialDone(root)?'Look at the altar':'Lay your claws on Ember’s altar'; addAreaCol({t:'c',x:p.x,y:p.y,r:20}); A.lights.push({x:p.x,y:p.y,r:320,i:0.9}); break; }
      case 'W': A.objs.push({k:'twarp',x:p.x,y:p.y,id:oid,room:R.id}); A.lights.push({x:p.x,y:p.y,r:210,i:0.6}); break;
      case 'n': T.perches.push({x:p.x,y:p.y}); break;
      case 'E': T.nest={x:p.x,y:p.y}; A.objs.push({k:'tnest',x:p.x,y:p.y,id:oid}); addAreaCol({t:'c',x:p.x,y:p.y,r:18}); break;
      case 'N': if(R.npc==='puff'){ if(!G.flags.puff_found){ const o=tObj(A,'puff',p.x,p.y,oid,{r:30,room:R.id}); o.prompt=()=>'Say hello to the little dragon'; } }
        else if(R.npc&&R.trial) (A.trialNpcs=A.trialNpcs||[]).push({id:R.npc,x:p.x,y:p.y}); break;
    }
  }
  const X=spot('X')||{x:R.cx,y:R.cy}, Bp=spot('b')||X;
  for(const L of R.loot||[]) if(L==='tmap') tChest(A,R,X,`tr_${id}_map`,'map',false);
  if(R.big) tChest(A,R,Bp,`tr_${id}_big_${R.big}`,R.big,true);
  if(R.kind==='shrine') A.objs.push({k:'tspirit',x:R.cx,y:R.cy-74,id:`tr_${id}_spirit`,room:R.id});
}

// ---------- every frame inside a Trial (called at the end of updateCaveRooms)
function trialUpdate(dt,R){
  const A=AREA, T=A.tri; if(!T) return;
  const c=A.cave, p=player, id=dunRoot(A.def.id);
  T.t+=dt; A.canFly=id==='sky'||!!A.def.canFly;
  // (v12) a lent gift whose place got done some other way (a lamp, a scene) becomes Ash's
  { const TI=trialInfo(id); if(TI&&TI.abil&&G.flags['tlend_'+TI.abil]===id&&lendDone(id)) trialKeep(id,TI.abil,false); }
  if(T.hold){ T.hold.t-=dt; if(T.hold.t<=0) T.hold=null; }
  if(T.fallT>0) T.fallT-=dt;
  if(R&&R!==T.room){ T.room=R; onTrialRoom(R); }
  // crumbling tiles shake, drop away, then grow back
  for(const k of T.crum){ const s=T.crS[k]; if(!s) continue; T.crT[k]+=dt;
    if(s===1&&T.crT[k]>0.55){ T.crS[k]=2; T.crT[k]=0; const q=tPos(k); emit(q.x,q.y,10,{col:'120,104,84',glow:false,smin:20,smax:70,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:3}); SFX.play('pop',0.5); }
    else if(s===2&&T.crT[k]>4.2){ T.crS[k]=0; T.crT[k]=0; } }
  // vents breathe bridges of wind
  T.stream.clear();
  for(const o of A.objs){ if(o.k!=='tvent') continue; const Q=A.rooms[o.room]; o.on=Q.onSolve==='vent'?!!Q.solved:true; if(!o.on) continue;
    for(let s=1;s<=o.len;s++) for(let w=-1;w<=1;w++){ const i=o.ci+o.dir[0]*s+(o.dir[1]?w:0), j=o.cj+o.dir[1]*s+(o.dir[0]?w:0); if(i>=0&&j>=0&&i<c.w&&j<c.h) T.stream.set(j*c.w+i,o); } }
  // wind gusts, water currents and the wind bridges push Ash around
  T.pushed=false; if(T.grace>0) T.grace-=dt;
  for(const k in A.rooms){ const Q=A.rooms[k]; if(!Q.gust) continue; const g=Q.gust, per=g.on+g.off, ph=(T.t+(g.ph||0))%per; Q.gustOn=ph<g.on; Q.gustK=Q.gustOn?clamp(Math.min(ph/0.35,(g.on-ph)/0.35),0,1):0; Q.gustWarn=!Q.gustOn&&ph>per-0.8; if(Q.gustWarn&&!Q.gustSfx&&A.curRoom===Q){ Q.gustSfx=1; SFX.play('roll',0.5); } if(Q.gustOn) Q.gustSfx=0; }
  if(!p.dead&&scene==='play'&&!(T.grace>0)){
    const air=airborne();
    if(R&&R.gust&&R.gustOn&&!tSheltered(p.x,p.y,R.gust.dir)){ const g=R.gust; tNudge(p,g.dir[0]*g.str*R.gustK*dt,g.dir[1]*g.str*R.gustK*dt); T.pushed=true; }
    const k=tCell(p.x,p.y);
    if(k>=0&&c.typ[k]===TY.current&&!air&&canWalkWater()){ const d=FLOW[c.flow[k]]||FLOW[1]; tNudge(p,d[0]*175*dt,d[1]*175*dt); T.pushed=true; }
    const vs=k>=0?T.stream.get(k):null; if(vs&&!p.flying) tNudge(p,vs.dir[0]*95*dt,vs.dir[1]*95*dt);
  }
  trialPlayerCells();
  trialEnemyCells();
  trialPuzzles(dt);
  // pickups and the warp home
  for(const o of A.objs){
    if(o.k==='tpick'&&!G.found[o.id]&&dist(p.x,p.y,o.x,o.y)<34&&!airborne()){ G.found[o.id]=true; giveItems({[o.item]:1},true); jingle('item','chest'); const n=G.items[o.item]||1; setBanner(ITEM_NAMES[o.item]||o.item,o.item==='tide_pearl'?`${n} of 3 glow pearls`:o.item==='marlo_hat'?S('Marlo will be glad to get this back.','Marlo will want this back!'):'A soft white feather. It hums when the wind blows.',2.2); emit(o.x,o.y,18,{col:'255,240,200',ang:-Math.PI/2,spread:1,smin:30,smax:120,lmin:.4,lmax:.8,zmin:1.5,zmax:3,rise:20}); if(o.item==='sky_feather') addCoins(30,o.x,o.y); questPoke(); saveGame(); }
    if(o.k==='twarp'&&trialDone(id)&&!T.warping&&dist(p.x,p.y,o.x,o.y)<30){ T.warping=true; SFX.play('shrine'); flashA=0.5; flashCol='255,230,170'; const nm=(trialInfo(id)||A.def).name; later(0.15,()=>{ if(AREA&&dunRoot(AREA.def.id)===id){ exitArea(); setBanner(nm,'Ember’s warp sets you down outside.',2.2); } }); }
  }
  // Puff the hatchling follows Ash to the nest
  if(G.flags.puff_found&&!G.flags.puff_home&&id==='sky'){
    if(!T.puff) T.puff={x:p.x-30,y:p.y+20,t:0,face:0};
    const q=T.puff; q.t+=dt; const tx=p.x-Math.cos(p.facing)*36, ty=p.y-Math.sin(p.facing)*36-6, kk=1-Math.exp(-dt*4); q.x+=(tx-q.x)*kk; q.y+=(ty-q.y)*kk; q.face=angTo(q.x,q.y,p.x,p.y);
    if(T.nest&&dist(q.x,q.y,T.nest.x,T.nest.y)<90&&scene==='play'){ G.flags.puff_home=true; T.puff=null; jingle('complete','upgrade'); runDialogue(STORY.trial_puff_home,()=>{ scene='play'; questPoke(); saveGame(); }); }
  }
  // the guardian
  if(T.boss&&T.boss.dead&&!T.bossWon&&G.corpse===T.boss){ T.bossWon=true; trialBossWon(A.rooms[T.boss.room]); }
  trialBossFx(dt);
}
function onTrialRoom(R){
  const A=AREA, T=A.tri, aid=A.def.id, id=dunRoot(aid), TR=trialInfo(id), p=player;
  T.entry=tEntryPoint(R,p.x,p.y);
  const vk=`tv2_${caveSid(A.def)}_${R.id}`, first=!G.found[vk]; G.found[vk]=1;
  const talk=(lines)=>later(0.5,()=>{ if(AREA&&AREA.def.id===aid&&scene==='play'&&lines) runDialogue(lines,()=>{ scene='play'; saveGame(); }); });
  if(R.kind==='start'&&first) talk(STORY['trial_'+id+'_in']);
  if(R.kind==='shrine'&&first&&TR&&TR.abil&&!hasAbil(TR.abil)) talk(STORY['trial_'+id+'_shrine']);
  if(R.kind==='tboss'&&!R.solved&&TR&&TR.boss) trialBossStart(R);
  if(R.kind==='reward'&&first&&TR&&!trialDone(id)) taunt('ember',pick([`You did it, little ember. Come. Touch the altar.`,`Go on, touch the altar. I made it for you.`]));
  if(R.nest&&G.flags.puff_found&&!G.flags.puff_home) setBanner('A nest!','Bring Puff close to it.',2);
}
// Ash on the special floors: pits and crumbled tiles drop him, deep water and chasms hold him back, spikes sting
function trialPlayerCells(){
  const A=AREA, T=A.tri, c=A.cave, p=player; if(p.dead||scene!=='play') return;
  const air=airborne(), fly=!!p.flying, kv=Math.hypot(p.kvx||0,p.kvy||0);
  const check=(x,y)=>{ const k=tCell(x,y); if(k<0) return null; const t=c.typ[k];
    if(typeof dunCheck==='function'){ const v=dunCheck(k,x,y,air,fly); if(v!==undefined) return v; }   // heights, rafts, rails (e9a_dungeon.js)
    if(tHole(k)) return air?null:'fall';
    if(tWet(k)) return air||canWalkWater()?null:(T.wasAir?'splash':'wall');
    if(t===TY.chasm) return fly||T.stream.has(k)?null:(T.grace>0?'wall':(T.wasFly||T.pushed||T.ext>0||kv>170)?'fall':'wall');
    if(t===TY.spike&&tSpikeUp(k)) return air?null:'spike';
    return null; };
  const k0=tCell(p.x,p.y);
  if(k0>=0&&!air&&c.typ[k0]===TY.crumble&&T.crS[k0]===0){ T.crS[k0]=1; T.crT[k0]=0; }
  const v=check(p.x,p.y);
  if(v==='fall'){ trialFall(); return; }
  if(v==='splash'){ const s=T.safe||T.entry||A.spawn; G.ripples.push({x:p.x,y:p.y,t:0,max:0.9,r:22,splash:true}); emit(p.x,p.y,16,{col:'180,220,255',glow:false,ang:-Math.PI/2,spread:1.3,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4}); SFX.play('pop'); p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; ftext(p.x,p.y-26,'Splash!','#bfe6ff',13); }
  else if(v==='wall'||v==='spike'){
    if(v==='spike'){ if(hurtPlayer(p.maxHp*0.1,p.x+rand(-4,4),p.y+rand(-4,4),0)) ftext(p.x,p.y-26,'Ouch! Spikes!','#ffb0a0',13); }
    if(T.lx!=null){ if(!check(p.x,T.ly)) p.y=T.ly; else if(!check(T.lx,p.y)) p.x=T.lx; else { p.x=T.lx; p.y=T.ly; } }
    if(check(p.x,p.y)){ const s=T.safe||T.entry||A.spawn; p.x=s.x; p.y=s.y; }
    p.kvx*=0.3; p.kvy*=0.3;
  }
  if(!check(p.x,p.y)){ T.lx=p.x; T.ly=p.y; const k=tCell(p.x,p.y); if(!air&&!fly&&tGround(k)&&c.typ[k]!==TY.crumble) T.safe={x:p.x,y:p.y}; }
  T.wasAir=air; T.wasFly=fly;
}
function trialFall(){
  const A=AREA, T=A.tri, p=player; if(!T||p.dead) return;
  T.fallT=0.5; T.fallX=p.x; T.fallY=p.y;
  emit(p.x,p.y,18,{col:'70,58,48',glow:false,smin:20,smax:90,lmin:.3,lmax:.7,zmin:2,zmax:5,grow:4}); SFX.play('roll'); shake(3);
  const to=T.entry||T.safe||A.spawn, dmg=Math.ceil(p.maxHp*0.1);
  p.x=to.x; p.y=to.y; p.kvx=p.kvy=0; p.dashT=0; G.fade=0.85; updateCam(0,true);
  T.lx=p.x; T.ly=p.y; T.wasAir=false; T.wasFly=false; T.grace=1.2; T.ext=0;
  if(!(window.__eb&&window.__eb.god)){ p.hp-=dmg; p.lastHurt=G.time; G.hurtVig=0.5; p.hurtFlash=0.12; if(p.hp<=0){ p.hp=0; playerDied(); return; } }
  p.iframes=Math.max(p.iframes,1.0);
  ftext(p.x,p.y-28,pick(['Whoops!','Oof!','Not that way!','Down you go!']),'#ffd9a0',14);
}
// walkers stay on the ground, swimmers stay in the water; a hard knock can send a walker down a pit
function trialEnemyCells(){
  const A=AREA, c=A.cave;
  for(const e of G.enemies){
    if(e.dead||!e.inArea||e.flying||e.noClip) continue;
    const k=tCell(e.x,e.y); if(k<0) continue;
    const swim=!!(EDEF[e.type]&&EDEF[e.type].swim);
    const ok=(swim?tWet(k):tGround(k))&&(typeof dunEnemyOK!=='function'||dunEnemyOK(e,k));
    if(ok){ e._tx=e.x; e._ty=e.y; continue; }
    if(!swim&&!e.boss&&!e.caveBoss&&(tHole(k)||c.typ[k]===TY.chasm)&&Math.hypot(e.vx,e.vy)>140){ emit(e.x,e.y,14,{col:'70,58,48',glow:false,smin:20,smax:80,lmin:.3,lmax:.6,zmin:2,zmax:5,grow:4}); ftext(e.x,e.y-20,'Byeee!','#ffe0a0',12); killEnemy(e); continue; }
    if(e._tx!=null){ e.x=e._tx; e.y=e._ty; } else { e._tx=e.x; e._ty=e.y; }
  }
}
function trialPuzzles(dt){
  const A=AREA, T=A.tri;
  for(const o of A.objs){
    if(o.k==='tswitch'){ o.lit=o.on; if(o.on&&o.timed){ const Q=A.rooms[o.room]; if(!Q.solved){ o.t-=dt; if(o.t<=0){ o.on=false; o.lit=false; SFX.play('ui'); emit(o.x,o.y,8,{col:'150,170,200',glow:false,smin:20,smax:60,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); } } } }
    else if(o.k==='teye'){ o.open=((T.t+o.ph)%3.6)<2.1; if(o.lit&&o.timed){ const Q=A.rooms[o.room]; if(!Q.solved){ o.t-=dt; if(o.t<=0){ o.lit=false; SFX.play('ui'); } } } }
    else if(o.k==='block'&&o.sinking&&o.anim<=0){ trialSinkBlock(o); }
  }
  for(const k in A.rooms){
    const Q=A.rooms[k]; if(Q.solved) continue;
    if(Q.kind==='switches'){ const s=A.objs.filter(o=>o.k==='tswitch'&&o.room===k); if(s.length&&s.every(o=>o.on)) solveRoom(Q); }
    else if(Q.kind==='eyes'){ const s=A.objs.filter(o=>o.k==='teye'&&o.room===k); if(s.length&&s.every(o=>o.lit)) solveRoom(Q); }
    else if((Q.solveOnClear||Q.kind==='miniboss')&&A.curRoom===Q&&!Q.locked&&Q.enemies.every(e=>e.dead)&&roomBossBeaten(Q)) solveRoom(Q,true);
  }
}
// (v12) a room whose guardian its own fight brings out (c1boss, f2boss, m3boss: the room starts with no foes in it) is
// only won when that guardian has fallen, never just because nobody is in it yet when Ash walks in
function roomBossBeaten(Q){
  const t=Q.c1boss||Q.f2boss||Q.m3boss; if(!t) return true;
  return !!(G.bossDone&&G.bossDone[t])||(Q.enemies||[]).some(e=>e.dead&&e.type===t);
}
// a block pushed into a pit fills it for good
function trialBlockInto(b,ni,nj,k){
  const c=AREA.cave; if(!AREA.tri||c.typ[k]!==TY.pit) return false;
  b.fx=b.x; b.fy=b.y; b.ci=ni; b.cj=nj; b.anim=0.2; b.sinking=true; SFX.play('roll',0.7); return true;
}
function trialSinkBlock(b){
  const A=AREA, c=A.cave, k=b.cj*c.w+b.ci, id=caveSid(A.def);
  b.sinking=false; c.typ[k]=0; G.found[`tpit_${id}_${k}`]=true;
  emit(b.x,b.y,24,{col:'120,110,96',glow:false,smin:30,smax:120,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:5}); SFX.play('boom'); shake(5);
  b.sunk=true; b.ci=b.cj=-99; b.x=b.y=-9999;
  renderCaveRooms(A,A.def); setBanner('The pit is filled','The block fits perfectly. Like it was waiting.',1.6); saveGame();
}
function trialSwitchOn(o){
  if(o.on&&!o.timed) return;
  const was=o.on; o.on=true; o.lit=true; o.t=o.timed||0;
  if(!was){ SFX.play('shrine'); emit(o.x,o.y,18,{col:'150,230,255',smin:40,smax:150,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); shake(2); if(o.timed) ftext(o.x,o.y-30,`${o.timed} seconds!`,'#bfefff',13); }
}
function trialBossWon(R){
  const A=AREA, aid=A.def.id, id=dunRoot(aid);
  solveRoom(R,true); G.flags['trial_'+id+'_boss']=true; if(typeof deed==='function') deed('trial_'+id);
  questPoke(); saveGame();
  later(2.7,()=>{ if(G.boss&&G.boss.dead) G.boss=null; if(AREA&&AREA.def.id===aid&&STORY['trial_'+id+'_won']) runDialogue(STORY['trial_'+id+'_won'],()=>{ scene='play'; setBanner('The way is open',TRIALS[id]?'Ember’s gift waits beyond the guardian.':'',2.6); saveGame(); }); });
}
// (v12) a guardian's room is only won by its fight: if its guardian is gone while the room is not won (it fell some
// other way, or the cave was cleared a moment ago and nobody woke up), the guardian is back to meet Ash. Called by
// updateCaveRooms (a2f_caves.js) whenever Ash walks into a room, in every cave: R.boss guardians (the room-grid caves,
// the Trials, the dungeons) and R.boss2 ones (e9b_caves2's caves). Rooms whose own fight brings the guardian out
// (c1boss, f2boss, m3boss) are left to that fight.
function caveGuardianBack(R){
  const A=AREA; if(!A||!R||R.solved||!(R.kind==='boss'||R.kind==='miniboss')||!R.enemies) return;
  if(R.boss2){ if(A.c2&&typeof c2BossSpawn==='function'&&!R.enemies.some(e=>!e.dead&&e.c2boss)){ c2BossSpawn(A,A.def,R); A.c2.bossDone=false; } return; }
  if(R.boss&&!R.enemies.some(e=>!e.dead&&e.caveBoss)) trialGuardianBack(R);
}
function trialGuardianBack(R){
  const A=AREA, def=A.def, type=R.boss[0], d=EDEF[type]; if(!d) return null;
  let q=null; const c=A.cave;
  for(let r=0;r<6&&!q;r++) for(let dj=-r;dj<=r&&!q;dj++) for(let di=-r;di<=r&&!q;di++){ const k=tCell(R.cx+di*c.cell,R.cy+dj*c.cell); if(k>=0&&tGround(k)&&!c.dyn[k]){ const s=tPos(k); if(caveRoomAt(s.x,s.y)===R&&!colAt(s.x,s.y,18)) q=s; } }
  q=q||{x:R.cx,y:R.cy};
  const e=makeEnemy(type,q.x,q.y,{level:def.level+1,aggro:true,homeX:q.x,homeY:q.y,leash:520,camp:A.camp,face:angTo(q.x,q.y,player.x,player.y),snowy:def.theme==='ice',elite:true,hpScale:2.6,tint:R.tint});
  e.inArea=true; e.room=R.id; if(!(d.boss||d.mini)) e.r*=1.35; e.caveBoss=R.boss[1]; e.dmg*=1.2; e.spawnIn=0.6;
  R.enemies.push(e); if(A.camp){ A.camp.alive++; A.camp.done=false; }
  return e;
}
function trialBossStart(R){
  const A=AREA, T=A.tri, aid=A.def.id, id=dunRoot(aid), TR=trialInfo(id);
  if(T.boss&&!T.boss.dead) return;
  const type=R.guardian||TR.boss, d=EDEF[type];
  const x=R.cx-120, y=TR.bossY!=null?R.y0+TR.bossY:type==='skrae'?R.y0+260:R.cy;
  const e=makeEnemy(type,x,y,{level:TR.bossLevel||1,aggro:true,homeX:R.cx,homeY:R.cy,leash:5000});
  e.inArea=true; e.room=R.id; e.trialBoss=id; e.arena={x0:R.x0,y0:R.y0,x1:R.x1,y1:R.y1,cx:R.cx,cy:R.cy}; e.spawnIn=0.5;
  R.enemies.push(e); T.boss=e; G.boss=e;
  setBanner(d.name,(W<560&&d.short)?d.short:d.title,3,'boss'); jingle('boss_intro',null); SFX.play('warn'); shake(8);
  later(1.6,()=>{ if(AREA&&AREA.def.id===aid&&!e.dead&&STORY['trial_'+id+'_bossline']) taunt(TR.bossWho||'ember',STORY['trial_'+id+'_bossline']); });
}

// ---------- the E button on Trial things
function trialObjAct(o){
  const A=AREA, T=A.tri, id=dunRoot(A.def.id), TR=trialInfo(id)||{};
  const say=(t,cb)=>runDialogue([['narr',t]],()=>{ scene='play'; if(cb) cb(); saveGame(); });
  switch(o.tobj){
    case 'shrine': {
      if(!TR.abil||hasAbil(TR.abil)){ player.hp=player.maxHp; player.potions=player.potionsMax; SFX.play('shrine'); say(`Ember's flame is warm. Your scales stop aching. (Health and draughts restored.)`); return true; }
      // (v12) the flame only lends its gift until this place is done: Ember says so after the gift
      const lend=!!trialLendRoot(TR.abil), gift=STORY['trial_'+id+'_gift'];
      runDialogue(lend&&Array.isArray(gift)?gift.concat(trialLendLine(id,TR)):gift,()=>{
        scene='play'; grantAbility(TR.abil); player.hp=player.maxHp; player.potions=player.potionsMax;
        jingle('levelup','level'); flashA=0.55; flashCol='255,214,140'; shake(7);
        emit(o.x,o.y-20,60,{col:'255,210,120',ang:-Math.PI/2,spread:1.6,smin:60,smax:300,lmin:.6,lmax:1.3,zmin:2,zmax:4,rise:30});
        emit(player.x,player.y,30,{kind:'fire',ang:-Math.PI/2,spread:1.2,smin:40,smax:160,lmin:.5,lmax:1,zmin:3,zmax:6,grow:6});
        later(2.4,()=>{ if(AREA&&AREA.def&&dunRoot(AREA.def.id)===id) setBanner(`${TR.abilName}!`,STORY['trial_'+id+'_how'],4.2); });
        questPoke(); saveGame();
      });
      return true; }
    case 'chest': trialChest(o); return true;
    case 'valve':{
      T.high=!T.high; G.found['tlow_'+caveDsid(A.def)]=!T.high; SFX.play('block'); SFX.play('roll'); shake(4);
      if(o.vis) o.vis.spin=1;
      setBanner(T.high?'The tide rises':'The tide drains away',T.high?'Stepping stones float up out of the water.':'The basin empties. You can walk where the water was.',2);
      // never flood Ash where he stands
      const p=player, k=tCell(p.x,p.y); if(tWet(k)&&!canWalkWater()){ const s=tEntryPoint(caveRoomAt(p.x,p.y)||A.curRoom,p.x,p.y); p.x=s.x; p.y=s.y; }
      saveGame(); return true; }
    case 'altar': trialReward(o); return true;
    case 'puff':
      runDialogue(STORY.trial_puff_meet,()=>{ scene='play'; G.flags.puff_found=true; if(!G.quests.puff) startQuest('puff'); A.objs=A.objs.filter(q=>q!==o&&q!==o.vis); T.puff={x:o.x,y:o.y,t:0,face:0}; questPoke(); saveGame(); });
      return true;
  }
  return false;
}
function trialChest(o){
  const A=AREA, T=A.tri, id=dunRoot(A.def.id), DK=caveDsid(A.def);
  if(tTaken(o)) return;
  if(tSealed(o)){ runDialogue([['narr',`A great chest, held shut by bands of golden light. They will let go once this room is safe.`]],()=>{ scene='play'; }); return; }
  const fx=()=>{ SFX.play('chest'); flashA=0.35; flashCol='255,226,160'; shake(4); emit(o.x,o.y,40,{col:'255,214,120',ang:-Math.PI/2,spread:1.2,smin:40,smax:200,lmin:.5,lmax:1.1,zmin:1.5,zmax:3.5,rise:20}); };
  G.found[o.id]=true;
  if(o.item==='map'){ fx(); G.found['tmap_'+DK]=true; renderCaveMini(A); T.hold={item:'map',t:2.6}; jingle('item','chest'); setBanner('The Trial map!','Every room of the Trial now shows on your minimap.',2.8); saveGame(); return; }
  if(o.item==='bosskey'){ fx(); G.found['bkey_'+DK]=true; T.hold={item:'bosskey',t:3}; jingle('item','chest');
    runDialogue([['narr',`Inside the great chest, on a cushion of moss and gold thread: a heavy key shaped like a flame.`],['narr',`The Guardian Key. It opens the great door, where the guardian of the Trial sleeps.`]],()=>{ scene='play'; setBanner('Guardian Key','Now find the great door.',2.4); saveGame(); });
    saveGame(); return; }
  // the dungeon item
  fx(); T.hold={item:o.item,t:3.4}; jingle('item','shrine');
  runDialogue(STORY['trial_'+id+'_item'],()=>{ scene='play'; giveWeapon(o.item); later(2.2,()=>setBanner(WEAPONS[o.item]?WEAPONS[o.item].name:o.item,STORY['trial_'+id+'_itemhow'],4)); questPoke(); saveGame(); });
}
function trialReward(o){
  const A=AREA, id=dunRoot(A.def.id), TR=trialInfo(id)||{name:A.def.name,level:A.def.level||1};
  if(trialDone(id)){ runDialogue([['narr',`Ember's altar glows softly. The warp ring beside it is still open, whenever you are ready to go.`]],()=>{ scene='play'; }); return; }
  // (v12) the gift Ember's flame lent at the shrine becomes Ash's for good here
  const keep=TR.abil&&G.flags['tlend_'+TR.abil]===id?TR.abil:null, end=STORY['trial_'+id+'_end'];
  runDialogue(keep&&(TRIALS[id]||Array.isArray(STORY['trial_'+id+'_keep']))&&Array.isArray(end)?end.concat(trialKeepLine(id,TR)):end,()=>{
    scene='play'; const p=player;
    G.flags['trial_'+id+'_done']=true; if(keep) trialKeep(id,keep,true);
    p.maxHp+=10; p.hp=p.maxHp; p.potions=p.potionsMax;
    giveSkillPoint(1); addCoins(40+TR.level*10,o.x,o.y); gainXp(120+TR.level*40);
    jingle('complete','upgrade'); flashA=0.6; flashCol='255,220,140'; shake(8);
    for(let i=0;i<5;i++) later(i*0.18,()=>emit(o.x+rand(-60,60),o.y+rand(-40,40),24,{col:'255,214,110',ang:-Math.PI/2,spread:1.4,smin:60,smax:260,lmin:.6,lmax:1.3,zmin:2,zmax:4,rise:30}));
    showCard('Trial complete',TR.name);
    later(3.1,()=>setBanner(`${TR.name} complete!`,(keep?`${TR.abilName} is yours  ·  `:'')+'+10 max health  ·  +1 skill point  ·  the warp ring is open',4.5));
    questPoke(); saveGame();
  });
}

// ---------- (v12) Ember's flame lends its gift inside its own place
// A Trial or dungeon whose gift shrine stands before its guardian only lends the gift there: touching the flame makes it
// work on every floor of that place, and it becomes Ash's for good when the place is done (the altar sets
// trial_<id>_done). Leaving early, coming back or reloading never carries it outside. The loan is
// G.flags['tlend_<power>'] = the place's id. grantAbility (a6c_moves.js) makes the loan and hasAbil (a1c_state.js) reads
// it. A power Ash already owns (an old save that got it early) is never lent and never taken away. A place whose gift is
// its last room (Ember's Nursery) has no guardian after it, so it simply gives the gift.
function lendDone(r){ const F=G&&G.flags; return !!(F&&(F['trial_'+r+'_done']||F[r+'_done'])); }
function lendable(r){
  const I=TRIALS[r]||DUNGEONS[r]; if(!I||!I.abil||I.placeholder) return false;
  if(I._lend!=null) return I._lend;
  const floors=(DUNGEONS[r]&&DUNGEONS[r].floorIds)||[r];
  return I._lend=floors.some(aid=>{ const M=CAVEMAP[aid]; return !!M&&Object.values(M.rooms).some(R=>R.kind==='tboss'||R.kind==='reward'||(R.kind==='boss'&&!!(R.boss||R.c1boss||R.m3boss||R.f2boss))); });
}
// true while a lent power works: inside the place that lent it, or anywhere once that place is done
const TLEND={};   // the flag names, made once (hasAbil asks this on every miss)
function trialLent(id){
  const F=G.flags, r=F&&F[TLEND[id]||(TLEND[id]='tlend_'+id)]; if(!r) return false;
  return lendDone(r)||!!(AREA&&AREA.def&&dunRoot(AREA.def.id)===r);
}
// the place that would lend this power if it were given right now (null: give it for good)
function trialLendRoot(id){
  if(!G||G.mode!=='story'||!G.flags||!AREA||!AREA.def) return null;
  const r=dunRoot(AREA.def.id), I=trialInfo(r);
  return I&&I.abil===id&&lendable(r)&&!lendDone(r)?r:null;
}
const lendPlace=I=>{ const n=String((I&&I.name)||''); return /^Trial /.test(n)?'the '+n:n.replace(/^The /,'the '); };
function trialKeep(r,id,quiet){
  if(!G||!G.flags||G.flags['tlend_'+id]!==r) return false;
  G.abil=G.abil||{}; G.abil[id]=true; delete G.flags['tlend_'+id];
  const I=trialInfo(r)||{}, nm=I.abil===id&&I.abilName?I.abilName:id;
  if(!quiet&&player) later(1.4,()=>setBanner(S(`${nm} is yours now`,`${nm} is yours!`),S('It works everywhere now, not just in there.','It works everywhere now!'),3.4));
  if(G.mode==='story') saveGame();
  return true;
}
// every loan whose place is done becomes Ash's (on the way in or out of any area, and when a gift is given again)
function trialKeepAll(quiet){
  if(!G||!G.flags) return;
  for(const k of Object.keys(G.flags)) if(k.slice(0,6)==='tlend_'&&G.flags[k]&&lendDone(G.flags[k])) trialKeep(G.flags[k],k.slice(6),quiet);
}
// (the story can say these its own way: STORY.trial_<id>_lend and STORY.trial_<id>_keep, lists of lines, replace them)
function trialLendLine(id,TR){
  const nm=TR.abilName||TR.abil, own=STORY['trial_'+id+'_lend']; if(Array.isArray(own)) return own;
  if(TRIALS[id]) return [['ember',S(`One more thing. My flame only burns this bright in here. Out there it would fizzle. Pass my Trial, and the ${nm} is yours to keep.`,`My flame only works in here for now. Pass my Trial to keep the ${nm}!`)]];
  return [['narr',S(`The gift hums inside you, but only in this place for now. Finish ${lendPlace(TR)} and the ${nm} is yours to keep.`,`It only works in here for now. Finish ${lendPlace(TR)} to keep it.`)]];
}
function trialKeepLine(id,TR){ const nm=TR.abilName||TR.abil, own=STORY['trial_'+id+'_keep']; if(Array.isArray(own)) return own; return [['ember',S(`And the ${nm} is yours now. Not just in here. Everywhere.`,`The ${nm} is yours now. Everywhere!`)]]; }
// walking out of a place that lent a gift it has not finished: say why the gift stays behind
{ const base=exitArea; exitArea=function(){
    const A=AREA, r=A&&A.def?dunRoot(A.def.id):null, out=base.apply(this,arguments);
    try{ if(r&&G&&G.flags){ const I=trialInfo(r);
        if(I&&I.abil&&G.flags['tlend_'+I.abil]===r&&!lendDone(r)&&typeof MV!=='undefined'&&MV.tip&&MV.tip.id==='abil_'+I.abil) MV.tip=null;   // (its "how to" tip too)
        if(I&&I.abil&&G.flags['tlend_'+I.abil]===r&&!lendDone(r)) later(0.6,()=>{ if((!AREA||dunRoot(AREA.def.id)!==r)&&G&&G.flags['tlend_'+I.abil]===r&&scene==='play')
          setBanner(S('Not yours yet','Not yours yet'),S(`${I.abilName} only works inside ${lendPlace(I)} until you finish it.`,`Finish ${lendPlace(I)} to keep it.`),3.6); });
        trialKeepAll(true); } }catch(e){ console.error(e); }
    return out; }; }
{ const base=enterArea; enterArea=function(){ const out=base.apply(this,arguments); try{ trialKeepAll(true); }catch(e){ console.error(e); } return out; }; }
// ---------- fire, claws and thrown things
function trialBreath(hit,dt){
  const A=AREA, T=A.tri;
  for(const o of A.gates){ if(o.type!=='roots'||o.opened||!hit(o.x,o.y,30)) continue; o.heat=(o.heat||0)+dt; if(Math.random()<0.4) emit(o.x+rand(-18,18),o.y+rand(-18,18),1,{kind:'fire',ang:-Math.PI/2,spread:0.5,smin:20,smax:60,lmin:.3,lmax:.6,zmin:3,zmax:6,grow:4}); if(o.heat>1.0) burnRoots(o); }
  if(T) for(const r of T.roots) if(!r.burnt&&r.up>0&&hit(r.x,r.y,r.r*0.8)){ r.burnt=true; emit(r.x,r.y,16,{kind:'fire',ang:-Math.PI/2,spread:0.8,smin:30,smax:120,lmin:.3,lmax:.7,zmin:3,zmax:7,grow:6}); SFX.play('pop'); }
}
function burnRoots(o){ o.opened=true; G.found[o.id]=true; refreshCaveGates(); SFX.play('boom'); shake(4); emit(o.x,o.y,30,{kind:'fire',ang:-Math.PI/2,spread:1,smin:30,smax:160,lmin:.4,lmax:.9,zmin:3,zmax:8,grow:8}); setBanner('The roots burn away','',1.4); saveGame(); }
function trialSwing(px,py,dir,range,half){
  for(const o of AREA.objs) if(o.k==='tswitch'&&o.acc.includes('slash')&&inArcC(px,py,dir,range+10,half,{x:o.x,y:o.y,r:o.r})) trialSwitchOn(o);
}
// weapons call this along arrow and boomerang flights, and for hammer slams and spear thrusts. src: 'arrow', 'boomerang',
// 'hammer', 'spear', 'slash', 'daggers' or 'fire'. Returns true when something here reacted (so an arrow can stop).
function areaObjHit(x,y,r,src){
  const A=AREA; if(!A||!A.objs) return false;
  let hit=false; r=r||8;
  for(const o of A.objs){
    if(o.k==='tswitch'){ if(dist(x,y,o.x,o.y)<r+o.r){ if(o.acc.includes(src)){ trialSwitchOn(o); hit=true; } else if(src!=='fire'&&!(o.nope>G.time)){ o.nope=G.time+1; ftext(o.x,o.y-28,o.acc.includes('boomerang')?'Needs a boomerang':'Needs an arrow','#c8d8ff',12); } } }
    else if(o.k==='teye'){ if(dist(x,y,o.x,o.y)<r+o.r&&!o.lit){ if(src==='arrow'){ if(o.open){ o.lit=true; o.t=o.timed||0; SFX.play('shrine'); emit(o.x,o.y,18,{col:'255,226,140',smin:40,smax:150,lmin:.3,lmax:.7,zmin:1.5,zmax:3}); if(o.timed) ftext(o.x,o.y-30,`${o.timed} seconds!`,'#ffe8a0',13); } else { ftext(o.x,o.y-28,'Shut tight. Wait for it to open!','#ffe0b0',12); SFX.play('block',0.5); } hit=true; } else if(src!=='fire'&&!(o.nope>G.time)){ o.nope=G.time+1; ftext(o.x,o.y-28,'Only an arrow wakes it','#ffe0b0',12); } } }
    else if(o.k==='crystal'){ if(src!=='fire'&&o.cd<=0&&dist(x,y,o.x,o.y)<r+18){ hitCrystal(o); hit=true; } }
    else if(o.breakable&&!o.broken&&src!=='fire'&&dist(x,y,o.x,o.y)<r+14){ o.broken=true; SFX.play('pop'); emit(o.x,o.y,14,{col:o.k==='barrel'?'120,80,40':'170,120,80',glow:false,smin:40,smax:160,lmin:.3,lmax:.6,zmin:2,zmax:4}); if(Math.random()<0.6) dropCoins(o.x,o.y,randi(1,3)); if(o.col){ removeCol(o.col); o.col=null; } hit=true; }
    else if(o.k==='cgate'&&o.type==='crack'&&!o.opened&&src==='hammer'&&dist(x,y,o.x,o.y)<r+56){ breakCrack(o); hit=true; }
    else if(o.k==='cgate'&&o.type==='roots'&&!o.opened&&src==='fire'&&dist(x,y,o.x,o.y)<r+34){ burnRoots(o); hit=true; }
    else if((o.k==='brazier'||o.k==='lamp2')&&src==='fire'&&!o.lit&&dist(x,y,o.x,o.y)<r+16){ o.lit=true; SFX.play('pickup'); emit(o.x,o.y,12,{kind:'fire',ang:-Math.PI/2,spread:0.6,smin:20,smax:80,lmin:.4,lmax:.8,zmin:3,zmax:6,grow:5}); hit=true; }
    else if(o.k==='ctorch'&&src==='fire'&&!o.lit&&dist(x,y,o.x,o.y)<r+14){ caveBreath((ox,oy)=>ox===o.x&&oy===o.y,0); hit=true; }
  }
  return hit;
}
// test hooks (see the solver test in the scratchpad)
window.__ebX=Object.assign(window.__ebX||{},{TRIALS,trialOpen,trialDone,areaObjHit,trialFall,trialSwitchOn,tCell,tGround,tWet,tHole,
  tri(){ return AREA&&AREA.tri; },
  // (v12 TRIALS) the gift loans: hasAbil as the game sees it, the loans, and a save right now
  dunMap:aid=>{ const M=CAVEMAP[aid]; if(!M) return null; const rooms={};
    for(const k in M.rooms){ const R=M.rooms[k], pay=[];
      if(R.kind==='shrine') pay.push('gift shrine'); if(R.kind==='reward') pay.push('altar');
      for(const L of R.loot||[]) pay.push(String(L)); if(R.big) pay.push('great chest: '+R.big); if(R.reward==='key') pay.push('small key');
      if(R.pick) pay.push('pickup: '+R.pick); if(R.npc) pay.push('person: '+R.npc); if(R.page) pay.push('page');
      const gb=R.boss?R.boss[0]:R.c1boss||R.f2boss||R.m3boss||(R.boss2&&R.boss2.type)||(R.kind==='tboss'?'trial guardian':null); if(gb) pay.push('guardian: '+gb);
      if(R.sealChest) pay.push('(sealed until won)');
      rooms[k]={kind:R.kind,pay}; }
    return {rooms,links:M.links.map(L=>[L[0],L[1],String(L[2])])}; },
  hasAbilT:id=>hasAbil(id), dunRooms:id=>{ const D=DUNGEONS[id], fl=(D&&D.floorIds)||[id], out=[]; for(const aid of fl){ const M=CAVEMAP[aid]; if(M) for(const k in M.rooms) out.push([aid,k,M.rooms[k].kind]); } return out; }, lends:()=>Object.fromEntries(Object.entries(G.flags||{}).filter(([k])=>k.slice(0,6)==='tlend_')), lendable, trialLendRoot, saveNow:()=>saveGame(true),
  roomsOf:()=>AREA&&AREA.rooms?Object.fromEntries(Object.entries(AREA.rooms).map(([k,R])=>[k,{kind:R.kind,solved:!!R.solved,boss:R.boss?R.boss[0]:null,foes:R.enemies.filter(e=>!e.dead).length,cx:Math.round(R.cx),cy:Math.round(R.cy)}])):null,
  trialTp(room,dx,dy){ const R=AREA.rooms[room]; player.x=R.cx+(dx||0); player.y=R.cy+(dy||0); updateCam(0,true); },
  trialObjs(k){ return AREA.objs.filter(o=>o.k===k||o.tobj===k||(o.k==='tv'&&o.kind===k)).map(o=>({k:o.k,tobj:o.tobj,id:o.id,x:o.x,y:o.y,room:o.room,on:o.on,lit:o.lit,open:o.open,item:o.item})); },
  trialAct(id){ const o=AREA.objs.find(q=>q.id===id); if(o) caveObjAct(o); },
  killRoom(rid){ const R=AREA.rooms[rid]; let n=0; for(const e of R.enemies) if(!e.dead&&!e.trialBoss){ killEnemy(e); n++; } for(const e of G.enemies) if(!e.dead&&e.inArea&&e.room===rid&&!e.trialBoss){ killEnemy(e); n++; } return n; },
  sinkBlock(i){ const b=AREA.blocks[i]; if(!b) return false; const c=AREA.cave; for(const dir of [-1,1]){ for(let d=1;d<12;d++){ const ni=b.ci+dir*d, k=b.cj*c.w+ni; if(c.grid[k]!==0||caveBlockedAt(k)) break; if(c.typ[k]===TY.pit){ b.ci=ni; b.anim=0; trialSinkBlock(b); return true; } if(c.typ[k]!==0) break; } } return false; },
  eyeOpen(id){ const o=AREA.objs.find(q=>q.id===id); if(o) o.open=true; },
  trialFx(){ const T=AREA&&AREA.tri; return T?{rings:T.rings.length,logs:T.logs.length,roots:T.roots.length,zones:T.zones.length}:null; },
  propsNear(x,y,r){ const out=[]; for(let cx=Math.floor((x-r)/CH);cx<=Math.floor((x+r)/CH);cx++) for(let cy=Math.floor((y-r)/CH);cy<=Math.floor((y+r)/CH);cy++) for(const q of propsFor(cx,cy)) if(dist(q.x,q.y,x,y)<r){ const t={}; T(q.x,q.y,t); out.push([q.k,Math.round(q.x),Math.round(q.y),t.water]); } return out; },
  probe(x,y){ const t={}; T(x,y,t); return {blocked:blockedAt(x,y),water:t.water,b:t.b,isle:ISLES.length?isleD(x,y):null,walk:!!onWalkway(x,y)}; }
});
