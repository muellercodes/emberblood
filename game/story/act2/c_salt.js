// game/story/act2/c_salt.js (A2a): Act II, "The Girl from Saltmarsh".
// What the player does: right after the rooftop chase the Bobs send Ash to the Turning Library, where Pearl's family
// tree rolls out of the door (clue: it ends with Oona Saltwhistle and her granddaughter Vesper). In Saltmarsh the
// player finds the moth-stamped gift lanterns in the windows, gets Chowder Charlie to sniff the Moth Mask's note
// (written in Saltmarsh), and fixes the Tide Clock (its cog was packed with far too much moth dust). Then the player
// works out who the Moth Mask is in the Case Book, and visits her cold gran, who says Vesper was home, shaking, the
// night the clocks stopped. Low tide opens the way to the Gullcrag Caves (c_claws).
chapter({
  id: 'c_salt', act: 2, after: 'c_gear', next: 'c_claws', takeover: true,
  card: ['Act II · Chapter 5', 'The Girl from Saltmarsh'],
  so_far: [
    "Ottoline's family tree of Mother Pearl ended with Oona Saltwhistle and her granddaughter Vesper. In Saltmarsh every window had a moth lantern, the Moth Mask's note smelled of Charlie's chowder, and Ash worked out who she was: Vesper Saltwhistle. He fixed the Tide Clock and met her gran, who is always cold.",
    "The Moth Mask is Vesper Saltwhistle. Ash met her cold gran."],
  hint: ['Ask at the Turning Library in the Upper Town. Then follow the Coast Road to Saltmarsh, where the Tide Clock is stuck.',
    'Ask at the library. Then go to Saltmarsh.'],
  mom: [['Saltmarsh? Wear your boots. And eat the chowder.', 'Wear your boots. Eat the chowder.']],
  silence: ['c_ottoline', 'c_mina', 'c_lowtide'],

  item: {
    c_note1: { name: ["The Moth Mask's note", "The Moth Mask's note"],
      desc: ['"Go home, little ember. This isn\'t your story. M." It smells funny. Fishy, even.', 'A note from the Moth Mask. It smells fishy.'],
      icon: 'note', keepsake: true },
  },

  place: {
    // the gift lanterns: one to look at closely, two more in other windows (the clue says every window has one)
    sm_gift_lantern: { map: 1, at: [1745, 26582], r: 16, kind: 'examine', look: 'a2a_gift_lantern', name: 'a little moth lantern in a window',
      aliases: ['the gift lantern', 'the moth lantern'] },
    sm_lantern_b: { map: 1, at: [1632, 26748], kind: 'prop', look: 'a2a_gift_lantern', name: 'a moth lantern in a window' },
    sm_lantern_c: { map: 1, at: [2135, 26196], kind: 'prop', look: 'a2a_gift_lantern', name: 'a moth lantern in a window' },
    sm_lantern_d: { map: 1, at: [2595, 26942], kind: 'prop', look: 'a2a_gift_lantern', name: 'a moth lantern in a window' },
  },

  clue: {
    s_family: { icon: 'scroll',
      text: ['Pearl\'s family tree ends with "Oona Saltwhistle, of Saltmarsh, and her granddaughter Vesper." Pearl could climb anything.',
        'Pearl\'s family ends with Oona and Vesper Saltwhistle.'] },
    s_gifts: { icon: 'lantern',
      text: ['Every window in Saltmarsh has a new tin lantern, stamped with a moth and signed "M."',
        'Saltmarsh lanterns have a moth on them. They say "M."'] },
    s_note_salt: { icon: 'note',
      text: ["Chowder Charlie sniffed the Moth Mask's note: salt, cod, kelp smoke and his own chowder. It was written in Saltmarsh.",
        'The note smells of Saltmarsh chowder.'] },
    s_baron_rumor: { icon: 'news', herring: true,
      text: ['Lord Whirligig is sure the Moth Mask is Baron Cogsworth, his jealous rival. The Baron climbs stairs. Slowly.',
        'Lord Whirligig blames a rival baron.'] },
    s_tide_dust: { icon: 'kelp', mystery: 'what_stopped',
      text: ["The Tide Clock's cog was packed with kelp and far too much moth dust. More than one girl could carry.",
        'The Tide Clock was full of moth dust. Too much!'] },
    s_fishstep: { icon: 'fish',
      text: ["Before dawn, from the Chowder Pot's window: a cloaked figure left a fish on the step of the crooked house at the end of the longest boardwalk, and ran off over the roofs.",
        'A cloaked girl left a fish at the crooked house.'] },
    s_alibi: { icon: 'fish', mystery: 'what_stopped',
      text: ['Granny Oona says Vesper came home just before midnight, the night the clocks stopped. She was shaking.',
        'Gran says Vesper was home that night, shaking.'] },
  },

  deduce: {
    who_is_she: {
      mystery: 'moth_mask',
      ask: ['Who is the Moth Mask?', 'Who is the Moth Mask?'],
      needs: ['s_note_salt', 's_gifts', 's_family'],
      bonus: ['s_fishstep', 'q_lookout', 'q_dishwasher', 'q_box_initials'],
      pick: [
        { t: ["A Saltmarsh girl from Pearl's family: Vesper Saltwhistle", 'Vesper Saltwhistle, from Saltmarsh'], right: true },
        { t: ['A clock baron, robbing his rivals', 'A rich clock baron'],
          hint: ['Barons keep what they steal. Her gifts turn up in Saltmarsh windows.', 'Barons keep things. Her gifts go to Saltmarsh.'] },
        { t: ['Penny Press', 'Penny Press'],
          hint: ["Penny is first at every robbery because that's her job. Is Penny on Pearl's family tree?", "Is Penny on Pearl's family tree?"] },
      ],
      then: ['set c_vesper_named'],
    },
  },

  step: [
    { id: 'open', do: 'cutscene slt_open', then: ['give c_note1'],
      obj: ['Catch your breath after the chase', 'Catch your breath'] },
    { id: 'ottoline', do: 'talk c_ottoline', scene: 'slt_ottoline', then: ['set c_ottoline'],
      obj: ['Ask at the Turning Library how anyone climbs a clock', 'Ask at the library how to climb a clock'],
      hint: ['The Turning Library is the round building with a dome, in the Upper Town near Whirligig Manor.', 'The library has a dome. It is in the Upper Town.'] },
    { id: 'salt', do: 'goto c_saltmarsh 600', scene: 'slt_mina', then: ['set c_mina'],
      obj: ['Follow the Coast Road to Saltmarsh', 'Go to Saltmarsh'],
      hint: ['Saltmarsh is the fishing village on stilts, along the Coast Road past the Gull\'s Rest.', 'Follow the Coast Road to the stilt village.'] },
    { id: 'look', do: 'all', obj: ['Find out who the Moth Mask is, and fix the Tide Clock', 'Who is she? And fix the Tide Clock.'],
      hint: ['Look at the windows on the boardwalks. Ask Chowder Charlie at the Chowder Pot to smell the note. The Tide House door is at the foot of the Tide Clock.',
        'Look at the windows. Ask Charlie. Fix the Tide Clock.'],
      parts: [
        { do: 'examine sm_gift_lantern', scene: 'slt_lantern', then: ['clue s_gifts'] },
        { do: 'talk c_charlie', scene: 'slt_charlie', then: ['clue s_note_salt'] },
        // the Tide House stays code (x1_story.js c_tidehouse): its lever sets c_tide_fixed
        { do: 'wait_for flag c_tide_fixed', at: 'c_tidehouse_door', scene: 'slt_lowtide',
          then: ['set c_lowtide', 'clue s_tide_dust', 'xp 600', 'give coins 60'] },
      ],
      extra: [
        { do: 'talk c_whirligig', scene: 'slt_whirligig', then: ['clue s_baron_rumor'] },
      ] },
    { id: 'deduce', do: 'deduce who_is_she', obj: ['Work out who the Moth Mask is in the Case Book', 'Open the Case Book'] },
    { id: 'gran', do: 'talk c_oona', scene: 'slt_oona', then: ['give fish 1', 'stage c_claws'],
      obj: ["Visit Vesper's gran in the crooked house at the end of the longest boardwalk", "Visit Vesper's gran"],
      hint: ['Granny Oona lives in the last stilt house, at the very end of the longest boardwalk.', 'Gran lives at the end of the long boardwalk.'] },
  ],

  scene: {
    // on the Clockwatch roof, right after the chase (c_gear's last scene)
    slt_open: [
      { if: 'near c_hester 900', then: [
        ['c_bobs', '(from the street below) Bob! She climbed the CLOCK!', 'Bob! She climbed the CLOCK!'],
        ['c_bobs', "Nobody climbs the clock, Bob. There's a sign.", 'Nobody climbs the clock, Bob.'],
        ['ash', 'She went up it like a LADDER. How do you even DO that?', 'She climbed it like a ladder! How?'],
        ['c_bobs', 'Ask the library lady at the Turning Library. She knows everything. Loudly.', 'Ask the library lady. She knows everything.', { promise: 'c_ottoline' }],
        ['c_bobs', 'And keep that note. That is EVIDENCE. We have always wanted some evidence.', 'Keep that note. It is EVIDENCE!']] },
      // (an old save that loads in this chapter somewhere else hears only this)
      { if: '!near c_hester 900', then: [
        ['ash', 'She climbed the Great Clock like a LADDER. Somebody at the Turning Library must know how.', 'She climbed the clock! Ask at the library.', { promise: 'c_ottoline' }]] },
    ],
    slt_ottoline: [
      ['c_ottoline', "Welcome to the Turning Library. Please don't run, the shelves do that for you. WHAT CAN I... sorry. What can I do for you?", 'Welcome! WHAT DO YOU... sorry. What do you need?'],
      ['ash', 'How does somebody climb straight up the Great Clock?', 'How does someone climb the Great Clock?'],
      ['c_ottoline', "Only one person ever climbed like that. Mother Pearl, who built this city. Ember's own daughter, with horns like yours, claws that climbed anything, and not one spark of fire.", "Mother Pearl! Ember's daughter. Horns like yours. Climbing claws. No fire."],
      ['ash', "EMBER'S daughter? Then she's my great-great-great... I have an AUNT!", "Ember's daughter? She's my great-great... AUNT!"],
      ['c_ottoline', "Pearl learned to climb in the sea caves at Gullcrag, past Saltmarsh. You'd need claws like hers.", 'Pearl learned to climb in the Gullcrag caves, past Saltmarsh.', { promise: 'c_gullcrag_door' }],
      ['narr', "A shelf rolls past with a fat scroll on it: PEARL'S FAMILY TREE. It falls off, unrolls across the floor, and keeps going out the door.", "A scroll falls: PEARL'S FAMILY TREE. It unrolls right out the door."],
      ['c_ottoline', 'Oh dear. It does that. Two hundred names, and every one of them a climber.', 'Oh dear. It does that. Two hundred climbers.'],
      ['narr', 'At the very bottom, in newer ink: "Oona Saltwhistle, of Saltmarsh. And her granddaughter, Vesper."', 'At the bottom: "Oona Saltwhistle, of Saltmarsh. And granddaughter Vesper."', { clue: 's_family' }],
      ['c_ottoline', "Nobody since. All of Pearl's great big family, down to one old lady and one girl.", 'No one since. Just an old lady and a girl.'],
    ],
    slt_mina: [
      ['narr', 'Saltmarsh stands on stilts over a silver lagoon, and the whole village smells of chowder.', 'Saltmarsh is on stilts over the water. It smells like soup.'],
      ['c_mina', "Still high. Go OUT, sea. Please? ...Oh! Hello, dragon. It's been high tide for three whole days.", 'Still high tide! Oh, hello, dragon. Three days of it!'],
      ['c_mina', 'The Tide Clock stuck the same night as the Great Clock. Now the sea has forgotten how to go out.', 'The Tide Clock is stuck. The sea forgot how to go out.'],
      ['ash', 'I need to get to the Gullcrag Caves.', 'I need to get to the caves.', { promise: 'c_gullcrag_door' }],
      ['c_mina', "Not at high tide! The Gullcrag Sands are under the sea. Fix my clock and she'll go out again. The door's open.", 'Not at high tide! Fix my clock. The door is open.', { promise: 'c_tidehouse_door' }],
      ['ash', "Also, I'm looking for a thief who climbs things.", 'Also, I am looking for a climbing thief.'],
      ['c_mina', "Ask Chowder Charlie at the Chowder Pot. He knows everybody's business. He can SMELL it.", 'Ask Chowder Charlie. He can SMELL everybody.', { promise: 'c_charlie' }],
    ],
    slt_lantern: [
      ['narr', 'A little tin lantern sits on the windowsill, stamped with a moth.', 'A tin lantern with a moth on it.'],
      ['narr', 'A tag on the handle says: "For the dark nights. M."', 'The tag says: "For the dark nights. M."'],
      ['narr', 'There is one just like it in every window on the boardwalk.', 'Every window here has one.'],
      ['ash', 'M. Like on the note.', 'M. Like the note!'],
    ],
    slt_charlie: [
      ['c_charlie', "A dragon! Sit, sit. You're all horns and no lunch.", 'A dragon! Sit. You need lunch.'],
      ['ash', 'Can you smell where this note came from?', 'Can you smell where this note is from?'],
      ['narr', 'Charlie sniffs the note. He shuts his eyes. He sniffs it again, much longer.', 'Charlie sniffs the note. A long sniff.'],
      ['c_charlie', 'Salt. Cod. Kelp smoke. And a drop of chowder. MY chowder.', 'Salt. Fish. And MY chowder!'],
      ['c_charlie', "This note was written right here in Saltmarsh, lad. At my back table, I'd say.", 'This note was written in Saltmarsh. At my table!'],
      ['c_charlie', 'Now. Chowder? It is soup that has been hugged.', 'Now. Chowder? It is hugged soup.'],
    ],
    slt_whirligig: [
      ['c_whirligig', 'The Moth Mask? I know EXACTLY who it is. Baron Cogsworth. My rival.', 'I know who it is! Baron Cogsworth!'],
      ['c_whirligig', 'He has been jealous ever since they put me on a fourth coin. FOUR, dragon.', 'He is jealous. I am on four coins!'],
      ['ash', 'Does Baron Cogsworth climb?', 'Does he climb?'],
      ['c_whirligig', 'He climbs the stairs. Slowly. With a lot of complaining. Hmph.', 'He climbs stairs. Slowly. Hmph.'],
    ],
    // inside the Tide House, the moment its lever goes down (Mina shouts in from outside)
    slt_lowtide: [
      ['narr', 'CLUNK. The big hand of the Tide Clock swings from HIGH to LOW.', 'CLUNK! The big hand swings to LOW.'],
      ['narr', "Out of the cog falls the crab shell, and a fat clump of kelp. It glitters. It's packed with silver moth dust.", 'Out falls kelp, packed with silver dust.'],
      ['ash', 'There is more dust in here than there was on Gerald. Whatever did this was HUGE.', 'More dust than on Gerald! Something HUGE did this.'],
      ['c_mina', '(from outside) LOW TIDE! Oh, you lovely dragon! The Gullcrag Sands are open!', 'LOW TIDE! The sands are open!'],
    ],
    // not played by a step: x1_story.js c1Rested plays STORY.c_fishstep after a rest at the Chowder Pot in this chapter
    // or the next, and a data scene with an old key replaces that STORY entry (A2S's rule in CHANGES.md)
    c_fishstep: [
      ['narr', 'Just before dawn, something wakes you. Out of the inn window, a cloaked figure creeps along the longest boardwalk to the crooked house at the very end.', 'Before dawn, a cloaked figure creeps to the crooked house.'],
      ['narr', "She lays a fish on the step. She straightens the doormat. Then she's gone, up a post and over a roof, quick as a cat.", 'She leaves a fish. Then she runs over the roofs.', { clue: 's_fishstep' }],
      ['ash', 'Who brings an old lady fish over the rooftops, in the dark?', 'Who brings fish over the roofs in the dark?'],
      { if: 'flag pip', then: [['pip', 'Mip.']] },
    ],
    slt_oona: [
      ['narr', "The crooked house at the end of the longest boardwalk. Inside, it's colder than outside.", 'The crooked house. Inside, it is colder than outside.'],
      ['c_oona', 'Come in, duck, shut the door. Not that it helps. We Saltwhistles are always cold.', 'Come in, duck. We Saltwhistles are always cold.'],
      ['ash', 'Is Vesper home?'],
      ['c_oona', "Out. She's always out. Climbing something tall, I expect. She thinks I don't know.", 'Out. Climbing something tall. She thinks I do not know.'],
      ['narr', 'Fish are piled up on the table, more than one old lady could eat in a month. The stove is stone cold, and it has been for years.', 'Lots of fish on the table. The stove is cold.'],
      ['ash', 'Three nights ago, when the clocks stopped. Where was Vesper?', 'Where was Vesper when the clocks stopped?'],
      ['c_oona', 'Here, duck. She came in just before midnight, white as a sheet, and held my hands till morning.', 'Here. She came home before midnight, white as a sheet.', { clue: 's_alibi' }],
      ['c_oona', "She was shaking. She wouldn't say why. Take a fish, duck. Please. I'm running out of plates.", 'She was shaking. Take a fish, duck. Please.'],
    ],
  },

  talk: {
    c_mina: [
      { if: 'flag c_mina !flag c_lowtide', say: ['The Tide House door is at the foot of my clock. Burn the kelp, gently. Lift the weight. Free the big hand.', 'Burn the kelp. Lift the weight. Free the big hand.'] },
    ],
    c_charlie: [
      { if: 'clue s_note_salt !stage>=c_brass', say: ['That note? Written at my back table. I never forget a smell. Names, yes. Smells, never.', 'I never forget a smell. Only names.'] },
    ],
  },
})
