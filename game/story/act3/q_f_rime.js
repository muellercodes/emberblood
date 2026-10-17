// game/story/act3/q_f_rime.js (A3S): Rimeholm, One Thaw at a Time (f_rime). Giver: Grandmother Ylva.
// Six of Ylva's neighbors are still frozen, all in silly places doing silly things, and old Rasmus's frost in his
// forge is too thick until the others are warm. Ash thaws Tollef, Saga, Sigrun, Bo, Nils and Oskar (Nisse the goat
// too), then Rasmus. Surprise: Rasmus froze halfway through hitting a nail; he finishes the swing a month late
// ("Hmm. Missed.") and then makes Ash breathe on his anvil until his fire turns a blue so bright you can see the bones
// in your claws. Payoff: upgrade Bluefire (f_bluefire: Blaze reaches farther and melts faster; p3_frost and x2_world
// read it). When the quest is done x2_people thaws the rest of the village by itself.
// Old saves: QDEFS.f_rime steps 0..2 map to six, rasmus, bluefire. The thaws stay p3_frost's and x2_people's (legacy
// steps). No talk start: A3a's Ylva scene may run `quest start f_rime`; Ylva's option in people.js starts it otherwise.
quest({
  id: 'f_rime', act: 3, giver: 'f_ylva', optional: true, takeover: true,
  title: ['Rimeholm, One Thaw at a Time', 'One Thaw at a Time'],
  payoff: { kind: 'upgrade', id: 'f_bluefire' },
  old_steps: ['six', 'rasmus', 'bluefire'],

  step: [
    { id: 'six', do: 'wait_for flag f_thaw_f_tollef flag f_thaw_f_saga flag f_thaw_f_sigrun flag f_thaw_f_bo flag f_thaw_f_nils flag f_thaw_f_oskar', legacy: true,
      obj: ["Thaw Rimeholm's six frozen neighbors", 'Thaw 6 frozen neighbors'],
      hint: ['Tollef by the bell, Saga on the quay, Sigrun at her smokehouse, Bo on the chapel roof, Nils out with his goats, Oskar behind his bars. Hold Blaze on each one.',
        'Hold Blaze on each frozen neighbor.'] },
    { id: 'rasmus', do: 'wait_for flag f_thaw_f_rasmus', legacy: true,
      obj: ['The frost on the old forge is thin now. Thaw Rasmus the smith', 'Thaw Rasmus in his forge'],
      hint: ['Rasmus stands frozen in the Old Forge, under the dome. His frost is thin now.', 'Rasmus is in the Old Forge.'] },
    { id: 'bluefire', do: 'talk f_rasmus', scene: 'rm_bluefire',
      then: ['set f_bluefire', 'upgrade f_bluefire', 'xp 1000', 'give coins 170',
        { banner: ['Bluefire!', 'Bluefire!'], sub: ['Blaze reaches 20 percent farther, and melting and thawing take half as long.', 'Blaze goes farther and melts faster!'] }],
      obj: ['Talk to Rasmus', 'Talk to Rasmus'] },
  ],

  scene: {
    // Ylva's offer (people.js option, once Ylva is awake and the quest has not started)
    rm_offer: [
      ['f_ylva', 'Six of my neighbors are still frozen, dear. Seven, counting old Rasmus in his forge.', 'Six neighbors are still frozen. Seven with Rasmus.'],
      ['f_ylva', 'His frost is the thickest. Warm the others first, and his will go thin.', 'Warm the others first. Then Rasmus.'],
      ['f_ylva', 'They are all in silly places. They were all doing silly things. It was a very ordinary evening.', 'They froze doing silly things.'],
      { choose: 'f_rime_offer', ask: ['Help Rimeholm thaw out?', 'Help Rimeholm?'], pick: [
        { t: ["I'll warm them all up!", 'I will help!'], tone: 'kind', then: ['quest start f_rime', 'set f_rime_offered'],
          say: [['f_ylva', 'Bless you, dear. Start with whoever is shouting loudest.', 'Bless you. Start with the shouty one.']] },
        { t: ['Not right now', 'Not now'], then: ['set f_rime_offered'],
          say: [['f_ylva', 'They will keep, dear. They are very good at keeping.', 'They will keep, dear.']] },
      ] },
    ],
    rm_bluefire: [
      ['f_rasmus', 'Hmm. I was halfway through hitting a nail when the cold came. Finished it just now.', 'I was hitting a nail when I froze. I just finished.'],
      ['f_rasmus', 'Hmm. Missed.'],
      ['f_rasmus', 'Warm. You did that. One person at a time. That is the only way anything good ever gets done.', 'Warm. You did that. One at a time.'],
      ['f_rasmus', 'Your fire is good, child. It could be better. Breathe on my anvil. No. Harder. HARDER.', 'Breathe on my anvil. HARDER.'],
      ['narr', 'The anvil glows red, then white, then a blue so bright you can see the bones in your claws. Neat.', 'The anvil glows red, white, then bright blue!'],
      ['f_rasmus', 'There. Blue as a glacier, hot as a summer. Bluefire. Go and melt something that deserves it.', 'There. Bluefire. Go melt something.'],
    ],
  },
})
