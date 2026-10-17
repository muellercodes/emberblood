// game/story/registry/map4_a.js (N5a): the things the old code already draws on the way up Nightfall Peak, from the
// Moonfall end of the moonfire bridge to the top of the third ring, that the finale's climb chapters (n_bridge,
// n_stair, n_clocks, n_rime) name. `src` says where the engine finds the real thing (__eb.story.entity(id).ok):
// x4_world's crossings, shrines, boss sites and levels (elev:<level>@x,y), x4_ascent's prompts ('prop:n4a@x,y' is the
// prompt landmark x4_ascent puts on a puzzle piece). Ring 4, the Crown and the summit are N5b's (map4_b.js).
// Positions: N4WORLD.md and N4ASCENT.md (P(r,a) = (4500 + r sin a, 85200 + r cos a), a 0 is toward the bridge).

// ---------- map 3 (Moonfall): where the finale starts
// the moonfire bridge at the end of the Moon Pier (x4_world's crossing n_bridge_in, open from n_bridge on)
legacy({ id: 'n5_pier_end', map: 3, at: [13700, 65450], r: 120, kind: 'place',
  name: ['the moonfire bridge at the end of the Moon Pier', 'the fire bridge'], aliases: ['the moonfire bridge', 'the Moon Pier'],
  src: 'CROSSINGS:n_bridge_in' });

// ---------- map 4: the Bridgefoot
// the south end of the moonfire deck: the way back to Moonfall (always open)
legacy({ id: 'n5_bridge_back', map: 4, at: [4500, 90900], r: 100, kind: 'place',
  name: ['the moonfire bridge back to Moonfall', 'the bridge home'], src: 'CROSSINGS:n_bridge_out' });
legacy({ id: 'n_sh_foot', map: 4, at: [4880, 89880], r: 60, kind: 'landmark', name: ['the Bridgefoot Shrine', 'the Bridgefoot Shrine'],
  src: 'SHRINES:n_sh_foot' });
// the three dark lanterns of the copied green (x4_ascent: a gentle breath lights each; all three at once melt the curtain)
legacy({ id: 'n5_lantern_green', map: 4, at: [4200, 89640], r: 40, kind: 'landmark', name: ['the lantern on the green', 'the green lantern'],
  src: 'prop:n4a@4200,89640' });
legacy({ id: 'n5_lantern_pond', map: 4, at: [5250, 89720], r: 40, kind: 'landmark', name: ['the lantern on the little islet', 'the islet lantern'],
  src: 'prop:n4a@5250,89720' });
legacy({ id: 'n5_lantern_high', map: 4, at: [3760, 89560], r: 40, kind: 'landmark', name: ['the lantern up on the step', 'the high lantern'],
  src: 'prop:n4a@3760,89560' });
// the shadow curtain across the foot of the stairs (x4_ascent's gate, flag n_gate) and the top of those stairs
legacy({ id: 'n5_shadow_curtain', map: 4, at: [4500, 89400], r: 130, kind: 'landmark', name: ['the shadow curtain', 'the dark curtain'],
  src: 'prop:n4a@4500,89410' });
legacy({ id: 'n5_stairs_top', map: 4, at: [4500, 88980], r: 160, kind: 'place', name: ['the top of the Bridgefoot stairs', 'the top of the stairs'],
  src: 'elev:1@4500,88980' });

// ---------- map 4: Tier I, the Ember Stair (levels 1 and 2)
legacy({ id: 'n5_sluice', map: 4, at: [4925, 88960], r: 160, kind: 'place', name: ['the Sluice', 'the river'], src: 'elev:1@4925,88960' });
legacy({ id: 'n5_crystal', map: 4, at: [7603, 87659], r: 120, kind: 'place', name: ['the drawbridge crystal', 'the crystal'],
  src: 'elev:1@7603,87659' });
legacy({ id: 'n5_terrace', map: 4, at: [8398, 85030], r: 120, kind: 'place', name: ['the Updraft Terraces', 'the windy cliff'],
  src: 'elev:1@8398,85030' });
legacy({ id: 'n5_leap_court', map: 4, at: [7885, 83474], r: 260, kind: 'place', name: ['the Leap Court', 'the Leap Court'],
  src: 'elev:2@7885,83474' });
legacy({ id: 'n5_flame_leap', map: 4, at: [7588, 82868], r: 50, kind: 'landmark', name: ['the Leap flame', 'the Leap flame'],
  src: 'prop:n4a@7588,82868' });
legacy({ id: 'n5_flame_tide', map: 4, at: [6995, 82346], r: 50, kind: 'landmark', name: ['the Tide flame', 'the Tide flame'],
  src: 'prop:n4a@6995,82346' });
legacy({ id: 'n5_flame_sky', map: 4, at: [5733, 81618], r: 50, kind: 'landmark', name: ['the Sky flame', 'the Sky flame'],
  src: 'prop:n4a@5733,81618' });
// the Echo Gate: a curtain across the ring with three flame marks that light one by one (x4_ascent)
legacy({ id: 'n5_echo_gate', map: 4, at: [5042, 81337], r: 120, kind: 'landmark', name: ['the Echo Gate', 'the Echo Gate'],
  src: 'prop:n4a@5042,81337' });
