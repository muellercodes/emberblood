
// ================= caves: hand-planned room dungeons with keys, locked doors, shutters and puzzles
// Each cave is a grid of rooms (15x11 floor cells each, sharing walls). Rooms hold a fight, a puzzle, a person or treasure.
// Links between rooms are doors: open, lock (small key), gate:<room> (opens when that room is solved), crack (secret, roar or
// lots of fire breaks it), red/blue (crystal pillars: closed while that colour is raised).
const RIW=15, RIH=11, RSX=16, RSY=12;
const CAVE_TPL={
  braz3:['...............','.Z...........Z.','...............','...##.....##...','...............','.......X.......','...............','...##.....##...','...............','.......Z.......','...............'],
  braz4:['...............','.Z...........Z.','...............','....#.....#....','...............','.......X.......','...............','....#.....#....','...............','.Z...........Z.','...............'],
  torch4:['....M..........','...............','..T.........T..','...............','...............','.......X.......','...............','...............','..T.........T..','...............','...............'],
  block1:['...............','.##.........##.','.#...........#.','...............','.....B.........','...............','.........P.....','...............','.#...........#.','.##.........##.','.............S.'],
  block2:['...............','...#.......#...','...#.......#...','...#B.....B#...','...............','...............','....P.....P....','...............','...#.......#...','...#.......#...','.S...........S.'],
  cart:['...............','...............','..B............','...............','...............','...............','..P............','...............','...............','...............','.............S.'],
  crys1:['...............','.RRR.......UUU.','.R.R.......U*U.','.RXR.......UUU.','..R............','.......C.......','...............','..#.........#..','...............','...............','...............'],
  crys2:['...............','.RRRR.....UUUU.','.R..R.....U..U.','.RX.R.....U*.U.','.RRRR.....UUUU.','...............','.......C.......','...............','..##.......##..','...............','...............'],
  dark4:['...............','.L...........L.','...............','...#.......#...','...............','.......X.......','...............','...#.......#...','...............','.L...........L.','...............'],
  pool:['...............','...............','...~~~~~~~~~...','..~~~~~~~~~~~..','..~~~~~~~~~~~..','...~~~~~~~~~...','.......N.......','...............','...............','...............','...............'],
  pool_s:['...............','..~~~.....~~~..','.~~~~.....~~~~.','.~~~.......~~~.','...............','...............','...............','.~~.........~~.','.~~~.......~~~.','..~~.......~~..','...............'],
  wreck:['...............','..~~~~~~~~~~~..','.~~~~~~~~~~~~~.','.~~~~~Q~~~~~~~.','.~~~~~.~~~~~~~.','...............','.......G.......','...............','...............','...............','...............'],
  ice_s:['...............','..IIII...IIII..','.IIIIII.IIIIII.','.IIIIIIIIIIIII.','..IIIIIIIIIII..','...IIIIIIIII...','..IIIIIIIIIII..','.IIIIIIIIIIIII.','.IIIIII.IIIIII.','..IIII...IIII..','...............'],
  icemaze:['IIIIIIIIIIIIIII','I#II#IIIIII#III','IIIIIIII#IIIIII','III#IIIIIIII#II','IIIIII#IIIIIIII','IIIIIIIIIIIIIII','I#IIIIIIII#IIII','IIIII#IIIIIIII#','II#IIIIIII#IIII','IIIIIIII#IIIIII','IIIIIIIIIIIIIII'],
  camp:['...............','...............','...............','...............','...............','......N........','...............','...............','...............','...............','...............']
};
const CAVEMAP={
  whisper:{rooms:{a:{at:[1,2],kind:'start',sign:'Juniper was here. So were the bats. Mostly the bats.'},b:{at:[1,1],kind:'fight',foes:[['slime',3],['bat',2]]},c:{at:[1,0],kind:'npc',tpl:'camp',npc:'juniper'},d:{at:[0,2],kind:'braziers',tpl:'braz3',loot:['chest']},e:{at:[0,1],kind:'secret',loot:['page:p1','coins']},f:{at:[2,2],kind:'fight',foes:[['kobold',3],['bat',2]]}},
    links:[['a','b','open'],['b','c','open'],['a','d','open'],['d','e','crack'],['a','f','open']]},
  mirrow:{rooms:{a:{at:[1,1],kind:'start',sign:'Pink pillars rise and fall when the crystal sings. Hit it.'},b:{at:[1,0],kind:'npc',tpl:'pool',npc:'shellby'},c:{at:[0,1],kind:'crystal',tpl:'crys1',loot:['chest']},d:{at:[2,0],kind:'secret',loot:['coins','treat']},e:{at:[2,1],kind:'fight',foes:[['bat',3],['slime',3]]}},
    links:[['a','b','red'],['a','c','open'],['b','d','crack'],['a','e','open']]},
  tunnel:{rooms:{a:{at:[1,3],kind:'start',sign:'PRIVATE. SCALED OATH ONLY. THIS MEANS YOU, DRAGONS.'},b:{at:[1,2],kind:'fight',foes:[['cultist',2],['kobold',3]]},c:{at:[0,2],kind:'blocks',tpl:'block1',reward:'key'},d:{at:[2,2],kind:'lever',foes:[['kobold',2]]},e:{at:[1,1],kind:'boss',boss:['knight','The Oath’s Champion'],foes:[['cultist',2]],loot:['qitem']},f:{at:[2,1],kind:'secret',loot:['page:p8','coins']}},
    links:[['a','b','open'],['b','c','open'],['b','d','lock'],['b','e','gate:d'],['e','f','crack']]},
  mine:{rooms:{a:{at:[1,3],kind:'start',sign:'DANGER: LIZARDS. Signed, Gorran. P.S. Push the cart onto the plate to open the deep shaft.'},b:{at:[1,2],kind:'fight',foes:[['drakeling',3],['egg',3]]},c:{at:[2,3],kind:'fight',foes:[['bat',3]],loot:['ore']},d:{at:[0,2],kind:'dark',tpl:'dark4',reward:'key'},e:{at:[1,1],kind:'blocks',tpl:'cart',cart:true},f:{at:[1,0],kind:'boss',boss:['drakeling','The Drakeling Matriarch'],foes:[['egg',2]],loot:['qitem']},g:{at:[2,1],kind:'treasure',loot:['chest','page:p5']},h:{at:[2,0],kind:'secret',loot:['coins','rock']}},
    links:[['a','b','open'],['a','c','open'],['b','d','open'],['b','e','open'],['e','f','gate:e'],['e','g','lock'],['g','h','crack']]},
  grotto:{rooms:{a:{at:[1,2],kind:'start',tpl:'pool_s',sign:'The old frogs knew the order of the flames. So does the wall.'},b:{at:[0,2],kind:'fight',foes:[['slime',4],['kobold',2]]},c:{at:[2,2],kind:'blocks',tpl:'block1'},d:{at:[1,1],kind:'torches',tpl:'torch4'},e:{at:[2,1],kind:'treasure',tpl:'wreck',loot:['qitem','page:p4']},f:{at:[1,0],kind:'treasure',loot:['chest']},g:{at:[0,1],kind:'secret',loot:['coins','treat']}},
    links:[['a','b','open'],['a','c','open'],['a','d','open'],['c','e','gate:c'],['d','f','gate:d'],['d','g','crack']]},
  icefang:{rooms:{a:{at:[1,2],kind:'start',tpl:'ice_s',sign:'Slippery. Ulf was here, and fell over. Twice.'},b:{at:[1,1],kind:'ice',tpl:'icemaze',foes:[['wolf',2]]},c:{at:[0,1],kind:'braziers',tpl:'braz4',timed:14},d:{at:[0,0],kind:'boss',boss:['wolf','The Frost Alpha'],foes:[['wolf',2]],loot:['qitem'],reward:'key'},e:{at:[2,1],kind:'treasure',loot:['chest','page:p6']},f:{at:[2,0],kind:'secret',loot:['coins']},g:{at:[2,2],kind:'fight',foes:[['bat',4],['slime',2]]}},
    links:[['a','b','open'],['b','c','open'],['c','d','gate:c'],['b','e','lock'],['e','f','crack'],['a','g','open']]},
  deep:{rooms:{a:{at:[1,4],kind:'start',sign:'Here lies the Ember Deep. Whoever reads this: the Wardens left their last gift at the very top.'},b:{at:[1,3],kind:'fight',foes:[['cultist',2],['drakeling',2]]},c:{at:[0,3],kind:'maze',dark:true,reward:'key'},d:{at:[2,3],kind:'crystal',tpl:'crys2',loot:['chest']},e:{at:[1,2],kind:'blocks',tpl:'block2'},f:{at:[1,1],kind:'torches',tpl:'torch4',foes:[['slime',3]]},g:{at:[1,0],kind:'boss',boss:['knight','The Ember Knight'],foes:[['cultist',2]],loot:['relic']},h:{at:[0,1],kind:'treasure',loot:['chest','page:p10']},i:{at:[2,2],kind:'secret',loot:['coins','treat']}},
    links:[['a','b','open'],['b','c','open'],['b','d','open'],['b','e','red'],['e','f','gate:e'],['f','g','gate:f'],['f','h','lock'],['e','i','crack']]}
};
// the Trials (a2h_dungeons.js) add their own maps later, so the tally is recounted after they load
const countCaveSecrets=()=>Object.values(CAVEMAP).reduce((n,m)=>n+Object.values(m.rooms).filter(r=>r.kind==='secret').length,0);
let CAVE_SECRETS=countCaveSecrets();
// ---------- v9: Whisperwood Hollow, Mirrow Grotto and the Oath's Hidden Tunnel, rebuilt as real dungeons. Their mechanics
// live in e9a_dungeon.js, which turns every CAVEMAP entry with a dun:{...} block into a dungeon (new save prefixes a1_*)
const V9_TPL={"w_a":["...............","....l..........","...............",".##.........##.","...............","...............","...............",".##.........##.","...........s...","...............","..............."],
  "w_b":["...............",".#...........#.","...............",".......l.......","...............","...............","...............","rrrrrrrrrrrrrrr","...............","..s............","..............."],
  "w_c":["...............",".X.............","...............","...##.....##...","...............","...............","...............","...##.....##...","...............","...............","..............."],
  "w_d":["...............","..%%%%%%%%%%%..",".%%%%%%%%%%%%%.",".%%%%%%%%%%%%%.","%%%%%%%%%%%%%%.","%%%%%%%%%%%%%%.","%%%%%%%%%%%%%%.",".%%%%%%%%%%%%%.",".%%%%%%%%%%%%%.","..%%%%%%%%%%%..","..s............"],
  "w_f":["...............",".#.....*.....#.",".##.........##.","...............",".....=====.....",".....=====.....",".....==/==.....","...............",".##.........##.",".#...........#.","..s............"],
  "w_g":["...............","..rrr..........","..rXr..l.......","..rrr..........","...............","...........*...",".*.............","...............","....#.....#....","...............","..............."],
  "w_h":["...............",".##.........##.",".#...........#.","...............","...............","...............","...............","...............",".#...........#.",".##.........##.","..............."],
  "w_i":["...............","...............","..........X....","...............","...............",".....N.........","...............","...*.......*...","...............","...............","..............."],
  "w_j":["...............",".#...........#.","...............",".......X.......","...............","...............","...............","...#.......#...","...............",".#...........#.","..............."],
  "w_k":["...............",".f..ooo........","....ooo...j....",".........ooo...",".ooo.....ooo.f.",".ooo...........",".......ooo.....",".l.....ooo.....","...f.......X...","...............","..............."],
  "w_m":["...............","..r.......r....",".........l.....","...............","..r..........r.","...............","....*.....*....","...............",".r...........r.","...............","..............."],
  "w_n":["...............",".f.............","..<.......f....","...............","....##...##....","...............","....##...##....","...............","..f........l...","...............","..............."],
  "w_o":["...............",".=============.",".==X========l=.",".=============.",".____=========.","............./.",".............r.","...............","...*.......*...","...............","..............."],
  "m_a":["...............","...............","aaaaaaaaaaaaaaa","aaaaaaaaaaaaaaa","...............","...............","...............",".....c.........","...........*...","..s............","..............."],
  "m_b":["...............","xxxxxxxxxxxxxxx","xxxxxxxxxxxxxxx","...............","...............",".*...........*.",".....=====.....",".....=e=X=.....",".....==/==.....","...............","..s............"],
  "m_c":["...............","...wwwwwww.....","..wwwwwwwww....","..wwwwwwwww....","...wwwwwww.....","......N........","...............","...*.......*...","...............","...............","..............."],
  "m_e":["...............","...............",".#...........#.","...aaa.........","...aaa.........","...ama.........","...aaa.........","...............",".O..m..........","...........s...","..............."],
  "m_f":["#####.....#####","#####aaaaa#####","#####aaaaa#####","#####aaaaa#####",".zzzz.....yyyy.",".zzzz.....yyyy.",".zzzz.....yyyy.","#####..*..#####","#####c...i#####","#####.....#####","#####s....#####"],
  "m_g":["...............",".......K.......","...............","..#.........#..","...............",".......m.......","...............","..#.........#..",".......X.......","...............","..............."],
  "m_h":["...............",".ww.........ww.",".ww.........ww.","...............","...............","...............","...............","...............",".ww.........ww.",".ww.........ww.","..............."],
  "m_i":["...............",".wwwwwwwwwwwww.",".wwwwwwwwwwwww.",".www.....wwwww.",".www..X..wwwww.",".www.....wwwww.",".wwwwwwwwwwwww.",".wwwwwwwwwwwww.",".zzzzzzzzzzzzz.","...............","..............."],
  "m_j":["...............",".#...........#.","...............","...##.....##...","...............",".......X.......","...............","...##.....##...","...............",".#...........#.","..............."],
  "m_k":["...............","...............","...*.......*...",".......X.......","...............","...............","...............","...............","...*.......*...","...............","..............."],
  "m_l":["...............","...............","..aaaaaaaaaa...","..aaaaaaaaaa...","..aaaaXaaaaa...","..aaaaaaaaaa...","..aaaaaaaaaa...","..aaaaaaaaaa...","...............","...............","..............."],
  "t_a":["...............","...............",".#...........#.","...............","...............",".----A.........","...............","...............",".#..s........#.","...............","..............."],
  "t_b":["...............",".......|.......",".#.....|.....#.",".......|.......",".......|.......",".......|.......",".......|.......",".......A.H.....","...............",".#..s........#.","..............."],
  "t_c":["...............",".X.............","...............","..##.......##..","...............","...............","...............","..##.......##..","...............","...............","..............."],
  "t_d":["...............","...............","...............","...oooooooooooo","...oooooooooooo","...oooooooooooo","...ooooooo9999.","...ooooooo9999X","...ooooooo9999.",".s.oooooooooooo","...oooooooooooo"],
  "t_e":["...............","...............","...............",".####...####...","...........#...","...........---.","...........#...","...#.......#...","...............","...............","..............."],
  "t_g":["ooooooooooooooo","ooooooooooooooo","ooooooooooooooo","ooooooottttttoo","..oooootoooot..",".-tooootoooot-.","..ttttt+ooooo..","oooooootooooooo","ooo....|....ooo","ooo....|....ooo","ooo.s.......ooo"],
  "t_h":["...............",".##.........##.",".......Q.......","...............","...............","...............","...............","...............","...............",".##.........##.","..............."],
  "t_i":["...............","...............","...............",".......X.......","...............","...*.......*...","...............","...............","...............","...............","..............."],
  "t_j":["...............","..#....#....#..","...............","...............","...............","---------------","...............","...............","..#....#....#..","...............","..............."],
  "t_k":["...............",".#...........#.",".......$.......","...!.......;...","...............",".......X.......","...............","...$.......!...",".......;.......",".s.............","..............."],
  "t_l":["...............","............X..","..BB....BB.....","...............","...............","...............","...............","..BB....BB.....","...............",".....#...#.....","..............."],
  "t_m":["...............","...............","...*.......*...","..H............","...............",".---....X......","...............","...............","...*.......*...","...............","..............."]};
