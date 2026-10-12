# Emberblood

A top-down, open-world action game you play in the browser. No install, no downloads.

**Play it:** https://muellercodes.github.io/emberblood/

## The story

A thousand years ago the dragon Vorlaxis, the First Flame, ruled the valley of Embermere. His daughter Ember loved the valley more than she feared him, so she joined five ordinary people (Iska, Bram, Oriel, Sedge and Tove) and together they split his fire in two. Half put him to sleep under Cinder Mountain. Half went into Ember, and it has passed down her family ever since. That family is the Emberbloods, and the five Ward-fires that keep the binding strong only relight with Emberblood fire.

You play Ash, the newest Emberblood: village lantern-lighter, part-time chimney sweep, and the first in a thousand years born with horns, a tail and real fire. It's the thousandth Lantern Day, the night the binding runs out. Kobolds just crashed the festival, somebody left the north gate open for them, and a cult called the Scaled Oath is snuffing the Wards so your great-great-great-great-great-great-great-great-great-great-great-great-great-grandfather wakes up strong and takes his fire back from you.

- **Story Mode**: a 14,000 × 11,000 valley with seven regions, seven bosses and five Wards to relight. Seven towns and hamlets with about 45 houses you can walk into, each full of things to poke at. Seven caves to explore (with puzzles, treasure and lost pages). A cast of named villagers whose stories tie into each other across the map, 13 side quests, a dozen cross-valley errands, ten lost pages of the Wardens' Account to collect, shops, fishing, hats, a talking tree with riddles, a baby dragon named Pip and a goat with opinions.
- **Choices matter**: what you do with the High Priest, the lamp-maker who betrayed the village, the great wolf and the knight at the gate changes who helps you in the last fight and how the epilogue plays out. There are four endings, and one of them only opens up if you've been kind and paid attention to the old pages.
- **Normal Mode**: endless waves in the Proving Grounds, with a leaderboard.

## Controls

| Keyboard and mouse | |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sprint |
| Left click / J | Sword (hold for a 3-hit combo) |
| Right click / K | Fire breath (also lights lanterns and Wards) |
| Space | Dodge roll |
| Q | Dragon Roar |
| R | Healing draught |
| E | Talk, open, rest |
| M / Tab | Map, journal and fast travel |

Touch controls appear automatically on phones and tablets.

## Accounts and cloud saves

Saves always live in your browser. If you make an account, your story also syncs to the cloud so you can pick it up on another device, and your Normal Mode best goes on the leaderboard.

The backend is a tiny [Cloudflare Worker](worker/src/index.js) with a [D1](https://developers.cloudflare.com/d1/) (SQLite) database. It fits in Cloudflare's free tier and, unlike some free databases, it doesn't pause or get deleted when nobody plays for a while. Passwords are hashed with PBKDF2-SHA256, sessions are random tokens stored only as hashes, and there's no email or personal info.

## Project layout

```
game/src/      game code, split into modules (concatenated in order by build.mjs)
game/*.html    page markup and styles
build.mjs      builds docs/index.html
docs/          the published site (GitHub Pages serves this folder)
worker/        Cloudflare Worker API + D1 schema
```

## Building

```bash
node build.mjs                       # uses game/config.json for the API address
API_BASE=http://127.0.0.1:8787 node build.mjs   # point at a local worker
```

Then open `docs/index.html`, or serve the folder (`npx serve docs`).

## Running the backend yourself

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create emberblood        # copy the database_id into wrangler.toml
npx wrangler d1 execute emberblood --remote --file=schema.sql
npx wrangler deploy
```

Put the `*.workers.dev` URL it prints into `game/config.json`, rebuild, and push. The live game uses `https://emberblood-api.muellercodes.workers.dev`. Allowed browser origins are set by `ALLOWED_ORIGINS` in `wrangler.toml` (localhost is always allowed for testing).

## License

MIT. See [LICENSE](LICENSE).
