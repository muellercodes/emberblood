// DEMO data for tools/storymap.mjs and a whole-act run of the checker. Not game data: the writers own game/story.
// It follows ACT2_SKELETON.md loosely, with short stand-in text, and keeps three problems on purpose so the map
// shows red: one gate leads to nothing that pays, one scene after a boss is too long, and the main path gives
// trust 3 of the 4 the friend ending needs.
act({ id: 2, name: ['The Masked Thief', 'The Masked Thief'], map: 1,
  mystery: {
    moth_mask:    { main: true, title: ['Who is the Moth Mask, and why does she steal?', 'Who is the Moth Mask?'] },
    what_stopped: { title: ['What stopped the clocks, the tide and the light?', 'What stopped the clocks?'] },
    who_cut:      { title: ['Who cut the rope bridge at the Cut?', 'Who cut the bridge?'] },
  },
  trust: { vesper: 'c_trust' },
  ending: {
    friend: { if: 'trust vesper>=4 solved what_she_is', at: 'c_spire', scene: 'c_end_friend' },
    foe:    { else: true, at: 'c_spire', scene: 'c_end_foe' },
  },
  gates_min: 5,
})
