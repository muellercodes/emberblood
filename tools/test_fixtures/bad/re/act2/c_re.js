// re: replies that break the shape rules (STORY_PLAN 6.3): one reply only, a reply over 8 words, a response that starts
// with Ash, a reply with no response, the same reply text twice, a next inside a next, re with no line to answer
chapter({ id: 'c_re', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Replies'],
  npc: { v_tess: { name: ['Tess Tiller', 'Tess'], map: 1, at: [7000, 25000] } },
  step: [ { id: 's', do: 'cutscene c_re_s' } ],
  scene: {
    c_re_s: [
      ['v_tess', 'The goats got into the bell tower again.', { re: [
        { t: ['How did they get up there?', 'How?'], say: [['v_tess', 'Nobody knows. Goats are like that.']] },
      ] }],
      ['v_tess', 'Will you help me count them?', { re: [
        { t: ['Yes, and I will count every single goat in the whole tower twice.', 'Yes, twice.'], say: [['v_tess', 'Twice. Good.']] },
        { t: ['Count them yourself.', 'You count.'], say: [['ash', 'I mean it.'], ['v_tess', 'Fine.']] },
        { t: ['Maybe later.', 'Later.'] },
      ] }],
    ],
  },
  talk: {
    v_tess: [
      { if: 'stage>=c_re', say: ['Eleven goats. I counted.', 'Eleven goats.'], re: [
        { t: ['Count them yourself.', 'You count.'], say: [['v_tess', 'I did. Eleven.']] },
        { t: ['Were there twelve?', 'Twelve?'], say: [['v_tess', 'There were. Once.']],
          next: { say: ['Do you want to hear about the twelfth?', 'Hear about it?'], re: [
            { t: ['Yes, please.', 'Yes.'], say: [['v_tess', 'Another time.']], next: { say: ['Later, then.', 'Later.'] } },
            { t: ['No thanks.', 'No.'], say: [['v_tess', 'Suit yourself.']] },
          ] } },
      ] },
      { if: 'stage>=c_salt', re: [
        { t: ['Hello again.', 'Hi.'], say: [['v_tess', 'Hello.']] },
        { t: ['Bye now.', 'Bye.'], say: [['v_tess', 'Bye.']] },
      ] },
    ],
  },
})
