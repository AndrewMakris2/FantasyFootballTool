# Background image spots

Drop your own images into this folder with these exact filenames and they'll
show up automatically as subtle full-page background art (behind all content,
dimmed under a dark gradient so nothing loses readability):

- `dashboard.jpg` — Dashboard
- `players.jpg` — Player Database
- `trade-analyzer.jpg` — Trade Analyzer
- `compare.jpg` — Player Comparison
- `waiver-wire.jpg` — Waiver Wire
- `mock-draft.jpg` — Mock Draft

Any common web image format works (.jpg, .png, .webp) — just update the file
extension in the corresponding CSS rule in `client/src/index.css` (search for
`page--bg-`) if you use something other than .jpg. No image here yet? Nothing
breaks — the spot just stays empty until you add one.
