// Act II epilogue: Snow in Summer (owner A2b). Data only.
// What the player does: walks back into Gearhaven under snow in June. The town is out in it; Vesper waves from the
// Clockwatch roof if she is a friend (or only her grey silk is left on a chimney). Penny's headline, the white north, and
// the end card: one Shard of three, the north gone white, the moon with a bite out of it. Then one direction only:
// rest at a shrine or an inn (that is what starts Act III; audit finding 10). Gran's stove lines only if c_oona is
// done, and "night", not "winter" (finding 11).
chapter({
  id: 'c_snow', act: 2, after: 'c_spire', next: null, takeover: true,
  silence: ['c_snow_city'],
  card: ['Act II · Epilogue', 'Snow in Summer'],
  so_far: [
    'At the top of the Shadow Spire the truth came out: Vesper gave the Heart to a great moth, which cracked it into three Shards. She kept one in secret, and now Ash has it. Then a voice thanked Ash, snow fell in midsummer, and the moon had a bite out of it.',
    'Vesper gave the Heart to a great moth. It broke into three. Ash has one piece. Then snow fell, and the moon had a bite out of it.'],
  mom: [['Snow? In summer? Wear the scarf. Both scarves.', 'Snow in summer? Wear your scarf!']],

  place: {
    // the foe ending's trace: a scrap of grey silk on the Clockwatch Hall's chimney (anchored in the street in front of
    // the hall so it sorts in front of the house sprite; the look draws it up on the chimney, 122 px higher)
    clock_silk: { map: 1, at: [6760, 24612], kind: 'prop', look: 'clock_silk', if: 'choice c_vesper=foe', name: 'a scrap of grey silk' },
  },

  step: [
    { id: 'city', do: 'goto gh_market 460', scene: 'c_snow_town', migrate_if: 'flag c_done', then: ['end_act'],
      obj: ['Go back to Gearhaven', 'Go back to Gearhaven'],
      hint: ['By morning the whole coast is white. Go back to Gearhaven and see.', 'Go back to Gearhaven.'] },
    // the act is over: one direction only (resting is what moves the story on to Act III)
    { id: 'rest', do: 'wait_for act>=3', at: 'c_teapot_door',
      obj: ['The north has gone white. Rest at a shrine or an inn when you are ready.', 'Rest at a shrine or an inn.'],
      hint: ['The north has gone white. Rest at a shrine or an inn, like the Steaming Teapot, when you are ready.', 'Rest at a shrine or an inn.'] },
  ],

  scene: {
    c_snow_town: [
      { cam: 'gh_market', s: 1 },
      ['narr', 'By morning, Gearhaven is white. Snow on the clock towers. Snow riding round and round on the conveyor streets. Kids having snowball fights in their summer clothes.', 'By morning, Gearhaven is white. Kids throw snowballs in summer clothes.'],
      ['c_fig', "Snow! In June! I've put a tea cosy on my head, dearie, and I'm not taking it off.", 'Snow in June! I put a tea cosy on my head.'],
      ['c_hester', 'Snow is not on the schedule. I have checked the schedule twice.', 'Snow is not on the schedule. I checked twice.'],
      { if: 'choice c_vesper=friend', then: [
        ['narr', 'High on the Clockwatch roof, someone in a yellow oilskin sits with her legs dangling over the edge, and waves.', 'On the Clockwatch roof, Vesper waves.'],
        { if: 'quest c_oona done', then: [
          ['c_vesper', "Gran says thank you. She says it's the first night she's been warm in years.", 'Gran says thank you. She is warm now.'] ],
          else: [
          ['c_vesper', "Gran wrapped me in three blankets and made soup. She says thank you. Don't make it weird.", "Gran says thank you. Don't make it weird."] ] } ],
        else: [
        ['narr', 'On the Clockwatch roof, where somebody used to sit, there is nobody. Just a scrap of grey silk, caught on a chimney.', 'On the roof, nobody sits now. Just a scrap of grey silk.', { ref: 'clock_silk' }] ] },
      ['c_penny', 'HEADLINE: SNOW IN SUMMER! SOMEBODY TOOK A BITE OUT OF THE MOON! DRAGON KID LOOKS WORRIED!', 'HEADLINE: SNOW IN SUMMER! SOMEONE BIT THE MOON!'],
      ['ash', "...I do look worried, don't I?", "I do look worried, don't I?"],
      ['narr', 'Far to the north, past the mountains, the sky is as white as paper.', 'Far to the north, the sky is white as paper.'],
    ],
    c_vesper_next: [
      ['c_vesper', 'The Mother wants all three pieces. Hush took one north. Look at the sky up there. White as paper.', 'The Mother wants all three. Hush took one north.'],
      ['c_vesper', "If you go after it, take a scarf. Take two. And don't climb anything I wouldn't.", "If you go, take a scarf. Take two."],
      ['ash', 'You climb EVERYTHING.', 'You climb EVERYTHING.'],
    ],
  },

  talk: {
    // Vesper on the Clockwatch roof (only there if she is a friend: see her npc entry in c_spire.js)
    c_vesper: [
      { option: ['What happens now?', 'What happens now?'], scene: 'c_vesper_next' },
      { if: 'flag dr_seen_c_twins', once: true,
        say: ['Granny says "fire isn\'t the only warm thing" every single night. How do YOU know that?', 'Granny says that every night! How do you know it?'] },
      { if: 'quest c_oona done', once: true,
        say: ["Gran made me sit by her stove for an hour. AN HOUR. Then she made me eat soup. It was warm. Don't tell anyone.", 'Gran made me sit by her stove. Then soup. It was warm.'] },
      { say: ["Somebody has to make sure you don't climb anything stupid. That's me now. I've been promoted.", 'Somebody has to stop you climbing silly things.'] },
    ],
  },
})
