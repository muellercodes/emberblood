// game/story/act4/q_m_noodle.js (A4S): Noodle Wants His Mom (m_noodle). Giver: Dusty and Dune, the dune-surfing twins
// of Sable. They found a baby sandworm. He has eaten six shoes and cries for his mom. Noodle follows Ash, but only
// through sand: on glass, stone or road he stops and cries until Ash finds a sand way (when Ash burrows, Noodle burrows
// after him). His mom is Queen Sandy, in her nest deep in the Sandworm Burrows.
// Surprise: Noodle is not her only baby. He is one of three hundred and twelve, and the other three hundred and eleven
// all go "mip". Payoff: upgrade m_wormtunnel (Burrow twice as long, through packed sand).
// Old saves: QDEFS.m_noodle steps 0..1 map to home, sandy. Noodle's walk home stays x3_people's (he follows while
// m3pAt('m_noodle',0): a legacy step; reaching the nest sets m_noodle_home).
quest({
  id: 'm_noodle', act: 4, giver: 'm_dusty', optional: true, takeover: true,
  title: ['Noodle Wants His Mom', 'Noodle Wants His Mom'],
  payoff: { kind: 'upgrade', id: 'm_wormtunnel' },
  old_steps: ['home', 'sandy'],

  step: [
    { id: 'home', do: 'wait_for flag m_noodle_home', legacy: true, marker: 'm4_worm_mouth',
      obj: ['Take Noodle home to his mom in the Sandworm Burrows (he only goes through sand)', 'Take Noodle home. Only through sand!'],
      hint: ['If Noodle stops and cries, the ground under him is not sand. Go back and find a sandy way, or burrow, and he will burrow after you.',
        'Noodle cries? Find sand. Or burrow!'] },
    { id: 'sandy', do: 'talk m_sandy', scene: 'nd_home',
      then: ['set m_wormtunnel', 'upgrade m_wormtunnel', 'xp 400', { banner: ['Worm Tunnel!', 'Worm Tunnel!'],
        sub: ['You can burrow twice as long, and dig through packed sand.', 'You dig longer, and through hard sand!'] }],
      obj: ['Talk to Queen Sandy', 'Talk to Queen Sandy'] },
  ],

  scene: {
    nd_offer: [
      ['m_dusty', 'Dusty: We found a baby worm! Dune: He follows us everywhere! He has eaten six shoes!',
        'We found a baby worm! He ate six shoes!'],
      ['m_dusty', 'Dusty: We named him Noodle! He keeps crying for his mom! Dune: Do YOU know where his mom is?',
        'He is Noodle. He cries for his mom!'],
      ['narr', 'A little sandworm, about as long as your tail, pokes his head out of the sand by your feet and goes "mip".',
        'A baby worm pops up and goes "mip".'],
      { if: 'flag pip', then: [['pip', 'Mip! Mip. (Pip glares at the worm. That is his word.)', 'Mip! (That is Pip\'s word!)']] },
      { choose: 'm_noodle_offer', ask: ['Take Noodle home?', 'Take Noodle home?'], pick: [
        { t: ['I know a big worm. Come on, Noodle.', 'Come on, Noodle!'], tone: 'kind', then: ['quest start m_noodle'],
          say: [['m_dusty', 'Dusty: Bye, Noodle! Dune: Bye, shoes!', 'Bye, Noodle! Bye, shoes!']] },
        { t: ['Not right now', 'Not now'], say: [['m_dusty', 'Dune: He ate your foot. No, wait. That was a shoe.', 'He likes you. And your shoes.']] },
      ] },
    ],
    nd_home: [
      ['m_sandy', 'My baby! My Noodle! You brought him home through the sand.', 'My baby Noodle! You brought him home!'],
      ['narr', 'Out of the sand all round the nest pop hundreds of little worm heads. Every single one goes "mip".',
        'Hundreds of baby worms pop up. "Mip!"'],
      ['m_sandy', 'He is one of three hundred and twelve. The other three hundred and eleven were so worried.', 'He has 311 brothers and sisters!'],
      ['m_sandy', "You're a good little worm.", "You're a good little worm."],
      ['ash', "I'm a dragon."],
      ['m_sandy', "You're a good little worm. Here. Let me show you how the big worms dig.", 'Let me show you how big worms dig.'],
    ],
  },

  talk: {
    m_dusty: [
      { if: 'stage>=m_glasswall power burrow !quest m_noodle active !quest m_noodle done', option: ['Who is this?', 'Who is this?'],
        scene: 'nd_offer' },
    ],
  },
})
