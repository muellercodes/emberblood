// Act IV, The Night Mother: the act file (owner A4b). Mysteries, the ending (the Hush choice), the end card.
// Chapters: m_sail, m_drift, m_lumen, m_coral, m_reef, m_sable, m_burrows (A4a); m_glasswall, m_mirror, m_moonpath,
// m_observatory, m_reforge (A4b). Side quests, people's talk and the gates on maps 0 to 2: A4S. Data only.
act({
  id: 4, name: 'The Night Mother', map: 3,

  mystery: {
    // the main mystery: four deductions. A4a: where_shard (where did the grey moth take the last Shard?). A4b:
    // where_feed (where will she feed next? the Moon Well), why_three (why all three Shards? a whole Heart can burn
    // black), free_hush (how can Hush be set free? melt the knots with gentle Moonfire)
    m4_night_mother: { main: true,
      title: ['What does the Night Mother want, and how do we stop her?', 'What does the Night Mother want?'],
      deduce: ['where_shard', 'where_feed', 'why_three', 'free_hush'],
      herring: ['m4_bottom_sea', 'm4_rafi_sun', 'm4_fanfare_shiny', 'm4_glaive_cuts'],
      solved: ['She wants all three Shards so the Heart is whole, because only a whole Heart can burn black. Ash mends it anyway, and keeps it warm.',
               'She wants the Heart whole. Ash keeps it warm.'] },
    // small (A4a, chapter 1): the moon is getting smaller, and the sea follows the moon
    wobbly_tide: {
      title: ["Why has Driftwood's tide gone wobbly?", 'Why is the tide wobbly?'],
      deduce: ['wobbly_tide'],
      herring: ['m4_puff_plug'] },
    // small, optional (clues A4a, A4S, A4b; the deduction is in m_observatory.js): Duke Umberwing and his Moth Knights
    lamp_thief: {
      title: ['Who is stealing the lamps of Moonfall?', 'Who steals the lamps?'],
      deduce: ['lamp_thief'],
      herring: ['m4_octavia_hoard', 'm4_jinx_lamps'],
      solved: ['Duke Umberwing ate them. Every Lantern Day, a parcel comes to Sable now. It says SORRY.', 'The Duke took them. Now he sends them back.'] },
  },

  // there is no trust track in Act IV
  trust: {},

  // the act's big choice: Hush, after her fight in the Observatory (m_observatory's m_hush_out, played by the old
  // fight's own hook). Both options always show: free_hush is solved on the main path before the Observatory.
  // Later acts read G.choices.m_hush ('free' or 'foe'; x4_story, x4_foes, e7b_threads).
  ending: {
    free: { at: 'm_observatory', scene: 'm_hush_out', choice: 'm_hush=free', if: 'choice m_hush=free' },
    foe:  { at: 'm_observatory', scene: 'm_hush_out', choice: 'm_hush=foe', else: true },
  },

  // the end card (m_reforge's `end_act 4` calls endAct(4, this); "Continue" starts Act V at n_bridge)
  end_act: {
    title: ['Act IV: The Night Mother', 'Act IV: The Night Mother'],
    lines: [
      ['The Ember Heart is whole.', 'The Ember Heart is whole.'],
      ['The moon is gone.', 'The moon is gone.'],
      ['Next: Nightfall Peak.', 'Next: Nightfall Peak.'],
    ] },

  gates_min: 5,
})
