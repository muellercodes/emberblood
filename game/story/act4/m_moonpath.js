// Act IV, chapter 5 (part 1): The Eclipse Observatory, the Moonpath (owner A4b). Data only.
// What the player does: at the foot of the Moonpath a little moth is tied to the cold moon brazier on a silver leash,
// hugging a stolen lamp, exactly like Hush. Ash tries to free it (fire: it giggles and the leash does not even get
// warm; a tug: something far above tugs back, harder; a cut needs a blade he does not have). When he lights the foot
// brazier with Moonfire, the moonlight runs along the leash and the knot melts like frost; the moth shrinks to a
// button, sneezes and flutters off, and drops its lamp (a lamp_thief clue: "SABLE. BERTHA (SPARE)."). Then he works
// out how Hush can be set free (free_hush: melt the knots with gentle Moonfire; the mural showed a cut thread fly up to
// the Mother, moth and all). That sets the old flag m_leash_known, so both Hush options show after her fight. Then
// the other two braziers and up to the Observatory door.
// Old flags kept: m_mpb_foot / m_moonpath_lit (x3_world and x3_story count the braziers), m_leash_known.
chapter({
  id: 'm_moonpath', act: 4, after: 'm_mirror', next: 'm_observatory', takeover: true,
  card: ['Act IV · Chapter 5', 'The Eclipse Observatory'],
  so_far: [
    'Moonfire lights the moon-glass stairs of the Moonpath, up to the Eclipse Observatory. Hush is up there, on a silver leash, guarding the last Shard.',
    'Moonfire lights the glass stairs, up to the Observatory. Hush waits there.'],
  mom: [['Stairs made of moonlight? Hold the rail. There IS a rail? Hold it anyway.', 'Moonlight stairs? Hold the rail!']],

  place: {
    // the foot of the Moonpath (verified open ground, level 0; the sign is at 12300,65490, the foot brazier m_mpb1 at
    // 12470,65446)
    m4_mp_foot:     { map: 3, at: [12450, 65470], r: 260, kind: 'spot', name: ['the foot of the Moonpath', 'the Moonpath'] },
    // the little leashed moth beside the foot brazier; once free, only its dropped lamp is left
    m4_little_moth: { map: 3, at: [12515, 65462], r: 34, kind: 'examine', look: 'm4_leashed_moth', h: 60,
                      states: { free: 'm4_dropped_lamp' }, states_say: { free: 'm4_moth_lamp' },
                      name: ['the little moth on a leash', 'the little moth'], prompt: ['Look at the little moth', 'Look at the moth'],
                      say: 'm4_moth_try' },
    // just inside the Eclipse Observatory (area m_obs, layout coordinates; Ash comes in at the start room's foot)
    m4_obs_in:      { map: 3, area: 'm_obs', at: [1076, 900], r: 500, kind: 'spot', name: ['the Eclipse Observatory', 'the Observatory'] },
  },

  clue: {
    m4_little_moth:  { icon: 'moth', mystery: 'm4_night_mother',
                       text: ["At the foot of the Moonpath a little moth was tied to the brazier with a silver leash. Fire didn't even warm the leash, and a tug made something far above tug back. Moonfire melted the knot, and the moth flew off, small and warm.",
                              'Fire did nothing to the leash. Moonfire melted the knot.'] },
    m4_stolen_label: { icon: 'lamp', mystery: 'lamp_thief',
                       text: ['The little moth dropped the lamp it was hugging. A tag on it says: SABLE. BERTHA (SPARE).', 'The moth dropped a lamp. Tag: SABLE. BERTHA (SPARE).'] },
  },

  deduce: {
    free_hush: {
      mystery: 'm4_night_mother',
      ask: ['How can Hush be set free?', 'How can Hush be freed?'],
      // m4_leash_mural: A4a's Drowned Library (a priest breathes soft silver fire on a moth's thread; a cut thread
      // whips up into the sky, moth and all)
      needs: ['m4_leash_mural', 'm4_hush_pulled', 'm4_little_moth'],
      // m4_iska_note: A4S's Ward-stone gate (map 0); m4_book: A4S's q_m_leash; m4_esme_secret: A4S's q_m_lamps
      bonus: ['m4_iska_note', 'm4_book', 'm4_esme_secret'],
      pick: [
        { t: ['Burn the leash with Blaze', 'Burn it with Blaze'],
          hint: ["Fire didn't even warm the little moth's leash.", "Fire didn't warm the little leash."] },
        { t: ['Cut it with the Moon Glaive', 'Cut it with the Glaive'],
          hint: ['Look at the mural again. A cut thread flies up to the Mother, moth and all.', 'A cut thread flies up to the Mother.'] },
        { t: ['Pull her free with the Grapple', 'Pull her free'],
          hint: ['When you tugged the little leash, the Mother tugged back. Harder. And she yanked Hush up the sky like a kite.', 'The Mother pulls back. Harder.'] },
        { t: ['Melt the knots with gentle Moonfire', 'Melt the knots with Moonfire'], right: true },
      ],
      then: ['set m_leash_known', { banner: ['You know how to free Hush.', 'You know how to free Hush.'] }],
    },
  },

  step: [
    { id: 'foot', do: 'goto m4_mp_foot 260', scene: 'm_moonpath',
      obj: ['Go to the foot of the Moonpath', 'Go to the Moonpath'],
      hint: ["Ember said the Moonpath starts at the foot of the Heights. Look for its sign.", 'Find the Moonpath sign.'] },
    { id: 'moth', do: 'examine m4_little_moth', then: ['set m4_moth_seen'],
      obj: ['Help the little moth on the leash', 'Help the little moth'],
      hint: ['A little moth is tied to the cold brazier at the foot of the stairs.', 'Look at the little moth.'] },
    // the foot brazier lit for good (x3_world's moonstone m_mpb1: x3_story sets m_mpb_foot, and its brazier beat is the
    // event beat:brazier)
    { id: 'free', do: 'any', marker: 'm_mpb1',
      parts: [
        { do: 'wait_for flag m_mpb_foot', at: 'm_mpb1', scene: 'm4_moth_free' },
        { do: 'wait_for event beat:brazier', at: 'm_mpb1', scene: 'm4_moth_free' },
      ],
      obj: ['Set the little moth free', 'Free the little moth'],
      hint: ["Fire didn't work. Pulling didn't work. What do moon things like? The leash is tied to a moon brazier.", 'What do moon things like? Try the brazier.'],
      then: ['world m4_little_moth free', 'clue m4_little_moth', 'clue m4_stolen_label'] },
    { id: 'how', do: 'deduce free_hush', scene: 'm4_free_solved',
      obj: ['How can Hush be set free? Work it out in the Case Book', 'Open the Case Book'],
      hint: ['The tile picture in the Drowned Library. Hush on her thread, yanked up like a kite. And the little moth. Open the Case Book.', 'Open the Case Book.'] },
    // x3_world counts the braziers lit for good (m_moonpath_lit) and opens the great door at the top at 3; the extra
    // part below turns that into the stairs' world state 'open', which finishes this step
    { id: 'braziers', do: 'use_power_at moonfire m_moonpath_stairs', marker: 'm_mpb3', then: ['set m_moonpath_lit=3', 'set m_mp_open'],
      extra: [{ do: 'wait_for flag m_moonpath_lit>=3', then: ['world m_moonpath_stairs open'] }],
      obj: ['Light all three moon braziers on the Moonpath', 'Light the three braziers'],
      hint: ['Moonfire the glass stairs to make them solid, and light the moon brazier at each bend. Then the door at the top opens.', 'Moonfire the stairs. Light every brazier.'] },
    { id: 'door', do: 'goto m4_obs_in 500',
      obj: ['Climb to the Eclipse Observatory', 'Climb up to the Observatory'],
      hint: ['The great door at the top of the Moonpath is open now.', 'Go in the door at the top.'],
      then: ['stage m_observatory'] },
  ],

  scene: {
    // the foot of the Moonpath: Iska, 3 lines, then the little moth is seen (the old m_moonpath key, in place)
    m_moonpath: [
      { cam: 'm4_little_moth', s: 1 },
      ['iska', "The Moonpath. Lumen's astronomers walked up it every night, by moonlight. The stairs are moon-glass. Without moonlight they're just air.", 'The Moonpath. Its stairs are moon-glass. Without moonlight they are just air.'],
      ['ash', "There's hardly any moonlight left.", "There's hardly any moonlight left."],
      ['iska', 'Then make your own. Moonfire on the stairs makes them solid. Light the moon braziers at each bend, and they stay that way.', 'Then make your own! Moonfire makes the stairs solid. Light the braziers.'],
      ['narr', 'By the cold brazier at the foot of the stairs, something small is shivering. A moth the size of a cat, hugging a lamp, on a silver leash.', 'By the cold brazier sits a little moth on a silver leash.'],
      ['ash', "It's on a leash. Just like Hush.", "It's on a leash. Like Hush."],
      // (fallbacks for a run that missed the Drowned Library's mural, or a save from before v10)
      { if: '!clue m4_leash_mural', then: [
        ['iska', "Lumen's priests freed leashed moths once. There was a tile picture of it in their library: soft silver fire on a moth's thread. And beside it, a cut thread whipping up into the sky, moth and all.",
                 'Lumen had a tile picture: soft silver fire on a thread. And a cut thread flying up, moth and all.', { clue: 'm4_leash_mural' }] ] },
      { if: '!clue m4_hush_pulled', then: [
        ['ash', 'At the Moon Well her thread yanked Hush up the sky like a kite.', 'Her thread yanked Hush up like a kite.', { clue: 'm4_hush_pulled' }] ] },
      { if: '!quest m_leash done', then: [
        ['iska', "Elder Ripple's old Book of Moths might know the Mother's real name, too. Names matter, little ember.", "Ripple's old Book might know her real name.", { promise: 'm4_book' }] ] },
    ],
    // the experiment: Ash tries what he would try on Hush (play it again to try another way)
    m4_moth_try: [
      ['narr', 'The little moth hugs its lamp and shivers. A silver thread runs from its neck to the cold brazier, then straight up into the dark sky, thin as a hair.', 'A silver thread runs from its neck to the brazier, and up into the sky.'],
      { choose: 'm4_moth_try', ask: ['How do you get the leash off?', 'How do you get it off?'], pick: [
        { t: ['Burn it with a puff of fire', 'Burn it with fire'], tone: 'brave', v: 'fire', then: ['set m4_try_fire'],
          say: [['narr', 'You breathe a little puff of fire on the leash. The moth giggles. The leash does not even get warm.', 'You breathe fire on it. The moth giggles. The leash is not even warm.']] },
        { t: ['Tug it loose', 'Tug it'], tone: 'brave', v: 'tug', then: ['set m4_try_tug'],
          say: [['narr', 'You give the thread a tug. Far, far above, something tugs back. Harder. The little moth squeaks.', 'You tug. Far above, something tugs back. Harder!']] },
        { t: ['Cut it with your claws', 'Cut it'], tone: 'brave', v: 'cut', then: ['set m4_try_cut'],
          say: [['narr', 'Your claws slide off the silver thread like it is made of moonlight. Which it is.', 'Your claws slide off. It is made of moonlight.']] },
        { t: ['Talk to it', 'Talk to it'], tone: 'kind', v: 'talk',
          say: [['narr', '"Shh," says the little moth. "Shh. The Mother is always listening." It looks at the cold brazier, and back at you.', '"Shh. The Mother listens." It looks at the cold brazier.']] },
      ] },
    ],
    // once free: the dropped lamp
    m4_moth_lamp: [
      ['narr', 'The lamp the little moth dropped. A tag on its handle says: SABLE. BERTHA (SPARE).', 'The dropped lamp. Tag: SABLE. BERTHA (SPARE).'],
    ],
    m4_moth_free: [
      { cam: 'm4_little_moth', s: 0.6 },
      ['narr', 'Silver fire runs out of the brazier and along the leash. The knot goes soft, like frost on a warm window, and melts away.', 'Silver fire runs along the leash. The knot melts like frost.', { do: ['world m4_little_moth free'] }],
      ['narr', 'The little moth shrinks to the size of a button, sneezes, and flutters off, warm. It drops its lamp at your feet.', 'The moth shrinks, sneezes and flies off. It drops its lamp.'],
      ['narr', 'A tag on the lamp says: SABLE. BERTHA (SPARE).', 'A tag says: SABLE. BERTHA (SPARE).'],
      ['ash', "It worked! ...Would it work on a moth as big as a BARN?", 'It worked! Would it work on a moth as big as a barn?'],
    ],
    m4_free_solved: [
      ['ash', "Fire won't do it, and pulling only makes the Mother pull back. Cutting sends her flying up the thread. But Moonfire melts the knots.", "Fire won't work. Pulling won't. Cutting won't. Moonfire melts the knots."],
      ['iska', 'Then when the time comes, be gentle. Softer than you have ever breathed.', 'Then be gentle, when the time comes.'],
    ],
  },
})
