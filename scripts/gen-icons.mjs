import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = resolve(__dirname, "..", "public");
const svg = await readFile(resolve(pub, "icon.svg"), "utf-8");

async function png(size, name) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "#ece5d3",
  });
  const data = resvg.render().asPng();
  await writeFile(resolve(pub, name), data);
  console.log("wrote", name);
}

await png(512, "icon-512.png");
await png(192, "icon-192.png");
await png(180, "apple-touch-icon.png");
await png(32, "favicon-32.png");
await png(16, "favicon-16.png");
