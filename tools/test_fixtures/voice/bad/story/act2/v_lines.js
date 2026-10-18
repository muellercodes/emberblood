// CAPS share (3 of 10 lines; the budget lets 1 through), opener share (Otto opens 4 of 6 lines with "Oh!", "Okay."
// or "..."), and a choose that asks "What do you do?" (the default) right after a line by Ash
chapter({ id: 'v_lines', act: 2, after: 'v_end', next: null, last: true, card: ['Act II', 'Lines'],
  npc: { v_otto: { name: ['Otto', 'Otto'], map: 1, at: [7200, 25000] } },
  step: [ { id: 's', do: 'cutscene v_lines_s' } ],
  scene: {
    v_lines_s: [
      ['v_otto', 'Oh! A visitor.', 'A visitor!'],
      ['v_otto', 'Okay. Come in, then.', 'Come in.'],
      ['v_otto', '...Mind the step.', 'Mind the step.'],
      ['v_otto', 'Oh! The step. I did say.', 'The step!'],
      ['v_otto', 'The kettle is NEVER on.', 'No kettle.'],
      ['v_otto', 'I have ONE cup.', 'One cup.'],
      ['ash', 'I will SHARE it.', 'I will share.'],
      { choose: 'v_lines_c', pick: [
        { t: ['Sit down.', 'Sit.'], say: [['v_otto', 'On what?']] },
        { t: ['Leave.', 'Leave.'], say: [['v_otto', 'Bye, then.']] },
      ] },
    ],
  },
})
