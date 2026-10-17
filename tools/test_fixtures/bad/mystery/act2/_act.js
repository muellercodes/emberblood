// mystery: the main mystery has 1 deduction, there is one small mystery, no herring; a wrong pick has no hint;
// a deduction asks for a clue the player only finds after it
act({ id: 2, name: 'The Masked Thief', map: 1,
  mystery: {
    moth_mask:    { main: true, title: ['Who is she?', 'Who is she?'] },
    what_stopped: { title: ['What stopped the clocks?', 'What stopped the clocks?'] },
  },
  gates_min: 0,
})
