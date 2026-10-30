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
      herring: ['g_penny_first', 's_baron_rumor'],
      solved: ['The Moth Mask is Vesper Saltwhistle of Saltmarsh: Pearl\'s line, claws and no fire, and Ash\'s cousin. She stole light for a Lady in her dreams, to keep her gran warm. Case closed, cousin found.',
        'The Moth Mask is Vesper, Ash\'s cousin. She stole light to keep Gran warm.'] },
    // small: the night everything stopped (answer: something huge flew over the coast; at the top of the Spire Vesper
    // says it was the Lady herself, a moth, and her notebook page tells the rest: the Mother, with two pale moons on
    // her wings, cracked the Heart and stopped every clock at one minute to midnight. There is no Murmur any more.)
    what_stopped: {
      title: ['What stopped the clocks, the tide and the light?', 'What stopped the clocks?'],
      deduce: ['what_stopped'],
      herring: ['q_whirligig_sales'],
      solved: ['Something huge flew over the whole coast at one minute to midnight, and the clocks, the tide and the light all stopped with it. Squawk was right. Nobody will ever hear the end of it.',
        'Something huge flew over and stopped everything. Squawk was right.'] },
    // small: the rope bridge (answer: Vesper, to slow Ash down; she tied a rope so nobody would fall). Payoff: the
    // harbor crew rebuilds the bridge, a walkway over the Cut (c_cut_bridge).
    who_cut: {
      title: ['Who cut the rope bridge at the Cut?', 'Who cut the bridge?'],
      deduce: ['who_cut'],
      herring: ['l_crab_claim'],
      solved: ['Vesper cut the rope bridge to slow Ash down, and tied a rope across the road first so nobody would walk off the edge. It was not crabs. Admiral Pinch would like an apology.',
        'Vesper cut the bridge, but tied a rope so nobody fell. Not crabs!'] },
  },

  // Vesper's trust is the old flag (saves keep working). The main path gives exactly 4 when Ash is kind every time:
  // K1 c_gear chase (c_chase=helped), K2 c_claws cliff (c_cliff=gran), K3 c_brass Nest (c_biscuits=left), K4 c_light
  // Lamp Room (c_lamp=saved). Bonus: the Act I locket (once: the Spire roof, or Gran via A2S), and the side quests.
  trust: { vesper: 'c_trust', max: 7,
    banner: ['Vesper trusts you a little more.', 'Vesper trusts you more.'] },

  // decided at the kneel at the top of the Spire (c_spire's c_choice), shown in its c_warp_out, read by later acts as
  // G.choices.c_vesper
  ending: {
    friend: { at: 'c_spire', scene: 'c_warp_out', choice: 'c_vesper=friend',
              if: { any: ['trust vesper>=4', 'trust vesper>=3 quest c_logbook done'] } },
    foe:    { at: 'c_spire', scene: 'c_warp_out', choice: 'c_vesper=foe', else: true },
  },

  // the end card (c_snow's `end_act 2` effect calls endAct(2, this); endAct sets act2_done and c_done)
  end_act: {
    title: ['Act II: The Masked Thief', 'Act II: The Masked Thief'],
    lines: [
      ['Shard 1 of 3, the Dusk Shard. One more flew north. One more flew east.', 'You have 1 of 3 Shards.'],
      ['To the north, the world has gone white. And the moon has a bite out of it.', 'The north is white. The moon has a bite gone.'],
    ] },

  // old saves (no G.story yet) that are already past c_light never found the c_light clues the Spire door asks about:
  // give them, so the door riddle can be answered. (k_claws is A2a's c_claws clue.)
  migrate: [
    { if: 'stage>=c_spire', then: ['clue l_fireproof', 'clue l_pearl_mural', 'clue k_claws'] },
    // (v12 R2) the door question now also needs the moths' own clue (c_spire's sp_door_ask): a save that already heard
    // them ask, before this version, gets it here
    { if: 'seen c_spire_door_ask', then: ['clue sp_door_ask'] },
  ],

  gates_min: 5,
})
