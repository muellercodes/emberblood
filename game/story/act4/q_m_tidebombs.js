// game/story/act4/q_m_tidebombs.js (A4S): Tide Bombs (m_tidebombs). Giver: Mags Sprocket, Dell's engineer, on the
// Driftwood dock. Do bombs work UNDER WATER? For science. And because three big rocks block the Bubble Caves under
// Palmcrest and the merfolk asked very politely. Ash dives with Mags's sticky prototypes and blows up all three.
// Surprise: the "prototypes" were Mags's sandwich tins; she has been eating her lunch out of a bomb all week.
// Payoff: upgrade m_tidebombs (Blast Bombs stick where they land and go off under water too).
// The quest starts when Ash first talks to Mags in Moonfall (her talk is x3_people's own, so a menu option would never
// show: the first step is a talk with her). If Ash has no Blast Bombs, x3_people's startQuest wrapper hands some over.
// Old saves: QDEFS.m_tidebombs steps 0..1 map to rocks, mags. The rocks stay x3_people's: while m3pAt('m_tidebombs',0)
// a bomb in water sticks (a legacy step), and m3pBlast sets m_rock1..3.
quest({
  id: 'm_tidebombs', act: 4, giver: 'f_mags', optional: true, takeover: true,
  title: ['Tide Bombs', 'Tide Bombs'],
  payoff: { kind: 'upgrade', id: 'm_tidebombs' },
  old_steps: ['rocks', 'mags'],

  step: [
    { id: 'ask', do: 'talk f_mags', if: 'stage>=m_drift flag m_landed', scene: 'tb_offer',
      then: ['give m_tideproto 3'],
      obj: ['Talk to Mags on the Driftwood dock', 'Talk to Mags'] },
    { id: 'rocks', do: 'all', legacy: true,
      obj: ['Blow up the three rocks blocking the Bubble Caves under Palmcrest', 'Blow up 3 rocks under Palmcrest'],
      hint: ['Dive off the shore of Palmcrest and throw a bomb at each cracked rock. Under water, they stick.',
        'Dive at Palmcrest. Bomb each rock.'],
      parts: [
        { do: 'wait_for flag m_rock1', at: 'm3p_rock1' },
        { do: 'wait_for flag m_rock2', at: 'm3p_rock2' },
        { do: 'wait_for flag m_rock3', at: 'm3p_rock3' },
      ] },
    { id: 'mags', do: 'talk f_mags', scene: 'tb_done',
      then: ['take m_tideproto 3', 'set m_tidebombs', 'upgrade m_tidebombs', 'xp 350', { banner: ['Tide Bombs!', 'Tide Bombs!'],
        sub: ['Your Blast Bombs stick where they land and go off under water too.', 'Your bombs stick, and work under water!'] }],
      obj: ['Tell Mags it worked', 'Tell Mags'] },
  ],

  scene: {
    tb_offer: [
      ['f_mags', "Ash! You're just the dragon I need. Do bombs work UNDER WATER? For science.",
        'Ash! Do bombs work UNDER WATER? For science!'],
      ['f_mags', 'Also, three big rocks block the Bubble Caves under Palmcrest, and the merfolk asked very politely.',
        'Three rocks block the Bubble Caves at Palmcrest.', { ref: 'm3p_bubbledoor' }],
      ['f_mags', 'Here. Three prototype Tide Bombs. They stick to things. Then they go BOOM. Probably.', 'Three Tide Bombs. They stick. Then BOOM.'],
      ['ash', 'Probably?'],
      ['f_mags', "Science is mostly probably. Dive, throw, swim away. Swim away is the important bit.", 'Dive. Throw. Swim away FAST.'],
    ],
    tb_done: [
      ['f_mags', 'It WORKED? Under water? Ha! HA! Science!', 'It WORKED? SCIENCE!'],
      ['f_mags', "Give me your bombs. ...There. Tide Bombs. They work under water now, and they stick to walls and grumpy things.",
        'There. Tide Bombs! They stick, even under water.'],
      ['ash', 'What were the prototypes made of, anyway?', 'What were the prototypes?'],
      ['f_mags', 'My sandwich tins. I have been eating my lunch out of a bomb all week. Tastes fine. Bit smoky.',
        'My sandwich tins. My lunch was in a bomb all week.'],
      ['f_mags', "Don't stick one to me.", "Don't stick one to me."],
    ],
  },
})
