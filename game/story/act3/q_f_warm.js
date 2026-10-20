// game/story/act3/q_f_warm.js (A3S): Warm Hands (f_warm). Giver: Mayor Ottilie Toastwhistle, Toastwhistle Hall.
// An official question from the Mayor: how many frozen people can one dragon warm up? Twelve would do, and she will
// make a medal (she has never made one). Any twelve of the Frozen Folk count, anywhere in Frostreach (p3_frost's
// counter f_frozen_n), Rime Knights freed with Blaze included. Surprise: the medal is a cookie (there is a real one
// too), Captain Brann does a drum roll on his own helmet, and Fergus pulls a very long red mitten over the end of
// Ash's TAIL. Payoff: a Heart Ember, saved in Toastwhistle Hall "for a hero" (heart_ember f_warm).
// Old saves: QDEFS.f_warm steps 0..1 map to count, medal. The count stays x2_people's (legacy step; Brann's old
// "Is anyone missing?" option shows while G.quests.f_warm.step is 0, and people.js gives the clue for it).
quest({
  id: 'f_warm', act: 3, giver: 'f_toastwhistle', optional: true, takeover: true,
  title: ['Warm Hands', 'Warm Hands'],
  payoff: { kind: 'heart_ember', id: 'f_warm' },
  old_steps: ['count', 'medal'],

  item: {
    f_medal: { name: ['The Warm Hands Medal', 'The Warm Hands Medal'], icon: 'star', keepsake: true,
      desc: ['Made by the Mayor herself. It is a cookie. There is a real one too.', 'A medal. It is a cookie!'] },
  },

  step: [
    { id: 'offer', do: 'talk f_toastwhistle', if: 'stage>=f_kindle', scene: 'wm_offer',
      obj: ['Talk to Mayor Toastwhistle in Toastwhistle Hall', 'Talk to the Mayor'] },
    { id: 'count', do: 'wait_for flag f_warm12', legacy: true,
      obj: ['Thaw 12 Frozen Folk anywhere in Frostreach', 'Thaw 12 frozen people'],
      hint: ['Frozen people stand all over the north: on the roads, on the ice, in Rimeholm. Hold Blaze on each one. Rime Knights count too.',
        'Hold Blaze on frozen people. Any 12.'] },
    { id: 'medal', do: 'talk f_toastwhistle', scene: 'wm_medal',
      then: ['give f_medal', 'heart_ember f_warm', 'give coins 170', 'xp 650'],
      obj: ['Collect your medal from the Mayor', 'Get your medal from the Mayor'] },
  ],

  scene: {
    wm_offer: [
      ['f_toastwhistle', 'Ash! Horned boy! Official question from the Mayor: how many frozen people can one dragon warm up?',
        'Official question! How many frozen people can you warm?'],
      ['ash', '...All of them?'],
      ['f_toastwhistle', "TWELVE would do! Twelve, and I'll give you a medal! I've never given anyone a medal! I'll have to make one!",
        'TWELVE! Then I will give you a medal!'],
      { if: 'flag f_frozen_n>=1', then: [
        ['f_toastwhistle', "And the ones you've warmed already count! Everything counts! Everything is FINE!", 'The ones you did count too!']] },
    ],
    wm_medal: [
      ['f_toastwhistle', 'Twelve! TWELVE! Everyone, gather round! Hearthwardens, a drum roll!', 'TWELVE! Gather round! A drum roll!'],
      ['narr', 'Captain Brann does a drum roll on his own helmet.', 'Brann drums on his own helmet.'],
      ['f_toastwhistle', 'I hereby award Ash of Emberhollow the Warm Hands Medal, for warming hands! And feet! And entire people!',
        'The Warm Hands Medal! For warming whole people!'],
      ['f_toastwhistle', "It's a cookie. ...There's a real one too. And this. A Heart Ember from the Hall. We've been saving it for a hero.",
        "It's a cookie. There's a real one too. And a Heart Ember!"],
      { if: 'flag f_thaw_f_fergus', then: [
        ['narr', 'Fergus pulls a very long red mitten over the end of your tail. A TAIL mitten. He made it specially.', 'Fergus puts a red mitten on your tail!']] },
      ['f_toastwhistle', 'And now everything is fine. Not the loud kind of fine. The quiet kind.', 'Now everything is fine. The quiet kind.'],
    ],
  },
})