// Whisperwood Hollow: living roots that grow back unless a lit lantern-pod keeps them away, spore pods that light the dark,
// a cracked floor down to the Root Cellar. The Heartroot needs all three heart pods (one upstairs, two in the cellar).
CAVEMAP.whisper={dun:{save:'a1_whisper',regrow:7,pods:{heart:3},floors:[{id:'1',name:S('The Hollow','The Hollow')},{id:'b1',area:'whisper_b1',name:S('The Root Cellar','The Root Cellar')}],
    story:{in:[['ash',S(`Juniper? JUNIPER! ...Just bats, and a whole lot of roots.`,`Juniper? Just bats. And roots!`)],['ash',S(`Did that root just move? Roots are not supposed to move.`,`Did that root move?!`)]]}},
  rooms:{
    a:{at:[1,3],kind:'start',tpl:V9_TPL.w_a,sign:S(`Chalk on the wall, in Juniper's writing: "Roots hate fire. Lantern-pods hate the dark. Breathe on both. J."`,`Juniper wrote: "Burn the roots. Light the pod."`)},
    b:{at:[1,2],kind:'pods',tpl:V9_TPL.w_b,sign:S(`Roots grow back fast in the Hollow. Burn them, then run! A lit lantern-pod nearby keeps them gone.`,`Burn the roots, then run! Then light the pod.`)},
    c:{at:[0,2],kind:'fight',tpl:V9_TPL.w_c,foes:[['slime',3],['bat',2]],loot:['dmap'],solveOnClear:true,sealChest:true},
    d:{at:[2,2],kind:'free',tpl:V9_TPL.w_d,sign:S(`The floor here is thin and cracked. The Root Cellar is right underneath.`,`The floor is thin. The cellar is under it.`)},
    e:{at:[0,3],kind:'secret',loot:['page:p1','coins']},
    f:{at:[1,1],kind:'free',tpl:V9_TPL.w_f,sign:S(`THE HEARTROOT. It drinks the light of three lantern-pods, one up here and two in the cellar below. Light all three, then burn it.`,`The Heartroot needs three pods lit. Then burn it!`)},
    g:{at:[0,0],kind:'pods',tpl:V9_TPL.w_g,foes:[['slime',2]],loot:['compass']},
    h:{at:[1,0],kind:'boss',tpl:V9_TPL.w_h,boss:['bramble','Thornhide the Root Ram'],foes:[['slime',2]],tint:'#9a7a4a'},
    i:{at:[2,0],kind:'npc',tpl:V9_TPL.w_i,npc:'juniper',loot:['heart']},
    j:{at:[2,1],kind:'fight',tpl:V9_TPL.w_j,foes:[['kobold',2],['bat',2]],loot:['bkey'],solveOnClear:true,sealChest:true},
    k:{at:[0,1],kind:'spores',tpl:V9_TPL.w_k,dark:true,reward:'key',pods:'heart'}},
  links:[['a','b','roots'],['b','c','open'],['b','d','lock'],['b','f','open'],['c','k','open'],['k','g','open'],['f','h','boss'],['f','j','roots',{heart:'heart',n:3}],['h','i','gate:h'],['a','e','crack']]};
CAVEMAP.whisper_b1={rooms:{
    m:{at:[2,2],kind:'fight',tpl:V9_TPL.w_m,foes:[['bat',2]]},
    n:{at:[1,2],kind:'spores',tpl:V9_TPL.w_n,dark:true,foes:[['kobold',2]],pods:'heart'},
    o:{at:[2,1],kind:'pods',tpl:V9_TPL.w_o,pods:'heart',loot:['treasure+map_x1']}},
  links:[['m','n','open'],['m','o','roots']]};
// Mirrow Grotto: three tide crystals set the water of the whole grotto low, middle or high. Low water dries the basins,
// middle water floats the rafts, high water floats the deep rafts and floods the terraces. A sun crystal's beam crosses
// three rooms to the crystal eye. Water Stride opens the Drowned Gallery.
CAVEMAP.mirrow={dun:{save:'a1_mirrow',water:{start:2},carry:{cv_mirrow_d_treat:'cv_a1_mirrow_d_treat'},
    story:{in:[['ash',S(`The whole grotto is flooded! The water hums. The crystals hum back.`,`It is all flooded! The crystals hum.`)]]}},
  rooms:{
    a:{at:[1,3],kind:'start',tpl:V9_TPL.m_a,puzzle:true,sign:S(`Tide crystals sing the water up and down. One wave: low. Two waves: middle. Three waves: high. Hit one and listen.`,`Hit a crystal. The water goes up or down.`)},
    b:{at:[1,2],kind:'tide',tpl:V9_TPL.m_b,loot:['dmap'],sign:S(`The rafts lie at the bottom of their wells until the water lifts them.`,`Rafts float when the water is up.`)},
    c:{at:[0,2],kind:'npc',tpl:V9_TPL.m_c,npc:'shellby'},
    d:{at:[0,3],kind:'secret',loot:['coins','treat']},
    e:{at:[0,1],kind:'tide',tpl:V9_TPL.m_e,beam:'e',rot:{'4,8':1,'4,5':1},sign:S(`The sun crystal never sleeps. Bend its light east, all the way to the crystal eye. A mirror under the water cannot shine.`,`Turn the mirrors. Send the light east. Mirrors under water do not work.`)},
    f:{at:[1,1],kind:'tide',tpl:V9_TPL.m_f,sign:S(`THE TIDE HALL. West when the terrace is dry, east when the deep rafts float, north when the basin is empty. Plan it!`,`West: not high. East: high. North: low.`)},
    g:{at:[2,1],kind:'beam',tpl:V9_TPL.m_g,rot:{'7,5':1},foes:[['bat',2]],loot:['bkey'],sealText:S(`The great chest is held shut by a cold crystal eye. It wants light.`,`The eye wants light.`)},
    h:{at:[1,0],kind:'boss',tpl:V9_TPL.m_h,boss:['crab','Captain Clatter'],foes:[['crab',2]],tint:'#d07a6a'},
    i:{at:[0,0],kind:'treasure',tpl:V9_TPL.m_i,loot:['treasure']},
    j:{at:[2,3],kind:'fight',tpl:V9_TPL.m_j,foes:[['crab',2],['bat',2]],solveOnClear:true,reward:'key'},
    k:{at:[2,0],kind:'treasure',tpl:V9_TPL.m_k,loot:['heart+treat']},
    l:{at:[2,2],kind:'tide',tpl:V9_TPL.m_l,loot:['compass'],foes:[['crab',1]]}},
  links:[['a','b','open'],['b','c','open'],['b','l','open'],['b','f','open'],['l','j','open'],['j','a','oneway',{from:'j'}],['c','d','crack'],['f','e','lock'],['f','g','open'],['f','h','boss'],['h','k','gate:h'],['e','i','open']]};
// The Oath's Hidden Tunnel: mine carts on rails, switch points set by a lever in the guard post, Oath guards with lantern
// eyes (get seen and the doors slam), a timed gate the cart has to beat, an ore chute with a moving lift and belts.
CAVEMAP.tunnel={dun:{save:'a1_tunnel',
    story:{in:[['ash',S(`Rails, carts and lanterns. The Oath has been busy down here.`,`Rails and carts. The Oath was busy!`)],['ash',S(`If a guard sees me, they'll ring every bell in the place. Time to be sneaky.`,`I must sneak past the guards!`)]]}},
  rooms:{
    a:{at:[1,3],kind:'start',tpl:V9_TPL.t_a,cartDir:'w',sign:S(`OATH TUNNEL. AUTHORIZED KOBOLDS ONLY. Mine carts: climb in to ride. Please do not ride carts into walls. (Gerald, we mean you.)`,`Climb in a cart to ride. Do not crash into walls!`)},
    b:{at:[1,2],kind:'rails',tpl:V9_TPL.t_b,cartDir:'n',timed:10,puzzle:true,sign:S(`LOADING DOCK. The vault gate in the Lamp Hall opens for ten seconds when the switch is struck. The cart is quick. Are you?`,`Hit the switch. Ride fast to the vault!`)},
    c:{at:[0,2],kind:'fight',tpl:V9_TPL.t_c,foes:[['cultist',2],['kobold',3]],loot:['dmap'],solveOnClear:true,sealChest:true},
    d:{at:[2,2],kind:'treasure',tpl:V9_TPL.t_d,loot:['compass'],puzzle:true,movers:[{a:[3,7],b:[8,7],w:2,h:2,speed:60,wait:1.2}],sign:S(`ORE CHUTE. Mind the lift, mind the belts, and most of all, mind the big hole.`,`Ride the lift. Walk against the belts. Mind the hole!`)},
    e:{at:[0,1],kind:'stealth',tpl:V9_TPL.t_e,levers:[{at:[2,1],room:'g',point:[7,6]}],guards:[{path:[[1,8],[13,8]],wait:1.2,speed:50},{path:[[5,1],[13,1]],wait:1.6,speed:44}]},
    f:{at:[0,3],kind:'secret',loot:['page:p8','coins']},
    g:{at:[1,1],kind:'rails',tpl:V9_TPL.t_g,points:{'7,6':2},puzzle:true,sign:S(`SWITCHYARD. The points lever is in the guard post, where nobody can touch it. Signed, the guards.`,`The lever is in the guard post.`)},
    h:{at:[1,0],kind:'boss',tpl:V9_TPL.t_h,boss:['knight','The Oath’s Champion'],foes:[['cultist',2]],loot:['qitem']},
    i:{at:[2,0],kind:'treasure',tpl:V9_TPL.t_i,loot:['heart']},
    j:{at:[2,1],kind:'stealth',tpl:V9_TPL.t_j,guards:[{path:[[4,2],[4,8]],wait:0.8,speed:56},{path:[[10,8],[10,2]],wait:0.8,speed:56}]},
    k:{at:[0,0],kind:'tiles',tpl:V9_TPL.t_k,seq:['gold','pink','blue','gold'],loot:['treasure'],sign:S(`The Oath's secret code: the sun, the rose, the sky, then the sun again.`,`The code: gold, pink, blue, gold.`)},
    l:{at:[2,3],kind:'stealth',tpl:V9_TPL.t_l,loot:['skey'],guards:[{path:[[6,1],[6,9]],wait:1.4,speed:46}]},
    m:{at:[3,1],kind:'treasure',tpl:V9_TPL.t_m,timed:8,loot:['bkey']}},
  links:[['a','b','open'],['a','l','open'],['a','f','crack'],['b','c','open'],['b','d','open'],['b','g','lock'],['c','e','open'],['g','e','open'],['g','j','open'],['j','m','timed',{room:['b','m']}],['j','d','oneway',{from:'j'}],['e','k','open'],['k','h','boss'],['h','i','gate:h']]};
