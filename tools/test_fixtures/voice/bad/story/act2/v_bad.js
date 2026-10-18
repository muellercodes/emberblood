// The voice and talk rules (J2) on text over every budget. tools/test_check.sh checks each warning by its line.
chapter({ id: 'v_bad', act: 2, after: 'v_start', next: 'v_end', card: ['Act II', 'Bad'],
  npc: {
    v_tess: { name: ['Tess Tiller', 'Tess'], map: 1, at: [7000, 25000] },
    v_rolf: { name: ['Rolf', 'Rolf'], map: 1, at: [7100, 25000] },
  },
  step: [ { id: 's1', do: 'cutscene v_bad_s' }, { id: 's2', do: 'cutscene v_bad_s2' }, { id: 's3', do: 'talk v_tess' } ],
  scene: {
    v_bad_s: [
      ['ash', 'Great-great-great-great-aunt Tess?', 'Great-great-aunt Tess?'],
      ['v_tess', 'Two greats. Not four.', 'Two greats.'],
      ['ash', 'Two greats is still a lot of greats.', 'Still a lot of greats.'],
      ['v_tess', 'Oh, hello, little ember. Have a dumpling.', 'Hello, little ember.'],
      ['ember', 'Look after yourself, little ember.', 'Look after yourself, little ember.'],
      ['v_tess', 'My little duck. Sit, dearie. It is Tuesday.', 'Sit, duck. It is Tuesday.'],
      ['v_rolf', 'HALT! Eat something first.', 'HALT! Eat first.'],
    ],
    v_bad_s2: [
      ['maren', 'Eat something before you go, Ash.', 'Eat something first.'],
      ['v_rolf', 'A moth as big as a barn. A moth as big as a house!', 'A huge moth!'],
      ['v_rolf', 'Its wings were bigger than a ship. Big as a ship!', 'Its wings were huge!'],
      ['ash', 'Big as a house?', 'Big as a house?'],
      ['v_rolf', 'Big as a barn, I said.', 'Big as a barn.'],
      ['v_tess', "Bertram's bakery blew up again. That's the third time.", 'The bakery blew up again.'],
      ['v_tess', 'The bakery exploded on Tuesday. And on Friday.', 'The bakery exploded.'],
      ['v_tess', 'Bertram rebuilt the bakery twice.', 'The bakery was rebuilt twice.'],
      ['ash', "I'm going to climb EVERYTHING. EVERYTHING!", 'I will climb EVERYTHING!'],
      ['v_rolf', 'You fix EVERYTHING.', 'You fix EVERYTHING.'],
      ['v_tess', 'He breaks EVERYTHING.', 'He breaks EVERYTHING.'],
      ['ash', "I'm a ROCK.", "I'm a ROCK."],
      ['ember', 'The bravest rock. The wind is a river you can\'t see.', 'The bravest rock.'],
    ],
  },
  talk: {
    v_tess: [
      { if: 'stage>=v_bad', say: ['The goats are back in the bell tower.', 'Goats in the tower again.'], re: [
        { t: ['Poor goats.', 'Poor goats.'], tone: 'kind', mood: 'soft', say: [['v_tess', 'Poor bell.']] },
        { t: ['I will climb up there.', 'I will climb up.'], tone: 'brave', then: ['said tess_climb'], say: [['v_tess', 'Bring a rope.'], ['v_tess', 'Bring two.'], ['ash', 'Two ropes.']] },
        { t: ['Goats can fly now?', 'Goats fly?'], tone: 'silly', say: [['v_tess', 'Only on Sundays.']] },
      ] },
      { if: 'stage>=v_end', say: ['They came down on their own.', 'They came down.'], re: [
        { t: ['Did they bring the bell?', 'And the bell?'], tone: 'silly', say: [['v_tess', 'They tried.']] },
        { t: ['Clever goats.', 'Clever goats.'], tone: 'silly', say: [['v_tess', 'Too clever.']] },
      ] },
    ],
  },
})
