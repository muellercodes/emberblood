// game/story/act5/q_n5_glaciar.js (N5S): The Promise on Mount Dread (FINALE_V10 2.9 B1). Ring 3 and map 2.
// A Glaciar Ash had to beat in Act III is still asleep under the snow and the purple chains at the Crown of Dread,
// where Ash promised "I'll come back for you." On the third ring her scale lies in the snow by the Floe Gap (N5a's
// n_rime: place n5_ice_scale, scene n_glaciar_absent, which runs `quest start q_n5_glaciar`). Ash learns the Snow
// Mother's Song (the Frozen Choir hums it under the frost, or Ash knows it from Act III), flies home to Mount Dread
// and sings. The friend scenes for a Glaciar freed in Act III (n_glaciar_join, n_glaciar_bye) are N5a's and N5b's.
// Surprise: Glaciar has been awake under the chains since Tuesday, counting snowflakes, too proud to say so.
// Payoff: ally (n5_glaciar, trust friends +1); she flies to the top of the Night Mother's mountain. Keeps the Act III
// promise (x2_story.js:465) and the old scale line "One day the right song will wake her" (x4_story.js:287).
quest({
  id: 'q_n5_glaciar', act: 5, optional: true, if: '!flag n5_glaciar !choice f_glaciar=free',
  title: ['The Promise on Mount Dread', 'The promise on Mount Dread'],
  payoff: { kind: 'ally', id: 'n5_glaciar' },

  item: {
    n5_song: { name: ["The Snow Mother's Song", "The Snow Mother's Song"], icon: 'note',
      desc: ['Three verses: a sleepy dragon, a girl with horns, a fire that never goes out. You know it by heart now.',
        'A song about a sleepy dragon. You know it by heart.'] },
  },

  place: {
    // the Frozen Choir (x4_ascent's twelve singers round n4P(1950,60)): under the frost they hum the old song. Beside
    // x4_ascent's own "Look at the choir" prompt (the lantern puzzle), on the open side of the half circle.
    n5_choir_hum: { map: 4, kind: 'examine', at: [6099, 86235], r: 30, h: 50, name: ['the Frozen Choir', 'the Frozen Choir'],
      prompt: ['Listen to the Frozen Choir', 'Listen to the choir'],
      if: 'quest q_n5_glaciar active !item n5_song !flag f_song', say: 'n5_choir_song' },
    // beside the sleeping Glaciar at the Crown of Dread (x2_story.js F2SP.crown draws her under the snow)
    n5_g_crown: { map: 2, kind: 'examine', at: [7230, 41340], r: 34, h: 60, name: ['Auntie Glaciar, asleep in the snow', 'Auntie Glaciar'],
      prompt: ['Sing to Glaciar', 'Sing to Glaciar'], if: 'quest q_n5_glaciar active' },
  },

  step: [
    { id: 'song', do: 'any', marker: 'n5_choir_hum', obj: ["Learn the Snow Mother's Song", "Learn the Snow Mother's Song"],
      hint: ['The Frozen Choir on the third ring are copies of the singers of Hearthold. Listen to them closely.',
        'Listen to the Frozen Choir.'],
      parts: [
        { do: 'wait_for flag f_song' },
        { do: 'wait_for item n5_song' },
      ] },
    { id: 'sing', do: 'examine n5_g_crown', scene: 'n5_glaciar_wakes',
      obj: ['Fly home to the Crown of Dread on Mount Dread and sing to Glaciar', 'Sing to Glaciar on Mount Dread'],
      hint: ['Take the moonfire bridge home, then travel to Frostreach. Glaciar sleeps at the top of Mount Dread.',
        'Go to Mount Dread. Sing to Glaciar.'],
      then: ['trust friends +1', 'set n5_glaciar'] },
  ],

  scene: {
    n5_choir_song: [
      ['narr', "Up close, the frozen singers aren't quite silent. Under the frost, so soft you almost miss it, they're humming.",
        'The frozen singers are humming. Very softly.'],
      ['narr', 'The first verse is about a sleepy dragon, the second about a girl with horns, and the last one about a fire that never goes out.',
        'A sleepy dragon. A girl with horns. A fire that never goes out.'],
      ['ash', "The Snow Mother's Song. The moon remembered it.", "It's the Snow Mother's Song!"],
      ['narr', 'You hum along until you know every note by heart.', 'You learn every note.', { do: ['give n5_song'] }],
    ],
    n5_glaciar_wakes: [
      ['narr', 'Glaciar lies curled in the snow with the purple chains across her back. Snow has settled on her like a blanket.',
        'Glaciar sleeps in the snow, under purple chains.'],
      ['ash', 'Hi, Auntie. I came back, like I promised.', 'Hi, Auntie. I came back. I promised.'],
      ['narr', "You kneel by her ear and sing the Snow Mother's Song. One by one the chains go soft, then slushy, then they drip away.",
        'You sing. The chains melt away.'],
      ['narr', 'Glaciar opens one blue eye, and then the other.', 'Glaciar opens her blue eyes.'],
      ['f_glaciar', 'Dumpling. Do you know how long I have been awake under there? Since TUESDAY.', 'I have been awake since Tuesday!'],
      ['f_glaciar', 'The chains held me down, and you cannot sing yourself awake. I tried. I am tone deaf.',
        'The chains held me. I cannot sing. I tried.'],
      ['ash', "Why didn't you SAY something?", "Why didn't you say so?"],
      ['f_glaciar', 'A dragon has her pride. ...You kept your promise. Nobody keeps promises to old ice.', 'You kept your promise. Nobody does that.'],
      ['narr', 'She shakes off the snow and stretches her wings, all the way out, for the first time in a long time.', 'She shakes off the snow and stretches her wings.'],
      ['f_glaciar', "The top of the Moth's mountain, then. I will meet you there. I fly slowly, but I always arrive.",
        'I will meet you at the top. Slowly.'],
    ],
  },
})
