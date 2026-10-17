// game/story/registry/map2_n5.js (N5S): Frostreach things the finale's talk and Glaciar's errand name (act 5).
// n5_glaciar_bed is the Crown of Dread, where x2_story.js (f2sDrawGlac at F2SP.crown) draws a beaten Glaciar asleep
// under the snow and the purple chains. She is gone once Ash sings her awake (q_n5_glaciar sets n5_glaciar; N5S ENGINE
// REQUEST 4 takes the drawing away then).
legacy({ id: 'n5_glaciar_bed', map: 2, at: [7300, 41250], r: 300, kind: 'place', name: ['the Crown of Dread, where Glaciar sleeps', 'the Crown of Dread'],
  aliases: ['Mount Dread'], src: 'POI:f_crown', states: { asleep: '!flag n5_glaciar', gone: 'flag n5_glaciar' } });
legacy({ id: 'f_brynja', map: 2, at: [6880, 49040], r: 40, kind: 'npc', name: ['Old Brynja, Hearthkeeper', 'Old Brynja'], src: 'CAST:f_brynja' });
