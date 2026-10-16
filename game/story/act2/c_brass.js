// game/story/act2/c_brass.js (A2a): Act II, "The Brassworks".
// What the player does: climbs the Great Clock with the new claws and searches the Moth's Nest, Vesper's hideout in
// the bell loft: everything she ever stole lies glowing in a circle under the window (nothing sold), her dream diary
// says the Lady of the Moths wants light and promised that Gran will be warm, Gran's letters say "Dear Vesper", a tin
// of biscuits says FOR GRAN (eat one, or leave them: trust K3), and Pip steals a note back from a brass magpie (Pip
// learns Fetch). The player works out why she only steals glowing things, asks Clockkeeper Ambrose how to wake the
// clock, climbs Pearl's smokestack into the Brassworks (the dungeon stays code), and finds a hanky by the gate with a
// note from Vesper. Then, on screen, the Great Clock strikes, and on a chimney beside it Vesper pushes her mask up.
chapter({
  id: 'c_brass', act: 2, after: 'c_claws', next: 'c_light', takeover: true,
  card: ['Act II · Chapter 6', 'The Brassworks'],
  so_far: [
    "Ash climbed the Great Clock and searched Vesper's hideout. She keeps everything she steals, because the Lady of the Moths in her dreams wants light, and promised her gran would be warm. Ash woke the Great Clock from the Brassworks, and Vesper pushed her mask up to watch.",
    "Vesper steals light for a dream Lady. Then everyone saw her face."],
  hint: ['Climb the Great Clock to the hatch at the very top. Then ask Clockkeeper Ambrose. The way into the Brassworks is up its old smokestack in the Brass Yards.',
    'Climb the clock. Ask the Clockkeeper. Then climb the smokestack.'],
  mom: [['Claws! Mind the furniture.', 'Claws! Mind the furniture.']],
  // x1_story.js plays these by itself (c1Tick in the Nest, the old c_brass talk and update): the engine marks them seen.
  // (Duchess on the clock top is left to x1_story and x1_people as today: c_duchess is not silenced.)
  silence: ['c_nest', 'c_pip_fetch', 'c_ambrose', 'c_clock_bong', 'c_whirl_brass_t'],

  item: {
    c_diary: { name: ["Vesper's dream diary", "Vesper's dream diary"],
      desc: ['A little book with a moon on the cover. One page is read so often it has gone soft.', 'A little book with a moon on it.'],
      icon: 'book', keepsake: true },
    c_letters: { name: ["Gran's letters", "Gran's letters"],
      desc: ['"Dear Vesper. Do not climb anything tall. Love, Gran."', '"Dear Vesper. Love, Gran."'],
      icon: 'letter', keepsake: true },
  },

  place: {
    // inside the Moth's Nest (layout coordinates of x1_story.js c1NestLayout: 520 x 360, the door is at 260, 326)
    nest_floor: { map: 1, area: 'c_mothnest', at: [260, 250], r: 400, kind: 'spot', name: "the Moth's Nest" },
    nest_glow_pile: { map: 1, area: 'c_mothnest', at: [128, 92], r: 28, kind: 'examine', look: 'a2a_glow_pile',
      name: 'a circle of glowing things under the window' },
    nest_diary: { map: 1, area: 'c_mothnest', at: [172, 214], r: 14, kind: 'examine', look: 'a2a_moon_diary',
      states: { taken: 'a2a_empty' }, name: 'a little book with a moon on it' },
    nest_letters: { map: 1, area: 'c_mothnest', at: [418, 150], r: 14, kind: 'examine', look: 'a2a_letters',
      states: { taken: 'a2a_empty' }, name: 'a bundle of letters on the crate' },
    // drawn on the bell (the look lifts it 30 px) and on its beam (the look lifts it 78 px), sorted just after the bell
    nest_note2: { map: 1, area: 'c_mothnest', at: [262, 116], kind: 'prop', look: 'a2a_bell_note',
      states: { taken: 'a2a_empty' }, name: 'a note pinned to the bell' },
    nest_magpie: { map: 1, area: 'c_mothnest', at: [288, 118], kind: 'prop', look: 'a2a_magpie', name: 'a brass magpie on the beam' },
    // outside the Brassworks, between its signpost (c_sign_works, 10000, 24900) and Pearl's warp landing
    bw_gate_hanky: { map: 1, at: [10100, 24905], r: 18, kind: 'examine', look: 'a2a_hanky', states: { taken: 'a2a_empty' },
      name: 'a hanky tied to a stake by the gate', aliases: ['the hanky', "Vesper's hanky"] },
    // the chimney by the Great Clock where she unmasks (the 'unmask' pose sits her on its cap, 52 px up)
    gh_vesper_perch: { map: 1, at: [7230, 24411], kind: 'npc_spot', name: 'a chimney by the Great Clock' },
  },

  clue: {
    b_glow_pile: { icon: 'pile',
      text: ['Under the window of the Nest lies everything she ever stole, in a neat circle. Nothing sold. Every single thing glows.',
        'Everything she stole is in a circle. It all glows.'] },
    b_dream_page: { icon: 'book',
      text: ['Her dream diary: "The Lady of the Moths came again. She says: bring her light, and Gran will be warm."',
        '"Bring the Lady light, and Gran will be warm."'] },
    b_letters: { icon: 'letter',
      text: ['Gran\'s letters in the Nest all begin "Dear Vesper". The Moth Mask really is Vesper Saltwhistle.',
        'Gran\'s letters say "Dear Vesper".'] },
  },

  deduce: {
    why_glowing: {
      mystery: 'moth_mask',
      ask: ['Why does Vesper only steal things that glow?', 'Why does she take glowing things?'],
      needs: ['g_robberies', 'b_glow_pile', 'b_dream_page'],
      bonus: ['q_oona_lady', 'q_pearl_moth'],
      pick: [
        { t: ['Someone in her dreams wants the light, and promised to make Gran warm',
          'The Lady in her dreams wants it, for Gran.'], right: true },
        { t: ['She sells it all for coal', 'She sells it'],
          hint: ['Look at the pile under the window again. Is anything missing?', 'Is anything missing from the pile?'] },
        { t: ["She's scared of the dark", 'She is scared of the dark'],
          hint: ['She runs across the rooftops every night. In the dark.', 'She runs the roofs at night!'] },
      ],
      then: ['xp 600'],
    },
  },

  step: [
    { id: 'nest', do: 'goto nest_floor 300', at: 'c_nest_hatch', scene: 'brs_nest', then: ['set c_nest'],
      obj: ['Climb the Great Clock to the hatch at the very top', 'Climb to the top of the Great Clock'],
      hint: ['Walk into the Great Clock with your new claws and climb. The hatch is on the very top.', 'Climb the clock with your claws.'] },
    { id: 'search', do: 'all', obj: ["Search the Moth's Nest", "Search the Moth's Nest"],
      hint: ['Look at everything: under the window, by the hammock, on the crate, the biscuit tin and the great bell.', 'Look at everything in the Nest.'],
      parts: [
        { do: 'examine nest_glow_pile', scene: 'brs_pile', then: ['clue b_glow_pile'] },
        { do: 'examine nest_diary', scene: 'brs_diary', then: ['give c_diary', 'world nest_diary taken'] },
        { do: 'examine nest_letters', scene: 'brs_letters', then: ['clue b_letters', 'give c_letters', 'world nest_letters taken'] },
        { do: 'examine nest_tin', scene: 'brs_tin' },
        { do: 'examine nest_bell', scene: 'brs_bell', then: ['world nest_note2 taken', 'quest start c_notes'] },
      ] },
    { id: 'why', do: 'deduce why_glowing', obj: ['Work out why she steals light, in the Case Book', 'Open the Case Book'] },
    { id: 'ambrose', do: 'talk c_ambrose', scene: 'brs_ambrose', then: ['set c_ambrose'],
      obj: ['Ask Clockkeeper Ambrose how to wake the Great Clock', 'Ask the Clockkeeper'],
      hint: ["Ambrose's workshop door is at the foot of the Great Clock.", 'His door is at the foot of the clock.'] },
    { id: 'works', do: 'dungeon c_brassworks', at: 'bw_roof_hatch',
      obj: ['Climb the old smokestack in the Brass Yards and restart the Great Clock', 'Climb the smokestack. Restart the clock.'],
      hint: ['The Brass Yards are past the end of the Upper Town. Climb the smokestack with your claws. The hatch is on top.', 'Climb the smokestack. The hatch is on top.'] },
    // Pearl's warp at the end of the Brassworks sets Ash down outside its gate (x1_dun_a.js D1A_WARP: 10210, 24915),
    // a few steps from the hanky Vesper left there (trust K3 shows here), then the clock strikes and she unmasks
    { id: 'hanky', do: 'examine bw_gate_hanky', scene: 'brs_hanky', then: ['world bw_gate_hanky taken'],
      obj: ['Look at the hanky tied up by the Brassworks gate', 'Look at the hanky by the gate'] },
    { id: 'bong', do: 'cutscene brs_bong', then: ['set c_clock_on', 'set c_brass_done', 'stage c_light'],
      obj: ['Listen!', 'Listen!'] },
  ],

  scene: {
    brs_nest: [
      ['narr', 'The bell loft at the top of the Great Clock. Somebody LIVES up here.', 'The bell loft. Somebody LIVES up here!'],
      ['narr', 'A hammock made from an old sail. Moth drawings pinned on every beam. A blanket that smells of the sea.', 'A hammock. Moth drawings. A blanket that smells of the sea.'],
      ['ash', "Her hideout. Pip, don't touch anything.", "Her hideout. Pip, don't touch anything."],
      { if: 'flag pip', then: [['narr', 'Pip touches everything.', 'Pip touches everything.']] },
    ],
    brs_pile: [
      ['narr', 'Under the window, laid out in a neat circle like a present: everything the Moth Mask ever stole.', 'Under the window, in a circle: everything she stole.'],
      ['narr', "A glow-lamp. A jar of glowworms. A moon-dial. Lord Whirligig's gold candlestick. They all shine.", 'A glow-lamp. Glowworms. A gold candlestick. All shining.'],
      ['narr', "And Bob's hat. It has a little glowing badge on the front.", "And Bob's hat. It has a glowing badge!"],
      { if: 'flag c_chase=helped', then: [['narr', "And Lord Whirligig's new bird clock. Its little bird glows.", 'And the bird clock. Its bird glows.']] },
      ['ash', "She didn't sell any of it. It's all just... here. Glowing.", 'She sold nothing. It is all here, glowing.'],
    ],
    brs_diary: [
      ['narr', 'By the hammock: a little book with a moon on the cover. A dream diary.', 'A little book with a moon on it. A dream diary.'],
      ['narr', 'One page has been read so many times it has gone soft as cloth.', 'One page has been read so many times.'],
      ['narr', '"The Lady of the Moths came again. She says: bring her light, and Gran will be warm."', '"Bring the Lady light, and Gran will be warm."', { clue: 'b_dream_page' }],
      ['narr', '"And bring the warm stone to the Spire at moonrise. Then I will be real."', '"Bring the warm stone to the Spire."'],
      ['ash', "The Spire? There isn't a spire. And who is the LADY?", 'What Spire? And who is the LADY?'],
    ],
    brs_letters: [
      ['narr', 'On the crate: a bundle of letters tied with string, in shaky handwriting.', 'Letters on the crate, in shaky writing.'],
      ['narr', '"Dear Vesper. Do not climb anything tall. Love, Gran. P.S. Thank you for the fish."', '"Dear Vesper. Do not climb anything tall. Love, Gran."'],
      ['ash', 'Dear VESPER. I knew it!'],
    ],
    // trust K3: leave Gran's biscuits (kind) or eat one (funny, costs nothing); the gate note at the end shows which
    brs_tin: [
      ['narr', 'A biscuit tin. Inside: three biscuits and a note.', 'A biscuit tin. Three biscuits and a note.'],
      ['narr', '"FOR GRAN. NOT FOR ME. NOT EVEN ONE."', '"FOR GRAN. NOT FOR ME."'],
      ['ash', 'They smell AMAZING.'],
      { if: 'flag pip', then: [['pip', 'Mip!']] },
      { choose: 'c_biscuits', ask: ['What do you do?', 'What do you do?'], pick: [
        { t: ["Put the lid back on. They're for Gran.", 'Leave them for Gran'], tone: 'kind',
          then: ['set c_biscuits=left', 'trust vesper +1'],
          say: [['narr', 'You put the lid back on. Very, very carefully.', 'You put the lid back on. Carefully.']] },
        { t: ['Eat one. Just ONE.', 'Eat one'], tone: 'silly',
          then: ['set c_biscuits=ate'],
          say: [
            ['narr', 'It is the best biscuit you have ever eaten.', 'It is the best biscuit ever.'],
            ['ash', 'I feel terrible. ...I feel GREAT. ...No. Terrible.', 'I feel terrible. No, GREAT. No. Terrible.']] },
      ] },
    ],
    // note 2 (and Pip's Fetch, if Pip is with Ash); the note's words depend on what Ash said on the cliff (trust K2)
    brs_bell: [
      ['narr', 'A note is pinned to the great bell. You unpin it.', 'A note is pinned to the bell.'],
      { if: 'flag pip', then: [
        ['narr', 'CLACK! A brass magpie swoops off the beam, snatches the note out of your claws, and flaps back up.', 'CLACK! A brass magpie grabs the note and flies up!'],
        ['ash', 'Hey! Give that back, you tin chicken!', 'Hey! Give it back, you tin chicken!'],
        ['narr', 'Pip goes very still. He has watched a certain thief do this on every roof in town. He took notes.', 'Pip goes very still. He watched the thief do this.'],
        ['narr', 'ZIP! Pip plucks the note from its beak and lands back on your head.', 'ZIP! Pip grabs the note back!'],
        ['ash', "Pip! That's stealing! ...From a thief. So it's fine. Good boy!", 'Pip! You stole it back! Good boy!'],
        ['narr', 'The magpie sulks back to its nest. Its nest is made entirely of teaspoons.', 'The magpie sulks. Its nest is made of teaspoons.'],
        { do: ['set c_pip_fetch', { banner: ['Pip learned Fetch!', 'Pip can Fetch!'] }] }] },
      { if: 'flag c_cliff=gran', then: [
        ['narr', '"Stop following me. Gran\'s fine. She\'s always cold. It\'s not your problem. V."', '"Stop following me. Gran is fine. V."']] },
      { if: '!flag c_cliff=gran', then: [
        ['narr', '"If you can read this, you can climb. Stop it. M."', '"You can climb? Stop it. M."']] },
      ['narr', 'Underneath, smaller: "My other drops are none of your business either."', 'Smaller: "My other notes are none of your business."'],
    ],
    brs_ambrose: [
      ['c_ambrose', 'Eh? You were up in my bell loft? On the OUTSIDE of my clock? Tick.', 'You climbed my clock? On the OUTSIDE? Tick.'],
      ['ash', 'Somebody LIVES up there!'],
      ['c_ambrose', 'The girl? I know. She sweeps the bell for me. Never asked her to. Tick.', 'The girl? She sweeps my bell. Tick.'],
      ['ash', 'How do we make the clock go again?', 'How do we make the clock go?'],
      ['c_ambrose', "Her heart's not up top, young dragon. It's DOWN. In the Brassworks. The great drive is jammed.", 'Her heart is down in the Brassworks. It is jammed.'],
      ['c_ambrose', 'Lord Whirligig locked the gate, and the dust stuck it shut. But Mother Pearl built a chimney there. She never could resist a chimney.',
        'The gate is stuck. But Pearl built a chimney there.', { promise: 'bw_roof_hatch', ref: 'bw_front_gate' }],
      ['ash', 'A chimney. I have CLAWS now.', 'A chimney! I have CLAWS now.'],
      ['c_ambrose', 'Eh? PAWS? Lovely. Tick... tock.', 'Eh? PAWS? Lovely. Tick... tock.'],
    ],
    // outdoors by the Brassworks gate: Vesper was in the Nest after Ash, and knows what he did with the biscuits
    brs_hanky: [
      ['narr', 'Somebody has tied a hanky to a stake by the gate, with a note.', 'A hanky is tied up by the gate, with a note.', { ref: 'bw_front_gate' }],
      { if: 'flag c_biscuits=left', then: [
        ['narr', 'Inside the hanky: one biscuit. "You didn\'t eat Gran\'s biscuits. Weird. Here\'s one. ONE. V."', 'One biscuit inside! "Here is one. ONE. V."', { do: ['give c_biscuit 1'] }]] },
      { if: 'flag c_biscuits=ate', then: [
        ['narr', 'Inside the hanky: crumbs. "Somebody ate one of Gran\'s biscuits. I COUNTED. V."', 'Crumbs inside! "Somebody ate Gran\'s biscuit. V."']] },
      ['ash', "She was in the Nest right after me. She's always one roof ahead.", 'She is always one roof ahead!'],
    ],
    // the Great Clock strikes, and on a chimney beside it Vesper pushes her mask up (on screen; the camera goes there)
    brs_bong: [
      { cam: 'c_great_clock', s: 1.5 },
      ['narr', 'Far across the town, something enormous goes CLUNK. Then every clock on every roof starts ticking.', 'Far away: CLUNK! Every clock in town starts ticking.', { do: ['set c_clock_on'] }],
      { sfx: 'bell' },
      ['narr', 'BONG! BONG! BONG! Twelve times. It is not midnight. The Great Clock does not care.', 'BONG! BONG! BONG! Twelve times!'],
      { place: ['c_mask', 'gh_vesper_perch'] }, { anim: ['c_mask', 'unmask'] }, { cam: 'gh_vesper_perch', s: 1 },
      ['narr', 'On a chimney beside the clock, a girl in a grey cloak pushes her mask up, to see better.', 'On a chimney, a girl pushes her mask up.'],
      ['narr', "Dark hair. One silver streak. Freckles. She's grinning at the clock like it's a birthday cake.", 'Dark hair, a silver streak, freckles. She is grinning.'],
      { if: 'flag c_cliff=gran', then: [
        ['narr', 'She looks across the rooftops, right at you, and waves. Then the mask comes down.', 'She looks right at you. She waves. The mask comes down.']] },
      { if: '!flag c_cliff=gran', then: [
        ['narr', 'Then the mask comes down, and she is gone over the roofs.', 'The mask comes down. She is gone.']] },
      { do: ['despawn c_mask', { banner: ['GEARHAVEN GAZETTE: CLOCK SAVED BY LIZARD! MOTH MASK HAS A FACE!', 'GAZETTE: MOTH MASK HAS A FACE!'] }] },
    ],
  },

  talk: {
    c_ambrose: [
      { if: 'stage>=c_brass !seen brs_nest', say: ["Eh? The clock? Yes, she's stopped. Somebody lives up in her bell loft, you know. Climbs up the outside. Tick.",
        'The clock stopped. Somebody lives up in the bell loft. Tick.'] },
    ],
    c_hester: [
      { if: 'flag c_clock_on', once: true, say: ['Twelve bongs. Exactly twelve. I counted. I could cry. I will not. It would be inefficient.', 'Twelve bongs. Exactly twelve. I counted.'] },
    ],
    c_whirligig: [
      { if: 'flag c_clock_on', once: true, say: ['My clocks! My lovely clocks! ...Dragon. You did this? Hmph. Well. Thank you. Wipe your feet next time.', 'My clocks! You did this? Hmph. Thank you.'] },
    ],
    c_penny: [
      { if: 'flag c_clock_on', once: true, say: ['MOTH MASK HAS A FACE! Did you SEE it? I saw it. From really far away. I am going to need a bigger notebook.', 'MOTH MASK HAS A FACE! I need a bigger notebook!'] },
    ],
    c_oona: [
      { if: 'flag c_biscuits=ate', once: true, say: ['Vesper says a dragon ate one of my biscuits. She was FURIOUS. I laughed so hard I had to sit down.', 'A dragon ate my biscuit? Ha! Vesper was FURIOUS.'] },
      { if: 'flag c_biscuits=left', once: true, say: ['Vesper brought me my biscuits. Well, two. She said the third went to a dragon who deserved it. Was that you, duck?', 'Vesper brought me two biscuits. A dragon got one. You?'] },
    ],
  },
})
