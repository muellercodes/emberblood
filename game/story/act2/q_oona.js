// game/story/act2/q_oona.js (A2S): Warm Hands for Granny Oona (c_oona). Giver: Granny Oona, Saltmarsh.
// Ash shifts a gull nest off her chimney (Climbing Claws), lights her old stove with one gentle breath, and sits with
// her by the fire. Surprise: in the warm she pulls off her headscarf and she has two tiny horns, like his. Payoff: a
// story truth for why_glowing (the Lady in Vesper's dreams promised to bring the fire home for Gran), Vesper's trust
// (+2 with her note after the next rest, +1 more for the Act I locket) and the Saltwhistle Scarf.
// Old saves: QDEFS.c_oona steps 0..3 map to nest, stove, sit, note (old_steps). The nest, the stove breath and the
// rest note stay x1_people's own mechanics (legacy steps); the fire scene and the note text are data (STORY keys).
quest({
  id: 'c_oona', act: 2, giver: 'c_oona', optional: true, takeover: true,
  title: ['Warm Hands for Granny Oona', 'Warm Hands for Granny Oona'],
  payoff: { kind: 'truth', id: 'q_oona_lady' },
  old_steps: ['nest', 'stove', 'sit', 'note'],

  item: {
    c_scarf: { name: ['The Saltwhistle Scarf', 'The Saltwhistle Scarf'], icon: 'scarf', keepsake: true,
      desc: ['Knitted by Granny Oona for Vesper, who never wore it. Warm, a bit lumpy.', 'A warm scarf from Gran.'] },
    c_biscuit: { name: ["Granny Oona's very old biscuit", 'An old biscuit'], icon: 'biscuit', keepsake: true,
      desc: ['Hard as a roof tile. When you are badly hurt, you eat one without thinking about it.', 'Heals you when you are hurt.'] },
  },

  clue: {
    q_oona_lady: { icon: 'fire', mystery: 'moth_mask',
      text: ['Granny Oona says Vesper dreams of a Lady who promised to bring the fire home for Gran.',
        'A Lady in her dreams promised Gran fire.'] },
    q_oona_horns: { icon: 'heart', mystery: 'moth_mask',
      text: ['Granny Oona has two tiny horns under her headscarf. The Saltwhistles are Emberbloods, she says. They just never got the fire.',
        'Gran has tiny horns. No fire, though.'] },
  },

  step: [
    { id: 'nest', do: 'wait_for flag c_oona_nest', legacy: true, marker: 'c_lm_oonanest',
      obj: ["Climb Granny Oona's roof and move the gull nest off her chimney", "Move the gull nest off Gran's roof"],
      hint: ['Her roof is steep: Climbing Claws get you up. Lift the nest and carry it to the empty post by the door.',
        'Climb up. Carry the nest to the post.'] },
    { id: 'stove', do: 'wait_for flag c_oona_lit', legacy: true, marker: 'h_c_oona',
      obj: ["Light Granny Oona's old stove. Gently.", "Light Gran's stove. Gently!"],
      hint: ['Breathe fire on the stove for a moment, then stop. Too long and it goes WHOOMPH.',
        'Breathe a little. Then stop.'] },
    { id: 'sit', do: 'talk c_oona', scene: 'c_oona_fire',
      obj: ['Sit with Granny Oona by the fire', 'Sit with Gran by the fire'],
      then: ['give c_scarf', 'hat c_scarf', 'give c_biscuit 3', 'xp 250'] },
    { id: 'note', do: 'wait_for flag c_oona_note', legacy: true,
      obj: ['Get some rest on the coast tonight (a shrine or an inn)', 'Rest at a shrine or an inn'],
      hint: ['Someone wants to say thank you. Rest anywhere on the coast.', 'Rest anywhere on the coast.'] },
    // (no then: the old step's own reward gives the 250 XP and x1_people gives Vesper's trust +2 with the note)
  ],

  scene: {
    c_oona_offer: [
      ['c_oona', "Oh, look at you, duck. Horns and a tail, and you're warm. I can feel it from here, like standing next to a fresh loaf.",
        "Horns, a tail, and warm! Like a loaf."],
      ['c_oona', "Vesper used to light my stove for me, for all the good it did. Now a gull's built a nest on the chimney, and it smokes us out.",
        'Now a gull sits on my chimney. The stove smokes.'],
      ['c_oona', "I can't climb up to shift it. And there's never been a spark in this family. Not one.",
        "I can't climb. And we have no spark."],
      { choose: 'c_oona_offer', who: 'c_oona', ask: ["Would you, duck? I'd pay you in biscuits. Very old biscuits.", 'Will you help? I pay in biscuits.'],
        pick: [
          { t: ["I'll light it for you!", 'I will help!'], tone: 'kind', then: ['quest start c_oona'],
            say: [['c_oona', 'Bless you, duck. Mind the gull. He bites.', 'Bless you. Mind the gull.']] },
          { t: ['Not right now', 'Not now'],
            say: [['c_oona', "Mind the wind on the boardwalk, duck. It'll have your hat off.", 'Mind the wind, duck.']] },
        ] },
    ],
    // replaces STORY.c_oona_fire (x1_people plays it by key at this step); at most 10 lines on any branch
    c_oona_fire: [
      ['narr', 'The old stove catches with a soft whump. Orange light fills the little house.', 'The stove lights. Whump!'],
      ['narr', 'Granny Oona holds out her hands to it. Then she pulls off her headscarf. Two tiny horns poke out of her white hair.',
        'Gran takes off her scarf. She has tiny horns!', { clue: 'q_oona_horns' }],
      ['ash', "You've got HORNS!"],
      ['c_oona', "Pearl's horns, duck. We're Emberbloods, the Saltwhistles. We just never got the fire.",
        'We are Emberbloods. We never got the fire.'],
      ['c_oona', 'My Vesper got the claws, though. Out every night. Home every morning, with silver dust on her boots.',
        'Vesper has the claws. Out every night.'],
      ['c_oona', "She dreams of a Lady who promised to bring the fire home for me. I don't want fire. I want my girl to sit down.",
        'A Lady promised her fire for me.', { clue: 'q_oona_lady' }],
      { if: 'flag pip quest a1_pip done', then: [['pip', "Mip. (Pip curls up in Gran's lap like a warm bun.)", 'Mip. (Pip naps in her lap.)']] },
      { if: 'item a1_locket !flag c_locket_given', then: [
        { choose: 'c_oona_locket', who: 'narr', ask: ["You still have the shell locket from the stranger's camp up north.", 'You still have the shell locket.'],
          pick: [
            { t: ['Show Granny Oona the locket', 'Show Gran the locket'], tone: 'kind',
              then: ['set c_locket_given', 'trust vesper +1', 'take a1_locket'],
              say: [['c_oona', "That's my daughter's locket! Vesper lost it in the spring. She'll know who found it.",
                "My daughter's locket! I'll give it to Vesper."]] },
            { t: ['Keep it for now', 'Keep it for now'], say: [['ash', "(I'll give it to her myself.)"]] },
          ] }] },
      ['c_oona', "Look at it go. ...Here. A scarf I knitted for Vesper, who won't wear it, and three of my biscuits.",
        'Look at it go. Here, a scarf and three biscuits.'],
    ],
    // replaces STORY.c_oona_note (x1_people plays it after the next rest, then sets c_oona_note and Vesper's trust +2)
    c_oona_note: [
      ['narr', "When you wake up, there's a note on your pillow. And a fish.", 'A note and a fish are on your pillow.'],
      ['narr', '"You lit Gran\'s stove. It was still going this morning. It\'s never still going in the morning. Never."',
        '"You lit Gran\'s stove. It was still going this morning!"'],
      ['narr', '"She made me sit by it for an hour. She showed you her horns, didn\'t she. She does that. ...Thanks. V."', '"She made me sit by it. Thanks. V."'],
      ['narr', 'The fish has a little bow on it.'],
    ],
  },

  talk: {
    c_oona: [
      { if: 'stage>=c_salt !quest c_oona active !quest c_oona done', option: ['Can I help you get warm?', 'Can I help?'],
        scene: 'c_oona_offer' },
    ],
  },
})
