// game/story/act4/q_m_lighthouse.js (A4S): The Dark Lighthouse (m_lighthouse). Giver: Squint, Driftwood's lookout.
// Squint's grandpa, Old Ned, keeps the moon lamp on Gull Isle. The moths came, the lamp went out, and he will not come
// down. Ash climbs the tower with a fish sandwich (Ned eats it anyway), lights the six little oil lamps round the
// gallery so the moths move to them (moths have no loyalty), then lights the great lamp with Moonfire (after the
// Mirror Temple). Surprise: the silver beam reaches the bottom of the sea; at night it shows three sunken chests nobody
// has seen in years (x3_people's m3pSunkTick, once m_moonlantern is set). Payoff: upgrade m_moonlantern (Moonfire
// lights last twice as long).
// Old saves: QDEFS.m_lighthouse steps 0..2 map to ned, lit, done. Climbing up to Ned and the lamps stay x3_people's: the
// first talk is a legacy step (x3_people says "climb the tower" when Ash is on the ground, and takes the sandwich), the
// oil lamps and the great lamp tick while the quest is open (m3pAt('m_lighthouse',1): a legacy step).
quest({
  id: 'm_lighthouse', act: 4, giver: 'm_squint', optional: true, takeover: true,
  title: ['The Dark Lighthouse', 'The Dark Lighthouse'],
  payoff: { kind: 'upgrade', id: 'm_moonlantern' },
  old_steps: ['ned', 'lit', 'done'],

  step: [
    { id: 'ned', do: 'talk m_ned', legacy: true,
      obj: ['Climb the Gull Isle lighthouse and talk to Old Ned', 'Climb the lighthouse. Talk to Ned.'],
      hint: ['Gull Isle is across deep water: fly, or swim once you can dive. Climbing Claws get you up the tower.',
        'Get to Gull Isle. Climb the tower.'] },
    { id: 'lit', do: 'wait_for flag m_lighthouse_lit', legacy: true, marker: 'm3p_lh',
      obj: ['Light the six little oil lamps, then light the great lamp with Moonfire', 'Light 6 small lamps. Then Moonfire the big one.'],
      hint: ['Fire on the little oil lamps pulls the moths off the great lamp. The great lamp wants moonlight, not fire.',
        'Small lamps first. Then Moonfire.'] },
    { id: 'done', do: 'talk m_ned', if: 'flag m_lighthouse_lit', scene: 'lh_done',
      then: ['set m_moonlantern', 'upgrade m_moonlantern', 'xp 400', { banner: ['Moon Lantern!', 'Moon Lantern!'],
        sub: ['Your Moonfire keeps moon-glass solid twice as long.', 'Your moon-glass lasts twice as long!'] }],
      obj: ['Talk to Old Ned', 'Talk to Old Ned'] },
  ],

  scene: {
    lh_offer: [
      ['m_squint', 'My grandpa Ned keeps the lighthouse on Gull Isle. The moths came and the lamp went out, and he won\'t come down.',
        "Grandpa Ned's lighthouse went dark. He won't come down."],
      ['m_squint', 'He says he\'s "thinking". He\'s been thinking for a month.', 'He has been "thinking" for a month.'],
      { choose: 'm_lighthouse_offer', ask: ['Will you go up and see him? Take him this sandwich. It\'s fish.', 'Take him this sandwich?'], pick: [
        { t: ['I\'ll take it up to him.', 'I will!'], tone: 'kind', then: ['quest start m_lighthouse', 'give m_sandwich'],
          say: [['m_squint', 'Everything here is fish. LAND HO! ...Sorry. Habit.', 'Everything here is fish. LAND HO!']] },
        { t: ['Not right now', 'Not now'], say: [['m_squint', 'Lookout reporting! Nothing to report! Still.', 'Nothing to report.']] },
      ] },
    ],
    lh_done: [
      ['narr', 'The great lamp blazes silver. Its beam sweeps across the whole Sunken Isles, over every wave and every wreck.',
        'The great lamp blazes silver.'],
      ['m_ned', "Moonlight in a lighthouse! Ha! Ships'll see that from the edge of the world.", 'Ha! Ships will see that from far away!'],
      ['m_ned', 'And at night, mind, this beam goes right down to the sea floor. You will see things down there. Old, shiny things.',
        'At night the beam shows the sea floor. Shiny things!', { promise: 'm3p_sunk1' }],
      ['m_ned', "Tell Squint I'm coming down for supper. Tell her to make it NOT fish.", "Tell Squint I'm coming for supper. NOT fish."],
    ],
  },

  talk: {
    m_squint: [
      { if: 'stage>=m_drift !quest m_lighthouse active !quest m_lighthouse done', option: ['Is something wrong, lookout?', 'Something wrong?'],
        scene: 'lh_offer' },
    ],
  },
})
