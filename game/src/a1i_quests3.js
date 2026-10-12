// ================= dungeon quests: Ember's Trials (from Elder Yara) and one small quest inside each Trial
SPK.ember={name:'Ember',col:'#ffcf8a'};
Object.assign(ITEM_NAMES,{marlo_hat:'Marlo’s lucky hat',tide_pearl:'Glow pearl',sky_feather:'Storm feather'});
Object.assign(QDEFS,{
  trials:{title:'Ember’s Trials',giver:'yara',min:'lore',
    offer:[['yara',`Ash. Sit with me a moment. I have been counting again.`],
      ['yara',`When I was a girl, my grandmother told me about three doors in the valley. Ember built them a thousand years ago, so her children could wake their dragon gifts.`],
      ['yara',`The Trial of the Leap, deep in Whisperwood. The Trial of the Tide, on the little island in Lake Mirrow. And the Trial of the Sky, up on a crag in the Drakeling Crags.`],
      ['yara',`Nobody has opened them since Ember. Nobody had the fire. You do.`],
      ['ash',`What's inside?`],
      ['yara',`Gifts, I hope. And probably something with teeth. Start with the Leap. It is the closest, and the least wet.`]],
    steps:[
      {t:'flag',flag:'trial_leap_boss',text:'Pass the Trial of the Leap, deep in Whisperwood east of the war camp road',at:'cave:leap'},
      {t:'flag',flag:'trial_tide_boss',text:'Pass the Trial of the Tide on the island in Lake Mirrow. Jump the broken pier past the Brindlecross dock. (It wakes once the Hollow Ward burns again.)',at:'cave:tide'},
      {t:'flag',flag:'trial_sky_boss',text:'Pass the Trial of the Sky on the crag in the Drakeling Crags. Stride across the moat. (It wakes once Sister Wren sends you to the Ash Ward.)',at:'cave:sky'},
      {t:'talk',npc:'yara',text:'Tell Elder Yara you passed all three of Ember’s Trials',
        lines:[['yara',`All three? ALL three? The Leap, the Tide AND the Sky?`],
          ['ash',`I can jump. And walk on water. And fly. A bit. Mostly into bushes.`],
          ['yara',`Ember would be so proud. I am so proud. I am going to count to a thousand just to calm down.`],
          ['yara',`My grandmother left a gift for whoever came back from the Trials. I never thought I would be the one to give it away. Here.`]],
        reward:{coins:150,xp:400,bless:1,maxhp:10}}
    ]},
  marlo:{title:'Marlo the Magnificent',giver:'marlo',min:'lore',
    offer:[['marlo',`Halt! Who goes there? Oh. A dragon. Hi. I am Marlo the Magnificent. Treasure hunter, adventurer, and future owner of everything in this Trial.`],
      ['ash',`Are you stuck on that little platform?`],
      ['marlo',`Stuck? No. I am waiting. Strategically. For about two days.`],
      ['marlo',`A gust took my lucky hat. It blew off east, over all the pits. A treasure hunter without a hat is just a person standing in a hole.`]],
    steps:[
      {t:'item',item:'marlo_hat',n:1,text:'Find Marlo’s lucky hat. It blew east over the pits of the Trial of the Leap',at:'cave:leap'},
      {t:'talk',npc:'marlo',text:'Bring Marlo the Magnificent his lucky hat',take:{marlo_hat:1},
        lines:[['marlo',`MY HAT! You found my hat! I take back everything I said about dragons.`],['ash',`You didn't say anything about dragons.`],['marlo',`I was thinking it. Very loudly.`],['marlo',`Here, I found this in a hole. Treasure hunters always share. Sometimes. Today.`],['narr',`Marlo puts on the hat, takes a magnificent run-up, and jumps. He lands on the far side of the pit. He looks as surprised as you are.`]],
        reward:{coins:45,xp:90}}
    ]},
  minnow:{title:'Minnow’s Glow Pearls',giver:'minnow',min:'lore',
    offer:[['minnow',`Oh! Hi! Are you a dragon? Dad said there might be dragons out here. He said it like a joke. He is going to be SO surprised.`],
      ['minnow',`I'm Minnow Fisk. I rowed out to find the singing fish. Then my boat drifted away. So now I live here, I guess.`],
      ['minnow',`While I wait, I'm collecting glow pearls. There are three in this Trial, and so far I have found zero. The water is way too deep for me. Could you look?`]],
    steps:[
      {t:'item',item:'tide_pearl',n:3,text:'Find 3 glow pearls in the deep water of the Trial of the Tide',at:'cave:tide'},
      {t:'talk',npc:'minnow',text:'Bring the glow pearls to Minnow',take:{tide_pearl:3},
        lines:[['minnow',`Three! They're SO glowy. I'm going to make Dad a necklace. He'll pretend to hate it. He'll wear it every day.`],['minnow',`Here. This was in my boat before it floated off. A spare flask. Dad says always carry a spare. Dad says a lot of things.`],['narr',`Minnow spots her rowboat bumping against the island outside, squeals, and runs off to get it.`]],
        reward:{potmax:1,coins:30,xp:100}}
    ]},
  puff:{title:'A Very Small Dragon',min:'lore',
    steps:[
      {t:'flag',flag:'puff_found',text:'Find whoever is peeping in the Trial of the Sky'},
      {t:'flag',flag:'puff_home',text:'Carry Puff to the nest by the great door in the Trial of the Sky',at:'cave:sky',reward:{coins:60,xp:120}}
    ]}
});
