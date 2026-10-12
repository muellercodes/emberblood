// Builds the single-file game into docs/index.html (served by GitHub Pages).
// Usage: node build.mjs            (uses game/config.json)
//        API_BASE=https://... node build.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ORDER = ['a1_core','a1b_data','a1c_state','a1k_simple','a1d_story','a1e_people','a1f_qdata','a1g_talk','a1h_quests2','a1i_quests3','a1j_quests4','a1l_story2','a2_world','a2b_cols','a2c_build','a2d_places','a2e_interiors','a2f_caves','a2g_floors','a2h_dungeons','a2i_reach','a3_art','a3b_art2','a3c_art3','a3d_art4','a3e_toy3d','a4_ground','a5_input','a5b_pad','a6_player','a6b_weapons','a6c_moves',
  'a7a_enemies','a7b_ai','a7c_bosses','a8_systems','a9a_env','a9b_flow','a9c_story','a9d_quests','a9e_meta','a9f_talk','a9g_mini','a9h_skills','a9i_comps','a9j_events','a10a_fx','a10b_chars','a10c_t3ash','a10d_t3people','a10e_t3beasts','a10f_t3foes','a10g_t3bosses','a11_render','a11c_depth','a11b_hud','a12a_dlg','a13_cloud','a14_music','a12c_log','a12b_ui'];
const cfg = JSON.parse(readFileSync('game/config.json', 'utf8'));
const api = process.env.API_BASE || cfg.apiBase || '';
// simple-words text (game/simple/*.json) is baked in right before the module that reads it
const simple = {};
for (const f of (existsSync('game/simple') ? readdirSync('game/simple') : []).filter((n) => n.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(`game/simple/${f}`, 'utf8'));
  for (const [k, v] of Object.entries(d)) if (!k.startsWith('_')) simple[k] = v;
}
const simpleJs = `const SIMPLE_DATA=${JSON.stringify(simple)};\n`;
const js = ORDER.map((f) => (f === 'a1k_simple' ? simpleJs : '') + readFileSync(`game/src/${f}.js`, 'utf8')).join('').replaceAll('__API_BASE__', api);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/game.js', js);
execFileSync(process.execPath, ['--check', 'dist/game.js'], { stdio: 'inherit' });

const head = readFileSync('game/head.html', 'utf8');
const body = readFileSync('game/body.html', 'utf8');
const cut = body.indexOf('</style>') + '</style>'.length;
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Emberblood: a top-down open-world action game. Ash, the last Emberblood, has to relight five Ward-fires and face a very old grandfather.">
<meta name="theme-color" content="#0b0607">
<meta property="og:title" content="Emberblood">
<meta property="og:description" content="Relight the Wards. Face your great ×13 grandfather.">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
${head}${body.slice(0, cut)}
</head>
<body>
${body.slice(cut)}
<script>
${js}
</script>
</body>
</html>
`;
mkdirSync('docs', { recursive: true });
writeFileSync('docs/index.html', page);
// artifact flavor: no document wrapper (the host adds one)
writeFileSync('dist/artifact.html', `${head}${body}\n<script>\n${js}\n</script>\n`);
console.log(`built docs/index.html (${(page.length / 1024).toFixed(0)} KB) with API ${api.startsWith('http') ? api : '(offline)'}`);
