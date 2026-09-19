import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const filename = "tesseract-core-relaxedsimd-lstm.wasm";
const source = join(root, "node_modules", "tesseract.js-core", filename);
const destinationDirectory = join(root, ".generated", "tesseract");

await mkdir(destinationDirectory, { recursive: true });
await copyFile(source, join(destinationDirectory, filename));
