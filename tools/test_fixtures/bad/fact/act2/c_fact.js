// fact: "Still stopped." with no condition; and a fact whose condition is the wrong flag
chapter({ id: 'c_fact', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Facts'],
  place: { gh_clock: { map: 1, at: [7200, 24600], kind: 'prop', name: 'the Great Clock', states: { stopped: '!flag c_clock_on', ticking: 'flag c_clock_on' } } },
  npc: { c_whirl: { name: ['Lord Whirligig', 'Lord Whirligig'], map: 1, at: [7900, 24900] } },
  step: [ { id: 's', do: 'talk c_whirl' } ],
  talk: {
    c_whirl: [
      { fact: 'gh_clock=stopped', bark: true, say: ['Still stopped.', 'Still stopped.'] },
      { if: 'flag c_lit', fact: 'gh_clock=stopped', say: ['Still stopped!', 'Still stopped!'] },
    ],
  },
})
