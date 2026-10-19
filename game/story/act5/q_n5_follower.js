// game/story/act5/q_n5_follower.js (N5S): the small mystery "Who is following you up the mountain?" (n5_follower,
// FINALE_V10 2.3 and 2.9 B6). The tassel on the first Bridgefoot lantern is chewed to a soggy stub, still wet. Two-toed
// prints go straight up the Chalk Climb, where only claws should get you. Above the Rime Shrine something says "Meh."
// The Silent Green has a shadow goat in a copied pen (the red herring: it never moves, never chews). At home, Duchess's
// pen at Hollis Farm is empty, with a note on the post: "Gone out. Again."
// Surprise: Hollis didn't write the note. He can't spell "again". It is signed with a muddy hoofprint.
// Payoff: a Heart Ember from Duchess's hay (heart_ember n5_hollis) and Hollis's sock goat horns (keepsake n5_goathorns).
// N5b's dawn reads `solved n5_who_follows` ("DUCHESS! I KNEW it!"). The quest starts at the tassel.
quest({
  id: 'q_n5_follower', act: 5, optional: true,
  title: ['Who Is Following You?', 'Who is following you?'],
  payoff: { kind: 'heart_ember', id: 'n5_hollis' },

  item: {
    n5_goathorns: { name: ['Sock goat horns', 'Goat horns'], icon: 'star', keepsake: true, hat: { look: 'hat_n5_goathorns', col: '#e8e0cc' },
      desc: ['Farmer Hollis made them from a sock, for the fair. You already have horns. Now you have more horns.',
        'Sock goat horns. Now you have more horns!'] },
  },

  place: {
    // the first Bridgefoot lantern (x4_ascent N4A_LAN n_lan_green at 4200,89640): its tassel at the lantern's foot
    n5_f_tassel: { map: 4, kind: 'examine', at: [4230, 89668], r: 20, h: 22, look: 'n5_chewed_tassel', states: { seen: 'n5_chewed_tassel' },
      name: ['a chewed lantern tassel', 'a chewed tassel'], if: 'act>=5', say: 'n5_tassel', then: ['quest start q_n5_follower'],
      states_say: { seen: ['The tassel, chewed to a soggy stub. A tuft of white hair is stuck to it.', 'A chewed tassel. White hair on it.'] } },
    // two-toed prints straight up the middle column of the Chalk Climb (N4G.climbCols r 2800, theta 327 to 336)
    n5_f_prints: { map: 4, kind: 'prints', look: 'hoof', r: 80, show: 'act>=5',
      path: [[2975, 87548], [3079, 87613], [3186, 87672], [3340, 87748]], name: ['two-toed prints', 'two-toed prints'] },
    // the Rime Shrine (n_sh_rime): "Meh." from a spike above it
    n5_f_meh: { map: 4, kind: 'spot', at: [6403, 84313], r: 220, name: ['the Rime Shrine', 'the Rime Shrine'] },
    // the Silent Green's copy of a goat pen with a shadow goat in it (Tier I's optional arc, level 2)
    n5_f_shadowpen: { map: 4, kind: 'examine', at: [2024, 87950], r: 40, h: 40, look: 'n5_shadow_pen',
      name: ['a shadow goat in a glass pen', 'a shadow goat'], if: 'act>=5', say: 'n5_shadow_goat' },
    // Duchess's pen at Hollis Farm (a2c_build.js: the pen decal at farm + (60, 150)); the note on its gatepost
    n5_f_note: { map: 0, kind: 'examine', at: [3300, 5394], r: 24, h: 36, look: 'n5_pen_note',
      name: ['a note on the gatepost', 'a note'], if: 'quest q_n5_follower active', say: 'n5_pen_note_read' },
  },

  clue: {
    n5_chewed: { icon: 'rope', mystery: 'n5_follower',
      text: ["The first Bridgefoot lantern's tassel is chewed to a stub. It's still wet.", 'Someone chewed the lantern tassel.'] },
    n5_hoofprints: { icon: 'prints', mystery: 'n5_follower',
      text: ['Two-toed prints go straight up the Chalk Climb, where only claws should get you.', 'Two-toed prints go up the cliff.'] },
    n5_meh: { icon: 'question', mystery: 'n5_follower',
      text: ['Above the Rime Shrine, something said "Meh." Then it was gone.', 'Something said "Meh."'] },
    n5_shadow_pen: { icon: 'eye', mystery: 'n5_follower', herring: true,
      text: ["The Silent Green has a copy of a goat pen. A shadow goat stands in it. It doesn't move. It doesn't chew.",
        'A shadow goat stands in a glass pen.'] },
    n5_hollis_note: { icon: 'note', mystery: 'n5_follower',
      text: ['Duchess\'s pen at Hollis Farm is empty. A note on the post says "Gone out. Again." It has a muddy hoofprint at the bottom.',
        'The pen is empty. A note says "Gone out. Again."'] },
  },

  deduce: {
    n5_who_follows: {
      mystery: 'n5_follower',
      ask: ['Who is following you up the mountain?', 'Who is following you?'],
      needs: ['n5_chewed', 'n5_hoofprints', 'n5_hollis_note'],
      bonus: ['n5_meh'],
      pick: [
        { t: ['Duchess. The real one.', 'Duchess!'], right: true },
        { t: ['A shadow goat made of memories', 'A shadow goat'],
          hint: ["Memories don't chew things. Something real chewed that tassel.", 'Shadows do not chew.'] },
        { t: 'Pip', hint: ['Pip has been riding on your head the whole way up.', 'Pip is on your head!'] },
      ],
      then: ['set n5_duchess_known'],
    },
  },

  step: [
    { id: 'tassel', do: 'examine n5_f_tassel', then: ['clue n5_chewed'],
      obj: ['Find out who is following you up the mountain', 'Who is following you?'] },
    { id: 'look', do: 'all', obj: ['Find out who is following you up the mountain', 'Who is following you?'],
      hint: ['Two-toed prints, a chewed tassel... Farmer Hollis knows more about goats than anybody.', 'Farmer Hollis knows goats.'],
      parts: [
        { do: 'track n5_f_prints', scene: 'n5_prints', then: ['clue n5_hoofprints'] },
        { do: 'examine n5_f_note', then: ['clue n5_hollis_note'] },
      ],
      extra: [
        { do: 'goto n5_f_meh', scene: 'n5_meh_scene', then: ['clue n5_meh'] },
        { do: 'examine n5_f_shadowpen', then: ['clue n5_shadow_pen'] },
      ] },
    { id: 'solve', do: 'deduce n5_who_follows', obj: ['Work it out in the Case Book', 'Open the Case Book'] },
    { id: 'tell', do: 'talk hollis', scene: 'n5_hollis_tell', obj: ['Tell Farmer Hollis who it is', 'Tell Farmer Hollis'],
      then: ['heart_ember n5_hollis', 'give n5_goathorns', 'hat n5_goathorns'] },
  ],

  scene: {
    n5_tassel: [
      ['narr', 'The first lantern used to have a tassel. Something has chewed it down to a soggy stub.',
        'Something chewed the lantern\'s tassel!'],
      ['ash', "It's still wet. Whatever did this was here a minute ago.", 'It is still wet!'],
      ['pip', 'Mip! (Pip sniffs it and sneezes.)', 'Mip! (Pip sneezes.)'],
      ['ash', "Something's following me up the mountain. Something that eats tassels.", 'Something is following me!',
        { do: ['world n5_f_tassel seen'] }],
    ],
    n5_prints: [
      ['narr', 'The prints go straight up the cliff, where only your claws should get you. Two toes each. Neat little hearts.',
        'Two-toed prints go straight up the cliff.'],
      ['ash', "Goats climb like that. But goats don't come HERE.", 'Goats climb like that. But not here!'],
      ['ash', 'Farmer Hollis knows more about goats than anybody. Maybe he would know.', 'Farmer Hollis knows goats.'],
    ],
    n5_meh_scene: [
      ['narr', 'From a spike of black ice high above the shrine, something says: "Meh."', 'Something above you says "Meh."'],
      ['narr', 'You look up. Nothing there. Just a puff of warm breath, drifting in the cold.', 'You look up. Nothing. Just a puff of breath.'],
      ['ash', '...Hello?'],
    ],
    n5_shadow_goat: [
      ['narr', 'A copy of a goat pen, all black glass. A shadow goat stands inside, perfectly still.', 'A glass pen. A shadow goat stands still.'],
      ['ash', "Hi, shadow goat. ...It doesn't blink, and it doesn't chew. It's just a memory.", "It doesn't blink or chew. Just a memory."],
    ],
    n5_pen_note_read: [
      ['narr', "Duchess's pen is empty. The gate is open. A note is stuck to the post.", 'The pen is empty. A note is on the post.', { ref: 'n5_duchess_pen' }],
      ['narr', 'It says: "Gone out. Again." At the bottom is a muddy hoofprint.', 'It says: "Gone out. Again."'],
      ['ash', "...Farmer Hollis has really bad handwriting.", 'Hollis writes really badly.'],
    ],
    n5_hollis_tell: [
      ['hollis', 'Duchess? Up the Night Mother\'s mountain? Course she is. She does this every time something big happens.',
        'Duchess is up the mountain? Course she is.'],
      ['ash', 'Your note said she had gone out again.', 'Your note said she went out.'],
      ['hollis', "My note? I didn't write a note. I can't spell \"again\".", "I didn't write a note!"],
      ['narr', 'You both look at the muddy hoofprint at the bottom of the note.', 'You both look at the hoofprint.'],
      ['hollis', '...She signed it. Course she did.', 'She signed it.'],
      ['hollis', 'She leaves me things when she goes. This was in her hay. Warm as toast. You have it.', 'This was in her hay. Take it.'],
      ['hollis', "And these. Goat horns, for the fair. Made 'em from a sock. You've got horns already. Now you've got MORE horns.",
        'Sock goat horns. Now you have more horns!'],
    ],
  },
})
