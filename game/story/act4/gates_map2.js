// game/story/act4/gates_map2.js (A4S): Act IV reasons to go back to Frostreach (map 2), with Dive and the Moon Glaive.
// Spots read from the live game (A4S_NOTES.md, "Gates").
//   q_g_steam   Dive         the Steamwell Rock in the hot springs: Hilde's knitting basket. Hilde Pottersnow (the Warm
//                            Mitten, Hearthold) knits it into a sweater "for a cold moth" (item m4_sweater, which the
//                            Hush free branch reads: ACT4_V10 2.3)
//   q_g_cocoon  Moon Glaive  the moon-silk cocoon at the Dreadgate, where Hush shrank in Act III: a Heart Ember frozen
//                            inside. The gate library has no Glaive kind yet (A4S ENGINE REQUEST: silk_web in CHANGES.md),
//                            so the cocoon is an examine place: only the Glaive cuts it (power glaive in the scene),
//                            fire makes it glow, claws slide off. It does not count towards gates_min.
places({
  id: 'a4s_map2', act: 4, map: 2,

  item: {
    m4_basket: { name: ["Hilde's knitting basket", "Hilde's basket"], icon: 'basket',
      desc: ['Soggy, warm, and full of wool. The Steamwell ate it. Hilde will want it back.', 'Soggy and full of wool. For Hilde.'] },
    m4_sweater: { name: ['A very small knitted sweater', 'A tiny sweater'], icon: 'scarf', keepsake: true,
      desc: ['Hilde knitted it from the rescued wool. It is far too small for you. "For a cold moth, I heard," she said.',
        'A tiny sweater. "For a cold moth."'] },
  },

  place: {
    // ---- G4. The Steamwell Rock (Dive). A warm rock beside the Steamwell. A deep pool at its foot runs under it and comes
    // up in a hollow on top, where the springs washed Hilde's basket.
    q_g_steam: { kind: 'gate', gate: 'dive_spot', map: 2, at: [3330, 49420], r: 110, face: 's', leads: 'q_g_steam_chest',
      payoff: { kind: 'item_main', id: 'm4_sweater' },
      name: ['the Steamwell Rock', 'the Steamwell Rock'],
      locked: ['A warm rock beside the Steamwell, with a deep pool at its foot. Something woolly bobs far down in it.',
        'A deep pool. You need to dive.'] },
    q_g_steam_chest: { kind: 'chest', map: 2, at: [3360, 49395],
      loot: ['give m4_basket', 'give coins 40', { banner: ["Hilde's knitting basket!", "Hilde's basket!"],
        sub: ['Soggy, warm, and full of wool. Take it to Hilde at the Warm Mitten.', 'Take it to Hilde.'] }],
      name: ['a soggy basket, caught in the rocks', 'a soggy basket'] },

    // ---- G6. The Dreadgate cocoon (Moon Glaive). Moon silk left behind where Hush shrank in Act III.
    q_g_cocoon: { kind: 'examine', map: 2, at: [7150, 44250], r: 40, look: 'a4s_cocoon', states: { cut: 'a4s_cocoon_cut' },
      payoff: { kind: 'heart_ember', id: 'q_g_cocoon' }, need: 'power glaive',
      say: 'q_g_cocoon',
      name: ['a cocoon of moon silk', 'a moon-silk cocoon'] },
  },

  scene: {
    q_g_cocoon: [
      { if: 'world q_g_cocoon=cut', then: [
        ['narr', 'Peeled silver silk, soft as moth wings. Nothing inside now but a warm spot on the stone.', 'Empty silk. A warm spot.'],
      ], else: [
      ['narr', 'A cocoon of silver silk as big as a barrel, stuck to the stones where Hush shrank. Something warm glows inside.',
        'A big silver cocoon. Something glows inside.'],
      { if: 'power glaive', then: [
        ['narr', 'You throw the Moon Glaive. It hums round the cocoon once, twice, and comes back to your hand.', 'You throw the Moon Glaive. It comes back.'],
        ['narr', 'The silk falls open like a peeled orange. Inside, frozen in a ball of old ice, is a Heart Ember.',
          'The silk falls open. A Heart Ember!', { do: ['heart_ember q_g_cocoon', 'world q_g_cocoon cut'] }],
        ['ash', 'She was keeping it warm. She never could.', 'She tried to keep it warm.'],
      ], else: [
        ['narr', 'Fire only makes it glow, and claws slide right off. Moon silk. Something made of the moon might cut it.',
          'Fire and claws do nothing. Something from the moon might.', { promise: 'm_glaive' }],
      ] },
      ] },
    ],
  },
})
