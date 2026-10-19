// game/story/act4/gates_map1.js (A4S): Act IV reasons to go back to the Clockwork Coast (map 1), with Moonfire and
// Burrow. Nooks the gate library builds (`at` is the centre, the payoff on top or inside within 0.6 r, the way in faces
// south). Spots read from the live game (A4S_NOTES.md, "Gates"): flat open ground, level 0.
//   q_g_ring   Moonfire  the Moth Watch, a rock beside the Moon Ring in the Moth Wood: the three silver trails
//                        (clue m4_ring_trails, why_three bonus)
//   q_g_xmark  Burrow    Saltbeard's Not-Treasure, a fenced patch of sand above the X on the Rockpools: a Heart Ember
places({
  id: 'a4s_map1', act: 4, map: 1,

  place: {
    // ---- G3. The Moth Watch (Moonfire). Where the Ember Heart was cracked, a rock with stairs of moon-glass looks down
    // on the ring. From the top, moonfire shows what moon-ink wrote on the ground long ago.
    q_g_ring: { kind: 'gate', gate: 'moon_glass', map: 1, at: [1260, 23180], r: 110, face: 's', leads: 'q_g_ring_view',
      payoff: { kind: 'truth', id: 'm4_ring_trails' },
      name: ['the Moth Watch', 'the Moth Watch'],
      locked: ['A rock beside the Moon Ring, with stairs of moon-glass. They are too thin to hold you. Moonlight might make them solid.',
        'Glass stairs. They need moonlight.'] },
    q_g_ring_view: { kind: 'examine', map: 1, at: [1260, 23150], look: 'a4s_trails', say: 'q_g_ring_view',
      then: ['clue m4_ring_trails', 'xp 200'], name: ['an old stone with silver lines', 'a silver stone'] },

    // ---- G5. Saltbeard's Not-Treasure (Burrow). Above the X on the Rockpools, a pen of old oars round a patch of sand.
    // Everybody digs the X. Nobody digs DEEP. Only a burrower gets under the oars.
    q_g_xmark: { kind: 'gate', gate: 'burrow_mound', map: 1, at: [3200, 28200], r: 80, face: 's', leads: 'q_g_xmark_chest',
      payoff: { kind: 'heart_ember', id: 'q_g_xmark' },
      name: ["Saltbeard's Not-Treasure", "Saltbeard's sand pen"],
      locked: ['A pen of old oars round a patch of sand. A sign on it says: KEEP OUT. THIS IS NOT TREASURE. S.',
        'A sign: THIS IS NOT TREASURE. S.'] },
    q_g_xmark_sign: { kind: 'sign', map: 1, at: [3120, 28330], look: 'a4s_oar_sign', name: ['an oar with a sign on it', 'a sign'],
      say: 'q_g_xmark_sign' },
    q_g_xmark_chest: { kind: 'chest', map: 1, at: [3200, 28190],
      loot: ['heart_ember q_g_xmark', 'give coins 80', { banner: ["Saltbeard's real treasure", "Saltbeard's real treasure"],
        sub: ["Saltbeard dug the X. He didn't dig DEEP.", 'He did not dig deep!'] }],
      name: ["Saltbeard's sea chest", 'a sea chest'] },
  },

  clue: {
    m4_ring_trails: { icon: 'moth', mystery: 'm4_night_mother',
      text: ['At the Moon Ring, three silver trails fly out of the ring: west, north and east. Under them, in moth dust: ALL THREE COME HOME.',
        'Three trails at the Moon Ring. ALL THREE COME HOME.'] },
  },

  scene: {
    q_g_xmark_sign: [
      ['narr', 'KEEP OUT. THIS IS NOT TREASURE. ALSO NOT DEEP. S.', 'KEEP OUT. NOT TREASURE. S.', { ref: 'q_g_xmark' }],
      ['ash', 'That is exactly what somebody with treasure would write.', 'That is what a pirate would write.'],
    ],
    q_g_ring_view: [
      ['narr', 'From up here you can see the whole Moon Ring, where the Ember Heart cracked into three.', 'You can see the whole Moon Ring.'],
      ['narr', 'In the moonfire, silver lines glow on the ground. Three trails run out of the ring, like ribbons: west, north and east.',
        'Three silver trails run out of the ring.', { ref: 'c_lm_moonring' }],
      ['narr', 'Under them, in moth dust, somebody wrote: "All three come home."', '"All three come home."', { clue: 'm4_ring_trails' }],
      ['ash', 'Three Shards. Three trails. She wants them all back together.', 'She wants all three back together.'],
    ],
  },
})
