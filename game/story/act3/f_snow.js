// game/story/act3/f_snow.js (A3a): Act III, Chapter 1, "A Letter in the Snow" (first half: Embermere).
// What the player does: it snows in summer and Pebble the crow brings Mom's letter (the cold comes over the High Pass
// by Frostpine Lodge). At the Lodge, Ulf says the pass split open one night "like something big flew through it.
// Something with wings." (a clue for the small mystery who_cracked), and Elka has left a note: GONE SLEDDING (a red
// herring). Ulf gives Ash his wolf-fur hat. The pass is just west of the Lodge (the old text said north).
// Old flags kept: f_pb_1 (Mom's letter, Pebble's own flag), the Wolf-fur Hat, the stage moves on to f_pass.
chapter({
  id: 'f_snow', act: 3, after: 'c_snow', next: 'f_pass', takeover: true,
  // (no card at the act's start: Pebble's letter f_pb_1 shows "Act III · Chapter 1, A Letter in the Snow" when it is
  // read, as before, so the chapter card comes after Mom's letter and not on top of the act card)
  card: null, name: ['A Letter in the Snow', 'A Letter in the Snow'],
  so_far: [
    "It is snowing in summer. Mom's letter says the cold comes over the High Pass by Frostpine Lodge, shut for a hundred years and suddenly open.",
    "It snows in summer. The cold comes over the High Pass by Frostpine Lodge."],
  hint: ['Frostpine Lodge is in the far north-west of Embermere, in the snowy highlands. Ulf will know about the pass.',
    'Go to Frostpine Lodge. Ask Ulf about the pass.'],
  mom: [["You came home first! Good. Sit down and eat your soup, and THEN go to the Lodge. Scarf.", 'You came home! Eat your soup. Then go to the Lodge.']],

  // Ulf's hat: the hat key is "Wolf-fur Hat" (x2_story's own hat drawing). A3a ENGINE REQUEST in CHANGES.md: `hat
  // <item>` should unlock and wear the item's `hat` name (today x1pHat only knows Act II's three hats).
  item: {
    f3_wolf_hat: { name: ["Ulf's wolf-fur hat", 'A wolf-fur hat'], desc: ['Ear flaps! Warm as toast, and smells a bit of sheep.', 'Ear flaps! Warm and fluffy.'],
      icon: 'heart', keepsake: true, hat: 'Wolf-fur Hat' },
  },

  clue: {
    f3_ulf_wings: { icon: 'claw', mystery: 'who_cracked',
      text: ['Ulf says the ice of the High Pass split one night, as if something big flew through it. Something with wings.',
        'Ulf: something with wings flew through the pass.'] },
    f3_elka_note: { icon: 'note', herring: true, mystery: 'who_cracked',
      text: ["Elka's note at the Lodge: GONE SLEDDING. VERY FAR. BACK FOR SUPPER. (NOT TONIGHT'S.)",
        'Elka went sledding. Very far.'] },
  },

  step: [
    // Mom's letter comes by Pebble (e7b_threads' PEBBLE_MAIL f_pb_1, whose lines are STORY.f_intro: this file's
    // text). If Pebble cannot find a calm moment, the letter is waiting at the Lodge instead.
    { id: 'letter', do: 'any', obj: ['Pebble the crow is bringing you a letter', 'Pebble has a letter for you'],
      hint: ['Pebble is on her way with a letter. If she is slow, go to Frostpine Lodge, far up in the snowy north-west.',
        'Pebble has a letter. Or go to Frostpine Lodge.'],
      parts: [
        { do: 'wait_for flag f_pb_1', intro: 'f3_call_pebble' },
        { do: 'goto frostpine_lodge 420', scene: 'f_intro' },
      ],
      then: ['set f_pb_1'] },
    { id: 'ulf', do: 'talk ulf', scene: 'f_lodge', then: ['set f3_lodge', 'give f3_wolf_hat', 'hat f3_wolf_hat', 'xp 150', 'stage f_pass'],
      obj: ['Go to Frostpine Lodge and talk to Ulf', 'Go to Frostpine Lodge. Talk to Ulf.'],
      hint: ['Frostpine Lodge is in the far north-west of Embermere. Ulf is inside, by the fire.',
        'Ulf is inside Frostpine Lodge.'] },
  ],

  scene: {
    // (the intro only sends Pebble off: her letter is STORY.f_intro below)
    f3_call_pebble: [{ do: ['mail f_pb_1'] }],
    // Mom's snow letter (an old STORY key: Pebble's f_pb_1 letter reads it, and the fallback at the Lodge plays it)
    f_intro: [
      ['narr', 'Snow. In the middle of summer. It falls on the roofs and fizzles on the warm chimneys, like the sky is sneezing.',
        'Snow! In summer! It fizzles on the chimneys.'],
      ['narr', 'A crow lands on your horn. It is Pebble, with a letter in her beak and a look that says you owe her something shiny.',
        'Pebble the crow lands on your horn. She has a letter.'],
      ['narr', 'Pebble drops the letter, takes one shiny coin out of your pouch, and does not apologize.',
        'She takes a coin. She is not sorry.'],
      ['maren', "(the letter) Ash. It's snowing in Emberhollow. In SUMMER. Bertram's buns froze solid. He's using them as doorstops.",
        "Ash. It's snowing at home. In SUMMER! Bertram's buns froze solid."],
      ['maren', "Yara says the cold is coming down from the north, over the High Pass by Frostpine Lodge. Ulf says that pass was shut for a hundred years. It isn't now.",
        'The cold comes over the High Pass by Frostpine Lodge. It was shut for 100 years. Not now.', { ref: 'high_pass' }],
      ['maren', "Don't come home first. Go straight to the Lodge. Wear a scarf. Love, Mom.", 'Go straight to the Lodge. Wear a scarf. Love, Mom.'],
      ['maren', 'P.S. Come home first. I made soup.'],
      ['pip', 'Mip! (Pip sneezes on a snowflake. It sizzles.)', 'Mip! (Pip sneezes on a snowflake.)'],
      ['narr', "In your pocket, the Shard of the Ember Heart has gone cold. Not cold like a stone. Cold like it's scared of something.",
        'The Shard in your pocket feels cold. Like it is scared.', { if: 'item c_shard1' }],
      ['ash', "So: go straight to the Lodge, but come home for soup first. I can do both. Soup first.", 'Lodge AND soup. Soup first!', { ref: 'high_pass' }],
    ],
    // at the Lodge (9 lines with Brisket): the split pass, the wings, the sheep, Elka's note, the hat
    f_lodge: [
      ['ulf', 'Ash! Good, you came. Come here and look at this. LOOK at it.', 'Ash! You came. Look at this!'],
      ['narr', 'Ulf points out of the window. Just west of the Lodge, where the High Pass used to be a wall of ice, a white road climbs into the clouds.',
        'Just west of the Lodge, the wall of ice is gone. A white road climbs up.', { dir: ['frostpine_lodge', 'high_pass', 'west'] }],
      ['ulf', 'A hundred years that pass was shut. Then one night, crack, the ice split right down the middle. Like something big flew through it. Something with wings.',
        '100 years shut. Then, crack! Like something big with wings flew through.', { clue: 'f3_ulf_wings' }],
      ['ulf', "And my sheep won't stop looking north. Sheep don't look at things, Ash. Sheep look at grass.",
        'My sheep keep looking north. Sheep only look at grass!', { ref: 'high_pass' }],
      ['ash', "Where's Elka?", 'Where is Elka?'],
      ['ulf', '...She left a note.', 'She left a note.'],
      ['narr', "The note says: GONE SLEDDING. VERY FAR. BACK FOR SUPPER. (NOT TONIGHT'S.)", 'GONE SLEDDING. VERY FAR. BACK FOR SUPPER. (NOT TONIGHT.)', { clue: 'f3_elka_note' }],
      ['brisket', "Don't look at me. I'm not going up there. You thawed me out of one block of ice already, and I am not getting into another.",
        "I'm not going. I was an ice cube once. Once was enough.", { if: 'flag brisket_thawed' }],
      ['ulf', 'Find her. And whatever is making winter up there, give it a good kick from me. Here: a wolf-fur hat with ear flaps. Wear it for me.',
        'Find her. Kick the winter for me. Here, a fur hat. Wear it for me.'],
    ],
  },

  talk: {
    ulf: [
      { if: 'stage=f_pass', say: ['The High Pass is just west of the Lodge, Ash. Follow the white road up. If you see Elka, tell her supper is at six. Every night.',
        'The pass is just west of here. Mind the sheep.'], dir: ['frostpine_lodge', 'high_pass', 'west'] },
    ],
  },
})
