# 🍍 Glopi's Crazy Delivery — Game Plan

A Crazy Taxi–style arcade delivery game. **Glopi**, a pineapple, delivers food for **Glovo** around **Barcelona** on a **bicycle**.

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | **JavaScript (ES6+)** | No build step needed for v1, huge community, fast iteration |
| Engine | **Phaser 3 (latest 3.90.x)** | Battle-tested 2D arcade engine: physics, tilemaps, tweens, particles, input, audio out of the box |
| Rendering | Canvas via Phaser, Pixel Art style | Zoomed-in, stylized look ≈ GTA1/2 top-down; cheap to produce, hides imperfections |
| Dev server | `serve` (or Phaser's vite template if we want HMR later) | Zero config |
| Assets | Hand-drawn pixel art, 32×32 tiles | Readable top-down city, tiny files |
| Audio | Web Audio (via Phaser sound). Freesound.org SFX + free music loops | No licensing headaches |
| Maps | **Tiled** (`.json` maps) with orthogonal tilesets | Industry standard for 2D top-down |
| Input | Keyboard (arrows/WASD), gamepad plugin optional | Crazy Taxi needs analog-ish steering feel |
| Testing | Manual + Phaser debug draws; Vitest for pure-logic classes later | Fast feedback without browser automation |
| Repo | Git + GitHub, conventional commits | Standard |

Notes:
- Keep gameplay logic (order generation, scoring, AI) in plain JS classes decoupled from Phaser scenes so it's unit-testable.
- If the project grows (3D camera, multiplayer), revisit Godot/Three.js — not for v1.

## 2. Core Gameplay (Crazy Taxi-style loop)

1. **Pick up an order**: colored zones flash over restaurants; drive there, press SPACE to accept (shows name, payout, countdown fare timer).
2. **Pickup**: arrow/beacon guides you to the restaurant; reach its green zone → bag strap animation, "¡Pedido recogido!"
3. **Delivery**: customer zone spawns (house front, park bench, etc.); reach it before the fare timer for a **tip multiplier**.
4. **Crazy bonuses**: near-misses with cars (+€), "CRAZY DRIFT" chains, running red lights (no cops, but cones/potholes slow you), shortcuts through plazas.
5. **Combo/Rank**: consecutive on-time deliveries raise your *Rider Rank* (Bronze→Glopi Legend) and spawn harder multi-stop orders (2–3 destinations, like Crazy Taxi's fare chain).

## 3. Barcelona flavor (v1 scope)

- Tilemap district ~**64×48 tiles** loosely based on the Eixample grid + a diagonal avenue (Avinguda Diagonal), a Rambla-like pedestrian street (no cars, must dismount/walk fast?), a beach strip at the bottom.
- Landmarks as sprite decorations (non-colliding): Sagrada Família silhouette, Torre Glòries, Arc de Triomf, palm trees.
- Traffic: cars & scooters following lanes on main streets, pedestrians on sidewalks (simple waypoint loops).
- Spanish/Catalan UI copy + voice-over gibberish ("¡Vamos!"), euro coins as pickup/drop sfx.

## 4. Controls

| Action | Key |
|---|---|
| Pedal / accelerate | `W` / `↑` |
| Brake / reverse | `S` / `↓` |
| Steer | `A`/`D` or `←`/`→` |
| Accept order / interact | `SPACE` |
| Bell (dodge pedestrians) | `SHIFT` |
| Pause | `ESC` |

Bike physics: acceleration, drift friction, slight wall bounce. No handbrake (bikes don't drift that hard 😄) — instead a **lean/draft mechanic** in v1.1.

## 5. Project Structure

```
glopi-crazy-delivery/
├── index.html
├── src/
│   ├── main.js            # Phaser.Game config + boot
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── MenuScene.js
│   │   ├── HUDScene.js    # overlay UI (oerlay scene)
│   │   └── GameScene.js   # gameplay
│   ├── systems/
│   │   ├── OrderSystem.js   (pure JS, unit-testable)
│   │   ├── TrafficSystem.js
│   │   ├── ScoreSystem.js
│   │   └── AudioSystem.js
│   ├── sprites/
│   │   ├── player.js
│   │   ├── car.js
│   │   └── customer.js
│   └── config.js
├── assets/
│   ├── tilemaps/barcelona.json
│   ├── tilesets/city.png
│   ├── sprites/ (glopi.png, cars, customers, fx)
│   └── audio/
├── PLAN.md
├── README.md
├── .gitignore
└── package.json
```

## 6. Milestones

### M0 — Setup & Walking Skeleton ✅ done
- [x] Git repo init, `.gitignore`, README, PLAN.md, remote linked to GitHub
- [x] `index.html` + Phaser 3.90 ESM via CDN (import map — no build step)
- [x] Boot/Preload/Menu scenes, title screen "GLOPI'S CRAZY DELIVERY"
- [x] Placeholder pineapple texture generated at runtime, WASD/arrow movement with camera follow and world bounds
- **Exit criteria**: I can move Glopi around a blank canvas from the menu. ✔

### M1 — City that Feels like Barcelona (art pass) ✅ done
- [x] City tileset — **generated programmatically** (25 tiles: asphalt, panot sidewalks, crosswalks, plaza, sand, water, grass, 4 roof palettes, fountain, palm, tree, lamp, bench) by `tools/gen-tileset.mjs` + `tools/gen-landmarks.mjs` on a zero-dep PNG writer. `npm run gen:art`
- [x] `barcelona.json` — Tiled-format map emitted by `tools/gen-map.mjs` (`npm run gen:map`): 64×48 grid, Eixample streets, pedestrian Rambla, carved Diagonal, boardwalk + sand + two-depth sea, crosswalks, collision tile properties, landmark object layer
- [x] Landmark sprites (Sagrada Família, Torre Glòries, Arc de Triomf) placed from the Tiled object layer
- **Exit criteria**: Glopi rides a readable Barcelona grid, can't pass through buildings. ✔ E2E-verified in-browser: map size 2048×1536, collides properties parsed, roof + sea blocking on a rect body, sidewalk gaps passable, 3 landmarks rendered.
> Note: Tiled GUI never installed — the map is generated deterministic-by-seed in the exact Tiled JSON format, so it can still be opened/edited in Tiled later if needed.

### M2 — Bike Arcade Physics ✅ done
- [x] Arcade Physics body + custom acceleration/friction curve — heading-based model: heading steers, velocity is re-projected onto the **post-steering** basis each frame so slip can accumulate (drift arcs), grip (per-second exp damping) eats lateral slip, drift bleeds forward speed. Throttle / brake / reverse capped at -90px/s, coast drag, all per-second units in `VEHICLE` (`src/config.js`)
- [x] Drift feel testing, camera follow with lookahead + slight zoom out at speed — E2E: mid-turn velocity lags heading, slip accumulates outward (−31→−59px/s), grip kills it after release; camera offset = velocity×lookahead, zoom 1→0.9 at top speed
- [x] Wall collision response (bounce + spark particle) — collider callback reflects toggle vel×restitution 0.35 along the blocked normal, realigns heading to outgoing velocity, bursts 8 gold sparks + micro shake, cooldown 220ms. E2E-verified: (0,−170)→(0,+124), heading→+1.57 (south), sparksAlive=8
- [x] Debug overlay (`H`): body outline + velocity/heading arrows + live vel/fwd/lat/heading/zoom readout for tuning
- **Exit criteria**: Steering feels fun within 10 seconds of play; a designer could tune constants. ✔ E2E-verified: pedal 1s→300px/s cap, coast 0.67s→227, slip drifts, brake-to-stop→reverse cap, H overlay live.

### M3 — Orders Core Loop ✅ done
- [x] `OrderSystem`: order generate → pickup zone → dropoff zone → complete/expire — plain JS (no Phaser imports, node-verified transitions), distance-scaled fare (€6 + €0.9/tile), window = 10s + 0.55s/tile, tip = fare×2×(timeLeft/total), events `spawned/accepted/delivered/expired`, respawn 1.6s
- [x] Zone rendering: pulsing colored circles + floating markers/beacons — gold ring at restaurant / pink at customer w/ name+note labels, cyan beacon arrow bobbing above Glopi (pure vertex math), color flips by food state, floating popups ("¡Recogido!", "+€62 (+€23 propina!)", "¡Pedido perdido!")
- [x] HUD: current order card, fare €, fare timer, mini arrow, first SFX — HUDScene overlay (top-left card: tag/name/dish/€+meters + color-tiered timer bar; top-right €totals), generated SFX via zero-dep WAV writer (`tools/gen-sfx.mjs`: coin/blip/fail), muted-safe playSfx wrapper
- **Exit criteria**: Full loop playable: accept → pickup → deliver → pay+tip, next order spawns. ✔ E2E-verified: offered→SPACE.PERFECT accept (radius 44)→timer ticks (30→28s)→auto-deliver in drop zone (€39+€23 tip = €62·1 entrega)→respawn (new order id) + expire path (no earnings, respawn countdown); places filter rejects collider tiles (beach grill relocated rows 44-47 are sea).

### M4 — Traffic & Pedestrians ✅ done
- [x] Cars/scooters on lane waypoints, player collision = slow down + coin penalty — `TrafficSystem` (pure JS, node-verified): right-hand two-way lanes on the street grid (H rows 2-38 / V cols 2-62, Rambla excluded), 8 cars + 5 swaying scooters, edge wrap; immovable arcade bodies synced from the system; hit = soft bounce + vel×0.55 + −€5 + "−€5 ¡AY!" popup + sparks + shake (500ms cooldown). Landmark bases got their promised collision zones (sagrada/glòries/arc, invisible static rects)
- [x] Pedestrians on sidewalks; bell scatters them — 14 peds on block-ring sidewalk lines + boardwalk + Rambla; bump/bell = burst away + stun 0.7s + panic spin + tint flash, re-bumpable after stun; SHIFT ring (130px) = scatter all + "¡DING!" + generated bell.wav (G6→C7)
- [x] Near-miss detector (+€ floating text "CASI!!") — within 52px while riding (>120px/s) with ≥190px/s closing speed; per-car 900ms cooldown; +€2, "¡CASI! +€2" gold popup, coin sfx
- [x] Stop-to-act rework (user change): pickup AND delivery both trigger by fully stopping inside the zone (SPACE accept removed) — 22px/s stop gate + 0.65s dwell, white progress arc fills the ring while braking, HUD hint "FRENA EN EL CÍRCULO"; E2E: sustained roll (≥73px/s) never accepts, 0.2s partial dwell never accepts, held stop accepts ("¡Recogido!"), stopped delivery pays (+€123 incl. tip)
- **Exit criteria**: Navigating traffic feels risky but fair; near-misses are readable. ✔ E2E-verified: lane invariants + deterministic travel (browser F-steps: move ≈ speed·dt along lane.dir, wrap at hi+margin), car hit (earnings 44→39, popup, cooldown, no repeat), landmark zones stop the bike at predicted rebound (minY 1222 / predicted 1222), ped bump (stun + scatter + "¡AY!", earnings untouched), SHIFT bell (staged ped stunned + "¡DING!"), staged head-on pass (relV≥190) → exactly +€2 one time, zero console errors.

### M5 — Score, Combos & Rank… and Session Timer ✅ done
- [x] ScoreSystem: base fare + time bonus + near-miss streak multiplier — `ScoreSystem` (pure JS, node-verified) is the single wallet: near-misses chain within a 5s window into x1 → x1.5 → … → x3 (capped) bonuses on the same €2 base, delivery pay lands here (`score.deliver`), crash = instant chain break + −€5 floored at €0; HUD stats line reads the wallet (`€214 · 2 entregas · racha x2`)
- [x] Tip tiers (Green/Yellow/Orange/Red zone like Crazy Taxi) — pure `tipTier()` mapping (≥55%/1.0, ≥30%/0.6, ≥12%/0.3, <12%/0.1 of `fare×tipMax`), delivery popups `+€132 · ¡RÁPIDO!` in tier color, HUD tag shows the live tier word + tier-colored time bar
- [x] 3-min shift timer, results screen (rank, best combo, money) — `shiftEnd` event (fires exactly once), input-hands-off freeze (bike coasts while traffic keeps rolling behind), `ResultsScene` card: rank letter S/A/B/C/D (score = entregas×3 + racha×2 + €/25), totals, prompt for a new shift via SPACE; best shift persisted to localStorage (`glopi-best`), "¡NUEVO RÉCORD!" and guard against worse runs overwriting
- **Exit criteria**: One full 3-minute round with end screen, rank persistence via localStorage. ✔ E2E-verified: 2 deliveries (€201) → forced shift end → Results card grade C + snapshot (EUR 201/2/mejor racha x0) + stored; SPACE restart → fresh €0 shift, Results stopped, best kept; empty D-grade run did NOT overwrite €201; node: single shiftEnd fire, snapshot fields, all grade thresholds (D/C/B/A/S); zero console errors.

### M6 — Polish & Juice ✅ done
- [x] Screen shake on collisions, speed lines, wheelie trick on jumps — car hits now shake 150ms/0.009; wind streaks sweep past the bike above 215 px/s (phase-driven, speed-scaled alpha/length); take-off hop: a hard pedal kick (>28 px/s per 0.18s window) lifts the front with a Back-eased wobble on a 0.95s cooldown; drift |lateral| ≥ 75 px/s leaves fading wheel skid marks (`E2E`: hop max tilt 1.0 twice over a sprint, streak frac 0.74 at 300 px/s, 48 marks that fade fully in 3.2s, crash shake effect 150ms registered)
- [x] Music loop + dynamic layers (calm→chaos with active order) — zero-dep `tools/gen-music.mjs` writes two 9.06s seamless 106 BPM chiptune loops (modulo-wrapped tail notes, edge-jump 0.001 = click-free); GameScene plays both looping and crossfades per MUSIC config: chaos ramps to 0.61 with an active order/streak, falls to 0 calm, fully out when the shift ends; music stops on scene shutdown
- [x] Tweened coin popup, ragdoll pineapple on crash (fun > realistic) — `floatText` now Back.easeOut-pops from 0.4× (overshoot measured 1.06 → settles exactly 1.0), paydays render bigger at 23px; car crash launches a ragdoll tumble: spin up to ~7 rad decaying quadratically over 0.52s plus scale squash, held together with a 0.42s input blackout (daze: hold-W velocity stays 0 during, 142 after); writes live on the Systems `preRender` event so arcade's late game-object sync can't stomp them
- [x] Gamepad support — `input.gamepad: true`; `readGamepad()` maps left-stick steering (0.14 deadzone), A pedal, B brake, X bell (edge-detected, holds are consumed); keyboard wins when pressed, pad fills the gaps; any pad button starts from Menu or the Results card
- **Exit criteria**: Playtesters say "one more run". ✔ (code-level) E2E-verified: all four bullets above across 4 commits, zero console errors throughout.

### M7 — Beta & Release
- [x] Difficulty tiers (Chill / Rush hour / Monsoon of pedals) — pure `src/data/difficulties.js` packs merged onto the base config blocks at GameScene create (`{ ...TRAFFIC, ...d.traffic }`): chill 6 cars+3 scooters, slow speeds, hitPenalty 4, ×1.25 order time, 10 peds; rush = base; monsoon 12+7 fast, penalty 6, ×0.82, 20 peds. Selector row on the menu (◀ ▶ keys or click; 300ms debounce so the start-on-click can't misfire), persisted in `glopi-diff`, and `resolveDifficulty()` falls back scene-data → storage → rush so Results restarts keep the tier. E2E: menu cycles rush→monsoon→chill with storage write; chill run shows 6 cars/3 scooters/10 peds, hitPenalty 4, order clock 13s base + 0.6875s/tile (formula match to the cent); restart-from-Results keeps tier; zero console errors
- [x] Spanish + Catalan + English i18n of UI — flat `src/i18n.js` dictionaries with `t(key, params)` ES-fallback; L key or top-right row cycles live on the menu (all texts re-render, stored in `glopi-lang`); menu, HUD card (RECOGER/ENTREGA·tier word, TURNO clock, entregas/racha), all popups, tier words (¡RÁPIDO!/RAPIDÍSSIM!/FAST!), results card, hint bar and difficulty labels localized; flavor content (dishes, notes) stays Barcelona-mixed by design. E2E: cycled CA↔EN↔ES on the menu with storage persistence; ran full shifts in ES, EN and CA — HUD, pickups, paydays (+€132 · ¡RÁPIDO!/RAPIDÍSSIM!/FAST!) and results card all rendered per language; zero console errors. (`serve.json` forces `no-cache, must-revalidate` so dev reloads always revalidate modules)
- [x] Export web build (GitHub Pages) — `node tools/build.mjs` assembles `dist/`: landing page (hero + screenshots) at `/`, the whole game at `/juego/` (relative paths, still zero-dep CDN import map), `promo/` media. Shipped as a parentless `gh-pages` commit; live at <https://mariodod.github.io/glopi-crazy-delivery/>. Screenshots + gameplay GIF sit in `promo/` (PNGs via `preserveDrawingBuffer` canvas capture; GIF via `tools/gif-encoder.js` — in-browser 3-3-2 quantize + LZW GIF89a encoder, 34 frames @480×320, verified by re-decoding in `tools/verify-gif.mjs`). E2E on the live site: menu → start → order accepted, zero console errors
- **Exit criteria**: Public page with screenshots + short gameplay GIF. ✔ <https://mariodod.github.io/glopi-crazy-delivery/> serves the landing with `promo/gameplay.gif` (660KB, ~3s loop) + 5 screenshots, and the game runs from the `/juego/` page.

### M8 — v1.1: chains, Rider Rank, touch & system buttons ✅ done
- [x] Multi-stop order chains (Crazy Taxi fare chain, §2.5 promise) — `OrderSystem` builds 1–3 chained stops per offer (35% → 2nd, conditional 50% → 3rd; each leg takes the farthest of 4 sampled spots so no 2-tile hops). The offering card teases the FULL chain fare; every delivered stop pays its own fare+tip on the spot and re-arms a fresh clock for the next leg; mid-chain expiry keeps the paid legs and kills the rest. Events `legDone`/`chainDone`; `¡SIGUIENTE PARADA!` cue + `¡CADENA COMPLETA! +€n` celebration popup (i18n'd ×3). HUD card shows `PARADA i/n` on the active fare line. Config: `ORDER.chain2Chance/chain3Chance` — every difficulty tier inherits them via the M7 merge. E2E headless (33 asserts: chain shape, per-leg clock rest, flat `o.customer` advance, mid-chain expiry, next-stop range gating) + in-browser: 3-leg chain accepted at El Rincón del Huevo Frito → Laia → Núria → Santi, per-leg pays €150/€147/€132 (fare + full-time tip to the cent), wallet €429, `chainDone` fired once, mid-chain loss drill clean; zero console errors
- [x] Rider Rank (Bronze→Glopi Legend, §2.5 promise) — `src/data/career.js`: lifetime `{shifts, deliveries, money}` in `glopi-career` (storage-guarded). Ladder by lifetime DELIVERIES (crash-money noise can't gate it): NOVATO/JUNIOR/SENIOR/EXPERTO/GURÚ GLOPI/LEYENDA GLOPI at 0/10/30/60/100/150. Menu badge top-left (hidden on fresh profiles), results card line: steady state cyan `CARRERA: …`, promotion = gold `¡SUBISTE A RANGO …!`. E2E: fresh profile shows nothing → one quick shift wrote `{shifts:1,deliveries:1,money:126}` and NOVATO badge; seeded 149 delivered → gold **LEYENDA GLOPI** promotion line, menu badge `RANGO: LEYENDA GLOPI · 150 entregas`; zero console errors
- [x] Touch controls for phones + mute/fullscreen — endless-zones scheme: `src/systems/TouchControls.js` pure state machine fed by the HUD every frame from the live Phaser pointers (`isDown` + `position`, multi-touch, finger may drag across zones). Zones `◀ ▶` bottom-left, `BRAKE/PEDAL` `(FRENO/PEDAL)` bottom-right, i18n'd, hidden until `pointer: coarse` or the first real touch. GameScene input merge: keyboard > gamepad > touch, so desktop is untouched. Mute = `glopi-mute` pref applied to the Phaser master mute at boot + 🔊/🔇 button on menu & HUD; ⛶ fullscreen button on both (guarded API). E2E headless (16 asserts: steering parity, zone drags, edge clamps, release) + in-browser: injected Phaser pointers made the bike steer right while pedaling at 300px/s, switch hands mid-ride to the brake (304→90px/s), hold a −5 rad left turn under brake; buttons toggle storage, the 🔇 icon and `sound.mute` (settled read); desktop mouse-only session never shows zones; zero console errors
- [x] Release pass — rebuilt `dist/` via `node tools/build.mjs` (career.js/settings.js/TouchControls.js included), redeployed the orphan `gh-pages` commit; landing version stamp `v1.1 · M8 · Phaser 3.90`
- **Exit criteria**: playable with thumbs, mute + fullscreen you can find without reading docs, a visible long-term goal. ✔ E2E-verified across 4 commits, zero console errors throughout.

## 7. Risks & Anti-Goals

**Risks**
- Tilemap/collision tuning eats time → lock the map size early, iterate art, not layout.
- Bike drift may feel mushy → tune with a debug overlay showing velocity vectors.
- Scope creep (3D, real Barcelona OSM import) — banned for v1.

**Anti-goals (v1)**
- No real brand art issues (Glovo is referenced as parody; keep it tasteful).
- No backend/accounts, no multiplayer, no procedural city.

## 8. Payment of Effort (rough)

| Milestone | Effort |
|---|---|
| M0 Setup + skeleton | 0.5 day |
| M1 Barcelona map | 1–2 days |
| M2 Bike physics | 1 day |
| M3 Order loop | 2–3 days |
| M4 Traffic | 2 days |
| M5 Score/timer | 1 day |
| M6 Juice | 2 days |
| M7 Beta release | 1 day |
| M8 v1.1 (chains, rank, touch) | 1 day |
| **Total** | **~2–3 weeks part-time** |
