// ================= dungeon quests: Ember's Trials (from Elder Yara) and one small quest inside each Trial
SPK.ember={name:'Ember',col:'#ffcf8a'};
Object.assign(ITEM_NAMES,{marlo_hat:'Marlo’s lucky hat',tide_pearl:'Glow pearl',sky_feather:'Storm feather'});
Object.assign(QDEFS,{
  trials:{title:'Ember’s Doors',giver:'yara',min:'lore',
    offer:[['yara',S(`Ash. Sit with me a moment. There's something I should have told you years ago.`,`Ash, sit with me. I have something to tell you.`)],
      ['yara',S(`When I was a girl, my grandmother told me Ember built a door for her children, deep in Whisperwood. A stone arch the roots are eating.`,`My grandmother said Ember built a door in Whisperwood.`)],
      ['yara',S(`Nobody has ever got it open. I always wondered what it was waiting for.`,`Nobody ever opened it. I wonder what it waits for.`)],
      ['ash',`What's inside?`],
      ['yara',S(`I don't know. Something Ember wanted her children to have. And probably something with teeth.`,`Something for Ember's children. And maybe teeth.`)]],
    steps:[
      {t:'flag',flag:'trial_leap_boss',text:S('Open the old arch in Whisperwood, east of the war camp road','Open the old arch in Whisperwood'),at:'cave:leap'},
      {t:'flag',flag:'trial_tide_boss',text:'Pass the Trial of the Tide on the island in Lake Mirrow. Jump the broken pier past the Brindlecross dock. (It wakes once the Hollow Ward burns again.)',at:'cave:tide'},
      {t:'flag',flag:'trial_sky_boss',text:'Pass the Trial of the Sky on the crag in the Drakeling Crags. Stride across the moat. (It wakes once Sister Wren sends you to the Ash Ward.)',at:'cave:sky'},
      {t:'talk',npc:'yara',text:'Tell Elder Yara you passed all three of Ember’s Trials',
        lines:[['yara',`All three? ALL three? The Leap, the Tide AND the Sky?`],
          ['ash',`I can jump. And walk on water. And fly. A bit. Mostly into bushes.`],
          ['yara',S(`Ember would have liked you, Ash. Give me a moment. Pebble, stop looking at me.`,`Ember would have liked you, Ash. Give me a moment.`)],
          ['yara',`My grandmother left a gift for whoever came back from the Trials. I never thought I would be the one to give it away. Here.`]],
        reward:{coins:150,xp:400,bless:1,maxhp:10}}
    ]},
  marlo:{title:S('Marlo’s Hat Trick','Marlo’s Lucky Hat'),giver:'marlo',min:'lore',
    offer:[['marlo',`Halt! Who goes there? Oh. A dragon. Hi. I am Marlo the Magnificent. Treasure hunter, adventurer, and future owner of everything in this Trial.`],
      ['ash',`Are you stuck on that little platform?`],
      ['marlo',`Stuck? No. I am waiting. Strategically. For about two days.`],
      ['marlo',`A gust took my lucky hat. It blew off east, over all the pits. A treasure hunter without a hat is just a person standing in a hole.`]],
    steps:[
      {t:'item',item:'marlo_hat',n:1,text:'Find Marlo’s lucky hat. It blew east over the pits of the Trial of the Leap',at:'cave:leap'},
      {t:'talk',npc:'marlo',text:'Bring Marlo the Magnificent his lucky hat',take:{marlo_hat:1},
        lines:[['marlo',`MY HAT! You found my hat! I take back everything I said about dragons.`],['ash',`You didn't say anything about dragons.`],['marlo',`I was thinking it. Very loudly.`],['marlo',S(`Here, I found this in a hole. Treasure hunters always share. On special occasions.`,`Here, I found this in a hole. You can have it.`)],['narr',`Marlo puts on the hat, takes a magnificent run-up, and jumps. He lands on the far side of the pit. He looks as surprised as you are.`]],
        reward:{coins:45,xp:90}}
    ]},
  minnow:{title:'Minnow’s Glow Pearls',giver:'minnow',min:'lore',
    offer:[['minnow',S(`Oh! Hi! You're Maren's boy, from Emberhollow! The one with the horns! Dad buys his fish hooks from your mom.`,`Hi! You're Maren's boy! Dad buys hooks from your mom.`)],
      ['minnow',S(`I'm Minnow. Dell's girl, from the dock. I rowed out to find the singing fish and my boat drifted off. So now I live here, I guess.`,`I'm Minnow. My boat drifted away. Now I live here.`)],
      ['minnow',`While I wait, I'm collecting glow pearls. There are three in this Trial, and so far I have found zero. The water is way too deep for me. Could you look?`]],
    steps:[
      {t:'item',item:'tide_pearl',n:3,text:'Find 3 glow pearls in the deep water of the Trial of the Tide',at:'cave:tide'},
      {t:'talk',npc:'minnow',text:'Bring the glow pearls to Minnow',take:{tide_pearl:3},
        lines:[['minnow',`Three! They're SO glowy. I'm going to make Dad a necklace. He'll pretend to hate it. He'll wear it every day.`],['minnow',S(`Here. This was in my boat before it floated off. A spare flask. Dad says always carry a spare. He never does.`,`Here is a spare flask. Dad says carry a spare.`)],['narr',S(`Minnow spots her rowboat bumping against the island outside, squeals, and runs off to get it. It had been waiting for her the whole time, like a very patient dog.`,`Minnow sees her boat outside. She runs to get it!`)]],
        reward:{potmax:1,coins:30,xp:100}}
    ]},
  puff:{title:'A Very Small Dragon',min:'lore',
    steps:[
      {t:'flag',flag:'puff_found',text:'Find whoever is peeping in the Trial of the Sky'},
      {t:'flag',flag:'puff_home',text:'Carry Puff to the nest by the great door in the Trial of the Sky',at:'cave:sky',reward:{coins:60,xp:120}}
    ]}
});
