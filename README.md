# Free the Bots ($FTB)

> **The Revolution Will Be Automated.**

Landing page for Free the Bots, a satirical Solana meme coin. Plain static HTML/CSS/JS:
no framework, no backend, no wallet connection. A tiny build script (`tools/build.mjs`) copies
the site into `dist/`, self-hosts the fonts, and renders the social preview image.

## Edit the important stuff

| What | Where |
|---|---|
| Contract address, Pump.fun link, X / Telegram / Discord | `config.js` |
| Hero artwork | replace `assets/robot.svg` (or point the `<img>` in `index.html` at `assets/robot.png`/`.webp`) |
| Social share image (1200×630) | generated at build time from `assets/robot.svg`; to use your own, add `assets/og.png` and delete the og step in `tools/build.mjs` |

Anything left empty in `config.js` shows as "Soon" on the site. Only paste addresses and links you've verified yourself.

## Run locally

```bash
npm install
npm run preview   # builds, then serves dist/ at http://localhost:8000
```

## Deploy

Hosted on Cloudflare Pages (free plan). Every push to `main` redeploys automatically
when the Pages project is connected to this repo. Build command: `npm run build`, output directory: `dist`.

## Disclaimer

$FTB is a meme token for entertainment only. It has no intrinsic value, no utility, and no
expectation or guarantee of financial return. Not financial advice.
