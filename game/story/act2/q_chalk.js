// game/story/act2/q_chalk.js (A2S): The Chalk Dragon (c_chalk). Giver: Old Barley, the sheepfold on the Downs.
// Mother Pearl cut a dragon into the chalk hill so her mother could see it from the sky. It has gone grey. Ash walks
// its outline in one go (two stretches need the Double Jump, a Husher or two try to scuff the line), then looks into
// its eye. Surprise: the eye is a little stone door, warm air breathes out, and words are carved inside it from Pearl
// to her mother (clue q_chalk_pearl for what_she_is). Payoff: a Heart Ember in the eye (x1_people's eye act gives it,
// with the Chalk Dragon Shrine and the updraft). Old saves: QDEFS.c_chalk steps 0..2 map to walk, eye, barley.
quest({
  id: 'c_chalk', act: 2, giver: 'c_barley', optional: true, takeover: true,
  title: ['The Chalk Dragon', 'The Chalk Dragon'],
  payoff: { kind: 'heart_ember', id: 'c_chalkeye' },
  old_steps: ['walk', 'eye', 'barley'],

  place: {
    // the carving inside the opened eye (the same spot as x1_world's sealed stone c_lm_sealed and x1_people's c_lm_eye)
    ch_eye_words: { map: 1, kind: 'examine', at: [6950, 21720], if: 'flag c_chalk_eye', say: 'ch_words',
      then: ['clue q_chalk_pearl'], look: 'a2s_eye_words', name: ['words carved inside the eye', 'carved words'] },
  },

  clue: {
    q_chalk_pearl: { icon: 'dragon', mystery: 'moth_mask',
      text: ["Inside the Chalk Dragon's eye, Pearl carved: FOR MOTHER. I CAN'T FLY OR BREATHE FIRE, SO I DREW YOU A DRAGON. P.",
        'Pearl had no fire. She drew her mom a dragon.'] },
  },

  step: [
    { id: 'walk', do: 'minigame c_chalkwalk', at: 'c_barley', start: 'talk', scene: 'ch_ready', lose: 'ch_lost',
      then: ['set c_chalk_drawn'],
      obj: ["Walk the Chalk Dragon's outline in one go (talk to Old Barley to start)", "Walk the Chalk Dragon's line. Talk to Barley."],
      hint: ['Step on every mark in order. Double Jump up the steep steps. Getting hit fades the last marks.', 'Every mark, in order. Don\'t get hit!'] },
    { id: 'eye', do: 'wait_for flag c_chalk_eye', legacy: true, marker: 'c_lm_eye',
      obj: ["Look into the dragon's eye at the top of the hill", "Look into the dragon's eye"] },
    { id: 'barley', do: 'talk c_barley', scene: 'ch_barley', then: ['give coins 40', 'xp 500'],
      obj: ['Tell Old Barley', 'Tell Old Barley'],
      extra: [{ do: 'examine ch_eye_words' }] },
  ],

  scene: {
    ch_offer: [
      ['c_barley', "See that grey shape on the hill? That's the Chalk Dragon. Mother Pearl cut it there, a thousand years back.",
        "See the grey shape? Pearl's Chalk Dragon."],
      ['c_barley', 'For her mother. So her mother, flying high, could look down and see a dragon waving up at her.', 'Her mom could see it from the sky.'],
      ['c_barley', "It's gone grey. Walk the old line for me? Your feet are warm. Chalk likes warm feet.", 'Walk the old line? Chalk likes warm feet.'],
      { choose: 'c_chalk_offer', ask: ['Walk the Chalk Dragon?'], pick: [
        { t: ["I'll make her white again.", 'I will do it!'], tone: 'kind', then: ['quest start c_chalk'],
          say: [['c_barley', "Talk to me when you're ready to start. Gerald will watch. Gerald will faint.", 'Tell me when you are ready.']] },
        { t: ['Maybe later', 'Later'], say: [['c_barley', 'Sit a while, then. The hill will still be there.', 'The hill will wait.']] },
      ] },
    ],
    ch_nojump: [
      ['c_barley', "Two bits of the line go up the steep steps. You'd want a good hop for those. Two hops, even.", 'You need a double hop for the steps.'],
    ],
    ch_ready: [
      ['c_barley', 'Step on every mark, in order, all the way round. Head, wing, tail, legs.', 'Step on every mark, in order.'],
      ['c_barley', "Two bits go up the steep steps, so hop high. Don't let anything knock you, or the line fades.", "Hop high. Don't get hit!"],
      ['c_barley', 'Ready, young dragon?'],
    ],
    ch_lost: [
      ['c_barley', "The wind's taken the dust. No matter. Talk to me and we'll try again.", 'The dust blew away. Try again?'],
    ],
    ch_words: [
      ['narr', 'Inside the little stone door, someone carved letters a long time ago. Neat ones, like a ship\'s log.',
        'Old letters are carved inside.'],
      ['narr', '"FOR MOTHER. I CAN\'T FLY AND I CAN\'T BREATHE FIRE, SO I DREW YOU A DRAGON. WAVE BACK. P."',
        '"FOR MOTHER. NO FIRE, SO I DREW YOU A DRAGON. P."'],
    ],
    ch_barley: [
      ['c_barley', 'I saw her from down here. White as a gull. Waving.', 'I saw her! White as a gull!'],
      ['c_barley', "My wife walked that line every spring. She'd have cried. I did, a bit.", 'My wife walked it every spring. I cried.'],
      ['narr', 'Behind him, Gerald faints.'],
      ['c_barley', "Here. It's what's in the tin. And the hill breathes warm now. Good for wings, that.", "Here's what's in the tin."],
    ],
  },

  talk: {
    c_barley: [
      { if: 'stage>=c_coast power dbljump !quest c_chalk active !quest c_chalk done', option: ['What is that shape on the hill?', 'What is on the hill?'],
        scene: 'ch_offer' },
      { if: 'stage>=c_coast !power dbljump !quest c_chalk done', option: ['What is that shape on the hill?', 'What is on the hill?'],
        scene: 'ch_nojump' },
    ],
  },
})
