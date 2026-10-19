// game/story/act4/q_m_lamps.js (A4S): Light Every Lamp (m_lamps). Giver: Esme, Keeper of Lamps, Sable.
// Every lamp in Sable went out when the Night Mother drank the Moon Well (eclipse 2). Ash relights all twelve, each
// with an old power used a new way: five on posts (any fire), two on tall poles (Blaze, or fly up), two blown over and
// buried (Burrow where the sand sparkles), Lady Wellington by the well (her islet), Coco on the tallest palm (Claws),
// Little Sun in Rafi's tent. Surprise: when the twelfth lights, every little moth asleep on the well tower flutters off
// and sits on the lamps instead, which is Esme's secret, seen with your own eyes: a moth forgets everything for a lamp.
// Payoff: ally (m_lamps_ally, the lamplighters in the Hush fight) and the clue m4_esme_secret (a free_hush bonus clue).
// Shortcuts from the main path (ACT4_V10 2.2, 2.3): standing by the Moon Well at eclipse 2 (flag m4_well, either way)
// kept Lady Wellington lit, and solving lamp_thief brings back three lamp glasses (Dot, Dash and Coco, the hard ones).
// Old saves: QDEFS.m_lamps steps 0..1 map to lamps, esme. The lamps stay x3_people's (any fire, moonfire, digging and
// the palm climb set m_lamp_0..11 whatever the quest step), so the lamps step waits for all twelve flags.
quest({
  id: 'm_lamps', act: 4, giver: 'm_esme', optional: true, takeover: true,
  title: ['Light Every Lamp', 'Light Every Lamp'],
  payoff: { kind: 'ally', id: 'm_lamps_ally' },
  old_steps: ['lamps', 'esme'],

  clue: {
    m4_esme_secret: { icon: 'lamp', mystery: 'm4_night_mother',
      text: ["Esme's secret: a moth will forget its own name for a lamp. Even a great big one. Even a sad one.",
        'A moth forgets everything for a lamp.'] },
  },

  step: [
    { id: 'lamps', do: 'all', obj: ["Relight Sable's twelve lamps", "Light Sable's 12 lamps"],
      hint: ['Each lamp is a little puzzle. Look at a lamp and it tells you what it needs.',
        'Look at each lamp to see what it needs.'],
      parts: [
        { do: 'wait_for flag m_lamp_0', at: 'm3p_lamp0', hint: ['Bertha, on a post. Any fire will do.', 'Breathe on Bertha.'] },
        { do: 'wait_for flag m_lamp_1', at: 'm3p_lamp1', hint: ['Small Bertha, on a short post.', 'Breathe on Small Bertha.'] },
        { do: 'wait_for flag m_lamp_2', at: 'm3p_lamp2', hint: ['Old Pip, on a post. No relation.', 'Breathe on Old Pip.'] },
        { do: 'wait_for flag m_lamp_3', at: 'm3p_lamp3', hint: ['Gertrude, on a post.', 'Breathe on Gertrude.'] },
        { do: 'wait_for flag m_lamp_4', at: 'm3p_lamp4', hint: ['Gilbert, on a post.', 'Breathe on Gilbert.'] },
        { do: 'wait_for flag m_lamp_5', at: 'm3p_lamp5', hint: ['Dot hangs on a very tall pole. Blaze Breath reaches. So do wings.', 'Too high! Blaze it, or fly.'] },
        { do: 'wait_for flag m_lamp_6', at: 'm3p_lamp6', hint: ['Dash hangs on a very tall pole. Blaze Breath reaches. So do wings.', 'Too high! Blaze it, or fly.'] },
        { do: 'wait_for flag m_lamp_7', at: 'm3p_lamp7', hint: ['Muffin blew over and got buried. Burrow where the sand sparkles.', 'Dig where it sparkles.'] },
        { do: 'wait_for flag m_lamp_8', at: 'm3p_lamp8', hint: ['Barnaby blew over and got buried. Burrow where the sand sparkles.', 'Dig where it sparkles.'] },
        { do: 'wait_for flag m_lamp_9', at: 'm3p_lamp9', hint: ['Lady Wellington stands by the Moon Well, out on her little islet.', 'She is by the Moon Well.'] },
        { do: 'wait_for flag m_lamp_10', at: 'm3p_lamp10', hint: ['Coco is at the top of the tallest palm. Claws climb palms.', 'Climb the palm.'] },
        { do: 'wait_for flag m_lamp_11', at: 'm4s_rafi_tent', hint: ["Little Sun is inside Rafi's Big Tent. Just walk in.", 'She is in Rafi\'s tent.'] },
      ] },
    // (the lamp_thief payoff, Esme's glass coming home labelled SORRY, is her talk line in people.js: it sets
    // m_lamp_5, 6 and 10 whether or not this quest is open)
    { id: 'esme', do: 'talk m_esme', scene: 'lm_done',
      then: ['set m_lamps_ally', 'ally m_lamps_ally', 'xp 450', { banner: ['The lamplighters will come!', 'The lamplighters will come!'],
        sub: ["Esme's lamplighters will fight beside you at the Observatory.", 'They will help you at the Observatory.'] }, 'mail m_pb_oil'],
      obj: ['Tell Esme the lamps are lit', 'Tell Esme'] },
  ],

  scene: {
    lm_offer: [
      ['m_esme', 'Every lamp in Sable went out when she drank the well. Twelve lamps. Bertha. Small Bertha. Old Pip. No relation.',
        'Every lamp went out. Twelve! Bertha, Small Bertha...'],
      { if: 'flag m4_well', then: [
        ['m_esme', 'Not Lady Wellington, though. You were at the well when it happened, and she kept one candle of moonlight.',
          'Lady Wellington stayed lit. You were there.', { do: ['set m_lamp_9'] }]] },
      ['m_esme', "Light them again, dragon, and I'll tell you a secret about moths. It might save your tail.",
        'Light them. I will tell you a moth secret.', { promise: 'm4_esme_secret' }],
      { choose: 'm_lamps_offer', ask: ['Will you light every lamp in Sable?', 'Light every lamp?'], pick: [
        { t: ["I'm a dragon. Lighting things is my whole job.", 'I will!'], tone: 'brave', then: ['quest start m_lamps'],
          say: [['m_esme', 'Each lamp is a little different. Look at one, and it will tell you what it needs. Lamps are like that.',
            'Look at a lamp. It tells you what it needs.']] },
        { t: ['Not yet', 'Not yet'], say: [['m_esme', 'They will wait. Lamps are patient. I am less patient.', 'They will wait.']] },
      ] },
    ],
    lm_glass: [
      ['m_esme', 'A parcel came for me this morning. No stamp. Moth dust all over it.', 'A parcel came. Covered in moth dust.'],
      ['narr', 'Inside: three lamp glasses, polished till they squeak. A label in very curly writing says SORRY.',
        'Three lamp glasses. A label says SORRY.'],
      ['m_esme', 'Dot, Dash and Coco. The hard ones. I have put them back. Somebody has very good manners, for a thief.',
        'Dot, Dash and Coco are back. And lit!'],
    ],
    lm_done: [
      ['narr', 'The twelfth lamp glows. All over Sable, the sleepy little moths on the well tower open their wings.', 'All twelve glow. The moths wake up.'],
      ['narr', 'They flutter off the tower and settle on the lamps, one by one. They look very happy about it.', 'They fly to the lamps. They look happy.'],
      ['m_esme', 'Twelve. All twelve. Bertha looks very happy. Small Bertha looks smug.', 'All twelve! Small Bertha looks smug.'],
      ['m_esme', "Here's what I know. A moth will forget its own name for a lamp. Even a great big one. Even a sad one.",
        'My secret: a moth forgets everything for a lamp.', { clue: 'm4_esme_secret' }],
      ['m_esme', "And my lamplighters have very long poles. When you go up to that Observatory, we're coming too.",
        'My lamplighters will come to the Observatory too!'],
    ],
    m4_epi_sorry: [
      ['narr', 'Every Lantern Day, a parcel arrives in Sable. It is always one lamp. It is always labelled SORRY.',
        'Every Lantern Day, a lamp comes, labelled SORRY.'],
    ],
  },

  talk: {
    m_esme: [
      { if: 'flag m_eclipse2 !quest m_lamps active !quest m_lamps done', option: ['Can I help with the lamps?', 'Can I help?'],
        scene: 'lm_offer' },
    ],
  },
})
