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
//  - The Crown Shrine's "Who is with me?" (n5_crown_who, scene n5_who) is a place. The friends on the peak are drawn by
//    x4_story's ally runtime, not people; since v12 (PEAK) its "Talk to <name>" prompt opens their talk here, by person
//    id (c_vesper, f_glaciar, f_hush, greymane, ev_tikka, pip, and goat for Duchess on the summit after the dawn), with
//    lines that need `near n5_peak 6500`. An Act I companion walking with Ash (Juniper, Brisket) talks the same way.
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
    // (v12 PEAK) the whole peak, for talk on it (`near n5_peak 6500`): the Bridgefoot, the four rings and the summit
    n5_peak: { map: 4, kind: 'spot', at: [4500, 85200], r: 6500, name: ['Nightfall Peak', 'the peak'] },
    // (v12 PEAK) after the game, on Lantern Day: where x4_story stands Vesper (at the forge, Mom: "She's in the forge,
    // trying out my tongs") and Glaciar (asleep behind it, n_end's n_home)
    n5_vesper_forge: { map: 0, kind: 'npc_spot', at: [2372, 9606], name: ['the forge', 'the forge'] },
    n5_glee_nap: { map: 0, kind: 'npc_spot', at: [2236, 9392], name: ['behind the forge', 'behind the forge'] },
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
      // (v12 R4) Ash names who came instead of counting: no "two of the three", nothing that says where a line is drawn
      { if: 'trust friends>=3', then: [['ash', 'Everyone she hurt is standing right here with me.', 'Everyone is here.']],
        else: [{ if: 'trust friends>=2', then: [
          { if: 'flag n5_vesper flag n5_glaciar', then: [['ash', "Vesper's here. Auntie's here. That's a start.", 'Vesper and Auntie are here.']],
            else: [{ if: 'flag n5_vesper', then: [['ash', "Vesper's here. Hush is here. That's a start.", 'Vesper and Hush are here.']],
              else: [['ash', "Auntie's here. Hush is here. That's a start.", 'Auntie and Hush are here.']] }] }],
          else: [{ if: 'trust friends>=1', then: [['ash', "I've only got one of them with me. I want the others too.", 'One friend is here.']],
            else: [['ash', "Nobody she hurt is up here with me. Not yet.", 'Nobody is here yet.']] }] }] },
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
    // Vesper (m_vesper_ally, until she joins Ash on the peak: n_vline), Tikka (tk_come=yes) and Dell (m_landed) on the
    // pier, and steps aside for this data (m3pDataTalk). After the game is won Mom is home at the forge, Vesper with her
    // (x4_story, place n5_vesper_forge), Quill at the Observatory, Juniper at home in Emberhollow, Dell and Tikka at
    // Driftwood Landing.

    // ---------------------------------------------------------------- Mom (Maren)
    // Voice sheet: a smith. Short, practical, warm, teasing. Worry comes out as instructions, love as hugs and work. Never
    // "I'm proud of you", never speeches. Her one "Eat something" in Act V is in n_bridge's note, so none here.
    maren: [
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
      // after the dawn: an ice dragon behind the forge (Glaciar flew everyone home, or came to Lantern Day)
      { if: { all: ['flag n_dawn', { any: ['flag n5_glaciar', 'choice f_glaciar=free'] }] }, fact: 'n5_moon=back',
        say: ["There's an ice dragon snoring behind my forge. Every bucket of milk in the village has frozen solid.",
          'An ice dragon snores behind my forge. The milk froze!'],
        re: [
          { t: ["That's Auntie Glee. She'll wake up hungry.", 'She will wake up hungry.'],
            say: ["Then she can have the frozen milk. It's hers, really.", 'Then she can have the frozen milk.'] },
          { t: ['Free ice cream for the whole village!', 'Free ice cream for everyone!'],
            say: ["That's the worst joke you've made all year. Let her sleep. She says she's slept through too much already. This is the good kind.", 'Worst joke all year. Let her sleep. This is the good kind.'] },
          { t: ['Can she stay for Lantern Day?', 'Can she stay?'], tone: 'kind', f: 0.5,
            say: ["She's family. Family doesn't have to ask.", 'She is family. She does not have to ask.'] },
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
          { t: ['Is the window lantern still lit?', 'Is the window lantern lit?'], if: 'said mom_window', tone: 'kind',
            say: ["Hal is minding it till I'm home. He's put a second one next to it, for luck.", 'Hal minds it. He lit a second one.'] },
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
          ["Dell keeps telling me fish jokes to cheer me up. I'm watching the bridge. He's still telling them.", 'Dell tells fish jokes. I watch the bridge.']] },
      { if: 'flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: [["Did you eat that sandwich yet? Don't make me come up there.", 'Did you eat the sandwich?'],
          ["I'll be right here at the end of the bridge, with my hammer, in case.", 'I will wait here. With a hammer.']] },
      // the fourth lantern post (her clue for n5_fourth_lantern; the place n5_mom_ask at her feet plays the same scene)
      { if: 'flag n_dawn', say: [["Mm. Hold still. I'm looking at you. That's all.", "Hold still. I am just looking."], ["The forge is lit and you are home. That will do for today.", "The forge is lit. You are home."]] },
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
      { ask: ['Did Rowan give you a knot?', 'Did Rowan give you a knot?'], if: 'said rowan_mom',
        say: ["This one? It came home in my apron pocket. I can't undo it, and I'm not going to try.", 'It came home in my pocket. I will not undo it.'] },
      { ask: ['Will you teach me to mend things?', 'Will you teach me to mend?'], if: 'flag n_dawn',
        say: ["Tomorrow. Bring your own apron. You're not borrowing mine again.", 'Tomorrow. Bring your own apron.'] },
      { ask: ['Is Auntie Glee staying?', 'Is Auntie Glee staying?'], if: { all: ['flag n_dawn', 'said mom_glee', { any: ['flag n5_glaciar', 'choice f_glaciar=free'] }] },
        say: ["You told me her name in your letter, and I've said it all week. Glee. Auntie Glee. She can stay as long as she likes. The milk can't.",
          'Auntie Glee can stay as long as she likes.'] },
      { ask: ['Is Vesper staying for Lantern Day?', 'Is Vesper staying?'], if: { all: ['flag n_dawn', { any: ['flag n5_vesper', 'choice c_vesper=friend'] }] },
        say: ["She's in the forge, trying out my tongs. I've told her she can hang that mask by the door.", 'She is in the forge. Her mask can hang by the door.'] },
      { if: 'flag n_dawn', idle: [["Mm? Pass me the tongs. It's good to say that again.", 'Pass me the tongs.'], ['Go on. I can hammer and listen.', 'Go on. I am listening.']] },
      { idle: [["Mm? I'm watching the bridge. Go on.", 'I am watching. Go on.'], ['Go on. My hands are busy, not my ears.', 'Go on. I am listening.']] },
      { if: 'flag n_dawn', bye: [["Back before dark. ...I get to say that again.", 'Back before dark!']] },
      { bye: [['Scarf on. Go.', 'Scarf on. Go.'], ["Go on. I'm right here.", 'Go on. I am here.']] },
      { bark: true, if: '!flag n_dawn', say: ['Keep your scarf on up there, Ash!', 'Keep your scarf on!'] },
    ],

    // ---------------------------------------------------------------- Vesper: the pier, the peak, the forge
    // Voice sheet: quick, proud, funny when cornered, tender only about Gran. Climber's words. Teases instead of
    // thanking. "cousin", never "little ember". Act IV: the smoke job, the stolen moth knight's helmet, the Moon Well
    // where she told the Mother to keep her fire, and "Not alone, cousin." on this pier. On the peak she comes in at the
    // Silk Gallery (n_clocks, flag n_vline; on the foe path only if Ash pulled her up, flag n5_vesper) and leaves the
    // pier then (x3_people); she climbs with Ash to the Long Climb (n_rime), goes up her own way and waits at the Crown
    // Shrine (flag n_gather). A Vesper Ash left hanging comes back through q_n5_vesper, at the Crown only. After the
    // game she is at the forge in Emberhollow on Lantern Day (flag n_home).
    c_vesper: [
      // ---- (v12 PEAK) at the Crown, after the four fears: her quiet head, the offer she will hear again, Gran's fish
      { if: 'near n5_peak 6500 flag n_gather',
        say: ["She's stopped talking to me. In my head, I mean. Not one word since the Mask Hall. It's so quiet I can hear my own boots.",
          "She stopped talking in my head. It's so quiet now."],
        re: [
          { t: ['Is that good?', 'Is that good?'],
            say: ["It's good. It's just big, like a room after somebody takes all the furniture away.", "It's good. Just big, like an empty room."] },
          { t: ["She's saving her voice for me.", "She's saving it for me."], tone: 'brave',
            say: ["Then don't let her have the last word. I didn't.", "Then don't let her win. I didn't."] },
        ] },
      { if: 'near n5_peak 6500 flag n_gather choice c_vesper=friend',
        say: ["In there she'll offer me fire again, like she did at the Well. She'll say it nicer this time.", 'She will offer me fire again. Nicer, this time.'],
        re: [
          { t: ['You told her to keep it.', 'You told her to keep it.'], tone: 'kind', f: 0.5,
            say: ['I did. Out loud, off a tent roof, in front of you. I would say it again.', 'I did. Out loud. I would say it again.'] },
          { t: ['What if she means it this time?', 'What if she means it?'],
            say: ["Then she means it. I still don't want fire from her. Or from anybody.", "Then she means it. I still don't want it."] },
          // (what Ash did at the Well, Act IV: m4_well stood or lid)
          { t: ['Did you see me at the Well?', 'Did you see me at the Well?'], if: 'flag m4_well',
            say: [['c_vesper', 'Wings out, at the Night Mother, on the edge of a well. Very brave. Very silly.', 'Wings out at her. Brave. And silly.', { if: 'flag m4_well=stood' }],
              ['c_vesper', 'You and Saffron, dragging a lid while she watched. I would have stolen the lid.', 'I would have stolen the lid.', { if: '!flag m4_well=stood' }]] },
        ] },
      { if: 'near n5_peak 6500 flag n_gather',
        say: ["After this I'm catching Gran a fish. The biggest one in Saltmarsh. She loves fish.", 'After this I will catch Gran a big fish. She loves fish.'],
        re: [
          { t: ['She would like a visit more.', 'She would like a visit more.'], tone: 'kind',
            say: ["A visit AND a fish. I'm not an amateur.", 'A visit AND a fish.'] },
          { t: ['Maybe not a fish.', 'Maybe not a fish.'], if: 'said oona_fish',
            next: { say: ['Why not? She eats every one I leave her. ...Cousin. What do you know?', 'Why not? She eats them. What do you know?'],
              re: [
                { t: ['She eats every single one.', 'She eats every one.'],
                  say: ['Good. The biggest fish in Saltmarsh, then. With a bow on.', 'Good. The biggest fish, then.'] },
                { t: ['Ask her yourself.', 'Ask her yourself.'], then: ['said vesper_fish'],
                  say: ["...I'm going to. And I'm bringing the fish, just in case.", 'I will. With the fish, in case.'] },
              ] } },
          { t: ['Can I help you catch it?', 'Can I help catch it?'],
            say: ['You would cook it by breathing on it. You can carry the bucket.', 'You would cook it! You carry the bucket.'] },
        ] },
      // ---- (v12 PEAK) on the second ring, just joined: the copy of her ahead (friend path), or the pull-up (foe path)
      { if: 'near n5_peak 6500 !flag n_gather stage=n_clocks choice c_vesper=friend',
        say: ["There's a copy of me up ahead. On the highest roof, I bet, sulking. That's what I'd do.", 'A copy of me waits ahead. Sulking on a roof.'],
        re: [
          { t: ["It isn't you any more.", "It isn't you now."], tone: 'kind', f: 0.5,
            say: ["No. It's me with a grudge and a mask. I was a lot of work.", 'No. It is me with a grudge. I was a lot of work.'] },
          { t: ['Do you want to fight it?', 'Do you want to fight it?'],
            say: ['I want to knock it off its roof. Then it can sulk on the ground like everybody else.', 'I want to knock it off its roof.'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather stage=n_clocks flag n5_vesper !choice c_vesper=friend',
        say: ["You pulled me up. After the Spire, after all of it. I don't know what to do with that.", "You pulled me up. After everything. I don't know what to do."],
        re: [
          { t: ["You don't have to do anything.", "You don't have to do anything."], tone: 'kind', f: 0.75,
            say: ["Good. I've never owed anybody anything. It itches.", 'Good. I never owe anyone. It itches.'] },
          { t: ['You can climb ahead of me.', 'You can go first.'],
            say: ['I was going to anyway. Roofs are easier than saying thank you.', 'I was going to. Roofs are easier than thanks.'] },
          { t: ["Gran's letter said come home.", "Gran's letter said come home."], if: 'flag n5_vletter',
            say: ["I've read it nine times. It keeps saying the same thing.", 'I read it nine times. It says the same thing.'] },
        ] },
      // ---- (v12 PEAK) on the third ring, after her echo and Gran's memory in the Mask Hall
      { if: 'near n5_peak 6500 !flag n_gather stage=n_rime',
        say: ["That was Gran's voice in there. The moon kept it. Of everything it could have kept.", "The moon kept Gran's voice. Of all things."],
        re: [
          { t: ['It kept the warm part.', 'It kept the warm part.'], tone: 'kind',
            say: ['Hands first, then the kettle. That is the right order.', 'Hands first. Then the kettle.'] },
          { t: ['Did she say it every night?', 'Every night?'],
            say: ["Every night. Even when I'd slammed the door. Especially then.", 'Every night. Even when I slammed the door.'] },
          { t: ['I told her people keep me warm.', 'I told her people keep me warm.'], if: 'said oona_people',
            say: ["That's Pearl's answer. She'll have told the whole jetty you said it.", "Pearl's answer! She will tell everyone."] },
        ] },
      // ---- (v12 PEAK) on the peak once those are answered, and what she says over the menu there
      { if: 'near n5_peak 6500', say: ["Go on, cousin. I've got the roofs. You've got the stairs.", 'I have the roofs. You have the stairs.'] },
      { ask: ['How do you climb glass?', 'How do you climb glass?'], if: 'near n5_peak 6500',
        say: ['Claws, chalk, and never looking down. The never looking down is the hard part.', 'Claws. And never looking down.'] },
      { if: 'near n5_peak 6500', idle: [["Mm? I'm watching the edges.", 'Mm?'], ['Go on, cousin. I can climb and listen.', 'Go on, cousin.']] },
      { if: 'near n5_peak 6500', bye: [['See you on the next roof.', 'See you up there.']] },
      // ---- (v12 PEAK) after the game, at the forge on Lantern Day (x4_story stands her there, place n5_vesper_forge)
      { if: 'flag n_home !near n5_peak 6500',
        say: ['Your mom let me hold her tongs. Nobody has ever trusted me with anything hot.', 'Your mom let me hold her tongs!'],
        re: [
          { t: ['You held my hands in the dark.', 'You held my hands in the dark.'], tone: 'kind', f: 0.75,
            say: ["Don't make it a thing, cousin. ...It was a bit of a thing.", "Don't make it a thing. It was a bit of a thing."] },
          { t: ['Will you light a lantern from the forge?', 'A lantern from the forge?'],
            say: ["One a year, with the tongs. Your mom watches me like I'm going to steal the fire.", 'One a year. Your mom watches me close.'] },
          { t: ['Did you ask Gran about the fish?', 'Did you ask about the fish?'], if: 'said vesper_fish',
            say: ['She laughed so hard the kettle boiled over. Twenty years of fish, cousin, and she never said a word.', 'She laughed and laughed. Twenty years of fish!'] },
        ] },
      { if: 'flag n_home !near n5_peak 6500',
        say: ["Gran wants you for tea on Sunday. She's bought a second cup already, so you can't say no.", 'Gran wants you for tea on Sunday.'],
        re: [
          { t: ['Will it be strong tea?', 'Strong tea?'],
            say: ['Strong enough to stand a spoon in. Drink all of it. She watches.', 'Very strong. Drink it all. She watches.'] },
          { t: ['Can Pip come to tea too?', 'Can Pip come too?'], if: 'flag pip',
            say: ["She'll feed him every fish in the house. He'll love her forever.", 'She will give him all her fish.'] },
        ] },
      { ask: ['Where will your mask go?', 'Where will the mask go?'], if: 'flag n_home !near n5_peak 6500',
        say: ['By the forge door. Your mom says it will scare off the customers who argue about the price.', 'By the forge door. To scare off rude customers.'] },
      { if: 'flag n_home !near n5_peak 6500', idle: [['Mm? Careful, these are hot.', 'Careful, hot.'], ["Go on, cousin. I'm not stealing anything.", 'I am not stealing anything.']] },
      { if: 'flag n_home !near n5_peak 6500', bye: [['See you at the lanterns, cousin.', 'See you at the lanterns.']] },
      // ---- (J12) the Moon Pier, before the bridge
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
          ["When you go up, I'll be right behind you. Or in front. We'll see who's faster.", 'I will be behind you. Or in front.']] },
      { if: 'flag n_dawn', say: ["Tea with Gran on Sunday. Then a lot of nothing. I have earned some nothing.", "Tea with Gran. Then nothing."] },
      // (the voice in her dreams stops in the Mask Hall, so this is a question for the pier)
      { ask: ['Does she still talk in your sleep?', 'Does she still talk to you?'], if: '!flag n_dawn !near n5_peak 6500',
        say: ["Every night. She says I'll never get up that mountain. I've decided that's a dare.", 'Every night. She says I cannot climb it. That is a dare.'] },
      { ask: ['What will you do, after?', 'What will you do after?'], if: '!flag n_dawn',
        say: ["Tea with Gran. Then I'll break into something, just for fun, and put it all back.", 'Tea with Gran. Then a break-in, for fun. I will put it back.'] },
      { ask: ['Do you miss being the Moth Mask?', 'Do you miss the Moth Mask?'],
        say: ['I miss the cloak. The cloak was good. The rest was hers.', 'I miss the cloak. The rest was hers.'] },
      { idle: [["Make it quick, cousin. I'm casing the bridge.", 'Quick, cousin.'], ["Mm? I was looking for a way up that isn't stairs.", 'Mm? Go on.']] },
      { bye: [["See you at the top. I'll be early.", 'See you at the top.']] },
    ],

    // ---------------------------------------------------------------- Juniper Ashby, Rook's big sister
    // Mapper, brave, a bit bossy, never lost twice. Act I: lost in the Whisperwood Hollow until Ash found her (quest
    // hollow); Act IV: her Map Tent in Sable; drew the peak through Quill's telescope (n_depart). She stays on the pier
    // until the game is won, then goes home to Emberhollow for Lantern Day (x3_people). (v12 PEAK) A Juniper who is
    // Ash's Act I companion walks up the peak with him (her talk there needs near n5_peak).
    juniper: [
      { if: 'near n5_peak 6500 flag n_gather',
        say: ["This is the top of the map. Past here there's nothing but the moon.", 'This is the top of the map.'],
        re: [
          { t: ['Map the moon next.', 'Map the moon next.'],
            say: ['From the ground. Somebody else can go up there.', 'From the ground!'] },
          { t: ['Wait by the shrine, okay?', 'Wait by the shrine?'], tone: 'kind',
            say: ["I'll be right here, drawing you. Come back so I can finish.", 'I will draw you. Come back so I can finish.'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather',
        say: ["I'm mapping it as we go. Every ring is a place we've already been. Did you notice?", 'Every ring is a place we have been!'],
        re: [
          { t: ['Four rings, four lands.', 'Four rings, four lands.'],
            say: ['Four! Rook said three. Rook owes me a sweet.', 'Four! Rook owes me a sweet.'] },
          { t: ['Is your map right so far?', 'Is your map right?'],
            say: ['The still bits are right. The bits that move are their own fault.', 'The still bits are right.'] },
        ] },
      { if: 'near n5_peak 6500', say: ['Hold still. You are a very small dot on this map.', 'Hold still. You are a dot on my map.'] },
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
          { t: ["Rook still doesn't know about the ice.", "Rook doesn't know."], if: 'said juniper_rook',
            say: ["Keep it that way. He'd put it on a map with a big X: Juniper fell in here.", 'Keep it that way. He would draw an X.'] },
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
        say: ["I watched the glass go clear through the Professor's telescope, then came home to draw it. It's very hard to draw something you can see through.",
          'I saw the glass go clear. It is so hard to draw!'],
        re: [
          { t: ['Put Duchess on the very top.', 'Put Duchess on top.'],
            say: ["She's already there. She's the smallest thing on the page, and she's looking right at you.", 'She is there. Tiny. Looking at you.'] },
          { t: ["Write 'Don't' on it.", "Write 'Don't' on it."],
            say: ['Already did. Rook will try it anyway, so I drew him the safe way up as well.', 'I did. And a safe way up, for Rook.'] },
        ] },
      { if: '!flag n_dawn',
        say: [['The moths have all gone from the telescope. Now it\'s just the mountain, all the way up.', 'Now it is just the mountain.'],
          ['I gave you my best map. If you lose it, come back and I will draw you another.', 'Lose my map? I will draw another.']] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["I'm drawing the moon now. It sits still, so I can finally finish something.", "I am drawing the moon. It sits still!"], ["Rook wants a copy of every map. Every single one. He has a box.", "Rook wants every map. He has a box."]] },
      { ask: ['How did you get here from Sable?', 'How did you get here?'], if: '!flag n_home',
        say: ['Under the Glasswall on my belly, the way you went. If a dragon fits, a Juniper fits.', 'Under the wall, on my belly. Like you.'] },
      { ask: ['What will you map next?', 'What will you map next?'],
        say: ['The moon. Somebody has to, and it has finally stopped moving about.', 'The moon. It has stopped moving!'], if: 'flag n_dawn' },
      { ask: ['Does Rook know where you are?', 'Does Rook know you are here?'], if: '!flag n_home',
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
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["One whole moon, measured twice. I like it best when I am right twice.", "One whole moon. Measured twice."]] },
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
            say: ["Fast, slowly. That's how the Soggy Biscuit Three does it, on a good day.", 'My boat does that too, on good days.'] },
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
        say: ["Fish aren't biting. Even the fish think there's something fishy about the sky.", 'Even the fish know the sky is wrong.'],
        re: [
          { t: ['What do fish do without a moon?', 'What do fish do now?'],
            say: ['Same as me. Sit very still and look up.', 'Sit still and look up. Like me.'] },
          { t: ["Mom's polishing her hammer again.", "Mom's polishing her hammer."], if: 'said dell_hammer',
            say: ["On nothing, all night, at the end of the pier. It's the shiniest hammer in the world. Again.", 'All night. The shiniest hammer in the world.'] },
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
      { if: 'flag n_dawn', say: [["Fish are biting, lines are in, kettle's on. That's a good day.", "Fish are biting. A good day."], ["I'll sail the long way home. The sea looks friendly again.", "I will sail the long way home."]] },
      { ask: ['How far is home from here?', 'How far is home?'],
        say: ['Eleven days by boat. Less by dragon, if you don\'t mind ice in your ears.', 'Eleven days by boat. Less by dragon.'] },
      { ask: ['Does Minnow know you came all this way?', 'Does Minnow know?'],
        say: ["She wrote: \"Bring me a moon fish.\" I don't know what that is. I'm going to find one.", 'She wants a moon fish. I will find one.'] },
      { idle: [['Plenty of time on a pier. Water you want to know?', 'Ask away.'], ["Lines are in. What's up?", "What's up?"]] },
      { bye: [['Tight lines, Ash. Come back down.', 'Tight lines!']] },
    ],

    // ---------------------------------------------------------------- Tikka, Act I's kobold baker, Dell's ship's cook
    // (tk_come=yes). A small kobold with very big feelings about buns. Her brother is Tock. x3_people gives her lumpy bun
    // first; after the game she is in Gilly's Floating Kitchen at Driftwood Landing. (v12 PEAK) On the peak she waits at
    // the Crown Shrine with Tock and a basket (n_gather), and talks there through x4_story's prompt.
    ev_tikka: [
      { if: 'near n5_peak 6500 flag n_gather',
        say: [['ev_tikka', 'Tock carried the basket up every single ring. He says he is a mountain goat now.', 'Tock carried the basket up. He says he is a goat now.'],
          ['ev_tock', 'A tired one.'],
          ['ev_tikka', 'He is a very good brother. He will not say so.', 'He is a good brother. He will not say so.']],
        re: [
          { t: ['Thank you for carrying it, Tock.', 'Thank you, Tock.'], tone: 'kind', f: 0.5,
            say: [['ev_tikka', 'Tock! Ash said thank you!'], ['ev_tock', '...Somebody had to carry the buns.']] },
          { t: ["What's in the basket?", "What's in the basket?"],
            say: [['ev_tikka', 'Buns for everybody. And one for the moth lady, in case she is hungry.', 'Buns for all. One for the moth lady too.']] },
        ] },
      { if: 'near n5_peak 6500 flag n_gather',
        say: ['If the moth lady is hungry, I will make her soup. Nobody is mean when they have soup.', 'If she is hungry, I will make her soup.'],
        re: [
          { t: ['What if she bites?', 'What if she bites?'],
            say: ['Then no soup. Those are the rules in my kitchen.', 'Then no soup. Kitchen rules.'] },
          { t: ['She might not like soup.', 'She might not like soup.'],
            say: ['Everybody likes soup. Some people have just not had the right one yet.', 'Everybody likes soup. Maybe not the right one yet.'] },
        ] },
      { if: 'near n5_peak 6500', say: ['The buns are still warm. I sat on the basket the whole way up.', 'I sat on the buns to keep them warm.'] },
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
        say: ['I made sun buns! Round and yellow, for the morning. Gilly says they need fish. They do not need fish.', 'Sun buns! No fish!'],
        re: [
          { t: ['Can I have the lumpiest one?', 'Can I have the lumpy one?'],
            say: ['That one is for Tock. He likes them lumpy. You can have the second lumpiest.', 'That is for Tock. You get the next one.'] },
          { t: ['Are you sailing home with Dell?', 'Are you going home with Dell?'],
            say: ["Yes! I'm the ship's cook. It is a very important job. Mostly I hold the spoon.", "Yes! I'm the cook. I hold the spoon."] },
        ] },
      { if: '!flag n_dawn', say: [["I have flour on everything. Even Captain Dell.", "Flour on everything!"], ["Tock says hello. He says it very quietly.", "Tock says hello. Quietly."]] },
      { if: 'flag n_dawn', say: [["I am teaching Gilly to make buns with no fish. It is going slowly.", "Buns with no fish. Slowly."], ["Lumpy buns for everybody! Lumpy means love!", "Lumpy buns for everybody!"]] },
      { ask: ['What is the bigger spoon for?', 'What is the big spoon for?'],
        say: ["For a bigger pot. Tock says it's a ladle. It is a bigger spoon.", 'For a bigger pot. It is not a ladle.'] },
      { idle: [['Hello! Are you hungry? You look hungry.', 'Are you hungry?'], ['I have flour on my nose. Leave it. What?', 'What?']] },
      { bye: [['Bun voyage! Lumpy means good luck!', 'Bye! Good luck!']] },
    ],

    // ======================================================================= (v12 PEAK) the friends on Nightfall Peak
    // x4_story's ally runtime draws them; its "Talk to <name>" prompt (when Ash stands still beside one, with no fight or
    // scene going) opens their talk here. Every line on the peak needs `near n5_peak 6500` (the place above), so none of
    // it plays anywhere else. Where the climb is: on a friend's own ring (stage), at the Crown Shrine after the four
    // echoes (flag n_gather, before the dark of the Heart), and after the dawn (flag n_dawn or n_home). A friend who is
    // only there on one choice path only talks on that path. Moods: the moodRead cues, plus a tag where it matters.

    // ---------------------------------------------------------------- Glaciar (Auntie Glee)
    // Voice sheet: slow, grand, fond, a bit deaf on the left; "dumpling" at most twice a visit. Long sentences that take
    // their time, then a short one. Freed in Act III (choice f_glaciar=free): she lands at the Floe Gap on the third
    // ring, flies off at the Gust Stair ("I will circle the peak and meet you at the top"), and waits at the Crown. Woken
    // on Mount Dread in Act V (q_n5_glaciar, flag n5_glaciar): the Crown only. After the game she is asleep behind the
    // forge in Emberhollow (x4_story, place n5_glee_nap). (Every entry has an `if`, so in Moonfall after the game her
    // nap on the north isle keeps x3_people's own talk and its flight north.)
    f_glaciar: [
      // ---- at the Crown, after the four fears
      { if: 'near n5_peak 6500 flag n_gather seen n_glaciar_bye',
        say: ['I said I would meet you at the top, and here I am, first. That has never once happened to me in a thousand years.', 'I said I would meet you at the top. I got here first!'],
        re: [
          { t: ['You flew round the whole peak?', 'You flew all the way round?'],
            say: ['Twice. The first time I went the wrong way round. Nobody saw, so it does not count.', 'Twice. The first time was the wrong way.'] },
          { t: ['I knew you would be here.', 'I knew you would be here.'], tone: 'kind', f: 0.5,
            say: ['Then you knew more than I did, dumpling. The wind on the second ring was very rude to me.', 'Then you knew more than me. The wind was rude.'] },
        ] },
      { if: 'near n5_peak 6500 flag n_gather choice f_glaciar=free',
        say: ['Tove still rides in your fire, they tell me. If she can hear me in there: I came, this time.', 'If Tove can hear me: I came this time.'],
        re: [
          { t: ['She heard you.', 'She heard you.'], tone: 'kind',
            say: ['Good. Then she can stop grumbling about me. She will not, but she can.', 'Good. She can stop grumbling now. She won\'t.'] },
          { t: ['You came for me, too.', 'You came for me too.'],
            say: ['You came for me first, dumpling, all the way up a mountain, with no scarf.', 'You came for me first. With no scarf.'] },
        ] },
      { if: 'near n5_peak 6500 flag n_gather flag n5_glaciar !choice f_glaciar=free',
        say: ['You sang me awake, dumpling. Out of tune, and in the wrong order, and I have never heard anything so lovely.', 'You sang me awake. Out of tune. It was lovely.'],
        re: [
          { t: ["You were awake already, weren't you?", 'You were awake already?'],
            say: ['I may have been counting snowflakes. A dragon has her pride.', 'I was counting snowflakes. A dragon has pride.'] },
          { t: ['I said I would come back.', 'I said I would come back.'], tone: 'kind', f: 0.75,
            say: ['People say that to the snow all the time. You are the first one who meant it.', 'People say that to the snow. You meant it.'] },
        ] },
      // ---- on the third ring (a copy of Frostreach), then the fourth, after her echo and the sledding memory
      { if: 'near n5_peak 6500 !flag n_gather stage=n_rime',
        say: ['This ring is my mountain, done in black glass. Even the snow is wrong, dumpling. It does not squeak when you step on it.', 'This ring is my mountain, in glass. The snow does not squeak.'],
        re: [
          { t: ['Snow is supposed to squeak?', 'Snow should squeak?'],
            say: ['Good snow squeaks under your feet. This snow is only pretending to be snow.', 'Good snow squeaks. This snow is pretending.'] },
          { t: ['Is there a copy of you up here?', 'Is there a copy of you?'],
            say: ['Somewhere ahead, in chains, feeling very sorry for herself. I shall look at her anyway.', 'Ahead, in chains. I will look anyway.'] },
          { t: ['Mom says your name now.', 'Mom says your name now.'], if: 'said mom_glee', tone: 'kind',
            say: [['f_glaciar', 'Glee? Auntie Glee? Nobody has said it out loud in a thousand years. Say it again, on this side.', 'Auntie Glee? Say it again. On this side.', { mood: 'happy' }]] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather stage=n_glass choice f_glaciar=free',
        say: ['Sleds and cake, you said, every Lantern Day. I have decided to hold you to the cake.', 'Sleds and cake every Lantern Day. I want the cake.'],
        re: [
          { t: ['Chocolate or lemon?', 'Chocolate or lemon?'],
            say: ['Both. I am very large.', 'Both. I am very big.'] },
          { t: ['You have to make the snow.', 'You make the snow.'],
            say: ['Slowly. If I start tonight, there will be a whole hill of it by Lantern Day.', 'Slowly. I will start tonight.'] },
          { t: ['Can Pip ride on the sled?', 'Can Pip ride too?'], if: 'flag pip',
            say: ['Pip can ride on my nose. He will melt a little hole in it, and I shall not mind.', 'Pip can ride on my nose.'] },
        ] },
      { if: 'near n5_peak 6500', say: ['Up you go. If you slip, I catch. That is the arrangement.', 'Up you go. If you slip, I catch you.'] },
      { ask: ['Why do you call me that, Auntie?', 'Why call me that, Auntie?'], if: 'near n5_peak 6500',
        say: ['Ember was my little bun, when she was small. You have her horns. Dumpling is the next size up.', 'Ember was my little bun. You are the next size up.'] },
      { ask: ['What was it like, being asleep?', 'What was sleeping like?'], if: 'near n5_peak 6500',
        say: ['Like being snowed in with my own bad dreams. I would not do it again for all the ice in Frostreach.', 'Like being snowed in with bad dreams.'] },
      { if: 'near n5_peak 6500', idle: [['Mm? Speak up on this side, please.', 'Mm? This side, please.'], ['Go on. I am listening, slowly.', 'Go on. I am listening.']] },
      { if: 'near n5_peak 6500', bye: [['Off you go. I shall be right here, being large.', 'Off you go.']] },
      // ---- after the game: asleep behind the forge on Lantern Day
      { if: 'flag n_home near n5_glee_nap 400',
        say: [['narr', 'One huge blue eye opens, very slowly.', 'One big blue eye opens.'],
          ['f_glaciar', 'Is it Lantern Day? Wake me for the cake, dumpling. Not one minute before.', 'Is it Lantern Day? Wake me for the cake.', { mood: 'sleepy' }]],
        re: [
          { t: ["It's Lantern Day now.", "It's Lantern Day now."],
            say: ['Then I shall get up. Slowly. Start the cake without me, and save me the middle.', 'Then I will get up. Slowly. Save me the middle.'] },
          { t: ['Every bucket of milk froze.', 'All the milk froze.'],
            say: ['Tell your mother I am very sorry, and that frozen milk is a treat where I come from.', 'Tell your mother sorry. Frozen milk is a treat.'] },
          { t: ['You flew everyone home.', 'You flew everyone home.'], tone: 'kind',
            say: ['Everyone, and a goat. The goat was not grateful.', 'Everyone, and a goat. The goat was rude.'] },
        ] },
      { if: 'flag n_home near n5_glee_nap 400',
        say: ["I have slept through a great many Lantern Days, dumpling. Not this one. I am only lying down so I don't knock the lanterns over.", 'I slept through many Lantern Days. Not this one.'],
        re: [
          { t: ['Stay till the last lantern?', 'Stay till the last one?'],
            say: ['Every last one. Then I shall sleep until spring, and nobody will mind.', 'Every one. Then I will sleep till spring.'] },
          { t: ['Mom cleared the big chair for you.', 'Mom cleared the big chair.'], if: 'said mom_glee',
            say: ['I sat in it. It is a very flat chair now. Your mother says it was always that flat. She is kind.', 'I sat in it. It is very flat now.'] },
        ] },
      { if: 'flag n_home near n5_glee_nap 400', say: ['Zzz. ...Mm? Still here. Still asleep, mostly.', 'Zzz. Still here.'] },
      { ask: ['Where will you live now, Auntie?', 'Where will you live?'], if: 'flag n_home near n5_glee_nap 400',
        say: ["On Mount Dread in winter, and behind your mother's forge in summer. I have not asked her about the summer part yet.", 'Mount Dread in winter. Here in summer, if your mother agrees.'] },
      { ask: ['Will you teach me to make snow?', 'Will you teach me snow?'], if: 'flag n_home near n5_glee_nap 400',
        say: ['When you are bigger. Snow is slow work, and you are a very quick dumpling.', 'When you are bigger. Snow is slow work.'] },
      { if: 'flag n_home near n5_glee_nap 400', idle: [['Mm. Still asleep. Ask quietly.', 'Mm. Ask quietly.'], ['Zzz... yes?', 'Zzz... yes?']] },
      { if: 'flag n_home near n5_glee_nap 400', bye: [['Close the forge door as you go. The warm gets in.', 'Close the door. The warm gets in.']] },
    ],

    // ---------------------------------------------------------------- Hush
    // Voice sheet: whispers; "Shhh" once a visit; four or five words a line; "loud one", never "little ember"; the
    // Mother, quiet, warm, small. Freed in Act IV (choice m_hush=free): she comes down in the Tendril Wood on the fourth
    // ring, leaves after her echo, and waits at the Crown. Cut free in the Moth's Cradle in Act V (q_n5_hush, flag
    // n5_hush): small, riding on Ash's horn. The bell (Tollef) and the humming in the wind (Pennant) are Act III's.
    f_hush: [
      { if: 'near n5_peak 6500 flag n_gather',
        say: ['She is up there. Waiting.', 'She is up there. Waiting.'],
        re: [
          { t: ['Will you talk to her?', 'Will you talk to her?'],
            say: ['Two words. I have them ready.', 'Two words. I have them.'] },
          { t: ["You don't have to come.", "You don't have to come."], tone: 'kind', f: 0.5,
            say: ['Shhh. I am coming.', 'Shhh. I am coming.'] },
        ] },
      { if: 'near n5_peak 6500 flag n_gather',
        say: ['Up here, no bells. No morning.', 'Up here, no bells. No morning.'],
        re: [
          { t: ['Tollef rings his bell twice now.', 'Tollef rings twice now.'], if: 'said tollef_bell',
            say: ['Twice? Every morning? ...Good.', 'Twice? Good.'] },
          { t: ['Pennant hears humming in the wind.', 'Pennant hears humming.'], if: 'said pennant_hum',
            say: [['f_hush', 'That was me. Humming. Quietly.', 'That was me. Humming.', { mood: 'shy' }]] },
          { t: ['Morning is coming anyway.', 'Morning is coming anyway.'], tone: 'brave',
            say: ['I know. I want to see one.', 'I know. I want to see it.'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather stage=n_glass choice m_hush=free',
        say: ['Shhh. She can hear us here.', 'Shhh. She can hear us here.'],
        re: [
          { t: ['Then we whisper.', 'Then we whisper.'],
            say: ['Yes. Like that. Good.', 'Yes. Like that.'] },
          { t: ['Are you scared, Hush?', 'Are you scared?'], tone: 'kind',
            say: ['Yes. Quietly.', 'Yes. Quietly.'] },
          { t: ['Does the thread still hurt?', 'Does it still hurt?'],
            say: ['No. It itches. Like growing.', 'No. It itches.'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather stage=n_glass flag n5_hush !choice m_hush=free',
        say: ['Shhh. Warm, up here. Your horn.', 'Shhh. Warm up here. Your horn.'],
        re: [
          { t: ['Hold on tight.', 'Hold on tight.'],
            say: ['Holding. Six little feet.', 'Holding. Six feet.'] },
          { t: ["You're so small now.", "You're so small now."],
            say: ['Small. Still going.', 'Small. Still going.'] },
        ] },
      { if: 'near n5_peak 6500', say: ['Stay close. You are warm.', 'Stay close. You are warm.'] },
      { ask: ['What does the Mother want?', 'What does she want?'], if: 'near n5_peak 6500',
        say: ['Everything still. Everyone near. Always.', 'Everything still. Everyone near.'] },
      { ask: ['Where will you go, after?', 'Where will you go after?'], if: 'near n5_peak 6500',
        say: ['Somewhere warm. With mornings.', 'Somewhere warm. With mornings.'] },
      { if: 'near n5_peak 6500', idle: [['Yes? Softly.', 'Yes? Softly.'], ['Mm. Listening.', 'Mm. Listening.']] },
      { if: 'near n5_peak 6500', bye: [['Go. Softly, loud one.', 'Go softly, loud one.']] },
    ],

    // ---------------------------------------------------------------- Greymane (choice greymane=ally, Act I)
    // A wolf: he never talks. What he does is his line, in brackets, as the Act I companion's are. He swims the Ink Sea
    // to the Bridgefoot (n_gate_open), climbs the first ring, growls at the shadow dragon, and trots off at the Wind
    // Chimney (n_grey_bye) to find his own way up; he is sitting by the Crown Shrine when Ash gets there.
    greymane: [
      { if: 'near n5_peak 6500 flag n_gather !flag n_dawn', fact: 'n5_moon=gone',
        say: ['(Greymane puts his huge head on your shoulder and breathes out. It is like standing in a warm wind.)', '(Greymane leans his big head on you. His breath is warm.)'],
        re: [
          { t: ['Will you howl at her for me?', 'Will you howl at her?'],
            say: ['(He looks up at the bitten moon and growls, low and long, at whatever bit it.)', '(He growls at the bitten moon.)'] },
          { t: ['Stay close to Pip up there.', 'Stay close to Pip.'], if: 'flag pip',
            say: ['(Greymane looks at Pip. Pip looks at Greymane. Something is agreed.)', '(Greymane and Pip look at each other. Agreed.)'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather stage<=n_stair',
        say: ['(Greymane shakes the last of the Ink Sea out of his coat. Most of it lands on you.)', '(Greymane shakes. Most of the sea lands on you.)'],
        re: [
          { t: ['You swam that whole sea for me?', 'You swam it for me?'], tone: 'kind',
            say: ['(He lies down across your feet, heavy and wet. That is a yes.)', '(He lies on your feet. That is a yes.)'] },
          { t: ['Does your pack know where you are?', 'Does your pack know?'],
            say: ['(His ears turn back toward home. Then forward again, up the mountain.)', '(His ears point home. Then up the mountain.)'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather stage=n_clocks',
        say: ['(Greymane sniffs the glass where the shadow dragon broke apart. Then he sneezes, hard, and looks very pleased with himself.)', '(Greymane sniffs where the shadow broke. He sneezes.)'],
        re: [
          { t: ["That was Grandpa's shadow.", "That was Grandpa's shadow."],
            say: ['(He tilts his head. One ear up, one ear down. He remembers the real one.)', '(He tilts his head. He remembers.)'] },
          { t: ["It's gone now, boy.", "It's gone now, boy."],
            say: ['(His tail sweeps the glass. Left, right, left.)', '(His tail wags. Left, right, left.)'] },
        ] },
      { if: 'near n5_peak 6500', say: ['(Greymane sniffs the cold wind, then looks back at you.)', '(Greymane sniffs the wind.)'] },
      { ask: ['Where is the rest of your pack?', 'Where is your pack?'], if: 'near n5_peak 6500',
        say: ['(He points his nose out over the dark water, toward home, and whines once.)', '(He points his nose home and whines.)'] },
      { ask: ['Who is a good wolf?', 'Who is a good wolf?'], if: 'near n5_peak 6500',
        say: ['(Greymane rolls over on the glass for a belly rub. A thousand pounds of wolf, belly up, on a mountain of night.)', '(Greymane rolls over for a belly rub.)'] },
      { if: 'near n5_peak 6500', idle: [['(Greymane watches you, ears up.)', '(He watches you.)'], ['(He thumps his tail once.)', '(Thump.)']] },
      { if: 'near n5_peak 6500', bye: [['(Greymane licks your ear and pads after you.)', '(He licks your ear.)']] },
    ],

    // ---------------------------------------------------------------- Pip
    // Voice sheet: "Mip" (once a visit here, in the opener); everything else is what he does, in brackets, never his
    // feelings explained. One word in the whole game, in the dark: "ASH!". On the peak he talks when Ash stops for a while.
    pip: [
      { if: 'near n5_peak 6500 flag n_dawn',
        say: [['narr', 'Pip opens his mouth as if he might say something. Then he shuts it again.', 'Pip opens his mouth. Then he shuts it.'], ['pip', 'Mip.']],
        re: [
          { t: ['Say my name again, Pip.', 'Say my name again.'],
            say: ['(He looks very pleased with himself, and says nothing at all.)', '(He looks pleased. He says nothing.)'] },
          { t: ['Did you really talk up there?', 'Did you really talk?'],
            say: [['pip', '(Pip hides his face under his wing. He did.)', '(Pip hides his face. He did.)', { mood: 'shy' }]] },
        ] },
      { if: 'near n5_peak 6500 flag n_gather !flag n_dawn', fact: 'n5_moon=gone',
        say: [['narr', 'Pip looks up at the bitten moon for a long time. Then he looks at you.', 'Pip looks at the moon. Then at you.'], ['pip', 'Mip.']],
        re: [
          { t: ["We'll get it back, Pip.", "We'll get it back."], tone: 'brave',
            say: ['(He breathes one tiny puff of smoke at the moon. It does not reach.)', '(He puffs smoke at the moon. Too small.)'] },
          { t: ['You came the whole way.', 'You came the whole way.'], tone: 'kind',
            say: ['(He climbs into your arms, and stays there.)', '(He climbs into your arms and stays.)'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather',
        say: [['narr', 'Pip sits on your foot and looks all the way up the mountain.', 'Pip sits on your foot and looks up.'], ['pip', 'Mip?']],
        re: [
          { t: ['Nearly there, Pip.', 'Nearly there, Pip.'],
            say: ['(He climbs up your leg anyway, just in case.)', '(He climbs your leg, just in case.)'] },
          { t: ['Are you cold, Pip?', 'Are you cold, Pip?'],
            say: ['(He puffs out every scale until he is round and warm, to show you.)', '(He puffs up, round and warm.)'] },
        ] },
      { if: 'near n5_peak 6500', say: ['(Pip curls round your neck like a warm scarf.)', '(Pip curls round your neck.)'] },
      { if: 'near n5_peak 6500', idle: [['(Pip waits.)', '(Pip waits.)'], ['(Pip tilts his head.)', '(Pip tilts his head.)']] },
      { if: 'near n5_peak 6500', bye: [['(Pip scrambles up onto your head.)', '(Pip climbs on your head.)']] },
    ],

    // ---------------------------------------------------------------- Duchess (speaker goat), on the very top after the dawn
    // A goat: she only ever says "Meh." (the old talk's way); what she does is narration. x4_story's "Talk to Duchess" on
    // the summit (after the dawn, when Ash comes back up) counts her last sighting when the talk closes.
    goat: [
      { if: 'near n5_peak 6500 flag n_dawn',
        say: [['narr', 'Duchess stands on the very top of the peak, where nothing could possibly have climbed. She is chewing something.', 'Duchess stands on the very top. She is chewing.'], ['goat', 'Meh.']],
        re: [
          { t: ["There's a MOAT, Duchess.", "There's a MOAT!"],
            say: [['goat', 'Meh.'], ['narr', 'She does not think much of the moat.', 'She does not care about the moat.']] },
          { t: ['What are you chewing?', 'What are you chewing?'],
            say: [['goat', 'Meh.'], ['narr', 'She chews it slowly, so you can watch. You decide not to ask what it used to be.', 'She chews slowly. You decide not to ask.']] },
          { t: ['Did you chew the lantern tassel?', 'Did you chew the tassel?'], if: 'clue n5_chewed',
            say: [['goat', 'Meh.'], ['narr', 'A soggy bit of tassel is still stuck in her beard.', 'Some tassel is stuck in her beard.']] },
        ] },
      { if: 'near n5_peak 6500 flag n_dawn',
        say: [['narr', 'Duchess is still on top of the peak, looking at the view. It is mostly sky.', 'Duchess looks at the view. It is mostly sky.'], ['goat', 'Meh.']],
        re: [
          { t: ['Want to come home with me?', 'Want to come home?'],
            say: [['goat', 'Meh.'], ['narr', 'She will come home when she decides to. She has not decided.', 'She will come home when she decides.']] },
          { t: ['Is it a good view?', 'Is it a good view?'],
            say: [['goat', 'MEH.'], ['narr', 'She turns her back on it, and on you, and goes on chewing.', 'She turns her back and chews.']] },
          { t: ['Hollis says you always do this.', 'Hollis says you always do this.'], if: 'quest q_n5_follower done',
            say: [['goat', 'Meh.'], ['narr', 'She does not deny it.', 'She does not deny it.']] },
        ] },
      { if: 'near n5_peak 6500 flag n_dawn', say: ['MEH.', 'MEH.'] },
      { if: 'near n5_peak 6500 flag n_dawn', idle: [['Meh?', 'Meh?'], ['Meh.', 'Meh.']] },
      { if: 'near n5_peak 6500 flag n_dawn', bye: [['Meh.', 'Meh.']] },
    ],

    // ======================================================================= map 0, Embermere (Act I's people)
    // (J12) Emberhollow has known Ash all his life. In the Long Night he comes home over the bridge for errands; after
    // the dawn he wakes on the green on the thousand-and-first Lantern Day (n_end's n_home, flag n_home), and the whole
    // valley is there.

    // ---------------------------------------------------------------- Elder Yara, by the well
    // Dry, kind, the village elder; no counting. Checks her stories before she tells them. Pebble carries her letters.
    yara: [
      { if: 'choice ending=lantern !flag n_dawn', once: true, fact: 'n5_moon=gone',
        say: ["Your grandfather sat on my well all evening, watching your mountain. He says he isn't worried. He keeps saying it.",
          'Grandpa sits on my well and watches your mountain.'],
        re: [
          { t: ["He's worried. He just won't say.", "He's worried. He won't say."],
            say: ["I know. I've left him a slice of cake. He pretends it's for later.", 'I know. I gave him cake. He says it is for later.'] },
          { t: ["Tell him I'll bring it back.", "Tell him I'll bring it back."], tone: 'brave',
            say: ['I will. He\'ll say "obviously", and then he\'ll sit up all night anyway.', 'He will say "obviously". Then he will sit up all night.'] },
        ] },
      { if: 'choice ending=warden !flag n_dawn', once: true,
        say: ['The Sixth Warden. I still curtsy when you go past. My knees complain about it.', 'I still curtsy to the Sixth Warden.'],
        re: [
          { t: ["You don't have to curtsy, Yara.", "You don't have to curtsy."],
            say: ["I know. I'm doing it while my knees still bend.", 'I know. I do it while my knees still bend.'] },
          { t: ['Iska says the lanterns look nice.', 'Iska likes the lanterns.'],
            say: ["Tell her the green's lanterns haven't gone out once. Not even this week.", 'Tell her they have not gone out once.'] },
        ] },
      { if: 'choice ending=heir !flag n_dawn', once: true,
        say: ['Your grandfather asked Bertram to leave the oven door open a crack, in this dark. Dragons don\'t ask for things.', 'Grandpa asked Bertram to leave the oven open.'],
        re: [
          { t: ['Is he scared?', 'Is he scared?'],
            say: ["He would bite me for saying so. So I won't say so. Yes.", 'He would bite me for saying it. Yes.'] },
          { t: ['Tell him I said hello.', 'Tell him hello from me.'], tone: 'kind',
            say: ["He'll pretend not to hear. Then he'll ask what else you said.", 'He will pretend not to hear. Then ask what else.'] },
        ] },
      { if: 'said yara_not_ordinary !flag n_dawn', once: true, fact: 'n5_moon=gone',
        say: ["You told me once you'd rather light the Wards than be ordinary. Tonight I'd give a lot for you to be ordinary.",
          'You said you are not ordinary. Tonight I wish you were.'],
        re: [
          { t: ['Ordinary kids get to stay home.', 'Ordinary kids stay home.'],
            say: ['They do. And they look up at that mountain and wonder who is on it.', 'They do. And they wonder who is up there.'] },
          { t: ['Somebody has to climb it, Yara.', 'Somebody has to climb it.'], tone: 'brave',
            say: ['I know. I only wish it were not somebody I taught to tie his boots.', 'I know. I taught you to tie your boots.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['No moon. The well water is black as ink. I keep a lamp by it so nobody falls in.', 'No moon. I keep a lamp by the well.'],
        re: [
          { t: ['Will the moon come back?', 'Will the moon come back?'],
            say: ["It has come back every night of my life. I don't intend to let it stop now.", 'It always has. I will not let it stop now.'] },
          { t: ["I'll keep an eye on the well.", "I'll watch the well."],
            say: ["You'll be up a mountain. Keep an eye on that.", 'You will be up a mountain. Watch that.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['Pebble came back with frost on her feathers and would not stop cawing. Be careful up there, Ash.', 'Pebble came back cold. Be careful up there!'],
          ['Your mother lit every lantern on the green before she sailed. "Light one more than you need," as Iska says.', 'Light one more than you need.']] },
      // the fourth post (B5: her clue for n5_fourth_lantern, and a Heart Ember from the old stump hole)
      { if: 'clue n5_fourth_post !clue n5_yara_post', option: ['Were there always three lantern posts on the green?', 'Were there always three posts?'],
        then: ['clue n5_yara_post', 'heart_ember n5_yara'],
        say: [['yara', 'Three? No, dear. There were four posts when I was a girl. Nobody remembered why. The fourth one rotted, and nobody put it back.',
            'There were four posts when I was a girl!'],
          ['yara', 'When they dug out the old stump, they found this in the hole. It has been warm as toast for sixty years. I think it was waiting for you.',
            'This was in the hole. It is still warm. Take it.']] },
      // after the dawn: the thousand-and-first Lantern Day, then the moon as it is now
      { if: 'flag n_dawn flag n_home', once: true, fact: 'n5_moon=back',
        say: ["The thousand-and-first Lantern Day. I wasn't sure I'd be telling the children there would be one.", 'The thousand-and-first Lantern Day. I was not sure.'],
        re: [
          { t: ['Will you tell them about the mountain?', 'Will you tell them?'],
            say: ["Once I've checked it with your mother. Then they'll tell it wrong, and theirs will be the one people remember.", 'After I check it. Then they will tell it wrong.'] },
          { t: ['Light the first lantern, Yara.', 'You light the first one.'], tone: 'kind',
            say: ['Not me. The first one is yours. It always was.', 'Not me. The first one is yours.'] },
        ] },
      { if: 'flag n_dawn choice n_end=moth', fact: 'n5_moon=back',
        say: ['A little grey moth sat on the well this morning. I gave her a crumb. She seemed to like that.', 'A little moth sat on the well. I fed her a crumb.'],
        re: [
          { t: ["She's called Nyx.", 'She is called Nyx.'], tone: 'kind',
            say: ['Nyx. Then I will say good morning to her by name. Manners matter, even with moths.', 'Then I will say good morning to her by name.'] },
          { t: ['Was she cold?', 'Was she cold?'],
            say: ['She sat on my lamp until it went out. Then she sat on my hand. She was warm by then.', 'She sat on my lamp. Then on my hand. She was warm.'] },
        ] },
      { if: 'flag n_dawn choice n_end=embermoon', fact: 'n5_moon=back',
        say: ['The moon is gold, Ash. Like a lantern somebody hung up very high. I sat up all night just to look at it.', 'The moon is gold! I looked all night.'],
        re: [
          { t: ["That's our Heart up there.", "That's our Heart up there."],
            say: ["Your mother told me. She stood here by the well for an hour, looking up. She didn't say a word.", 'Your mother told me. She looked up for an hour.'] },
          { t: ['Did you sleep at all?', 'Did you sleep?'],
            say: ['At my age, sleep is something that happens to other people.', 'At my age? No.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon has seams on it now, like a mended cup. My best teapot has seams just like that.', 'The moon has seams now. Like my teapot.'],
        re: [
          { t: ['Who mended your teapot?', 'Who mended it?'],
            say: ['Your mother, when she was nine. She dropped it first. Then she mended it the same day.', 'Your mother. She broke it, then mended it.'] },
          { t: ['I like the seams.', 'I like the seams.'],
            say: ['So do I. You can see somebody bothered.', 'So do I. Somebody bothered.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["Mind the well. The moon is in it again, and the children keep trying to fish it out.", "The moon is in the well again."]] },
      { ask: ['Did Ember ever talk about a moth?', 'Did Ember talk about a moth?'], if: '!flag n_dawn',
        say: ["Not to me, Ash. I'm old, but I'm not that old.", 'Not to me. I am not that old!'] },
      { ask: ['What do you tell the children, in the dark?', 'What do you tell the children?'], if: '!flag n_dawn',
        say: ['The first Lantern Day. Ember, the dark, one lantern on the hill. They ask for it every night now.', 'The first Lantern Day. They ask for it every night.'] },
      { ask: ['Has Pebble brought any letters?', 'Any letters from Pebble?'],
        say: ['One, from your mother. It says: "Tell Ash to eat." I am telling you.', 'Your mother says: "Tell Ash to eat."'] },
      { idle: [["Mm? I'm listening. My ears are older than my eyes, but they work.", 'I am listening.'], ['Go on, Ash.', 'Go on.']] },
      { bye: [['Mind the well.', 'Mind the well.'], ['Go carefully, Ash.', 'Go carefully.']] },
      { bark: true, if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['No moon again tonight. Mind the well.', 'No moon. Mind the well.'] },
    ],

    // ---------------------------------------------------------------- Farmer Hollis, Hollis Farm (the Duchess mystery)
    // Proud goat man, gruff and fond. The note on the gatepost is not his (q_n5_follower's twist): he never mentions it.
    hollis: [
      { if: 'quest q_n5_follower active !clue n5_hollis_note !flag n_dawn', fact: 'n5_duchess_pen=empty',
        say: ["Duchess? Pen's been empty for days. Gate's open. I didn't open it.", "Duchess's pen is empty. I didn't open it."],
        re: [
          { t: ['Where would she go?', 'Where would she go?'],
            say: ["Wherever's highest, and least allowed. That's always been her rule.", 'Somewhere high. And not allowed.'] },
          { t: ['Did she take anything?', 'Did she take anything?'],
            say: ['My good sock and half the hay. She plans ahead, that goat.', 'My sock and half the hay. She plans ahead.'] },
        ] },
      { if: 'flag n_dawn solved n5_who_follows', fact: 'n5_moon=back',
        say: ['She came home this morning with frost in her beard and moon-dust on her hooves, and walked straight past me to her hay.', 'Duchess came home with moon-dust on her hooves!'],
        re: [
          { t: ['She was at the very top.', 'She was at the very top.'],
            say: ["Course she was. Highest thing for a hundred miles. She'll be unbearable all winter.", 'Course she was. She will be unbearable now.'] },
          { t: ['Did she bring you anything?', 'Did she bring you anything?'],
            say: ['A pebble. Black glass, smooth as an egg. She left it in my boot.', 'A black glass pebble. In my boot.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_duchess_pen=empty',
        say: ["Pen's empty again. She'll turn up. She always does, somewhere ridiculous.", 'She always turns up somewhere silly.'],
        re: [
          { t: ['How ridiculous?', 'How silly?'],
            say: ["The chapel roof, once. The Mayor's bath, twice. Never anywhere you'd put a goat.", "A roof. The Mayor's bath. Never a pen."] },
          { t: ['Goats are still better than sheep.', 'Goats are still better.'], if: 'said hollis_goats', tone: 'kind',
            say: ["Course they are. Sheep don't run off to see the end of the world.", 'Course. Sheep do not go to the end of the world.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_duchess_pen=home',
        say: ["She's home. Sitting on her roof. Looking at the moon like she put it there.", 'She is home, on her roof, looking at the moon.'] },
      { if: '!flag n_dawn', say: [["Long Night or not, the goat wants feeding. If I could find her.", "The goat wants feeding. She is off somewhere."]] },
      { ask: ['Does Duchess ever stay put?', 'Does Duchess stay put?'],
        say: ['Once. She had a cold. She was furious about it.', 'Once. She had a cold. She was cross.'] },
      { ask: ['How is your brother?', 'How is Ulf?'],
        say: ["Loud. Wrong about sheep. Writes every week. ...He's well.", 'Loud. Wrong about sheep. He is well.'] },
      { idle: [['Hm? Mind the hay.', 'Mind the hay.'], ["Go on. The goats aren't listening. Probably.", 'Go on.']] },
      { bye: [['Love a goat all you like, Ash. Just never trust one.', 'Never trust a goat.']] },
    ],

    // ---------------------------------------------------------------- Mabel Thornbury, herbalist
    // Practical, bossy in a fond way, has patched Ash up every week since he was four. Granny Moss is her gran.
    mabel: [
      // her moment: patching him up the first time he comes home over the bridge
      { if: 'flag n_depart !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Sit. Let me look at you. Scratches, a bruise, and frost on your horns. Where have you been?', 'Sit. Frost on your horns? Where were you?'],
        re: [
          { t: ['Up a mountain made of night.', 'Up a night mountain.'],
            say: ['Of course you have. Hold still. This will sting.', 'Of course. Hold still. This will sting.'] },
          { t: ["It's nothing, Mabel.", "It's nothing."],
            say: ["Frost on your horns is never nothing. Sit. Goose fat. Don't make that face.", 'It is never nothing. Sit. Goose fat.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["The moonlilies won't open without a moon. I talk to them every morning, and they stay shut.", 'Moonlilies sulk without a moon.'],
        re: [
          { t: ["Maybe they're waiting, like us.", 'Maybe they are waiting.'],
            say: ["Then they're more patient than I am. I've snapped at three customers today.", 'They are more patient than me.'] },
          { t: ['Have you said sorry to them?', 'Did you say sorry to them?'], if: 'said mabel_sorry_plants',
            say: ["Every morning, like you do. They're still sulking. Gran says it isn't me, it's the sky.", 'Every morning. Gran says it is the sky.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: [['Gran sent word from the Mirefen: the frogs have stopped singing. She has never known that in all her years.', 'Gran says the frogs stopped singing.'],
          ['Half the village has a cough from sitting up by the fire. I have run out of honey.', 'Everyone coughs. I have no honey left.']] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Every moonlily in the valley opened at once. It sounded like a sigh.', 'Every moonlily opened at once!'],
        re: [
          { t: ['Can I pick one for Mom?', 'Can I pick one for Mom?'], tone: 'kind',
            say: ['One. And say sorry to it. You know the rule.', 'One. Say sorry to it.'] },
          { t: ["Are Gran's frogs singing again?", "Are Gran's frogs singing?"],
            say: ["All of them, all out of tune. She wrote to say it's the best noise she has ever heard.", 'All out of tune. She loves it.'] },
        ] },
      { if: 'flag n_dawn', say: [["The lilies are open and the coughs have stopped. I may take a day off. I won't.", "The lilies are open. Coughs are gone."]] },
      { ask: ['Does anything help with the dark?', 'What helps in the dark?'], if: '!flag n_dawn',
        say: ['Chamomile, a candle, and somebody to sit with. The chamomile is the least of it.', 'Tea, a candle, and a friend.'] },
      { ask: ['Have you got anything for cold claws?', 'Anything for cold claws?'],
        say: ['Goose fat. It smells terrible and it works. Hold them out.', 'Goose fat. It smells, but it works.'] },
      { idle: [['What hurts? Something always hurts.', 'What hurts?'], ['Go on. I can grind and listen.', 'Go on.']] },
      { bye: [["Off you go. Come back with both eyebrows.", 'Keep your eyebrows!']] },
    ],

    // ---------------------------------------------------------------- Rook Ashby, ten, wants to be a knight or a dragon
    rook: [
      { if: 'choice cinder=ally !flag n_dawn', once: true,
        say: ['Is Sir Cindervane going up the mountain with you? A real knight? Can I hold his helmet?', 'Is the real knight going with you?'],
        re: [
          { t: ["He's guarding the stairs for me.", "He's guarding the stairs."],
            say: ["Guarding stairs! That's the most knight thing anybody has ever done.", 'Guarding stairs! So knightly!'] },
          { t: ["His helmet's too heavy for you.", 'His helmet is too heavy.'],
            say: ["I'd grow into it. I'm growing all the time. Mum says too fast.", 'I would grow into it.'] },
        ] },
      { if: 'flag juniper_found !flag n_dawn',
        say: ["Juniper wrote. She's at the end of the world, drawing your mountain. I'm here guarding the green.", 'Juniper is drawing your mountain. I am guarding the green.'],
        re: [
          { t: ["That's an important job.", "That's an important job."], tone: 'kind',
            say: ["I know. I've been doing it all night. Nothing's got past me. Not even a goose.", 'I know. Nothing got past me. Not even a goose.'] },
          { t: ['You could have gone with her.', 'You could have gone.'],
            say: ["Mum said not till I'm twenty. Juniper went. So I'm going when I'm eleven.", 'Mum said no. Juniper went. I will go at eleven.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["I'm staying up all night to watch for you. Mum says it's already all night. That's not the point.", 'I am staying up all night for you!'],
        re: [
          { t: ["What's the point, then?", "What's the point?"],
            say: ['The point is somebody has to be watching. Knights watch.', 'Somebody has to watch. Knights watch.'] },
          { t: ['Roar if you see anything.', 'Roar if you see anything.'], if: 'said rook_roar',
            say: ['From the belly, the way you showed me. RAAAH. Like that?', 'From the belly! Like that?'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['You did it! I saw the moon come back! I was awake! Mostly!', 'You did it! I saw the moon!'],
        re: [
          { t: ['Mostly?', 'Mostly?'],
            say: ['I closed my eyes for one blink. A long blink. Then it was there.', 'One long blink. Then it was there.'] },
          { t: ["Juniper's map got me there.", "Juniper's map helped."],
            say: ["She wrote and told me. She drew you on it, very small. You're the orange bit.", 'She drew you on it. You are the orange bit.'] },
        ] },
      { if: '!flag n_dawn', say: [["When I grow up I am going to be a dragon. A dragon who climbs a night mountain. Like you.", "I want to climb a night mountain too."], ["I'm on guard. Nothing gets past me.", "I'm on guard."]] },
      { if: 'flag n_dawn', say: [["I'm going to be you for every Lantern Day now. I've got better horns.", "I am dressing as you again!"], ["Juniper says she is coming home when the map is done. I am waiting by the door.", "I am waiting for Juniper."]] },
      { ask: ['Is Juniper coming home soon?', 'Is Juniper coming home?'],
        say: ["She says when the map's finished. It's never finished. That's how maps work, she says.", 'When the map is done. It is never done.'] },
      { ask: ['Knight or dragon, now?', 'Knight or dragon?'],
        say: ["Both. A knight who climbs night mountains. I've decided.", 'Both! A knight who climbs night mountains.'] },
      { idle: [["I'm on guard. Ask me something.", "I'm on guard."], ["Knights don't get sleepy. I'm not sleepy.", "I'm not sleepy."]] },
      { bye: [['Bye, Ash! I\'ll keep watching!', 'I will keep watching!']] },
    ],

    // ---------------------------------------------------------------- Wendel Fisk, Emberhollow's only fiddler
    wendel: [
      { if: 'said wendel_jig flag n_dawn', once: true,
        say: ['I took your advice. The morning song has a jig in the middle. Nana danced. Nana never dances.', 'The morning song has a jig. Nana danced!'],
        re: [
          { t: ['Did she drop a stitch?', 'Did she drop a stitch?'],
            say: ['Three. She said it was worth it.', 'Three. She said it was worth it.'] },
          { t: ['Will you play the jig for me?', 'Play the jig for me?'],
            say: ['On the green tonight. Dell says he will bring his spoons. Nobody asked him to.', 'Tonight. Dell will bring spoons.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I wrote a song about the Long Night. It is very short. It is mostly one long, sad note.', 'My Long Night song is one long note.'],
        re: [
          { t: ['Play me the note.', 'Play me the note.'],
            say: [['narr', 'Wendel draws the bow once across the strings, very slowly.', 'Wendel plays one long, slow note.'], ['wendel', "There. That's the whole song.", "That's the whole song."]] },
          { t: ['Put a jig in the middle.', 'Put a jig in it.'], tone: 'silly', then: ['said wendel_jig'],
            say: ["A jig? In the Long Night? ...Actually, that isn't bad. A brave little jig.", 'A jig? ...A brave little jig. Yes!'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['I wrote a new song about the morning. It is much longer than the night one.', 'My new morning song is much longer.'],
        re: [
          { t: ['Will you play it on the green?', 'Will you play it?'],
            say: ['Tonight, and every Lantern Day after. My fingers will fall off. Tamsin can take over.', 'Tonight, and every Lantern Day.'] },
          { t: ['Does Ash rhyme with anything new?', 'What rhymes with Ash now?'],
            say: ['Moustache. The Mayor has asked me not to.', 'Moustache. The Mayor said no.'] },
        ] },
      { if: '!flag n_dawn', say: [["I play by the well every night, so people know which way home is.", "I play by the well so people find home."]] },
      { if: 'flag n_dawn', say: [["Every song I know is a happy one this week. It is very strange.", "All my songs are happy now."]] },
      { ask: ['How is Dell, out at sea?', 'How is Dell?'],
        say: ['At the end of the world, with a boat and a kettle. The happiest man alive.', 'Happy, with a boat and a kettle.'] },
      { idle: [['Hm? Hold on, I nearly had a tune.', 'Hold on. A tune!'], ["Go on. We're both good with scales.", 'Go on.']] },
      { bye: [['Mind how you go. And hum something.', 'Hum something!']] },
    ],

    // ---------------------------------------------------------------- Nana Pettibone, knitter; Captain Osric's mother
    nana: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I knitted you a black scarf for the mountain, so the Night Mother cannot see you. Neither can I. I have lost it.',
          'I knitted you a black scarf. Now I cannot find it.'],
        re: [
          { t: ['Knit me a bright one instead.', 'Knit me a bright one.'], tone: 'brave', f: 0.5, then: ['said nana_bright'],
            say: ['Bright? So she can see you coming? ...Yes. Let her see you coming, dear.', 'Bright? So she sees you coming? Yes!'] },
          { t: ["I'll help you look for it.", "I'll help you look."],
            say: ["In this dark? We'd lose each other. Sit down and have a biscuit instead.", 'In the dark? Sit and have a biscuit.'] },
        ] },
      { if: 'said nana_osric_write !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Osric walks past my window every hour with a lantern, all night. He says it\'s the Watch. I say he\'s checking on his mother.', 'Osric walks past every hour. He is checking on me.'],
        re: [
          { t: ['He is checking on you.', 'He is checking on you.'],
            say: ['I know, dear. I leave the curtain open so he can see I am knitting.', 'I know. I leave the curtain open.'] },
          { t: ['Did he ever write back?', 'Did he write back?'],
            say: ['Two pages, and one of them was about the dogs. I keep it in my apron.', 'Two pages. One about the dogs.'] },
        ] },
      { if: 'said nana_bright flag n_dawn', once: true,
        say: ['Your bright scarf is finished, dear. Orange, with a red stripe. You can see it from Brindlecross.', 'Your bright scarf is done. Orange and red!'],
        re: [
          { t: ["It's very bright, Nana.", "It's very bright."],
            say: ['That was the idea, dear. Nobody is going to lose you in that.', 'That was the idea. Nobody will lose you.'] },
          { t: ['Thank you, Nana.', 'Thank you, Nana.'], tone: 'kind', f: 0.5,
            say: ['Put it on. ...There. Now I can see you.', 'Put it on. There. Now I see you.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Found the black scarf. It was on the cat. The cat looks very sneaky in it.', 'The scarf was on the cat!'],
        re: [
          { t: ['Can the cat keep it?', 'Can the cat keep it?'],
            say: ["She's keeping it whether I like it or not.", 'She is keeping it anyway.'] },
          { t: ['Did you knit all night?', 'Did you knit all night?'],
            say: ['Seven sweaters and a hat for Moo-rgaret. She did not want the hat.', 'Seven sweaters. And a cow hat.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["I'm knitting faster in the dark. I can't see the mistakes.", "I knit faster in the dark."]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["I'm knitting you a moon for your sweater. It looks like a cheese.", "I knit you a moon. It looks like cheese."]] },
      { ask: ['Is my dragon sweater finished?', 'Is my sweater done?'],
        say: ['The dragon on it looks less like a turnip now. More like a parsnip. It is progress.', 'It looks like a parsnip now. Progress!'] },
      { ask: ['What did your husband do in the dark?', 'What did your husband do?'], if: '!flag n_dawn',
        say: ['Walked the lanes with a lantern and knocked on every door. "All well?" Every door.', 'He knocked on every door. "All well?"'] },
      { idle: [['Hold still, dear. I am measuring you again.', 'Hold still, dear.'], ['Sit, dear. What is it?', 'Sit. What is it?']] },
      { bye: [['Wrap up warm, dear.', 'Wrap up warm.']] },
    ],

    // ---------------------------------------------------------------- Hal Burrows, farmer
    hal: [
      // after the dawn: he sat up with Mom (said maren_window, set when Ash told her he heard her in the dark)
      { if: 'said maren_window flag n_dawn', once: true,
        say: ['Your mom sat up all night in the forge talking to a lantern. I sat with her. The lantern said nothing, which was good of it.',
          'Your mom talked to a lantern all night. I sat with her.'],
        re: [
          { t: ['Thank you for sitting with her.', 'Thank you for sitting with her.'], tone: 'kind', f: 0.75,
            say: ['She did it for me, the night Moo-rgaret had her calf. That is how it works.', 'She did it for me once. That is how it works.'] },
          { t: ['What did she say to it?', 'What did she say to it?'],
            say: ["That's between her and the lantern.", 'That is between her and the lantern.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Moo-rgaret will not come in from the field. She stands in the same spot all night, mooing at the sky.', 'My cow is waiting for the moon.'],
        re: [
          { t: ["She's calling the moon.", "She's calling the moon."],
            say: ["That's what I said. My wife says I'm soft. I'm soft.", 'That is what I said. I am soft.'] },
          { t: ['Want me to bring her in?', 'Shall I bring her in?'],
            say: ['You can try. She is heavier than she looks, and she looks heavy.', 'Try. She is heavier than she looks.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon came back and Moo-rgaret came in. She acted like it was her idea.', 'The moon is back. So is my cow.'],
        re: [
          { t: ['Maybe it was her idea.', 'Maybe it was.'], tone: 'silly',
            say: ["She'd agree with you. That's the trouble with her.", 'She would agree. That is the trouble.'] },
          { t: ['Can I give her a turnip?', 'Can I give her a turnip?'],
            say: ['Hold it flat, or she will take your arm with it.', 'Hold it flat.'] },
        ] },
      { if: '!flag n_dawn', say: [["Turnips are all still there. I checked. By feel.", "The turnips are still there."]] },
      { if: 'flag n_dawn', say: [["Moo-rgaret is back in her field, being smug.", "My cow is smug."]] },
      { ask: ['Does Ulf still write?', 'Does Ulf write?'],
        say: ['Twelve pages on cheese, and one line at the bottom: is the dragon boy back yet.', 'Twelve pages on cheese. And: is Ash back?'] },
      { ask: ['How do you farm in the dark?', 'How do you farm in the dark?'], if: '!flag n_dawn',
        say: ['Slowly. By feel. The turnips are all still there. I check them with my hands every morning.', 'By feel. The turnips are all there.'] },
      { idle: [["Still here. So's the cow.", 'Still here.'], ["Something else? I've a cow to see to.", 'I have a cow to see to.']] },
      { bye: [['Mind the cow pats. Mind the dark, too.', 'Mind the cow pats.']] },
    ],

    // ---------------------------------------------------------------- Bertram Crumb, the baker; Tilly's brother
    bertram: [
      { if: 'choice ending=heir !flag n_dawn', fact: 'n5_moon=gone',
        say: ["Your grandfather won't come off the oven shelf. He says the night is too cold for a dragon his size. I've given him the warm corner.",
          'Grandpa will not leave the oven shelf. It is too cold.'],
        re: [
          { t: ['Is he being polite to you?', 'Is he being polite?'],
            say: ['He said my buns were "adequate". I nearly fainted.', 'He said my buns were "adequate"!'] },
          { t: ['Give him the darkest bun.', 'Give him the darkest bun.'],
            say: ["I always do. He pretends it's an accident. So do I.", 'I always do. We both pretend.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["I baked a loaf shaped like the moon, so the village has one to look at. Best thing I've ever kneaded.", 'I baked a moon-shaped loaf.'],
        re: [
          { t: ['Can I have a slice of moon?', 'A slice of moon?'],
            say: ["A thin one. It's got to last.", 'A thin one. It must last.'] },
          { t: ['Tilly would love that.', 'Tilly would love it.'], if: 'quest bun done',
            say: ["Tilly said it's lopsided. She's right. I'm not telling her she's right.", 'Tilly says it is lopsided. She is right.'] },
        ] },
      { if: 'flag n_dawn choice n_end=moth', fact: 'n5_moon=back',
        say: ['Moon buns! Round and white, with a tiny grey sugar moth on every one. Rook has eaten six moths.', 'Moon buns with sugar moths!'],
        re: [
          { t: ['Save one for Tilly.', 'Save one for Tilly.'],
            say: ["I've saved her six. She'll say they're too sweet. Then she'll eat all six.", 'Six. She will say too sweet. Then eat them.'] },
          { t: ['Can I have a sugar moth?', 'Can I have a sugar moth?'],
            say: ["One. Rook has had six, and he's gone a funny colour.", 'One. Rook had six. He looks funny.'] },
        ] },
      { if: 'flag n_dawn choice n_end=embermoon', fact: 'n5_moon=back',
        say: ['Moon buns! Gold ones, with orange icing, like the new moon. I burnt the first tray on purpose. For luck.', 'Gold moon buns! Orange icing!'],
        re: [
          { t: ['Keep one back for Tilly.', 'Keep one for Tilly.'],
            say: ["I've saved her six. She'll say they're too sweet. Then she'll eat all six.", 'Six. She will say too sweet. Then eat them.'] },
          { t: ['You burnt them on purpose?', 'On purpose?'],
            say: ['Mostly on purpose. Some of it was luck.', 'Mostly. Some of it was luck.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Moon buns! With a little seam of icing round the middle, like the real one.', 'Moon buns, with icing seams!'],
        re: [
          { t: ['Put one by for Tilly.', 'Put one by for Tilly.'],
            say: ["I've saved her six. She'll say they're too sweet. Then she'll eat all six.", 'Six. She will say too sweet. Then eat them.'] },
          { t: ['Do the seams taste different?', 'Do the seams taste different?'],
            say: ["They taste of icing. That's all baking is, really.", 'They taste of icing. That is baking.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Two hundred buns in the oven, and every one shaped like a moon. Somebody has to keep the village fed.", "I keep baking moon buns."]] },
      { if: 'flag n_dawn', say: [["Fresh buns, and nobody sleeping on my floor. I almost miss it.", "Fresh buns! Nobody on my floor."]] },
      { ask: ['Where is everybody sleeping?', 'Where does everyone sleep?'], if: '!flag n_dawn',
        say: ["On my floor, half of them. The oven's the warmest place in the village.", 'On my floor. The oven is warm.'] },
      { ask: ['How is Tilly?', 'How is Tilly?'],
        say: ['She sent soup by Pebble. It arrived cold, and mostly spilled. It is the thought.', 'She sent soup by crow. It spilled. It is the thought.'] },
      { idle: [['Flour on my hands. Go on.', 'Go on.'], ['Breathe the other way, please. Yes?', 'Yes?']] },
      { bye: [['Take a bun for the road. Not that one. That one.', 'Take a bun!']] },
    ],

    // ---------------------------------------------------------------- Fennick Wick, the lamp man (Hob's cousin)
    fennick: [
      { if: 'choice fennick=forgive !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Every lantern in Emberhollow is lit, Ash. Every night, like I promised. Tonight they are all lit for you.', 'Every lantern is lit. All for you.'],
        re: [
          { t: ['You kept your promise.', 'You kept your promise.'], tone: 'kind', f: 0.75,
            say: ["I'm, um, getting good at that. I've been practising.", 'I am getting good at that.'] },
          { t: ['Do you need help with the high ones?', 'Need help with the high ones?'],
            say: ['Rook holds the ladder. He says he is my squire. I let him.', 'Rook holds the ladder. He is my squire.'] },
        ] },
      { if: 'choice fennick=jail !flag n_dawn', fact: 'n5_moon=gone',
        say: ["Captain Osric lets me light the Watch House lamps now. Both of them. It's the brightest building in Brindlecross.", 'I light the Watch House lamps now.'],
        re: [
          { t: ['Only two lamps?', 'Only two lamps?'],
            say: ["Two. I polish them every hour. They've never been so bright. Um. Nothing has.", 'Two. I polish them every hour.'] },
          { t: ['Do you miss your shop?', 'Do you miss your shop?'],
            say: ['Every night. Hob is minding it. He keeps selling my wicks at half price.', 'Every night. Hob minds it.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Lamp oil is selling fast. Everybody wants a light in the window.', 'Everyone wants a light in the window.'],
        re: [
          { t: ['Will there be enough?', 'Will there be enough?'],
            say: ["It'll have to be. I'm making wicks out of my old shirts.", 'It will have to be. I use old shirts.'] },
          { t: ['Give one to Mom.', 'Give one to Mom.'], tone: 'kind',
            say: ["She's bought twelve. I put a thirteenth in her basket. She doesn't know yet.", 'She bought twelve. I gave her one more.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['I kept a lamp in my window all night anyway. I think I always will.', 'I kept my lamp lit anyway.'],
        re: [
          { t: ["For whoever's out in the dark?", "For whoever's in the dark?"], tone: 'kind',
            say: ['Yes. Um. Exactly that. How did you know?', 'Yes! How did you know?'] },
          { t: ['You can blow it out now.', 'You can blow it out.'],
            say: ["I could. I'm not going to. I like it.", 'I could. I will not. I like it.'] },
        ] },
      { if: '!flag n_dawn', say: [["Wicks, oil, lamps. Um. Everything's for sale. Everything's cheap.", "Lamps! Wicks! Cheap!"]] },
      { if: 'flag n_dawn', say: [["The lamps are lit anyway. I like them lit.", "The lamps are lit anyway."]] },
      { ask: ['Do people trust you again?', 'Do people trust you now?'], if: 'choice fennick=forgive',
        say: ['Hal gave me a turnip. Nana knitted me a hat. I think that is a yes.', 'Hal gave me a turnip. Nana made me a hat. Yes!'] },
      { ask: ['Where do you get all the oil?', 'Where does the oil come from?'],
        say: ['Hob, mostly. He charges me double, then gives me half of it back.', 'From Hob. He charges double, then gives half back.'] },
      { idle: [['Um. Yes? Sorry. Yes?', 'Yes?'], ['A clean wick and good oil. What do you need?', 'What do you need?']] },
      { bye: [['Mind the wicks on your way out. Thank you. Sorry.', 'Bye! Sorry.']] },
    ],

    // ---------------------------------------------------------------- Pell the Peddler, the wagon on the market square
    pell: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Lanterns! Get your lanterns! Half price during the Long Night! Full price after. That is just business, little dragon.', 'Lanterns! Half price in the Long Night!'],
        re: [
          { t: ['Why only half price?', 'Why half price?'],
            say: ["Because people need them. Don't tell anyone I said that. It's bad for business.", 'Because people need them. Shh.'] },
          { t: ['Have you got any spare moons?', 'Got any spare moons?'], tone: 'silly',
            say: ['A moon-shaped cookie cutter. Lucky, they say. Who says? Me.', 'A moon cookie cutter. Lucky!'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["Lanterns, full price again! Somebody's got to be glad the night is over.", 'Lanterns, full price again!'],
        re: [
          { t: ['You sold them cheap for us.', 'You sold them cheap.'], tone: 'kind',
            say: ["Business, little dragon. ...It was a very good week for kindness, mind.", 'Business! ...A good week for kindness.'] },
          { t: ["What's the next big thing?", "What's next?"],
            say: ["Moon hats. Marigold's sold out, so I'm selling the boxes.", "Moon hats. I sell Marigold's boxes."] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Lanterns! Candles! Spare moons, out of stock!", "Lanterns! Candles!"]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["Moon hats, moon cutters, moon jars! It's only a phase, so buy now!", "Everything moon! Buy now!"]] },
      { ask: ['Did you sail at night, as a pirate?', 'Did pirates sail at night?'],
        say: ['Only at night. In the daytime the ducks could see us coming.', 'Only at night. The ducks saw us in the day.'] },
      { idle: [['Buying or browsing? Either is fine. Buying is finer.', 'Buying?'], ['Step up! What can I do you for?', 'Yes?']] },
      { bye: [['Come again! Bring coins!', 'Come again!']] },
    ],

    // ---------------------------------------------------------------- Minnow Fisk, Dell's daughter, on the dock
    minnow: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Dad says you are climbing a mountain made of night. Is it cold? Is it sticky?', 'Is the night mountain sticky?'],
        re: [
          { t: ['Cold. Not sticky.', 'Cold. Not sticky.'],
            say: ['Oh. I hoped it was sticky.', 'Oh. I hoped it was sticky.'] },
          { t: ["Your dad's waiting with his boat.", 'Your dad is waiting.'], tone: 'kind',
            say: ['He wrote. He says the kettle is on. The kettle is always on. That is how I know he is fine.', 'His kettle is on. So he is fine.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['You are back! Was it sticky? I bet it was sticky.', 'Was it sticky? I bet it was.'],
        re: [
          { t: ['A tiny bit sticky.', 'A tiny bit sticky.'], tone: 'silly',
            say: ['I knew it! I knew it!', 'I knew it!'] },
          { t: ['Your dad caught a homesick fish.', 'Your dad caught a sad fish.'],
            say: ['He wrote. I told him to throw it back. Homesick fish taste sad.', 'I told him to throw it back.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["I am skipping stones in the dark. I cannot see where they go.", "I skip stones in the dark."]] },
      { if: 'flag n_dawn', say: [["Seven bounces this morning! Dad would say six.", "Seven bounces!"]] },
      { ask: ['How far can you skip a stone?', 'How far do you skip stones?'],
        say: ["Seven bounces. Dad says six. Dad can't count bounces.", 'Seven bounces. Dad says six.'] },
      { idle: [['What? I am skipping stones.', 'What?'], ['Hi again. Watch this one.', 'Watch this one.']] },
      { bye: [['Bye! Bring me a sticky rock!', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Mayor Brindle, the Mayor's House
    mayor: [
      { if: 'choice morrow=jail !flag n_dawn', once: true,
        say: ['Morrow sends his regards from the Watch House. Captain Osric lets him grow potatoes in the yard.', 'Morrow grows potatoes at the Watch House.'],
        re: [
          { t: ['Are they good potatoes?', 'Are they good potatoes?'],
            say: ['Excellent potatoes. I find that very confusing.', 'Very good. I find that confusing.'] },
          { t: ['Is he sorry, do you think?', 'Is he sorry?'],
            say: ['He apologises to the potatoes. I think that is a start.', 'He says sorry to the potatoes. A start.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have declared the Long Night officially over. Nobody has told the sky. I am sending a strongly worded letter.', 'I told the sky the night is over. It did not listen.'],
        re: [
          { t: ['Who do you send it to?', 'Who gets the letter?'],
            say: ['Elder Yara. She knows everybody.', 'Elder Yara. She knows everyone.'] },
          { t: ['Did the sky write back?', 'Did the sky write back?'], tone: 'silly',
            say: ['Not yet. The sky has terrible manners.', 'Not yet. Terrible manners.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['There will be a parade for you, Ash, with ribbons. It is just Lantern Day with more cake, but it is official.', 'A parade for you! With cake!'],
        re: [
          { t: ['Can Duchess march in it?', 'Can Duchess march?'],
            say: ['The goat? ...She will march in it whether I say so or not.', 'She will march anyway.'] },
          { t: ['Do I have to wear a ribbon?', 'Must I wear a ribbon?'],
            say: ['One. On the horn. It will be very dignified.', 'One, on the horn. Very dignified.'] },
        ] },
      { if: '!flag n_dawn', say: [["I have cancelled the Long Night again. The sky is being very dark about it.", "I cancelled the Long Night again."]] },
      { if: 'flag n_dawn', say: [["Two hundred and twelve ribbons for the parade. Elder Yara checked.", "Two hundred ribbons for the parade!"]] },
      { ask: ['What would your ancestor have done?', 'What would your ancestor do?'],
        say: ['Named the dark after himself. The Brindle Dark. Nobody else would have called it that.', 'Named it after himself. Nobody else would.'] },
      { idle: [['Yes, yes? The Mayor is listening.', 'Yes?'], ['Speak up. The moustache is in the way.', 'Speak up.']] },
      { bye: [['Good day, Ash of Emberhollow!', 'Good day!']] },
    ],

    // ---------------------------------------------------------------- Nib, who sells "treasure maps" (mostly of his cat)
    nib: [
      { if: '!flag n_dawn',
        say: ["I drew a map of the Night Mother's mountain! It is a triangle with a moth on it. One coin.", 'A map of the night mountain! One coin.'],
        re: [
          { t: ['Juniper drew a real one.', 'Juniper drew a real one.'],
            say: ['Hers has rings. Mine has a cat on it. Mine is better.', 'Mine has a cat. Mine is better.'] },
          { t: ["I'll buy one. For luck.", "I'll buy one."], tone: 'kind',
            say: ["Pleasure doing business. Don't get lost. It is a very small map.", "Don't get lost. It is a small map."] },
        ] },
      { if: 'flag n_dawn',
        say: ["New map! The mountain, with a happy moon on top. Two coins. There's a cat on this one too.", 'New map! Two coins.'],
        re: [
          { t: ['Why did the price go up?', 'Why two coins?'],
            say: ['Because the moon is on it now. Moons are expensive.', 'The moon is on it. Moons cost more.'] },
          { t: ['Is that Duchess at the top?', 'Is that Duchess on top?'],
            say: ["That's my cat. Your goat is not on my map. Get your own map.", 'That is my cat. Not your goat.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Maps! Maps of the dark! They are very easy to draw.", "Maps of the dark! Easy to draw."]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["Maps! With cats! And a moon!", "Maps with cats and a moon!"]] },
      { ask: ['Does Tilly let you stay up?', 'Does Tilly let you stay up?'],
        say: ['All night, this week. She says somebody has to watch the door. I am the somebody.', 'All night. I watch the door.'] },
      { idle: [['Want a map? Want two?', 'Want a map?'], ['Hi. My cat says hi.', 'Hi.']] },
      { bye: [['Bye! Maps are half price on Thursdays! It is never Thursday.', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Gorran Flint, old foreman of Coppergulch Mine
    gorran: [
      { if: 'said gorran_asked_mom !flag n_dawn', once: true,
        say: ['Your mother wrote me before she sailed. One line: "Next spring." Forty years I have been waiting for next spring.', 'Your mom wrote: "Next spring." I have waited forty years.'],
        re: [
          { t: ['She means it this time.', 'She means it now.'], tone: 'kind',
            say: ["She'd better. I've dusted a chair.", 'She had better. I dusted a chair.'] },
          { t: ['Come to Lantern Day instead.', 'Come to Lantern Day.'],
            say: ['...Maybe I will. Somebody has to bring the star-iron.', 'Maybe I will. I will bring star-iron.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['My lads are sitting up with every lamp in Coppergulch lit, for you. Your mother would have my ears if we let them go out.', 'Every lamp in Coppergulch is lit for you.'],
        re: [
          { t: ['Thank the lads for me.', 'Thank the lads.'], tone: 'kind',
            say: ["Thank them yourself. They'd like that more than they'd say.", 'Thank them yourself. They would like it.'] },
          { t: ['Do rocks mind the dark?', 'Do rocks mind the dark?'],
            say: ["Rocks live in the dark. They're the only ones in the valley enjoying this.", 'Rocks live in the dark. They like it.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Word came down the road that you did it. I told the lads, "That\'s Maren\'s kid." Then I had to sit down for a bit.', "You did it! That's Maren's kid!"],
        re: [
          { t: ['Are you coming to Lantern Day?', 'Are you coming?'],
            say: ['I have been told I am. By your mother. In a letter. It said: "Come."', 'Your mother wrote: "Come." So yes.'] },
          { t: ['Has Quill measured it yet?', 'Has Quill measured it?'],
            say: ['Twice. She wrote to tell me how much moon there is. All of it, she says.', 'Twice. All of it, she says.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Rocks are fine in the dark. The lads are not. I sit with them.", "I sit with the lads in the dark."]] },
      { if: 'flag n_dawn', say: [["The picks are ringing again. Tell your mother.", "The picks ring again."]] },
      { ask: ['Did Quill send you a star chart?', 'Did Quill send a chart?'], if: '!flag n_dawn',
        say: ['She sent me a chart of the dark sky. It is a black page with one orange dot. The dot is you.', 'A black page with one orange dot. You.'] },
      { idle: [['Speak up. Rocks are louder than you.', 'Speak up.'], ['Mm. Go on. The rocks can wait.', 'Go on.']] },
      { bye: [['Mind your head. Rocks fall.', 'Mind your head.']] },
    ],

    // ---------------------------------------------------------------- Pick and Shovel, twin miners (one person in the game)
    pick: [
      { if: '!flag n_dawn',
        say: ['Shovel says the mountain is made of moon. I say it is made of night. We bet a pie on it.', 'We bet a pie on what the mountain is.'],
        re: [
          { t: ["It's neither. It's black glass.", 'It is black glass.'],
            say: ["Glass! Neither of us wins. ...We'll still eat the pie.", 'Nobody wins. We will still eat the pie.'] },
          { t: ['Which one of you is Shovel?', 'Which one is Shovel?'], tone: 'silly',
            say: ["That's what we're betting on next.", 'That is our next bet.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['Nobody won the pie bet. We ate the pie anyway.', 'Nobody won. We ate the pie.'],
        re: [
          { t: ['Was it a good pie?', 'Was it good pie?'],
            say: ['Half of it was. We disagree about which half.', 'Half of it. We argue about which.'] },
          { t: ["What's the next bet?", "What's the next bet?"],
            say: ['Whether the goat walked up or flew. We say flew. We both say flew. It is very confusing.', 'Did the goat fly? We both say yes.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["We went in as far as the second lamp. In the dark. That is very brave of us.", "We went to the second lamp. Brave!"]] },
      { if: 'flag n_dawn', say: [["We have had a meeting. We are less scared now.", "We had a meeting. Less scared now."]] },
      { ask: ['Have you gone back in the mine?', 'Back in the mine yet?'],
        say: ['Up to the third lamp. In the dark, the third lamp is very far.', 'Up to the third lamp. It is far.'] },
      { idle: [['We are listening. Both of us. One of us.', 'We are listening.'], ['Yes? We had a meeting. Go on.', 'Yes?']] },
      { bye: [['Bye! From both of us.', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Tamsin the Bard, at the Smoky Kettle
    tamsin: [
      { if: '!flag n_dawn',
        say: ['I am writing the last verse of your song. I need you to come back, so I know how it ends.', 'Come back, so I know how your song ends.'],
        re: [
          { t: ["What if it's a sad ending?", 'What if it is sad?'],
            say: ["Then I'll sing it softly. But I would rather not.", 'Then I sing it softly. I would rather not.'] },
          { t: ['Make it rhyme with moon.', 'Rhyme it with moon.'],
            say: ["Moon, soon, spoon, tune. I've had those for weeks. It's the middle I need.", 'I have the rhymes. I need the middle.'] },
        ] },
      { if: 'flag n_dawn choice n_end=moth',
        say: ['The last verse is about a little moth on a lantern. It makes everyone cry. Good crying.', 'My last verse makes everyone cry.'],
        re: [
          { t: ['Sing me the last verse.', 'Sing me the last verse.'],
            say: ["Not yet. It's for the green, on Lantern Day, with Wendel. You'll cry too.", 'Not yet. On Lantern Day. You will cry.'] },
          { t: ['Her name was Nyx.', 'Her name was Nyx.'],
            say: ["Nyx. Nothing rhymes with Nyx. ...Wicks. Lantern wicks. Oh, that's good.", 'Nyx... wicks! Lantern wicks! Good.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["I finished your song. Fourteen verses, and the last one rhymes \"moon\" with \"soon\". I'm keeping it.", 'I finished your song! Fourteen verses.'],
        re: [
          { t: ['Fourteen is a lot of verses.', 'Fourteen is a lot.'],
            say: ['Fifteen, if you count the one about the goat.', 'Fifteen, with the goat one.'] },
          { t: ['Am I in the last verse?', 'Am I in the last one?'],
            say: ["You're in every verse. The last one is mostly your mother.", 'Every verse. The last is your mother.'] },
        ] },
      { if: '!flag n_dawn', say: [["I sing at the Kettle every night, so travellers know where the warm is.", "I sing so travellers find the warm."]] },
      { if: 'flag n_dawn', say: [["Everyone wants your song. I'm hoarse. It's wonderful.", "Everyone wants your song!"]] },
      { ask: ['What rhymes with Nightfall?', 'What rhymes with Nightfall?'], if: '!flag n_dawn',
        say: ['Nothing that is kind. I have tried "night-sprawl" and "might fall". I am not using "might fall".', 'Nothing kind. "Might fall"? No.'] },
      { idle: [['Hm? I was counting syllables. Go on.', 'Go on.'], ['Speak, Emberblood. I need a rhyme.', 'Speak!']] },
      { bye: [['Go well, Emberblood. Make it a good verse.', 'Make it a good verse!']] },
    ],

    // ---------------------------------------------------------------- Granny Moss, the herbalist of the Mirefen
    moss: [
      { if: 'choice morrow=free !flag n_dawn', fact: 'n5_moon=gone',
        say: ["That old High Priest is sitting up with his pumpkins all night, holding a lamp over them. He says they're scared of the dark.",
          'Old Morrow holds a lamp over his pumpkins all night.'],
        re: [
          { t: ['Are they scared?', 'Are the pumpkins scared?'],
            say: ["They're pumpkins, child. He is. Let him have the lamp.", 'They are pumpkins. He is scared. Let him.'] },
          { t: ['I could sit with him.', 'I could sit with him.'], tone: 'kind',
            say: ["Sir Croaksley already does. They don't talk. It seems to help them both.", 'My frog sits with him. It helps.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Moonlilies sleep when the moon does, child. All of them. Even the mean ones by the bog.', 'The moonlilies all sleep now.'],
        re: [
          { t: ['Will they wake up?', 'Will they wake up?'],
            say: ["When it comes back. Flowers aren't fools.", 'When it comes back. Flowers are not fools.'] },
          { t: ['Mabel says hers are shut too.', 'Mabel says hers are shut.'],
            say: ['She writes it every day by crow. I write back the same. We are very cheerful about it.', 'We write it every day. Very cheerful.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The frogs are singing again, every one of them out of tune. I never heard anything so lovely.', 'The frogs sing again!'],
        re: [
          { t: ['Sir Croaksley too?', 'Sir Croaksley too?'],
            say: ["Loudest of the lot. He's had a whole Long Night to practise.", 'The loudest. He practised all night.'] },
          { t: ['Are your knees any better?', 'How are your knees?'],
            say: ['Worse. I danced. Mabel will have words.', 'Worse. I danced!'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Sit by the fire, child. Not in it. The dark is long enough without you smouldering.", "Sit by the fire, child."]] },
      { if: 'flag n_dawn', say: [["The bog is singing again, child. Sit and listen.", "The bog sings again."]] },
      { ask: ['What helps a scared person, Granny?', 'What helps a scared person?'],
        say: ['A warm cup, and nobody telling them not to be. Then the cup goes cold and they forget they were.', 'A warm cup. And nobody saying "don\'t be".'] },
      { idle: [['Sit, child. By the fire, not in it.', 'Sit, child.'], ['Mm. Go on, child.', 'Go on.']] },
      { bye: [['Mind the bog, child. It minds you.', 'Mind the bog.']] },
    ],

    // ---------------------------------------------------------------- Morrow, once High Priest of the Scaled Oath
    // He listened to a voice in his dreams (her dust was in the Oath's black candles). Freed: pumpkins in the Mirefen.
    // Jailed: potatoes in the Watch House yard.
    morrow: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["I listened to a voice in my dreams once, and it ended badly. I'm listening to you now. That feels different.", 'I listened to a dream voice once. Now I listen to you.'],
        re: [
          { t: ['Does she still talk to you?', 'Does she still talk to you?'],
            say: ['Not since you lit the Ward. I sleep like a stone now. It is wonderful.', 'No. I sleep like a stone now.'] },
          { t: ['What did the voice say?', 'What did the voice say?'],
            say: ['That I was special. That is how she starts, every time. Remember that, up there.', 'That I was special. That is how she starts.'] },
        ] },
      { if: 'flag n_dawn choice morrow=free', fact: 'n5_moon=back',
        say: ["I keep my hands in the dirt these days. Dirt doesn't care about moons or dragons. It's very restful.", 'I dig in the dirt now. Very restful.'],
        re: [
          { t: ['Your pumpkins look huge.', 'Your pumpkins are huge.'],
            say: ['The new moonlight did that. I am entering them at the fair.', 'The new moonlight did it. I will enter the fair.'] },
          { t: ['Are you happy, Morrow?', 'Are you happy?'],
            say: ['I think so. It took me a long time to notice.', 'I think so. It took a long time.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["I keep my hands in the dirt these days. Captain Osric says my potatoes are the best thing in his yard.", 'My potatoes are the best in the yard.'],
        re: [
          { t: ['Are you sorry, Morrow?', 'Are you sorry?'],
            say: ['Every day. Then I water the potatoes. It helps a little.', 'Every day. Watering helps a little.'] },
          { t: ['Osric says they are good.', 'Osric says they are good.'],
            say: ['My potatoes. He only owns the yard.', 'My potatoes. His yard.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["The pumpkins are scared of the dark. So am I. We sit together.", "The pumpkins and I sit in the dark."]] },
      { if: 'flag n_dawn', say: [["Hands in the dirt. That is all I need now.", "Hands in the dirt."]] },
      { ask: ['Why did you listen to her?', 'Why did you listen?'],
        say: ['Because nobody else was saying anything to me at all. She knows how to find the lonely ones, Ash. Mind that, up there.', 'Nobody else talked to me. She finds lonely people.'] },
      { idle: [['Hm? Mind the seedlings.', 'Mind the seedlings.'], ['Yes, Ash?', 'Yes?']] },
      { bye: [['Go on. I will keep digging.', 'I will keep digging.']] },
    ],

    // ---------------------------------------------------------------- Ulf Hollis, hunter at Frostpine Lodge
    ulf: [
      { if: 'quest q_n5_follower active !solved n5_who_follows',
        say: ['My brother says his goat has gone walkabout again. You never hear that about a sheep.', 'Sheep never wander off.'],
        re: [
          { t: ['Sheep wander too.', 'Sheep wander too.'],
            say: ['Sheep wander to the next bit of grass. Goats wander to the moon.', 'Sheep go to the grass. Goats go to the moon.'] },
          { t: ['Have you seen Duchess?', 'Have you seen Duchess?'],
            say: ["Prints in the snow on the ridge, going up. Straight up. I didn't follow. I'm not a goat.", 'Prints in the snow, going straight up.'] },
        ] },
      { if: 'choice greymane=home !flag n_dawn', fact: 'n5_moon=gone',
        say: ['The pack howls at the empty sky every night, Greymane at the front. I think he is calling for it.', "Greymane's pack howls at the empty sky."],
        re: [
          { t: ["He's calling the moon home.", 'He is calling the moon.'],
            say: ["Then I'll howl with him. I'm not proud.", 'Then I will howl too. I am not proud.'] },
          { t: ['Is the pack all right?', 'Is the pack all right?'],
            say: ['Thin and cross, like the rest of us. They will mend.', 'Thin and cross. They will mend.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["No moon! Ha! Fifty years up here and I've never had to light a lamp to find my own door.", 'No moon! I need a lamp to find my door!'],
        re: [
          { t: ['Sheep are still the sensible choice.', 'Sheep are still sensible.'], if: 'said ulf_sheep', tone: 'kind',
            say: ['The only sensible thing anybody has said all week!', 'The only sensible thing all week!'] },
          { t: ['Do you need a light?', 'Do you need a light?'],
            say: ["Breathe on the lamp, then. Gently! ...There. That's a good lad.", 'Breathe on it. Gently! There.'] },
          { t: ['Is Elka home for supper?', 'Is Elka home for supper?'], if: 'said elka_supper', tone: 'kind',
            say: ["Six o'clock, every night since you told her. She rolls her eyes. She comes.", 'At six, every night. She rolls her eyes.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The pack howled the moon up. I howled with them. Hollis heard me from the farm.', 'The wolves howled. So did I!'],
        re: [
          { t: ['I heard it from the mountain.', 'I heard it from the mountain.'],
            say: ['Did you! Ha! Then it was worth it.', 'Ha! Then it was worth it.'] },
          { t: ["Hollis howls at the goat.", 'Hollis howls at the goat.'], tone: 'silly',
            say: ['Ha! He does! Every night she is out.', 'Ha! He does!'] },
        ] },
      { if: '!flag n_dawn', say: [["Goats climb anything, you know. Anything. Sheep stay on the ground where they belong.", "Goats climb anything. Sheep do not."]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["Ha! The moon! I keep looking up at it. My neck hurts.", "I keep looking at the moon!"]] },
      { ask: ["How is Hal's cheese?", "How is Hal's cheese?"],
        say: ["Hal writes that his cheese is sulking in the dark. I told him cheese doesn't sulk. He says his does.", 'Hal says his cheese sulks.'] },
      { ask: ['Is Elka behaving?', 'Is Elka behaving?'],
        say: ['Elka? Behaving? She is waxing her sled for a mountain.', 'She is waxing her sled for a mountain.'] },
      { idle: [['What? Speak up! The mountains are big!', 'Speak up!'], ['Ha! Go on, then!', 'Go on!']] },
      { bye: [['Mind the snow! It takes your words away!', 'Mind the snow!']] },
    ],

    // ---------------------------------------------------------------- Elka, sled racer at Frostpine Lodge (a kid)
    elka: [
      { if: 'quest f_sled done !flag n_dawn',
        say: ['Faster than a wolf, Ash! That is how you climb a mountain!', 'Faster than a wolf, Ash!'],
        re: [
          { t: ["I'll race you down it after.", "I'll race you down it."], tone: 'brave',
            say: ['Deal! Dad says no. Dad is not the boss of mountains.', 'Deal! Dad says no. I say yes.'] },
          { t: ['Uphill is slower than sledding.', 'Uphill is slower.'],
            say: ['Then go faster uphill! It is simple!', 'Then go faster!'] },
        ] },
      { if: '!flag n_dawn',
        say: ["When you are done, I am sledding down the Night Mother's mountain. Dad says no. Dad is not the boss of mountains.", 'I want to sled down the night mountain!'],
        re: [
          { t: ['The whole mountain is glass.', 'It is all glass.'],
            say: ['GLASS? That is the fastest thing there is!', 'Glass! So fast!'] },
          { t: ['Ask your dad again tomorrow.', 'Ask him again tomorrow.'],
            say: ['I ask him every day. One day he will be too tired to say no.', 'Every day. One day he will say yes.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['Dad still says no about the mountain. I am asking again tomorrow.', 'Dad still says no. I will ask again.'],
        re: [
          { t: ['Duchess got to the top.', 'Duchess got to the top.'],
            say: ['A GOAT went up and I cannot? That is the most unfair thing that has ever happened.', 'A goat went up? So unfair!'] },
          { t: ['The glass has gone clear now.', 'The glass is clear now.'],
            say: ['Clear glass is even faster. I am telling Dad.', 'Even faster! I will tell Dad.'] },
        ] },
      { if: '!flag n_dawn', say: [["When you're done up there, I'm sledding down it. That's decided.", "I will sled down it!"]] },
      { if: 'flag n_dawn', say: [["Faster than a wolf! I mean it!", "Faster than a wolf!"]] },
      { ask: ['Does Rook still write to you?', 'Does Rook write?'],
        say: ["Every day! He says he's guarding the green. I said I'm guarding the mountain. We're both guarding.", 'He guards the green. I guard the mountain.'] },
      { idle: [['Quick! I am going sledding!', 'Quick!'], ['What? Race me after!', 'What?']] },
      { bye: [['Bye! Go fast!', 'Go fast!']] },
    ],

    // ---------------------------------------------------------------- Brisket, a retired adventurer (thawed by Ash)
    // (v12 PEAK) A Brisket who is still Ash's Act I companion walks up the peak with him (his talk there needs near
    // n5_peak); otherwise he guards the Lodge fire.
    brisket: [
      { if: 'near n5_peak 6500 flag n_gather',
        say: ['Four hundred jokes, one for every adventure, and I cannot think of a single one for this.', 'I have no joke for this one.'],
        re: [
          { t: ["Then don't tell one.", "Then don't tell one."],
            say: ['Right. I shall stand here being brave, then. Quietly. That is new for me.', 'Right. I will be brave. Quietly.'] },
          { t: ['You came all this way.', 'You came all this way.'], tone: 'kind',
            say: ['These old knees came all this way. They will tell me about it tomorrow.', 'My old knees came all this way.'] },
        ] },
      { if: 'near n5_peak 6500 !flag n_gather',
        say: ['Brisket the Bold, up a mountain made of night. Nobody at the Lodge will believe a word of it.', 'Brisket the Bold, up a night mountain!'],
        re: [
          { t: ['Are you cold up here?', 'Are you cold up here?'],
            say: ['I was an ice cube for years, lad. This is a warm day.', 'I was ice for years. This is warm.'] },
          { t: ['Is it like your old adventures?', 'Like your old adventures?'],
            say: ['Worse. My old adventures stopped for a sandwich at lunch.', 'Worse. Mine stopped for lunch.'] },
        ] },
      { if: 'near n5_peak 6500', say: ['My knees have opinions about this mountain.', 'My knees do not like this mountain.'] },
      { if: 'near n5_peak 6500', idle: [['Mm? Keep talking, lad. It stops my teeth chattering.', 'Keep talking, lad.'], ["Go on. I'm guarding your back.", 'I am guarding your back.']] },
      { if: 'near n5_peak 6500', bye: [["Lead on, lad. I'm right behind you.", "Lead on. I'm behind you."]] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["I retired from adventuring to be warm. Then somebody ate the moon. I've un-retired. A bit. Up to the knees.", 'I retired. Then the moon went. Now I am a bit un-retired.'],
        re: [
          { t: ['Want to come up the mountain?', 'Come up the mountain?'],
            say: ["Up? I've been frozen inside a mountain once. I'll guard the fire here. Somebody has to.", 'I was frozen once. I will guard the fire.'] },
          { t: ["What's the warmest thing you know?", "What's the warmest thing?"],
            say: ['A fire, a blanket, and nobody asking me to climb anything.', 'A fire, a blanket, and no climbing.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["The moon's back and the fire's lit. I have never been so warm. I may never move again.", 'The moon is back. I am so warm.'],
        re: [
          { t: ['Tell me an adventure story.', 'Tell me a story.'],
            say: ['Once upon a time, I sat by a fire. The end. It is my favorite one.', 'I sat by a fire. The end. My favorite.'] },
          { t: ['Ulf says you snore.', 'Ulf says you snore.'], tone: 'silly',
            say: ['Ulf says a lot of things. Loudly.', 'Ulf says lots of things.'] },
        ] },
      { if: '!flag n_dawn', say: [["I'm guarding the Lodge fire. It's going very well.", "I am guarding the fire."]] },
      { if: 'flag n_dawn', say: [["Still warm. Still not moving. Ice to be warm, isn't it?", "Still warm."]] },
      { ask: ['Were you ever scared, adventuring?', 'Were you ever scared?'],
        say: ['Every day. Then one day I was frozen, and I was not anything at all. Scared is better.', 'Every day. Frozen was worse. Scared is better.'] },
      { idle: [['Mm? Shut the door. The warm gets out.', 'Shut the door.'], ['Still warm. Go on.', 'Go on.']] },
      { bye: [['Stay warm, lad.', 'Stay warm.']] },
    ],

    // ---------------------------------------------------------------- Sister Wren, the librarian (a story lead)
    // Bookish, eager, out of her depth outdoors; seasick all the way to Moonfall. Writing "The Account of the Long Night".
    wren: [
      { if: 'quest m_leash active item m_book_raw',
        say: ['Is that the Book of Moths? Oh, give it here, give it here. Carefully!', 'Is that the Book of Moths? Give it here!'] },
      { if: 'flag m_page11', once: true,
        say: ["I have two page elevens now. One is framed. The other sleeps under my pillow, but don't tell anyone.", 'I sleep with page eleven. Shh.'],
        re: [
          { t: ["I won't tell anyone, Wren.", "I won't tell."],
            say: ['Thank you. Ripple knows. Ripple forgets everything, so that is all right.', 'Thank you. Ripple knows. He forgets.'] },
          { t: ['Can I see the framed one?', 'Can I see it?'],
            say: ["When you're home. It hangs over my desk. I say good morning to it.", 'At home. Over my desk.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have read every book about the moon. Not one says what to do when somebody eats it. I am writing that one myself.', 'No book says what to do. I am writing one.'],
        re: [
          { t: ["What's chapter one called?", "What's chapter one?"],
            say: ['"I Was Seasick." It is a very honest book.', '"I Was Seasick." Very honest.'] },
          { t: ['Put Pip in it.', 'Put Pip in it.'], tone: 'silly', if: 'flag pip',
            say: ['Pip has a whole chapter. It is one word long. "Mip."', 'Pip has a chapter. One word: "Mip."'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['I have finished the last chapter. It is called "Ash Came Home." I wrote it this morning, and I cried on it a bit.', 'My last chapter: "Ash Came Home." I cried on it.'],
        re: [
          { t: ['Am I on page eleven?', 'Am I on page eleven?'],
            say: ['Page eleven, and about a hundred others. I could not stop.', 'Page eleven. And a hundred more.'] },
          { t: ['Has Yara checked it?', 'Did Yara check it?'],
            say: ['She found four spelling mistakes and one dragon I made up. I am keeping the dragon.', 'Four mistakes. One made-up dragon. I kept it.'] },
        ] },
      { if: '!flag n_dawn', say: [["I am writing by one candle. My eyes have gone small.", "I am writing by one candle."]] },
      { if: 'flag n_dawn', say: [["The book is finished. I keep adding things to it.", "The book is done. I keep adding to it."]] },
      { ask: ['Do you know anything about moon-silk?', 'Do you know about moon-silk?'], if: 'quest q_n5_hush active !flag m_leash_known',
        say: ['The moon-priests of Lumen wrote about it. Their books are in the Drowned Library, under the sea, in Moonfall.', 'The moon-priests wrote about it. Their books are under the sea.'] },
      { ask: ['Are you still seasick?', 'Are you still seasick?'],
        say: ['Only on boats, rafts, piers and certain hills.', 'Only on boats. And piers. And hills.'] },
      { ask: ['What will you do after the book?', 'What after the book?'],
        say: ['Go home and never sail again. Then, probably, sail again.', 'Go home. Then probably sail again.'] },
      { idle: [["Mm? Sorry. I was on a good page.", 'Mm? Sorry.'], ['Go on. I am taking notes.', 'Go on.']] },
      { bye: [['Mind the steps. Books are heavy, and so are you.', 'Mind the steps.']] },
    ],

    // ---------------------------------------------------------------- Tilly Crumb, the Sleepy Salmon Inn
    tilly: [
      { if: '!flag n_dawn',
        say: ["The Sleepy Salmon has a bed for you whenever you need it, and there's soup on, with Bertram's bread.", 'A bed for you, any time.'],
        re: [
          { t: ["Bertram's bread? You're speaking?", "You and Bertram speak now?"], if: 'quest bun done',
            say: ['Speaking, arguing, same thing. He sends a loaf every day by Pebble.', 'Speaking, arguing. He sends bread.'] },
          { t: ['Soup first, then the mountain.', 'Soup first.'],
            say: ["That's the rule. Sit.", 'That is the rule. Sit.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['Free soup for the dragon who brought the moon home! Do not tell Pell.', 'Free soup for you! Shh.'],
        re: [
          { t: ['What kind of soup?', 'What soup?'],
            say: ['Leek. Your mother finally wrote me her recipe.', 'Leek. Your mom wrote me her recipe.'] },
          { t: ['Pell gave lanterns away cheap.', 'Pell sold lanterns cheap.'],
            say: ['Pell? Cheap? ...The world really has changed.', 'Pell? The world has changed!'] },
        ] },
      { if: '!flag n_dawn', say: [["Soup is on, and the door is open, all night.", "Soup is on all night."]] },
      { if: 'flag n_dawn', say: [["Every room is full of people walking home. I love it.", "The inn is full again!"]] },
      { ask: ['Is Nib behaving?', 'Is Nib good?'],
        say: ['He made a sign for the door: OPEN ALL NITE. I have not told him.', 'He made a door sign. He spelled it wrong.'] },
      { ask: ['Does Professor Quill still come down for soup?', 'Does Quill come for soup?'],
        say: ['Every night, with her notebook. She measures the soup. I do not ask.', 'Every night. She measures the soup.'] },
      { idle: [['Soup first. Then talk.', 'Soup first.'], ['Sit down, you are dripping on my floor. What is it?', 'Sit. What is it?']] },
      { bye: [['Mind the step. Come back hungry.', 'Come back hungry.']] },
    ],

    // ---------------------------------------------------------------- Captain Osric Pettibone, the Brindlecross Watch
    osric: [
      { if: 'choice fennick=jail', once: true,
        say: ['My prisoner has polished every lamp in the Watch House twice. They have never been so shiny. I may keep him.', 'My prisoner polishes the lamps.'],
        re: [
          { t: ['Is Fennick all right in there?', 'Is Fennick okay?'],
            say: ['He says he likes the quiet. He says sorry to the dogs every morning.', 'He likes the quiet. He says sorry to the dogs.'] },
          { t: ['There are only two lamps.', 'There are only two lamps.'],
            say: ['He knows. He polishes them twice, so it feels like four.', 'He polishes them twice. Like four.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["The Watch is on duty all night. That's me and the two dogs, and none of us has blinked.", 'The Watch is awake. Me and two old dogs.'],
        re: [
          { t: ['Do the dogs mind the dark?', 'Do the dogs mind?'],
            say: ["Pepper doesn't mind anything. Old Tom keeps looking at the sky and sighing. So do I.", 'Old Tom sighs at the sky. So do I.'] },
          { t: ['You walk past Nana\'s window.', 'You walk past Nana\'s window.'], if: 'said nana_osric_write',
            say: ['Every hour, with a lantern. She leaves the curtain open so I can see her knitting.', 'Every hour. She leaves the curtain open.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The dogs howled when the moon came back. So did I. Do not put that in a song.', 'The dogs howled. So did I. Shh.'],
        re: [
          { t: ['Tamsin already has.', 'Tamsin already did.'], tone: 'silly',
            say: ["Then I'm moving to the Mirefen.", 'Then I am moving away.'] },
          { t: ['Old Tom howled too?', 'Old Tom too?'],
            say: ['He howled first. He was captain before me. He knows how.', 'He went first. He was captain before me.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["All quiet. Very dark. Very quiet.", "All quiet. Very dark."]] },
      { if: 'flag n_dawn', say: [["All quiet again. The good kind.", "All quiet. The good kind."]] },
      { ask: ['Who keeps watch on the Watch?', 'Who watches the Watch?'],
        say: ['Mum. From her window. She is very strict.', 'Mum. From her window.'] },
      { idle: [['Report. ...Sorry. Habit. What is it?', 'What is it?'], ['I just stand in front of things. Go on.', 'Go on.']] },
      { bye: [['Stay where the lamps are, Ash.', 'Stay by the lamps.']] },
    ],

    // ---------------------------------------------------------------- Marigold Vane, Vane's Fine Hats; Hob's twin
    marigold: [
      { if: '!flag n_dawn',
        say: ['A hat for the mountain? Black, with a brim, so no moth lands on your horns. No? Your loss.', 'A hat for the mountain? No? Your loss.'],
        re: [
          { t: ['Moths quite like me now.', 'Moths like me now.'],
            say: ["Then a hat with a little perch on it. ...I'm writing that down.", 'Then a hat with a perch! I will write that down.'] },
          { t: ['Is Gerald all right in the dark?', 'Is Gerald all right?'],
            say: ["Gerald is asleep. Gerald is always asleep. He's the only one in Brindlecross who is well rested.", 'Gerald sleeps. He always sleeps.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["Everyone wants a moon hat now. I can't stitch them fast enough.", 'Everyone wants a moon hat now.'],
        re: [
          { t: ['Make one for Duchess.', 'Make one for Duchess.'], tone: 'silly',
            say: ["With holes for the horns. I've already started.", 'With horn holes. I already started.'] },
          { t: ['Hob would buy one.', 'Hob would buy one.'],
            say: ['Hob would lose one. That makes nine scarves and a hat.', 'Hob would lose it.'] },
        ] },
      { if: '!flag n_dawn', say: [["Hoods are selling. Black ones. I have run out of black.", "Black hoods are selling."]] },
      { if: 'flag n_dawn', say: [["Bright hats only this week. I've decided.", "Bright hats only now!"]] },
      { ask: ['Did Nana help with the hats?', 'Did Nana help?'],
        say: ['She knitted the linings. Every one has a pocket. Every gift needs a pocket, she says.', 'She knitted the linings. With pockets.'] },
      { idle: [['Stand still. Hat size. Go on.', 'Stand still.'], ['Yes? Mind the feathers.', 'Yes?']] },
      { bye: [['Off you go. Hold your head up. It shows off the horns.', 'Head up!']] },
    ],

    // ---------------------------------------------------------------- Cookie, the Cook Shack at Coppergulch
    cookie: [
      { if: '!flag n_dawn',
        say: ['Rock Soup! Long Night Rock Soup. Same as normal Rock Soup, but you eat it in the dark.', 'Rock Soup! You eat it in the dark.'],
        re: [
          { t: ['How do you find the rocks?', 'How do you find the rocks?'],
            say: ["By feel. The lads say it tastes the same. They're right, and I'm hurt.", 'By feel. The lads say it tastes the same.'] },
          { t: ["Your gran's long-winter recipe?", "Your gran's recipe?"],
            say: ['From the long winter, when there was nothing but the dark and a rock. She would laugh at me now.', 'Yes. She would laugh at me now.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["Moonrise Rock Soup! It's the same soup. I put a white pebble on top.", 'Moonrise soup! A white pebble on top.'],
        re: [
          { t: ['Do I eat the pebble?', 'Do I eat the pebble?'], tone: 'silly',
            say: ['Only if you want to see Mabel.', 'Only if you want to see Mabel.'] },
          { t: ['Is Gorran coming to Lantern Day?', 'Is Gorran coming?'],
            say: ["He's packed. He's unpacked. He's packed again. He's coming.", 'He packed three times. He is coming.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Soup. In the dark. It is still soup.", "Soup in the dark."]] },
      { if: 'flag n_dawn', say: [["Soup. In the light. Still soup.", "Soup in the light."]] },
      { ask: ['Is Gorran eating?', 'Is Gorran eating?'],
        say: ['Gorran eats when he is worried. He has had four bowls.', 'He eats when worried. Four bowls.'] },
      { idle: [['Hungry? You look hungry.', 'Hungry?'], ["Sit. Soup's on, and it rocks.", 'Sit.']] },
      { bye: [['Take a rock for luck!', 'Take a rock!']] },
    ],

    // ---------------------------------------------------------------- Hob Vane, the Smoky Kettle on the Ashen Road
    hob: [
      { if: '!flag n_dawn',
        say: ['The Smoky Kettle stays open all night. There is no other kind of night just now.', 'We are open all night.'],
        re: [
          { t: ['Any cultists on the road?', 'Any cultists?'],
            say: ["Not one. Nobody's on a road in the dark but travellers and owls. I feed both.", 'None. Just travellers and owls. I feed both.'] },
          { t: ['Has Marigold sent another scarf?', 'Another scarf from Marigold?'], if: 'said marigold_scarves',
            say: ["Number ten. I gave it to a shivering traveller an hour ago. She'll start on eleven.", 'Number ten. I gave it away.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["The road's busy again. Everybody walking home at once, and they all want stew.", 'Everyone is walking home. They all want stew.'],
        re: [
          { t: ["What's in the stew today?", "What's in the stew?"],
            say: ['Everything I had left. It is the best stew I have ever made, and I will never make it again.', 'Everything left. Best stew ever.'] },
          { t: ['Tamsin finished my song.', 'Tamsin finished my song.'],
            say: ["I know. She's sung it eleven times tonight. The last verse makes me blow my nose.", 'She sang it all night. I cried.'] },
        ] },
      { if: '!flag n_dawn', say: [["Kettle on, door open, stew hot.", "Kettle on, door open."]] },
      { if: 'flag n_dawn', say: [["Stew for everybody. Sit anywhere.", "Stew for everybody!"]] },
      { ask: ['How is Fennick?', 'How is Fennick?'], if: 'choice fennick=forgive',
        say: ['He writes twice a week now. He signs it "your cousin, the light-man". He has never been so pleased with himself.', 'He signs his letters "the light-man".'] },
      { idle: [['Come in out of the smoke! What is it?', 'What is it?'], ['Mind the kettle. Go on.', 'Go on.']] },
      { bye: [['Mind the road! Come back for stew!', 'Come back for stew!']] },
    ],

    // ======================================================================= map 1, the Clockwork Coast (Act II's people)
    // (J12) The coast knows Ash from the summer of the Moth Mask. Without a moon the tides are muddled and the clocks feel
    // wrong; after the dawn the tide is boring again, which is all anybody here wanted.

    // ---------------------------------------------------------------- Granny Oona, Vesper's gran, the Stilt House
    // Seventy years cold, unbothered, sharp; "duck" is hers alone. Her errands (q_n5_oona, q_n5_vesper) are talk steps
    // that play ahead of all of this.
    c_oona: [
      // Fig across the harbor (said fig_asked_oona: Ash asked her how Oona was)
      { if: 'said fig_asked_oona !flag n_dawn', once: true,
        say: ["Fig says you asked after me. She sent a scone across the harbor to check I was still breathing. I am. The scone isn't.", 'Fig sent a scone to check on me. I ate it.'],
        re: [
          { t: ['Fig worries about you.', 'Fig worries about you.'], tone: 'kind',
            say: ['Seventy years, duck. Somebody has to. I worry about her back, and she worries about the rest of me.', 'Seventy years. We worry about each other.'] },
          { t: ['Was it a good scone?', 'Was it a good scone?'], tone: 'silly',
            say: ['Burnt on the bottom. Fig always burns the bottom. It was perfect.', 'Burnt. It was perfect.'] },
        ] },
      { if: 'quest q_n5_oona done !flag n_dawn', once: true, fact: 'n5_moon=gone',
        say: ["She's coming home for tea after. You said so, duck, and I believe you.", 'She will come home for tea!'],
        re: [
          { t: ["She'll even wear the scarf.", 'She will wear the scarf.'],
            say: ["She'll say she won't. Then she will. That's my Vesper.", 'She will say no. Then she will. That is Vesper.'] },
          { t: ['Put the kettle on for three.', 'Make tea for three.'], tone: 'kind', f: 0.5,
            say: ["Three? ...Oh, you mean you. Bring your own cup, duck. I've only got two.", 'Three? Bring your own cup, duck.'] },
        ] },
      { if: 'flag n_dawn flag n5_tea', fact: 'n5_moon=back',
        say: ['She came home for tea, duck. Ate eleven biscuits and wore the scarf the whole time.', 'She came home! Eleven biscuits!'],
        re: [
          { t: ['Was the tea strong enough?', 'Was the tea strong?'],
            say: ["Strong enough to stand a spoon in. She drank three cups and never made a face. That's how I knew.", 'Very strong. She drank it all. Then I knew.'] },
          { t: ['Did she sit in the warm chair?', 'The warm chair?'], tone: 'kind',
            say: ["All afternoon, duck. I sat on the cold one, and I didn't mind a bit.", 'All day. I sat on the cold one. I did not mind.'] },
        ] },
      { if: { all: ['flag n_dawn', { any: ['flag n5_vesper', 'choice c_vesper=friend'] }] }, fact: 'n5_moon=back',
        say: ["My Vesper sent word by gull. She'll be home for tea on Sunday. The gull bit me.", 'Vesper is coming for tea on Sunday!'],
        re: [
          { t: ["She'll come this time, Granny Oona.", 'She will come this time.'], tone: 'kind',
            say: ["I know. I've baked the biscuit already. It'll keep. They always keep.", 'I know. The biscuit is baked. It will keep.'] },
          { t: ['Make the tea extra strong.', 'Make it extra strong.'],
            say: ["She'll drink every drop and say it's terrible. That's how she says thank you.", 'She will drink it all and say it is terrible.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['There was a fish on my step this morning, duck. With a bow on it.', 'A fish was on my step. With a bow.'],
        re: [
          { t: ['From Vesper?', 'From Vesper?'],
            say: ['Nobody else ties a bow like that. I taught her.', 'Nobody else ties that bow. I taught her.'] },
          { t: ['But you hate fish.', 'But you hate fish.'], if: 'said oona_fish',
            say: ["I do. I've never been so pleased in my life.", 'I do. I have never been so pleased.'] },
        ] },
      { if: '!flag n5_vesper !flag n_dawn', fact: 'n5_moon=gone',
        say: ['My Vesper has gone up that mountain. I know she has. She always goes where the trouble is.', 'My Vesper went up that mountain.'],
        re: [
          { t: ["I'll bring her home, Granny Oona.", "I'll bring her home."], tone: 'kind', f: 0.75,
            say: ['I know you will, duck. Bring her back cold if you have to. I can warm cold.', 'I know. Bring her back. I can warm cold.'] },
          { t: ['How do you know she went?', 'How do you know?'],
            say: ['Her boots are gone, and her good rope, and every biscuit in the tin.', 'Her boots and rope are gone. And the biscuits.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have the kettle on all night. Somebody might come home cold.', 'The kettle is on all night.'],
        re: [
          { t: ['Has anyone brought you a fish?', 'Any fish lately?'], if: 'said oona_fish',
            say: ["Not one, all week. I'd never have guessed I'd miss them.", 'Not one. I miss them. Imagine!'] },
          { t: ['People keep you warm, remember?', 'People keep you warm.'], if: 'said oona_people', tone: 'kind',
            say: ["So you said. I've got half the boardwalk in here tonight, on my good chairs. They're terrible at cards.", 'Half the boardwalk is in here. Bad at cards.'] },
          { t: ['Who are you waiting for?', 'Who are you waiting for?'],
            say: ['Whoever knocks, duck. Tonight that is a lot of people.', 'Whoever knocks. Tonight, lots of people.'] },
        ] },
      { if: '!flag n_dawn', say: [["Kettle on, door shut. That is how you do a long night, duck.", "Kettle on, duck."]] },
      { if: 'flag n_dawn', say: [["Kettle on, duck. It never really went off.", "Kettle on, duck."]] },
      { ask: ['Did Vesper always climb things?', 'Did Vesper always climb?'],
        say: ['Since she could crawl. I found her on top of the wardrobe at two, fast asleep.', 'Always. At two she slept on the wardrobe.'] },
      { ask: ['Did you ever want fire, Granny?', 'Did you want fire?'],
        say: ['When I was small. Then I married a man with warm feet, and I stopped minding.', 'Once. Then I married a man with warm feet.'] },
      { idle: [["Kettle's on, duck. Sit.", 'Sit, duck.'], ['Mind the draught, duck. What is it?', 'What is it, duck?']] },
      { bye: [['Wrap up, duck. Come back for tea.', 'Come back for tea, duck.']] },
      { bark: true, if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['Kettle on. Door shut. That is how you do a long night, duck.', 'Kettle on. Door shut, duck.'] },
    ],

    // ---------------------------------------------------------------- Captain Hester Ticklebrass, the Clockwatch
    // Precise; counts in seconds (her trait, used once here). Writes to Osric every week.
    c_hester: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Every watchman on every roof, looking up. Nobody knows what we are looking for. We are looking very precisely.', 'All my guards are looking up. Very precisely.'],
        re: [
          { t: ["You're looking for the moon.", "You're looking for the moon."],
            say: ['Then we will know it when we see it. Probably. It has been nine nights.', 'Then we will know it. Nine nights now.'] },
          { t: ["I'm still planning, Captain.", "I'm still planning."], if: 'said hester_count',
            say: ['Good. Plan quickly. Then charge. Then come back and tell me what time it was.', 'Good. Plan. Charge. Then tell me the time.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon rose at seven minutes past eleven. I wrote it down, and then I had to sit down.', 'The moon rose. I wrote down the time.'],
        re: [
          { t: ['Did you count it in?', 'Did you count it in?'],
            say: ['From sixty, the moment the sky went grey. I got to forty-one and forgot what came next.', 'From sixty. At forty-one I forgot.'] },
          { t: ['Where does the report go?', 'Where does the report go?'],
            say: ['In the drawer marked Good News. It is the first thing in that drawer.', 'In the Good News drawer. The first one.'] },
        ] },
      { if: '!flag n_dawn', say: [["All watchmen on the roofs. Looking up. Precisely.", "All my guards look up."]] },
      { if: 'flag n_dawn', say: [["The Clockwatch reports: all well. First time this month.", "All well, at last."]] },
      { ask: ['How are the Bobs?', 'How are the Bobs?'],
        say: ['Three Bobs, one rota, no complaints. I did not know peace could be so loud.', 'Three Bobs. No complaints. Very loud.'] },
      { ask: ['Do you still write to Osric?', 'Do you write to Osric?'],
        say: ['Every week. He sent me a drawing of the dark. It is a black page. I filed it.', 'He sent a drawing of the dark. I filed it.'] },
      { idle: [['Report.', 'Report.'], ['Go on. I am timing you.', 'Go on.']] },
      { bye: [['Dismissed. Carefully.', 'Dismissed.']] },
    ],

    // ---------------------------------------------------------------- Hettie Sprocket, inventor (Bolt the brass dog)
    c_hettie: [
      { if: 'said hettie_warm !flag n_dawn', once: true,
        say: ["You said you'd invent something to keep people warm. I've had a go. It's a stove you can wear. It's on fire.", 'I made a stove you can wear. It is on fire.'],
        re: [
          { t: ['Is it meant to be on fire?', 'Should it be on fire?'],
            say: ['A little bit. Not this much. Pass me that bucket.', 'A bit. Not this much. Bucket, please.'] },
          { t: ['Granny Oona would wear it.', 'Gran would wear it.'],
            say: ["She would, too. She'd say it wasn't warm enough.", 'She would. She would say it is not warm enough.'] },
        ] },
      { if: 'quest c_bolt done !flag n_dawn', fact: 'n5_moon=gone',
        say: ['Bolt keeps barking at the sky. He can smell that something is missing up there.', 'Bolt barks at the sky. Something is missing.'],
        re: [
          { t: ['What does a brass dog smell?', 'What does Bolt smell?'],
            say: ["Oil, toast, and anything he isn't allowed to have.", 'Oil, toast, and things he must not have.'] },
          { t: ["He's missing the moon.", 'He misses the moon.'],
            say: ["So am I. I'm building him a new one. Don't look at it yet.", 'Me too. I am building him one.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I am building a moon. Out of brass. It will not be the same. It will be louder.', 'I am building a brass moon. A loud one.'],
        re: [
          { t: ['How loud?', 'How loud?'],
            say: ['It ticks. And it whistles when it is full. Bolt howls at it.', 'It ticks and whistles. Bolt howls.'] },
          { t: ["The real one's coming back.", 'The real one will come back.'], tone: 'brave',
            say: ['Then mine will be a spare. Everybody should keep a spare moon in the shed.', 'Then mine is a spare.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The real moon is back, so my brass moon is a lamp now. A very loud lamp.', 'My brass moon is a loud lamp now.'],
        re: [
          { t: ['Can I hear it?', 'Can I hear it?'],
            say: [['narr', 'Hettie flips a lever. Something in the shed whistles like a kettle the size of a cow.', 'Something in the shed whistles very loudly.'], ['c_hettie', 'Isn\'t she lovely?', 'Isn\'t she lovely?']] },
          { t: ['Could you invent a quiet one?', 'Make a quiet one?'],
            say: ["Quiet? I don't know how. I'd have to invent that first.", 'Quiet? I would have to invent quiet first.'] },
        ] },
      { if: '!flag n_dawn', say: [["Bolt sneezed. That is two this week. Science!", "Bolt sneezed twice!"]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["I'm inventing a moon alarm. It goes off when the moon comes up. It is going off now.", "My moon alarm is going off!"]] },
      { ask: ['What are you inventing next?', 'What will you invent next?'],
        say: ['A lantern that never goes out. Mags says she has built one. It went out.', 'A lantern that never goes out. Mags tried. Hers went out.'] },
      { idle: [['Hm? I was soldering. Go on.', 'Go on.'], ['If you hear a bang, it was the toaster. Yes?', 'Yes?']] },
      { bye: [['Mind the wires on the way out!', 'Mind the wires!']] },
    ],

    // ---------------------------------------------------------------- Ottoline, keeper of the Turning Library
    // Whispers, then shouts, then says sorry.
    c_ottoline: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The Turning Library has two hundred books about the moon. Every one is suddenly out of date. Shhh.', 'All our moon books are out of date. Shhh.'],
        re: [
          { t: ['Which one is the best?', 'Which one is best?'],
            say: ['"The Moon and How to Keep It." It is one page long. It says: look up.', 'A one-page book. It says: look up.'] },
          { t: ['Wren is writing a new one.', 'Wren is writing one.'],
            say: ['She sends me the chapters. They arrive very damp. She reads them on boats.', 'She sends chapters. They are damp.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["Two hundred new pages to write, and every one of them good news. Shhh. I'm whispering, I'm whispering.", 'So many new pages! Shhh.'],
        re: [
          { t: ['You can shout this time.', 'You can shout.'], tone: 'silly',
            say: ['Can I? ...HOORAY. Sorry. Sorry. That was lovely.', 'HOORAY! Sorry. That was lovely.'] },
          { t: ["Where will Wren's book go?", "Where will Wren's book go?"],
            say: ['The top shelf, where it is safe from the turning. And from Lord Whirligig.', 'The top shelf. Safe from Whirligig.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Shh. The books are reading themselves in the dark.", "Shh. The books read in the dark."]] },
      { if: 'flag n_dawn', say: [["Shh. Happy shh.", "Happy shh."]] },
      { ask: ['Has Whirligig given your books back?', 'Did Whirligig give the books back?'],
        say: ['Ten of the eleven. The one about manners is still missing. I think he is reading it.', 'Ten. Not the manners one. He is reading it.'] },
      { idle: [['Shh. Yes?', 'Shh. Yes?'], ['Quietly. What is it?', 'Quietly.']] },
      { bye: [['Mind the shelves. They turn when they like.', 'Mind the shelves.']] },
    ],

    // ---------------------------------------------------------------- Lord Percival Whirligig, the clock baron
    // Pompous, softening. "Hmph." Ash once told him to be kinder (said whirligig_kinder).
    c_whirligig: [
      { if: 'said whirligig_kinder !flag n_dawn', once: true,
        say: ['I have lent every lantern in my house to the Lower Town. Do not look at me like that. You told me to be kinder.', 'I lent all my lanterns away. You said be kinder.'],
        re: [
          { t: ['That was very kind.', 'That was kind.'], tone: 'kind', f: 0.5,
            say: ['It was. I am sitting in the dark now. It is very cold, and I have never been so pleased with myself.', 'It was. Now I sit in the dark. Very pleased.'] },
          { t: ['Do you need one back?', 'Need one back?'],
            say: ['Certainly not. ...Perhaps a small one. For the stairs.', 'No. ...A small one. For the stairs.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['No moon! Do you know what that does to the price of moon-dials? Nothing. They were already worthless. Hmph.', 'No moon! My moon-dials are worthless.'],
        re: [
          { t: ['Do the clocks still tick?', 'Do the clocks still tick?'],
            say: ['All four hundred. Clocks do not need a moon. They need winding, and I wind them. Every one.', 'All of them. I wind every one.'] },
          { t: ['Do you sing to them now?', 'Do you sing to them now?'], if: 'said whirligig_clocks',
            say: ['Only the hall clock. Only when nobody is in. Hmph.', 'Only the hall clock. When nobody is in.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon is back and my moon-dials work. I am selling them for double. Hmph.', 'My moon-dials work again! Double price.'],
        re: [
          { t: ['Double? Be kinder.', 'Be kinder.'],
            say: ['...Single, then. For children. Hmph.', 'Single. For children. Hmph.'] },
          { t: ["You look happy, Your Lordship.", 'You look happy.'],
            say: ['This is my happy face. It is getting more practice lately.', 'My happy face. It gets practice now.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Four hundred clocks, all wound, all ticking. Moon or no moon. Hmph.", "All my clocks tick. Hmph."]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["The clocks are ticking and the moon is up. Hmph. Good.", "Clocks and moon. Good. Hmph."]] },
      { idle: [['Hmph. Well?', 'Well?'], ['Feet. Wiped? Hmph. Go on.', 'Go on.']] },
      { bye: [['Good day. Close the door. Gently.', 'Good day.']] },
    ],

    // ---------------------------------------------------------------- Harbormaster Mo, Gearhaven harbor
    // Booms like a shanty, blows bubbles, says "Barnacles". His granny waved a lantern on the Far Pier (said mo_lantern).
    c_mo: [
      { if: 'said mo_lantern !flag n_dawn', fact: 'n5_moon=gone',
        say: ["I'm out on the Far Pier every night now with Granny's lantern, waving it at the dark. In case somebody's out there.", "I wave Granny's lantern every night. In case."],
        re: [
          { t: ['Somebody is. Me.', 'Somebody is. Me.'], tone: 'brave',
            say: ["Then I'll wave harder. Barnacles, my arm's tired. Good. That means it's working.", 'Then I will wave harder.'] },
          { t: ['Does anyone wave back?', 'Does anyone wave back?'],
            say: ['Agatha, from the lighthouse. And one very confused gull.', 'Agatha does. And a confused gull.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The tide is all muddled without the moon. Even the crabs are walking in circles.', 'The tide is muddled without the moon.'],
        re: [
          { t: ['Can the boats still sail?', 'Can boats still sail?'],
            say: ['Out, yes. Home is the hard part, when the sea forgets which way is up the beach.', 'Out, yes. Home is hard now.'] },
          { t: ['Even Admiral Pinch?', 'Even Admiral Pinch?'], tone: 'silly',
            say: ['Him most of all. He went round the bridge post eleven times and bit it.', 'He went in circles. Then bit a post.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Tide came in right on time this morning. I hugged a crab. Admiral Pinch saw, and now he wants one.', 'The tide is on time! I hugged a crab.'],
        re: [
          { t: ['Was the crab pleased?', 'Was the crab pleased?'],
            say: ['He pinched me. That means yes, in crab.', 'He pinched me. That is a yes.'] },
          { t: ['Are the boats coming home?', 'Are the boats coming home?'], if: 'said mo_home', tone: 'kind',
            say: ['Every one. You said the sea brings people home. Today it remembered how.', 'Every one. The sea remembered how.'] },
        ] },
      { if: '!flag n_dawn', say: [["Barnacles. The tide's all at sea.", "Still muddled."]] },
      { if: 'flag n_dawn', say: [["Ships in, ships out. Best harbor on the coast. Told you.", "Best harbor on the coast."]] },
      { ask: ['How is Jo?', 'How is Jo?'],
        say: ["Racing nobody round the buoys, in the dark, and winning. I sit on the pier till she's in.", 'Racing in the dark. I wait till she is in.'] },
      { idle: [['*blows a bubble* Ask away, dragon.', 'Ask away.'], ['Barnacles. Go on, dragon.', 'Go on.']] },
      { bye: [['Fair winds, dragon!', 'Fair winds!']] },
    ],

    // ---------------------------------------------------------------- Ingrid Anvilsong, the Bright Anvil
    // Sings while she hammers, says "ja". Knows Mom by her hammer marks (said ingrid_mom).
    c_ingrid: [
      { if: 'said ingrid_mom !flag n_dawn', once: true,
        say: ["Your mother wrote me! A real smith's letter. Three lines, and two of them about iron. Ja! I have pinned it over my anvil.", 'Your mother wrote me! I pinned it up.'],
        re: [
          { t: ['What did the third line say?', 'And the third line?'],
            say: ['"Look after my boy if he comes your way." Ja. I will.', '"Look after my boy." Ja. I will.'] },
          { t: ['She only ever writes three lines.', 'She writes three lines.'],
            say: ['Then she is a real smith. Hammer, hammer, done.', 'Then she is a real smith.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Hammer, hammer, ding! A horseshoe, for luck. No horse? Ja, the luck works anyway!', 'I am making you a lucky horseshoe.'],
        re: [
          { t: ['Does luck work on a mountain?', 'Does luck work up there?'],
            say: ['Luck works everywhere. Good iron works better. Bring me your sword.', 'Luck works. Good iron works better.'] },
          { t: ['Sing me your hammer song.', 'Sing your hammer song.'],
            say: ['Hammer, hammer, ding. That is the whole song. Ja, it is short. So is the night, soon.', 'Hammer, hammer, ding. Short song.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon is back! I am making a moon of iron to hang over my door. Round, with a dent. Ja, the dent is on purpose.', 'I am making an iron moon. With a dent.'],
        re: [
          { t: ['Why the dent?', 'Why the dent?'],
            say: ['So it looks like it has been somewhere. Things that have been somewhere have dents.', 'So it looks like it has been somewhere.'] },
          { t: ['Mom would like it.', 'Mom would like it.'],
            say: ['Then I make two. One for her forge. Ja!', 'Then I make two. Ja!'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Hammer, hammer, ding! Strike while the iron is hot, and the night is not. Ja.", "My forge keeps the dark back."]] },
      { if: 'flag n_dawn', say: [["Hammer, hammer, ding! Happy hammering today.", "Happy hammering!"]] },
      { idle: [['Ja? Speak up over the anvil.', 'Ja?'], ['Hammer, hammer... what?', 'What?']] },
      { bye: [['Ja, go! Keep your edge sharp!', 'Ja, go!']] },
    ],

    // ---------------------------------------------------------------- Auntie Fig, the Steaming Teapot
    // "dearie" is hers alone. Oona's oldest friend.
    c_fig: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I have put a cosy on the teapot and on my head. It is the Long Night, dearie. Everything needs a cosy.', 'Everything needs a cosy tonight.'],
        re: [
          { t: ['Does the head cosy help?', 'Does the head cosy help?'], tone: 'silly',
            say: ['Enormously. I have never had such warm thoughts.', 'Yes. Very warm thoughts.'] },
          { t: ['Is Granny Oona all right?', 'Is Gran all right?'], tone: 'kind', then: ['said fig_asked_oona'],
            say: ['Sitting up with the kettle on, like me. We wave across the harbor at each other. Two old teapots.', 'Up with her kettle, like me.'] },
        ] },
      { if: 'said fig_sorry !flag n_dawn', fact: 'n5_moon=gone',
        say: ['You told me once the bravest thing you ever did was say sorry. I said it to Oona, after forty years. Over a scone.', 'I said sorry to Oona. Forty years late.'],
        re: [
          { t: ['What did she say?', 'What did she say?'],
            say: ['"About time, dearie." Then she ate my scone.', '"About time." Then she ate my scone.'] },
          { t: ['Sorry for what?', 'Sorry for what?'],
            say: ['A boy, a dance, a very long time ago. He married neither of us.', 'A boy and a dance. Long ago.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Morning, dearie! I have taken the cosy off my head. The teapot is keeping his.', 'Morning! The teapot keeps his cosy.'],
        re: [
          { t: ['Tea to celebrate?', 'Tea to celebrate?'],
            say: ["I've had six cups. The seventh is yours.", 'I had six. The seventh is yours.'] },
          { t: ['The teapot earned it.', 'The teapot earned it.'],
            say: ['He did. He worked every night. Not one cold cup.', 'He did. Not one cold cup.'] },
        ] },
      { if: '!flag n_dawn', say: [["Kettle on, cosy on, door open, dearie.", "Kettle on, dearie."]] },
      { if: 'flag n_dawn', say: [["Tea, dearie? It is a tea sort of day.", "Tea, dearie?"]] },
      { idle: [['More tea, dearie? Go on.', 'More tea?'], ['Sit, dearie. What is it?', 'Sit, dearie.']] },
      { bye: [['Come back cold, go home warm. That is the rule, dearie.', 'Come back soon, dearie.']] },
    ],

    // ---------------------------------------------------------------- Ambrose, keeper of the Great Clock (ninety years)
    // A bit deaf. Ends lines with "Tick". The girl who sweeps his bell is Vesper (said ambrose_girl).
    c_ambrose: [
      { if: 'said ambrose_girl !flag n_dawn', once: true, fact: 'n5_moon=gone',
        say: ["Eh? The girl hasn't come to sweep the bell. Nine nights now. I leave the apple out anyway. Tick.", 'The girl has not come. I leave her apple out.'],
        re: [
          { t: ["She's up the mountain, with me.", 'She is with me.'], if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] }, tone: 'kind',
            say: ["Up a mountain? Then she'll want two apples when she's back. Tick.", 'Then she will want two apples. Tick.'] },
          { t: ['She will come back.', 'She will come back.'],
            say: ['Eh? Yes. They always come back to a bell. Tick.', 'Yes. They always come back. Tick.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The Great Clock still ticks, moon or no moon. I told her she is very brave. Tick.', 'The Great Clock still ticks. So brave.'],
        re: [
          { t: ['Does she know the moon is gone?', 'Does she know?'],
            say: ['Eh? She knows. She ticks a little louder at midnight. Tick.', 'She knows. She ticks louder at midnight.'] },
          { t: ['Keep her going till I come back.', 'Keep her going.'], tone: 'kind',
            say: ['Ninety years I have. I can manage a few more nights. Tick.', 'Ninety years. A few more nights is easy.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['She chimed thirteen times when the moon came back. She has never done that. I did not stop her. Tick.', 'The Great Clock chimed thirteen times!'],
        re: [
          { t: ['Thirteen? Is she all right?', 'Thirteen? Is she okay?'],
            say: ['Eh? She is happy. Happy clocks miscount. So do happy old men. Tick.', 'She is happy. Happy clocks miscount.'] },
          { t: ['I heard her from the sea.', 'I heard her.'],
            say: ['Did you! Then she meant that one for you. Tick.', 'Then that one was for you. Tick.'] },
        ] },
      { if: '!flag n_dawn', say: [["Tick. ...Tick. Eh? Was that me?", "Tick. Was that me?"]] },
      { if: 'flag n_dawn', say: [["Tick. Tock. She sounds pleased. Tick.", "She sounds pleased. Tick."]] },
      { idle: [['Eh? Speak up. Tick.', 'Eh? Tick.'], ['Still here. So is she. Tick.', 'Still here. Tick.']] },
      { bye: [['Mind the stairs. Tick.', 'Mind the stairs.']] },
    ],

    // ---------------------------------------------------------------- Penny Blot, the Gearhaven Gazette
    // The kid reporter; her headlines are hers alone. Wondered if the Moth Mask was lonely (said penny_lonely).
    c_penny: [
      { if: { all: ['!flag n_dawn', { any: ['flag n5_vesper', 'choice c_vesper=friend'] }] },
        say: ['HEADLINE: MOTH MASK SEEN ON NIGHT MOUNTAIN, HELPING. SUBHEADLINE: PENNY PRESS SAW IT COMING.', 'HEADLINE: MOTH MASK HELPS DRAGON!'],
        re: [
          { t: ['How did you hear that?', 'How did you hear?'],
            say: ['A sailor told a gull, the gull told a fishwife, the fishwife told me. Sources.', 'A sailor, a gull, a fishwife. Sources.'] },
          { t: ['She is helping. Print it.', 'Print it. It is true.'], tone: 'kind', if: 'said penny_lonely',
            say: ['Front page. And I am putting "not lonely any more" in the small print, because it is true.', 'Front page. "Not lonely any more."'] },
        ] },
      { if: '!flag n_dawn',
        say: ['HEADLINE: DRAGON CLIMBS MOUNTAIN OF NIGHT. SUBHEADLINE: PENNY PRESS WAS RIGHT ALL ALONG.', 'HEADLINE: DRAGON CLIMBS NIGHT MOUNTAIN!'],
        re: [
          { t: ['Right about what?', 'Right about what?'],
            say: ['About you. I put you on the front page in the summer. Everybody said a dragon kid was not news.', 'About you. Nobody thought you were news.'] },
          { t: ['Can I have a quote?', 'Can I have a quote?'], tone: 'silly', then: ['said penny_quote'],
            say: ['That is my line! All right. Quote: "Come back, or there is no ending." Penny Blot, age eleven.', '"Come back, or there is no ending."'] },
        ] },
      { if: 'said penny_quote flag n_dawn', once: true,
        say: ['Remember my quote? "Come back, or there is no ending." You came back, so I printed the ending. It sold out by breakfast.',
          'You came back. I printed the ending. It sold out!'],
        re: [
          { t: ['What did the headline say?', 'What was the headline?'],
            say: ['THE END. And underneath, very small: for now.', 'THE END. Then, small: for now.'] },
          { t: ['Did you keep me a copy?', 'Did you keep me one?'], tone: 'kind',
            say: ['One for you. One for the Moth Mask, in case she ever comes by. Under the counter.', 'One for you. One for the Moth Mask.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['HEADLINE: MOON BACK. DRAGON BACK. PENNY PRESS EXTREMELY BACK.', 'HEADLINE: MOON BACK!'],
        re: [
          { t: ['What will you print tomorrow?', 'What will you print next?'],
            say: ["Tide on time, gulls still steal chips. Boring news. I can't wait.", 'Boring news. I cannot wait.'] },
          { t: ['Put Duchess in the paper.', 'Put Duchess in it.'],
            say: ['A goat on top of the world? That is page one, and I am not even making it up.', 'A goat on top of the world! Page one!'] },
        ] },
      { if: 'flag n_dawn', say: [["EXTRA! EXTRA! TIDE ON TIME! GULL STEALS CHIPS!", "TIDE ON TIME!"]] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["EXTRA! EXTRA! STILL NO MOON! DRAGON ON IT!", "STILL NO MOON!"]] },
      { idle: [['Got a quote for me?', 'Got a quote?'], ['Go on. I am writing.', 'Go on.']] },
      { bye: [['Stay newsworthy!', 'Stay newsworthy!']] },
    ],

    // ---------------------------------------------------------------- Madame Ravel, Ravel's Remarkable Rarities
    c_ravel: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ["A draught for courage? I used to brew it from moonlight. With no moon, it's mostly lemon.", 'A courage draught. Mostly lemon now.'],
        re: [
          { t: ['Does the lemon work?', 'Does the lemon work?'],
            say: ['It makes you pull a face. Pulling a face is brave, if you do it at the right thing.', 'It makes you pull a face. That is brave.'] },
          { t: ['Was it ever really moonlight?', 'Was it real moonlight?'],
            say: ['Moonlight in a jar, left on the windowsill. Then lemon. It was always mostly lemon.', 'Moonlight in a jar. And lemon.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Genuine moonlight, freshly back! Two coins a jar. It comes out at night, like the real thing.', 'Fresh moonlight! Two coins a jar.'],
        re: [
          { t: ["The jar's empty, Madame.", 'The jar is empty.'],
            say: ['In the daytime, yes. That is what makes it rare.', 'In the day, yes. That makes it rare.'] },
          { t: ["I'll take one. For Gran.", "I'll take one for Gran."], tone: 'kind',
            say: ["For Oona? Then it's free. The word hurts my mouth.", 'For Oona? Free. Ouch.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Remarkable rarities, in the dark! Feel your way round!", "Feel your way round!"]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["Remarkable rarities! Now with moonlight!", "Now with moonlight!"]] },
      { idle: [['Browse, dragon. Looking is free. Touching costs extra.', 'Browse.'], ['Remarkable, yes? Go on.', 'Go on.']] },
      { bye: [['Come back! Everything is remarkable!', 'Come back!']] },
    ],

    // ---------------------------------------------------------------- Skipper Jo, the fastest skiff in the harbor
    // Hates losing. Her mom sailed with the fleet.
    c_jo: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Night sailing every night now. There is no other kind. I have only hit two seals.', 'Night sailing every night! Only two seals.'],
        re: [
          { t: ['Were the seals all right?', 'Were the seals okay?'],
            say: ['They were rude about it. I said sorry. They still barked.', 'They barked. I said sorry.'] },
          { t: ['Is your mom home?', 'Is your mom home?'], tone: 'kind',
            say: ["The fleet came in before the dark. She's home. She makes me wear a bell on the boat now.", 'She is home. I wear a bell now.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["Day sailing! I forgot what the sea looks like in the daytime. It's so blue!", 'Day sailing! The sea is so blue!'],
        re: [
          { t: ['Race you round the buoys?', 'Race you?'],
            say: ['On feet? Again? ...Yes. Obviously. Go!', 'On feet? Yes! Go!'] },
          { t: ['Did you hit any more seals?', 'Any more seals?'], tone: 'silly',
            say: ['One. On purpose. He started it.', 'One. He started it.'] },
        ] },
      { if: '!flag n_dawn', say: [["Night sailing again. I have a bell now. Ding.", "I have a bell now. Ding."]] },
      { if: 'flag n_dawn', say: [["Race you! On feet! Next time I'm winning.", "Next time I win!"]] },
      { idle: [['Ahoy. What?', 'What?'], ['Quick, I am rigging. What?', 'Quick!']] },
      { bye: [['Race you to the pier! On feet!', 'Race you!']] },
    ],

    // ---------------------------------------------------------------- Bob and Bob (and Bob), the Clockwatch
    // "HALT!" is theirs alone. They take turns being the clever one (said bobs_turns).
    c_bobs: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Tick. Tock. We have looked at the sky for six hours. The sky has not looked back.', 'We look at the sky. It does not look back.'],
        re: [
          { t: ['Whose turn is it to be clever?', 'Who is clever today?'], if: 'said bobs_turns',
            say: ['Bob. ...No, the other Bob. Today the clever thing was to look up. We are all doing it.', 'Bob. Today, looking up is clever.'] },
          { t: ['What are you looking for?', 'What are you looking for?'],
            say: ['A round thing. White. About this big. Report it if seen. Tick.', 'A round white thing. Report it.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Tick. Tock. The sky looked back. It winked. We are reporting it.', 'The sky winked at us!'],
        re: [
          { t: ['Moons do not wink.', 'Moons do not wink.'],
            say: ['This one did. Bob saw it. ...Bob says it was a cloud. The report says wink.', 'Bob says cloud. The report says wink.'] },
          { t: ['Good work, Bobs.', 'Good work, Bobs.'], tone: 'kind',
            say: ['Good work, Bob. Good work, Bob. ...Good work, Bob. All three of us. Tick.', 'Good work, all of us! Tick.'] },
        ] },
      { if: '!flag n_dawn', say: [["Tick. Tock. Still looking up.", "Still looking up."]] },
      { if: 'flag n_dawn', say: [["Tick. Tock. All quiet, Bob. All quiet, Bob.", "All quiet, Bob."]] },
      { idle: [['Tick. Tock. Yes, Mostly Part Dragon?', 'Tick. Tock. Yes?'], ['All quiet. Go on.', 'Go on.']] },
      { bye: [['As you were! ...We mean us. As we were.', 'As you were!']] },
    ],

    // ---------------------------------------------------------------- Mina, the Tide Warden of Saltmarsh
    c_mina: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The tide does not know what to do without the moon. It just sort of sloshes.', 'The tide just sloshes now.'],
        re: [
          { t: ['Can you set the Tide Clock?', 'Can you set the clock?'],
            say: ['To what? I set it by the moon. I set it by guessing now. I am a very good guesser.', 'I guess now. I am a good guesser.'] },
          { t: ['Talk to it. It listens.', 'Talk to it.'], tone: 'kind',
            say: ['I do, every hour. "Out, sea. In, sea. Pick one." It picks neither.', 'I do. It picks neither.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['High tide at noon, low tide at six. Lovely, boring tides. I could kiss them.', 'Lovely boring tides again!'],
        re: [
          { t: ['Do it. Nobody is watching.', 'Do it. Nobody is looking.'], tone: 'silly',
            say: ['...Not in front of the gulls.', 'Not in front of the gulls.'] },
          { t: ['Is the clock set right?', 'Is the clock right?'],
            say: ['To the minute. My granddad would have cried. I did it for him.', 'To the minute. I cried, for Granddad.'] },
        ] },
      { if: '!flag n_dawn', say: [["Out, sea. In, sea. Pick one, please.", "Out, sea. In, sea."]] },
      { if: 'flag n_dawn', say: [["Good sea. Out you go. On time.", "Good sea. On time."]] },
      { idle: [['Sorry. Go on.', 'Go on.'], ['The sea is listening. So am I.', 'Yes?']] },
      { bye: [['Mind the tide on your way. It is still learning.', 'Mind the tide.']] },
    ],

    // ---------------------------------------------------------------- Charlie, the Chowder Pot
    c_charlie: [
      { if: '!flag n_dawn',
        say: ['Chowder! Long Night chowder. It is chowder with the lights off.', 'Long Night chowder! Same chowder.'],
        re: [
          { t: ['Is it the same as day chowder?', 'Is it the same chowder?'],
            say: ['Same pot, same spoon. Tastes better in the dark. Everyone says so. Nobody can see what is in it.', 'Same pot. Tastes better in the dark.'] },
          { t: ['Cookie puts rocks in hers.', 'Cookie uses rocks.'],
            say: ['She wrote and told me. Rocks! I sent her a shell to show her how it is done. She put it in the soup.', 'Rocks! I sent her a shell. She cooked it.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['Moon chowder! Same chowder. I put the bowl by the window so it can see.', 'Moon chowder! By the window.'],
        re: [
          { t: ['Can chowder see?', 'Can chowder see?'], tone: 'silly',
            say: ['Mine can. It has eyes. Fish eyes. Eat up.', 'Mine has fish eyes. Eat up.'] },
          { t: ['One bowl for Gran?', 'A bowl for Gran?'], tone: 'kind',
            say: ['Already took her one. She said it was too hot, and then she asked for seconds.', 'Too hot, she said. Then seconds.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Chowder in the dark! Mind the hot bits!", "Chowder in the dark!"]] },
      { if: 'flag n_dawn', say: [["Chowder! Get your chowder!", "Chowder!"]] },
      { idle: [['Hungry? You look hungry.', 'Hungry?'], ['Pot is on. What is it?', 'What is it?']] },
      { bye: [['Mind the hot pot!', 'Mind the pot!']] },
    ],

    // ---------------------------------------------------------------- Dory, net-mender of Cockle Cottage; Posy's mom
    // Short sentences. Ash told Posy being scared is okay (said posy_scared).
    c_dory: [
      { if: 'said posy_scared !flag n_dawn', fact: 'n5_moon=gone',
        say: ["Posy isn't scared of the dark. She says you told her scared is allowed. So now she's scared, and fine.", 'Posy is scared. And fine. Because of you.'],
        re: [
          { t: ['Scared and fine is good.', 'Scared and fine is good.'], tone: 'kind',
            say: ["It is. I'm trying it myself.", 'It is. I am trying it too.'] },
          { t: ['Is her dad home yet?', 'Is her dad home?'],
            say: ['Came in with the fleet, before the dark. He mends nets with me now. Badly.', 'He came home. He mends nets badly.'] },
        ] },
      { if: '!quest q_n5_oona done !flag n_dawn',
        say: ['Granny Oona has packed a frying pan. I do not know why. I am not asking.', 'Granny Oona packed a frying pan. Why?'],
        re: [
          { t: ["She's going to fetch Vesper.", 'She wants to fetch Vesper.'],
            say: ['Up the mountain? With a frying pan? ...Then the mountain should be worried.', 'With a pan? The mountain should worry.'] },
          { t: ['Maybe she is making supper.', 'Maybe it is for supper.'],
            say: ['In her coat and boots? No.', 'In her boots? No.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["Granny Oona's kettle was on all night. You could smell the tea from the jetty.", "You could smell Gran's tea from here."],
        re: [
          { t: ['Did you have a cup?', 'Did you have a cup?'],
            say: ['Three. Too strong. I slept for a day.', 'Three. Too strong.'] },
          { t: ['Are the nets mended?', 'Are the nets mended?'],
            say: ['Every one. Then I mended them again. Habit.', 'Every one. Twice.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Mind the nets. Mind the dark.", "Mind the nets."]] },
      { if: 'flag n_dawn', say: [["Mind the nets. Posy is singing.", "Mind the nets."]] },
      { idle: [['Mind the hooks. What?', 'What?'], ['Mm. Go on.', 'Go on.']] },
      { bye: [['Mind the nets.', 'Mind the nets.']] },
    ],

    // ---------------------------------------------------------------- Captain Elias Tarbuckle, retired, ghost stories
    // "In my day..." He said the best part of a voyage is coming home (said tarbuckle_home).
    c_tarbuckle: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['In my day we had two moons. ...We did not. But it feels like we ought to have kept a spare.', 'We should have kept a spare moon.'],
        re: [
          { t: ['Hettie is building one.', 'Hettie is building one.'],
            say: ['Brass? It will whistle. In my day moons were quiet and knew their place.', 'Brass? It will whistle. Moons were quiet once.'] },
          { t: ['Is this a ghost story?', 'Is this a ghost story?'],
            say: ["No ghost would go out on a night like this, lad. Too dark. They'd trip.", 'No ghost goes out tonight. Too dark.'] },
        ] },
      { if: 'said tarbuckle_home !flag n_dawn', fact: 'n5_moon=gone',
        say: ['You said the best part of a voyage is coming home. Remember that, up there. You come home. That is an order.', 'Best part of a voyage: home. Come home. An order.'],
        re: [
          { t: ['Aye, aye, Captain.', 'Aye, aye, Captain.'], tone: 'kind',
            say: ['Good lad. In my day they saluted, but that will do.', 'Good lad. That will do.'] },
          { t: ['Did you always come home?', 'Did you always come home?'],
            say: ['Every time, lad. Late, wet, and short a sock. But every time.', 'Every time. Late and wet. But every time.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['In my day the moon came back on its own. Lazy, these young moons.', 'In my day the moon came back on its own.'],
        re: [
          { t: ['It had some help.', 'It had some help.'], tone: 'brave',
            say: ['So I hear. ...Sit down, lad. Tell me all of it. I will only exaggerate a little.', 'So I hear. Sit. Tell me all of it.'] },
          { t: ['Tell me a ghost story.', 'Tell me a ghost story.'],
            say: ['Once, on a black sea, a moon went missing, and a dragon brought it home. ...That one is true. Odd.', 'A dragon brought the moon home. That one is true!'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["In my day the dark was darker. ...No, this is the darkest I have known.", "This is the darkest I have known."]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["In my day the moon was bigger. ...No, this is a fine moon.", "This is a fine moon."]] },
      { idle: [['In my day folk got to the point. Go on.', 'Go on.'], ['Sit, lad. What is it?', 'Sit.']] },
      { bye: [['Fair winds. And come home.', 'Come home.']] },
    ],

    // ---------------------------------------------------------------- Posy, a fierce small girl with a music box
    c_posy: [
      { if: { any: ['flag n5_vesper', 'choice c_vesper=friend'] },
        say: ['Is the moth lady with you? Tell her I kept the music box safe. Every night.', 'Tell the moth lady I kept her box safe.'],
        re: [
          { t: ['I will tell her.', 'I will tell her.'], tone: 'kind',
            say: ['Tell her I play it for her, too. The moth song. Loud.', 'Tell her I play it for her. Loud.'] },
          { t: ['Does the dark scare you, Posy?', 'Does the dark scare you?'],
            say: ["Yes. That's allowed. I play the box and the dark goes quieter.", 'Yes. It is allowed. The box helps.'] },
        ] },
      { if: '!flag n_dawn',
        say: ['The moth lady did not leave anything on our step this week. I hope she is okay.', 'I hope the moth lady is okay.'],
        re: [
          { t: ["She's okay. She's busy.", 'She is okay.'],
            say: ['Busy doing what? Is it moth things? I like moth things.', 'Moth things? I like moth things.'] },
          { t: ['Play the box for her.', 'Play the box for her.'],
            say: [['narr', 'Posy winds the music box. It plays the moth song, a little out of tune.', 'Posy plays the moth song.'], ['c_posy', 'There. Now she can hear it.', 'Now she can hear it.']] },
        ] },
      { if: 'flag n_dawn',
        say: ['The moon came back and I played the moth song at it. The whole song. It stayed.', 'I played the moon the moth song. It stayed!'],
        re: [
          { t: ['It must have liked it.', 'It liked it.'],
            say: ['Everybody likes it. Mom says I am getting better. Mom is lying.', 'Mom says I am better. She is lying.'] },
          { t: ['Play it for me too?', 'Play it for me too?'],
            say: [['narr', 'Posy winds the box and plays it at you, very seriously, all the way to the end.', 'Posy plays it for you, very seriously.'], ['c_posy', 'You can clap now.', 'You can clap now.']] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["Listen! I am playing the moon song! I just made it up!", "Listen to my moon song!"]] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["I play the moth song every night. Loud, so the dark can hear it.", "I play the moth song every night."]] },
      { idle: [['Shh! I am winding it.', 'Shh!'], ['What? Listen to this.', 'What?']] },
      { bye: [['Bye! Do not get eaten!', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Maudie, the Gull's Rest on the cliff top
    // Shouts because of the wind. She and Agatha wave lanterns every night (said maudie_lantern).
    c_maudie: [
      { if: 'said maudie_lantern !flag n_dawn', fact: 'n5_moon=gone',
        say: ["Agatha and I wave our lanterns every night! Twice as long now! It's the only light on the whole sea!", 'Agatha and I wave lanterns! Twice as long!'],
        re: [
          { t: ['Did you decide what it means?', 'What does it mean?'],
            say: ['Goodnight AND help! Both! We finally agreed! It took forty years and a Long Night!', 'Goodnight and help! Both!'] },
          { t: ['I saw it from the bridge.', 'I saw it from the bridge.'],
            say: ['You did? Then it works! Agatha will be insufferable!', 'It works! Agatha will be smug!'] },
        ] },
      { if: '!flag n_dawn',
        say: ["The gulls have stopped stealing chips! That's how you know it's bad!", 'The gulls stopped stealing chips!'],
        re: [
          { t: ['Where are the gulls?', 'Where are the gulls?'],
            say: ['On my roof! All of them! Huddled! I gave them a blanket!', 'On my roof! I gave them a blanket!'] },
          { t: ['Do you want them back?', 'Want them back?'],
            say: ["No! ...Yes! It's too quiet! I can hear myself think! I don't like it!", 'Yes! It is too quiet!'] },
        ] },
      { if: 'flag n_dawn',
        say: ['The gulls are stealing chips again! Hooray! I mean, hold on to your chips!', 'The gulls steal chips again! Hooray!'],
        re: [
          { t: ['Hooray for the gulls!', 'Hooray for gulls!'], tone: 'silly',
            say: ["Don't encourage them! ...Hooray!", "Don't encourage them! Hooray!"] },
          { t: ['Is the wind back too?', 'Is the wind back?'],
            say: ["Back and louder! I've missed shouting at it!", 'Louder! I missed shouting!'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["It's dark! And windy! Both at once!", "Dark and windy!"]] },
      { if: 'flag n_dawn', say: [["Welcome to the Gull's Rest! Sorry for shouting!", "Sorry for shouting!"]] },
      { idle: [["What? Sorry! It's the wind!", 'What?'], ['Speak up, dragon!', 'Speak up!']] },
      { bye: [['Mind the cliff edge! And the gulls!', 'Mind the edge!']] },
    ],

    // ---------------------------------------------------------------- Agatha, keeper of the Spinning Lighthouse
    // Gruff; Captain Squawk the parrot is her equal. She kept the light on for Ash once (said agatha_light).
    c_agatha: [
      { if: 'said agatha_light !flag n_dawn', fact: 'n5_moon=gone',
        say: ['I kept it on for you once, all night. Now I keep it on every night. There is nothing else on the sea to see by.', 'I keep the light on every night now.'],
        re: [
          { t: ['I could see it from the peak.', 'I saw it from the peak.'],
            say: ['Good. That is the job. Squawk says you look thin.', 'Good. That is the job. Squawk says you are thin.'] },
          { t: ['Do you ever sleep?', 'Do you ever sleep?'],
            say: ['Squawk sleeps. I watch. We take turns. He is better at his turn.', 'Squawk sleeps. I watch.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Squawk and I keep the lamp lit all night. Every ship lost tonight will still find its way home. That is the job.', 'We keep the lamp lit for every lost ship.'],
        re: [
          { t: ['Even ships with no moon?', 'Even with no moon?'],
            say: ['Those most of all. A lamp is for the dark. Anybody can see in the day.', 'Those most of all. A lamp is for the dark.'] },
          { t: ['Does Squawk help?', 'Does Squawk help?'], tone: 'silly',
            say: ['He shouts "house" at every ship. I think it means home. It helps.', 'He shouts "house" at ships. It helps.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['We kept the lamp lit till sunrise anyway. Squawk insisted. He is very stubborn for a parrot.', 'We kept the lamp lit anyway.'],
        re: [
          { t: ['Squawk was right.', 'Squawk was right.'],
            say: ["He knows. He's been shouting 'house' at the sunrise all morning.", "He knows. He shouts 'house'."] },
          { t: ['Will you rest now?', 'Will you rest now?'],
            say: ['For one day. Then the lamp needs polishing. It always does.', 'One day. Then the lamp needs polish.'] },
        ] },
      { if: '!flag n_dawn', say: [["Lamp lit. Squawk fed. That is the job.", "Lamp lit. That is the job."]] },
      { if: 'flag n_dawn', say: [["She spins all day now too. Squawk likes the view.", "She spins all day now."]] },
      { idle: [['Squawk, hush. Go on, dragon.', 'Go on.'], ['Mind the lamp. What is it?', 'What is it?']] },
      { bye: [['Watch the rocks on the way down.', 'Watch the rocks.']] },
    ],

    // ---------------------------------------------------------------- Barley, the shepherd of the Chalk Downs
    // His sheep have jobs; Duchess the Second is in charge, Gerald is in charge of nothing.
    c_barley: [
      { if: 'quest q_n5_follower active !solved n5_who_follows',
        say: ["A goat that climbs up cliffs where nothing else can? Sounds like Hollis's goat. That goat once climbed my chimney.", "A cliff goat? Sounds like Hollis's goat."],
        re: [
          { t: ['How did she get up a chimney?', 'Up a chimney?'],
            say: ['Inside. From the fireplace. I came home and there was a goat looking down at me.', 'From inside. She looked down at me.'] },
          { t: ['She would climb anything?', 'Anything at all?'],
            say: ['Anything. A cliff, a chimney, a mountain made of night, I expect.', 'Anything. Even a night mountain.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Duchess the Second has gone off her grass. She just stands there staring at the mountain.', 'My sheep keeps staring at the mountain.'],
        re: [
          { t: ['Is she worried?', 'Is she worried?'],
            say: ['She is in charge. She worries for all of us. Gerald has fainted twice.', 'She worries for all of us. Gerald fainted.'] },
          { t: ['Is the Chalk Dragon still white?', 'Is the Chalk Dragon white?'], if: 'quest c_chalk done',
            say: ['I walk her line every evening with a lantern. My wife would have. So I do.', 'I walk her line every night. For my wife.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Duchess the Second is eating again. All of it. The whole hill. She was very worried, and now she is hungry.', 'My sheep is eating the whole hill now.'],
        re: [
          { t: ['What about Gerald?', 'And Gerald?'],
            say: ['Gerald slept through the whole thing. He is a very lucky sheep.', 'Gerald slept through it all.'] },
          { t: ['Duchess the First went up the mountain.', 'Duchess went up the mountain.'],
            say: ['Of course she did. I shall tell Duchess the Second. She will be furious.', 'Of course. My Duchess will be furious.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Easy, Gerald. It is only dark.", "Easy, Gerald."]] },
      { if: 'flag n_dawn', say: [["Easy, Gerald. It is only morning.", "It is only morning, Gerald."]] },
      { idle: [['Easy. The sheep are listening.', 'Easy.'], ['Mm? Go on. Gerald is all ears.', 'Go on.']] },
      { bye: [['Mind the sheep. They mind you.', 'Mind the sheep.']] },
    ],

    // ======================================================================= map 2, Frostreach (Act III's people)
    // (J12) Hearthold knows Ash as the small dragon who made the Great Hearth roar and woke (or fought) the Snow Mother.

    // ---------------------------------------------------------------- Brynja, Hearthkeeper of Hearthold (a story lead)
    // Talks to the Great Hearth like a pet ("old girl"). Once called Ash's breath "a breath for candles". Her mother's
    // fire book has the Snow Mother's Song in it (q_n5_glaciar's pointer).
    f_brynja: [
      // (Act III, said brynja_small_fire) Ash told her his fire goes small when he is scared
      { if: 'said brynja_small_fire !flag n_dawn', once: true, fact: 'n5_moon=gone',
        say: ["You told me your fire goes small when you're scared. Mine is going small tonight, child. So is hers. We are minding each other.",
          'Your fire shrinks when you are scared. So does mine, tonight.'],
        re: [
          { t: ['Mine went small up there too.', 'Mine went small up there.'], tone: 'kind',
            say: ['Then it knows you. Small fires come back. Big ones burn out.', 'Small fires come back.'] },
          { t: ["Then I'll come back big.", "I'll come back big."], tone: 'brave',
            say: ['Come back any size, child. Just come back.', 'Any size. Just come back.'] },
        ] },
      { if: 'quest q_n5_glaciar active !flag f_song !item n5_song',
        say: ["The Snow Mother's Song? My mother wrote it in the front of the fire book: if the fire ever runs low, remember the song. The old songs are still up there somewhere, frozen.",
          "Remember the Snow Mother's Song. The old songs are frozen up there."],
        re: [
          { t: ['Can you sing it for me?', 'Can you sing it?'],
            say: ['I know the first line, child, and then it goes. The rest went cold when I was small.', 'Only the first line. The rest went cold.'] },
          { t: ['Frozen where?', 'Frozen where?'],
            say: ['Wherever the singers are. Your mountain copies everything, they say. Even singers.', 'Where the singers are. The mountain copies singers too.'] },
        ] },
      { if: 'quest q_n5_glaciar active !flag n5_glaciar', fact: 'n5_glaciar_bed=asleep',
        say: ["You have the song? Then sing it to her, all three verses. Don't skip the middle one. Everyone skips the middle one.", 'Sing her all three verses. Not just two!'],
        re: [
          { t: ["What's the middle verse about?", 'What is the middle verse?'],
            say: ['A girl with horns. Somebody in your family, I would say.', 'A girl with horns. Your family, I think.'] },
          { t: ['Will it really wake her?', 'Will it wake her?'],
            say: ['It was made to sing her to sleep, long ago. A song that can do one can do the other.', 'It put her to sleep once. It can wake her.'] },
        ] },
      { if: 'flag n5_glaciar !choice f_glaciar=free', once: true,
        say: ['She flew over the Hearth this morning, low and slow, with the chains gone. Every icicle in town played a note.', 'Glaciar flew over us! Free!'],
        re: [
          { t: ['She kept her promise. So did I.', 'We both kept our promise.'], tone: 'kind',
            say: ['Then that is two promises kept in one week. Hearthold has not seen that in a hundred years.', 'Two promises kept. Hearthold is amazed.'] },
          { t: ['Did the Hearth say hello?', 'Did the Hearth say hello?'],
            say: ['She roared. Blue, all the way up the chimney. I had to sit down.', 'She roared blue. I had to sit down.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Seventy years I have kept this fire. Tonight I am keeping it for you. Every log.', 'Tonight I keep this fire for you.'],
        re: [
          { t: ['Want a breath for candles?', 'Want a breath for candles?'], tone: 'silly', then: ['said brynja_candles'],
            say: ['Cheek. ...Yes. Gently, mind. She is a bit nervous tonight.', 'Cheek. Yes. Gently. She is nervous.'] },
          { t: ['Is the old girl all right?', 'Is the Hearth all right?'], tone: 'kind',
            say: ['Hungry and jumpy. She knows something is wrong up there. So do the logs.', 'Hungry and jumpy. She knows.'] },
        ] },
      { if: 'said brynja_candles flag n_dawn', once: true,
        say: ['That little breath you gave her kept her going the whole Long Night. She will not let me forget it.', 'Your little breath kept her going.'],
        re: [
          { t: ["It wasn't little.", "It wasn't little."], tone: 'brave',
            say: ['No. It was not. Cheek.', 'No. It was not. Cheek.'] },
          { t: ['Can I give her another one?', 'Can I give her another?'],
            say: ['Gently. She is still a bit spoilt from the last one.', 'Gently. She is still spoilt.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The sun came up over the Hearth this morning and the whole town cheered. The fire cheered too. I heard it.', 'The sun came up! Even the fire cheered.'],
        re: [
          { t: ['What does a fire cheer sound like?', 'How does a fire cheer?'],
            say: ['Like a log falling in. Just the once. Then a great many sparks.', 'A log falls in. Then lots of sparks.'] },
          { t: ['Will you take a rest now?', 'Will you rest now?'],
            say: ['A nap. Beside her. With one eye open.', 'A nap. Beside her. One eye open.'] },
        ] },
      { if: '!flag n_dawn', say: [["There, there, old girl. Every log, for him.", "Every log, for him."]] },
      { if: 'flag n_dawn', say: [["Burn blue, old girl. Burn for the morning.", "Burn blue, old girl."]] },
      { ask: ['Who keeps the fire when you sleep?', 'Who keeps it when you sleep?'],
        say: ["Brann, if I'm desperate. He talks to her like a soldier. She doesn't care for it.", 'Brann. He talks to her like a soldier.'] },
      { idle: [['There, there, old girl. ...Yes, child?', 'Yes, child?'], ['Mind the sparks. Go on.', 'Go on.']] },
      { bye: [['Keep warm, child. Keep her warm, too.', 'Keep warm.']] },
      { bark: true, if: '!flag n_dawn', fact: 'n5_moon=gone', say: ['There, there, old girl. Burn for him.', 'Burn, old girl.'] },
    ],

    // ---------------------------------------------------------------- Captain Brann, the Hearthwardens
    // Loud, brave, afraid of moths. Sir Knut's patrol came home (Act III). Gunnar is still a snowman.
    f_brann: [
      // (Act III, said brann_still) Ash's answer to "a moth lands on your nose"
      { if: 'said brann_still !flag n_dawn', once: true,
        say: ['You told me once: stay very still, and be brave. I have been very still all week! The brave part comes and goes!', 'Stay still and be brave, you said. I am still! Brave comes and goes.'],
        re: [
          { t: ['That still counts, Captain.', 'That still counts.'], tone: 'kind',
            say: ['Does it? Good! Then I will keep standing right here.', 'Good! I will keep standing here.'] },
          { t: ['Has a moth landed on you?', 'Did a moth land on you?'],
            say: ['Twice! I stood like a statue! Then I screamed, very quietly, inside my helmet.', 'Twice! I screamed inside my helmet.'] },
        ] },
      // the Mayor told the town (said toast_scared: Ash told her it was all right not to be fine)
      { if: 'said toast_scared !flag n_dawn', once: true,
        say: ['The Mayor stood up in the square and said she was terrified! Then everybody said they were too! Best town meeting we ever had!', 'The Mayor said she was scared. So did everyone!'],
        re: [
          { t: ['Did you say it too?', 'Did you say it too?'],
            say: ['I said I was cautiously concerned. Loudly. ...I was terrified.', 'I said "concerned". I was terrified.'] },
          { t: ['Does everyone feel better?', 'Does everyone feel better?'], tone: 'kind',
            say: ['Much! We are all terrified together! It is very cosy!', 'Much! Scared together. Cosy!'] },
        ] },
      { if: { all: ['!flag n_dawn', { any: ['flag n5_hush', 'choice m_hush=free'] }] },
        say: ["They say the white moth from the Dreadgate is on your side now. Is that true? I've moved my bed into the barracks.", 'Is the white moth your friend now? I moved my bed.'],
        re: [
          { t: ["She's small now. And nice.", 'She is small and nice.'],
            say: ['Small and nice is how they get you!', 'That is how they get you!'] },
          { t: ['She says shhh a lot.', 'She says shhh a lot.'],
            say: ['So does my mother. I am also afraid of my mother.', 'So does my mother. I fear her too.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['I am not afraid of the Night Mother! I simply respect her from a very large distance! Indoors!', 'I respect the Night Mother. From far away!'],
        re: [
          { t: ["She's a moth, you know.", "She's a moth, you know."],
            say: ['I know! A very large one! That is why the distance is large!', 'I know! A big one! So I stay far away!'] },
          { t: ["I'll tell her you said hello.", "I'll say hello for you."], tone: 'silly',
            say: ['Do not tell her I said hello! ...Tell her I said goodbye. Firmly.', 'No! Tell her goodbye. Firmly.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['I was never afraid. I was guarding the inside of my house. Very bravely.', 'I bravely guarded my house.'],
        re: [
          { t: ['Was the inside safe?', 'Was the inside safe?'],
            say: ['Not one moth got in. I checked every cupboard. Twice. With a spoon.', 'Not one moth. I checked with a spoon.'] },
          { t: ['You were very brave, Captain.', 'You were brave, Captain.'], tone: 'kind',
            say: ['I was! ...I was a bit. Thank you, Ash.', 'I was! A bit. Thank you.'] },
        ] },
      { if: '!flag n_dawn', say: [["Hearthwardens! Stand straight! ...Gunnar, that is still a snowman.", "Stand straight, Hearthwardens!"]] },
      { if: 'flag n_dawn', say: [["Hearthwardens! At ease! ...Gunnar, you too.", "At ease, Hearthwardens!"]] },
      { ask: ["How is Sir Knut's patrol?", "How is Knut's patrol?"],
        say: ['Thawed, fed, and back on the walls. Six blue plumes. I count them every morning. Gunnar is still a snowman.', 'Back on the walls. Gunnar is still a snowman.'] },
      { idle: [['Stand up straight! ...Sorry. Habit. What?', 'What?'], ['Report, Ash!', 'Report!']] },
      { bye: [['Chin up! Plume high! Go!', 'Chin up!']] },
    ],

    // ---------------------------------------------------------------- Pim, the only cocoa stand in the north
    f_pim: [
      { if: '!flag n_dawn',
        say: ['Hot cocoa! Free tonight, for heroes only! ...Fine. Two coins. Heroes still pay.', 'Hot cocoa! Two coins. Heroes pay too.'],
        re: [
          { t: ['Is it hot enough?', 'Is it hot enough?'],
            say: ["Hottest thing in Hearthold after the Hearth. And you.", 'The hottest thing here. After the Hearth. And you.'] },
          { t: ['Do you ever give any away?', 'Do you give any away?'],
            say: ['To the guards on the wall at midnight. They pay in buttons.', 'To the guards at midnight. They pay in buttons.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["Sunrise cocoa! Same cocoa. Higher price. It's a special occasion.", 'Sunrise cocoa! Higher price.'],
        re: [
          { t: ['How much higher?', 'How much higher?'],
            say: ['Three coins. Or two, and you tell me what was at the top.', 'Three coins. Or two and a story.'] },
          { t: ['A goat was at the top.', 'A goat was at the top.'], tone: 'silly',
            say: ['A goat? On top of the world? That story is worth a coin off. Two coins.', 'A goat? Two coins, then.'] },
        ] },
      { if: '!flag n_dawn', say: [["Cocoa! Hot! Two coins!", "Cocoa! Two coins!"]] },
      { if: 'flag n_dawn', say: [["Cocoa! Sunrise price!", "Cocoa!"]] },
      { idle: [['Buying?', 'Buying?'], ['Two coins. What?', 'What?']] },
      { bye: [['Come back with coins!', 'Bring coins!']] },
    ],

    // ---------------------------------------------------------------- Soren, sled maker of Hearthold ("snow is slow water")
    f_soren: [
      { if: 'quest f_sled done', once: true,
        say: ['Elka is still telling everyone she raced you. She tells it faster every time.', 'Elka still tells everyone she raced you.'],
        re: [
          { t: ['She did beat me, nearly.', 'She nearly beat me.'],
            say: ['Nearly is the best word in sledding. It keeps you coming back.', 'Nearly keeps you coming back.'] },
          { t: ['I let her win, a bit.', 'I let her win a bit.'], tone: 'silly',
            say: ["Don't ever tell her that. She'll want a race to prove you didn't.", 'Never tell her. She will want a race.'] },
        ] },
      { if: '!flag n_dawn',
        say: ['When this is over I am building a sled big enough for a dragon. Two dragons.', 'I will build a sled for two dragons.'],
        re: [
          { t: ['Glaciar would need a big one.', 'Glaciar needs a big one.'],
            say: ["Then three dragons' worth. I'll need more wood. And a bigger hill.", 'Then a bigger sled. And a bigger hill.'] },
          { t: ['Is snow still slow water?', 'Is snow still slow water?'],
            say: ['Slower in the dark. Everything is.', 'Slower in the dark.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["I've started the dragon sled. It's mostly runners so far. Very long runners.", 'The dragon sled has very long runners.'],
        re: [
          { t: ['Can I test it?', 'Can I test it?'],
            say: ['When it has a seat and some brakes. Brakes first. Elka would skip them.', 'When it has brakes. Elka would skip them.'] },
          { t: ['Will it fit Duchess?', 'Will it fit Duchess?'],
            say: ['A goat? On my sled? ...She would steer, wouldn\'t she.', 'A goat would steer, I bet.'] },
        ] },
      { if: '!flag n_dawn', say: [["Snow is slow water. Tonight it is very slow.", "Snow is very slow tonight."]] },
      { if: 'flag n_dawn', say: [["Runners waxed, sleds ready, snow fast again. It's all downhill from here.", "The snow is fast again."]] },
      { idle: [['Mind the runners. What is it?', 'What is it?'], ['Mm? Go on. Talk slowly, like snow.', 'Go on.']] },
      { bye: [['Slide safe.', 'Slide safe.']] },
    ],

    // ---------------------------------------------------------------- Hask, fur trapper of the Pinewhisper ("pup")
    f_hask: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Hrm. Pup. A mountain made of night, eh. Wear a hat.', 'Hrm. Pup. Wear a hat.'],
        re: [
          { t: ['Will the dogs be all right?', 'Are the dogs all right?'],
            say: ["Dogs don't need a moon. They've got noses. Hrm.", 'Dogs have noses. They are fine.'] },
          { t: ['Why a hat?', 'Why a hat?'],
            say: ['Heads get cold. Even dragon ones. Hrm.', 'Heads get cold. Hrm.'] },
          { t: ['Ulf still says sheep.', 'Ulf still says sheep.'], if: 'said hask_dogs', tone: 'silly',
            say: ['Hrm. Ulf is wrong. Ulf is always wrong. Good man, though. Hrm.', 'Ulf is wrong. Good man, though.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["Hrm. Moon's back. The dogs howled. I didn't. Hrm. Maybe a bit.", 'Hrm. The dogs howled. Me too, a bit.'],
        re: [
          { t: ['Everybody howled.', 'Everybody howled.'],
            say: ['Hrm. Good. Then nobody saw me.', 'Good. Nobody saw me.'] },
          { t: ['I wore the hat.', 'I wore the hat.'],
            say: ['Hrm. Good pup.', 'Good pup.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Hrm. Dark. Hrm.", "Hrm. Dark."]] },
      { if: 'flag n_dawn', say: [["Hrm. Light. Hrm.", "Hrm. Light."]] },
      { idle: [['Hrm.', 'Hrm.'], ['Hrm. Pup?', 'Pup?']] },
      { bye: [['Hrm. Go on, pup.', 'Go on, pup.']] },
    ],

    // ---------------------------------------------------------------- Brother Pennant, the last Wind Monk (on a kite)
    f_pennant: [
      // (Act III, said pennant_hum) what the wind sounds like to Ash
      { if: 'said pennant_hum !flag n_dawn', once: true, fact: 'n5_moon=gone',
        say: ['You said the wind sounds like somebody humming far away. I listen for it every day now. Tonight the humming comes from your mountain.',
          'You said the wind hums. Tonight it hums from your mountain.'],
        re: [
          { t: ['Is it a sad hum?', 'Is it a sad hum?'],
            say: ["A lonely one. Like somebody singing to herself so she won't be scared. Wheee. Sorry.", 'A lonely one. Wheee. Sorry.'] },
          { t: ['Maybe it is a lullaby.', 'Maybe a lullaby.'], tone: 'kind',
            say: ["Then somebody up there wants to sleep, and can't.", 'Then somebody up there cannot sleep.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The wind is blowing the wrong way. Toward the mountain. It wants to watch. Wheee. Sorry.', 'The wind blows toward the mountain. Wheee.'],
        re: [
          { t: ['Can the wind take me up there?', 'Can the wind take me up?'],
            say: ["It can try. Hold on and don't look down. That's the whole of Wind Monk training.", "Hold on. Don't look down. That is all of it."] },
          { t: ['Why do you say wheee?', 'Why say wheee?'],
            say: ['It just comes out. Forty years on a kite. Wheee. There it goes again.', 'It just comes out. Wheee.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The wind is blowing home again. Wheee! ...It just comes out.', 'The wind blows home. Wheee.'],
        re: [
          { t: ['Did it like the view?', 'Did it like the view?'],
            say: ['It came back very pleased with itself, and a little bit gold.', 'It came back pleased. And a bit gold.'] },
          { t: ['Wheee.', 'Wheee.'], tone: 'silly',
            say: ['Wheee! Oh, thank you. Nobody ever says it back.', 'Wheee! Nobody says it back!'] },
        ] },
      { if: '!flag n_dawn', say: [["The kite wants to go up the mountain. I said no. Wheee.", "My kite wants to go up. Wheee."]] },
      { if: 'flag n_dawn', say: [["Wheee. Good wind today.", "Good wind. Wheee."]] },
      { idle: [['Hold the string a moment. Yes?', 'Yes?'], ['Mm? The wind is listening. So am I.', 'Go on.']] },
      { bye: [['Wheee. Sorry. Goodbye.', 'Wheee. Bye.']] },
    ],

    // ---------------------------------------------------------------- Mayor Toastwhistle of Hearthold ("Everything is fine!")
    f_toastwhistle: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Everything is fine! The Hearth is fine! The moon is... not fine. I am fine! Why is my voice so high?', 'Everything is fine! Except the moon!'],
        re: [
          { t: ["It's all right not to be fine.", "It's okay not to be fine."], tone: 'kind', f: 0.75, then: ['said toast_scared'],
            say: ["Is it? ...Oh. Oh, that's a relief. I'm terrified.", 'Is it? Oh, good. I am terrified.'] },
          { t: ['Your voice is fine, Mayor.', 'Your voice is fine.'],
            say: ['Thank you! It is very fine. It is just higher.', 'Thank you! Just higher.'] },
          { t: ['You said you might be brave.', 'You might be brave.'], if: 'said toast_brave',
            say: ["I said might! ...Scared, and doing it anyway. Look at me. I'm doing it.", 'I said might! Scared, and doing it. Look!'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Everything is actually fine! My voice is still high. That is just how it is now.', 'Everything is really fine now!'],
        re: [
          { t: ['How does actually fine feel?', 'How does it feel?'],
            say: ['Strange! Quieter! I keep waiting for something to go wrong. Nothing does. It is wonderful.', 'Quiet! Nothing goes wrong!'] },
          { t: ['Give the Hearth a medal.', 'Give the Hearth a medal.'], tone: 'silly',
            say: ['I tried. It melted. That was fine too!', 'It melted. That was fine!'] },
        ] },
      { if: '!flag n_dawn', say: [["Fine! All fine! Very fine!", "Fine! All fine!"]] },
      { if: 'flag n_dawn', say: [["Actually fine! Really! Very!", "Really fine!"]] },
      { idle: [['Fine! What is it?', 'Fine! What?'], ['Everything is fine. Go on.', 'Go on.']] },
      { bye: [['Goodbye! Fine! Goodbye!', 'Goodbye!']] },
    ],

    // ---------------------------------------------------------------- Gunnhild, smith of Hearthold, a big fan of Mom
    f_gunnhild: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['My forge burns all night now. If you come back with a dented sword, I will be ready.', 'My forge is ready for your sword.'],
        re: [
          { t: ['Did Mom write back?', 'Did Mom write back?'], if: 'said gunnhild_send',
            say: ['Three lines, like you said she would. I have read them forty times.', 'Three lines. I read them forty times.'] },
          { t: ["Mom's watching the bridge.", 'Mom is watching the bridge.'],
            say: ['Of course she is. A smith never leaves a fire burning with nobody watching.', 'Of course. A smith always watches the fire.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ["Bring me that sword. Let's see what a mountain does to an edge.", 'Show me your sword.'],
        re: [
          { t: ['It hit a lot of glass.', 'It hit a lot of glass.'],
            say: ['I can see. Glass is worse than rock. Sit. This will take an hour, and I will enjoy every minute.', 'Glass is worse than rock. Sit. An hour.'] },
          { t: ['Mom already sharpened it.', 'Mom sharpened it.'],
            say: ['...So she did. Look at that edge. I would not touch it for all the ore in Frostreach.', 'So she did. I will not touch it.'] },
        ] },
      { if: '!flag n_dawn', say: [["Clang. Clang. The forge is hot. Bring me anything.", "The forge is hot."]] },
      { if: 'flag n_dawn', say: [["Clang! Happy clang. Bring me that sword.", "Bring me your sword."]] },
      { idle: [['Clang. What is it?', 'What is it?'], ['Speak up over the anvil.', 'Speak up.']] },
      { bye: [["Give your mother my best. All of it.", 'Say hi to your mom.']] },
    ],

    // ---------------------------------------------------------------- Mags, a Gearhaven tinker who loves explosions
    f_mags: [
      { if: '!flag n_dawn',
        say: ['I built a lantern that never goes out! It went out. I am building another one.', 'My lantern went out. Building another.'],
        re: [
          { t: ['What went wrong?', 'What went wrong?'],
            say: ["It ran out of fire. So I'm adding more fire.", 'It ran out of fire. I am adding more.'] },
          { t: ['Will this one explode?', 'Will it explode?'], tone: 'silly',
            say: ['Oh, definitely. That part is easy. It is the not-going-out part that is hard.', 'Yes. That part is easy.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["The new lantern hasn't gone out yet! It's been nearly an hour. That's a record.", 'My new lantern is still lit! A record!'],
        re: [
          { t: ['How did you do it?', 'How did you do it?'],
            say: ['I asked your mom. She said: put it out of the wind. ...It is out of the wind.', 'Your mom said: keep it out of the wind.'] },
          { t: ['Has it exploded yet?', 'Has it exploded?'],
            say: ['Not yet. Give it time.', 'Not yet. Give it time.'] },
        ] },
      { if: '!flag n_dawn', say: [["Hold this. Do not drop it. Do not shake it.", "Hold this. Do not shake it."]] },
      { if: 'flag n_dawn', say: [["Still lit! Still lit! I am not touching it.", "Still lit!"]] },
      { idle: [['If it explodes, it is science. What?', 'What?'], ['Hold this. No, not that end. What?', 'What?']] },
      { bye: [['Stand well back on your way out!', 'Stand back!']] },
    ],

    // ---------------------------------------------------------------- Hilde, the Warm Mitten inn (Biscuit the cat)
    f_hilde: [
      { if: '!flag n_dawn',
        say: ['Beds at the Warm Mitten, any time. Biscuit the cat will sit on your feet for free.', 'A bed any time. The cat sits on you.'],
        re: [
          { t: ['Is Biscuit warm?', 'Is Biscuit warm?'],
            say: ["Biscuit is the warmest thing in Hearthold. Ask anyone she's sat on.", 'The warmest thing in Hearthold.'] },
          { t: ['Are you feeding everybody?', 'Are you feeding everyone?'], tone: 'kind',
            say: ["Everybody, twice. I've started on the chairs.", 'Everybody, twice. And the chairs.'] },
          { t: ['Gilly says your soup needs fish.', 'Gilly says: more fish.'], if: 'said gilly_hilde', tone: 'silly',
            say: ["She would. I put salt in hers. We've never met. I love her.", 'She would. We never met. I love her.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['Breakfast for the whole town, and Biscuit has eaten the first plate. Sit down.', 'Breakfast for everyone! Sit down.'],
        re: [
          { t: ['What is for breakfast?', "What's for breakfast?"],
            say: ['Everything I cooked while I was worried. So, a great deal.', 'Everything I cooked while worried. Lots.'] },
          { t: ['Biscuit can have mine.', 'Biscuit can have mine.'], tone: 'kind',
            say: ['She has already decided that. Eat the next one fast.', 'She already decided. Eat fast.'] },
        ] },
      { if: '!flag n_dawn', say: [["Soup, beds, and Biscuit. In that order.", "Soup, beds and Biscuit."]] },
      { if: 'flag n_dawn', say: [["Breakfast's on. Biscuit has had hers.", "Breakfast is on."]] },
      { idle: [['Sit, sit. Have a bun. What is it?', 'Sit. What is it?'], ['Biscuit, move. ...Yes?', 'Yes?']] },
      { bye: [['Mittens on! Come back hungry!', 'Mittens on!']] },
    ],

    // ---------------------------------------------------------------- Eider, archivist of the Hearth Archive; Wren's cousin
    f_eider: [
      { if: 'flag f_page11', once: true,
        say: ['Wren wrote to me about the eleventh page. Four pages about one page. I read it twice.', 'Wren wrote me four pages about one page.'],
        re: [
          { t: ['Was it a good letter?', 'Was it good?'],
            say: ['It was very Wren. Every third word underlined. Shh.', 'Very Wren. Every third word underlined.'] },
          { t: ['She sleeps with it, you know.', 'She sleeps with it.'], if: 'flag m_page11', tone: 'silly',
            say: ['I know. She sleeps with all of them. It runs in the family. Shh.', 'I know. It runs in the family.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Shh. Sorry. Not you. The books. They are nervous about the moon.', 'Shh. The books are nervous.'],
        re: [
          { t: ['Books can be nervous?', 'Can books be nervous?'],
            say: ['Old ones can. They have never had to write about a night like this. Shh.', 'Old ones can. This night is new to them.'] },
          { t: ['Wren is writing it all down.', 'Wren is writing it down.'],
            say: ['She sends me every page. Her spelling gets worse the further she sails. Shh.', 'Her spelling gets worse at sea.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Shh. The books are calm again. One of them sighed. I wrote that down.', 'The books are calm. One sighed.'],
        re: [
          { t: ['Which book sighed?', 'Which book?'],
            say: ['The oldest one. About the first Lantern Day. Shh. It knew the ending.', 'The oldest one. It knew the ending.'] },
          { t: ['Can I shout now?', 'Can I shout now?'], tone: 'silly',
            say: ['No. Shh. ...Maybe very quietly.', 'No. Shh. Maybe quietly.'] },
        ] },
      { if: '!flag n_dawn', say: [["Shh. The books are listening.", "Shh."]] },
      { if: 'flag n_dawn', say: [["Shh. Calm books today.", "Shh. Calm books."]] },
      { idle: [['Shh. Yes?', 'Shh. Yes?'], ['Quietly. Go on.', 'Quietly.']] },
      { bye: [['Shh. Goodbye.', 'Shh. Bye.']] },
    ],

    // ======================================================================= map 3, Moonfall (Act IV's people)
    // (J12) Moonfall saw Ash mend the Heart with his mother and walk onto the moonfire bridge. The pier cast is above.

    // ---------------------------------------------------------------- Elder Ripple, the Pearl Archive in Coralcombe
    // Slow, kind, forgetful; apologises to fish. Knows the Book of Moths (m_leash) and how to melt moon-silk (q_n5_hush).
    m_ripple: [
      { if: 'quest m_leash active !flag m_vault_open',
        say: ["The priests' Book of Moths! It lies in the vault of the Drowned Library, sealed with moon-wax. Only Moonfire melts it.",
          'The Book of Moths is in the Drowned Library. Melt the vault with Moonfire.'],
        re: [
          { t: ['Will the book still be dry?', 'Will it be dry?'],
            say: ['Under the sea for five hundred years? Wet. But the priests wrote in squid ink. Squid ink does not mind.', 'Wet. But squid ink does not mind.'] },
          { t: ['How hot is Moonfire?', 'How hot is Moonfire?'],
            say: ['Not hot at all, dragon. Cool, like a hand on your head. That is why wax lets it in.', 'Not hot. Cool, like a hand.'] },
        ] },
      { if: 'quest q_n5_hush active flag m_leash_known',
        say: ['Gently, dragon. Moon-silk listens to soft breath. Like blowing on soup.', 'Gently. Like blowing on soup.'],
        re: [
          { t: ['How gently?', 'How gently?'],
            say: ['Gentler than that. Gentler than you think. Then a little more gently.', 'Gentler than you think.'] },
          { t: ['Will it hurt her?', 'Will it hurt her?'], tone: 'kind',
            say: ['Tied things always hurt a little. Untying them only hurts a little more, and then not at all.', 'A little. Then not at all.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['The tide has not moved in days. The whole sea is holding its breath, dragon.', 'The whole sea holds its breath.'],
        re: [
          { t: ['Are the fish all right?', 'Are the fish okay?'],
            say: ['Confused. I have said sorry to every one of them. Personally.', 'Confused. I said sorry to each one.'] },
          { t: ['Is the Pearl Archive safe?', 'Is the Archive safe?'],
            say: ['Safe, and very still. I have read every pearl twice. I have forgotten them twice. Lovely.', 'Safe. I read every pearl twice. And forgot.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The tide came back this morning, and every fish in Coralcombe is swimming in circles. It is wonderful, dragon.', 'The tide is back! The fish swim in circles!'],
        re: [
          { t: ['Did you apologise to the fish?', 'Did you say sorry?'], tone: 'silly',
            say: ['I said "well done". They did not know what to do with it.', 'I said "well done". They were confused.'] },
          { t: ['Will you write it in a pearl?', 'Will you write a pearl?'],
            say: ['I already have. Then I forgot where I put it. It will turn up.', 'I did. I forgot where. It will turn up.'] },
        ] },
      { if: '!flag n_dawn', say: [["The sea is very still, dragon. I keep saying sorry to it.", "The sea is very still."]] },
      { if: 'flag n_dawn', say: [["The tide is moving. I have apologised to it for staring.", "The tide moves again."]] },
      { ask: ['Did the moon-priests know about Nyx?', 'Did the priests know Nyx?'], if: 'clue n5_her_name',
        say: ['They wrote about a little moth who loved the moon too much. I forget the rest. I am sorry. I am always sorry.', 'A little moth who loved the moon. I forget the rest.'] },
      { idle: [['Mm? Sorry, dragon. I was somewhere else. Go on.', 'Sorry. Go on.'], ['Slowly, dragon. I am listening slowly.', 'Go on.']] },
      { bye: [['Swim carefully. Apologise to the fish.', 'Swim carefully.']] },
    ],

    // ---------------------------------------------------------------- Old Winnie, the Tidewife of Driftwood (an octopus at home)
    m_winnie: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['When someone eats the moon, the tide gets the hiccups, child. Now it does not even hiccup. It just waits.', 'Now the tide just waits.'],
        re: [
          { t: ['What is it waiting for?', 'What is it waiting for?'],
            say: ['The moon, child. Same as you, and me, and the octopus.', 'The moon. Like us. And the octopus.'] },
          { t: ['Can you read the stars instead?', 'Can you read the stars?'],
            say: ['I can. They mostly say "be patient". Stars are very dull.', 'They say "be patient". Dull.'] },
          { t: ['Ripple kept every bottle.', 'Ripple kept every bottle.'], if: 'said ripple_hello', tone: 'kind',
            say: ['Every one? In a clam, under his bed? ...Oh, that old fool. Hiccup.', 'Every one? Oh, that old fool. Hiccup.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['Hiccup. There. The tide is back. Hiccup.', 'Hiccup. The tide is back.'],
        re: [
          { t: ['Is that you or the tide?', 'You or the tide?'], tone: 'silly',
            say: ['Both of us, child. We have been holding it in.', 'Both. We held it in.'] },
          { t: ['Is Driftwood safe now?', 'Is Driftwood safe?'],
            say: ['Safe. The sea has remembered its manners. The rafts can stop holding hands.', 'Safe. The sea has its manners back.'] },
        ] },
      { if: '!flag n_dawn', say: [["The tide just waits, child. So do we.", "The tide waits. So do we."]] },
      { if: 'flag n_dawn', say: [["Hiccup. ...Sorry. The tide again.", "Hiccup. The tide."]] },
      { ask: ['How is your octopus?', 'How is the octopus?'],
        say: ['Sulking in the teapot. He hates the dark. Eight arms, and every one of them sulking.', 'Sulking in the teapot. All eight arms.'] },
      { idle: [['Mm, child? The sea is listening.', 'Mm, child?'], ['Sit, child. Mind the octopus.', 'Sit, child.']] },
      { bye: [['Go with the tide, child. It knows the way again.', 'Go with the tide.']] },
    ],

    // ---------------------------------------------------------------- Mayor Dabble of Driftwood Landing (wet socks, dry jokes)
    m_dabble: [
      { if: '!flag n_dawn',
        say: ['Driftwood Landing stays put for you tonight! First time in history! We tied it to a rock.', 'We tied the town to a rock for you!'],
        re: [
          { t: ['Is the Maren still floating?', 'Is the Maren floating?'], if: 'said dabble_raft_maren',
            say: ['The Maren is the one tied tightest to the rock. Rowan says she pulls the others in. She would.', 'She is tied tightest. She pulls the others in.'] },
          { t: ['Which rock?', 'Which rock?'],
            say: ['A big one. It was here first. It is being very good about it.', 'A big one. It is being very good.'] },
          { t: ["Won't the town mind?", 'Does the town mind?'],
            say: ['The town loves it. For one night we are a proper town, with a proper rock. Very dull. I love it.', 'For one night we are a proper town!'] },
        ] },
      { if: 'flag n_dawn',
        say: ["We untied the rock this morning, and the whole town drifted off. Like me in council meetings.", 'We untied the rock. The town drifted. Fine.'],
        re: [
          { t: ['Where is it drifting?', 'Where is it going?'],
            say: ['Wherever the tide likes. Now there is a tide again, it has opinions.', 'Wherever the tide likes.'] },
          { t: ['Are your socks dry yet?', 'Dry socks yet?'], tone: 'silly',
            say: ['Nobody in Driftwood has had dry socks in a hundred years. It is a tradition.', 'Nobody here has dry socks. Tradition.'] },
        ] },
      { if: '!flag n_dawn', say: [["Still tied to the rock. Still very dull. Lovely.", "Still tied to the rock."]] },
      { if: 'flag n_dawn', say: [["Drifting again. Mind your socks.", "Drifting again."]] },
      { idle: [['Squelch. Yes?', 'Yes?'], ['Mind the gap between the rafts. Go on.', 'Go on.']] },
      { bye: [['Mind the gaps! Every one!', 'Mind the gaps!']] },
    ],

    // ---------------------------------------------------------------- Rowan, raft-builder and ferry captain (a knot for every feeling)
    m_rowan: [
      { if: '!flag n_dawn',
        say: ['This knot means "good luck". This one means "come back". I tied them both round the pier post, so you can find your way home.', 'I tied good-luck knots for you.'],
        re: [
          { t: ["What's the knot for scared?", "What's the scared knot?"],
            say: ['This one. It holds better than all the others. Funny, that.', 'This one. It holds best. Funny.'] },
          { t: ['Tie one for Mom.', 'Tie one for Mom.'], tone: 'kind', then: ['said rowan_mom'],
            say: ['I did. It means "he will be fine". It is a very tight knot.', 'I did. It means "he will be fine".'] },
        ] },
      { if: 'flag n_dawn',
        say: ['I untied the "come back" knot this morning. You came back. Knots work.', 'I untied the "come back" knot. It worked!'],
        re: [
          { t: ['What will you tie next?', 'What knot next?'],
            say: ['"Thank you." It is a very small knot. Hard to get right.', '"Thank you." A small, hard knot.'] },
          { t: ['Can you teach me one?', 'Teach me one?'],
            say: ['The "come back" knot. Give me your claws. Over, under, round, and pull. There.', 'The "come back" knot. Over, under, pull.'] },
        ] },
      { if: '!flag n_dawn', say: [["Every knot on the pier says \"come back\". I keep checking them.", "Every knot says \"come back\"."]] },
      { if: 'flag n_dawn', say: [["New knots today. Happy ones.", "Happy knots today."]] },
      { idle: [['Hold this rope. Yes?', 'Yes?'], ['Mm? I was knotting.', 'Go on.']] },
      { bye: [['Tie it tight, wherever you go.', 'Tie it tight.']] },
    ],

    // ---------------------------------------------------------------- Squint, Driftwood's lookout (the eyepatch is pretend)
    m_squint: [
      { if: '!flag n_dawn',
        say: ['MOUNTAIN HO! ...It is always there now. MOUNTAIN HO anyway.', 'MOUNTAIN HO!'],
        re: [
          { t: ['Can you see me on it?', 'Can you see me on it?'],
            say: ["I can see a speck. I'm calling it you. SPECK HO!", 'A speck. I call it you. SPECK HO!'] },
          { t: ['Is the eyepatch real?', 'Is the eyepatch real?'],
            say: ['No. The looking is.', 'No. The looking is.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['MOON HO! ...It is just the moon. MOON HO anyway!', 'MOON HO!'],
        re: [
          { t: ['Moon ho!', 'Moon ho!'], tone: 'silly',
            say: ['You said it! Nobody ever says it with me! MOON HO!', 'You said it! MOON HO!'] },
          { t: ['Is Ned all right?', 'Is Ned all right?'],
            say: ['He waved his lamp at me all night. He says it was to see the rocks. It was to see me.', 'He waved his lamp at me all night.'] },
        ] },
      { if: '!flag n_dawn', say: [["MOUNTAIN HO!", "MOUNTAIN HO!"]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["MOON HO!", "MOON HO!"]] },
      { idle: [['Ho? What ho?', 'What?'], ['Looking out. Go on.', 'Go on.']] },
      { bye: [['DRAGON HO! ...Going. Bye!', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Gilly, the Floating Kitchen (fish in everything)
    m_gilly: [
      { if: '!flag n_dawn',
        say: ['Fish stew for the road! I tried fish cocoa again. Still not going well. Take the stew.', 'Fish stew for you! Not fish cocoa.'],
        re: [
          { t: ['What went wrong with the cocoa?', 'What was wrong?'],
            say: ['The fish. Every time, the fish.', 'The fish. Every time.'] },
          { t: ['Tikka says no fish in buns.', 'Tikka says no fish.'], if: 'flag tk_come=yes',
            say: ['Tikka is wrong, and I love her, and she is wrong.', 'Tikka is wrong. I love her. Wrong.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["Fish pancakes! For the dragon who came back! Don't make that face.", 'Fish pancakes for you!'],
        re: [
          { t: ['Is there fish in all of them?', 'Fish in all of them?'],
            say: ['Only in the good ones. They are all good ones.', 'Only the good ones. All of them.'] },
          { t: ["I'll eat one. To be polite.", "I'll eat one."], tone: 'kind',
            say: ['Polite! Ha! You will have three.', 'Ha! You will have three.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["Fish stew! Hot! Dark! Fish!", "Fish stew!"]] },
      { if: 'flag n_dawn', say: [["Fish everything! Sit! I'm not squidding!", "Fish everything!"]] },
      { idle: [['Hungry? Of course you are.', 'Hungry?'], ['Stir this. What is it?', 'What is it?']] },
      { bye: [['Take a fish for the road!', 'Take a fish!']] },
    ],

    // ---------------------------------------------------------------- Old Ned, the Gull Isle lighthouse (grumpy; fond of Squint)
    m_ned: [
      { if: '!flag n_dawn',
        say: ['The moths are gone. Every last one. Flew up the mountain. I hate moths. I miss them a bit.', 'The moths all flew away. I miss them a bit.'],
        re: [
          { t: ['Why do you miss them?', 'Why miss them?'],
            say: ["They sat on my lamp. Somebody to talk to. Don't tell Squint.", 'They sat on my lamp. Shh.'] },
          { t: ["I'll send one back for you.", "I'll send one back."], tone: 'kind', then: ['said ned_moth'],
            say: ["Don't you dare. ...A small one.", "Don't you dare. ...A small one."] },
        ] },
      { if: 'flag n_dawn choice n_end=moth',
        say: ['One little grey moth came back to my lamp last night. Just one. I let her stay.', 'One little moth came back. I let her stay.'],
        re: [
          { t: ['Her name is Nyx, Ned.', 'She is Nyx.'],
            say: ['Nyx. Hm. She can stay, then. Only her. And only on the lamp.', 'Hm. She can stay. On the lamp.'] },
          { t: ['Do you talk to her?', 'Do you talk to her?'],
            say: ['Every night. She does not talk back. Best friend I ever had.', 'Every night. She does not talk back. Good.'] },
          { t: ['I said I would send one.', 'I said I would.'], if: 'said ned_moth', tone: 'silly',
            say: ['So you did. I said a small one. ...She is very small. Good.', 'I said small. She is small. Good.'] },
        ] },
      { if: 'flag n_dawn',
        say: ["The lamp's got moths on it again. Three of them. I'm not complaining. Yes I am.", 'Three moths are back. I am complaining.'],
        re: [
          { t: ["You're glad, really.", 'You are glad, really.'],
            say: ['Hmph. Maybe. A bit. Mind the lamp.', 'Hmph. A bit.'] },
          { t: ['Shall I shoo them off?', 'Shall I shoo them?'],
            say: ['Leave them. They are not hurting anything. Mind the lamp.', 'Leave them. Mind the lamp.'] },
        ] },
      { if: '!flag n_dawn', say: [["Lamp lit. No moths. Hmph.", "Lamp lit. No moths."]] },
      { if: 'flag n_dawn', say: [["Lamp lit. Moths on it. Hmph.", "Lamp lit. Moths on it."]] },
      { idle: [['Mind the lamp. What?', 'What?'], ['Hmph. Go on.', 'Go on.']] },
      { bye: [['Mind the stairs going down. All two hundred.', 'Mind the stairs.']] },
    ],

    // ---------------------------------------------------------------- Saffron, the Well-Warden of Sable ("Do not touch the well.")
    m_saffron: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Do not touch the well. It is very tired. It has seen a lot this week.', 'Do not touch the well. It is tired.'],
        re: [
          { t: ['What did it see?', 'What did it see?'],
            say: ['The moon in it, every night for a thousand years. Then nothing. It keeps looking.', 'The moon, every night. Then nothing.'] },
          { t: ['Did she drink from it?', 'Did she drink from it?'],
            say: ['She drank it dry, once. It filled again. Wells are like that. Do not touch it.', 'She drank it dry. It filled again.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon is in the well again. Do not touch it. Especially now.', 'The moon is in the well. Do not touch!'],
        re: [
          { t: ['Can I look?', 'Can I look?'],
            say: ['Look. Do not touch. Looking is allowed.', 'Look. Do not touch.'] },
          { t: ['I would never touch it.', 'I would never touch it.'], tone: 'kind',
            say: ['Everybody says that. ...You might be the first who means it.', 'Everyone says that. You might mean it.'] },
          { t: ['Did you breathe, like I said?', 'Did you breathe?'], if: 'said saffron_breathe',
            say: ['I breathed. I was even a little kind to the moth. Do not touch the well.', 'I breathed. I was a bit kind. Do not touch.'] },
        ] },
      { if: '!flag n_dawn', say: [["Do not touch the well.", "Do not touch the well."]] },
      { if: 'flag n_dawn', say: [["Do not touch the well. Not even now.", "Do not touch the well."]] },
      { idle: [['Do not touch the well. Yes?', 'Yes?'], ['Mm? Hands where I can see them.', 'Hands up. Yes?']] },
      { bye: [['Go. Do not touch anything on the way.', 'Go.']] },
    ],

    // ---------------------------------------------------------------- Kiln, glassblower of Sable (a bit deaf; sets small things on fire)
    m_kiln: [
      { if: '!flag n_dawn',
        say: ['I made you a glass lantern for the mountain. It came out shaped like a shoe. The glass had other ideas.', 'I made you a shoe-shaped lantern.'],
        re: [
          { t: ["I'll take the shoe.", "I'll take the shoe."], tone: 'kind',
            say: ['Eh? Shoe? Yes! It is a shoe! Take it!', 'A shoe! Yes! Take it!'] },
          { t: ['Was it meant to be a shoe?', 'Was it meant to be a shoe?'],
            say: ["Eh? A lantern. Then the glass wanted to be a shoe. You don't argue with glass.", 'No. But you do not argue with glass.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['Eh? The moon is back? I made a glass moon. It came out shaped like a moon! First time ever!', 'I made a glass moon. It looks like a moon!'],
        re: [
          { t: ['It looks perfect.', 'It looks perfect.'], tone: 'kind',
            say: ['Eh? Perfect? ...I will make a hundred. Ninety will be shoes.', 'Perfect? I will make a hundred.'] },
          { t: ['Is it on fire?', 'Is it on fire?'], tone: 'silly',
            say: ['Eh? Only a little. That is how you know it is finished.', 'A little. That means it is done.'] },
        ] },
      { if: '!flag n_dawn', say: [["EH? Glass! Hot! Mind out!", "Hot glass!"]] },
      { if: 'flag n_dawn', fact: 'n5_moon=back', say: [["EH? More moons! Mostly shoes!", "More moons! Mostly shoes!"]] },
      { idle: [['EH? Speak up!', 'Eh?'], ['Mind the hot glass. What?', 'What?']] },
      { bye: [['EH? Bye! Mind your tail!', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Esme, Keeper of Lamps in Sable (names every lamp; Bertha)
    m_esme: [
      { if: '!flag n_dawn',
        say: ['All twelve lamps of Sable are lit for you tonight. Bertha is burning extra bright. She likes you.', 'All twelve lamps are lit for you.'],
        re: [
          { t: ['Thank Bertha for me.', 'Thank Bertha for me.'], tone: 'kind',
            say: ["She heard. She flickered. That means you're welcome, in Bertha.", 'She flickered. That means "you are welcome".'] },
          { t: ['Does every lamp have a name?', 'Do they all have names?'],
            say: ['Every one. Bertha, Clem, the Twins, Little Moon, and seven more. Little Moon is sulking this week.', 'All of them. Little Moon is sulking.'] },
          { t: ['Lit for the lonely ones too?', 'For the lonely ones too?'], if: 'said esme_lonely', tone: 'kind',
            say: ["For her too. You said everyone gets lonely in the dark. She's in the dark more than anyone.", 'For her too. She is always in the dark.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['We blew the lamps out at sunrise. Bertha sulked. She likes being needed.', 'Bertha the lamp sulked at sunrise.'],
        re: [
          { t: ['Light her for me tonight.', 'Light her tonight.'], tone: 'kind',
            say: ['Every night. She will be needed again. Lamps always are.', 'Every night. Lamps are always needed.'] },
          { t: ['Is Little Moon happy now?', 'Is Little Moon happy?'],
            say: ['Very. She has a big sister in the sky again.', 'Very. Her big sister is back.'] },
        ] },
      { if: '!flag n_dawn', say: [["Twelve lamps lit. Bertha brightest.", "Twelve lamps lit."]] },
      { if: 'flag n_dawn', say: [["The lamps are resting. Bertha is not.", "The lamps rest."]] },
      { idle: [['Mm? I was trimming Bertha. Go on.', 'Go on.'], ['Mind the wicks. Yes?', 'Yes?']] },
      { bye: [['Walk by the lamps. They like company.', 'Walk by the lamps.']] },
    ],

    // ---------------------------------------------------------------- Dusty and Dune, twin sand-surfers (one person in the game)
    m_dusty: [
      { if: '!flag n_dawn',
        say: ['Dusty: We are going to surf down the night mountain! Dune: On trays! Dusty: Borrowed trays!', 'We will surf the mountain on trays!'],
        re: [
          { t: ['Whose trays?', 'Whose trays?'],
            say: ["Dusty: Gilly's. Dune: Gilly knows. Gilly is chasing us.", "Gilly's. She is chasing us."] },
          { t: ["It's made of glass.", 'It is glass.'],
            say: ['Dusty: Faster! Dune: Much faster!', 'Faster! Much faster!'] },
        ] },
      { if: 'flag n_dawn',
        say: ['Dusty: The mountain is clear glass now! Dune: You can see through it while you fall!', 'The mountain is clear! You see through it!'],
        re: [
          { t: ['Please do not fall.', 'Please do not fall.'], tone: 'kind',
            say: ['Dusty: We never fall. Dune: We land. Badly. Dusty: That is different.', 'We never fall. We land. Badly.'] },
          { t: ['Bring the trays back.', 'Bring the trays back.'],
            say: ['Dusty: We will! Dune: Some of them! Dusty: Most of them!', 'Most of them!'] },
        ] },
      { if: '!flag n_dawn', say: [["Dusty: Trays! Dune: Waxed trays!", "Waxed trays!"]] },
      { if: 'flag n_dawn', say: [["Dusty: Dunes again! Dune: Daylight dunes!", "Daylight dunes!"]] },
      { idle: [['Dusty: What? Dune: What?', 'What?'], ['Dusty: Trays? Dune: Got trays?', 'Trays?']] },
      { bye: [['Dusty: Bye! Dune: Bye! Dusty: I said it first!', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Rafi, master of the Great Caravan (tells every story twice)
    m_rafi: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['Three hundred years we crossed the Glass Desert by moonlight. Now we sit by the wagons and wait for it to come back.', 'We wait for the moon to come back.'],
        re: [
          { t: ['Tell me about the crossings.', 'Tell me about the crossings.'],
            say: ['We go at night, by the moon. We go at night, by the moon. ...I have told you twice. It is a good story.', 'We go at night by the moon. Twice. Good story.'] },
          { t: ['Have you ever seen snow?', 'Have you seen snow?'],
            say: ['Never. They tell me it is cold sand that falls from the sky. I do not believe them.', 'Never. Cold sand from the sky? No.'] },
          { t: ['I still owe you a snowball.', 'I owe you a snowball.'], if: 'said rafi_snowball', tone: 'kind',
            say: ['You do. You do. Bring it after. I have a bowl ready. A bowl ready.', 'You do. I have a bowl ready.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The moon is back. Tonight we cross. Tonight we cross.', 'The moon is back. Tonight we cross.'],
        re: [
          { t: ['Can I come with you?', 'Can I come?'],
            say: ['One day. A dragon on a caravan. I would tell that story four times.', 'One day. I would tell it four times.'] },
          { t: ['Safe crossing, Rafi.', 'Safe crossing.'], tone: 'kind',
            say: ['Safe crossing. Safe crossing. It is a blessing. You say it twice.', 'Safe crossing. You say it twice.'] },
        ] },
      { if: '!flag n_dawn', say: [["We wait. We wait.", "We wait."]] },
      { if: 'flag n_dawn', say: [["We cross tonight. We cross tonight.", "We cross tonight."]] },
      { idle: [['Sit by the wagons. Sit by the wagons.', 'Sit.'], ['Mm? Tell me twice.', 'Tell me.']] },
      { bye: [['Go well. Go well.', 'Go well.']] },
    ],

    // ---------------------------------------------------------------- Queen Coralia of the Lumenfolk (calm, regal, a little dry)
    m_coralia: [
      { if: '!flag n_dawn', fact: 'n5_moon=gone',
        say: ['We expected a dragon for a very long time. We are glad it was you. Even if you are small.', 'We are glad the dragon was you.'],
        re: [
          { t: ['Small works, Your Majesty.', 'Small works.'],
            say: ['So I see. Sir Kipper says you dive like a rock with ambitions.', 'Sir Kipper says you dive like a rock.'] },
          { t: ['Is Coralcombe all right?', 'Is Coralcombe all right?'], tone: 'kind',
            say: ['We live under the sea. We are used to dark. It is the stillness we mind.', 'We know dark. The stillness is hard.'] },
        ] },
      { if: 'flag n_dawn', fact: 'n5_moon=back',
        say: ['The tide came home, and the whole of Coralcombe sang. Even I sang. Sir Kipper will not stop mentioning it.', 'The tide came home. Even I sang.'],
        re: [
          { t: ['I wish I had heard it.', 'I wish I heard it.'],
            say: ['Then come back next tide. We will sing badly for you, on purpose.', 'Come next tide. We will sing for you.'] },
          { t: ['Did everyone sing in tune?', 'In tune?'],
            say: ['It was loud. With merfolk that is the same thing.', 'It was loud. That is the same.'] },
        ] },
      { if: '!flag n_dawn', say: [["The court is still. So is the sea.", "The court is still."]] },
      { if: 'flag n_dawn', say: [["The court is singing again. Badly.", "The court sings again."]] },
      { idle: [['Speak, dragon. The court is listening.', 'Speak.'], ['Mm. The court will allow it. Go on.', 'Go on.']] },
      { bye: [['Swim well, little dragon. You are welcome here, a little bit.', 'Swim well.']] },
    ],

    // ---------------------------------------------------------------- Kelp, healer of the Kelp Garden (pearls)
    m_kelp: [
      { if: '!flag n_dawn',
        say: ['Pearls for your pockets, little dragon. For the mountain. They still do not do anything. They are still lovely.', 'Pearls for your pockets. Still lovely.'],
        re: [
          { t: ['Then why carry them?', 'Why carry them?'],
            say: ['So you have something lovely in your pocket when it is dark. That is the whole reason.', 'To have something lovely in the dark.'] },
          { t: ['Can they heal a scraped knee?', 'Can they heal knees?'],
            say: ['No. Kelp can. Hold still, little dragon.', 'No. Kelp can. Hold still.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['You came back with every pearl. Not one lost. I have never seen that before.', 'You kept every pearl!'],
        re: [
          { t: ['They were lovely in the dark.', 'They were lovely in the dark.'], tone: 'kind',
            say: ['I told you. Keep them. They have been somewhere now.', 'I told you. Keep them.'] },
          { t: ['Pip tried to eat one.', 'Pip tried to eat one.'], if: 'flag pip', tone: 'silly',
            say: ['They all do. Pearls look like breakfast to anything small.', 'Small things always try.'] },
        ] },
      { if: '!flag n_dawn', say: [["Pearls! Lovely pearls! Useless pearls!", "Lovely pearls!"]] },
      { if: 'flag n_dawn', say: [["Pearls for sale. Healing for free.", "Pearls for sale."]] },
      { idle: [['Mm? Hold still. Yes?', 'Yes?'], ['A scrape? Show me.', 'Show me.']] },
      { bye: [['Mind the coral. It scratches.', 'Mind the coral.']] },
    ],

    // ---------------------------------------------------------------- Rocket, the fastest swimmer in Coralcombe (a good sport)
    m_rocket: [
      { if: '!flag n_dawn',
        say: ['I swam to the top of the sea to look at the mountain! It is very tall. I am very fast.', 'I swam up to see the mountain!'],
        re: [
          { t: ['Did you race anyone?', 'Did you race anyone?'],
            say: ['A sunfish. It was not trying. I still won.', 'A sunfish. I won.'] },
          { t: ['Was it scary up there?', 'Was it scary?'],
            say: ['Very. I swam down faster than I swam up. That is a record too.', 'Yes. I swam down even faster.'] },
        ] },
      { if: 'flag n_dawn',
        say: ['The tide is back! Race me round the reef! Now! Before the fish get there first!', 'Race me round the reef!'],
        re: [
          { t: ["You're on!", "You're on!"], tone: 'brave',
            say: ['Ha! ...I will let you win. No I will not. Go!', 'Ha! Go!'] },
          { t: ['I swim like a rock.', 'I swim like a rock.'], tone: 'silly',
            say: ['Then I will win, and I will be very nice about it.', 'Then I win. Nicely.'] },
        ] },
      { if: '!flag n_dawn', say: [["Up to the top and back! Faster than last time!", "Faster than last time!"]] },
      { if: 'flag n_dawn', say: [["Race me! Anyone! Race me!", "Race me!"]] },
      { idle: [['Quick! What?', 'What?'], ['I am faster than this talk. Go on.', 'Go on.']] },
      { bye: [['Last one to the reef is a crab!', 'Bye!']] },
    ],

    // ---------------------------------------------------------------- Sir Kipper, knight of the Lumenfolk (Lady Bubbles; secretly scared of crabs)
    m_kipper: [
      { if: '!flag n_dawn',
        say: ["Who swims there? Oh, it's the hero. Carry on, then, and be careful up on that mountain.", 'Oh, the hero. Carry on. Be careful.'],
        re: [
          { t: ['How is Lady Bubbles?', 'How is Lady Bubbles?'],
            say: ['Restless. She does not care for the dark. Neither do I. We are both being very brave about it.', 'Restless. We are both being brave.'] },
          { t: ['How is the warhorse?', 'How is the warhorse?'], if: 'said kipper_warhorse', tone: 'kind',
            say: ['Very proud of the word. She makes me say it to her every morning. Warhorse.', 'Proud. I say "warhorse" every morning.'] },
          { t: ['Any crabs up there, do you think?', 'Crabs up there?'], tone: 'silly',
            say: ['Do not jest about crabs, sir. ...Are there?', 'Do not joke about crabs. ...Are there?'] },
        ] },
      { if: 'flag n_dawn',
        say: ['The hero returns! I would salute, but Lady Bubbles is excitable today. She has missed the tide.', 'The hero returns! I would salute.'],
        re: [
          { t: ['You taught me to dive.', 'You taught me to dive.'], tone: 'kind',
            say: ['I did. Badly. You learned anyway. That is the best kind of pupil.', 'Badly. You learned anyway.'] },
          { t: ['No crabs on the mountain.', 'No crabs up there.'],
            say: ['Thank goodness. I mean: how disappointing. I was ready for them.', 'Thank goodness. I mean, how sad.'] },
        ] },
      { if: '!flag n_dawn', fact: 'n5_moon=gone', say: [["On guard, in the dark. Lady Bubbles is very brave. So am I.", "On guard in the dark."]] },
      { if: 'flag n_dawn', say: [["On guard, in the light. Much nicer.", "On guard. Much nicer."]] },
      { idle: [['Speak, sir. Briefly. Lady Bubbles is restless.', 'Speak, sir.'], ['Mm? Carry on.', 'Carry on.']] },
      { bye: [['Carry on, sir. Mind the crabs.', 'Mind the crabs.']] },
    ],
  },
})
