// game/story/act3/f_maze.js (A3a): Act III, Chapter 2, "The Dying Hearth" (second part: the Glacier Maze).
// What the player does: finds the way round Hearthold's frozen North Gate (out of the West Gate, over the Whitewater,
// up the river onto the ice; Captain Brann knows), walks on the open water round the maze's door, and goes through the
// Glacier Maze (the dungeon stays code, x2_dun_a.js). Inside, Ember's shrine says she built the forge "with my auntie.
// She did the cold parts." (a clue for the act's last question: who is the Snow Mother?), Ember's Ice Diary names her
// Auntie Glee, and Old Bellows remembers "Ember and the Cold One" (bonus clues). Blaze Breath is Ember's gift.
// The dungeon's own lines below are old STORY keys: x2_dun_a plays them by key, and the engine puts this text into
// the same arrays (f_maze_how and f_maze_bossline are one-line tips, still x2_story's).
// Old flags kept: trial_f_maze_done (the dungeon's altar), f_icediary; the stage moves on to f_kindle.
chapter({
  id: 'f_maze', act: 3, after: 'f_hearth', next: 'f_kindle', takeover: true,
  card: null, name: ['The Dying Hearth', 'The Dying Hearth'],
  so_far: [
    "Blaze, the blue fire, waits in Ember's old North Forge, deep in the Glacier Maze where the glacier meets the frozen Glimmerfrost. The North Gate is frozen, so Ash goes round by the river.",
    'Blaze is in the Glacier Maze, across the frozen lake.'],
  mom: [["A maze made of ice? Don't lick the walls.", "An ice maze? Don't lick the walls."]],

  item: {
    f_icediary: { name: ["Ember's Ice Diary", "Ember's Ice Diary"],
      desc: ['A little book with a snowflake on the cover. "Auntie took me sledding today. She makes the hill and I make the cocoa."',
        'A little book with a snowflake. Ember went sledding with her auntie.'],
      icon: 'book', keepsake: true },
  },

  clue: {
    // (A3b's snow_mother: f3_cold_parts is one of its needs; f3_ice_diary and f3_bellows_cold are bonus clues)
    f3_cold_parts: { icon: 'fire', mystery: 'long_winter',
      text: ['Ember built the North Forge with her auntie. "She did the cold parts. I did the hot parts."',
        'Ember built the forge with her auntie. Auntie did the cold parts.'] },
    f3_ice_diary: { icon: 'book', mystery: 'long_winter',
      text: ["Ember's Ice Diary: her auntie made the sledding hills and laughed like wind chimes. Ember called her Auntie Glee.",
        "Ember's diary: her auntie made snow hills. Auntie Glee."] },
    f3_bellows_cold: { icon: 'gear', mystery: 'long_winter',
      text: ['Old Bellows: "Ember and the Cold One made Bellows."', 'Bellows was made by Ember and the Cold One.'] },
  },

  step: [
    { id: 'shore', do: 'goto f_glacier 490', scene: 'f_moat',
      obj: ['Go round the frozen North Gate to the Glacier Maze', 'Go to the Glacier Maze'],
      hint: ["The North Gate is frozen shut. Go out by the West Gate, cross the Whitewater, and follow the river up onto the ice. The Captain knows the way.",
        'Go out the West Gate. Follow the river to the ice.'] },
    { id: 'maze', do: 'dungeon f_maze', at: 'f_maze_door', then: ['clue f3_cold_parts', 'mail f_pb_2', 'stage f_kindle'],
      obj: ['Find the blue fire in the Glacier Maze', 'Find the blue fire in the Glacier Maze'],
      hint: ['Walk on the open water round the door. Inside, find Ember\'s old forge.', 'Walk on the water to the door. Find the forge.'] },
  ],

  scene: {
    // on the shore, before the open water round the door (x2_world's moat ring is open water out to r 380)
    f_moat: [
      ['tove', 'Open water all around the door. Good thing you can walk on water. You CAN walk on water? Please say you can.',
        'Water all around the door. You CAN walk on water? Please say yes.', { ref: 'f_maze_door' }],
      ['ash', "I can walk on water, run on water, and skip on water. I can't swim, though.", "I can walk on water and skip on water. I can't swim, though."],
      ['tove', "Let's not find out today."],
    ],
    // ---- the dungeon's lines (old STORY keys, played by x2_dun_a)
    f_maze_in: [
      ['tove', "Oh, it's beautiful. Oh, it's FREEZING. Oh, both.", "Oh, it's pretty. Oh, it's FREEZING."],
      ['tove', 'Mind the ice, Ash. Ice is just floor that wants you to fall over.', 'Mind the ice. Ice is floor that wants you to fall.'],
    ],
    f_maze_hjalmar_cold: [
      ['narr', 'A frozen explorer stands in the ice, caught in the middle of a sneeze. Your breath only makes the ice sweat a little.',
        'A frozen explorer, mid-sneeze. Your fire only makes the ice drip.'],
    ],
    f_maze_hjalmar: [
      ['f_hjalmar', '...ACHOO! Oh. Excuse me. How long was I mid-sneeze?', 'ACHOO! Oh. Excuse me. How long was I sneezing?'],
      ['ash', 'About a month.'],
      ['f_hjalmar', 'Longest sneeze in history. Here, for your trouble. And bless me.', 'The longest sneeze ever! Here, take this. Bless me.'],
    ],
    f_maze_pantry: [
      ['tove', 'A whole mammoth steak, frozen in a block. Somebody was saving that for a very big supper.', 'A frozen mammoth steak! Somebody saved it for supper.'],
    ],
    // the Sculpture Gallery's chest (the dungeon gives a blessing after it)
    f_maze_diary: [
      ['narr', "Inside the chest, wrapped in oilcloth, is a little book with a snowflake on the cover. Ember's Ice Diary.",
        "In the chest is a little book with a snowflake on it. Ember's Ice Diary.", { do: ['give f_icediary', 'set f_icediary'], ref: 'f_maze_door' }],
      ['narr', '"Auntie took me sledding today. She makes the hill and I make the cocoa. She laughs like wind chimes. I call her Auntie Glee. She pretends to hate it."',
        '"Auntie took me sledding. She makes the hill. I make the cocoa. I call her Auntie Glee."', { clue: 'f3_ice_diary' }],
      ['ash', 'Auntie Glee. Ember had an auntie who laughed like wind chimes.', 'Auntie Glee. Ember had an auntie!'],
    ],
    // Ember's shrine before her gift (a clue for the Snow Mother question)
    f_maze_shrine: [
      ['ember', 'Oh! A visitor. In the cold! Hello, little ember.', 'Oh! A visitor in the cold! Hello, little ember.'],
      ['ash', 'Grandma Ember! I mean, just Ember.'],
      ['ember', 'You remembered! I built this forge a long, long time ago, with my auntie. She did the cold parts. I did the hot parts. We were a very good team.',
        'I built this forge with my auntie. She did the cold parts. I did the hot parts.', { clue: 'f3_cold_parts' }],
      ['ash', "Your AUNTIE? Wait, then she's my great great great...", "Your AUNTIE? Then she's my great great great..."],
      ['ember', "Don't. You'll be here all day."],
      ['ember', 'I left a little of my hottest fire here. The blue kind. For a day when the cold got too big. I think that day is today.',
        'I left my hottest fire here. The blue kind. For a day like today.'],
    ],
    f_maze_gift: [
      ['narr', 'The flame turns from gold to white to blue. It pours into you like hot cocoa on a snowy day.', 'The flame turns gold, then white, then blue. It pours into you like hot cocoa.'],
      ['ember', 'Blaze! Hold your fire breath a moment longer and it burns blue and reaches far. It melts ice walls, wakes frozen folk, and lights braziers even far away.',
        'Blaze! Hold your fire longer. It burns blue. It melts ice and wakes frozen folk.'],
      ['ash', "I'm going to melt EVERYTHING."],
      ['ember', 'Not everything. Leave the snowmen. Snowmen have feelings.', 'Not everything. Leave the snowmen. They have feelings.'],
    ],
    f_maze_sigrid: [
      ['f_sigrid', "Brrrr. Thank you, dragon! I've been stuck since the moth. I was looking for the furnace key.", 'Brrrr. Thank you, dragon! I was stuck since the moth came.', { ref: 'f_maze_door' }],
      ['f_sigrid', "Here, take my small key. It opens the shaft door. I'm going home to Hearthold for a very long bath.", 'Take my small key. It opens the shaft door. Bath time!',
        { ref: 'f_maze_door' }],
    ],
    f_maze_dam: [
      ['narr', 'The last ice wall gives way. A rumble. Then the whole lake of meltwater roars off and pours down a shaft in the floor, like the biggest bath ever emptied.',
        'The last ice wall melts. The water roars down a hole in the floor!'],
    ],
    f_blubberton_intro: [
      ['narr', 'A huge walrus in a dented helmet waddles out from behind an ice shield. He adjusts his monocle.', 'A huge walrus in a helmet waddles out. He fixes his monocle.'],
      ['f_blubberton', 'I say! Unhand my hall, you scaly scamp!', 'I say! Leave my hall, you scaly scamp!'],
      ['ash', "It's not your hall. It's Ember's forge."],
      ['f_blubberton', 'Possession is nine tenths of the law! Tally ho!', "I'm sitting in it, so it's mine! Tally ho!"],
    ],
    f_blubberton_won: [
      ['f_blubberton', 'Harrumph. Jolly good show, old bean. Here, the furnace key. I was only guarding it because nobody told me to stop.',
        "Harrumph. Jolly good show. Here's the furnace key. Nobody told me to stop guarding it.", { ref: 'f_maze_door' }],
      ['narr', 'Lord Blubberton waddles off to take a bath.'],
    ],
    f_bellows_intro: [
      ['narr', 'In the middle of the dead forge stands a golem as big as a cottage. Brass belly, anvil fists, a great leather bellows on his back. Plates of purple moth-frost cover his shoulders and arms.',
        'A golem as big as a cottage. Brass belly. Anvil fists. Purple frost armor.'],
      ['f_bellows', 'CLANK. Bellows... cold... Purple cold says: no fire.', 'CLANK. Bellows cold. Purple cold says: no fire.'],
      ['tove', "That's Old Bellows, Ember's forge keeper! The frost has got him. Melt it off!", "That's Old Bellows, Ember's forge keeper! Melt the frost off him!"],
    ],
    // right after the boss (6 lines)
    f_maze_won: [
      ['narr', 'The purple frost cracks off Old Bellows like an eggshell. Underneath he is warm brass and soot and rivets.', 'The purple frost cracks off. Underneath he is warm brass.'],
      ['f_bellows', '...Fff. Fwooosh. Warm? Little ember. You smell like the boss.', 'Fff. Fwooosh. Warm? You smell like the boss.'],
      ['ash', 'The boss? You mean Ember?'],
      ['f_bellows', 'Ember. And the Cold One. They made Bellows. Then the purple cold came, and Bellows forgot.',
        'Ember and the Cold One made Bellows. Then the purple cold came.', { clue: 'f3_bellows_cold' }],
      ['f_bellows', 'Bellows will light the forge again. Bellows will keep it warm until somebody needs it.', 'Bellows will light the forge again. And keep it warm.'],
      ['narr', "Old Bellows gives you a hug. It's like being hugged by a toasty oven that loves you.", 'Old Bellows hugs you. Like a warm oven that loves you.'],
    ],
    // by the warp ring at the end (Ember's voice; the player already worked out what the Hearth needs)
    f_maze_end: [
      ['ember', 'The forge is warm again. I can feel it, all the way from wherever I am.', 'The forge is warm again. I can feel it.'],
      ['ember', 'My auntie and I lit the Great Hearth together, a thousand years ago. It has been waiting for someone with the right fire.',
        'My auntie and I lit the Great Hearth long ago. It waits for the right fire.', { ref: 'f_lm_hearth' }],
      ['narr', 'Step into the warp ring to go back outside.', 'Step into the warp ring to go outside.'],
    ],
  },

  talk: {
    // the way round the frozen North Gate (the road north starts at the gate; the real way is by the river)
    f_brann: [
      { if: 'stage=f_maze !flag f_northgate choice f3_moth=moth', fact: 'f_lm_northgate=frozen', once: true,
        say: ["The Glacier Maze? Listen, moth. Dragon. Whatever you are. The North Gate's frozen. Go round: out the West Gate, over the Whitewater, then up the river onto the ice.",
          'Listen, moth. Dragon. The North Gate is frozen. Go round by the West Gate and the river.'] },
      { if: 'stage=f_maze !flag f_northgate', fact: 'f_lm_northgate=frozen',
        say: ["North Gate's frozen solid, Emberblood. Go round: out the West Gate, over the Whitewater, then follow the river up onto the ice. The Glacier Maze is where the ice meets the lake.",
          'The North Gate is frozen. Go round by the West Gate and the river.'] },
    ],
    f_brynja: [
      { if: 'stage=f_maze', say: ['The Glacier Maze, child. Mind you come back out. My old girl can wait. Just about.',
        'The Glacier Maze! Come back out. My old girl can wait.'] },
    ],
  },
})
