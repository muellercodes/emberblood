// game/story/act2/c_claws.js (A2a): Act II, the Gullcrag Caves (no card of its own, as today).
// What the player does: at low tide, small boot prints cross the Gullcrag Sands and stop at the foot of the cliff,
// where four scratches go straight up the rock (optional, on the way). The Gullcrag Caves give Pearl's Climbing Claws
// (the dungeon stays code). On top of Gullcrag Head the Moth Mask is waiting, legs dangling over the edge: Ash can call
// her by her name and ask about her cold gran (trust K2), and when she glides off, her claw marks on the edge fit
// his new claws exactly (the k_claws clue for "what is she").
chapter({
  id: 'c_claws', act: 2, after: 'c_salt', next: 'c_brass', takeover: true,
  card: null,
  so_far: [
    "The tide went out and Ash found Pearl's Climbing Claws in the Gullcrag Caves. Vesper was waiting on the cliff top. When she glided away, Ash's new claws fit her claw marks exactly.",
    "Ash got Pearl's Climbing Claws. Vesper's claw marks fit his claws exactly."],
  hint: ['The Gullcrag Caves are at the foot of the dark cliff, across the Gullcrag Sands. The tide is low now.',
    'The caves are across the sand, under the dark cliff.'],
  silence: ['c_cliff'],

  place: {
    // her boot prints at low tide, from where the boardwalks end to the foot of Gullcrag Head (all wet sand, checked)
    gc_sand_prints: { map: 1, kind: 'prints', show: 'flag c_lowtide', name: 'small boot prints',
      path: [[1780, 27900], [1840, 28020], [1900, 28130], [1960, 28220], [2015, 28290]] },
    // right above where the prints stop: the lip of Gullcrag Head (level 3; the edge is x 2040)
    gull_vesper_seat: { map: 1, at: [2064, 28296], kind: 'npc_spot', name: 'the edge of Gullcrag Head' },
    gull_glide_to: { map: 1, at: [2750, 27650], kind: 'npc_spot', name: 'the sky over the Coast Road' },
    gc_claw_marks: { map: 1, at: [2056, 28330], r: 18, kind: 'examine', look: 'a2a_claw_marks', name: 'claw marks on the cliff edge',
      aliases: ['the scratches', 'her claw marks'] },
  },

  clue: {
    k_claws: { icon: 'claw',
      text: ["Vesper climbs with claws just like Pearl's. Ash's new Climbing Claws fit her claw marks exactly.",
        'Her claw marks fit Ash\'s new claws exactly.'] },
  },

  step: [
    { id: 'caves', do: 'dungeon c_gullcrag', at: 'c_gullcrag_door',
      obj: ['Explore the Gullcrag Caves at the foot of Gullcrag Head', 'Explore the Gullcrag Caves'],
      hint: ['Cross the Gullcrag Sands while the tide is low. The caves are at the foot of the dark cliff.', 'Cross the sand to the caves.'],
      extra: [
        { do: 'track gc_sand_prints', scene: 'clw_prints' },
      ] },
    // Pearl's warp at the end of the caves sets Ash down right here (x1_dun_a.js D1A_WARP: 2300, 28330)
    { id: 'cliff', do: 'goto c_gullcrag_head 260', scene: 'clw_cliff', then: ['set c_gull_done', 'xp 200'],
      obj: ['Climb to the top of Gullcrag Head', 'Climb to the top of the cliff'] },
    { id: 'marks', do: 'examine gc_claw_marks', scene: 'clw_marks', then: ['clue k_claws', 'stage c_brass'],
      obj: ['Look at the cliff edge where she was sitting', 'Look where she sat'] },
  ],

  scene: {
    clw_prints: [
      ['narr', 'The prints stop at the foot of the cliff. Small boots. Somebody light.', 'The boot prints stop at the cliff.'],
      ['narr', 'Above them, four deep scratches go straight up the rock, all the way to the top.', 'Four deep scratches go straight up the rock.'],
      ['ash', 'She climbed it. Like a LADDER. Again.', 'She climbed it! Again!'],
    ],
    // (6 lines on every branch: it is the first scene after the caves)
    clw_cliff: [
      { place: ['c_mask', 'gull_vesper_seat'] }, { anim: ['c_mask', 'sit'] }, { cam: 'gull_vesper_seat', s: 1 },
      ['c_mask', "Pearl's claws. Huh. They suit you, little ember.", "Pearl's claws. They suit you, little ember."],
      { choose: 'c_cliff', ask: ['What do you say?', 'What do you say?'], pick: [
        { t: ["Vesper. Your gran is cold, isn't she?", 'Your gran is cold, right?'], tone: 'kind',
          then: ['set c_cliff=gran', 'trust vesper +1'],
          say: [
            ['c_mask', 'WHAT? How do you know my NAME? I nearly fell off!', 'How do you know my NAME? I nearly fell off!'],
            ['c_mask', "...She's been cold for seventy years. I'm going to fix it. Don't follow me.", 'Gran is always cold. I will fix it. Do not follow me.']] },
        { t: ['Give back the Ember Heart, Vesper!', 'Give it back, Vesper!'], tone: 'brave',
          then: ['set c_cliff=heart'],
          say: [
            ['c_mask', 'Ooh. He knows my name. Want a medal?', 'Ooh, he knows my name. Want a medal?'],
            ['c_mask', "It's somewhere you can't climb. Yet.", "It's somewhere you can't climb. Yet."]] },
        { t: ['Nice cloak. Can I borrow it?', 'Nice cloak. Can I borrow it?'], tone: 'silly',
          then: ['set c_cliff=cloak'],
          say: [['c_mask', 'No.'], ['ash', 'Worth a try.']] },
      ] },
      { anim: ['c_mask', 'glide'] }, { walk: ['c_mask', 'gull_glide_to'] },
      ['narr', 'She steps backwards off the cliff. Her cloak opens like wings, and she glides away toward the city.', 'She steps off the cliff. Her cloak opens like wings.'],
      ['ash', 'I REALLY need to learn how to do that.', 'I REALLY need to learn that.'],
      { wait: 1.2 }, { do: ['despawn c_mask'] },
    ],
    clw_marks: [
      ['narr', 'Right where she sat: four deep scratches in the rock, where she pulled herself up.', 'Where she sat: four deep scratches.'],
      ['narr', 'You put your new claws in them. They fit. Exactly.', 'You put your claws in them. A perfect fit.'],
      ['ash', 'Same claws as mine. Same as Pearl.', 'Same claws as mine. Same as Pearl!'],
      { if: 'flag pip', then: [['pip', 'Mip.']] },
    ],
  },
})
