// game/story/act5/n_clocks.js (N5a): the Finale's second ring, "The Clockstop Cliffs". Takes over x4_story's n_clocks.
// What the player does: works out who the little grey moth is (the first-ring clues, in the Case Book), rides the Wind
// Chimney, and on a copy of Gearhaven hears Nyxara say she once came in the night to a girl with a lantern (clue). Ash
// sets the Midnight Clock to Lantern Time (x4_ascent's riddle); with the hands off the twelve, the hub shows three old
// letters, NYX, the clockmakers' word for night (clue; with Pip's Fetch, Pip pulls the glass cap off). At the Silk
// Gallery: a friend Vesper drops in to help (Act II friend), or her cracked mask lies on the cliff ("Sorry. V.") and
// on the first island her silk line snaps and she hangs over the void, the very first night all over again: pull her
// up (trust friends +1, she is back), pull her up and give her Gran's letter (if Ash kept it in Act IV), or keep going.
// Up the Chalk Climb, the Gear Bridge turns, and from under the scale plate slides a real paper lantern: "For my
// little night-moth. E." (clue). The Case Book asks the moth's name (Nyx: n_knows). Then the Echo of the Moth Mask.
// Data only. Still x4 code: the puzzles (x4_ascent), the clock bubble, the echo fight and its words (x4_foes), the step
// to n_rime after the win (x4_foes), the friends who walk with Ash (x4_story's ally runtime, see N5A_NOTES).
chapter({
  id: 'n_clocks', act: 5, after: 'n_stair', next: 'n_rime', takeover: true,
  card: ['Finale · The Second Ring', 'The Clockstop Cliffs'],
  so_far: [
    'Ash beat the Echo of the First Flame and found the little grey moth carved everywhere Ember had been. The second ring is a copy of Gearhaven, where every clock is stuck at midnight.',
    'Ash beat the shadow dragon. Now Ash climbs the clock cliffs.'],

  place: {
    // the NYX letters on the hub, under where the hands were (art: v10_art5a.js n5a_nyx, drawn 75 px above this anchor,
    // which is on the long hand at the 6, so the prompt mark does not cover the letters); the hands set make a path to it
    n5_clock_hub: { map: 4, at: [2165, 83640], r: 40, kind: 'examine', look: 'n5a_nyx', show: 'flag n_clockset', say: 'ncl_hub',
      name: ['the hub of the Midnight Clock', 'the middle of the clock'] },
    // the Silk Gallery: Vesper's cracked mask on the cliff edge (Act II foe), where her friend self lands, where she hangs
    n5_cracked_mask: { map: 4, at: [1806, 84912], r: 22, kind: 'examine', look: 'n5a_cracked_mask',
      if: '!choice c_vesper=friend !flag n5_vesper', say: 'ncl_mask', name: ['a cracked moth mask', 'a cracked mask'] },
    n5_vesper_land: { map: 4, at: [1812, 84884], kind: 'npc_spot', name: ['the edge of the Silk Gallery', 'the cliff edge'] },
    n5_gallery_isle1: { map: 4, at: [1650, 85200], r: 64, kind: 'spot', name: ['the first island of the Silk Gallery', 'the first island'] },
    n5_vesper_hang: { map: 4, at: [1662, 85262], kind: 'npc_spot', name: ['the edge of the first island', 'the island edge'] },
    // where the camera looks during her second chance (below her, so the dialogue box does not cover her)
    n5_hang_cam: { map: 4, at: [1662, 85350], kind: 'npc_spot', name: ['the void under the first island', 'the void'] },
    // the Gear Bridge: a real paper lantern slides out from under the scale plate once the gears line up
    n5_folded_lantern: { map: 4, at: [4548, 88268], r: 24, kind: 'examine', look: 'n5a_folded_lantern', show: 'flag n_gear', say: 'ncl_lantern',
      name: ['a folded paper lantern', 'a paper lantern'] },
  },

  clue: {
    n5_came_in_night: { icon: 'moth', mystery: 'night_mother',
      text: ['Nyxara, on the clock ring: "I came in the night once, to a girl with a lantern."', '"I came in the night once, to a girl with a lantern."'] },
    n5_clock_word: { icon: 'clock', mystery: 'night_mother',
      text: ["Under the hands of the Midnight Clock: NYX, the clockmakers' old word for night.", 'NYX means night.'] },
    n5_night_moth: { icon: 'lamp', mystery: 'night_mother',
      text: ['A real paper lantern from the Gear Bridge, painted with a little grey moth: "For my little night-moth. E."', '"For my little night-moth. E."'] },
    // what solving n5_name gives (N5b's n5_reach needs it)
    n5_her_name: { icon: 'star', mystery: 'night_mother',
      text: ['Ember named the little grey moth Nyx. Nyx... Nyxara. The Night Mother was that little moth.', 'The little moth was Nyx. Nyxara!'] },
    // the Echo 2 outro memory (given when n_rime starts: x4_foes plays the outro itself); N5b's n5_reach needs it
    n5_oona_warm: { icon: 'heart', mystery: 'night_mother',
      text: ['A memory from the Echo of the Moth Mask. Gran Oona: "Oh, duck. Fire isn\'t the only warm thing."', '"Fire isn\'t the only warm thing."'] },
    // a bonus clue for the name: Moth Memory pane 3 in the Clockmaker's Rest (optional, after Echo 2; see n_rime)
    n5_pane3: { icon: 'moth', mystery: 'night_mother',
      text: ['Moth Memory 3, in the Clockmaker\'s Rest: a girl with a lantern, and a little moth she calls Nyx.', 'A girl and a moth called Nyx.'] },
  },

  deduce: {
    n5_name: {
      mystery: 'night_mother',
      ask: ['What did Ember call the little grey moth?', "What was the little moth's name?"],
      needs: ['n5_came_in_night', 'n5_clock_word', 'n5_night_moth'],
      bonus: ['n5_page11', 'n5_moth_dream', 'n5_pane3'],
      pick: [
        { t: 'Nyx', right: true },
        { t: 'Murmur',
          hint: ["That's Hush's sister. Vesper saw her crack the Heart this year. Ember's moth is a thousand years older.", 'Murmur came this year. This moth is very old.'] },
        { t: 'Hush',
          hint: ['Ash met Hush this year. Ember\'s little moth lived a thousand years ago.', 'You met Hush this year. This moth is very old.'] },
        { t: ['The Lady of the Moths', 'The Lady of the Moths'],
          hint: ["That's what Vesper's dreams called her. Would a girl name a tiny moth \"Lady\"?", 'Would a girl call a tiny moth "Lady"?'] },
      ],
      then: ['set n_knows', 'clue n5_her_name', 'xp 600',
        { banner: ['Her name was Nyx.', 'Her name was Nyx.'], sub: ['The Night Mother was once a little moth called Nyx.', 'The Night Mother was a moth called Nyx.'] }],
    },
  },

  step: [
    // the moment the ring starts: the Echo 1 memory goes in the Case Book (x4_foes played the outro and moved the stage)
    { id: 'memory', do: 'fight n_echo_vor', then: ['clue n5_mem_grandpa'], obj: ['Face the Echo of the First Flame', 'Fight the shadow dragon'],
      extra: [
        { do: 'examine n5_grey_scale' },
        { do: 'examine n5_well' },
        { do: 'goto n5_chimney 320', if: 'choice greymane=ally', scene: 'n_grey_bye' },
        // a kid who ran past Ember's flame stone into the Echo 1 fight can still find its clues (it sparkles)
        { do: 'examine n5_flame_stone', if: '!clue n5_ember_moth' },
      ] },
    { id: 'who_moth', do: 'deduce n5_who_moth', marker: 'n5_chimney', obj: ['Work out who the little grey moth is, in the Case Book', 'Open the Case Book'],
      hint: ['Open the Case Book (the book button, or B). Think about the fourth post, the flame stone and what Ember said.',
        'Open the Case Book. Think about the moth carvings.'] },
    { id: 'chimney', do: 'wait_for flag n_chimney', marker: 'n5_chimney', obj: ['Ride the Wind Chimney up to the second ring', 'Fly up the Wind Chimney'],
      hint: ['Past the Shadow Throne, a column of silver air roars up the cliff. Fly into it.', 'Fly up the windy column.'] },
    { id: 'clocks_in', do: 'any', marker: 'n_sh_clock', obj: ['Go to the Clockstop Shrine', 'Go to the shrine'],
      parts: [
        { do: 'goto n_sh_clock 330', scene: 'n_clocks_in' },
        { do: 'wait_for flag n_clockset' },
      ],
      then: ['clue n5_came_in_night'] },
    { id: 'clock', do: 'wait_for flag n_clockset', marker: 'n5_clock', obj: ['Set the Midnight Clock to Lantern Time', 'Fix the big clock'],
      hint: ['Read the rule on the rim. Lash the hooks with the Chain Whip: one from the top of the tower, one behind the moth veil.',
        'Read the rim. Whip the two hooks.'] },
    { id: 'hub', do: 'examine n5_clock_hub', then: ['clue n5_clock_word'], obj: ['Walk out along the hands and look at the middle of the clock', 'Look at the clock middle'] },
    // the Silk Gallery: a friend Vesper drops in, or her cracked mask lies on the edge of the cliff
    { id: 'vesper', do: 'any', marker: 'n5_gallery_neck', obj: ['Dash through the moth veil to the Silk Gallery', 'Go to the silk bridge'],
      parts: [
        { do: 'goto n5_gallery_neck 110', if: 'choice c_vesper=friend', scene: 'n_vesper_join', then: ['set n_vline'] },
        { do: 'goto n5_gallery_neck 110', if: '!choice c_vesper=friend', scene: 'n_vesper_absent' },
      ] },
    // her second chance on the first island (only when she is not already a friend); then across the gallery
    { id: 'chance', do: 'any', marker: 'n5_gallery_isle1', obj: ['Cross the Silk Gallery', 'Cross the silk bridge'],
      hint: ['Grapple from post to post across the void. The gold ring shows what your tail can reach.', 'Grapple across.'],
      parts: [
        { do: 'goto n5_gallery_isle1', if: '!choice c_vesper=friend', scene: 'n_vesper_join' },
        { do: 'wait_for flag n_gallery' },
      ] },
    { id: 'gallery', do: 'wait_for flag n_gallery', marker: 'n5_gallery_far', obj: ['Cross the Silk Gallery', 'Cross the silk bridge'],
      hint: ['Grapple from post to post across the void. The gold ring shows what your tail can reach.', 'Grapple across.'] },
    { id: 'gear', do: 'wait_for flag n_gear', marker: 'n5_gear', obj: ['Turn the Gear Bridge', 'Turn the gears'],
      hint: ['Up the Chalk Climb (the outer columns are safe), then whip the three brass weights off their shelves onto the scale plate.',
        'Whip the three weights down.'] },
    { id: 'lantern', do: 'examine n5_folded_lantern', then: ['clue n5_night_moth'], obj: ['Look at what slid out from under the scale plate', 'Look under the scale'] },
    { id: 'name', do: 'deduce n5_name', marker: 'n5_gear', obj: ["Work out the little moth's name, in the Case Book", 'Open the Case Book'],
      hint: ['Three clues: what Nyxara said by the shrine, the letters under the clock hands, and the lantern note.', 'What did the clues say about night?'] },
    { id: 'echo', do: 'fight n_echo_vesper', marker: 'n_echo_vesper', obj: ['Face the Echo of the Moth Mask', 'Fight the shadow thief'],
      hint: ['Across the Gear Bridge, in the Mask Hall. Only one of the shadows is real.', 'Find the real shadow.'],
      then: ['stage n_rime'] },
  ],

  scene: {
    n_grey_bye: [
      ['narr', 'Greymane looks up the Wind Chimney, then at you, then trots off along the cliff with his nose to the ground.', 'Greymane looks up. Then he runs off along the cliff.'],
      ['ash', "He'll find his own way up. Wolves always do.", 'He will find his own way up.'],
    ],
    n_clocks_in: [
      ['narr', 'The second ring is a copy of Gearhaven: clock towers, brass gears and chalk cliffs, every bit of it black glass.', 'The second ring looks like Gearhaven. All black glass.'],
      ['narr', 'Every clock says midnight. Not one of them ticks.', 'Every clock says midnight. None of them tick.'],
      ['ash', 'Gearhaven was never this quiet. Gearhaven was so loud you could hear it think.', 'Gearhaven was never this quiet.'],
      ['pip', 'Mip?'],
      ['ash', 'I know, Pip. I miss the ticking too.', 'I miss the ticking too, Pip.', { if: 'flag pip' }],
      ['nyxara', 'Midnight is the best time, little ember. Nothing ends at midnight. Everything just waits.', 'At midnight, nothing ends. Everything just waits.'],
      ['nyxara', 'I came in the night once, to a girl with a lantern. She was so warm.', 'I came in the night once, to a girl with a lantern.', { clue: 'n5_came_in_night' }],
      ['ash', 'What girl? Hey! Come back! What girl?', 'What girl? Hey! Come back!'],
    ],
    ncl_hub: [
      { if: 'flag c_pip_fetch flag pip', then: [
        ['narr', "Pip zips down, plucks the little glass cap off the hub and drops it at your feet. It's the trick he learned in Gearhaven.", 'Pip pulls the glass cap off the hub.'],
      ] },
      ['narr', 'With the hands off the twelve, you can see what they were covering. Three old letters, carved deep into the hub.', 'Under the hands are three old letters.'],
      ['narr', 'N. Y. X. And under them, very small: "NYX: the clockmakers\' old word for night."', 'N Y X. "NYX: the old word for night."', { clue: 'n5_clock_word' }],
      ['ash', 'Nyx means night. So the Midnight Clock is a Nyx clock. Huh.', 'Nyx means night. Huh.'],
    ],
    // Vesper on the Silk Gallery, one scene id for both pictures (x4_story's ally runtime reads n4sSeen('n_vesper_join')):
    // the friend Vesper (Act II friend) lands beside Ash at the near shore; a foe Vesper gets her second chance on the
    // first island, the same picture as the first night (Act II, the clock hand)
    n_vesper_join: [
      { if: 'choice c_vesper=friend', then: [
        { place: ['c_vesper', 'n5_vesper_land'], anim: ['c_vesper', 'perch'] },
        ['narr', 'Someone drops out of the dark on a silk line and lands beside you without a sound. A moth mask. A crooked grin.', 'Someone drops down on a silk rope. A moth mask. A grin.'],
        ['c_vesper', "You're climbing a copy of my rooftops, and you're doing it wrong.", 'You are climbing my rooftops wrong.'],
        ['ash', 'VESPER!', 'Vesper!'],
        ['c_vesper', 'Hi, cousin. I thought you might need a thief. Getting in where nobody wants you is what I do best.', 'Hi, cousin! You need a thief. Thieves get in anywhere.'],
        ['ash', 'How many greats is a cousin?', 'How many greats is a cousin?'],
        ['c_vesper', "None. Cousins don't get greats.", 'None. Cousins have no greats.'],
        ['ash', "Then you're my favorite relative.", 'Then you are my favorite!'],
        ['c_vesper', "Don't tell your dragon grandpa. Now, see the gold post on that first island? Grapple it, then the next one, and don't look down.",
          "Don't tell Grandpa. Grapple that first post. Don't look down.", { ref: 'n5_gallery_isle1' }],
        ['c_vesper', 'She hid a post of her own out there too, past the third island. Hiding things from me never works.', 'She hid a post out there too. I found it.',
          { do: ['set n_vline'], ref: 'n5_hidden_post' }],
        ['c_vesper', "And Ash? Gran doesn't know where I am. She'll be up all night with the kettle on.", "Gran doesn't know where I am.",
          { do: ['quest start q_n5_oona'], promise: 'q_n5_oona' }],
      ], else: [
        { cam: 'n5_hang_cam', s: 0.8 },
        ['narr', 'SNAP! Something drops out of the dark on a silk line, and the line breaks.', 'SNAP! Someone falls. The silk rope breaks!'],
        { place: ['c_vesper', 'n5_vesper_hang'], anim: ['c_vesper', 'hang'] },
        ['narr', 'A grey cloak. Dark hair with one silver streak. She grabs the edge of your island with one hand and hangs over the void.', 'It is Vesper! She hangs from the edge by one hand.'],
        ['c_vesper', "...Don't you dare say anything.", "Don't you dare say anything."],
        ['narr', "It's the clock hand all over again, the very first night you met.", 'It is just like the first night you met.'],
        { choose: 'n5_vesper_chance', ask: ['What do you do?', 'What do you do?'], pick: [
          { t: ['Grab her wrist and pull her up', 'Pull her up'], tone: 'kind', v: 'helped',
            then: ['trust friends +1', 'set n5_vesper', 'set n_vline', 'quest start q_n5_oona'],
            say: [
              ['c_vesper', '...You still do that. After everything I did to you.', 'You still do that. Even now.'],
              ['ash', 'You were going to fall.'],
              ['c_vesper', "She hid a post out there. I'll show you. Come on, cousin, let's go and annoy her.", 'She hid a post. Come on, cousin!'],
              ['c_vesper', "And Ash? Gran doesn't know where I am. She'll be up all night with the kettle on.", "Gran doesn't know where I am.", { promise: 'q_n5_oona' }],
            ] },
          { t: ["Pull her up, then give her Gran's letter", "Pull her up. Give her Gran's letter."], tone: 'kind', v: 'letter', if: 'item m_vletter',
            then: ['trust friends +1', 'set n5_vesper', 'set n5_vletter', 'set n_vline', 'take m_vletter', 'quest start q_n5_oona'],
            say: [
              ['narr', 'You pull her up. Then you give her the letter a moth carried off before she ever saw it.', 'You pull her up. You give her the letter.'],
              ['c_vesper', '"Come home when you\'re ready." ...Gran wrote this? To me? After I ran off?', '"Come home when you\'re ready." Gran wrote this?'],
              ['c_vesper', "I am NOT crying. Come on, cousin. She hid a post out there. Let's go and annoy her.", 'I am NOT crying. Come on, cousin!'],
              ['c_vesper', "And Ash? Gran doesn't know where I am. She'll be up all night with the kettle on.", "Gran doesn't know where I am.", { promise: 'q_n5_oona' }],
            ] },
          { t: ['Keep going', 'Keep going'], tone: 'brave', v: 'left',
            then: ['set n5_vesper_left', 'quest start q_n5_vesper'],
            say: [
              ['narr', 'You step past her. Behind you, she pulls herself up, all by herself.', 'You walk on. She climbs up by herself.'],
              ['c_vesper', "...I'll remember this, cousin.", "I'll remember this, cousin."],
            ] },
        ] },
      ] },
    ],
    // the foe Vesper (Act II foe): her real mask, cracked, and a note
    n_vesper_absent: [
      ['narr', "On the edge of the cliff lies a moth mask. A real one, not glass. It's cracked down the middle.", 'A real moth mask lies here. It is cracked.', { ref: 'n5_cracked_mask' }],
      ['narr', 'Under it is a scrap of paper. Two words: "Sorry. V."', 'A note says: "Sorry. V."'],
      ['ash', "...Me too, Vesper.", 'Me too, Vesper.'],
    ],
    ncl_mask: [
      ['narr', 'Vesper\'s moth mask, cracked down the middle. The note under it says: "Sorry. V."', 'The cracked mask. "Sorry. V."'],
    ],
    // the Gear Bridge: Ember's lantern for the little moth
    ncl_lantern: [
      ['narr', 'When the last weight landed, the scale plate tipped, and something flat slid out from under it.', 'Something flat slid out from under the plate.'],
      ['narr', 'It is a paper lantern, folded flat: a real Lantern Day lantern, very old, not glass. Someone has painted a little grey moth on it.', 'A real paper lantern. A little grey moth is painted on it.'],
      ['narr', 'Inside, in curly writing: "For my little night-moth. E."', '"For my little night-moth. E."', { clue: 'n5_night_moth' }],
      ['ash', 'E. ...Ember! Ember made the little moth a lantern of her very own!', 'E is for Ember! She made the moth a lantern!'],
    ],
    // Echo 2: x4_foes plays STORY.n_echo2_intro and STORY.n_echo2_outro (data versions; the hall is a ring of black
    // glass with two balconies, no moth lamps)
    n_echo2_intro: [
      ['narr', 'In a ring of black glass between two high balconies waits a masked figure. Blink, and there are three of her. Blink again, and there are five.', 'A masked shadow waits. Then there are lots of her!'],
      ['n_echo_vesper', 'The Heart will give my family its fire back. She promised me. She PROMISED.', 'The Heart will give my family fire. She promised!'],
      ['ash', 'She promised you all kinds of things, and none of them were true.', 'She promised lots of things. She lied.'],
      { if: { any: ['choice c_vesper=friend', 'flag n5_vesper'] }, then: [
        ['c_vesper', "Do I really stand like that, with my elbow out? Ugh. Help me knock her down before I die of shame.", "Do I really stand like that? Ugh. Let's knock her down."],
      ] },
      { if: 'flag n5_vesper_left', then: [
        ['narr', 'Up on a balcony, a real grey cloak flutters for a moment. Then it is gone.', 'Up on a balcony, a grey cloak flutters. Then it is gone.'],
      ] },
    ],
    n_echo2_outro: [
      ['narr', 'The shadow thief spins, stumbles, and pops into a cloud of moths.', 'The shadow thief pops into moths.'],
      ['narr', 'A memory hangs in the air: a small voice in a small room by the sea.', 'A memory floats by. A small voice by the sea.'],
      ['n_memory', "Granny, why can't I make fire like the stories?", "Granny, why can't I make fire?"],
      ['n_memory', "Oh, duck. Fire isn't the only warm thing.", 'Oh, duck. Fire is not the only warm thing.', { clue: 'n5_oona_warm' }],
      { if: { any: ['choice c_vesper=friend', 'flag n5_vesper'] }, then: [
        ['c_vesper', '...She still says that. Every night, with the kettle on.', 'She still says that every night.'],
        ['ash', "She's right."],
      ], else: [
        ['ash', 'I hope you heard that, Vesper, wherever you are.', 'I hope Vesper heard that.'],
      ] },
    ],
  },
})
