// solve: the friend ending needs trust 4, the main path gives 2 (3 with the Act I locket, an optional item)
act({ id: 2, name: 'The Masked Thief', map: 1,
  mystery: {
    moth_mask:    { main: true, title: ['Who is the Moth Mask?', 'Who is she?'] },
    what_stopped: { title: ['What stopped the clocks?', 'What stopped the clocks?'] },
    who_cut:      { title: ['Who cut the ropes?', 'Who cut the ropes?'] },
  },
  trust: { vesper: 'c_trust' },
  ending: { friend: { if: 'trust vesper>=4', at: 'c_spire' }, foe: { else: true } },
  gates_min: 0,
})
