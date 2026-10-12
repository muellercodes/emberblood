
// ================= story script
const STORY={
  prologue:[
    ['narr',`A thousand years ago, the dragon Vorlaxis, the First Flame, ruled the valley of Embermere. Nothing grew. Nothing was cozy. It was a terrible time for picnics.`],
    ['narr',`Five Wardens rose against him. They chained him beneath Cinder Mountain and lit five Ward-fires across the valley to keep him asleep.`],
    ['narr',`A Ward-fire needs a flame that never truly goes out. The Wardens found one in a family that carried a spark of the dragon's own blood. They called themselves the Emberbloods.`],
    ['narr',`A thousand years later, most Emberbloods had nothing to show for it but warm hands and a talent for campfires. Then Ash was born, with horns, a tail, and real fire.`],
    ['maren',`Ash! Up and at it! It's Lantern Day, and Emberhollow's official lantern-lighter is still snoring.`],
    ['ash',`Official lantern-lighter. Also official chimney sweep. Also, one time, official bakery remover.`],
    ['maren',`We agreed never to speak of the bakery. Come by the forge before the festival. I finished something for you.`]
  ],
  forge:[
    ['maren',`There you are. Hold out your claws.`],
    ['maren',`This was your grandmother's sword, and her grandmother's before that. I spent all week reforging it.`],
    ['ash',`It's beautiful. Is it fireproof?`],
    ['maren',`It is now. The three festival lanterns are on the green. Give each one a gentle breath. Gentle, Ash.`]
  ],
  lanternsDone:[
    ['yara',`Beautiful work, Ash. A thousand Lantern Days, and they never looked so bright.`],
    ['ash',`And not a single bakery was harmed.`],
    ['narr',`Then the warning horn sounded from the north road.`],
    ['yara',`Kobolds! In the village! Ash, drive them out!`]
  ],
  lore:[
    ['yara',`You fought like a dragon out there. I suppose that's no surprise.`],
    ['yara',`Sit down, Ash. It's time you heard the whole story. The real one, not the festival version with the puppet show.`],
    ['yara',`The dragon in the old tales, Vorlaxis, isn't just any dragon. He's your ancestor. Your ${GREATS}grandfather.`],
    ['ash',`...You just said "great" thirteen times.`],
    ['yara',`I counted on my fingers. Twice. The point is, your family's fire is his fire. That's why only an Emberblood can keep the Wards burning.`],
    ['yara',`The Hollow Ward under the old oak here in the village went dark the night the kobolds came. That was no accident.`],
    ['ash',`So I relight it?`],
    ['yara',`You relight it. Breathe on the ward stone and don't stop until it catches. Then we'll find out who sent those kobolds.`]
  ],
  ward_hollow:[
    ['iska',`Ah. Warm again. Thank you, little ember.`],
    ['ash',`Did the rock just talk?`],
    ['iska',`I am Iska, first of the Five Wardens. Or what's left of her. We tied our spirits to the Ward-fires so someone would always be watching.`],
    ['iska',`A cult called the Scaled Oath has been snuffing the Wards one by one. They want Vorlaxis awake. And they want you, because your fire can light a Ward, or break the last of his chains.`],
    ['iska',`Their kobolds answer to a chieftain named Grizzlefang. His war camp is in the woods north of the village. Start there.`]
  ],
  wren:[
    ['wren',`Ash Emberblood? Wonderful. Yara's bird said you'd come. Mind the books, they bite. Not literally. Mostly.`],
    ['wren',`Five Wards hold the chains. Hollow, which you relit. The Ash Ward on the old Ashen Road. The Crag Ward up with the drakelings. The Sunken Ward in the Mirefen. And the Frost Ward in the Frostpine Highlands.`],
    ['wren',`The Scaled Oath holds the Ash Ward now. Their High Priest, Morrow, is trying to put it out for good. That's your next stop.`],
    ['ash',`And when all five are burning again?`],
    ['wren',`Then the Obsidian Gate will open for the one who carries their fire, and you can walk up the mountain and have a very serious talk with your grandfather.`],
    ['ash',`Great. Great-great. Great-great-great...`],
    ['wren',`Please don't. Yara warned me about that.`]
  ],
  ward_ash:[
    ['bram',`Hah! Fire in the old stones again! Bram's the name. I was the Warden with the big hammer and the bigger mouth.`],
    ['bram',`Three Wards left, kid. Crag, Mire and Frost. Take them in whatever order you like. Just don't take them lightly.`]
  ],
  ward_crag:[
    ['oriel',`Welcome, Emberblood. I am Oriel. I watched over these crags, and the dragons who nest in them.`],
    ['oriel',`Not every dragon is your enemy. Look.`],
    ['narr',`One last egg cracks open. A tiny drakeling tumbles out, sneezes a spark, and decides you are its mother.`],
    ['ash',`Oh no. Oh no, it's adorable. I'm calling you Pip.`],
    ['pip',`Mip!`]
  ],
  ward_mire:[
    ['sedge',`Oh! Oh, hello. Sorry, I've been sitting in a swamp for a thousand years. I'm Sedge. Warden of the Mire. And of mud, mostly.`],
    ['sedge',`Thank you, Ash. If you pass Granny Moss's hut, say hello. She makes very good tea. Bring your own cup.`]
  ],
  ward_frost:[
    ['tove',`Brr. Finally. I'm Tove. I had the coldest post of all five Wardens, and I would like that noted.`],
    ['tove',`Greymane was a good wolf before the Oath poisoned him with dragon smoke. You set him free. Thank you.`]
  ],
  allWards:[
    ['iska',`All five Wards burn again, Ash. Can you feel it?`],
    ['ash',`My hands are warm. Warmer than usual.`],
    ['iska',`That's our fire, the Five Flames, riding along with yours. The Obsidian Gate will open for it. But the gate has a guard, and he has never once let anyone pass.`]
  ],
  bosses:{
    grizzlefang:{
      intro:[['griz',`Hah! A little lizard-person with a big sword. The Oath wants you brought to the mountain. I'll bring you in pieces!`],['ash',`You can try.`]],
      outro:[
        ['griz',`The Oath... will find you... hatchling...`],
        ['voice',`Little ember. I can smell my own blood on you. Come to the mountain, child. Let me see what my bloodline has become.`],
        ['ash',`Okay. That is extremely creepy.`],
        ['yara',`(through the shrine stone) That was him, Ash. Go east to Brindlecross, the market town on Lake Mirrow. Sister Wren keeps the old library there. If anyone knows where the other Wards are, it's her.`]
      ]},
    morrow:{
      intro:[['morrow',`The heir of the First Flame, walking right into our hands. The Great One will reward me for this.`],['ash',`Pretty sure the Great One just wants a snack.`]],
      outro:[['morrow',`You don't understand... he doesn't forgive... he devours...`],['voice',`Morrow served me well. You will serve me better. Keep climbing, little ember.`]]},
    broodmother:{
      intro:[['brood',`Ssssso. The little ember crawls into my nest. My children are hungry.`],['ash',`Your children need better manners.`]],
      outro:[['brood',`My children... will remember you...`],['voice',`You strike down your own kin so easily. Perhaps you really are mine.`],['ash',`I'm nothing like you.`]]},
    gloamjaw:{
      intro:[['gloam',`Mmmmm. A warm little ember, wandering into my bog. You will taste like toast.`],['ash',`Why does everybody want to eat me?`]],
      outro:[['gloam',`Too... spicy...`],['voice',`The Mire was always weak. No matter. The mountain is patient.`]]},
    greymane:{
      intro:[['narr',`Out of the snow steps the biggest wolf you have ever seen. Its eyes glow the same orange as the mountain.`],['ash',`Good doggy? Very good, very large doggy?`]],
      outro:[['narr',`The great wolf lies down in the snow. The orange fades from its eyes, and for a moment it looks almost grateful.`]]},
    cindervane:{
      intro:[['cinder',`Halt, heir of the First Flame. None pass the Obsidian Gate while I still stand.`],['ash',`Then I guess you'll have to sit down.`]],
      outro:[
        ['cinder',`At last... my watch... is over. I was sworn to the Wardens, child. They asked me to hold this gate until an Emberblood came who could end this. Go. Finish it.`],
        ['voice',`Come up, little ember. Your grandfather is waiting.`]
      ]},
    vorlaxis:{
      intro:[
        ['vor',`So. You are what my blood became. Small. Soft. Barely a spark.`],
        ['ash',`Hi, Grandpa. Great-great-great-great... you know what, I'm not saying all of it.`],
        ['vor',`For a thousand years your family fed my prison with my own fire. Today I take it back.`],
        ['ash',`It was never yours to keep. It's ours. Mom's, and Yara's, and the whole valley's.`],
        ['vor',`Then come and take it from me, hatchling.`]
      ],
      outro:[
        ['vor',`Impossible... the fire... it chose you...`],
        ['ash',`It's not your fire anymore, Grandpa. It's ours.`],
        ['narr',`With the First Flame quiet at last, the Five Wardens could finally rest. Their Ward-fires burned on, gentle and warm, needing nothing but a little care.`],
        ['narr',`Emberhollow held the biggest Lantern Day in a thousand years. Maren made a speech. Yara counted the lanterns twice. Pip set fire to only one tablecloth.`],
        ['narr',`And the last of the Emberblood line never, ever had to say "great" thirteen times again.`]
      ]}
  },
  moss:{
    start:[['moss',`Well, look at you, all warm and scaly. Sit, sit. My knees can't manage the bog these days, and I'm out of moonlilies for my healing brew.`],['moss',`Fetch me five? They glow pale blue at the edges of the pools. Mind the thing that lives in the deep water.`]],
    wait:[['moss',`Five moonlilies, dear. They glow. You can't miss them, unless you do.`]],
    done:[['moss',`Five! Perfect. Here, a new flask for your belt. It holds one more healing draught. Don't drink it all at once.`],['ash',`Thank you, Granny Moss.`],['moss',`And take a biscuit. You're too skinny for a dragon.`]],
    after:[['moss',`Tea's on if you want it. Mind your tail near the cauldron.`]]
  },
  hollis:{
    start:[['hollis',`Have you seen a goat? About this tall, opinions about everything, answers to Duchess? She wandered off toward the high snow, and the wolves are out.`],['ash',`I'll find her.`]],
    wait:[['hollis',`Duchess likes high places and bad decisions. Try north of here, past the wolf dens.`]],
    done:[['hollis',`Duchess! You terrible, wonderful goat. Thank you, Ash. Here, my grandfather swore by this charm. Maybe it'll help you more than it helped him.`],['goat',`Meh.`],['ash',`Rude.`]],
    after:[['hollis',`Duchess says hello. Well. She says "meh," but she means hello.`]]
  },
  duchess:[['goat',`Meh.`],['ash',`Your farmer misses you. Come on, before the wolves notice us.`],['goat',`Meeeh.`]],
  maren:{
    hint:[['maren',`Find me some star-iron and I can make that blade sing. It fell from the sky long ago and glows blue in the rock. Try the crags, the high snow, and the hills by the Obsidian Gate.`]],
    reforge:[['maren',`Star-iron! Where did you... never mind. Give it here.`],['maren',`There. Your blade's a little sharper and a lot shinier. Go make me proud. And eat something.`]],
    idle:[['maren',`I'm proud of you, Ash. Now go save the world and be home for supper.`],['maren',`If you see Yara, tell her the lanterns were my idea.`]]
  },
  yaraHints:{
    warcamp:`Grizzlefang's camp is north of the village, at the edge of the woods. Follow the road.`,
    wren:`Brindlecross is east along the road, on the shore of Lake Mirrow. Sister Wren will help you.`,
    oath:`The Shrine of the Scaled Oath is northeast of Brindlecross on the Ashen Road. Watch their fire bolts.`,
    three:`Three Wards left: the Crag Ward in the far east, the Sunken Ward in the Mirefen to the southeast, and the Frost Ward up in the Frostpine Highlands to the northwest.`,
    gate:`The Obsidian Gate is due north of Brindlecross, at the end of the long road. Be brave.`,
    summit:`The summit is beyond the gate, past the lava. Come home safe, Ash.`,
    done:`You did it. The whole valley is breathing easier. Go wherever you like now.`
  }
};