CAVE_SECRETS=countCaveSecrets();
// cell types in cave.typ: 0 floor, 1 water pool (blocks), 2 ice; the Trials add these (see a2h_dungeons.js)
const TY={deep:3,pit:4,crumble:5,spike:6,chasm:7,current:8,basin:9,stones:10,rune:12};
// template letters for them: w deep channel, o pit, k crumbling tile, ^ spikes, : chasm, 1-4 current (north, east, south, west),
// h basin (water at high tide), p stepping stones (dry at high tide), g rune floor
const TY_CH={w:3,o:4,k:5,'^':6,':':7,'1':8,'2':8,'3':8,'4':8,h:9,p:10,g:12};
// TY_FLOW: letters that also set a flow direction (0 N, 1 E, 2 S, 3 W); TY_KEEP: cell letters that are also kept as marks
const TY_FLOW={'1':0,'2':1,'3':2,'4':3}, TY_KEEP={};
const TORCH_SYMS=['Sun','Moon','Star','Leaf'];
const PUZZLE_KINDS={braziers:1,torches:1,blocks:1,crystal:1,dark:1,maze:1,lever:1};
const SEAL_KINDS={braziers:1,torches:1,blocks:1,dark:1,maze:1};
const cf=(k)=>G.found[k];
// save prefixes: sid for one floor's rooms, dsid for the whole dungeon (keys, crystal, map, Boss Key); both default to the area id
const caveSid=d=>d.sid||d.id, caveDsid=d=>d.dsid||d.sid||d.id;
// dungeons registered by defineDungeon (e9a_dungeon.js); the Trial code reads them like TRIALS
const DUNGEONS={};

// ---------- building the grid
function genCaveRooms(def){
  const M=CAVEMAP[def.id], rng=mulberry32(def.seed*977+5);
  let mxMax=0,myMax=0; for(const k in M.rooms){ const R=M.rooms[k], [mx,my]=R.at, sp=R.span||[1,1]; mxMax=Math.max(mxMax,mx+sp[0]-1); myMax=Math.max(myMax,my+sp[1]-1); }
  const w=(mxMax+1)*RSX+1, h=(myMax+1)*RSY+1;
  const g=new Uint8Array(w*h).fill(1), typ=new Uint8Array(w*h), flow=new Int8Array(w*h).fill(-1); // typ: see TY; flow: current direction 0..3
  const rooms={}, marks=[];
  for(const k in M.rooms){
    const R=Object.assign({id:k},M.rooms[k]); const [mx,my]=R.at, sp=R.span||[1,1]; R.ox=mx*RSX; R.oy=my*RSY; R.sw=sp[0]; R.sh=sp[1]; R.iw=sp[0]*RSX-1; R.ih=sp[1]*RSY-1; rooms[k]=R; R.links=[];
    let tpl=R.tpl?(Array.isArray(R.tpl)?R.tpl:CAVE_TPL[R.tpl]).slice():null;
    if(R.kind==='maze') tpl=mazeTpl(rng);
    for(let r=0;r<R.ih;r++) for(let c=0;c<R.iw;c++){
      const i=R.ox+1+c, j=R.oy+1+r, k2=j*w+i, ch=tpl?(tpl[r]&&tpl[r][c])||'.':'.';
      if(ch==='#'){ g[k2]=1; continue; }
      g[k2]=0;
      if(ch==='~'){ g[k2]=1; typ[k2]=1; continue; }
      if(ch==='I'){ typ[k2]=2; continue; }
      if(TY_CH[ch]!=null){ typ[k2]=TY_CH[ch]; if(TY_FLOW[ch]!=null) flow[k2]=TY_FLOW[ch]; if(!TY_KEEP[ch]) continue; }
      if(ch!=='.') marks.push({room:k,ch,i,j,c,r});
    }
    if(!tpl&&R.kind!=='secret'&&!R.trial) scatterRocks(R,g,w,rng);
  }
  // door gaps: on the wall two rooms share (rooms can span several grid cells)
  const gaps=[];
  M.links.forEach(([a,b,type,opt],li)=>{
    const A=rooms[a], B=rooms[b];
    const ax0=A.at[0], ax1=ax0+A.sw-1, ay0=A.at[1], ay1=ay0+A.sh-1, bx0=B.at[0], bx1=bx0+B.sw-1, by0=B.at[1], by1=by0+B.sh-1;
    const vertical=(ay1+1===by0||by1+1===ay0)&&Math.max(ax0,bx0)<=Math.min(ax1,bx1);
    const cells=[];
    if(vertical){ const top=ay1<by0?A:B, col=opt&&opt.at!=null?opt.at:Math.max(ax0,bx0), j=(top.at[1]+top.sh)*RSY; for(let i=col*RSX+7;i<=col*RSX+9;i++) cells.push(j*w+i); }
    else{ const left=ax1<bx0?A:B, row=opt&&opt.at!=null?opt.at:Math.max(ay0,by0), i=(left.at[0]+left.sw)*RSX; for(let j=row*RSY+5;j<=row*RSY+7;j++) cells.push(j*w+i); }
    for(const k2 of cells){ g[k2]=0; typ[k2]=0; }
    // keep the floor right next to every door clear, so templates can never wall one in (or put a pit there)
    for(const k2 of cells){ const ci=k2%w, cj=(k2-ci)/w; for(const [dx,dy] of vertical?[[0,-1],[0,1]]:[[-1,0],[1,0]]){ const q=(cj+dy)*w+ci+dx; if(typ[q]!==1){ g[q]=0; if(typ[q]!==2) typ[q]=0; } } }
    const L={i:li,a,b,type,vertical,cells,cx:0,cy:0};
    const ci=cells[1]%w, cj=(cells[1]-ci)/w; L.ci=ci; L.cj=cj;
    gaps.push(L); A.links.push(L); B.links.push(L);
  });
  // the way out: the south door of the start room
  const S=Object.values(rooms).find(r=>r.kind==='start');
  if(!S) return {w,h,grid:g,typ,flow,cell:def.cell,rooms,links:gaps,marks,start:null,ex:null,ey:null};   // a lower floor: no way out
  const ej=S.oy+S.sh*RSY; for(let i=S.ox+7;i<=S.ox+9;i++){ g[ej*w+i]=0; typ[ej*w+i]=0; }
  for(let i=S.ox+7;i<=S.ox+9;i++){ g[(ej-1)*w+i]=0; typ[(ej-1)*w+i]=0; }
  return {w,h,grid:g,typ,flow,cell:def.cell,rooms,links:gaps,marks,start:S,ex:S.ox+8,ey:ej};
}
function scatterRocks(R,g,w,rng){
  // a few boulders, never on the cross-shaped lanes between doors
  const iw=R.iw||RIW, ih=R.ih||RIH, mc=iw>>1, mr=ih>>1;
  const n=R.kind==='fight'||R.kind==='boss'?3+Math.floor(rng()*3):1+Math.floor(rng()*2);
  for(let t=0,made=0;t<40&&made<n;t++){
    const c=1+Math.floor(rng()*(iw-2)), r=1+Math.floor(rng()*(ih-2));
    if(Math.abs(c-mc)<=2||Math.abs(r-mr)<=2) continue;
    const big=rng()<0.4;
    for(let dy=0;dy<=(big?1:0);dy++) for(let dx=0;dx<=(big?1:0);dx++){ const cc=c+dx, rr=r+dy; if(cc>=iw-1||rr>=ih-1||Math.abs(cc-mc)<=2||Math.abs(rr-mr)<=2) continue; g[(R.oy+1+rr)*w+R.ox+1+cc]=1; }
    made++;
  }
}
function mazeTpl(rng){
  // a classic depth-first maze on a 7x5 grid of rooms, carved into the 15x11 room
  const C=7, Rr=5, grid=[]; for(let r=0;r<RIH;r++) grid.push(Array(RIW).fill('#'));
  const seen=new Set(), st=[[3,2]]; seen.add('3,2'); grid[5][7]='.';
  while(st.length){
    const [x,y]=st[st.length-1], nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>a>=0&&b>=0&&a<C&&b<Rr&&!seen.has(a+','+b));
    if(!nb.length){ st.pop(); continue; }
    const [nx,ny]=nb[Math.floor(rng()*nb.length)]; seen.add(nx+','+ny);
    grid[1+ny*2][1+nx*2]='.'; grid[1+y*2+(ny-y)][1+x*2+(nx-x)]='.'; st.push([nx,ny]);
  }
  for(let r=0;r<RIH;r++){ grid[r][0]=grid[r][0]==='#'&&(r<4||r>6)?'#':'.'; grid[r][RIW-1]=grid[r][RIW-1]==='#'&&(r<4||r>6)?'#':'.'; }
  for(let c=6;c<=8;c++){ grid[0][c]='.'; grid[RIH-1][c]='.'; }
  for(let r=4;r<=6;r++){ grid[r][0]='.'; grid[r][RIW-1]='.'; }
  // reward at the far corner, a light at each corner
  grid[1][1]='X'; grid[RIH-2][RIW-2]='*'; grid[1][RIW-2]='*'; grid[RIH-2][1]='*';
  return grid.map(r=>r.join(''));
}

