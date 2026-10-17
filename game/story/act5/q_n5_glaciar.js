// game/story/act5/q_n5_glaciar.js (N5S): The Promise on Mount Dread (FINALE_V10 2.9 B1). Ring 3 and map 2.
// A Glaciar Ash freed in Act III (flag n5_glaciar from N5a's n_arrive) crashes down at the Floe Gap: n_glaciar_join,
// played by N5a's n_rime step at n5_g_floe; she leaves at the Gust Stair with n_glaciar_bye. A Glaciar Ash had to
// beat is still asleep under the snow at the Crown of Dread, where Ash promised "I'll come back for you." On the third
// ring one of her scales lies in the snow by the Floe Gap (n_glaciar_absent). Ash learns the Snow Mother's Song (the
// Frozen Choir hums it under the frost, or Ash knows it from Act III), flies home to Mount Dread and sings.
// Surprise: Glaciar has been awake under the chains since Tuesday, counting snowflakes, too proud to say so.
// Payoff: ally (n5_glaciar, trust friends +1); she flies to the top of the Night Mother's mountain. Keeps the Act III
// promise (x2_story.js:465) and the scale line (x4_story.js:287).
quest({
  id: 'q_n5_glaciar', act: 5, optional: true, if: '!flag n5_glaciar',
  title: ['The Promise on Mount Dread', 'The promise on Mount Dread'],
  payoff: { kind: 'ally', id: 'n5_glaciar' },

  item: {
    n5_ice_scale: { name: ["Glaciar's scale", "Glaciar's scale"], icon: 'star',
      desc: ['One of Auntie Glaciar\'s scales, blue as deep ice. It frosts everything in your satchel.', 'A cold blue dragon scale.'] },
    n5_song: { name: ["The Snow Mother's Song", "The Snow Mother's Song"], icon: 'note',
      desc: ['Three verses: a sleepy dragon, a girl with horns, a fire that never goes out. You know it by heart now.',
        'A song about a sleepy dragon. You know it by heart.'] },
  },

  place: {
    // where a friend Glaciar crashes down (x4_story.js:1116, N4SPOT floe); N5a's goto step uses it
    n5_g_floe: { map: 4, kind: 'spot', at: [5972, 83921], r: 320, name: ['the Floe Gap', 'the Floe Gap'] },
    // her scale in the snow, just before the gap (ring 3, level 5 ground)
    n5_g_scale: { map: 4, kind: 'examine', at: [6037, 83999], r: 24, h: 28, look: 'n5_ice_scale', name: ['a blue dragon scale', 'a blue scale'],
      if: '!flag n5_glaciar !item n5_ice_scale stage>=n_rime', say: 'n_glaciar_absent', then: ['quest start q_n5_glaciar'] },
    // the Frozen Choir (x4_ascent's twelve singers round n4P(1950,60)): under the frost they hum the old song
    n5_choir_hum: { map: 4, kind: 'examine', at: [6099, 86235], r: 30, h: 50, name: ['the Frozen Choir', 'the Frozen Choir'],
      prompt: ['Listen to the Frozen Choir', 'Listen to the choir'],
      if: 'quest q_n5_glaciar active !item n5_song !flag f_song', say: 'n5_choir_song' },
    // beside the sleeping Glaciar at the Crown of Dread (x2_story.js F2SP.crown draws her under the snow)
    n5_g_crown: { map: 2, kind: 'examine', at: [7230, 41340], r: 34, h: 60, name: ['Auntie Glaciar, asleep in the snow', 'Auntie Glaciar'],
      prompt: ['Sing to Glaciar', 'Sing to Glaciar'], if: 'quest q_n5_glaciar active' },
  },

  step: [
    { id: 'scale', do: 'examine n5_g_scale', obj: ['Look at the blue glint by the Floe Gap', 'Look at the blue glint'],
      hint: ['Something blue is lying in the snow just before the Floe Gap.', 'Something blue lies in the snow.'] },
    { id: 'song', do: 'any', marker: 'n5_choir_hum', obj: ["Learn the Snow Mother's Song", "Learn the Snow Mother's Song"],
      hint: ['The Frozen Choir on this ring are copies of the singers of Hearthold. Listen to them closely.',
        'Listen to the Frozen Choir.'],
      parts: [
        { do: 'wait_for flag f_song' },
        { do: 'wait_for item n5_song' },
      ] },
    { id: 'sing', do: 'examine n5_g_crown', scene: 'n5_glaciar_wakes',
      obj: ['Fly home to the Crown of Dread on Mount Dread and sing to Glaciar', 'Sing to Glaciar on Mount Dread'],
      hint: ['Take the moonfire bridge home, then travel to Frostreach. Glaciar sleeps at the top of Mount Dread.',
        'Go to Mount Dread. Sing to Glaciar.'],
      then: ['take n5_ice_scale', 'trust friends +1', 'set n5_glaciar'] },
  ],

  scene: {
    // Glaciar was freed in Act III: she lands at the Floe Gap (N5a plays it). Rewrites x4_story.js:278-283 ("Fly" is
    // "Jump in the wind": the Floe Gap is a no-fly wind zone).
    n_glaciar_join: [
      ['narr', 'CRASH. Something enormous lands on the ice behind you, and the whole ring shakes.', 'CRASH! Something huge lands behind you.'],
      ['f_glaciar', 'DUMPLING! You are climbing the Moth\'s mountain without a scarf!', 'Dumpling! You have no scarf!'],
      ['ash', 'Great-great-great-great-great-great-great-great-great-great-great-great-great Grand-aunt Glaciar! ...I counted. I counted every great.',
        'Great x13 Grand-aunt Glaciar! I counted them all!'],
      ['f_glaciar', 'I heard, my little hot cross bun. The whole sea heard. Go on, then. Jump in the wind. If you fall, I will catch you.',
        'I heard you. Jump in the wind. If you fall, I will catch you.'],
      ['f_glaciar', 'I only do slowly, but I am very good at catching.', 'I am slow. But I am good at catching.'],
    ],
    // at the Gust Stair (rewrites x4_story.js:289-290; there is no roar to call her)
    n_glaciar_bye: [
      ['f_glaciar', 'I will circle the peak, dumpling. I will be at the top when you get there.', 'I will fly around. See you at the top.'],
      ['narr', 'She rises into the air, very slowly, and every snowflake on the ring turns round to watch her go.', 'She flies off, very slowly.'],
    ],
    // Glaciar was beaten in Act III: her scale in the snow (rewrites x4_story.js:285-287)
    n_glaciar_absent: [
      ['narr', "Half buried in the snow lies a single dragon scale, blue as deep ice. It's still cold.", 'A blue dragon scale lies in the snow. It is cold.'],
      ['ash', "Glaciar's. She's still asleep under the snow on Mount Dread.", 'It is Glaciar\'s. She is still asleep.'],
      ['ash', "I told her I'd come back for her. I PROMISED.", "I promised I'd come back for her."],
      ['narr', 'You tuck the scale into your satchel. It frosts the sandwich.', 'You keep the scale. It frosts your sandwich.', { do: ['give n5_ice_scale'] }],
      ['ash', "If I knew the Snow Mother's Song, I could sing her awake.", 'A song could wake her up.'],
      { if: 'flag f_song', then: [['ash', 'And I DO know it. Mount Dread, here I come.', 'I know the song! To Mount Dread!']] },
      { do: ['quest start q_n5_glaciar'] },
    ],
    n5_choir_song: [
      ['narr', "Up close, the frozen singers aren't quite silent. Under the frost, so soft you almost miss it, they're humming.",
        'The frozen singers are humming. Very softly.'],
      ['narr', 'The first verse is about a sleepy dragon. The second is about a girl with horns. The third is about a fire that never goes out.',
        'A sleepy dragon. A girl with horns. A fire that never goes out.'],
      ['ash', "The Snow Mother's Song. The moon remembered it.", "It's the Snow Mother's Song!"],
      ['narr', 'You hum along until you know every note by heart.', 'You learn every note.', { do: ['give n5_song'] }],
    ],
    n5_glaciar_wakes: [
      ['narr', 'Glaciar lies curled in the snow with the purple chains across her back. Snow has settled on her like a blanket.',
        'Glaciar sleeps in the snow, under purple chains.'],
      ['ash', 'Hi, Auntie. I came back. Like I promised.', 'Hi, Auntie. I came back. I promised.'],
      ['narr', "You kneel by her ear and sing the Snow Mother's Song. One by one the chains go soft, then slushy, then they drip away.",
        'You sing. The chains melt away.'],
      ['narr', 'Glaciar opens one blue eye. Then the other.', 'Glaciar opens her blue eyes.'],
      ['f_glaciar', 'Dumpling. Do you know how long I have been awake under there? Since TUESDAY.', 'I have been awake since Tuesday!'],
      ['f_glaciar', 'The chains held me down, and I cannot sing to myself. I am tone deaf. I counted snowflakes. Four million and six.',
        'The chains held me. I counted four million snowflakes.'],
      ['ash', "Why didn't you SAY something?", 'Why didn\'t you say so?'],
      ['f_glaciar', 'A dragon has her pride. ...You kept your promise. Nobody keeps promises to old ice.', 'You kept your promise. Nobody does that.'],
      ['narr', 'She takes her scale back and tucks it in, right where it belongs.', 'She takes her scale back.'],
      ['f_glaciar', 'The top of the Moth\'s mountain, then. I will meet you there. I fly slowly, but I always arrive.',
        'I will meet you at the top. Slowly.'],
    ],
  },
})
