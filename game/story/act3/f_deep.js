// Act III, Chapter 4 (The Stonehorn Knock), second half: Stonehorn Deep (owner A3b). Data only.
// What the player does: the Stonehorn halls (code dungeon, x2_dun_b): cracked floors, drums, Rockjaw the armadillo,
// the flame on the drum stone (Ground Pound), and King Grumblehorn on his stone throne. (v11) The king teaches the knock:
// he is asleep below the drum stone, snoring, and coaches Ash through it in his sleep (speaker changes only; the power and
// dungeon stay), and Ash's pounding is what wakes him for the fight. After the fight the old king says Ash's
// head-butting is "good drumming", like the old monks who drummed on the mountain, and "she always opened for them"
// (bonus clue f3_good_drumming for how_open). He no longer says where the drum is or what to do (the player works it
// out at the Dreadgate). Ember does not speak here (she speaks once in Act III, at her North Forge).
// Every scene here is an old STORY key, replaced in place; f_deep_won is 6 lines (it was 7).
chapter({
  id: 'f_deep', act: 3, after: 'f_gap', next: 'f_dreadgate', takeover: true,
  card: null, name: ['Knock, Knock', 'The Stonehorn Knock'],
  so_far: [
    'Past the Howling Gap, a giant ram skull has KNOCK carved over its door. Inside is Stonehorn Deep: halls of giant rams, cracked floors, drums, and somebody snoring.',
    'Inside the ram skull: Stonehorn Deep. Giant rams and drums.'],

  clue: {
    f3_good_drumming: { icon: 'star', mystery: 'long_winter',
      text: ['King Grumblehorn says your head-butting is good drumming, like the old monks drummed on the mountain. "She always opened for them."', 'The King says the monks drummed on the mountain. "She opened for them."'] },
  },

  step: [
    { id: 'deep', do: 'dungeon f_deep', at: 'f_horned_door', then: ['stage f_dreadgate'],
      obj: ['Explore Stonehorn Deep and find Ember\'s flame', 'Explore Stonehorn Deep'],
      hint: ['Deep in the Stonehorn halls, a flame burns on a drum stone. After that, pound everything that looks cracked.', 'Find the flame. Then pound cracked floors.'] },
  ],

  scene: {
    f_deep_in: [
      ['tove', 'It\'s a little warmer down here. Only a little, but I\'ll take it.', 'It\'s a bit warmer down here.'],
      ['narr', 'From somewhere deep below comes a snore like a rockslide.', 'From deep below comes a snore like a rockslide.'],
    ],
    f_deep_shrine: [
      ['narr', 'A flame burns on a round drum stone in the middle of the hall. Far below your feet, the snoring stops.', 'A flame burns on a drum stone. Below, the snoring stops.'],
      ['f_grumblehorn', '(from below, fast asleep) Hrrm. Somebody on my drum stone. Knees soft. Come down on the heels. ...Again.', '(from below, asleep) Hrrm. Knees soft. Come down hard. Again.', { mood: 'sleepy' }],
      ['ash', 'Is he teaching me? In his sleep?', 'Is he teaching me in his sleep?'],
      ['tove', 'Ember learned to knock from his grandfather. Listen to him.', 'Ember learned from his grandpa. Listen.'],
    ],
    f_deep_gift: [
      ['narr', 'The flame drops into you like a stone into a pond. Your feet feel heavy, the good kind of heavy. The kind that breaks floors.', 'The flame drops into you like a stone. Your feet feel heavy!'],
      ['f_grumblehorn', '(from below, still asleep) Ground Pound. Jump, then come down hard. Cracked floors break. Switches flip. Armor falls off grumpy things. Hrrrm.',
        '(asleep) Ground Pound. Jump, then come down hard. Hrrm.', { mood: 'sleepy' }],
      ['ash', 'Thank you, Your Majesty.', 'Thank you, Your Majesty.'],
      ['tove', "He's asleep, Ash.", "He's asleep, Ash."],
      ['ash', 'Still.', 'Still.'],
    ],
    f_deep_crack: [
      ['narr', 'A sign by the cracked floor says: GOING DOWN? KNOCK.', 'A sign says: GOING DOWN? KNOCK.'],
    ],
    f_deep_echo: [
      ['tove', 'It\'s pitch black. Every pound sends a ring of light along the stone. Pound, look, then walk.', 'It\'s dark. Pound, look, then walk.'],
    ],
    f_rockjaw_intro: [
      ['f_rockjaw', 'ROLL ROLL ROLL! I\'m not round, I\'m big-boned!', 'ROLL ROLL ROLL! I\'m big-boned!', { mood: 'angry' }],
    ],
    f_rockjaw_won: [
      ['f_rockjaw', 'Dizzy. So dizzy. The key\'s over there. Don\'t roll it. I\'m begging.', 'So dizzy. The key is over there.', { mood: 'defeated' }],
    ],
    f_grumblehorn_intro: [
      ['narr', 'On a throne carved out of the mountain sits a ram with horns curled like two millstones. His wool is like grey stone. His horns ring with violet light.', 'A huge ram sits on a stone throne. His horns glow purple.'],
      ['f_grumblehorn', 'HRRRMPH! Who\'s been stomping on my drum stone?', 'HRRRMPH! Who stomped on my drum stone?'],
      ['ash', 'Me! Ash! You taught me! In your sleep!', 'Me! You taught me in your sleep!'],
      ['f_grumblehorn', 'Get off my lawn! I don\'t have a lawn! Get off it anyway!', 'Get off my lawn! I don\'t have a lawn!', { mood: 'furious' }],
    ],
    // right after the boss: 6 lines
    f_deep_won: [
      ['narr', 'King Grumblehorn\'s horns stop glowing purple. He sits down so hard the whole room bounces.', 'The King\'s horns stop glowing. He sits down. The room bounces.'],
      ['f_grumblehorn', 'Hrrrmph. Who\'s been banging on my head?', 'Hrrrmph. Who banged on my head?', { mood: 'hurt' }],
      ['ash', 'Me. Sorry.', 'Me. Sorry.'],
      ['f_grumblehorn', 'Hrm. Good drumming. Very good. The old monks drummed like that, up on the mountain. She always opened for them.', 'Good drumming! The old monks drummed like that. She opened for them.', { mood: 'happy', clue: 'f3_good_drumming' }],
      ['ash', 'She?', 'She?'],
      ['f_grumblehorn', 'The Gate. The dragon. Old ladies, the pair of them, and cold as each other. Hrrrmph. Off you go.', 'The Gate. Or the dragon. Both old ladies. Off you go.', { ref: 'f_dread_door' }],
    ],
    f_deep_lamb: [
      ['f_lamb', 'Baaa! (A baby Stonehorn with tiny rock horns headbutts your knee. It\'s adorable. It also hurts.)', 'Baaa! (A baby ram headbutts your knee. Cute. Ouch.)'],
    ],
    f_deep_end: [
      ['tove', 'Wind to get up there, and a knock to get in. Now we only need the mountain.', 'Wind, and a knock. Now the mountain.', { ref: 'f_dread_door' }],
      ['narr', 'Step into the warp ring to go back outside.', 'Step into the warp ring to go outside.'],
    ],
  },
})
