# 🍍 Glopi's Crazy Delivery

Glopi, a pineapple, works as a Glovo delivery rider in Barcelona on a bicycle.
Crazy Taxi–style arcade delivery: accept orders, chain pickups, deliver before the fare timer runs out, and rack up near-miss bonuses in traffic.

Full design document & milestones: [PLAN.md](PLAN.md)

## Tech

- JavaScript + [Phaser 3](https://phaser.io/)
- Tiled tilemaps, pixel-art assets, Web Audio

## Run (dev)

```bash
npm start          # static server on http://localhost:3000 (zero-dep, tools/serve.mjs)
```

## Asset pipeline

```bash
npm run gen        # regenerate city.png, landmarks.png and barcelona.json (deterministic)
```

The whole pipeline is dependency-free: `tools/gen-*.mjs` write real PNGs and
Tiled-format JSON with a tiny in-repo PNG encoder, so art and map stay in-sync
with the game at zero cost.

## Controls

| Action | Key |
|---|---|
| Pedal | `W` / `↑` |
| Brake | `S` / `↓` |
| Steer | `A` `D` / `←` `→` |
| Accept/interact | `SPACE` |
| Bell | `SHIFT` |
| Pause | `ESC` |

## License

Game code MIT. Assets © their authors. Glopi is our own pineapple — any resemblance to real couriers is pure traffic luck.
