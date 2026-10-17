// DEMO data (see _act.js). Stand-in text.
chapter({
  id: 'c_claws', act: 2, after: 'c_salt', next: 'c_brass',
  card: ['Act II · Chapter 4', 'The Gullcrag Caves'],
  clue: { k_claws: { icon: 'claw', text: ['Vesper climbs with claws like the ones Pearl left Ash.', 'She climbs like Ash.'] } },
  step: [
    { id: 'caves', do: 'dungeon c_gullcrag', obj: ['Explore the Gullcrag Caves', 'Explore the caves'] },
    { id: 'cliff', do: 'cutscene c_cliff', then: ['clue k_claws'] },
  ],
  scene: {
    c_cliff: [
      ['narr', 'Vesper sits on the cliff edge, claws out, watching the sea.', 'Vesper sits on the cliff.'],
      ['c_vesper', 'You climbed it too. Pearl\'s claws suit you.', 'You climbed it too.'],
      { choose: 'c_cliff', ask: ['What do you say?'], pick: [
        { t: ["Vesper. Your gran is cold, isn't she?", 'Your gran is cold?'], if: 'solved who_is_she', tone: 'kind', then: ['trust vesper +1'],
          say: [['c_vesper', '...How do you know my name?']] },
        { t: ['Give it back!', 'Give it back!'], say: [['c_vesper', 'Catch me first. Again.']] },
      ] },
    ],
  },
})
