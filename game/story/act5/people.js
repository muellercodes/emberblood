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

  // the clues n5_mom_lanterns and n5_yara_post that Mom and Yara give below are defined by N5a (n_bridge.js), whose
  // small mystery n5_fourth_lantern asks for them
  place: {
    // Mom on the Moon Pier (x3_people's M3P_VIS.pier.maren): x3_people's own pier talk answers Mom before data talk can
    // (CHANGES.md A4S ENGINE REQUEST), so while the fourth-post clue is wanted her lantern answer is also a place at her
    // feet; its prompt wins over "Talk to Maren" only until the clue is found
    n5_mom_ask: { map: 3, kind: 'examine', at: [13505, 65436], r: 26, h: 70, name: ['Mom', 'Mom'],
      prompt: ['Ask Mom about Lantern Day', 'Ask Mom about lanterns'], if: 'clue n5_fourth_post !clue n5_mom_lanterns', say: 'n5_mom_lanterns_talk' },
    // the Crown Shrine (n_sh_crown at 3331,85875): everyone waits round it after the gathering
    n5_crown_who: { map: 4, kind: 'examine', at: [3400, 85930], r: 30, h: 46, name: ['your friends by the shrine', 'your friends'],
      prompt: ['Who is with me?', 'Who is with me?'], if: 'flag n_gather', say: 'n5_who' },
  },

  scene: {
    n5_mom_lanterns_talk: [
      ['ash', 'Mom, why would a green have four lantern posts?', 'Mom, why four lantern posts?'],
      ['maren', 'Four? My gran always made four lanterns on Lantern Day. Three for us, and one for whoever is out in the dark.',
        'Gran made four lanterns. One for whoever is out in the dark.', { clue: 'n5_mom_lanterns' }],
      ['maren', 'Her gran did it too. Nobody remembered why. You just did it.', 'Nobody knew why. We just did it.'],
    ],
    n5_who: [
      ['narr', 'Everyone who climbed this far waits by the Crown Shrine. You count them on your claws.', 'You count your friends by the shrine.'],
      { if: 'flag n5_vesper', then: [{ if: 'quest q_n5_oona started', then: [['c_vesper', "Here. I got here before any of you, by the way.", 'Here. I was here first.']],
          else: [{ if: 'quest q_n5_vesper done', then: [['c_vesper', 'Here. Because Gran said so.', 'Here. Because Gran said.']],
            else: [['c_vesper', "Here. ...Gran doesn't know where I am, you know. She'll be up all night with the kettle on.",
              "Here. Gran doesn't know where I am, though.", { do: ['quest start q_n5_oona'] }]] }] }],
        else: [{ if: 'flag n5_vesper_left', then: [['ash', "Vesper isn't here. I left her hanging on the Silk Gallery. Granny Oona would know how I should say sorry.",
            "I left Vesper on the silk bridge. Gran will know what to do.", { do: ['quest start q_n5_vesper'] }]],
          else: [['ash', 'Vesper is out there somewhere. Her mask was on the cliff by the Silk Gallery.', 'Vesper is out there. Look by the silk bridge.']] }] },
      { if: 'flag n5_glaciar', then: [['f_glaciar', 'Present, dumpling. Cold, but present.', 'Here, dumpling. Cold, but here.']],
        else: [{ if: 'quest q_n5_glaciar active', then: [['ash', "Auntie Glaciar is still asleep on Mount Dread. The Snow Mother's Song could wake her.", 'Glaciar sleeps on Mount Dread. Sing to her!']],
          else: [['ash', "Glaciar isn't here. Something blue was glinting in the snow by the Floe Gap.", "Glaciar isn't here. Look by the Floe Gap."]] }] },
      { if: 'flag n5_hush', then: [['f_hush', 'Shhh. Here.']],
        else: [{ if: 'quest q_n5_hush active', then: [['ash', "Hush is still tied up in the Moth's Cradle. A hundred little moths on one silver knot.", "Hush is tied up in the Moth's Cradle."]],
          else: [['ash', "Hush isn't here. Something white was glittering in the Tendril Wood.", "Hush isn't here. Look in the Tendril Wood."]] }] },
      { if: 'trust friends>=3', then: [['ash', 'All three. Everyone she hurt is standing right here with me.', 'All three of them are here!']],
        else: [{ if: 'trust friends>=2', then: [['ash', "Two of the three she hurt are here. That's enough for her to hear us.", 'Two of the three are here.']],
          else: [{ if: 'trust friends>=1', then: [['ash', 'Only one of the three she hurt is here. She should hear from the others too.', 'Only one of the three is here.']],
            else: [['ash', 'None of the friends she hurt are here. Not yet.', 'None of them are here yet.']] }] }] },
      { choose: 'n5_who_more', ask: ['Anyone else?', 'Anyone else?'], pick: [
        { t: ['Ask Tikka about her spoon', 'Ask Tikka about her spoon'], v: 'tikka', if: 'flag tk_come=yes',
          say: [['ev_tikka', 'I brought a BIGGER spoon! For the moth!', 'I brought a BIGGER spoon!'], ['ev_tock', "It's a ladle."],
            ['ev_tikka', "It's a BIGGER SPOON, Tock."]] },
        { t: ['Scratch Greymane behind the ears', 'Pat Greymane'], v: 'greymane', if: 'choice greymane=ally',
          say: [['narr', "Greymane leans on you so hard you fall over, and now you're wet too.", 'Greymane leans on you. He is wet!']] },
        { t: ["That's everyone", "That's everyone"], v: 'done' },
      ] },
    ],
  },

  talk: {
    // ======================================================================= the Moon Pier (map 3): Mom and the friends
    // (J12, talk v11) Act V talk answers what was said. The states, in story order: on the Moon Pier before Ash crosses
    // the moonfire bridge (!flag n_depart); back over the bridge in the middle of the climb (flag n_depart, the Long
    // Night: !flag n_dawn); and after the dawn (flag n_dawn: the epilogue and free roam). Openers are listed in the order a
    // person would say them, the one-time callbacks to Acts I to IV first. x3_people.js stands Mom, Quill, Juniper,
    // Vesper (m_vesper_ally), Tikka (tk_come=yes) and Dell (m_landed) on the pier, and steps aside for this data
    // (m3pDataTalk). After the game is won Mom is home at the forge, Quill at the Observatory, Juniper still on the pier,
    // Dell and Tikka at Driftwood Landing.

    // ---------------------------------------------------------------- Mom (Maren)
    // Voice sheet: a smith. Short, practical, warm, teasing. Worry comes out as instructions, love as hugs and work. Never
    // "I'm proud of you", never speeches. Her one "Eat something" in Act V is in n_bridge's note, so none here.
    maren: [
      // after the dawn: an ice dragon behind the forge (Glaciar flew everyone home, or came to Lantern Day)
      { if: { all: ['flag n_dawn', { any: ['flag n5_glaciar', 'choice f_glaciar=free'] }] }, fact: 'n5_moon=back',
        say: ["There's an ice dragon snoring behind my forge. Every bucket of milk in the village has frozen solid.",
          'An ice dragon snores behind my forge. The milk froze!'],
        re: [
          { t: ["That's Auntie Glee. She'll wake up hungry.", 'She will wake up hungry.'],
            say: ["Then she can have the frozen milk. It's hers, really.", 'Then she can have the frozen milk.'] },
          { t: ['Should I wake her up?', 'Should I wake her?'],
            say: ["Let her sleep. She told me she's slept through too much already. I think this is the good kind.", 'Let her sleep. This is the good kind of sleep.'] },
          { t: ['Can she stay for Lantern Day?', 'Can she stay?'], tone: 'kind', f: 0.5,
            say: ["She's family. Family doesn't have to ask.", 'She is family. She does not have to ask.'] },
        ] },
      // after the dawn, the Heart given to the moon
      { if: 'flag n_dawn choice n_end=embermoon', fact: 'n5_moon=back',
        say: ['You gave our Heart to the moon. I mended it so it would keep somebody warm. I never thought it would be everybody.',
          'You gave the Heart to the moon. Now it keeps everyone warm.'],
        re: [
          { t: ['Are you cross with me?', 'Are you cross?'],
            say: ['Cross? It sat on a shelf in my forge for twenty years. Now I can see it from the door.', 'No. Now I can see it from the door.'] },
          { t: ['Grandma Ember would have done it.', 'Grandma Ember would have.'],
            say: ["She would. She'd have thrown it higher, too.", 'She would. Higher, too.'] },
        ] },
      // after the dawn: home
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: [['narr', 'Mom hugs you so hard your horns creak. Then she lets go, looks at you, and does it again.', 'Mom hugs you. Then she hugs you again.'],
          ['maren', "There. Now you're properly home.", "There. Now you're home."]],
        re: [
          { t: ['I heard you, up there in the dark.', 'I heard you in the dark.'], tone: 'kind', f: 0.5, then: ['said maren_window'],
            say: ['I talked to the lantern in the window all night. Hal came round twice to check on me.', 'I talked to the window lantern all night. Hal checked on me.'] },
          { t: ['I ate the sandwich. Eventually.', 'I ate the sandwich. Late.'],
            say: ["Squashed, in the dark, halfway up a mountain? Good. That's the best way to eat a sandwich.", 'Squashed, in the dark? Best way to eat one.'] },
          { t: ["The Heart's back on its shelf.", 'The Heart is home.'], if: '!choice n_end=embermoon',
            say: ["Good. Now I can stop getting up at night to look at the shelf. I won't, though.", 'Good. I will still check it at night.'] },
        ] },
      // after the dawn, the next day: her moment (the question she sat on all through the Long Night)
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Ash. When you were up there, did you ever want to turn round and come home?', 'Up there, did you want to come home?'],
        re: [
          { t: ["Every ring. I didn't, though.", "Every ring. I didn't."], f: 0.75,
            say: ['I know. I sat on the step every night and wanted to come and fetch you. I didn\'t either.', 'I wanted to fetch you every night. I did not.'] },
          { t: ['Only when Pip got hungry.', 'When Pip was hungry.'], tone: 'silly', if: 'flag pip',
            say: ['So every hour, then.', 'So every hour.'] },
          { t: ['No. You kept the light on.', 'No. You kept the light on.'], tone: 'kind', f: 0.5,
            say: ["Every night. Fennick sold me so many candles he started giving them away.", 'Every night. Fennick gave me candles.'] },
        ] },
      // back over the bridge in the middle of the climb
      { if: 'flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ["You're back! Is it... No. It isn't done, is it? You've come down for something.", "You're back! It isn't done, is it?"],
        re: [
          { t: ['I wanted to see you first.', 'I wanted to see you.'], tone: 'kind', f: 0.75, then: ['said maren_visit'],
            say: ["...Come here. There. That's enough of that. Now go back up.", 'Come here. There. Now go back up.'] },
          { t: ["The rings are all places I've been.", 'The rings are places I know.'],
            say: ['Then you know the way round already. That helps.', 'Then you know the way. Good.'] },
        ] },
      // on the pier, before the bridge
      { if: '!flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ['That bridge goes all the way up into the dark. I keep looking at it, and it keeps going.', 'The bridge goes up and up into the dark.'],
        re: [
          { t: ["I'll come back down it.", "I'll come back down."],
            say: ["I know. I'll be right here at the end, with my hammer, in case.", 'I know. I will wait here with my hammer.'] },
          { t: ["I'll be careful. Twice.", "I'll be careful. Twice."], if: 'said maren_careful', tone: 'kind', f: 0.5,
            say: ['Twice. Like at the door, the very first time. Good.', 'Twice. Like the first time.'] },
          { t: ['Walk me to the end of the pier?', 'Walk me to the end?'],
            say: ["That's what I'm here for. To the end of the pier, and then I watch.", 'To the end. Then I watch.'] },
        ] },
      { if: '!flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: [['Everybody came out to the pier for you. Go and say your goodbyes. I go last.', 'Say your goodbyes. I go last.'],
          ["Quill keeps bringing me tea. I keep forgetting to drink it. I'm watching the bridge.", 'I keep watching the bridge.']] },
      { if: 'flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: [["Did you eat that sandwich yet? Don't make me come up there.", 'Did you eat the sandwich?'],
          ["I'll be right here at the end of the bridge, with my hammer, in case.", 'I will wait here. With a hammer.']] },
      // the fourth lantern post (her clue for n5_fourth_lantern; the place n5_mom_ask at her feet plays the same scene)
      { if: 'clue n5_fourth_post !clue n5_mom_lanterns', option: ['Mom, why would a green have four lantern posts?', 'Why four lantern posts?'],
        then: ['clue n5_mom_lanterns'],
        say: [['maren', 'Four? My gran always made four lanterns on Lantern Day. Three for us, and one for whoever is out in the dark.',
            'Gran made four lanterns. One for whoever is out in the dark.'],
          ['maren', 'Her gran did it too. Nobody remembered why. You just did it.', 'Nobody knew why. We just did it.']] },
      // the friends' errands: what Ash tells her, and what she says to do
      { ask: ['Auntie Glaciar is still asleep, Mom.', 'Glaciar is still asleep.'], if: 'quest q_n5_glaciar active !flag n5_glaciar', fact: 'n5_glaciar_bed=asleep',
        say: ['In the snow, on Mount Dread, with those chains on? Then go and wake her. Family does not get left in the snow.',
          'Then go and wake her. Family does not get left.'] },
      { ask: ["Hush is tied up with moon-silk.", 'Hush is tied with moon-silk.'], if: 'quest q_n5_hush active !flag m_leash_known',
        say: ["A knot nothing can cut? Then don't cut it. Find out how it was tied. Ask that old merman, Ripple. Somebody always wrote it down.",
          "Don't cut it. Ask Elder Ripple. Somebody wrote it down."] },
      { ask: ['I left Vesper hanging up there.', 'I left Vesper up there.'], if: 'quest q_n5_vesper active',
        say: ['Then go and tell her so. Her, not me. Her gran will know how to say it. Grans always know.', 'Tell her, not me. Her gran will know how.'] },
      { ask: ['Were you scared on the moonlight stairs?', 'Were you scared on the stairs?'], if: { all: ['!flag n_dawn', { any: ['flag m_maren', 'flag m_reforged'] }] },
        say: ['Every step. I kept my eyes on the top, where you were, and let my feet do the rest.', 'Every step. I looked at you, not down.'] },
      { ask: ['What do I do if she asks for the Heart?', 'What if she asks for the Heart?'], if: '!flag n_dawn',
        say: ["You say no. You've said no at bedtime since you were two. You're very good at it.", 'You say no. You are very good at no.'] },
      { ask: ['Will you teach me to mend things?', 'Will you teach me to mend?'], if: 'flag n_dawn',
        say: ["Tomorrow. Bring your own apron. You're not borrowing mine again.", 'Tomorrow. Bring your own apron.'] },
      { ask: ['Is Vesper staying for Lantern Day?', 'Is Vesper staying?'], if: { all: ['flag n_dawn', { any: ['flag n5_vesper', 'choice c_vesper=friend'] }] },
        say: ["She's in the forge, trying out my tongs. I've told her she can hang that mask by the door.", 'She is in the forge. Her mask can hang by the door.'] },
      { if: 'flag n_dawn', idle: [["Mm? Pass me the tongs. It's good to say that again.", 'Pass me the tongs.'], ['Go on. I can hammer and listen.', 'Go on. I am listening.']] },
      { idle: [["Mm? I'm watching the bridge. Go on.", 'I am watching. Go on.'], ['Go on. My hands are busy, not my ears.', 'Go on. I am listening.']] },
      { if: 'flag n_dawn', bye: [["Back before dark. ...I get to say that again.", 'Back before dark!']] },
      { bye: [['Scarf on. Go.', 'Scarf on. Go.'], ["Go on. I'm right here.", 'Go on. I am here.']] },
      { bark: true, if: '!flag n_dawn', say: ['Keep your scarf on up there, Ash!', 'Keep your scarf on!'] },
    ],

    // ---------------------------------------------------------------- Vesper, on the pier (friend path, m_vesper_ally)
    // Voice sheet: quick, proud, funny when cornered, tender only about Gran. Climber's words. Teases instead of
    // thanking. "cousin", never "little ember". Act IV: the smoke job, the stolen moth knight's helmet, the Moon Well
    // where she told the Mother to keep her fire, and "Not alone, cousin." on this pier. On the peak she comes in at the
    // Silk Gallery (n_clocks, flag n_vline) and goes up her own way; x3_people still stands her on the pier, so a kid
    // who comes back down finds her there first.
    c_vesper: [
      { if: 'flag n_vline flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ["Don't look at me like that. Thieves never take the stairs. I was down here before you.", "Thieves don't take stairs. I got here first."],
        re: [
          { t: ['How did you even get down?', 'How did you get down?'],
            say: ['A silk line, a long drop and a very surprised moth. Mostly the moth.', 'A silk line. And a surprised moth.'] },
          { t: ['You saw your echo, up there.', 'You saw your echo.'], if: 'stage>=n_rime',
            say: ["I saw her. I used to be her. I'd like to stop talking about it now.", 'I used to be her. Let us not talk about it.'] },
        ] },
      { if: '!flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ["Not alone, cousin. I said it once, on this pier, and I'm not saying it again. It was embarrassing.", 'I said "not alone" once. Not again.'],
        re: [
          { t: ["It wasn't embarrassing.", "It wasn't embarrassing."],
            say: ['It was. You did a face. ...Fine. It was a little bit nice.', 'You did a face. Fine. It was nice.'] },
          { t: ['Will you climb up with me?', 'Will you climb with me?'],
            say: ["With you? I'll be on the rooftops ahead of you. Try to keep up.", "I'll be ahead of you. Keep up."] },
          { t: ["What's with the helmet?", "What's with the helmet?"],
            say: ["Stole it off a moth knight in the Heights. It doesn't fit. I'm keeping it.", 'I stole it from a moth knight. Keeping it.'] },
        ] },
      // her moment, before the climb: the Moon Well, still on her mind
      { if: '!flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Can I ask you something? At the Well, when she offered me fire. Did you think I would take it?', 'At the Well. Did you think I would take her fire?'],
        re: [
          { t: ['No. Not for a second.', 'No. Not for a second.'], tone: 'kind', f: 0.5,
            say: ['Liar. ...Thanks, though.', 'Liar. Thanks, though.'] },
          { t: ['For a second, maybe.', 'For a second, maybe.'], f: 0.75,
            say: ["Me too. A whole second. Then I thought about Gran's hands.", "Me too. Then I thought of Gran's hands."] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [["Gran writes every week. She says the stove's still warm. She says come home. I say soon. It's nearly true.", 'Gran says come home. I say soon.'],
          ["When you go up, I'll be right behind you. Or in front. Mostly in front.", 'I will be in front of you. Mostly.']] },
      { ask: ['Does she still talk in your sleep?', 'Does she still talk to you?'], if: '!flag n_dawn',
        say: ["Every night. She says I'll never get up that mountain. I've decided that's a dare.", 'Every night. She says I cannot climb it. That is a dare.'] },
      { ask: ['What will you do, after?', 'What will you do after?'],
        say: ["Tea with Gran. Then I'll break into something, just for fun, and put it all back.", 'Tea with Gran. Then a break-in, for fun. I will put it back.'] },
      { ask: ['Do you miss being the Moth Mask?', 'Do you miss the Moth Mask?'],
        say: ['I miss the cloak. The cloak was good. The rest was hers.', 'I miss the cloak. The rest was hers.'] },
      { idle: [["Make it quick, cousin. I'm casing the bridge.", 'Quick, cousin.'], ["Mm? I was looking for a way up that isn't stairs.", 'Mm? Go on.']] },
      { bye: [["See you at the top. I'll be early.", 'See you at the top.']] },
    ],

    // ---------------------------------------------------------------- Juniper Ashby, Rook's big sister
    // Mapper, brave, a bit bossy, never lost twice. Act I: lost in the Whisperwood Hollow until Ash found her (quest
    // hollow); Act IV: her Map Tent in Sable; drew the peak through Quill's telescope (n_depart). She stays on the pier.
    juniper: [
      { if: 'said rook_where_juniper !flag n_dawn', once: true,
        say: ['Rook wrote to me. He says on Lantern Day you were the only one who asked where I was.', 'Rook says you asked where I was. On Lantern Day.'],
        re: [
          { t: ['You never miss the lanterns.', 'You never miss the lanterns.'],
            say: ["I missed them that once. I'm not missing the moon.", 'I missed them once. Not this time.'] },
          { t: ['Rook kept your supper warm.', 'Rook kept your supper warm.'],
            say: ['He sat on it. He told me so. It was a very flat pie.', 'He sat on it. A very flat pie.'] },
        ] },
      { if: '!flag n_depart',
        say: ["I saw it from Sable! A whole mountain, out of the sea! I'm drawing it through the Professor's telescope, but it won't hold still.",
          'I saw the mountain from Sable! It will not hold still.'],
        re: [
          { t: ["Mountains don't move, Juniper.", "Mountains don't move."],
            say: ["This one does. It's grown a ring since breakfast. I've rubbed the top out twice.", 'This one does. It grew a ring today!'] },
          { t: ['Can I see it?', 'Can I see it?'],
            say: ["Not till it's done. Half a map gets people lost. I know. I was the people.", 'Not yet. Half a map gets you lost. I know!'] },
        ] },
      { if: 'flag n_depart !flag n_dawn',
        say: ['Did my map work? Tell me the truth. Did it get you lost?', 'Did my map work? Tell the truth!'],
        re: [
          { t: ['Four rings, just like you drew.', 'Four rings, like you drew.'],
            say: ["Four! The Professor said three and a bit. I'm telling her right now.", "Four! I'm telling the Professor!"] },
          { t: ['The second ring is all Gearhaven.', 'The second ring is Gearhaven.'],
            say: ['I knew those chimneys looked crooked. I thought my hand was cold. They really are crooked.', 'I drew the chimneys crooked. They really are!'] },
          { t: ['It got me lost once.', 'It got me lost once.'], tone: 'silly',
            say: ['Once is good. Ask Rook how many times I got lost making the Emberhollow one.', 'Once is good! Ask Rook about me.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["I'm drawing the peak again, now the glass has gone clear. It's very hard to draw something you can see through.",
          'I am drawing the peak again. It is clear now. So hard!'],
        re: [
          { t: ['Put Duchess on the very top.', 'Put Duchess on top.'],
            say: ["She's already there. She's the smallest thing on the page, and she's looking right at you.", 'She is there. Tiny. Looking at you.'] },
          { t: ["Write 'Don't' on it.", "Write 'Don't' on it."],
            say: ['Already did. Rook will try it anyway, so I drew him the safe way up as well.', 'I did. And a safe way up, for Rook.'] },
        ] },
      { if: '!flag n_dawn',
        say: [['The moths have all gone from the telescope. Now it\'s just the mountain, all the way up.', 'Now it is just the mountain.'],
          ['I gave you my best map. If you lose it, come back and I will draw you another.', 'Lose my map? I will draw another.']] },
      { ask: ['How did you get here from Sable?', 'How did you get here?'],
        say: ['Under the Glasswall on my belly, the way you went. If a dragon fits, a Juniper fits.', 'Under the wall, on my belly. Like you.'] },
      { ask: ['What will you map next?', 'What will you map next?'],
        say: ['The moon. Somebody has to, and it has finally stopped moving about.', 'The moon. It has stopped moving!'], if: 'flag n_dawn' },
      { ask: ['Does Rook know where you are?', 'Does Rook know you are here?'],
        say: ["I wrote him three pages. He wrote back one line: \"Bring me a sand worm.\" No.", 'He wrote back: "Bring me a sand worm." No.'] },
      { idle: [['Hold still. I\'m drawing your horns.', 'Hold still.'], ['Mm? Talk. I can draw and listen.', 'Talk. I am drawing.']] },
      { bye: [["Don't fall off anything I haven't drawn yet.", "Don't fall off anything!"]] },
    ],

    // ---------------------------------------------------------------- Professor Quill (she) of the Observatory
    // Measures the sky; numbers are how she feels things ("I have never been so upset about a number", n_depart). Was at
    // the Eclipse Lens with Mom in Act IV. Writes to Gorran about rocks. After the game: her Observatory in Brindlecross.
    quill: [
      { if: 'said quill_watch flag n_dawn', once: true, fact: 'n5_moon=back',
        say: ['I watched you all the way up, a little orange dot. Then the top of the mountain lit up like a forge, and I dropped the telescope.',
          'I watched your light. Then the top lit up, and I dropped the telescope!'],
        re: [
          { t: ['Is the telescope all right?', 'Is the telescope okay?'],
            say: ["Cracked lens. Now every star I look at has a tiny seam across it. I'm keeping it.", 'It cracked. Every star has a seam now. I like it.'] },
          { t: ['How big was the light?', 'How big was the light?'],
            say: ['Bigger than my numbers go. I wrote "very" and drew a line under it.', 'Too big for numbers. I wrote "very".'] },
        ] },
      { if: 'flag n_dawn choice n_end=moth', fact: 'n5_moon=back',
        say: ['There is a small grey moth on the full moon. I have measured her. She is exactly the right size.', 'A little moth sits on the moon. Just the right size.'],
        re: [
          { t: ['Her name is Nyx.', 'Her name is Nyx.'], tone: 'kind',
            say: ["Nyx. I'll write it on the chart. She's the first moth I've ever put on a chart.", 'Nyx. She is the first moth on my chart.'] },
          { t: ["What's the right size?", 'What size is right?'],
            say: ['Small enough to sit on a lantern. I checked.', 'Small enough to sit on a lantern.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['I measured the moon this morning. All of it is back. I have never been so happy about a number.', 'The whole moon is back! Happy numbers!'],
        re: [
          { t: ["What's the number?", "What's the number?"],
            say: ["One. One whole moon. It's my favorite number now.", 'One. One whole moon.'] },
          { t: ['Will it shrink again?', 'Will it shrink again?'],
            say: ["A little, every month, and then it grows back. I'm going to measure it every single time.", 'A little. Then it grows back. I will measure it.'] },
        ] },
      { if: '!flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ["I measured the mountain twice. It's taller than it was an hour ago. I don't like that number.", 'I measured the mountain. It is getting taller.'],
        re: [
          { t: ["Maybe it's still growing.", 'Maybe it is growing.'],
            say: ["Mountains don't grow. They sit there and wear away. This one breaks every rule I have.", "Mountains don't grow. This one breaks the rules."] },
          { t: ['Will you watch me through the telescope?', 'Will you watch me?'], tone: 'kind', f: 0.5, then: ['said quill_watch'],
            say: ["Every step. You'll be a very small orange dot. I'll know which one.", 'Every step. You will be a little orange dot.'] },
        ] },
      { if: 'flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Every time I look through the telescope, the black glass seems to look back at me. I keep looking anyway.', 'The black glass looks back at me. I keep looking.'],
        re: [
          { t: ['What do you see up there?', 'What do you see?'],
            say: ['Four rings, one orange dot, and above it all something very big, folded up and waiting.', 'Four rings. Your light. And something big, waiting.'] },
          { t: ["Look away if it's scary.", 'Look away if it is scary.'], tone: 'kind',
            say: ["Then I'd miss it. Scientists don't look away. We just squeak a bit.", 'Then I would miss it. I squeak, but I look.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['I am counting stars instead of the moon. There are four hundred more than usual. Without the moon, they show off.', 'Without the moon, the stars show off.'],
          ['The moon saw every night that ever happened. If she ate it, she ate all of that too.', 'The moon saw every night. She ate them too.']] },
      { ask: ['Why do you measure the moon?', 'Why measure the moon?'],
        say: ["When I was seven, someone told me it was the same moon every night. I didn't believe them. I'm still checking.",
          'When I was seven, I did not believe it was the same moon. I still check.'] },
      { ask: ['Do you still write to Gorran?', 'Do you write to Gorran?'],
        say: ["Every week. He sends me rocks, I send him stars. Neither of us understands the other one's, and it's lovely.", 'He sends rocks. I send stars.'] },
      { idle: [['Mm? I was writing a number down. Go on.', 'Go on.'], ["One moment. ...There. Yes?", 'Yes?']] },
      { bye: [['Clear skies, Ash.', 'Clear skies!']] },
    ],

    // ---------------------------------------------------------------- Dell Fisk and the Soggy Biscuit Three
    // A lake fisherman who sailed to the end of the world. Cheerful, plain, a little soppy about boats. Cousin of Wendel.
    dell: [
      { if: 'said maren_visit !flag n_dawn', once: true, fact: 'n5_moon=gone',
        say: ["Your mom's been humming since you came back down. She never hums. Don't tell her I noticed.", 'Your mom is humming. She never hums! Shh.'],
        re: [
          { t: ["What's she humming?", "What's she humming?"],
            say: ["Something about a hen who wouldn't. I didn't ask.", 'Something about a hen. I did not ask.'] },
          { t: ["I won't tell her.", "I won't tell."],
            say: ['Good lad. She has a hammer.', 'Good. She has a hammer.'] },
        ] },
      { if: 'flag m_ship=glaciar', once: true,
        say: ["You flew to Moonfall on a dragon instead of my boat. I'm not upset. The Soggy Biscuit Three is upset.", 'You flew on a dragon. My boat is upset.'],
        re: [
          { t: ['Glaciar is very fast. Slowly.', 'Glaciar is fast. Slowly.'],
            say: ['Fast, slowly. My boat does that too. Mostly the slowly part.', 'My boat does that too. Mostly slowly.'] },
          { t: ['I can say sorry to the boat.', 'I can say sorry to the boat.'], tone: 'kind',
            say: ['Pat her on the side. There. She feels much better. So do I, oddly.', 'Pat her side. There. She feels better.'] },
        ] },
      { if: '!flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Engine is warm, lantern is lit. Wherever you need to go, the Soggy Biscuit Three goes too.', 'My boat will take you anywhere.'],
        re: [
          { t: ['Can she go up a mountain?', 'Can she go up a mountain?'],
            say: ['Not yet. Mags says give her a week and a lot of rope.', 'Not yet. Mags says: a week, and rope.'] },
          { t: ["Is that one of Wendel's sandwiches?", "Is that Wendel's sandwich?"], if: 'said dell_sandwich',
            say: ['It is. The fish have followed the boat all the way from Lake Mirrow for it.', 'It is! The fish followed us for it.'] },
          { t: ['Will you wait for me?', 'Will you wait for me?'], tone: 'kind',
            say: ["Right here, tied up, engine warm. I'm good at waiting. Ask any fish.", 'Right here. I am good at waiting.'] },
        ] },
      { if: 'flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Fish are not biting. Even the fish know something is wrong with the sky.', 'Even the fish know the sky is wrong.'],
        re: [
          { t: ['What do fish do without a moon?', 'What do fish do now?'],
            say: ['Same as me. Sit very still and look up.', 'Sit still and look up. Like me.'] },
          { t: ["I'll bring the moon back.", "I'll bring the moon back."], tone: 'brave',
            say: ["Then I'll catch you a fish to celebrate. A big one. Medium. A fish.", 'Then I will catch you a fish. A big one. Medium.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["Fish are biting again! The moon came back and the fish came with it. Best day's fishing of my life.", 'The fish are back!'],
        re: [
          { t: ['Are you sailing home now?', 'Are you going home now?'],
            say: ["Tomorrow. Today I'm fishing. I think I've earned one day of fishing.", 'Tomorrow. Today I fish.'] },
          { t: ['Catch one for Minnow.', 'Catch one for Minnow.'],
            say: ['I did. She wrote back and said throw it back, it looked homesick. So I did.', 'She said throw it back. It looked homesick.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['When you come down off that mountain, I\'ll be right here. The kettle\'s on. It\'s always on.', 'I will be right here.'],
          ["Your mom climbed a staircase made of moonlight. I stayed with the sandwiches. Somebody had to.", 'I stayed with the sandwiches.']] },
      { ask: ['How far is home from here?', 'How far is home?'],
        say: ['Eleven days by boat. Less by dragon, if you don\'t mind ice in your ears.', 'Eleven days by boat. Less by dragon.'] },
      { ask: ['Does Minnow know you came all this way?', 'Does Minnow know?'],
        say: ["She wrote: \"Bring me a moon fish.\" I don't know what that is. I'm going to find one.", 'She wants a moon fish. I will find one.'] },
      { idle: [['Plenty of time on a pier. Ask away.', 'Ask away.'], ["Lines are in. What's up?", "What's up?"]] },
      { bye: [['Tight lines, Ash. Come back down.', 'Tight lines!']] },
    ],

    // ---------------------------------------------------------------- Tikka, Act I's kobold baker, Dell's ship's cook
    // (tk_come=yes). A small kobold with very big feelings about buns. Her brother is Tock. x3_people gives her lumpy bun
    // first; after the game she is in Gilly's Floating Kitchen at Driftwood Landing.
    ev_tikka: [
      { if: '!flag n_depart',
        say: ["I made a bun for the mountain. It's lumpy. The mountain doesn't deserve it.", 'I made a lumpy bun for the mountain.'],
        re: [
          { t: ['Is it for me or the mountain?', 'For me or the mountain?'],
            say: ['For you. If the mountain is nice to you, you can share.', 'For you. Share if the mountain is nice.'] },
          { t: ['Is Tock coming up too?', 'Is Tock coming?'],
            say: ['Tock says mountains are for goats. I said then you are a goat. He said thank you.', 'Tock says mountains are for goats.'] },
        ] },
      { if: 'flag n_depart !flag n_dawn',
        say: ['Captain Dell let me steer once. We went in a circle. A very brave circle.', 'I steered the boat. In a brave circle.'],
        re: [
          { t: ['Circles count.', 'Circles count.'],
            say: ['That is what I said! Captain Dell said not on a boat.', 'I said that! Dell said not on a boat.'] },
          { t: ['Does Gilly like your buns?', 'Does Gilly like your buns?'],
            say: ['Gilly put a fish in one. We are not speaking. We speak all day.', 'Gilly put a fish in one. We are not speaking.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['I made moon buns! Round, with a seam of icing in the middle. Gilly says they need fish. They do not need fish.', 'Moon buns! No fish!'],
        re: [
          { t: ['Can I have the lumpiest one?', 'Can I have the lumpy one?'],
            say: ['That one is for Tock. He likes them lumpy. You can have the second lumpiest.', 'That is for Tock. You get the next one.'] },
          { t: ['Are you sailing home with Dell?', 'Are you going home with Dell?'],
            say: ["Yes! I'm the ship's cook. It is a very important job. Mostly I hold the spoon.", "Yes! I'm the cook. I hold the spoon."] },
        ] },
      { ask: ['What is the bigger spoon for?', 'What is the big spoon for?'],
        say: ["For a bigger pot. Tock says it's a ladle. It is a bigger spoon.", 'For a bigger pot. It is not a ladle.'] },
      { idle: [['Hello! Are you hungry? You look hungry.', 'Are you hungry?'], ['I have flour on my nose. Leave it. What?', 'What?']] },
      { bye: [['Bye! Lumpy means good luck!', 'Bye! Good luck!']] },
    ],

    // ======================================================================= map 0, Embermere (Act I's people)
    yara: [
      { if: 'choice ending=lantern', once: true,
        say: ['You lit a lantern for your grandfather, once. I have told that story at the well every night since.', 'I still tell how you lit a lantern for Grandpa.'] },
      { if: 'choice ending=warden', once: true,
        say: ['The Sixth Warden. I still curtsy when you go past. My knees complain about it.', 'I still curtsy to the Sixth Warden.'] },
      { if: 'clue n5_fourth_post !clue n5_yara_post', option: ['Were there always three lantern posts on the green?', 'Were there always three posts?'],
        then: ['clue n5_yara_post', 'heart_ember n5_yara'],
        say: [['yara', 'Three? No, dear. There were four posts when I was a girl. Nobody remembered why. The fourth one rotted, and nobody put it back.',
            'There were four posts when I was a girl!'],
          ['yara', 'When they dug out the old stump, they found this in the hole. It has been warm as toast for sixty years. I think it was waiting for you.',
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
          ['Your mother lit every lantern on the green before she sailed. "Light one more than you need," as Iska says.', 'Light one more than you need.']] },
      { bark: true, if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['No moon again tonight. Mind the well.', 'No moon. Mind the well.'] },
    ],

    hollis: [
      { if: 'quest q_n5_follower active !clue n5_hollis_note !flag n_dawn', fact: 'n5_duchess_pen=empty',
        say: ["Duchess? Pen's been empty for days. Gate's open. I didn't open it.", "Duchess's pen is empty. I didn't open it."] },
      { if: 'flag n_dawn solved n5_who_follows', fact: 'n5_moon=back',
        say: ['She came home this morning with frost in her beard and moon-dust on her hooves, and walked straight past me to her hay.', 'Duchess came home with moon-dust on her hooves!'] },
      { if: '!flag n_dawn', fact: 'n5_duchess_pen=empty',
        say: [["Long Night or not, the goat wants feeding. If I could find her.", 'The goat wants feeding. She is off somewhere.'],
          ["Pen's empty again. She'll turn up. She always does, somewhere ridiculous.", 'She always turns up somewhere silly.']] },
      { say: ['Love a goat all you like, Ash. Just never trust one.', 'Love goats. Never trust them.'] },
    ],

    mabel: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [["The moonlilies won't open without a moon. I talk to them every morning, and they stay shut.", 'Moonlilies sulk without a moon.'],
          ['Gran sent word from the Mirefen: the frogs have stopped singing. She has never known that in all her years.', 'Gran says the frogs stopped singing.']] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['Every moonlily in the valley opened at once this morning. It sounded like a sigh.', 'Every moonlily opened at once!'] },
    ],

    rook: [
      { if: 'choice cinder=ally', once: true,
        say: ['Is Sir Cindervane going up the mountain with you? A REAL knight? Can I hold his helmet? Can I BE his helmet?', 'Is the real knight going with you?'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [["I'm staying up ALL night to watch for you. Mum says it's already all night. That's not the point.", 'I am staying up all night for you!'],
          ['When I grow up I am going to be a dragon. A dragon who climbs a night mountain. Like you.', 'I want to climb a night mountain too.']] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['You did it! I saw the moon come back! I was awake! Mostly!', 'You did it! I saw the moon!'] },
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
        say: ['Moo-rgaret will not come in from the field. She stands in the same spot all night, mooing at the sky.', 'My cow is waiting for the moon.'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['The moon came back and Moo-rgaret came in. She acted like it was her idea.', 'The moon is back. So is my cow.'] },
    ],

    pell: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Lanterns! Get your lanterns! Half price during the Long Night! Full price after. That is just business, little dragon.',
          'Lanterns! Half price in the Long Night!'] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: ['Lanterns, full price again! No? A moon-shaped cookie cutter, then. Lucky, they say.', 'Moon cookie cutters! Lucky!'] },
    ],

    minnow: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Dad says you are climbing a mountain made of night. Is it cold? Is it sticky?', 'Is the night mountain sticky?'] },
      { if: 'flag n_dawn', say: ['You are back! Was it sticky? I bet it was sticky.', 'Was it sticky? I bet it was.'] },
    ],

    mayor: [
      { if: 'choice morrow=jail', once: true,
        say: ['Morrow sends his regards from the Watch House. Captain Osric lets him grow potatoes in the yard.', 'Morrow grows potatoes at the Watch House.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have declared the Long Night officially over. Nobody has told the sky. I am sending a strongly worded letter.', 'I told the sky the night is over. It did not listen.'] },
      { if: 'flag n_dawn', say: ['There will be a parade for you, Ash, with ribbons. It is just Lantern Day with more cake, but it is official.', 'A parade for you! With cake!'] },
    ],

    nib: [
      { if: '!flag n_dawn',
        say: ['I drew a map of the Night Mother\'s mountain! It is a triangle with a moth on it. One coin.', 'A map of the night mountain! One coin.'] },
      { if: 'flag n_dawn', say: ["New map! The mountain, with a happy moon on top. Two coins. There's a cat on this one too.", 'New map! Two coins.'] },
    ],

    gorran: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['My lads are sitting up with every lamp in Coppergulch lit, for you. Your mother would have my ears if we let them go out.', 'Every lamp in Coppergulch is lit for you.'] },
      { if: 'flag n_dawn', say: ['Word came down the road that you did it. I told the lads, "That\'s Maren\'s kid." Then I had to sit down for a bit.', "You did it! That's Maren's kid!"] },
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
      { if: 'flag n_dawn', say: ['I finished your song. Fourteen verses, and the last one rhymes "moon" with "soon". I\'m keeping it.', 'I finished your song! Fourteen verses.'] },
    ],

    moss: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Moonlilies sleep when the moon does, love. All of them. Even the mean ones by the bog.', 'The moonlilies all sleep now.'] },
      { if: 'flag n_dawn', say: ['The frogs are singing again, every one of them out of tune. I never heard anything so lovely.', 'The frogs sing again!'] },
    ],

    morrow: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["I listened to a voice in my dreams once, and it ended badly. I'm listening to you now. That feels different.", 'I listened to a dream voice once. Now I listen to you.'] },
      { if: 'flag n_dawn', say: ["I keep my hands in the dirt these days. Dirt doesn't care about moons or dragons. It's very restful.", 'I dig in the dirt now. Very restful.'] },
    ],

    ulf: [
      { if: 'quest q_n5_follower active !solved n5_who_follows',
        say: ['My brother says his goat has gone walkabout again. You never hear that about a sheep.', 'Sheep never wander off.'] },
      { say: ['Goats climb anything, you know. Anything. Sheep stay on the ground where they belong.', 'Goats climb anything. Sheep do not.'] },
    ],

    bertram: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['I baked a loaf shaped like the moon, so the village has one to look at.', 'I baked a moon-shaped loaf.'] },
      { if: 'flag n_dawn', say: ['Moon buns! With a little seam of icing round the middle, like the real one.', 'Moon buns, with icing seams!'] },
    ],

    fennick: [
      { if: 'choice fennick=forgive !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Every lantern in Emberhollow is lit, Ash. Every night, like I promised. Tonight they are all lit for you.', 'Every lantern is lit. All for you.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Lamp oil is selling fast. Everybody wants a light in the window.', 'Everyone wants a light in the window.'] },
      { if: 'flag n_dawn', say: ['I kept a lamp in my window all night anyway. I think I always will.', 'I kept my lamp lit anyway.'] },
    ],

    wren: [
      { if: 'quest m_leash active item m_book_raw',
        say: ['Is that the Book of Moths? Oh, give it here, give it here. Carefully!', 'Is that the Book of Moths? Give it here!'] },
      { if: 'quest q_n5_hush active !flag m_leash_known',
        say: ['Moon-silk? The moon-priests of Lumen wrote about it. Their books are in the Drowned Library, under the sea, in Moonfall.',
          'The moon-priests wrote about moon-silk. Their books are in Moonfall.'] },
      { if: 'flag m_page11', once: true,
        say: ["I have two page elevens now. One is framed. The other sleeps under my pillow, but don't tell anyone.", 'I sleep with page eleven. Shh.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have read every book about the moon. Not one says what to do when somebody eats it. I am writing that one myself.',
          'No book says what to do. I am writing one.'] },
      { if: 'flag n_dawn', say: ['Chapter one of my book: "I was seasick." The last chapter: "Ash came home." It is a long book.', 'My book ends: "Ash came home."'] },
    ],

    tilly: [
      { if: '!flag n_dawn', say: ["The Sleepy Salmon has a bed for you whenever you need it, and there's soup on, with Bertram's bread.", 'A bed for you, any time.'] },
      { if: 'flag n_dawn', say: ['Free soup for the dragon who brought the moon home! Do not tell Pell.', 'Free soup for you! Shh.'] },
    ],

    osric: [
      { if: 'choice fennick=jail', once: true,
        say: ['My prisoner has polished every lamp in the Watch House twice. They have never been so shiny. I may keep him.', 'My prisoner polishes the lamps.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ["The Watch is on duty all night. That's me and the two dogs, and none of us has blinked.", 'The Watch is awake. Me and two old dogs.'] },
      { if: 'flag n_dawn', say: ['The dogs howled when the moon came back. So did I. Do not put that in a song.', 'The dogs howled. So did I. Shh.'] },
    ],

    marigold: [
      { if: '!flag n_dawn', say: ['A hat for the mountain? Black, with a brim, so no moth lands on your horns. No? Your loss.', 'A hat for the mountain? No? Your loss.'] },
      { if: 'flag n_dawn', say: ["Everyone wants a moon hat now. I can't stitch them fast enough.", 'Everyone wants a moon hat now.'] },
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
        say: ["She's coming home for tea after. You said so, duck, and I believe you.", 'She will come home for tea!'] },
      { if: 'flag n_dawn quest q_n5_oona done',
        say: ['She came home for tea, duck. Ate eleven biscuits and wore the scarf the whole time.', 'She came home! Eleven biscuits!'] },
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
      { if: 'flag n_dawn', say: ['The moon rose at seven minutes past eleven. I wrote it down, and then I had to sit down.', 'The moon rose. I wrote down the time.'] },
    ],

    c_hettie: [
      { if: 'quest c_bolt done !flag n_dawn',
        say: ['Bolt keeps barking at the sky. He can smell that something is missing up there.', 'Bolt barks at the sky. Something is missing.'] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I am building a moon. Out of brass. It will not be the same. It will be louder.', 'I am building a brass moon. A loud one.'] },
      { if: 'flag n_dawn', say: ['The real moon is back, so my brass moon is a lamp now. A very loud lamp.', 'My brass moon is a loud lamp now.'] },
    ],

    c_ottoline: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The Turning Library has two hundred books about the moon. Every one is suddenly out of date. Shhh.', 'All our moon books are out of date. Shhh.'] },
      { if: 'flag n_dawn', say: ["Two hundred new pages to write, and every one of them good news. Shhh. I'm whispering, I'm whispering.", 'So many new pages! Shhh.'] },
    ],

    c_whirligig: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['No moon! Do you know what that does to the price of moon-dials? Nothing. They were already worthless. Hmph.', 'No moon! My moon-dials are worthless.'] },
      { if: 'flag n_dawn', say: ['The moon is back and my moon-dials WORK. I am selling them for double. Hmph.', 'My moon-dials work again! Double price.'] },
    ],

    c_mo: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The tide is all muddled without the moon. Even the crabs are walking in circles.', 'The tide is muddled without the moon.'] },
      { if: 'flag n_dawn', say: ['Tide came in right on time this morning. I hugged a crab. Do not tell Pinch.', 'The tide is on time! I hugged a crab.'] },
    ],

    c_ingrid: [
      { say: ['Hammer, hammer, DING! A horseshoe, for luck. No horse? JA, the luck works anyway!', 'I am making you a lucky horseshoe.'] },
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
      { if: '!flag n_dawn', say: ['HEADLINE: DRAGON CLIMBS MOUNTAIN OF NIGHT. SUBHEADLINE: PENNY PRESS WAS RIGHT ALL ALONG.', 'HEADLINE: DRAGON CLIMBS NIGHT MOUNTAIN!'] },
      { if: 'flag n_dawn', say: ['HEADLINE: MOON BACK. DRAGON BACK. PENNY PRESS EXTREMELY BACK.', 'HEADLINE: MOON BACK!'] },
    ],

    c_ravel: [
      { say: ["A draught for courage? I used to brew it from moonlight. With no moon, it's mostly lemon.", 'A courage draught. Mostly lemon now.'] },
    ],

    c_jo: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Night sailing every night now. There is no other kind. I have only hit two seals.', 'Night sailing every night! Only two seals.'] },
      { if: 'flag n_dawn', say: ["DAY sailing! I forgot what the sea looks like in the daytime. It's so blue!", 'Day sailing! The sea is so blue!'] },
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
      { say: ['Duchess the Second has gone off her grass. She just stands there staring at the mountain.', 'My sheep keeps staring at the mountain.'] },
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
      { if: 'quest f_sled done !flag n_dawn', say: ['Faster than a wolf, Ash! That is how you climb a mountain!', 'Faster than a wolf, Ash!'] },
      { if: '!flag n_dawn', say: ['When you are done, I am sledding down the Night Mother\'s mountain. Dad says no. Dad is not the boss of mountains.',
          'I want to sled down the night mountain!'] },
      { if: 'flag n_dawn', say: ['Dad still says no about the mountain. I am asking again tomorrow.', 'Dad still says no. I will ask again.'] },
    ],

    f_hask: [
      { say: ['Hrm. Pup. A mountain made of night, eh. Wear a hat.', 'Hrm. Pup. Wear a hat.'] },
    ],

    f_pennant: [
      { if: '!flag n_dawn', say: ['The wind is blowing the wrong way. Toward the mountain. It wants to watch. Wheee. Sorry.', 'The wind blows toward the mountain. Wheee.'] },
      { if: 'flag n_dawn', say: ['The wind is blowing home again. Wheee! ...It just comes out.', 'The wind blows home. Wheee.'] },
    ],

    f_toastwhistle: [
      { if: '!flag n_dawn', say: ['Everything is fine! The Hearth is fine! The moon is... not fine. I am fine! Why is my voice so high?', 'Everything is fine! Except the moon!'] },
      { if: 'flag n_dawn', say: ['Everything is actually fine! My voice is still high. That is just how it is now.', 'Everything is really fine now!'] },
    ],

    f_gunnhild: [
      { say: ['My forge burns all night now. If you come back with a dented sword, I will be ready.', 'My forge is ready for your sword.'] },
    ],

    f_mags: [
      { say: ['I built a lantern that never goes out! It went out. I am building another one.', 'My lantern went out. Building another.'] },
    ],

    f_hilde: [
      { say: ['Beds at the Warm Mitten, any time. Biscuit the cat will sit on your feet for free.', 'A bed any time. The cat sits on you.'] },
    ],

    f_eider: [
      { if: 'flag f_page11', once: true,
        say: ['Wren wrote to me about the eleventh page. Four pages about one page. I read it twice.', 'Wren wrote me four pages about one page.'] },
      { say: ['Shh. Sorry. Not you. The books. They are nervous about the moon.', 'Shh. The books are nervous.'] },
    ],

    // ======================================================================= map 3, Moonfall (Act IV's people) and the Moon Pier
    m_ripple: [
      { if: 'quest m_leash active !flag m_vault_open',
        say: ['The priests\' Book of Moths! It lies in the vault of the Drowned Library, sealed with moon-wax. Only Moonfire melts it.',
          'The Book of Moths is in the Drowned Library. Melt the vault with Moonfire.'] },
      { if: 'quest q_n5_hush active flag m_leash_known',
        say: ['Gently, dragon. Moon-silk listens to soft breath. Like blowing on soup.', 'Gently. Like blowing on soup.'] },
      { if: '!flag n_dawn', say: ['The tide has not moved in days. The whole sea is holding its breath, dragon.', 'The whole sea holds its breath.'] },
      { if: 'flag n_dawn', say: ['The tide came back this morning, and every fish in Coralcombe is swimming in circles. It is wonderful, dragon.', 'The tide is back! The fish swim in circles!'] },
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
      { say: ['This knot means "good luck". This one means "come back". I tied them both round the pier post, so you can find your way home.',
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
        say: ['The moths are gone. Every last one. Flew up the mountain. I hate moths. I miss them a bit.', 'The moths all flew away. I miss them a bit.'] },
      { if: 'flag n_dawn', say: ['One little grey moth came back to my lamp last night. Just one. I let her stay.', 'One little moth came back. I let her stay.'] },
    ],

    m_saffron: [
      { say: ['Do not touch the well. It is very tired. It has seen a lot this week.', 'Do not touch the well. It is tired.'] },
    ],

    m_kiln: [
      { say: ['I made you a glass lantern for the mountain. It came out shaped like a shoe. The glass had other ideas.', 'I made you a shoe-shaped lantern.'] },
    ],

    m_esme: [
      { if: '!flag n_dawn', say: ['All twelve lamps of Sable are lit for you tonight. Bertha is burning extra bright. She likes you.', 'All twelve lamps are lit for you.'] },
      { if: 'flag n_dawn', say: ['We blew the lamps out at sunrise. Bertha sulked. She likes being needed.', 'Bertha the lamp sulked at sunrise.'] },
    ],

    m_dusty: [
      { say: ['Dusty: We are going to surf down the night mountain! Dune: On trays! Dusty: Borrowed trays!', 'We will surf the mountain on trays!'] },
    ],

    m_rafi: [
      { say: ['Three hundred years we crossed the Glass Desert by moonlight. Now we sit by the wagons and wait for it to come back.', 'We wait for the moon to come back.'] },
    ],

    m_coralia: [
      { say: ['We expected a dragon for a very long time. We are glad it was you. Even if you are small.', 'We are glad the dragon was you.'] },
    ],

    m_kelp: [
      { say: ['Pearls for your pockets, little dragon. For the mountain. They still do not do anything. They are still lovely.', 'Pearls for your pockets. Still lovely.'] },
    ],

    m_rocket: [
      { say: ['I swam to the top of the sea to look at the mountain! It is very tall. I am very fast.', 'I swam up to see the mountain!'] },
    ],

    m_kipper: [
      { say: ["Who swims there? Oh, it's the hero. Carry on, then, and be careful up on that mountain.", 'Oh, the hero. Carry on. Be careful.'] },
    ],
  },
})
