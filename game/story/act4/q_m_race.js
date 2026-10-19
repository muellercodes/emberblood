// game/story/act4/q_m_race.js (A4S): The Coral Race (m_race). Giver: Rocket, the fastest swimmer in Coralcombe.
// Ten rings round the Coralcombe reef and out through the mangroves, under water (MINI m_swimrace, x3_people), with
// bubble vents for air and two sunken masts to grapple as a shortcut. It starts when Ash talks to Rocket.
// Surprise: Nana Kelp, who teaches the kick, was the fastest swimmer in Coralcombe for ninety years, and Pickles the
// squid was her pupil too. Payoff: upgrade m_dolphin (the Dolphin Kick: longer breath under water, faster swimming).
// Old saves: QDEFS.m_race steps 0..1 map to race, kick. The race is data now (minigame step, start: 'talk'); its win
// sets the old flag m_race_won.
quest({
  id: 'm_race', act: 4, giver: 'm_rocket', optional: true, takeover: true,
  title: ['The Coral Race', 'The Coral Race'],
  payoff: { kind: 'upgrade', id: 'm_dolphin' },
  old_steps: ['race', 'kick'],

  step: [
    { id: 'race', do: 'minigame m_swimrace', start: 'talk', at: 'm_rocket', scene: 'rc_ready', retry: 'rc_again', lose: 'rc_lost',
      then: ['set m_race_won'],
      obj: ['Race Rocket round the reef (talk to Rocket to start)', 'Talk to Rocket to race'],
      hint: ['Ten rings. Swim through every one. Dive to go faster, and grab the bubbles for air.', 'Ten rings! Dive and grab bubbles.'] },
    { id: 'kick', do: 'talk m_kelp', scene: 'rc_kick',
      then: ['set m_dolphin', 'upgrade m_dolphin', 'xp 350', { banner: ['Dolphin Kick!', 'Dolphin Kick!'],
        sub: ['You hold your breath half as long again under water, and you swim like a merfolk.', 'You hold your breath longer!'] }],
      obj: ['Learn the Dolphin Kick from Nana Kelp', 'Go to Nana Kelp'] },
  ],

  scene: {
    rc_offer: [
      ['m_rocket', 'Race me! Around the reef and back! If you win, Nana Kelp will teach you the Dolphin Kick.',
        'Race me! Win, and Nana teaches you a kick.'],
      ['m_rocket', 'If I win, you have to say "Rocket is the fastest" every time you see me. Forever.',
        'If I win, say "Rocket is the fastest". Forever.'],
      { choose: 'm_race_offer', ask: ['Race Rocket?', 'Race Rocket?'], pick: [
        { t: ["You're on, fish-boy.", "You're on!"], tone: 'brave', then: ['quest start m_race'],
          say: [['m_rocket', 'Talk to me when you are ready. I am ALWAYS ready.', 'Talk to me when ready.']] },
        { t: ['Maybe later', 'Maybe later'], say: [['m_rocket', 'Scared? It is fine. Pickles was scared once. For a second.', 'Scared? Pickles was, once.']] },
      ] },
    ],
    rc_ready: [
      ['m_rocket', "Ten rings! Round the reef, out through the mangroves and back! Miss one and it doesn't count!",
        'Ten rings! Miss one and it does not count!'],
      ['m_rocket', 'Ready? We start outside, at the first ring!', 'Ready? We start outside!'],
    ],
    rc_again: [
      ['m_rocket', 'Again? Fine. Rocket is the fastest. Say it. ...Fine, after.', 'Again? Fine!'],
    ],
    rc_lost: [
      ['m_rocket', 'ROCKET IS THE FASTEST! Say it! ...Talk to me for a rematch. I love rematches.', 'Rocket wins! Talk to me for a rematch.'],
    ],
    rc_kick: [
      ['m_rocket', '(from the Racing Reef) You beat me! Nobody beats me! Except Pickles. Pickles is a squid.', 'You beat me! Nobody does that!'],
      ['m_kelp', 'The Dolphin Kick. Kick with your tail, like this. No, your other tail. You only have one tail. That one.',
        'The Dolphin Kick. Kick with your tail. That one.'],
      ['ash', 'How do you know a racing kick?'],
      ['m_kelp', 'I was the fastest swimmer in Coralcombe for ninety years. Who do you think taught Pickles?',
        'I was the fastest for ninety years. I taught Pickles!'],
      ['m_kelp', "Don't tell Rocket. It would ruin him. Now eat some seaweed.", "Don't tell Rocket. Eat your seaweed."],
    ],
  },

  talk: {
    m_rocket: [
      { if: 'stage>=m_coral power dive !quest m_race active !quest m_race done', option: ['Race you!', 'Race you!'], scene: 'rc_offer' },
    ],
  },
})
