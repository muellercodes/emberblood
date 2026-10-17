// game/story/act2/c_coast.js (A2a): Act II, the walk down from the Southern Pass to Gearhaven.
// What the player does: watches the Moth Mask glide down to the city, asks Old Barley at his sheepfold (the fold is
// on the chalk road), finds Gerald, the sheep who fainted three nights ago and came up silver (the first clue of the
// "what stopped the clocks" mystery), then follows the road to the Upper Gate, where c_gear begins.
chapter({
  id: 'c_coast', act: 2, after: 'c_pass', next: 'c_gear', takeover: true,
  // the game numbers Act II's cards after the heist (c_fest 1, c_pass 2), so this is Chapter 3
  card: ['Act II · Chapter 3', 'Salt on the Wind'],
  so_far: [
    "Ash came down the Southern Pass to the sea. Old Barley the shepherd had seen the Moth Mask glide over twice. Three nights ago something much bigger flew over too, and left Gerald the sheep silver with dust.",
    'Something huge flew over. Gerald the sheep is silver now.'],
  hint: ["Gearhaven is at the bottom of the chalk road, on the white cliffs. Old Barley's sheepfold is on the way down.",
    'Follow the white road down. Stop at the sheep.'],
  mom: [["The sea! Pebble says you can smell it from the pass. Eat something salty for me.", 'The sea! Eat something salty for me.']],
  // x1_story.js plays these old scenes by itself (the c_coast enter hook, Barley's talk): the engine marks them seen
  silence: ['c_arrive', 'c_barley'],

  place: {
    // where she glides from and to in the arrival shot (in the sky: no ground needed)
    cst_glide_from: { map: 1, at: [3170, 20250], kind: 'npc_spot', name: 'the sky over the pass' },
    cst_glide_to: { map: 1, at: [4300, 21420], kind: 'npc_spot', name: 'the sky over the Downs' },
    // Gerald fainted so hard he rolled out of the fold: on the grass just past its open (east) side
    w_gerald: { map: 1, at: [4080, 21090], r: 22, kind: 'examine', look: 'a2a_silver_sheep', name: 'Gerald, the silver sheep',
      aliases: ['the silver sheep', 'Gerald'] },
  },

  clue: {
    w_silver_sheep: { icon: 'sheep', mystery: 'what_stopped',
      text: ['Three nights ago something big flew over the Downs. It left Gerald the sheep silver with moth dust. Far too much dust.',
        'Something big flew over. Gerald the sheep is covered in silver dust.'] },
  },

  step: [
    { id: 'arrive', do: 'cutscene cst_arrive', obj: ['Look out over the Clockwork Coast', 'Look at the sea'] },
    { id: 'barley', do: 'talk c_barley', scene: 'cst_barley',
      obj: ["Ask at Old Barley's sheepfold if anyone saw her", 'Ask the shepherd at the sheepfold'],
      hint: ["Old Barley's sheepfold is the round stone wall beside the chalk road, just down from the pass.", 'The sheepfold is by the road.'] },
    { id: 'gerald', do: 'examine w_gerald', scene: 'cst_gerald', then: ['clue w_silver_sheep'],
      obj: ['Find Gerald, the shiny sheep', 'Find the shiny sheep'],
      hint: ['Barley says all his sheep are called Gerald. You want the shiny one.', 'Look for the shiny sheep.'] },
    { id: 'road', do: 'goto c_upper_gate 300', then: ['stage c_gear'],
      obj: ['Follow the chalk road down to Gearhaven', 'Follow the road to Gearhaven'],
      hint: ['The chalk road runs all the way down to the Upper Gate of Gearhaven.', 'Follow the road to the city gate.'] },
  ],

  scene: {
    cst_arrive: [
      ['narr', 'The Southern Pass winds down and down, until the valley runs out and the ground turns into sky.', 'The pass winds down. Then the ground turns into sky.'],
      ['narr', 'No. Not sky. Water. Blue all the way to the edge of the world, and it smells of salt and old boats.', 'Not sky. Water! Blue to the edge of the world.'],
      ['ash', "Pip, look. It's a lake that forgot to stop.", 'Pip, look! A lake that forgot to stop.'],
      { if: 'flag pip', then: [['pip', 'Mip!']] },
      { if: 'choice ending=heir', then: [['ash', "Good thing I'm back to normal size. A giant dragon would scare all the boats.", 'Good thing I am small again!']] },
      ['narr', "Far below, on the white cliffs, a city ticks. Clock towers. Chimneys. A harbor full of ships that aren't going anywhere.", 'Far below, a city of clocks. Ships that do not move.'],
      { place: ['c_mask', 'cst_glide_from'] }, { anim: ['c_mask', 'glide'] }, { walk: ['c_mask', 'cst_glide_to'] },
      ['narr', 'And gliding down over the sheepfold, grey against the sky, goes a figure with wings like a moth.', 'Someone with moth wings glides down over the sheep.'],
      ['ash', 'There you are.'],
      ['ash', 'Okay, Moth Lady. Ready or not.', 'Okay, Moth Lady. Ready or not!'],
      { wait: 1 }, { do: ['despawn c_mask'] },
    ],
    cst_barley: [
      ['c_barley', "You'll be the dragon, then. The sheep said there'd be a dragon.", 'You must be the dragon. The sheep said so.'],
      ['ash', 'The sheep SAID?'],
      ['c_barley', "Not in words. Gerald fainted. That's how Gerald says most things.", 'Gerald fainted. That is how Gerald talks.'],
      ['c_barley', 'A girl just went over on a cloak like moth wings. Same as three nights back.', 'A moth girl just flew over. Same as three nights ago.'],
      ['c_barley', 'That first time she was carrying something that glowed. Like a little red sun.', 'That time she carried something glowing. Like a red sun.'],
      ['ash', "That's the Ember Heart! Which way did she go?", 'The Ember Heart! Where did she go?'],
      ['c_barley', 'Down to Gearhaven, same as today. But later that night something BIGGER went over. Gerald saw it.', 'To Gearhaven. But later something BIGGER flew over. Gerald saw it.'],
      ['ash', 'Which one is Gerald?'],
      ['c_barley', "They're all Gerald. You want the shiny one.", "They're all Gerald. Find the shiny one."],
    ],
    cst_gerald: [
      ['narr', 'Just outside the fold, one sheep lies flat on his back with his legs in the air.', 'One sheep lies on his back, legs in the air.'],
      ['narr', 'He is SILVER. Horns to hooves. Soft, glittery dust, as if somebody sneezed glitter on him. A LOT of glitter.', 'He is SILVER all over. Glittery dust. LOTS of it.'],
      ['ash', "That's not one moth's worth of dust. That's a whole... sheep's worth.", 'That is a LOT of dust.'],
      ['narr', 'Gerald opens one eye, sees a dragon, and faints again.', 'Gerald sees you. He faints again.'],
      { if: 'flag pip', then: [
        ['pip', 'Mip... mip... MIP-CHOO!'],
        ['narr', 'A silver cloud puffs up. Now Pip is silver too. He looks thrilled.', 'Now Pip is silver too. He loves it.']] },
      ['ash', 'Sorry, Gerald.'],
    ],
  },

  talk: {
    c_barley: [
      { if: 'seen cst_barley !stage>=c_gear', say: ["Gerald's fine. Fainting is good for him. Keeps him humble.", 'Gerald is fine. Fainting keeps him humble.'] },
    ],
  },
})
