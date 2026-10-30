// game/story/act2/q_tail.js (A2S): The Longer Tail (c_tail). Giver: Professor Hettie, Sprocket's Workshop.
// Hettie can put a reel inside Pearl's hook (the Grapple Tail) with three spring cores from dizzy Steam Rams and the
// old mainspring in the Clockwatch Hall's weathervane, which Captain Hester must never know about. Surprise: the
// first test pulls a biscuit off the top shelf (and the shelf), and the Captain hears about the spring anyway.
// Payoff: the Reel-In upgrade (G.flags.c_reel: longer grapple, yanks shields and small foes; p2_coast reads it).
// Old saves: QDEFS.c_tail steps 0..2 map to springs, vane, reel. The spring drops (x1_people's killEnemy wrapper and
// x1_foes c1SpringDrop) and the windy weathervane stay old mechanics (legacy steps).
quest({
  id: 'c_tail', act: 2, giver: 'c_hettie', optional: true, takeover: true,
  title: ['A Tall Tail', 'The Longer Tail'],
  payoff: { kind: 'upgrade', id: 'c_reel' },
  old_steps: ['springs', 'vane', 'reel'],

  item: {
    c_spring: { name: ['Spring core', 'Spring core'], icon: 'spring', desc: ['BOING. From a dizzy Steam Ram.', 'BOING!'] },
    c_mainspring: { name: ['The weathervane mainspring', 'The weathervane spring'], icon: 'spring',
      desc: ['From the Clockwatch weathervane. The Captain must never know.', 'From the weathervane. Shh.'] },
  },

  step: [
    { id: 'springs', do: 'wait_for item c_spring>=3', legacy: true, marker: 'c_brassyards',
      obj: ['Get 3 spring cores from Steam Rams (they only drop one when beaten while dizzy)', 'Get 3 springs from dizzy Steam Rams'],
      hint: ['Steam Rams charge, hit a wall and get dizzy. Beat one while it is dizzy and BOING.', 'Make a Ram hit a wall. Then beat it.'] },
    { id: 'vane', do: 'wait_for flag c_mainspring', legacy: true, marker: 'c_lm_vane',
      obj: ["Fetch the old mainspring from the Clockwatch Hall's weathervane", 'Get the spring from the weathervane'],
      hint: ['Grapple up to the weathervane on the Clockwatch Hall. Be quick: the wind blows you off.', 'Grapple up. Be quick!'] },
    { id: 'reel', do: 'talk c_hettie', scene: 'tl_reel',
      then: ['take c_spring 3', 'take c_mainspring', 'set c_reel', 'upgrade c_reel', 'xp 500'],
      obj: ['Bring the springs to Professor Sprocket', 'Bring the springs to Professor Sprocket'] },
  ],

  scene: {
    tl_offer: [
      ['c_hettie', "May I see your tail? Professionally. Oh, it's magnificent. Pearl's hook! I've only ever seen drawings.",
        "Pearl's hook! May I see it?"],
      ['c_hettie', 'I could put a reel inside it. You would pull things TO you. Crabs. Shields. Biscuits off high shelves.',
        'I can add a reel. Pull things to you!'],
      ['c_hettie', 'I need three spring cores from Steam Rams. They only pop out when a Ram is knocked dizzy.', 'Bring 3 springs from dizzy Steam Rams.'],
      ['c_hettie', 'And the old mainspring in the Clockwatch weathervane. The Captain will say no, so do not ask her.',
        "And the weathervane spring. Don't tell the Captain."],
      { choose: 'c_tail_offer', ask: ['Get Hettie the springs?'], pick: [
        { t: ['A reel in my tail? Yes!', 'Yes!'], tone: 'brave', then: ['quest start c_tail'],
          say: [['c_hettie', 'Science! The Rams live in the Brass Yards, and the spring lives on top of the Clockwatch Hall. Try not to get arrested.', 'Rams are in the Brass Yards.']] },
        { t: ["I like my tail the way it is.", 'No thanks.'], say: [['c_hettie', 'Fair. It IS a good tail.']] },
      ] },
    ],
    tl_reel: [
      ['narr', 'Hettie takes your tail very gently, a screwdriver in her teeth. Click. Whirr. Clunk.', 'Click. Whirr. Clunk!'],
      ['c_hettie', 'The Reel-In! Grapple a shield and pull. Grapple a crab and pull.', 'The Reel-In! Grapple and pull!'],
      ['c_hettie', 'Try it. That biscuit on the top shelf. Go on.', 'Try it on that biscuit!'],
      ['narr', 'You flick your tail. The biscuit zips across the room into your hand. So does the shelf.', 'The biscuit flies to you. So does the shelf.'],
      ['c_hester', '(from somewhere up the hill) WHO TOOK MY WEATHERVANE SPRING?', '(far away) WHO TOOK MY SPRING?'],
      ['c_hettie', "...Don't tell her."],
    ],
  },

  talk: {
    c_hettie: [
      { if: 'stage>=c_brass power grapple !quest c_tail active !quest c_tail done', option: ['Can you make my tail better?', 'Can you fix up my tail?'],
        scene: 'tl_offer' },
    ],
  },
})
