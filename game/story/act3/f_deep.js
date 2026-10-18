// Act III, Chapter 4 (The Stonehorn Knock), second half: Stonehorn Deep (owner A3b). Data only.
// What the player does: the Stonehorn halls (code dungeon, x2_dun_b): cracked floors, drums, Rockjaw the armadillo,
// Ember's flame (Ground Pound), and King Grumblehorn on his stone throne. After the fight the old king says Ash's
// head-butting is "good drumming", like the old monks who drummed on the mountain, and "she always opened for them"
// (bonus clue f3_good_drumming for how_open). He no longer says where the drum is or what to do (the player works it
// out at the Dreadgate). Ember's last line points at the mountain and asks Ash to tell her auntie she misses her.
// Every scene here is an old STORY key, replaced in place; f_deep_won is 6 lines (it was 7).
chapter({
  id: 'f_deep', act: 3, after: 'f_gap', next: 'f_dreadgate', takeover: true,
  card: null, name: ['The Stonehorn Knock', 'The Stonehorn Knock'],
  so_far: [
    'Past the Howling Gap, a ram skull as big as a house says KNOCK over its door. Inside is Stonehorn Deep: halls of giant rams, cracked floors and drums.',
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
      ['ember', 'Hello again! I learned this flame from a very grumpy ram. He taught me to knock.', 'Hello again! A grumpy ram taught me to knock.'],
      ['ash', 'Knock? Like on a door?', 'Knock? Like on a door?'],
      ['ember', 'Like on a door the size of a mountain.', 'Like on a door the size of a mountain.'],
    ],
    f_deep_gift: [
      ['narr', 'The flame drops into you like a stone into a pond. Your feet feel heavy, the good kind of heavy. The kind that breaks floors.', 'The flame drops into you like a stone. Your feet feel heavy!'],
      ['ember', 'Ground Pound! Jump, then come down HARD. You\'ll break cracked floors, flip pound switches, and knock the armor right off grumpy things.', 'Ground Pound! Jump, then come down HARD.'],
      ['ash', 'I\'m a ROCK.', 'I\'m a ROCK.'],
      ['ember', 'The bravest rock.', 'The bravest rock.'],
    ],
    f_deep_crack: [
      ['narr', 'A sign by the cracked floor says: GOING DOWN? KNOCK.', 'A sign says: GOING DOWN? KNOCK.'],
    ],
    f_deep_echo: [
      ['tove', 'It\'s pitch black. Every pound sends a ring of light along the stone. Pound, look, then walk.', 'It\'s dark. Pound, look, then walk.'],
    ],
    f_rockjaw_intro: [
      ['f_rockjaw', 'ROLL ROLL ROLL! I\'m not round, I\'m big-boned!', 'ROLL ROLL ROLL! I\'m big-boned!'],
    ],
    f_rockjaw_won: [
      ['f_rockjaw', 'Dizzy. So dizzy. The key\'s over there. Don\'t roll it. I\'m begging.', 'So dizzy. The key is over there.'],
    ],
    f_grumblehorn_intro: [
      ['narr', 'On a throne carved out of the mountain sits a ram the size of a barn. His wool is like grey stone. His huge curled horns ring with violet light.', 'A ram as big as a barn sits on a stone throne. His horns glow purple.'],
      ['f_grumblehorn', 'HRRRMPH! Who\'s KNOCKING?', 'HRRRMPH! Who\'s KNOCKING?'],
      ['ash', 'Me! Ash! I came to learn how you knock!', 'Me! Ash! I came to learn to knock!', { ref: 'f_dread_door' }],
      ['f_grumblehorn', 'Get off my lawn! I don\'t have a lawn! Get off it anyway!', 'Get off my lawn! I don\'t have a lawn!'],
    ],
    // right after the boss: 6 lines
    f_deep_won: [
      ['narr', 'King Grumblehorn\'s horns stop glowing purple. He sits down so hard the whole room bounces.', 'The King\'s horns stop glowing. He sits down. The room bounces.'],
      ['f_grumblehorn', 'Hrrrmph. Who\'s been banging on my head?', 'Hrrrmph. Who banged on my head?'],
      ['ash', 'Me. Sorry.', 'Me. Sorry.'],
      ['f_grumblehorn', 'Hrm. Good drumming. VERY good. The old monks drummed like that, up on the mountain. She always opened for them.', 'Good drumming! The old monks drummed like that. She opened for them.', { clue: 'f3_good_drumming' }],
      ['ash', 'She?', 'She?'],
      ['f_grumblehorn', 'The Gate. The dragon. Old ladies, the pair of them, and cold as each other. Hrrrmph. Off you go.', 'The Gate. Or the dragon. Both old ladies. Off you go.', { ref: 'f_dread_door' }],
    ],
    f_deep_lamb: [
      ['f_lamb', 'Baaa! (A baby Stonehorn with tiny rock horns headbutts your knee. It\'s adorable. It also hurts.)', 'Baaa! (A baby ram headbutts your knee. Cute. Ouch.)'],
    ],
    f_deep_end: [
      ['ember', 'Three flames in one winter. You have all the fire I left in the north now. The rest is up to you.', 'Three flames in one winter. You have all my northern fire.'],
      ['ember', 'Go to the mountain, Ash. And when you see her... tell my auntie I miss her.', 'Go to the mountain. Tell my auntie I miss her.'],
      ['narr', 'Step into the warp ring to go back outside.', 'Step into the warp ring to go outside.'],
    ],
  },
})