// ---------- making the cave live: gates, puzzles, loot, enemies
function buildCaveRooms(A,def){
  const c=genCaveRooms(def), x0=IZX+200, y0=IZY+200, cs=c.cell, SK=caveSid(def), DK=caveDsid(def);
  A.cave=c; Object.assign(A,{x0,y0,x1:x0+c.w*cs,y1:y0+c.h*cs});
  c.dyn=new Int16Array(c.w*c.h); A.gates=[]; A.blocks=[]; A.rooms=c.rooms; A.crys=cf('crys_'+DK)||0; A.keys=()=>cf('keys_'+DK)||0;
  const P=(i,j)=>({x:x0+(i+0.5)*cs,y:y0+(j+0.5)*cs});
  const hasStart=c.start;   // not S: that name is the simple-words helper, used further down
  if(hasStart){ A.exit={x:x0+(c.ex+0.5)*cs,y:y0+(c.ey+0.75)*cs,r:50}; A.spawn={x:A.exit.x,y:A.exit.y-120}; }
  else { const R0=Object.values(c.rooms)[0], q=P(R0.ox+8,R0.oy+6); A.exit={x:q.x,y:q.y,r:0,none:true}; A.spawn={x:q.x,y:q.y}; }
  const rng=mulberry32(def.seed*31+1);
  const addGate=(o,cells)=>{ o.cells=cells; A.gates.push(o); for(const k of cells) c.dyn[k]=A.gates.length; A.objs.push(o); return o; };
  // doors between rooms
  for(const L of c.links){
    const p=P(L.ci,L.cj), key='cv_'+SK+'_link'+L.i;
    const o={k:'cgate',r:56,x:p.x,y:p.y,id:key,type:L.type.split(':')[0],gateRoom:L.type.split(':')[1],vertical:L.vertical,link:L,opened:!!cf(key),tmp:false,closed:false,theme:def.theme};
    addGate(o,L.cells);
    o.prompt=()=>caveGatePrompt(o);
  }
  // great doors and item-sealed doors get a drawn overlay
  for(const o of A.gates) if(o.type==='boss'||o.type==='gate') A.objs.push({k:'tdoor',ref:o,x:o.x,y:o.y,id:o.id+'_d'});
  // the marks from room templates
  const byRoom={}; for(const m of c.marks) (byRoom[m.room]=byRoom[m.room]||[]).push(m);
  let torchN=0;
  for(const k in c.rooms){
    const R=c.rooms[k], ms=byRoom[k]||[], mci=R.ox+1+(R.iw>>1), mcj=R.oy+1+(R.ih>>1), cen=P(mci,mcj); R.cx=cen.x; R.cy=cen.y; R.solved=!!cf('cv_'+SK+'_'+k+'_solved'); R.enemies=[];
    R.x0=x0+(R.ox+1)*cs; R.y0=y0+(R.oy+1)*cs; R.x1=R.x0+R.iw*cs; R.y1=R.y0+R.ih*cs;
    if(R.kind==='free'&&!R.solved){ R.solved=true; }
    const spot=(ch)=>{ const m=ms.find(q=>q.ch===ch); return m?P(m.i,m.j):null; };
    const okCell=(q)=>c.grid[q]===0&&!c.dyn[q]&&(c.typ[q]===0||c.typ[q]===2||c.typ[q]===TY.rune);
    const freeSpot=()=>{ for(let t=0;t<80;t++){ const i=R.ox+2+Math.floor(rng()*(R.iw-2)), j=R.oy+2+Math.floor(rng()*(R.ih-2)); if(okCell(j*c.w+i)&&(Math.abs(i-mci)>1||Math.abs(j-mcj)>1)) return P(i,j); } return cen; };
    // puzzle pieces
    let symOrder=null;
    if(R.kind==='torches'){ symOrder=shuffle([0,1,2,3].slice()); R.order=symOrder; R.seq=[]; }
    for(const m of ms){
      const p=P(m.i,m.j), id=`cv_${SK}_${k}_${m.ch}${m.c}_${m.r}`;
      if(m.ch==='Z'){ const o={k:'brazier',x:p.x,y:p.y,id,room:k,lit:R.solved,r:14,timed:R.timed||0}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:13}); A.lights.push({x:p.x,y:p.y,r:260,i:0,fire:true,obj:o}); }
      else if(m.ch==='T'){ const o={k:'ctorch',x:p.x,y:p.y,id,room:k,sym:torchN++%4,lit:R.solved,r:12}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:11}); A.lights.push({x:p.x,y:p.y,r:230,i:0,fire:true,obj:o}); }
      else if(m.ch==='L'){ const o={k:'lamp2',x:p.x,y:p.y,id,room:k,lit:R.solved,r:12}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:11}); A.lights.push({x:p.x,y:p.y,r:300,i:0,fire:true,obj:o}); }
      else if(m.ch==='M'){ A.objs.push({k:'mural',x:p.x,y:p.y-14,id,room:k,order:symOrder}); }
      else if(m.ch==='B'){ const b={k:'block',ci:m.i,cj:m.j,si:m.i,sj:m.j,x:p.x,y:p.y,id,room:k,cart:!!R.cart,anim:0,fx:p.x,fy:p.y,live:true}; A.blocks.push(b); A.objs.push(b); }
      else if(m.ch==='P'){ A.objs.push({k:'plate',ci:m.i,cj:m.j,x:p.x,y:p.y,id,room:k,pressed:false}); }
      else if(m.ch==='S'){ A.objs.push({k:'resetstone',x:p.x,y:p.y,id,room:k,r:14}); addAreaCol({t:'c',x:p.x,y:p.y,r:12}); }
      else if(m.ch==='C'){ const o={k:'crystal',x:p.x,y:p.y,id,room:k,r:16,cd:0}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:14}); A.lights.push({x:p.x,y:p.y,r:200,i:0.7,tint:'crystal'}); }
      else if(m.ch==='R'||m.ch==='U'){ addGate({k:'pillar',x:p.x,y:p.y,id,room:k,col:m.ch==='R'?'red':'blue',type:m.ch==='R'?'red':'blue',closed:false},[m.j*c.w+m.i]); }
      else if(m.ch==='*'){ A.objs.push({k:'decor',dk:CAVE_DECOR[def.theme]||'shroom',x:p.x,y:p.y,s:1.1,id}); A.lights.push({x:p.x,y:p.y,r:150,i:0.55,tint:CAVE_DECOR[def.theme]}); }
    }
    if(R.kind==='lever'){ const p=P(R.ox+12,R.oy+3); const o={k:'lever',x:p.x,y:p.y,id:`cv_${SK}_${k}_lever`,room:k,r:14,on:R.solved}; A.objs.push(o); addAreaCol({t:'c',x:p.x,y:p.y,r:12}); }
    // loot
    const X=spot('X')||cen;
    const sealed=!!SEAL_KINDS[R.kind];
    for(const L of (R.loot||[])){
      const [lk,lv]=L.split(':');
      if(lk==='chest'){ A.objs.push({k:'cchest',x:X.x,y:X.y,id:`${SK}_chest_${k}`,sealed:sealed&&!R.solved,room:k,r:18}); addAreaCol({t:'c',x:X.x,y:X.y,r:16}); }
      else if(lk==='page'){ const p=spot('G')||(R.kind==='secret'?P(R.ox+8,R.oy+4):freeSpot()); A.objs.push({k:'page',x:p.x,y:p.y,id:'page_'+lv,page:lv}); }
      else if(lk==='qitem'&&def.item){ const p=spot('Q')||P(R.ox+8,R.oy+3); A.objs.push({k:'qitem',x:p.x,y:p.y,id:def.id+'_item',item:def.item.item,label:def.item.label,flag:def.item.flag,needQuest:def.item.needQuest}); }
      else if(lk==='ore'){ const p=P(R.ox+12,R.oy+3); A.objs.push({k:'cave_ore',x:p.x,y:p.y,id:def.id+'_ore',r:16}); A.lights.push({x:p.x,y:p.y,r:140,i:0.6}); }
      else if(lk==='relic'){ const p=P(R.ox+8,R.oy+3); A.objs.push({k:'relic',x:p.x,y:p.y,id:def.id+'_relic',r:16}); A.lights.push({x:p.x,y:p.y,r:220,i:0.85}); }
      else if(lk==='coins'){ for(let n=0;n<3;n++){ const p=freeSpot(); A.objs.push({k:'coinpile',x:p.x,y:p.y,id:`cv_${SK}_${k}_coin${n}`,n:6+def.level*2}); } }
      else if(lk==='treat'){ const p=freeSpot(); A.objs.push({k:'treatpick',x:p.x,y:p.y,id:`cv_${SK}_${k}_treat`}); }
      else if(lk==='rock'){ const p=freeSpot(); A.objs.push({k:'rock',x:p.x,y:p.y,id:`cv_${SK}_${k}_rock`,egg:{k:'rock',label:'Look at the rock',say:[S('A rock with a tiny hat painted on, tucked in a nook. A note: "KEVIN. He guards the deep seam. Do not move Kevin. G."','A rock in a painted hat. "KEVIN. Do not move him. G."')]}}); }
    }
    if(R.reward==='key'){ R.keyAt=X; if(R.solved&&!cf(`cv_${SK}_${k}_keytaken`)) spawnKey(A,def,R); }
    if(R.npc) A.npcHere={id:R.npc,x:(spot('N')||P(R.ox+8,R.oy+4)).x,y:(spot('N')||P(R.ox+8,R.oy+4)).y};
    if(R.sign){ const p=spot('s')||P(R.ox+4,R.oy+R.ih-2); A.objs.push({k:'csign',x:p.x,y:p.y,id:`cv_${SK}_sign_${k}`,text:R.sign,r:12}); }
    if(R.trial||typeof dunOwns!=='function'||dunOwns(def)) trialBuildRoom(A,def,R,ms,P,spot,freeSpot,rng);   // Trial cells and objects work in every cave (not in the e9b_caves2 caves, which bring their own)
    // decoration and pots along the walls
    const dec=CAVE_DECOR[def.theme]||'shroom', nd=R.kind==='secret'?6:R.noDecor?0:3;
    for(let n=0;n<nd;n++){ const side=Math.floor(rng()*4); let i,j; if(side===0){ i=R.ox+1+Math.floor(rng()*R.iw); j=R.oy+1; } else if(side===1){ i=R.ox+1+Math.floor(rng()*R.iw); j=R.oy+R.ih; } else if(side===2){ i=R.ox+1; j=R.oy+1+Math.floor(rng()*R.ih); } else { i=R.ox+R.iw; j=R.oy+1+Math.floor(rng()*R.ih); }
      if(!okCell(j*c.w+i)) continue; if(Math.abs(i-mci)<=2||Math.abs(j-mcj)<=2) continue; const p=P(i,j);
      const o={k:'decor',dk:dec,x:p.x+rand(-10,10),y:p.y+rand(-10,10),s:0.7+rng()*0.6,id:`d_${k}_${n}`}; A.objs.push(o); if(n%2===0) A.lights.push({x:o.x,y:o.y,r:dec==='lamp'?190:130,i:dec==='lamp'?0.65:0.45,tint:dec}); }
    const np=R.noPots?0:R.kind==='secret'?2:R.kind==='start'||R.kind==='treasure'?3:1;
    for(let n=0;n<np;n++){ const i=R.ox+(rng()<0.5?2:R.iw-1), j=R.oy+(rng()<0.5?2:R.ih-1); if(!okCell(j*c.w+i)) continue; const p=P(i,j); A.objs.push({k:rng()<0.5?'pot':'barrel',x:p.x+rand(-8,8),y:p.y+rand(-8,8),id:`bp_${k}_${n}`,breakable:true,r:14}); }
  }
  // enemies sleep in their rooms until you walk in
  const cl=G.caveCleared[def.id];
  const okFoe=(q,type)=>{ if(c.grid[q]!==0||c.dyn[q]) return false; const t=c.typ[q]; if(EDEF[type]&&EDEF[type].swim) return t===TY.deep||t===TY.current; return t===0||t===2||t===TY.rune; };
  if(!(cl!=null&&G.worldTime-cl<420)){
    A.camp={id:'cave_'+def.id,alive:0,cave:def.id};
    for(const k in c.rooms){
      const R=c.rooms[k];
      const list=(R.foes||[]).slice(); if(R.boss) list.unshift([R.boss[0],1,true]);
      if((R.kind==='boss'||R.kind==='miniboss')&&R.solved) continue;
      if(R.kind==='tboss') continue;
      for(const [type,n,boss] of list) for(let q=0;q<n;q++){
        let p=null; for(let t=0;t<60&&!p;t++){ const i=R.ox+2+Math.floor(rng()*(R.iw-2)), j=R.oy+2+Math.floor(rng()*(R.ih-3)), q2=j*c.w+i; if(okFoe(q2,type)) p=P(i,j); }
        if(!p) p={x:R.cx,y:R.cy};
        const e=makeEnemy(type,p.x,p.y,{level:def.level+(boss?1:0),aggro:false,homeX:p.x,homeY:p.y,leash:520,camp:A.camp,face:rand(0,TAU),snowy:def.theme==='ice',elite:!!boss,hpScale:boss?2.6:undefined,tint:R.tint});
        e.inArea=true; e.room=k; if(boss){ e.r*=EDEF[type].boss||EDEF[type].mini?1:1.35; e.caveBoss=R.boss[1]; e.dmg*=1.2; } R.enemies.push(e); A.camp.alive++;
      }
    }
  }
  A.objs.push({k:'tfx',x:0,y:0,w:1e6,id:'tfx'});
  refreshCaveGates();
  renderCaveRooms(A,def);
  A.curRoom=null;
}
const CAVE_DECOR={crystal:'crystal',bog:'shroom',ice:'icicle',ember:'magma',mine:'lamp',earth:'shroom',leap:'fern',tide:'shell',sky:'chime'};
function spawnKey(A,def,R){ if(A.objs.some(o=>o.k==='smallkey'&&o.room===R.id)) return; const p=R.keyAt||{x:R.cx,y:R.cy}; A.objs.push({k:'smallkey',x:p.x,y:p.y,id:`cv_${caveSid(def)}_${R.id}_keytaken`,room:R.id,live:true}); }
function caveRoomSolved(R){ return R.solved; }
function refreshCaveGates(){
  const A=AREA; if(!A||!A.gates) return;
  for(const o of A.gates){
    let cl=false;
    if(o.k==='pillar') cl=(o.col==='red')===(A.crys===0);
    else if(o.type==='open') cl=false;
    else if(o.type==='lock') cl=!o.opened;
    else if(o.type==='gate') cl=!(A.rooms[o.gateRoom]&&A.rooms[o.gateRoom].solved);
    else if(o.type==='crack') cl=!o.opened;
    else if(o.type==='red') cl=A.crys===0;
    else if(o.type==='blue') cl=A.crys===1;
    else if(o.type==='boss'||o.type==='roots') cl=!o.opened;
    if(o.tmp) cl=true;
    // never raise a pillar or close a door on top of Ash
    if(cl&&!o.closed&&o.cells.some(k=>{ const i=k%A.cave.w, j=(k-i)/A.cave.w, x=A.x0+(i+0.5)*A.cave.cell, y=A.y0+(j+0.5)*A.cave.cell; return Math.abs(player.x-x)<A.cave.cell*0.5+player.r&&Math.abs(player.y-y)<A.cave.cell*0.5+player.r; })) cl=false;
    o.closed=cl;
  }
}
function caveBlockedAt(k){ const A=AREA, d=A.cave.dyn?A.cave.dyn[k]:0; if(d&&A.gates[d-1]&&A.gates[d-1].closed) return true; if(A.blocks) for(const b of A.blocks) if(b.cj*A.cave.w+b.ci===k) return true; return false; }
function solveRoom(R,quiet){
  const A=AREA, def=A.def; if(R.solved) return;
  R.solved=true; G.found['cv_'+caveSid(def)+'_'+R.id+'_solved']=true;
  for(const o of A.objs){ if(o.k==='cchest'&&o.room===R.id) o.sealed=false; }
  if(R.reward==='key') spawnKey(A,def,R);
  refreshCaveGates();
  if(!quiet){ jingle('secret','shrine'); const opens=A.gates.some(g=>g.type==='gate'&&g.gateRoom===R.id); setBanner('Solved!',R.reward==='key'?'A small key appears.':opens?'Somewhere, a heavy door grinds open.':(R.loot||[]).includes('chest')?'The treasure chest is unsealed.':'',2.4); shake(3); }
  saveGame();
}
function caveRoomAt(x,y){
  const A=AREA; if(!A||!A.rooms) return null;
  const i=Math.floor((x-A.x0)/A.cave.cell), j=Math.floor((y-A.y0)/A.cave.cell);
  for(const k in A.rooms){ const R=A.rooms[k]; if(i>R.ox&&i<=R.ox+R.iw&&j>R.oy&&j<=R.oy+R.ih) return R; }
  return null;
}
function caveInterior(R,x,y){ const A=AREA, cs=A.cave.cell; return x>R.x0+cs*0.9&&x<R.x1-cs*0.9&&y>R.y0+cs*0.9&&y<R.y1-cs*0.9; }

