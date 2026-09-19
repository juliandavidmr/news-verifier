import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import type { ExtractedContent } from "../../domain/reports";
import type { RemoteDocument } from "./public-url";
import { RemoteContentError } from "./public-url";

const defaultMaxWords = 2_000;
const minimumCharacters = 80;

function normalizeText(value: string) {
  return value
    .replaceAll(/\r\n?/gu, "\n")
    .split(/\n+/u)
    .map((line) => line.replaceAll(/\s+/gu, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function limitWords(text: string, maxWords: number) {
  const words = text.match(/\S+/gu) ?? [];
  const analyzed = words.slice(0, maxWords);
  return {
    text: analyzed.join(" "),
    extractedWordCount: words.length,
    analyzedWordCount: analyzed.length,
    truncated: words.length > maxWords,
  };
}

export function extractReadableContent(
  document: RemoteDocument,
  options: { maxWords?: number } = {},
): ExtractedContent {
  let title: string | null = null;
  let author: string | null = null;
  let text: string;

  if (document.contentType === "text/plain") {
    text = normalizeText(document.body);
  } else {
    const { document: dom } = parseHTML(document.body);
    Object.defineProperty(dom, "URL", { value: document.finalUrl });
    const article = new Readability(dom as unknown as Document).parse();
    if (!article?.content) {
      throw new RemoteContentError(
        "unsupported_content",
        "The main content could not be extracted",
      );
    }
    const { document: contentDocument } = parseHTML(
      `<html><body>${article.content}</body></html>`,
    );
    text = normalizeText(contentDocument.body.innerText);
    title = article.title?.trim() || null;
    author = article.byline?.trim() || null;
  }

  if (text.length < minimumCharacters) {
    throw new RemoteContentError(
      "unsupported_content",
      "The page does not contain enough readable text",
    );
  }

  return {
    canonicalUrl: document.finalUrl,
    title,
    author,
    ...limitWords(text, options.maxWords ?? defaultMaxWords),
  };
}
