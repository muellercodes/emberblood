// ================= v10_art5a: art for N5a's finale climb data (n_bridge, n_stair, n_clocks, n_rime). Art only: this
// file calls defineLook and definePose and nothing else. (x,y) is the foot of each look (its place's anchor) and every
// look fits in its w x h box above it (e10c_gates caches a static look once per state; `live` parts are drawn each
// frame on top).
//   the fourth lantern post on the copied green (empty hook, a tiny moth carved on top; lit: a flame that stays),
//   Sir Cindervane's real helmet on a rock, Ember's flame stone at the Echo Gate (three flame marks, a moth by each),
//   the Shadow Throne of Echo 1 and the grey moth scale left on it, the NYX letters under the Midnight Clock's hands,
//   Vesper's cracked moth mask with its note, Ember's folded paper lantern from the Gear Bridge, Glaciar's blue scale
//   in the snow, and Vesper hanging by one hand from the edge of a Silk Gallery island (a pose).
// The peak is black glass: the same four glass shades x4_ascent uses, violet rim light, ember cracks on ring 1.
// No em dash anywhere. Everything here is block scoped so no name can clash with another module.
{
  const T2 = Math.PI * 2, OL = '#120c1c';
  const has = typeof defineLook === 'function', hasPose = typeof definePose === 'function';
  const GL = ['#120c1c', '#2a2142', '#4d4072', '#c4b0ff'];
  const el = (g, x, y, rx, ry, rot, fill, lw, sc) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, T2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = sc || OL; g.stroke(); } };
  const ci = (g, x, y, r, fill, lw) => el(g, x, y, r, r, 0, fill, lw);
  const shadow = (g, x, y, rx, ry, a) => { g.save(); g.globalAlpha = a == null ? 0.38 : a; el(g, x, y, rx, ry, 0, '#06030c'); g.restore(); };
  const glow = (g, x, y, r, rgb, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const poly = (g, pts, fill, lw, sc) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = sc || OL; g.stroke(); } };
  const line = (g, pts, col, lw) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  const box = (g, x, y, w, h, P) => { g.fillStyle = P[0]; g.fillRect(x, y, w, h); g.fillStyle = P[1]; g.fillRect(x, y, w * 0.72, h); g.fillStyle = P[2]; g.fillRect(x, y, Math.max(1.5, w * 0.14), h); };
  // a little flame (layered teardrops), for the live parts
  function flame(g, x, y, t, k) {
    const f = Math.sin(t * 11) * 0.08 + Math.sin(t * 7.3) * 0.06, h = 13 * k * (1 + f), w = 5 * k;
    for (const [s, col] of [[1, '255,120,50'], [0.72, '255,190,80'], [0.42, '255,248,210']]) {
      g.beginPath(); g.moveTo(x, y - h * s); g.quadraticCurveTo(x + w * s * 1.3, y - h * s * 0.35, x, y); g.quadraticCurveTo(x - w * s * 1.3, y - h * s * 0.35, x, y - h * s);
      g.fillStyle = `rgb(${col})`; g.fill();
    }
  }
  // the tiny moth with two pale moons on its wings, carved (cx, cy: its middle; k: size; col: the carving's colour)
  function moth(g, cx, cy, k, col, moon) {
    for (const s of [-1, 1]) {
      el(g, cx + s * 3.2 * k, cy - 1 * k, 3.4 * k, 2.4 * k, s * 0.45, col);
      el(g, cx + s * 2.4 * k, cy + 1.8 * k, 2.2 * k, 1.6 * k, -s * 0.5, col);
      ci(g, cx + s * 3.4 * k, cy - 1.2 * k, 0.95 * k, moon || '#f2ecff');
    }
    line(g, [[cx, cy - 2.8 * k], [cx, cy + 2.6 * k]], col, 1.3 * k);
    line(g, [[cx - 0.4 * k, cy - 2.8 * k], [cx - 1.6 * k, cy - 4.6 * k]], col, 0.7 * k);
    line(g, [[cx + 0.4 * k, cy - 2.8 * k], [cx + 1.6 * k, cy - 4.6 * k]], col, 0.7 * k);
  }

  // ---------- the fourth lantern post: the same black glass post as the green's three lanterns (x4_ascent), but where
  // they have a lantern cage it has only an empty hook; on its cap a tiny carved moth with two pale moons
  function post(g, x, y, lit) {
    shadow(g, x + 2, y, 11, 4);
    g.save(); g.translate(x, y);
    box(g, -3, -60, 6, 61, GL); g.fillStyle = GL[0]; g.fillRect(-8, -3, 16, 4);
    // the cap and the arm with its empty hook
    box(g, -6, -66, 12, 6, GL); g.fillStyle = GL[2]; g.fillRect(-6, -66, 12, 1.4);
    line(g, [[3, -58], [15, -58]], GL[0], 3); line(g, [[3, -58.6], [15, -58.6]], GL[2], 1.1);
    g.beginPath(); g.moveTo(15, -58); g.lineTo(15, -52); g.arc(12.5, -52, 2.5, 0, Math.PI * 0.95); g.strokeStyle = GL[0]; g.lineWidth = 2.2; g.lineCap = 'round'; g.stroke();
    if (lit) { g.beginPath(); g.moveTo(15, -58); g.lineTo(15, -52); g.arc(12.5, -52, 2.5, 0, Math.PI * 0.95); g.strokeStyle = 'rgba(255,190,110,.75)'; g.lineWidth = 0.9; g.stroke(); }
    // the moth on top, raised, faint violet light in its lines
    el(g, 0, -67, 7, 2, 0, GL[1]);
    moth(g, 0, -71, 1.25, '#5e4f8c', '#e8e0ff');
    line(g, [[-5.5, -72.5], [-2.5, -70.6]], 'rgba(196,176,255,.55)', 0.6);
    // a glint of violet down the glass
    line(g, [[-1.6, -55], [-1.6, -14]], 'rgba(196,176,255,.22)', 0.8);
    g.restore();
  }
  if (has) {
    defineLook('n5a_post', { w: 44, h: 84, draw(g, x, y) { post(g, x, y, false); } });
    defineLook('n5a_post_lit', { w: 44, h: 84, draw(g, x, y) { post(g, x, y, true); },
      live(g, x, y, t) { glow(g, x + 12.5, y - 50, 26, '255,200,120', 0.55 + 0.1 * Math.sin(t * 6)); flame(g, x + 12.5, y - 48, t, 0.8); } });
  }

  // ---------- Sir Cindervane's helmet: real steel on a black glass rock, a red plume, one warm spark behind the visor
  if (has) defineLook('n5a_helmet', { w: 44, h: 40,
    draw(g, x, y) {
      shadow(g, x + 1, y, 16, 5);
      poly(g, [[x - 15, y], [x - 12, y - 9], [x - 3, y - 13], [x + 9, y - 12], [x + 15, y - 5], [x + 14, y]], GL[1], 1.4);
      poly(g, [[x - 12, y - 9], [x - 3, y - 13], [x + 1, y - 9], [x - 6, y - 5]], GL[2]);
      // the helmet: a steel dome, a cheek guard, the visor slit
      el(g, x, y - 20, 9.5, 9, 0, '#8e96a8', 1.4);
      poly(g, [[x - 9.5, y - 20], [x - 9, y - 13], [x + 9, y - 13], [x + 9.5, y - 20]], '#7a8296', 1.3);
      el(g, x - 3.4, y - 23.5, 3.2, 3.6, -0.4, 'rgba(255,255,255,.35)');
      g.fillStyle = '#1a1420'; g.fillRect(x - 7, y - 19.5, 14, 2.4);
      line(g, [[x, y - 29], [x, y - 13]], '#5e6678', 1);
      // the plume
      g.beginPath(); g.moveTo(x, y - 29); g.bezierCurveTo(x + 6, y - 37, x + 15, y - 34, x + 17, y - 26); g.bezierCurveTo(x + 12, y - 30, x + 6, y - 30, x + 1, y - 27); g.closePath();
      g.fillStyle = '#c8402a'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = OL; g.stroke();
      line(g, [[x + 3, y - 30], [x + 13, y - 30]], '#e8704a', 0.9);
    },
    live(g, x, y, t) { const a = 0.55 + 0.25 * Math.sin(t * 3.1); glow(g, x, y - 18, 10, '255,170,80', a * 0.7); g.fillStyle = `rgba(255,214,140,${a})`; g.fillRect(x - 2, y - 19.2, 4, 1.8); } });

  // ---------- Ember's flame stone by the Echo Gate: a standing slab of glass, three carved flame marks, a tiny moth by each
  function flameMark(g, cx, cy, k, col) {
    g.beginPath(); g.moveTo(cx, cy - 7 * k); g.quadraticCurveTo(cx + 4.6 * k, cy - 2 * k, cx, cy + 3 * k); g.quadraticCurveTo(cx - 4.6 * k, cy - 2 * k, cx, cy - 7 * k);
    g.strokeStyle = col; g.lineWidth = 1.5; g.stroke();
    line(g, [[cx, cy - 3 * k], [cx, cy + 1 * k]], col, 1);
  }
  if (has) defineLook('n5a_flame_stone', { w: 50, h: 76,
    draw(g, x, y) {
      shadow(g, x + 2, y, 18, 5);
      poly(g, [[x - 15, y], [x - 16, y - 46], [x - 11, y - 62], [x + 2, y - 69], [x + 12, y - 62], [x + 16, y - 44], [x + 15, y]], GL[1], 1.6);
      poly(g, [[x - 15, y], [x - 16, y - 46], [x - 11, y - 62], [x - 7, y - 60], [x - 10, y - 44], [x - 9, y]], GL[2]);
      poly(g, [[x + 15, y], [x + 16, y - 44], [x + 12, y - 62], [x + 9, y - 58], [x + 10, y]], GL[0]);
      // the three flame marks (ember, worn) and a pale moth by each, two moons on its wings
      for (let i = 0; i < 3; i++) { const cy = y - 52 + i * 17;
        flameMark(g, x - 3, cy, 1, 'rgba(255,160,80,.75)');
        moth(g, x + 7.5, cy - 1.5, 0.8, '#8a7cbc', '#f6f0ff'); }
      line(g, [[x - 12, y - 30], [x - 6, y - 26], [x - 9, y - 18]], 'rgba(255,140,70,.35)', 0.8);
    },
    live(g, x, y, t) { for (let i = 0; i < 3; i++) glow(g, x - 3, y - 54 + i * 17, 9, '255,150,70', 0.18 + 0.1 * Math.sin(t * 2 + i * 1.7)); } });

  // ---------- the Shadow Throne at the rim of the Echo 1 arena: a low dais, a seat and a tall jagged back of black glass
  if (has) defineLook('n5a_throne', { w: 120, h: 110,
    draw(g, x, y) {
      shadow(g, x, y - 2, 52, 11, 0.45);
      // the dais: two low steps
      el(g, x, y - 6, 50, 10, 0, GL[0]); el(g, x, y - 9, 48, 9, 0, GL[1], 1.2);
      el(g, x, y - 13, 36, 7, 0, GL[1]); el(g, x, y - 15, 34, 6.4, 0, GL[2], 1.1);
      // the back: jagged spires like a crown
      poly(g, [[x - 24, y - 22], [x - 30, y - 64], [x - 20, y - 52], [x - 15, y - 88], [x - 6, y - 64], [x, y - 100], [x + 6, y - 64], [x + 15, y - 88], [x + 20, y - 52], [x + 30, y - 64], [x + 24, y - 22]], GL[1], 1.6);
      poly(g, [[x - 24, y - 22], [x - 30, y - 64], [x - 20, y - 52], [x - 15, y - 88], [x - 12, y - 60], [x - 18, y - 24]], GL[2]);
      poly(g, [[x + 24, y - 22], [x + 30, y - 64], [x + 20, y - 52], [x + 15, y - 88], [x + 12, y - 62], [x + 17, y - 24]], GL[0]);
      // the seat and its arms
      poly(g, [[x - 20, y - 15], [x - 20, y - 30], [x + 20, y - 30], [x + 20, y - 15]], GL[1], 1.4);
      el(g, x, y - 30, 20, 5, 0, GL[2], 1.2);
      for (const s of [-1, 1]) { poly(g, [[x + s * 20, y - 15], [x + s * 26, y - 17], [x + s * 26, y - 36], [x + s * 20, y - 33]], GL[1], 1.2); }
      // violet rim light down the spires
      for (const [a, b] of [[[-15, -86], [-10, -62]], [[0, -97], [0, -66]], [[15, -86], [10, -62]]]) line(g, [[x + a[0], y + a[1]], [x + b[0], y + b[1]]], 'rgba(196,176,255,.55)', 1);
      line(g, [[x - 18, y - 31], [x + 18, y - 31]], 'rgba(196,176,255,.4)', 0.8);
    } });

  // ---------- a grey moth scale as big as a plate, lying at the foot of the empty throne (the red herring: Murmur)
  if (has) defineLook('n5a_grey_scale', { w: 44, h: 20,
    draw(g, x, y) {
      shadow(g, x, y, 17, 4, 0.3);
      g.save(); g.translate(x, y - 4); g.rotate(-0.18);
      g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-8, -9, 6, -7); g.quadraticCurveTo(18, -4, 17, 1); g.quadraticCurveTo(10, 6, -6, 5); g.quadraticCurveTo(-14, 4, -16, 0); g.closePath();
      g.fillStyle = '#9a96a6'; g.fill(); g.lineWidth = 1.3; g.strokeStyle = '#3a3448'; g.stroke();
      for (let i = 0; i < 5; i++) line(g, [[-10 + i * 5, -5 + i * 0.4], [-8 + i * 5, 4]], 'rgba(70,64,88,.45)', 0.8);
      el(g, 4, -2, 6, 2.2, 0.1, 'rgba(220,214,240,.5)');
      line(g, [[13, -2], [17, 1]], '#c8c0dc', 0.8);
      g.restore();
    },
    live(g, x, y, t) { const a = 0.18 + 0.14 * Math.sin(t * 1.6); g.fillStyle = `rgba(200,220,255,${a})`; g.beginPath(); g.ellipse(x + 3, y - 6, 7, 2, -0.2, 0, T2); g.fill(); } });

  // ---------- NYX: three old letters on the Midnight Clock's hub (the hub is 27 px above this anchor), seen once the
  // hands are off the twelve; silver engraving, laid flat
  if (has) defineLook('n5a_nyx', { w: 70, h: 52,
    draw(g, x, y) {
      const cx = x, cy = y - 27;
      el(g, cx, cy, 30, 18, 0, null, 1.4, 'rgba(196,176,255,.5)');
      g.save(); g.translate(cx, cy); g.scale(1, 0.62);
      g.font = '700 17px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const [ch, dx] of [['N', -15], ['Y', 0], ['X', 15]]) { g.fillStyle = 'rgba(10,6,18,.9)'; g.fillText(ch, dx + 1, 1.5); g.fillStyle = '#e8e0ff'; g.fillText(ch, dx, 0); }
      g.restore();
    },
    live(g, x, y, t) { const a = 0.22 + 0.16 * Math.sin(t * 2.2); glow(g, x, y - 27, 30, '210,200,255', a); } });

  // ---------- Vesper's moth mask, real silver-grey cloth and card, cracked down the middle, a note tucked under it
  if (has) defineLook('n5a_cracked_mask', { w: 40, h: 20,
    draw(g, x, y) {
      shadow(g, x, y, 15, 3.6, 0.3);
      // the note under it
      poly(g, [[x + 3, y - 1], [x + 15, y - 4], [x + 16, y + 1], [x + 4, y + 3]], '#e8dcc0', 1);
      line(g, [[x + 8, y - 0.6], [x + 12, y - 1.6]], '#5a4a3a', 0.8);
      // the mask: two wings with eye holes, a crack down the middle
      for (const s of [-1, 1]) {
        g.save(); g.translate(x + s * 0.8, y - 5); g.scale(s, 1);
        g.beginPath(); g.moveTo(0, -4); g.quadraticCurveTo(7, -9, 13, -6); g.quadraticCurveTo(14, 0, 9, 3); g.quadraticCurveTo(4, 4, 0, 2); g.closePath();
        g.fillStyle = '#b8b0c8'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#3a3448'; g.stroke();
        el(g, 6.5, -1.5, 2.6, 1.6, 0, '#1a1420');
        line(g, [[9, -6], [12, -4]], '#8a8098', 0.8);
        g.restore();
      }
      line(g, [[x, y - 10], [x + 1.4, y - 7], [x - 0.8, y - 5], [x + 1, y - 2.5], [x, y]], '#1a1420', 1.3);
    } });

  // ---------- Ember's paper lantern for the little moth, folded flat: cream paper, faded red rims, a grey moth painted
  if (has) defineLook('n5a_folded_lantern', { w: 40, h: 18,
    draw(g, x, y) {
      shadow(g, x, y, 15, 3.4, 0.3);
      g.save(); g.translate(x, y - 4); g.rotate(0.12);
      poly(g, [[-14, -4], [14, -5], [15, 3], [-13, 4]], '#f0e2c0', 1.2, '#5a3a2a');
      for (let i = -9; i <= 9; i += 4.5) line(g, [[i, -4.2], [i + 0.5, 3.6]], 'rgba(160,110,70,.5)', 0.7);
      g.fillStyle = '#c0503a'; g.fillRect(-14, -5.5, 28, 2); g.fillRect(-13, 3, 28, 1.8);
      moth(g, 2, -0.4, 0.62, '#7a7488', '#f4f0ff');
      g.restore();
    },
    live(g, x, y, t) { const a = 0.12 + 0.1 * Math.sin(t * 1.8); glow(g, x, y - 4, 20, '255,226,170', a); } });

  // ---------- Glaciar's scale: blue as deep ice, half in a little drift of snow, still cold
  if (has) defineLook('n5a_ice_scale', { w: 44, h: 28,
    draw(g, x, y) {
      shadow(g, x, y, 17, 4, 0.25);
      // the scale, standing up out of the drift at a slant
      g.save(); g.translate(x - 1, y - 6); g.rotate(-0.35);
      g.beginPath(); g.moveTo(0, -16); g.quadraticCurveTo(9, -8, 7, 4); g.quadraticCurveTo(0, 8, -7, 4); g.quadraticCurveTo(-9, -8, 0, -16); g.closePath();
      g.fillStyle = '#4a8ad8'; g.fill(); g.lineWidth = 1.3; g.strokeStyle = '#13284a'; g.stroke();
      g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(5, -6, 4, 2); g.quadraticCurveTo(0, 4, -3, 2); g.quadraticCurveTo(-4, -6, 0, -12); g.closePath(); g.fillStyle = '#8cc4ff'; g.fill();
      line(g, [[-1.5, -11], [-2.5, -3]], 'rgba(255,255,255,.8)', 1.2);
      g.restore();
      // the drift in front of it
      el(g, x, y - 2, 16, 5, 0, '#dce8f8', 1.1, '#6a7ea0'); el(g, x - 5, y - 4, 7, 3, 0, '#f4f8ff');
    },
    live(g, x, y, t) { for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1, a = Math.sin(k * Math.PI) * 0.8; g.fillStyle = `rgba(230,246,255,${a})`;
      const sx = x - 6 + i * 6, sy = y - 14 - k * 10; g.fillRect(sx - 0.6, sy - 2, 1.2, 4); g.fillRect(sx - 2, sy - 0.6, 4, 1.2); } } });

  // ---------- Vesper hanging by one hand from the edge of an island over the void (the second chance, n_clocks):
  // (x,y) is her hand on the edge; she hangs below it in her grey moth cloak, unmasked (the mask lies cracked on the cliff),
  // dark hair with one silver streak, freckles, two little horns, a thin tail, and a snapped silk line in her other hand
  function hang(g, x, y, t) {
    const sw = Math.sin(t * 2.2) * 0.08, fl = Math.sin(t * 5.3);
    g.save(); g.translate(x, y); g.rotate(sw);
    // the snapped silk line, fluttering from the free hand
    g.beginPath(); g.moveTo(6, 14); g.quadraticCurveTo(14 + fl * 3, 22, 10 + fl * 5, 34); g.strokeStyle = 'rgba(232,228,255,.85)'; g.lineWidth = 0.9; g.stroke();
    // the arm up to the edge, the hand on it
    line(g, [[-1, 12], [-1.5, 1]], OL, 4); line(g, [[-1, 12], [-1.5, 1]], '#7a6a92', 2.6); ci(g, -1.5, 0.5, 1.9, '#e6b896', 0.9);
    // the cloak: a grey moth cloak hanging straight down, two pale eye spots
    poly(g, [[-6, 12], [6, 12], [8, 30], [3, 33], [-3, 33], [-8, 30]], '#7a6a92', 1.4);
    poly(g, [[-6, 12], [-1, 12], [-3, 33], [-8, 30]], '#5e4e78');
    ci(g, -4.5, 25, 1.8, '#e0d8f0'); ci(g, 4.5, 25, 1.8, '#e0d8f0');
    // the free arm, holding the snapped line
    line(g, [[4, 14], [6, 14]], OL, 3.6); ci(g, 6.4, 14, 1.7, '#e6b896', 0.8);
    // legs dangling
    for (const [dx, ph] of [[-2.4, 0], [2.4, 1.6]]) { const s = Math.sin(t * 3 + ph) * 1.6; line(g, [[dx, 32], [dx + s, 41]], OL, 3.6); line(g, [[dx, 32], [dx + s, 41]], '#2a2436', 2.2); el(g, dx + s, 42, 2.2, 1.6, 0, '#4a3a2a', 0.8); }
    // the tail
    g.beginPath(); g.moveTo(1, 31); g.quadraticCurveTo(-8 + fl, 38, -6, 44); g.strokeStyle = OL; g.lineWidth = 2.4; g.stroke(); g.strokeStyle = '#6a5a7a'; g.lineWidth = 1.2; g.stroke();
    // the head: looking up at Ash, freckles, dark hair with the silver streak, little horns
    ci(g, 1, 9, 5.4, '#e6b896', 1.3);
    for (const [fx, fy] of [[-1.4, 10.4], [-0.2, 11], [3, 10.4], [1.8, 11]]) ci(g, 1 + fx - 1, fy, 0.45, '#b8785a');
    ci(g, -0.8, 8, 0.7, '#2a2034'); ci(g, 2.8, 8, 0.7, '#2a2034');
    g.beginPath(); g.arc(1, 8.2, 5.7, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(6, 8); g.quadraticCurveTo(1, 5.2, -4, 8); g.closePath(); g.fillStyle = '#2a2430'; g.fill(); g.lineWidth = 1; g.strokeStyle = OL; g.stroke();
    line(g, [[0, 2.8], [3.4, 6.4]], '#d8d4e8', 1.1);
    for (const s of [-1, 1]) poly(g, [[1 + s * 2.6, 3.6], [1 + s * 4.2, 0.4], [1 + s * 4, 3.8]], '#f0e6d0', 0.8);
    g.restore();
  }
  if (hasPose) definePose('c_vesper', 'hang', hang);
}
