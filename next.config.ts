import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  distDir: process.env.NV_BUILD_DIST_DIR ?? ".next",
  output: process.env.VERCEL ? undefined : "standalone",
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
  outputFileTracingIncludes: {
    "/api/reports": [
      "./.generated/tesseract/tesseract-core-relaxedsimd-lstm.wasm",
      "./src/server/ocr/tesseract-worker.cjs",
      "./node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz",
      "./node_modules/@tesseract.js-data/spa/4.0.0/spa.traineddata.gz",
      "./node_modules/@tesseract.js-data/fra/4.0.0/fra.traineddata.gz",
      "./node_modules/@tesseract.js-data/por/4.0.0/por.traineddata.gz",
    ],
  },
};

export default withWorkflow(nextConfig);
