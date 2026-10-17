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
    "Ash has Blaze, Ember's blue fire! He woke the Great Hearth with it: WHOOMPH. The North Gate's ice slid off, and Captain Brann bet his boots that the moth makes the snow.",
    'Ash has Blaze! He woke the Great Hearth. WHOOMPH!'],
  mom: [["BLUE fire? Your grandmother set a river on fire once. Don't.", "Blue fire? Don't set a river on fire."]],

  clue: {
    f3_brann_bet: { icon: 'moth', herring: true,
      text: ['Captain Brann bets his boots that the white moth is making all the snow.', 'Brann thinks the moth makes the snow.'] },
  },

  step: [
    { id: 'hearth', do: 'wait_for event beat:hearth', at: 'f_lm_hearth', scene: 'f3_kindle',
      then: ['set f_hearth_lit', 'set f_northgate', 'stage f_thaw'],
      obj: ['Wake the Great Hearth with Blaze', 'Wake the Great Hearth with Blaze'],
      hint: ['Stand by the Great Hearth and hold your fire breath until it burns blue. Keep holding it on her.',
        'Hold your fire on the Hearth until it turns blue.'] },
  ],

  scene: {
    // (an old STORY key: x2_story's Hearth hook plays it before its rewards; this chapter's step plays f3_kindle)
    f_kindle: [],
    // (10 lines with Pip)
    f3_kindle: [
      ['f_brynja', "Blue! Your breath's gone BLUE! Oh, my old girl will like that. Go on. Give her everything.", 'Blue! Your fire is BLUE! Give her everything!'],
      { sfx: 'boom', do: ['set f_hearth_lit'] },
      ['narr', 'For one second nothing happens. Then, WHOOMPH. A column of blue and gold fire roars up out of the stones, higher than every roof in town.',
        'WHOOMPH! Blue and gold fire roars up. Higher than every roof!'],
      ['narr', 'Snow slides off every roof in Hearthold at once. Somebody cheers. Somebody else gets snow down their shirt and screams. Then they cheer too.',
        'Snow slides off every roof. People cheer!'],
      ['f_brynja', "Ha! HA! Look at her! She hasn't burned like that since I was a girl!", "Ha! Look at her! She hasn't burned like that in years!"],
      { if: 'flag pip', then: [
        ['narr', "Pip hops onto the edge of the Hearth, sniffs a blue ember, and licks it. Pip's belly starts to glow, warm and orange, like a tiny stove.",
          'Pip licks a blue ember. His belly glows warm, like a tiny stove.', { do: ['set f_pip_warm'] }]] },
      { cam: 'f_lm_northgate', s: 1.2 },
      ['narr', 'Up at the North Gate, the ice sags, drips, and slides off in one big slab. SPLOOSH. The gate swings open with a happy sigh.',
        'At the North Gate, the ice slides off. SPLOOSH! The gate swings open.', { do: ['set f_northgate'], ref: 'f_lm_northgate' }],
      ['f_brann', '(far off) My boots are full of gate! GUNNAR! You can stop licking things now!', 'My boots are full of gate! GUNNAR! Stop licking things!', { ref: 'f_lm_northgate' }],
      ['f_brann', "It's that moth making all this snow, Emberblood. I'd bet my boots on it. My wet boots.", "It's that moth making the snow. I'd bet my boots!",
        { clue: 'f3_brann_bet' }],
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
