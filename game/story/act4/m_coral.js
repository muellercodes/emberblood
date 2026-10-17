// game/story/act4/m_coral.js (A4a): Act IV, Chapter 2, "Drowned Lumen" (second half): Coralcombe.
// What the player does: dives into the coral ring south of Driftwood (Ember's new Dive) and meets the merfolk. Queen
// Coralia does not hand over the answer any more: a great grey moth took the last Shard, "Where? Ask Sir Kipper. And
// think about Lumen." Sir Kipper was on watch: grey, bigger than a ship, it flew over the Reefwall, EAST, toward a brass
// bump on the far hills. With the balcony dust and Lumen's sky map, the player works out in the Case Book where the
// moth took the Shard (main deduction where_shard). Mayor Dabble's "everything sinks to the bottom of the sea" is the
// red herring. Then Coralia tells the way east: under the Reefwall, through the Sunken Gate, where a pufferfish is stuck.
chapter({
  id: 'm_coral', act: 4, after: 'm_lumen', next: 'm_reef', takeover: true,
  card: null, name: ['Drowned Lumen', 'Drowned Lumen'],
  so_far: [
    "Ash can dive! A great grey moth carried the last Shard of the Ember Heart away. The merfolk of Coralcombe, Lumen's grandchildren, saw it go.",
    'Ash can dive! The merfolk saw where the last Shard went.'],
  hint: ['Coralcombe is the ring of coral south of Driftwood. Dive in the middle.', 'Coralcombe is the coral ring south of Driftwood. Dive in the middle.'],

  clue: {
    m4_scout_report: { icon: 'eye', mystery: 'night_mother',
      text: ['Sir Kipper saw the great grey moth fly over the Reefwall, EAST, toward a little brass bump on the far hills.',
        'The moth flew over the reef, EAST, toward a brass bump on the hills.'] },
    m4_bottom_sea: { icon: 'wave', herring: true, mystery: 'night_mother',
      text: ['Mayor Dabble: "Lost things sink. Everything ends up at the bottom of the sea."', 'Dabble: everything lost sinks to the bottom of the sea.'] },
  },

  deduce: {
    where_shard: {
      mystery: 'night_mother',
      ask: ['Where did the great grey moth take the last Shard?', 'Where did the moth take the last Shard?'],
      needs: ['m4_spire_dust', 'm4_star_map', 'm4_scout_report'],
      bonus: ['m4_mosaic'],
      pick: [
        { t: ['The Eclipse Observatory, far east on the Heights', 'The Eclipse Observatory, far east'], right: true },
        { t: ['Down into Drowned Lumen', 'Down into Drowned Lumen'],
          hint: ['You swam through all of Lumen. Octavia had lamps, not Shards. Which way did the moth face on the balcony?',
            'You swam all through Lumen. Which way did the moth face?'] },
        { t: ['Into Coralcombe, under the sea', 'Into Coralcombe'],
          hint: ['The scouts saw it fly OVER the reef, not into it. Where does it go, on Lumen\'s sky map?', 'It flew OVER the reef. Look at the sky map.'] },
      ],
      then: ['set m4_where_shard', 'xp 400'],
    },
  },

  step: [
    { id: 'queen', do: 'talk m_coralia', scene: 'crl_coralia', intro: 'crl_after',
      obj: ['Dive into the coral ring south of Driftwood and meet Queen Coralia', 'Dive into the coral ring. Meet the Queen.'] },
    { id: 'kipper', do: 'talk m_kipper', scene: 'crl_kipper', then: ['clue m4_scout_report'],
      obj: ['Ask Sir Kipper what the scouts saw', 'Ask Sir Kipper what he saw'],
      extra: [
        // the red herring, in Driftwood on the way (Dabble is on the Town Raft)
        { do: 'talk m_dabble', scene: 'crl_dabble', then: ['clue m4_bottom_sea'] },
      ] },
    { id: 'deduce', do: 'deduce where_shard', obj: ['Work out where the moth took the Shard, in the Case Book', 'Open the Case Book'] },
    { id: 'east', do: 'talk m_coralia', scene: 'crl_east', then: ['set m_coral_met', 'xp 800', 'stage m_reef'],
      obj: ['Tell Queen Coralia where the Shard went', 'Tell Queen Coralia'] },
  ],

  scene: {
    // Iska, once Dive is Ash's (the old m_lumen_after)
    crl_after: [
      ['iska', 'Coralcombe is down in the reef south of Driftwood. A ring of coral with deep water in the middle. You can go DOWN now, Ash.',
        'Coralcombe is in the reef south of Driftwood. You can go DOWN now, Ash.', { ref: 'm4_coral_dive' }],
    ],
    // the old STORY.m_coral_in (x3_story's tick plays it when Ash first swims into the village), replaced in place
    m_coral_in: [
      ['narr', 'You dive into the ring of coral, down through a curtain of bubbles, into a village made of shells.', 'You dive down into a village made of shells.'],
      ['narr', 'Pearl lamps glow on every doorstep. Fish swim through the windows. A seahorse in a tiny saddle stares at you.',
        'Pearl lamps glow. A seahorse in a tiny saddle stares at you.'],
      ['m_kipper', "HALT! Who swims there? ...Oh my. A dragon. Underwater. Is that allowed? Nobody ever wrote a rule.",
        'HALT! A dragon, underwater? Is that allowed? Nobody wrote a rule!'],
      ['m_coralia', "Let him pass, Sir Kipper. We have waited a very long time for a dragon. I thought he would be bigger.",
        'Let him pass. We waited a long time for a dragon. I thought he would be bigger.'],
      ['ash', "I'm medium!"],
    ],
    crl_coralia: [
      ['m_coralia', "I am Coralia, Queen of the Lumenfolk. Our grandmothers' grandmothers lived in Lumen, under the moon, until the moth came the first time.",
        'I am Coralia, Queen of the Lumenfolk. Long ago we lived in Lumen.'],
      ['ash', 'Are you related to the moon?'],
      ['m_coralia', "I hope not. I can't count that high."],
      ['m_coralia', "You've come for the last piece of your Heart. A great grey moth carried it off. Where? Ask Sir Kipper. He was on watch.",
        'A grey moth took the last piece of your Heart. Where? Ask Sir Kipper.'],
      ['m_coralia', 'And think about Lumen, little dragon. Lumen always knew where the moon\'s things went.', 'And think about Lumen. It knew where moon things go.'],
    ],
    crl_kipper: [
      ['m_kipper', "The great grey moth? I saw it! I was on watch. I am ALWAYS on watch. Except at lunch.", 'I saw the moth! I was on watch. I am ALWAYS on watch.'],
      ['m_kipper', 'Grey, and bigger than a ship. It flew right over the Reefwall. EAST.', 'Grey, bigger than a ship. It flew over the Reefwall. EAST.',
        { dir: ['m4_coral_dive', 'm4_sunken_gate', 'east'] }],
      ['ash', 'Did it come down anywhere?'],
      ['m_kipper', "Not that I saw. It was heading for a little brass bump on the far hills. Then it was a dot. Then it was lunch.",
        'It flew toward a brass bump on the far hills. Then it was a dot.'],
    ],
    crl_dabble: [
      ['m_dabble', "Looking for something lost? Then look DOWN. Lost things sink. Everything ends up at the bottom of the sea.",
        'Lost something? Look DOWN. Everything sinks to the bottom of the sea.'],
      ['m_dabble', 'My hat. My other hat. Most of the chickens, once. They came back. They were cross.', 'My hat. My other hat. The chickens, once.'],
    ],
    crl_east: [
      ['m_coralia', "The Eclipse Observatory, where Lumen's astronomers watched the moon. Clever dragon. Our priests drove the moth away from Lumen with a fire made of moonlight.",
        'The Observatory! Clever dragon. Long ago our priests drove the moth away with moonlight fire.'],
      ['m_coralia', 'A girl with horns taught it to them, long before. We still sing about her.', 'A girl with horns taught them. We still sing about her.'],
      ['ash', 'Ember. That was Ember.'],
      ['m_coralia', 'Then you are her family. Welcome home, a little bit.', 'You are her family. Welcome home, a little bit.'],
      ['m_coralia', 'The only way east is under the Reefwall, through the Sunken Gate. But the gate is blocked. By a very full-of-himself fish. Baron Puffington.',
        'The way east is through the Sunken Gate. But a puffed-up fish is stuck in it.', { promise: 'm4_sunken_gate' }],
      ['m_kipper', 'He called my seahorse a "wet pony"!'],
      ['m_coralia', 'If you want to know about silver leashes, speak to Elder Ripple in the Pearl Archive. He knows more than is good for him.',
        'Want to know about silver leashes? Ask Elder Ripple in the Pearl Archive.', { if: '!quest m_leash started' }],
    ],
  },
})
