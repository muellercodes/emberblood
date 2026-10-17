// game/story/act4/gates_map0.js (A4S): Act IV reasons to go back to Embermere (map 0), with Dive and Moonfire.
// Each gate is a nook the gate library builds (no build block: `at` is the centre of the rock, the payoff sits on top
// within 0.6 r, the way in faces south). Spots read from the live game (A4S_NOTES.md, "Gates"): flat open ground,
// level 0, trees cleared by the nook itself.
//   q_g_mirrow  Dive      the Plughole Rock by Old Sal's boat on Lake Mirrow: Dell's first boat, a Heart Ember
//   q_g_iska    Moonfire  the Moon Step behind Iska's Ward-stone: Iska's note to herself (clue m4_iska_note, free_hush bonus)
places({
  id: 'a4s_map0', act: 4, map: 0,

  place: {
    // ---- G1. The Plughole Rock (Dive). A rock on the lake shore south of Old Sal's half-built boat. A deep pool at its
    // foot runs under the rock and comes up in a hollow on top, where the Soggy Biscuit ONE ended up on launch day.
    q_g_mirrow: { kind: 'gate', gate: 'dive_spot', map: 0, at: [5300, 7420], r: 110, face: 's', leads: 'q_g_mirrow_chest',
      payoff: { kind: 'heart_ember', id: 'q_g_mirrow' },
      name: ['the Plughole Rock', 'the Plughole Rock'],
      locked: ['A big rock by the lake, with a deep, dark pool at its foot. Bubbles come up from somewhere far below.',
        'A deep pool. You need to dive.'] },
    q_g_mirrow_board: { kind: 'examine', map: 0, at: [5330, 7372], look: 'a4s_nameboard', say: 'q_g_mirrow_board',
      then: ['epi m4_epi_biscuit 4'], name: ['a broken nameboard', 'a nameboard'] },
    q_g_mirrow_chest: { kind: 'chest', map: 0, at: [5345, 7425],
      loot: ['heart_ember q_g_mirrow', 'give coins 60', { banner: ["Old Sal's ember lamp", "Sal's ember lamp"],
        sub: ['It went down with the boat. It is still warm.', 'It is still warm!'] }],
      name: ["the Soggy Biscuit ONE's lamp box", 'a lamp box'] },

    // ---- G2. The Moon Step (Moonfire). A rock behind Iska's Ward-stone at the edge of Emberhollow, with stairs of
    // moon-glass that only hold while moonlight shines on them. On top, a niche sealed with silver.
    q_g_iska: { kind: 'gate', gate: 'moon_glass', map: 0, at: [3500, 8520], r: 110, face: 's', leads: 'q_g_iska_note',
      payoff: { kind: 'truth', id: 'm4_iska_note' },
      name: ['the Moon Step', 'the Moon Step'],
      locked: ['Stairs of pale glass go up the rock behind the Ward-stone. Too thin to stand on. They look like they want moonlight.',
        'Glass stairs. They want moonlight.'] },
    q_g_iska_note: { kind: 'examine', map: 0, at: [3500, 8500], look: 'a4s_niche', say: 'q_g_iska_note',
      then: ['clue m4_iska_note', 'xp 200'], name: ['a little niche sealed with silver', 'a silver niche'] },
  },

  clue: {
    m4_iska_note: { icon: 'note', mystery: 'm4_night_mother',
      text: ['A note Iska hid at home long ago: "Moon things listen to moonlight, not claws. If you ever have to free one of her moths, be gentle. I."',
        'Iska\'s old note: "Be gentle with her moths."'] },
  },

  scene: {
    q_g_mirrow_board: [
      ['narr', 'A broken nameboard, painted by somebody very proud: SOGGY BISCUIT ONE.', 'A nameboard: SOGGY BISCUIT ONE.'],
      ['ash', "Dell's first boat! He said it sank on launch day. He said it was a SMALL leak.", "Dell's first boat!"],
      ['narr', 'The whole boat went down the plughole and came up in here. The ducks must have been very surprised.',
        'It came up in here. Surprise, ducks.'],
    ],
    q_g_iska_note: [
      ['narr', 'A little stone niche, sealed with silver. The silver runs away like water in the moonfire.', 'The silver seal melts.'],
      ['narr', 'Inside: a note in very old ink. "Moon things listen to moonlight, not claws. If you ever have to free one of her moths, be gentle. I."',
        '"Moon things listen to moonlight. Be gentle. I."', { clue: 'm4_iska_note' }],
      ['iska', 'I wrote that? ...I wrote that.', 'I wrote that?'],
      ['iska', 'I must have known, once. Five hundred years is a long time to keep things in your head.',
        'I knew once. Then I forgot.'],
    ],
    m4_epi_biscuit: [
      ['narr', "Old Sal hung the Soggy Biscuit ONE's nameboard over the boatshed door. Dell cries every time he sees it. Happy crying.",
        'Sal hung up the old boat name. Dell cries. Happy.'],
    ],
  },
})
