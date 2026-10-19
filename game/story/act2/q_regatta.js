// game/story/act2/q_regatta.js (A2S): The Harbor Regatta (c_regatta). Giver: Skipper Jo, her boat shed.
// Once the Great Clock lifts the harbor chain, Jo races everybody round eight buoys. Ash enters on foot, skipping
// over the water with the Skimmer (an Act I power). Surprise: he wins, on foot, on water, and it is allowed.
// Payoff: a shortcut, the Skiff Whistle (G.flags.c_skiffs): at four landings one of Jo's many cousins rows Ash to any
// other landing (x1_people draws the landings and the ferry). Old saves: QDEFS.c_regatta steps 0..1 map to race,
// whistle.
quest({
  id: 'c_regatta', act: 2, giver: 'c_jo', optional: true, takeover: true,
  title: ['The Harbor Regatta', 'The Harbor Regatta'],
  payoff: { kind: 'shortcut', id: 'c_skiffs' },
  old_steps: ['race', 'whistle'],

  step: [
    { id: 'race', do: 'minigame c_regatta', at: 'c_jo', start: 'talk', scene: 'rg_ready', lose: 'rg_lost',
      then: ['set c_regatta_won'],
      obj: ["Beat Skipper Jo round the harbor's eight buoys (talk to Jo to start)", 'Race Jo round 8 buoys. Talk to Jo.'],
      hint: ['Hold sprint to skip across the water. The harbor mouth rip only lets a skip through.', 'Sprint to skip on water!'] },
    { id: 'whistle', do: 'talk c_jo', scene: 'rg_won', then: ['world c_skiffs open', 'give coins 50', 'xp 500'],
      obj: ['Talk to Skipper Jo', 'Talk to Skipper Jo'] },
  ],

  scene: {
    rg_offer: [
      ['c_jo', "Ahoy, lizard! The chain's up and the harbor's open. It's Regatta Day!", 'The harbor is open! Regatta Day!', { fact: 'c_harbor=open', if: 'flag c_clock_on' }],
      ['c_jo', "Eight buoys round the harbor, out the mouth and back. Boats only. ...You've got feet.", 'Eight buoys. Boats only. You have feet.'],
      ['ash', 'I can skip.'],
      ['c_jo', 'You can WHAT?'],
      { choose: 'c_regatta_offer', ask: ['Race Skipper Jo?'], pick: [
        { t: ["You're on!", "You're on!"], tone: 'brave', then: ['quest start c_regatta'],
          say: [['c_jo', 'HA! Talk to me when you are ready to lose.', 'Talk to me when you are ready.']] },
        { t: ['Maybe later', 'Later'], say: [['c_jo', 'Scared of the wet bits. Knew it.', 'Scared of the water!']] },
      ] },
    ],
    rg_noskim: [
      ['c_jo', "You walk on water but you can't skip? Come back when you can, landlubber.", "You can't skip? Come back when you can!"],
    ],
    rg_ready: [
      ['c_jo', 'Eight buoys. Follow the flags. First back to my shed wins. Sprint to skip, lizard!', 'Eight buoys. First back wins. Sprint!'],
      ['c_jo', 'Ready? GO!'],
    ],
    rg_lost: [
      ['c_jo', 'HA! The Sea Biscuit wins again! Rematch? Talk to me.', 'I win! Rematch? Talk to me.'],
    ],
    rg_won: [
      ['c_jo', "You beat me. On foot. On water. That can't be allowed! ...Nobody ever wrote a rule against it. Yet.", 'You beat me! On foot! On water!'],
      ['c_jo', 'Here. My skiff whistle. Blow it at any landing and one of my cousins rows you anywhere on the coast.',
        'My whistle. My cousins row you anywhere.', { promise: 'c_lm_skiff_quay' }],
      ['c_jo', 'I have a lot of cousins.'],
      ['c_mo', '(from the Harbor Office) The dragon wins the regatta! Barnacles! Somebody write that down!', '(far away) The dragon wins!'],
      ['c_penny', 'Already did.'],
    ],
  },

  talk: {
    c_jo: [
      { if: 'stage>=c_brass flag c_clock_on power skimmer !quest c_regatta active !quest c_regatta done',
        option: ['Can I race in the regatta?', 'Can I race?'], scene: 'rg_offer' },
      { if: 'stage>=c_brass flag c_clock_on !power skimmer !quest c_regatta done',
        option: ['Can I race in the regatta?', 'Can I race?'], scene: 'rg_noskim' },
    ],
  },
})
