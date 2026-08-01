const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PAGES_DIR = path.resolve(__dirname, "../../pages");
const OUT_DIR = path.resolve(__dirname, "../public/icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

const SRC = path.join(PAGES_DIR, "cat1-01.png");
// square crop around the AZCO logo mark + wordmark, teal background, from the cover page
const CROP = { left: 89, top: 51, width: 356, height: 356 };

async function run() {
  const base = sharp(SRC).extract(CROP);

  // plain square tile at various sizes (for favicon / apple-touch-icon / general manifest icon)
  for (const size of [512, 192, 180, 32, 16]) {
    await base
      .clone()
      .resize(size, size)
      .png()
      .toFile(path.join(OUT_DIR, `icon-${size}.png`));
  }

  // maskable icon: extra teal padding so the logo sits inside the safe-zone circle
  const tealBg = { r: 14, g: 124, b: 134, alpha: 1 };
  await sharp(SRC)
    .extract(CROP)
    .resize(320, 320)
    .extend({ top: 96, bottom: 96, left: 96, right: 96, background: tealBg })
    .resize(512, 512)
    .png()
    .toFile(path.join(OUT_DIR, "icon-maskable-512.png"));

  // favicon.ico (multi-size)
  await base.clone().resize(64, 64).toFile(path.join(OUT_DIR, "favicon-64.png"));

  console.log("icons written to", OUT_DIR);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
