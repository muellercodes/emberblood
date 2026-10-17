// game/story/act5/n_rime.js (N5a): the Finale's third ring, "The Rime Spiral". Takes over x4_story's stage n_rime.
// What the player does: climbs the Long Climb (a friend Vesper goes her own way here), reaches the winter ring where
// shadow folk stand frozen and Nyxara calls the sun a liar (a red herring for "what does she want?"), melts the ice
// wall with Blaze and rides the wind over the Floe Gap. There Glaciar crashes down to help (freed in Act III), or a
// real blue scale lies in the snow: she still sleeps on Mount Dread, and Ash promised to come back for her (starts
// N5S's errand q_n5_glaciar: a song from the Frozen Choir, sung at the Crown of Dread). Then the Ice Dam, the Aurora
// Bridge, and the Echo of the Ice Dragon. A kid who did not work out the moth's name on ring 2 can still read Moth
// Memory pane 3 in the Clockmaker's Rest: it becomes a bonus clue.
// Data only. Still x4 code: the puzzles (x4_ascent), the ice wall bubble, the echo fight and its words (x4_foes), the
// step to n_glass after the win (x4_foes), Glaciar's flight and catch (x4_story's ally runtime).
chapter({
  id: 'n_rime', act: 5, after: 'n_clocks', next: 'n_glass', takeover: true,
  card: ['Finale · The Third Ring', 'The Rime Spiral'],
  so_far: [
    "The second ring's echo was a shadow of the Moth Mask. The Night Mother has a name now: Nyx, Ember's little moth. The third ring is a copy of Frostreach: black ice, frozen shadow people, wind like a river.",
    'Ash beat the shadow thief. The third ring is ice and wind.'],

  place: {
    // Glaciar's scale at the Floe Gap, when she still sleeps on Mount Dread (art: v10_art5a.js n5a_ice_scale)
    n5_ice_scale: { map: 4, at: [6010, 83884], r: 24, kind: 'examine', look: 'n5a_ice_scale', if: '!choice f_glaciar=free', say: 'nri_scale',
      name: ['a blue dragon scale in the snow', 'a blue scale'] },
  },

  clue: {
    // a red herring for N5b's "What does the Night Mother really want?"
    n5_sun_out: { icon: 'star', mystery: 'night_mother', herring: true,
      text: ['Nyxara, on the winter ring: "The sun is a liar. One day I will put it out."', '"The sun is a liar. I will put it out."'] },
  },

  step: [
    // the moment the ring starts: the Echo 2 memory goes in the Case Book (x4_foes played the outro and moved the stage)
    { id: 'memory', do: 'fight n_echo_vesper', then: ['clue n5_oona_warm'], obj: ['Face the Echo of the Moth Mask', 'Fight the shadow thief'],
      extra: [
        // Moth Memory pane 3 (the Clockmaker's Rest, after Echo 2) read before the name was worked out
        { do: 'wait_for flag n_knows', if: '!solved n5_name', then: ['clue n5_pane3'] },
        { do: 'goto n5_u2 340', if: { any: ['choice c_vesper=friend', 'flag n5_vesper'] }, scene: 'n_vesper_bye' },
      ] },
    { id: 'longclimb', do: 'wait_for flag n_longclimb', marker: 'n5_u2', obj: ['Climb the Long Climb to the third ring', 'Climb up'],
      hint: ['Past the Mask Hall a grapple post now hangs over the void. Grapple across, then climb the icy face with your claws.',
        'Grapple over. Then climb.'] },
    { id: 'rime_in', do: 'any', marker: 'n_sh_rime', obj: ['Go to the Rime Shrine', 'Go to the shrine'],
      parts: [
        { do: 'goto n_sh_rime 330', scene: 'n_rime_in' },
        { do: 'wait_for flag n_floe' },
      ],
      then: ['clue n5_sun_out'] },
    // at the Floe Gap: Glaciar comes (freed in Act III), or her scale lies in the snow and the errand starts
    { id: 'glaciar', do: 'any', marker: 'n5_floe', obj: ['Melt the ice wall at the Wind Gate', 'Melt the ice wall'],
      hint: ['Plain fire is not hot enough for that ice. Use your Blaze.', 'Use Blaze on the ice.'],
      parts: [
        { do: 'goto n5_floe 320', if: 'choice f_glaciar=free', scene: 'n_glaciar_join' },
        { do: 'goto n5_floe 320', if: '!choice f_glaciar=free', scene: 'n_glaciar_absent', then: ['quest start q_n5_glaciar'] },
        { do: 'wait_for flag n_floe' },
      ] },
    { id: 'floe', do: 'wait_for flag n_floe', marker: 'n5_floe', obj: ['Ride the wind over the Floe Gap', 'Ride the wind'],
      hint: ['Jump into the wind swirl at the edge of the gap. Wings will not work here, but the wind will carry you.', 'Jump into the swirl.'] },
    { id: 'dam', do: 'wait_for flag n_dam', marker: 'n5_dam', obj: ['Break the Ice Dam', 'Break the ice dam'],
      hint: ['Put a bomb on the far end of the seesaw floe, Ground Pound the near end, then Blaze the bomb on the dam before the cold puts it out.',
        'Bomb on the seesaw. Pound. Then Blaze it!'] },
    { id: 'aurora', do: 'wait_for flag n_aurora', marker: 'n5_aurora', obj: ['Cross the Aurora Bridge', 'Cross the aurora'],
      hint: ['Ride the winds from ice pillar to ice pillar. If the wind blows you back, Ground Pound the plate on the aurora sail.',
        'Ride the winds. Pound the sail.'] },
    { id: 'echo', do: 'fight n_echo_glaciar', marker: 'n_echo_glaciar', obj: ['Face the Echo of the Ice Dragon', 'Fight the shadow ice dragon'],
      hint: ['In the Rime Throne. Melt her frost chains with fire. You can fly in this hall.', 'Melt her chains. You can fly here.'],
      then: ['stage n_glass'] },
  ],

  scene: {
    n_vesper_bye: [
      ['c_vesper', "I'll go up my own way. Thieves never take the stairs. See you at the top, cousin.", 'I will go my own way. See you at the top!'],
    ],
    n_rime_in: [
      ['narr', 'The third ring is winter. Black ice. Snow that falls up instead of down. A frozen aurora hangs in the air like a curtain.', 'The third ring is winter. The snow falls UP.'],
      ['narr', "Shadow people stand in the snow, frozen mid-step. Copies of the people of Hearthold. They aren't real. You check anyway.", 'Shadow people stand frozen in the snow. They are not real.'],
      ['ash', "It's okay. They're just memories. ...I'm going to say hi to all of them anyway.", 'They are just memories. I will say hi anyway.'],
      ['nyxara', 'Cold is kind, little ember. Cold keeps things. Ask my little cold one.', 'Cold keeps things safe. Ask the ice dragon.'],
      ['nyxara', 'And the sun is a liar. One day I will put it out.', 'The sun is a liar. I will put it out.', { clue: 'n5_sun_out' }],
    ],
    // Glaciar, freed in Act III (the old "Fly" is "Jump in the wind": wings do not work in the Floe Gap's wind)
    n_glaciar_join: [
      { sfx: 'boom' },
      ['narr', 'CRASH. Something enormous lands on the ice behind you, and the whole ring shakes.', 'CRASH! Something huge lands behind you.'],
      ['f_glaciar', 'DUMPLING! You are climbing the Moth\'s mountain without a scarf!', 'Dumpling! You have no scarf!'],
      ['ash', 'Great-great-great-great-great-great-great-great-great-great-great-great-great Grand-aunt Glaciar! ...I counted. I counted every great.',
        'Great x13 Grand-aunt Glaciar! I counted them all!'],
      ['f_glaciar', 'I heard, my little hot cross bun. The whole sea heard. Go on, then. Jump in the wind. If you fall, I will catch you.',
        'I heard you. Jump in the wind. If you fall, I will catch you.'],
      ['f_glaciar', 'I only do slowly, but I am very good at catching.', 'I am slow. But I am good at catching.'],
    ],
    // Glaciar still asleep (beaten in Act III): her scale, and the promise Ash made her (N5S's errand)
    n_glaciar_absent: [
      ['narr', "Half buried in the snow lies a single dragon scale, blue as deep ice. It's still cold.", 'A blue dragon scale lies in the snow. It is cold.', { ref: 'n5_ice_scale' }],
      ['ash', "Glaciar's. She's still asleep under the snow on Mount Dread.", 'Glaciar is still asleep on Mount Dread.'],
      ['ash', "I told her I'd come back for her. I promised.", 'I promised I would come back for her.', { promise: 'q_n5_glaciar' }],
      ['ash', "Snow dragons wake up for songs, don't they? Somebody on this ring must know the right one.", 'A song could wake her. Who knows one?'],
      ['pip', 'Mip!'],
    ],
    nri_scale: [
      ['narr', "Glaciar's scale, blue as deep ice. Still cold. She is still asleep on Mount Dread.", "Glaciar's cold scale. She still sleeps."],
    ],
    // Echo 3: x4_foes plays STORY.n_echo3_intro and STORY.n_echo3_outro (data versions)
    n_echo3_intro: [
      ['narr', 'In a ring of black ice, chained in frost, a shadow dragon raises her head. Her breath is a blizzard.', 'A shadow ice dragon raises her head. She is in chains.'],
      ['n_echo_glaciar', 'The Mother says cold is kind. The Mother says sleep is kindest. The Mother says fire is a lie.', 'The Mother says cold is kind. Fire is a lie.'],
      ['ash', "That's not you talking. That's the Shard. Well. A copy of you, with a copy of the Shard. This is very confusing.", 'That is the Shard talking. This is confusing!'],
      ['f_glaciar', 'Was I really that dreary? Dumpling, I need a scarf. And you need to melt those chains.', 'Was I that gloomy? Melt those chains, dumpling!',
        { if: 'choice f_glaciar=free' }],
    ],
    n_echo3_outro: [
      ['narr', 'The ice cracks. The shadow dragon shatters into a flurry of moths.', 'The ice dragon breaks into moths.'],
      ['n_memory', 'Auntie Glee! Can we make the big snow? For the sledding?', 'Auntie Glee! Can we make snow for sledding?'],
      ['n_memory', 'Every year, dumpling. Every single year.', 'Every year, dumpling.'],
      { if: 'choice f_glaciar=free', then: [
        ['f_glaciar', 'I forgot the sledding. For a thousand years, I forgot it. Thank you for reminding me, dumpling.', 'I forgot the sledding. Thank you for reminding me.'],
        ['ash', 'Every Lantern Day. Sleds AND cake.', 'Every Lantern Day. Sleds and cake!'],
      ], else: [
        ['ash', 'Even ice dragons get lonely, huh, Pip?', 'Ice dragons get lonely too, Pip.'],
        ['pip', 'Mip.'],
      ] },
    ],
  },
})
