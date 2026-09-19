import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
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
      "./node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz",
      "./node_modules/@tesseract.js-data/spa/4.0.0/spa.traineddata.gz",
      "./node_modules/@tesseract.js-data/fra/4.0.0/fra.traineddata.gz",
      "./node_modules/@tesseract.js-data/por/4.0.0/por.traineddata.gz",
    ],
  },
};

export default withWorkflow(nextConfig);