// Echo 1, the Shadow Throne (x4_foes defineBoss n_echo1): the arena and the fight
legacy({ id: 'n_echo_vor', map: 4, at: [4500, 81500], r: 380, kind: 'npc', name: ['the Echo of the First Flame', 'the shadow dragon'],
  aliases: ['the Shadow Throne'], src: 'SITES:n_echo1' });
// the Wind Chimney vent (x4_world adds it once Echo 1 is beaten) and the Clockstop Shrine at its top
legacy({ id: 'n5_chimney', map: 4, at: [3296, 81892], r: 120, kind: 'place', name: ['the Wind Chimney', 'the Wind Chimney'],
  src: 'elev:2@3296,81892' });

// ---------- map 4: Tier II, the Clockstop Cliffs (levels 3 and 4)
legacy({ id: 'n_sh_clock', map: 4, at: [3256, 82860], r: 60, kind: 'landmark', name: ['the Clockstop Shrine', 'the Clockstop Shrine'],
  src: 'SHRINES:n_sh_clock' });
// the Midnight Clock: an ink face round a hub; the rule is written on its rim (x4_ascent's rim sign)
legacy({ id: 'n5_clock', map: 4, at: [2165, 83565], r: 300, kind: 'landmark', name: ['the Midnight Clock', 'the big clock'],
  src: 'prop:n4a@2486,83470' });
// the Silk Gallery: moth veils in both necks, five grapple posts across the void
legacy({ id: 'n5_gallery_neck', map: 4, at: [1760, 84900], r: 120, kind: 'place', name: ['the edge of the Silk Gallery', 'the silk bridge'],
  aliases: ['the Silk Gallery'], src: 'prop:n4a@1677,84803' });
legacy({ id: 'n5_gallery_far', map: 4, at: [2285, 86993], r: 140, kind: 'place', name: ['the far side of the Silk Gallery', 'the far side'],
  src: 'prop:n4a@2194,86875' });
// the post Nyxara hid in the middle of the gallery (x4_world draws it once flag n_vline is set)
legacy({ id: 'n5_hidden_post', map: 4, at: [1977, 85829], r: 50, kind: 'landmark', name: ['the hidden grapple post', 'the hidden post'],
  if: 'flag n_vline', src: 'elev:3@1977,85829' });
// the Gear Bridge: three brass weights, the scale plate they fall on, the teeth that make a walkway
legacy({ id: 'n5_gear', map: 4, at: [4624, 88047], r: 200, kind: 'place', name: ['the Gear Bridge', 'the gears'], src: 'elev:4@4624,88047' });
// Echo 2, the Mask Hall (x4_foes defineBoss n_echo2): a ring of black glass with two balconies
legacy({ id: 'n_echo_vesper', map: 4, at: [6515, 87215], r: 360, kind: 'npc', name: ['the Echo of the Moth Mask', 'the shadow thief'],
  aliases: ['the Mask Hall'], src: 'SITES:n_echo2' });
// the Long Climb up to the third ring (its post appears once Echo 2 is beaten)
legacy({ id: 'n5_u2', map: 4, at: [7348, 85100], r: 200, kind: 'place', name: ['the Long Climb', 'the Long Climb'], src: 'elev:4@7348,85100' });

// ---------- map 4: Tier III, the Rime Spiral (levels 5 and 6)
legacy({ id: 'n_sh_rime', map: 4, at: [6403, 84313], r: 60, kind: 'landmark', name: ['the Rime Shrine', 'the Rime Shrine'],
  src: 'SHRINES:n_sh_rime' });
legacy({ id: 'n5_icewall', map: 4, at: [6077, 84053], r: 120, kind: 'landmark', name: ['the ice wall at the Wind Gate', 'the ice wall'],
  src: 'prop:n4a@6077,84053' });
// the Floe Gap: a wind stream loops over the void; jump into its swirl
legacy({ id: 'n5_floe', map: 4, at: [5941, 83813], r: 120, kind: 'landmark', name: ['the wind swirl at the Floe Gap', 'the wind swirl'],
  aliases: ['the Floe Gap'], src: 'prop:n4a@5941,83813' });
legacy({ id: 'n5_dam', map: 4, at: [4440, 83020], r: 160, kind: 'landmark', name: ['the Ice Dam', 'the ice dam'], src: 'prop:n4a@4440,83020' });
legacy({ id: 'n5_aurora', map: 4, at: [3038, 83902], r: 140, kind: 'landmark', name: ['the Aurora Bridge', 'the aurora'],
  src: 'prop:n4a@3038,83902' });
// Echo 3, the Rime Throne (x4_foes defineBoss n_echo3)
legacy({ id: 'n_echo_glaciar', map: 4, at: [3121, 86579], r: 400, kind: 'npc', name: ['the Echo of the Ice Dragon', 'the shadow ice dragon'],
  aliases: ['the Rime Throne'], src: 'SITES:n_echo3' });
// the Gust Stair up to the fourth ring (asleep until Echo 3 is beaten)
legacy({ id: 'n5_gust', map: 4, at: [5166, 87032], r: 140, kind: 'landmark', name: ['the Gust Stair', 'the snow wind'], src: 'prop:n4a@5166,87032' });
