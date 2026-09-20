import { access, mkdir, readlink, symlink, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorker, OEM, type Worker } from "tesseract.js";
import type { ExtractedContent } from "../../domain/reports";
import { OcrProcessingError } from "./ocr-errors";
import { assessOcrQuality, parseTsvWordSignals } from "./ocr-quality";

export { OcrProcessingError } from "./ocr-errors";

const languages = ["eng", "spa", "fra", "por"] as const;
const languageSet = languages.join("+");
const deadlineMs = 60_000;

export type OcrResult = ExtractedContent & {
  confidence: number;
  languageSet: string;
};

async function prepareLanguageDirectory() {
  const directory = join(tmpdir(), "news-verifier-tessdata-fast-v4");
  await mkdir(directory, { recursive: true });
  await Promise.all(
    languages.map(async (language) => {
      const source = join(
        process.cwd(),
        "node_modules",
        "@tesseract.js-data",
        language,
        "4.0.0",
        `${language}.traineddata.gz`,
      );
      const destination = join(directory, `${language}.traineddata.gz`);
      try {
        const currentSource = await readlink(destination);
        await access(destination);
        if (currentSource === source) return;
      } catch {
        // Missing and dangling links are replaced below.
      }
      await unlink(destination).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
      await symlink(source, destination).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== "EEXIST") throw error;
        },
      );
    }),
  );
  return directory;
}

export class TesseractOcrEngine {
  async recognize(bytes: Uint8Array): Promise<OcrResult> {
    const languageDirectory = await prepareLanguageDirectory();
    let worker: Worker | undefined;
    let timedOut = false;
    const workerPromise = createWorker(languageSet, OEM.LSTM_ONLY, {
      workerPath: join(
        process.cwd(),
        "src",
        "server",
        "ocr",
        "tesseract-worker.cjs",
      ),
      langPath: languageDirectory,
      gzip: true,
      cacheMethod: "none",
    });
    const work = (async () => {
      worker = await workerPromise;
      if (timedOut) throw new OcrProcessingError("ocr_timeout");
      return worker.recognize(
        Buffer.from(bytes),
        {},
        { text: true, tsv: true },
      );
    })();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        void workerPromise.then((activeWorker) => activeWorker.terminate());
        reject(new OcrProcessingError("ocr_timeout"));
      }, deadlineMs);
    });
    try {
      const result = await Promise.race([work, timeout]);
      const limited = assessOcrQuality(
        result.data.text,
        result.data.confidence,
        parseTsvWordSignals(result.data.tsv),
      );
      return {
        canonicalUrl: "",
        title: null,
        author: null,
        ...limited,
        confidence: result.data.confidence,
        languageSet,
      };
    } catch (error) {
      if (error instanceof OcrProcessingError) throw error;
      throw new OcrProcessingError("ocr_failed");
    } finally {
      if (timer) clearTimeout(timer);
      if (worker) await worker.terminate().catch(() => undefined);
    }
  }
}
