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

### M9 — code health pass (post-v1.1 audit) ✅ done
- [x] End-of-shift bug hunt — `GameScene.shiftOver` was read in three places but never assigned, so after the results card appeared the offer spawner kept ticking underneath (a phantom order every `respawnDelay`) and the pedals stayed live behind the overlay. Now `create()` initializes it and `endShift()` sets it. ESC while the results card was up also left a sticky `Results` overlay floating over the menu (and its SPACE handler double-firing scene starts) — the ESC handler now stops `Results` alongside `HUD`. E2E: pedal held 250 frames after shift end = speed 0, order stays `null` past the respawn window, ESC returns to a clean `Menu` only, fresh shift restarts normal; zero console errors
- [x] Dead code & unused exports removed — `juiceState` debug snapshot (never read), `drawn` counter in the streak drawer, duplicate hop-arc formula in `update()` (now single-sourced from `updateJuice()`), redundant `createPlaceholderTextures` call in GameScene (Preload always creates them first), unused OrderSystem `state` getter + mid-branch re-assignment of `o.state`, dead `bell` event emission in TrafficSystem (no subscriber; the bell caller drives its own FX), HUD's dead `TouchControls` import + one-use `stop` alias, and stale `timeLeft // set at accept` comment. Internal-only exports demoted to module-private: `LANGS`/`setLang` (i18n), `TOUCH_ZONES`, `RANKS`/`emptyCareer` (career), `TIERS` (OrderSystem), `DIFFICULTY_ORDER`/`DEFAULT_DIFFICULTY`. Net −21 lines
- [x] Housekeeping — package.json `version` 0.1.0 → 1.1.0 (matches the shipped stamp) and `npm run gen` now regenerates the music loop too; README tech list + controls table gained the touch zones, language key and mute/fullscreen buttons
- **Exit criteria**: clean sweep verified — automated cross-check (i18n keys ×58, config fields ×85, export-import spot list) reports zero unused items; headless suites (33+13+16 asserts) green after the cull; full browser drill (menu → shift → pedal-hop → 3-leg chain delivery → results/career → ESC → restart) with zero console errors