// ---------- per frame
function updateCaveRooms(dt){
  const A=AREA; if(!A||!A.rooms) return;
  const def=A.def, p=player, R=caveRoomAt(p.x,p.y);
  // entering rooms
  if(R&&R!==A.curRoom){
    roomEntered(A,A.curRoom,R);   // (v12 ROOMS) the wake beat, foes that follow him through the doorway
    A.curRoom=R; const vk=`cv_${caveSid(def)}_v_${R.id}`;
    if(!G.found[vk]){ G.found[vk]=true; renderCaveMini(A); if(R.kind==='secret'){ G.secrets=G.secrets||{}; G.secrets['cs_'+def.id+'_'+R.id]=1; jingle('secret','chest'); setBanner('A secret room!',`${Object.keys(G.secrets).filter(k=>k.startsWith('cs_')).length} hidden cave rooms found so far`,2.6); } else if(R.kind==='boss'&&R.enemies.some(e=>!e.dead)){ const b=R.enemies.find(e=>e.caveBoss); if(b) setBanner(b.caveBoss,def.name,2.4,'boss'); jingle('boss_intro',null); } }
    if(typeof caveGuardianBack==='function') caveGuardianBack(R);   // (v12 TRIALS) an unwon guardian room always has its guardian
    for(const e of R.enemies) if(!e.dead) e.aggro=true;
  }
  // fights lock the doors until the room is clear
  if(R&&caveInterior(R,p.x,p.y)){
    const alive=R.enemies.filter(e=>!e.dead).length;
    if(alive&&(R.kind==='fight'||R.kind==='boss'||R.kind==='miniboss'||R.kind==='tboss'||R.lockFight)&&!R.locked){ R.locked=true; for(const L of R.links){ const o=A.gates.find(g=>g.link===L); if(o) o.tmp=true; } refreshCaveGates(); SFX.play('block'); }
  }
  for(const k in A.rooms){ const Q=A.rooms[k]; if(Q.locked&&!Q.enemies.some(e=>!e.dead)){ Q.locked=false; for(const L of Q.links){ const o=A.gates.find(g=>g.link===L); if(o) o.tmp=false; } if((Q.kind==='boss'||Q.kind==='miniboss'||Q.solveOnClear)&&!Q.solved) solveRoom(Q,true); refreshCaveGates(); if(Q.kind!=='tboss'){ jingle('complete','upgrade'); setBanner(Q.kind==='miniboss'?'The guardian falls':'Room cleared',Q.kind==='miniboss'?'Somewhere, a heavy door grinds open.':'The doors swing open.',1.8); } } }
  // puzzles
  for(const k in A.rooms){
    const Q=A.rooms[k]; if(Q.solved) continue;
    if(Q.kind==='braziers'){ const br=A.objs.filter(o=>o.k==='brazier'&&o.room===k); if(br.length&&br.every(o=>o.lit)) solveRoom(Q); }
    else if(Q.kind==='dark'){ const ls=A.objs.filter(o=>o.k==='lamp2'&&o.room===k); if(ls.length&&ls.every(o=>o.lit)) solveRoom(Q); }
    else if(Q.kind==='blocks'){ const pl=A.objs.filter(o=>o.k==='plate'&&o.room===k); for(const o of pl) o.pressed=A.blocks.some(b=>b.ci===o.ci&&b.cj===o.cj&&b.anim<=0); if(pl.length&&pl.every(o=>o.pressed)) solveRoom(Q); }
    else if(Q.kind==='maze'){ const t=Q.keyAt||{x:Q.cx,y:Q.cy}; if(R===Q&&dist(p.x,p.y,t.x,t.y)<70) solveRoom(Q); }
  }
  // timed braziers burn out
  for(const o of A.objs) if(o.k==='brazier'&&o.timed&&o.lit&&!A.rooms[o.room].solved){ o.burn=(o.burn==null?o.timed:o.burn)-dt; if(o.burn<=0){ o.lit=false; o.burn=null; emit(o.x,o.y,10,{col:'120,120,120',glow:false,ang:-Math.PI/2,spread:0.6,smin:20,smax:50,lmin:.6,lmax:1,zmin:3,zmax:6,grow:6}); } }
  // pools: Ash can stride or jump over them; landing in one without Water Stride puts him back on the last dry floor
  { const c=A.cave, k=Math.floor((p.y-A.y0)/c.cell)*c.w+Math.floor((p.x-A.x0)/c.cell);
    if(c.typ[k]===1&&c.grid[k]===1){ if(!airborne()&&!canWalkWater()&&!p.dead){ const s=A.dry||A.spawn; G.ripples.push({x:p.x,y:p.y,t:0,max:0.9,r:22,splash:true}); emit(p.x,p.y,14,{col:'180,220,255',glow:false,ang:-Math.PI/2,spread:1.3,smin:40,smax:140,lmin:.3,lmax:.6,zmin:2,zmax:4}); SFX.play('pop'); p.x=s.x; p.y=s.y; p.kvx=p.kvy=0; } }
    else if(!airborne()&&c.grid[k]===0&&(c.typ[k]===0||c.typ[k]===2||c.typ[k]===TY.rune)) A.dry={x:p.x,y:p.y}; }
  // dark rooms swallow the light until their lamps are lit
  const dark=R&&((R.kind==='dark'||R.dark)&&!R.solved);
  A.dark=dark?0.97:def.dark; A.plr=dark?(G.items.lantern?210:150):0;
  A.puzzleOn=!!(R&&PUZZLE_KINDS[R.kind]&&!R.solved);
  // blocks: push by walking into them
  pushBlocks(dt);
  for(const o of A.objs) if(o.k==='crystal'&&o.cd>0) o.cd-=dt;
  // pickups you walk over
  for(const o of A.objs){
    if((o.k==='coinpile'||o.k==='treatpick'||o.k==='smallkey')&&!G.found[o.id]&&dist(p.x,p.y,o.x,o.y)<34){
      G.found[o.id]=true;
      if(o.k==='coinpile') addCoins(o.n,o.x,o.y);
      if(o.k==='treatpick'){ G.pipTreats=Math.min(3,(G.pipTreats||0)+1); setBanner('A Pip treat!','Pip breathes fire a little faster.',1.6); SFX.play('chest'); }
      if(o.k==='smallkey'){ const kk='keys_'+caveDsid(def); G.found[kk]=(G.found[kk]||0)+1; jingle('item','chest'); setBanner('Small key','It opens one locked door in this cave.',2); }
      saveGame();
    }
  }
  if(A.tri) trialUpdate(dt,R);
  // the pillars and doors may have been waiting for Ash to step off them
  if(A.gates.some(o=>!o.closed&&o.k==='pillar')||A.gates.some(o=>o.tmp&&!o.closed)) refreshCaveGates();
}
function pushBlocks(dt){
  const A=AREA, p=player, c=A.cave, cs=c.cell;
  for(const b of A.blocks){
    if(b.anim>0){ b.anim=Math.max(0,b.anim-dt); const k=1-b.anim/0.2; b.x=lerp(b.fx,A.x0+(b.ci+0.5)*cs,k); b.y=lerp(b.fy,A.y0+(b.cj+0.5)*cs,k); continue; }
    b.x=A.x0+(b.ci+0.5)*cs; b.y=A.y0+(b.cj+0.5)*cs;
    const mx=p.inMx||0, my=p.inMy||0; if(Math.hypot(mx,my)<0.5){ b.push=0; continue; }
    const dx=p.x-b.x, dy=p.y-b.y; let di=0,dj=0;
    if(Math.abs(mx)>Math.abs(my)){ if(Math.abs(dy)<cs*0.42&&Math.abs(dx)<cs*0.5+p.r+6&&Math.sign(-dx)===Math.sign(mx)) di=Math.sign(mx); }
    else{ if(Math.abs(dx)<cs*0.42&&Math.abs(dy)<cs*0.5+p.r+6&&Math.sign(-dy)===Math.sign(my)) dj=Math.sign(my); }
    if(!di&&!dj){ b.push=0; continue; }
    b.push=(b.push||0)+dt;
    if(b.push<0.28) continue;
    b.push=0;
    const ni=b.ci+di, nj=b.cj+dj, k=nj*c.w+ni, R=A.rooms[b.room];
    const inRoom=ni>R.ox&&ni<=R.ox+R.iw&&nj>R.oy&&nj<=R.oy+R.ih;
    if(inRoom&&c.grid[k]===0&&!caveBlockedAt(k)&&typeof trialBlockInto==='function'&&trialBlockInto(b,ni,nj,k)) continue;
    if(!inRoom||c.grid[k]!==0||c.typ[k]===1||caveBlockedAt(k)||(c.typ[k]>=3&&c.typ[k]!==TY.rune)||A.objs.some(o=>(o.k==='resetstone'||o.k==='cchest'||o.k==='crystal')&&Math.abs(o.x-(A.x0+(ni+0.5)*cs))<cs*0.6&&Math.abs(o.y-(A.y0+(nj+0.5)*cs))<cs*0.6)){ SFX.play('block',0.5); continue; }
    b.fx=b.x; b.fy=b.y; b.ci=ni; b.cj=nj; b.anim=0.2; SFX.play('roll',0.7); shake(1);
  }
}
function resetBlocks(room){ for(const b of AREA.blocks) if(b.room===room){ b.ci=b.si; b.cj=b.sj; b.anim=0; b.sunk=false; b.sinking=false; } SFX.play('ui'); emit(player.x,player.y,10,{col:'200,220,255',smin:30,smax:90,lmin:.3,lmax:.6,zmin:1.5,zmax:3}); }

