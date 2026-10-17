// game/story/act3/q_f_song.js (A3S): The Snow Mother's Song (f_song). Giver: Old Brynja at the Great Hearth.
// The song's words were carved in three places so they would never all be lost at once (they all were): Rimeholm's
// bell (thaw Tollef, climb the tower), the Singing Stone on the sky isles (Wind Riding past it) and the Rune Drum in
// the Stonehorn hills (Ground Pound). Brynja sings the whole song at the Hearth. The song does not give the answer
// away: it proves what the player works out (a red-horned girl with fire called the Snow Mother "Auntie"), a bonus
// clue f3_song for A3b's snow_mother. Surprise: Brother Eider finds Wren's lost eleventh page stuck to a frost pudding
// recipe: on the first Lantern Day a little grey moth sat on Ember's lantern, and Ember named her Nyx (set f_page11,
// the old flag the finale's kind ending reads). Payoff: truth (f3_song); also f_song (A3b's free outro "stay" and the
// defeat path's song; A3S's f3_crown_wake).
// Old saves: QDEFS.f_song steps 0..1 map to verses, sing. The three verse places stay x2_people's own mechanics (the
// bell, the stone and the drum read f2pOn('f_song'); the verses step is legacy so the old HUD target still points at
// the next verse). The last step plays its own scene sg_reveal (STORY.f_song_reveal is a getter on main's engine, so
// a data scene of that id could not replace it there).
quest({
  id: 'f_song', act: 3, giver: 'f_brynja', optional: true, takeover: true,
  title: ["The Snow Mother's Song", "The Snow Mother's Song"],
  payoff: { kind: 'truth', id: 'f3_song' },
  old_steps: ['verses', 'sing'],

  clue: {
    f3_song: { icon: 'note', mystery: 'long_winter',
      text: ['The Snow Mother\'s Song: a girl with red horns and fire in her hands called the Snow Mother "Auntie". Together they lit a fire that never fades.',
        'The song: a red-horned girl called the Snow Mother "Auntie".'] },
  },


  step: [
    { id: 'offer', do: 'talk f_brynja', if: 'stage>=f_thaw', scene: 'sg_offer',
      obj: ['Talk to Old Brynja at the Great Hearth', 'Talk to Brynja'] },
    { id: 'verses', do: 'all', legacy: true,
      obj: ["Find the three verses of the Snow Mother's Song: a bell, a stone and a drum", 'Find 3 verses: a bell, a stone, a drum'],
      parts: [
        { do: 'wait_for flag f_v1', hint: ["Rimeholm's great bell, on top of the bell tower. Thaw Tollef the bellringer first, then climb up.",
          'The bell on the tower. Thaw Tollef, then climb.'] },
        { do: 'wait_for flag f_v2', hint: ['The Singing Stone, out on the sky isles by the temple. Only a big wind plays it: ride a wind ribbon past it.',
          'The Singing Stone. Ride the wind past it.'] },
        { do: 'wait_for flag f_v3', hint: ['The Rune Drum, high in the Stonehorn hills. It wants a knock, the big kind.',
          'The Rune Drum. Knock HARD.'] },
      ] },
    { id: 'sing', do: 'talk f_brynja', scene: 'sg_reveal',
      then: ['take f_verse1', 'take f_verse2', 'take f_verse3', 'set f_song', 'set f_page11', 'xp 1500', 'give coins 200'],
      obj: ['Bring the three verses to Brynja at the Great Hearth', 'Bring the verses to Brynja'] },
  ],

  scene: {
    sg_offer: [
      { if: 'flag f_letter_read', then: [
        ['f_brynja', "My mother's letter. 'If the fire runs low, remember the Snow Mother's Song.' Sixty years in the post.",
          "Mom's letter: 'Remember the Snow Mother's Song.'"]] },
      ['f_brynja', "Sit down, child. Every Hearthkeeper used to know the Snow Mother's Song. I only know the tune.",
        'Sit, child. I only know the tune of an old song.'],
      ['f_brynja', 'The words were carved in three places, long ago, so they would never all be lost at once.', 'The words were carved in three places.'],
      ['f_brynja', 'Funny how that worked out. They all got lost at once.', 'They all got lost at once. Funny.'],
      ['f_eider', "(from the archive door) Rimeholm's bell! A stone on the sky isles! A drum in the Stonehorn hills! I wrote it down TWICE!",
        '(far away) A bell! A sky stone! A hill drum!'],
      ['f_brynja', 'Find the words. I would like to hear it sung once before I am done keeping fires.', 'Find the words. I want to hear it sung.'],
    ],
    sg_reveal: [
      ['narr', 'Brynja sings. Her voice is cracked and old and perfect. The Great Hearth flickers in time, like it is humming along.',
        'Brynja sings. The Hearth flickers along.'],
      ['narr', '"A girl came up with horns of red and fire in her hands, and said: Auntie, the night is cold and wide. Let\'s light a fire to keep inside."',
        '"A girl with red horns said: Auntie, let\'s light a fire."'],
      ['f_eider', 'Horns of red. Fire in her hands. That is an Emberblood. That is EMBER.', 'Red horns, fire in her hands. That is EMBER!',
        { clue: 'f3_song' }],
      ['f_brynja', 'And Ember called the Snow Mother "Auntie."', 'Ember called her "Auntie."'],
      { if: 'flag f3_auntie_glee', then: [
        ['ash', 'Auntie Glee. I KNEW it. And she is up on that mountain right now.', 'Auntie Glee! She is on the mountain!']],
        else: [
        ['ash', "Ember's auntie? Then who WAS the Snow Mother? And where did she go?", "Ember's auntie? Who was she?"]] },
      { if: { any: ['flag f3_auntie_glee', 'flag f3_tove_seen'] }, then: [
        ['tove', 'Auntie Glee. Her laugh was like wind chimes. How did I ever forget?', 'Auntie Glee! Her laugh was like chimes!']] },
      { if: '!flag f3_iska_open', then: [
        ['f_eider', "Wait. WAIT. Wren's lost page! The eleventh one! It was stuck to the back of a frost pudding recipe. Very old jam.",
          "Wait! Wren's lost page! It was stuck to a pudding recipe!"],
        ['narr', '"On the first Lantern Day, a little grey moth sat on Ember\'s lantern all night. Ember named her Nyx." (Iska)',
          '"A little grey moth sat on Ember\'s lantern. Ember named her Nyx."'],
        ['ash', 'Nyx. A little grey moth... named by Ember.', 'Nyx. Ember named her.']],
        else: [
        ['f_eider', "And look: Wren's lost eleventh page, stuck to a frost pudding recipe. The same words as Iska's box. Nyx. Shh. Sorry.",
          "Wren's lost page! Same as Iska's. Nyx."]] },
      ['f_brynja', 'Then go and sing it where it is needed, child. Hearthold never forgot her. Only her name.', 'Go and sing it, child.'],
    ],
  },
})
