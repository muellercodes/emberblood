// game/story/act3/q_f_bombs.js (A3S): Mags and the Big Boom (f_bombs). Giver: Mags Sprocket, Sprocket's Shed, Hearthold.
// The Snowgobs knocked Mags's blasting powder off the road in Snowgob Gulch. Ash climbs up for the crate (and may
// take the Snowgob King's bucket crown), lights the Bomb-o-Matic with blue fire, and tests one bomb on the Big
// Boulder on the old Quarry Road. Surprise: the hot Bomb-o-Matic hiccups out one last "bomb", a firework that bursts
// over Hearthold as a sparkly dragon with Ash's horns (Mags's fireworks shop is born; the epilogue remembers it).
// Payoff: power, the Blast Bombs (`weapon bombs`). Bertram's letter (G6, gates_map0.js) arrives right after.
// Old saves: QDEFS.f_bombs steps 0..4 map to crate, powder, bomatic, boulder, boom (old_steps). The crate, the
// Bomb-o-Matic and the test bomb stay x2_people's own mechanics (legacy steps; the Bomb-o-Matic step's old reward
// gives the test bomb). Talking to Mags with Blaze starts the quest (her offer).
quest({
  id: 'f_bombs', act: 3, until: 3, giver: 'f_mags', optional: true, takeover: true,
  title: ['Mags and the Big Boom', 'Mags and the Big Boom'],
  payoff: { kind: 'power', id: 'bombs' },
  old_steps: ['crate', 'powder', 'bomatic', 'boulder', 'boom'],

  step: [
    { id: 'offer', do: 'talk f_mags', if: 'stage>=f_kindle', scene: 'bm_offer',
      obj: ['Talk to Mags Sprocket in her shed', 'Talk to Mags'] },
    { id: 'crate', do: 'wait_for item f_powder', legacy: true,
      obj: ["Get Mags's blasting powder crate back from Snowgob Gulch", "Get Mags's powder from Snowgob Gulch"],
      hint: ['The crate sits up the wall of Snowgob Gulch, past Hearthold on the way to the pass. Climb up and give it a push.',
        'Climb up the Gulch wall. Push the crate.'] },
    { id: 'powder', do: 'talk f_mags', scene: 'bm_powder', then: ['take f_powder'],
      obj: ['Bring the crate back to Mags in Hearthold', 'Bring the crate to Mags'] },
    { id: 'bomatic', do: 'wait_for flag f_bombs_lit', legacy: true,
      obj: ['Breathe Blaze on the Bomb-o-Matic in Sprocket\'s Shed until it whistles', 'Blaze the Bomb-o-Matic'],
      hint: ['Hold your Blaze on the frozen machine for two whole seconds.', 'Hold Blaze on it for two seconds.'] },
    { id: 'boulder', do: 'wait_for flag f_bombs_test', legacy: true,
      obj: ['Throw the test bomb at the Big Boulder on the old Quarry Road', 'Bomb the Big Boulder'],
      hint: ['Hold attack to aim, let go to throw. The Big Boulder sits on the Quarry Road by the Glimmerfrost lake. Lost the bomb? Ask Mags for another.',
        'Aim, throw, BOOM. Lost it? Ask Mags.'] },
    { id: 'boom', do: 'talk f_mags', scene: 'bm_boom',
      then: ['weapon bombs', 'give coins 170', 'xp 650', 'mail bm_bertram'],
      obj: ['Tell Mags how it went', 'Tell Mags how it went'] },
  ],

  scene: {
    bm_offer: [
      ['f_mags', "You! Dragon! You've got fire. Real fire. BLUE fire! Do you know what that means?", 'You have BLUE fire! Do you know what that means?'],
      ['ash', '...Warm hands?'],
      ['f_mags', 'BOMBS! Well. It COULD mean bombs. I had a whole crate of blasting powder on my steam sled.',
        'BOMBS! I had a crate of blasting powder.'],
      ['f_mags', 'Then the Snowgobs jumped me in Snowgob Gulch and pushed my sled right off the road.',
        'The Snowgobs pushed my sled off the road!'],
      ['f_mags', "The crate's stuck on a ledge up the Gulch wall. Their king wears a BUCKET. I want that bucket. For science.",
        'The crate is up the Gulch wall. Their king wears a BUCKET!', { ref: 'f3s_crate' }],
      ['f_mags', 'Get the crate back and I will make you something delightful. Delightfully EXPLOSIVE.',
        'Get it back. I will make something EXPLOSIVE.'],
    ],
    bm_powder: [
      ['f_mags', "My powder! You're a hero! A very warm hero!", 'My powder! You are a warm hero!'],
      { if: 'item f_bucket', then: [
        ['f_mags', "Is that the Snowgob King's BUCKET? On your HEAD? I have to measure that. Later. Science later.",
          "The king's BUCKET? I am SO jealous!"]] },
      ['f_mags', 'Uh oh. The fuses are frozen solid. They need a REALLY hot spark. Blue hot. Your kind of hot.',
        'The fuses are frozen. They need YOUR fire.'],
      ['f_mags', 'Breathe on the Bomb-o-Matic and do not stop until it whistles. Then stand back. Not that far. A bit further.',
        'Breathe on the Bomb-o-Matic till it whistles!'],
    ],
    bm_boom: [
      ['f_mags', 'I HEARD it! The whole TOWN heard it! Captain Brann fell out of his tower!', 'I HEARD it! Brann fell out of his tower!'],
      ['f_mags', 'Here. Blast Bombs. Throw them, or breathe on one and it goes off right away.', 'Blast Bombs! Throw them, or breathe on them.'],
      ['f_mags', 'They crack rocks and ice, flip switches, and make armored things very sorry.', 'They break rocks and ice and flip switches.'],
      ['narr', 'The Bomb-o-Matic hiccups. One last bomb rolls out, fizzing pink. It is not a bomb.', 'The machine hiccups. Out rolls a pink fizzing ball.'],
      { sfx: 'boom' },
      ['narr', 'FWOOSH. It shoots up the chimney and bursts over Hearthold: a huge sparkly dragon, with YOUR horns.',
        'FWOOSH! Sparks over the town. A dragon with your horns!'],
      ['f_mags', 'I made that at three in the morning. Fireworks! I am opening a fireworks shop. Brann says no. Brann has said no to me eleven times this year.',
        'Fireworks! I will open a shop. Brann says no.'],
      ['f_mags', "Don't throw the real ones at people you like.", 'Do not throw them at friends.'],
    ],
    // Pebble brings this letter right after the bombs (the G6 pointer: gates_map0.js f3g_bun)
    bm_bertram: [
      ['narr', 'Pebble drops a letter on your head. It smells of cinnamon.', 'A letter that smells of cinnamon.'],
      ['narr', '"Dear Ash. The Long Winter came all the way to Emberhollow. One of my Lantern buns froze SO big, it is blocking my cellar."',
        '"A Lantern bun froze HUGE. It blocks my cellar."', { promise: 'f3g_bun' }],
      ['narr', '"If you ever get your claws on some BOMBS, please come home and blow up my bun. Love, Bertram."', '"Bring a bomb. Blow up my bun. Bertram."'],
      ['narr', '"P.S. Your mother already told everyone about my doorstops. Please do not let her hear about this one."', '"P.S. Do not tell your mom about this bun."'],
    ],
  },
  // (Mags's in-quest reminders are in people.js, which loads before the quest files)
})
