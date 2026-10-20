// Act II epilogue: The Breakwater (owner A2b; v12 R2: the old title "Snow in Summer" gave the snow away). Data only.
// What the player does: on the breakwater after the Spire (x1_story's c1SpireOut puts Ash there and starts this stage),
// the moon dims and the Lady of the Moths thanks him through every moth on the Spire; snow falls in midsummer; that
// night the moon has its first bite. Then he walks back into Gearhaven under snow in June. The town is out in it; Vesper waves from the
// Clockwatch roof if she is a friend (or only her grey silk is left on a chimney). Penny's headline, the white north, and
// the end card: one Shard of three, the north gone white, the moon with a bite out of it. Then one direction only:
// rest at a shrine or an inn (that is what starts Act III; audit finding 10). Gran's stove lines only if c_oona is
// done, and "night", not "winter" (finding 11).
chapter({
  id: 'c_snow', act: 2, after: 'c_spire', next: 'f_snow', takeover: true,
  silence: ['c_snow_city'],
  card: ['Act II · Epilogue', 'The Breakwater'],
  so_far: [
    "At the top of the Shadow Spire the truth came out: the Lady in Vesper's dreams is a moth, the Mother of moths. She cracked the Heart into three Shards and sent two away. Vesper kept the third, and now Ash has it. Then a soft voice thanked Ash, snow fell in midsummer, and the moon had a bite out of it.",
    'The Lady is a giant moth. She broke the Heart in three. Ash has one. Snow fell. The moon got bitten.'],
  mom: [['Snow? In summer? Wear the scarf. Both scarves.', 'Snow in summer? Wear your scarf!']],

  place: {
    // the foe ending's trace: a scrap of grey silk on the Clockwatch Hall's chimney (anchored in the street in front of
    // the hall so it sorts in front of the house sprite; the look draws it up on the chimney, 122 px higher)
    clock_silk: { map: 1, at: [6760, 24612], kind: 'prop', look: 'clock_silk', if: 'choice c_vesper=foe', name: 'a scrap of grey silk' },
    // the friend ending's: Vesper sitting on the Clockwatch roof's eave, legs dangling (the look draws her 58 px up;
    // the anchor is in the street in front of the hall, so Ash can talk to her from there)
    v_roof: { map: 1, at: [6795, 24612], r: 40, kind: 'examine', look: 'vesper_roof', if: 'choice c_vesper=friend',
              name: 'Vesper', prompt: ['Talk to Vesper', 'Talk to Vesper'], say: 'c_vesper_roof' },
  },

  step: [
    // c_spire's warp-out puts Ash on the breakwater at night and moves the stage here: the voice and the snow first
    { id: 'voice', do: 'cutscene c_moth_voice', migrate_if: 'flag c_snow' },
    { id: 'snow', do: 'cutscene c_snow_starts', migrate_if: 'flag c_snow' },
    { id: 'city', do: 'goto gh_market 460', scene: 'c_snow_town', migrate_if: 'flag c_done', then: ['end_act 2'],
      obj: ['Go back to Gearhaven', 'Go back to Gearhaven'],
      hint: ['By morning the whole coast is white. Go back to Gearhaven and see.', 'Go back to Gearhaven.'] },
    // the act is over: one direction only (resting, or the end card's "Continue the story", starts Act III; the step
    // simply stays current until then)
    { id: 'rest', do: 'wait_for act>=3', at: 'c_teapot_door',
      obj: ['The north has gone white. Rest at a shrine or an inn when you are ready.', 'Rest at a shrine or an inn.'],
      hint: ['The north has gone white. Rest at a shrine or an inn, like the Steaming Teapot, when you are ready.', 'Rest at a shrine or an inn.'] },
  ],

  scene: {
    // Nyxara's first words (THREADS N8), on the breakwater, looking back at the Spire: 6 lines a branch
    c_moth_voice: [
      { cam: 'c_spire_door', s: 4 },
      ['narr', 'From the breakwater you look back. The moon goes dim, like a lamp turned down, and every moth on the Spire turns to face you.', 'You look back. The moon goes dim. Every moth turns to you.'],
      ['nyxara', 'Thank you, little ember. You have been such a help.', 'Thank you, little ember. You helped so much.', { mood: 'sly' }],
      { if: 'choice ending=warden', then: [['ash', 'Grandpa? Are you awake up there?', 'Grandpa? Are you awake?', { mood: 'worried' }]],
        else: [{ if: 'choice ending=heir', then: [['ash', "Grandpa? Did you get down off Bertram's oven shelf?", 'Grandpa? Did you get off the oven shelf?', { mood: 'worried' }]],
          else: [{ if: 'choice ending=lantern', then: [['ash', "Grandpa? ...No. Grandpa's at home. Mom makes him wipe his feet.", 'Grandpa? No. He is at home.', { mood: 'worried' }]],
            else: [['ash', "...Grandpa? No. You're gone.", 'Grandpa? No. You are gone.', { mood: 'scared' }]] }] }] },
      ['nyxara', 'Oh, no, dear. Not him. Someone much, much older. Go home now. Stay home.', 'No, dear. Someone much older. Go home. Stay home.', { mood: 'cold' }],
      { if: 'choice c_vesper=friend', then: [
        ['c_vesper', "...That's her. That's the Lady. She sounded so kind in my dreams.", "That's her. The Lady. She sounded so kind.", { mood: 'scared' }] ],
        else: [
        ['narr', 'The moths pour off the Spire in a grey river, up past the dim moon, and away north.', 'The moths fly up like a grey river, away north.'] ] },
    ],
    c_snow_starts: [
      { if: 'choice c_vesper=friend', then: [
        ['narr', 'The moths pour off the Spire in a grey river and fly away north. Then something cold lands on your nose.', 'The moths fly north. Something cold lands on your nose.'] ],
        else: [
        ['narr', 'Something cold lands on your nose.', 'Something cold lands on your nose.'] ] },
      { do: ['set c_snow'] },
      ['narr', 'Snow. Soft and white, drifting down out of a clear summer night.', 'Snow! Out of a summer night!'],
      ['ash', 'Is that... snow? It was Lantern Day a week ago. It\'s the middle of summer.', "Is that snow? It's the middle of summer!"],
      { if: 'choice c_vesper=friend', then: [
        ['c_vesper', "It's never snowed in Saltmarsh. Not once in Gran's whole life. I have to get home. Her fire will be out by morning, and now this.", 'It never snows in Saltmarsh. I must go home to Gran.'],
        ['c_vesper', "I'll find you, when it's time. Somebody has to stop you climbing anything stupid. You've got horns, cousin, not sense.", "I'll find you when it's time. You have horns, cousin, not sense."],
        { walk: ['c_vesper', 'bw_walk_off'] }, { do: ['clear c_v_breakwater'] } ],
        else: [{ if: 'flag pip', then: [
        ['pip', 'Mip? (Pip snaps at a snowflake. Then another. He looks very offended that they taste of nothing.)', 'Mip? (Pip bites a snowflake. It tastes of nothing. He is cross.)'] ] }] },
      { do: ['moon 95'] },   // the moon's first bite (moonSet: e7b_threads shows it on the HUD)
      ['narr', 'That night the moon has a bite out of it. Just a small one. As if someone tasted it.', 'That night, the moon has a little bite out of it.'],
    ],

    c_snow_town: [
      { cam: 'gh_market', s: 1 },
      ['narr', 'By morning, Gearhaven is white. Snow rides round and round on the conveyor streets, and kids have snowball fights in their summer clothes.', 'By morning, Gearhaven is white. Kids throw snowballs in summer clothes.'],
      ['c_fig', "Snow! In June! I've put a tea cosy on my head, dearie, and I'm not taking it off.", 'Snow in June! I put a tea cosy on my head.'],
      ['c_hester', 'Clockwatch! Shovels! Nobody filed a report about this.', 'Clockwatch! Get the shovels!'],
      { if: 'choice c_vesper=friend', then: [
        ['narr', 'High on the Clockwatch roof, someone in a yellow oilskin sits with her legs dangling over the edge, and waves.', 'On the Clockwatch roof, Vesper waves.'],
        { if: 'quest c_oona done', then: [
          ['c_vesper', "Gran says thank you. Her stove stayed lit all night, in the snow. She keeps putting her hand near it to check.", 'Gran says thank you. Her stove stayed lit all night.'] ],
          else: [
          ['c_vesper', "Gran wrapped me in three blankets and made soup. She says thank you for sending me home. Don't make it weird.", "Gran says thank you. Don't make it weird."] ] } ],
        else: [
        ['narr', 'Up on the Clockwatch roof there is nobody at all. Just a scrap of grey silk, caught on a chimney.', 'On the roof, nobody. Just a scrap of grey silk.', { ref: 'clock_silk' }] ] },
      ['c_penny', 'HEADLINE: SNOW IN SUMMER! SOMEBODY TOOK A BITE OUT OF THE MOON! DRAGON KID LOOKS WORRIED!', 'HEADLINE: SNOW IN SUMMER! SOMEONE BIT THE MOON!'],
      ['ash', "...I do look worried, don't I?", "I do look worried, don't I?"],
      ['narr', 'Far to the north, past the mountains, the sky is as white as paper.', 'Far to the north, the sky is white as paper.'],
    ],
    // talking to Vesper on the roof (any time in the epilogue): the Act III hook, and the echoes
    c_vesper_roof: [
      { if: 'flag dr_seen_c_twins !flag c_v_twins', then: [
        ['c_vesper', 'Gran has a saying. She says it came all the way down from Pearl: "Fire isn\'t the only warm thing." I used to think it was just something you say to cold people.', 'Gran says "Fire isn\'t the only warm thing." I never believed her.'],
        { do: ['set c_v_twins'] } ] },
      { if: 'quest c_oona done', then: [
        ['c_vesper', "Gran knits by her stove every night now. She's knitting you something. I'm not allowed to say what.", 'Gran is knitting you something. It is a secret.'] ] },
      ['c_vesper', "The Mother wants all three pieces. The white one took one north. That's why the sky up there has gone that color.", 'The Mother wants all three. The white one took one north.'],
      ['c_vesper', "If you go after it, wrap up warm. And don't climb anything I wouldn't.", 'If you go, wrap up warm.', { re: [
        { t: ['You climb everything.', 'You climb everything.'],
          say: [['c_vesper', 'Then you can climb anything. Lucky you.', 'Then you can climb anything.']] },
        { t: ['Come with me, cousin.', 'Come with me, cousin.'], tone: 'kind',
          say: [['c_vesper', "Gran's fire needs watching. ...I'll find you. When it's time.", "Gran needs me. I'll find you."]] },
        { t: ['Does she still talk in your dreams?', 'Does she still talk to you?'],
          say: [['c_vesper', 'Every night. I tell her no. She says she can wait.', 'Every night. I say no. She says she can wait.']] },
      ] }],
    ],
  },

})
