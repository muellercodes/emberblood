// game/story/act5/q_n5_vesper.js (N5S): Sorry, Cousin. Vesper's arc on the peak after a "Keep going".
// N5a's n_clocks owns the climb's Vesper beats (n_vesper_join, n_vesper_absent, the second chance ncl_chance on the
// Silk Gallery's first island, n_vesper_bye). A kid who stepped past her there (flag n5_vesper_left) can still make it
// right: Ash goes home to Saltmarsh, and Granny Oona knows exactly what to do with a granddaughter who sulks up high.
// She sends a moth-shaped biscuit, the kind she has baked every Sunday for twenty years in case Vesper came home.
// Vesper is sitting on the rim of the Crown with her back to everyone. Ash brings the biscuit up.
// Surprise: she would never forgive Ash for saying sorry. But she cannot say no to Gran.
// Payoff: ally (n5_vesper, trust friends +1); and set n5_tea ("come home for tea after"), which N5b's Heart voice reads.
// Starts from N5a's "Keep going" pick (quest start q_n5_vesper) or at the Crown's "Who is with me?" (people.js n5_who).
quest({
  id: 'q_n5_vesper', act: 5, optional: true, if: 'flag n5_vesper_left !flag n5_vesper',
  title: ['Sorry, Cousin', 'Sorry, cousin'],
  payoff: { kind: 'ally', id: 'n5_vesper' },

  item: {
    n5_moth_biscuit: { name: ["Gran's moth biscuit", 'A moth biscuit'], icon: 'heart',
      desc: ['Shaped like a moth, and hard as a roof tile. Gran bakes one every Sunday, in case Vesper comes home.', 'A moth biscuit from Gran.'] },
  },

  place: {
    // Vesper on the rim of the Crown, legs over the void, back to the shrine (ring 4, level 7)
    n5_v_sulk: { map: 4, kind: 'examine', at: [3240, 85962], r: 30, h: 48, look: 'n5_vesper_sulk', name: ['Vesper', 'Vesper'],
      prompt: ['Talk to Vesper', 'Talk to Vesper'], if: 'quest q_n5_vesper active flag n_gather' },
  },

  step: [
    { id: 'gran', do: 'talk c_oona', scene: 'n5_gran_sorry',
      obj: ["Ask Granny Oona in Saltmarsh how to say sorry to Vesper", 'Ask Gran how to say sorry'],
      hint: ['Take the moonfire bridge home, then travel to Saltmarsh. Gran lives in the Stilt House.', 'Go to Saltmarsh. Find Gran.'] },
    { id: 'sorry', do: 'examine n5_v_sulk', scene: 'n5_vesper_sorry', marker: 'n5_v_sulk',
      obj: ['Take the biscuit to Vesper at the Crown Shrine', 'Take the biscuit to Vesper'],
      hint: ['Vesper went up her own way. She is sitting on the rim by the Crown Shrine, at the top of the last ring.',
        'Vesper sits by the Crown Shrine.'],
      then: ['take n5_moth_biscuit', 'trust friends +1', 'set n5_vesper', 'set n5_tea'] },
  ],

  scene: {
    n5_gran_sorry: [
      ['ash', 'Granny Oona, I did something bad. Vesper fell, up on the mountain, and I just kept going.', 'Vesper fell. I just kept going.'],
      ['c_oona', "Oh, duck. Sit down. No, there. That's the warm chair.", "Oh, duck. Sit down. That's the warm chair."],
      ['ash', 'I told myself she could climb up by herself. She could! But I should have helped.', 'I should have helped her.'],
      ['c_oona', "She'll be sitting somewhere high with her back to everybody. She's done that since she was four.",
        'She will be sulking somewhere high. She always does.'],
      ['c_oona', "Sorry won't fix it, not with my Vesper. But she never could stay cross with a biscuit.", "She can't stay cross with a biscuit."],
      ['narr', 'Gran takes a tin off the top shelf. It is full of biscuits shaped like little moths.', 'Gran has a tin full of moth biscuits.'],
      ['c_oona', "I've baked one every Sunday since she ran off, in case she came home. Take her one. And tell her: come home for tea after.",
        'One every Sunday, in case she came home. Take one.', { do: ['give n5_moth_biscuit'] }],
    ],
    n5_vesper_sorry: [
      ['narr', 'Vesper sits on the very edge of the Crown, her legs over the dark. She does not turn round.', 'Vesper sits on the edge. She does not turn round.'],
      ['c_vesper', 'Go away, cousin.', 'Go away.'],
      ['ash', "I'm sorry. I should have pulled you up. ...Your gran sent you this.", "I'm sorry. Gran sent you this."],
      ['narr', 'She looks at the moth biscuit for a long time.', 'She looks at the biscuit for a long time.'],
      ['c_vesper', "...She still makes these? Every Sunday? They're TERRIBLE.", 'She still makes these? They are terrible!'],
      ['narr', 'She eats it anyway, which takes a while. It is a very hard biscuit.', 'She eats it anyway. It is a very hard biscuit.'],
      ['c_vesper', "Fine. I'll stand next to you up there. Not because you said sorry. Because Gran said.", 'Fine. I will help. Because Gran said.'],
      ['c_vesper', '"Come home for tea after." ...Okay. Then we both have to come home.', 'Then we both have to come home.'],
    ],
  },
})