// ---------- hooks from fire, sword and roar
function caveBreath(hit,dt){
  const A=AREA; if(!A||!A.rooms) return;
  trialBreath(hit,dt);
  for(const o of A.objs){
    if(o.k==='ctorch'&&!o.lit&&hit(o.x,o.y,14)){ o.lit=true; SFX.play('pickup'); const R=A.rooms[o.room]; if(R.solved) continue; R.seq.push(o.sym); const want=R.order.slice(0,R.seq.length); if(R.seq.join()!==want.join()){ setBanner('Wrong order','The flames gutter out.',1.4); SFX.play('hurt'); later(0.6,()=>{ for(const q of A.objs) if(q.k==='ctorch'&&q.room===o.room) q.lit=false; R.seq=[]; }); } else if(R.seq.length===4) solveRoom(R); else ftext(o.x,o.y-26,TORCH_SYMS[o.sym],'#ffe0a0',13); }
    if(o.k==='lamp2'&&!o.lit&&hit(o.x,o.y,14)){ o.lit=true; SFX.play('pickup'); }
    if(o.k==='crystal'&&o.cd<=0&&hit(o.x,o.y,16)){ hitCrystal(o); }
    if(o.k==='cgate'&&o.type==='crack'&&!o.opened&&hit(o.x,o.y,40)){ o.heat=(o.heat||0)+dt; if(Math.random()<0.3) emit(o.x+rand(-30,30),o.y+rand(-20,20),1,{col:'200,170,140',glow:false,smin:20,smax:60,lmin:.3,lmax:.6,zmin:2,zmax:3}); if(o.heat>1.6) breakCrack(o); }
  }
}
function caveSwing(px,py,dir,range,half){
  const A=AREA; if(!A||!A.rooms) return;
  trialSwing(px,py,dir,range,half);
  for(const o of A.objs) if(o.k==='crystal'&&o.cd<=0&&inArcC(px,py,dir,range+10,half,{x:o.x,y:o.y,r:18})) hitCrystal(o);
}
function caveRoar(x,y,r){
  const A=AREA; if(!A||!A.rooms) return;
  for(const o of A.objs) if(o.k==='cgate'&&o.type==='crack'&&!o.opened&&dist(x,y,o.x,o.y)<r+40) breakCrack(o);
}
function hitCrystal(o){
  const A=AREA; o.cd=0.7; A.crys=A.crys?0:1; G.found['crys_'+caveDsid(A.def)]=A.crys;
  refreshCaveGates(); SFX.play('shrine'); shake(2); flashA=0.15; flashCol=A.crys?'120,160,255':'255,120,160';
  emit(o.x,o.y,18,{col:A.crys?'140,180,255':'255,140,180',smin:40,smax:140,lmin:.3,lmax:.7,zmin:1.5,zmax:3});
}
function breakCrack(o){
  o.opened=true; G.found[o.id]=true; refreshCaveGates(); SFX.play('boom'); shake(6);
  emit(o.x,o.y,40,{col:'150,130,110',glow:false,smin:40,smax:220,lmin:.4,lmax:.9,zmin:2,zmax:5,grow:4});
  setBanner('The wall crumbles!','',1.6); saveGame();
}
function caveGatePrompt(o){
  if(o.type==='lock'&&!o.opened) return AREA.keys()>0?`Unlock the door (${AREA.keys()} small key${AREA.keys()>1?'s':''})`:'Locked. A small key would open it.';
  if(o.type==='boss'&&!o.opened) return G.found['bkey_'+caveDsid(AREA.def)]?(AREA.def.trial?'Open the great door with the Guardian Key':'Open the great door with the Boss Key'):'Look at the great door';
  if(o.type==='roots'&&!o.opened) return 'Look at the roots';
  if(o.type==='crack'&&!o.opened) return 'Look at the cracked wall';
  if(o.type==='gate'&&o.closed&&!o.tmp) return 'Look at the sealed door';
  if((o.type==='red'||o.type==='blue')&&o.closed) return 'Look at the pillars';
  return null;
}
function caveObjAct(o){
  const A=AREA, say=(t)=>runDialogue([['narr',t]],()=>{ scene='play'; saveGame(); });
  if(o.tobj) return trialObjAct(o);
  if(o.k==='cgate'){
    if(o.type==='boss'&&!o.opened){ if(G.found['bkey_'+caveDsid(A.def)]){ o.opened=true; G.found[o.id]=true; refreshCaveGates(); jingle('secret','chest'); shake(6); setBanner('The great door opens','Something enormous is waiting inside.',2.4); saveGame(); } else say(A.def.trial?`A great door, carved with the face of a sleeping dragon. Its lock is shaped like a flame. The Guardian Key for it is hidden somewhere in this Trial.`:S(`A great door with a lock shaped like a flame. The Boss Key for it is hidden somewhere in this dungeon. Look for a big chest.`,`A big locked door. Find the Boss Key. It is in a big chest.`)); return true; }
    if(o.type==='roots'&&!o.opened){ say(S(`Thick old roots grow right across the way. They look dry enough to burn.`,`Dry roots block the way. Burn them!`)); return true; }
    if(o.type==='lock'&&!o.opened){ if(A.keys()>0){ G.found['keys_'+caveDsid(A.def)]=A.keys()-1; o.opened=true; G.found[o.id]=true; refreshCaveGates(); SFX.play('chest'); setBanner('Unlocked','',1.4); saveGame(); } else say(`A heavy door with a keyhole. Somewhere in this cave there's a small key that fits it.`); return true; }
    if(o.type==='crack'){ say(`Cracks run all through this wall, and a cold draft whistles out of them. A good roar might bring it down. Or a lot of fire.`); return true; }
    if(o.type==='gate'){ const R=A.rooms[o.gateRoom]; say(`A sealed stone door. ${R?({blocks:'Something about blocks and the plates on the floor in another room.',braziers:'Carved flames run around the frame. Light every brazier in the next room.',torches:'Four little symbols are carved into it. Light the torches in the right order.',dark:'It needs light.',lever:'There must be a lever somewhere.',boss:'It opens when the guardian falls.',miniboss:'It opens when the guardian falls.',tboss:'It opens when the guardian of the Trial falls.',switches:R.need?`A crystal switch is carved on it. You will need ${R.need} to reach the switches.`:'A crystal switch is carved on it. Strike every switch in that room.',eyes:'A stone eye is carved on it. Wake every eye in that room with an arrow.',tide:'Waves are carved on it. The water in that room holds the answer.',vents:'A little cloud is carved on it.'}[R.kind]||''):''}`); return true; }
    if(o.type==='red'||o.type==='blue') { say(`Glowing ${o.type==='red'?'pink':'blue'} pillars block the way. There's a crystal somewhere in this cave that changes which ones are up. Hit it.`); return true; }
  }
  if(o.k==='lever'){ if(!o.on){ o.on=true; solveRoom(A.rooms[o.room]); SFX.play('block'); } else say('The lever is down. It took some pulling.'); return true; }
  if(o.k==='mural'){ const n=o.order.map(i=>TORCH_SYMS[i]); say(`A mural of four little flames, one after another: ${n.join(', then ')}. Below it, four torches wait.`); return true; }
  if(o.k==='resetstone'){ resetBlocks(o.room); return true; }
  if(o.k==='csign'){ say(o.text); return true; }
  if(o.k==='plate'){ say(o.pressed?'The plate is pressed down. Something clicked.':'A stone plate in the floor. It wants something heavy on it.'); return true; }
  if(o.k==='block'){ say(o.cart?'An old mine cart on rusty rails. Walk into it to push it.':'A heavy stone block. Walk into it to push it. If it gets stuck, the rune stone puts the blocks back.'); return true; }
  if(o.k==='crystal'){ hitCrystal(o); return true; }
  return false;
}
const CAVE_LABEL={lever:'Pull the lever',mural:'Read the mural',resetstone:'Touch the rune stone (reset the blocks)',csign:'Read the sign',plate:'Look at the plate',crystal:'Hit the crystal',block:null};

