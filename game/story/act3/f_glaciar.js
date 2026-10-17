// Act III, Final Chapter: Auntie (owner A3b). Data only.
// What the player does: on the Crown of Dread, before he goes to her, Ash answers the act's last question in the Case
// Book: who is the Snow Mother of Hearthold's song? Not the moths' Mother (Hush called the dragon the Mother's NEW
// friend), but Glaciar herself: Ember's Auntie Glee, who lit the Great Hearth with her and did the cold parts. Then the
// fight (code, x2_foes). If he worked it out first, he shouts "AUNTIE GLEE!" in her intro: her eyes go blue for one
// blink and all four chains light up, south, west, east and north (look chain_glow), so the free ending is easy to find.
// Melt all four and she wakes as herself (free); leave one and she falls asleep under the snow, still chained (defeat).
// After the fight: free, a 6-line outro, then Ash walks up and TALKS to her (the cheek pinch, "I am NOT saying
// fourteen", her brother by the Act I ending, Nyxara's name, the long truth on a Case Book page) and chooses: "You're
// the Snow Mother" (she stays, every frozen person in the north wakes) or "Go and rest" (she flies north). Defeat: a
// 6-line outro, then he kneels by her and sings the Snow Mother's Song (if he knows it: she wakes, free) or lets her
// sleep with a promise that the Crown wake place (A3S) keeps. Duchess is on the spike. Then a fade to the night in
// Hearthold (by his choices: the dragon, the patrol, the moth in the red scarf, the bitten moon, Nyxara), the end card,
// and Act IV.
// The old outro was 28 lines plus a choice plus 10 (38 in one sitting); now 6 after the boss and 10 in the talk.
chapter({
  id: 'f_glaciar', act: 3, after: 'f_dread', next: null, takeover: true,
  card: ['Act III · Final Chapter', 'Auntie'],
  so_far: [
    'At the top of Mount Dread, the ice dragon Glaciar lies bound in four purple chains, with the second Shard of the Ember Heart in her chest. She is dreaming the Long Winter.',
    'At the top of Mount Dread, Glaciar lies in purple chains. Shard 2 is in her chest.'],
  mom: [['Tell your auntie I said hello. And to stop it with the snow.', 'Say hello to your auntie for me.']],

  place: {
    // the four Chain Stones (x2_foes' F2CR: south, west behind an ice wall, east on the high slab, north on the ledge):
    // the chains light up when Ash calls her by her name (look chain_glow, state on; a melted one goes dark)
    f3_chain_s: { map: 2, at: [7300, 41700], kind: 'prop', look: 'chain_glow', if: '!flag f_glaciar_won', name: 'the south chain' },
    f3_chain_w: { map: 2, at: [6820, 41250], kind: 'prop', look: 'chain_glow', if: '!flag f_glaciar_won', name: 'the west chain' },
    f3_chain_e: { map: 2, at: [7780, 41150], kind: 'prop', look: 'chain_glow', if: '!flag f_glaciar_won', name: 'the east chain' },
    f3_chain_n: { map: 2, at: [7300, 40760], kind: 'prop', look: 'chain_glow', if: '!flag f_glaciar_won', name: 'the north chain' },
    // Glaciar coiled round the spike under the spell, from the summit door until the fight's own figure comes out
    // (look glaciar_coil, v10_art3b.js: x2_story's own drawing of her; state blink shows her blue eyes for a moment).
    // After the fight x2_story draws her itself, awake or asleep by G.choices.f_glaciar.
    f3_glaciar_coil: { map: 2, at: [7300, 41290], kind: 'prop', look: 'glaciar_coil', if: 'stage>=f_dread !flag f_glaciar_won', name: 'Glaciar' },
    // in front of Glaciar's coils (x2_story draws her round the spike at the Crown's middle)
    f3_auntie: { map: 2, at: [7300, 41350], r: 40, kind: 'examine', if: 'choice f_glaciar=free !flag f_done', h: 110,
                 name: 'Auntie Glee', prompt: ['Talk to Auntie Glee', 'Talk to Auntie'] },
    f3_auntie_asleep: { map: 2, at: [7300, 41350], r: 40, kind: 'examine', if: 'choice f_glaciar=defeat !flag f_done', h: 60,
                        name: 'the sleeping dragon', prompt: ['Kneel by Auntie Glee', 'Kneel by Auntie'] },
    // where the camera looks when she talks (her head is drawn high above the coils, north of the Crown's middle)
    f3_glaciar_face: { map: 2, at: [7270, 41150], kind: 'npc_spot', name: 'Glaciar' },
    // the night in Hearthold: Ash comes home down the main street (level 0, below the Hearth's steps) and walks up to
    // the Great Hearth (a scene's fade would stay dark while the scene is up, so the warp happens before it, in play)
    f3_walk_home: { map: 2, at: [6800, 49280], kind: 'npc_spot', name: 'Hearthold\'s main street' },
    f3_hearth_view: { map: 2, at: [6800, 49010], kind: 'npc_spot', name: 'the Great Hearth' },
  },

  // the long truth, to read at leisure (instead of the old 28 lines on the summit)
  page: {
    f3_tove_notes: {
      mystery: 'long_winter',
      title: ['Tove\'s notes: who made the Long Winter', 'Tove\'s notes'],
      text: [
        ['Glaciar is Ember\'s auntie, and Ash\'s too (fourteen greats, but we don\'t say that). Ember called her Auntie Glee, because she laughs like wind chimes.', 'Glaciar is Ember\'s Auntie Glee. And Ash\'s auntie too.'],
        ['She sleeps on Mount Dread so the winters stay small. One gentle snow a year, for the sledding.', 'She sleeps on the mountain so winters stay small.'],
        ['Hush, the white moth, flew north with the second Shard and put it in her heart. The cold spell made her dream, and her dream was the Long Winter.', 'Hush put the second Shard in her heart. Her bad dream was the Long Winter.'],
        ['The one the moths call the Mother is NYXARA, the moon\'s old moth. She circled the moon so long she forgot it wasn\'t hers.', 'The Mother is Nyxara, the moon\'s old moth.'],
        ['She wants a night that never ends. For that she needs a black fire: the First Flame, burned dark. That is why she broke the Ember Heart.', 'She wants night forever. So she broke the Ember Heart.'],
        ['Three Shards. One went to the coast (Vesper had it). One came north (Auntie had it). One went east, where the moon\'s light fell long ago.', 'One Shard went to the coast. One came north. One went east.'],
        ['Ash has two now. Nyxara wants all three.', 'Ash has two. Nyxara wants all three.'],
      ] },
  },

  deduce: {
    snow_mother: {
      mystery: 'long_winter',
      ask: ['Who is the Snow Mother in Hearthold\'s old song?', 'Who is the Snow Mother?'],
      needs: ['f3_lintel', 'f3_cold_parts', 'f3_chapel', 'f3_hush_friend'],
      bonus: ['f3_ice_diary', 'f3_bellows_cold', 'f3_nursery', 'f3_tove_stone', 'f3_song'],
      pick: [
        { t: ['The Mother the moths whisper about', 'The moths\' Mother'],
          hint: ['Hush called the dragon on top the Mother\'s NEW friend. And the Snow Mother lit a FIRE with Ember. Would a moth\'s Mother light a fire?', 'Hush said NEW friend. And the Snow Mother lit a fire.'] },
        { t: ['A really big snowman', 'A big snowman'],
          hint: ['Snowmen don\'t have icicle horns. Look at the carving on the Great Hearth again.', 'Snowmen have no icicle horns. Look at the carving.'] },
        { t: ['Glaciar herself: Ember\'s Auntie Glee', 'Glaciar: Ember\'s Auntie Glee'], right: true },
      ],
      then: ['set f3_auntie_glee'],
    },
  },

  step: [
    // (answering may happen in the Heart of Dread already, or after the fight: the fight is the old code's and starts
    // when Ash walks onto the Crown whatever this step says; the talk afterwards waits for it)
    { id: 'who', do: 'deduce snow_mother', scene: 'f3_snow_solved', migrate_if: 'flag f_done',
      obj: ['Before you go to her: who IS she? Work it out in the Case Book', 'Who is she? Open the Case Book'],
      hint: ['The carving on the Great Hearth. What Ember said about the North Forge. The chapel in Rimeholm. And what Hush said. Open the Case Book.', 'Open the Case Book.'],
      // (a save from before the Case Book never found these: they are given back here, so the question can be asked)
      extra: [
        { do: 'wait_for !clue f3_lintel', then: ['clue f3_lintel'] },
        { do: 'wait_for !clue f3_cold_parts', then: ['clue f3_cold_parts'] },
        { do: 'wait_for !clue f3_chapel', then: ['clue f3_chapel'] },
        { do: 'wait_for !clue f3_hush_friend', then: ['clue f3_hush_friend', 'clue f3_the_mother'] },
      ] },
    // the fight is x2_foes' (its site opens on the Crown at this stage); her intro and both outros are the scenes below
    // (x2_foes plays them; `kneel` names the free outro for the checker, the engine does not play it again)
    { id: 'fight', do: 'fight f_glaciar', at: 'f_crown', kneel: 'f_glaciar_outro_free', migrate_if: 'flag f_done',
      obj: ['Melt Glaciar\'s four chains, and set her free', 'Melt the four chains'],
      hint: ['Crack each chain\'s ice dome with a Ground Pound, then Blaze the lock. Two chains are up high: climb, and ride the vent.', 'Pound the dome. Then Blaze the lock.'],
      then: ['set f_nyx_named',
        { if: 'choice f_glaciar=free',
          then: [{ journal: ['You melted Glaciar\'s chains and she woke up as herself.', 'You melted the chains. Glaciar woke up.'], key: 'f_glaciar' }],
          else: [{ journal: ['Glaciar fell asleep under the snow, still chained.', 'Glaciar sleeps under the snow.'], key: 'f_glaciar' }] }] },
    { id: 'talk', do: 'any', migrate_if: { any: ['flag f_done', 'choice f_glaciar_home=stay', 'choice f_glaciar_home=north'] },
      obj: ['Go to Auntie Glee', 'Go to Auntie'],
      hint: ['She is right there, in the middle of the Crown.', 'She is in the middle of the Crown.'],
      parts: [
        { do: 'examine f3_auntie', scene: 'f3_auntie_talk' },
        { do: 'examine f3_auntie_asleep', scene: 'f3_auntie_sleep' },
      ] },
    // x2_people draws Duchess on the tip of the spike after the fight and plays her lines when Ash walks up
    { id: 'goat', do: 'wait_for flag f_duchess', at: 'f3_duchess',
      obj: ['Somebody is standing on top of the ice spike. Go and see who.', 'Who is on top of the ice spike?'],
      hint: ['Climb up to the ledge behind the spike, with your claws or the grapple post.', 'Climb up behind the spike.'] },
    { id: 'down', do: 'cutscene f3_going_home', migrate_if: 'flag f_done', then: ['warp f3_walk_home', 'time night'] },
    { id: 'night', do: 'goto f3_hearth_view 150', scene: 'f3_night', migrate_if: 'flag f_done', then: ['xp 800', 'end_act 3'],
      obj: ['Go to the Great Hearth', 'Go to the Great Hearth'],
      hint: ['The Great Hearth is right in the middle of town, up the steps.', 'Go up the steps to the Hearth.'] },
    // the act is over: one direction only (resting, or the end card's "Continue the story", starts Act IV)
    { id: 'rest', do: 'wait_for act>=4', at: 'f3_hearth_view',
      obj: ['The north is warm again. Rest at a shrine or an inn when you are ready.', 'Rest at a shrine or an inn.'],
      hint: ['You did it, Ash. When you\'re ready, the story goes east. Rest at a shrine or an inn.', 'Rest at a shrine or an inn.'] },
  ],

  scene: {
    f3_snow_solved: [
      ['ash', 'The lady carved on the Great Hearth has icicle horns. She did the cold parts of Ember\'s forge. And she sleeps on the mountain so the winters stay small.', 'Icicle horns. The cold parts. She sleeps on the mountain.'],
      ['ash', 'She\'s not the moths\' Mother. Hush called her the Mother\'s NEW friend. The Snow Mother is Glaciar. Ember\'s Auntie Glee!', 'The Snow Mother is Glaciar! Ember\'s Auntie Glee!'],
      ['tove', 'Oh. OH. I remember now! Ember built the North Forge with her auntie. With HER! How could I forget a dragon?', 'I remember now! Ember built the forge with HER!'],
      ['ash', 'Then she\'s under a spell. And I\'m going to wake her up.', 'She\'s under a spell. I\'ll wake her up.'],
    ],

    // ---- old STORY keys, replaced in place (x2_foes plays them as the boss intro and the two outros)
    f_glaciar_intro: [
      { cam: 'f3_glaciar_face', s: 1.2 },
      ['narr', 'The top of Mount Dread. No wind. No sound. In the middle of the summit, coiled around a spike of black ice, lies a dragon.', 'The top of the mountain. A dragon lies coiled round a black ice spike.'],
      ['narr', 'She is white and blue and silver, as long as a river, with icicle horns. Four chains of purple frost hold her down, one to each side: south, west, east and north. Two of them up high.', 'She is long and white and blue. Four purple chains hold her down.',
        { ref: ['f3_chain_s', 'f3_chain_w', 'f3_chain_e', 'f3_chain_n'] }],
      ['f_glaciar', '...Fire. I smell fire. My brother\'s fire.', 'Fire. I smell my brother\'s fire.'],
      ['f_glaciar', 'No. The Mother says fire is a lie. The Mother says dark is kind, and cold is kind, and sleep is the kindest of all.', 'No. The Mother says fire is a lie. Sleep is kind.'],
      ['narr', 'Her eyes open. They\'re purple.', 'Her eyes open. They\'re purple.'],
      ['f_glaciar', 'The Mother says to put you out.', 'The Mother says to put you out.'],
      { if: 'solved snow_mother', then: [
        ['ash', 'AUNTIE GLEE! It\'s me! Ash! Ember\'s great-great-lots-of-greats!', 'AUNTIE GLEE! It\'s me! Ash!'],
        ['narr', 'For one blink, her eyes go blue. And all four chains light up, bright as lamps.', 'For one blink, her eyes go blue. All four chains light up!',
          { do: ['world f3_glaciar_coil blink', 'world f3_chain_s on', 'world f3_chain_w on', 'world f3_chain_e on', 'world f3_chain_n on'] }],
        ['tove', 'There! Those chains aren\'t hers, Ash. Melt them, and she\'ll remember!', 'Those chains aren\'t hers! Melt them!'] ],
        else: [
        ['tove', 'Ash! Those chains aren\'t hers! Melt them, and maybe she\'ll remember who she is!', 'Melt the chains! Then she may remember!'] ] },
    ],
    // free: all four chains melted (6 lines right after the boss)
    f_glaciar_outro_free: [
      { do: ['world f3_chain_s off', 'world f3_chain_w off', 'world f3_chain_e off', 'world f3_chain_n off'] },
      ['narr', 'The Shard pops out of Glaciar\'s chest like a cork from a bottle and lands in the snow, ringing like a tiny bell. You pick it up. It\'s warm.', 'The Shard pops out of her chest like a cork. You pick it up.',
        { do: ['give f_shard2'] }],
      ['narr', 'The last of the purple drains out of her eyes. They\'re blue now. Pale, kind, sleepy blue, like a winter morning.', 'Her eyes turn blue. Kind and sleepy.'],
      ['f_glaciar', 'Oh. Oh my. Oh, my head. Did I... did I make a blizzard?', 'Oh, my head. Did I make a blizzard?'],
      ['ash', 'A big one. Over the whole north. And a lot of the coast.', 'A big one. Over the whole north.'],
      ['f_glaciar', 'Oh, I\'m so sorry. I\'m a slow-winter dragon. One gentle snow a year, for the sledding. Blizzards are rude.', 'I\'m so sorry. I make one gentle snow a year. Blizzards are rude.'],
      ['f_glaciar', 'Horns. Tail. That nose. You\'re one of Ember\'s! Come here, dumpling, let me pinch your cheeks!', 'You\'re one of Ember\'s! Come here, dumpling!'],
    ],
    // defeat: a chain was still on when she fell (6 lines right after the boss)
    f_glaciar_outro_defeat: [
      { do: ['world f3_chain_s off', 'world f3_chain_w off', 'world f3_chain_e off', 'world f3_chain_n off'] },
      ['narr', 'Glaciar crashes down into the snow. The whole mountain shakes. The purple chains pull tight around her.', 'Glaciar falls in the snow. The chains pull tight.'],
      ['narr', 'The Shard cracks out of the ice over her heart and rolls to your feet.', 'The Shard rolls to your feet.', { do: ['give f_shard2'] }],
      ['f_glaciar', '(very sleepy) ...Nyxara. The moon\'s... old moth. She wants... the night. Forever.', '(sleepy) Nyxara. The moon\'s moth. She wants the night.', { do: ['set f_nyx_named'] }],
      ['f_glaciar', '(a whisper) ...Ember? Is that you?', '(a whisper) Ember? Is that you?'],
      ['narr', 'Her eyes close. Snow begins to cover her, gently, like a blanket.', 'Her eyes close. Snow covers her like a blanket.'],
      ['tove', 'She\'s asleep. Not hurt. Just asleep. The chains will keep her that way. A long, long time.', 'She\'s asleep. Not hurt. The chains keep her asleep.'],
    ],

    // free: Ash walks up to her and talks (10 lines a branch)
    f3_auntie_talk: [
      { cam: 'f3_glaciar_face', s: 1 },
      ['ash', '(squished) Hi, Auntie. I\'m your great x13 grand-nephew.', '(squished) Hi, Auntie. I\'m your great x13 nephew.'],
      ['f_glaciar', 'Thirteen? Ember was my NIECE, dumpling. So I\'m fourteen greats.', 'Ember was my NIECE. So I\'m fourteen greats.'],
      ['ash', 'I am NOT saying fourteen.', 'I am NOT saying fourteen.'],
      // her brother, by the Act I ending
      { if: 'choice ending=warden', then: [
        ['ash', 'Your brother is asleep on his mountain. I say goodnight to him every Lantern Day.', 'Your brother sleeps on his mountain. I say goodnight to him.'],
        ['f_glaciar', 'Goodnight? To VORLAX? Ha! He must hate that. Good. Keep doing it.', 'Goodnight to VORLAX? Ha! Keep doing it.'] ],
        else: [{ if: 'choice ending=heir', then: [
        ['ash', 'Your brother is, um, small now. He lives in a birdcage. In a bakery. Bertram charges admission.', 'Your brother is small now. He lives in a birdcage.'],
        ['f_glaciar', 'A BIRDCAGE! Oh, I must visit. I\'ll bring a mirror, so he can see his own face.', 'A BIRDCAGE! I must visit. I\'ll bring a mirror.'] ],
        else: [{ if: 'choice ending=lantern', then: [
        ['ash', 'Your brother came home. He\'s goat-sized now, he lives with my mom, and he really, really likes cake.', 'Your brother came home. He\'s small, and he LOVES cake.'],
        ['f_glaciar', '...Vorlax likes CAKE? He always said cake was for hatchlings. Oh, the old fibber. I\'m so glad.', 'Vorlax likes CAKE? Oh, I\'m so glad.'] ],
        else: [
        ['ash', 'Your brother is gone, Auntie. His fire went out. I\'m sorry.', 'Your brother is gone. His fire went out. Sorry.'],
        ['f_glaciar', 'He chose to be a very loud, very angry dragon for a very long time. You chose something better. Don\'t be sorry, dumpling. Be warm.', 'He chose to be loud and angry. You chose better. Be warm.'] ] }] }] },
      ['f_glaciar', 'Now listen, dumpling. The one the moths call the Mother has a name. Nyxara. The moon\'s old moth. She wants a night that never ends.', 'The Mother is Nyxara, the moon\'s old moth. She wants night forever.',
        { do: ['set f_nyx_named', 'page f3_tove_notes'] }],
      { choose: 'f3_auntie_home', who: 'f_glaciar',
        ask: ['I made a blizzard, dumpling. I\'m a danger. I should fly far north, past the edge of the ice, where I can\'t hurt anyone.', 'I made a blizzard. I should fly far north.'],
        pick: [
          { t: ['"You\'re the Snow Mother. Hearthold still sings about you."', '"You\'re the Snow Mother!"'], tone: 'kind', v: 'stay',
            need: { any: ['solved snow_mother', 'flag f_song'] },
            locked: ['Who is the Snow Mother of Hearthold\'s song? Work it out in the Case Book first.', 'Who is the Snow Mother? Ask the Case Book.'],
            then: ['choice f_glaciar_home=stay', { journal: ['Glaciar stayed in the north as the Snow Mother.', 'Glaciar stayed as the Snow Mother.'], key: 'f_glaciar_home' }],
            say: [
              ['f_glaciar', 'Ember\'s song? They still SING it? Then I\'ll stay. Someone has to keep the north. One gentle snow a year, for the sledding.', 'They still sing Ember\'s song? Then I\'ll stay.'] ] },
          { t: ['"Go and rest, Auntie. Come back when you\'re ready."', '"Go and rest, Auntie."'], tone: 'kind', v: 'north',
            then: [{ journal: ['Glaciar flew north to rest.', 'Glaciar flew north to rest.'], key: 'f_glaciar_home' }],
            say: [
              ['f_glaciar', 'Then I\'ll rest. And if you ever need a dragon, a cold one, a slow one, good for cooling soup, call me. I\'ll come.', 'If you ever need a cold, slow dragon, call me.'] ] },
        ] },
      ['tove', 'I still can\'t believe I forgot a whole DRAGON.', 'I can\'t believe I forgot a DRAGON.'],
      ['f_glaciar', 'Easily, dear. I\'m very quiet.', 'Easily, dear. I\'m very quiet.'],
      // she flies off under the fade (x2_story stops drawing her once f_glaciar_home is north)
      { if: 'choice f3_auntie_home=north', then: [{ fade: 1 }, { do: ['choice f_glaciar_home=north'] }] },
    ],
    // defeat: Ash kneels by the sleeping dragon (the promise is kept by A3S's Crown wake place, from f_done on)
    f3_auntie_sleep: [
      { cam: 'f3_glaciar_face', s: 1 },
      ['narr', 'Glaciar sleeps under her blanket of snow. Her breath puffs out, slow and cold. The chains hum.', 'Glaciar sleeps in the snow. The chains hum.'],
      { choose: 'f3_crown_song', who: 'narr', ask: ['What do you do?', 'What do you do?'],
        pick: [
          { t: ['Sing her the Snow Mother\'s Song', 'Sing her the song'], tone: 'kind', v: 'sing',
            need: 'flag f_song',
            locked: ['You don\'t know the words yet. Old Brynja in Hearthold knows where the verses are.', 'You don\'t know the song. Ask Brynja.'],
            then: ['choice f_glaciar=free', 'set f_glaciar_sung', 'choice f_glaciar_home=stay',
              { journal: ['You sang the Snow Mother\'s Song and Glaciar woke up.', 'You sang, and Glaciar woke up.'], key: 'f_glaciar' },
              { journal: ['Glaciar stayed in the north as the Snow Mother.', 'Glaciar stayed as the Snow Mother.'], key: 'f_glaciar_home' }],
            say: [
              ['narr', 'You kneel by her ear and sing. A sleepy dragon. A girl with horns. A fire that never goes out. One by one, the chains go soft, and drip away into nothing.', 'You sing to her. One by one, the chains melt away.'],
              ['narr', 'Glaciar opens one eye. It\'s blue.', 'Glaciar opens one eye. It\'s blue.'],
              ['f_glaciar', '...Ember used to sing me that. Who taught you, dumpling?', 'Ember sang me that. Who taught you?'],
              ['ash', 'Hearthold did. They still sing it. It\'s about you, Auntie.', 'Hearthold did. It\'s about you, Auntie.'],
              ['f_glaciar', 'Oh. Oh, my. Then I suppose I\'d better stay and earn it.', 'Oh my. Then I\'d better stay and earn it.'] ] },
          { t: ['Let her sleep, and promise to come back', 'Let her sleep'], tone: 'brave', v: 'sleep',
            say: [
              ['ash', 'Sleep well, Auntie. I\'ll come back for you. I promise.', 'Sleep well, Auntie. I\'ll come back. I promise.', { promise: 'f3_crown_wake' }],
              ['narr', 'You tuck the snow around her horns, the way Mom tucks your blanket. It\'s the best you can do. For now.', 'You tuck the snow round her horns, like Mom tucks you in.'],
              ['tove', 'Brynja knows an old song about a Snow Mother. Songs wake people up, sometimes.', 'Brynja knows a song. Songs can wake people.', { if: '!flag f_song' }] ] },
        ] },
      { do: ['page f3_tove_notes'] },
    ],

    // after the Crown (then the warp home, in play)
    f3_going_home: [
      ['narr', 'The Crown of Dread is quiet now. You say goodbye on top of the world, and climb all the way back down the mountain.', 'You say goodbye, and climb all the way back down.', { ref: 'f_crown' }],
    ],
    // the night in Hearthold, and the act's end (9 lines a branch)
    f3_night: [
      { cam: 'f3_hearth_view', s: 1 },
      ['narr', 'That night the Great Hearth burns gold and blue and doesn\'t flicker once. Pim gives out free cocoa. Captain Brann isn\'t afraid of anything at all, and says so, loudly, until he falls asleep in a chair.', 'That night the Great Hearth burns gold and blue. Free cocoa! Brann falls asleep in a chair.'],
      ['f_brynja', 'Thank you, child. My old girl says thank you too. She says it in sparks.', 'Thank you, child. My old girl says thank you too. In sparks.'],
      { if: 'choice f_glaciar_home=stay', then: [
        ['narr', 'Out on the roads and in the villages, every frozen person gave a little shiver tonight, and woke up. High on the mountain, the Snow Mother hums an old song.', 'Every frozen person in the north woke up tonight. The Snow Mother hums on the mountain.'] ],
        else: [{ if: 'choice f_glaciar=free', then: [
        ['narr', 'Far to the north, past the edge of the ice, a slow white dragon hums an old song. The snow falls soft and gentle, the way it should.', 'Far away, a slow white dragon hums. The snow falls soft and gentle.'] ],
        else: [
        ['narr', 'Somewhere on the mountain, an ice dragon sleeps under a blanket of snow. You promised to come back. You will.', 'An ice dragon sleeps on the mountain. You promised to come back.', { promise: 'f3_crown_wake' }] ] }] },
      { if: 'flag f_freed_n>=1', then: [
        ['f_brann', 'And some of my lost Hearthwardens walked home tonight! Frozen in armor, they said, until a dragon breathed blue fire on them.', 'Some of my lost guards came home tonight! A dragon saved them.'] ] },
      { if: 'choice f_hush=scarf', then: [
        ['narr', 'Across the face of the moon flutters a tiny white moth, wearing a long red scarf.', 'A tiny white moth in a red scarf flutters across the moon.'] ] },
      ['narr', 'Before you close your eyes, you look up. The moon is beautiful. It\'s also smaller. Like somebody took another bite out of the edge.', 'You look up. The moon is smaller. Someone took another bite.',
        { do: ['moon 85', 'set f_moon_bite3', 'set f_nyx_named'] }],
      ['nyxara', 'Two pieces, little ember. Two out of three. You\'re doing so well.', 'Two pieces, little ember. Two of three.'],
      ['nyxara', 'Come east. Bring them both. I\'ll leave a light on.', 'Come east. Bring them both. I\'ll leave a light on.'],
      ['ash', '...I really, really hate moths.', 'I really, really hate moths.'],
    ],
  },
})
