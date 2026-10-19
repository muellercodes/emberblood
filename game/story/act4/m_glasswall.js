// Act IV, chapter 4 (part 1): Mirrors, the second eclipse (owner A4b). Data only: the engine runs it, the checker reads it.
// What the player does: back in Sable after the Sandworm Burrows, Ash looks round the oasis (the sign by the Moon Well,
// the little moths sleeping on its tower, a cracked lamp on Esme's workbench), and works out where the Night Mother
// will feed next: the Moon Well, the last moonlight in the desert, like milk left out. He warns Saffron and they wait
// at the well together. The eclipse comes, Nyxara lands on the tower and finds the little ember got there first. Ash
// chooses: stand in front of the well (brave) or help Saffron drag the lid on (kind); either way one candle of
// moonlight is saved. She bites the moon (40), asks for all three Shards, and her thread yanks Hush up the sky like a
// kite (a free_hush clue). v11: on the friend path (Act II), Vesper is on a tent roof in Sable; the Mother offers her
// fire of her own again ("little thief"), and Vesper says no, in front of Ash. Then under the Glasswall at the Burrow Gap, and across the Mirror Flats to the temple.
// Old flags kept: m_eclipse2 (x3_world opens the Burrow Gap, darkens the lanterns, x3_people sends Mom's letter
// m_pb_3), m_gap_dug (set by x3_world when Ash burrows through). New: m4_well = stood | lid, m4_where_next.
// Visual hooks of the old code (the eclipse pictures, x3_story m3sEcl) ride on `emit m4fx:<name>[:<arg>]` effects:
// x3_story listens to them (and sets flag s10_fx); the scene also reads right without them.
chapter({
  id: 'm_glasswall', act: 4, after: 'm_burrows', next: 'm_mirror', takeover: true,
  card: ['Act IV · Chapter 4', 'Mirrors'],
  so_far: [
    'Ash came up out of the Sandworm Burrows able to dig like a worm. Somewhere out there, Nyxara is still hungry. This time Ash means to be waiting where she feeds next.',
    'Ash can dig now. Nyxara is still hungry. Where will she go next?'],
  mom: [['Worms? Under the ground? Wipe your feet before you come home.', 'Worms! Wipe your feet.']],
  hint: ['Sable is full of clues today. Look around the Moon Well and the Lamp House.', 'Look around Sable.'],

  place: {
    // (the oasis itself is A4a's place m4_sable, m_sable.js: 9700,67450)
    // a new sign at the south end of the footbridge to the Moon Well (verified open ground)
    m4_well_sign:  { map: 3, at: [9860, 67910], r: 30, kind: 'sign', look: 'm4_sign_well', name: ['the Moon Well sign', 'the well sign'],
                     prompt: ['Read the sign by the well', 'Read the sign'],
                     say: 'm4_read_well_sign' },
    // the moths asleep on the Moon Well's tower, seen from the north end of the footbridge (the tower stands on its
    // islet at 9800,67650; the look draws them up its side). Gone once she has been.
    m4_well_moths: { map: 3, at: [9800, 67712], r: 34, kind: 'examine', look: 'm4_tower_moths', if: '!flag m_eclipse2 !flag m4_moths_gone', h: 120,
                     name: ['the moths on the well tower', 'the moths'], prompt: ['Look up at the well tower', 'Look at the tower'] },
    // Esme's workbench outside the Lamp House (its door is at 10240,68051; verified open sand, level 0)
    m4_cracked_lamp: { map: 3, at: [10330, 68060], r: 30, kind: 'examine', look: 'm4_esme_bench',
                     name: ["Esme's workbench", "Esme's bench"], prompt: ["Look at Esme's workbench", 'Look at the bench'] },
    // where Ash and Saffron wait: the stone rim of the Moon Well, at the top of the footbridge
    m4_well_wait:  { map: 3, at: [9800, 67728], r: 46, kind: 'spot', name: ['the rim of the Moon Well', 'the Moon Well'] },
    m4_well_tower: { map: 3, at: [9800, 67650], kind: 'npc_spot', name: ['the Moon Well tower', 'the well tower'] },
    // the camera's aim for the eclipse: high enough to show Nyxara on top of the tower and Ash on the rim below
    m4_well_sky:   { map: 3, at: [9800, 67555], kind: 'npc_spot', name: ['the sky over the Moon Well', 'the sky over the well'] },
    // Nyxara perched on the tower during the eclipse: this chapter's own picture of her, shown only when nothing
    // listens to m4fx for x3_story's eclipse pictures (x3_story sets flag s10_fx when it does)
    m4_nyx_well:   { map: 3, at: [9800, 67661], kind: 'prop', look: 'm4_nyx_perch', states: { drink: 'm4_nyx_perch' },
                     if: 'flag m4_nyx_here !flag s10_fx', name: ['Nyxara', 'Nyxara'] },
    // the far side of the Glasswall, where the Burrow Gap comes up (verified open sand, level 0): only a burrower gets
    // here (nobody climbs the wall or flies over it)
    m4_gap_east:   { map: 3, at: [11160, 67240], r: 140, kind: 'spot', name: ['the far side of the Glasswall', 'the far side of the wall'] },
    // before the eclipse the Burrow Gap stays shut (x3_world): say why, if Ash goes digging there early (audit 7)
    m4_gap_shut:   { map: 3, at: [10660, 67230], r: 40, kind: 'examine', if: '!flag m_eclipse2',
                     name: ['the foot of the Glasswall', 'the Glasswall'], prompt: ['Look at the sand under the Glasswall', 'Look at the sand'],
                     say: 'm4_gap_shut_say' },
  },

  clue: {
    m4_well_sign:    { icon: 'board', mystery: 'm4_night_mother',
                       text: ['The sign by the Moon Well: THE LAST MOONLIGHT IN THE GLASS DESERT. PLEASE DO NOT DRINK IT.', 'The Moon Well is the last moonlight in the desert.'] },
    m4_well_moths:   { icon: 'moth', mystery: 'm4_night_mother',
                       text: ['Hundreds of little moths sleep on the Moon Well tower, all facing the water. As if they are saving her a seat for dinner.', 'Little moths wait on the well tower. Like for dinner.'] },
    m4_cracked_lamp: { icon: 'lamp', mystery: 'm4_night_mother',
                       text: ["On Esme's workbench: a cracked lamp and a note. \"CRACKED LAMPS CAN'T HOLD A FLAME. MEND IT WHOLE FIRST. E.\"", "A cracked lamp can't hold a flame. Mend it whole first."] },
    m4_bring_three:  { icon: 'moth', mystery: 'm4_night_mother',
                       text: ['At the Moon Well, Nyxara said: "My Hush keeps the last piece for you. Bring me all three."', 'Nyxara said: "Bring me all three."'] },
    m4_hush_pulled:  { icon: 'rope', mystery: 'm4_night_mother',
                       text: ["When Nyxara flew off from the well, Hush's silver thread twitched and yanked Hush up the sky like a kite.", "Hush's thread yanked her up the sky like a kite."] },
  },

  deduce: {
    where_feed: {
      mystery: 'm4_night_mother',
      ask: ['Where will the Night Mother feed next?', 'Where will she eat next?'],
      // m4_milk_smell: A4a's eclipse 1 on the Strand ("More moonlight, somewhere warm. Like milk left out.")
      needs: ['m4_milk_smell', 'm4_well_sign', 'm4_well_moths'],
      pick: [
        { t: ["Sable's Moon Well", 'The Moon Well'], right: true },
        { t: ['The sun', 'The sun'],
          hint: ['She covered the sun. She BIT the moon. Moths want moonlight, not sunshine.', 'She bit the moon. Moths want moonlight.'] },
        { t: ['The Lumen Spire', 'The Lumen Spire'],
          hint: ["Lumen's lamps are lit again, and no moth came. Where is there moonlight you could drink, like milk?", 'Where is moonlight you could drink?'] },
      ],
      then: ['set m4_where_next'],
    },
  },

  step: [
    { id: 'back', do: 'goto m4_sable 450', scene: 'm4_back_sable', then: ['set m4_back_sable'],
      obj: ['Go back to the Oasis of Sable', 'Go back to Sable'],
      hint: ['Sable is the oasis with the palm trees, south of the Worm Mouth.', 'Go back to Sable.'] },
    { id: 'look', do: 'all',
      obj: ['Look around Sable. Where would a moth go for dinner?', 'Look around Sable for clues'],
      hint: ['Read the sign by the Moon Well. Look up at the well tower from the footbridge. And Esme left something on her workbench by the Lamp House.',
             'Read the well sign. Look at the tower. Look at the bench.'],
      parts: [
        { do: 'examine m4_well_sign', then: ['clue m4_well_sign'] },
        { do: 'examine m4_well_moths', scene: 'm4_look_moths', then: ['clue m4_well_moths'] },
        { do: 'examine m4_cracked_lamp', scene: 'm4_look_bench', then: ['clue m4_cracked_lamp'] },
      ] },
    { id: 'deduce', do: 'deduce where_feed', scene: 'm4_where_solved',
      obj: ['Where will she feed next? Work it out in the Case Book', 'Open the Case Book'],
      hint: ['She sniffed the air on the beach. Then there is the well sign, and the moths on the tower. Open the Case Book.', 'Open the Case Book.'] },
    { id: 'saffron', do: 'talk m_saffron', scene: 'm4_warn_saffron', then: ['set m4_warned'],
      obj: ['Warn Saffron the Well-Warden', 'Warn Saffron'],
      hint: ['Saffron guards the Moon Well. She stands on the footbridge.', 'Saffron is on the footbridge.'] },
    // the second eclipse comes because the player predicted it and is waiting (audit 7 and 8)
    { id: 'well', do: 'goto m4_well_wait 46', scene: 'm_eclipse2',
      obj: ['Wait with Saffron at the rim of the Moon Well', 'Wait at the Moon Well'],
      hint: ['Walk up the footbridge to the stone rim of the well, and wait for her.', 'Wait at the well.'],
      // (the XP only after the choice at the well: a save from before v10, caught up quietly, got it from the old eclipse)
      then: ['set m_eclipse2', 'set m_eclipse_on=0', { if: 'flag m4_well', then: ['xp 1000'] }, { banner: ['The nights get darker.', 'The nights get darker.'] }] },
    // x3_world opens the Burrow Gap once m_eclipse2 is set, and sets m_gap_dug when Ash digs through it; coming up on
    // the far side finishes the step
    { id: 'under', do: 'goto m4_gap_east 140', marker: 'm_burrowgap', intro: 'm4_iska_under',
      obj: ['Burrow under the Glasswall at the Burrow Gap', 'Dig under the Glasswall'],
      hint: ['The Burrow Gap is where the worms go under the Glasswall, past the Kiln Tent. Burrow into the sand there.', 'Dig into the sand at the Burrow Gap.'],
      then: ['set m_gap_dug'] },
    { id: 'flats', do: 'goto m_mirror_door 360',
      obj: ['Find the Mirror Temple on the Mirror Flats', 'Find the Mirror Temple'],
      hint: ['The Mirror Temple stands on a white dais in the middle of the Mirror Flats. Do not believe the lakes.', 'Find the temple on the white flats.'],
      then: ['stage m_mirror'] },
  ],

  scene: {
    m4_back_sable: [
      ['iska', 'Sable again. Ash, that moth is still hungry. And hungry things go where the dinner is.', 'That moth is still hungry. Where is her dinner?'],
      // (a save made before v10 never heard the first eclipse's sniff: Ash remembers it here)
      { if: '!clue m4_milk_smell', then: [
        ['ash', 'On the beach she sniffed the air. "More moonlight, somewhere warm," she said. "Like milk left out."', 'On the beach she said: "Moonlight, like milk left out."', { clue: 'm4_milk_smell' }] ] },
      ['ash', "Then I'll find the milk before she does. And this time I'll be waiting.", "I'll find it first. And I'll be waiting."],
    ],
    m4_read_well_sign: [
      ['narr', 'THE MOON WELL. The last moonlight in the Glass Desert. Please do not drink it. (Underneath, smaller: THAT MEANS YOU, STRIDERS.)',
               'THE MOON WELL. The last moonlight in the desert. Do not drink it.'],
    ],
    m4_look_moths: [
      ['narr', 'Hundreds of little moths sleep on the white tower, wings folded, all facing the water. Every few seconds one of them licks its lips.', 'Lots of little moths sleep on the tower. They face the water.'],
      ['ash', 'Are they saving somebody a seat?', 'Are they saving someone a seat?'],
    ],
    m4_look_bench: [
      ['narr', 'A cracked lamp sits on the workbench, with a note tucked under it in curly writing.', 'A cracked lamp and a note sit on the bench.'],
      ['narr', 'It says: "Cracked lamps can\'t hold a flame. Mend it whole first. E."', '"Cracked lamps can\'t hold a flame. Mend it whole first. E."'],
    ],
    m4_where_solved: [
      ['ash', 'The Moon Well! The last moonlight in the whole desert, sitting there like a bowl of milk.', 'The Moon Well! Like a bowl of milk.'],
      ['ash', 'And all those little moths are saving her a seat. I have to warn Saffron.', 'The moths saved her a seat. Warn Saffron!'],
    ],
    m4_warn_saffron: [
      ['ash', "Saffron! Nyxara is coming to drink your well. Today. I'm sure of it.", 'Saffron! Nyxara is coming for your well!'],
      ['m_saffron', 'The moth that put out the sun? Coming here, to my well?', 'The moth that hid the sun? Here?'],
      ['m_saffron', "...Then she'll find a Well-Warden and a dragon waiting for her. Come and sit on the rim with me.", 'Then we wait for her together. Sit with me.', { ref: 'm4_well_wait' }],
    ],
    // the second eclipse: at most 10 lines a branch. Ash is already there, because he worked it out.
    m_eclipse2: [
      { cam: 'm4_well_sky', s: 1.2 },
      ['narr', 'You sit on the stone rim of the Moon Well. Saffron sits beside you, her staff across her knees. Then the air goes cold, a grey shadow slides over the sun, and Sable goes dark as night.',
               'You wait at the well with Saffron. Then the sun goes dark.', { do: ['emit m4fx:ecl:start:2', 'emit m4fx:ecl:dark', 'set m_eclipse_on'] }],
      ['narr', 'Nyxara drops out of the dark like a black sail and lands right on top of the well tower. Every little moth on it wakes up and cheers.',
               'Nyxara lands on the well tower! The little moths cheer.', { do: ['emit m4fx:ecl:land', 'set m4_nyx_here'] }],
      // the deal at the first eclipse (A4a's choice m_deal: ask | refuse) shows here
      { if: 'choice m_deal=ask', then: [
        ['nyxara', 'Oh. The little ember got here first. Nobody is ever here first. You asked me why, once. Nobody ever asks.', 'You got here first. You asked me why, once.'] ],
        else: [
        ['nyxara', 'Oh. The little ember got here first. Nobody is ever here first. "No way," you told me. Shh, now.', 'You got here first. "No way," you said. Shh.'] ] },
      // v11: the friend path. Vesper is in Sable (q_m_vesper: the tent roofs), and the Mother tries her old promise again
      { if: 'choice c_vesper=friend', then: [
        ['nyxara', 'And there is my little thief, up on the tent roof. Come home, little thief. I have fire for you now. Your very own.', 'Come home, little thief. I have fire for you now.'],
        ['c_vesper', "(from the roof behind you) You promised me that last time. Keep it. Gran says fire isn't the only warm thing.", '(from the roof) You promised that last time. Keep it.'] ] },
      { choose: 'm4_well', who: 'narr', ask: ['She bends her long curled tongue down to the water.', 'She bends down to drink.'], pick: [
        { t: ['Stand in front of the well', 'Stand in front of the well'], tone: 'brave', v: 'stood',
          then: ['set m4_well=stood', 'epi m4_epi_well_stood 5', { journal: ['At the Moon Well you stood in front of the water and spread your wings at the Night Mother.', 'You stood in front of the Moon Well.'], key: 'm4_well' }],
          say: [['narr', 'You jump up on the rim and spread your wings wide. She drinks round you, but not through you. Behind your back, one candle of moonlight stays.',
                         'You spread your wings over the well. One candle of light stays behind you.']] },
        { t: ['Help Saffron drag the lid on', 'Help Saffron with the lid'], tone: 'kind', v: 'lid',
          then: ['set m4_well=lid', 'epi m4_epi_well_lid 5', { journal: ['At the Moon Well you helped Saffron drag the old lid over the water.', 'You helped Saffron put the lid on the well.'], key: 'm4_well' }],
          say: [['narr', 'You and Saffron heave the old stone lid across the water. It sticks halfway. Under it, one candle of moonlight stays safe.',
                         'You and Saffron push the lid on. One candle of light stays safe.']] },
      ] },
      ['narr', 'She drinks the rest. The silver light drains out of the well like bathwater. Then she looks up at the moon and takes another bite. CRUNCH.',
               'She drinks the light. Then she bites the moon again. CRUNCH!', { do: ['emit m4fx:ecl:drink', 'emit m4fx:ecl:bite:40', 'world m4_nyx_well drink', 'moon 40'] }],
      ['nyxara', 'One more piece, little ember. My Hush keeps it for you, up in the Observatory. Bring me all three.', 'One more piece. My Hush has it. Bring me all three.', { clue: 'm4_bring_three' }],
      ['narr', 'She rises without a sound. Far above, her silver thread twitches, and a white moth is yanked up the sky like a kite. Hush. Every lantern in Sable blows out at once.',
               'She flies off. Her thread yanks a white moth up the sky. Hush! Every lantern goes out.', { clue: 'm4_hush_pulled', do: ['emit m4fx:ecl:leave', 'set m4_nyx_here=0', 'set m4_moths_gone'] }],
      ['m_saffron', "She's not dead. Only dim. One candle of moon is left in my well, because of you. Go, dragon. Get your Shard.", 'One candle of moon is left. Because of you. Go!', { do: ['emit m4fx:ecl:end'] }],
    ],
    m4_gap_shut_say: [
      ['narr', 'The sand at the foot of the Glasswall is packed as hard as glass today. Even the worms are waiting for something.', 'The sand here is packed hard. The worms are waiting.'],
      ['iska', 'Not yet, Ash. Something is coming to Sable first. I can feel it in my wick.', 'Not yet. Something is coming to Sable first.'],
    ],
    m4_iska_under: [
      ['iska', "The Glasswall, Ash. Nobody can climb it and nobody can fly over it. But you dig like a worm now. Go under.", "Nobody can climb the Glasswall. But you dig like a worm now. Go under!", { ref: 'm_burrowgap' }],
    ],
    // (the epilogue lines for the well, m4_epi_well_stood and m4_epi_well_lid, are A4S's scenes in act4/people.js:
    // the choice at the well and Saffron's talk run the same ones, and an epilogue line is added only once)
  },

  talk: {
    // after the eclipse, Saffron tells it the way it happened (once each; then A4S's ordinary talk takes over)
    m_saffron: [
      { if: 'flag m4_well=stood', once: true,
        say: ['You stood right in front of my well and spread your wings at her. I will tell that story until I am a hundred.', 'You stood in front of my well! I will tell everyone.'] },
      { if: 'flag m4_well=lid', once: true,
        say: ['We got the lid on, you and me. One candle of moon, safe under a stone. Not bad for a Well-Warden and a dragon.', 'We saved one candle of moon. Together.'] },
    ],
  },
})
