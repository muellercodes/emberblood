// game/story/act2/q_bob.js (A2S): The Third Bob (c_bob). Giver: Constables Bob and Bob, at the Clockwork Lift.
// The third Bob "went funny" the night the moths came and wanders the Brass Yards going TICK TOCK. Ash breaks his
// shield and, while he is dizzy, blows the dust out with one gentle breath (he is never broken: he just sits down).
// Surprise: the clever Bob remembers the night the dust fell like snow. Payoff: allies, all three Bobs hold the
// breakwater on the causeway night and the Spire's Drowned Door (A2b reads quest c_bob done), and a Clockwatch badge.
// (`ally c_bob3` is for the checker: there is no c_bob3 companion, so recruitComp does nothing; the Bobs' help at
// the Spire comes from A2b reading `quest c_bob done`.) Old saves: QDEFS.c_bob steps 0..2 map to find, calm, home.
// Finding and calming him stay x1_people's (legacy), and so does his walk home behind Ash (it follows while the old
// step index is 2, so home is legacy too, and its old reward stands). The Bobs' registry entry is ENG's (map1_gear.js).
quest({
  id: 'c_bob', act: 2, giver: 'c_bobs', optional: true, takeover: true,
  title: ['The Third Bob', 'The Third Bob'],
  payoff: { kind: 'ally', id: 'c_bob3' },
  old_steps: ['find', 'calm', 'home'],

  item: {
    c_badge: { name: ['A Clockwatch badge', 'A Clockwatch badge'], icon: 'badge', keepsake: true,
      desc: ['Honorary Bob. The highest honor.', 'You are an honorary Bob!'] },
  },

  place: {
    bb_yards: { map: 1, kind: 'spot', at: [11300, 24400], r: 300, name: ['the Brass Yards', 'the Brass Yards'] },
  },

  step: [
    { id: 'find', do: 'wait_for flag c_bob_found', legacy: true, marker: 'bb_yards',
      obj: ['Find the third Bob, a Tin Watchman with a blue plume, in the Brass Yards', 'Find the third Bob. Blue plume!'] },
    { id: 'calm', do: 'wait_for flag c_bob_calm', legacy: true, marker: 'bb_yards',
      obj: ['Knock the moth dust out of Bob without breaking him', 'Break his shield. Then breathe gently.'],
      hint: ['Break his shield (a hammer, the Chain Whip or the Reel-In). While he is dizzy, breathe on him gently for about a second.',
        'Break his shield. Breathe gently while he is dizzy.'] },
    // the old step's own reward gives the badge (and wears it), 40 coins and 500 XP, ends the walk behind Ash and
    // stands the third Bob at the Lift, so `then` repeats none of it. While ENG leaves legacy talks to the old code
    // the old step's lines play; bb_home is the text for them (A2S_NOTES.md, engine needs), and the clever Bob's
    // memory is also in people.js (c_bob3), so it is in the game either way.
    { id: 'home', do: 'talk c_bobs', legacy: true, scene: 'bb_home',
      then: ['ally c_bob3'],
      obj: ['Bring Bob home to the Clockwork Lift', 'Bring Bob home to the Lift'] },
  ],

  scene: {
    bb_offer: [
      ['c_bobs', 'There used to be three of us. Bob, Bob, and Bob.', 'There were three of us. All Bob.'],
      ['c_bobs', 'The night the moths came, Bob went funny. Silver dust in his ears. He marched off into the Brass Yards.',
        'Bob went funny. He marched to the Brass Yards.'],
      ['c_bobs', "He's got a blue plume. Bring him home? Gently? He's the clever Bob.", 'Blue plume. Bring him home? Gently?'],
      ['c_bobs', 'He is NOT the clever Bob.'],
      { choose: 'c_bob_offer', ask: ['Find the third Bob?'], pick: [
        { t: ["I'll bring Bob home.", "I'll bring Bob home."], tone: 'kind', then: ['quest start c_bob'],
          say: [['c_bobs', 'Gently, Mostly Part Dragon. He is made of tin. And feelings.', 'Gently. He is tin. And feelings.']] },
        { t: ['Which Bob?', 'Which Bob?'], tone: 'silly', say: [['c_bobs', 'Yes.']] },
      ] },
    ],
    bb_home: [
      ['c_bobs', 'BOB!'],
      ['c_bob3', 'BOB!'],
      ['narr', 'Three tin watchmen hug. It sounds like a cutlery drawer falling down the stairs.', 'Three tin men hug. CLANG!'],
      ['c_bob3', 'I remember now. The sky went soft and grey, and dust fell like snow. Then I was in the Yards.',
        'The sky went grey. Dust fell. Then I was lost.'],
      ['c_bobs', 'The Clockwatch owes you, Mostly Part Dragon. When you need us, all three Bobs will be there.', 'We owe you. All three Bobs will come.'],
    ],
    // the clever Bob's memory, played by his own talk in people.js while the homecoming plays the old lines
    bb_remember: [
      ['c_bob3', 'I remember now. The night I went funny, the sky went soft and grey, and dust fell like snow.', 'The sky went grey. Dust fell like snow.'],
      ['c_bob3', 'Then it was all TICK TOCK, and I was in the Brass Yards. I do not like snow any more.', 'Then I was lost. I do not like snow now.'],
    ],
  },

  talk: {
    c_bobs: [
      { if: 'stage>=c_brass !quest c_bob active !quest c_bob done', option: ["Where's the other Bob?", 'Where is the other Bob?'],
        scene: 'bb_offer' },
    ],
  },
})
