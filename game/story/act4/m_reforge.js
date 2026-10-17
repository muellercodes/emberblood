// Act IV, the Final Chapter: The Ember Heart (owner A4b). Data only.
// What the player does: through the next door from Hush's dome, at the Eclipse Lens, Mom comes puffing up the
// moonlight stairs with her hammer (and Professor Quill behind a telescope). Short and strong, in three pieces:
// m_reforge (Mom, at most 10 lines), the three taps (x3_story's forge game, `emit m4fx:forge`: see CHANGES.md), and
// m_reforge2 (TING TING TING, the Heart, Nyxara's far voice: at most 6). Ash says what the player worked out in the
// Mirror Temple (why_three): she WANTS it whole, so it can burn black; Mom: "Then we keep it warm." Then everyone runs
// down to the Moon Pier at the Edge of the World for the last bite of the moon and the black mountain (m_peak, at most
// 10, one "Not alone" line). Walking out to the end of the pier, where the moonfire bridge begins, shows the act's end
// card; "Continue the story" starts the finale at n_bridge (resting does too, if Ash keeps exploring first).
// Old flags and items kept (the finale reads them): item m_heart (shards c_shard1, f_shard2, m_shard3 taken), m_heart,
// m_reforged, m_maren, m_eclipse3, m_done, act4_done (end_act 4), moon 0.
chapter({
  id: 'm_reforge', act: 4, after: 'm_observatory', next: 'n_bridge', takeover: true,
  card: ['Act IV · Final Chapter', 'The Ember Heart'],
  so_far: [
    'At the Eclipse Observatory, Ash won the last Shard. Hush made her choice, and Ash made his. Now the Heart needs mending, and someone with a hammer is climbing the moonlight stairs.',
    'Ash won the last Shard. Someone with a hammer is coming up the stairs.'],
  mom: [['A broken stone? Bring it here. I mend things.', 'A broken stone? I mend things.']],

  // the mended Heart (its old name, e7b_threads; the finale needs it: n_bridge reads item m_heart)
  item: {
    m_heart: { name: ['The Ember Heart, mended (three shining seams)', 'The mended Ember Heart'],
               desc: ['Whole again: an orange core with three glowing seams, violet, ice-blue and silver. It beats softly, like a heart.', 'The Ember Heart, whole again. It beats softly.'], icon: 'heart', keepsake: true },
  },

  place: {
    // the Eclipse Lens, room q of the Observatory's top floor (area m_obs_4; layout coordinates, (0,0) is world
    // (20300,1300)): the lens itself is at world (22192,1464)
    m4_lens:     { map: 3, area: 'm_obs_4', at: [1892, 164], r: 200, kind: 'spot', name: ['the Eclipse Lens', 'the Lens'] },
    // the old Moon Pier at the Edge of the World (a deck over the water, 13330..13780 x 65400..65500)
    m4_pier:     { map: 3, at: [13450, 65450], r: 120, kind: 'spot', name: ['the old Moon Pier', 'the Moon Pier'] },
    m4_pier_end: { map: 3, at: [13690, 65450], r: 80, kind: 'spot', name: ['the end of the Moon Pier', 'the end of the pier'] },
    // the first plank of the moonfire bridge, at the very end of the pier
    m4_bridge_on: { map: 3, at: [13762, 65446], r: 36, kind: 'spot', name: ['the moonfire bridge', 'the bridge'] },
    m4_peak_sea: { map: 3, at: [13740, 65200], kind: 'npc_spot', name: ['the sea at the Edge of the World', 'the sea'] },
    // the black mountain out at sea and the moonfire bridge to it: this chapter's own pictures, shown in Act IV only
    // when nothing listens to m4fx for x3_story's vista (x3_story sets flag s10_fx when it does)
    m4_peak:      { map: 3, at: [13990, 65120], kind: 'prop', look: 'm4_peak_far', if: 'flag m4_peak_up act=4 !flag s10_fx',
                    name: ['the black mountain', 'the black mountain'] },
    m4_bridge_fx: { map: 3, at: [13780, 65452], kind: 'prop', look: 'm4_fire_bridge', if: 'flag m4_bridge_lit act=4 !flag s10_fx',
                    name: ['the moonfire bridge', 'the moonfire bridge'] },
  },

  step: [
    // (the second part is for the test autoplay, which cannot walk into a floor that has no door of its own)
    { id: 'lens', do: 'any', marker: 'm4_lens', then: ['set m_maren'],
      parts: [
        { do: 'goto m4_lens 200', scene: 'm_reforge' },
        { do: 'wait_for event beat:lens', scene: 'm_reforge' },
      ],
      obj: ['Go through to the Eclipse Lens', 'Go to the Eclipse Lens'],
      hint: ['The Eclipse Lens is through the next door from the great dome, on the same floor. Someone with a hammer is coming up the stairs behind you.', 'Go through the next door to the Lens.'] },
    // the three taps run between the two scenes: m_reforge's last line emits m4fx:forge, x3_story sets m4_forging and
    // starts its forge game as soon as Mom's scene is over, and clears the flag after the third TING; this scene waits
    { id: 'heart', do: 'cutscene m_reforge2', if: '!flag m4_forging',
      then: ['set m_reforged', 'set m_heart', 'set m_maren', 'time noon quiet', 'warp m4_pier'] },
    // (the warp lands a moment after the Heart's scene; the peak plays on the pier, not in the Lens room)
    { id: 'peak', do: 'cutscene m_peak', if: 'near m4_pier 500', then: ['set m_eclipse3', 'set m_done', 'time midnight quiet'] },
    { id: 'bridge', do: 'goto m4_pier_end 80', scene: 'm4_pier_bridge',
      obj: ['Walk to the end of the Moon Pier, where the moonfire bridge begins', 'Walk to the end of the pier'],
      hint: ['The bridge starts at the end of the Moon Pier. Mom will walk you there.', 'The bridge starts at the end of the pier.'],
      then: ['moon 0', { if: '!flag m_end_xp', then: ['set m_end_xp', 'xp 600'] }, 'end_act 4'] },
    // the act is over. "Continue the story" on the end card starts Act V at n_bridge. A player who keeps exploring
    // first steps onto the bridge's first plank when ready (or rests at a shrine: that starts Act V too)
    { id: 'go', do: 'goto m4_bridge_on 36', then: ['stage n_bridge'],
      obj: ['Nightfall Peak waits. Step onto the moonfire bridge when you are ready.', 'Step onto the bridge when ready.'],
      hint: ['Nightfall Peak waits at the end of the moonfire bridge. Step onto it from the very end of the pier, or rest at a shrine, when you are ready.', 'Step onto the bridge, or rest, when ready.'] },
  ],

  scene: {
    // at the Lens: at most 10 lines (the old one was 17, then 10 more, then 17 more in one sitting)
    m_reforge: [
      ['narr', 'Through the door lies the Eclipse Lens: a disc of moon-glass as big as a pond, set in brass, pointing at the sky. Then footsteps on the stairs. And puffing. A lot of puffing.',
               'Here is the Eclipse Lens, big as a pond. Then: footsteps, and puffing.', { do: ['emit m4fx:mom_in'] }],
      { place: ['maren', [22060, 1580]] }, { place: ['quill', [22330, 1600]] },
      ['maren', 'Ash? ASH! Those stairs are made of MOONLIGHT. Do you know how hard it is to climb moonlight with a hammer?', 'Ash! Those stairs are MOONLIGHT. Try climbing that with a hammer!'],
      ['ash', 'MOM?!', 'MOM?!'],
      ['narr', 'Mom drops the hammer and hugs you. Then she holds you at arm\'s length and looks at you. Then she hugs you again.', 'Mom drops her hammer and hugs you. Twice.'],
      ['maren', "Dell's boat is faster than it looks. He's down at the old pier with the sandwiches. And Professor Quill would not stay home.", 'Dell is at the pier with sandwiches. Quill came too.'],
      ['quill', '(arriving last, behind a telescope bigger than she is) The Eclipse Observatory! The end of the world seemed like a good excuse to visit.', '(with a huge telescope) The Observatory! The end of the world is a good reason to visit.'],
      ['narr', 'You tip the three Shards out of your satchel: violet, ice-blue and silver. Mom turns each one over, the way she checks a horseshoe.', 'You tip out the three Shards. Mom checks each one.'],
      ['maren', "I'm a blacksmith. It's a broken stone. This is literally my job.", "I'm a blacksmith. It's a broken stone. This is my job."],
      ['maren', 'You breathe, the hottest you have, then the coolest. I hammer. Three taps. Gently. Wait for the rings to meet.', 'You breathe hot, then cool. I tap three times. Gently!', { do: ['emit m4fx:forge'] }],
    ],
    // after the taps: at most 6 lines. The why_three payoff: the player saw this coming.
    m_reforge2: [
      { place: ['maren', [22060, 1580]] }, { place: ['quill', [22330, 1600]] }, { sfx: 'chest' },
      ['narr', 'TING. TING. TING. In the middle of the Lens sits a warm stone the size of a plum, an orange core with three glowing seams, beating softly, like a heart.',
               'TING. TING. TING. A warm stone with three glowing lines beats like a heart.',
               { do: ['emit m4fx:heart_whole',
                 { if: 'item c_shard1', then: ['take c_shard1'] }, { if: 'item f_shard2', then: ['take f_shard2'] }, { if: 'item m_shard3', then: ['take m_shard3'] },
                 { if: '!item m_heart', then: ['give m_heart'] }, 'set m_heart', 'set m_reforged',
                 { if: '!flag m_reforge_xp', then: ['set m_reforge_xp', 'xp 1000'] }] }],
      ['ash', "The Ember Heart. It's whole again.", "The Ember Heart. It's whole again."],
      { if: 'choice m_deal=ask', then: [
        ['nyxara', '(from very far away) You asked me why, little ember. Now you will see. A whole heart can burn.', '(far away) You asked me why. Now you will see.'] ],
        else: [
        ['nyxara', "(from very far away) Yes. Make it whole. A cracked heart can't burn, little ember. A whole one can.", '(far away) Yes. Make it whole. A whole heart can burn.'] ] },
      ['ash', 'She WANTS it whole. So it can burn black. I knew it.', 'She WANTS it whole, to burn black. I knew it.'],
      ['maren', 'Then we keep it warm. Hearts are for keeping warm. Outside, all of us. Down to the pier.', 'Then we keep it warm. Outside, everyone!'],
      { if: 'flag pip', then: [['pip', 'Mip. (Pip curls up on the warm Heart and falls asleep at once, glowing a little.)', 'Mip. (Pip falls asleep on the warm Heart.)']] },
    ],
    // the last bite and the black mountain, on the Moon Pier: at most 10 lines a branch, one "Not alone" line
    m_peak: [
      { cam: 'm4_peak_sea', s: 1.6 },
      ['narr', 'You all run down the Moonpath and out along the old Moon Pier to the edge of the world. High above, the last thin curl of moon slides across the sun.',
               'You all run out onto the old Moon Pier. The last bit of moon slides over the sun.', { do: ['emit m4fx:party_look', 'emit m4fx:ecl:start:3'] }],
      ['narr', 'On it, wings wider than the sky, is Nyxara. CRUNCH. The last of the moon goes out like a candle.', 'Nyxara is on it. CRUNCH. The last of the moon goes out.',
               { do: ['emit m4fx:ecl:bite:0', 'moon 0', 'set m_eclipse3'] }],
      ['narr', 'And out of the sea, with a sound like a thousand moths taking off, rises a mountain of black glass.', 'A black mountain rises out of the sea.', { do: ['emit m4fx:peak:rise', 'emit m4fx:ecl:gone', 'set m4_peak_up'] }],
      ['nyxara', 'Come up, little ember. Bring your heart.', 'Come up, little ember. Bring your heart.'],
      ['ash', "It looks like... Cinder Mountain? And a clock tower? And SNOW? It's every place I've ever been, all squashed together.", 'It looks like Cinder Mountain! And a clock tower! And SNOW!'],
      { if: 'choice m_hush=free', then: [
        ['narr', 'The Heart grows warm. A bridge of silver fire unrolls from the end of the pier, all the way to the mountain. Far off over the dark sea, a small white light glows once, softly.',
                 'The Heart grows warm. A bridge of fire rolls out to the mountain. Far away, a small white light glows.', { do: ['emit m4fx:peak:bridge', 'set m4_bridge_lit'] }] ],
        else: [
        ['narr', 'The Heart grows warm. A bridge of silver fire unrolls from the end of the pier, all the way to the black mountain.', 'The Heart grows warm. A bridge of fire rolls out to the mountain.', { do: ['emit m4fx:peak:bridge', 'set m4_bridge_lit'] }] ] },
      ['maren', "...You're going up there.", "You're going up there."],
      ['ash', "I'm going up there.", "I'm going up there."],
      ['maren', "Then I'll walk you to the bridge.", "Then I'll walk you to the bridge."],
      // one "Not alone" line: Vesper (her Last Job done), else Glaciar (freed in Act III), else Iska
      { if: 'flag m_vesper_ally', then: [
        ['c_vesper', '(stepping out of the dark onto the pier) Not alone, cousin.', '(out of the dark) Not alone, cousin.'] ],
        else: [{ if: 'choice f_glaciar=free', then: [
          ['f_glaciar', '(far away, a voice like wind chimes) Not alone, dumpling.', '(far away) Not alone, dumpling.'] ],
          else: [
          ['iska', 'And with one more lantern than you think you need. Always.', 'And with one more lantern than you need. Always.'] ] }] },
    ],
    // at the end of the pier, before the end card
    m4_pier_bridge: [
      ['narr', 'The moonfire bridge hums under your feet, warm as a hearth. At the far end, the black mountain waits.', 'The bridge hums, warm as a hearth. The mountain waits.'],
    ],
  },
  // (the people on the pier afterwards, Mom's "Eat something first" included, are A4S's act4/people.js)
})
