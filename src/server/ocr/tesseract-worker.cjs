"use strict";

const { join } = require("node:path");
const { parentPort } = require("node:worker_threads");
const worker = require("tesseract.js/src/worker-script");
const gunzip = require("tesseract.js/src/worker-script/node/gunzip");
const cache = require("tesseract.js/src/worker-script/node/cache");

let core;

async function getCore(_oem, _corePath, response) {
  if (!core) {
    response.progress({ status: "loading tesseract core", progress: 0 });
    core = require(
      join(
        process.cwd(),
        ".generated",
        "tesseract",
        "tesseract-core-relaxedsimd-lstm.js",
      ),
    );
    response.progress({ status: "loading tesseract core", progress: 1 });
  }
  return core;
}

parentPort.on("message", (packet) => {
  worker.dispatchHandlers(packet, (value) => parentPort.postMessage(value));
});

worker.setAdapter({
  getCore,
  gunzip,
  fetch: global.fetch,
  ...cache,
});
