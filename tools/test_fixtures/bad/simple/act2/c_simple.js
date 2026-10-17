// simple: a line over 8 words with no simple version
chapter({ id: 'c_simple', act: 2, after: 'c_coast', next: 'c_salt', card: ['Act II', 'Simple'],
  step: [ { id: 's', do: 'cutscene c_words' } ],
  scene: { c_words: [ ['narr', 'This line has a great many words in it and no simple version at all.'] ] },
})
