
// ================= side quests, errands, lore pages
const ITEM_NAMES={letter_b:'Bertram’s letter',recipe:'Tilly’s half of the recipe',frostberry:'Frostberry',basket:'Mabel’s basket',moonlily:'Moonlily',letter_moss:'Granny Moss’s letter',oath_letter:'Crumpled Oath letter',oath_badge:'Brass scale badge',tunnel_key:'Oath tunnel key',oath_plans:'The Oath’s plans',lucky_pick:'Gorran’s lucky pick',star_iron:'Star-iron',horn:'Ulf’s horn',fish:'Fish',rod:'Fishing rod',lucky_lure:'Dell’s lucky lure',kettle:'Hob’s kettle',honey:'Honey',juniper_map:'Juniper’s map',carrot:'Carrot of Destiny',map_x1:'Nib’s treasure map',map_x2:'Smudged treasure map',map_x3:'Juniper’s secret map',lantern:'Cave lantern',treat:'Pip treat',relic:'Warden’s Mantle',errand:'Parcel'};
const QDEFS={
  // offered from Lantern Day morning (it is the festival's own bun); before the raid Bertram says there is no rush
  bun:{title:'The Lantern Bun',giver:'bertram',min:'lanterns',give:{letter_b:1},
    get offer(){ const L=[['bertram',`Ash. I need your help, and it pains me to say it.`],['bertram',S(`For Lantern Day I wanted to bake Grandma Crumb's Lantern Bun. The recipe is torn in two. Half here, half with my sister Tilly at the Sleepy Salmon Inn in Brindlecross.`,`I want to bake Grandma's Lantern Bun. Half the recipe is with my sister Tilly, in Brindlecross.`)],['ash',`Why is it torn in two?`],['bertram',`We had an argument. About the bun. Nine years ago. Take her this letter. It says sorry. It took me nine years to write. It's very short.`]];
      if(G&&G.mode==='story'&&!reached('raid')) L.push(['bertram',S(`No rush. Light your lanterns first. Buns are patient. Bakers are not.`,`No rush. Light your lanterns first.`)]);
      return L; },
    steps:[
      {t:'talk',npc:'tilly',text:'Bring Bertram’s letter to Tilly at the Sleepy Salmon Inn in Brindlecross',take:{letter_b:1},give:{recipe:1},lines:[['tilly',`A letter from Bertram? "Sorry about the bun. B." Nine years for five words.`],['tilly',`...Fine. Here's my half of the recipe. Tell him he still needs frostberries. They only grow near Hollis Farm up in the Frostpine, and they're cold enough to freeze your tongue.`]]},
      {t:'item',item:'frostberry',n:3,text:'Pick 3 frostberries near Hollis Farm in the Frostpine Highlands',at:'poi:farm'},
      {t:'talk',npc:'bertram',text:'Bring the recipe and frostberries back to Bertram in Emberhollow',take:{recipe:1,frostberry:3},lines:[['bertram',`Both halves! And frostberries! Grandma would cry. She cried a lot. Mostly about buns.`],['bertram',`Now the important part. Light the oven. Gently. GENTLY.`]]},
      {t:'flag',flag:'oven_lit',text:'Gently light Bertram’s oven with your fire breath',at:'npc:bertram'},
      {t:'talk',npc:'bertram',text:'See how the Lantern Bun turned out',lines:[['bertram',`It's... perfect. The Lantern Bun. Go on, have the first one.`],['narr',`You eat the Lantern Bun. It's warm all the way down to the tip of your tail.`],['bertram',`Maybe I'll take one to Tilly. After nine years. Maybe.`]],reward:{coins:40,maxhp:15,bless:1}}
    ]},
  hollow:{title:'Lost in the Hollow',giver:'rook',min:'warcamp',
    offer:[['rook',`Ash! My sister Juniper went to map Whisperwood Hollow three days ago. She said she'd be back by supper.`],['rook',`Juniper is NEVER late for supper. The cave is west of the war camp road, deep in the woods. Please find her.`]],
    steps:[
      {t:'flag',flag:'juniper_found',text:'Find Juniper inside Whisperwood Hollow, west of the war camp road',at:'cave:whisper'},
      {t:'talk',npc:'rook',text:'Tell Rook his sister is safe',lines:[['rook',`JUNIPER! She came in the door covered in bat poop and yelling about you! You're the best, Ash.`],['juniper',`Here. My map of every cave and secret spot in the valley. Two years of work. Don't spill anything on it.`]],give:{juniper_map:1,map_x3:1},reward:{coins:25,xp:80}}
    ]},
  gate:{title:'The Open Gate',giver:'yara',min:'warcamp',story:true,
    offer:[['yara',S(`Something's been bothering me, Ash. Somebody unlocked the North Gate on Lantern Day. Kobolds can't pick locks. They don't have the thumbs for it.`,`Someone unlocked the North Gate. Kobolds can't pick locks.`)],['yara',`Have a look around the Hollow Ward. Whoever let them in might have stopped there too.`]],
    steps:[
      {t:'flag',flag:'clue_prints',text:'Look for clues near the Hollow Ward under the old oak',at:'lm:bootprints'},
      {t:'flag',flag:'clue_letter',text:'Find out who the Oath was paying. High Priest Morrow might know.',at:'poi:oath'},
      {t:'flag',flag:'clue_badge',text:'Search Wick’s Lamps & Oils in Emberhollow',at:'npc:fennick'},
      {t:'talk',npc:'fennick',text:'Confront Fennick Wick',lines:'confront',give:{tunnel_key:1}},
      {t:'flag',flag:'tunnel_plans',text:'Explore the Oath’s Hidden Tunnel off the Ashen Road',at:'cave:tunnel'},
      {t:'talk',npc:'wren',text:'Show the Oath’s plans to Sister Wren',take:{oath_plans:1},lines:[['wren',`"Snuff the Wards before the thousandth year ends. When the binding fails, deliver the Emberblood to the mountain. The Great One will take back his fire, and we will be rewarded with..." and then there's a doodle of a dragon wearing a crown.`],['wren',S(`So that's their whole plan. Weaken the chains, then hand you over. You've ruined it, mostly by being very annoying to kidnap.`,`Their plan: weaken the chains and hand you over. You ruined it!`)]],reward:{coins:60,xp:200,bless:1}}
    ]},
  moss:{title:'Gran’s Basket',giver:'mabel',min:'wren',give:{basket:1},
    offer:[['mabel',`Gran hasn't written in weeks. Could you take her this basket? Bread, honey, and a strongly worded note about writing more.`],['mabel',`She lives out in the Mirefen, southeast past Brindlecross. Follow the smell of tea.`]],
    steps:[
      {t:'talk',npc:'moss',text:'Take Mabel’s basket to Granny Moss in the Mirefen',take:{basket:1},lines:[['moss',`A basket from my Mabel! "Write more, Gran." Cheeky girl.`],['moss',`I've been stuck, dear. My knees can't manage the bog, and I'm out of moonlilies for my healing brew. Fetch me five? They glow pale blue at the edges of the pools.`]]},
      {t:'item',item:'moonlily',n:5,text:'Gather 5 moonlilies in the Mirefen',at:'poi:mire'},
      {t:'talk',npc:'moss',text:'Bring the moonlilies to Granny Moss',take:{moonlily:5},give:{letter_moss:1},lines:[['moss',`Five! Here, a new flask for your belt. It holds one more healing draught.`],['moss',`And take this back to my Mabel, would you? I wrote a whole letter. Well. A whole sentence.`]],reward:{potmax:1}},
      {t:'talk',npc:'mabel',text:'Bring Granny Moss’s letter to Mabel in Emberhollow',take:{letter_moss:1},lines:[['mabel',`She wrote! "Dear Mabel. Stop worrying. Love, Gran. P.S. That dragon child is too skinny."`],['mabel',`She's right, you know. Here. Eat this. It's a carrot. It's good for you.`]],reward:{coins:30,xp:60}}
    ]},
  duchess:{title:'Where’s Duchess?',giver:'hollis',min:'wren',
    offer:[['hollis',`Have you seen a goat? About this tall, opinions about everything, answers to Duchess?`],['hollis',`She wandered up toward the high snow, north of here. The wolves are out. Please.`]],
    steps:[
      {t:'flag',flag:'duchess_follow',text:'Find Duchess the goat in the high snow north of Hollis Farm',at:'goat'},
      {t:'flag',flag:'duchess_home',text:'Bring Duchess home to Hollis Farm',at:'npc:hollis'},
      {t:'talk',npc:'hollis',text:'Talk to Farmer Hollis',lines:[['hollis',`Duchess! You terrible, wonderful goat. Thank you, Ash. My grandfather swore by this charm.`],['goat',`Meh.`],['ash',`Rude.`],['hollis',`Do me a favor? Tell my brother Ulf at the Frostpine Lodge that Duchess came home safe. Goats: one. Sheep: zero.`]],reward:{bless:1}},
      {t:'talk',npc:'ulf',text:'Tell Ulf at Frostpine Lodge that Duchess came home',lines:[['ulf',`She came home? With help from a dragon? Hmph. Tell my brother a sheep would never have wandered off. Sheep don't have ambitions.`]],reward:{coins:20,xp:40}}
    ]},
  horn:{title:'Ulf’s Horn',giver:'ulf',min:'wren',
    offer:[['ulf',`My grandfather's hunting horn. I dropped it running out of Icefang Cavern when the ice wolves came.`],['ulf',`The cave's south of here, past the frozen trees. It's deep in there. Wear a scarf.`]],
    steps:[
      {t:'item',item:'horn',n:1,text:'Find Ulf’s horn deep in Icefang Cavern',at:'cave:icefang'},
      {t:'talk',npc:'ulf',text:'Bring the horn back to Ulf',take:{horn:1},lines:[['ulf',`That's it! Listen to this.`],['narr',`Ulf blows the horn. Somewhere far away, a goat answers. Ulf looks betrayed.`],['ulf',`Here. My grandfather's scarf. Warmest thing in the valley. You'll run all day in it.`]],reward:{stamina:20,coins:30}}
    ]},
  mine:{title:'The Coppergulch Mine',giver:'gorran',min:'three',
    offer:[['gorran',`The drakelings took the mine. There's a whole vein of star-iron down there and not one of us willing to get our eyebrows burned off.`],['gorran',`Clear 'em out and bring me my lucky pick. I left it at the bottom. Leave my eyebrows out of it.`]],
    steps:[
      {t:'item',item:'lucky_pick',n:1,text:'Clear Coppergulch Mine and find Gorran’s lucky pick',at:'cave:mine'},
      {t:'talk',npc:'gorran',text:'Bring the lucky pick to Gorran',take:{lucky_pick:1},give:{star_iron:1},lines:[['gorran',`My pick! And the mine's quiet! Take this chunk of star-iron. Your mom will know what to do with it.`],['gorran',`And tell Maren... tell her Gorran says the ore's coming again in spring. Like always.`]]},
      {t:'talk',npc:'maren',text:'Give Mom the star-iron and Gorran’s message',lines:[['maren',`Gorran! That old rock goblin. Spring, like always.`],['maren',`Thank you for this, Ash. Give me that blade.`]],reward:{coins:25,xp:80}}
    ]},
  dell:{title:'Three Fish for Dell',giver:'dell',min:'wren',give:{rod:1},
    offer:[['dell',`Know how to fish? No? Here, borrow my spare rod.`],['dell',S(`Stand at any fishing spot and press the use button. When the bobber splashes, press it again. Bring me three fish. I've been eating bread for a week.`,`Stand by a fishing spot. Press use. When it splashes, press again. Bring me three fish.`)]],
    steps:[
      {t:'item',item:'fish',n:3,text:'Catch 3 fish at a fishing spot (look for ripples on the shore)'},
      {t:'talk',npc:'dell',text:'Bring the fish to Dell on the Brindlecross dock',take:{fish:3},lines:[['dell',`Fish! Real fish! Keep the rod. And if you ever get to the Sunken Grotto down in the Mirefen... my boat went down near there.`]],reward:{coins:20,xp:40}}
    ]},
  lure:{title:'The Soggy Biscuit',giver:'dell',min:'three',after:'dell',
    offer:[['dell',`The Soggy Biscuit sank somewhere in the Sunken Grotto. Something big pulled it under. Something with a tongue.`],['dell',`My lucky lure's in the tackle box. And... something else. Please, Ash.`]],
    steps:[
      {t:'item',item:'lucky_lure',n:1,text:'Find the wreck of the Soggy Biscuit in the Sunken Grotto',at:'cave:grotto'},
      {t:'talk',npc:'dell',text:'Bring the tackle box back to Dell',take:{lucky_lure:1},lines:[['dell',`My lure! And... my wedding ring. I hid it in the tackle box so I wouldn't lose it fishing. Then I lost the whole boat.`],['dell',`Sal finally finished my new boat. I'm calling it the Soggy Biscuit Two.`]],reward:{coins:40,bless:1}}
    ]},
  bounty:{title:'Bounties of the Ashen Road',giver:'osric',min:'wren',
    offer:[['osric',`The Oath's camps are everywhere. Here's a bounty: clear any three enemy camps and I'll pay. The board says "any three." I wrote the board.`]],
    steps:[
      {t:'camps',n:3,text:'Clear 3 enemy camps anywhere in the valley'},
      {t:'talk',npc:'osric',text:'Collect your bounty from Captain Osric',lines:[['osric',`Three camps! Here's your coin. The two dogs are very impressed. One of them woke up.`]],reward:{coins:50,xp:80}}
    ]},
  bounty2:{title:'The Big Bounty',giver:'osric',min:'three',after:'bounty',
    offer:[['osric',`Big bounty. Six camps. If you do this, I'll have to write a second board.`]],
    steps:[
      {t:'camps',n:6,text:'Clear 6 more enemy camps'},
      {t:'talk',npc:'osric',text:'Collect the big bounty from Captain Osric',lines:[['osric',`Six! The Watch salutes you. That's me. I'm saluting. Here's your reward.`]],reward:{coins:90,bless:1}}
    ]},
  kettle:{title:'Hob’s Kettle',giver:'hob',min:'wren',
    offer:[['hob',`The Oath stole my kettle! The Smoky Kettle without a kettle is just "the Smoky." It whistles. You'll hear it.`],['hob',`Their camp's east of here, out toward the old road.`]],
    steps:[
      {t:'item',item:'kettle',n:1,text:'Get Hob’s kettle back from the Oath camp east of the Smoky Kettle',at:'lm:kettle'},
      {t:'talk',npc:'hob',text:'Return the kettle to Hob',take:{kettle:1},lines:[['hob',`My kettle! ...They made soup in it. It smells like cultist. I'll scrub it.`]],reward:{coins:35,xp:60}}
    ]},
  pages:{title:'The Wardens’ Account',giver:'wren',min:'oath',special:'pages',
    offer:[['wren',S(`One more thing. The Wardens wrote the whole story down in a book, the Wardens' Account. Most of its pages blew away centuries ago. A very windy librarian.`,`The Wardens wrote a book. Most of its pages blew away long ago.`)],['wren',`If you find any loose pages out there, in caves, in old houses, anywhere, bring them to me. I'll pay you in coins and gratitude. Mostly coins.`]],
    steps:[{t:'pages',n:10,text:'Find the lost pages of the Wardens’ Account and bring them to Sister Wren'}]}
};
// cross-valley errands: someone always has something for someone else
const ERRANDS=[
  ['nana','osric','an itchy sweater',`Take this sweater to my Osric in Brindlecross. He'll pretend he doesn't like it.`,`Another one? Is it the blue one? ...It's the blue one. Tell her I'm wearing it right now. I am. Look.`,20,'wren'],
  ['wendel','dell','a jar of worms',`Give these to my cousin Dell on the Brindlecross dock. They're the good worms. He'll know.`,`The good worms! Wendel remembered! Tell him the fish say hello. Rudely.`,15,'wren'],
  ['hal','ulf','a wheel of stinky cheese',`Take this cheese to Ulf at Frostpine Lodge. Don't sniff it. I mean it.`,`Hal's cheese! I can smell it from here. So can the wolves. Thank you, I think.`,20,'wren'],
  ['marigold','hob','scarf number ten',`Bring this scarf to my twin brother Hob at the Smoky Kettle. It's his tenth. He loses them on purpose, I'm sure of it.`,S(`A scarf! I'll treasure it. Until the next windy day, probably. Tell her thanks.`,`A scarf! I will keep it. For a while. Say thanks!`),15,'wren'],
  ['quill','gorran','a rolled-up star chart',`Gorran Flint at Coppergulch asked for my star chart. I've marked where the stars fell. Star-iron, Ash!`,`Quill's chart! She's circled the spots where star-iron fell. Look, here, and here. Go look.`,20,'three'],
  ['cookie','tilly','a recipe for Rock Soup',`Give this to Tilly Crumb at the Sleepy Salmon. She says my soup is a crime. This is my defense.`,`Rock Soup. With actual rocks. ...I'll put it on the menu as a dare.`,15,'three'],
  ['elka','rook','a carved toy sled',`This is for my pen pal Rook in Emberhollow. I carved it myself. It's fast. Probably.`,`A sled! From Elka! Now I just need snow. And a hill. And to be a little braver.`,15,'wren'],
  ['yara','wren','a letter from her old teacher',`Take this to Sister Wren. I was her teacher. I'm still correcting her spelling.`,`From Yara? "...and your spelling is still atrocious. Proud of you. Y." *sniff* It's the dust. Libraries are very dusty.`,15,'oath'],
  ['mayor','yara','a very fancy invitation',`An invitation to the Brindlecross Bridge Ribbon-Cutting, for Elder Yara. Gold leaf. My face is on it.`,S(`An invitation. With his face on it. I'll go. I'll bring my own scissors. He never remembers the scissors.`,`An invitation with his face on it. I will go.`),15,'wren'],
  ['pell','hob','a crate of mysterious hats',`Run these hats to Hob at the Smoky Kettle. Don't open the crate. The hats are shy.`,`Hats! Marigold will be furious. Wonderful. Tell Pell the soup's on me.`,20,'wren'],
  ['gorran','quill','a sack of pretty rocks',`For Professor Quill in Brindlecross. She says they're "just rocks." They are not just rocks. They're pretty rocks.`,`Oh, Gorran. These are just rocks. ...They are very pretty, though. Tell him thank you.`,15,'three'],
  ['tilly','bertram','a slice of Tilly’s pie',`If you're heading to Emberhollow, give this pie to my brother. Don't tell him it's from me. He'll know. He always knows.`,`Tilly's pie. She remembered I like the crust burnt. ...Don't tell her I cried.`,20,'wren']
];
for(const [from,to,what,ask,reply,coins,min] of ERRANDS){
  const ik='parcel_'+from+'_'+to; ITEM_NAMES[ik]=what.replace(/^(a|an) /,'').replace(/^./,c=>c.toUpperCase());
  QDEFS['err_'+from+'_'+to]={title:`Errand: ${what}`,giver:from,min,errand:true,give:{[ik]:1},offer:[[from,ask]],
    steps:[{t:'talk',npc:to,text:`Bring ${what} to @${to}`,take:{[ik]:1},lines:[[to,reply]],reward:{coins,xp:30,fn:from==='quill'?'quillchart':null}}]};
}
// ---------- the Wardens' Account
const PAGES={
  p1:{title:'Of the First Flame',text:[`Before the Wardens, before the lanterns, there was Vorlaxis. He woke in the heart of the mountain when the world was still warm from being made, and he decided the whole valley was his.`,S(`Nothing grew under his smoke. People hid in caves and ate their suppers cold, because a cooking fire made him curious.`,`Nothing grew. People hid in caves and ate cold food.`)]},
  p2:{title:'Of the Five',text:[`Iska, who made lanterns. Bram, who carried the biggest hammer and the loudest voice. Oriel, who could talk to drakes. Sedge, who was never once dry. Tove, who was never once warm.`,`Five ordinary people who decided that "nobody else is going to do it" was a good enough reason.`]},
  p3:{title:'Of Ember',text:[`Vorlaxis had a daughter. Her name was Ember. She had his horns and his fire, and her mother's laugh.`,`She loved the valley more than she feared her father. One night she walked down the mountain and knocked on Iska's door and said, "I want to help."`]},
  p4:{title:'Of the Splitting',text:[`A dragon made of fire cannot be killed. But fire can be shared. At Midsummer, on the shortest night, when the dark is smallest, the Five and Ember split the First Flame in two.`,`Half stayed with Vorlaxis, who fell into a deep sleep. Half went into Ember. It hurt. She laughed anyway. Then she gave it to her children, and they gave it to theirs.`]},
  p5:{title:'Of the Wards',text:[`Five Ward-fires, one for each Warden, burning in five corners of the valley. Each was lit with Ember's flame, and each needs an Emberblood's fire to light it again if it goes out.`,`The Wardens tied their own spirits to the Wards, so that someone would always be watching. We are very bad at sleeping anyway.`]},
  p6:{title:'Of the Thousand Years',text:[`No binding lasts forever. Ours will hold for a thousand years. We hope that by then his anger will have burned low. A fire with nothing to feed it grows smaller every year.`,`When the thousand years end, the chains will fall. If the Wards are burning, he will wake weak. If they are dark, he will wake strong, and he will want back the half of himself that Ember carried.`]},
  p7:{title:'Of the Gate',text:[`Iska's knight, Sir Cindervane, swore to hold the Obsidian Gate so that no servant of the dragon could climb the mountain and wake him early.`,`He said he would stand there until an Emberblood came who could finish what we started. He is very stubborn. We chose him for that.`]},
  p8:{title:'Of the Oath',text:[`Not everyone was glad to see the dragon sleep. Some of his old servants made a promise to each other: that one day they would wake him, and he would make them kings.`,`They called themselves the Scaled Oath. Dragons, for the record, have never made anyone a king. Dragons don't share.`]},
  p9:{title:'A Letter from Ember',text:[`Father. Every year on the shortest night I will light a lantern on the hill, so that you can see it from your sleep and know where home is.`,`Maybe one day you will want to come back. Not as a king. Just as my father. I will keep the lantern lit. Your Ember.`]},
  p10:{title:'The Last Page',text:[`If you are reading this, the thousand years are nearly done. We could only write the beginning of this story.`,`Whoever you are, Emberblood: the ending is yours to write. Be brave. Be kind. Those are not always the same thing. Try for both. Iska.`]}
};
const PAGE_SPOTS={p2:'shellby',p3:'h_yara',p7:'st_iska',p9:'h_ash'};
