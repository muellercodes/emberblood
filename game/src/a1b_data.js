// v9 balance (numbers and reasoning: scratchpad BALANCE.md). hp: foe health x, dmg: damage Ash takes x, heal: heal orbs,
// herbs and cheers x, pot: healing draughts x, wind: foe wind-up (telegraph) time x, rec: foe recovery time x, cad: how fast
// foe attack cooldowns run x, spd: foe move speed x, aggro: how far foes notice Ash x, elite: story elite chance,
// bossHp: boss health x, still: seconds Ash may stand still in a boss fight before the ground erupts under him,
// cap: the most one hit can take, as a share of Ash's max health (a safety net for a player far below a region's level).
const DIFFS=[
  {name:'Easy',hp:0.95,dmg:0.75,heal:1.25,pot:1.2,wind:1,rec:1,cad:1,spd:1,aggro:1,elite:0.04,bossHp:0.8,still:3.4,cap:0.3,note:'Kinder foes and stronger healing. Foes still bite, so keep moving!'},
  {name:'Normal',hp:1.1,dmg:1.2,heal:1,pot:1,wind:0.88,rec:0.85,cad:1.15,spd:1.05,aggro:1.12,elite:0.08,bossHp:1,still:2.6,cap:0.45,note:'A real fight. Quick foes and tough bosses.'},
  {name:'Hard',hp:1.25,dmg:1.55,heal:0.8,pot:0.8,wind:0.78,rec:0.72,cad:1.3,spd:1.12,aggro:1.25,elite:0.14,bossHp:1.25,still:1.9,cap:0.6,note:'Faster, meaner foes and much tougher bosses.'}
];
const GREATS='great-'.repeat(13);
const EDEF={
  kobold:{r:11,hp:26,speed:125,dmg:8,value:10},
  cultist:{r:13,hp:34,speed:85,dmg:9,value:16},
  drakeling:{r:13,hp:38,speed:160,dmg:11,value:20,flying:true},
  knight:{r:19,hp:125,speed:68,dmg:16,value:38,shield:true,kbRes:0.25},
  wolf:{r:13,hp:32,speed:185,dmg:9,value:14},
  egg:{r:12,hp:26,speed:0,dmg:0,value:2,kbRes:0},
  bat:{r:9,hp:16,speed:210,dmg:6,value:8,flying:true,kbRes:1.4},
  slime:{r:13,hp:30,speed:90,dmg:8,value:9,kbRes:1.1},
  sneak:{r:10,hp:22,speed:205,dmg:0,value:12,kbRes:1.6},
  grizzlefang:{r:24,hp:520,speed:118,dmg:13,value:220,boss:true,kbRes:0.3,name:'Grizzlefang',title:'Top Fang of the War Camp'},
  morrow:{r:19,hp:640,speed:95,dmg:10,value:320,boss:true,kbRes:0.4,name:'High Priest Morrow',title:'Big Wick of the Scaled Oath'},
  broodmother:{r:32,hp:820,speed:125,dmg:16,value:420,boss:true,flying:true,kbRes:0.15,name:'The Brood Mother',title:'Ruler of the Roost'},
  gloamjaw:{r:30,hp:900,speed:95,dmg:17,value:420,boss:true,kbRes:0.1,name:'Gloamjaw',title:'A Real Mouthful'},
  greymane:{r:22,hp:860,speed:200,dmg:14,value:420,boss:true,kbRes:0.2,name:'Greymane',title:'The Cold Snap of Frostpine'},
  cindervane:{r:27,hp:1150,speed:82,dmg:18,value:560,boss:true,shield:true,kbRes:0.08,name:'Sir Cindervane',title:'The Knight Who Never Sits Down'},
  vorlaxis:{r:56,hp:4200,speed:72,dmg:17,value:1500,boss:true,kbRes:0,name:'Vorlaxis, the First Flame',title:'Your '+GREATS+'grandfather',short:'Your great ×13 grandfather'}
};
const SPK={
  narr:{name:'',col:'#d9c3a5'}, ash:{name:'Ash',col:'#ff9a52'}, yara:{name:'Elder Yara',col:'#a7d98f'}, maren:{name:'Maren, your mom',col:'#f0a46a'},
  wren:{name:'Sister Wren',col:'#9ec8ff'}, moss:{name:'Granny Moss',col:'#b5d68a'}, hollis:{name:'Farmer Hollis',col:'#e6c48a'}, pip:{name:'Pip',col:'#ffb070'}, goat:{name:'Duchess',col:'#e8e2d0'},
  stone:{name:'A voice in the stone',col:'#ffd9a0'}, iska:{name:'Warden Iska',col:'#ffd9a0'}, bram:{name:'Warden Bram',col:'#ffd9a0'}, oriel:{name:'Warden Oriel',col:'#ffd9a0'}, sedge:{name:'Warden Sedge',col:'#ffd9a0'}, tove:{name:'Warden Tove',col:'#ffd9a0'},
  vor:{name:'Vorlaxis',col:'#ff5a35'}, voice:{name:'A Voice in the Fire',col:'#ff5a35'},
  griz:{name:'Grizzlefang',col:'#e3c96a'}, morrow:{name:'High Priest Morrow',col:'#c792ea'}, brood:{name:'The Brood Mother',col:'#ef7a9a'},
  gloam:{name:'Gloamjaw',col:'#9fbf6a'}, cinder:{name:'Sir Cindervane',col:'#ffb547'},
  villager:{name:'Villager',col:'#d8c3a0'}, townsfolk:{name:'Townsfolk',col:'#cfd6e0'}
};
const UPGRADES=[
  {id:'claws',icon:'⚔️',name:'Sharpened Claws',desc:'Sword slashes deal 20% more damage.',apply:p=>{p.stats.slash*=1.2;}},
  {id:'scales',icon:'🛡️',name:'Thick Scales',desc:'+20 max HP, and heal to full.',apply:p=>{p.maxHp+=20;p.hp=p.maxHp;}},
  {id:'furnace',icon:'🔥',name:'Inner Furnace',desc:'Fire breath burns 25% hotter and costs less.',apply:p=>{p.stats.fire*=1.25;p.stats.fireCost*=0.88;}},
  {id:'wings',icon:'💨',name:'Swift Wings',desc:'Move 8% faster. Rolls cost less stamina.',apply:p=>{p.stats.speed*=1.08;p.stats.rollCost*=0.82;}},
  {id:'stamina',icon:'🫁',name:'Iron Lungs',desc:'+25 stamina, and it refills faster.',apply:p=>{p.maxStamina+=25;p.stamina=p.maxStamina;p.stats.staminaRegen*=1.15;}},
  {id:'blood',icon:'❤️',name:'Blood of the Wyrm',desc:'Heal 2 HP every time you defeat an enemy.',apply:p=>{p.stats.killHeal+=2;}},
  {id:'arc',icon:'🌙',name:'Wide Arc',desc:'Your slashes reach 15% farther.',apply:p=>{p.stats.range*=1.15;}},
  {id:'heart',icon:'🐉',name:'Roaring Heart',desc:'Roar charges 35% faster and hits harder.',apply:p=>{p.stats.roarRate*=1.35;p.stats.roarDmg*=1.25;}},
  {id:'tempered',icon:'⚒️',name:'Tempered Blade',desc:'Swing your sword 12% faster.',apply:p=>{p.stats.atkSpeed*=1.12;}},
  {id:'warding',icon:'🧱',name:'Warden’s Hide',desc:'Take 10% less damage.',apply:p=>{p.stats.armor=(p.stats.armor||1)*0.9;}},
  {id:'lungs',icon:'🌬️',name:'Bellows Lungs',desc:'+30 fire meter, and it refills faster.',apply:p=>{p.maxEnergy+=30;p.energy=p.maxEnergy;p.stats.energyRegen*=1.2;}},
  {id:'emberdash',icon:'☄️',name:'Ember Roll',desc:'Rolling leaves a trail of fire behind you.',once:true,apply:p=>{p.stats.emberDash=true;}},
  {id:'flameedge',icon:'✨',name:'Flame Edge',desc:'The third slash of a combo launches a wave of fire.',once:true,apply:p=>{p.stats.flameEdge=true;}},
  {id:'phoenix',icon:'🪶',name:'Phoenix Ember',desc:'Once per rest, survive a knockout blow with half your HP.',once:true,apply:p=>{p.stats.phoenix=1;p.stats.phoenixMax=1;}}
];
const DEATH_LINES=[
  'The lanterns are still waiting. Get back up.',
  'Even dragons fall sometimes. Shake off the dust.',
  'The fire in your blood is not out yet.',
  'Elder Yara would tell you to roll more. Elder Yara is usually right.',
  'Mom would say: walk it off, then hit it harder.'
];
const DCOL={kobold:'190,160,90',cultist:'170,100,220',drakeling:'240,140,70',knight:'230,140,60',wolf:'170,170,170',egg:'230,220,195',bat:'70,50,70',slime:'120,200,80',grizzlefang:'220,190,110',morrow:'190,120,240',broodmother:'230,90,140',gloamjaw:'120,150,80',greymane:'220,225,235',cindervane:'250,160,80',vorlaxis:'255,120,40'};
const VILLAGER_LINES=['Thank you, Ash. My chickens are safe again.','The smoke is coming from the mountain. Everyone can see it.','My grandmother said your family were dragons once. I always thought she was joking.','Watch yourself out there after dark. The wolves come down from Whisperwood.','Elder Yara has been writing in her big book all morning.','We rebuilt the bakery. Twice. Please be careful near it.','Your mom fixed my plow and my door hinge in the same afternoon. She never sleeps.'];
const TOWN_LINES=['Welcome to Brindlecross! Best fish on Lake Mirrow. Only fish on Lake Mirrow, actually.','Sister Wren? Big building with all the books. Knock loudly, she reads with her ears closed.','Caravans stopped coming down the Ashen Road. The cult has the whole road spooked.','Granny Moss lives out in the Mirefen. If you get lost, follow the smell of tea.','A farmer up in the Frostpine lost his goat. He has posted eleven signs about it.','They say the Obsidian Gate hasn’t opened in living memory. I say they say a lot of things.'];
