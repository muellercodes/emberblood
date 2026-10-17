// Act V, the end: The Long Night Is Over (owner N5b). Data only.
// x4_story's choice (n_nyxara's n_choice) moves the stage here. Then, in one sitting: the dawn (n_dawn_lines: the
// glass turns clear, Duchess on the very top, the ride home), the epilogue book (seven pages, one painted plate each,
// four lines at most: the act file's book list), and the victory screen (x4_story's n4sVictory: "Ending n of 3", the
// stats, "Made for Toby, Gus, Linus and Rosemary.", endAct(5)). After "Keep exploring", Ash wakes up on the green in
// Emberhollow on the thousand-and-first Lantern Day (n_home), so "Climb on" and "All aboard" stay true. If Ash solved
// the fourth post, the real green has its fourth post back, lit for whoever is out in the dark.
chapter({
  id: 'n_end', act: 5, after: 'n_nyxara', next: null, takeover: true,
  card: null, name: ['The Long Night Is Over', 'The Long Night Is Over'],
  so_far: [
    'Ash reached the Night Mother at the top of Nightfall Peak, and the moon came home. The Long Night is over.',
    'The moon came home. The Long Night is over.'],

  place: {
    // where Ash wakes up on the Emberhollow green (between the three festival lanterns)
    n5_green_wake: { map: 0, at: [2620, 9330], r: 80, kind: 'spot', name: ['the green in Emberhollow', 'the green'] },
    // the fourth lantern post, back on the real green after the Long Night (only if Ash worked out why it was there)
    n5_green_post: { map: 0, at: [2800, 9060], r: 36, kind: 'examine', look: 'green_fourth_post', h: 70,
                     if: 'flag n_done solved n5_fourth_lantern', light: { r: 110, i: 0.7, night: true },
                     name: ['the fourth lantern post', 'the fourth post'], say: 'n5_green_post_look' },
  },

  step: [
    { id: 'dawn', do: 'wait_for flag n_dawn>=1', obj: ['The Long Night is ending', 'The Long Night is ending'] },
    // after the victory screen (G.done): ENGINE REQUEST, data runners keep going for this one step, so n_home plays
    // after "Keep exploring" (today it never does: s10Runners stops when G.done)
    { id: 'home', do: 'wait_for flag n_done', then: ['emit n4fx:home'],
      obj: ['The Long Night is over. Go anywhere you like.', 'Go anywhere you like!'] },
    // (n4fx:home: x4_story's free roam, and Ash is put on the green; then this step finds him there)
    { id: 'wake', do: 'goto n5_green_wake 240', scene: 'n_home', then: ['set n_home'],
      obj: ['The Long Night is over. Go anywhere you like.', 'Go anywhere you like!'] },
  ],

  scene: {
    // ---- the dawn (old STORY key: x4_story's n4sDawn plays it after the ending): 6 lines a branch
    n_dawn_lines: [
      { do: ['emit n4fx:dawn'] },
      ['narr', 'As the light comes back, the black glass of the peak turns clear as water, and little white flowers push up through the cracks. And at the very top, where nothing could possibly have climbed...', 'The glass turns clear. Flowers grow. And at the very top...', { do: ['emit n4fx:duchess_show'] }],
      ['goat', 'Meh.'],
      { if: 'solved n5_who_follows', then: [
        ['ash', 'DUCHESS! I KNEW it!', { do: ['emit n4fx:duchess_seen'] }] ],
        else: [
        ['ash', 'DUCHESS?! HOW?!', { do: ['emit n4fx:duchess_seen'] }] ] },
      { if: 'choice ending=lantern', then: [
        ['grandpa', 'Not HER.'] ],
        else: [{ if: 'flag n_big', then: [
        ['narr', 'You shrink back to your normal size, which is a relief. The Moon Door was not built for dragons your size.', 'You shrink back to normal. Good thing!', { do: ['emit n4fx:big_off'] }] ] }] },
      ['pip', 'Mip!'],
      { do: ['emit n4fx:home_bound'] },
      { if: { any: ['flag n5_glaciar', 'choice f_glaciar=free'] }, then: [
        ['f_glaciar', 'Climb on, dumplings. All of you. Yes, even the goat. ...Especially not the goat. Fine. The goat. Slowly, mind.', 'Climb on, everyone. Even the goat.'] ],
        else: [
        ['dell', "All aboard the Soggy Biscuit! Mind the fish. There aren't any fish. Mind them anyway.", "All aboard! Let's go home."] ] },
    ],

    // ---- the epilogue book (the act file's book: list; x4_story's storybook plays the pages in order). Each page
    // shows its plate first; at most 4 lines a branch (3 on the land pages, which may get one EPI line after them).
    n_book_home: [
      { do: ['emit n4fx:book_open', 'emit n4fx:book:green', 'set n_epi'] },
      ['narr', 'This is what happened after the Long Night, to everyone in this story.', 'This is what happened next, to everyone.'],
      { if: 'choice fennick=forgive', then: [
        ['narr', 'Fennick Wick kept every lantern in Emberhollow burning all through the dark, so nobody had to be scared. Now people call him the light-man. He cried a bit.', 'Fennick kept every lantern lit. Now he is the light-man.'] ],
        else: [{ if: 'choice fennick=jail', then: [
        ['narr', 'During the Long Night the Watch House was the brightest place in Brindlecross, because Fennick polished every lamp in it. Captain Osric gave him a medal. It was a lamp.', 'Fennick polished every lamp. He got a medal. It was a lamp.'] ] }] },
      { if: 'choice morrow=free', then: [
        ['narr', "Morrow's pumpkins grew so big in the new moonlight that he won a ribbon. The ribbon was not on fire. He framed it.", 'Morrow grew giant pumpkins and won a ribbon.'] ],
        else: [{ if: 'choice morrow=jail', then: [
        ['narr', 'Morrow wrote a book in the Watch House library: "Never Trust a Voice in Your Dreams." It sold very well.', 'Morrow wrote a book: "Never Trust a Voice in Your Dreams."'] ] }] },
      { if: 'choice ending=lantern', then: [
        ['narr', 'Grandpa told all of Emberhollow that he had saved the moon single-handed. Duchess bit him. Mom made them both wipe their feet.', 'Grandpa said he saved the moon. Duchess bit him.'] ],
        else: [{ if: 'choice ending=warden', then: [
        ['narr', 'Ash climbed Cinder Mountain to tell Grandpa the whole story. He pretended to be asleep. He was listening to every word.', 'Ash told sleeping Grandpa the whole story. He listened.'] ],
        else: [{ if: 'choice ending=heir', then: [
        ['narr', 'Tiny Grandpa told everyone at the bakery that he had saved the moon himself, from his birdcage. Bertram raised the price of admission.', 'Tiny Grandpa said he saved the moon from his birdcage.'] ],
        else: [
        ['narr', "On Lantern Day, Ash lit one lantern for Grandpa, the way Ember used to, so he'd know where home was, wherever he was.", 'Ash lit a lantern for Grandpa, so he would know where home was.'] ] }] }] },
    ],
    n_book_friends: [
      { do: ['emit n4fx:book:green'] },
      { if: 'choice greymane=ally', then: [
        ['narr', "Greymane's pack ran the high snow again, and on every full moon they howled at it, just to make sure it was still there.", "Greymane's wolves howl at the moon to check it is still there."] ],
        else: [{ if: 'choice greymane=home', then: [
        ['narr', "Greymane's pack howled at the moon every night it came back. Farmer Hollis said it was the happiest howling he'd ever heard.", "Greymane's wolves howl happily at the moon."] ] }] },
      { if: 'choice cinder=ally', then: [
        ['narr', 'Sir Cindervane finally, finally sat down. He said "good." Then he said "no more echoes, please." Then he rested.', 'Sir Cindervane finally sat down and rested.'] ],
        else: [{ if: 'flag dr_knight=spark', then: [
        ['narr', "The little spark in Sir Cindervane's gauntlet at the Obsidian Gate never went out. Not even in the Long Night.", "The spark in Sir Cindervane's glove never went out.", { ref: 'obsidian_gate' }] ],
        else: [{ if: 'flag dr_knight=joke', then: [
        ['narr', 'Visitors to the Obsidian Gate say you can still hear a knight chuckling under his helmet. He laughed all through the Long Night.', 'At the Obsidian Gate, a knight is still laughing.', { ref: 'obsidian_gate' }] ],
        else: [
        ['narr', "The red flower on Sir Cindervane's helmet at the Obsidian Gate never wilted. Not even in the Long Night.", "The flower on Sir Cindervane's helmet never wilted.", { ref: 'obsidian_gate' }] ] }] }] },
      { if: 'flag tk_come=yes', then: [
        ['narr', "Tikka hung her bigger spoon over the oven at home. Tock still says it's a ladle.", 'Tikka hung her big spoon over the oven.'] ],
        else: [{ if: 'flag tk_come=home', then: [
        ['narr', 'Tikka kept her lantern burning in her window every single night of the Long Night, just like she promised.', 'Tikka kept her lantern lit all night, like she promised.'] ] }] },
      { if: 'quest hollow done', then: [
        ['narr', 'Juniper Ashby\'s map of Embermere grew three new pages: the Clockwork Coast, Frostreach and Moonfall. And one small one: a spiral mountain, labelled "DON\'T."', 'Juniper drew maps of every land. And one mountain, labelled "DON\'T."'] ] },
    ],
    n_book_coast: [
      { do: ['emit n4fx:book:clocks'] },
      ['narr', 'Every clock in Gearhaven started ticking again at the very same second. The tinkers called it a malfunction. It was a celebration.', 'Every clock in Gearhaven ticked again at once.'],
      { if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] }, then: [
        { if: 'choice n_end=embermoon', then: [
          ['narr', 'Vesper hung her moth mask in Mom\'s forge, next to the spot where the Heart used to sit. "Emberblood without fire," she said. "Still an Emberblood." Every Lantern Day she lights her lantern with a match.', 'Vesper hung up her mask in the forge. She is still family.'] ],
          else: [
          ['narr', 'Vesper hung her moth mask in Mom\'s forge, right next to the Heart. "Emberblood without fire," she said. "Still an Emberblood." Every Lantern Day she lights her lantern with a match.', 'Vesper hung up her mask by the Heart. She is still family.'] ] },
        ['narr', 'And every Sunday she goes home to Saltmarsh for tea with Gran. Gran makes it far too strong. Vesper drinks it anyway.', 'Every Sunday, Vesper has tea with Gran.', { if: { any: ['flag n5_tea', 'flag n5_vletter'] } }] ],
        else: [
        ['narr', 'Nobody in Gearhaven saw the Moth Mask again. But every Lantern Day, a small lantern appeared on the forge doorstep in Emberhollow, with no note. Mom always lit it.', 'Every Lantern Day, a lantern with no note appears at the forge.'] ] },
    ],
    n_book_north: [
      { do: ['emit n4fx:book:hearth'] },
      ['narr', 'The Great Hearth of Hearthold burned so high that the whole town took off their scarves for the first time in a hundred years. Then they put them back on. It is still Frostreach.', 'The Great Hearth burned so high that everyone took off their scarves.'],
      { if: 'flag n5_glaciar !choice f_glaciar=free', then: [
        ['narr', 'Glaciar never stopped telling people that a small dragon climbed all of Mount Dread just to sing to her. Every Lantern Day she brings ice cream for everybody. Far too much.', 'Glaciar tells everyone a small dragon sang to her. She brings ice cream.'] ],
        else: [{ if: 'choice f_glaciar=free', then: [
        ['narr', 'Grand-aunt Glaciar (thirteen greats) came to Lantern Day and brought ice cream for everybody. She brought too much. Ash said all thirteen greats, twice, and she pretended not to love it.', 'Glaciar came to Lantern Day with ice cream. Ash said all the greats, twice.'] ],
        else: [
        ['narr', "On Mount Dread, Glaciar slept, and for the first time in a long while her dreams were warm. Every Lantern Day somebody climbed up and sang her a verse of the Snow Mother's Song, just in case.", 'On Mount Dread, Glaciar slept. Her dreams were warm.'] ] }] },
    ],
    n_book_moonfall: [
      { do: ['emit n4fx:book:observatory'] },
      { if: { any: ['flag n5_hush', 'choice m_hush=free'] }, then: [
        { if: 'choice n_end=dawn', then: [
          ['narr', "Hush stayed in Moonfall and became the Eclipse Observatory's first moth astronomer. She shushes anyone who is loud near the telescopes. Professor Quill says she is the best colleague she has ever had.", 'Hush works at the Observatory. She shushes loud people.'] ],
          else: [
          ['narr', 'Hush flew up to the moon to sit beside her mother. The two moths watch the world together, and neither of them says anything, and it is perfect.', 'Hush flew up to sit with her mother. It is perfect.'] ] } ],
        else: [
        ['narr', "Some nights in the Glass Desert, little white moths gather round travellers' lanterns. They never bite. They only want to be warm.", 'In the desert, little white moths sit by lanterns to be warm.'] ] },
      ['narr', 'Professor Quill measured the moon every night for a whole year. It came back every single time. She wrote that down too.', 'Quill measured the moon all year. It always came back.'],
    ],
    // the moon: the ending's picture, the Act I ending's line (moved here from the ending), Pip, Wren's book
    n_book_moon: [
      { do: ['emit n4fx:book:moon'] },
      { if: 'choice n_end=moth', then: [
        ['narr', "If you look at the full moon on a clear night, you'll see her: a tiny moth, sitting very still, keeping it company. When it grows thin, she doesn't worry. It always comes back.", 'Look at the full moon. A tiny moth sits there. She does not worry now.'] ],
        else: [{ if: 'choice n_end=embermoon', then: [
        ['narr', 'The moon stayed gold, with a moth asleep round it like a cat round a stove. The Ember Heart was gone from the family. But everyone, everywhere, could see it, every single night.', 'The moon stayed gold. The Heart is gone, but everyone can see it.'] ],
        else: [
        ['narr', 'The moon kept its silver seams forever, like a scar you are secretly proud of. And the Ember Heart went home to the forge.', 'The moon kept its silver lines. The Heart went home.'] ] }] },
      { if: 'choice ending=lantern', then: [
        { if: 'choice n_end=moth', then: [['grandpa', 'Hmph. I wanted to say "mine" about that moon. I\'m glad I didn\'t.', 'I wanted to say "mine". I am glad I didn\'t.']],
          else: [{ if: 'choice n_end=embermoon', then: [['grandpa', "Now THAT is a proper moon. Orange. Like a dragon's eye. Like... hers.", 'Now that is a good moon. Orange, like Ember.']],
          else: [['grandpa', 'A mended moon. Like a mended sock. Very practical. Ember would have liked it.', 'A fixed moon, like a fixed sock. Ember would like it.']] }] } ],
        else: [{ if: 'choice ending=warden', then: [
        { if: 'choice n_end=moth', then: [['iska', 'Light one more than you need. You did, Warden. You lit one for her.', 'You lit one more lantern. One for her.']],
          else: [{ if: 'choice n_end=embermoon', then: [['tove', 'A w-w-warm moon. FINALLY. I would like that noted.', 'A warm moon! Finally!']],
          else: [['bram', "HA! Morning! I'd forgotten what it looked like!", 'Ha! Morning! I forgot what it looks like!']] }] } ],
        else: [{ if: 'choice ending=heir', then: [
        { if: 'choice n_end=moth', then: [['grandpa', '(from his birdcage) A moth? On MY moon? ...Fine. She can stay.', 'A moth on MY moon? Fine. She can stay.']],
          else: [{ if: 'choice n_end=embermoon', then: [['grandpa', '(from his birdcage) Gold. Hmph. I would have made it bigger.', 'Gold. Hmph. I would make it bigger.']],
          else: [['grandpa', '(from his birdcage) Seams? On a moon? Sloppy. ...It looks nice.', 'Seams? Sloppy. It looks nice.']] }] } ],
        else: [
        { if: 'choice n_end=moth', then: [['ember', "You lit her a lantern. That's what I did, a thousand years ago. Thank you for finishing it, little ember.", 'You lit her a lantern, like I did. Thank you.']],
          else: [{ if: 'choice n_end=embermoon', then: [['ember', 'My Heart, up in the sky. Oh, Ash. Now everyone can see it.', 'My Heart in the sky! Now everyone can see it.']],
          else: [['ember', "Good morning, little ember. It's a lovely one.", 'Good morning, little ember.']] }] } ] }] }] },
      ['narr', 'Pip never said another word. Except once, very quietly, at breakfast: "Pancake."', 'Pip never talked again. Except once: "Pancake."', { if: 'flag pip' }],
      { if: 'flag n_panes>=6', then: [
        ['narr', 'Sister Wren wrote it all down: The Account of the Long Night. It had six glass pictures of a moth in it, and it was much longer than ten pages. Ash was on page eleven after all.', 'Sister Wren wrote a book about it all. Ash was on page eleven.'] ],
        else: [
        ['narr', 'Sister Wren wrote it all down: The Account of the Long Night. It was much, much longer than ten pages. Ash was on page eleven after all.', 'Sister Wren wrote a book about it all. Ash was on page eleven.'] ] },
    ],
    n_book_lanternday: [
      { do: ['emit n4fx:book:lanternday'] },
      ['narr', 'And on the next Lantern Day, the thousand-and-first, everyone came to the green in Emberhollow.', 'On the next Lantern Day, everyone came to the green.'],
      { if: 'solved n5_fourth_lantern', then: [
        ['narr', 'There were four lantern posts on the green again, for the first time in a thousand years. The fourth one is for whoever is out in the dark.', 'There were four lantern posts. One for whoever is out in the dark.'] ],
        else: [{ if: { any: ['solved n5_who_follows', 'quest duchess done flag c_duchess flag f_duchess flag m_duchess flag n_duchess'] }, then: [
        ['narr', 'Duchess was there too. Nobody knows how. Farmer Hollis says she takes the bus. There is no bus.', 'Duchess was there too. Nobody knows how.'] ] }] },
      ['narr', 'Ash lit the first lantern. And then one more than needed. Just in case.', 'Ash lit the first lantern. And one more, just in case.', { do: ['emit n4fx:book_lit'] }],
      ['narr', 'And whatever the moon looked like, it always, always came back.', 'And the moon always, always came back.'],
    ],

    // ---- after "Keep exploring": Ash wakes up at home, on Lantern Day
    n_home: [
      { do: ['time dusk'] }, { wait: 1 },
      ['narr', 'You wake up in the grass on the green in Emberhollow. Somebody has tucked a blanket round you. Pip is asleep on your head.', 'You wake up on the green at home. Pip sleeps on your head.'],
      { if: { any: ['flag n5_glaciar', 'choice f_glaciar=free'] }, then: [
        ['narr', 'Behind the forge, something very big and very cold is snoring.', 'Behind the forge, a big cold dragon snores.'] ] },
      ['maren', 'There you are. You slept the whole way home. It is Lantern Day, and you are late.', 'You slept all the way home. It is Lantern Day!'],
      ['narr', 'Round the green the lanterns are lit. All four of them.', 'The lanterns are lit. All four!', { if: 'solved n5_fourth_lantern', ref: 'n5_green_post' }],
      ['ash', 'Mom? ...The moon came back.', 'Mom? The moon came back.'],
      ['maren', 'It always does. Now go and light one more than you need.', 'It always does. Go light one more.'],
    ],
    n5_green_post_look: [
      ['narr', 'A fourth lantern post, new wood, with a little lantern that never quite goes out. On a tag, in careful letters: FOR WHOEVER IS OUT IN THE DARK.', 'A fourth post. Its tag says: FOR WHOEVER IS OUT IN THE DARK.'],
      { if: 'choice n_end=moth', then: [
        ['narr', 'A tiny grey moth is sitting on top of it, warming her wings. Visiting.', 'A tiny grey moth sits on top. Visiting.'] ] },
    ],
  },
})
