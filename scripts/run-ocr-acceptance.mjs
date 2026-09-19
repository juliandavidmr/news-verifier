import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const baseUrl = process.argv[2]?.replace(/\/$/u, "");
const protectedPreview = process.argv.includes("--protected");
if (!baseUrl) {
  throw new Error("Usage: node scripts/run-ocr-acceptance.mjs <preview-url>");
}

const priorityTexts = {
  es: "La verificación responsable compara cada afirmación con evidencia oficial, conserva la fecha de consulta y explica claramente la incertidumbre. La ausencia de evidencia no demuestra que una afirmación sea falsa.",
  en: "Responsible verification compares every claim with official evidence, preserves the consultation date, and explains uncertainty clearly. Missing evidence does not prove that a claim is false.",
  fr: "Une vérification responsable compare chaque affirmation à des preuves officielles, conserve la date de consultation et explique clairement l’incertitude. L’absence de preuve ne démontre pas qu’une affirmation est fausse.",
  pt: "A verificação responsável compara cada afirmação com evidências oficiais, preserva a data da consulta e explica claramente a incerteza. A ausência de evidência não demonstra que uma afirmação seja falsa.",
};

const otherScripts = [
  {
    id: "cyrillic",
    text: "Ответственная проверка сравнивает каждое утверждение с официальными доказательствами и объясняет неопределенность.",
  },
  {
    id: "arabic",
    text: "يقارن التحقق المسؤول كل ادعاء بالأدلة الرسمية ويشرح بوضوح حدود اليقين في التقرير.",
  },
  {
    id: "devanagari",
    text: "जिम्मेदार सत्यापन प्रत्येक दावे की आधिकारिक साक्ष्य से तुलना करता है और अनिश्चितता को स्पष्ट करता है।",
  },
  {
    id: "cjk",
    text: "负责任的核查会将每项声明与官方证据进行比较，并清楚说明报告中的不确定性。",
  },
];

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

