chapter({ id: 'c_light', act: 2, after: 'c_brass', next: 'c_spire', card: ['Act II', 'Light'],
  step: [ { id: 'lamp', do: 'cutscene c_lamp' } ],
  scene: { c_lamp: [
    { choose: 'c_lamp', ask: ['Save her?'], pick: [
      { t: ['Breathe fire on the moths', 'Fire!'], then: ['trust vesper +1'] },
      { t: ['Run', 'Run'] },
    ] },
    { if: 'item a1_locket', then: [ ['ash', 'This is yours.', { do: ['trust vesper +1'] }] ] },
  ] },
})
