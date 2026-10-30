// game/story/act4/q_m_moonfish.js (A4S): Gilly and the Moonfish (m_moonfish). Giver: Cook Gilly, the Floating Kitchen.
// The most beautiful fish in the sea only comes up when the moon is full, and the moon is being eaten. But Ash can DIVE:
// down in the Drowned Reach he herds the Moonfish up to the glowing ring under Gilly's fishing raft (three pushes, two
// on Easy), then helps her land it (the Act I fishing timing). Surprise: it glows because it swallowed a Heart Ember,
// and Gilly, who cooks everything, lets it go. Payoff: a Heart Ember (gainHeartEmber 'm_moonfish', the old id).
// Old saves: QDEFS.m_moonfish steps 0..2 map to herd, land, show. Herding and landing stay x3_people's own mechanics
// (legacy steps: the fish swims while m3pAt('m_moonfish', 0..1); the landing minigame m3p_fish runs from Gilly's talk).
quest({
  id: 'm_moonfish', act: 4, giver: 'm_gilly', optional: true, takeover: true,
  title: ['Hook, Line and Moonfish', 'Gilly and the Moonfish'],
  payoff: { kind: 'heart_ember', id: 'm_moonfish' },
  old_steps: ['herd', 'land', 'show'],

  step: [
    { id: 'herd', do: 'wait_for flag m_moonfish_up', legacy: true, marker: 'm3p_raft',
      obj: ["Dive in the Drowned Reach and chase the Moonfish up to Gilly's raft", "Chase the Moonfish up to Gilly's raft"],
      hint: ['Gilly waits on her little raft out over the Drowned Reach. Dive near it. Swim BEHIND the Moonfish and push it up into the glowing ring.',
        'Dive. Push the fish up into the ring.'] },
    { id: 'land', do: 'wait_for flag m_moonfish_caught', legacy: true, marker: 'm_gilly',
      obj: ['Help Gilly land the Moonfish (talk to Gilly)', 'Talk to Gilly. Help her land it.'],
      hint: ['When the float splashes, pull!', 'When it splashes, pull!'] },
    { id: 'show', do: 'talk m_gilly', scene: 'mf_done', then: ['heart_ember m_moonfish', 'xp 400'],
      obj: ['Talk to Gilly', 'Talk to Gilly'] },
  ],

  scene: {
    mf_offer: [
      ['m_gilly', 'Dragon! Have you heard of the Moonfish? Most beautiful fish in the sea. It glows like the moon.',
        'Have you heard of the Moonfish? It glows!'],
      ['m_gilly', "It only comes up when the moon is full. Which isn't going to happen any time soon. But you can dive now!",
        'It comes up at full moon. But you can dive!'],
      ['m_gilly', 'Find it down in the Drowned Reach and chase it up to my fishing raft. I just want to see it. Not cook it.',
        'Chase it up to my raft. I just want to see it.'],
      ['m_gilly', '...Mostly not cook it.'],
      { choose: 'm_moonfish_offer', ask: ['Chase the Moonfish up for Gilly?', 'Chase the Moonfish?'], pick: [
        { t: ["I'll find it. No cooking.", 'I will. No cooking!'], tone: 'kind', then: ['quest start m_moonfish'],
          say: [['m_gilly', "I'll row out north of town and wait. Look for a little raft and a lot of hope.", 'I will wait on my raft up north.',
            { dir: ['m4s_driftwood', 'm3p_raft', 'north'] }]] },
        { t: ['Not now', 'Not now'], say: [['m_gilly', 'Fish? Fish pie? Fish on a smaller fish? No? Come back hungry.', 'Come back hungry!']] },
      ] },
    ],
    mf_done: [
      ['m_gilly', 'Holy mackerel, the Moonfish! Look at her! Just look at her!', 'The Moonfish! Look at her!'],
      ['narr', 'Up close, the glow is coming from inside it. The Moonfish burps. Something warm and red rolls onto the raft.',
        'The fish burps. A warm red ember rolls out.'],
      ['m_gilly', "It swallowed a Heart Ember! No wonder it was so bright. Here, you have it.", 'It swallowed a Heart Ember! Have it.'],
      ['m_gilly', "And I'm letting her go. Some fish are for looking at. Don't tell anyone. I have a reputation.",
        "I'll let her go. Some fish are for looking at."],
      ['narr', 'Gilly lowers the Moonfish back into the sea. It swims down in a slow spiral, still glowing a little, all on its own.',
        'The Moonfish swims down. It still glows a little.'],
    ],
  },

  talk: {
    m_gilly: [
      { if: 'stage>=m_coral power dive !quest m_moonfish active !quest m_moonfish done', option: ['Seen any good fish lately?', 'Any good fish?'],
        scene: 'mf_offer' },
    ],
  },
})
