// game/story/act3/q_f_sled.js (A3S): Elka's Long Sled (f_sled). Giver: Elka (Ulf's daughter), Soren's Sled Hill.
// Nobody has ever sledded from the top of the Windscour to Soren's hill in one go. Elka wants to race Ash: eight
// hoops down the mountain, and two wind ribbons that only blow during the race (x2_people's minigame f_sledrace).
// Surprise: at the finish Elka tells how she got north at all. She sledded UP the High Pass the morning after it
// cracked open, through white dust soft as flour (bonus clue f3_elka_dust for A3a's who_cracked), and gave a lift to
// a goat in a tiny scarf, who hopped off at the big mountain and kept climbing (Duchess, waiting on the summit).
// Payoff: upgrade Skyhop (f_skyhop, which p3_frost reads: ribbons carry Ash faster, hops off them go high).
// Old saves: QDEFS.f_sled steps 0..1 map to race, prize. The race stays the old quest engine's (legacy: talking to
// Elka at the Windscour Shrine starts f_sledrace while G.quests.f_sled.step is 0). Talking to Elka from f_gap on
// starts the quest (her offer).
quest({
  id: 'f_sled', act: 3, giver: 'elka', optional: true, takeover: true,
  title: ["Elka's Long Sled", "Elka's Long Sled"],
  payoff: { kind: 'upgrade', id: 'f_skyhop' },
  old_steps: ['race', 'prize'],

  clue: {
    f3_elka_dust: { icon: 'dust', mystery: 'who_cracked',
      text: ['Elka sledded UP the High Pass the morning after it cracked. White dust lay everywhere, soft as flour. She sneezed for a week.',
        'Elka went up the pass after it cracked. Soft white dust everywhere.'] },
  },

  step: [
    { id: 'offer', do: 'talk elka', if: 'stage>=f_gap', scene: 'sl_offer',
      obj: ["Talk to Elka at Soren's Sled Hill", 'Talk to Elka'] },
    { id: 'race', do: 'wait_for flag f_sled_won', legacy: true,
      obj: ["Race Elka from the Windscour Shrine down to Soren's Sled Hill (talk to her at the shrine to start)", 'Race Elka. Talk to her at the shrine.'],
      hint: ['Eight hoops, all the way down. Ride the wind ribbons for the steep bits.', 'Eight hoops. Ride the wind!'] },
    { id: 'prize', do: 'talk elka', scene: 'sl_prize',
      then: ['set f_skyhop', 'upgrade f_skyhop', 'xp 650', 'give coins 60',
        { banner: ['Skyhop!', 'Skyhop!'], sub: ['Wind ribbons carry you faster, and hopping off a ribbon jumps as high as a Double Jump.', 'Ribbons are faster. You hop higher off them!'] }],
      obj: ["Collect your prize from Elka on Soren's Sled Hill", 'Get your prize from Elka'] },
  ],

  scene: {
    sl_offer: [
      ['elka', "ASH! You came north too! I knew it! Did Dad send you? Don't answer that.", 'ASH! You came north! Did Dad send you?'],
      ['elka', 'Soren says nobody has EVER sledded from the top of the Windscour all the way to his hill in one go.',
        'Nobody ever sledded from the Windscour to here.'],
      ['elka', 'I want to do it. Against you. A RACE.', 'Let us RACE!'],
      ['ash', "I don't have a sled."],
      ['elka', "You've got wind ribbons. That's cheating. I love it. Meet me at the Windscour Shrine!", 'You ride the wind. Cheating! Meet me at the shrine!'],
    ],
    sl_prize: [
      ['elka', 'You beat me! Nobody beats me! Except wolves. And one goose.', 'You beat me! Only wolves and a goose do that!'],
      ['f_soren', "That was the fastest thing I've ever seen. Here. Ribbon wax. Rub it on your feet. Don't ask.", 'So fast! Ribbon wax. Rub it on your feet.'],
      ['ash', 'Elka, how did you even get up here? The High Pass was shut for a hundred years.', 'How did you get up here?'],
      ['elka', 'I sledded UP it, the morning after it cracked open. White dust everywhere, soft like flour. I sneezed for a WEEK.',
        'I sledded up the morning it cracked. White dust everywhere!', { clue: 'f3_elka_dust' }],
      ['elka', 'Oh, and I gave a goat a ride. A goat in a tiny scarf. She hopped off at the big mountain and just... kept climbing.',
        'I gave a goat in a scarf a ride. She climbed the mountain!'],
      ['ash', '...Duchess?'],
      ['elka', "Tell Dad I'm fine. Tell him I'm SUPER fine. Home for supper. SOME supper.", "Tell Dad I'm SUPER fine."],
    ],
  },
})
