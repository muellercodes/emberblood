// Map 3 (Moonfall): things old code already draws that A4b's chapters (m_glasswall, m_mirror, m_moonpath,
// m_observatory, m_reforge) name. Every coordinate was read from the live game (Playwright: __eb.DOORS,
// __eb.LANDMARKS, __eb.pBlocked, __eb.elevLvl). Data only.

// the Burrow Gap under the Glasswall (x3_world's p4 sandgap; it opens once m_eclipse2 is set, and x3_world sets
// m_gap_dug when Ash burrows through it). The only way east onto the Mirror Flats: nobody climbs or flies the wall.
legacy({ id: 'm_burrowgap', map: 3, at: [10900, 67200], r: 120, kind: 'gate', opens_with: 'burrow', leads: 'm4_gap_east',
         name: ['the Burrow Gap', 'the Burrow Gap'], aliases: ['the Glasswall', 'the gap under the Glasswall'], src: 'LANDMARKS:m_burrowgap' });

// the Mirror Temple on its white dais in the middle of the Mirror Flats (the dungeon's door)
legacy({ id: 'm_mirror_door', map: 3, at: [12300, 68446], r: 60, kind: 'door', leads: 'm_mirror',
         name: ['the Mirror Temple', 'the Mirror Temple'], aliases: ['the temple of mirrors'], src: 'DOORS:m_mirror' });

// the Moonpath: three moon braziers (x3_world's p4 moonstones; Moonfire lights each one for good) and the moon-glass
// stairs between them (solid only in moonlight: Moonfire)
legacy({ id: 'm_mpb1', map: 3, at: [12470, 65446], r: 40, kind: 'prop', name: ['the moon brazier at the foot of the Moonpath', 'the foot brazier'],
         src: 'LANDMARKS:m_mpb1' });
legacy({ id: 'm_mpb2', map: 3, at: [12560, 65110], r: 40, kind: 'prop', name: ['the moon brazier at the first bend', 'the first bend brazier'],
         src: 'LANDMARKS:m_mpb2' });
legacy({ id: 'm_mpb3', map: 3, at: [13110, 64700], r: 40, kind: 'prop', name: ['the moon brazier at the top bend', 'the top brazier'],
         src: 'LANDMARKS:m_mpb3' });
legacy({ id: 'm_moonpath_stairs', map: 3, at: [12620, 65358], r: 60, kind: 'gate', opens_with: 'moonfire', leads: 'm_obs_door',
         name: ['the moon-glass stairs of the Moonpath', 'the glass stairs'], src: 'x3_world.js M3W_MP' });

// the Eclipse Observatory's great door at the top of the Moonpath (level 6)
legacy({ id: 'm_obs_door', map: 3, at: [12968, 64305], r: 60, kind: 'door', leads: 'm_obs',
         name: ['the Eclipse Observatory', 'the Observatory'], aliases: ['the great door', 'the Observatory door'], src: 'DOORS:m_obs' });
