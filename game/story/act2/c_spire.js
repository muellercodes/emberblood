// Act II, chapter 8: The Shadow Spire (owner A2b). Data only.
// What the player does: from the end of the west breakwater (any time of day: the night gate is gone) Ash crosses the
// Shadow Causeway, whose gates are real now (x1_world causeway fix): Shadow Dash through three moth curtains, the
// Grapple Tail over the first gap, a Skimmer sprint over the rip. The Spire door is crawling with moths that ask "What
// IS she?": Ash answers in the Case Book (what_she_is: an Emberblood with no fire, his cousin) and the door opens.
// Inside (code dungeon) he climbs to the roof. If he still has Gran's shell locket he gives it back before the fight.
// At 10 percent Vesper kneels and the choice shows every option, with the reason when one is locked:
//   "Cousin. Why are you doing this?" (trust 4), "Pearl wrote a letter" (Pearl's Logbook done and trust 3), "Finish
//   the fight". Friend: she sits with Ash at the top. Foe: she shouts the two lines that matter and glides away. Either
// way Ash gets the Dusk Shard and her notebook page (the long truth is a Case Book page, not a wall of lines), and a
// warm warp takes him to the breakwater. c_snow.js goes on from there (the Lady's voice, the snow, the bitten moon).
chapter({
  id: 'c_spire', act: 2, after: 'c_light', next: 'c_snow', takeover: true,
  silence: ['c_causeway', 'c_end_fought', 'c_end_ally', 'c_end_pearl', 'c_truth', 'c_nyxara', 'c_snowfall'],
  card: ['Act II · Chapter 8', 'The Shadow Spire'],
  so_far: [
    'When the lighthouse burned again, its beam showed a black spire standing in the sea where no spire had ever been. Vesper had gone there with the warm stone.',
    'The lighthouse beam showed a black Spire in the sea. Vesper went there.'],
  mom: [['A black tower in the sea? Take a lantern. Take two.', 'A black tower? Take a lantern!']],

  npc: {
    // Vesper out of her mask (portrait c_vesper; x1_story's SPECIAL person). On the breakwater with Ash after the Spire
    // (friend), then on the Clockwatch roof in the snow. Nowhere else: no `at`, so no where entry means not there.
    c_vesper: { name: 'Vesper', map: 1, card: false,
                look: { skin: '#e6b896', hair: '#2a2430', hairdo: 'pony', shirt: '#e8c03a', outfit: 'coat', low: '#2a2436',
                        trim: '#c8c0d8', freckles: true, build: 'slim', scarf: '#6a5a7a', hold: 'clasp' },
                // (in the snow she is c_snow.js's v_roof, a look on the Clockwatch roof you can talk to; x1_story's own
                //  c_snow Vesper in the street is turned off here)
                where: [{ if: 'flag c_v_breakwater', at: 'bw_vesper' }, { if: 'stage>=c_snow', off: true }] },
  },

  place: {
    // the end of the west breakwater (verified walkable; the Breakwater Shrine appears here with c_spire_up)
    bw_end:      { map: 1, at: [7200, 28985], r: 220, kind: 'spot', name: 'the end of the west breakwater' },
    bw_vesper:   { map: 1, at: [7120, 28965], kind: 'npc_spot', name: 'the breakwater' },
    bw_walk_off: { map: 1, at: [6700, 28930], kind: 'npc_spot', name: 'the breakwater, going home' },
    // the moths that cover the Spire door until Ash says what Vesper is (drawn over the legacy door c_spire_door)
    // (the look draws nothing in state open, once the moths fly off)
    c_spire_door_moths: { map: 1, at: [7400, 30048], kind: 'prop', look: 'door_moths', state: 'covered',
                          name: 'the moths on the Spire door' },
  },

  item: {
    c_vesper_page: { name: ["Vesper's notebook page", "Vesper's page"],
                     desc: ["A page torn from Vesper's notebook: what happened the night she got back. It is in your Case Book.", "Vesper's page. Read it in the Case Book."],
                     icon: 'vesper_page', keepsake: true },
  },

  // the long truth, to read at leisure (the Case Book page, not a scene)
  page: {
    c_vesper_page: {
      mystery: 'moth_mask', look: 'vesper_page',
      title: ["Vesper's notebook: the night I got back", "Vesper's notebook"],
      text: [
        ['The Lady said: the night you get home, take the warm stone to the Moon Ring in the Moth Wood. So I did.', 'The Lady said: take the stone to the Moon Ring. So I did.'],
        ['Two moths came down out of the dark. A grey one, bigger than a ship, with painted eyes on her wings. And a white one that only ever says shhh.', 'Two moths came. A huge grey one. A white one that says shhh.'],
        ['The white one called the grey one MURMUR. The grey one called the white one HUSH. Nobody called me anything.', 'Their names are Murmur and Hush.'],
        ['Murmur cracked the Heart on the stones. Three pieces. "To let the light out," she said.', 'Murmur broke the Heart into three pieces.'],
        ["Hush flew north with one. Murmur flew east with one, right over Gearhaven. That's when the clocks stopped, and the tide, and the lighthouse. That was HER. Not me.", 'Murmur flew east over Gearhaven. She stopped the clocks. Not me!'],
        ['The third piece fell by my foot. It was warm. Nothing I ever held was warm like that. I kept it. It went purple in my hand, like it was sad.', 'The third piece fell by me. It was warm. I kept it.'],
        ['Now the moths are angry. They call the Lady THE MOTHER. She wants all three pieces. She said bring the last one to the Spire at moonrise and Gran will be warm.', 'The moths call the Lady the Mother. She wants all three pieces.'],
        ["I don't think she was ever going to keep her promise.", "I don't think she will keep her promise."],
      ] },
  },

  deduce: {
    what_she_is: {
      mystery: 'moth_mask',
      ask: ['The moths on the door want to know: what IS Vesper?', 'What is Vesper?'],
      needs: ['l_fireproof', 'l_pearl_mural', 'k_claws'],
      bonus: ['q_oona_horns', 'q_chalk_pearl', 'q_nursery'],
      pick: [
        { t: ['A moth in disguise', 'A moth in disguise'],
          hint: ['Moths love fire, and fire burns them. Your fire rolled right over her.', 'Fire burns moths. Not her.'] },
        { t: ['A clockwork girl', 'A clockwork girl'],
          hint: ['Clockwork does not get out of breath, or climb with claws. Whose claws are those?', 'Whose claws does she have?'] },
        { t: ['Just a really good climber', 'A good climber'],
          hint: ['Good climbers still burn. Who else had claws and no fire?', 'Who else had claws and no fire?'] },
        { t: ['An Emberblood with no fire, like Pearl. My cousin!', 'An Emberblood with no fire'], right: true },
      ],
      then: ['set c_cousin'],
    },
  },

  step: [
    { id: 'breakwater', do: 'goto bw_end 220', scene: 'c_causeway_go', migrate_if: 'flag c_causeway', then: ['set c_causeway'],
      obj: ['Go to the end of the west breakwater', 'Go to the end of the breakwater'],
      hint: ['The Spire stands in the sea past the harbor. The west breakwater runs out toward it.', 'Go to the end of the west breakwater.'] },
    { id: 'cross', do: 'goto c_spire_door 170', scene: 'c_spire_door_ask', migrate_if: 'seen c_spire_in',
      obj: ['Cross the Shadow Causeway to the Spire', 'Cross to the Spire'],
      hint: ['Shadow Dash through the moth curtains. Swing over the first gap on the posts. Sprint over the rip with the Skimmer.',
             'Dash through moths. Swing on the posts. Run over the rip.'] },
    { id: 'door', do: 'deduce what_she_is', at: 'c_spire_door', migrate_if: 'seen c_spire_in',
      obj: ['The moths on the door ask what Vesper IS. Work it out in the Case Book', 'Open the Case Book'],
      hint: ['Fire that does not burn her. Pearl\'s stone. The claws she climbs with. Open the Case Book.', 'Open the Case Book.'] },
    { id: 'opens', do: 'cutscene c_door_opens', migrate_if: 'seen c_spire_in', then: ['set c_cousin', 'world c_spire_door_moths open'] },
    // The Spire and Vesper's fight stay code (x1_dun_b, x1_foes). At 10 percent she kneels: x1_foes hands the kneel to
    // the engine (KNEEL_S10.c_mothmask), which plays `kneel` (c_choice), lets the fight end, then plays `win`
    // (c_warp_out: the truth, the Shard, the warp to the breakwater). Then night falls and c_snow goes on with Nyxara's
    // voice and the snow. (c_choice and c_warp_out are also old STORY keys, replaced in place, for the old fallback.)
    { id: 'fight', do: 'fight c_mothmask', at: 'c_spire_door', kneel: 'c_choice', win: 'c_warp_out',
      then: ['time night quiet', 'stage c_snow'],
      obj: ['Climb the Shadow Spire to the roof', 'Climb the Spire'],
      hint: ['Fire turns the violet braziers gold and pushes the dark back. The dark is a shadow too: dash along it.', 'Light the braziers. Dash along the dark.'] },
  ],

  scene: {
    c_causeway_go: [
      { cam: 'c_spire_door', s: 2.5 },
      ['narr', 'From the end of the breakwater, a path of black stones runs out across the sea to the Spire. Curtains of moths hang between them like grey silk. They hiss.', 'Black stones make a path to the Spire. Moth curtains hang between them.'],
      ['narr', 'Halfway out, the sea between two stones runs fast and white. A rip current.', 'Halfway out, the sea runs fast. A rip current!', { ref: 'c_cw_rip' }],
      { if: 'quest c_bob done', then: [
        ['c_bobs', 'We are Bob. We will hold the breakwater. Nothing gets past us. Except you. You can get past us. Go on.', 'We are Bob. We hold the breakwater. Go on!'] ] },
      { if: 'quest c_bolt done', then: [
        ['c_bolt', 'Bark! (whirr) Bark! (his tail spins like a propeller)', 'Bark! (whirr) Bark!'] ] },
      ['ash', 'Okay. Shadow, swing, shadow, skim, shadow. Shadow, swing... I can do this.', 'Shadow, swing, shadow, skim, shadow. I can do this.'],
      { if: 'flag pip', then: [['pip', 'Mip!', 'Mip!']] },
    ],
    c_spire_door_ask: [
      { cam: 'c_spire_door', s: 1 },
      ['narr', 'The Spire door is black glass, and it is covered in moths. Hundreds of them, wings folded, painted eyes wide open.', 'The door is covered in moths. Their painted eyes are open.'],
      ['narr', 'They whisper, all together: "Who is she? Who is she, little ember? Say it, and pass."', 'The moths whisper: "Who is she? Say it, and pass."'],
      ['ash', 'Vesper. Vesper Saltwhistle.', 'Vesper Saltwhistle.'],
      ['narr', 'The moths laugh, a sound like dry leaves. "Not her NAME. What IS she?"', 'The moths laugh. "Not her name. What IS she?"'],
      ['ash', 'Okay. Think, Ash. What do I actually know about her?', 'Think. What do I know about her?'],
    ],
    c_door_opens: [
      ['ash', "Fire can't burn her. She climbs with claws like Pearl's. And she hasn't got one single spark.", "Fire can't burn her. She has Pearl's claws. No spark."],
      ['ash', "She's an Emberblood. Like Pearl. Like ME. She's my cousin!", 'She is an Emberblood. She is my cousin!'],
      { do: ['world c_spire_door_moths open'] }, { sfx: 'shrine' },
      ['narr', 'The moths go very still. Then they peel off the door all at once in a grey cloud, and the door swings open.', 'The moths fly off. The door opens.'],
      ['ash', 'A cousin who robs clock barons. Wait till Mom hears.', 'Wait till Mom hears!'],
    ],
    // the kneel (STORY.c_choice): every option shows; a locked one says why (the engine fills in {trust:vesper})
    c_choice: [
      { choose: 'c_vesper', who: 'narr',
        ask: ['Vesper drops to one knee. Her shadows melt into the floor. The violet light in her hand flickers, and she lifts her moth hooks one more time.', 'Vesper falls to one knee. She lifts her hooks one more time.'],
        pick: [
          { t: ['Lower your weapon. "Cousin. Why are you doing this?"', '"Cousin. Why are you doing this?"'], tone: 'kind', v: 'friend',
            need: 'trust vesper>=4',
            locked: ["She doesn't trust you enough yet ({trust:vesper} of 4).", "She doesn't trust you yet ({trust:vesper} of 4)."],
            then: ['choice c_vesper=friend', { journal: ['You asked Vesper why, and she told you.', 'You asked Vesper why.'], key: 'c_vesper' }],
            say: [
              ['narr', 'Vesper stares at you. Then she pulls off her mask and sits down on the edge of the roof, just a tired girl on a cold roof.', 'She takes off her mask and sits down. Just a tired girl.'],
              ['c_vesper', 'There\'s a soft voice in my dreams. The Lady of the Moths. She calls me "little thief". She says she can give my family our fire back, and make Gran warm.', 'A dream voice says she can give us fire, and warm Gran.'] ] },
          { t: ['"Pearl wrote a letter. To you. To all of you."', '"Pearl wrote you a letter."'], tone: 'kind', v: 'friend',
            need: 'quest c_logbook done trust vesper>=3',
            locked: ["This needs the last page of Pearl's Logbook, and trust 3 (now {trust:vesper}).", "Needs Pearl's last logbook page, and trust 3."],
            then: ['trust vesper +1', 'set c_pearl_letter', 'choice c_vesper=friend', { journal: ['You read Vesper the letter Pearl wrote, and she told you everything.', 'You read Vesper Pearl\'s letter.'], key: 'c_vesper' }],
            say: [
              ['ash', '"To my children with no fire. Fire isn\'t the only warm thing. Hands are warm. Soup is warm. I had no fire, so I built a city full of warm windows. You can too."', '"Fire isn\'t the only warm thing. I built warm windows. So can you."'],
              ['narr', 'Vesper sits down on the cold glass, very suddenly, and pushes her mask up to wipe her eyes.', 'Vesper sits down. She wipes her eyes.'],
              ['c_vesper', 'There\'s a soft voice in my dreams. The Lady of the Moths. She calls me "little thief". She says she can give my family our fire back, and make Gran warm.', 'A dream voice says she can give us fire, and warm Gran.'] ] },
          { t: ['Finish the fight.', 'Finish the fight.'], tone: 'brave', v: 'foe',
            then: ['choice c_vesper=foe', { journal: ['You fought Vesper to the end. She threw you the Shard and glided away into the dark.', 'You fought Vesper. She threw you the Shard and flew away.'], key: 'c_vesper' }],
            say: [
              ['narr', 'You strike. She blocks, too slow. Her hooks clatter away across the glass, and her mask cracks and falls off.', 'You strike! Her hooks fly away. Her mask cracks.'] ] },
        ] },
    ],
    // right after the kneel (the fight step's win scene, played on the roof): at most 6 lines along each
    // branch. The boss sprite has gone in its puff, so Vesper (unmasked now) is placed back beside Ash. The truth lands
    // in two lines; the rest is her notebook page in the Case Book.
    c_warp_out: [
      { if: 'choice c_vesper=friend', then: [
        { place: ['c_vesper', 'player', [64, -24]] }, { anim: ['c_vesper', 'roof_sit'] },
        ['c_vesper', 'But a moth as big as a ship cracked the Heart in three. Murmur. She flew right over Gearhaven, and every clock stopped.', 'A huge moth, Murmur, broke it in three. She stopped your clocks.', { payoff: 'c_vesper_page' }],
        { if: 'flag dr_c_whisper=go', then: [
          ['ash', 'She talks to me too, in my dreams. I told her to go away. You could have just asked ME, you know.', 'She talks to me too. You could have just asked me.'] ],
          else: [{ if: 'quest c_oona done', then: [
            ['ash', "I already lit your gran's stove. It took one breath. You could have just asked.", "I lit your gran's stove. You could have asked!"] ],
            else: [
            ['ash', "I'd have lit your gran's stove myself. You could have just asked.", 'I would have helped. You could have asked.'] ] }] },
        ['ash', 'Cousin... how many greats is a cousin?', 'How many greats is a cousin?'],
        ['c_vesper', "None. Cousins don't get greats.", "None. Cousins don't get greats."],
        ['ash', "Then you're my favorite relative.", "Then you're my favorite relative."],
        { do: ['give c_shard1', 'set c_shard1', 'give c_vesper_page', 'page c_vesper_page', 'set c_v_breakwater'] },
        ['narr', 'She laughs, and puts the Shard in your claw, warm as a fresh bun and violet as the sky after sunset, with a page from her notebook. A ring of warm light opens on the roof, and you jump in together.', 'She gives you the Shard and a page. You warp out together.'] ],
      else: [
        { place: ['c_vesper', 'player', [92, -30]] },
        ['c_vesper', 'Fine. FINE. You win. You always win. Here\'s your stupid stone.', 'Fine. You win. Here is your stupid stone.'],
        ['narr', 'She throws something at your feet. Violet and warm, but small. Just a piece of the Heart, with one sharp edge, like a slice of a plum.', 'She throws down a small violet piece of the Heart.'],
        { do: ['give c_shard1', 'set c_shard1'] },
        ['ash', "This is a BIT of the Heart. Where's the rest?", 'This is just a bit. Where is the rest?'],
        ['c_vesper', 'Ask the moon! A moth as big as a ship cracked it in three. Murmur. She flew right over your clocks!', 'Ask the moon! A huge moth broke it in three!', { payoff: 'c_vesper_page' }],
        ['c_vesper', "And the Lady wants ALL of it. She'll come for yours next, little ember!", 'The Lady wants all of it. She will come for yours!'],
        { anim: ['c_vesper', 'glide'] }, { walk: ['c_vesper', 'player', [440, -380]] },
        { do: ['give c_vesper_page', 'page c_vesper_page'] },
        ['narr', 'She jumps off the edge and glides away into the dark on her moth cloak. A notebook page flutters down where she stood. Then a ring of warm light opens on the roof.', 'She glides away. A page flutters down. A warp ring opens.'] ] },
      { do: ['set c_choice_done', 'warp bw_end'] },
    ],
    // ---- the Spire's own story keys (each replaces the old STORY[key] in place: x1_dun_b and x1_foes play them)
    c_spire_in: [
      ['narr', 'Inside, the Spire is black glass, cold as a winter window. Violet lamps burn without any heat. Far above, the moon shines through a hole in the roof.', 'Inside, the Spire is cold black glass. Violet lamps burn with no heat.'],
      ['narr', 'The moths whisper as you pass. "Little ember. Little ember. Come up. Come up."', 'The moths whisper: "Little ember. Come up. Come up."'],
      ['ash', 'Nope. Not creepy. Not creepy at all.', 'Nope. Not creepy at all.'],
      { if: 'flag pip', then: [['pip', 'Mip. (Pip holds your horn. Very tightly.)', 'Mip. (Pip holds your horn tight.)']] },
    ],
    c_spire_dark: [
      ['narr', 'The dark is spreading across the floor like spilled ink. Where it touches, you feel slow and cold. The violet lamps burn cold. Maybe yours burns warmer.', 'Dark ink spreads. It makes you slow. Your fire is warmer.'],
    ],
    c_spire_clones: [
      ['narr', 'Two shadows peel up off the floor. They look exactly like you. They move when you move. One of them is doing it backwards.', 'Two shadows stand up. They look like you. One copies you backwards.'],
      ['ash', 'Hey. Stop copying me.', 'Hey. Stop copying me.'],
      ['narr', 'Both shadows mouth, "Hey. Stop copying me."', 'They both say, "Hey. Stop copying me."'],
    ],
    c_spire_sketch: [
      ['narr', 'A sketchbook, left on a step. Drawings of an old woman by a cold stove. Of stilt houses. Of a horned kid in a scarf, with a note underneath: "taller in person. no he isn\'t."', 'A sketchbook. A cold old woman. And you: "taller in person. no he isn\'t."'],
    ],
    c_spire_core: [
      ['narr', 'The Spire is hollow in the middle, all the way up. Warm air rises from somewhere deep below. Warm. In here. You spread your wings.', 'The Spire is hollow inside. Warm air rises. You spread your wings.'],
    ],
    c_shadowash: [
      ['narr', 'The floor is a black mirror. Your reflection looks up at you. Then it puts its hands flat on the glass from the other side, and climbs out.', 'The floor is a black mirror. Your reflection climbs out of it!'],
      ['c_shadow', "I'm going to jump on EVERYTHING.", "I'm going to jump on EVERYTHING."],
      ['ash', "That's MY line!", "That's MY line!"],
      ['c_shadow', "That's MY line!", "That's MY line!"],
    ],
    c_shadowash_won: [
      ['narr', 'The shadow you flickers in the gold light, shrinks, and slides back into the floor. For a second the mirror shows just you again. You look tired. And brave.', 'The shadow shrinks into the floor. The mirror shows just you. Tired, and brave.'],
      ['ash', 'I am NOT that annoying.', 'I am NOT that annoying.'],
      { if: 'flag pip', then: [['pip', 'Mip.', 'Mip.']] },
    ],
    // the roof, before the fight: the shell locket comes home here (the Act I bonus; the Oona route counts instead if
    // Ash gave it to Gran). It glints on the real Vesper in the clone phase (x1_foes reads c_locket_given).
    c_roof_intro: [
      ['narr', 'The top of the Shadow Spire. A round roof of black glass under an enormous moon. A broken violet lamp in the middle, and a ring of moths turning slowly round it.', 'The top of the Spire. A huge moon. Moths circle a broken lamp.'],
      ['narr', 'Vesper stands in front of the lamp. No mask tonight. In her hand, something glows violet through her fingers.', 'Vesper stands by the lamp. Something glows violet in her hand.'],
      ['c_vesper', "You climbed the Spire. Of course you did. Is there anything you DON'T climb?", 'You climbed the Spire. Of course you did.'],
      ['ash', "Ladders. Ladders are weird. And I know what you are, Vesper. You're my cousin.", 'Ladders are weird. Vesper, you are my cousin.'],
      ['c_vesper', "Then you know what Pearl's side got. Claws. A tail. A cold house. Not one spark. You got fire, a mom, a whole valley that loves you.", 'Then you know. We got claws. No fire. You got everything.'],
      ['c_vesper', "The Lady comes at moonrise. She'll give my family its fire back. Gran will be warm. So no. You don't get to have this too.", 'The Lady comes at moonrise. Gran will be warm. So no.'],
      { if: 'item a1_locket !flag c_locket_given', then: [
        ['ash', "Wait. This is your gran's locket. You dropped it, up north.", "Wait. Your gran's locket. You dropped it up north."],
        ['narr', 'She snatches it and puts it on without a word. For a moment her hand stays on it, and the shell glints in the moonlight.', 'She grabs it and puts it on. She holds it tight.'],
        { do: ['take a1_locket', 'set c_locket_given', 'trust vesper +1'] } ],
        else: [{ if: 'flag a1_locket_left', then: [
        ['narr', 'A shell locket on a salty string glints at her throat.', 'A shell locket glints at her throat.'] ] }] },
      ['narr', 'She pulls on her mask. Around her, three shadows stand up out of the floor and pull on masks too.', 'She puts on her mask. Three shadows stand up. They wear masks too.'],
      ['c_mask', "Let's finish the chase, little ember.", "Let's finish the chase, little ember."],
    ],
  },

  talk: {
    c_mo: [
      { if: 'flag c_bridge', say: ['Bridge is back up over the Cut. The crabs are still sulking about it.', 'The bridge is back. The crabs are sulking.'] },
    ],
    c_agatha: [
      { if: '!flag c_shard1', say: ['Go on, then. Squawk and I will keep the light on for you.', 'Go on. We will keep the light on for you.'] },
    ],
  },
})
