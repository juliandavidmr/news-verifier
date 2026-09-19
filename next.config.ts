import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "tesseract.js",
    "@tesseract.js-data/eng",
    "@tesseract.js-data/spa",
    "@tesseract.js-data/fra",
    "@tesseract.js-data/por",
  ],
  outputFileTracingIncludes: {
    "/api/reports": [
      "./node_modules/.pnpm/tesseract.js-core@*/node_modules/tesseract.js-core/*.wasm",
      "./node_modules/@tesseract.js-data/eng/**/*",
      "./node_modules/@tesseract.js-data/spa/**/*",
      "./node_modules/@tesseract.js-data/fra/**/*",
      "./node_modules/@tesseract.js-data/por/**/*",
    ],
  },
};

export default withWorkflow(nextConfig);
