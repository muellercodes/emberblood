// emdash: the escape below spells an em dash; test_check.sh also writes a real one into a copy
chapter({ id: 'c_dash', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Dash'],
  step: [ { id: 's', do: 'cutscene c_dash_s' } ],
  scene: { c_dash_s: [ ['narr', 'Wait \u2014 what?', 'Wait. What?'] ] },
})
