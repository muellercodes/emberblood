// game/story/act2/q_bolt.js (A2S): A Dog Made of Brass (c_bolt). Giver: Professor Hettie, Sprocket's Workshop.
// Hettie's brass dog ran off the night the moths came, sneezing moth dust. Ash chases him over the harbor cranes
// (Grapple Tail), brings him home, meshes his gears and blows the dust out with one gentle breath. Surprise: the
// first thing the clean dog does is run off and fetch Lord Whirligig's top hat. Payoff: Bolt joins as a companion,
// and in the Spire fight he barks at the real Vesper among her copies (x1_foes reads c_bolt_done and the quest).
// Old saves: QDEFS.c_bolt steps 0..2 map to chase, clean, home. The gear panel and the breath stay x1_people's.
quest({
  id: 'c_bolt', act: 2, giver: 'c_hettie', optional: true, takeover: true,
  title: ['Nuts and Bolt', 'A Dog Made of Brass'],
  payoff: { kind: 'ally', id: 'c_bolt' },
  old_steps: ['chase', 'clean', 'home'],

  place: {
    // where Bolt is first seen (x1_people X1P_DOG[0]); the Dog Chase starts when Ash arrives
    bt_quay: { map: 1, kind: 'spot', at: [7600, 26520], r: 420, name: ['the harbor cranes', 'the cranes'] },
  },

  step: [
    { id: 'chase', do: 'minigame c_dogchase', at: 'bt_quay', then: ['set c_bolt_caught'],
      obj: ["Catch Bolt. Penny's board says he's up on the harbor cranes.", 'Catch Bolt on the harbor cranes!'],
      hint: ['He runs when you get close. Grapple up the cranes after him.', 'Grapple up after him.'] },
    { id: 'clean', do: 'wait_for flag c_bolt_clean', legacy: true, marker: 'h_c_hettie',
      obj: ['Take Bolt to the workshop and clean his gears', 'Take Bolt home and clean his gears'],
      hint: ['Turn the three wall gears until they mesh. Then one gentle breath on Bolt, about a second.',
        'Turn the gears. Then breathe gently.'] },
    { id: 'home', do: 'talk c_hettie', scene: 'bt_home', then: ['ally c_bolt', 'set c_bolt_done', 'xp 500'],
      obj: ['Talk to Professor Sprocket', 'Talk to Professor Sprocket'] },
  ],

  scene: {
    bt_offer: [
      ['c_hettie', "Ash. You've got a tail that grabs things. Wonderful. Unrelated question. Can you grab a dog?",
        'Your tail grabs things! Can you grab a dog?'],
      ['c_hettie', 'Bolt! My brass dog. He ran off the night the moths came, with dust in his nose gears.',
        'My brass dog Bolt ran off. Dust in his nose.'],
      ['c_hettie', "He sneezes every five seconds and it scares him. Penny's board says he's up on the harbor cranes.",
        "He sneezes and it scares him. He's on the cranes."],
      { choose: 'c_bolt_offer', ask: ['Catch Bolt?'], pick: [
        { t: ["I'll bring him home.", "I'll bring him home."], tone: 'kind', then: ['quest start c_bolt'],
          say: [['c_hettie', "He climbs things when he's scared. I built him that way. I regret it.", 'He climbs when scared. Sorry.']] },
        { t: ['Maybe later', 'Later'], say: [['c_hettie', 'Later. Yes. Later is a time. I invented it.', 'Later. I invented later.']] },
      ] },
    ],
    bt_home: [
      ['c_hettie', 'BOLT! Oh, you clanky silly. Come here.', 'BOLT! You clanky silly!'],
      ['narr', 'Bolt licks her goggles. Then he sniffs the air, barks once and shoots out of the door.', 'Bolt barks and runs out the door!'],
      ['narr', "A minute later he trots back in with Lord Whirligig's top hat.", "He comes back with Lord Whirligig's hat."],
      ['c_whirligig', '(from far up the hill) MY HAT! THAT DOG HAS MY HAT!', '(far away) MY HAT!'],
      ['c_hettie', 'He can smell a fib a mile away. And shadows. He always knows the real thing from a copy.', 'He can smell fibs. And shadows.'],
      ['c_hettie', "Take him with you. He likes you. He's never liked anyone. He bit the toaster.", 'Take him along. He likes you!'],
    ],
  },

  talk: {
    c_hettie: [
      { if: 'stage>=c_light power grapple !quest c_bolt active !quest c_bolt done', option: ['Has anyone seen Bolt?', 'Is Bolt still lost?'],
        scene: 'bt_offer' },
    ],
  },
})
