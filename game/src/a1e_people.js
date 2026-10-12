
// ================= the people of Embermere
// Every named villager has a home town, a look, a few lines of backstory, and ties to someone elsewhere in the valley.
// home:true means they get one of the houses in their town (in list order); `house` names the building.
const CAST=[
  // ---- Emberhollow
  {id:'maren',name:'Maren, your mom',town:'village',spot:'forge',col:'#f0a46a',look:{shirt:'#8a4a2a',hair:'#b8401a',bun:true,apron:true},
    lines:[`Your grandmother's grandmother forged that sword. I just made it not wobbly.`,`Gorran Flint up at Coppergulch used to bring me ore every spring. Haven't heard from him since the drakelings got loud.`,`Eat something before you save the world, Ash.`]},
  {id:'yara',name:'Elder Yara',town:'village',spot:'well',col:'#a7d98f',look:{shirt:'#4e5e32',hair:'#e8e4dc'},
    lines:[`I taught Sister Wren her letters, you know. She was a terrible speller. Now she runs a library. Life is funny.`,`Pebble, my crow, carries letters for half the valley. She charges in shiny buttons.`,`Nine hundred and ninety-nine Lantern Days, I lit the first lantern. This year it was you. It felt right.`]},
  {id:'bertram',name:'Bertram Crumb',town:'village',home:true,house:'Crumb’s Bakery',job:'baker',col:'#f2c27a',look:{shirt:'#efe6d6',hair:'#6a4a2a',apron:true,hat:'chef'},
    lines:[`The bakery has been rebuilt twice. Both times were your fault, Ash. I say that with love. Mostly.`,`My sister Tilly runs the Sleepy Salmon Inn in Brindlecross. We haven't spoken in nine years. It's about a bun.`,`Grandma Crumb's Lantern Bun recipe needs a gentle flame. Gentle. You understand why I'm nervous.`]},
  {id:'fennick',name:'Fennick Wick',town:'village',home:true,house:'Wick’s Lamps & Oils',job:'lamps',col:'#d8c070',look:{shirt:'#6a5a3a',hair:'#3a2a1a',glasses:true},
    lines:[`Lamp oil! Lamp wicks! Lamp... other things! Business has been, uh, very normal. Very normal business.`,`Me? Near the north gate? The night of the festival? No. Why? Who said that?`,`My cousin Hob runs the Smoky Kettle on the Ashen Road. He's the handsome one. He'd want you to know that.`]},
  {id:'mabel',name:'Mabel Thornbury',town:'village',home:true,house:'Thornbury Cottage',job:'herbalist',col:'#b5d68a',look:{shirt:'#5a7a3a',hair:'#8a3a1a'},
    lines:[`My gran is Granny Moss, out in the Mirefen. She taught me every herb in the valley and three that don't exist.`,`If you get hurt out there, look for the little purple flowers. They taste awful and they work.`,`Gran writes me every week. Well. She used to.`]},
  {id:'rook',name:'Rook Ashby',town:'village',home:true,house:'The Ashby House',job:'kid',kid:true,col:'#9fd0ff',look:{shirt:'#3a6a9a',hair:'#2a1a10'},
    lines:[`When I grow up I'm going to be a knight. Or a dragon. Can you teach me to be a dragon?`,`My big sister Juniper makes maps. She's mapped everything except the inside of caves. She says that's next.`,`Elka at the Frostpine Lodge is my pen pal. She says she can sled faster than a wolf. I believe her.`]},
  {id:'wendel',name:'Wendel Fisk',town:'village',home:true,house:'The Fisk House',job:'fiddler',col:'#d0a0e0',look:{shirt:'#6a3a7a',hair:'#b8a070',beard:true},
    lines:[`I'm Emberhollow's finest fiddler. I'm also its only fiddler, so the competition is relaxed.`,`My cousin Dell fishes on Lake Mirrow. He says the fish are biting. I say the fish are rude.`,`I'm writing a song about you. So far it rhymes "Ash" with "crash." Twice.`]},
  {id:'nana',name:'Nana Pettibone',town:'village',home:true,house:'Pettibone Cottage',job:'knitter',col:'#e0b0c0',look:{shirt:'#a05a7a',hair:'#efeae0',glasses:true},
    lines:[`I've knitted a sweater for every person in this village. Some of them even asked.`,`My boy Osric is Captain of the Watch in Brindlecross. He never writes. He's very busy being brave.`,`You look cold. Dragons shouldn't be cold. Here, hold this yarn.`]},
  {id:'hal',name:'Hal Burrows',town:'village',home:true,house:'Burrows Farmhouse',job:'farmer',col:'#c8b070',look:{shirt:'#7a6a3a',hair:'#4a3a20',hat:'straw'},
    lines:[`That's Moo-rgaret in the field. She's a cow. She knows she's a cow. We don't discuss it.`,`I write to Ulf up at the Frostpine Lodge about cheese. It's a very serious correspondence.`,`The kobolds trampled my turnips. Sir Strawsworth the scarecrow did his best.`]},
  // ---- Brindlecross
  {id:'wren',name:'Sister Wren',town:'brindle',spot:'library',col:'#9ec8ff',look:{hood:'#2a4278',shirt:'#3a5a9a',glasses:true}, lines:[]},
  {id:'tilly',name:'Tilly Crumb',town:'brindle',home:true,house:'The Sleepy Salmon Inn',job:'inn',col:'#f2c27a',look:{shirt:'#8a3a3a',hair:'#6a4a2a',apron:true},
    lines:[`Welcome to the Sleepy Salmon! The beds are soft and the soup is mostly soup.`,`My brother Bertram bakes in Emberhollow. He blew up the family recipe. Literally. It was a very loud bun.`,`Professor Quill keeps a telescope on her roof. She says the mountain smoke is getting thicker. Cheery woman.`]},
  {id:'osric',name:'Captain Osric Pettibone',town:'brindle',home:true,house:'The Watch House',job:'guard',col:'#c8d0e0',look:{shirt:'#4a5a7a',hair:'#6a4a2a',beard:true,helm:true},
    lines:[`Captain of the Brindlecross Watch. The Watch is me and two very old dogs.`,`My mother knits me a sweater every year. They're itchy. I wear all of them. Don't tell her.`,`The Scaled Oath has camps all along the Ashen Road. I post bounties on the board inside. Clear them out and I'll pay.`]},
  {id:'pell',name:'Pell the Peddler',town:'brindle',spot:'market',job:'shop',col:'#ffd27a',look:{shirt:'#7a2a6a',hair:'#1a1a1a',hat:'top'},
    lines:[`Pell's Wonderful Wagon! Potions, treats, hats, and things I cannot legally call potions!`,`I trade with Hob at the Smoky Kettle. He pays in soup. I accept soup.`]},
  {id:'dell',name:'Dell Fisk',town:'brindle',spot:'dock',job:'fisher',col:'#9ad0c8',look:{shirt:'#3a6a6a',hair:'#b8a070',hat:'straw',beard:true},
    lines:[`Lake Mirrow has the best fish in the valley. Don't tell my cousin Wendel, he thinks fish are rude.`,`My boat, the Soggy Biscuit, got eaten. By a swamp. Well, by something in the swamp.`,`Old Sal down the shore is building me a new boat. She's been building it for six years.`]},
  {id:'marigold',name:'Marigold Vane',town:'brindle',home:true,house:'Vane’s Fine Hats',job:'tailor',col:'#ffb0c8',look:{shirt:'#c84a6a',hair:'#e8c060'},
    lines:[`Every hero needs a hat. Most heroes don't know it yet.`,`My twin brother Hob runs the Smoky Kettle. He always forgets his scarf. I've knitted him nine. Nana Pettibone taught me.`,`I made Juniper Ashby's map case. Waterproof, fireproof, and very stylish.`]},
  {id:'quill',name:'Professor Quill',town:'brindle',home:true,house:'The Observatory',job:'scholar',col:'#c0c8ff',look:{shirt:'#3a3a6a',hair:'#efeae0',glasses:true},
    lines:[`I study the sky, the smoke, and the stars that fall. Star-iron is a fallen star, you know. Very rude of it to fall.`,`Gorran Flint at Coppergulch and I trade letters about rocks. He thinks I'm mad. I think he's right.`,`Sister Wren and I argue about the Wardens every Tuesday. I usually lose. She has more books.`]},
  {id:'mayor',name:'Mayor Brindle',town:'brindle',home:true,house:'The Mayor’s House',job:'mayor',col:'#e0c080',look:{shirt:'#5a2a2a',hair:'#3a2a1a',hat:'top',beard:true},
    lines:[`Welcome to Brindlecross, named after my great-great-great-great grandfather, Brindle. I only need four greats. You have my sympathy.`,`I've invited Elder Yara to cut the ribbon on our new bridge. She keeps counting the planks instead.`]},
  {id:'nib',name:'Nib',town:'brindle',job:'kid',kid:true,col:'#d8c0a0',look:{shirt:'#6a5a4a',hair:'#8a5a2a',hat:'cap'},
    lines:[`Maps! Treasure maps! Very real! One coin! Okay, most of them are drawings of my cat.`,`Rook in Emberhollow says his sister maps caves. I map cats. It's a growing field.`]},
  // ---- Coppergulch
  {id:'gorran',name:'Gorran Flint',town:'copper',home:true,house:'The Foreman’s Bunkhouse',job:'miner',col:'#d8a070',look:{shirt:'#6a4a2a',hair:'#8a3a1a',beard:true,helm:true},
    lines:[`Maren's kid? Ha! You've got her jaw. And, uh, considerably more horns.`,`Drakelings took the mine when the Brood Mother started nesting. Can't dig with lizards in your hair.`,`Professor Quill writes me about stars. I write her about rocks. We're both right.`]},
  {id:'cookie',name:'Cookie',town:'copper',home:true,house:'The Cook Shack',job:'cook',col:'#f0c090',look:{shirt:'#efe6d6',hair:'#3a2a1a',apron:true,hat:'chef'},
    lines:[`Rock Soup! It's soup. With rocks. The rocks are for flavor.`,`Tilly Crumb at the Sleepy Salmon says my soup is a crime. I say she's never been hungry in a mine.`]},
  {id:'pick',name:'Pick & Shovel',town:'copper',home:true,house:'The Twins’ Bunkhouse',job:'miner',col:'#c0a080',look:{shirt:'#5a5a3a',hair:'#2a1a10',helm:true},
    lines:[`I'm Pick. He's Shovel. Or I'm Shovel. We swapped once and nobody noticed.`,`We'd go back in the mine but we've decided we're scared now.`]},
  // ---- Frostpine
  {id:'hollis',name:'Farmer Hollis',town:'farm',spot:'farm',col:'#e6c48a',look:{shirt:'#8a6a3a',hair:'#6a4a2a',hat:'straw',beard:true},lines:[]},
  {id:'ulf',name:'Ulf Hollis',town:'lodge',home:true,house:'Frostpine Lodge',job:'hunter',col:'#c8d8e8',look:{shirt:'#6a3a2a',hair:'#d8c8a0',beard:true},
    lines:[`I'm Ulf. My brother Hollis keeps goats. Goats! Sheep are better in every way. Write that down.`,`Hal Burrows sends me cheese from Emberhollow. Best cheese in the valley. Don't tell my brother I said something nice.`,`Greymane's pack has been strange since the smoke came. Orange eyes. Wrong.`]},
  {id:'elka',name:'Elka',town:'lodge',job:'kid',kid:true,col:'#ffc0a0',look:{shirt:'#c84a3a',hair:'#e8c060',hat:'beanie'},
    lines:[`I can sled faster than a wolf! I checked. Once. Dad was very upset.`,`My pen pal Rook lives in Emberhollow. He wants to be a dragon. I told him to start small, like a lizard.`]},
  {id:'brisket',name:'Brisket',town:'lodge',job:'adventurer',col:'#e0d0b0',look:{shirt:'#5a6a3a',hair:'#8a5a2a',helm:true},hidden:true,
    lines:[`Thanks again for the thaw. I've decided to retire from adventuring and take up being warm.`,`I was frozen solid for a while. You'd think I'd be wiser now. I just know more about ice.`]},
  // ---- the Ashen Road
  {id:'hob',name:'Hob Vane',town:'way',home:true,house:'The Smoky Kettle',job:'inn',col:'#e0b080',look:{shirt:'#6a3a1a',hair:'#e8c060',beard:true},
    lines:[`Welcome to the Smoky Kettle! The kettle's gone, but the smoke stayed.`,`My twin Marigold makes hats in Brindlecross. She thinks I forget my scarf. I lose it. That's different.`,`My cousin Fennick in Emberhollow came through here a while back with a pocket full of gold. Fennick! Gold! Something's off.`]},
  {id:'tamsin',name:'Tamsin the Bard',town:'way',job:'bard',col:'#ffa0d0',look:{shirt:'#7a2a7a',hair:'#1a1a1a',hat:'feather'},lines:[]},
  // ---- the Mirefen
  {id:'moss',name:'Granny Moss',town:'mire',spot:'moss',col:'#b5d68a',look:{hood:'#6a8a4a',shirt:'#5a7a3a'},lines:[]}
];
const CASTBY={}; for(const c of CAST) CASTBY[c.id]=c;
// generic neighbours: named, with a line that ties them to someone across the valley
const FIRST=['Agnes','Barnaby','Cora','Dunstan','Edie','Felix','Greta','Humphrey','Iris','Jasper','Kit','Lavinia','Morton','Nettie','Oswin','Prue','Quentin','Rosalind','Silas','Tuppence','Ursula','Vernon','Winnie','Yorick','Zelda','Bram','Clover','Dot','Ernest','Fern'];
const LAST=['Hobb','Tumble','Pickering','Mossbottom','Fairweather','Crabapple','Underhill','Goodbody','Larkspur','Puddle','Wainwright','Copperpot','Thistle','Bramblewick','Honeydew'];
const NEIGHBOR_LINES=[
  t=>`I went to school with ${t}. They still owe me a pencil.`,
  t=>`If you see ${t}, tell them I said the thing about the goat was a joke.`,
  t=>`${t} and I used to race snails. I always lost. Their snail was suspiciously fast.`,
  t=>`My aunt swears ${t} once fought a bear. ${t} says it was a large dog. The truth is somewhere furry.`,
  t=>`I sent ${t} a pie last winter. I never heard back. Was it the pie?`,
  t=>`${t} owes me a song. A good one. Not one that rhymes "Ash" with "crash."`
];
const NEIGHBOR_ODD=['I alphabetize my spoons.','I once saw a drakeling sneeze. It was adorable and then my hat was on fire.','I have a pet rock named Gregory. He is very well behaved.','On Lantern Day I hide a lantern somewhere silly. This year: inside a bigger lantern.','I keep my good socks for emergencies.','I sleep with my boots on in case of adventure.','My grandfather met a Warden once. She told him to get off her lawn.','I am training a goose. The goose is training me back.'];
const TIE_NAMES={village:['Tilly Crumb in Brindlecross','Dell the fisherman','Gorran Flint at Coppergulch','Hob at the Smoky Kettle','Ulf at Frostpine Lodge'],brindle:['Bertram the baker in Emberhollow','Nana Pettibone','Granny Moss in the Mirefen','Cookie at Coppergulch','Farmer Hollis'],copper:['Maren the blacksmith','Professor Quill','Tilly Crumb'],lodge:['Hal Burrows in Emberhollow','Rook Ashby','Marigold the hatmaker'],way:['Fennick Wick','Marigold Vane','Mayor Brindle']};
