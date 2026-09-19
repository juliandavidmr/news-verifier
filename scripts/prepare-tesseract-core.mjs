import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destinationDirectory = join(root, ".generated", "tesseract");

await mkdir(destinationDirectory, { recursive: true });
await Promise.all(
  [
    "tesseract-core-relaxedsimd-lstm.js",
    "tesseract-core-relaxedsimd-lstm.wasm",
  ].map((filename) =>
    copyFile(
      join(root, "node_modules", "tesseract.js-core", filename),
      join(destinationDirectory, filename),
    ),
  ),
);
