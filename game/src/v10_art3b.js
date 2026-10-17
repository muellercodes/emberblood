// ================= v10_art3b: art for A3b's Act III story data (f_dreadgate, f_glaciar). Art only: this file calls
// defineLook and nothing else. (x,y) is each look's anchor (its place's spot); `state` is the place's world state.
//   chain_glow   the light on one of Glaciar's four Chain Stones when Ash calls her by her name (state 'on'); a
//                stone whose chain x2_foes has melted goes dark again
//   hush_rise    Hush unfolding off the mountainside by the Drum Stone (state 'unfold'; nothing otherwise)
//   hush_small   the tiny Hush after the fight, in the snow on the plaza (states 'fallen', 'scarf', 'away')
// The moth is drawn like Hush's portrait (e7b_threads' thrFaceMoth) for the big one, and as a few strokes for the tiny
// one. These looks are anim (drawn every frame) but draw nothing at all in their resting state.
// No em dash anywhere. Everything here is block scoped so no name can clash with another module.
{
  const T2 = Math.PI * 2, OL = '#1a1030';
  const has = typeof defineLook === 'function';
  const el = (g, x, y, rx, ry, rot, fill, lw) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, T2); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } };
  const glow = (g, x, y, r, rgb, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  // the time since a look's state last changed (each look keeps its own memory, by anchor)
  const MEM = {};
  // a real clock: the game's own time may stand still while a scene is on screen, and these looks move in scenes
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  const since = (key, state, t) => { const m = MEM[key]; if (!m || m.st !== state) { MEM[key] = { st: state, t0: t, prev: m ? m.st : null, scarf: !!(m && (m.st === 'scarf' || m.scarf)) }; return 0; } return t - m.t0; };

  // ---------- the big Hush: the portrait moth, drawn once into a 240 x 220 canvas (centre 120, 120)
  let BIG = null;
  const bigMoth = () => {
    if (BIG) return BIG;
    const c = typeof mkCanvas === 'function' ? mkCanvas(240, 220) : null; if (!c) return null;
    const g = c.getContext('2d'); g.translate(120, 120);
    try {
      if (typeof thrFaceMoth === 'function') thrFaceMoth(g, { wing: '#f4f2fa', wing2: '#d4d0e6', eye: '#b890f0', iris: '#6a3ac8', fur: '#ffffff', fur2: '#e8e4f6', eyes: '#3a2a5a', ant: '#f0ecff' });
      else throw new Error('no moth');
    } catch (e) {
      for (const s of [-1, 1]) { el(g, s * 50, -20, 50, 34, s * 0.4, '#f4f2fa', 3); el(g, s * 60, -24, 12, 12, 0, '#b890f0'); }
      el(g, 0, 6, 22, 36, 0, '#ffffff', 3);
    }
    return (BIG = c);
  };

  // ---------- the tiny Hush, as small strokes (local frame: body at 0,0, about 30 px across)
  function tinyMoth(g, x, y, t, o) {
    const flap = o.fly ? Math.sin(t * 26) : 0.25 + Math.sin(t * 3) * 0.08, shiv = o.shiver ? Math.sin(t * 40) * 0.8 : 0;
    g.save(); g.translate(x + shiv, y); g.scale(o.k || 1, o.k || 1);
    g.lineJoin = 'round';
    for (const s of [-1, 1]) {
      const w = 0.55 + flap * 0.45;
      g.beginPath(); g.moveTo(0, -2); g.bezierCurveTo(s * 6, -14 * w, s * 17, -15 * w, s * 16, -3 * w); g.bezierCurveTo(s * 13, 2, s * 6, 2, 0, 0); g.closePath();
      g.fillStyle = '#f6f2fc'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = OL; g.stroke();
      el(g, s * 10, -7 * w, 2.4, 2.2 * Math.max(0.4, w), 0, '#a880ec');
      el(g, s * 10, -7 * w, 1.1, 1.1 * Math.max(0.4, w), 0, '#5a32b4');
    }
    el(g, 0, -1, 2.6, 5.2, 0, '#ffffff', 1.3);
    g.strokeStyle = '#d8d0ee'; g.lineWidth = 1; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.8, -5.5); g.quadraticCurveTo(s * 3, -11, s * 5.5, -12); g.stroke(); }
    if (o.scarf) {
      // Ylva's long red scarf, wound round twice, one end trailing in the wind
      g.lineCap = 'round'; g.strokeStyle = '#8a1e1a'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-3, -2); g.lineTo(3, -2); g.stroke();
      g.strokeStyle = '#d8423a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-3, -2); g.lineTo(3, -2); g.moveTo(-3, 0.6); g.lineTo(3, 0.6); g.stroke();
      const wv = Math.sin(t * 6) * 2;
      g.strokeStyle = '#8a1e1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(2.5, -1); g.quadraticCurveTo(8, 2 + wv, 14, 1 - wv); g.stroke();
      g.strokeStyle = '#d8423a'; g.lineWidth = 2; g.stroke();
    }
    g.restore();
  }

  if (has) {
    // ---------- chain_glow: a pale violet-blue column of light on a Chain Stone, pulsing, with motes rising
    defineLook('chain_glow', { w: 80, h: 160, anim: true, draw(g, x, y, t0, state) {
      if (state !== 'on') return; const t = now();
      try { const S = F2G && F2G.stones; if (S) for (const s of S) if (Math.hypot(s.x - x, s.y - y) < 70 && s.done) return; } catch (e) {}
      const p = 0.75 + 0.25 * Math.sin(t * 3.2 + x * 0.01);
      g.save();
      glow(g, x, y - 46, 80 * p, '200,225,255', 0.55);
      const gr = g.createLinearGradient(x, y, x, y - 150); gr.addColorStop(0, `rgba(225,215,255,${0.55 * p})`); gr.addColorStop(1, 'rgba(225,215,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x - 6, y - 150); g.lineTo(x + 6, y - 150); g.lineTo(x + 16, y); g.closePath(); g.fill();
      g.strokeStyle = `rgba(240,232,255,${0.8 * p})`; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, 30 + 4 * Math.sin(t * 3), 12, 0, 0, T2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 6; i++) { const u = ((t * 0.5 + i / 6) % 1), mx = x + Math.sin(i * 2.3 + t) * 12, my = y - u * 130; g.globalAlpha = (1 - u) * p; g.fillRect(mx - 1.5, my - 1.5, 3, 3); }
      g.restore();
    } });

    // ---------- glaciar_coil: Glaciar under the spell, coiled round the black ice spike, drawn by x2_story's own
    // f2sDrawGlac (violet eyes and her chains); state blink: her eyes go blue for a moment. Nothing while the fight's
    // own figure is out, or once the fight has an outcome (x2_story draws her awake or asleep then).
    defineLook('glaciar_coil', { w: 600, h: 440, anim: true, draw(g, x, y, t0, state) {
      const t = now();
      try {
        if (typeof f2sDrawGlac !== 'function') return;
        if (G.choices && G.choices.f_glaciar) return;
        if ((G.enemies || []).some(e => !e.dead && e.type === 'f_glaciar')) return;
        const s = since('coil', state, t);
        f2sDrawGlac(state === 'blink' && s < 0.9 ? 'awake' : 'spell');
        // after the blink, her four chains light up, bright as lamps (x2_story's own chain paths: coil point to stone)
        if (state === 'blink' && s >= 0.9 && typeof f2sGlacPts === 'function' && typeof F2S_STONES !== 'undefined') {
          const P = f2sGlacPts(), X = F2SP.crown.x, Y = F2SP.crown.y;
          for (let i = 0; i < 4; i++) {
            if ((G.flags.f_chains | 0) > i) continue;
            const L = F2S_STONES[i], q = P[16 + i * 10], p = 0.65 + 0.35 * Math.sin(t * 4 + i * 1.7);
            g.save(); g.lineCap = 'round';
            g.beginPath(); g.moveTo(X + q.x, Y + q.y); g.lineTo(L.x, L.y - 30);
            g.strokeStyle = `rgba(160,215,255,${0.42 * p})`; g.lineWidth = 28; g.stroke();
            g.strokeStyle = `rgba(200,235,255,${0.7 * p})`; g.lineWidth = 11; g.stroke();
            g.strokeStyle = `rgba(255,255,255,${0.95 * p})`; g.lineWidth = 4; g.stroke();
            g.restore();
            glow(g, L.x, L.y - 30, 46 * p, '210,235,255', 0.5);
          }
        }
      } catch (e) {}
    } });

    // ---------- hush_rise: the barn-sized moth unfolding off the mountain, high above the drum
    defineLook('hush_rise', { w: 360, h: 340, anim: true, draw(g, x, y, t0, state) {
      const t = now();
      if (state !== 'unfold') { since('rise', state, t); return; }
      const u = Math.min(1, since('rise', state, t) / 1.8), k = (0.35 + 0.95 * u) * (1 + 0.06 * Math.sin(t * 2.2));
      const sp = bigMoth(); if (!sp) return;
      const hy = y - 150 - 20 * u + Math.sin(t * 1.6) * 6;
      g.save(); g.globalAlpha = 0.22 * u; el(g, x, y, 90 * k, 26 * k, 0, '#1a1430'); g.restore();
      glow(g, x, hy, 150 * k, '225,215,255', 0.22 * u);
      g.save(); g.globalAlpha = Math.min(1, u * 1.6); g.translate(x, hy); g.scale(k, k * (0.8 + 0.2 * u)); g.drawImage(sp, -120, -120); g.restore();
    } });

    // ---------- hush_small: the tiny moth after the fight
    defineLook('hush_small', { w: 80, h: 220, anim: true, draw(g, x, y, t0, state) {
      const t = now();
      const s = since('small', state, t);
      if (state === 'fallen' || state === 'scarf') {
        g.save(); g.globalAlpha = 0.25; el(g, x, y + 2, 12, 4, 0, '#1a1430'); g.restore();
        if (state === 'scarf') glow(g, x, y - 10, 26, '255,190,150', 0.25);
        tinyMoth(g, x, y - 10, t, { shiver: state === 'fallen', scarf: state === 'scarf', k: 1.6 });
        return;
      }
      if (state === 'away') {
        const u = Math.min(1, s / 3.2); if (u >= 1) return;
        g.save(); g.globalAlpha = 1 - u * u;
        // (the scarf stays on her as she flies away: since() remembers the state before)
        tinyMoth(g, x + u * 70 + Math.sin(s * 5) * 6, y - 8 - u * 190, t, { fly: true, scarf: !!(MEM.small && MEM.small.scarf), k: 1.6 - u * 0.7 });
        g.restore();
        return;
      }
    } });
  }
}
