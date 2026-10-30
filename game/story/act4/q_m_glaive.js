// game/story/act4/q_m_glaive.js (A4S): A Piece of the Moon (m_glaive). Giver: Old Kiln the Glassblower, Sable.
// Kiln has always wanted to make something out of the moon. Gravelgut coughs up a crumb of it in the Sandworm Burrows
// (main path, A4a's m_burrows); Ash brings it, then tempers it with Moonfire in Kiln's furnace (after the Mirror Temple).
// Surprise: under Kiln's glass the crumb has TOOTH MARKS. Something bit it off the moon. Payoff: the Moon Glaive
// (weapon glaive), the only thing that cuts moon-silk webs (Kiln now says so, ACT4_V10 2.4: "Webs! Not leashes."), and
// a pointer to the moon-silk cocoon at the Dreadgate (gates_map2.js q_g_cocoon).
// Old saves: QDEFS.m_glaive steps 0..3 map to crumb, bring, temper, glaive (old_steps). The furnace stays x3_people's
// own mechanic (legacy step: m3pFurnMoon reads m3pAt('m_glaive',2)).
quest({
  id: 'm_glaive', act: 4, giver: 'm_kiln', optional: true, takeover: true,
  title: ['Over the Moon', 'A Piece of the Moon'],
  payoff: { kind: 'power', id: 'glaive' },
  old_steps: ['crumb', 'bring', 'temper', 'glaive'],

  clue: {
    m4_crumb_bite: { icon: 'moth', mystery: 'm4_night_mother',
      text: ['Tooth marks on the moon crumb Gravelgut ate. Something BIT it off the moon.',
        'The moon crumb has bite marks.'] },
    // the free_hush red herring (A4b's deduction lists the Glaive pick; its hint sends the player back to the mural)
    m4_glaive_cuts: { icon: 'moth', mystery: 'm4_night_mother', herring: true,
      text: ['Old Kiln: the Moon Glaive cuts moon silk. Nothing else does. (Webs, he said. Not leashes.)',
        'The Glaive cuts moon silk. Webs, not leashes.'] },
  },

  step: [
    { id: 'crumb', do: 'find m_mooncrumb', at: 'm4_worm_mouth',
      obj: ['Find a fresh piece of the moon', 'Find a piece of the moon'],
      hint: ['Kiln says bits of the moon fell in the Glass Desert. Something in the Sandworm Burrows ate one.',
        'Try the Sandworm Burrows.'] },
    { id: 'bring', do: 'give m_mooncrumb m_kiln', scene: 'gl_bring',
      obj: ['Bring the moon crumb to Old Kiln', 'Bring the crumb to Kiln'] },
    { id: 'temper', do: 'wait_for flag m_glaive_temper', legacy: true, marker: 'm3p_furnace',
      obj: ["Breathe Moonfire into Old Kiln's glass furnace", "Moonfire into Kiln's furnace"],
      hint: ['Not plain fire. Moonfire, from the Mirror Temple. Keep breathing it until the furnace turns silver.',
        'Use Moonfire. Keep going till it is silver.'] },
    { id: 'glaive', do: 'talk m_kiln', scene: 'gl_made', then: ['weapon glaive', 'xp 500', 'give coins 40'],
      obj: ['See what Old Kiln made', 'See what Kiln made'] },
  ],

  scene: {
    gl_offer: [
      ['m_kiln', "You're the dragon from the sea? Good. GOOD. I need a dragon.", 'You are the sea dragon? Good!'],
      ['m_kiln', "I've always wanted to make something out of the moon. Bits of it fell here once. That's why the sand is glass.",
        'Bits of the moon fell here once. The sand is glass.'],
      ['m_kiln', "But the big bits are long gone. Find me a fresh piece of moon, and I'll make you something you'll never forget. Unless you hit your head.",
        'Find a piece of moon. Bring it to me.'],
      { choose: 'm_glaive_offer', ask: ['Find Old Kiln a piece of the moon?', 'Find Kiln a piece of moon?'],
        pick: [
          { t: ['A piece of the moon? Deal!', 'Deal!'], tone: 'brave', then: ['quest start m_glaive'],
            say: [['m_kiln', "EH? Speak up! ...Oh, deal. Deal! Don't hit your head.", 'Deal! Do not hit your head.']] },
          { t: ['Maybe later', 'Maybe later'],
            say: [['m_kiln', 'EH? Later? Everything is later. The furnace is now.', 'Later? The furnace is now!']] },
        ] },
    ],
    gl_bring: [
      ['m_kiln', 'A crumb of the moon! Still warm! No, cold! Moon-cold!', 'A crumb of the moon!'],
      ['narr', 'He screws a glass lens into his eye and turns the crumb round and round.', 'He looks at it through a glass.'],
      ['m_kiln', 'Hm. Hm! Tooth marks. Something bit this off the moon. Something with a very big mouth.',
        'Tooth marks! Something bit the moon.', { clue: 'm4_crumb_bite' }],
      ['ash', 'Gravelgut ate it. But I think he found it already bitten.', 'The worm found it. Already bitten.'],
      ['m_kiln', "It needs tempering. In moonfire. Real moonfire, not candlelight. I'll keep it in my hat till you have some.",
        'It needs moonfire. I will keep it in my hat.'],
    ],
    gl_made: [
      ['narr', 'Old Kiln pulls, twists, blows, spins, and shouts at the furnace for a while. Then he holds up a long silver blade on a pole.',
        'Kiln twists and shouts. Then he holds up a silver blade.'],
      ['m_kiln', 'The Moon Glaive! A real glass act, if I say so myself. Swing it and it leaves a crescent of moonlight behind. It lights moon-glass and burns shadows.',
        'The Moon Glaive! It leaves moonlight behind.'],
      ['m_kiln', 'Throw it, and it comes back, like a very polite boomerang. And it cuts moon silk. Nothing else does.',
        'Throw it. It comes back. It cuts moon silk.', { clue: 'm4_glaive_cuts' }],
      ['m_kiln', 'Moon-silk webs, mind. Not leashes. Never leashes. Ask a priest of Lumen why. I just make things.',
        'Webs! Not leashes. Never leashes.'],
      ['m_kiln', "A trader from the cold north told me about a door of moon silk by the Dreadgate that nobody can open. Something glows behind it. Go and show off.",
        'By the Dreadgate up north is a silk door. Go cut it!', { promise: 'q_g_cocoon' }],
      ['m_kiln', "And don't use it to cut bread. It'll cut the table too.", "Don't cut bread with it!"],
    ],
  },

  talk: {
    m_kiln: [
      { if: 'stage>=m_sable !quest m_glaive active !quest m_glaive done', option: ['What are you making?', 'What are you making?'],
        scene: 'gl_offer' },
    ],
  },
})
