// Act III, Chapter 5: The Dreadgate (owner A3b). Data only.
// What the player does: at the foot of Mount Dread, two black doors as tall as a castle and a Frost Lock as big as a
// cart. Tove: "How do we open THAT?" Nobody tells him. He looks at the lock (a ram carved butting a drum, cracks from
// the drum to the lock; his hottest blue fire only makes it sweat, the herring) and looks up at the mountain (the
// camera goes up: a stone drum with a ram's face on the shoulder, audit finding 5). With Pennant's clue (the monks
// rode the wind up and knocked) he works out in the Case Book how the gate opens. He names the vent's ribbon the Drum
// Wind (finding 6), rides it up, Ground Pounds the drum: BOOOOOM, the lock cracks, and Hush unfolds off the mountain.
// Hush says the Mother is resting, and the Mother's NEW friend is resting, up on top (the two clues the snow_mother
// question needs). The fight on the plaza is code (x2_foes). After it Hush shrinks to a tiny shivering moth: Ash
// gives her Ylva's long scarf, or tells her to get a sweater (G.choices.f_hush, new: Act IV and the finale read it).
// Vesper's lines are fixed (finding 9): Hush is one of HER moths, and Vesper followed the snow north.
// The old stage's own triggers (the arrival scene, the drum scene, Mom's letter) are steps here; the drum itself is
// still x2_story's pound listener, which plays STORY.f_drum (this file's f_drum, replaced in place).
chapter({
  id: 'f_dreadgate', act: 3, after: 'f_deep', next: 'f_dread', takeover: true,
  card: ['Act III · Chapter 5', 'The Dreadgate'],
  so_far: [
    'Ash can pound like a Stonehorn now. The old king said the monks drummed on the mountain, and "she always opened for them". At the foot of Mount Dread, the Dreadgate is locked tight.',
    'Ash can pound like a Stonehorn! Now open the Dreadgate.'],
  mom: [['Knocking on a MOUNTAIN? Wipe your feet first.', 'Knocking on a mountain? Wipe your feet.']],

  place: {
    // the Frost Lock (over x2_world's own lock prompt while the gate is shut)
    f3_frost_lock: { map: 2, at: [7300, 44196], r: 26, kind: 'examine', over: 'f_lm_dreadlock', if: '!flag f_hush_done',
                     name: 'the Frost Lock', h: 70 },
    // a spot on the plaza where the shoulder and its drum are in sight (verified open, level 1)
    f3_drum_look: { map: 2, at: [7450, 44250], r: 26, kind: 'examine', if: '!flag f_drum', name: 'the mountain',
                    prompt: ['Look up at the mountain', 'Look up'], h: 50 },
    // the big vent on the Dreadmoor where x2_world's ribbon f_rib_windroad starts (8800,44450): the Drum Wind
    f3_drum_wind: { map: 2, at: [8800, 44450], r: 150, kind: 'spot', name: 'the Drum Wind' },
    // Hush unfolding from the mountainside next to the drum (a look, v10_art3b.js; nothing is drawn until the drum
    // scene sets it to unfold, and it is gone again when she glides down)
    f3_hush_rise: { map: 2, at: [8290, 43480], kind: 'prop', look: 'hush_rise', name: 'Hush' },
    // the tiny Hush after the fight, in the snow in the middle of the plaza (look hush_small: fallen, scarf, away)
    f3_hush_small: { map: 2, at: [7300, 44330], kind: 'prop', look: 'hush_small', name: 'a little white moth' },
  },

  clue: {
    f3_gate_carving: { icon: 'key', mystery: 'long_winter',
      text: ['Carved on the Frost Lock: a ram butting a round drum with his head. Cracks run all the way from the drum down to the lock.', 'On the lock: a ram butts a drum. Cracks run to the lock.'] },
    f3_lock_sweats: { icon: 'fire', herring: true, mystery: 'long_winter',
      text: ['Your hottest blue fire only makes the Frost Lock sweat. Maybe it needs even MORE fire?', 'Blue fire only makes the lock sweat. More fire?'] },
    f3_drum_seen: { icon: 'eye', mystery: 'long_winter',
      text: ['High on the mountain\'s shoulder sits a round stone drum with a ram\'s face carved on it.', 'High on the mountain sits a stone drum with a ram\'s face.'] },
    f3_the_mother: { icon: 'moth', herring: true, mystery: 'long_winter',
      text: ['Hush says "the Mother is resting". The moths have a Mother. Hearthold\'s song has a Snow Mother. Are they the same?', 'Hush says "the Mother is resting".'] },
    f3_hush_friend: { icon: 'moth', mystery: 'long_winter',
      text: ['Hush says the Mother\'s NEW friend is resting too, up on top of the mountain.', 'Hush says the Mother\'s NEW friend rests on top.'] },
  },

  deduce: {
    how_open: {
      mystery: 'long_winter',
      ask: ['How does the Dreadgate open?', 'How does the gate open?'],
      needs: ['f3_gate_carving', 'f3_drum_seen', 'f3_climbers'],
      bonus: ['f3_good_drumming', 'f3_knock_door'],
      pick: [
        { t: ['Melt the Frost Lock with Blaze', 'Melt the lock'],
          hint: ['You gave it your hottest fire and it only sweated. Look at the carving: is the ram breathing fire?', 'Fire only made it sweat. Look at the carving.'] },
        { t: ['Blast it with bombs', 'Blast it with bombs'],
          hint: ['The carving shows a ram, not a boom. And all of Hearthold would hear it for a week.', 'The carving shows a ram, not a boom.'] },
        { t: ['Ride the wind up to the stone drum and KNOCK on it with a Ground Pound', 'Ride up to the drum and knock'], right: true },
      ],
      then: ['set f3_how_open'],
    },
  },

  step: [
    { id: 'arrive', do: 'goto f_dreadgate_plaza 300', scene: 'f3_dg_arrive', migrate_if: 'flag f_drum',
      obj: ['Go to the Dreadgate at the foot of Mount Dread', 'Go to the Dreadgate'],
      hint: ['The Dreadgate stands at the foot of Mount Dread, at the top of the Dreadmoor north of Hearthold.', 'Go north, up the Dreadmoor.'] },
    { id: 'look', do: 'all', migrate_if: 'flag f_drum',
      obj: ['Find out how the Dreadgate opens', 'Look around the gate'],
      hint: ['Doors love clues. Look closely at the Frost Lock. And look up.', 'Look at the lock. And look up.'],
      parts: [
        { do: 'examine f3_frost_lock', scene: 'f3_look_lock', then: ['clue f3_gate_carving', 'clue f3_lock_sweats'] },
        { do: 'examine f3_drum_look', scene: 'f3_look_drum', then: ['clue f3_drum_seen'] },
      ] },
    // (Mom's letter, "you are about to climb a mountain to visit your AUNT", comes once he knows he is going up)
    { id: 'deduce', do: 'deduce how_open', scene: 'f3_how_solved', migrate_if: 'flag f_drum', then: ['mail f_pb_3'],
      obj: ['How does the Dreadgate open? Work it out in the Case Book', 'Open the Case Book'],
      hint: ['The carving on the lock, the drum up high, and what Brother Pennant said the monks did every spring. Open the Case Book.', 'Open the Case Book.'],
      // (a save from before the Case Book never heard Pennant's clue: it is given back here, so the question can be asked)
      extra: [ { do: 'wait_for !clue f3_climbers', then: ['clue f3_climbers'] } ] },
    { id: 'ride', do: 'goto f_shoulder 200', marker: 'f3_drum_wind', migrate_if: 'flag f_drum',
      obj: ['Ride the Drum Wind up to the Drum Stone', 'Ride the Drum Wind up'],
      hint: ['The Drum Wind starts at the big vent on the Dreadmoor, east of the gate. Jump into the swirl.', 'Jump into the swirl at the big vent.'] },
    // x2_story's pound listener rings the drum (G.flags.f_drum) and plays STORY.f_drum, which is the scene below
    { id: 'knock', do: 'wait_for flag f_drum', at: 'f_lm_drum',
      obj: ['Knock on the Drum Stone: jump, then POUND', 'Jump, then POUND the drum!'],
      hint: ['Jump, then press attack in the air to slam down on the drum. Like a sack of anvils.', 'Jump, then slam down on the drum!'] },
    // the fight is x2_foes' (the plaza site opens with f_drum); its intro and outro are the scenes below, in place
    // (then: Hush's two clues again, in case the drum scene was ever skipped: snow_mother cannot be asked without them)
    { id: 'hush', do: 'fight f_hush', at: 'f_dreadgate_plaza', then: ['clue f3_the_mother', 'clue f3_hush_friend', 'stage f_dread'],
      obj: ['Ride the wind back down and face Hush at the Dreadgate', 'Face Hush at the Dreadgate'],
      hint: ['Moths love lamps. Every moth. Light the lamps on the plaza and she can\'t help herself.', 'Light the lamps on the plaza!'] },
  ],

  scene: {
    f3_dg_arrive: [
      { cam: 'f_dread_door', s: 1.5 },
      ['narr', 'The Dreadgate. Two doors of black ice as tall as a castle, carved with a dragon curled around the moon. In the middle hangs a lock as big as a cart, sealed with purple frost.', 'The Dreadgate: two black ice doors, tall as a castle. A huge frozen lock.', { ref: 'f_dread_door' }],
      ['narr', 'The wind off the mountain is so cold it has a sound. It goes "nnnnnn".', 'The wind is so cold it goes "nnnnnn".'],
      ['tove', 'Well. That\'s a door.', 'Well. That\'s a door.'],
      ['ash', 'How do we open THAT?', 'How do we open THAT?'],
      ['tove', 'No idea. Look around. Doors always leave clues. Doors LOVE clues.', 'No idea. Look around. Doors love clues.'],
    ],
    f3_look_lock: [
      ['narr', 'The Frost Lock hums. Carved into its face: a ram, butting a round drum with his head. Cracks run all the way from the drum down to the lock.', 'Carved on the lock: a ram butts a drum. Cracks run down to the lock.'],
      ['ash', 'Or I could just melt it.', 'Or I could just melt it.'],
      ['narr', 'You breathe your hottest blue fire on the lock. It sweats. One drip runs down. Then it freezes again, harder than before.', 'Your blue fire makes it sweat. Then it freezes harder.'],
      ['tove', 'Hm. Maybe it needs even MORE fire?', 'Maybe it needs MORE fire?'],
    ],
    f3_look_drum: [
      { cam: 'f_lm_drum', s: 1.5 },
      ['narr', 'You look up. High on the mountain\'s shoulder, above the snow, sits a round stone drum with a ram\'s face carved on it.', 'High on the mountain sits a stone drum with a ram\'s face.', { ref: 'f_lm_drum' }],
      ['ash', 'A drum. On a mountain. Who plays a drum on a MOUNTAIN?', 'Who plays a drum on a MOUNTAIN?'],
    ],
    f3_how_solved: [
      ['ash', 'The ram on the lock is knocking on a drum. The monks rode the wind up the mountain and knocked. So I ride up to that drum and KNOCK!', 'The ram knocks on a drum. So I ride up there and KNOCK!'],
      ['tove', 'With your head?', 'With your head?'],
      ['ash', 'With my FEET. Jump, then POUND!', 'With my FEET. Jump, then POUND!'],
      ['tove', 'Then look at that big vent on the moor, east of here. Its wind goes all the way up to the drum. Let\'s call it the Drum Wind.', 'The big vent east of here blows up to the drum. The Drum Wind!',
        { dir: ['f_dreadgate_plaza', 'f3_drum_wind', 'east'] }],
    ],

    // ---- old STORY keys, replaced in place (x2_story and x2_foes play them)
    // the knock on the Drum Stone (x2_story's f2sDrum plays it the moment the drum is pounded): 10 lines
    f_drum: [
      ['narr', 'BOOOOOOM.', 'BOOOOOOM.'],
      ['narr', 'The sound rolls down the mountain like a wave. Snow jumps off every rock. Far below, a long crack runs across the Frost Lock.', 'The sound rolls down the mountain. Far below, the lock cracks.', { ref: 'f_lm_dreadlock' }],
      ['narr', 'Then something white unfolds from the mountainside beside you: two wings with purple eyes painted on them, and two real eyes in the middle, blinking at you.', 'Something white unfolds: wings with painted eyes, and two real eyes.', { do: ['world f3_hush_rise unfold'] }],
      ['f_hush', 'Shhhhh. Shhhh, little ember. You\'re so LOUD.', 'Shhhh, little ember. You\'re so LOUD.'],
      ['f_hush', 'The Mother is resting.', 'The Mother is resting.', { clue: 'f3_the_mother' }],
      ['f_hush', 'And the Mother\'s new friend is resting, up on top. Everyone is resting. Why don\'t you rest too?', 'The Mother\'s new friend rests on top. Rest too.', { clue: 'f3_hush_friend' }],
      ['ash', 'Who\'s "the Mother"?', 'Who\'s "the Mother"?'],
      ['f_hush', 'Shhhhh.', 'Shhhhh.'],
      ['ash', 'That is not an answer!', 'That is not an answer!'],
      ['narr', 'The great moth glides away down to the Dreadgate. Ride the wind back down and face her!', 'The moth glides down to the Dreadgate. Go and face her!', { do: ['world f3_hush_rise gone'], ref: 'f_dreadgate_plaza' }],
    ],
    // before the fight (x2_foes' boss intro): Vesper drops in if she is Ash's friend
    f_hush_intro: [
      ['f_hush', 'Shhh. Sleep now.', 'Shhh. Sleep now.'],
      { if: 'choice c_vesper=friend', then: [
        ['c_vesper', 'Hello, cousin. Miss me?', 'Hello, cousin. Miss me?'],
        ['ash', 'Vesper! How did you get all the way up here?', 'Vesper! How did you get here?'],
        ['c_vesper', 'I followed the snow. Snow in June is suspicious.', 'I followed the snow. Snow in June is suspicious.'],
        ['c_vesper', 'And THAT is one of her moths. I know those painted eyes. Let\'s make it LOUD.', 'That is one of HER moths. Let\'s be LOUD!', { do: ['set f_vesper_hush'] }] ] },
    ],
    // right after the fight (x2_foes' boss outro, then its onWin opens the gate): at most 6 lines a branch
    f_hush_outro: [
      { cam: 'f3_hush_small', s: 0.8 }, { do: ['world f3_hush_small fallen'] },
      ['narr', 'Hush tumbles down into the snow. As she falls, she shrinks. And shrinks. Until she\'s just a little white moth, shivering in the snow.', 'Hush falls and shrinks into a little white moth. She shivers.'],
      { choose: 'f_hush', who: 'f_hush',
        ask: ['...Cold. It\'s so cold out here. The Mother promised a warm dark. A soft dark. Forever and ever.', 'Cold. So cold. The Mother promised a warm dark.'],
        pick: [
          { t: ['Wrap her in Ylva\'s long red scarf', 'Give her the scarf'], tone: 'kind', v: 'scarf', if: 'item f3_scarf',
            then: ['take f3_scarf', { journal: ['You wrapped Hush in Ylva\'s long red scarf.', 'You gave Hush the scarf.'], key: 'f_hush' }],
            say: [
              ['narr', 'You wind one end of Ylva\'s red scarf around the tiny moth. Twice. She looks like a very small present.', 'You wrap the tiny moth in the red scarf. Twice.', { do: ['world f3_hush_small scarf'] }],
              ['f_hush', '...Oh. Warm.', 'Oh. Warm.'] ] },
          { t: ['"Get a sweater, little moth."', '"Get a sweater, little moth."'], tone: 'brave', v: 'shoo',
            then: [{ journal: ['You told Hush to get a sweater.', 'You told Hush to get a sweater.'], key: 'f_hush' }],
            say: [
              ['ash', 'Get a sweater, little moth.', 'Get a sweater, little moth.'] ] },
        ] },
      ['narr', 'She flutters up toward the moon and is gone. Behind you, the Frost Lock cracks apart, CRACK, and the Dreadgate swings open.', 'She flies up to the moon. CRACK! The lock breaks. The gate opens!',
        { do: ['world f3_hush_small away'], ref: 'f_dread_door' }],
      { if: 'choice c_vesper=friend', then: [
        ['c_vesper', 'Go on, cousin. I\'ll watch the gate. Thieves are very good at watching gates.', 'Go on, cousin. I\'ll watch the gate.', { ref: 'f_dread_door' }] ] },
    ],
  },
})
