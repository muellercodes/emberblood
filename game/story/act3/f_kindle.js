// game/story/act3/f_kindle.js (A3a): Act III, Chapter 2, "The Dying Hearth" (last part: WHOOMPH).
// What the player does: holds Blaze on the Great Hearth until it roars up blue and gold, higher than every roof. Pip
// licks a blue ember and his belly glows (Pip learns Warm). In the same moment the ice slides off Hearthold's North
// Gate (it is the short road to the Dreadmoor now; no separate "melt the gate" chore), and Captain Brann bets his boots
// that the moth is making the snow (a red herring for "what is making the storm"). Rimeholm has gone quiet: go and see.
// The Blaze on the Hearth is still x2_story.js's own hook (p3On at the Hearth, stage f_kindle): it calls f2sBeat
// ('hearth'), which the engine also hears as the event beat:hearth. That hook also plays the old STORY key f_kindle
// and then gives the old rewards (XP, coins, the "Pip learned Warm" banner): f_kindle is empty here, so only this
// chapter's f3_kindle is seen.
// Old flags kept: f_hearth_lit, f_pip_warm (with Pip), f_northgate, f_pb_2 (Pebble's letter, sent by f_maze's end).
chapter({
  id: 'f_kindle', act: 3, after: 'f_maze', next: 'f_thaw', takeover: true,
  card: null, name: ['The Dying Hearth', 'The Dying Hearth'],
  so_far: [
    "Ash has Blaze, Ember's blue fire, from her old North Forge in the Glacier Maze. Now the Great Hearth in Hearthold needs it, before its last little flame goes out.",
    'Ash has Blaze! Now the Great Hearth needs it.'],
  mom: [["BLUE fire? Show me. ...Not in the kitchen! Outside, outside!", 'Blue fire? Not in the kitchen!']],

  clue: {
    f3_brann_bet: { icon: 'moth', herring: true,
      text: ['Captain Brann bets his boots that the white moth is making all the snow.', 'Brann thinks the moth makes the snow.'] },
  },

  // (three short scenes in a row: between them the game draws a frame or two, so the Hearth really roars up blue and
  // gold, the snow really slides off the roofs, and the North Gate really stands open when the camera looks at it)
  step: [
    { id: 'hearth', do: 'wait_for event beat:hearth', at: 'f_lm_hearth', scene: 'f3_kindle', then: ['set f_hearth_lit'],
      obj: ['Wake the Great Hearth with Blaze', 'Wake the Great Hearth with Blaze'],
      hint: ['Stand by the Great Hearth and hold your fire breath until it burns blue. Keep holding it on her.',
        'Hold your fire on the Hearth until it turns blue.'] },
    { id: 'roofs', do: 'cutscene f3_kindle_roofs', then: ['set f_northgate'] },
    { id: 'gate', do: 'cutscene f3_kindle_gate', then: ['stage f_thaw'] },
  ],

  scene: {
    // (an old STORY key: x2_story's Hearth hook plays it before its rewards; this chapter's steps play f3_kindle...)
    f_kindle: [],
    f3_kindle: [
      ['f_brynja', "Blue! Your breath's gone BLUE! Oh, my old girl will like that. Go on. Give her everything.", 'Blue! Your fire is BLUE! Give her everything!'],
      // (emit f3fx:whoomph: x2_story's own WHOOMPH picture, the blue flash, the shake, the boom and the fire column)
      { do: ['set f_hearth_lit', 'emit f3fx:whoomph'] },
      ['narr', 'For one second nothing happens. Then, WHOOMPH. A column of blue and gold fire roars up out of the stones, higher than every roof in town.',
        'WHOOMPH! Blue and gold fire roars up. Higher than every roof!'],
    ],
    // (6 lines with Pip)
    f3_kindle_roofs: [
      ['narr', 'Snow slides off every roof in Hearthold at once. Somebody cheers. Somebody else gets snow down their shirt and screams. Then they cheer too.',
        'Snow slides off every roof. People cheer!'],
      ['f_brynja', "Ha! HA! Look at her! She hasn't burned like that since I was a girl!", "Ha! Look at her! She hasn't burned like that in years!"],
      { if: 'flag pip !flag f_pip_warm', then: [
        ['narr', "Pip hops onto the edge of the Hearth, sniffs a blue ember, and licks it. Pip's belly starts to glow, warm and orange, like a tiny stove.",
          'Pip licks a blue ember. His belly glows warm, like a tiny stove.', { do: ['set f_pip_warm'] }]] },
      ['f_brynja', "She won't stay this bright, mind. Not while that purple storm sits on the mountain. But she'll hold now.",
        "She won't stay this bright. Not with that storm. But she will hold."],
      ['narr', 'Then, from the north side of town: a long creak, a drip, and a great wet SPLOOSH.', 'Then, from the North Gate: SPLOOSH!',
        { do: ['set f_northgate'], ref: 'f_lm_northgate' }],
    ],
    // (5 lines; the camera goes to the North Gate, which stands open now)
    f3_kindle_gate: [
      { cam: 'f_lm_northgate', s: 1 },
      ['narr', 'The ice has slid off the North Gate in one big slab. The gate swings open with a sound like a happy sigh.',
        'The ice slid off the North Gate. It swings open!', { ref: 'f_lm_northgate' }],
      ['f_brann', '...My boots are full of gate. GUNNAR! You can stop licking things now!', 'My boots are full of gate! GUNNAR! Stop licking things!', { ref: 'f_lm_northgate' }],
      { if: 'choice f3_moth=moth', then: [
        ['f_brann', "It's that moth making all this snow. The BIG white one. Not you, moth-dragon. I'd bet my boots on it.", "It's that big white moth making the snow. Not you. I'd bet my boots!",
          { clue: 'f3_brann_bet' }]],
        else: [
        ['f_brann', "It's that moth making all this snow, Emberblood. I'd bet my boots on it. My wet boots.", "It's that moth making the snow. I'd bet my boots!",
          { clue: 'f3_brann_bet' }]] },
      ['f_brynja', 'Rimeholm went quiet the night the moth came over. Not one letter since. Go and see, child. Out the West Gate and along the Rim Road, on the sea cliffs.',
        'Rimeholm went quiet when the moth came. Go and see. It is on the sea cliffs.', { promise: 'f_rimeholm', dir: ['f_hearthold', 'f_rimeholm', 'west'] }],
    ],
  },

  talk: {
    f_brynja: [
      { if: 'stage=f_kindle !flag f_hearth_lit', say: ["Hold your breath on her until your fire burns blue. Don't be shy. She likes it hot.",
        'Hold your fire on her until it turns blue!'] },
    ],
  },
})
