# 🍍 Glopi's Crazy Delivery

Glopi, a pineapple, works as a Glovo delivery rider in Barcelona on a bicycle.
Crazy Taxi–style arcade delivery: accept orders, chain pickups, deliver before the fare timer runs out, and rack up near-miss bonuses in traffic.

Full design document & milestones: [PLAN.md](PLAN.md)

## Tech

- JavaScript + [Phaser 3](https://phaser.io/)
- Tiled tilemaps, pixel-art assets, Web Audio

## Run (dev)

```bash
npx serve .        # or any static file server
```

Then open http://localhost:3000

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
