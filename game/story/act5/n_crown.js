// Act V, the summit: The Moon Road (owner N5b). Data only.
// What the player does: walks up to the Crown Shrine, where everyone Ash saved on the long road is waiting (one line
// each: Greymane, Tikka, Vesper, Glaciar, Hush, and Sir Cindervane far below on the stairs). Then the Case Book asks
// the last question, how anyone could reach her, and the banner says how many of the friends she hurt are here. Ash
// crosses the Moon Road (x4_ascent: a double jump, the Grapple Tail, a wind ride and the moon-glass), and at its end,
// if fewer than two of those friends came, Ember's voice asks who is missing and Ash can go and find them first ("Not
// yet") or go in anyway. The Moon Door opens for the Ember Heart (x4_ascent's prompt -> x4_story's n4sMoonDoor plays
// this file's n_moondoor and moves the stage on).
chapter({
  id: 'n_crown', act: 5, after: 'n_glass', next: 'n_nyxara', takeover: true,
  card: ['Finale · The Summit', 'The Moon Road'],
  so_far: [
    'Four rings climbed, four echoes broken. Ash knows now what the Night Mother is so afraid of. Friends are waiting at the Crown Shrine, and above it all, she waits for the Heart.',
    'Ash climbed all four rings. Friends wait at the top.'],

  deduce: {
    n5_reach: {
      mystery: 'night_mother',
      ask: ['How could anyone reach her?', 'How could anyone reach her?'],
      needs: ['n5_her_name', 'n5_her_want', 'n5_oona_warm', 'n5_fourth_post'],
      bonus: ['n5_one_more', 'n5_mom_lanterns'],
      pick: [
        { t: ['Call her by her name, light her a lantern of her own, and bring the friends she hurt', 'Her name, a lantern, and her friends'], right: true },
        { t: ['Beat her so hard that she gives up and flies away', 'Beat her until she gives up'],
          hint: ["You beat Grandpa's echo. He still missed Ember. Does beating fix lonely?", 'Does beating someone fix lonely?'] },
        { t: ['Give her the Ember Heart, like she keeps asking', 'Give her the Heart'],
          hint: ['She wants it to burn black and put out the sun. Would that make anyone less alone?', 'Would that make her less alone?'] },
      ],
      then: ['set n5_plan'],
    },
  },

  step: [
    // (the Crown Shrine becomes the respawn point for the last fight, as the old code's gathering did)
    { id: 'gather', do: 'goto n_sh_crown 230', scene: 'n_gather', then: ['set n_gather', 'shrine n_sh_crown'],
      obj: ['Go to the Crown Shrine', 'Go to the shrine'],
      hint: ['The Crown Shrine is at the edge of the last ring, past the Eclipse Hall. Everyone who came is waiting there.', 'Go to the shrine. Your friends wait there.'] },
    { id: 'reach', do: 'deduce n5_reach', scene: 'n5_reach_done',
      obj: ['How could anyone reach her? Work it out in the Case Book', 'Open the Case Book'],
      hint: ['Her name. What she is so scared of. "Fire isn\'t the only warm thing." The fourth post. Open the Case Book.',
             'Think about her name and the lanterns. Open the Case Book.'] },
    { id: 'road', do: 'wait_for flag n_road>=4', at: 'n4_moon_road', scene: 'n_door_ready',
      obj: ['Cross the Moon Road', 'Cross the Moon Road'],
      hint: ['Every stretch of the Moon Road needs a power from a different land: a big double jump, the Grapple Tail, a ride on the wind, and Moonfire on the glass.',
             'Double jump. Grapple. Ride the wind. Moonfire the glass.'] },
    { id: 'door', do: 'wait_for flag n_door', at: 'n4_road_end', then: ['stage n_nyxara'],
      obj: ['Open the Moon Door with the Ember Heart', 'Open the door with the Heart'],
      hint: ['Stand at the end of the Moon Road and hold up the Ember Heart.', 'Hold up the Heart at the door.'] },
  ],

  scene: {
    // ---- old STORY keys (x4_story n4sDef; the data version replaces it, see CHANGES.md ENGINE REQUEST)
    // one line per friend who is here (10 lines on the longest branch)
    n_gather: [
      { do: ['emit n4fx:gather_pose:on'] }, { cam: 'n_sh_crown', s: 1.2 },
      ['narr', 'The Crown Shrine sits at the edge of the last ring. Above it, the summit. Round the summit, a moat of nothing, and a road of floating stones.', 'The shrine is on the top ring. The summit is across a dark moat.', { ref: 'n4_moon_road' }],
      { if: 'choice greymane=ally', then: [
        ['narr', 'Greymane is already here, sitting by the shrine as if he has waited all day. He is wet. He definitely swam again.', 'Greymane is here! He is wet. He swam again.'] ] },
      { if: 'flag tk_come=yes', then: [
        ['ev_tikka', 'ASH! I brought snacks! And my brother! And a BIGGER spoon!', 'Ash! I brought snacks and a bigger spoon!'] ] },
      { if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] }, then: [
        ['c_vesper', 'Told you. Thieves never take the stairs.', "Told you. Thieves don't use stairs."] ] },
      { if: 'flag n5_glaciar !choice f_glaciar=free', then: [
        ['f_glaciar', 'You came back for me, dumpling. You climbed all of Mount Dread and sang. Just like you promised.', 'You came back and sang, dumpling. Like you promised.'] ],
        else: [{ if: 'choice f_glaciar=free', then: [
        ['f_glaciar', 'Hmph. I have been to warmer funerals, dumpling.', 'Hmph. It is cold up here, dumpling.'] ] }] },
      { if: { any: ['flag n5_hush', 'choice m_hush=free'] }, then: [
        ['narr', 'Hush settles on the shrine roof, folds her wings, and shushes everybody. Nobody minds.', 'Hush sits on the roof. She shushes everyone.'] ] },
      { if: 'choice cinder=ally', then: [
        ['narr', 'Far below, a voice booms: "NONE SHALL PASS!" Sir Cindervane is holding the stairs again.', 'Far below, Sir Cindervane shouts: "NONE SHALL PASS!"'] ] },
      { if: { any: ['choice greymane=ally', 'flag tk_come=yes', 'flag n5_vesper', 'choice c_vesper=friend', 'flag n5_glaciar', 'choice f_glaciar=free', 'flag n5_hush', 'choice m_hush=free'] },
        then: [
        ['ash', "Look at all of you. I didn't bring an army. I brought... friends.", 'Look at you all. I brought friends!'] ],
        else: [
        ['ash', 'Just you and me, Pip.'],
        ['pip', 'Mip.'] ] },
      ['ash', "Okay. Big moth. Broken moon. Let's go and give it back.", "Big moth. Broken moon. Let's give it back."],
      { do: ['emit n4fx:gather_pose:off', 'set n_gather'] },
    ],
    n_moondoor: [
      { cam: 'n4_moon_door', s: 1 },
      ['narr', "At the end of the Moon Road stands a round door of pale glass. There's no handle. Just a hollow in the middle, the size of a plum.", 'A round glass door. It has a hole the size of a plum.'],
      ['ash', 'The Heart. The door wants the Heart.', 'The door wants the Heart.'],
      ['pip', 'Mip?!'],
      ['ash', "I know. She WANTS me to bring it. That's the scary part. But Mom made it whole. Not her. Mom.", 'She wants the Heart. That is scary. But Mom fixed it. Not her.'],
      ['narr', 'Behind you, on the last floating stone, the friends she hurt are waiting with you.', 'Her friends wait behind you.', { if: 'trust friends>=2' }],
      { do: ['emit n4fx:door_fx'] }, { sfx: 'shrine' },
      ['narr', 'You hold up the Ember Heart. Its three seams glow, violet, ice-blue and silver, round a core of warm orange. The door sighs open.', 'You hold up the Heart. It glows. The door opens.'],
    ],
    // ---- this chapter's own scenes
    // after n5_reach: the plan in one line, and the count (as a banner)
    n5_reach_done: [
      ['ash', 'Her name. A lantern of her own. And the friends she hurt, right here with me.', 'Her name. A lantern. And her friends.'],
      { if: 'trust friends>=3', then: [
        { banner: ['You know how to reach her', 'You know how to reach her'], sub: ['All three of the friends she hurt are here with you.', 'All three of her friends are here.'] } ],
        else: [{ if: 'trust friends>=2', then: [
        { banner: ['You know how to reach her', 'You know how to reach her'], sub: ['Friends she hurt, here with you: 2 of 2.', 'Her friends here: 2 of 2.'] } ],
        else: [{ if: 'trust friends>=1', then: [
        { do: [{ banner: ['You know how to reach her', 'You know how to reach her'], sub: ['Friends she hurt, here with you: 1 of 2.', 'Her friends here: 1 of 2.'] }] },
        ['ash', 'But only one of them is with me. She needs to hear from two.', 'But only one friend is here. I need two.'] ],
        else: [
        { do: [{ banner: ['You know how to reach her', 'You know how to reach her'], sub: ['Friends she hurt, here with you: 0 of 2.', 'Her friends here: 0 of 2.'] }] },
        ['ash', "But none of them are with me. She needs to hear from two.", 'But none of her friends are here. I need two.'] ] }] }] },
    ],
    // at the end of the Moon Road (the step finishes here): if fewer than two of the friends she hurt came, Ember's
    // voice asks who is missing and Ash may go and find them first. The door waits either way.
    n_door_ready: [
      { cam: 'n4_moon_door', s: 1 },
      { if: 'trust friends>=2', then: [
        ['narr', 'You look back. On the floating stones behind you, everyone she hurt is following you up.', 'You look back. Your friends are right behind you.'],
        ['pip', 'Mip!'] ],
        else: [
        ['ember', 'Little ember. She will only listen to the ones she hurt. Who is still missing?', 'She will only listen to her friends. Who is missing?'],
        { if: '!flag n5_vesper !choice c_vesper=friend', then: [
          ['ash', 'Vesper went her own way, back on the Silk Gallery.', 'Vesper went her own way.'] ] },
        { if: '!flag n5_glaciar !choice f_glaciar=free', then: [
          ['ash', 'Glaciar is still asleep, far away on Mount Dread.', 'Glaciar is asleep on Mount Dread.'] ] },
        { if: '!flag n5_hush !choice m_hush=free', then: [
          ['ash', "Hush is still caught in the cocoons in the Moth's Cradle.", 'Hush is stuck in the cocoons.', { ref: 'n4_cradle' }] ] },
        { choose: 'n5_door', who: 'ash', ask: ['Go in now, or go and find them first?', 'Go in now?'], pick: [
          { t: ['Go in. I will do this the hard way.', 'Go in now'], tone: 'brave', v: 'go',
            say: [['ash', "Okay. Whatever happens, I'm still going to try.", 'Whatever happens, I will try.']] },
          { t: ['Not yet. Find them first.', 'Not yet'], tone: 'kind', v: 'later',
            say: [['narr', 'Any shrine on the peak can fly you home and back in a blink. The door will wait.', 'Fly to any shrine and back. The door will wait.']] },
        ] } ] },
    ],
  },
})
