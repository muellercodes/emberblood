// game/story/registry/map0_n5.js (N5S): Embermere things the finale's talk and errands name (act 5).
// n5_moon is the fact behind every "no moon" line in act5/people.js: gone until the dawn (x4_story sets flag n_dawn),
// back after it. n5_duchess_pen is Duchess's pen at Hollis Farm (a2c_build.js draws it as the 'pen' decal at
// farm + (60, 150)): empty while she follows Ash up the peak (N5S ENGINE REQUEST 5 keeps G.goat off map 0 until then).
legacy({ id: 'n5_moon', map: 0, at: [2600, 9300], r: 700, kind: 'place', name: ['the night sky over Emberhollow', 'the sky'],
  aliases: ['the moon'], src: 'POI:village', states: { gone: '!flag n_dawn', back: 'flag n_dawn' } });
legacy({ id: 'n5_duchess_pen', map: 0, at: [3360, 5330], r: 200, kind: 'place', name: ["Duchess's pen at Hollis Farm", "Duchess's pen"],
  src: 'POI:farm', states: { empty: '!flag n_dawn', home: 'flag n_dawn' } });