### M10 — v1.1.1 gameplay feedback pass ✅ done
- [x] Hit stun no longer carries you (`fix`, m10.1) — before, an arcade collider against immovable car bodies re-separated the bike along the car's motion every frame, so a crash pinned Glopi to the car's nose and dragged it down the lane for as long as the overlap lasted (`dazeTime` 0.42 s made it worse). Now `onCarHit()` ejects: an away-from-car knockback (`JUICE.knockback` 240 px/s, direction = bike − car, heading snap to the eject vector), input blackout shortened to 0.18 s, ragdoll tumble kept at 0.52 s as pure cosmetics. E2E: car drives into Glopi parked in its lane → hit fires with `dazeLeft` 180 ms, eject speed 238 px/s pointing away from the car, separation grows 29 → 63 px over the next 0.8 s (never pinned), W-acceleration resumes at 0.3 s while the ragdoll is still running; zero console errors
- [x] Wind streaks removed (same commit) — the speed-line FX block (`linesAbove/linesSaturate/linesCount/linesSpan/linesLen` + `linesGfx` layer + its `updateJuice` sweep) is gone per feedback; config now 81 fields, the `unused-check` cross-check stays green, and the landing caption no longer promises "rachas de viento"
- [x] Shift timer 180 → 60 s (same commit) — `SCORE.shiftLength` 60, `ScoreSystem` fallback updated, grade thresholds rescaled for the short clock (`S22/A15/B9/C4`, verified: fresh shift `shiftLeft` ≈ 59.9 at t0, warp → results shows a D for an idle run instead of an unreachable grade)
- [x] Diagonal avenue rebuilt (`feat`, m10.2) — the old 2-cell staircase slice looked ragged, and honestly the deeper bug was `gen-map`'s `set()` helper: "clearing" walls wrote `gid(0)=1`, an opaque ASPHALT0 tile on the **Walls layer**, which silently painted over the late crosswalk tiles at every diagonal junction (the user's "broken crossings") and even lurked inside park interiors. Now `set()/clear()` separate, and the avenue sweeps a connected 5-tile swath with a 45° dashed median (new `DASH_X`/`DASH_DIAG` tiles on the sheet, chained corner-to-corner so consecutive tiles read as one dashed line), roadside lamps every second row, pocket squares (tree/bench) where the avenue shears a block instead of leftover L-shaped roofs, and its end block still reaches the beach edge. Landmark positions untouched (Sagrada etc.). E2E: schematic render of the whole map + in-game captures (mid-avenue dashes chained, intact blocks, lamps, pocket greens, clean crosswalks at junctions); zero console errors
- [x] Wall hits bleed speed instead of ricocheting (`fix`, m10.3) — `onWallHit()` used to reflect the blocked component at `IMPACT.restitution` 0.35 and snap the heading to the outgoing vector, so a building crash visibly bounced you backwards. Now the into-wall component simply dies (head-on = decelerate to a full stop, angled hit keeps gliding in its original direction on a milder tangent) with `IMPACT.scrapeKeep` 0.92 rubbing a bit more speed off, and the heading is left for the player to steer. E2E: full-speed head-on → speed 280 → 0 with zero velocity reversal + no push-back creep afterwards; angled scrape → into-wall comp killed, tangential sign preserved (the remaining decay is coast/grip while in contact)
- [x] No crosswalk bands jutting into the Diagonal (`fix`, m10.4) — the standard zebra painting at every grid junction also reached into the wide avenue, connecting avenue-to-avenue with no sidewalk on the far side. The band painter now skips any band with one of its cells inside the 5-tile swath plus a cushion column (`nearDiagonal`), so the avenue junctions stay plain merged asphalt. Verified: `cross tiles inside diagonal corridor = 0` (458 zebra tiles remain on the normal grid), schematic + in-game capture of the former V44 × Diagonal junction shows a clean vein — dashes, cars, manholes, no floating stripes
- [x] Housekeeping — package.json `version` 1.1.0 → 1.1.1; headless suites re-run (career 22 + touch 16 green; m81's chain-distribution probe flipped on its documented known-flaky 200-sample tally — 2-legs/3-legs are equal-chance 0.175/0.175, binomial noise); full live drill after deploy: boot → sprint → car-hit eject → delivery → results → ESC, zero console errors
- **Exit criteria**: player-reported feel issues all fixed with E2E evidence; map art verified visually; no functional regressions. ✔

### M11 — v1.1.2 reward loop round ✅ done
- [x] Deliveries pay seconds back (`feat`) — every delivered stop hands extra shift time based on how well it went, reusing the tip-tier verdict ALREADY shown on the payday pop (`o.tier` = the tipTier of `timeLeft/timeTotal`): GREEN +9 s, YELLOW +5 s, ORANGE +2 s, RED 0 (no payoff for scraping in). `ScoreSystem.deliver(pay, tierKey)` reads `SCORE.deliveryBonus`, adds to `shiftLeft` (the HUD timer picks it up the next frame) and tracks `bonusSeconds`; GameScene floats `+9s` in tip-green above the bike. This builds a real reward loop into the short shift: keep deposits GREEN to play longer, chain multi-legs to bank more of them. E2E (shift clock frozen per measurement): ratio 1.0 → `GREEN, +9.0 s`; 0.45 → `YELLOW, +5.0`; 0.20 → `ORANGE, +2.0`; 0.10 → `RED, +0.0`; cumulative `bonusSeconds` 16 after the four staged deliveries
- [x] Trees get slim hitboxes (`feat`) — tilemap collision made tree cell a full 32 px box, and the visible canopy reads way smaller than a tile, so scrapes clipped air. Trees left `COLLIDES` (they now carry a `tree: true` tileset property instead) and the Game scene builds one small static 18 px square per tree (`WORLD.treeBody`) with the same `onWallHit` treatment. E2E: `wallLayer.filterTiles(tree)` finds the 11 trees; a 140 px/s head-on run stops a clean 5 px shy-of-tile (tile-edge − bike halfW 12 − box inset 7) with `blocked.right` set the same frame and impact FX fired; headless m82 22 asserts green; map re-regenerated (tileset `tiles` array only — layer data unchanged)
- [x] Housekeeping — package.json `version` 1.1.2; `unused-check` clean at 58 i18n keys / 83 config fields; m83 touch 16 green; m81 logic 33 green with its documented tally flake; console zero errors throughout
- **Exit criteria**: reward loop feels like a reason to keep the city clean, prop hitboxes match their art; deploy + live drill. ✔ *(live drill below after deploy)*

### M12 — v1.1.3 bug-hunt + QoL pass ✔ done
- [x] Pizza Catalana Nostra was standing in the middle of the Diagonal roadway (`fix`, m12.1) — the m10.2 avenue rebuild widened the swath to 5 tiles and silently swallowed the venue cell: (1424, 272) = col 44 @ row 8, painted plain ASPHALT inside the corridor (|col − c| = 2.27). Relocated one tile west to (1392, 272) — regular H8 street asphalt, out of the corridor (dist 3.2 > 2.5), no collider tile. Verified all 18 order spots against the corridor sweep: only Oriol also matched the buffer, and that one sits on the Rambla/street junction at col 32 — a legitimate pedestrian corner since M3, left as-is
- [x] The Diagonal avenue carries its own traffic (`feat`, m12.2) — the lane system only knew `h`/`v` axes, so the flagship avenue played empty while every surrounding street had cars. New `d` lane family parametrized by `y` along the same centerline gen-map paints (`diagCenter(y) = 1680 − (y − 80)·36/37`, one lane per direction, right-hand offsets ±16 px off the median), plus `TRAFFIC.diagonalCars: 2` — one car + one scooter are *dedicated* to the avenue so grid roulette can't starve it. Cars drive the normalized tangent (−36, 37)/‖·‖ with `arcK` = ‖(36,37)‖/37 dividing the advance, so `carSpeed` stays a true screen-speed (same tuning language as h/v lanes), sprites rotate via `atan2` on the normalized velocity, near-miss kinematics use the same units, and the parked extension clamps `x` straight past both ends with the usual off-canvas wrap. E2E: 3 diagonal cars alive (2 dedicated + roulette), slope dx/dy = −0.977 ≈ −36/37, arc speed 160 px/s = config exactly, lane geometry error ≤ 1.1 px (wobble), rotations 2.34 rad (SSW) / −0.80 rad (NNE), both ends wrap off-canvas without NaN, synthetic near-miss through the real system fires once at +€2 with the per-car cooldown suppressing the immediate repeat; zoom capture shows the two dedicated cars flanking the median on their proper right-hand sides
- [x] Results card surfaces the delivery time bonus (`feat`, m12.3) — m11 tracked `bonusSeconds` but the snapshot dropped it, so the reward loop's headline stat never reached the end screen. `ScoreSystem.snapshot()` now carries it and the results rows gain a conditional `res.timeBonus` line (ES `+{n}s por entregas`, CA `+{n}s per comandes`, EN `+{n}s from deliveries`) shown only when > 0. E2E: sponsored GREEN delivery (+9 s) → forced shift end → results card reads `…0 casi-accidentes · +9s por entregas`
- [x] Housekeeping — package.json `version` 1.1.3; `unused-check` clean at 59 i18n keys / 84 config fields; headless suites re-run green (m82 career 22, m83 touch 16); console zero errors / zero warnings across the whole drill
- **Exit criteria**: data blunder fixed, flagship avenue alive with right-hand traffic, reward loop closes its loop on the results card. ✔ *(live drill below after deploy)*

### M13 — v1.2.0 draft mechanic + promo refresh ✅ done
- [x] Slipstream draft / rebuje (`feat`, m13.1, commit `1baea85`) — riding close BEHIND a moving car in its wake fills a 0..1 meter (new zero-dep `src/systems/DraftSystem.js`, config block `DRAFT`: followDist 190, lateralMax 46, coneDot 0.82, minCarSpeed 100, meterFill 0.7 s, meterDrain 1.4 s); while full it raises the speed cap (+90 `maxBonus`) and pedals harder (+250 `accelBonus` only while pedaling), leaving the wake drains the meter as a slipstream release. Sensor rules: car ≥ 100 px/s, motion·heading dot ≥ 0.82 (oncoming/perpendicular don't count), bike trails 4..190 px along the car's motion, lateral ≤ 46 px. GameScene probes the sensor every 2.5 frames, floats ES `¡REBUJE!` / CA `¡A RESGUARD!` / EN `DRAFT!` on the single per-cycle fullEdge, draws the cyan meter bar + spark trail while pedaling above 0.55. E2E (headless m84, 22 asserts green): matched 140 px/s wake → full meter at 0.7 s exact, exactly one fullEdge while parked in-wake, fullEdge refires after recharge, in-game surge capped V.maxSpeed+90 (~390), drain ≈ 0.72 s release, natural `¡CASI! +€2` risk/reward on the near-miss. `unused-check`: 60 i18n keys / 92 config fields
- [x] Promo refresh (`feat`, m13.2) — all five screenshots re-shot in-browser at 960×640 with a clean fresh profile (`promo/`): menu (badge-less, `v1.2 · M13` stamp, CALMADO tier), ride (Diagonal composition with the bike trailing a dedicated SSW car, oncoming NNE parked by), pickup (ring mid-dwell on Pizza Catalana Nostra), delivery (Barceloneta payday `+€120 · ¡RÁPIDO!` + `+9s` floats, clock >1:00 from bonuses), results (rango S + `+18s por entregas` row). New `promo/gameplay.gif`: 30 frames @ 480×320, delay 9 cs (≈ 2.7 s loop): menu → diagonal wake draft (meter bar, `¡REBUJE!` pop, spark trail, surge past the car and pull out of the wake) → pickup dwell → accepted → payday floats → results card. Encoded with the zero-dependency in-page pipeline (in-page canvas downscale → 3-3-2 quantize → `tools/gif-encoder.js` LZW), verified `node tools/verify-gif.mjs` = GIF89a 480×320, 346 909 bytes, all 30 frames LZW-decode clean. Landing `pages/index.html`: captions updated (Diagonal / Barceloneta / rango S) + new rebuje feature bullet; menu version stamp → `v1.2 · M13 · Phaser 3.90`; package.json `version` 1.2.0. Headless suites re-run all green (m81 orders, m82 career 22, m83 touch 16, m84 draft 22); dev-tab console across the whole promo session: one Phaser boot banner, zero errors / zero warnings
- [x] Real-phone touch playtest (m13.3) — checklist sent to the player; their findings (multi-touch, results tap, landscape clipping, REBUJE wording, no tilt driving) drove the M13.3 pass below
- **Exit criteria**: the sprint reads as a skill move (queuing behind a car is rewarded), promo media matches v1.2, deploy + live drill shows the draft on the live street. *(live drill ✔ below)*
- [x] Live drill — deploy `ccc74aa` on gh-pages: live `juego/src/config.js?b=` flipped to the v1.2 build (7 136 B, `DRAFT` block present), landing serves all six new promo assets byte-exact (gameplay.gif 346 909 B) with the rebuje bullet + updated captions; live-booted tab → Menu → staged 140 px/s SSW wake: full meter at step 41 (0.7 s exact, meter 1.0), cyan bar riding over Glopi mid-avenue with the wake car behind; console across the live session: one Phaser banner (info), zero errors / zero warnings

### M13.3 — v1.3.0 mobile pass ✅ done
- [x] Multi-touch + input merge (`feat`, commit `86ba083`) — steering zones and the pedal zone now take independent pointers simultaneously (the M8.3 zones were single-pointer); the HUD re-reads the live pointer set each frame, a steer finger can slide across zones, and extra fingers don't steal steering. Merge order verified via the real heading physics with all three sources live: keyboard wins when pressed (`D` over touch-left+tilt(+1): −90°→−23.1°), touch beats tilt (touch-left over tilt(+1): −92.4°), tilt alone steers (−36.9°). Also drilled pedal+steer on two fingers, 3-finger stacks, zone re-anchor at 1300 px canvas width (96→96 / 788→pedal x = w−172, y = h−170) with a fresh press at the new anchors. New headless suite `m85` (24 asserts) all green alongside the m81-m84 runs
- [x] Results tap-restart (`fix`, commit `28ab3b7`) — a touch player had no way back from the results card (the restart hint only listened for keys/buttons); the card now accepts a tap anywhere plus key parity. E2E: card re-centers under canvas growth (−24,15.2 @ 912 → 170,60 @ 1300), the blocker overlay grows with it, two consecutive tap-restarts into fresh shifts
- [x] Full-bleed landscape + lean steering (`feat`, commit `86ba083`) — landscape keeps every HUD element on-screen at any aspect (no more 1000×700 letterbox banding): RESIZE handled at the DOM resize event with `syncLayout` on Menu + HUD (stamp row re-anchored, right column re-anchored). Device-orientation steering joins the M8.3 input trio behind a menu toggle (stored pref): lean-to-steer with Enter/Exit hysteresis, disabled in the Menu scene. Found + fixed during the pass: the exit condition compared `away > exit` against a *signed* distance so tilt never released (steer stuck at the last side); now the active-side signs decays `(active===1 && d < exit) / (active===-1 && d > -exit)`. In-page tilt ride: s(30°)=1, hold at 12°, release at 5°, s(−90°)=−1, s(270°)=−1, 270°+release=0, held-release=0
- [x] ES copy rename REBUJE → REBUFO (player ask; CA `¡A RESGUARD!` / EN `DRAFT!` unchanged) — the draft full-page pop, the landing feature bullet, all i18n surfaces updated; unused-check 64 keys / 94 config fields clean
- [x] Promo reshots (`feat`, commit `c6ae9ef`) — `promo/shot-menu.png` (v1.3 stamp + the `◀ MANDO: TÁCTIL ▶` touch row), `promo/shot-ride.png` take 6 (`¡REBUFO!` pop riding above the bike + the blue van wake 60 px ahead on the SSW diagonal avenue + meter bar + frozen TURNO 5:00), `promo/gameplay.gif` rebuilt with the v1.3 story: 29 frames @ 480×320, delay 9 cs (~2.7 s loop) — menu → wake draft (meter fill, `¡REBUFO!` fullEdge pop, spark trail, surge past the van) → restaurant stop-to-pickup dwell → payday (+€117 GREEN tip, 1 entrega, clock bumped by the delivery bonus) → results card. Encoded with the zero-dep in-page pipeline (canvas downscale → 3-3-2 quantize → `tools/gif-encoder.js` LZW), verified by `node tools/verify-gif.mjs` (GIF89a 480×320, GCT 256, all 29 frames LZW-decode clean, all 359 628 bytes consumed) + frame dumps re-checked via the new `tools/gif-frame.mjs`
- [x] Housekeeping — package.json `version` 1.3.0; headless suites re-run all green (m81 orders, m82 career, m83 touch, m84 draft, m85 mobile 24 asserts); console across the whole promo capture session: one Phaser banner, zero errors / zero warnings
- [x] Pending real-device re-test — everything above ran as desktop-synthetic drills; the handset test came back with the verdict that shaped M13.4 below: tilt steering stays out, the fullscreen touch pad is the mobile way to play

**Exit criteria**: phone findings fixed with E2E evidence, promo media matches v1.3, deploy + live drill. ✅ *(live drill below after deploy)*

- [x] Live drill — deploy `30847f6` on gh-pages. The first attempt (`f341256`) nested the tree one level deep (`dist/index.html` instead of `index.html`, caught by the drill's 404 storm, fixed by rerunning the add with `GIT_WORK_TREE=dist`); landing serves the v1.3 cta-note (`... táctil o inclinando el móvil`), promo assets byte-exact (`promo/gameplay.gif` 359 628 B = the capture, `promo/shot-menu.png` 82 162 B), live `juego/src/i18n.js` has `¡REBUFO!` and zero `REBUJE` left; live game: menu stamp `v1.3 · M13 · Phaser 3.90`, `◀ MANDO: TÁCTIL ▶` row, chill shift starts (15 cars, DraftSystem probed alive, clock ticking from 5:00-ish default, W surge builds speed), forced shift end → results card (career `{shifts:1}` written then restored) → synthetic tap → restart race fires immediately into a fresh Game; console across the whole live session: one Phaser banner (info), zero errors / zero warnings

### M13.4 — v1.3.1 tilt retirement + stale-copy sweep ✅ done
- [x] Real-device verdict — the handset playtest came back: lean steering "no se siente bien" and the fullscreen touch controls are good enough, so tilt is retired outright rather than retuned or sign-flipped (user decision among remove / flip-sign / retune)
- [x] Tilt steering removed (`fix`, commit `06ab6c2`) — `src/systems/TiltSteer.js` deleted; GameScene loses the `deviceorientation` listener, the tilt instance and the lean fill-in in the input merge (order back to keyboard > pad > touch, with the touch merge simplified to the zones-only default); MenuScene loses the `◀ MANDO: ▶` row + its tap handler + the T key; `src/config.js` loses the `TILT` hysteresis block; settings drops `isTiltOn`/`setTiltOn` and the `glopi-tilt` storage pref (leftover stored values on devices stay inert and unread); i18n drops `menu.tilt` / `ui.tiltTouch` / `ui.tiltTilt` across ES/CA/EN; `isTouchLike` survives for the fullscreen lock + results labels
- [x] Stale-copy sweep (user ask: the main page still said `Rebuje` somewhere) — the landing feature bullet still read **Rebuje**: the m13.3 rename fixed the in-game pop + i18n but missed that hero list item; fixed to **Rebufo** and the cta-note reverted to `teclado, mando o táctil`. Repo-wide case-insensitive sweep after the fix: zero stale strings in deliverable copy (src keeps a single `pop.draft: '¡REBUFO!'` in ES); the REBUJE mentions left in this PLAN are historical shipment evidence and stay
- [x] E2E — headless suites green: m81 orders, m82 career, m83 touch, m84 draft, m85 trimmed to its 6 multi-touch asserts (the TiltSteer asserts went with the feature); unused-check 61 i18n keys / 92 config fields (64/94 minus the tilt keys + the TILT block); in-page drill on the dev server: menu renders without the MANDO row, stamp `v1.3 · M13 · Phaser 3.90`, T key fully inert, the Game scene boots tilt-free (`s.tilt` / `s.onOrient` undefined), two-finger touch steering works end-to-end (synthetic pointer on ◀ + injected finger on pedal → steer −1; slide across zones and release → neutral; the bike heading responded −2.76 → −2.4 rad under hold), results tap-restart fires into a fresh shift, console 0 errors / 0 warnings
- [x] Promo reshots (`feat`, commit `94bb948`) — `promo/shot-menu.png` recaptured without the MANDO row (80 429 B); `promo/gameplay.gif` rebuilt by splice instead of a full re-capture: the 27 non-menu frames decoded untouched from the existing GIF, frames 0-1 replaced with fresh tilt-free menu grabs (raw 3-3-2 index arrays pulled as b64 from the dev tab), re-encoded 29 frames @ delay 9 (360 841 B), roundtrip-decode verified + frame dumps re-checked side by side
- [x] Housekeeping — package.json `version` 1.3.1

**Exit criteria**: live v1.3.1 deploy + drill (landing bullet `Rebufo`, no MANDO row anywhere, touch ride intact) — *(live drill below after deploy)*

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
