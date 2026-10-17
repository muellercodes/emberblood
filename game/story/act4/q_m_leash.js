// game/story/act4/q_m_leash.js (A4S): The Silver Leash (m_leash). Giver: Elder Ripple, the Pearl Archive in Coralcombe.
// What changed in v10 (ACT4_V10 1.1 finding 1): this quest no longer holds the kind ending. The main path teaches how to
// free Hush (A4b's free_hush deduction sets m_leash_known), so the Hush choice is always open. What this quest gives
// now is the TRUTH behind it: the moon-priests' Book of Moths (clue m4_book, a free_hush bonus clue that makes the right
// pick glow) and, tucked in its back, a copy of the Wardens' lost eleventh page, which names a little grey moth Nyx
// (G.flags.m_page11: the finale's "knows Nyx" test, e7b_threads nKnowsNyx). Surprise: the page is in Iska's writing.
// Ash melts the moon-wax vault in the Drowned Library (Moonfire, under water) and gives the soggy book to Sister Wren.
// Old saves: QDEFS.m_leash steps 0..1 map to vault, wren (old_steps). The vault stays x3_people's (m3pVaultTick sets
// m_vault_open and gives m_book_raw, with STORY.m_vault's lines), so the vault step just waits for its flag.
quest({
  id: 'm_leash', act: 4, giver: 'm_ripple', optional: true, takeover: true,
  title: ['The Silver Leash', 'The Silver Leash'],
  payoff: { kind: 'truth', id: 'm4_book' },
  old_steps: ['vault', 'wren'],

  item: {
    m_book: { name: ["The Moon-Priests' Book of Moths", 'The Book of Moths'], icon: 'book', keepsake: true,
      desc: ['Dried out now. Wren read it. Moon silk, gentle moonfire, and a little grey moth called Nyx.', 'The book Wren read.'] },
  },

  clue: {
    m4_page11: { icon: 'note', mystery: 'm4_night_mother',
      text: ["The Wardens' eleventh page: on the first Lantern Day a little grey moth sat on Ember's lantern all night. Ember named her Nyx.",
        'A grey moth sat on Ember\'s lantern. Ember named her Nyx.'] },
    m4_book: { icon: 'book', mystery: 'm4_night_mother',
      text: ['The Book of Moths: the Mother ties her moths with moon silk. It keeps them big and cold. Moonfire, breathed gently, melts the knot.',
        'The Book of Moths: gentle moonfire melts the knot.'] },
  },

  step: [
    { id: 'vault', do: 'find m_book_raw', at: 'm4_lumen_spire',
      obj: ['Melt the moon-wax vault in the Drowned Library with Moonfire', 'Melt the vault in the Drowned Library'],
      hint: ['The vault is in the Drowned Library, deep in Drowned Lumen. Fire will not touch the wax. Moonfire will, even under water.',
        'Use Moonfire on the vault in Drowned Lumen.'] },
    { id: 'wren', do: 'give m_book_raw wren', scene: 'ml_reveal',
      then: ['give m_book', 'set m_leash_known', 'set m_page11', 'xp 600', 'give coins 50'],
      obj: ['Take the soggy Book of Moths to Sister Wren in Driftwood', 'Take the book to Sister Wren'],
      hint: ['Sister Wren reads Old Lumen writing. Badly, she says. She is on the Reading Raft in Driftwood.',
        'Wren is in Driftwood.'] },
  ],

  scene: {
    ml_offer: [
      ['m_ripple', 'Dragon. A word, if you please. That white moth with the silver thread. We have seen threads like that before.',
        'That white moth on a thread? We know those threads.'],
      ['m_ripple', 'The moon-priests of Lumen wrote a Book of Moths. It is in a vault in the Drowned Library, sealed with moon-wax.',
        'The priests wrote a Book of Moths. It is in a vault.'],
      ['m_ripple', 'Only moonfire melts moon-wax. Then take the book to someone who reads old Lumen. I read it very badly.',
        'Moonfire melts the wax. Then find someone who can read it.'],
      ['m_ripple', 'I once read "moth" as "mother" for a whole week. Sorry, fish. Not you.', 'I once read "moth" as "mother". Sorry, fish.'],
      { choose: 'm_leash_offer', ask: ['Will you find the Book of Moths?', 'Find the Book of Moths?'], pick: [
        { t: ['I will. Moths are kind of my thing now.', 'I will!'], tone: 'kind', then: ['quest start m_leash'],
          say: [['m_ripple', 'Splendid. Mind the octopus. She thinks every lamp down there is hers.', 'Mind the octopus down there.']] },
        { t: ['Not yet', 'Not yet'],
          say: [['m_ripple', 'Have we met? Oh, yes. Come back when you like. I may remember.', 'Come back. I may remember you.']] },
      ] },
    ],
    // Wren reads it (at most 10 lines on each branch)
    ml_reveal: [
      ['wren', 'Old Lumen script! Oh, my eyes. Oh, my heart. Give me a minute. And a dry cloth.', 'Old Lumen writing! Give me a cloth.'],
      ['wren', '"The Mother ties her heralds with moon silk. The leash keeps a moth big, and cold, and always pulled home."',
        '"The leash keeps a moth big and cold."', { clue: 'm4_book' }],
      ['wren', '"Moonfire, breathed gently, melts the knot. A moth set free goes back to her own size, and her own warmth."',
        '"Gentle moonfire melts the knot."'],
      // (m_leash_known: set by A4b's free_hush deduction on the main path, or by an old save's reading; this quest sets it after)
      { if: 'flag m_leash_known', then: [['ash', 'I KNEW it. Like blowing on hot soup.', 'I knew it!']],
        else: [['ash', 'So I could free Hush. Gently.', 'So I can free Hush. Gently.']] },
      ['wren', "Oh! Something's tucked in the back. A page. Not Lumen writing. Ours.", 'A page in the back. In OUR writing!'],
      { if: '!flag f_page11', then: [['wren', "It's the lost ELEVENTH page of the Wardens' book! Under the sea for five hundred years!",
        'The lost eleventh page! Under the sea all this time!']],
        else: [['wren', 'Another copy of the eleventh page! Eider found one in Hearthold. I shall frame one and hug the other.',
          'Another eleventh page! I will hug it.']] },
      ['narr', '"On the first Lantern Day, a little grey moth sat on Ember\'s lantern all night. Ember named her Nyx." (Iska)',
        '"A grey moth sat on Ember\'s lantern. Ember named her Nyx."', { clue: 'm4_page11' }],
      ['iska', 'I wrote that. I really did think nothing of it. I was wrong.', 'I wrote that. I was wrong.'],
    ],
    // replaces STORY.m_vault in place (x3_people's vault plays it by key when the wax melts)
    m_vault: [
      ['narr', 'The moon-wax runs like candle wax in the silver fire. The vault door swings open.', 'The wax melts. The vault opens.'],
      ['narr', 'Inside, in a shell case, lies a very soggy book with a moth on the cover.', 'Inside is a soggy book with a moth on it.'],
      ['iska', "Moonfire, under water, on a vault Ember's friends sealed. They hoped you'd come.", 'They hoped you would come.'],
    ],
  },

  talk: {
    m_ripple: [
      { if: 'stage>=m_coral !quest m_leash active !quest m_leash done', option: ['Do you know about the silver thread?', 'The silver thread?'],
        scene: 'ml_offer' },
    ],
  },
})
