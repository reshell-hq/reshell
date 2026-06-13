import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url));

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

await Promise.all(
  sizes.map(async ({ name, size }) => {
    const output = new URL(`../public/${name}`, import.meta.url);
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    writeFileSync(output, png);
    console.log(`wrote public/${name} (${size}×${size})`);
  }),
);
