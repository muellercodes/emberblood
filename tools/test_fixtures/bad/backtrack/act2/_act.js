// backtrack: act 2 asks for 5 new-power gates on Embermere; there are 2, and one leads to nothing that pays
act({ id: 2, name: 'The Masked Thief', map: 1,
  mystery: {
    moth_mask:    { main: true, title: ['Who is she?', 'Who is she?'] },
    what_stopped: { title: ['What stopped the clocks?', 'What stopped the clocks?'] },
    who_cut:      { title: ['Who cut the ropes?', 'Who cut the ropes?'] },
  },
  gates_min: 5,
})
