// game/story/act4/m_burrows.js (A4a): Act IV, Chapter 3, "The Glass Desert": the Sandworm Burrows.
// What the player does: goes north from Sable to the Worm Mouth (a ring of quicksand: fly over it, or Blaze it into
// glass), then down into the Sandworm Burrows (the dungeon stays code; Ember's flame there gives Burrow, handed over by
// the worm king himself, Gravelgut, in a clear moment before the sickness takes him: x3_story's shrine words, v11). Gravelgut,
// the sick king worm, coughs up what made him sick: a crumb of the MOON (item m_mooncrumb, x3_story's m_burrows_won as
// today; Old Kiln's side quest m_glaive reads it). Ember's last words in the Burrows now say to go back to Sable FIRST
// (audit finding 7: the Burrow Gap only opens in chapter 4, after the second eclipse at the Moon Well), and the story
// hands over to A4b's m_glasswall.
chapter({
  id: 'm_burrows', act: 4, after: 'm_sable', next: 'm_glasswall', takeover: true,
  card: null, name: ['Glass Half Full', 'The Glass Desert'],
  so_far: [
    'The sandworms go under the Glasswall. To follow them, Ash must learn to burrow. And down in the Burrows, the old king worm is sick.',
    'Worms go under the Glasswall. Ash must learn to dig. The king worm is sick.'],
  hint: ['North from Sable to the Worm Mouth. Fly over the quicksand, or make a glass path with Blaze.',
    'Go north from Sable to the Worm Mouth. Fly over the quicksand, or Blaze it.'],

  step: [
    { id: 'mouth', do: 'goto m4_worm_mouth 480', scene: 'brw_ring',
      obj: ['Go north from Sable to the Worm Mouth', 'Go north to the Worm Mouth'] },
    { id: 'burrows', do: 'dungeon m_burrows', then: ['set m_burrows_done', 'stage m_glasswall'],
      obj: ["Find Ember's flame in the Sandworm Burrows", "Find Ember's flame in the Burrows"] },
  ],

  scene: {
    brw_ring: [
      ['narr', 'Round the Worm Mouth the sand moves by itself, slowly, like soup that is thinking.', 'Round the Worm Mouth the sand moves by itself.'],
      ['iska', 'A ring of quicksand. Fly over it, or make yourself a glass path with Blaze.', 'A ring of quicksand. Fly over it, or Blaze it into glass.'],
    ],
    // the old STORY.m_burrows_end (the dungeon plays it at its end), replaced in place: Sable first, then the Glasswall
    // (v11: Iska, not Ember; Ember speaks once in Act IV, at the Mirror Temple)
    m_burrows_end: [
      ['iska', 'A crumb of the moon. Keep it, Ash. Somebody in Sable who works with fire and glass might know what to do with a thing like that.',
        'A crumb of the moon. Keep it. Someone in Sable who works with glass will know.'],
      ['iska', "Go back to Sable first. Then under the Glasswall, the way the worms go. There's one more of Ember's flames past it, in a temple.",
        'Go back to Sable first. Then dig under the Glasswall, like the worms.', { ref: 'm4_gap_sign' }],
      ['narr', 'Step into the warp ring to go back outside.', 'Step in the warp ring to go outside.'],
    ],
  },
})
