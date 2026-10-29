// game/story/act1/_act.js: Act I, "The First Flame". Data only.
// Act I's stages (wake ... summit, done) stay the old code in a9c_story.js and x0_act1.js. What is data here is
// the act's Case Book: one main mystery and two small ones, each run by a quest in a1_gate.js.
//
// Main mystery a1_gate, "Who opened the North Gate?" (Yara's quest 'gate', The Open Gate), three deductions:
//   a1_how  How did the kobolds get through?    a1_lock, a1_claws                      -> somebody inside used a key
//   a1_who  Who is "W."?                        a1_letter, a1_prints, a1_spare_key,
//                                               a1_lamplighter, a1_wendel_alibi        -> Fennick Wick (W for Wick)
//   a1_why  Why would he help the Oath?         a1_letter, a1_empty_oil, a1_badge      -> his oil ran out; they promised oil forever
//   Red herrings: a1_wendel_w (Wendel signs his songs "W."), a1_pebble_key (a key in the crow's nest, but it says PANTRY).
//   Wrong suspects ruled out by clues: Wendel (a1_wendel_alibi), Sister Wren (a1_wren_away), Hal (H, not W; his key never left him).
// Small mystery a1_hat, "What rattles in Sir Strawsworth's hat?" (quest a1_hat): Pebble the crow. Its payoff is a
//   truth for the main mystery: a brass button from Wick's Lamps & Oils, which Pebble picked up by the North Gate.
// Small mystery a1_snuffed, "Who put out the Hollow Ward?" (quest a1_snuffed): the Scaled Oath (black candle wax).
//   Red herring a1_windy (it was a windy day). Its payoff is a truth for a1_how: an Oath cultist came in with the kobolds.
act({
  id: 1, map: 0,
  name: ['Act I: The First Flame', 'Act I: The First Flame'],
  legacy_stages: true,
  mystery: {
    a1_gate: {
      main: true, quest: 'gate', deduce: ['a1_how', 'a1_who', 'a1_why'],
      title: ['Who opened the North Gate?', 'Who opened the gate?'],
      solved: ['Fennick Wick opened the North Gate with the spare key. The Scaled Oath promised him lamp oil that never runs out. W was for Wick all along.',
        'Fennick opened the gate. The Oath promised him oil forever.'],
    },
    a1_hat: {
      quest: 'a1_hat', deduce: ['a1_hat_who'],
      title: ["What rattles in Sir Strawsworth's hat?", 'What is in the hat?'],
      solved: ["Pebble, Elder Yara's crow, hides her treasures in Sir Strawsworth's hat. So much for scaring crows.", 'Pebble the crow hides things in the hat.'],
    },
    a1_snuffed: {
      quest: 'a1_snuffed', deduce: ['a1_snuff_who'],
      title: ['Who put out the Hollow Ward?', 'Who put out the Ward?'],
      solved: ['The Scaled Oath snuffed the Hollow Ward with a black candle, while the kobolds ran wild and everyone looked the other way.', 'The Oath put out the Ward with a black candle.'],
    },
  },
  // Act I has no earlier maps to send the player back to (rule 8 starts with Act II)
  gates_min: 0,
})
