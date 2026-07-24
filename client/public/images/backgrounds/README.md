# Background image spots

Each main page has a subtle full-page background graphic (dimmed under a dark
gradient so content stays readable). These ship as original SVG art:

- `dashboard.svg` — network/overview motif
- `players.svg` — field yard-line grid
- `trade-analyzer.svg` — crossing exchange arrows
- `compare.svg` — mirrored split panels
- `waiver-wire.svg` — signal pulse rings
- `mock-draft.svg` — converging stage spotlights

To swap in your own photo instead, replace the corresponding file (any format
works — .jpg, .png, .webp) and update the file extension in the matching
`page--bg-*` rule in `client/src/index.css` (search for `page--bg-`).
