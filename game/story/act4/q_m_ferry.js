// game/story/act4/q_m_ferry.js (A4S): The Raft Ferry (m_ferry). Giver: Rowan Knotwood, Driftwood Landing.
// The Crab Pirates cut every one of Rowan's ferry lines. Once the Baron is out of the Sunken Gate (m_puff_done), Ash
// clears the two crab forts on the reef isles, then drives the three crooked ferry posts down with a Ground Pound and
// flings the line from post to post with the Grapple Tail (the last line reaches the Gate). Surprise: the first thing
// the new line brings home is the chickens' raft that drifted off on the day Ash arrived (A4a's m_drift), chickens and
// all. Payoff: a shortcut (world m4s_ferry open: Rowan's raft ferry between Driftwood, Palmcrest and Strand Landing).
// Old saves: QDEFS.m_ferry steps 0..2 map to forts, posts, rowan. The forts and the posts stay x3_people's (the forts
// tick while the quest is open; the posts while m3pAt('m_ferry',1): a legacy step).
quest({
  id: 'm_ferry', act: 4, giver: 'm_rowan', optional: true, takeover: true,
  title: ['The Raft Ferry', 'The Raft Ferry'],
  payoff: { kind: 'shortcut', id: 'm4s_ferry' },
  old_steps: ['forts', 'posts', 'rowan'],

  step: [
    { id: 'forts', do: 'all', obj: ['Clear the two Crab Pirate forts on the reef isles', 'Clear the two crab forts'],
      hint: ['Beat every crab at each fort. They are on the reef isles out in the lagoon.', 'Beat the crabs at both forts.'],
      parts: [
        { do: 'wait_for flag m_fort1', marker: 'm4s_fort1' },
        { do: 'wait_for flag m_fort2', marker: 'm4s_fort2' },
      ] },
    { id: 'posts', do: 'all', legacy: true,
      obj: ['Pound the three ferry posts down, then fling the line across with your tail', 'Pound each post. Throw the line with your tail.'],
      hint: ['Ground Pound right next to a crooked post to drive it in. Then look at it and fling the line on. Post one, two, three.',
        'Pound a post. Then throw the line. In order!'],
      parts: [
        { do: 'wait_for flag m_post1', marker: 'm3p_post1' },
        { do: 'wait_for flag m_post2', marker: 'm3p_post2' },
        { do: 'wait_for flag m_post3', marker: 'm3p_post3' },
      ] },
    { id: 'rowan', do: 'talk m_rowan', scene: 'fr_done',
      then: ['world m4s_ferry open', 'xp 350', 'give coins 60', { banner: ["Rowan's raft ferry", "Rowan's raft ferry"],
        sub: ['The ferry runs between Driftwood, Palmcrest and Strand Landing. Ask at the ferry posts.', 'Take the ferry at the ferry posts.'] }],
      obj: ['Tell Rowan the lines are up', 'Tell Rowan'] },
  ],

  scene: {
    fr_offer: [
      ['m_rowan', 'This is a "help me" knot. I don\'t tie it often.', 'This is my "help me" knot.'],
      ['m_rowan', 'The Crab Pirates cut every one of my ferry lines. With them up, my ferry runs from here to the Strand in one go.',
        'Crab Pirates cut my ferry lines.'],
      ['m_rowan', "The Baron's out of the Sunken Gate now. But his crab crew still has two forts on the reef isles.",
        'Their crew has two forts on the reef isles.', { if: 'flag m_puff_done', fact: 'm4s_sunken_gate=open' }],
      { choose: 'm_ferry_offer', ask: ['Fix the ferry lines for Rowan?', 'Fix the ferry?'], pick: [
        { t: ["I'll sort the crabs out.", "I'll do it!"], tone: 'brave', then: ['quest start m_ferry'],
          say: [['m_rowan', 'Then the posts. They lean like they\'ve had a long day. Something heavy from above should do it.',
            'Then the posts. They need a big slam.']] },
        { t: ['Not now', 'Not now'], say: [['m_rowan', '*ties a "maybe later" knot*', '*ties a "later" knot*']] },
      ] },
    ],
    fr_done: [
      ['m_rowan', 'This is a "thank you" knot. Biggest one I ever tied. Took me all morning.', 'My biggest "thank you" knot!'],
      ['narr', 'Out on the new line, something bobs closer and closer. It is a small raft. It is full of chickens.',
        'Something floats in on the line. A raft of chickens!'],
      ['m_rowan', "The chickens' raft! It drifted off the day you came. It must have snagged on the line. Welcome home, girls.",
        "The chickens' raft is back! Welcome home, girls."],
      ['m_rowan', "The ferry's yours whenever you want it. Driftwood, Palmcrest, the Strand. Mind the chickens.",
        'Use the ferry any time. Mind the chickens.'],
    ],
  },

  talk: {
    m_rowan: [
      { if: 'stage>=m_reef flag m_puff_done !quest m_ferry active !quest m_ferry done',
        option: ['Why the knot?', 'Why the knot?'], scene: 'fr_offer' },
    ],
  },
})