function wrap(value, width) {
  const words = value.split(/\s+/u);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fixtureSvg({ text, variant, scriptSample = false }) {
  const large = variant === 8 && !scriptSample;
  const width = large ? 3_800 : 1_400;
  const height = large ? 4_900 : 900;
  const dark = variant % 3 === 1;
  const background = dark ? "#161616" : "#fffdf4";
  const foreground = dark ? "#f8f6ed" : "#151515";
  const fontSize = large ? 76 : [27, 31, 35, 39][variant % 4];
  const maxCharacters = large ? 72 : Math.floor(1_130 / (fontSize * 0.58));
  const repeated = large ? `${text} ${text} ${text}` : text;
  const lines = wrap(repeated, maxCharacters);
  const lineHeight = Math.round(fontSize * 1.55);
  const rotation = variant === 6 ? -1.5 : variant === 7 ? 1.5 : 0;
  const textLines = lines
    .map(
      (line, index) =>
        `<text x="${large ? 180 : 100}" y="${large ? 300 + index * lineHeight : 180 + index * lineHeight}">${escapeXml(line)}</text>`,
    )
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${background}"/>
  <g fill="${foreground}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" transform="rotate(${rotation} ${width / 2} ${height / 2})">
    ${textLines}
  </g>
</svg>`;
}

async function renderFixture(directory, fixture) {
  const svgPath = join(directory, `${fixture.id}.svg`);
  const pngPath = join(directory, `${fixture.id}.png`);
  await writeFile(svgPath, fixtureSvg(fixture), "utf8");
  await run("rsvg-convert", [svgPath, "-o", pngPath]);

  if (fixture.format === "image/jpeg") {
    const path = join(directory, `${fixture.id}.jpg`);
    await run("sips", [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      "48",
      pngPath,
      "--out",
      path,
    ]);
    return path;
  }
  if (fixture.format === "image/webp") {
    const path = join(directory, `${fixture.id}.webp`);
    await run("cwebp", ["-quiet", "-q", "52", pngPath, "-o", path]);
    return path;
  }
  return pngPath;
}

function normalizedWords(value) {
  return value
    .normalize("NFKD")
    .replaceAll(/\p{M}+/gu, "")
    .toLocaleLowerCase("und")
    .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

function editDistance(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function percentile(values, fraction) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[
    Math.min(ordered.length - 1, Math.ceil(fraction * ordered.length) - 1)
  ];
}

const formats = ["image/png", "image/jpeg", "image/webp"];
const fixtures = Object.entries(priorityTexts).flatMap(([locale, text]) =>
  Array.from({ length: 9 }, (_, variant) => ({
    id: `${locale}-${variant + 1}`,
    locale,
    text,
    expected: variant === 8 ? `${text} ${text} ${text}` : text,
    variant,
    format: formats[variant % formats.length],
    scriptSample: false,
    shouldReject: false,
  })),
);
fixtures.push(
  ...otherScripts.map((sample, index) => ({
    ...sample,
    locale: "en",
    expected: sample.text,
    variant: index,
    format: formats[index % formats.length],
    scriptSample: true,
    shouldReject: true,
  })),
);

const directory = await mkdtemp(join(tmpdir(), "news-verifier-ocr-corpus-"));
const prepared = [];
for (const fixture of fixtures) {
  prepared.push({ ...fixture, path: await renderFixture(directory, fixture) });
}

async function evaluate(fixture) {
  const bytes = await readFile(fixture.path);
  const started = performance.now();
  const idempotencyKey = `ocr-corpus-${fixture.id}-${Date.now()}`;
  let status;
  let body;
  if (protectedPreview) {
    const { stdout } = await run(
      "vercel",
      [
        "curl",
        "/api/reports",
        "--deployment",
        baseUrl,
        "--scope",
        "julians-projects-e754fd12",
        "--",
        "--silent",
        "--request",
        "POST",
        "--header",
        `Content-Type: ${fixture.format}`,
        "--header",
        `X-Report-Locale: ${fixture.locale}`,
        "--header",
        `X-Idempotency-Key: ${idempotencyKey}`,
        "--data-binary",
        `@${fixture.path}`,
        "--write-out",
        "\\n%{http_code}",
      ],
      { timeout: 75_000, maxBuffer: 2 * 1024 * 1024 },
    );
    const boundary = stdout.trimEnd().lastIndexOf("\n");
    status = Number(stdout.trimEnd().slice(boundary + 1));
    body = JSON.parse(stdout.trimEnd().slice(0, boundary));
  } else {
    const response = await fetch(`${baseUrl}/api/reports`, {
      method: "POST",
      headers: {
        "content-type": fixture.format,
        "x-report-locale": fixture.locale,
        "x-idempotency-key": idempotencyKey,
      },
      body: bytes,
      signal: AbortSignal.timeout(70_000),
    });
    status = response.status;
    body = await response.json();
  }
  const durationMs = Math.round(performance.now() - started);
  if (fixture.shouldReject) {
    return {
      id: fixture.id,
      status,
      durationMs,
      rejected: status >= 400,
      code: body.code ?? null,
    };
  }
  const expected = normalizedWords(fixture.expected);
  const actual = normalizedWords(body.text ?? "");
  return {
    id: fixture.id,
    format: fixture.format,
    status,
    durationMs,
    confidence: body.confidence ?? null,
    wordErrorRate:
      Math.round(
        (editDistance(expected, actual) / Math.max(1, expected.length)) *
          10_000,
      ) / 100,
  };
}

const results = [];
for (let index = 0; index < prepared.length; index += 2) {
  results.push(
    ...(await Promise.all(prepared.slice(index, index + 2).map(evaluate))),
  );
}

const valid = results.filter((result) => "wordErrorRate" in result);
const rejected = results.filter((result) => "rejected" in result);
const durations = valid.map((result) => result.durationMs);
const errors = valid.map((result) => result.wordErrorRate);
const summary = {
  previewUrl: baseUrl,
  generatedAt: new Date().toISOString(),
  samples: results.length,
  validSamples: valid.length,
  successfulValidSamples: valid.filter((result) => result.status === 200)
    .length,
  correctlyRejectedScriptSamples: rejected.filter((result) => result.rejected)
    .length,
  latencyMs: {
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    maximum: Math.max(...durations),
  },
  wordErrorRatePercent: {
    normalization: "case, punctuation and diacritics ignored",
    median: percentile(errors, 0.5),
    p95: percentile(errors, 0.95),
    maximum: Math.max(...errors),
  },
  results,
};

console.log(JSON.stringify(summary, null, 2));
const passed =
  summary.successfulValidSamples === valid.length &&
  summary.correctlyRejectedScriptSamples === rejected.length &&
  summary.latencyMs.p95 <= 30_000 &&
  summary.latencyMs.maximum <= 60_000 &&
  summary.wordErrorRatePercent.median <= 5;
if (!passed) process.exitCode = 1;
