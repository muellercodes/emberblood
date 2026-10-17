// game/story/act5/people.js (N5S): what everyone on maps 0 to 4 says while the Long Night is on (act 5), and after it.
// Replaces their CAST `lines` and old barks while act 5 is on (CHANGES.md A2S people(); N5S ENGINE REQUEST 1 asks that
// act-5 entries come before an earlier act's for the same person).
// Rules kept here:
//  - The moon is gone until the dawn: every line about the dark sky carries fact 'n5_moon=gone' and `!flag n_dawn`;
//    every line about the morning after carries 'n5_moon=back' and `flag n_dawn` (map0_n5.js). Lines after the ending
//    follow choice n_end (moth, dawn, embermoon).
//  - People react to what Ash did in all four acts, once each, first: Act I (choice ending, greymane, cinder, fennick,
//    morrow, flag tk_come, quest duchess), Act II (choice c_vesper, quest c_oona, c_bolt), Act III (choice f_glaciar,
//    flag f_song, quest f_sled), Act IV (choice m_hush, flag m_leash_known, m_ship), and the finale's errands (n5_*).
//  - The errand pointers: Mom and Yara give the fourth-post clues (B4, B5); Mom, Quill, Brynja, Ripple and Wren point
//    at the friends' errands; Hollis, Ulf and Barley know about goats; Granny Oona's own errand is q_n5_oona.
//  - The Crown Shrine's "Who is with me?" (n5_crown_who, scene n5_who) is a place: the friends on the peak are not people
//    you can talk to (x4_story's ally runtime draws them).
people({
  id: 'act5_people', act: 5,

  clue: {
    n5_mom_lanterns: { icon: 'lamp', mystery: 'n5_fourth_lantern',
      text: ['Mom says her gran always made four lanterns on Lantern Day. Three for the family, one for whoever is out in the dark.',
        'Four lanterns. One for whoever is out in the dark.'] },
    n5_yara_post: { icon: 'lamp', mystery: 'n5_fourth_lantern',
      text: ['Elder Yara says the real green had four lantern posts when she was a girl. Nobody remembered why the fourth was there.',
        'The real green had four posts once.'] },
  },

  place: {
    // the Crown Shrine (n_sh_crown at 3331,85875): everyone waits round it after the gathering
    n5_crown_who: { map: 4, kind: 'examine', at: [3400, 85930], r: 30, h: 46, name: ['your friends by the shrine', 'your friends'],
      prompt: ['Who is with me?', 'Who is with me?'], if: 'flag n_gather', say: 'n5_who' },
  },

  scene: {
    n5_who: [
      ['narr', 'Everyone who climbed this far waits by the Crown Shrine. You count them on your claws.', 'You count your friends by the shrine.'],
      { if: 'flag n5_vesper', then: [{ if: 'quest q_n5_oona started', then: [['c_vesper', "Here. Obviously. I was here first. I'm always first.", 'Here. I was here first.']],
          else: [{ if: 'quest q_n5_vesper done', then: [['c_vesper', 'Here. Because Gran said. Mostly because Gran said.', 'Here. Because Gran said.']],
            else: [['c_vesper', "Here. Obviously. ...Gran doesn't know where I am, you know. She'll be up all night with the kettle on.",
              "Here. Gran doesn't know where I am, though.", { do: ['quest start q_n5_oona'] }]] }] }],
        else: [{ if: 'flag n5_vesper_left', then: [['ash', "Vesper isn't here. I left her hanging on the Silk Gallery. Gran would know how to say sorry.",
            "I left Vesper on the silk bridge. Gran will know what to do.", { do: ['quest start q_n5_vesper'] }]],
          else: [['ash', 'Vesper is out there somewhere. Her mask was on the cliff by the Silk Gallery.', 'Vesper is out there. Look by the silk bridge.']] }] },
      { if: 'flag n5_glaciar', then: [['f_glaciar', 'Present, dumpling. Cold, but present.', 'Here, dumpling. Cold, but here.']],
        else: [{ if: 'quest q_n5_glaciar active', then: [['ash', "Auntie Glaciar is still asleep on Mount Dread. The Snow Mother's Song could wake her.", 'Glaciar sleeps on Mount Dread. Sing to her!']],
          else: [['ash', "Glaciar isn't here. Something blue was glinting in the snow by the Floe Gap.", "Glaciar isn't here. Look by the Floe Gap."]] }] },
      { if: 'flag n5_hush', then: [['f_hush', 'Shhh. Here.']],
        else: [{ if: 'quest q_n5_hush active', then: [['ash', "Hush is still tied up in the Moth's Cradle. A hundred little moths on one silver knot.", "Hush is tied up in the Moth's Cradle."]],
          else: [['ash', "Hush isn't here. Something white was glittering in the Tendril Wood.", "Hush isn't here. Look in the Tendril Wood."]] }] },
      { if: 'trust friends>=3', then: [['ash', 'All three. Everyone she hurt is standing right here with me.', 'All three of them are here!']],
        else: [{ if: 'trust friends>=2', then: [['ash', 'Two of the three she hurt are here. Two is a lot of friends.', 'Two of the three are here.']],
          else: [{ if: 'trust friends>=1', then: [['ash', 'Only one of the three she hurt is here. She should hear from the others too.', 'Only one of the three is here.']],
            else: [['ash', 'None of the friends she hurt are here. Not yet.', 'None of them are here yet.']] }] }] },
      { choose: 'n5_who_more', ask: ['Anyone else?', 'Anyone else?'], pick: [
        { t: ['Ask Tikka about her spoon', 'Ask Tikka about her spoon'], v: 'tikka', if: 'flag tk_come=yes',
          say: [['ev_tikka', 'I brought a BIGGER spoon! For the moth!', 'I brought a BIGGER spoon!'], ['ev_tock', "It's a ladle."],
            ['ev_tikka', "It's a BIGGER SPOON, Tock."]] },
        { t: ['Scratch Greymane behind the ears', 'Pat Greymane'], v: 'greymane', if: 'choice greymane=ally',
          say: [['narr', 'Greymane leans on you so hard you fall over. He is wet. He definitely swam again.', 'Greymane leans on you. He is wet!']] },
        { t: ["That's everyone", "That's everyone"], v: 'done' },
      ] },
    ],
  },

  talk: {
    // ======================================================================= map 0, Embermere (Act I's people)
    yara: [
      { if: 'choice ending=lantern', once: true,
        say: ['You lit a lantern for your grandfather, once. I have told that story at the well every night since.', 'I still tell how you lit a lantern for Grandpa.'] },
      { if: 'choice ending=warden', once: true,
        say: ['The Sixth Warden. I still curtsy when you go past. My knees complain about it.', 'I still curtsy to the Sixth Warden.'] },
      { if: 'seen n_green !clue n5_yara_post', option: ['Were there always three lantern posts on the green?', 'Were there always three posts?'],
        then: ['clue n5_yara_post', 'heart_ember n5_yara'],
        say: [['yara', 'Three? No, dear. There were four posts when I was a girl. Nobody remembered why. The fourth one rotted, and nobody put it back.',
            'There were four posts when I was a girl!'],
          ['yara', 'When they dug out the old stump, they found this in the hole. Warm as toast, sixty years. I think it was waiting for you.',
            'This was in the hole. It is still warm. Take it.']] },
      { if: 'flag n_dawn choice n_end=moth', fact: 'n5_moon=back',
        say: ['A little grey moth sat on the well this morning. I gave her a crumb. She seemed to like that.', 'A little moth sat on the well. I fed her a crumb.'] },
      { if: 'flag n_dawn choice n_end=embermoon', fact: 'n5_moon=back',
        say: ['The moon is GOLD, Ash. Like a lantern somebody hung up very high. I sat up all night just to look at it.', 'The moon is gold! I looked all night.'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon has seams on it now, like a mended cup. I like it better. You can see it was loved.', 'The moon is mended. I like it better.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['Pebble came back with frost on her feathers and would not stop cawing. Be careful up there, Ash.', 'Pebble came back cold. Be careful up there!'],
          ['No moon. The well water is black as ink. I keep a lamp by it so nobody falls in.', 'No moon. I keep a lamp by the well.'],
          ['Your mother lit every lantern on the green before she left. Light one more than you need, Iska used to say.', 'Light one more than you need.']] },
      { bark: true, if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['No moon again tonight. Mind the well.', 'No moon. Mind the well.'] },
    ],

    hollis: [
      { if: 'quest q_n5_follower active !clue n5_hollis_note !flag n_dawn', fact: 'n5_duchess_pen=empty',
        say: ["Duchess? Pen's been empty for days. Gate's open. I didn't open it.", "Duchess's pen is empty. I didn't open it."] },
      { if: 'flag n_dawn solved n5_who_follows', fact: 'n5_moon=back',
        say: ['She came home this morning with frost in her beard and moon-dust on her hooves. Not a word. She is a goat.', 'Duchess came home with moon-dust on her hooves!'] },
      { if: '!flag n_dawn', fact: 'n5_duchess_pen=empty',
        say: [["Long Night or not, the goats want feeding. Well. Goat. Usually. She's off somewhere.", 'The goat wants feeding. She is off somewhere.'],
          ["Pen's empty again. She'll turn up. She always does, somewhere ridiculous.", 'She always turns up somewhere silly.']] },
      { say: ['Goats, Ash. Never trust a goat. Love them, mind. Never trust them.', 'Love goats. Never trust them.'] },
    ],

    mabel: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['Moonlilies will not open without a moon. They are sulking. I have told them that is not helpful.', 'Moonlilies sulk without a moon.'],
          ['Gran sent word from the Mirefen. She says the frogs have stopped singing. That has never happened.', 'Gran says the frogs stopped singing.']] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['Every moonlily in the valley opened at once this morning. It sounded like a sigh.', 'Every moonlily opened at once!'] },
    ],

    rook: [
      { if: 'choice cinder=ally', once: true,
        say: ['Is Sir Cindervane going up the mountain with you? A REAL knight? Can I hold his helmet? Can I BE his helmet?', 'Is the real knight going with you?'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [["I'm staying up ALL night to watch for you. Mum says it's already all night. That's not the point.", 'I am staying up all night for you!'],
          ['When I grow up I am going to be a dragon. A dragon who climbs a night mountain. Like you.', 'I want to climb a night mountain too.']] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['You DID it! I saw the moon come back! I was awake! Mostly!', 'You did it! I saw the moon!'] },
    ],

    wendel: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I wrote a song about the Long Night. It is very short. It is mostly one long, sad note.', 'My Long Night song is one long note.'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['I wrote a new song about the morning. It is much longer. It has a jig in the middle.', 'My new song has a jig in it!'] },
    ],

    nana: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I knitted you a black scarf for the mountain, so the Night Mother cannot see you. Neither can I. I have lost it.',
          'I knitted you a black scarf. Now I cannot find it.'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['Found the black scarf. It was on the cat. The cat looks very sneaky in it.', 'The scarf was on the cat!'] },
    ],

    hal: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Moo-rgaret will not come in from the field. She is waiting for the moon. Cows are like that.', 'My cow is waiting for the moon.'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['The moon came back and Moo-rgaret came in. She acted like it was her idea.', 'The moon is back. So is my cow.'] },
    ],

    pell: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Lanterns! Get your lanterns! Half price during the Long Night! Full price after. That is just business, little dragon.',
          'Lanterns! Half price in the Long Night!'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['Lanterns, full price! No? Moon souvenirs, then. Very slightly chewed.', 'Moon souvenirs! A bit chewed.'] },
    ],

    dell: [
      { if: 'flag m_ship=glaciar', once: true,
        say: ['You flew to Moonfall on a DRAGON instead of my boat. I am not upset. The Soggy Biscuit is upset.', 'You flew on a dragon. My boat is upset.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['Fish are not biting. Even the fish know something is wrong with the sky.', 'Even the fish know the sky is wrong.'],
          ['Engine is warm, lantern is lit. Wherever you need to go, the Soggy Biscuit Three goes too.', 'My boat will take you anywhere.']] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['Fish are biting again! The moon came back and the fish came with it. I cried a bit.', 'The fish are back! I cried.'] },
    ],

    minnow: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Dad says you are climbing a mountain made of night. Is it cold? Is it sticky?', 'Is the night mountain sticky?'] },
      { if: 'flag n_dawn', say: ['You are back! Was it sticky? I bet it was sticky.', 'Was it sticky? I bet it was.'] },
    ],

    mayor: [
      { if: 'choice morrow=jail', once: true,
        say: ['Morrow sends his regards from the Watch House. He is growing potatoes in the yard. Very law-abiding potatoes.', 'Morrow grows potatoes at the Watch House.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have declared the Long Night officially over. Nobody has told the sky. I am sending a strongly worded letter.', 'I told the sky the night is over. It did not listen.'] },
      { if: 'flag n_dawn', say: ['I am naming a holiday after you. Ash Day. It is just Lantern Day with more cake.', 'Ash Day! Lantern Day with more cake!'] },
    ],

    nib: [
      { if: '!flag n_dawn',
        say: ['I drew a map of the Night Mother\'s mountain! It is a triangle with a moth on it. One coin.', 'A map of the night mountain! One coin.'] },
      { if: 'flag n_dawn', say: ['New map! The mountain, but with a happy moon on top. Two coins. It has more detail.', 'New map! Two coins.'] },
    ],

    gorran: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['My lads are sitting up with every lamp in Coppergulch lit. For you. Do not make it weird.', 'Every lamp in Coppergulch is lit for you.'] },
      { if: 'flag n_dawn', say: ['Your mum came back through here swinging that hammer. She said you did fine. FINE. She was crying.', 'Your mum said you did fine. She was crying.'] },
    ],

    pick: [
      { if: '!flag n_dawn',
        say: ["Shovel says the mountain is made of moon. I say it is made of night. We bet a pie on it.", 'We bet a pie on what the mountain is.'] },
      { if: 'flag n_dawn', say: ['Nobody won the pie bet. We ate the pie anyway.', 'Nobody won. We ate the pie.'] },
    ],

    tamsin: [
      { if: '!flag n_dawn',
        say: ['I am writing the last verse of your song. I need you to come back, so I know how it ends.', 'Come back, so I know how your song ends.'] },
      { if: 'flag n_dawn choice n_end=moth', say: ['The last verse is about a little moth on a lantern. It makes everyone cry. Good crying.', 'My last verse makes everyone cry.'] },
      { if: 'flag n_dawn', say: ['I finished your song. Fourteen verses. The last one rhymes "moon" with "soon". I am very proud.', 'I finished your song! Fourteen verses.'] },
    ],

    moss: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Moonlilies sleep when the moon does, dearie. All of them. Even the mean ones by the bog.', 'The moonlilies all sleep now.'] },
      { if: 'flag n_dawn', say: ['The frogs are singing again. Badly. It is the most beautiful thing I have ever heard.', 'The frogs sing again!'] },
    ],

    morrow: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I believed a dragon once, and it ended badly. I believe in YOU. That feels different.', 'I believe in you. That feels different.'] },
      { if: 'flag n_dawn', say: ['I grow carrots now. Carrots do not care about moons or dragons. It is very restful.', 'I grow carrots now. Very restful.'] },
    ],

    ulf: [
      { if: 'quest q_n5_follower active !solved n5_who_follows',
        say: ['My brother says his goat has gone walkabout again. Sheep never wander off. Write that down.', 'Sheep never wander. Write that down.'] },
      { say: ['Goats climb anything, you know. Anything. Sheep stay on the ground where they belong.', 'Goats climb anything. Sheep do not.'] },
    ],

    bertram: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['I baked a loaf shaped like the moon. Somebody had to.', 'I baked a moon-shaped loaf.'] },
      { if: 'flag n_dawn', say: ['Moon buns! With a little seam of icing round the middle, like the real one.', 'Moon buns, with icing seams!'] },
    ],

    fennick: [
      { if: 'choice fennick=forgive !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Every lantern in Emberhollow is lit, Ash. Every night, like I promised. Tonight they are all lit for you.', 'Every lantern is lit. All for you.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Lamp oil is selling fast. Everybody wants a light in the window.', 'Everyone wants a light in the window.'] },
      { if: 'flag n_dawn', say: ['I kept a lamp in my window all night anyway. Old habit. Good habit.', 'I kept my lamp lit anyway.'] },
    ],

    wren: [
      { if: 'quest m_leash active item m_book_raw',
        say: ['Is that the Book of Moths? Under my arm. NOW. Please. Sorry. Now, please.', 'Is that the Book of Moths? Give it here!'] },
      { if: 'quest q_n5_hush active !flag m_leash_known',
        say: ['Moon-silk? The moon-priests of Lumen wrote about it. Their books are in the Drowned Library, under the sea, in Moonfall.',
          'The moon-priests wrote about moon-silk. Their books are in Moonfall.'] },
      { if: 'flag m_page11', once: true,
        say: ['Two page elevens. I have framed one and I sleep with the other. Do not tell anyone.', 'I sleep with page eleven. Shh.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have read every book about the moon. Not one says what to do when somebody eats it. I am writing that one myself.',
          'No book says what to do. I am writing one.'] },
      { if: 'flag n_dawn', say: ['Chapter one of my book: "I was seasick." The last chapter: "Ash came home." It is a long book.', 'My book ends: "Ash came home."'] },
    ],

    tilly: [
      { if: '!flag n_dawn', say: ['The Sleepy Salmon has a bed for you whenever you need it. The soup is mostly soup, even now.', 'A bed for you, any time.'] },
      { if: 'flag n_dawn', say: ['Free soup for the dragon who brought the moon home! Do not tell Pell.', 'Free soup for you! Shh.'] },
    ],

    osric: [
      { if: 'choice fennick=jail', once: true,
        say: ['My prisoner has polished every lamp in the Watch House twice. They have never been so shiny. I may keep him.', 'My prisoner polishes the lamps.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['The Watch is on duty all night. The Watch is me and two very old dogs. All three of us are awake.', 'The Watch is awake. Me and two old dogs.'] },
      { if: 'flag n_dawn', say: ['The dogs howled when the moon came back. So did I. Do not put that in a song.', 'The dogs howled. So did I. Shh.'] },
    ],

    marigold: [
      { if: '!flag n_dawn', say: ['A hat for the mountain? Black, with a brim, so no moth lands on your horns. No? Your loss.', 'A hat for the mountain? No? Your loss.'] },
      { if: 'flag n_dawn', say: ['Everyone wants a moon hat now. I am making them out of spoons.', 'Everyone wants a moon hat now.'] },
    ],

    cookie: [
      { say: ['Rock Soup! Long Night Rock Soup. Same as normal Rock Soup, but you eat it in the dark.', 'Rock Soup! You eat it in the dark.'] },
    ],

    hob: [
      { say: ['The Smoky Kettle stays open all night. There is no other kind of night just now.', 'We are open all night.'] },
    ],

    // ======================================================================= map 1, the Clockwork Coast (Act II's people)
    c_oona: [
      { if: 'quest q_n5_oona done', once: true,
        say: ['She will come home for tea. She said so. Well. YOU said so. Same thing, duck.', 'She will come home for tea!'] },
      { if: 'flag n_dawn quest q_n5_oona done',
        say: ['She came home for tea. She ate eleven biscuits. ELEVEN. And she wore the scarf.', 'She came home! Eleven biscuits!'] },
      { if: '!flag n5_vesper !flag n_dawn', fact: 'n5_moon=gone',
        say: ['My Vesper has gone up that mountain. I know she has. She always goes where the trouble is.', 'My Vesper went up that mountain.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have the kettle on all night. Somebody might come home cold.', 'The kettle is on all night.'] },
      { say: ['Fire is not the only warm thing, duck. Never was.', 'Fire is not the only warm thing.'] },
    ],

    c_hester: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Every watchman on every roof, looking up. Nobody knows what we are looking for. We are looking very precisely.',
          'All my guards are looking up. Very precisely.'] },
      { if: 'flag n_dawn', say: ['The moon rose at seven minutes past eleven. I wrote it down. I may have wept. Precisely.', 'The moon rose. I wrote down the time.'] },
    ],

    c_hettie: [
      { if: 'quest c_bolt done !flag n_dawn',
        say: ['Bolt keeps barking at the sky. He can smell that something is missing up there.', 'Bolt barks at the sky. Something is missing.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I am building a moon. Out of brass. It will not be the same. It will be LOUDER.', 'I am building a brass moon. A loud one.'] },
      { if: 'flag n_dawn', say: ['The real moon is back, so my brass moon is a lamp now. A very loud lamp.', 'My brass moon is a loud lamp now.'] },
    ],

    c_ottoline: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The Turning Library has two hundred books about the moon. Every one is suddenly out of date. Shhh.', 'All our moon books are out of date. Shhh.'] },
      { if: 'flag n_dawn', say: ['Two hundred new pages to write. I have never been so happy. Shhh. Sorry.', 'So many new pages! Shhh.'] },
    ],

    c_whirligig: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['No moon! Do you know what that does to the price of moon-dials? Nothing. They were already worthless. Hmph.', 'No moon! My moon-dials are worthless.'] },
      { if: 'flag n_dawn', say: ['The moon is back and my moon-dials WORK. I am selling them for double. Hmph.', 'My moon-dials work again! Double price.'] },
    ],

    c_mo: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The tide is all muddled without the moon. Admiral Pinch walked sideways into my office. Well. He always does.', 'The tide is muddled without the moon.'] },
      { if: 'flag n_dawn', say: ['Tide came in right on time this morning. I hugged a crab. Do not tell Pinch.', 'The tide is on time! I hugged a crab.'] },
    ],

    c_ingrid: [
      { say: ['Hammer, hammer, ding. I am making you a horseshoe, for luck. You do not have horses. It is the thought.', 'I am making you a lucky horseshoe.'] },
    ],

    c_fig: [
      { if: '!flag n_dawn', say: ['I have put a cosy on the teapot AND on my head. It is the Long Night, dearie. Everything needs a cosy.', 'Everything needs a cosy tonight.'] },
      { if: 'flag n_dawn', say: ['Morning, dearie! I have taken the cosy off my head. The teapot is keeping his.', 'Morning! The teapot keeps his cosy.'] },
    ],

    c_ambrose: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['The Great Clock still ticks, moon or no moon. I told her she is very brave.', 'The Great Clock still ticks. So brave.'] },
      { if: 'flag n_dawn', say: ['She chimed thirteen times when the moon came back. She has never done that. I did not stop her.', 'The Great Clock chimed thirteen times!'] },
    ],

    c_penny: [
      { if: 'flag n5_vesper !flag n_dawn',
        say: ['HEADLINE: MOTH MASK SEEN ON NIGHT MOUNTAIN, HELPING. SUBHEADLINE: PENNY PRESS SAW IT COMING.', 'HEADLINE: MOTH MASK HELPS DRAGON!'] },
      { if: '!flag n_dawn', say: ['HEADLINE: DRAGON CLIMBS MOUNTAIN OF NIGHT. SUBHEADLINE: PENNY PRESS WAS RIGHT ABOUT EVERYTHING.', 'HEADLINE: DRAGON CLIMBS NIGHT MOUNTAIN!'] },
      { if: 'flag n_dawn', say: ['HEADLINE: MOON BACK. DRAGON BACK. PENNY PRESS EXTREMELY BACK.', 'HEADLINE: MOON BACK!'] },
    ],

    c_ravel: [
      { say: ['A draught for courage? Brewed from moonlight. Well. It was. Before. Now it is mostly lemon.', 'A courage draught. Mostly lemon now.'] },
    ],

    c_jo: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Night sailing every night now. There is no other kind. I have only hit two seals.', 'Night sailing every night! Only two seals.'] },
      { if: 'flag n_dawn', say: ['DAY sailing! I forgot what the sea looked like. It is very big. Who knew.', 'Day sailing! The sea is very big.'] },
    ],

    c_bobs: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Tick. Tock. We have looked at the sky for six hours. The sky has not looked back.', 'We look at the sky. It does not look back.'] },
      { if: 'flag n_dawn', say: ['Tick. Tock. The sky looked back. It winked. We are reporting it.', 'The sky winked at us!'] },
    ],

    c_mina: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['The tide does not know what to do without the moon. It just sort of sloshes.', 'The tide just sloshes now.'] },
      { if: 'flag n_dawn', say: ['High tide at noon, low tide at six. Lovely, boring tides. I could kiss them.', 'Lovely boring tides again!'] },
    ],

    c_charlie: [
      { say: ['Chowder! Long Night chowder. It is chowder with the lights off.', 'Long Night chowder! Same chowder.'] },
    ],

    c_dory: [
      { if: '!quest q_n5_oona done !flag n_dawn',
        say: ['Granny Oona has packed a frying pan. I do not know why. I am not asking.', 'Granny Oona packed a frying pan. Why?'] },
      { say: ["Granny Oona's kettle has been on all night. You can smell the tea from the jetty.", "You can smell Gran's tea from here."] },
    ],

    c_tarbuckle: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['In my day we had TWO moons. ...We did not. But it feels like we should have kept a spare.', 'We should have kept a spare moon.'] },
      { if: 'flag n_dawn', say: ['In my day the moon came back on its own. Lazy, these young moons.', 'In my day the moon came back on its own.'] },
    ],

    c_posy: [
      { if: 'flag n5_vesper', say: ['Is the moth lady with you? Tell her I kept the music box safe. Every night.', 'Tell the moth lady I kept her box safe.'] },
      { say: ['The moth lady did not leave anything on our step this week. I hope she is okay.', 'I hope the moth lady is okay.'] },
    ],

    c_maudie: [
      { if: '!flag n_dawn', say: ['THE GULLS HAVE STOPPED STEALING CHIPS. THAT IS HOW YOU KNOW IT IS BAD.', 'THE GULLS STOPPED STEALING CHIPS!'] },
      { if: 'flag n_dawn', say: ['THE GULLS ARE STEALING CHIPS AGAIN! HOORAY! I MEAN, HOLD ON TO YOUR CHIPS!', 'THE GULLS STEAL CHIPS AGAIN! HOORAY!'] },
    ],

    c_agatha: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Squawk and I keep the lamp lit all night. Every ship lost tonight will still find its way home. That is the job.', 'We keep the lamp lit for every lost ship.'] },
      { if: 'flag n_dawn', say: ['We kept the lamp lit till sunrise anyway. Squawk insisted. He is very stubborn for a parrot.', 'We kept the lamp lit anyway.'] },
    ],

    c_barley: [
      { if: 'quest q_n5_follower active !solved n5_who_follows',
        say: ['A goat that climbs up cliffs where nothing else can? Sounds like Hollis\'s goat. That goat once climbed my chimney.', 'A cliff goat? Sounds like Hollis\'s goat.'] },
      { say: ['Duchess the Second has gone off her grass. She keeps staring at the mountain. Sheep know things.', 'My sheep keeps staring at the mountain.'] },
    ],

    // ======================================================================= map 2, Frostreach (Act III's people)
    f_brynja: [
      { if: 'quest q_n5_glaciar active !flag f_song !item n5_song',
        say: ['The Snow Mother\'s Song? My mother wrote: if the fire ever runs low, remember it. The fire is running low, Ash. The old songs are still up there somewhere, frozen.',
          'Remember the Snow Mother\'s Song. The old songs are frozen up there.'] },
      { if: 'quest q_n5_glaciar active !flag n5_glaciar', fact: 'n5_glaciar_bed=asleep',
        say: ['Sing it to her. The whole song. She always crackles along on the high notes.', 'Sing her the whole song!'] },
      { if: 'flag n5_glaciar !choice f_glaciar=free', once: true,
        say: ['She flew over the Hearth this morning, low and slow, with the chains gone. Every icicle in town played a note.', 'Glaciar flew over us! Free!'] },
      { if: '!flag n_dawn',
        say: ['Seventy years I have kept this fire. Tonight I am keeping it for you. Every log.', 'Tonight I keep this fire for you.'] },
      { if: 'flag n_dawn', say: ['The sun came up over the Hearth this morning and the whole town cheered. The fire cheered too. I heard it.', 'The sun came up! Even the fire cheered.'] },
    ],

    f_brann: [
      { if: '!flag n_dawn', say: ['I am NOT afraid of the Night Mother! I simply respect her from a very large distance! Indoors!', 'I respect the Night Mother. From far away!'] },
      { if: 'flag n_dawn', say: ['I was never afraid. I was guarding the inside of my house. Very bravely.', 'I bravely guarded my house.'] },
    ],

    f_pim: [
      { say: ['Hot cocoa! Free tonight, for heroes only! ...Fine. Two coins. Heroes still pay.', 'Hot cocoa! Two coins. Heroes pay too.'] },
    ],

    f_soren: [
      { if: 'quest f_sled done', once: true,
        say: ['Elka is still telling everyone she raced you. She tells it faster every time.', 'Elka still tells everyone she raced you.'] },
      { say: ['When this is over I am building a sled big enough for a dragon. Two dragons.', 'I will build a sled for two dragons.'] },
    ],

    elka: [
      { if: 'quest f_sled done !flag n_dawn', say: ['Faster than a wolf, Ash! That is how you climb a mountain! FASTER!', 'Faster than a wolf, Ash! FASTER!'] },
      { if: '!flag n_dawn', say: ['When you are done, I am sledding down the Night Mother\'s mountain. Dad says no. Dad is not the boss of mountains.',
          'I want to sled down the night mountain!'] },
      { if: 'flag n_dawn', say: ['Dad still says no about the mountain. I am asking again tomorrow.', 'Dad still says no. I will ask again.'] },
    ],

    f_hask: [
      { say: ['Hrm. Pup. A mountain made of night, eh. Wear a hat.', 'Hrm. Pup. Wear a hat.'] },
    ],

    f_pennant: [
      { if: '!flag n_dawn', say: ['The wind is blowing the wrong way. Toward the mountain. It wants to watch. Wheee. Sorry.', 'The wind blows toward the mountain. Wheee.'] },
      { if: 'flag n_dawn', say: ['The wind is blowing home again. Wheee. Sorry. Every time.', 'The wind blows home. Wheee.'] },
    ],

    f_toastwhistle: [
      { if: '!flag n_dawn', say: ['Everything is fine! The Hearth is fine! The moon is... not fine. I am fine! Why is my voice so high?', 'Everything is fine! Except the moon!'] },
      { if: 'flag n_dawn', say: ['Everything is ACTUALLY fine! My voice is still high. That is just how it is now.', 'Everything is really fine now!'] },
    ],

    f_gunnhild: [
      { say: ['My forge burns all night now. If you come back with a dented sword, I will be ready.', 'My forge is ready for your sword.'] },
    ],

    f_mags: [
      { say: ['I built a lantern that never goes out! It went out. I am building another one.', 'My lantern went out. Building another.'] },
    ],

    f_hilde: [
      { say: ['Beds at the Warm Mitten, any time. Biscuit the cat will sit on your feet. That is the price.', 'A bed any time. The cat sits on you.'] },
    ],

    f_eider: [
      { if: 'flag f_page11', once: true,
        say: ['Wren wrote to me about the eleventh page. Four pages about one page. I read it twice.', 'Wren wrote me four pages about one page.'] },
      { say: ['Shh. Sorry. Not you. The books. They are nervous about the moon.', 'Shh. The books are nervous.'] },
    ],

    // ======================================================================= map 3, Moonfall (Act IV's people) and the Moon Pier
    maren: [
      { if: 'seen n_green !clue n5_mom_lanterns', option: ['Mom, why would a green have four lantern posts?', 'Why four lantern posts?'],
        then: ['clue n5_mom_lanterns'],
        say: [['maren', 'Four? My gran always made four lanterns on Lantern Day. Three for us, and one for whoever is out in the dark.',
            'Gran made four lanterns. One for whoever is out in the dark.'],
          ['maren', 'Her gran did it too. Nobody remembered why. You just did it.', 'Nobody knew why. We just did it.']] },
      { if: 'quest q_n5_glaciar active !flag n5_glaciar', fact: 'n5_glaciar_bed=asleep',
        say: ['Your great-aunt is asleep in the snow on Mount Dread? Then go and wake her up. Family does not get left in the snow.',
          'Go and wake Auntie Glaciar. Family does not get left.'] },
      { if: 'quest q_n5_hush active !flag m_leash_known',
        say: ['A knot nothing can cut? Then do not cut it. Ask that old merman, Ripple. Or Wren. Somebody always wrote it down.',
          'Ask Elder Ripple. Somebody wrote it down.'] },
      { if: 'flag n_dawn choice n_end=embermoon', fact: 'n5_moon=back',
        say: ['You gave the Heart to the moon. I made it for you. ...And you gave it away to keep everyone warm. Good. That is what it was for.',
          'You gave the Heart away to keep everyone warm. Good.'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['You brought it home. You brought YOU home. Come here. No, closer. Your horns can take it.', 'You came home. Come here. Big hug.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['I will be right here at the end of the bridge. With a hammer. In case.', 'I will wait here. With a hammer.'],
          ['Did you eat the sandwich? It is a little squashed. It has been through a lot. Like you.', 'Did you eat the sandwich?']] },
      { bark: true, if: '!flag n_dawn', say: ['Eat something, Ash!', 'Eat something!'] },
    ],

    quill: [
      { if: 'quest q_n5_hush active !flag m_leash_known',
        say: ['Moon-silk! The moon-priests of Lumen studied it. Their books went down with the Drowned Library, under the sea.',
          'The moon-priests wrote about moon-silk. Their books are under the sea.'] },
      { if: 'flag n_dawn choice n_end=moth', fact: 'n5_moon=back',
        say: ['There is a small grey moth on the full moon. I have measured her. She is exactly the right size.', 'A little moth sits on the moon. Just the right size.'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['I measured the moon this morning. All of it is back. I have never been so happy about a number.', 'The whole moon is back! Happy numbers!'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['I am counting stars instead of the moon. There are four hundred more than usual. Without the moon, they show off.',
            'Without the moon, the stars show off.'],
          ['The moon saw every night that ever happened. If she ate it, she ate all of that too.', 'The moon saw every night. She ate them too.']] },
    ],

    juniper: [
      { if: '!flag n_dawn', say: ['I drew the peak again. Four rings, one on top of the other. It keeps changing shape. Rude.', 'I drew the peak again. It keeps changing!'] },
      { if: 'flag n_dawn', say: ['I drew the moon this morning. It sat still for me. Finally. Polite.', 'I drew the moon. It sat still!'] },
    ],

    m_ripple: [
      { if: 'quest m_leash active !flag m_vault_open',
        say: ['The priests\' Book of Moths! It lies in the vault of the Drowned Library, sealed with moon-wax. Only Moonfire melts it.',
          'The Book of Moths is in the Drowned Library. Melt the vault with Moonfire.'] },
      { if: 'quest q_n5_hush active flag m_leash_known',
        say: ['Gently, dragon. Moon-silk listens to soft breath. Like blowing on soup.', 'Gently. Like blowing on soup.'] },
      { if: '!flag n_dawn', say: ['The tide has not moved in days. The whole sea is holding its breath, dragon.', 'The whole sea holds its breath.'] },
      { if: 'flag n_dawn', say: ['The tide came back. The fish are confused. I am also confused. It is wonderful.', 'The tide is back. Everyone is confused!'] },
    ],

    m_winnie: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['When someone eats the moon, the tide gets the hiccups, child. Now it does not even hiccup. It just waits.', 'Now the tide just waits.'] },
      { if: 'flag n_dawn', say: ['Hiccup. There. The tide is back. Hiccup.', 'Hiccup. The tide is back.'] },
    ],

    m_dabble: [
      { say: ['Driftwood Landing stays put for you tonight! First time in history! We tied it to a rock.', 'We tied the town to a rock for you!'] },
    ],

    m_rowan: [
      { say: ['This knot means "good luck". This one means "come back". I tied both on your raft. You do not have a raft. Still.',
        'I tied good-luck knots for you.'] },
    ],

    m_squint: [
      { if: '!flag n_dawn', say: ['MOUNTAIN HO! ...It is always there now. MOUNTAIN HO anyway.', 'MOUNTAIN HO!'] },
      { if: 'flag n_dawn', say: ['MOON HO! ...It is just the moon. MOON HO anyway!', 'MOON HO!'] },
    ],

    m_gilly: [
      { say: ['Fish stew for the road! I tried fish cocoa again. Still not going well. Take the stew.', 'Fish stew for you! Not fish cocoa.'] },
    ],

    m_ned: [
      { if: '!flag n_dawn',
        say: ['The moths are GONE. Every last one. Flew up the mountain. I hate moths. ...I miss them a bit.', 'The moths all flew away. I miss them a bit.'] },
      { if: 'flag n_dawn', say: ['One little grey moth came back to my lamp last night. Just one. I let her stay.', 'One little moth came back. I let her stay.'] },
    ],

    m_saffron: [
      { say: ['Do not touch the well. It is very tired. It has seen a lot this week.', 'Do not touch the well. It is tired.'] },
    ],

    m_kiln: [
      { say: ['I made you a glass lantern for the mountain. It is shaped like a shoe. Do not ask.', 'I made you a shoe-shaped lantern.'] },
    ],

    m_esme: [
      { if: '!flag n_dawn', say: ['All twelve lamps of Sable are lit for you tonight. Bertha is burning extra bright. She likes you.', 'All twelve lamps are lit for you.'] },
      { if: 'flag n_dawn', say: ['We blew the lamps out at sunrise. Bertha sulked. She likes being needed.', 'Bertha the lamp sulked at sunrise.'] },
    ],

    m_dusty: [
      { say: ['Dusty: We are going to surf down the night mountain! Dune: On trays! Dusty: BORROWED trays!', 'We will surf the mountain on trays!'] },
    ],

    m_rafi: [
      { say: ['Three hundred years we crossed the Glass Desert by moonlight. Now we wait for it. Caravans are patient.', 'We wait for the moon. Caravans are patient.'] },
    ],

    m_coralia: [
      { say: ['We expected a dragon for a very long time. We are glad it was you. Even if you are small.', 'We are glad the dragon was you.'] },
    ],

    m_kelp: [
      { say: ['Pearls for your pockets, dearie. For the mountain. They still do not do anything. They are still lovely.', 'Pearls for your pockets. Still lovely.'] },
    ],

    m_rocket: [
      { say: ['I swam to the top of the sea to look at the mountain! It is very tall. I am very fast.', 'I swam up to see the mountain!'] },
    ],

    m_kipper: [
      { say: ['HALT! Who swims there? ...Oh. The hero. Carry on. Bravely. And carefully.', 'HALT! Oh, the hero. Carry on.'] },
    ],
  },
})
