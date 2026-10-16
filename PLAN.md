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

### M1 — City that Feels like Barcelona (art pass)
- [ ] Tiled installed, first city block tileset (road, sidewalk, crosswalk, buildings, plaza, beach)
- [ ] Barcelona.json map imported with collision layer
- [ ] Static landmark sprites on top
- **Exit criteria**: Glopi rides a readable Barcelona grid, can't pass through buildings.

### M2 — Bike Arcade Physics
- [ ] Arcade Physics body + custom acceleration/friction curve
- [ ] Drift feel testing, camera follow with lookahead + slight zoom out at speed
- [ ] Wall collision response (bounce + spark particle)
- **Exit criteria**: Steering feels fun within 10 seconds of play; a designer could tune constants.

### M3 — Orders Core Loop
- [ ] `OrderSystem`: order generate → pickup zone → dropoff zone → complete/ expire
- [ ] Zone rendering: pulsing colored circles + floating markers/beacons
- [ ] HUD: current order card, fare €, fare timer, mini arrow, first SFX
- **Exit criteria**: Full loop playable: accept → pickup → deliver → pay+tip, next order spawns.

### M4 — Traffic & Pedestrians
- [ ] Cars/scooters on lane waypoints, player collision = slow down + coin penalty
- [ ] Pedestrians on sidewalks; bell scatters them
- [ ] Near-miss detector (+€ floating text "CASI!!")
- **Exit criteria**: Navigating traffic feels risky but fair; near-misses are readable.

### M5 — Score, Combos & Rank… and Session Timer
- [ ] ScoreSystem: base fare + time bonus + near-miss streak multiplier
- [ ] Tip tiers (Green/Yellow/Orange/Red zone like Crazy Taxi)
- [ ] 3-min shift timer, results screen (rank, best combo, money)
- **Exit criteria**: One full 3-minute round with end screen, rank persistence via localStorage.

### M6 — Polish & Juice
- [ ] Screen shake on collisions, speed lines, wheelie trick on jumps
- [ ] Music loop + dynamic layers (calm→chaos with active order)
- [ ] Tweened coin popup, ragdoll pineapple on crash (fun > realistic)
- [ ] Gamepad support
- **Exit criteria**: Playtesters say "one more run".

### M7 — Beta & Release
- [ ] Difficulty tiers (Chill / Rush hour / Monsoon of pedals)
- [ ] Spanish + Catalan + English i18n of UI
- [ ] Export web build (itch.io / GitHub Pages)
- **Exit criteria**: Public page with screenshots + short gameplay GIF.

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
| **Total** | **~2–3 weeks part-time** |