// ---------- drawing: the static cave canvas and the minimap
const CAVE_STYLE={
  earth:{floor:'#3c2e22',floor2:'#34281e',top:'#7a6248',face:'#3a2a1c',edge:'#a8885e',water:'#22363a',accent:'#a0c070'},
  crystal:{floor:'#2e2638',floor2:'#282032',top:'#6a5a88',face:'#2a2038',edge:'#b8a0e8',water:'#20325a',accent:'#c0a0ff'},
  mine:{floor:'#3e3224',floor2:'#362a1e',top:'#7e6648',face:'#3a2a1a',edge:'#b8925e',water:'#223030',accent:'#ffd27a'},
  bog:{floor:'#2c3422',floor2:'#262e1e',top:'#5e6a44',face:'#262e1a',edge:'#98a870',water:'#22361e',accent:'#b8e070'},
  ice:{floor:'#4a5a6a',floor2:'#425262',top:'#aac0d4',face:'#3e4e5c',edge:'#f0faff',water:'#20406a',accent:'#cfe6ff'},
  ember:{floor:'#2e1c18',floor2:'#281814',top:'#6a4238',face:'#2a1410',edge:'#c87048',water:'#5a1a08',accent:'#ff8a3a'},
  // Ember's Trials: mossy old stone, sea-blue tile, white and gold marble
  leap:{floor:'#4e5a3a',floor2:'#485434',top:'#7a8462',face:'#2e3622',edge:'#c8e08a',water:'#1e4a44',accent:'#c8f070'},
  tide:{floor:'#628ca4',floor2:'#5a849c',top:'#a8c8d6',face:'#2a4a5c',edge:'#eefaff',water:'#1a4f78',accent:'#7ae0ff'},
  sky:{floor:'#e2dac8',floor2:'#d8d0bc',top:'#f6f1e4',face:'#a8987a',edge:'#ffe6a0',water:'#3a6aa8',accent:'#ffd860'}
};
function renderCaveRooms(A,def){
  const c=A.cave, S=0.5, cs=c.cell, W2=c.w*cs, H2=c.h*cs, cv=mkCanvas(W2*S,H2*S), g=cv.getContext('2d'), st=CAVE_STYLE[def.theme]||CAVE_STYLE.earth, rng=mulberry32(def.seed);
  g.scale(S,S);
  const solid=(i,j)=>i<0||j<0||i>=c.w||j>=c.h||c.grid[j*c.w+i]===1&&c.typ[j*c.w+i]!==1;
  const water=(i,j)=>i>=0&&j>=0&&i<c.w&&j<c.h&&c.typ[j*c.w+i]===1;
  g.fillStyle='#0a0806'; g.fillRect(0,0,W2,H2);
  // floors: tiles with a little variety per room
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){
    const k=j*c.w+i; if(c.grid[k]!==0&&!water(i,j)) continue;
    const x=i*cs, y=j*cs;
    if(water(i,j)){ g.fillStyle=st.water; g.fillRect(x,y,cs,cs); g.strokeStyle='rgba(255,255,255,.08)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+6,y+cs*0.4+rng()*8); g.quadraticCurveTo(x+cs/2,y+cs*0.3,x+cs-6,y+cs*0.45); g.stroke(); continue; }
    if((def.trial||c.typ[k]>=3)&&trialPaintCell(g,c,k,i,j,x,y,cs,st,rng,def)) continue;
    const ice=c.typ[k]===2;
    g.fillStyle=ice?'#b8d0e4':((i+j)%2?st.floor:st.floor2); g.fillRect(x,y,cs,cs);
    g.fillStyle=ice?'rgba(255,255,255,.35)':'rgba(255,255,255,.035)'; g.fillRect(x+2,y+2,cs-4,3);
    g.strokeStyle=ice?'rgba(120,160,200,.5)':'rgba(0,0,0,.22)'; g.lineWidth=1.5; g.strokeRect(x+0.5,y+0.5,cs-1,cs-1);
    if(!ice&&rng()<0.35){ g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x+rng()*cs,y+rng()*cs,2+rng()*5,1.5+rng()*3,rng()*3,0,TAU); g.fill(); }
    if(ice&&rng()<0.3){ g.strokeStyle='rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(x+rng()*cs,y+rng()*cs); g.lineTo(x+rng()*cs,y+rng()*cs); g.stroke(); }
    if(def.theme==='ember'&&rng()<0.12){ g.strokeStyle='rgba(255,120,40,.45)'; g.lineWidth=2; g.beginPath(); g.moveTo(x+rng()*cs,y+rng()*cs); g.lineTo(x+rng()*cs,y+rng()*cs); g.stroke(); }
    if(def.theme==='bog'&&rng()<0.18){ g.fillStyle='rgba(60,90,40,.5)'; g.beginPath(); g.ellipse(x+cs/2,y+cs/2,cs*0.5,cs*0.3,rng()*3,0,TAU); g.fill(); }
    if(def.theme==='mine'&&rng()<0.1){ g.fillStyle='#3a2a1a'; g.fillRect(x+4,y+cs*0.3,cs-8,5); g.fillRect(x+4,y+cs*0.65,cs-8,5); }
    // soft shadow along walls
    if(solid(i,j-1)){ const gr=g.createLinearGradient(0,y,0,y+cs*0.6); gr.addColorStop(0,'rgba(0,0,0,.45)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs,cs*0.6); }
    if(solid(i-1,j)){ const gr=g.createLinearGradient(x,0,x+cs*0.4,0); gr.addColorStop(0,'rgba(0,0,0,.3)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x,y,cs*0.4,cs); }
    if(solid(i+1,j)){ const gr=g.createLinearGradient(x+cs,0,x+cs*0.6,0); gr.addColorStop(0,'rgba(0,0,0,.3)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x+cs*0.6,y,cs*0.4,cs); }
  }
  // puzzle floor sigils and cart rails
  for(const k in c.rooms){ const R=c.rooms[k]; if(R.kind==='torches'||R.kind==='braziers'||R.kind==='crystal'){ const x=(R.ox+8.5)*cs, y=(R.oy+6.5)*cs; g.strokeStyle=`rgba(${hexRGB(st.accent).join(',')},.18)`; g.lineWidth=4; g.beginPath(); g.arc(x,y,cs*2.2,0,TAU); g.stroke(); g.beginPath(); g.arc(x,y,cs*1.4,0,TAU); g.stroke(); for(let a=0;a<6;a++){ g.beginPath(); g.moveTo(x+Math.cos(a)*cs*1.4,y+Math.sin(a)*cs*1.4); g.lineTo(x+Math.cos(a)*cs*2.2,y+Math.sin(a)*cs*2.2); g.stroke(); } }
    if(R.kind==='tboss'&&def.trial&&def.theme!=='sky'){ const x=(R.ox+1+R.iw/2)*cs, y=(R.oy+1+R.ih/2)*cs, P=TPAL[def.theme], col=P.rune; g.save(); g.lineCap='round';
      for(const [rr,w,a] of [[cs*7.6,10,0.3],[cs*7.6,3,0.7],[cs*6.6,2,0.5],[cs*2.4,3,0.6]]){ g.strokeStyle=a>0.5?`rgba(${col},${a})`:`rgba(0,0,0,${a})`; g.lineWidth=w; g.beginPath(); g.ellipse(x,y,rr,rr*0.78,0,0,TAU); g.stroke(); }
      for(let k=0;k<12;k++){ const an=k/12*TAU; g.strokeStyle=`rgba(${col},.45)`; g.lineWidth=2.4; g.beginPath(); g.moveTo(x+Math.cos(an)*cs*2.4,y+Math.sin(an)*cs*2.4*0.78); g.lineTo(x+Math.cos(an)*cs*6.6,y+Math.sin(an)*cs*6.6*0.78); g.stroke(); g.fillStyle=`rgba(${col},.75)`; g.beginPath(); const qx=x+Math.cos(an)*cs*7.1, qy=y+Math.sin(an)*cs*7.1*0.78; g.moveTo(qx,qy-7); g.lineTo(qx+7,qy); g.lineTo(qx,qy+7); g.lineTo(qx-7,qy); g.closePath(); g.fill(); }
      g.restore(); }
    if(R.cart){ const ms=c.marks.filter(m=>m.room===k&&(m.ch==='B'||m.ch==='P')); if(ms.length===2){ const [a,b]=ms; g.strokeStyle='#5a4a3a'; g.lineWidth=4; for(const off of [-10,10]){ g.beginPath(); g.moveTo((a.i+0.5)*cs+off,(a.j+0.5)*cs); g.lineTo((b.i+0.5)*cs+off,(b.j+0.5)*cs); g.stroke(); } g.fillStyle='#4a3420'; for(let y=Math.min(a.j,b.j);y<=Math.max(a.j,b.j);y++) for(let t=0;t<2;t++) g.fillRect((a.i+0.5)*cs-16,(y+t*0.5)*cs+20,32,5); } } }
  // walls in three-quarter view: a lit top, and a darker front face where a floor lies to the south
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){
    if(!solid(i,j)) continue;
    const x=i*cs, y=j*cs, open=(a,b)=>!solid(a,b);
    const touches=open(i,j+1)||open(i,j-1)||open(i+1,j)||open(i-1,j)||open(i+1,j+1)||open(i-1,j+1)||open(i+1,j-1)||open(i-1,j-1);
    if(!touches){ g.fillStyle='#0c0a08'; g.fillRect(x-1,y-1,cs+2,cs+2); continue; }
    const face=open(i,j+1), th=face?cs*0.6:cs;
    g.fillStyle=st.top; g.fillRect(x,y,cs,th);
    // stone courses on the top face
    g.fillStyle='rgba(0,0,0,.16)'; g.fillRect(x,y+th*0.5-1,cs,2); g.fillRect(x+((j%2)?cs*0.25:cs*0.7),y,2,th*0.5); g.fillRect(x+((j%2)?cs*0.7:cs*0.25),y+th*0.5,2,th*0.5);
    g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(x,y,cs,3);
    // bright rims where the wall meets the floor, so walls always read as walls
    g.fillStyle=st.edge; g.globalAlpha=0.55;
    if(open(i,j-1)) g.fillRect(x,y,cs,3);
    if(open(i-1,j)) g.fillRect(x,y,3,th);
    if(open(i+1,j)) g.fillRect(x+cs-3,y,3,th);
    g.globalAlpha=1;
    if(face){ const gr=g.createLinearGradient(0,y+th,0,y+cs); gr.addColorStop(0,st.face); gr.addColorStop(1,'#050303'); g.fillStyle=gr; g.fillRect(x,y+th,cs,cs-th); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+cs*0.5,y+th,2,cs-th); g.fillStyle=st.edge; g.globalAlpha=0.5; g.fillRect(x,y+th-1,cs,2); g.globalAlpha=1; }
    if(open(i-1,j)&&!face){ g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(x,y,4,cs); }
    if(rng()<0.25){ g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.arc(x+rng()*cs,y+rng()*th,2+rng()*3,0,TAU); g.fill(); }
    if(def.theme==='crystal'&&rng()<0.08){ g.fillStyle=st.accent; g.globalAlpha=0.6; g.beginPath(); g.moveTo(x+cs*0.5,y+2); g.lineTo(x+cs*0.65,y+cs*0.3); g.lineTo(x+cs*0.5,y+cs*0.45); g.lineTo(x+cs*0.35,y+cs*0.3); g.closePath(); g.fill(); g.globalAlpha=1; }
    if(def.trial) trialPaintWall(g,c,i,j,x,y,cs,st,rng,def,face,th);
    if(def.theme==='ice'&&face&&rng()<0.4){ g.fillStyle='rgba(230,245,255,.8)'; g.beginPath(); g.moveTo(x+cs*0.3,y+cs*0.95); g.lineTo(x+cs*0.38,y+cs*1.15); g.lineTo(x+cs*0.46,y+cs*0.95); g.fill(); }
  }
  A.canvas=cv; A.canvasS=S;
  renderCaveMini(A);
}
function renderCaveMini(A){
  const c=A.cave, def=A.def, st=CAVE_STYLE[def.theme]||CAVE_STYLE.earth;
  const mm=A.mini||mkCanvas(c.w,c.h), mg=mm.getContext('2d'), im=mg.createImageData(c.w,c.h), fl=hexRGB(st.top).map(q=>q*0.8);
  const SK=caveSid(def), DK=caveDsid(def), mapped=(G.items.juniper_map&&!def.noJuniper)||G.found['tmap_'+DK]||G.found['dmap_'+DK];
  const seen=new Set(Object.keys(c.rooms).filter(k=>G.found[`cv_${SK}_v_${k}`]||(mapped&&c.rooms[k].kind!=='secret')));
  for(let j=0;j<c.h;j++) for(let i=0;i<c.w;i++){
    const k=j*c.w+i; let v=[10,8,6], a=255;
    let r=null; for(const id in c.rooms){ const R=c.rooms[id]; if(i>=R.ox&&i<=R.ox+R.iw+1&&j>=R.oy&&j<=R.oy+R.ih+1){ if(seen.has(id)){ r=R; break; } } }
    if(r){ const t=c.typ[k]; v=c.grid[k]===0?(t===TY.pit||t===TY.chasm?[14,12,18]:t===TY.deep||t===TY.current||t===TY.basin?[50,96,150]:t===TY.spike?[120,96,90]:fl):t===1?[40,70,100]:[26,20,16]; if(!G.found[`cv_${SK}_v_${r.id}`]) v=v.map(q=>q*0.55); if(r.kind==='tboss'&&c.grid[k]===0) v=[v[0]*1.2+30,v[1]*0.8,v[2]*0.8]; }
    im.data[k*4]=v[0]; im.data[k*4+1]=v[1]; im.data[k*4+2]=v[2]; im.data[k*4+3]=a;
  }
  mg.putImageData(im,0,0); A.mini=mm;
}
function caveProgressText(){
  const A=AREA; if(!A||!A.rooms) return '';
  const ks=Object.keys(A.rooms), v=ks.filter(k=>G.found[`cv_${caveSid(A.def)}_v_${k}`]&&A.rooms[k].kind!=='secret').length, tot=ks.filter(k=>A.rooms[k].kind!=='secret').length, keys=A.keys();
  return `${v}/${tot} rooms explored${keys?` · ${keys} small key${keys>1?'s':''}`:''}`;
}

// ================= (v12 ROOMS) one room at a time, as in Zelda
// Only the room Ash is in is drawn and alive. A room he has been in shows its walls and floor dimmed (remembered), never
// its foes, closed chests or anything moving; with the cave's map (Juniper's map, a Trial Map, a Dungeon Map) the rooms
// he has not been in show as a faint plan. Shared walls and their doorways belong to the room he is in, and standing in a
// doorway lights the room ahead, so walking through reads as one step. Foes outside his room sleep (not updated, hidden
// with e.frozen, so nothing targets, draws or maps them) and wake a short beat after he walks in; a foe chasing him
// through a doorway may follow. The camera frames his room (a quick slide at each doorway) and keeps its top wall clear
// of the HUD (a5_input.js updateCam calls roomCam); panels with something in the room under them fade (a11b_hud.js).
// For other modules (WALLS, TRIALS): areaRoomOf(x,y), ashRoom(), roomOfFoe(e), roomAwake(e), roomSeen(e), roomsLift(sec,ids).
const RMV={on:true,beat:0.6,follow:1.6,followR:300,memA:0.2,planA:0.085,rate:9,lift:null,area:null,frame:0,t:-1,last:null,snapT:0};
// the room whose floor is at x,y (null in a wall or a doorway)
function areaRoomOf(x,y){ return AREA&&AREA.rooms?caveRoomAt(x,y):null; }
// every room whose walls hold the cell i,j (a shared wall belongs to both rooms, a corner to up to four)
function roomsOfCell(A,i,j){
  if(!A._rmc){ const c=A.cave, n=c.w*c.h, L=A._rmc=new Array(n); for(const k in A.rooms){ const R=A.rooms[k];
      for(let jj=R.oy;jj<=R.oy+R.ih+1;jj++) for(let ii=R.ox;ii<=R.ox+R.iw+1;ii++){ if(ii<0||jj<0||ii>=c.w||jj>=c.h) continue; const q=jj*c.w+ii; (L[q]||(L[q]=[])).push(R); } } }
  const c=A.cave; if(i<0||j<0||i>=c.w||j>=c.h) return null; return A._rmc[j*c.w+i]||null;
}
// the room for a point: its floor, else (in a wall or a doorway) the room that holds that wall, pref first
function areaRoomNear(x,y,pref){
  const A=AREA; if(!A||!A.rooms) return null;
  const R=caveRoomAt(x,y); if(R) return R;
  const cs=A.cave.cell, L=roomsOfCell(A,Math.floor((x-A.x0)/cs),Math.floor((y-A.y0)/cs));
  if(L&&L.length){ if(pref&&L.includes(pref)) return pref; let b=L[0], bd=1e18; for(const Q of L){ const d=dist2(x,y,Q.cx,Q.cy); if(d<bd){ bd=d; b=Q; } } return b; }
  if(pref) return pref;
  let b=null, bd=1e18; for(const k in A.rooms){ const Q=A.rooms[k], d=dist2(x,y,Q.cx,Q.cy); if(d<bd){ bd=d; b=Q; } } return b;
}
// the room Ash is in (in a doorway: the one he came from)
function ashRoom(){ const A=AREA; if(!A||!A.rooms||!player) return null; return caveRoomAt(player.x,player.y)||A.curRoom||areaRoomNear(player.x,player.y); }
function roomOfFoe(e){ const A=AREA; return A&&A.rooms?areaRoomNear(e.x,e.y,e.room?A.rooms[e.room]:null):null; }
// the doorway Ash stands in, if any: its link (L.a, L.b are the two rooms)
function ashDoor(){
  const A=AREA; if(!A||!A.cave||!A.cave.links||!player) return null; const c=A.cave, cs=c.cell, i=Math.floor((player.x-A.x0)/cs), j=Math.floor((player.y-A.y0)/cs), k=j*c.w+i;
  for(const L of c.links) if(L.cells.includes(k)) return L;
  return null;
}
// the box of a room with its walls, in world units
function roomRect(A,R){ if(R._rr&&R._rrA===A) return R._rr; const cs=A.cave.cell; R._rrA=A; return R._rr={x0:A.x0+R.ox*cs,y0:A.y0+R.oy*cs,x1:A.x0+(R.ox+R.iw+2)*cs,y1:A.y0+(R.oy+R.ih+2)*cs}; }
const caveMapped=A=>!!(A&&((G.items.juniper_map&&!A.def.noJuniper)||G.found['tmap_'+caveDsid(A.def)]||G.found['dmap_'+caveDsid(A.def)]));
// how a room looks from outside: 0 dark, 1 a faint plan (mapped), 2 remembered. A dark room still waiting for its lamps
// (or a dark maze) stays dark: its layout is the puzzle.
function roomMemo(A,R){
  if((R.kind==='dark'||R.kind==='maze'||R.dark)&&!R.solved) return 0;
  if(G.found[`cv_${caveSid(A.def)}_v_${R.id}`]) return 2;
  return caveMapped(A)&&R.kind!=='secret'?1:0;
}
// a scene may light rooms it needs to show for a while: roomsLift(sec) lifts the dark everywhere, roomsLift(sec,['b','c'])
// just there (foes there stay asleep); roomsLift(0) ends it
function roomsLift(sec,ids){ RMV.lift=sec>0?{until:G.time+sec,ids:ids?new Set([].concat(ids)):null,A:AREA}:null; }
function roomLifted(R){ const L=RMV.lift; if(!L) return false; if(L.A!==AREA||G.time>L.until){ RMV.lift=null; return false; } return !L.ids||L.ids.has(R.id); }
// per frame: how lit each room is (R._vk, 0 dark to 1 lit); a teleport or a new area snaps, a doorway eases
function roomVisTick(){
  const A=AREA; if(!A||!A.rooms) return;
  const cur=ashRoom(), door=ashDoor(), now=G.time;
  let dt=RMV.t<0?0:clamp(now-RMV.t,0,0.1); RMV.t=now;
  let snap=RMV.area!==A||RMV.snapT>0;
  // a jump to a room that does not share a wall with the last one (stairs, warps, a fall): no fade
  if(!snap&&cur&&RMV.last&&cur!==RMV.last&&!cur.links.some(L=>L.a===RMV.last.id||L.b===RMV.last.id)) snap=true;
  RMV.area=A; RMV.last=cur; if(RMV.snapT>0) RMV.snapT--;
  const k=snap?1:1-Math.exp(-dt*RMV.rate);
  for(const id in A.rooms){ const R=A.rooms[id];
    const want=R===cur||(door&&(door.a===id||door.b===id))||roomLifted(R)?1:0;
    if(R._vk==null||snap) R._vk=want; else { R._vk+=(want-R._vk)*k; if(Math.abs(want-R._vk)<0.01) R._vk=want; } }
}
// Ash walks from room P into room R (updateCaveRooms): R's foes get a beat before they act (not when he just stepped
// out and back), foes that were chasing him close by may follow through the doorway
function roomEntered(A,P,R){
  if(!RMV.on||!R) return;
  if(G.time-(R._left!=null?R._left:-99)>3) R._wake=G.time+RMV.beat;
  if(P){ P._left=G.time; for(const e of G.enemies){ if(e.dead||!e.aggro||!e._rmAw) continue; if(roomOfFoe(e)===P&&dist(e.x,e.y,player.x,player.y)<RMV.followR) e._rmChase=G.time+RMV.follow; } }
}
// may this foe act now? (WALLS can call this anywhere; cached per frame)
function roomAwake(e){
  const A=AREA; if(!RMV.on||!A||!A.rooms||!e||e.dead) return true;
  if(e._rmF===RMV.frame&&e._rmA===A) return e._rmAw;
  e._rmF=RMV.frame; e._rmA=A;
  let aw=true;
  // his room as updateCaveRooms last saw it (it hands out the beat and the chases when he walks in)
  if(!(e.noRoom||e.type==='vorlaxis')){ const R=A.curRoom||ashRoom(), Q=roomOfFoe(e);
    // in his room: once updateCaveRooms has seen him walk in (A.curRoom) and the beat is over; a chaser keeps going
    if(R&&Q){ if(Q===R) aw=(!!A.curRoom&&G.time>=(R._wake||0))||e._rmChase>G.time; else aw=e._rmChase>G.time; } }
  e._rmAw=aw; return aw;
}
// can Ash see this foe? (its room is lit)
function roomSeen(e){ const A=AREA; if(!RMV.on||!A||!A.rooms||!e) return true; if(e.noRoom||e.type==='vorlaxis') return true; const Q=roomOfFoe(e); return !Q||(Q._vk||0)>0.5; }
// the sleep pass, run around updateEnemies (wrapped once every module has loaded, so the boss frames that other
// modules hang on updateEnemies only see foes that are awake too): sleepers sit out the update and are hidden when Ash
// cannot see their room
Promise.resolve().then(()=>{ const base=updateEnemies; updateEnemies=function(dt){
  const A=AREA; RMV.frame++;
  if(!RMV.on||!A||!A.rooms||!G||!G.enemies||!G.enemies.length) return base.apply(this,arguments);
  roomVisTick();
  const all=G.enemies, wake=[], sleep=[];
  for(const e of all){ if(e.dead||roomAwake(e)) wake.push(e); else sleep.push(e); }
  for(const e of sleep){ e.frozen=!roomSeen(e); }
  if(!sleep.length) return base.apply(this,arguments);
  G.enemies=wake;
  try{ return base.apply(this,arguments); }
  finally{ const now=G.enemies; for(const e of sleep) now.push(e); }
}; });
// the camera's target for Ash's room (a5_input.js updateCam): a room that fits is framed below the HUD's top row (below
// every top panel when there is room for that), a bigger one follows Ash but never lets its top wall go under the
// panels or the camera wander past its walls
// the bottom of the right-hand panels: the minimap with its time, place and key strip, and on a narrow screen the
// weapon chip under the sound button and the companion chip under the minimap (a6b_weapons.js, a9i_comps.js)
function hudRightBottom(){
  const story=G&&G.mode==='story', L=SAFE.l+14, M=MINI_R(), pw=Math.min(250,M.x-L-10);
  let b=M.y+M.r*2+52;
  if(story){ const comp=!!G.pip||(typeof CM!=='undefined'&&CM&&CMG===G), rx=Math.max(L+pw+4,HUD_RX||0);
    if(comp&&M.x-rx<2*21+26) b=Math.max(b,M.y+M.r*2+38+2*21+16);
    if(G.flags&&G.flags.forge&&M.x-(L+pw+8)<130) b=Math.max(b,SAFE.t+164+4); }
  return b;
}
function roomHudBand(){
  const story=G.mode==='story', T=SAFE.t+14;
  const row=T+(story?96:70)+6;                                          // vitals panel and the quick slot under ROAR
  const right=hudRightBottom();                                         // minimap, its labels, the narrow chips
  const track=TRACK_R?TRACK_R.y+TRACK_R.h+4:row;
  return {row,all:Math.max(row,right,track),bot:usingTouch?Math.max(0,H-touchTopOver(0,W)+6):0};
}
function roomCam(fx,fy,vw,vh){
  const A=AREA; if(!RMV.on||!A||!A.rooms||!A.cave) return null;
  const R=ashRoom(); if(!R) return null;
  const b=G.boss; if(b&&!b.dead&&!b.noClip&&roomOfFoe(b)!==R){ fx=player.x+camLead.x; fy=player.y+camLead.y; }   // no lean toward a boss behind a wall
  const r=roomRect(A,R), rw=r.x1-r.x0, rh=r.y1-r.y0, B=roomHudBand(), z=zoom;
  const tx=rw<=vw?r.x0+rw/2-vw/2:clamp(fx-vw/2,r.x0,r.x1-vw);
  const fit=(band,bot)=>{ const uh=vh-band/z-bot/z; return rh<=uh?r.y0-band/z-(uh-rh)/2:null; };
  // centred between the top panels and the touch buttons; else right under the panels (the buttons cover the least)
  let ty=fit(B.all,B.bot); if(ty==null&&fit(B.all,0)!=null) ty=r.y0-B.all/z; if(ty==null) ty=fit(B.row,0);
  if(ty==null){ const band=B.row/z, uh=vh-band; ty=clamp(fy-band-uh/2,r.y0-band,r.y1-vh); }
  const room=R!==RMV.camR; RMV.camR=R; if(room) RMV.slideT=0.45;
  return {x:tx,y:ty,slide:RMV.slideT>0};
}
// a room that nearly fits is shown whole: the camera zooms out up to 18% (a desktop window), never on a phone, where a
// room is followed instead. RMV.zk multiplies the zoom moveZoom sets.
RMV.zk=1;
function roomZoomWant(){
  const A=AREA; if(!RMV.on||!A||!A.rooms||!A.cave||!player||scene==='menu') return 1;
  const R=ashRoom(); if(!R) return RMV.zkWant||1;
  const r=roomRect(A,R), z0=ZOOM0*(MV.zoomK||1), B=roomHudBand(), cs=A.cave.cell;
  const need=Math.min((H-B.row)/(r.y1-r.y0),W/(r.x1-r.x0+cs*0.5));
  return RMV.zkWant=need>=z0?1:need/z0>=0.82?need/z0:1;
}
function roomZoom(dt,snap){
  if(snap) RMV.snapT=2;   // a jump of the camera (a warp, the tp hook, a new floor): the rooms' light jumps with it
  const want=roomZoomWant(), z0=RMV.zk;
  RMV.zk=snap?want:RMV.zk+(want-RMV.zk)*(1-Math.exp(-dt*5)); if(Math.abs(RMV.zk-want)<0.002) RMV.zk=want;
  if(RMV.zk!==1||z0!==1) zoom=ZOOM0*(MV.zoomK||1)*RMV.zk;
}
// the dark over every room but Ash's (a11_render.js, after the lights and the floating words). Cells take the look of
// the brightest room that holds them, row by row in runs, so a shared wall is never darkened under the lit room.
function roomDarkCol(){ return LOOK.sb?'rgb(12,7,16)':'rgb(4,4,8)'; }
function drawRoomMask(){
  const A=AREA; if(!RMV.on||!A||!A.rooms||!A.cave||!A.canvas) return;
  if(scene==='play'||RMV.area!==A) roomVisTick();
  const c=A.cave, cs=c.cell, vw=W/zoom, vh=H/zoom, base=LOOK.sb&&typeof lookCave==='function'?lookCave(A):A.canvas, bs=A.canvasS, dark=roomDarkCol();
  const memo={}, lit={}; for(const id in A.rooms){ const R=A.rooms[id]; memo[id]=roomMemo(A,R); lit[id]=R._vk||0; }
  const i0=Math.max(0,Math.floor((cam.x-A.x0)/cs)-1), i1=Math.min(c.w-1,Math.floor((cam.x+vw-A.x0)/cs)+1);
  const j0=Math.max(0,Math.floor((cam.y-A.y0)/cs)-1), j1=Math.min(c.h-1,Math.floor((cam.y+vh-A.y0)/cs)+1);
  ctx.save(); ctx.globalAlpha=1;
  // outside the cave's grid (light and sparks spill there)
  ctx.fillStyle=dark; const ox0=cam.x-40, oy0=cam.y-40, ox1=cam.x+vw+40, oy1=cam.y+vh+40;
  if(oy0<A.y0) ctx.fillRect(ox0,oy0,ox1-ox0,A.y0-oy0); if(oy1>A.y1) ctx.fillRect(ox0,A.y1,ox1-ox0,oy1-A.y1);
  if(ox0<A.x0) ctx.fillRect(ox0,Math.max(oy0,A.y0),A.x0-ox0,Math.min(oy1,A.y1)-Math.max(oy0,A.y0)); if(ox1>A.x1) ctx.fillRect(A.x1,Math.max(oy0,A.y0),ox1-A.x1,Math.min(oy1,A.y1)-Math.max(oy0,A.y0));
  const run=(key,is,ie,j)=>{ if(key>=1000) return; const v=(key%100)/20, m=Math.floor(key/100), x=A.x0+is*cs, y=A.y0+j*cs, w=(ie-is+1)*cs;
    ctx.globalAlpha=1-v; ctx.fillStyle=dark; ctx.fillRect(x,y,w,cs+0.5);
    if(m>0){ ctx.globalAlpha=(m===2?RMV.memA:RMV.planA)*(1-v); ctx.drawImage(base,(x-A.x0)*bs,(y-A.y0)*bs,w*bs,cs*bs,x,y,w,cs+0.5); } };
  for(let j=j0;j<=j1;j++){
    let rs=i0, rk=-1;
    for(let i=i0;i<=i1+1;i++){
      let key=-2;
      if(i<=i1){ const L=roomsOfCell(A,i,j); let v=0, m=0; if(L) for(const R of L){ const q=lit[R.id]; if(q>v) v=q; if(memo[R.id]>m) m=memo[R.id]; }
        key=v>=0.995?1000:m*100+Math.round(v*20); }
      if(key!==rk){ if(rk>=0) run(rk,rs,i-1,j); rk=key; rs=i; }
    }
  }
  ctx.restore();
}
// lights in a room Ash cannot see stay out of the light layer (a brazier behind the wall does not light his side)
function roomLightOn(L){ const A=AREA; if(!RMV.on||!A||!A.rooms) return true; if(L._rmA!==A){ L._rmA=A; L._rm=areaRoomNear(L.x,L.y); } return !L._rm||(L._rm._vk||0)>0.01; }
// what in Ash's room must stay readable under the HUD (a11b_hud.js fades a panel with one of these under it): Ash, the
// foes he can see, people, the thing he could use now, and the things he can use in the room (not decoration)
const ROOM_NOUSE={decor:1,tfx:1,tdoor:1,dv:1};
function roomHudPoints(out){
  out.length=0; const A=AREA; if(!RMV.on||!A||!A.rooms||!player) return out;
  const R=ashRoom(), P=(x,y,r)=>out.push({x:(x-cam.x)*zoom,y:(y-cam.y)*zoom,r:r*zoom+6}), top=cam.y+260/zoom;
  if(!player.dead) P(player.x,player.y-22-(player.z||0),26);
  for(const e of G.enemies) if(!e.dead&&!e.frozen&&e.y<top+80) P(e.x,e.y-(e.r||12),(e.r||12)+10);
  for(const n of A.npcs) if(n.y<top+60) P(n.x,n.y-22,24);
  for(const o of A.objs){ if(ROOM_NOUSE[o.k]||o.y>top+40||o.y<cam.y-60) continue; if(G.found[o.id]&&(o.k==='coinpile'||o.k==='treatpick'||o.k==='smallkey'||o.k==='page')) continue;
    if(o._rmA!==A){ o._rmA=A; o._rm=areaRoomNear(o.x,o.y); } if(o._rm!==R&&!(o.k==='cgate'&&o.link&&(o.link.a===(R&&R.id)||o.link.b===(R&&R.id)))) continue; P(o.x,o.y-6,Math.min(o.r||16,22)); }
  if(G.prompt&&G.prompt.x!=null) P(G.prompt.x,G.prompt.y,24);
  return out;
}
window.__ebX=Object.assign(window.__ebX||{},{rooms:{
  on(v){ if(v!=null) RMV.on=!!v; return RMV.on; }, cfg:RMV, lift:(s,ids)=>roomsLift(s,ids),
  state(){ const A=AREA; if(!A||!A.rooms) return null; const R=ashRoom(), d=ashDoor();
    return {area:A.id,room:R&&R.id,cur:A.curRoom&&A.curRoom.id,door:d?[d.a,d.b]:null,mapped:caveMapped(A),
      rooms:Object.keys(A.rooms).map(id=>{ const Q=A.rooms[id]; return {id,kind:Q.kind,vk:+(Q._vk||0).toFixed(2),memo:roomMemo(A,Q),wake:Q._wake?+(Q._wake-G.time).toFixed(2):null}; }),
      foes:G.enemies.filter(e=>!e.dead).map(e=>{ const Q=roomOfFoe(e); return {id:e.id,type:e.type,room:Q&&Q.id,home:e.room,x:Math.round(e.x),y:Math.round(e.y),awake:roomAwake(e),seen:roomSeen(e),frozen:!!e.frozen,aggro:!!e.aggro}; })}; },
  rect:id=>AREA&&AREA.rooms&&AREA.rooms[id]?roomRect(AREA,AREA.rooms[id]):null,
  cam:()=>({x:Math.round(cam.x),y:Math.round(cam.y),zoom:+zoom.toFixed(3),band:roomHudBand()}),
  hud:()=>({pts:roomHudPoints([]).map(q=>[Math.round(q.x),Math.round(q.y),Math.round(q.r)]),rects:typeof HUDF!=='undefined'?HUDF.rects:null,k:typeof HUDF!=='undefined'?HUDF.k:null})
}});
