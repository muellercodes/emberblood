// game/story/act5/q_n5_hush.js (N5S): A Hundred White Moths (FINALE_V10 2.9 B2 and B3). Ring 4.
// A Hush Ash left on her leash in Act IV crumbled into a hundred little white moths that flew up the silver thread to
// their Mother (x3_story.js:461). On the fourth ring a white moth scale drifts past in the Tendril Wood and something
// very small says shhh (N5b's n_glass: scene n_hush_absent, which runs `quest start q_n5_hush`). In the Moth's Cradle
// the hundred moths sleep in the cocoons, tied to one silver knot, right in front of the great moth asleep on the nest.
// Claws and fire can't cut moon-silk; the Book of Moths says gentle Moonfire melts it (flag m_leash_known). Without
// it Ash goes home to Moonfall: Elder Ripple offers Act IV's own quest (m_leash, B3), Wren reads the book.
// The player chooses how to breathe: gently, or as hard as he can (the moths squeak; try again).
// Surprise: the moths fold together into Hush, but small, small enough to sit on Ash's horn, and warm ("A moth cut
// free goes back to her own size", the Book of Moths in x3_people.js:1199).
// Payoff: ally (n5_hush, trust friends +1); B3 also gives m_page11 (the n5_page11 bonus card).
// The friend scene for a Hush freed in Act IV (n_hush_join) is N5b's.
quest({
  id: 'q_n5_hush', act: 5, optional: true, if: '!flag n5_hush !choice m_hush=free',
  title: ['A Hundred White Moths', 'A hundred white moths'],
  payoff: { kind: 'ally', id: 'n5_hush' },

  place: {
    // the knot on the Moth's Cradle sand, just in front of the sleeping moth (the nest is N4G.nest n4P(1190,328) =
    // (3869,86209); N5b's n5_nest examine stays at its centre, x4_ascent's sleeping moth lies on it)
    n5_h_knot: { map: 4, kind: 'examine', at: [3840, 86330], r: 30, h: 36, look: 'n5_knot', states: { loose: 'n5_knot' },
      name: ['the silver knot in the cocoons', 'the silver knot'], if: 'stage>=n_glass !choice m_hush=free', say: 'n5_knot_look',
      states_say: { loose: ['Melted silver threads and empty cocoons. Nobody is tied here any more.', 'Empty cocoons. Nobody is tied here now.'] } },
  },

  step: [
    { id: 'cradle', do: 'examine n5_h_knot', obj: ["Find where the Night Mother keeps her moths: the Moth's Cradle", "Find the Moth's Cradle"],
      hint: ["The Moth's Cradle is the big sand nest on this ring, past the Tendril Wood. Tiptoe past the sleeping moth.",
        'Look in the big sand nest.'] },
    { id: 'how', do: 'wait_for flag m_leash_known', marker: 'm_ripple',
      obj: ['Find out how to melt a silver leash. Elder Ripple in Coralcombe knows the old books.', 'Ask Elder Ripple in Coralcombe'],
      hint: ['Take the moonfire bridge home. Elder Ripple lives in Coralcombe, under the water. Dive in.',
        'Go home. Dive down to Elder Ripple.'] },
    { id: 'free', do: 'wait_for flag n5_hush_free', scene: 'n5_hush_freed', marker: 'n5_h_knot',
      obj: ['Breathe Moonfire on the silver knot. Gently.', 'Melt the knot. Gently!'],
      hint: ['Gentle Moonfire melts moon-silk. Look at the knot again.', 'Look at the knot again.'],
      then: ['world n5_h_knot loose', 'trust friends +1', 'set n5_hush'] },
  ],

  scene: {
    // looking at the knot (every time until Hush is free)
    n5_knot_look: [
      ['narr', 'A hundred little white moths sleep in the cocoons here, every one tied with silver thread to one big knot.',
        'A hundred little moths sleep here. A silver knot ties them.'],
      { if: '!flag n5_knot_seen', then: [['ash', "Hush. It's you. All of you.", 'Hush? It is you!', { do: ['set n5_knot_seen'] }]] },
      { if: '!flag m_leash_known', then: [
        ['narr', "You try your claws on the thread. It doesn't even notice.", "Claws can't cut it."],
        ['ash', 'Moon-silk. Iska said somebody in Moonfall might know how to melt it. Elder Ripple knows the old books.',
          'Elder Ripple in Moonfall might know how.'],
        ['narr', 'Somewhere in the cocoons, very quietly: shhh. Hurry.', 'Very quietly: shhh. Hurry.'],
      ] },
      { if: 'flag m_leash_known', then: [
        { choose: 'n5_knot', ask: ['The Book of Moths said gentle Moonfire melts the knot. How do you breathe?', 'How do you breathe?'],
          pick: [
            { t: ['Gently. Like blowing on soup.', 'Gently'], v: 'gentle', tone: 'kind', then: ['set n5_hush_free'],
              say: [['narr', 'You breathe Moonfire on the knot, as softly as you can. The silver thread melts like frost on a window.',
                'You breathe softly. The thread melts.']] },
            { t: ['As hard as you can!', 'HARD!'], v: 'hard', tone: 'brave',
              say: [['narr', 'WHOOSH. The knot glows like a hot coal, and a hundred tiny moths squeak at once.', 'WHOOSH! The moths all squeak!'],
                ['ash', 'Sorry! SORRY. Gently. Got it.', 'Sorry! Gently. Got it.']] },
          ] },
      ] },
    ],
    // the knot melts: the twist (played by the 'free' step)
    n5_hush_freed: [
      ['narr', 'The cocoons crack open. A hundred little white moths flutter up, round and round you, and fold together into one.',
        'The moths fly up and fold into one.'],
      ['narr', "It's Hush. But small. Small enough to sit on your hand.", 'It is Hush! But small. She fits on your hand.'],
      ['f_hush', "...Shhh. Oh. I'm SMALL.", 'Oh. I am small.'],
      ['ash', 'The Book of Moths said a moth cut free goes back to her own size.', 'Free moths go back to their own size.'],
      ['f_hush', 'My own size. And warm. I forgot a moth could be warm.', 'And warm. I forgot.'],
      ['f_hush', 'You came back for all of me. Quietly. ...Thank you.', 'You came back for me. Thank you.'],
      ['narr', 'She settles on your horn, light as a leaf, and folds her wings.', 'She sits on your horn.'],
    ],
  },
})
