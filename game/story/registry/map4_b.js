// Map 4 (Nightfall Peak), the top of the climb: things old code already draws that N5b's chapters (n_glass, n_crown,
// n_nyxara) name. Ring 4 (the Moonglass Crown, level 7), the Crown Shrine, the Moon Road and the summit (level 8). The
// peak is a spiral round (4500, 85200): x4_world's n4P(r, a) is (4500 + r sin a, 85200 + r cos a). Every point here
// was probed in the live game (elevLvl through elev: entries, SHRINES positions). N5a's map4_a.js has the Bridgefoot and
// rings 1 to 3. Data only.

// the Gust Stair: the column of wind on ring 3 (level 6) that lifts Ash up to ring 4. N5a's entry (registry/map4_a.js),
// copied exactly: two entries with one id must agree
legacy({ id: 'n5_gust', map: 4, at: [5166, 87032], r: 140, kind: 'landmark', name: ['the Gust Stair', 'the snow wind'], src: 'prop:n4a@5166,87032' });
// the Moonglass Shrine on ring 4 (x4_world shrine list)
legacy({ id: 'n_sh_glass', map: 4, at: [5003, 86279], r: 330, kind: 'landmark', name: ['the Moonglass Shrine', 'the Moonglass Shrine'],
         src: 'SHRINES:n_sh_glass' });
// the Drowned Mirror: the lagoon x4_ascent raises (n_lagoon), N4SPOT.lagoon
legacy({ id: 'n4_lagoon', map: 4, at: [5265, 86112], r: 220, kind: 'place', name: ['the Drowned Mirror', 'the Drowned Mirror'],
         aliases: ['the lagoon'], src: 'elev:7@5265,86112' });
// the Moon Lock: x4_ascent's eye-door across the ring at a 162 (r 1112 to 1268); the moonbeam opens it (n_beam)
legacy({ id: 'n4_moonlock', map: 4, at: [4868, 84068], r: 90, kind: 'landmark', name: ['the Moon Lock', 'the Moon Lock'],
         src: 'elev:7@4868,84068' });
// the Tendril Wood (a 170 to 245 on ring 4): the shadow vines Moonfire burns (n_wood); (4500, 84010) is where the old
// code met Hush, a 180
legacy({ id: 'n4_tendril_wood', map: 4, at: [4500, 84010], r: 270, kind: 'place', name: ['the Tendril Wood', 'the Tendril Wood'],
         aliases: ['the shadow vines'], src: 'elev:7@4500,84010' });
// the Eclipse Hall: Echo 4's arena (x4_foes site n_echo4, boss n_echo_hush), a black glass ring with a sand rim. The id is
// the foe's, as N5a names the other echoes' sites, so a `fight n_echo_hush` step marks it by itself
legacy({ id: 'n_echo_hush', map: 4, at: [3315, 85096], r: 290, kind: 'place', name: ['the Eclipse Hall', 'the Eclipse Hall'],
         src: 'SITES:n_echo4' });
// the Moth's Cradle: the cocoon field and the sand nest (x4_world cradle_nest, x4_ascent n4aBuildCradle)
legacy({ id: 'n4_cradle', map: 4, at: [3704, 86084], r: 260, kind: 'place', name: ["the Moth's Cradle", "the Moth's Cradle"],
         aliases: ['the cocoons'], src: 'elev:7@3704,86084' });
// the Crown Shrine at the edge of ring 4 (the Nyxara respawn point)
legacy({ id: 'n_sh_crown', map: 4, at: [3331, 85875], r: 230, kind: 'landmark', name: ['the Crown Shrine', 'the Crown Shrine'],
         src: 'SHRINES:n_sh_crown' });
// the Moon Road: floating stones over the moat to the summit (level 8). I1 is its first stone (Double Jump), then a
// grapple post, a wind stream and a strip of moon-glass (x4_ascent n4aBuildRoad); n_road counts them (4 at the end)
legacy({ id: 'n4_moon_road', map: 4, at: [3781, 85615], r: 140, kind: 'place', name: ['the Moon Road', 'the Moon Road'],
         aliases: ['the floating stones'], src: 'elev:8@3781,85615' });
// the end of the Moon Road, in front of the Moon Door (x4_ascent's END: the door prompt "Hold up the Ember Heart")
legacy({ id: 'n4_road_end', map: 4, at: [4490, 85992], r: 60, kind: 'place', name: ['the end of the Moon Road', 'the end of the road'],
         src: 'elev:8@4490,85992' });
// the Moon Door (x4_ascent gate n_moondoor at n4aP(728, 0)): shut until the Ember Heart opens it (n_door)
legacy({ id: 'n4_moon_door', map: 4, at: [4500, 85928], r: 60, kind: 'door', name: ['the Moon Door', 'the Moon Door'],
         leads: 'n4_summit', src: 'elev:8@4500,85928' });
// the summit: the round glass floor under the broken moon where Nyxara waits (x4_foes site n_summit, boss n_nyxara)
legacy({ id: 'n4_summit', map: 4, at: [4500, 85300], r: 500, kind: 'place', name: ['the summit', 'the summit'],
         aliases: ['the top', 'the top of the mountain'], src: 'elev:8@4500,85300' });
legacy({ id: 'n_nyxara', map: 4, at: [4500, 85200], r: 500, kind: 'place', name: ['the Night Mother', 'the Night Mother'],
         src: 'SITES:n_summit' });
