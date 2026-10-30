// game/story/act2/q_notes.js (A2S): Notes in the Rafters (c_notes). No giver: A2a's c_brass starts it when Ash reads
// note 2 in the Moth's Nest (quest start c_notes). Vesper hides notes in places only a climber reaches: the Gull's
// Rest chimney (claws), the top of the east harbor crane (grapple), behind the Cogwater Falls (Shadow Dash, in the
// dark). Ash writes a reply on the back of each. Surprise: her last note, at the Moon Ring, answers the way he wrote
// back (kind, brave or silly). Payoff: a Heart Ember in the box on the tallest stone, the Moon Ring clue q_moonring
// (what_stopped) and, for two kind replies, Vesper's trust +1 (the old step's reward, with its 500 XP).
// Old saves: QDEFS.c_notes steps 0..1 map to drops, ring. Notes 3 to 6 stay x1_people's landmarks (power checks,
// the reply choice, the falls shadow); x1_people plays the Moon Ring scene by its STORY key c_note6 and gives the
// Heart Ember c_moonring, so the scene below replaces that text.
quest({
  id: 'c_notes', act: 2, giver: null, optional: true, takeover: true,
  title: ['High Notes', 'Notes in the Rafters'],
  payoff: { kind: 'heart_ember', id: 'c_moonring' },
  old_steps: ['drops', 'ring'],

  clue: {
    q_moonring: { icon: 'dust', mystery: 'what_stopped',
      text: ['The Moon Ring in the Moth Wood: the grass inside is flattened flat, as if something huge sat there. Silver dust everywhere.',
        'Something huge sat in the Moon Ring. Silver dust!'] },
  },

  step: [
    { id: 'drops', do: 'all', legacy: true,
      obj: ["Find the Moth Mask's other notes: the Gull's Rest chimney, the top of a harbor crane, behind the Cogwater Falls",
        'Find 3 notes: a chimney, a crane, the falls'],
      parts: [
        { do: 'wait_for flag c_note3', marker: 'c_lm_note3',
          hint: ["High on the Gull's Rest chimney. Climb it.", 'Climb the inn chimney.'] },
        { do: 'wait_for flag c_note4', marker: 'c_lm_note4',
          hint: ['On top of the east harbor crane. Grapple up.', 'Grapple up the crane.'] },
        { do: 'wait_for flag c_note5', marker: 'c_lm_note5h',
          hint: ['Behind the Cogwater Falls. After dark, Shadow Dash into the gap behind the water.', 'Dash behind the falls at night.'] },
      ] },
    { id: 'ring', do: 'wait_for flag c_note6', legacy: true, marker: 'c_lm_note6',
      obj: ['One more note waits at the Moon Ring in the Moth Wood', 'The last note is at the Moon Ring'],
      hint: ['The Moon Ring is a circle of seven pale stones in the Moth Wood, west of the Downs.', 'Seven stones in the Moth Wood.'] },
    // (no then: the old step's own reward gives the 500 XP and Vesper's trust +1 for two kind replies)
  ],

  scene: {
    // replaces STORY.c_note6; x1_people adds the Heart Ember and sets c_note6 after it
    c_note6: [
      ['narr', 'The Moon Ring. Seven pale stones. The grass in the middle is pressed flat, as if something huge once sat here.',
        'Seven stones. Something huge sat here.', { clue: 'q_moonring' }],
      ['narr', 'On the tallest stone: a note, weighed down with a little box.', 'A note and a box on the tallest stone.'],
      { if: { any: ['flag c_reply3=kind flag c_reply4=kind', 'flag c_reply3=kind flag c_reply5=kind', 'flag c_reply4=kind flag c_reply5=kind'] },
        then: [['narr', '"You wrote back. Every time. Nobody writes back."', '"You wrote back. Nobody writes back."']] },
      { if: { any: ['flag c_reply3=brave flag c_reply4=brave', 'flag c_reply3=brave flag c_reply5=brave', 'flag c_reply4=brave flag c_reply5=brave'] },
        then: [['narr', '"You said you\'d climb every chimney on the coast to find me. You nearly did."', '"You nearly found me."']] },
      { if: { any: ['flag c_reply3=silly flag c_reply4=silly', 'flag c_reply3=silly flag c_reply5=silly', 'flag c_reply4=silly flag c_reply5=silly'] },
        then: [['narr', '"Your notes made me laugh on a roof at midnight. Gran asked why I was snorting."', '"Your notes made me laugh."']] },
      ['narr', '"This is where I met her. The Lady. Don\'t stay here after dark. The moths remember. V."',
        '"I met the Lady here. Don\'t stay after dark."'],
      ['narr', '"I left you something warm. Somebody ought to have something warm."', '"I left you something warm."'],
      ['narr', 'In the box, a Heart Ember glows softly.'],
    ],
  },
})
