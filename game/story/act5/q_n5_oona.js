// game/story/act5/q_n5_oona.js (N5S): Come Home for Tea (FINALE_V10 2.9 B7). Giver: Vesper, on the peak.
// Vesper (a friend from Act II, or one Ash pulled up on the Silk Gallery) says Gran doesn't know where she is (at the
// Crown's "Who is with me?", people.js n5_who; or N5a's join and second-chance scenes, see CHANGES.md). Ash takes
// the bridge home and the boat round to Saltmarsh, and finds Granny Oona in her coat and boots with a frying pan in
// her bag: she is off to climb the Night Mother's mountain herself. Ash tells her Vesper is safe and with him; Gran
// sits down very suddenly and writes a note instead. Ash gives the note to Vesper at the Crown Shrine.
// Surprise: Vesper pays him back with a Heart Ember she stole from the Night Mother's own pile ("Don't tell Gran").
// Payoff: heart_ember n5_tea. flag n5_tea is read by N5b (her Heart voice: "Gran says come home for tea").
quest({
  id: 'q_n5_oona', act: 5, optional: true, giver: 'c_oona', if: 'flag n5_vesper !quest q_n5_vesper started',
  title: ['Come Home for Tea', 'Come home for tea'],
  payoff: { kind: 'heart_ember', id: 'n5_tea' },

  item: {
    n5_tea_note: { name: ["Gran's note for Vesper", "Gran's note"], icon: 'letter',
      desc: ['Big wobbly letters: "Come home for tea after, duck. Love, Gran."', '"Come home for tea after, duck."'] },
  },

  place: {
    // at the Crown Shrine while Ash has the note: Vesper waits there with the others
    n5_tea_spot: { map: 4, kind: 'examine', at: [3260, 85940], r: 30, h: 40, name: ['Vesper', 'Vesper'],
      prompt: ["Give Vesper Gran's note", 'Give Vesper the note'],
      if: 'item n5_tea_note flag n5_vesper flag n_gather' },
  },

  step: [
    { id: 'gran', do: 'talk c_oona', scene: 'n5_oona_tea',
      obj: ['Tell Granny Oona in Saltmarsh that Vesper is safe', 'Tell Gran that Vesper is safe'],
      hint: ['Take the moonfire bridge back to the Moon Pier, then travel to Saltmarsh. Gran lives in the Stilt House.',
        'Go to Saltmarsh. Find Gran.'] },
    { id: 'give', do: 'examine n5_tea_spot', scene: 'n5_tea_give', marker: 'n5_tea_spot',
      obj: ["Give Vesper Gran's note at the Crown Shrine", 'Give Vesper the note at the top'],
      hint: ['Vesper waits with the others at the Crown Shrine, at the top of the last ring.', 'Vesper waits at the Crown Shrine.'],
      then: ['take n5_tea_note', 'set n5_tea', 'heart_ember n5_tea'] },
  ],

  scene: {
    n5_oona_tea: [
      ['narr', "Granny Oona is in her coat, her boots and her best headscarf. There's a frying pan sticking out of her bag.",
        'Gran has her coat on. A frying pan is in her bag.'],
      ['c_oona', "Oh, it's you, duck! I'm off up that mountain. Somebody has to fetch my girl home.",
        "I'm going up that mountain to fetch my girl!"],
      ['ash', "Gran, it's a mountain made of NIGHT. And Vesper's with me. She's okay.", "Vesper is with me. She's okay."],
      ['narr', 'Granny Oona sits down very suddenly. The frying pan clangs.', 'Gran sits down. The pan clangs.'],
      ['c_oona', '...With you? Up there? Oh, thank goodness. Then you take her something from me.',
        'With you? Oh, thank goodness. Take her this.'],
      { if: 'item c_scarf', then: [
        ['c_oona', "And you've still got the scarf I knitted her! Tell her to WEAR it this time.", 'Tell her to wear the scarf this time!']],
        else: [
        ['c_oona', "And tell her to wear her scarf. It's still on her bed, where she left it.", 'Tell her to wear her scarf.']] },
      ['narr', 'She writes a note in big wobbly letters and presses it into your claws.', 'She writes a note for Vesper.',
        { do: ['give n5_tea_note'] }],
    ],
    n5_tea_give: [
      ['narr', "You give Vesper Gran's note. She reads it three times.", 'Vesper reads the note three times.'],
      ['c_vesper', '"Come home for tea after, duck." ...After. She thinks there\'s going to be an after.',
        'She thinks there will be an after.'],
      ['ash', "There is. I promised Mom too."],
      ['c_vesper', "...Okay. Then there's an after. And I'm NOT wearing the scarf.", "Okay. There's an after. No scarf!"],
      ['c_vesper', "...I'll wear the scarf.", "I'll wear the scarf."],
      ['c_vesper', "Here. I stole this off the Night Mother's own pile, on the way up. Don't tell Gran.",
        "I stole this from the Night Mother. Don't tell Gran!"],
    ],
  },
})
