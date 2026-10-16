// Act II, The Masked Thief: the act file (owner A2b). Mysteries, trust, endings, the end card, old-save migration.
// Chapters: c_coast, c_gear (ENG), c_salt, c_claws, c_brass (A2a), c_light, c_spire, c_snow (A2b). Side quests and
// people's talk: A2S. Data only.
act({
  id: 2, name: 'The Masked Thief', map: 1,

  mystery: {
    // the main mystery: four deductions, one per part of her story
    moth_mask: { main: true,
      title: ['Who is the Moth Mask, and why does she steal?', 'Who is the Moth Mask?'],
      deduce: ['where_next', 'who_is_she', 'why_glowing', 'what_she_is'],
      herring: ['g_penny_first', 's_baron_rumor'] },
    // small: the night everything stopped (answer: a moth bigger than a ship flew over the coast; Vesper names her
    // Murmur at the top of the Spire, and her notebook page tells the rest)
    what_stopped: {
      title: ['What stopped the clocks, the tide and the light?', 'What stopped the clocks?'],
      deduce: ['what_stopped'],
      herring: ['q_whirligig_sales'] },
    // small: the rope bridge (answer: Vesper, to slow Ash down; she tied a rope so nobody would fall). Payoff: the
    // harbor crew rebuilds the bridge, a walkway over the Cut (c_cut_bridge).
    who_cut: {
      title: ['Who cut the rope bridge at the Cut?', 'Who cut the bridge?'],
      deduce: ['who_cut'],
      herring: ['l_crab_claim'] },
  },

  // Vesper's trust is the old flag (saves keep working). The main path gives exactly 4 when Ash is kind every time:
  // K1 c_gear chase (c_chase=helped), K2 c_claws cliff (c_cliff=gran), K3 c_brass Nest (c_biscuits=left), K4 c_light
  // Lamp Room (c_lamp=saved). Bonus: the Act I locket (once: the Spire roof, or Gran via A2S), and the side quests.
  trust: { vesper: 'c_trust', max: 7,
    banner: ['Vesper trusts you a little more.', 'Vesper trusts you more.'] },

  // decided at the kneel at the top of the Spire (c_spire's c_kneel), read by later acts as G.choices.c_vesper
  ending: {
    friend: { at: 'c_spire', scene: 'c_top', choice: 'c_vesper=friend',
              if: { any: ['trust vesper>=4', 'trust vesper>=3 quest c_logbook done'] } },
    foe:    { at: 'c_spire', scene: 'c_top', choice: 'c_vesper=foe', else: true },
  },

  // the end card (the `end_act` effect in c_snow calls endAct(2, this) and sets c_done)
  end_card: {
    title: ['Act II: The Masked Thief', 'Act II: The Masked Thief'],
    lines: [
      ['Shard 1 of 3, the Dusk Shard. One more flew north. One more flew east.', 'You have 1 of 3 Shards.'],
      ['To the north, the world has gone white. And the moon has a bite out of it.', 'The north is white. The moon has a bite gone.'],
    ] },

  // old saves (no G.story yet) that are already past c_light never found the c_light clues the Spire door asks about:
  // give them, so the door riddle can be answered. (k_claws is A2a's c_claws clue.)
  migrate: [
    { if: 'stage>=c_spire', then: ['clue l_fireproof', 'clue l_pearl_mural', 'clue k_claws'] },
  ],

  gates_min: 5,
})
