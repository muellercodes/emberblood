// DEMO data (see _act.js). Stand-in text. c_end_foe is too long on purpose.
chapter({
  id: 'c_spire', act: 2, after: 'c_light', next: 'c_snow',
  card: ['Act II · Chapter 7', 'The Shadow Spire'],
  deduce: {
    what_she_is: {
      mystery: 'moth_mask',
      ask: ['What is Vesper?', 'What is she?'],
      needs: ['l_fireproof', 'l_pearl_mural', 'k_claws'],
      bonus: ['q_lookout_page'],
      pick: [
        { t: ['An Emberblood without fire', 'An Emberblood with no fire'], right: true },
        { t: ['A moth in disguise', 'A moth'], hint: ['The dust is on her, not from her.', 'The dust is on her.'] },
        { t: ['A clockwork girl', 'Clockwork'], hint: ['She breathes hard and said thank you.', 'She breathes.'] },
      ],
    },
  },
  step: [
    { id: 'deduce', do: 'deduce what_she_is', obj: ['Work out what she is', 'Open the Case Book'] },
    { id: 'door', do: 'goto c_spire_door', obj: ['Cross to the Shadow Spire', 'Go to the Spire'] },
    { id: 'spire', do: 'dungeon c_spire', obj: ['Climb the Shadow Spire', 'Climb the Spire'] },
    { id: 'fight', do: 'fight c_mothmask', win: 'c_choice' },
    { id: 'ending', do: 'cutscene c_choice' },
  ],
  scene: {
    c_choice: [
      ['c_vesper', 'Finish it, then.', 'Finish it.'],
      { choose: 'c_vesper', ask: ['What do you do?'], pick: [
        { t: ['Cousin. Why are you doing this?', 'Why, cousin?'], if: 'trust vesper>=4', locked: ["She doesn't trust you enough yet", 'Not enough trust yet'], scene: 'c_end_friend' },
        { t: ['Finish the fight', 'Finish the fight'], scene: 'c_end_foe' },
      ] },
    ],
    c_end_friend: [
      ['c_vesper', 'Gran was cold. The Lady said the light would help.', 'Gran was cold.'],
      ['ash', 'We will find another way to keep her warm.', 'We will help her.'],
      ['c_vesper', 'Here. My journal page. It says everything.', 'Here. My journal page.', { do: ['clue p_journal'] }],
    ],
    c_end_foe: [
      ['c_vesper', 'Fine! Have your stupid Shard!', 'Fine! Take it!'],
      ['narr', 'She throws a glowing piece of the Heart at your feet.', 'She throws the Shard down.'],
      ['c_vesper', 'A great moth took the rest. Ask the moon!', 'A moth took the rest!'],
      ['narr', 'She runs for the edge.', 'She runs.'],
      ['ash', 'Wait!'],
      ['narr', 'A page flutters down behind her.', 'A page falls.'],
      ['narr', 'Then she is gone into the dark.', 'She is gone.'],
      ['narr', 'The moths go quiet.', 'The moths are quiet.'],
    ],
  },
  clue: { p_journal: { icon: 'note', text: ["Vesper's journal page: Murmur, the three Shards, the Lady's promise.", 'Murmur. Three Shards. A promise.'] } },
})
