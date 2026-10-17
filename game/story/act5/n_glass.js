// Act V, the fourth ring: The Moonglass Crown (owner N5b; the friend scenes' words are N5S's, pasted here). Data only.
// What the player does: rides the Gust Stair up from ring 3 (Glaciar, if she flew with Ash, circles off to wait at the
// top), reaches the Moonglass Shrine, raises the Drowned Mirror, bends the moonbeam into the Moon Lock, and looks at
// what is carved round the lock: a little moth wrapped all the way round a thin moon, holding on. In the Tendril Wood
// Hush finds Ash (Act IV's kind choice) or only her sparkle drifts past toward the cocoons in the Moth's Cradle (her
// errand, q_n5_hush). Echo 4, the Echo of the Hush, leaves one memory: "My quiet one. Stay with me. Everyone else
// leaves." Then the Case Book asks what the Night Mother really wants, and the kid puts the three memories together.
// The puzzles are x4_ascent's (it sets n_gust, n_lagoon, n_beam, n_wood), the echo is x4_foes' (its intro and outro
// are this file's n_echo4_intro / n_echo4_outro, played through STORY.bosses.n_echo_hush).
chapter({
  id: 'n_glass', act: 5, after: 'n_rime', next: 'n_crown', takeover: true,
  card: ['Finale · The Fourth Ring', 'The Moonglass Crown'],
  so_far: [
    "The ice dragon's echo shattered into moths. The fourth ring is glass dunes, drowned mirrors and shadow vines that reach for every light. The broken moon is very close now.",
    'Ash beat the shadow ice dragon. The last ring is glass and shadow vines.'],

  place: {
    // a carved stone beside the Moon Lock (a 156, on the side Ash comes from, clear of the lock's own drawing), shown once the moonbeam opens the lock
    n5_lock_carving: { map: 4, at: [4985, 84110], r: 40, kind: 'examine', look: 'moon_lock_carving', show: 'flag n_beam', h: 50,
                       name: ['the carving on the Moon Lock', 'the Moon Lock carving'] },
    // the sand nest in the Moth's Cradle (x4_world draws it, with a big shadow moth asleep on it)
    n5_nest: { map: 4, at: [3869, 86209], r: 70, kind: 'examine', h: 36,
               name: ["the nest in the Moth's Cradle", 'the nest'] },
  },

  clue: {
    n5_moon_lock: { icon: 'moth', mystery: 'night_mother',
      text: ['Carved round the Moon Lock: a little moth wrapped all the way round a thin moon, holding on tight.',
             'A moth carved on the lock, hugging a thin moon.'] },
    n5_mem_quiet: { icon: 'moth', mystery: 'night_mother',
      text: ['A memory in the Eclipse Hall, the Night Mother to Hush: "My quiet one. Stay with me. Everyone else leaves."',
             '"Stay with me. Everyone else leaves."'] },
    n5_nest: { icon: 'eye', mystery: 'night_mother',
      text: ["The nest in the Moth's Cradle is lined with things people left behind: a mitten, a lantern shade, one boot.",
             'The nest is full of things people left behind.'] },
    n5_moth_panes: { icon: 'star', mystery: 'night_mother',
      text: ['The glass pictures on the peak: a little moth who loved the moon, and was scared every single time it went away.',
             'In the glass, a moth loves the moon. She is scared when it goes.'] },
    // added when n5_wants is solved; n_crown's n5_reach needs it
    n5_her_want: { icon: 'heart', mystery: 'night_mother',
      text: ['What she really wants: never to be left alone again. She holds on to the moon so it can never leave.',
             'She is scared of being left alone.'] },
  },

  deduce: {
    n5_wants: {
      mystery: 'night_mother',
      ask: ['What does the Night Mother really want?', 'What does she really want?'],
      needs: ['n5_mem_grandpa', 'n5_mem_quiet', 'n5_moon_lock'],
      bonus: ['n5_nest', 'n5_moth_panes'],
      pick: [
        { t: ['To put out the sun, because she hates the light', 'To put out the sun'],
          hint: ['The little moth in every carving sits on a warm lantern. Would she hate light?', 'She sits on warm lanterns. Does she hate light?'] },
        { t: ['Never to be left alone again. She eats the moon so it can never go away.', 'Never to be left alone again'], right: true },
        { t: ['To rule the night forever, with everyone asleep', 'To rule the night'],
          hint: ['She never asks for a crown or an army. What did she beg Hush, every night?', 'What did she beg Hush?'] },
      ],
      then: ['clue n5_her_want'],
    },
  },

  step: [
    // Glaciar (Act III's kind choice: she flew with Ash on ring 3) leaves at the Gust Stair, to meet Ash at the top
    { id: 'glaciar_bye', optional: true, if: 'choice f_glaciar=free', do: 'goto n5_gust 320', scene: 'n_glaciar_bye' },
    { id: 'gust', do: 'wait_for flag n_gust', at: 'n5_gust',
      obj: ['Ride the Gust Stair up to the fourth ring', 'Ride the wind up'],
      hint: ['The Gust Stair is a tower of wind on the third ring. Glide into it and let it carry you up.', 'Glide into the wind tower. Ride it up.'] },
    { id: 'shrine', do: 'goto n_sh_glass 330', scene: 'n_glass_in',
      obj: ['Go to the Moonglass Shrine', 'Go to the shrine'] },
    { id: 'mirror', do: 'wait_for flag n_lagoon', at: 'n4_lagoon',
      obj: ['Raise the Drowned Mirror', 'Make the water rise'],
      hint: ['The lagoon is drained and full of glass spikes. Find what makes the water rise.', 'Find what makes the water rise.'] },
    { id: 'lock', do: 'wait_for flag n_beam', at: 'n4_moonlock',
      obj: ['Bend the moonbeam to the Moon Lock', 'Point the moonbeam at the lock'],
      hint: ['Turn the mirrors on the dunes until the moonbeam bounces all the way into the Moon Lock.', 'Turn the mirrors. Send the beam to the lock.'] },
    { id: 'carving', do: 'examine n5_lock_carving', scene: 'n5_lock_look',
      obj: ['Look at the carving by the Moon Lock', 'Look at the carving'] },
    // Hush (Act IV's kind choice) finds Ash in the Tendril Wood; otherwise only her sparkle drifts past toward the
    // cocoons, and her errand starts (N5S's q_n5_hush)
    { id: 'hush_join', optional: true, if: 'choice m_hush=free', do: 'goto n4_tendril_wood 270', scene: 'n_hush_join' },
    { id: 'hush_absent', optional: true, if: '!choice m_hush=free !flag n5_hush', do: 'goto n4_tendril_wood 270', scene: 'n_hush_absent',
      then: ['quest start q_n5_hush'] },
    { id: 'wood', do: 'wait_for flag n_wood', at: 'n4_tendril_wood',
      obj: ['Burn a path through the Tendril Wood', 'Burn the shadow vines'],
      hint: ['The vines grab at any light. Moonfire burns them back. Pip\'s lamp shows the old marks on the glass.', 'Use Moonfire on the vines. Pip\'s lamp helps.'] },
    // optional finds for n5_wants (bonus clues: they make the right pick glow)
    { id: 'nest', optional: true, do: 'examine n5_nest', scene: 'n5_nest_look' },
    { id: 'panes', optional: true, do: 'wait_for flag n_panes>=2', then: ['clue n5_moth_panes'] },
    { id: 'echo', do: 'fight n_echo_hush', then: ['clue n5_mem_quiet'],
      obj: ['Face the Echo of the Hush in the Eclipse Hall', 'Fight the shadow moth'],
      hint: ['Moonfire a moonstone to pull her down. When she starts the Great Shush, burrow into the sand at the rim.',
             'Moonfire the stones. Burrow when she shushes.'] },
    { id: 'wants', do: 'deduce n5_wants', scene: 'n5_wants_done', then: ['stage n_crown'],
      obj: ['What does the Night Mother really want? Work it out in the Case Book', 'Open the Case Book'],
      hint: ['Grandpa missing Ember. "Stay with me. Everyone else leaves." A moth holding on to the moon. Open the Case Book.',
             'Think about the memories. Open the Case Book.'] },
  ],

  scene: {
    // ---- old STORY keys (x4_story n4sDef; the data version replaces it, see CHANGES.md ENGINE REQUEST)
    n_glaciar_bye: [
      ['f_glaciar', 'This wind is too thin for old wings, dumpling. I will circle the peak and meet you at the top.', 'The wind is too thin for me. I will meet you at the top.'],
      ['ash', 'Promise?'],
      ['f_glaciar', 'I keep my promises, dumpling. Off you go.', 'I keep my promises. Go on.'],
      { do: ['emit n4fx:ally_leave:glaciar'] },
    ],
    n_glass_in: [
      { cam: 'n_sh_glass', s: 1.5 },
      ['narr', 'This is the last ring before the top: glass dunes, drowned mirrors, and shadow vines curling out of every crack to reach for your light.', 'The last ring. Glass sand, mirrors, and shadow vines.'],
      ['narr', "Up here the broken moon is so close you could almost touch it. It doesn't shine. It just hangs there, empty.", 'The broken moon is so close. It does not shine.'],
      { if: 'flag pip', then: [
        ['ash', 'Okay, last ring. Pip, tell me I can do this.', 'Last ring. Pip, tell me I can do this.'],
        ['pip', 'Mip!'],
        ['ash', 'Thanks, Pip.'] ],
        else: [
        ['ash', 'Okay, last ring. You can do this, Ash.', 'Last ring. You can do this.'] ] },
      ['nyxara', 'So close now. Come closer. Bring it to me. I have been so cold, for so long.', 'Come closer. Bring it to me. I am so cold.'],
    ],
    n_hush_join: [
      { do: ['emit n4fx:ally_arrive:hush'] },
      ['narr', 'A great white moth glides down through the vines, big as a barn. A broken silver thread trails from her neck.', 'A huge white moth flies down. A broken thread hangs from her neck.'],
      ['ash', 'HUSH! You came!', 'Hush! You came!'],
      ['f_hush', "Shhhh. Not so LOUD, little ember. It's so cold up here. The Mother promised us a warm dark. She didn't mean it.", 'Shhh. Not so loud. It is cold. The Mother lied.'],
      ['narr', 'Hush lands beside you, close enough that her fuzzy wing brushes your arm.', 'Hush lands close to you.'],
      ['ash', "Then stay close to me. I'm warm. Let's go, quietly.", "Stay close. I am warm. Let's go, quietly."],
    ],
    n_hush_absent: [
      ['narr', "A single white moth scale drifts past, glittering, and then another. They float away toward the cocoons in the Moth's Cradle.", 'White sparkles float by, toward the big cocoons.', { ref: 'n4_cradle' }],
      ['ash', 'Hush?'],
      ['narr', 'Nothing answers. But somewhere in the cocoons, something very small goes "shh".', 'Far off, something small says "shh".'],
      ['ash', "She's in there somewhere. Pip, we're coming back for her.", "She is in there. We will come back for her.", { promise: 'q_n5_hush' }],
    ],
    n_echo4_intro: [
      ['narr', 'In a round hall of black glass, with three cold moonstones and a rim of pale sand, a great shadow moth unfolds her wings. Two painted eyes stare at you. Then the two real ones blink.', 'A shadow moth opens her wings. Her eyes blink at you.'],
      ['n_echo_hush', 'Shhhhhh.'],
      { if: 'choice m_hush=free', then: [
        ['narr', 'Beside you, the real Hush folds her wings over her eyes.', 'The real Hush covers her eyes.'],
        ['ash', "It's okay, Hush. You don't have to watch.", "It's okay, Hush. Don't look."] ] },
    ],
    // right after the boss: at most 6 lines a branch
    n_echo4_outro: [
      ['narr', 'The shadow moth falls apart into a hundred little moths, and they flutter away into the dark.', 'The shadow moth breaks into little moths.'],
      ['n_memory', 'My quiet one. Stay with me. Everyone else leaves.', 'Stay with me. Everyone else leaves.', { clue: 'n5_mem_quiet' }],
      { if: 'choice m_hush=free', then: [
        ['narr', 'Hush trembles. Then, slowly, she turns to look at the top of the mountain.', 'Hush shakes. Then she looks up at the top.'],
        ['ash', "We're going up there to see her, aren't we?", 'We are going to see her.'],
        { do: ['emit n4fx:ally_leave:hush'] } ],
        else: [
        ['ash', 'She must have said that to Hush a hundred times. No wonder Hush only ever whispers.', 'She said that every night. No wonder Hush whispers.'] ] },
    ],
    // ---- this chapter's own scenes
    n5_lock_look: [
      ['narr', 'Round the open Moon Lock someone carved a picture, very small and very old.', 'Someone carved a tiny old picture here.'],
      ['narr', "It's a little moth wrapped all the way round a thin curl of moon, holding on with every leg, as if the moon might fly away.", 'A little moth hugs a thin moon, holding on tight.', { clue: 'n5_moon_lock' }],
      ['ash', "That little moth again. She's carved everywhere up here.", 'That little moth again.'],
    ],
    n5_nest_look: [
      ['narr', 'Under the sleeping moth, the nest is lined with things people left behind: a mitten, a lantern shade, one boot.', 'The nest is full of lost things. A mitten. One boot.', { clue: 'n5_nest' }],
      ['ash', "She keeps everything anybody leaves. Even one boot.", 'She keeps everything.'],
    ],
    // the solve line: today's n_panes_all line, word for word
    n5_wants_done: [
      ['ash', "She wasn't trying to be a monster. She was just scared of being alone. ...That's still not okay. But I get it.", 'She was not a monster. She was scared of being alone. That is not okay. But I get it.'],
      ['pip', 'Mip.'],
    ],
  },
})
