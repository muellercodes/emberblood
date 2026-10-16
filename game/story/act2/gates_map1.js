// game/story/act2/gates_map1.js (A2S): Chain Whip hook posts on the Clockwork Coast (map 1), so the whip's "swing
// from hook posts" is true (audit finding 12), and the Moon Ring look (clue q_moonring, what_stopped).
// A whip swing is the game's own jump, so it clears water and rips but never a cliff face: each pair below crosses a
// same-level gap that walking and Water Stride cannot (deep sea, a rip current). Checked live with e6b's whiphook and
// a real lash (A2S_NOTES.md, "Hooks"): each swing lands where `to` says, on its own lane so the two hooks of a pair
// never stand in each other's way.
//   wh_isle_out / wh_isle_back   the Rockpools shallows <-> Gull Isle over deep sea (Pearl's page 6, chest c_ch_gullisle).
//                                Until now only the Ember Wings off the cliff updraft got there.
//   wh_seal_out / wh_seal_back   over the rip in the Seal Rocks lane (Seal Rocks, chest c_ch_seal); the Skimmer's other way.
places({
  id: 'a2s_map1', act: 2, map: 1,

  place: {
    wh_isle_out: { kind: 'gate', gate: 'whip_hook', map: 1, at: [4040, 28885], r: 220, leads: 'c_ch_gullisle',
      name: ['an old hook post in the shallows', 'a hook post'],
      locked: ['An old iron hook on a post, out where the shallows end. Something long could catch it.', 'A hook post. A whip could catch it.'],
      build: { hook: { x: 4040, y: 28885, to: [4040, 29500] } } },
    wh_isle_back: { kind: 'gate', gate: 'whip_hook', map: 1, at: [4170, 29440], r: 220, leads: 'c_lm_wreck',
      name: ['a hook post on Gull Isle', 'a hook post'],
      build: { hook: { x: 4170, y: 29440, to: [4170, 28760] } } },
    wh_seal_out: { kind: 'gate', gate: 'whip_hook', map: 1, at: [11760, 29560], r: 220, leads: 'c_ch_seal',
      name: ['a hook post on a buoy', 'a hook post'],
      locked: ['A hook post on a buoy, right where the rip starts. Lash it and swing over?', 'Lash the hook. Swing over!'],
      build: { hook: { x: 11760, y: 29560, to: [11760, 29830] } } },
    wh_seal_back: { kind: 'gate', gate: 'whip_hook', map: 1, at: [11840, 29790], r: 220, leads: 'c_lm_skiff_beach',
      name: ['a hook post on a buoy', 'a hook post'],
      build: { hook: { x: 11840, y: 29790, to: [11840, 29450] } } },

    // the Moon Ring (x1_world's c_lm_moonring look steps aside while this one is shown): at night the dust clue
    gm_moonring: { kind: 'examine', map: 1, at: [1350, 22760], over: 'c_lm_moonring', if: 'night', say: 'gm_moonring',
      then: ['clue q_moonring'], name: ['the Moon Ring', 'the Moon Ring'] },
  },

  scene: {
    gm_moonring: [
      ['narr', 'The seven stones hum, very softly. Silver dust lies thick in the middle of the ring.', 'The stones hum. Silver dust lies thick.'],
      ['narr', 'The grass is pressed flat in a great round dent, as if something big and soft sat here. Something VERY big.',
        'Something huge and soft sat here.'],
    ],
  },
})
